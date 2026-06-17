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
  type WsReconnectFailedPayload,
  type WsReconnectedPayload,
  type WsReconnectingPayload,
  type WsSendPayload,
  type SetHeartbeatModePayload,
} from '@bridge-protocol'
import { sendBridgeMessage, subscribeCocosMessages } from '../core/cocosBridgeChannel'
import StorageKey from '@/constants/storageKey'
import { t } from '@/i18n'
import { showFailToast } from 'vant'
import { useGameStore } from '@/stores/game'
import { useLoginModalStore } from '@/stores/loginModal'
import { pinia } from '@/stores/pinia'
import { localStore } from '@/utils/localStore'
import { appConfig } from '@/utils/appConfig'
import { createLogger } from '@/utils/logger'
import {
  decodeHoldemCode,
  decodeHoldemPacket,
  encodeHoldemPacket,
  type HoldemPacketDecodeResult,
} from './holdemPacket'
import { Code } from '@holdem-pb'

const log = createLogger('[ws]')
const logSend = createLogger('[wsSend]')
const logRecv = createLogger('[wsRecv]')

let ws: WebSocket | null = null
let wsUrl = ''
let stopWsBridgeListener: (() => void) | null = null
let lastHeartbeatLogAt = 0
let lastSendHeartbeatLogAt = 0
let heartbeatTimer: number | null = null
let reconnectTimer: number | null = null
let reconnectAttempts = 0
let shouldAutoReconnect = false
let authRedirecting = false
// 重连状态机：idle=未启动 / open=已连接 / reconnecting=断开后进入重连流程 / failed=已放弃。
type ReconnectState = 'idle' | 'open' | 'reconnecting' | 'failed'
let reconnectState: ReconnectState = 'idle'
// 第一次失败时刻，用于计算整体超时。
let firstFailedAt = 0
// 连续未收到响应的心跳次数（参照 Unity CPGameHeartbeatComponent._sendCount）。
let pendingHeartbeatCount = 0
let pageLifecycleBound = false
// 下一次 wsReconnecting 通知的触发原因。
let nextReconnectReason: WsReconnectingPayload['reason'] = 'close'
const h5WsMessageHandlers = new Set<(event: H5WsIncomingEvent) => void>()
// 心跳间隔对齐 Cocos HeartbeatComponent：
//   normal (牌桌外)      = 5000ms
//   in-gameplay (牌桌内) = 1000ms
// Cocos 通过 setHeartbeatMode 桥接动作通知 H5 切换。
const HEARTBEAT_INTERVAL_NORMAL_MS = 5000
const HEARTBEAT_INTERVAL_IN_GAMEPLAY_MS = 1000
let heartbeatIntervalMs = HEARTBEAT_INTERVAL_NORMAL_MS
let heartbeatMode: 'normal' | 'in-gameplay' = 'normal'
const HEARTBEAT_LOG_INTERVAL_MS = 10000
const WS_RECONNECT_BASE_DELAY_MS = 1000
const WS_RECONNECT_MAX_DELAY_MS = 10000
// 重连放弃阈值（对齐用户确认：10 次或 60s 整体超时）。
const WS_RECONNECT_MAX_ATTEMPTS = 10
const WS_RECONNECT_MAX_DURATION_MS = 60000
// 心跳无响应触发主动重连的阈值（对齐 Unity 的 5 次）。
const HEARTBEAT_MAX_PENDING = 5
// 页面在后台累计超过该时长后，回前台一律强制重连，避免 readyState 假阳性。
// 原值 30s 实际复现过"锁屏 20s 后 readyState 仍报 OPEN 但 TCP 已死"的死区，
// 收紧到 10s 抢在 cocos 心跳超时（最长 25s）和用户触屏（点击进牌桌）之前。
const RECONNECT_AFTER_HIDDEN_MS = 10000
// 记录最近一次 visibility 变成 hidden 的时间戳；0 表示当前没在后台。
let hiddenAt = 0

