import { ServerMessageUserTraderOrderNotify } from '@holdem-pb'
import { decodeHoldemPacket } from './holdemPacket'

export interface WsUserTraderOrderNotifyPayload {
  orderNo: string
  status: number
  rejectReason: string
}

export function decodeUserTraderOrderNotify(
  rawPacket: ArrayBufferLike,
): WsUserTraderOrderNotifyPayload | null {
  if (!ServerMessageUserTraderOrderNotify) return null
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) return null

  try {
    const msg = ServerMessageUserTraderOrderNotify.deserializeBinary(packet.body)
    return {
      orderNo: msg.getOrderNo(),
      status: msg.getStatus(),
      rejectReason: msg.getRejectReason(),
    }
  } catch {
    return null
  }
}
