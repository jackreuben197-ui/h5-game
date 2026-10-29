import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isSuccessfulRechargeOrder,
  normalizeRechargeRewardNotification,
  normalizeRechargeRewardTiers,
  shouldShowRechargeReward,
} from '../src/features/rechargeReward/model.ts'
import { createMockRechargeRewardNotification } from '../src/features/rechargeReward/mock.ts'

test('normalizes recharge rewards from protobuf object field names', () => {
  const notification = normalizeRechargeRewardNotification({
    orderNo: 'order-1',
    status: 2,
    orderCategory: 1,
    orderType: 1,
    rewardsList: [
      {
        propId: 658,
        propName: 'MTT ticket A',
        propValue: 100,
        quantity: 2,
        propIcon: 'https://example.com/ticket.png',
      },
    ],
  })

  assert.deepEqual(notification, {
    orderNo: 'order-1',
    status: 2,
    orderCategory: 1,
    orderType: 1,
    rewards: [
      {
        propId: 658,
        propName: 'MTT ticket A',
        propValue: 1,
        quantity: 2,
        propIcon: 'https://example.com/ticket.png',
      },
    ],
  })
  assert.equal(shouldShowRechargeReward(notification), true)
})

test('supports snake_case and JSON reward data compatibility', () => {
  const notification = normalizeRechargeRewardNotification({
    order_no: 'order-2',
    status: 2,
    order_category: 2,
    order_type: 1,
    reward_data: JSON.stringify([
      {
        prop_id: 659,
        prop_name: 'MTT ticket B',
        prop_value: 200,
        quantity: 1,
      },
    ]),
  })

  assert.equal(notification?.rewards[0]?.propId, 659)
  assert.equal(notification?.rewards[0]?.propName, 'MTT ticket B')
  assert.equal(notification?.rewards[0]?.propValue, 2)
  assert.equal(shouldShowRechargeReward(notification), true)
})

test('keeps recharge ranges in UC and converts only ticket values from cents', () => {
  const tiers = normalizeRechargeRewardTiers([
    {
      start_amount: 100,
      end_amount: 1_000_000,
      rewards: [
        {
          prop_id: 654,
          prop_name: '麻将MTT道具',
          prop_value: 50_000,
          quantity: 1,
        },
      ],
    },
  ])

  assert.deepEqual(tiers, [
    {
      startAmount: 100,
      endAmount: 1_000_000,
      rewards: [
        {
          propId: 654,
          propName: '麻将MTT道具',
          propValue: 500,
          quantity: 1,
          propIcon: '',
        },
      ],
    },
  ])
})

test('does not show rewards for failed, non-recharge, empty, or unidentifiable orders', () => {
  const base = {
    orderNo: 'order-3',
    status: 2,
    orderType: 1,
    rewards: [{ propName: 'Ticket', quantity: 1 }],
  }

  assert.equal(
    shouldShowRechargeReward(normalizeRechargeRewardNotification({ ...base, status: 3 })),
    false,
  )
  assert.equal(
    shouldShowRechargeReward(normalizeRechargeRewardNotification({ ...base, orderType: 2 })),
    false,
  )
  assert.equal(
    shouldShowRechargeReward(normalizeRechargeRewardNotification({ ...base, rewards: [] })),
    false,
  )
  assert.equal(
    shouldShowRechargeReward(normalizeRechargeRewardNotification({ ...base, orderNo: '' })),
    false,
  )
})

test('successful recharge closes its payment popup even when it has no rewards', () => {
  const notification = normalizeRechargeRewardNotification({
    orderNo: 'order-without-reward',
    status: 2,
    orderType: 1,
    rewards: [],
  })

  assert.equal(isSuccessfulRechargeOrder(notification), true)
  assert.equal(shouldShowRechargeReward(notification), false)
})

test('local UI mock combines first-recharge and daily-recharge rewards at the test amount', () => {
  const notification = createMockRechargeRewardNotification()

  assert.equal(shouldShowRechargeReward(notification), true)
  assert.deepEqual(
    notification.rewards.map((reward) => reward.propId),
    [654, 652, 631],
  )
  assert.deepEqual(
    notification.rewards.map((reward) => reward.propValue),
    [500, 633, 100],
  )
})

test('UC-only and combined rewards are eligible without converting UC to cents', () => {
  const base = { order_no: 'uc-order', status: 2, order_type: 1, reward_gold: 100, rewards: [] }
  const notification = normalizeRechargeRewardNotification(base)
  assert.equal(notification?.rewardGold, 100)
  assert.equal(shouldShowRechargeReward(notification), true)
  assert.equal(
    shouldShowRechargeReward(normalizeRechargeRewardNotification({ ...base, status: 3 })),
    false,
  )
  assert.equal(
    shouldShowRechargeReward(normalizeRechargeRewardNotification({ ...base, order_type: 2 })),
    false,
  )
  assert.equal(
    shouldShowRechargeReward(normalizeRechargeRewardNotification({ ...base, reward_gold: -1 })),
    false,
  )
  const combined = normalizeRechargeRewardNotification({
    ...base,
    rewards: [
      {
        prop_id: 662,
        quantity: 2,
        prop_value: 50000,
        multi_language: { cn_name: '门票', us_name: 'Ticket' },
      },
    ],
  })
  assert.equal(combined?.rewardGold, 100)
  assert.equal(combined?.rewards[0]?.propValue, 500)
  assert.deepEqual(combined?.rewards[0]?.multiLanguage, { cn_name: '门票', us_name: 'Ticket' })
  assert.equal(shouldShowRechargeReward(combined), true)
})

test('existing recharge config keeps reward_tribe_gold and multilingual props, including UC-only tiers', () => {
  const tiers = normalizeRechargeRewardTiers([
    { start_amount: 100, end_amount: 150, reward_tribe_gold: 100, rewards: [] },
    {
      start_amount: 150,
      end_amount: 200,
      reward_tribe_gold: 200,
      rewards: [
        {
          prop_id: 662,
          prop_value: 50000,
          quantity: 3,
          multi_language: { cn_name: '门票', us_name: 'Ticket' },
        },
      ],
    },
  ])
  assert.equal(tiers.length, 2)
  assert.deepEqual(tiers[0], { startAmount: 100, endAmount: 150, rewardGold: 100, rewards: [] })
  assert.equal(tiers[1]?.rewardGold, 200)
  assert.equal(tiers[1]?.rewards[0]?.propValue, 500)
  assert.deepEqual(tiers[1]?.rewards[0]?.multiLanguage, { cn_name: '门票', us_name: 'Ticket' })
  assert.equal(
    normalizeRechargeRewardNotification({
      orderNo: 'uc',
      status: 2,
      orderType: 1,
      reward_tribe_gold: 100,
    })?.rewardGold,
    100,
  )
})

test('recharge config accepts the final reward_gold field without scaling the reward coins', () => {
  const tiers = normalizeRechargeRewardTiers([
    { start_amount: 100, end_amount: 150, reward_gold: 100, rewards: [] },
  ])
  assert.equal(tiers[0]?.startAmount, 100)
  assert.equal(tiers[0]?.endAmount, 150)
  assert.equal(tiers[0]?.rewardGold, 100)
})
