import { Code, ServerMessageUserOrderAudit } from '@silenthill/agreement-web'
import type { RechargeRewardNotification } from '@/features/rechargeReward/model'
import { createLogger } from '@/utils/logger'
import { decodeHoldemPacket } from './holdemPacket'

const log = createLogger('[rechargeOrder]')

export interface WsUserOrderAuditPayload extends RechargeRewardNotification {
  closeChat: boolean
  delay: number
}

export function decodeUserOrderAudit(
  rawPacket: ArrayBufferLike,
): WsUserOrderAuditPayload | null {
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) {
    log.warn('MSG_S_USER_ORDER_AUDIT packet decode failed', {
      byteLength: rawPacket.byteLength,
    })
    return null
  }
  if (packet.code !== Code.MSG_S_USER_ORDER_AUDIT) return null

  try {
    const message = ServerMessageUserOrderAudit.deserializeBinary(packet.body)
    const decoded: RechargeRewardNotification = {
      orderNo: message.getOrderNo().trim(),
      status: message.getStatus(),
      orderCategory: message.getOrderCategory(),
      orderType: message.getOrderType(),
      rewardGold: message.getRewardRechargeAmount(),
      rewards: message
        .getRewardPropsList()
        .filter((prop) => prop.getPropName().trim() && prop.getQuantity() > 0)
        .map((prop) => ({
          propId: prop.getPropId(),
          propName: prop.getPropName().trim(),
          propValue: prop.getPropValue() / 100,
          quantity: prop.getQuantity(),
          propIcon: '',
        })),
    }
    const payload: WsUserOrderAuditPayload = {
      ...decoded,
      closeChat: message.getCloseChat(),
      delay: message.getDelay(),
    }
    log.info('MSG_S_USER_ORDER_AUDIT received', {
      code: packet.code,
      roomId: packet.roomId,
      matchId: packet.matchId,
      message: message.toObject(),
      decoded: payload,
    })
    return payload
  } catch (error) {
    log.warn('MSG_S_USER_ORDER_AUDIT body decode failed', {
      code: packet.code,
      bodyLength: packet.body.length,
      error,
    })
    return null
  }
}
