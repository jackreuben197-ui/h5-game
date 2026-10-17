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

test('normalizes price-list reward tiers and divides all monetary values by 100', () => {
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
      startAmount: 1,
      endAmount: 10_000,
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
