import { decodeHoldemPacket } from './holdemPacket'

// 对齐 Unity GameMatchMttMessageController.RegisterMsgHandler 的 3 个通知协议号。
export const MTT_NOTIFY_CODE = {
  USER_MTT_CHANGE_NOTIFY: 151,
  USER_SNG_CHANGE_NOTIFY: 152,
  MTT_SERIES_NOTIFY: 153,
} as const

// 与 Cocos GameRoomDataChangeType 对齐：1 新增，2 更新。
export const GAME_ROOM_DATA_CHANGE_TYPE = {
  ADD: 1,
  UPDATE: 2,
} as const

// 与 Cocos MttMatchStatus 对齐：0 未开赛，1 比赛中，2 已关闭，3 已取消。
export const MTT_MATCH_STATUS = {
  CREATED: 0,
  RUNNING: 1,
  CLOSED: 2,
  CANCEL: 3,
} as const

export interface WsRoomTribeClubRelate {
  tribe_id: number
  club_ids: number[]
}

export interface WsUserMttRecord {
  match_id: number
  start_time: number
  status: number
  upblind_interval: number
  apply_fee_pool: number
  prize_base_pool: number
  name: string
  game_type: number
  poker_type: number
  participants: number
  apply_start_time: number
  max_delay_apply_bl: number
  rebuy_times: number
  addon_begin_bl: number
  addon_end_bl: number
  prize_type: number
  anti_cheat_type: number
  mtt_banner_url: string
  game_icon: string
  origin_type: number
  series_id: number
  pinned_time: number
  limit_participants: number
  create_time: number
  relate_club_ids: number[]
  relate_tribe_club_list: WsRoomTribeClubRelate[]
}

export interface WsUserMttRecordChange {
  match_id: number
  status: number
  participants: number
  series_id: number
  pinned_time: number
}

export interface WsUserMttChangeNotifyPayload {
  changeType: number
  sendTimestamp: number
  mtt?: WsUserMttRecord
  mttChange?: WsUserMttRecordChange
}

export interface WsUserSngRecord {
  sng_id: number
  status: number
  origin_type: number
  series_id: number
  pinned_time: number
  relate_club_ids: number[]
  relate_tribe_club_list: WsRoomTribeClubRelate[]
}

export interface WsUserSngRecordChange {
  sng_id: number
  status: number
  series_id: number
  pinned_time: number
}

export interface WsUserSngChangeNotifyPayload {
  changeType: number
  sendTimestamp: number
  sng?: WsUserSngRecord
  sngChange?: WsUserSngRecordChange
}

export interface WsMttSeriesNotifyPayload {
  id: number
  name: string
  type: number
  tribe_id: number
  create_time: number
}

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

const textDecoder = new TextDecoder()

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

