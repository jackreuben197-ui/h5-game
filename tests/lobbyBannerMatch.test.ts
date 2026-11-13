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

test('each click finds the earliest visible match whose registration has not closed', async () => {
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
    match(2, -1000, { status: 1, state: 5 }), // 报名已截止 → 排除
    match(3, 1000, { detailTemplate: 99 }), // 模板不符 → 排除
    match(4, 2000, { status: 2 }), // 已结束 → 排除
    match(5, 3000, { apply_start_time: now + 1000, state: 0 }), // 报名未开始 → 命中
    match(6, 4000, { relate_tribe_club_list: [{ tribe_id: 12 }] }), // 不可见 → 排除
    match(7, 7000),
  ]
  const resolve = useLobbyBannerMatch()
  const first = await resolve(7, '42')
  assert.equal(first?.id, 5)
  assert.equal(first?.detail.state_code, 0)

  // 开赛最早的一场即使已开赛但仍在延迟报名，也要命中。
  state.matches.push(match(8, -2000, { status: 1, state: 2 }))
  assert.equal((await resolve(7, '42'))?.id, 8)

  // 该场报名截止后，自动跳到下一场开赛最早的比赛（含报名未开始的比赛）。
  state.matches[7].state = 5
  assert.equal((await resolve(7, '42'))?.id, 5)

  // 当前玩家已报名、等待入场的比赛仍然可以进入。
  state.matches[7].state = 4
  assert.equal((await resolve(7, '42'))?.id, 8)

  // 剩余比赛报名均已截止时不跳转。
  state.matches = [match(9, 1000, { state: 5 }), match(10, 2000, { state: 7 })]
  assert.equal(await resolve(7, '42'), undefined)

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
