import type {
  MttListRecord,
  MttSeriesInfoRecord,
  RoomRecord,
  RoomUser,
} from '@/api/models/roomcenter'
import { sortRoomRecordsForDisplay } from '@/utils/roomListSort'
import { isMttRegistered } from '@/utils/mttRegistration'
import { resolveSeriesLayoutByType } from '@/utils/mttCardLayout'
import { toTimestampMs } from '@/utils/time'

export type ChannelCSection = 'home' | 'poker' | 'mtt'
export type CardSize = 'large' | 'medium' | 'small'
export type PokerFilter = 'nlh' | 'plo' | 'short'
export type MttFilter = 'free' | 'paid' | 'hunter' | 'snowball'
export type LobbyCard =
  | { key: string; kind: 'poker'; room: RoomRecord }
  | { key: string; kind: 'mtt'; match: MttListRecord; size: CardSize }

export const MTT_ARTWORK_HEIGHT: Record<CardSize, number> = { large: 225, medium: 152, small: 89 }
export const isRecommended = (record: { is_top?: unknown }): boolean =>
  record.is_top === true || Number(record.is_top) === 1

export function getCardSize(seriesType: unknown, total = 0): CardSize {
  const type = Number(seriesType)
  if (![1, 2, 3].includes(type)) return 'large'
  const layout = resolveSeriesLayoutByType(type, total)
  return layout === 'lg' ? 'large' : layout === 'md' ? 'medium' : 'small'
}

// 和现有牌桌分组一致：poker_type=2 是短牌，game_type=1/2/3 是奥马哈。
export function getPokerKind(room: RoomRecord): PokerFilter {
  return Number(room.poker_type) === 2
    ? 'short'
    : Number(room.game_type) >= 1 && Number(room.game_type) <= 3
      ? 'plo'
      : 'nlh'
}

export function getMttStage(
  match: MttListRecord,
  now = Date.now(),
): 'registered' | 'registering' | 'waiting' | 'running' | 'finished' {
  if (isMttRegistered(match)) return 'registered'
  if (Number(match.status) === 1) {
    const start = toTimestampMs(match.start_time)
    const intervals = Math.max(0, Number(match.max_delay_apply_bl || 0) - 1)
    const breakInterval = Number(match.break_interval || 0)
    const breakMs =
      breakInterval > 0
        ? Math.floor(intervals / breakInterval) * Number(match.break_duration || 0) * 60000
        : 0
    const lateEnd =
      start > 0 && intervals > 0
        ? start + Number(match.upblind_interval || 0) * intervals * 1000 + breakMs
        : 0
    return lateEnd > now ? 'registering' : 'running'
  }
  if (Number(match.status) >= 2) return 'finished'
  return toTimestampMs(match.apply_start_time) > now ? 'waiting' : 'registering'
}

export function sortChannelCMtt(records: MttListRecord[], now = Date.now()): MttListRecord[] {
  const rank = { registered: 0, registering: 1, waiting: 2, running: 3, finished: 4 }
  return [...records].sort(
    (a, b) =>
      rank[getMttStage(a, now)] - rank[getMttStage(b, now)] ||
      (toTimestampMs(a.start_time) || Infinity) - (toTimestampMs(b.start_time) || Infinity) ||
      Number(a.match_id || 0) - Number(b.match_id || 0),
  )
}

