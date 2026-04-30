import type {
  RoomTribeClubRelate as PbRoomTribeClubRelate,
  UserMttRecord as PbUserMttRecord,
  UserMttRecordChange as PbUserMttRecordChange,
  UserSNGRecord as PbUserSNGRecord,
  UserSNGRecordChange as PbUserSNGRecordChange,
} from './pb/protobuf/holdem/define_pb'
import type { ServerMessageMttSeriesNotify as PbServerMessageMttSeriesNotify } from './pb/protobuf/holdem/recv_g_mtt_series_notify_pb'
import type { ServerMessageUserMttChangeNotify as PbServerMessageUserMttChangeNotify } from './pb/protobuf/holdem/recv_g_user_mtt_change_notify_pb'
import type { ServerMessageUserSngChangeNotify as PbServerMessageUserSngChangeNotify } from './pb/protobuf/holdem/recv_g_user_sng_change_notify_pb'
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

// pb 模块三个文件共享 define_pb（~1 MB），合并为一次并行加载。
// 在本模块首次 import 时立即后台加载，WS 建立前 pb 通常已就绪。
type MttPbClasses = {
  userMttChangeNotify: typeof PbServerMessageUserMttChangeNotify
  userSngChangeNotify: typeof PbServerMessageUserSngChangeNotify
  mttSeriesNotify: typeof PbServerMessageMttSeriesNotify
}
let mttPbClasses: MttPbClasses | null = null
void Promise.all([
  import('./pb/protobuf/holdem/recv_g_user_mtt_change_notify_pb'),
  import('./pb/protobuf/holdem/recv_g_user_sng_change_notify_pb'),
  import('./pb/protobuf/holdem/recv_g_mtt_series_notify_pb'),
]).then(([mttMod, sngMod, seriesMod]) => {
  mttPbClasses = {
    userMttChangeNotify: mttMod.ServerMessageUserMttChangeNotify,
    userSngChangeNotify: sngMod.ServerMessageUserSngChangeNotify,
    mttSeriesNotify: seriesMod.ServerMessageMttSeriesNotify,
  }
})

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.floor(num)
}

function mapTribeClubRelate(item: PbRoomTribeClubRelate): WsRoomTribeClubRelate {
  return {
    tribe_id: toSafeInt(item.getTribeId()),
    club_ids: item.getClubIdsList().map((id) => toSafeInt(id)),
  }
}

function mapUserMttRecord(record: PbUserMttRecord): WsUserMttRecord {
  return {
    match_id: toSafeInt(record.getMatchId()),
    start_time: toSafeInt(record.getStartTime()),
    status: toSafeInt(record.getStatus()),
    upblind_interval: toSafeInt(record.getUpblindInterval()),
    apply_fee_pool: toSafeInt(record.getApplyFeePool()),
    prize_base_pool: toSafeInt(record.getPrizeBasePool()),
    name: record.getName() || '',
    game_type: toSafeInt(record.getGameType()),
    poker_type: toSafeInt(record.getPokerType()),
    participants: toSafeInt(record.getParticipants()),
    apply_start_time: toSafeInt(record.getApplyStartTime()),
    max_delay_apply_bl: toSafeInt(record.getMaxDelayApplyBl()),
    rebuy_times: toSafeInt(record.getRebuyTimes()),
    addon_begin_bl: toSafeInt(record.getAddonBeginBl()),
    addon_end_bl: toSafeInt(record.getAddonEndBl()),
    prize_type: toSafeInt(record.getPrizeType()),
    anti_cheat_type: toSafeInt(record.getAntiCheatType()),
    mtt_banner_url: record.getMttBannerUrl() || '',
    game_icon: record.getGameIcon() || '',
    origin_type: toSafeInt(record.getOriginType()),
    series_id: toSafeInt(record.getSeriesId()),
    pinned_time: toSafeInt(record.getPinnedTime()),
    // protobuf 版本差异兼容：UserMttRecord 在部分版本没有 limit_participants 字段。
    limit_participants: toSafeInt(record.getParticipants()),
    create_time: toSafeInt(record.getCreateTime()),
    relate_club_ids: record.getRelateClubIdsList().map((id) => toSafeInt(id)),
    relate_tribe_club_list: record
      .getRelateTribeClubListList()
      .map((item) => mapTribeClubRelate(item)),
  }
}

