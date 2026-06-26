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
  type EnterMttPayload,
  type H5ReadyPayload,
  type SafeArea,
} from '@bridge-protocol'
import StorageKey from '@/constants/storageKey'
import { createLogger } from '@/utils/logger'
import { localStore } from '@/utils/localStore'
import { showGameToast } from '@/components/Toast'
import { showLocalBridgeDialog } from '../channels/dialogChannel'

const log = createLogger('[bridge]')
const logH5ToCC = createLogger('[bridge][h5->cc]')
const logCCToH5 = createLogger('[bridge][cc->h5]')

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
// 进入牌桌时等待 cocos 就绪的窗口期：在此期间内仅 toast 提示等待，超出则弹窗提示刷新。
const COCOS_READY_TIMEOUT_MS = 5000
const handlerEntries = new Set<MessageHandlerEntry>()
const handshakeDoneHandlers = new Set<HandshakeDoneHandler>()

let h5ReadySent = false
let bridgeHandshakeDone = false
let lastBridgeChannelName = ''
// h5 就绪时间戳，用于判断 enterTable 时 cocos 仍未就绪是“起步阶段”还是“真异常”。
let h5ReadyTime = 0

function isNonForwardMessage(message: BridgeMessage): boolean {
  return normalizeBridgeMsgType(message.msgtype) === BRIDGE_MSG_TYPE.H5
}

function getBinaryByteLength(raw: unknown): number {
  if (raw instanceof ArrayBuffer) {
    return raw.byteLength
  }
  if (ArrayBuffer.isView(raw)) {
    return raw.byteLength
  }
  if (raw instanceof Blob) {
    return raw.size
  }
  return 0
}

function payloadForNonForwardLog(payload: unknown): unknown {
  if (payload === null || payload === undefined) {
    return payload
  }

  const rootBinaryBytes = getBinaryByteLength(payload)
  if (rootBinaryBytes > 0) {
    return {
      kind: 'binary',
      binaryBytes: rootBinaryBytes,
    }
  }

  if (typeof payload !== 'object') {
    return payload
  }

  if (Array.isArray(payload)) {
    return payload
  }

  const raw = payload as Record<string, unknown>
  if (!('data' in raw)) {
    return payload
  }

  const binaryBytes = getBinaryByteLength(raw.data)
  if (binaryBytes <= 0) {
    return payload
  }

  return {
    ...raw,
    data: `<binary length=${binaryBytes}>`,
  }
}

function logH5OutgoingNonForwardAction(message: BridgeMessage): void {
  if (!isNonForwardMessage(message)) {
    return
  }

  logH5ToCC.debug({
    action: message.action,
    msgtype: message.msgtype,
    requestId: message.requestId,
    timestamp: message.timestamp,
    payload: payloadForNonForwardLog(message.payload),
  })
}

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
  const fn = bridge?.sendMessage || bridge?.onMessgeRecv || bridge?.onMessageRecv || null

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
  const channelName = getBridgeChannelName()
  if (channelName !== lastBridgeChannelName) {
    lastBridgeChannelName = channelName
    log.info('[channel] current channel', { channel: channelName })
  }

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

  log.warn('no cocos channel found, message dropped:', briefBridgeObject(message))
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
  logH5OutgoingNonForwardAction(message)
  postToCocos(message)
  return message
}

// 进入牌桌前校验 cocos 是否就绪：窗口期内 toast 等待提示，超出窗口期弹窗提示刷新。
// 返回 true 表示可以继续发送进入牌桌消息。
function ensureCocosReadyForEnter(): boolean {
  if (bridgeHandshakeDone) {
    return true
  }

  const elapsed = h5ReadyTime > 0 ? Date.now() - h5ReadyTime : 0
  if (elapsed <= COCOS_READY_TIMEOUT_MS) {
    showGameToast('游戏场景未就绪，请等待')
  } else {
    showLocalBridgeDialog({
      message: '游戏场景加载失败，请刷新后重试',
      showCancelButton: false,
      showConfirmButton: true,
      ensureVisible: false,
      onConfirm: () => {
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      },
    })
  }
  return false
}