const HOLDEN_CODE_NAME: Record<number, string> = {
  [Code.MSG_D_REGISTER]: 'REGISTER',
  [Code.MSG_D_HEARTBEAT]: 'HEARTBEAT',
  [Code.MSG_D_ENTER_ROOM]: 'ENTER_ROOM',
  [Code.MSG_D_LEAVE]: 'LEAVE',
  [Code.MSG_S_CACHE_DATA_UPDATE]: 'CACHE_DATA_UPDATE',
  [Code.MSG_S_ROOM_CHANGE_NOTIFY]: 'ROOM_CHANGE_NOTIFY',
  [Code.MSG_S_USER_MTT_CHANGE_NOTIFY]: 'USER_MTT_CHANGE_NOTIFY',
  [Code.MSG_S_USER_SNG_CHANGE_NOTIFY]: 'USER_SNG_CHANGE_NOTIFY',
  [Code.MSG_S_MTT_SERIES_NOTIFY]: 'MTT_SERIES_NOTIFY',
  [Code.MSG_S_ACTION_ALL]: 'ACTION_ALL',
}

export interface H5WsIncomingEvent {
  dataType: 'text' | 'binary'
  text?: string
  data?: ArrayBufferLike
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

// 默认 websocket 域名模板：与 API 走同一来源（运行时 config.json 的 baseApi），
// 这样测试/正式环境只需各自部署对应的 config.json，websocket 就会跟随后端域名，
// 不会再回落到写死的测试域名（如正式环境 https://ccsgame.recognitionway.com）。
// 优先级：config.json baseApi（绝对地址）→ 兜底测试域名。
// 注意：刻意不回落到页面来源（window.location）。本项目页面常与后端不同域
//   （如 Cocos 本地预览 localhost:7456、测试 test2-game.awanptest.com），
//   用页面来源既会连错地址，页面端口也会与后端端口拼成非法 URL（ws://localhost:7456:15003）。
function getDefaultWsTemplate(): string {
  // 仅接受绝对地址（http(s)://域名），避免相对路径 /api 误解析到页面来源。
  const baseApi = (appConfig.baseApi || appConfig.apiDomains[0] || '').trim()
  if (/^https?:\/\//i.test(baseApi)) {
    try {
      const apiUrl = new URL(baseApi)
      if (apiUrl.hostname) {
        // 用 hostname（不含端口），websocket 端口由后端 /user/ws 下发后再追加。
        const wsProtocol = apiUrl.protocol === 'https:' ? 'wss' : 'ws'
        return `${wsProtocol}://${apiUrl.hostname}{0}`
      }
    } catch {
      // baseApi 解析失败时回落到兜底域名。
    }
  }

  // 兜底测试域名（本地 Cocos 预览 / 未配置 config.json 等场景）。
  return 'wss://preview.trackyourchoice.com{0}'
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

  const template = (import.meta.env.VITE_WS_URL_TEMPLATE || getDefaultWsTemplate()).trim()
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

function emitWsReconnecting(payload: WsReconnectingPayload): void {
  sendBridgeMessage(BRIDGE_ACTION.WS_RECONNECTING, payload, {
    msgtype: BRIDGE_MSG_TYPE.H5,
  })
}

function emitWsReconnected(payload: WsReconnectedPayload): void {
  sendBridgeMessage(BRIDGE_ACTION.WS_RECONNECTED, payload, {
    msgtype: BRIDGE_MSG_TYPE.H5,
  })
}

function emitWsReconnectFailed(payload: WsReconnectFailedPayload): void {
  sendBridgeMessage(BRIDGE_ACTION.WS_RECONNECT_FAILED, payload, {
    msgtype: BRIDGE_MSG_TYPE.H5,
  })
}

// 分发给 H5 业务层订阅者（例如战绩、排行榜等模块自管请求）。
function emitH5WsIncoming(event: H5WsIncomingEvent): void {
  h5WsMessageHandlers.forEach((handler) => {
    handler(event)
  })
}

// 把 ArrayBuffer 转成 base64（仅用于日志预览）。
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

function uint8ArrayToBase64Preview(bytes: Uint8Array, maxBytes = 96): string {
  if (!bytes.length) {
    return ''
  }
  const preview = bytes.subarray(0, Math.min(bytes.length, maxBytes))
  return arrayBufferToBase64(
    preview.buffer.slice(preview.byteOffset, preview.byteOffset + preview.byteLength),
  )
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

function hasSessionToken(): boolean {
  return Boolean(getSessionToken())
}

// websocket 链路统一鉴权兜底：发现 token 缺失时，清理状态并打开登录弹窗。
async function forceToLoginFromWs(reason: string): Promise<void> {
  if (authRedirecting) {
    return
  }
  authRedirecting = true
  log.warn('force to login:', reason)

  shouldAutoReconnect = false
  clearReconnectTimer()
  stopHeartbeatLoop()
  cleanWsHandlers()
  if (ws) {
    try {
      ws.close(1000, 'auth invalid')
    } catch {
      // 忽略关闭异常，保证后续清理流程继续执行。
    }
    ws = null
  }
  wsUrl = ''

  // 鉴权失败属于不可恢复的重连放弃路径，告知 Cocos 让上层关闭重连遮罩。
  giveUpReconnect('auth-invalid')

  const gameStore = useGameStore(pinia)
  gameStore.clearLogin()

  // 登录态失效时原地弹出登录弹窗 + 文案提示，不强制跳页。
  showFailToast(t('tokenFail'))
  useLoginModalStore(pinia).open()

  authRedirecting = false
}

// 统一的放弃重连出口：emit wsReconnectFailed + 重置状态。
function giveUpReconnect(reason: WsReconnectFailedPayload['reason']): void {
  // 已经放弃过 → 不重复通知。
  if (reconnectState === 'failed') {
    return
  }
  // 从未真正进入重连流程 → 静默重置，不打扰 Cocos。
  if (firstFailedAt === 0) {
    log.info('giveUpReconnect: never entered reconnecting, silent reset', { reason })
    reconnectState = 'idle'
    shouldAutoReconnect = false
    clearReconnectTimer()
    return
  }
  const durationMs = Date.now() - firstFailedAt
  log.warn('reconnect give up', { reason, attempts: reconnectAttempts, durationMs })
  emitWsReconnectFailed({
    reason,
    attempts: reconnectAttempts,
    durationMs,
  })
  reconnectState = 'failed'
  shouldAutoReconnect = false
  clearReconnectTimer()
  firstFailedAt = 0
  reconnectAttempts = 0
}

function toBufferLike(data: ArrayBuffer | ArrayBufferView | Blob): ArrayBufferLike | null {
  if (data instanceof ArrayBuffer) {
    return data
  }
  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView
    return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength)
  }
  return null
}

function logWsOutgoing(data: string | ArrayBuffer | ArrayBufferView | Blob, context: string): void {
  if (typeof data === 'string') {
    logSend.debug({ context, length: data.length, preview: data.slice(0, 120) })
    return
  }

  if (data instanceof Blob) {
    logSend.debug({ context, byteLength: data.size, note: 'blob' })
    return
  }

  const raw = toBufferLike(data)
  if (!raw) {
    logSend.debug({ context, note: 'unknown-buffer-like' })
    return
  }

  const packet = decodeHoldemPacket(raw)
  if (packet) {
    const isHeartbeat = packet.code === Code.MSG_D_HEARTBEAT
    if (isHeartbeat) {
      const now = Date.now()
      if (now - lastSendHeartbeatLogAt < HEARTBEAT_LOG_INTERVAL_MS) {
        return
      }
      lastSendHeartbeatLogAt = now
    }

    const codeName = HOLDEN_CODE_NAME[packet.code] || 'UNKNOWN'
    logSend.debug({
      context,
      code: packet.code,
      codeName,
      token: packet.token,
      roomId: packet.roomId,
      matchId: packet.matchId,
      protoVersion: packet.protoVersion,
      bodyLen: packet.body.length,
    })
    return
  }

  const bytes = new Uint8Array(raw)
  logSend.debug({ context, byteLength: bytes.length })
}

function clearReconnectTimer(): void {
  if (reconnectTimer === null) {
    return
  }
  window.clearTimeout(reconnectTimer)
  reconnectTimer = null
}

function getReconnectDelay(attempt: number): number {
  const expDelay = WS_RECONNECT_BASE_DELAY_MS * Math.pow(2, Math.max(0, attempt - 1))
  return Math.min(expDelay, WS_RECONNECT_MAX_DELAY_MS)
}

function scheduleReconnect(): void {
  if (!shouldAutoReconnect || !wsUrl || reconnectTimer !== null) {
    return
  }

  if (firstFailedAt === 0) {
    firstFailedAt = Date.now()
  }

  // 命中整体超时：直接放弃。
  if (Date.now() - firstFailedAt >= WS_RECONNECT_MAX_DURATION_MS) {
    giveUpReconnect('overall-timeout')
    return
  }

  // 命中次数上限：直接放弃。
  if (reconnectAttempts >= WS_RECONNECT_MAX_ATTEMPTS) {
    giveUpReconnect('max-attempts')
    return
  }

  reconnectAttempts += 1
  reconnectState = 'reconnecting'
  const delay = getReconnectDelay(reconnectAttempts)
  const reason = nextReconnectReason
  // 下一次默认走 close 分支，由具体触发点（heartbeat/visibility/online/force）覆盖。
  nextReconnectReason = 'close'
  log.info('reconnect scheduled', { attempt: reconnectAttempts, delayMs: delay, reason, url: wsUrl })
  emitWsReconnecting({ attempt: reconnectAttempts, delayMs: delay, reason })

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null
    if (!shouldAutoReconnect || !wsUrl) {
      return
    }
    connectWs({ url: wsUrl })
  }, delay)
}

