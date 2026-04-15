import { showFailToast, showSuccessToast } from 'vant'
import { subscribeCocosMessages } from './bridge'
import { BRIDGE_ACTION, type BridgeMessage, type CocosToastPayload } from './protocol'

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

    if (toastPayload.type === 'danger') {
      showFailToast({ message: toastPayload.message, duration: toastPayload.duration ?? 2000 })
      return
    }

    showSuccessToast({ message: toastPayload.message, duration: toastPayload.duration ?? 2000 })
    return
  }

  // 兼容协议：直接通过动作名区分成功/失败提示。
  if (message.action === 'toastSuccess') {
    const toastPayload = normalizeToastPayload(message.payload)
    if (toastPayload?.message) {
      showSuccessToast({ message: toastPayload.message, duration: toastPayload.duration ?? 2000 })
    }
    return
  }

  if (message.action === 'toastDanger') {
    const toastPayload = normalizeToastPayload(message.payload)
    if (toastPayload?.message) {
      showFailToast({ message: toastPayload.message, duration: toastPayload.duration ?? 2000 })
    }
  }
}

// 启动全局 toast 通道：只注册一次，避免重复弹窗。
export function setupGlobalBridgeToastChannel(): () => void {
  if (stopBridgeToastListener) {
    return stopBridgeToastListener
  }

  const unsubscribe = subscribeCocosMessages(onCocosMessage)
  stopBridgeToastListener = () => {
    unsubscribe()
    stopBridgeToastListener = null
  }

  return stopBridgeToastListener
}
