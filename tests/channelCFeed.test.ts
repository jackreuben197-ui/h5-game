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
const {
  buildChannelCFeed,
  buildWaterfallColumns,
  getMttStage,
  getCardSize,
  isRecommended,
  estimateCardHeight,
  matchesMttFilter,
  getPokerKind,
  sortChannelCMtt,
} = await import('../src/features/channelC/model.ts')
const { getOccupiedSeats, roomDescription, getRoomTimeText, getRoomBuyIn } = await import(
  '../src/features/channelC/pokerCard.ts'
)
hooks.deregister()
const { resolveChannelMenu } = await import('../src/features/channelC/menu.ts')

test('channel menu follows the server enum with A as the unconfigured default', () => {
  assert.equal(resolveChannelMenu({ h5_menu: 1 }), 1)
  assert.equal(resolveChannelMenu({ h5_menu: 2 }), 2)
  assert.equal(resolveChannelMenu({ h5_menu: 3 }), 3)
  assert.equal(resolveChannelMenu(null), 2)
  assert.equal(resolveChannelMenu({ h5_menu: 0 }), 2)
})

const now = Date.parse('2026-10-27T08:00:00Z')
function room(rid: number, extra: Partial<RoomRecord> = {}): RoomRecord {
  return {
    rid,
    game_type: 0,
    poker_type: 0,
    sb: 100,
    seat_count: 8,
    empty_seat: 3,
    create_time: now + rid * 1000,
    is_top: 1,
    ...extra,
  }
}
function match(match_id: number, extra: Partial<MttListRecord> = {}): MttListRecord {
  return {
    match_id,
    status: 0,
    apply_start_time: now - 1000,
    start_time: now + match_id * 3600000,
    is_top: 1,
    ...extra,
  }
}

test('only the real is_top flag enables recommendation; missing flags and legacy mocks do not', () => {
  assert.equal(isRecommended({ is_top: 1 }), true)
  assert.equal(isRecommended({ is_top: true }), false)
  assert.equal(isRecommended({ is_top: '1' }), false)
  for (const value of [0, false, undefined, null, 2, '0']) {
    assert.equal(isRecommended({ is_top: value }), false)
  }
  const legacyRoom = room(101, { is_top: undefined, is_recommended: true, is_hot: true })
  const legacyMatch = match(101, { is_top: 0, is_recommended: true, is_hot: true })
  assert.deepEqual(buildChannelCFeed([legacyRoom], [legacyMatch], 'home', now), [])
  assert.equal(buildChannelCFeed([legacyRoom], [], 'poker', now).length, 1)
  assert.equal(buildChannelCFeed([], [legacyMatch], 'mtt', now).length, 1)
})

test('MTT sizes share A/B series types and count rules, with large as the C default', () => {
  assert.deepEqual(
    [1, 2, 3].map((type) => getCardSize(type, 6)),
    ['large', 'medium', 'small'],
  )
  assert.deepEqual(
    [1, 2, 3].map((type) => getCardSize(type, 1)),
    ['large', 'large', 'large'],
  )
  assert.equal(getCardSize(3, 2), 'medium')
  assert.equal(getCardSize(3, 3), 'small')
  for (const value of [undefined, null, 0, 4, 'unknown']) {
    assert.equal(getCardSize(value, 6), 'large')
  }
})

test('series configuration controls actual and waterfall sizes before recommendation filtering', () => {
  const records = [
    match(1, { series_id: 10 }),
    match(2, { series_id: 10, is_top: 0 }),
    match(3, { series_id: 20 }),
    match(4, { series_id: 20, is_top: 0 }),
    match(5, { series_id: 20, is_top: 0 }),
    match(6, { card_size: 'small' }),
    match(7, { series_id: 30 }),
    match(8, { series_id: 40 }),
  ]
  const series = [{ id: 10, type: 2 }, { id: 20, type: 3 }, { id: 30 }, { id: 40, type: 9 }]
  const all = buildChannelCFeed([], records, 'mtt', now, series)
  const recommended = buildChannelCFeed([], records, 'home', now, series)
  assert.deepEqual(
    all.map((card) => (card.kind === 'mtt' ? card.size : null)),
    ['medium', 'medium', 'small', 'small', 'small', 'large', 'large', 'large'],
  )
  assert.deepEqual(
    recommended.map((card) => (card.kind === 'mtt' ? [card.match.match_id, card.size] : null)),
    [
      [1, 'medium'],
      [3, 'small'],
      [6, 'large'],
      [7, 'large'],
      [8, 'large'],
    ],
  )
  assert.deepEqual(recommended.map(estimateCardHeight), [212, 149, 285, 285, 285])
  assert.equal(all[0]?.kind === 'mtt' && all[0].match, records[0])
  assert.equal(Object.hasOwn(records[0]!, 'card_size'), false)
})