// 主动触发一次立即重连（visibility/online/force/heartbeat 超时统一入口）。
function triggerReconnect(reason: WsReconnectingPayload['reason']): void {
  if (!wsUrl) {
    log.info('triggerReconnect skipped: no wsUrl', { reason })
    return
  }
  log.info('triggerReconnect', {
    reason,
    state: reconnectState,
    wsReady: ws?.readyState,
    pendingHeartbeats: pendingHeartbeatCount,
    attempts: reconnectAttempts,
  })
  if (reconnectState === 'failed') {
    // 已放弃；新的触发要求清掉旧的失败状态再重试。
    reconnectState = 'idle'
    firstFailedAt = 0
    reconnectAttempts = 0
  }
  shouldAutoReconnect = true
  nextReconnectReason = reason
  pendingHeartbeatCount = 0
  clearReconnectTimer()
  // 已经打开就不重复触发。
  if (isWsOpen()) {
    log.info('triggerReconnect skipped: ws already open', { reason })
    return
  }
  // 关闭旧连接，让 onclose 走 scheduleReconnect。
  if (ws) {
    log.info('triggerReconnect: closing stale ws to trigger reconnect path', { reason })
    try {
      ws.close()
    } catch {
      // 忽略关闭异常。
    }
    return
  }
  scheduleReconnect()
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
    // 心跳阶段发现登录态丢失时，直接回登录，避免 WS 与页面状态不一致。
    void forceToLoginFromWs('heartbeat token empty')
    return false
  }

  const packet = encodeHoldemPacket({
    code: Code.MSG_D_HEARTBEAT,
    token,
    roomId: 0,
    matchId: 0,
    body: new Uint8Array(0),
  })
  const sent = sendWsRaw(packet, 'h5-heartbeat')
  if (sent) {
    pendingHeartbeatCount += 1
    // 累计未响应 ≥ 2 时即开始预警，方便观察弱网/堵塞渐进式恶化的过程。
    if (pendingHeartbeatCount >= 2) {
      log.warn('heartbeat pending accumulating', {
        pending: pendingHeartbeatCount,
        threshold: HEARTBEAT_MAX_PENDING,
      })
    }
  }
  return sent
}

