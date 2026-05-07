import {
  isBridgeHandshakeDone,
  onBridgeHandshakeDone,
  sendBridgeMessage,
} from '../core/cocosBridgeChannel'
import {
  BRIDGE_ACTION,
  BRIDGE_MSG_TYPE,
  type SyncGlobalConfigPayload,
  type SyncLanguagePayload,
  type SyncRoomsListPayload,
  type SyncUserClubPayload,
  type SyncUserPayload,
} from '../protocol'
import { subscribeH5WsCode } from '../ws/messageCenter'
import {
  USER_BALANCE_CODE,
  decodeUserDiamondChange,
  decodeUserGoldChange,
} from '../ws/userBalanceNotify'
import type { UserInfoData } from '@/api/models/user'
import type { GlobalConfigData } from '@/api/models/config'
import type { ApiResponse } from '@/api/models/common'
import type { RoomDetailData, RoomDetailRequest } from '@/api/models/roomcenter'
import { useUserInfoStore } from '@/stores/userInfo'

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

function resolveUserId(user: Record<string, unknown>): number {
  const raw = user['p_u_id'] ?? user['pUid'] ?? user['userid'] ?? user['id'] ?? user['wUid'] ?? user['unid']
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
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

export function forwardLanguageChangedToCocos(locale: string): void {
  const payload: SyncLanguagePayload = {
    locale: String(locale || '').trim(),
  }
  if (!payload.locale) {
    return
  }
  queueSyncUntilHandshake(BRIDGE_ACTION.SYNC_LANGUAGE, payload)
}

// 握手完成后将 globalConfig 同步给 Cocos。与 syncUser/syncRoomsList 相同机制：
// 握手前调用时缓存，握手完成后随其他 pending 消息一起 flush。
export function forwardGlobalConfigToCocos(config: GlobalConfigData): void {
  const payload: SyncGlobalConfigPayload = { raw: config }
  queueSyncUntilHandshake(BRIDGE_ACTION.SYNC_GLOBAL_CONFIG, payload)
}

// 订阅 proto 138（钻石变动）和 141（UC/金豆变动），更新本地 userInfo 并重新同步给 Cocos。
// 返回取消订阅函数，登出时调用。
export function initUserBalanceSync(): () => void {
  const unsubDiamond = subscribeH5WsCode(USER_BALANCE_CODE.DIAMOND_CHANGE, (msg) => {
    const payload = decodeUserDiamondChange(msg.rawBuffer)
    if (!payload) return

    const store = useUserInfoStore()
    const current = store.userInfo
    if (!current) return

    const user = current.user as Record<string, unknown>
    const storeUserId = resolveUserId(user)
    if (storeUserId && storeUserId !== payload.userId) return

    const updated: UserInfoData = {
      ...current,
      user: {
        ...current.user,
        diamonds: payload.diamonds,
        diamondsLock: payload.diamondsLock,
      },
    }
    store.setUserInfo(updated)
    forwardUserInfoToCocos(updated)
  })

  const unsubGold = subscribeH5WsCode(USER_BALANCE_CODE.GOLD_CHANGE, (msg) => {
    const payload = decodeUserGoldChange(msg.rawBuffer)
    if (!payload) return

    const store = useUserInfoStore()
    const current = store.userInfo
    if (!current) return

    const user = current.user as Record<string, unknown>
    const storeUserId = resolveUserId(user)
    if (storeUserId && storeUserId !== payload.userId) return

    const updated: UserInfoData = {
      ...current,
      user: {
        ...current.user,
        gold: payload.gold,
        goldLock: payload.goldLock,
      },
    }
    store.setUserInfo(updated)
    forwardUserInfoToCocos(updated)
  })

  return () => {
    unsubDiamond()
    unsubGold()
  }
}
