import type { ServerMessageTribeBlackUser } from './pb/protobuf/holdem/recv_g_tribe_black_user_pb'
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

let pbTribeBlackUserClass: typeof ServerMessageTribeBlackUser | null = null

void import('./pb/protobuf/holdem/recv_g_tribe_black_user_pb').then((mod) => {
  pbTribeBlackUserClass = mod.ServerMessageTribeBlackUser
})

export function decodeTribeBlackUserNotify(
  rawPacket: ArrayBufferLike,
): WsTribeBlackUserNotifyPayload | null {
  if (!pbTribeBlackUserClass) return null

  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) return null

  try {
    const msg = pbTribeBlackUserClass.deserializeBinary(packet.body)
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
