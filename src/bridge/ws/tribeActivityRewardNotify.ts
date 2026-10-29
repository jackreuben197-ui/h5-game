import { Code, ServerMessageTribeActivityReward } from '@holdem-pb'
import type { TribeActivityRewardNotification } from '@/features/tribeReward/notification'
import { decodeHoldemPacket } from './holdemPacket'
import { createLogger } from '@/utils/logger'

const log = createLogger('[tribeActivityReward]')

export function decodeTribeActivityReward(
  raw: ArrayBufferLike,
): TribeActivityRewardNotification | null {
  const packet = decodeHoldemPacket(raw)
  if (!packet || packet.code !== Code.MSG_S_TRIBE_ACTIVITY_REWARD) return null
  try {
    const message = ServerMessageTribeActivityReward.deserializeBinary(packet.body)
    const orderNo = message.getOrderNo().trim()
    if (!orderNo) return null
    return {
      source: 'activity',
      orderNo,
      tribeId: message.getTribeId(),
      clubId: message.getClubId(),
      rewardKind: message.getRewardKind(),
      tier: message.getTier(),
      rewardGold: Math.max(0, message.getRewardGold()),
      rewards: message
        .getRewardPropsList()
        .filter((prop) => prop.getPropId() > 0 && prop.getQuantity() > 0)
        .map((prop) => ({
          propId: prop.getPropId(),
          propName: prop.getPropName(),
          propValue: prop.getPropValue() / 100,
          quantity: prop.getQuantity(),
          propIcon: '',
        })),
    }
  } catch (error) {
    log.warn('decode failed', error)
    return null
  }
}