function startHeartbeatLoop(): void {
  stopHeartbeatLoop()
  if (!isWsOpen()) {
    return
  }
  pendingHeartbeatCount = 0

  // 对齐旧 Cocos 逻辑：连接稳定后固定间隔发送心跳保活。
  heartbeatTimer = window.setInterval(() => {
    if (!isWsOpen()) {
      stopHeartbeatLoop()
      return
    }
    // 连续未响应阈值达到 → 主动断开触发重连（对齐 Unity 5 次未响应）。
    if (pendingHeartbeatCount >= HEARTBEAT_MAX_PENDING) {
      log.warn('heartbeat no response, trigger reconnect', { pending: pendingHeartbeatCount })
      triggerReconnect('heartbeat')
      return
    }
    sendHeartbeatPacket()
  }, heartbeatIntervalMs)
}

// Cocos 通过 setHeartbeatMode 桥接动作通知 H5 切换心跳频率。
// 仅当模式真正变化时重启 heartbeat 定时器，避免重复打断。
function applyHeartbeatMode(mode: 'normal' | 'in-gameplay'): void {
  const targetInterval =
    mode === 'in-gameplay' ? HEARTBEAT_INTERVAL_IN_GAMEPLAY_MS : HEARTBEAT_INTERVAL_NORMAL_MS
  if (heartbeatMode === mode && heartbeatIntervalMs === targetInterval) {
    return
  }
  heartbeatMode = mode
  heartbeatIntervalMs = targetInterval
  log.info('heartbeat mode changed', { mode, intervalMs: heartbeatIntervalMs })
  // 仅在 WS 已连接且心跳循环活跃时立即重启；未连接时新间隔会在 startHeartbeatLoop 调用时生效。
  if (heartbeatTimer !== null) {
    startHeartbeatLoop()
  }
}

