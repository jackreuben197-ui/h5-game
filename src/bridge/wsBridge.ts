import {
  BRIDGE_ACTION,
  BRIDGE_MSG_TYPE,
  type BridgeMessage,
  type WsClosePayload,
  type WsConnectPayload,
  type WsClosedPayload,
  type WsErrorPayload,
  type WsMessagePayload,
  type WsOpenPayload,
  type WsSendPayload,
} from './protocol'
import { sendBridgeMessage, subscribeCocosMessages } from './bridge'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'
import {
  HOLDEM_CODE,
  decodeHoldemPacket,
  decodeProtoDebugFields,
  encodeHoldemPacket,
  type HoldemPacketDecodeResult,
} from './holdemPacket'

let ws: WebSocket | null = null
let wsUrl = ''
let stopWsBridgeListener: (() => void) | null = null
let lastHeartbeatLogAt = 0
let heartbeatTimer: number | null = null
const h5WsMessageHandlers = new Set<(event: H5WsIncomingEvent) => void>()
const HEARTBEAT_INTERVAL_MS = 5000

const HOLDEN_CODE_NAME: Record<number, string> = {
  [HOLDEM_CODE.REGISTER]: 'REGISTER',
  [HOLDEM_CODE.HEARTBEAT]: 'HEARTBEAT',
  [HOLDEM_CODE.ENTER_ROOM]: 'ENTER_ROOM',
  [HOLDEM_CODE.LEAVE]: 'LEAVE',
  135: 'CACHE_DATA_UPDATE',
  140: 'ROOM_CHANGE_NOTIFY',
  1108: 'ACTION_ALL',
}

export interface H5WsIncomingEvent {
  dataType: 'text' | 'binary-base64'
  text?: string
  data?: string
  rawBuffer?: ArrayBufferLike
  packet?: HoldemPacketDecodeResult | null
}

export interface H5SendHoldemPacketPayload {
  code: number
  roomId?: number
  matchId?: number
  bodyBase64?: string
  token?: string
}

export interface H5WaitWsPacketOptions {
  roomId?: number
  matchId?: number
  timeoutMs?: number
}

// 从 payload 推导 websocket URL：优先全量 URL，其次端口模板。
function resolveWsUrl(payload: WsConnectPayload): string {
  if (typeof payload.url === 'string' && payload.url.trim()) {
    return payload.url.trim()
  }

  const port = Number(payload.port)
  if (!Number.isFinite(port) || port <= 0) {
    return ''
  }

  // 对齐现网模板：wss://test2.awanptest.com{0}
  const template = (import.meta.env.VITE_WS_URL_TEMPLATE || 'wss://test2.awanptest.com{0}').trim()
  if (template.includes('{0}')) {
    return template.replace('{0}', `:${Math.floor(port)}`)
  }

  return `${template}:${Math.floor(port)}`
}

function emitWsOpen(url: string): void {
  const payload: WsOpenPayload = { url }
  sendBridgeMessage(BRIDGE_ACTION.WS_OPEN, payload, {
    msgtype: BRIDGE_MSG_TYPE.FORWARD,
  })
}

function emitWsMessage(payload: WsMessagePayload): void {
  sendBridgeMessage(BRIDGE_ACTION.WS_MESSAGE, payload, {
    msgtype: BRIDGE_MSG_TYPE.FORWARD,
  })
}

function emitWsError(message: string): void {
  const payload: WsErrorPayload = { message }
  sendBridgeMessage(BRIDGE_ACTION.WS_ERROR, payload, {
    msgtype: BRIDGE_MSG_TYPE.FORWARD,
  })
}

function emitWsClosed(payload: WsClosedPayload): void {
  sendBridgeMessage(BRIDGE_ACTION.WS_CLOSED, payload, {
    msgtype: BRIDGE_MSG_TYPE.FORWARD,
  })
}

// 分发给 H5 业务层订阅者（例如战绩、排行榜等模块自管请求）。
function emitH5WsIncoming(event: H5WsIncomingEvent): void {
  h5WsMessageHandlers.forEach((handler) => {
    handler(event)
  })
}

// 把 ArrayBuffer 转成 base64，便于桥接 JSON 传输。
function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

// 把 base64 还原成 ArrayBuffer，用于透传到 websocket。
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

