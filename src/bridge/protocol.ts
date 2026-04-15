// H5 与 Cocos 共用的桥接动作定义。
export const BRIDGE_ACTION = {
  ENTER_TABLE: 'enterTable',
  EXIT_TABLE: 'exitTable',
  SYNC_USER: 'syncUser',
  COCOS_ACK: 'cocosAck',
  SHOW_TOAST: 'showToast',
} as const

export type BridgeAction = (typeof BRIDGE_ACTION)[keyof typeof BRIDGE_ACTION]

// 请求进入牌桌时发送给 Cocos 的负载。
export interface EnterTablePayload {
  userName: string
  userId: string
  token: string
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
