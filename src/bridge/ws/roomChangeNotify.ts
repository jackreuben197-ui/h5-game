import type { RoomRecord } from '@/api/models/room'
import { decodeHoldemPacket } from './holdemPacket'

export const ROOM_CHANGE_NOTIFY_CODE = 140

// 与 Cocos GameRoomDataChangeType 对齐：1 新增，2 更新。
export const ROOM_CHANGE_TYPE = {
  ADD: 1,
  UPDATE: 2,
} as const

export interface WsRoomUserInfo {
  id: number
  un: number
  name: string
  avatar: string
  seat: number
}

export interface WsRoomTribeClubRelate {
  tribe_id: number
  club_ids: number[]
}

export interface WsRoomChangePayload {
  rid: number
  status: number
  empty_seat: number
  hand_num: number
  users: WsRoomUserInfo[]
  relate_club_ids: number[]
  relate_tribe_club_list: WsRoomTribeClubRelate[]
}

export interface WsRoomChangeNotifyPayload {
  changeType: number
  sendTimestamp: number
  room?: RoomRecord
  roomChange?: WsRoomChangePayload
}

const textDecoder = new TextDecoder()

interface VarintResult {
  value: bigint
  nextOffset: number
}

interface FieldHeaderResult {
  fieldNo: number
  wireType: number
  nextOffset: number
}

interface LengthDelimitedResult {
  bytes: Uint8Array
  nextOffset: number
}

interface RoomRecordInternal {
  rid: number
  name: string
  gameType: number
  pokerType: number
  status: number
  ante: number
  sb: number
  minRate: number
  seatCount: number
  emptySeat: number
  roomers: number
  playDuration: number
  startTime: number
  originType: number
  randomAnte: string
  currency: string
  users: WsRoomUserInfo[]
  relateClubIds: number[]
  relateTribeClubList: WsRoomTribeClubRelate[]
  cowboyConfig: {
    max_amount_min: number
    max_amount_max: number
  }
}

function clampToSafeNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number.MAX_SAFE_INTEGER
  }
  return Number(value)
}

function decodeVarint(bytes: Uint8Array, offset: number): VarintResult | null {
  let result = 0n
  let shift = 0n
  let cursor = offset

  while (cursor < bytes.length) {
    const byte = BigInt(bytes[cursor])
    result |= (byte & 0x7fn) << shift
    cursor += 1

    if ((byte & 0x80n) === 0n) {
      return {
        value: result,
        nextOffset: cursor,
      }
    }

    shift += 7n
    if (shift > 70n) {
      return null
    }
  }

  return null
}

function decodeFieldHeader(bytes: Uint8Array, offset: number): FieldHeaderResult | null {
  const varint = decodeVarint(bytes, offset)
  if (!varint) {
    return null
  }

  const raw = varint.value
  return {
    fieldNo: Number(raw >> 3n),
    wireType: Number(raw & 0x07n),
    nextOffset: varint.nextOffset,
  }
}

function decodeLengthDelimited(bytes: Uint8Array, offset: number): LengthDelimitedResult | null {
  const lenVarint = decodeVarint(bytes, offset)
  if (!lenVarint) {
    return null
  }

  const length = clampToSafeNumber(lenVarint.value)
  const start = lenVarint.nextOffset
  const end = start + length
  if (end > bytes.length) {
    return null
  }

  return {
    bytes: bytes.slice(start, end),
    nextOffset: end,
  }
}

function skipUnknownWire(bytes: Uint8Array, offset: number, wireType: number): number {
  if (wireType === 0) {
    const varint = decodeVarint(bytes, offset)
    return varint ? varint.nextOffset : bytes.length
  }
  if (wireType === 1) {
    return Math.min(bytes.length, offset + 8)
  }
  if (wireType === 2) {
    const block = decodeLengthDelimited(bytes, offset)
    return block ? block.nextOffset : bytes.length
  }
  if (wireType === 5) {
    return Math.min(bytes.length, offset + 4)
  }
  return bytes.length
}

function decodeUtf8(bytes: Uint8Array): string {
  if (!bytes.length) {
    return ''
  }
  return textDecoder.decode(bytes)
}

function decodePackedUint64(bytes: Uint8Array): number[] {
  const result: number[] = []
  let offset = 0

  while (offset < bytes.length) {
    const varint = decodeVarint(bytes, offset)
    if (!varint) {
      break
    }
    result.push(clampToSafeNumber(varint.value))
    offset = varint.nextOffset
  }

  return result
}

