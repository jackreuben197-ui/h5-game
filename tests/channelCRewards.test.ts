import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { POKER_SMALL_BLINDS_BY_LEVEL } from '../src/constants/pokerBlinds.ts'

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@/constants/pokerBlinds') {
      return nextResolve(new URL('../src/constants/pokerBlinds.ts', import.meta.url).href, context)
    }
    return nextResolve(specifier, context)
  },
})
const { buildGameRewardGroups, buildInviteRewardTiers, toRechargeActivityTiers, rewardProgress } =
  await import('../src/features/channelC/rewards.ts')
hooks.deregister()
const gameRewardGroups = buildGameRewardGroups(
  Object.values(POKER_SMALL_BLINDS_BY_LEVEL)
    .flat()
    .map((blind) => ({
      sb: Math.round(blind * 100),
      hand_count: 50,
      reward_gold: 100,
      rewards: [],
    })),
)

test('reward levels use the defined small blinds and keep all six middle stakes', () => {
  const expected = [
    [0.1, 0.2, 0.3, 0.4, 0.5],
    [1, 2, 3, 4, 5],
    [10, 15, 20, 25, 30, 50],
    [100, 200, 300, 500, 1000],
  ]
  assert.deepEqual(Object.values(POKER_SMALL_BLINDS_BY_LEVEL), expected)
  assert.deepEqual(
    gameRewardGroups.map((group) => group.map((tier) => tier.smallBlind)),
    expected,
  )
})

test('reward blind pairs double the small blind without fractional rounding artifacts or k abbreviations', () => {
  assert.deepEqual(
    gameRewardGroups[0]!.map((tier) => tier.blind),
    ['0.1/0.2', '0.2/0.4', '0.3/0.6', '0.4/0.8', '0.5/1'],
  )
  assert.deepEqual(
    gameRewardGroups[2]!.map((tier) => tier.blind),
    ['10/20', '15/30', '20/40', '25/50', '30/60', '50/100'],
  )
  assert.deepEqual(
    gameRewardGroups[3]!.map((tier) => tier.blind),
    ['100/200', '200/400', '300/600', '500/1000', '1000/2000'],
  )
})

test('CMS hand configs preserve zero rewards, multiple props, and independent credited state', () => {
  const groups = buildGameRewardGroups(
    [
      { sb: 100, hand_count: 50, reward_gold: 0, rewards: [] },
      {
        sb: 500,
        hand_count: 20,
        reward_gold: 100,
        rewards: [
          { prop_id: 662, quantity: 3, prop_value: 50000, multi_language: 'PROP_TICKET' },
          { prop_id: 663, quantity: 1, prop_value: 20000 },
        ],
      },
    ],
    new Map([[100, { current: 50, credited: false }]]),
  )
  assert.deepEqual(
    groups.map((group) => group.map((tier) => tier.blind)),
    [[], ['1/2', '5/10'], [], []],
  )
  assert.equal(groups[1]![0]!.reward_gold, 0)
  assert.deepEqual(groups[1]![0]!.rewards, [])
  assert.equal(groups[1]![0]!.credited, false)
  assert.equal(groups[1]![1]!.reward_gold, 100)
  assert.deepEqual(
    groups[1]![1]!.rewards.map((prop) => [prop.prop_id, prop.quantity, prop.value]),
    [
      [662, 3, 500],
      [663, 1, 200],
    ],
  )
  assert.equal(groups[1]![1]!.rewards[0]!.multi_language, 'PROP_TICKET')
  assert.deepEqual(buildGameRewardGroups([]), [[], [], [], []])
})

test('invite tiers keep all qualifying thresholds and use explicit credit records', () => {
  const tiers = buildInviteRewardTiers(
    [
      { invite_count: 20, reward_gold: 500, rewards: [] },
      { invite_count: 10, reward_gold: 100, rewards: [{ prop_id: 662, quantity: 1 }] },
    ],
    new Set([10]),
  )
  assert.deepEqual(
    tiers.map((tier) => [tier.target, tier.credited]),
    [
      [10, true],
      [20, false],
    ],
  )
  assert.equal(tiers[0]!.rewards[0]!.quantity, 1)
})

test('recharge presentation retains normalized amounts and server metadata', () => {
  const tiers = toRechargeActivityTiers([
    {
      startAmount: 100,
      endAmount: 150,
      rewards: [
        {
          propId: 662,
          propName: 'PROP_TICKET',
          propValue: 500,
          quantity: 2,
          propIcon: '',
          multiLanguage: { cn_name: '门票' },
        },
      ],
    },
  ])
  assert.equal(tiers[0]!.from, 100)
  assert.equal(tiers[0]!.to, 150)
  assert.equal(tiers[0]!.rewards[0]!.value, 500)
  assert.deepEqual(tiers[0]!.rewards[0]!.multi_language, { cn_name: '门票' })
  assert.equal(rewardProgress(12, 10), 100)
  assert.equal(rewardProgress(-1, 10), 0)
  assert.equal(rewardProgress(1, 0), 0)
  assert.equal(rewardProgress(NaN, 10), 0)
})
