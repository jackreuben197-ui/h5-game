import {
  isBridgeHandshakeDone,
  onBridgeHandshakeDone,
  sendBridgeMessage,
} from '../core/cocosBridgeChannel'
import {
  BRIDGE_ACTION,
  BRIDGE_MSG_TYPE,
  type SyncDiamondConfigPayload,
  type SyncGlobalConfigPayload,
  type SyncLanguagePayload,
  type SyncCurrentClubPayload,
  type SyncRoomsListPayload,
  type SyncUserClubPayload,
  type SyncUserPayload,
} from '@bridge-protocol'
import { watch } from 'vue'
import { Code, subscribeH5WsCode } from '../ws/messageCenter'
import { decodeUserDiamondChange, decodeUserGoldChange } from '../ws/userBalanceNotify'
import { decodeUserTraderOrderNotify } from '../ws/traderOrderNotify'
import type { UserInfoData } from '@/api/models/user'
import type { DiamondConfigMap, GlobalConfigData } from '@/api/models/config'
import type { ApiResponse } from '@/api/models/common'
import type { RoomDetailData, RoomDetailRequest } from '@/api/models/roomcenter'
import { isExperienceUserInfo } from '@/session/experienceIdentity'
import { useUserInfoStore } from '@/stores/userInfo'
import { pinia } from '@/stores/pinia'

const TRADER_ORDER_STATUS_APPROVED = 2

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
  const raw =
    user['p_u_id'] ?? user['pUid'] ?? user['userid'] ?? user['id'] ?? user['wUid'] ?? user['unid']
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

export function forwardUserInfoToCocos(data: UserInfoData): void {
  const user = (data.user || {}) as Record<string, unknown>
  const payload: SyncUserPayload = {
    uid: resolveUserField(user, ['p_u_id', 'pUid', 'userid', 'id', 'wUid']),
    randomId: resolveUserField(user, ['un_id', 'unid']),
    nickname: resolveUserField(user, ['nickname', 'name']),
    avatar: resolveUserField(user, ['avatar', 'headimg']) || undefined,
    sex: Number(user.sex || 0),
    isExperience: isExperienceUserInfo(data),
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

export function initCurrentClubSync(): () => void {
  const store = useUserInfoStore(pinia)
  return watch(
    () => store.currentClubId,
    (rawClubId) => {
      const clubId = Number(rawClubId)
      const payload: SyncCurrentClubPayload = {
        clubId: Number.isFinite(clubId) && clubId > 0 ? clubId : 0,
      }
      queueSyncUntilHandshake(BRIDGE_ACTION.SYNC_CURRENT_CLUB, payload)
    },
    { immediate: true, flush: 'sync' },
  )
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

// 握手完成后将已转换的 diamondConfig map 同步给 Cocos。
export function forwardDiamondConfigToCocos(config: DiamondConfigMap | null): void {
  if (!config) return
  const payload: SyncDiamondConfigPayload = { raw: config }
  queueSyncUntilHandshake(BRIDGE_ACTION.SYNC_DIAMOND_CONFIG, payload)
}

// 订阅 proto 138（钻石变动）和 141（UC/金豆变动），更新本地 userInfo 并重新同步给 Cocos。
// 返回取消订阅函数，登出时调用。
export function initUserBalanceSync(): () => void {
  const unsubDiamond = subscribeH5WsCode(Code.MSG_S_USER_DIAMOND_CHANGE, (msg) => {
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

  const unsubGold = subscribeH5WsCode(Code.MSG_S_USER_GOLD_CHANGE, (msg) => {
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

  // 批发商审核通过后，重新拉取 userInfo，刷新 trader_expire_time。
  const unsubTraderOrder = subscribeH5WsCode(Code.MSG_S_USER_TRADER_ORDER_NOTIFY, (msg) => {
    const payload = decodeUserTraderOrderNotify(msg.rawBuffer)
    if (!payload || payload.status !== TRADER_ORDER_STATUS_APPROVED) {
      return
    }

    // 避免 bridge/sync <-> api/user 模块循环依赖，使用动态导入。
    void import('@/api/user').then(({ getUserInfoApi }) => getUserInfoApi()).catch(() => undefined)
  })

  return () => {
    unsubDiamond()
    unsubGold()
    unsubTraderOrder()
  }
}
