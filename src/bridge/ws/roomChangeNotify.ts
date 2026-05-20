import type { RoomRecord } from '@/api/models/roomcenter'
import { createLogger } from '@/utils/logger'
import type {
  CowboyConfig as PbCowboyConfig,
  RoomChange as PbRoomChange,
  RoomRecord as PbRoomRecord,
  RoomTribeClubRelate as PbRoomTribeClubRelate,
  RoomUserInfo as PbRoomUserInfo,
} from './pb/protobuf/holdem/define_pb'
import type { ServerMessageRoomChangeNotify as PbServerMessageRoomChangeNotify } from './pb/protobuf/holdem/recv_g_room_change_notify_pb'
import { decodeHoldemPacket } from './holdemPacket'

const log = createLogger('[roomChangeNotify]')

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

// 对齐 bridge README 的约定：pb 类 fire-and-forget 懒加载，不阻塞主包。
let pbClass: typeof PbServerMessageRoomChangeNotify | null = null
void import('./pb/protobuf/holdem/recv_g_room_change_notify_pb').then((mod) => {
  pbClass = mod.ServerMessageRoomChangeNotify
})

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.floor(num)
}

function mapRoomUserInfo(user: PbRoomUserInfo): WsRoomUserInfo {
  return {
    id: toSafeInt(user.getId()),
    un: toSafeInt(user.getUn()),
    name: user.getName() || '',
    avatar: user.getAvatar() || '',
    seat: toSafeInt(user.getSeat()),
  }
}

function mapTribeClubRelate(item: PbRoomTribeClubRelate): WsRoomTribeClubRelate {
  return {
    tribe_id: toSafeInt(item.getTribeId()),
    club_ids: item.getClubIdsList().map((id) => toSafeInt(id)),
  }
}

function mapCowboyConfig(config: PbCowboyConfig | undefined): Record<string, number> {
  if (!config) {
    return { max_amount_min: 0, max_amount_max: 0 }
  }
  return {
    max_amount_min: toSafeInt(config.getMaxAmountMin()),
    max_amount_max: toSafeInt(config.getMaxAmountMax()),
  }
}

function mapRoomRecord(room: PbRoomRecord): RoomRecord {
  const users = room.getUsersList().map((item) => mapRoomUserInfo(item))
  const roomUsersForView: RoomRecord['users'] = users.map((item) => ({
    seat: item.seat,
    avatar: item.avatar,
    name: item.name,
    id: item.id,
    un: item.un,
  }))
  const startTime = toSafeInt(room.getStartTime())

  return {
    rid: toSafeInt(room.getRid()),
    name: room.getName() || '',
    game_type: toSafeInt(room.getGameType()),
    poker_type: toSafeInt(room.getPokerType()),
    status: toSafeInt(room.getStatus()),
    ante: toSafeInt(room.getAnte()),
    sb: toSafeInt(room.getSb()),
    min_rate: toSafeInt(room.getMinRate()),
    seat_count: toSafeInt(room.getSeatCount()),
    empty_seat: toSafeInt(room.getEmptySeat()),
    roomers: toSafeInt(room.getRoomers()) || users.length,
    play_duration: toSafeInt(room.getPlayDuration()),
    start_time: startTime > 0 ? new Date(startTime * 1000).toISOString() : '',
    hand_num: toSafeInt(room.getHandNum()),
    origin_type: toSafeInt(room.getOriginType()),
    random_ante: room.getRandomAnte() || '',
    relate_club_ids: room.getRelateClubIdsList().map((id) => toSafeInt(id)),
    relate_tribe_club_list: room.getRelateTribeClubListList().map((item) => mapTribeClubRelate(item)),
    users: roomUsersForView,
    currency: room.getCurrency() || '',
    cowboy_config: mapCowboyConfig(room.getCowboyConfig()),
  }
}

function mapRoomChange(change: PbRoomChange): WsRoomChangePayload {
  return {
    rid: toSafeInt(change.getRid()),
    status: toSafeInt(change.getStatus()),
    empty_seat: toSafeInt(change.getEmptySeat()),
    hand_num: toSafeInt(change.getHandNum()),
    users: change.getUsersList().map((item) => mapRoomUserInfo(item)),
    relate_club_ids: change.getRelateClubIdsList().map((id) => toSafeInt(id)),
    relate_tribe_club_list: change
      .getRelateTribeClubListList()
      .map((item) => mapTribeClubRelate(item)),
  }
}

// 从 WS 原始包解析 ROOM_CHANGE_NOTIFY，供大厅列表直接做增量更新。
export function decodeRoomChangeNotifyFromRawPacket(
  rawPacket: ArrayBufferLike,
): WsRoomChangeNotifyPayload | null {
  if (!pbClass) return null

  const packet = decodeHoldemPacket(rawPacket)
  if (!packet || packet.code !== ROOM_CHANGE_NOTIFY_CODE) {
    return null
  }

  try {
    const notify = pbClass.deserializeBinary(packet.body)
    const changeType = toSafeInt(notify.getChangeType())
    if (!changeType) {
      return null
    }

    const payload: WsRoomChangeNotifyPayload = {
      changeType,
      sendTimestamp: toSafeInt(notify.getSendTimestamp()),
    }

    const room = notify.getRoom()
    if (room) {
      payload.room = mapRoomRecord(room)
    }

    const roomChange = notify.getRoomChange()
    if (roomChange) {
      payload.roomChange = mapRoomChange(roomChange)
    }

    return payload
  } catch (error) {
    log.warn('decode failed', error)
    return null
  }
}