function isWsOpen(): boolean {
  return Boolean(ws && ws.readyState === WebSocket.OPEN)
}

function getSessionToken(): string {
  return (localStore.getItem<string>(StorageKey.TOKEN, '') || '').trim()
}

function stopHeartbeatLoop(): void {
  if (heartbeatTimer === null) {
    return
  }
  window.clearInterval(heartbeatTimer)
  heartbeatTimer = null
}

function sendHeartbeatPacket(): boolean {
  const token = getSessionToken()
  if (!token) {
    // 登录态失效时避免心跳错误刷屏，等待下次登录恢复。
    return false
  }

  const packet = encodeHoldemPacket({
    code: HOLDEM_CODE.HEARTBEAT,
    token,
    roomId: 0,
    matchId: 0,
    body: new Uint8Array(0),
  })
  return sendWsRaw(packet)
}

function startHeartbeatLoop(): void {
  stopHeartbeatLoop()
  if (!isWsOpen()) {
    return
  }

  // 对齐旧 Cocos 逻辑：连接稳定后固定间隔发送心跳保活。
  heartbeatTimer = window.setInterval(() => {
    if (!isWsOpen()) {
      stopHeartbeatLoop()
      return
    }
    sendHeartbeatPacket()
  }, HEARTBEAT_INTERVAL_MS)
}

// websocket 原始发送入口：统一处理“未连接”报错。
function sendWsRaw(data: string | ArrayBuffer): boolean {
  if (!isWsOpen() || !ws) {
    emitWsError('wsSend 失败：websocket 未连接')
    return false
  }
  ws.send(data)
  return true
}

// H5 查询类业务按需发送 REGISTER，牌桌内协议仍由 Cocos 透传。
export function h5SendRegisterPacket(): boolean {
  const token = getSessionToken()
  if (!token) {
    emitWsError('register skipped: token 为空')
    return false
  }

  const packet = encodeHoldemPacket({
    code: HOLDEM_CODE.REGISTER,
    token,
    roomId: 0,
    matchId: 0,
    body: new Uint8Array(0),
  })

  const sent = sendWsRaw(packet)
  if (sent) {
    console.info('[ws] send register packet (h5 manual)')
  }
  return sent
}

// H5 业务层主动发送文本 WS（不经过 Cocos）。
export function h5SendWsText(text: string): boolean {
  return sendWsRaw(text || '')
}

// H5 业务层主动发送 base64 二进制 WS（不经过 Cocos）。
export function h5SendWsBinaryBase64(data: string): boolean {
  if (!data) {
    emitWsError('h5SendWsBinaryBase64 失败：数据为空')
    return false
  }

  try {
    return sendWsRaw(base64ToArrayBuffer(data))
  } catch {
    emitWsError('h5SendWsBinaryBase64 失败：base64 解析失败')
    return false
  }
}

// H5 业务层主动按 Holdem 包头组包发送（用于查询类请求，不影响 Cocos 透传链路）。
export function h5SendHoldemPacket(payload: H5SendHoldemPacketPayload): boolean {
  const code = Number(payload.code)
  if (!Number.isFinite(code) || code <= 0) {
    emitWsError('h5SendHoldemPacket 失败：code 无效')
    return false
  }

  const roomId = Number(payload.roomId || 0)
  const matchId = Number(payload.matchId || 0)
  const safeRoomId = Number.isFinite(roomId) && roomId > 0 ? Math.floor(roomId) : 0
  const safeMatchId = Number.isFinite(matchId) && matchId > 0 ? Math.floor(matchId) : 0
  const token = (typeof payload.token === 'string' ? payload.token : getSessionToken()).trim()
  if (!token) {
    emitWsError('h5SendHoldemPacket 失败：token 为空')
    return false
  }

  let body = new Uint8Array(0)
  if (payload.bodyBase64) {
    try {
      body = new Uint8Array(base64ToArrayBuffer(payload.bodyBase64))
    } catch {
      emitWsError('h5SendHoldemPacket 失败：bodyBase64 解析失败')
      return false
    }
  }

  const packet = encodeHoldemPacket({
    code: Math.floor(code),
    token,
    roomId: safeRoomId,
    matchId: safeMatchId,
    body,
  })

  return sendWsRaw(packet)
}

