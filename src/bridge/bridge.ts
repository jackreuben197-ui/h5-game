import {
  BRIDGE_ACTION,
  createBridgeMessage,
  parseBridgeRaw,
  toBridgeRaw,
  type BridgeAction,
  type BridgeMessage,
  type CocosAckPayload,
  type EnterTablePayload,
} from './protocol'

type MessageHandler = (message: BridgeMessage) => void

const BRIDGE_SCHEME = 'cocos'
const BRIDGE_HOST = 'bridge'
const H5_SOURCE = 'h5-game'
const COCOS_SOURCE = 'cocos-game'
const handlers = new Set<MessageHandler>()

function emit(message: BridgeMessage): void {
  handlers.forEach((handler) => handler(message))
}

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

function postByWindowMessage(raw: string): boolean {
  if (typeof window === 'undefined' || window.parent === window) {
    return false
  }

  window.parent.postMessage({ source: H5_SOURCE, payload: raw }, '*')
  return true
}

function shouldUseScheme(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('cocos') || ua.includes('android') || ua.includes('iphone')
}

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

export function sendBridgeMessage<TPayload>(
  action: BridgeAction,
  payload: TPayload,
): BridgeMessage<TPayload> {
  const message = createBridgeMessage(action, payload)
  postToCocos(toBridgeRaw(message))
  return message
}

export function enterTable(payload: EnterTablePayload): BridgeMessage<EnterTablePayload> {
  return sendBridgeMessage(BRIDGE_ACTION.ENTER_TABLE, payload)
}

export function sendExitTable(payload: Record<string, unknown>): BridgeMessage<Record<string, unknown>> {
  return sendBridgeMessage(BRIDGE_ACTION.EXIT_TABLE, payload)
}

export function subscribeCocosMessages(handler: MessageHandler): () => void {
  handlers.add(handler)
  return () => handlers.delete(handler)
}

export function mockCocosAck(payload: CocosAckPayload): void {
  emit(createBridgeMessage(BRIDGE_ACTION.COCOS_ACK, payload))
}

function handleIncomingRaw(raw: string): void {
  const parsed = parseBridgeRaw(raw)
  if (parsed) {
    emit(parsed)
  }
}

if (typeof window !== 'undefined') {
  window.__H5_GAME_ON_COCOS_MESSAGE__ = (raw: string): void => {
    handleIncomingRaw(raw)
  }

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
