export const BRIDGE_ACTION = {
  ENTER_TABLE: 'enterTable',
  EXIT_TABLE: 'exitTable',
  SYNC_USER: 'syncUser',
  COCOS_ACK: 'cocosAck',
} as const

export type BridgeAction = (typeof BRIDGE_ACTION)[keyof typeof BRIDGE_ACTION]

export interface EnterTablePayload {
  tableId: string
  roomId: string
  gameCode: string
  token: string
  from: 'h5-lobby'
}

export interface SyncUserPayload {
  uid: string
  nickname: string
  avatar?: string
}

export interface CocosAckPayload {
  ok: boolean
  message: string
}

export interface BridgeMessage<TPayload = unknown> {
  action: BridgeAction | string
  payload: TPayload
  requestId: string
  timestamp: number
}

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

export function toBridgeRaw(message: BridgeMessage): string {
  return JSON.stringify(message)
}

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
    const parsed = JSON.parse(maybeDecoded) as BridgeMessage
    if (!parsed.action || parsed.timestamp === undefined) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}