function parseRoomUserInfo(bytes: Uint8Array): WsRoomUserInfo {
  const result: WsRoomUserInfo = {
    id: 0,
    un: 0,
    name: '',
    avatar: '',
    seat: 0,
  }

  let offset = 0
  while (offset < bytes.length) {
    const header = decodeFieldHeader(bytes, offset)
    if (!header) {
      break
    }
    offset = header.nextOffset

    if (header.fieldNo === 1 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      result.id = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 2 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      result.un = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 3 && header.wireType === 2) {
      const value = decodeLengthDelimited(bytes, offset)
      if (!value) break
      result.name = decodeUtf8(value.bytes)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 4 && header.wireType === 2) {
      const value = decodeLengthDelimited(bytes, offset)
      if (!value) break
      result.avatar = decodeUtf8(value.bytes)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 5 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      result.seat = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    offset = skipUnknownWire(bytes, offset, header.wireType)
  }

  return result
}

function parseRoomTribeClubRelate(bytes: Uint8Array): WsRoomTribeClubRelate {
  const result: WsRoomTribeClubRelate = {
    tribe_id: 0,
    club_ids: [],
  }

  let offset = 0
  while (offset < bytes.length) {
    const header = decodeFieldHeader(bytes, offset)
    if (!header) {
      break
    }
    offset = header.nextOffset

    if (header.fieldNo === 1 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      result.tribe_id = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 2 && header.wireType === 2) {
      const packed = decodeLengthDelimited(bytes, offset)
      if (!packed) break
      result.club_ids = decodePackedUint64(packed.bytes)
      offset = packed.nextOffset
      continue
    }

    // 兼容非 packed 的 uint64 repeated 编码。
    if (header.fieldNo === 2 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      result.club_ids.push(clampToSafeNumber(value.value))
      offset = value.nextOffset
      continue
    }

    offset = skipUnknownWire(bytes, offset, header.wireType)
  }

  return result
}

function parseCowboyConfig(bytes: Uint8Array): { max_amount_min: number; max_amount_max: number } {
  const result = {
    max_amount_min: 0,
    max_amount_max: 0,
  }

  let offset = 0
  while (offset < bytes.length) {
    const header = decodeFieldHeader(bytes, offset)
    if (!header) {
      break
    }
    offset = header.nextOffset

    if (header.fieldNo === 1 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      result.max_amount_min = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 2 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      result.max_amount_max = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    offset = skipUnknownWire(bytes, offset, header.wireType)
  }

  return result
}

function parseRoomRecord(bytes: Uint8Array): RoomRecord {
  const internal: RoomRecordInternal = {
    rid: 0,
    name: '',
    gameType: 0,
    pokerType: 0,
    status: 0,
    ante: 0,
    sb: 0,
    minRate: 0,
    seatCount: 0,
    emptySeat: 0,
    roomers: 0,
    playDuration: 0,
    startTime: 0,
    originType: 0,
    randomAnte: '',
    currency: '',
    users: [],
    relateClubIds: [],
    relateTribeClubList: [],
    cowboyConfig: {
      max_amount_min: 0,
      max_amount_max: 0,
    },
  }

  let offset = 0
  while (offset < bytes.length) {
    const header = decodeFieldHeader(bytes, offset)
    if (!header) {
      break
    }
    offset = header.nextOffset

    if (header.fieldNo === 1 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      internal.rid = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 2 && header.wireType === 2) {
      const value = decodeLengthDelimited(bytes, offset)
      if (!value) break
      internal.name = decodeUtf8(value.bytes)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 4 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      internal.gameType = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 5 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      internal.pokerType = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 7 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      internal.status = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 8 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      internal.ante = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 9 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      internal.sb = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 16 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      internal.minRate = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 36 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      internal.seatCount = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 37 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      internal.emptySeat = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 38 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      internal.roomers = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 40 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      internal.playDuration = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 44 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      internal.startTime = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 66 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      internal.originType = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 92 && header.wireType === 2) {
      const value = decodeLengthDelimited(bytes, offset)
      if (!value) break
      internal.randomAnte = decodeUtf8(value.bytes)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 175 && header.wireType === 2) {
      const value = decodeLengthDelimited(bytes, offset)
      if (!value) break
      internal.users.push(parseRoomUserInfo(value.bytes))
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 176 && header.wireType === 2) {
      const value = decodeLengthDelimited(bytes, offset)
      if (!value) break
      internal.relateClubIds = decodePackedUint64(value.bytes)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 176 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      internal.relateClubIds.push(clampToSafeNumber(value.value))
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 177 && header.wireType === 2) {
      const value = decodeLengthDelimited(bytes, offset)
      if (!value) break
      internal.relateTribeClubList.push(parseRoomTribeClubRelate(value.bytes))
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 178 && header.wireType === 2) {
      const value = decodeLengthDelimited(bytes, offset)
      if (!value) break
      internal.currency = decodeUtf8(value.bytes)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 179 && header.wireType === 2) {
      const value = decodeLengthDelimited(bytes, offset)
      if (!value) break
      internal.cowboyConfig = parseCowboyConfig(value.bytes)
      offset = value.nextOffset
      continue
    }

    offset = skipUnknownWire(bytes, offset, header.wireType)
  }

  const users = internal.users.map((user) => ({
    id: user.id,
    un: user.un,
    name: user.name,
    avatar: user.avatar,
    seat: user.seat,
  }))

  const roomers = internal.roomers > 0 ? internal.roomers : users.length
  const startTimeIso =
    internal.startTime > 0 ? new Date(internal.startTime * 1000).toISOString() : ''

  return {
    rid: internal.rid,
    name: internal.name,
    game_type: internal.gameType,
    poker_type: internal.pokerType,
    status: internal.status,
    ante: internal.ante,
    sb: internal.sb,
    min_rate: internal.minRate,
    seat_count: internal.seatCount,
    empty_seat: internal.emptySeat,
    roomers,
    play_duration: internal.playDuration,
    start_time: startTimeIso,
    origin_type: internal.originType,
    random_ante: internal.randomAnte,
    relate_club_ids: internal.relateClubIds,
    relate_tribe_club_list: internal.relateTribeClubList,
    users,
    currency: internal.currency,
    cowboy_config: internal.cowboyConfig,
  }
}

function parseRoomChange(bytes: Uint8Array): WsRoomChangePayload {
  const result: WsRoomChangePayload = {
    rid: 0,
    status: 0,
    empty_seat: 0,
    hand_num: 0,
    users: [],
    relate_club_ids: [],
    relate_tribe_club_list: [],
  }

  let offset = 0
  while (offset < bytes.length) {
    const header = decodeFieldHeader(bytes, offset)
    if (!header) {
      break
    }
    offset = header.nextOffset

    if (header.fieldNo === 1 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      result.rid = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 2 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      result.status = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 3 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      result.empty_seat = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 4 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      result.hand_num = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 5 && header.wireType === 2) {
      const value = decodeLengthDelimited(bytes, offset)
      if (!value) break
      result.users.push(parseRoomUserInfo(value.bytes))
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 6 && header.wireType === 2) {
      const value = decodeLengthDelimited(bytes, offset)
      if (!value) break
      result.relate_club_ids = decodePackedUint64(value.bytes)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 6 && header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      result.relate_club_ids.push(clampToSafeNumber(value.value))
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 7 && header.wireType === 2) {
      const value = decodeLengthDelimited(bytes, offset)
      if (!value) break
      result.relate_tribe_club_list.push(parseRoomTribeClubRelate(value.bytes))
      offset = value.nextOffset
      continue
    }

    offset = skipUnknownWire(bytes, offset, header.wireType)
  }

  return result
}

function parseRoomChangeNotifyBody(body: Uint8Array): WsRoomChangeNotifyPayload | null {
  const result: WsRoomChangeNotifyPayload = {
    changeType: 0,
    sendTimestamp: 0,
  }

  let offset = 0
  while (offset < body.length) {
    const header = decodeFieldHeader(body, offset)
    if (!header) {
      break
    }
    offset = header.nextOffset

    if (header.fieldNo === 1 && header.wireType === 2) {
      const roomField = decodeLengthDelimited(body, offset)
      if (!roomField) break
      result.room = parseRoomRecord(roomField.bytes)
      offset = roomField.nextOffset
      continue
    }

    if (header.fieldNo === 2 && header.wireType === 0) {
      const value = decodeVarint(body, offset)
      if (!value) break
      result.sendTimestamp = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 3 && header.wireType === 2) {
      const roomChangeField = decodeLengthDelimited(body, offset)
      if (!roomChangeField) break
      result.roomChange = parseRoomChange(roomChangeField.bytes)
      offset = roomChangeField.nextOffset
      continue
    }

    if (header.fieldNo === 4 && header.wireType === 0) {
      const value = decodeVarint(body, offset)
      if (!value) break
      result.changeType = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    offset = skipUnknownWire(body, offset, header.wireType)
  }

  if (!result.changeType) {
    return null
  }
  return result
}

// 从 WS 原始包解析 ROOM_CHANGE_NOTIFY，供大厅列表直接做增量更新。
export function decodeRoomChangeNotifyFromRawPacket(
  rawPacket: ArrayBufferLike,
): WsRoomChangeNotifyPayload | null {
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet || packet.code !== ROOM_CHANGE_NOTIFY_CODE) {
    return null
  }

  return parseRoomChangeNotifyBody(packet.body)
}
