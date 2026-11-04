import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'
import type { MttIdInfoRecord, MttListRecord, RoomRecord } from '../src/api/models/roomcenter.ts'

const mockUrl = `data:text/javascript,${encodeURIComponent(`
  import { computed, reactive } from ${JSON.stringify(import.meta.resolve('vue'))};
  export const state = reactive({
    channel: false,
    diamond: undefined,
    app: { globalConfig: {}, clubDisplayPlatformMtt: true },
    rooms: { records: [] },
    mtts: { records: [], mttIdMetaMap: {} },
    user: { clubList: [], currentClub: null, channelDefaultClub: null },
  });
  export const useAppConfigStore = () => state.app;
  export const useRoomListStore = () => state.rooms;
  export const useMttListStore = () => state.mtts;
  export const useUserInfoStore = () => state.user;
  export const isChannelPackageHost = () => state.channel;
  export const usePlatformDiamondVisibility = () => computed(() => state.diamond);
`)}`
const aliases = new Map([
  ['@/utils/roomVisibility', new URL('../src/utils/roomVisibility.ts', import.meta.url).href],
  ['@/utils/mttVisibility', new URL('../src/utils/mttVisibility.ts', import.meta.url).href],
])
for (const name of [
  'stores/appConfig',
  'stores/roomList',
  'stores/mttList',
  'stores/userInfo',
  'utils/channelPackage',
  'composables/usePlatformDiamondVisibility',
]) {
  aliases.set(`@/${name}`, mockUrl)
}
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const url = aliases.get(specifier)
    return url ? { url, shortCircuit: true } : nextResolve(specifier, context)
  },
})
const { useLobbyFeed } = await import('../src/composables/useLobbyFeed.ts')
const { state } = await import(mockUrl)
hooks.deregister()

const clubs = [
  { club_id: 10, tribe_id: 100, random_id: 10010, club_name: '光头协会' },
  { club_id: 20, tribe_id: 200, random_id: 10020 },
  { club_id: 30, tribe_id: 300, random_id: 10030 },
]

function room(rid: number, tribeId: number, clubIds = [0]): RoomRecord {
  return {
    rid,
    game_type: 0,
    poker_type: 0,
    sb: 100,
    origin_type: 2,
    relate_tribe_club_list: [{ tribe_id: tribeId, club_ids: clubIds }],
  }
}

function setRoomsAndMatches(records: RoomRecord[]): void {
  state.rooms.records = records
  // 赛事可见关系只放在 ID 元信息，验证实际接口的两段响应可以合并筛选。
  state.mtts.records = records.map((record) => ({
    match_id: record.rid,
    game_type: record.game_type,
    gold_type: record.gold_type,
    participants: 5,
  } as MttListRecord))
  state.mtts.mttIdMetaMap = Object.fromEntries(records.map((record) => [
    record.rid,
    {
      origin_type: record.origin_type,
      relate_club_ids: record.relate_club_ids,
      relate_tribe_club_list: record.relate_tribe_club_list,
    } as MttIdInfoRecord,
  ]))
}

test.beforeEach(() => {
  state.channel = false
  state.diamond = undefined
  state.app.clubDisplayPlatformMtt = true
  state.user.clubList = [...clubs]
  state.user.currentClub = clubs[0]
  state.user.channelDefaultClub = null
  setRoomsAndMatches([])
})

test('official zones aggregate joined alliances even when the selected alliance has no games', () => {
  setRoomsAndMatches([room(1, 200), room(2, 300), room(3, 999)])
  const feed = useLobbyFeed()

  assert.deepEqual(feed.visibleRooms.value.map((record) => record.rid), [1, 2])
  assert.deepEqual(feed.visibleMatches.value.map((record) => record.match_id), [1, 2])
  assert.equal(feed.visibleMatches.value.reduce((sum, record) => sum + Number(record.participants), 0), 10)

  state.user.currentClub = clubs[1]
  assert.deepEqual(feed.visibleRooms.value.map((record) => record.rid), [1, 2])
  assert.deepEqual(feed.visibleMatches.value.map((record) => record.match_id), [1, 2])
})

