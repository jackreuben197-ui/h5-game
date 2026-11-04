import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'
import {
  stageMttDetailForNavigation,
  takeMttDetailForNavigation,
} from '../src/utils/mttDetailHandoff.ts'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const stateUrl = moduleUrl('export const state = { matches: [] };')
const mocks = new Map([
  ['@/api/roomcenter', moduleUrl(`
    import { state } from '${stateUrl}';
    export async function getAllMttSngIdsApi() {
      return { code: 0, data: { mtt_id_list: state.matches } };
    }
    export async function postRoomCenterUserMatchListApi({ mtt_ids }) {
      return { code: 0, data: { mtt_list: state.matches.filter(m => mtt_ids.includes(m.match_id)) } };
    }
    export async function getRoomcenterMttDetailApi(id) {
      const mtt = state.matches.find(m => m.match_id === id);
      return { code: 0, data: { mtt: { ...mtt, template_id: mtt.detailTemplate }, state_code: mtt.state } };
    }
  `)],
  ['@/composables/usePlatformDiamondVisibility', moduleUrl('export const usePlatformDiamondVisibility = () => ({ value: false });')],
  ['@/session/experienceSession', moduleUrl('export const ensureExperienceSessionReady = async () => true;')],
  ['@/stores/appConfig', moduleUrl('export const useAppConfigStore = () => ({ clubDisplayPlatformMtt: false });')],
  ['@/stores/game', moduleUrl('export const useGameStore = () => ({ sessionToken: "session" });')],
  ['@/stores/userInfo', moduleUrl('export const useUserInfoStore = () => ({ channelDefaultClub: { club_id: 7, tribe_id: 11 } });')],
])
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const mock = mocks.get(specifier)
    if (mock) return { url: mock, shortCircuit: true }
    if (specifier.startsWith('@/')) {
      return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context)
    }
    return nextResolve(specifier, context)
  },
})
const { useLobbyBannerMatch } = await import('../src/composables/useLobbyBannerMatch.ts')
const { state } = await import(stateUrl)
hooks.deregister()

test('each click finds the earliest visible match currently open for registration', async () => {
  const now = Date.now()
  const match = (id: number, offset: number, extra: Record<string, unknown> = {}) => ({
    match_id: id,
    start_time: now + offset,
    apply_start_time: now - 60_000,
    origin_type: 2,
    relate_tribe_club_list: [{ tribe_id: 11 }],
    detailTemplate: 42,
    status: 0,
    state: 1,
    ...extra,
  })
  state.matches = [
    match(1, 6000),
    match(2, -1000, { status: 1, state: 5 }),
    match(3, 1000, { detailTemplate: 99 }),
    match(4, 2000, { status: 2 }),
    match(5, 3000, { apply_start_time: now + 1000, state: 0 }),
    match(6, 4000, { relate_tribe_club_list: [{ tribe_id: 12 }] }),
    match(7, 7000),
  ]
  const resolve = useLobbyBannerMatch()
  const first = await resolve(7, '42')
  assert.equal(first?.id, 1)
  assert.equal(first?.detail.state_code, 1)

  state.matches.push(match(8, -2000, { status: 1, state: 2 }))
  assert.equal((await resolve(7, '42'))?.id, 8)

  state.matches[7].state = 5
  assert.equal((await resolve(7, '42'))?.id, 1)

  state.matches = []
  assert.equal(await resolve(7, '42'), undefined)
})

test('the detail selected by a banner is only reused once for the same match and session', () => {
  const detail = { state_code: 1 }
  const match = { id: 42, sessionToken: 'current', detail }

  stageMttDetailForNavigation(match)
  assert.equal(takeMttDetailForNavigation(42, 'current'), detail)
  assert.equal(takeMttDetailForNavigation(42, 'current'), undefined)

  stageMttDetailForNavigation(match)
  assert.equal(takeMttDetailForNavigation(42, 'another'), undefined)

  stageMttDetailForNavigation(match)
  assert.equal(takeMttDetailForNavigation(43, 'current'), undefined)

  const discard = stageMttDetailForNavigation(match)
  discard()
  assert.equal(takeMttDetailForNavigation(42, 'current'), undefined)
})