test('recommendation feed filters before ranking and interleaves 3 tables then 1 MTT', () => {
  const rooms = [
    room(1, { empty_seat: 0 }),
    room(2),
    room(3, { participation_status: 1, empty_seat: 0 }),
    room(4, { participation_status: 1 }),
    room(5),
    room(6),
    room(7, { is_top: false }),
    room(8, { is_top: undefined }),
  ]
  const matches = [match(2), match(1), match(3, { mtt_buy: 1 }), match(4, { is_top: 0 })]
  const feed = buildChannelCFeed(rooms, matches, 'home', now)
  assert.deepEqual(
    feed.map((card) => card.key),
    ['poker-4', 'poker-6', 'poker-5', 'mtt-3', 'poker-2', 'poker-3', 'poker-1', 'mtt-1', 'mtt-2'],
  )
  assert.equal(buildChannelCFeed(rooms, matches, 'poker', now).length, 8)
  assert.equal(buildChannelCFeed(rooms, matches, 'mtt', now).length, 4)
  assert.deepEqual(
    rooms.map((record) => record.rid),
    [1, 2, 3, 4, 5, 6, 7, 8],
  )
})

test('mixing handles zero, partial, and exhausted categories without dropping or duplicating cards', () => {
  for (const [tableCount, matchCount] of [
    [0, 0],
    [0, 4],
    [7, 0],
    [2, 4],
    [10, 1],
  ]) {
    const feed = buildChannelCFeed(
      Array.from({ length: tableCount! }, (_, i) => room(i + 1)),
      Array.from({ length: matchCount! }, (_, i) => match(i + 1)),
      'home',
      now,
    )
    assert.equal(feed.length, tableCount! + matchCount!)
    assert.equal(new Set(feed.map((card) => card.key)).size, feed.length)
  }
  assert.equal(
    buildChannelCFeed(
      [room(1, { is_top: undefined })],
      [match(1, { is_top: undefined })],
      'home',
      now,
    ).length,
    0,
  )
})

test('MTTs sort registered, registration open, waiting, then by ascending start time', () => {
  const records = [
    match(1, { apply_start_time: now + 5000 }),
    match(3),
    match(4, { mtt_buy: 1 }),
    match(2),
    match(5, { mtt_buy: 1 }),
  ]
  assert.deepEqual(
    sortChannelCMtt(records, now).map((item) => item.match_id),
    [4, 5, 2, 3, 1],
  )
  assert.equal(getMttStage(match(1, { apply_start_time: now + 1000 }), now), 'waiting')
  assert.equal(getMttStage(match(1, { apply_start_time: now + 1000 }), now + 1000), 'registering')
  // 迟报名截止沿用项目的 (截止盲注级别 - 1) 与休息时长算法。
  const running = match(1, {
    status: 1,
    start_time: now - 100000,
    upblind_interval: 60,
    max_delay_apply_bl: 3,
    break_interval: 2,
    break_duration: 1,
  })
  assert.equal(getMttStage(running, now + 79999), 'registering')
  assert.equal(getMttStage(running, now + 80000), 'running')
})

test('waterfall starts both columns at the top and appends subsequent cards to the shorter column', () => {
  const cards = buildChannelCFeed([room(1), room(2), room(3), room(4)], [match(1)], 'home', now)
  const columns = buildWaterfallColumns(cards)
  assert.equal(columns[0][0], cards[0])
  assert.equal(columns[1][0], cards[1])
  assert.deepEqual(
    columns.map((column) => column.map((card) => card.key)),
    [
      ['poker-4', 'poker-2', 'poker-1'],
      ['poker-3', 'mtt-1'],
    ],
  )
  assert.equal(columns.flat().length, cards.length)
})

test('seats preserve physical numbers, omit empty/invalid/duplicate seats and keep 1 anchored for 8 and 9 players', () => {
  const eight = getOccupiedSeats(
    room(1, {
      users: [{ seat: 6 }, { seat: 1 }, { seat: 4 }, { seat: 0 }, {}, { seat: 4 }, { seat: 10 }],
    }),
  )
  assert.deepEqual(
    eight.map((item) => item.seat),
    [1, 4, 6],
  )
  assert.deepEqual(
    eight.find((item) => item.seat === 1),
    { seat: 1, user: { seat: 1 }, x: 25, y: 81.8 },
  )
  const nine = getOccupiedSeats(
    room(1, { seat_count: 9, users: Array.from({ length: 9 }, (_, i) => ({ seat: i + 1 })) }),
  )
  assert.equal(nine.length, 9)
  assert.deepEqual([nine[0]!.x, nine[0]!.y], [25, 81.8])
  assert.deepEqual(
    nine.slice(6).map((item) => item.x),
    [75.5, 59.1, 42.1],
  )
  const eightAtLegacyTable = getOccupiedSeats(
    room(1, { seat_count: 9, users: [{ seat: 7 }, { seat: 8 }] }),
  )
  assert.deepEqual(
    eightAtLegacyTable.map((item) => item.x),
    [75.5, 59.1],
  )
})

