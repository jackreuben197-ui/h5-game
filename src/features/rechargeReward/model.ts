export interface RechargeRewardItem {
  propId: number
  propName: string
  propValue: number
  quantity: number
  propIcon: string
}

export interface RechargeRewardNotification {
  orderNo: string
  status: number
  orderCategory: number
  orderType: number
  rewards: RechargeRewardItem[]
}

export interface RechargeRewardTier {
  startAmount: number
  endAmount: number
  rewards: RechargeRewardItem[]
}

const PASSED_ORDER_STATUS = 2
const RECHARGE_ORDER_TYPE = 1

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toString(value: unknown): string {
  return value == null ? '' : String(value).trim()
}

function centsToAmount(value: unknown): number {
  return toNumber(value) / 100
}

function parseRewardSource(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (!value) return []

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) return parsed
      if (isRecord(parsed)) {
        return parseRewardSource(
          firstPresent(
            parsed.rewards,
            parsed.rewardsList,
            parsed.reward_list,
            parsed.rewardList,
            parsed.props,
            parsed.propsList,
          ),
        )
      }
    } catch {
      return []
    }
  }

  return []
}

export function normalizeRechargeRewardItem(value: unknown): RechargeRewardItem | null {
  if (!isRecord(value)) return null

  const propId = toNumber(firstPresent(value.propId, value.prop_id, value.id))
  const propName = toString(
    firstPresent(value.propName, value.prop_name, value.name, value.itemName, value.item_name),
  )
  const propValue = centsToAmount(
    firstPresent(value.propValue, value.prop_value, value.value, value.itemValue, value.item_value),
  )
  const quantity = Math.max(
    0,
    toNumber(firstPresent(value.quantity, value.num, value.count, value.amount)),
  )
  const propIcon = toString(
    firstPresent(value.propIcon, value.prop_icon, value.icon, value.iconUrl, value.icon_url),
  )

  if (!propName || quantity <= 0) return null
  return {
    propId,
    propName,
    propValue,
    quantity,
    propIcon,
  }
}

export function normalizeRechargeRewardTiers(value: unknown): RechargeRewardTier[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item): RechargeRewardTier | null => {
      if (!isRecord(item)) return null

      const rewards = parseRewardSource(item.rewards)
        .map(normalizeRechargeRewardItem)
        .filter((reward): reward is RechargeRewardItem => reward !== null)

      if (rewards.length === 0) return null
      return {
        startAmount: centsToAmount(
          firstPresent(item.startAmount, item.start_amount, item.minAmount, item.min_amount),
        ),
        endAmount: centsToAmount(
          firstPresent(item.endAmount, item.end_amount, item.maxAmount, item.max_amount),
        ),
        rewards,
      }
    })
    .filter((tier): tier is RechargeRewardTier => tier !== null)
}

export function normalizeRechargeRewardNotification(
  value: unknown,
): RechargeRewardNotification | null {
  if (!isRecord(value)) return null

  const rewardSource = firstPresent(
    value.rewards,
    value.rewardsList,
    value.reward_list,
    value.rewardList,
    value.rewardListList,
    value.props,
    value.propsList,
    value.rewardData,
    value.reward_data,
    value.rewardJson,
    value.reward_json,
  )
  const rewards = parseRewardSource(rewardSource)
    .map(normalizeRechargeRewardItem)
    .filter((item): item is RechargeRewardItem => item !== null)

  return {
    orderNo: toString(firstPresent(value.orderNo, value.order_no)),
    status: toNumber(value.status),
    orderCategory: toNumber(firstPresent(value.orderCategory, value.order_category)),
    orderType: toNumber(firstPresent(value.orderType, value.order_type)),
    rewards,
  }
}

export function shouldShowRechargeReward(
  notification: RechargeRewardNotification | null,
): notification is RechargeRewardNotification {
  return isSuccessfulRechargeOrder(notification) && notification.rewards.length > 0
}

export function isSuccessfulRechargeOrder(
  notification: RechargeRewardNotification | null,
): notification is RechargeRewardNotification {
  return Boolean(
    notification &&
      notification.orderNo &&
      notification.status === PASSED_ORDER_STATUS &&
      notification.orderType === RECHARGE_ORDER_TYPE,
  )
}
