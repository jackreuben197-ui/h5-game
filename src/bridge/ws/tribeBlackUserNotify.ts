import { ServerMessageTribeBlackUser } from '@holdem-pb'
import { decodeHoldemPacket } from './holdemPacket'

export interface WsTribeBlackUserNotifyPayload {
  id: number
  userId: number
  userRandomId: number
  userName: string
  userAvatar: string
  tribeId: number
  status: number
  reason: string
  publicReason: string
  joinStatus: number
}

export function decodeTribeBlackUserNotify(
  rawPacket: ArrayBufferLike,
): WsTribeBlackUserNotifyPayload | null {
  if (!ServerMessageTribeBlackUser) return null

  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) return null

  try {
    const msg = ServerMessageTribeBlackUser.deserializeBinary(packet.body)
    return {
      id: msg.getId(),
      userId: msg.getUserId(),
      userRandomId: msg.getUserRandomId(),
      userName: msg.getUserName(),
      userAvatar: msg.getUserAvatar(),
      tribeId: msg.getTribeId(),
      status: msg.getStatus(),
      reason: msg.getReason(),
      publicReason: msg.getPublicReason(),
      joinStatus: msg.getJoinStatus(),
    }
  } catch {
    return null
  }
}
