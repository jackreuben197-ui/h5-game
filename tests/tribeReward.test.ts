import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import {
  enqueueReward,
  hideRewardQueue,
  showNextReward,
  type RewardReceipt,
  type RewardReceiptQueue,
} from '../src/features/tribeReward/notification.ts'

const aliases = new Map([
  [
    '@/features/channelC/rewards',
    new URL('../src/features/channelC/rewards.ts', import.meta.url).href,
  ],
  ['@/constants/pokerBlinds', new URL('../src/constants/pokerBlinds.ts', import.meta.url).href],
])
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const url = aliases.get(specifier)
    return url ? { url, shortCircuit: true } : nextResolve(specifier, context)
  },
})
const { presentTribeRewards } = await import('../src/features/tribeReward/presentation.ts')
hooks.deregister()

const progress = {
  current_count: 50,
  completed: true,
  earned: true,
  rewarded: false,
  delivered: true,
}
test('rewarded alone marks credit; completion, order creation and notification delivery do not', () => {
  const result = presentTribeRewards({
    tribe_id: 10,
    hand_reward_club_id: 5,
    hand_reward: [
      { ...progress, sb: 100, hand_count: 50, reward_gold: 0, rewards: null },
      { ...progress, sb: 600, hand_count: 20, reward_gold: 100, rewarded: true },
    ],
    invite_reward: [
      { ...progress, invite_count: 20, current_count: 12, reward_gold: 500 },
      { ...progress, invite_count: 10, current_count: 11, reward_gold: 100, rewarded: true },
    ],
  })
  assert.equal(result.groups[1]![0]!.played, 50)
  assert.equal(result.groups[1]![0]!.credited, false)
  assert.equal(result.groups[1]![0]!.completed, true)
  assert.equal(result.groups[1]![0]!.reward_gold, 0)
  assert.deepEqual(result.groups[1]![0]!.rewards, [])
  assert.equal(result.groups[2]![0]!.blind, '6/12')
  assert.equal(result.groups[2]![0]!.credited, true)
  assert.equal(result.invite.validInvites, 12)
  assert.deepEqual(
    result.invite.tiers.map((tier) => [tier.target, tier.current, tier.credited]),
    [
      [10, 11, true],
      [20, 12, false],
    ],
  )
})

test('all four configurations preserve server names, gold units and scale only blinds and prop values', () => {
  const bundle = {
    reward_gold: 100,
    rewards: [{ prop_id: 662, quantity: 2, prop_name: 'PROP2023.TICKET', prop_value: 50000 }],
  }
  const result = presentTribeRewards({
    tribe_id: 10,
    hand_reward_club_id: 5,
    hand_reward: [{ ...progress, ...bundle, sb: 100, hand_count: 50 }],
    invite_reward: [{ ...progress, ...bundle, invite_count: 10 }],
    first_recharge_reward: [{ ...bundle, start_amount: 100, end_amount: 150 }],
    daily_recharge_reward: [{ reward_gold: 0, rewards: null, start_amount: 150, end_amount: 200 }],
  })
  for (const tier of [result.groups[1]![0]!, result.invite.tiers[0]!, result.recharge.first[0]!]) {
    assert.equal(tier.reward_gold, 100)
    assert.equal(tier.rewards[0]!.name, 'PROP2023.TICKET')
    assert.equal(tier.rewards[0]!.value, 500)
    assert.equal(tier.rewards[0]!.quantity, 2)
  }
  assert.equal(result.recharge.first[0]!.from, 100)
  assert.equal(result.recharge.first[0]!.to, 150)
  assert.equal(result.recharge.daily[0]!.reward_gold, 0)
  assert.deepEqual(presentTribeRewards(null), {
    groups: [[], [], [], []],
    invite: { validInvites: 0, tiers: [] },
    recharge: { first: [], daily: [] },
  })
})

function queue() {
  const state: RewardReceiptQueue = { current: null, pending: [] }
  const seen = new Set<string>()
  const remember = (id: string) => {
    if (seen.has(id)) return false
    seen.add(id)
    return true
  }
  return { state, remember }
}
function receipt(id: string, source: RewardReceipt['source'] = 'activity'): RewardReceipt {
  return { orderNo: id, source, rewardGold: 100, rewards: [] }
}

test('activity rewards queue during gameplay and appear once after returning to H5', () => {
  const { state, remember } = queue()
  assert.equal(enqueueReward(state, receipt('a'), remember, false), true)
  assert.equal(state.current, null)
  assert.equal(state.pending.length, 1)
  assert.equal(enqueueReward(state, receipt('a'), remember, false), false)
  showNextReward(state, true)
  assert.equal(state.current?.orderNo, 'a')
  hideRewardQueue(state)
  assert.equal(state.current, null)
  assert.equal(state.pending.length, 1)
  showNextReward(state, true)
  state.current = null
  assert.equal(enqueueReward(state, receipt('a'), remember, true), false)
})

test('recharge keeps its existing hidden behavior and an activity receipt upgrades the same visible order', () => {
  const { state, remember } = queue()
  enqueueReward(state, receipt('hidden-recharge', 'recharge'), remember, false)
  assert.equal(state.pending.length, 0)
  const old = {
    ...receipt('same', 'recharge'),
    rewardGold: 0,
    rewards: [{ propId: 662, propName: 'TICKET', propValue: 100, quantity: 1, propIcon: '' }],
  }
  enqueueReward(state, old, remember, true)
  assert.equal(
    enqueueReward(state, { ...old, source: 'activity', rewardGold: 300 }, remember, true),
    true,
  )
  assert.equal(state.current?.rewardGold, 300)
  assert.equal(state.current?.source, 'activity')
  assert.equal(state.pending.length, 0)
  enqueueReward(state, old, remember, true)
  assert.equal(state.current?.rewardGold, 300)
  enqueueReward(state, receipt('next'), remember, true)
  state.current = null
  showNextReward(state, true)
  assert.equal(state.current?.orderNo, 'next')
})