// 业务快捷方法：请求 Cocos 进入普通牌桌。
export function enterTable(payload: EnterTablePayload): BridgeMessage<EnterTablePayload> | null {
  if (!ensureCocosReadyForEnter()) {
    return null
  }

  return sendBridgeMessage(BRIDGE_ACTION.ENTER_TABLE, payload, {
    msgtype: BRIDGE_MSG_TYPE.H5,
  })
}

// 业务快捷方法：请求 Cocos 进入 MTT 赛事牌桌。
export function enterMtt(payload: EnterMttPayload): BridgeMessage<EnterMttPayload> | null {
  if (!ensureCocosReadyForEnter()) {
    return null
  }

  return sendBridgeMessage(BRIDGE_ACTION.ENTER_MTT, payload, {
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
  log.info('[handshake] done')
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

  const payload = createH5ReadyPayload()
  log.info('[handshake] send h5Ready', payload)
  sendBridgeMessage(BRIDGE_ACTION.H5_READY, payload, { msgtype: BRIDGE_MSG_TYPE.H5 })
  h5ReadySent = true
}

function createH5ReadyPayload(): H5ReadyPayload {
  const token = (localStore.getItem<string>(StorageKey.TOKEN, '') || '').trim()
  const payload: H5ReadyPayload = {}
  if (token) {
    payload.token = token
  }
  const safeArea: SafeArea = { top: 0, left: 0, right: 0, bottom: 0, source: '' }
  if (window.__H5_TG_MINI_APP__) {
    safeArea.source = 'telegram'
    safeArea.top = window.__H5_SAFE_AREA_TOP__ || 0
    safeArea.left = window.__H5_SAFE_AREA_LEFT__ || 0
    safeArea.right = window.__H5_SAFE_AREA_RIGHT__ || 0
    safeArea.bottom = window.__H5_SAFE_AREA_BOTTOM__ || 0
  }
  payload.safeArea = safeArea
  return payload
}

function markCcReady(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.__CC_READY__ = true
}

function handleHandshakeMessage(message: BridgeMessage): void {
  if (message.action === BRIDGE_ACTION.CC_READY) {
    log.info('[handshake] recv ccReady', {
      requestId: message.requestId,
      source: message.source,
    })
    markCcReady()
    sendBridgeMessage(BRIDGE_ACTION.H5_ACK, {}, { msgtype: BRIDGE_MSG_TYPE.H5 })
    log.info('[handshake] send h5Ack')
    markBridgeHandshakeDone()
    maybeSendH5Ready()
    return
  }

  if (message.action === BRIDGE_ACTION.CC_ACK) {
    log.info('[handshake] recv ccAck', {
      requestId: message.requestId,
      source: message.source,
    })
    markCcReady()
    markBridgeHandshakeDone()
    return
  }
}

function logCcIncomingAction(message: BridgeMessage, messageSource?: string): void {
  if (messageSource !== CC_WINDOW_SOURCE && messageSource !== COCOS_LEGACY_SOURCE) {
    return
  }
  if (!isNonForwardMessage(message)) {
    return
  }

  logCCToH5.debug({
    action: message.action,
    msgtype: message.msgtype,
    requestId: message.requestId,
    source: messageSource,
    timestamp: message.timestamp,
    payload: payloadForNonForwardLog(message.payload),
  })
}

function handleIncomingMessage(message: BridgeMessage, fallbackSource?: string): void {
  const messageSource = message.source || fallbackSource
  if (messageSource !== CC_WINDOW_SOURCE && messageSource !== COCOS_LEGACY_SOURCE) {
    return
  }

  logCcIncomingAction(message, messageSource)
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
  h5ReadyTime = Date.now()
  maybeSendH5Ready()
}