// websocket 原始发送入口：统一处理“未连接”报错。
function sendWsRaw(
  data: string | ArrayBuffer | ArrayBufferView | Blob,
  context = 'unknown',
): boolean {
  if (!isWsOpen() || !ws) {
    emitWsError('wsSend 失败：websocket 未连接')
    return false
  }
  logWsOutgoing(data, context)
  ws.send(data as string | Blob | BufferSource)
  return true
}

// H5 查询类业务按需发送 REGISTER，牌桌内协议仍由 Cocos 透传。
export function h5SendRegisterPacket(): boolean {
  const token = getSessionToken()
  if (!token) {
    emitWsError('register skipped: token 为空')
    void forceToLoginFromWs('register token empty')
    return false
  }

  const packet = encodeHoldemPacket({
    code: Code.MSG_D_REGISTER,
    token,
    roomId: 0,
    matchId: 0,
    body: new Uint8Array(0),
  })

  const sent = sendWsRaw(packet, 'h5-register')
  if (sent) {
    log.info('send register packet')
  }
  return sent
}

// H5 业务层主动发送文本 WS（不经过 Cocos）。
export function h5SendWsText(text: string): boolean {
  return sendWsRaw(text || '', 'h5-text')
}

// H5 业务层主动发送 base64 二进制 WS（不经过 Cocos）。
export function h5SendWsBinaryBase64(data: string): boolean {
  if (!data) {
    emitWsError('h5SendWsBinaryBase64 失败：数据为空')
    return false
  }

  try {
    return sendWsRaw(base64ToArrayBuffer(data), 'h5-binary-base64')
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
    void forceToLoginFromWs('h5SendHoldemPacket token empty')
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

  return sendWsRaw(packet, 'h5-holdem-packet')
}

// 开发日志：仅解析 code 供观测与分流，不参与转发数据构造。
function logHoldemPacket(
  buffer: ArrayBufferLike,
  packet: HoldemPacketDecodeResult | null = null,
): number | null {
  const decodedPacket = packet || decodeHoldemPacket(buffer)
  if (!decodedPacket) {
    const bytes = new Uint8Array(buffer)
    logRecv.warn('code decode failed', { byteLength: bytes.length })
    return null
  }

  const code = decodedPacket.code
  const body = decodedPacket.body
  const codeName = HOLDEN_CODE_NAME[code] || 'UNKNOWN'
  const isHeartbeat = code === Code.MSG_D_HEARTBEAT

  // 心跳包非常高频，限制日志频率，避免刷屏。
  if (isHeartbeat) {
    const now = Date.now()
    if (now - lastHeartbeatLogAt < HEARTBEAT_LOG_INTERVAL_MS) {
      return code
    }
    lastHeartbeatLogAt = now
  }

  logRecv.debug({
    code,
    codeName,
    bodyLen: body.length,
    bodyBase64Preview: uint8ArrayToBase64Preview(body),
  })
  return code
}

// 二进制入站统一处理：解析日志 + 同步给 Cocos + 分发给 H5 业务层。
function handleBinaryIncoming(buffer: ArrayBufferLike): void {
  const packet = decodeHoldemPacket(buffer)
  const code = logHoldemPacket(buffer, packet)
  const passthroughBuffer = new Uint8Array(buffer).slice().buffer

  // 收到心跳响应即认为链路活着，复位无响应计数（对齐 Unity 的 _sendCount = 0）。
  if (code === Code.MSG_D_HEARTBEAT) {
    if (pendingHeartbeatCount >= 2) {
      log.info('heartbeat recovered', { previousPending: pendingHeartbeatCount })
    }
    pendingHeartbeatCount = 0
  }

  // 心跳包由 H5 自维护，不回传给 Cocos；其余一律透传服务器原始字节。
  if (code !== Code.MSG_D_HEARTBEAT) {
    emitWsMessage({
      dataType: 'binary',
      data: passthroughBuffer,
    })
  }

  emitH5WsIncoming({
    dataType: 'binary',
    data: passthroughBuffer,
    rawBuffer: passthroughBuffer,
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
  log.info('closeWs (active close)', {
    code: payload?.code,
    reason: payload?.reason,
    hadWs: !!ws,
    wsReady: ws?.readyState,
  })
  shouldAutoReconnect = false
  clearReconnectTimer()
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

  log.info('ws connect start', { url: targetUrl, force: !!payload.force })

  // 无 token 时不建立 websocket，但也不弹登录——未登录是 guest 页正常状态，登录后 Cocos 会再次触发 wsConnect。
  if (!hasSessionToken()) {
    log.info('wsConnect skipped: token empty, waiting login')
    return
  }

  shouldAutoReconnect = true
  clearReconnectTimer()
  bindPageLifecycleListeners()

  // Cocos 主动 force 重连：复位失败状态，让本次重连重新开始计数与计时。
  if (payload.force) {
    reconnectState = 'idle'
    firstFailedAt = 0
    reconnectAttempts = 0
    nextReconnectReason = 'force'
  }

  // URL 相同且已经在连接/已连接时直接复用。
  if (
    !payload.force &&
    ws &&
    wsUrl === targetUrl &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    // 已连接则直接复用；REGISTER 会在新连接 open 时自动发送。
    log.info('wsConnect reuse existing', { url: targetUrl, readyState: ws.readyState })
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
    log.info('ws open', { url: targetUrl })
    clearReconnectTimer()
    // 本次开启之前是否经历过重连（失败 → 成功），用于决定是否广播 wsReconnected。
    const wasReconnecting = reconnectState === 'reconnecting' || firstFailedAt > 0
    const finishedAttempt = reconnectAttempts
    const durationMs = firstFailedAt > 0 ? Date.now() - firstFailedAt : 0
    reconnectAttempts = 0
    firstFailedAt = 0
    reconnectState = 'open'
    pendingHeartbeatCount = 0
    emitWsOpen(targetUrl)
    // 对齐 Cocos：连接建立后先发 REGISTER，再启动心跳。
    const registerSent = h5SendRegisterPacket()
    if (!registerSent) {
      emitWsError('ws open 后 REGISTER 发送失败：token 为空或连接异常')
      try {
        ws?.close(1008, 'register failed')
      } catch {
        // 忽略关闭异常，交由 onclose/reconnect 接管。
      }
      return
    }
    sendHeartbeatPacket()
    startHeartbeatLoop()
    if (wasReconnecting) {
      log.info('ws reconnected', { url: targetUrl, attempt: finishedAttempt, durationMs })
      emitWsReconnected({
        url: targetUrl,
        attempt: finishedAttempt,
        durationMs,
      })
    }
  }

  ws.onerror = () => {
    log.warn('ws onerror', { url: targetUrl })
    emitWsError('websocket onerror')
  }

  ws.onclose = (event: CloseEvent) => {
    log.warn('ws close', {
      url: targetUrl,
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    })
    stopHeartbeatLoop()
    emitWsClosed({
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    })
    cleanWsHandlers()
    ws = null
    // 重连原因尚未被外部覆盖（visibility/online/force）时，默认归为 close。
    if (nextReconnectReason === 'close' && reconnectState !== 'reconnecting') {
      reconnectState = 'reconnecting'
    }
    scheduleReconnect()
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

// 切回前台 / 网络恢复时按以下规则触发重连（对齐 Unity 的 OnApplicationPause + Internet 检测）：
//   1. 切到后台：记录时间戳，不做动作
//   2. 回到前台 + WS 已断开：立即重连
//   3. 回到前台 + 后台累计 >= 30s：强制重连（readyState 在长时间挂起后不可信）
function onPageVisible(): void {
  if (typeof document === 'undefined') {
    return
  }
  if (document.visibilityState === 'hidden') {
    hiddenAt = Date.now()
    return
  }
  if (document.visibilityState !== 'visible' || !wsUrl) {
    return
  }
  const hiddenDurationMs = hiddenAt ? Date.now() - hiddenAt : 0
  hiddenAt = 0
  const wsOpen = isWsOpen()
  if (wsOpen && hiddenDurationMs < RECONNECT_AFTER_HIDDEN_MS) {
    return
  }
  log.info('page visible, force reconnect', { hiddenDurationMs, wsOpen })
  triggerReconnect('visibility')
}

function onNetworkOnline(): void {
  if (!wsUrl || isWsOpen()) {
    return
  }
  log.info('network online, force reconnect')
  triggerReconnect('online')
}

function bindPageLifecycleListeners(): void {
  if (pageLifecycleBound || typeof window === 'undefined') {
    return
  }
  pageLifecycleBound = true
  document.addEventListener('visibilitychange', onPageVisible)
  window.addEventListener('online', onNetworkOnline)
}

function unbindPageLifecycleListeners(): void {
  if (!pageLifecycleBound || typeof window === 'undefined') {
    return
  }
  pageLifecycleBound = false
  document.removeEventListener('visibilitychange', onPageVisible)
  window.removeEventListener('online', onNetworkOnline)
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
      if (!event.rawBuffer) {
        return
      }

      const packetCode = decodeHoldemCode(event.rawBuffer)
      if (packetCode !== targetCode) {
        return
      }

      const packet = decodeHoldemPacket(event.rawBuffer)
      if (!packet) {
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
  log.debug('bridge wsSend received', {
    dataType: payload.dataType,
  })

  if (payload.dataType === 'text') {
    sendWsRaw(payload.text || '', 'bridge-wsSend-text')
    return
  }

  if (payload.dataType === 'binary') {
    const data = payload.data
    if (!(data instanceof ArrayBuffer) && !ArrayBuffer.isView(data) && !(data instanceof Blob)) {
      emitWsError('wsSend 失败：binary 数据为空或类型无效')
      return
    }
    // 直发 Cocos 原始二进制，不做中间解析/重建。
    sendWsRaw(data, 'bridge-wsSend-binary')
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
    // 纯透传模式：离桌消息仅做日志，具体离桌协议包由 Cocos 发送 wsSend(binary)。
    log.info('exitTable received (passthrough mode), no websocket packet is sent by H5')
    return
  }

  if (message.action === BRIDGE_ACTION.SET_HEARTBEAT_MODE) {
    const payload = (message.payload || {}) as Partial<SetHeartbeatModePayload>
    const mode: 'normal' | 'in-gameplay' = payload.mode === 'in-gameplay' ? 'in-gameplay' : 'normal'
    applyHeartbeatMode(mode)
    return
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
    shouldAutoReconnect = false
    clearReconnectTimer()
    closeWs()
    stopHeartbeatLoop()
    cleanWsHandlers()
    unbindPageLifecycleListeners()
    ws = null
    wsUrl = ''
    reconnectState = 'idle'
    firstFailedAt = 0
    reconnectAttempts = 0
    pendingHeartbeatCount = 0
    nextReconnectReason = 'close'
    stopWsBridgeListener = null
  }

  return stopWsBridgeListener
}
