import type { ServerMessageUserDiamondChange } from './pb/protobuf/holdem/recv_g_user_diamond_change_pb'
import type { ServerMessageUserGoldChange } from './pb/protobuf/holdem/recv_g_user_gold_change_pb'
import { decodeHoldemPacket } from './holdemPacket'

export interface WsUserDiamondChangePayload {
  userId: number
  diamonds: number
  diamondsLock: number
}

export interface WsUserGoldChangePayload {
  userId: number
  gold: number
  goldLock: number
  clubId: number
}

let pbDiamondClass: typeof ServerMessageUserDiamondChange | null = null
let pbGoldClass: typeof ServerMessageUserGoldChange | null = null

void import('./pb/protobuf/holdem/recv_g_user_diamond_change_pb').then((mod) => {
  pbDiamondClass = mod.ServerMessageUserDiamondChange
})
void import('./pb/protobuf/holdem/recv_g_user_gold_change_pb').then((mod) => {
  pbGoldClass = mod.ServerMessageUserGoldChange
})

export function decodeUserDiamondChange(
  rawPacket: ArrayBufferLike,
): WsUserDiamondChangePayload | null {
  if (!pbDiamondClass) return null
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) return null
  try {
    const msg = pbDiamondClass.deserializeBinary(packet.body)
    return {
      userId: msg.getUserId(),
      diamonds: msg.getDiamonds(),
      diamondsLock: msg.getDiamondsLock(),
    }
  } catch {
    return null
  }
}

export function decodeUserGoldChange(rawPacket: ArrayBufferLike): WsUserGoldChangePayload | null {
  if (!pbGoldClass) return null
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) return null
  try {
    const msg = pbGoldClass.deserializeBinary(packet.body)
    return {
      userId: msg.getUserId(),
      gold: msg.getGold(),
      goldLock: msg.getGoldLock(),
      clubId: msg.getClubId(),
    }
  } catch {
    return null
  }
}
