import {
  BRIDGE_ACTION,
  BRIDGE_MSG_TYPE,
  createBridgeMessage,
  normalizeBridgeMsgType,
  parseBridgeObject,
  parseBridgeRaw,
  toBridgeRaw,
  type BridgeAction,
  type BridgeMsgType,
  type BridgeMessage,
  type EnterTablePayload,
} from './protocol'

type MessageHandler = (message: BridgeMessage) => void
type MessageRoute = 'all' | 'forward' | 'h5'
type DirectBridgeFn = (
  type: string,
  payload?: unknown,
  msgtype?: number,
  requestId?: string,
  timestamp?: number,
  source?: string,
) => void

interface MessageHandlerEntry {
  handler: MessageHandler
  route: MessageRoute
}
type HandshakeDoneHandler = () => void

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
const CC_WINDOW_SOURCE = 'cc'
// 兼容历史字段。
const COCOS_LEGACY_SOURCE = 'cocos-game'
const handlerEntries = new Set<MessageHandlerEntry>()
const handshakeDoneHandlers = new Set<HandshakeDoneHandler>()

let h5ReadySent = false
let bridgeHandshakeDone = false

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

function getCocosDirectBridgeFn(): DirectBridgeFn | null {
  if (typeof window === 'undefined') {
    return null
  }

  const bridge = window.CocosBridge
  const fn =
    bridge?.sendMessage ||
    bridge?.onMessgeRecv ||
    bridge?.onMessageRecv ||
    null

  return typeof fn === 'function' ? (fn as DirectBridgeFn) : null
}

// 通道1：函数直调（推荐，避免 JSON 包装）。
function postByDirectBridge(message: BridgeMessage): boolean {
  const directFn = getCocosDirectBridgeFn()
  if (!directFn) {
    return false
  }

  directFn.call(
    window.CocosBridge,
    message.action,
    message.payload,
    message.msgtype,
    message.requestId,
    message.timestamp,
    message.source,
  )
  return true
}

// 通道2：原生注入对象（兼容 legacy postMessage）。
function postByInjectedBridge(message: BridgeMessage): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  if (typeof window.CocosBridge?.postMessage === 'function') {
    window.CocosBridge.postMessage(message)
    return true
  }

  return false
}

// 通道3：iOS WKWebView 的 messageHandlers。
function postByWebkitBridge(message: BridgeMessage): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  if (typeof window.webkit?.messageHandlers?.cocosBridge?.postMessage === 'function') {
    window.webkit.messageHandlers.cocosBridge.postMessage(message)
    return true
  }

  return false
}

// 通道4：浏览器/容器场景下的 postMessage 兜底。
function postByWindowMessage(message: BridgeMessage): boolean {
  if (typeof window === 'undefined' || window.parent === window) {
    return false
  }

  window.parent.postMessage(message, '*')
  return true
}

// 通道5：原生 WebView 场景下的 scheme 兜底（仅兼容 legacy）。
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

// 简单 UA 判断：在疑似原生环境允许 scheme 兜底。
function shouldUseScheme(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false
  }

  const host = window.location.hostname
  const isLocalDevHost = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0'
  if (isLocalDevHost) {
    return false
  }

  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('cocos') || ua.includes('android') || ua.includes('iphone')
}

// 按优先级依次尝试发送通道，命中一个即返回。
function postToCocos(message: BridgeMessage): void {
  if (postByDirectBridge(message)) {
    return
  }
  if (postByInjectedBridge(message)) {
    return
  }
  if (postByWebkitBridge(message)) {
    return
  }
  if (postByWindowMessage(message)) {
    return
  }
  if (shouldUseScheme()) {
    postByScheme(toBridgeRaw(message))
    return
  }

  console.warn('[bridge] no cocos channel found, message dropped:', briefBridgeObject(message))
}

function briefBridgeObject(message: BridgeMessage): string {
  if (message.action !== BRIDGE_ACTION.WS_MESSAGE) {
    return JSON.stringify({
      action: message.action,
      source: message.source,
      msgtype: message.msgtype,
      requestId: message.requestId,
      timestamp: message.timestamp,
    })
  }

  const payload = message.payload as {
    dataType?: string
    text?: string
    data?: unknown
  }
  const data = payload?.data
  let byteLength = 0
  if (data instanceof ArrayBuffer) {
    byteLength = data.byteLength
  } else if (ArrayBuffer.isView(data)) {
    byteLength = data.byteLength
  } else if (data instanceof Blob) {
    byteLength = data.size
  }

  return JSON.stringify({
    action: message.action,
    payload: {
      dataType: payload?.dataType || 'unknown',
      textLength: typeof payload?.text === 'string' ? payload.text.length : 0,
      data: `<binary length=${byteLength}>`,
    },
    source: message.source,
    msgtype: message.msgtype,
    requestId: message.requestId,
    timestamp: message.timestamp,
  })
}

