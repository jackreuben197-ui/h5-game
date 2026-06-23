// H5 → Cocos：token 变更同步入口。
// 登录、续期、登出三类场景都调用 pushTokenToCocos / pushTokenClearToCocos，
// 保证 Cocos LoginSession.Token + dzpk_cc_TOKEN 始终与 H5 dzpk_h5_TOKEN 同步。
import { BRIDGE_ACTION, BRIDGE_MSG_TYPE, type SyncTokenPayload } from '@bridge-protocol'
import {
  isBridgeHandshakeDone,
  onBridgeHandshakeDone,
  sendBridgeMessage,
} from '../core/cocosBridgeChannel'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'

let pendingPayload: SyncTokenPayload | null = null
let stopHandshakeListener: (() => void) | null = null

function flushPending(): void {
  if (!pendingPayload) return
  const payload = pendingPayload
  pendingPayload = null
  sendBridgeMessage(BRIDGE_ACTION.SYNC_TOKEN, payload, { msgtype: BRIDGE_MSG_TYPE.H5 })
}

function sendOrQueue(payload: SyncTokenPayload): void {
  if (isBridgeHandshakeDone()) {
    sendBridgeMessage(BRIDGE_ACTION.SYNC_TOKEN, payload, { msgtype: BRIDGE_MSG_TYPE.H5 })
    return
  }
  // 握手前仅保留最新一帧，避免重复下发旧值。
  pendingPayload = payload
  if (stopHandshakeListener) {
    return
  }
  stopHandshakeListener = onBridgeHandshakeDone(() => {
    flushPending()
    stopHandshakeListener?.()
    stopHandshakeListener = null
  })
}

function readExpireAt(): number {
  const raw = localStore.getItem<number | string>(StorageKey.TOKEN_EXPIREAT, 0)
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : 0
}

// 登录 / token 续期成功时调用：把最新 token 与到期时间推给 Cocos。
export function pushTokenToCocos(token: string, expireAt?: number): void {
  const safeToken = (token || '').trim()
  if (!safeToken) {
    pushTokenClearToCocos()
    return
  }
  const safeExpireAt =
    typeof expireAt === 'number' && Number.isFinite(expireAt) && expireAt > 0
      ? expireAt
      : readExpireAt()
  const payload: SyncTokenPayload = { token: safeToken }
  if (safeExpireAt > 0) {
    payload.expireAt = safeExpireAt
  }
  sendOrQueue(payload)
}

// 登出 / token 刷新失败时调用：用空 token 通知 Cocos 清登录态。
export function pushTokenClearToCocos(): void {
  sendOrQueue({ token: '' })
}