function mapUserMttRecordChange(record: PbUserMttRecordChange): WsUserMttRecordChange {
  return {
    match_id: toSafeInt(record.getMatchId()),
    status: toSafeInt(record.getStatus()),
    participants: toSafeInt(record.getParticipants()),
    series_id: toSafeInt(record.getSeriesId()),
    pinned_time: toSafeInt(record.getPinnedTime()),
  }
}

function mapUserSngRecord(record: PbUserSNGRecord): WsUserSngRecord {
  return {
    sng_id: toSafeInt(record.getSngId()),
    status: toSafeInt(record.getStatus()),
    origin_type: toSafeInt(record.getOriginType()),
    series_id: toSafeInt(record.getSeriesId()),
    pinned_time: toSafeInt(record.getPinnedTime()),
    relate_club_ids: record.getRelateClubIdsList().map((id) => toSafeInt(id)),
    relate_tribe_club_list: record
      .getRelateTribeClubListList()
      .map((item) => mapTribeClubRelate(item)),
  }
}

function mapUserSngRecordChange(record: PbUserSNGRecordChange): WsUserSngRecordChange {
  return {
    sng_id: toSafeInt(record.getSngId()),
    status: toSafeInt(record.getStatus()),
    series_id: toSafeInt(record.getSeriesId()),
    pinned_time: toSafeInt(record.getPinnedTime()),
  }
}

// 从 WS 原始包解析 UserMttChangeNotify(151)。
export function decodeUserMttChangeNotifyFromRawPacket(
  rawPacket: ArrayBufferLike,
): WsUserMttChangeNotifyPayload | null {
  if (!mttPbClasses) return null

  const packet = decodeHoldemPacket(rawPacket)
  if (!packet || packet.code !== MTT_NOTIFY_CODE.USER_MTT_CHANGE_NOTIFY) {
    return null
  }

  try {
    const notify = mttPbClasses.userMttChangeNotify.deserializeBinary(packet.body)
    const changeType = toSafeInt(notify.getChangeType())
    if (!changeType) return null

    const payload: WsUserMttChangeNotifyPayload = {
      changeType,
      sendTimestamp: toSafeInt(notify.getSendTimestamp()),
    }

    const mtt = notify.getMtt()
    if (mtt) payload.mtt = mapUserMttRecord(mtt)

    const mttChange = notify.getMttChange()
    if (mttChange) payload.mttChange = mapUserMttRecordChange(mttChange)

    return payload
  } catch {
    return null
  }
}

// 从 WS 原始包解析 UserSngChangeNotify(152)。
export function decodeUserSngChangeNotifyFromRawPacket(
  rawPacket: ArrayBufferLike,
): WsUserSngChangeNotifyPayload | null {
  if (!mttPbClasses) return null

  const packet = decodeHoldemPacket(rawPacket)
  if (!packet || packet.code !== MTT_NOTIFY_CODE.USER_SNG_CHANGE_NOTIFY) {
    return null
  }

  try {
    const notify = mttPbClasses.userSngChangeNotify.deserializeBinary(packet.body)
    const changeType = toSafeInt(notify.getChangeType())
    if (!changeType) return null

    const payload: WsUserSngChangeNotifyPayload = {
      changeType,
      sendTimestamp: toSafeInt(notify.getSendTimestamp()),
    }

    const sng = notify.getSng()
    if (sng) payload.sng = mapUserSngRecord(sng)

    const sngChange = notify.getSngChange()
    if (sngChange) payload.sngChange = mapUserSngRecordChange(sngChange)

    return payload
  } catch {
    return null
  }
}

// 从 WS 原始包解析 MttSeriesNotify(153)。
export function decodeMttSeriesNotifyFromRawPacket(
  rawPacket: ArrayBufferLike,
): WsMttSeriesNotifyPayload | null {
  if (!mttPbClasses) return null

  const packet = decodeHoldemPacket(rawPacket)
  if (!packet || packet.code !== MTT_NOTIFY_CODE.MTT_SERIES_NOTIFY) {
    return null
  }

  try {
    const notify = mttPbClasses.mttSeriesNotify.deserializeBinary(packet.body)
    const id = toSafeInt(notify.getId())
    if (!id) return null

    return {
      id,
      name: notify.getName() || '',
      type: toSafeInt(notify.getType()),
      tribe_id: toSafeInt(notify.getTribeId()),
      create_time: toSafeInt(notify.getCreateTime()),
    }
  } catch {
    return null
  }
}
