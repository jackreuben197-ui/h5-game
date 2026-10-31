import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import test from 'node:test'
import type { MttListRecord, RoomRecord } from '../src/api/models/roomcenter.ts'

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const base = new URL(`../src/${specifier.slice(2)}`, import.meta.url)
      const file = new URL(`${base.href}.ts`)
      return nextResolve(existsSync(file) ? file.href : base.href, context)
    }
    return nextResolve(specifier, context)
  },
})
const { buildChannelCSearchFeed } = await import('../src/features/channelC/search.ts')
const { buildWaterfallColumns } = await import('../src/features/channelC/model.ts')
hooks.deregister()

const now = Date.parse('2026-10-28T04:00:00Z')
function room(rid: number, extra: Partial<RoomRecord> = {}): RoomRecord {
  return {
    rid,
    name: `Poker ${rid}`,
    sb: 100,
    game_type: 0,
    poker_type: 0,
    is_top: 0,
    seat_count: 8,
    empty_seat: 2,
    create_time: now + rid * 1000,
    ...extra,
  }
}
function match(match_id: number, extra: Partial<MttListRecord> = {}): MttListRecord {
  return {
    match_id,
    name: `Poker MTT ${match_id}`,
    status: 0,
    apply_start_time: now - 1000,
    start_time: now + match_id * 60000,
    is_top: 0,
    ...extra,
  }
}

test('blank input stays in the initial state instead of listing the entire club', () => {
  for (const query of ['', '   ', '\t\n']) {
    assert.deepEqual(buildChannelCSearchFeed([room(1)], [match(2)], query, [], now), [])
  }
})

test('name searches match partial names, casing, trimmed input and full-width characters', () => {
  const rooms = [room(12, { name: '德州扑克房' }), room(13, { name: 'Alpha Poker' })]
  const matches = [match(99, { name: '德州 MTT' })]
  assert.deepEqual(
    buildChannelCSearchFeed(rooms, matches, ' 德州 ', [], now).map((card) => card.key),
    ['poker-12', 'mtt-99'],
  )
  assert.deepEqual(
    buildChannelCSearchFeed(rooms, matches, 'aLpHa', [], now).map((card) => card.key),
    ['poker-13'],
  )
  assert.deepEqual(
    buildChannelCSearchFeed(rooms, matches, 'Ａｌｐｈａ', [], now).map((card) => card.key),
    ['poker-13'],
  )
  assert.equal(buildChannelCSearchFeed(rooms, matches, 'does not exist', [], now).length, 0)
})

test('both table and tournament IDs are searchable, including unnamed MTT fallbacks', () => {
  const rooms = [room(12345, { name: '' })]
  const matches = [match(12346, { name: '' })]
  assert.deepEqual(
    buildChannelCSearchFeed(rooms, matches, '1234', [], now).map((card) => card.key),
    ['poker-12345', 'mtt-12346'],
  )
  assert.deepEqual(
    buildChannelCSearchFeed(rooms, matches, 'mtt', [], now).map((card) => card.key),
    ['mtt-12346'],
  )
  assert.equal(buildChannelCSearchFeed(rooms, matches, '不存在', [], now).length, 0)
})

test('search includes real non-recommended records and retains ranking plus 3-table/1-MTT mixing', () => {
  const rooms = [
    room(1, { participation_status: 1 }),
    room(2),
    room(3),
    room(4),
    room(5, { name: 'unmatched' }),
  ]
  const matches = [match(1), match(2, { mtt_buy: 1 }), match(3, { name: 'unmatched' })]
  const cards = buildChannelCSearchFeed(rooms, matches, 'poker', [], now)
  assert.deepEqual(
    cards.map((card) => card.key),
    ['poker-1', 'poker-4', 'poker-3', 'mtt-2', 'poker-2', 'mtt-1'],
  )
  assert.equal(new Set(cards.map((card) => card.key)).size, 6)
  const columns = buildWaterfallColumns(cards)
  assert.equal(columns[0][0], cards[0])
  assert.equal(columns[1][0], cards[1])
  assert.equal(columns.flat().length, cards.length)
})

test('search keeps the series card size and original record even when only one result matches', () => {
  const matches = [
    match(1, { name: 'Needle', series_id: 10 }),
    match(2, { series_id: 10 }),
    match(3, { series_id: 10 }),
  ]
  const cards = buildChannelCSearchFeed([], matches, 'needle', [{ id: 10, type: 3 }], now)
  assert.equal(cards.length, 1)
  assert.equal(cards[0]?.kind === 'mtt' && cards[0].size, 'small')
  assert.equal(cards[0]?.kind === 'mtt' && cards[0].match, matches[0])
  assert.equal(matches[0]?.name, 'Needle')
})

test('localized names are searchable without replacing the original server name', () => {
  const rooms = [room(1, { name: 'table-name-key' })]
  const cards = buildChannelCSearchFeed(rooms, [], '本地化', [], now, (name) =>
    name === 'table-name-key' ? '本地化牌桌' : name,
  )
  assert.equal(cards[0]?.kind === 'poker' && cards[0].room, rooms[0])
  assert.equal(rooms[0]?.name, 'table-name-key')
})

test('MTT names match the current language and suffix while preserving IDs and server records', () => {
  const matches = [match(42, { name: 'MTT2025-01' })]
  const names = {
    cn: '周末锦标赛-01',
    en: 'Weekend Tournament-01',
    pt: 'Torneio de Fim de Semana-01',
  }
  for (const [locale, localizedName] of Object.entries(names)) {
    const resolveName = (name: string, kind: 'poker' | 'mtt') =>
      kind === 'mtt' && name === 'MTT2025-01' ? localizedName : name
    const search = (query: string) =>
      buildChannelCSearchFeed([], matches, query, [], now, resolveName)

    for (const query of [localizedName.slice(0, -3), '-01', '42']) {
      const cards = search(query)
      assert.equal(cards.length, 1)
      assert.equal(cards[0]?.kind === 'mtt' && cards[0].match, matches[0])
    }
    for (const [otherLocale, otherName] of Object.entries(names)) {
      if (otherLocale !== locale) assert.equal(search(otherName).length, 0)
    }
    assert.equal(search('MTT2025').length, 0)
  }
  assert.equal(matches[0]?.name, 'MTT2025-01')
})

test('MTT names fall back to the ordinary dictionary or server name when no template matches', () => {
  const matches = [
    match(1, { name: 'dictionary-key' }),
    match(2, { name: 'Custom Tournament' }),
  ]
  const resolveName = (name: string) => (name === 'dictionary-key' ? '普通词典比赛名' : name)
  assert.deepEqual(
    buildChannelCSearchFeed([], matches, '词典比赛', [], now, resolveName).map((card) => card.key),
    ['mtt-1'],
  )
  assert.deepEqual(
    buildChannelCSearchFeed([], matches, 'custom', [], now, resolveName).map((card) => card.key),
    ['mtt-2'],
  )
})
