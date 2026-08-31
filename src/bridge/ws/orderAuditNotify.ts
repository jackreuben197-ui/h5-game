import { ServerMessageUserOrderAudit } from '@holdem-pb'
import { decodeHoldemPacket } from './holdemPacket'

export interface WsUserOrderAuditPayload {
  orderNo: string
  status: number
  orderCategory: number
  orderType: number
  closeChat: boolean
  delay: number
}

export function decodeUserOrderAudit(
  rawPacket: ArrayBufferLike,
): WsUserOrderAuditPayload | null {
  if (!ServerMessageUserOrderAudit) return null
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) return null

  try {
    const msg = ServerMessageUserOrderAudit.deserializeBinary(packet.body)
    return {
      orderNo: msg.getOrderNo(),
      status: msg.getStatus(),
      orderCategory: msg.getOrderCategory(),
      orderType: msg.getOrderType(),
      closeChat: msg.getCloseChat(),
      delay: msg.getDelay(),
    }
  } catch {
    return null
  }
}
