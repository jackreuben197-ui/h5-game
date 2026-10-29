import { ServerMessageUserOrderAudit } from '@holdem-pb'
import {
  normalizeRechargeRewardNotification,
  type RechargeRewardNotification,
} from '@/features/rechargeReward/model'
import { createLogger } from '@/utils/logger'
import { decodeHoldemPacket } from './holdemPacket'

type DynamicRecord = Record<string, unknown>
type DynamicMethodRecord = Record<string, unknown>

const log = createLogger('[rechargeOrder]')

function callMethod(target: DynamicMethodRecord, names: string[]): unknown {
  for (const name of names) {
    const method = target[name]
    if (typeof method !== 'function') continue
    try {
      return method.call(target)
    } catch {
      // Try the next compatible generated method name.
    }
  }
  return undefined
}

function messageToRecord(message: DynamicMethodRecord): DynamicRecord {
  const raw = callMethod(message, ['toObject'])
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as DynamicRecord) : {}
}

function rewardMessageToRecord(value: unknown): DynamicRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const target = value as DynamicMethodRecord
  const raw = messageToRecord(target)
  const methodValues: DynamicRecord = {}
  const candidateValues: Array<[string, unknown]> = [
    ['propId', callMethod(target, ['getPropId', 'getId'])],
    ['propName', callMethod(target, ['getPropName', 'getName', 'getItemName'])],
    ['propValue', callMethod(target, ['getPropValue', 'getValue', 'getItemValue'])],
    ['quantity', callMethod(target, ['getQuantity', 'getNum', 'getCount', 'getAmount'])],
    ['propIcon', callMethod(target, ['getPropIcon', 'getIcon', 'getIconUrl'])],
    ['multiLanguage', callMethod(target, ['getMultiLanguage'])],
  ]
  candidateValues.forEach(([key, candidate]) => {
    if (candidate !== undefined && candidate !== null) methodValues[key] = candidate
  })
  return {
    ...raw,
    ...methodValues,
  }
}

function readRewards(message: DynamicMethodRecord, objectValue: DynamicRecord): unknown {
  const methodValue = callMethod(message, [
    'getRewardPropsList',
    'getRewardsList',
    'getRewardList',
    'getRewardListList',
    'getPropsList',
    'getRewardDataList',
  ])
  const list = Array.isArray(methodValue)
    ? methodValue
    : [
        objectValue.rewards,
        objectValue.rewardsList,
        objectValue.reward_list,
        objectValue.rewardList,
        objectValue.rewardListList,
        objectValue.props,
        objectValue.propsList,
      ].find(Array.isArray)

  if (Array.isArray(list)) {
    const generatedRewards = list.map((item) => rewardMessageToRecord(item) || item)
    if (generatedRewards.length) return generatedRewards
  }

  return (
    callMethod(message, ['getRewardData', 'getRewardJson', 'getRewardsJson']) ??
    objectValue.rewardData ??
    objectValue.reward_data ??
    objectValue.rewardJson ??
    objectValue.reward_json
  )
}

export function decodeUserOrderAudit(
  rawPacket: ArrayBufferLike,
): RechargeRewardNotification | null {
  if (!ServerMessageUserOrderAudit) {
    log.warn('MSG_S_USER_ORDER_AUDIT decoder is unavailable')
    return null
  }
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) {
    log.warn('MSG_S_USER_ORDER_AUDIT packet decode failed', {
      byteLength: rawPacket.byteLength,
    })
    return null
  }

  try {
    const message = ServerMessageUserOrderAudit.deserializeBinary(
      packet.body,
    ) as unknown as DynamicMethodRecord
    const objectValue = messageToRecord(message)
    const decoded = {
      ...objectValue,
      orderNo: callMethod(message, ['getOrderNo']) ?? objectValue.orderNo,
      status: callMethod(message, ['getStatus']) ?? objectValue.status,
      orderCategory: callMethod(message, ['getOrderCategory']) ?? objectValue.orderCategory,
      orderType: callMethod(message, ['getOrderType']) ?? objectValue.orderType,
      rewardGold:
        callMethod(message, ['getRewardGold', 'getRewardTribeGold']) ??
        objectValue.rewardGold ??
        objectValue.reward_gold ??
        objectValue.rewardTribeGold ??
        objectValue.reward_tribe_gold,
      rewards: readRewards(message, objectValue),
    }
    const normalized = normalizeRechargeRewardNotification(decoded)
    log.info('MSG_S_USER_ORDER_AUDIT received', {
      code: packet.code,
      roomId: packet.roomId,
      matchId: packet.matchId,
      message: objectValue,
      decoded,
      normalized,
    })
    return normalized
  } catch (error) {
    log.warn('MSG_S_USER_ORDER_AUDIT body decode failed', {
      code: packet.code,
      bodyLength: packet.body.length,
      error,
    })
    return null
  }
}
