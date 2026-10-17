import {
  normalizeRechargeRewardItem,
  type RechargeRewardNotification,
} from './model.ts'

interface MockRechargeReward {
  prop_id: number
  prop_name: string
  prop_value: number
  quantity: number
}

interface MockRechargeRewardTier {
  id: string
  min_amount: number
  max_amount: number
  rewards: MockRechargeReward[]
}

interface MockRechargeRewardConfig {
  type: 'first_recharge' | 'daily_recharge'
  tiers: MockRechargeRewardTier[]
}

export const MOCK_RECHARGE_REWARD_CONFIGS: MockRechargeRewardConfig[] = [
  {
    type: 'first_recharge',
    tiers: [
      {
        id: 'first_recharge-1792049373506',
        min_amount: 100,
        max_amount: 1000000,
        rewards: [
          {
            prop_id: 654,
            prop_name: '麻将MTT道具',
            prop_value: 50000,
            quantity: 1,
          },
          {
            prop_id: 652,
            prop_name: '八饼卡',
            prop_value: 63300,
            quantity: 1,
          },
        ],
      },
      {
        id: 'first_recharge-1792049373507',
        min_amount: 1000000,
        max_amount: 10000000,
        rewards: [
          {
            prop_id: 651,
            prop_name: '伍万卡',
            prop_value: 36600,
            quantity: 1,
          },
        ],
      },
    ],
  },
  {
    type: 'daily_recharge',
    tiers: [
      {
        id: 'daily_recharge-1792049373508',
        min_amount: 100,
        max_amount: 1000000,
        rewards: [
          {
            prop_id: 631,
            prop_name: '八万卡',
            prop_value: 10000,
            quantity: 1,
          },
        ],
      },
      {
        id: 'daily_recharge-1792049373509',
        min_amount: 1000000,
        max_amount: 2000000,
        rewards: [
          {
            prop_id: 629,
            prop_name: '麻将MTT道具',
            prop_value: 1100,
            quantity: 1,
          },
        ],
      },
    ],
  },
]

const MOCK_RECHARGE_AMOUNT = 100

export function createMockRechargeRewardNotification(): RechargeRewardNotification {
  const rewards = MOCK_RECHARGE_REWARD_CONFIGS.flatMap((config) => {
    const tier = config.tiers.find(
      (item) =>
        MOCK_RECHARGE_AMOUNT >= item.min_amount &&
        MOCK_RECHARGE_AMOUNT < item.max_amount,
    )
    return tier?.rewards ?? []
  })

  return {
    orderNo: `mock-recharge-reward-${Date.now()}`,
    status: 2,
    orderCategory: 1,
    orderType: 1,
    rewards: rewards
      .map(normalizeRechargeRewardItem)
      .filter((reward) => reward !== null),
  }
}