// 解析 UserMttRecord（仅取 H5 大厅/MTT 列表实际会用到的字段）。
function parseUserMttRecord(bytes: Uint8Array): WsUserMttRecord {
  const result: WsUserMttRecord = {
    match_id: 0,
    start_time: 0,
    status: 0,
    upblind_interval: 0,
    apply_fee_pool: 0,
    prize_base_pool: 0,
    name: '',
    game_type: 0,
    poker_type: 0,
    participants: 0,
    apply_start_time: 0,
    max_delay_apply_bl: 0,
    rebuy_times: 0,
    addon_begin_bl: 0,
    addon_end_bl: 0,
    prize_type: 0,
    anti_cheat_type: 0,
    mtt_banner_url: '',
    game_icon: '',
    origin_type: 0,
    series_id: 0,
    pinned_time: 0,
    limit_participants: 0,
    create_time: 0,
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

    if (header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      const safeValue = clampToSafeNumber(value.value)

      if (header.fieldNo === 1) result.match_id = safeValue
      if (header.fieldNo === 2) result.start_time = safeValue
      if (header.fieldNo === 3) result.status = safeValue
      if (header.fieldNo === 4) result.upblind_interval = safeValue
      if (header.fieldNo === 6) result.apply_fee_pool = safeValue
      if (header.fieldNo === 9) result.prize_base_pool = safeValue
      if (header.fieldNo === 11) result.anti_cheat_type = safeValue
      if (header.fieldNo === 14) result.limit_participants = safeValue
      if (header.fieldNo === 26) result.game_type = safeValue
      if (header.fieldNo === 27) result.poker_type = safeValue
      if (header.fieldNo === 29) result.participants = safeValue
      if (header.fieldNo === 31) result.apply_start_time = safeValue
      if (header.fieldNo === 32) result.max_delay_apply_bl = safeValue
      if (header.fieldNo === 33) result.rebuy_times = safeValue
      if (header.fieldNo === 34) result.addon_begin_bl = safeValue
      if (header.fieldNo === 35) result.addon_end_bl = safeValue
      if (header.fieldNo === 36) result.prize_type = safeValue
      if (header.fieldNo === 54) result.origin_type = safeValue
      if (header.fieldNo === 55) result.series_id = safeValue
      if (header.fieldNo === 56) result.pinned_time = safeValue
      if (header.fieldNo === 57) result.create_time = safeValue

      // repeated uint64 relate_club_ids: packed 或 unpacked 都兼容。
      if (header.fieldNo === 52) {
        result.relate_club_ids.push(safeValue)
      }

      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 25 && header.wireType === 2) {
      const value = decodeLengthDelimited(bytes, offset)
      if (!value) break
      result.name = decodeUtf8(value.bytes)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 21 && header.wireType === 2) {
      const value = decodeLengthDelimited(bytes, offset)
      if (!value) break
      result.game_icon = decodeUtf8(value.bytes)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 50 && header.wireType === 2) {
      const value = decodeLengthDelimited(bytes, offset)
      if (!value) break
      result.mtt_banner_url = decodeUtf8(value.bytes)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 52 && header.wireType === 2) {
      const packed = decodeLengthDelimited(bytes, offset)
      if (!packed) break
      result.relate_club_ids = decodePackedUint64(packed.bytes)
      offset = packed.nextOffset
      continue
    }

    if (header.fieldNo === 53 && header.wireType === 2) {
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

function parseUserMttRecordChange(bytes: Uint8Array): WsUserMttRecordChange {
  const result: WsUserMttRecordChange = {
    match_id: 0,
    status: 0,
    participants: 0,
    series_id: 0,
    pinned_time: 0,
  }

  let offset = 0
  while (offset < bytes.length) {
    const header = decodeFieldHeader(bytes, offset)
    if (!header) {
      break
    }
    offset = header.nextOffset

    if (header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      const safeValue = clampToSafeNumber(value.value)
      if (header.fieldNo === 1) result.match_id = safeValue
      if (header.fieldNo === 2) result.status = safeValue
      if (header.fieldNo === 3) result.participants = safeValue
      if (header.fieldNo === 4) result.series_id = safeValue
      if (header.fieldNo === 5) result.pinned_time = safeValue
      offset = value.nextOffset
      continue
    }

    offset = skipUnknownWire(bytes, offset, header.wireType)
  }

  return result
}

function parseUserSngRecord(bytes: Uint8Array): WsUserSngRecord {
  const result: WsUserSngRecord = {
    sng_id: 0,
    status: 0,
    origin_type: 0,
    series_id: 0,
    pinned_time: 0,
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

    if (header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      const safeValue = clampToSafeNumber(value.value)
      if (header.fieldNo === 1) result.sng_id = safeValue
      if (header.fieldNo === 12) result.origin_type = safeValue
      if (header.fieldNo === 27) result.status = safeValue
      if (header.fieldNo === 30) result.series_id = safeValue
      if (header.fieldNo === 31) result.pinned_time = safeValue
      if (header.fieldNo === 28) {
        result.relate_club_ids.push(safeValue)
      }
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 28 && header.wireType === 2) {
      const packed = decodeLengthDelimited(bytes, offset)
      if (!packed) break
      result.relate_club_ids = decodePackedUint64(packed.bytes)
      offset = packed.nextOffset
      continue
    }

    if (header.fieldNo === 29 && header.wireType === 2) {
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

function parseUserSngRecordChange(bytes: Uint8Array): WsUserSngRecordChange {
  const result: WsUserSngRecordChange = {
    sng_id: 0,
    status: 0,
    series_id: 0,
    pinned_time: 0,
  }

  let offset = 0
  while (offset < bytes.length) {
    const header = decodeFieldHeader(bytes, offset)
    if (!header) {
      break
    }
    offset = header.nextOffset

    if (header.wireType === 0) {
      const value = decodeVarint(bytes, offset)
      if (!value) break
      const safeValue = clampToSafeNumber(value.value)
      if (header.fieldNo === 1) result.sng_id = safeValue
      if (header.fieldNo === 2) result.status = safeValue
      if (header.fieldNo === 3) result.series_id = safeValue
      if (header.fieldNo === 4) result.pinned_time = safeValue
      offset = value.nextOffset
      continue
    }

    offset = skipUnknownWire(bytes, offset, header.wireType)
  }

  return result
}

function parseUserMttChangeNotifyBody(body: Uint8Array): WsUserMttChangeNotifyPayload | null {
  const result: WsUserMttChangeNotifyPayload = {
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
      const block = decodeLengthDelimited(body, offset)
      if (!block) break
      result.mtt = parseUserMttRecord(block.bytes)
      offset = block.nextOffset
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
      const block = decodeLengthDelimited(body, offset)
      if (!block) break
      result.mttChange = parseUserMttRecordChange(block.bytes)
      offset = block.nextOffset
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

function parseUserSngChangeNotifyBody(body: Uint8Array): WsUserSngChangeNotifyPayload | null {
  const result: WsUserSngChangeNotifyPayload = {
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
      const block = decodeLengthDelimited(body, offset)
      if (!block) break
      result.sng = parseUserSngRecord(block.bytes)
      offset = block.nextOffset
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
      const block = decodeLengthDelimited(body, offset)
      if (!block) break
      result.sngChange = parseUserSngRecordChange(block.bytes)
      offset = block.nextOffset
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

function parseMttSeriesNotifyBody(body: Uint8Array): WsMttSeriesNotifyPayload | null {
  const result: WsMttSeriesNotifyPayload = {
    id: 0,
    name: '',
    type: 0,
    tribe_id: 0,
    create_time: 0,
  }

  let offset = 0
  while (offset < body.length) {
    const header = decodeFieldHeader(body, offset)
    if (!header) {
      break
    }
    offset = header.nextOffset

    if (header.fieldNo === 1 && header.wireType === 0) {
      const value = decodeVarint(body, offset)
      if (!value) break
      result.id = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 2 && header.wireType === 2) {
      const value = decodeLengthDelimited(body, offset)
      if (!value) break
      result.name = decodeUtf8(value.bytes)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 3 && header.wireType === 0) {
      const value = decodeVarint(body, offset)
      if (!value) break
      result.type = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 4 && header.wireType === 0) {
      const value = decodeVarint(body, offset)
      if (!value) break
      result.tribe_id = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    if (header.fieldNo === 5 && header.wireType === 0) {
      const value = decodeVarint(body, offset)
      if (!value) break
      result.create_time = clampToSafeNumber(value.value)
      offset = value.nextOffset
      continue
    }

    offset = skipUnknownWire(body, offset, header.wireType)
  }

  if (!result.id) {
    return null
  }
  return result
}

// 从 WS 原始包解析 UserMttChangeNotify(151)。
export function decodeUserMttChangeNotifyFromRawPacket(
  rawPacket: ArrayBufferLike,
): WsUserMttChangeNotifyPayload | null {
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet || packet.code !== MTT_NOTIFY_CODE.USER_MTT_CHANGE_NOTIFY) {
    return null
  }
  return parseUserMttChangeNotifyBody(packet.body)
}

// 从 WS 原始包解析 UserSngChangeNotify(152)。
export function decodeUserSngChangeNotifyFromRawPacket(
  rawPacket: ArrayBufferLike,
): WsUserSngChangeNotifyPayload | null {
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet || packet.code !== MTT_NOTIFY_CODE.USER_SNG_CHANGE_NOTIFY) {
    return null
  }
  return parseUserSngChangeNotifyBody(packet.body)
}

// 从 WS 原始包解析 MttSeriesNotify(153)。
export function decodeMttSeriesNotifyFromRawPacket(
  rawPacket: ArrayBufferLike,
): WsMttSeriesNotifyPayload | null {
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet || packet.code !== MTT_NOTIFY_CODE.MTT_SERIES_NOTIFY) {
    return null
  }
  return parseMttSeriesNotifyBody(packet.body)
}

