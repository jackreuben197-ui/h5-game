import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import { createPinia, setActivePinia } from 'pinia'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const fixtureUrl = moduleUrl(`
  import { createRequire } from 'node:module';
  const { reactive } = createRequire(${JSON.stringify(import.meta.url)})('vue');
  export const game = reactive({ isRealUser: true, sessionToken: 'test-token', loginUserId: '1' });
  export const requests = [];
  export const useGameStore = () => game;
  export function postPropTribeRewardInfoApi(payload) {
    return new Promise((resolve, reject) => requests.push({ payload, resolve, reject }));
  }
`)
const aliases = new Map([
  ['@/api/prop', fixtureUrl],
  ['@/stores/game', fixtureUrl],
  [
    '@/features/tribeReward/presentation',
    new URL('../src/features/tribeReward/presentation.ts', import.meta.url).href,
  ],
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
const { useTribeRewardStore } = await import('../src/stores/tribeReward.ts')
const { game, requests } = await import(fixtureUrl)
hooks.deregister()
let store: ReturnType<typeof useTribeRewardStore>
const response = (tribeId: number, extra: Record<string, unknown> = {}) => ({
  code: 0,
  message: '',
  data: { tribe_id: tribeId, hand_reward_club_id: 5, ...extra },
})
test.beforeEach(() => {
  Object.assign(game, { isRealUser: true, sessionToken: 'test-token', loginUserId: '1' })
  requests.length = 0
  setActivePinia(createPinia())
  store = useTribeRewardStore()
})
test.afterEach(() => store.$dispose())

test('one all-config request is shared by concurrent popup loads and accepts empty configurations', async () => {
  const first = store.load(5)
  const second = store.load(5)
  assert.equal(requests.length, 1)
  assert.deepEqual(requests[0].payload, { club_id: 5, reward_type: 'all' })
  requests[0].resolve(response(10))
  await Promise.all([first, second])
  assert.equal(store.loading, false)
  assert.equal(store.failed, false)
  assert.deepEqual(store.presentation.groups, [[], [], [], []])
  assert.deepEqual(store.presentation.invite.tiers, [])
})

test('a late response from another club never replaces the currently selected club', async () => {
  const first = store.load(5)
  const second = store.load(6)
  requests[1].resolve(response(20))
  await second
  requests[0].resolve(response(10))
  await first
  assert.equal(store.clubId, 6)
  assert.equal(store.data?.tribe_id, 20)
})

test('an activity notification during a request queues one fresh reload for the latest progress', async () => {
  const first = store.load(5)
  const refreshed = store.load(5, true)
  requests[0].resolve(response(10))
  await Promise.resolve()
  assert.equal(requests.length, 2)
  requests[1].resolve(
    response(10, {
      invite_reward: [{ invite_count: 10, current_count: 12, rewarded: true, reward_gold: 100 }],
    }),
  )
  await Promise.all([first, refreshed])
  assert.equal(store.presentation.invite.tiers[0]?.credited, true)
  assert.equal(store.presentation.invite.validInvites, 12)
})

test('account changes clear current-player data and ignore requests issued by the old account', async () => {
  const old = store.load(5)
  game.loginUserId = '2'
  assert.equal(store.data, null)
  assert.equal(store.clubId, 0)
  requests[0].resolve(response(10))
  await old
  assert.equal(store.data, null)
  game.isRealUser = false
  await store.load(5)
  assert.equal(requests.length, 1)
})

test('failed requests show an error instead of mock rows and can be retried', async () => {
  const failed = store.load(5)
  requests[0].reject(new Error('offline'))
  await failed
  assert.equal(store.failed, true)
  assert.deepEqual(store.presentation.groups, [[], [], [], []])
  const retry = store.load(5)
  requests[1].resolve(response(10))
  await retry
  assert.equal(store.failed, false)
  store.invalidate(99, 99)
  assert.equal(store.revision, 0)
  store.invalidate(10, 99)
  assert.equal(store.revision, 1)
})
