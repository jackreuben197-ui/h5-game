import {
  BRIDGE_MSG_TYPE,
  normalizeBridgeMsgType,
  type BridgeAction,
  type BridgeMsgType,
} from './actions'

// 所有桥接消息统一信封结构。
export interface BridgeMessage<TPayload = unknown> {
  action: BridgeAction | string
  payload: TPayload
  // 可选来源标记：建议 Cocos 下发时带 source='cc'。
  source?: string
  msgtype: BridgeMsgType
  requestId: string
  timestamp: number
}

export interface CreateBridgeMessageOptions {
  msgtype?: BridgeMsgType
}

type PartialBridgeMessage = Partial<BridgeMessage> & {
  msgtype?: unknown
}

// 生成带 requestId 和 timestamp 的标准消息，便于排查与去重。
export function createBridgeMessage<TPayload>(
  action: BridgeAction | string,
  payload: TPayload,
  options: CreateBridgeMessageOptions = {},
): BridgeMessage<TPayload> {
  return {
    action,
    payload,
    msgtype:
      options.msgtype === undefined ? BRIDGE_MSG_TYPE.H5 : normalizeBridgeMsgType(options.msgtype),
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
    const parsed = JSON.parse(maybeDecoded) as PartialBridgeMessage
    return normalizeBridgeMessage(parsed)
  } catch {
    return null
  }
}

// 将对象消息解析为合法的桥接消息对象（保留 payload 的原始对象/二进制）。
export function parseBridgeObject(raw: unknown): BridgeMessage | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  return normalizeBridgeMessage(raw as PartialBridgeMessage)
}

function normalizeBridgeMessage(parsed: PartialBridgeMessage): BridgeMessage | null {
  if (!parsed.action) {
    return null
  }

  // 兼容 Cocos 简化消息：如果没带 requestId/timestamp，则由 H5 自动补齐。
  return {
    action: String(parsed.action),
    payload: parsed.payload,
    source: typeof parsed.source === 'string' ? parsed.source : undefined,
    msgtype: normalizeBridgeMsgType(parsed.msgtype),
    requestId:
      typeof parsed.requestId === 'string'
        ? parsed.requestId
        : `cocos_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
  }
}
