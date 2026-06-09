import { ServerMessageSupportMessage } from '@holdem-pb'
import { decodeHoldemPacket } from './holdemPacket'

export interface WsSupportMessagePayload {
  clubId: number
  tribeId: number
  userId: number
  supportUserId: number
  userSend: boolean
  imServiceType: number
  msgType: number
  timeToken: number
  localTime: number
  text: string
  url: string
}

export function decodeSupportMessageNotify(rawPacket: ArrayBufferLike): WsSupportMessagePayload | null {
  if (!ServerMessageSupportMessage) return null
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) return null

  try {
    const msg = ServerMessageSupportMessage.deserializeBinary(packet.body)
    return {
      clubId: Number(msg.getClubId() || 0),
      tribeId: Number(msg.getTribeId() || 0),
      userId: Number(msg.getUserId() || 0),
      supportUserId: Number(msg.getSupportUserId() || 0),
      userSend: msg.getUserSend() === true,
      imServiceType: Number(msg.getImServiceType() || 0),
      msgType: Number(msg.getMsgType() || 0),
      timeToken: Number(msg.getTimeToken() || 0),
      localTime: Number(msg.getLocalTime() || 0),
      text: msg.getText() || '',
      url: msg.getUrl() || '',
    }
  } catch {
    return null
  }
}
