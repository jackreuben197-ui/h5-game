import { ServerMessageUserUsdtOrderNotify } from '@holdem-pb'
import { decodeHoldemPacket } from './holdemPacket'

export interface WsUserUsdtOrderNotifyPayload {
  orderNo: string
  status: number
}

export function decodeUserUsdtOrderNotify(
  rawPacket: ArrayBufferLike,
): WsUserUsdtOrderNotifyPayload | null {
  if (!ServerMessageUserUsdtOrderNotify) return null
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) return null

  try {
    const msg = ServerMessageUserUsdtOrderNotify.deserializeBinary(packet.body)
    return {
      orderNo: msg.getOrderNo(),
      status: msg.getStatus(),
    }
  } catch {
    return null
  }
}