test('shared alliances appear once and club restrictions match the same joined membership', () => {
  state.user.clubList.push({ club_id: 40, tribe_id: 200 })
  setRoomsAndMatches([
    room(1, 200),
    room(2, 200, [20]),
    room(3, 200, [999]),
    room(4, 100, [20]),
    room(5, 0, [30]),
    { ...room(6, 0), origin_type: 3, relate_club_ids: [20] },
    { ...room(7, 0), origin_type: 3, relate_club_ids: [999] },
  ])
  const feed = useLobbyFeed()

  assert.deepEqual(feed.visibleRooms.value.map((record) => record.rid), [1, 2, 5, 6])
  assert.deepEqual(feed.visibleMatches.value.map((record) => record.match_id), [1, 2, 5, 6])
})

test('membership changes and incoming room and match updates recompute the shared feed', () => {
  setRoomsAndMatches([room(1, 200), room(2, 300)])
  const feed = useLobbyFeed()
  assert.equal(feed.visibleRooms.value.length, 2)
  assert.equal(feed.visibleMatches.value.length, 2)

  state.user.clubList.splice(1, 1)
  assert.deepEqual(feed.visibleRooms.value.map((record) => record.rid), [2])
  assert.deepEqual(feed.visibleMatches.value.map((record) => record.match_id), [2])

  state.user.clubList.push(clubs[1])
  state.rooms.records.push(room(3, 200))
  state.mtts.records.push({ match_id: 3, game_type: 0 })
  state.mtts.mttIdMetaMap[3] = room(3, 200)
  assert.deepEqual(feed.visibleRooms.value.map((record) => record.rid), [1, 2, 3])
  assert.deepEqual(feed.visibleMatches.value.map((record) => record.match_id), [1, 2, 3])
})

test('cross-alliance entry uses a matching joined club and retains the selected club when allowed', () => {
  const target = room(1, 200)
  const feed = useLobbyFeed()

  assert.equal(feed.resolveRoomClub(target)?.club_id, 20)
  assert.equal(feed.resolveRoomClub(target)?.random_id, 10020)
  assert.equal(state.user.currentClub.club_id, 10)
  state.user.clubList.push({ club_id: 40, tribe_id: 200, random_id: 10040 })
  state.user.currentClub = state.user.clubList[3]
  assert.equal(feed.resolveRoomClub(target)?.club_id, 40)
  assert.equal(feed.resolveRoomClub(room(2, 200, [20]))?.club_id, 20)
  assert.equal(feed.resolveRoomClub(room(3, 999)), null)
})

test('channel feeds remain scoped to the channel club with platform switches applied', () => {
  state.channel = true
  state.diamond = false
  state.user.channelDefaultClub = clubs[1]
  setRoomsAndMatches([
    room(1, 100),
    room(2, 200),
    room(3, 300),
    { ...room(4, 0), origin_type: 1, gold_type: 4 },
    { ...room(5, 0), origin_type: 1, gold_type: 1 },
  ])
  const feed = useLobbyFeed()

  assert.deepEqual(feed.visibleRooms.value.map((record) => record.rid), [2, 5])
  assert.deepEqual(feed.visibleMatches.value.map((record) => record.match_id), [2, 5])
  assert.equal(feed.resolveRoomClub(room(2, 200))?.club_id, 20)
  state.app.clubDisplayPlatformMtt = false
  assert.deepEqual(feed.visibleMatches.value.map((record) => record.match_id), [2])
})

test('official platform visibility and hidden mahjong matches retain their existing rules', () => {
  setRoomsAndMatches([
    { ...room(1, 0), origin_type: 1, gold_type: 4 },
    { ...room(2, 200), game_type: 6 },
  ])
  const feed = useLobbyFeed()

  assert.deepEqual(feed.visibleRooms.value.map((record) => record.rid), [1, 2])
  assert.deepEqual(feed.visibleMatches.value.map((record) => record.match_id), [1])
  state.app.clubDisplayPlatformMtt = false
  assert.equal(feed.visibleMatches.value.length, 0)
})