// 开发日志：仅用于调试观察，不参与协议业务决策。
function logHoldemPacket(buffer: ArrayBufferLike): void {
  const packet = decodeHoldemPacket(buffer)
  if (!packet) {
    return
  }

  const codeName = HOLDEN_CODE_NAME[packet.code] || 'UNKNOWN'
  const isHeartbeat = packet.code === HOLDEM_CODE.HEARTBEAT

  // 心跳包非常高频，限制日志频率，避免刷屏。
  if (isHeartbeat) {
    const now = Date.now()
    if (now - lastHeartbeatLogAt < 5000) {
      return
    }
    lastHeartbeatLogAt = now
  }

  console.info('[ws][packet]', {
    code: packet.code,
    codeName,
    roomId: packet.roomId,
    matchId: packet.matchId,
    bodyLen: packet.body.length,
    protoFields: packet.body.length ? decodeProtoDebugFields(packet.body, 8) : [],
  })
}

// 二进制入站统一处理：解析日志 + 同步给 Cocos + 分发给 H5 业务层。
function handleBinaryIncoming(buffer: ArrayBufferLike): void {
  const packet = decodeHoldemPacket(buffer)
  logHoldemPacket(buffer)
  const base64 = arrayBufferToBase64(buffer)

  // 心跳包由 H5 自维护，不回传给 Cocos，避免无意义桥接噪音。
  if (!packet || packet.code !== HOLDEM_CODE.HEARTBEAT) {
    emitWsMessage({
      dataType: 'binary-base64',
      data: base64,
    })
  }

  emitH5WsIncoming({
    dataType: 'binary-base64',
    data: base64,
    rawBuffer: buffer,
    packet,
  })
}

function cleanWsHandlers(): void {
  if (!ws) {
    return
  }
  ws.onopen = null
  ws.onmessage = null
  ws.onerror = null
  ws.onclose = null
}

function closeWs(payload?: WsClosePayload): void {
  stopHeartbeatLoop()
  if (!ws) {
    return
  }

  const code = Number(payload?.code)
  const hasCloseCode = Number.isFinite(code) && code >= 1000 && code <= 4999
  const reason = typeof payload?.reason === 'string' ? payload.reason : ''

  try {
    if (hasCloseCode) {
      ws.close(code, reason)
    } else {
      ws.close()
    }
  } catch {
    ws.close()
  }
}

function connectWs(payload: WsConnectPayload): void {
  const targetUrl = resolveWsUrl(payload)
  if (!targetUrl) {
    emitWsError('wsConnect 失败：缺少 websocket url/port')
    return
  }

  // URL 相同且已经在连接/已连接时直接复用。
  if (
    ws &&
    wsUrl === targetUrl &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    // 已连接则直接复用；是否 REGISTER 由业务显式调用 h5SendRegisterPacket 决定。
    return
  }

  // 先关闭旧连接，再重连。
  if (ws) {
    cleanWsHandlers()
    try {
      ws.close()
    } catch {
      // 忽略关闭异常，继续重连。
    }
    ws = null
  }

  wsUrl = targetUrl
  ws = new WebSocket(targetUrl)
  ws.binaryType = 'arraybuffer'

  ws.onopen = () => {
    emitWsOpen(targetUrl)
    // 纯透传默认不自动 REGISTER；需要时由业务显式调用 h5SendRegisterPacket。
    // 但心跳仍由 H5 统一维护，避免桥接空档导致长连接被服务端回收。
    sendHeartbeatPacket()
    startHeartbeatLoop()
  }

  ws.onerror = () => {
    emitWsError('websocket onerror')
  }

  ws.onclose = (event: CloseEvent) => {
    stopHeartbeatLoop()
    emitWsClosed({
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    })
    cleanWsHandlers()
    ws = null
  }

  ws.onmessage = (event: MessageEvent) => {
    const data = event.data
    if (typeof data === 'string') {
      emitWsMessage({
        dataType: 'text',
        text: data,
      })
      emitH5WsIncoming({
        dataType: 'text',
        text: data,
      })
      return
    }

    if (data instanceof ArrayBuffer) {
      handleBinaryIncoming(data)
      return
    }

    if (ArrayBuffer.isView(data)) {
      const view = data as ArrayBufferView
      const buffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength)
      handleBinaryIncoming(buffer)
      return
    }

    if (data instanceof Blob) {
      void data
        .arrayBuffer()
        .then((buffer) => {
          handleBinaryIncoming(buffer)
        })
        .catch(() => {
          emitWsError('websocket message blob parse failed')
        })
    }
  }
}

