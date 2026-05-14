import type { ServerMessageUserTraderOrderNotify } from './pb/protobuf/holdem/recv_g_user_trader_order_notify_pb'
import { decodeHoldemPacket } from './holdemPacket'

export interface WsUserTraderOrderNotifyPayload {
  orderNo: string
  status: number
  rejectReason: string
}

let pbTraderOrderNotifyClass: typeof ServerMessageUserTraderOrderNotify | null = null

void import('./pb/protobuf/holdem/recv_g_user_trader_order_notify_pb').then((mod) => {
  pbTraderOrderNotifyClass = mod.ServerMessageUserTraderOrderNotify
})

export function decodeUserTraderOrderNotify(
  rawPacket: ArrayBufferLike,
): WsUserTraderOrderNotifyPayload | null {
  if (!pbTraderOrderNotifyClass) return null
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) return null

  try {
    const msg = pbTraderOrderNotifyClass.deserializeBinary(packet.body)
    return {
      orderNo: msg.getOrderNo(),
      status: msg.getStatus(),
      rejectReason: msg.getRejectReason(),
    }
  } catch {
    return null
  }
}
