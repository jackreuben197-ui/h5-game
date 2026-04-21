import {
  isBridgeHandshakeDone,
  onBridgeHandshakeDone,
  sendBridgeMessage,
} from '../core/cocosBridgeChannel'
import {
  BRIDGE_ACTION,
  BRIDGE_MSG_TYPE,
  type SyncRoomsListPayload,
  type SyncUserClubPayload,
  type SyncUserPayload,
} from '../protocol'
import type { UserInfoData } from '@/api/models/auth'
import type { ApiResponse } from '@/api/models/common'
import type { RoomDetailData, RoomDetailRequest } from '@/api/models/room'

function emitH5BusinessMessage<TPayload>(action: string, payload: TPayload): void {
  sendBridgeMessage(action, payload, { msgtype: BRIDGE_MSG_TYPE.H5 })
}

const pendingHandshakeSyncMap = new Map<string, unknown>()

let stopHandshakeDoneListener: (() => void) | null = null

function ensureHandshakeSyncListener(): void {
  if (stopHandshakeDoneListener) {
    return
  }
  stopHandshakeDoneListener = onBridgeHandshakeDone(() => {
    flushHandshakeSyncMessages()
    stopHandshakeDoneListener?.()
    stopHandshakeDoneListener = null
  })
}

function queueSyncUntilHandshake<TPayload>(action: string, payload: TPayload): void {
  if (isBridgeHandshakeDone()) {
    emitH5BusinessMessage(action, payload)
    return
  }

  // 握手前仅保留每个 action 的最新快照，避免重复下发旧数据。
  pendingHandshakeSyncMap.set(action, payload)
  ensureHandshakeSyncListener()
}

function flushHandshakeSyncMessages(): void {
  if (!isBridgeHandshakeDone() || !pendingHandshakeSyncMap.size) {
    return
  }

  const entries = Array.from(pendingHandshakeSyncMap.entries())
  pendingHandshakeSyncMap.clear()
  entries.forEach(([action, payload]) => {
    emitH5BusinessMessage(action, payload)
  })
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
  queueSyncUntilHandshake(BRIDGE_ACTION.SYNC_USER, payload)
}

export function forwardUserClubToCocos(response: ApiResponse<unknown>): void {
  const payload: SyncUserClubPayload = {
    response,
  }
  queueSyncUntilHandshake(BRIDGE_ACTION.SYNC_USER_CLUB, payload)
}

export function forwardRoomsListToCocos(
  request: RoomDetailRequest,
  response: ApiResponse<RoomDetailData>,
): void {
  const payload: SyncRoomsListPayload = {
    request,
    response,
  }
  // 对齐 syncUser/syncUserClub：握手未完成时先缓存，完成后补发最新快照。
  queueSyncUntilHandshake(BRIDGE_ACTION.SYNC_ROOMS_LIST, payload)
}
