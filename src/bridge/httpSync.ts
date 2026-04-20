import { sendBridgeMessage } from './bridge'
import {
  BRIDGE_ACTION,
  BRIDGE_MSG_TYPE,
  type SyncRoomsListPayload,
  type SyncUserClubPayload,
  type SyncUserPayload,
} from './protocol'
import type { UserInfoData } from '@/api/models/auth'
import type { ApiResponse } from '@/api/models/common'
import type { RoomDetailData, RoomDetailRequest } from '@/api/models/room'

function emitH5BusinessMessage<TPayload>(action: string, payload: TPayload): void {
  sendBridgeMessage(action, payload, { msgtype: BRIDGE_MSG_TYPE.H5 })
}

function resolveUserField(user: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = user[key]
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim()
    }
  }
  return ''
}

export function forwardUserInfoToCocos(data: UserInfoData): void {
  const user = (data.user || {}) as Record<string, unknown>
  const payload: SyncUserPayload = {
    uid: resolveUserField(user, ['p_u_id', 'pUid', 'userid', 'id', 'wUid', 'unid']),
    nickname: resolveUserField(user, ['nickname', 'name']),
    avatar: resolveUserField(user, ['avatar', 'headimg']) || undefined,
    raw: data,
  }
  emitH5BusinessMessage(BRIDGE_ACTION.SYNC_USER, payload)
}

export function forwardUserClubToCocos(response: ApiResponse<unknown>): void {
  const payload: SyncUserClubPayload = {
    response,
  }
  emitH5BusinessMessage(BRIDGE_ACTION.SYNC_USER_CLUB, payload)
}

export function forwardRoomsListToCocos(
  request: RoomDetailRequest,
  response: ApiResponse<RoomDetailData>,
): void {
  const payload: SyncRoomsListPayload = {
    request,
    response,
  }
  emitH5BusinessMessage(BRIDGE_ACTION.SYNC_ROOMS_LIST, payload)
}
