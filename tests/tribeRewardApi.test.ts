import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'

const mockUrl = `data:text/javascript,${encodeURIComponent(`
  export const calls = [];
  export const data = { tribe_id: 10, hand_reward_club_id: 5, hand_reward: [], invite_reward: [], first_recharge_reward: [], daily_recharge_reward: [] };
  export default { async post(...args) { calls.push(args); return { data: { code: 0, message: '', data } }; } };
`)}`
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return specifier === '@/api/http'
      ? { url: mockUrl, shortCircuit: true }
      : nextResolve(specifier, context)
  },
})
const { postPropTribeRewardInfoApi } = await import('../src/api/prop.ts')
const { calls, data } = await import(mockUrl)
hooks.deregister()

test('reward-info uses the existing authenticated prop client and preserves the documented data layer', async () => {
  const result = await postPropTribeRewardInfoApi({ club_id: 5, reward_type: 'all' })
  assert.deepEqual(calls[0], ['/prop/tribe/reward/info', { club_id: 5, reward_type: 'all' }])
  assert.equal(result.code, 0)
  assert.deepEqual(result.data, data)
  assert.deepEqual(result.data.hand_reward, [])
})
