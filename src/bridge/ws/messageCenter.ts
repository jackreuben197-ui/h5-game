import { decodeHoldemCode } from './holdemPacket'
import { subscribeH5WsMessages, type H5WsIncomingEvent } from './wsProxy'

export { Code } from '@holdem-pb'

export interface H5WsDecodedMessage {
  code: number
  rawBuffer: ArrayBufferLike
  event: H5WsIncomingEvent
}

function getBinaryRawBuffer(event: H5WsIncomingEvent): ArrayBufferLike | null {
  if (event.dataType !== 'binary') {
    return null
  }
  return event.rawBuffer || event.data || null
}

// 通用订阅：回调所有可解出 code 的 websocket 二进制消息。
export function subscribeH5WsDecodedMessages(handler: (message: H5WsDecodedMessage) => void): () => void {
  return subscribeH5WsMessages((event) => {
    const raw = getBinaryRawBuffer(event)
    if (!raw) {
      return
    }

    const code = decodeHoldemCode(raw)
    if (code === null) {
      return
    }

    handler({
      code,
      rawBuffer: raw,
      event,
    })
  })
}

// 按单个 code 订阅。
export function subscribeH5WsCode(
  code: number,
  handler: (message: H5WsDecodedMessage) => void,
): () => void {
  const targetCode = Math.floor(code)
  if (!Number.isFinite(targetCode) || targetCode < 0) {
    return () => undefined
  }

  return subscribeH5WsDecodedMessages((message) => {
    if (message.code !== targetCode) {
      return
    }
    handler(message)
  })
}

// 按多个 code 订阅（后续 H5 需要更多 WS 消息时可复用）。
export function subscribeH5WsCodes(
  codes: number[],
  handler: (message: H5WsDecodedMessage) => void,
): () => void {
  const codeSet = new Set<number>()
  codes.forEach((raw) => {
    const code = Math.floor(raw)
    if (Number.isFinite(code) && code >= 0) {
      codeSet.add(code)
    }
  })

  if (!codeSet.size) {
    return () => undefined
  }

  return subscribeH5WsDecodedMessages((message) => {
    if (!codeSet.has(message.code)) {
      return
    }
    handler(message)
  })
}
