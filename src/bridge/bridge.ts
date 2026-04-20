import {
  BRIDGE_ACTION,
  BRIDGE_MSG_TYPE,
  createBridgeMessage,
  parseBridgeRaw,
  toBridgeRaw,
  type BridgeAction,
  type BridgeMsgType,
  type BridgeMessage,
  type EnterTablePayload,
} from './protocol'

type MessageHandler = (message: BridgeMessage) => void
type MessageRoute = 'all' | 'forward' | 'h5'

interface MessageHandlerEntry {
  handler: MessageHandler
  route: MessageRoute
}

export interface SubscribeCocosMessagesOptions {
  // all: 全量回调；forward: msgtype=0；h5: msgtype=1。
  msgtype?: MessageRoute | BridgeMsgType
}

export interface SendBridgeMessageOptions {
  msgtype?: BridgeMsgType
}

// 桥接传输相关标识。
const BRIDGE_SCHEME = 'cocos'
const BRIDGE_HOST = 'bridge'
const H5_WINDOW_SOURCE = 'h5'
const CC_WINDOW_SOURCE = 'cc'
// 兼容历史字段。
const H5_LEGACY_SOURCE = 'h5-game'
const COCOS_LEGACY_SOURCE = 'cocos-game'
const handlerEntries = new Set<MessageHandlerEntry>()

let h5ReadySent = false

// 向所有订阅者分发消息。
function emit(message: BridgeMessage): void {
  const route: MessageRoute = message.msgtype === BRIDGE_MSG_TYPE.H5 ? 'h5' : 'forward'
  handlerEntries.forEach((entry) => {
    if (entry.route !== 'all' && entry.route !== route) {
      return
    }
    entry.handler(message)
  })
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

  window.parent.postMessage({ source: H5_WINDOW_SOURCE, payload: raw }, '*')
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

  // 开发期没有 Cocos 容器时，避免打印整段 base64 造成刷屏。
  console.warn('[bridge] no cocos channel found, message dropped:', briefBridgeRaw(raw))
}

function briefBridgeRaw(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      action?: string
      source?: string
      msgtype?: number
      payload?: { dataType?: string; data?: string }
      requestId?: string
      timestamp?: number
    }
    const action = parsed.action || 'unknown'

    if (action === 'wsMessage') {
      const dataType = parsed.payload?.dataType || 'unknown'
      const dataLength = typeof parsed.payload?.data === 'string' ? parsed.payload.data.length : 0
      return JSON.stringify({
        action,
        payload: {
          dataType,
          data: `<base64 length=${dataLength}>`,
        },
        source: parsed.source,
        msgtype: parsed.msgtype,
        requestId: parsed.requestId,
        timestamp: parsed.timestamp,
      })
    }

    return raw
  } catch {
    return raw
  }
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
  action: BridgeAction | string,
  payload: TPayload,
  options: SendBridgeMessageOptions = {},
): BridgeMessage<TPayload> {
  const message = createBridgeMessage(action, payload, options)
  postToCocos(toBridgeRaw(message))
  return message
}

// 业务快捷方法：请求 Cocos 进入牌桌。
export function enterTable(payload: EnterTablePayload): BridgeMessage<EnterTablePayload> {
  return sendBridgeMessage(BRIDGE_ACTION.ENTER_TABLE, payload, {
    msgtype: BRIDGE_MSG_TYPE.H5,
  })
}

// 订阅 Cocos -> H5 的回调消息。
export function subscribeCocosMessages(
  handler: MessageHandler,
  options: SubscribeCocosMessagesOptions = {},
): () => void {
  const entry: MessageHandlerEntry = {
    handler,
    route: normalizeMessageRoute(options.msgtype),
  }
  handlerEntries.add(entry)
  return () => {
    handlerEntries.delete(entry)
  }
}

function normalizeMessageRoute(raw: SubscribeCocosMessagesOptions['msgtype']): MessageRoute {
  if (raw === 'h5' || raw === BRIDGE_MSG_TYPE.H5) {
    return 'h5'
  }
  if (raw === 'forward' || raw === BRIDGE_MSG_TYPE.FORWARD) {
    return 'forward'
  }
  return 'all'
}

function maybeSendH5Ready(): void {
  if (typeof window === 'undefined' || h5ReadySent) {
    return
  }

  if (window.__H5_READY__ !== true || window.__CC_READY__ !== true) {
    return
  }

  sendBridgeMessage(BRIDGE_ACTION.H5_READY, {}, { msgtype: BRIDGE_MSG_TYPE.H5 })
  h5ReadySent = true
}

function markCcReady(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.__CC_READY__ = true
}

function handleHandshakeMessage(message: BridgeMessage): void {
  if (message.action === BRIDGE_ACTION.CC_READY) {
    markCcReady()
    // CC 主动声明 ready 时，H5 需回 h5Ack。
    sendBridgeMessage(BRIDGE_ACTION.H5_ACK, {}, { msgtype: BRIDGE_MSG_TYPE.H5 })
    maybeSendH5Ready()
    return
  }

  if (message.action === BRIDGE_ACTION.CC_ACK) {
    markCcReady()
    return
  }
}

// 解析原始入站消息，合法则分发。
function handleIncomingRaw(raw: string): void {
  const parsed = parseBridgeRaw(raw)
  if (parsed) {
    // 约定：CC 下发可带 source='cc'；若显式标记为其它来源则忽略。
    if (parsed.source && parsed.source !== CC_WINDOW_SOURCE) {
      return
    }
    handleHandshakeMessage(parsed)
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
    // 先忽略自己发出的 postMessage 回流，避免自消费。
    if (messageSource === H5_WINDOW_SOURCE || messageSource === H5_LEGACY_SOURCE) {
      return
    }
    // 只接收 CC 来源（兼容历史 cocos-game 标记）。
    if (messageSource && messageSource !== CC_WINDOW_SOURCE && messageSource !== COCOS_LEGACY_SOURCE) {
      return
    }

    const payload = (data as { payload?: unknown }).payload
    if (typeof payload === 'string') {
      handleIncomingRaw(payload)
      return
    }

    const maybeMessage = (data as { message?: BridgeMessage }).message
    if (maybeMessage && typeof maybeMessage === 'object') {
      const normalized = parseBridgeRaw(JSON.stringify(maybeMessage))
      if (normalized) {
        handleHandshakeMessage(normalized)
        emit(normalized)
      }
    }
  })

  // H5 Bridge 入站监听已完成，标记就绪并尝试握手。
  window.__H5_READY__ = true
  maybeSendH5Ready()
}
