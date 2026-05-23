import type { ServerMessageUserUsdtOrderNotify } from './pb/protobuf/holdem/recv_g_user_usdt_order_notify_pb'
import { decodeHoldemPacket } from './holdemPacket'

export interface WsUserUsdtOrderNotifyPayload {
  orderNo: string
  status: number
}

let pbUserUsdtOrderNotifyClass: typeof ServerMessageUserUsdtOrderNotify | null = null

void import('./pb/protobuf/holdem/recv_g_user_usdt_order_notify_pb').then((mod) => {
  pbUserUsdtOrderNotifyClass = mod.ServerMessageUserUsdtOrderNotify
})

export function decodeUserUsdtOrderNotify(
  rawPacket: ArrayBufferLike,
): WsUserUsdtOrderNotifyPayload | null {
  if (!pbUserUsdtOrderNotifyClass) return null
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) return null

  try {
    const msg = pbUserUsdtOrderNotifyClass.deserializeBinary(packet.body)
    return {
      orderNo: msg.getOrderNo(),
      status: msg.getStatus(),
    }
  } catch {
    return null
  }
}
