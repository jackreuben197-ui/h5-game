import { subscribeCocosMessages } from '../core/cocosBridgeChannel'
import { BRIDGE_ACTION, BRIDGE_MSG_TYPE, type BridgeMessage, type CocosToastPayload } from '@bridge-protocol'
import { showGameToastOnTable } from '@/components/Toast'

let stopBridgeToastListener: (() => void) | null = null

// 将未知 payload 规范化成 toast 结构，避免格式不一致导致崩溃。
function normalizeToastPayload(payload: unknown): CocosToastPayload | null {
  if (typeof payload === 'string') {
    return {
      type: 'success',
      message: payload,
    }
  }

  if (!payload || typeof payload !== 'object') {
    return null
  }

  const raw = payload as Partial<CocosToastPayload> & { level?: unknown; text?: unknown }
  const message =
    typeof raw.message === 'string'
      ? raw.message
      : typeof raw.text === 'string'
        ? raw.text
        : ''
  if (!message) {
    return null
  }

  const rawType = typeof raw.type === 'string' ? raw.type : typeof raw.level === 'string' ? raw.level : 'success'
  const type: CocosToastPayload['type'] = rawType === 'danger' ? 'danger' : 'success'
  const duration = typeof raw.duration === 'number' && raw.duration > 0 ? raw.duration : undefined

  return { type, message, duration }
}

// 处理 Cocos 下发的全局 toast 消息。
function onCocosMessage(message: BridgeMessage): void {
  // 主协议：action=showToast，payload={ type, message, duration }。
  if (message.action === BRIDGE_ACTION.SHOW_TOAST) {
    const toastPayload = normalizeToastPayload(message.payload)
    if (!toastPayload) {
      return
    }

    showGameToastOnTable(toastPayload.type, toastPayload.message, toastPayload.duration ?? 2000)
    return
  }
}

// 启动全局 toast 通道：只注册一次，避免重复弹窗。
export function setupGlobalBridgeToastChannel(): () => void {
  if (stopBridgeToastListener) {
    return stopBridgeToastListener
  }

  const unsubscribe = subscribeCocosMessages(onCocosMessage, {
    msgtype: BRIDGE_MSG_TYPE.H5,
  })
  stopBridgeToastListener = () => {
    unsubscribe()
    stopBridgeToastListener = null
  }

  return stopBridgeToastListener
}
