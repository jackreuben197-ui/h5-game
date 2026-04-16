// H5 与 Cocos 共用的桥接动作定义。
export const BRIDGE_ACTION = {
  ENTER_TABLE: 'enterTable',
  SYNC_USER: 'syncUser',
  SHOW_TOAST: 'showToast',
  // Cocos -> H5：要求 H5 建立/发送/关闭 websocket。
  WS_CONNECT: 'wsConnect',
  WS_SEND: 'wsSend',
  WS_CLOSE: 'wsClose',
  // H5 -> Cocos：同步 websocket 生命周期与消息。
  WS_OPEN: 'wsOpen',
  WS_MESSAGE: 'wsMessage',
  WS_ERROR: 'wsError',
  WS_CLOSED: 'wsClosed',
} as const

export type BridgeAction = (typeof BRIDGE_ACTION)[keyof typeof BRIDGE_ACTION]

// Cocos -> H5：连接 websocket 请求。
export interface WsConnectPayload {
  // 优先使用完整 URL。
  url?: string
  // 或者传端口，H5 根据模板拼接（如 wss://host{0}）。
  port?: number
}

// Cocos -> H5：发送 websocket 文本消息。
export interface WsSendTextPayload {
  dataType: 'text'
  text?: string
}

// Cocos -> H5：发送 websocket 二进制（base64）消息。
export interface WsSendBinaryPayload {
  dataType: 'binary-base64'
  data?: string
}

// Cocos -> H5：通用 websocket 发送负载。
export type WsSendPayload = WsSendTextPayload | WsSendBinaryPayload

// Cocos -> H5：关闭 websocket 请求。
export interface WsClosePayload {
  code?: number
  reason?: string
}

// H5 -> Cocos：websocket 已连接。
export interface WsOpenPayload {
  url: string
}

// H5 -> Cocos：websocket 收到消息。
export interface WsMessagePayload {
  dataType: 'text' | 'binary-base64'
  text?: string
  data?: string
}

// H5 -> Cocos：websocket 错误消息。
export interface WsErrorPayload {
  message: string
}

// H5 -> Cocos：websocket 已关闭。
export interface WsClosedPayload {
  code?: number
  reason?: string
  wasClean?: boolean
}

// 请求进入牌桌时发送给 Cocos 的负载。
export interface EnterTablePayload {
  userName: string
  userId: string
  token: string
  // websocket 端口（来自 /api/user/ws 的 data.port）。
  websocketPort: number
  from: 'h5-lobby'
  // 点击的目标房间 ID，方便 Cocos 精确切桌；Cocos 不需要时可忽略。
  roomId?: string
  // 点击的目标房间名称，主要用于日志/埋点排查。
  roomName?: string
}

// 用户信息变化后的可选同步负载。
export interface SyncUserPayload {
  uid: string
  nickname: string
  avatar?: string
}

// Cocos 回执通用负载。
export interface CocosAckPayload {
  ok: boolean
  message: string
}

// Cocos -> H5 的全局 toast 消息负载。
export interface CocosToastPayload {
  // success: 成功提示；danger: 失败/风险提示。
  type: 'success' | 'danger'
  // 展示文案。
  message: string
  // 可选显示时长（毫秒）。
  duration?: number
}

// 所有桥接消息统一信封结构。
export interface BridgeMessage<TPayload = unknown> {
  action: BridgeAction | string
  payload: TPayload
  requestId: string
  timestamp: number
}

// 生成带 requestId 和 timestamp 的标准消息，便于排查与去重。
export function createBridgeMessage<TPayload>(
  action: BridgeAction,
  payload: TPayload,
): BridgeMessage<TPayload> {
  return {
    action,
    payload,
    requestId: `h5_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
  }
}

// 将桥接消息序列化成可传输字符串。
export function toBridgeRaw(message: BridgeMessage): string {
  return JSON.stringify(message)
}

// 解析 scheme 形式数据，例如 cocos://bridge?data=<encoded-json>。
function parseSchemeRaw(raw: string): string {
  if (!raw.startsWith('cocos://')) {
    return raw
  }

  try {
    const parsed = new URL(raw)
    return parsed.searchParams.get('data') ?? raw
  } catch {
    const marker = 'data='
    const idx = raw.indexOf(marker)
    if (idx === -1) {
      return raw
    }
    return raw.slice(idx + marker.length)
  }
}

// 将原始字符串解析为合法的桥接消息对象。
export function parseBridgeRaw(raw: string): BridgeMessage | null {
  if (!raw) {
    return null
  }

  const schemeHandled = parseSchemeRaw(raw)
  const maybeDecoded =
    schemeHandled.includes('%7B') || schemeHandled.includes('%22')
      ? decodeURIComponent(schemeHandled)
      : schemeHandled

  try {
    const parsed = JSON.parse(maybeDecoded) as Partial<BridgeMessage>
    if (!parsed || typeof parsed !== 'object' || !parsed.action) {
      return null
    }

    // 兼容 Cocos 简化消息：如果没带 requestId/timestamp，则由 H5 自动补齐。
    return {
      action: String(parsed.action),
      payload: parsed.payload,
      requestId:
        typeof parsed.requestId === 'string'
          ? parsed.requestId
          : `cocos_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
    }
  } catch {
    return null
  }
}