// 暴露当前命中的通道，供调试页展示。
export function getBridgeChannelName(): string {
  if (typeof window === 'undefined') {
    return 'unknown'
  }
  if (getCocosDirectBridgeFn()) {
    return 'direct-call'
  }
  if (typeof window.CocosBridge?.postMessage === 'function') {
    return 'injected'
  }
  if (typeof window.webkit?.messageHandlers?.cocosBridge?.postMessage === 'function') {
    return 'webkit'
  }
  if (window.parent !== window) {
    return 'postMessage'
  }
  if (shouldUseScheme()) {
    return 'scheme'
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
  postToCocos(message)
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

function markBridgeHandshakeDone(): void {
  if (bridgeHandshakeDone) {
    return
  }
  bridgeHandshakeDone = true
  handshakeDoneHandlers.forEach((handler) => handler())
}

// 当前是否已完成 H5/CC 握手（以收到 CC ready/ack 为准）。
export function isBridgeHandshakeDone(): boolean {
  return bridgeHandshakeDone
}

// 握手完成回调；若已完成则立即回调一次。
export function onBridgeHandshakeDone(handler: HandshakeDoneHandler): () => void {
  if (bridgeHandshakeDone) {
    handler()
    return () => undefined
  }

  handshakeDoneHandlers.add(handler)
  return () => {
    handshakeDoneHandlers.delete(handler)
  }
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
    sendBridgeMessage(BRIDGE_ACTION.H5_ACK, {}, { msgtype: BRIDGE_MSG_TYPE.H5 })
    markBridgeHandshakeDone()
    maybeSendH5Ready()
    return
  }

  if (message.action === BRIDGE_ACTION.CC_ACK) {
    markCcReady()
    markBridgeHandshakeDone()
    return
  }
}

function handleIncomingMessage(message: BridgeMessage, fallbackSource?: string): void {
  const messageSource = message.source || fallbackSource
  if (messageSource !== CC_WINDOW_SOURCE && messageSource !== COCOS_LEGACY_SOURCE) {
    return
  }

  handleHandshakeMessage(message)
  emit(message)
}

function handleIncomingRaw(raw: string, fallbackSource?: string): void {
  const parsed = parseBridgeRaw(raw)
  if (parsed) {
    handleIncomingMessage(parsed, fallbackSource)
  }
}

function handleIncomingDirect(
  type: unknown,
  payload?: unknown,
  msgtype?: unknown,
  requestId?: unknown,
  timestamp?: unknown,
  source?: unknown,
): void {
  if (typeof type !== 'string') {
    return
  }

  const message: BridgeMessage = {
    action: type,
    payload,
    source: typeof source === 'string' ? source : undefined,
    msgtype: normalizeBridgeMsgType(msgtype),
    requestId:
      typeof requestId === 'string'
        ? requestId
        : `cocos_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
  }

  handleIncomingMessage(message, CC_WINDOW_SOURCE)
}

if (typeof window !== 'undefined') {
  const onMessgeRecv: DirectBridgeFn = (
    type,
    payload,
    msgtype,
    requestId,
    timestamp,
    source,
  ): void => {
    handleIncomingDirect(type, payload, msgtype, requestId, timestamp, source)
  }

  window.H5Bridge = {
    ...(window.H5Bridge || {}),
    onMessgeRecv,
    onMessageRecv: onMessgeRecv,
  }

  ;(window as { onMessgeRecv?: DirectBridgeFn }).onMessgeRecv = onMessgeRecv
  ;(window as { onMessageRecv?: DirectBridgeFn }).onMessageRecv = onMessgeRecv

  // 兼容老入口：Cocos 仍可传对象或字符串。
  window.__H5_GAME_ON_COCOS_MESSAGE__ = (incoming: unknown): void => {
    if (typeof incoming === 'string') {
      handleIncomingRaw(incoming, CC_WINDOW_SOURCE)
      return
    }

    const parsed = parseBridgeObject(incoming)
    if (parsed) {
      handleIncomingMessage(parsed, CC_WINDOW_SOURCE)
    }
  }

  // Web 兜底：接收来自父窗口/容器的 postMessage。
  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    const data = event.data
    const messageSource = (data as { source?: string } | null)?.source

    if (typeof data === 'string') {
      handleIncomingRaw(data, messageSource)
      return
    }

    if (!data || typeof data !== 'object') {
      return
    }

    if (messageSource !== CC_WINDOW_SOURCE && messageSource !== COCOS_LEGACY_SOURCE) {
      return
    }

    const payload = (data as { payload?: unknown }).payload
    if (typeof payload === 'string') {
      handleIncomingRaw(payload, messageSource)
      return
    }

    const directMessage = parseBridgeObject(data)
    if (directMessage) {
      handleIncomingMessage(directMessage, messageSource)
      return
    }

    const maybeMessage = (data as { message?: unknown }).message
    const normalized = parseBridgeObject(maybeMessage)
    if (normalized) {
      handleIncomingMessage(normalized, messageSource)
    }
  })

  window.__H5_READY__ = true
  maybeSendH5Ready()
}
