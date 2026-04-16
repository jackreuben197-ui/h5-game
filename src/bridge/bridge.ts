import {
  BRIDGE_ACTION,
  createBridgeMessage,
  parseBridgeRaw,
  toBridgeRaw,
  type BridgeAction,
  type BridgeMessage,
  type CocosAckPayload,
  type RegisterPayload,
  type EnterTablePayload,
} from './protocol'

type MessageHandler = (message: BridgeMessage) => void

// 桥接传输相关标识。
const BRIDGE_SCHEME = 'cocos'
const BRIDGE_HOST = 'bridge'
const H5_SOURCE = 'h5-game'
const COCOS_SOURCE = 'cocos-game'
const handlers = new Set<MessageHandler>()

// 向所有订阅者分发消息。
function emit(message: BridgeMessage): void {
  handlers.forEach((handler) => handler(message))
}

// 通道1：原生注入对象（如 Android 注入 CocosBridge）。
function postByInjectedBridge(raw: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  if (typeof window.CocosBridge?.postMessage === 'function') {
    window.CocosBridge.postMessage(raw)
    return true
  }

  return false
}

// 通道2：iOS WKWebView 的 messageHandlers。
function postByWebkitBridge(raw: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  if (typeof window.webkit?.messageHandlers?.cocosBridge?.postMessage === 'function') {
    window.webkit.messageHandlers.cocosBridge.postMessage(raw)
    return true
  }

  return false
}

// 通道3：原生 WebView 场景下的 scheme 兜底通道。
function postByScheme(raw: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const url = `${BRIDGE_SCHEME}://${BRIDGE_HOST}?data=${encodeURIComponent(raw)}`
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = url
  document.body.appendChild(iframe)
  window.setTimeout(() => iframe.remove(), 0)
  return true
}

// 通道4：浏览器/容器场景下的 postMessage 兜底。
function postByWindowMessage(raw: string): boolean {
  if (typeof window === 'undefined' || window.parent === window) {
    return false
  }

  window.parent.postMessage({ source: H5_SOURCE, payload: raw }, '*')
  return true
}

// 简单 UA 判断：在疑似原生环境优先走 scheme。
function shouldUseScheme(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false
  }

  // 本地开发环境（localhost）不走 scheme，避免浏览器控制台大量告警。
  const host = window.location.hostname
  const isLocalDevHost = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0'
  if (isLocalDevHost) {
    return false
  }

  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('cocos') || ua.includes('android') || ua.includes('iphone')
}

// 按优先级依次尝试发送通道，命中一个即返回。
function postToCocos(raw: string): void {
  if (postByInjectedBridge(raw)) {
    return
  }
  if (postByWebkitBridge(raw)) {
    return
  }
  if (shouldUseScheme()) {
    postByScheme(raw)
    return
  }
  if (postByWindowMessage(raw)) {
    return
  }

  console.info('[bridge] no cocos channel found, message dropped:', raw)
}

// 暴露当前命中的通道，供调试页展示。
export function getBridgeChannelName(): string {
  if (typeof window === 'undefined') {
    return 'unknown'
  }
  if (typeof window.CocosBridge?.postMessage === 'function') {
    return 'injected'
  }
  if (typeof window.webkit?.messageHandlers?.cocosBridge?.postMessage === 'function') {
    return 'webkit'
  }
  if (shouldUseScheme()) {
    return 'scheme'
  }
  if (window.parent !== window) {
    return 'postMessage'
  }
  return 'none'
}

// 统一发送入口：封装消息并下发到 Cocos。
export function sendBridgeMessage<TPayload>(
  action: BridgeAction,
  payload: TPayload,
): BridgeMessage<TPayload> {
  const message = createBridgeMessage(action, payload)
  postToCocos(toBridgeRaw(message))
  return message
}

// 业务快捷方法：登录后向 Cocos 发送 Register，同步 token + websocketPort。
export function registerToCocos(payload: RegisterPayload): BridgeMessage<RegisterPayload> {
  return sendBridgeMessage(BRIDGE_ACTION.REGISTER, payload)
}

// 业务快捷方法：请求 Cocos 进入牌桌。
export function enterTable(payload: EnterTablePayload): BridgeMessage<EnterTablePayload> {
  return sendBridgeMessage(BRIDGE_ACTION.ENTER_TABLE, payload)
}

// 业务快捷方法：请求 Cocos 退出牌桌。
export function sendExitTable(payload: Record<string, unknown>): BridgeMessage<Record<string, unknown>> {
  return sendBridgeMessage(BRIDGE_ACTION.EXIT_TABLE, payload)
}

// 订阅 Cocos -> H5 的回调消息。
export function subscribeCocosMessages(handler: MessageHandler): () => void {
  handlers.add(handler)
  return () => handlers.delete(handler)
}

// 调试页用的本地回执模拟方法。
export function mockCocosAck(payload: CocosAckPayload): void {
  emit(createBridgeMessage(BRIDGE_ACTION.COCOS_ACK, payload))
}

// 解析原始入站消息，合法则分发。
function handleIncomingRaw(raw: string): void {
  const parsed = parseBridgeRaw(raw)
  if (parsed) {
    emit(parsed)
  }
}

if (typeof window !== 'undefined') {
  // 原生可直接调用该函数，把消息推入 H5。
  window.__H5_GAME_ON_COCOS_MESSAGE__ = (raw: string): void => {
    handleIncomingRaw(raw)
  }

  // Web 兜底：接收来自父窗口/容器的 postMessage。
  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    const data = event.data
    if (typeof data === 'string') {
      handleIncomingRaw(data)
      return
    }

    if (!data || typeof data !== 'object') {
      return
    }

    const messageSource = (data as { source?: string }).source
    if (messageSource !== COCOS_SOURCE && messageSource !== H5_SOURCE) {
      return
    }

    const payload = (data as { payload?: unknown }).payload
    if (typeof payload === 'string') {
      handleIncomingRaw(payload)
      return
    }

    const maybeMessage = (data as { message?: BridgeMessage }).message
    if (maybeMessage) {
      emit(maybeMessage)
    }
  })
}