// 提供给 H5 业务层主动建连（当前登录流程会调用）。
export function ensureWsProxyConnected(payload: WsConnectPayload): void {
  connectWs(payload)
}

// H5 业务层订阅 WS 入站消息（可用于战绩等查询模块独立解析）。
export function subscribeH5WsMessages(handler: (event: H5WsIncomingEvent) => void): () => void {
  h5WsMessageHandlers.add(handler)
  return () => h5WsMessageHandlers.delete(handler)
}

// H5 业务层按协议号等待回包，避免在页面里手动维护复杂监听状态。
export function waitH5WsPacket(
  code: number,
  options: H5WaitWsPacketOptions = {},
): Promise<HoldemPacketDecodeResult> {
  const targetCode = Number(code)
  const targetRoomId = Number(options.roomId || 0)
  const targetMatchId = Number(options.matchId || 0)
  const timeoutMs = Number(options.timeoutMs || 6000)

  if (!Number.isFinite(targetCode) || targetCode <= 0) {
    return Promise.reject(new Error('waitH5WsPacket 失败：code 无效'))
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = subscribeH5WsMessages((event) => {
      if (!event.packet) {
        return
      }

      const packet = event.packet
      if (packet.code !== targetCode) {
        return
      }
      if (targetRoomId > 0 && packet.roomId !== targetRoomId) {
        return
      }
      if (targetMatchId > 0 && packet.matchId !== targetMatchId) {
        return
      }

      window.clearTimeout(timer)
      unsubscribe()
      resolve(packet)
    })

    const timer = window.setTimeout(() => {
      unsubscribe()
      reject(new Error(`waitH5WsPacket 超时：code=${targetCode}`))
    }, timeoutMs)
  })
}

function sendWs(payload: WsSendPayload): void {
  if (payload.dataType === 'text') {
    sendWsRaw(payload.text || '')
    return
  }

  if (payload.dataType === 'binary-base64') {
    if (!payload.data) {
      emitWsError('wsSend 失败：binary-base64 数据为空')
      return
    }
    try {
      sendWsRaw(base64ToArrayBuffer(payload.data))
    } catch {
      emitWsError('wsSend 失败：binary-base64 解析失败')
    }
    return
  }

  // 兜底：防止 Cocos 传入未知 dataType。
  const unknownType = String((payload as { dataType?: unknown }).dataType || '')
  emitWsError(`wsSend 失败：unsupported dataType=${unknownType}`)
}

function onCocosBridgeMessage(message: BridgeMessage): void {
  if (message.action === BRIDGE_ACTION.WS_CONNECT) {
    connectWs((message.payload || {}) as WsConnectPayload)
    return
  }

  if (message.action === BRIDGE_ACTION.WS_SEND) {
    sendWs((message.payload || {}) as WsSendPayload)
    return
  }

  if (message.action === BRIDGE_ACTION.WS_CLOSE) {
    closeWs((message.payload || {}) as WsClosePayload)
    return
  }

  if (message.action === 'exitTable') {
    // 纯透传模式：离桌消息仅做日志，具体离桌协议包由 Cocos 发送 wsSend(binary-base64)。
    console.info('[ws] exitTable received (passthrough mode), no websocket packet is sent by H5')
  }
}

// 提供给 H5 业务层主动断连（如退出登录/登录失效）。
export function closeWsProxy(payload?: WsClosePayload): void {
  closeWs(payload)
}

// 启动 WS 代理桥接：监听 Cocos 指令并执行 websocket 透传。
export function setupWsProxyBridgeChannel(): () => void {
  if (stopWsBridgeListener) {
    return stopWsBridgeListener
  }

  const unsubscribe = subscribeCocosMessages(onCocosBridgeMessage, {
    msgtype: BRIDGE_MSG_TYPE.FORWARD,
  })
  stopWsBridgeListener = () => {
    unsubscribe()
    closeWs()
    stopHeartbeatLoop()
    cleanWsHandlers()
    ws = null
    wsUrl = ''
    stopWsBridgeListener = null
  }

  return stopWsBridgeListener
}