/** 先分别排序，3 桌 + 1 MTT；任一类型耗尽后保留另一类型所有剩余条目。 */
export function buildChannelCFeed(
  rooms: RoomRecord[],
  matches: MttListRecord[],
  section: ChannelCSection,
  now = Date.now(),
  series: readonly MttSeriesInfoRecord[] = [],
): LobbyCard[] {
  const seriesById = new Map(series.map((item) => [Number(item.id), item]))
  const seriesCounts = new Map<number, number>()
  // 推荐过滤不改变后台系列的实际场次数，避免同一赛事在首页和比赛页尺寸不同。
  matches.forEach((match) => {
    const id = Number(match.series_id)
    if (id > 0) seriesCounts.set(id, (seriesCounts.get(id) || 0) + 1)
  })
  const tables: LobbyCard[] = sortRoomRecordsForDisplay(
    section === 'home' ? rooms.filter(isRecommended) : rooms,
  ).map((room) => ({ key: `poker-${room.rid}`, kind: 'poker', room }))
  const mtts: LobbyCard[] = sortChannelCMtt(
    section === 'home' ? matches.filter(isRecommended) : matches,
    now,
  ).map((match) => ({
    key: `mtt-${match.match_id}`,
    kind: 'mtt',
    match,
    size: getCardSize(
      seriesById.get(Number(match.series_id))?.type,
      seriesCounts.get(Number(match.series_id)),
    ),
  }))
  if (section === 'poker') return tables
  if (section === 'mtt') return mtts
  const feed: LobbyCard[] = []
  let tableIndex = 0
  let matchIndex = 0
  while (tableIndex < tables.length || matchIndex < mtts.length) {
    feed.push(...tables.slice(tableIndex, tableIndex + 3))
    tableIndex += 3
    if (matchIndex < mtts.length) feed.push(mtts[matchIndex++]!)
  }
  return feed
}

export function matchesMttFilter(match: MttListRecord, filter: MttFilter): boolean {
  if (filter === 'free') return Number(match.apply_fee_pool || 0) === 0
  if (filter === 'paid') return Number(match.apply_fee_pool || 0) > 0
  if (filter === 'hunter') return Number(match.hunter_on) > 0
  if (filter === 'snowball') {
    if (match.snowball_on != null) return Number(match.snowball_on) > 0
    // 现有协议 100 表示不滚雪球，0~99 为滚雪球猎人赛；缺字段时不猜测。
    const bonus = Number(match.hunter_bonus)
    return Number(match.hunter_on) > 0 && match.hunter_bonus != null && bonus >= 0 && bonus < 100
  }
  return true
}

export function roomDescription(room: RoomRecord): string[] {
  return [room.gameplay_description?.trim(), room.table_feature?.trim()].filter(
    (text): text is string => Boolean(text),
  )
}

export function estimateCardHeight(card: LobbyCard): number {
  return card.kind === 'mtt'
    ? MTT_ARTWORK_HEIGHT[card.size] + 60
    : 92.5 + 34 + roomDescription(card.room).length * 19
}

/** 首排左右顶部对齐，之后按已排高度放入较短列；列内始终保持输入顺序。 */
export function buildWaterfallColumns(cards: LobbyCard[]): [LobbyCard[], LobbyCard[]] {
  const columns: [LobbyCard[], LobbyCard[]] = [[], []]
  const heights = [0, 0]
  cards.forEach((card) => {
    const column = heights[0]! <= heights[1]! ? 0 : 1
    columns[column].push(card)
    heights[column]! += estimateCardHeight(card) + 7
  })
  return columns
}

// 固定锚点：1 左下、2 九点、3/4/5 顶部、6 三点；7/8 底部。
const SEATS_8 = [
  [25, 81],
  [10, 56],
  [25, 32],
  [50, 24],
  [75, 32],
  [90, 56],
  [75, 81],
  [50, 87],
]
const SEATS_9 = [...SEATS_8.slice(0, 6), [76, 81], [59, 87], [42, 87]]

export function getOccupiedSeats(
  room: RoomRecord,
): Array<{ seat: number; user: RoomUser; x: number; y: number }> {
  const users = Array.isArray(room.users) ? room.users : []
  const positions = users.some((user) => Number(user.seat) === 9) ? SEATS_9 : SEATS_8
  const seen = new Set<number>()
  return users
    .flatMap((user) => {
      const seat = Number(user.seat)
      // 不猜测座位，也不把旁观者填进空位。
      if (!Number.isInteger(seat) || seat < 1 || seat > positions.length || seen.has(seat))
        return []
      seen.add(seat)
      const [x, y] = positions[seat - 1]!
      return [{ seat, user, x: x!, y: y! }]
    })
    .sort((a, b) => a.seat - b.seat)
}
