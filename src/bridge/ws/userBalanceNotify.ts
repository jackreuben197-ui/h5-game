import {
  ServerMessageUserDiamondChange,
  ServerMessageUserGoldChange,
} from '@holdem-pb'
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

export function decodeUserDiamondChange(
  rawPacket: ArrayBufferLike,
): WsUserDiamondChangePayload | null {
  // agreement-web 的 proxy 通过 window.HoldemPB 惰性取类；UMD <script> 没加载完时为 undefined
  if (!ServerMessageUserDiamondChange) return null
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) return null
  try {
    const msg = ServerMessageUserDiamondChange.deserializeBinary(packet.body)
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
  if (!ServerMessageUserGoldChange) return null
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) return null
  try {
    const msg = ServerMessageUserGoldChange.deserializeBinary(packet.body)
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