test('game types, optional descriptions, and tournament filters follow their data fields', () => {
  assert.equal(getPokerKind(room(1, { game_type: 3 })), 'plo')
  assert.equal(getPokerKind(room(1, { poker_type: 2 })), 'short')
  assert.deepEqual(roomDescription(room(1, { room_intro: ' ', room_features: '' })), [])
  assert.deepEqual(roomDescription(room(1, { room_features: '欢乐竞技' })), ['欢乐竞技'])
  assert.equal(matchesMttFilter(match(1, { apply_fee_pool: 0 }), 'free'), true)
  assert.equal(matchesMttFilter(match(1, { apply_fee_pool: 100 }), 'paid'), true)
  assert.equal(matchesMttFilter(match(1, { hunter_on: 1 }), 'hunter'), true)
  assert.equal(matchesMttFilter(match(1, { snowball_on: 0 }), 'snowball'), false)
})

test('new room descriptions use server fields and never fill missing fields with old mock data', () => {
  assert.deepEqual(
    roomDescription(room(1, { room_intro: '  真实简介 ', room_features: '真实特色' })),
    ['真实简介', '真实特色'],
  )
  assert.deepEqual(
    roomDescription(room(1, { gameplay_description: '旧模拟', table_feature: '旧模拟' })),
    [],
  )
  const without = buildChannelCFeed([room(1)], [], 'poker', now)[0]!
  const withBoth = buildChannelCFeed(
    [room(1, { room_intro: '简介', room_features: '特色' })],
    [],
    'poker',
    now,
  )[0]!
  assert.equal(estimateCardHeight(withBoth) - estimateCardHeight(without), 38)
})

test('seats 1 through 7 remain fixed, seat 8 centers only on an eight-seat table', () => {
  const users = Array.from({ length: 9 }, (_, i) => ({ seat: i + 1 }))
  const eight = getOccupiedSeats(room(1, { seat_count: 8, users: users.slice(0, 8) }))
  const nine = getOccupiedSeats(room(1, { seat_count: 9, users }))
  for (const count of [2, 6, 7, 8]) {
    const seats = getOccupiedSeats(room(1, { seat_count: count, users: users.slice(0, count) }))
    assert.deepEqual(seats.slice(0, Math.min(count, 7)), nine.slice(0, Math.min(count, 7)))
  }
  assert.equal(eight[7]?.x, 49.7)
  assert.equal(nine[7]?.x, 59.1)
  assert.equal(nine[8]?.x, 42.1)
  const sparse = getOccupiedSeats(room(1, { seat_count: 9, users: [{ seat: 8 }] }))
  assert.equal(sparse[0]?.x, 59.1)
  assert.equal(sparse.length, 1)
})

test('room time follows start time and duration, updates with now and clamps expired/future tables', () => {
  const table = room(1, {
    start_time: new Date(now - (4 * 3600 + 32 * 60) * 1000).toISOString(),
    play_duration: 8 * 3600,
  })
  assert.equal(getRoomTimeText(table, now), '3h 28m/8h')
  assert.equal(getRoomTimeText(table, now + 60000), '3h 27m/8h')
  assert.equal(getRoomTimeText(table, now + 4 * 3600000), '0s/8h')
  assert.equal(
    getRoomTimeText(
      room(1, { start_time: new Date(now + 1000).toISOString(), play_duration: 3600 }),
      now,
    ),
    '1h/1h',
  )
  assert.equal(getRoomTimeText(room(1, { play_duration: 600 }), now), '10m/10m')
  assert.equal(getRoomTimeText(room(1), now), '0s/0s')
})

test('buy-in uses the real minimum BB multiplier and small blind without changing source data', () => {
  const table = room(1, { sb: 100, min_rate: 444 })
  assert.equal(getRoomBuyIn(table), 88800)
  assert.equal(getRoomBuyIn(room(2, { sb: 10, min_rate: 50 })), 1000)
  assert.equal(getRoomBuyIn(room(3)), 0)
  assert.equal(table.min_rate, 444)
})
