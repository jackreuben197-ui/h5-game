import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { nextTick, ref } from 'vue'
import type {
  MttListRecord,
  MttSeriesInfoRecord,
  RoomRecord,
} from '../src/api/models/roomcenter.ts'

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/') || specifier.startsWith('.')) {
      const base = specifier.startsWith('@/')
        ? new URL(`../src/${specifier.slice(2)}`, import.meta.url)
        : new URL(specifier, context.parentURL)
      const file = new URL(`${base.href}.ts`)
      if (existsSync(file)) return nextResolve(file.href, context)
    }
    return nextResolve(specifier, context)
  },
})
const {
  formatRoomBlind,
  getRoomBlindOptions,
  getTournamentTypeOptions,
  matchesPokerFilters,
  matchesTournamentFilters,
  toggleFilterValue,
} = await import('../src/features/channelC/filters.ts')
const { useChannelCFilters } = await import('../src/composables/useChannelCFilters.ts')
hooks.deregister()

function room(rid: number, sb: number, extra: Partial<RoomRecord> = {}): RoomRecord {
  return { rid, sb, game_type: 0, poker_type: 0, ...extra }
}

test('blind options use all actual levels, remove duplicates/invalid values and sort numerically', () => {
  const rooms = [
    ...[2500, 100, 20, 300, 1000, 2000, 500, 100].map((sb, i) => room(i, sb)),
    room(10, NaN),
    room(11, 0),
    room(12, -100),
  ]
  assert.deepEqual(getRoomBlindOptions(rooms), [20, 100, 300, 500, 1000, 2000, 2500])
  assert.equal(formatRoomBlind(20), '0.2/0.4')
  assert.equal(formatRoomBlind(100), '1/2')
  assert.equal(formatRoomBlind(1000), '10/20')
})

test('table filters union selected gameplay/blinds and intersect the two groups', () => {
  const rooms = [
    room(1, 100),
    room(2, 500),
    room(3, 1000),
    room(4, 100, { game_type: 1 }),
    room(5, 500, { game_type: 3 }),
    room(6, 500, { poker_type: 2 }),
  ]
  assert.deepEqual(
    rooms
      .filter((item) => matchesPokerFilters(item, ['nlh', 'plo'], [100, 500]))
      .map((item) => item.rid),
    [1, 2, 4, 5],
  )
  assert.equal(rooms.filter((item) => matchesPokerFilters(item, [], [])).length, 6)
  assert.deepEqual(
    rooms.filter((item) => matchesPokerFilters(item, [], [500])).map((item) => item.rid),
    [2, 5, 6],
  )
  assert.equal(rooms.filter((item) => matchesPokerFilters(item, ['short'], [100])).length, 0)
})

test('tournament dropdown includes every backend-configured type even without current matches', () => {
  const series = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `Type ${i + 1}` }))
  const options = getTournamentTypeOptions([...series, { id: 1, name: 'Duplicate' }, { id: 0 }])
  assert.equal(options.length, 12)
  assert.deepEqual(options[11], { value: 12, label: 'Type 12' })
  assert.deepEqual(getTournamentTypeOptions([]), [])
  assert.equal(options[0]?.label, 'Type 1')
})

test('tournament type and category groups intersect; categories include free/paid/hunter/snowball', () => {
  const matches: MttListRecord[] = [
    { match_id: 1, series_id: 10, apply_fee_pool: 0 },
    { match_id: 2, series_id: 10, apply_fee_pool: 100 },
    { match_id: 3, series_id: 20, apply_fee_pool: 100, hunter_on: 1 },
    { match_id: 4, series_id: 30, apply_fee_pool: 100, snowball_on: 1 },
    { match_id: 5, apply_fee_pool: 0 },
  ]
  assert.deepEqual(
    matches
      .filter((item) => matchesTournamentFilters(item, [10, 20], ['free', 'hunter']))
      .map((item) => item.match_id),
    [1, 3],
  )
  assert.equal(
    matches.filter((item) => matchesTournamentFilters(item, [], ['free', 'paid'])).length,
    5,
  )
  assert.deepEqual(
    matches
      .filter((item) => matchesTournamentFilters(item, [], ['hunter', 'snowball']))
      .map((item) => item.match_id),
    [3, 4],
  )
  assert.equal(matches.filter((item) => matchesTournamentFilters(item, [], [])).length, 5)
  assert.equal(matchesTournamentFilters(matches[4]!, [10], []), false)
})

test('snowball filter respects the existing hunter bonus protocol and explicit new flags', () => {
  assert.equal(matchesTournamentFilters({ hunter_on: 1, hunter_bonus: 50 }, [], ['snowball']), true)
  assert.equal(matchesTournamentFilters({ hunter_on: 1, hunter_bonus: 0 }, [], ['snowball']), true)
  assert.equal(
    matchesTournamentFilters({ hunter_on: 1, hunter_bonus: 100 }, [], ['snowball']),
    false,
  )
  assert.equal(
    matchesTournamentFilters({ hunter_on: 0, hunter_bonus: 50 }, [], ['snowball']),
    false,
  )
  assert.equal(matchesTournamentFilters({ hunter_on: 1 }, [], ['snowball']), false)
  assert.equal(
    matchesTournamentFilters({ snowball_on: 0, hunter_on: 1, hunter_bonus: 50 }, [], ['snowball']),
    false,
  )
})

test('multiselect toggles independently without changing the previous selection array', () => {
  const selected = ['nlh']
  assert.deepEqual(toggleFilterValue(selected, 'plo'), ['nlh', 'plo'])
  assert.deepEqual(toggleFilterValue(selected, 'nlh'), [])
  assert.deepEqual(selected, ['nlh'])
})

test('changing gameplay preserves multiple blinds; backend removal clears only obsolete options', async () => {
  const rooms = ref([room(1, 100), room(2, 500, { game_type: 1 })])
  const matches = ref<MttListRecord[]>([])
  const series = ref<MttSeriesInfoRecord[]>([
    { id: 10, name: 'A' },
    { id: 20, name: 'B' },
  ])
  const filters = useChannelCFilters(rooms, matches, series)
  filters.blindFilter.value = [100, 500]
  filters.tournamentFilter.value = [10, 20]
  filters.pokerFilter.value = ['plo']
  await nextTick()
  assert.deepEqual(filters.blinds.value, [100, 500])
  assert.deepEqual(filters.blindFilter.value, [100, 500])
  assert.deepEqual(
    filters.filteredRooms.value.map((item) => item.rid),
    [2],
  )

  rooms.value = [rooms.value[1]!]
  series.value = [series.value[1]!]
  await nextTick()
  assert.deepEqual(filters.blindFilter.value, [500])
  assert.deepEqual(filters.tournamentFilter.value, [20])
  filters.mttFilter.value = ['free', 'hunter']
  filters.resetFilters()
  assert.deepEqual(filters.pokerFilter.value, [])
  assert.deepEqual(filters.blindFilter.value, [])
  assert.deepEqual(filters.tournamentFilter.value, [])
  assert.deepEqual(filters.mttFilter.value, [])
})
