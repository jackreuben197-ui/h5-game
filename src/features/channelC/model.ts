import type { ExtendGameRecord } from '@/api/casino'
import type { MttListRecord, MttSeriesInfoRecord, RoomRecord } from '@/api/models/roomcenter'
import { sortRoomRecordsForDisplay } from '@/utils/roomListSort'
import { isMttRegistered } from '@/utils/mttRegistration'
import { toTimestampMs } from '@/utils/time'
import { roomDescription } from '@/features/channelC/pokerCard'

export type ChannelCSection = 'home' | 'poker' | 'mtt'
export type CardSize = 'large' | 'medium' | 'small'
export type PokerFilter = 'nlh' | 'plo' | 'short'
export type MttFilter = 'free' | 'paid' | 'hunter' | 'snowball'
export type LobbyCard =
  | { key: string; kind: 'poker'; room: RoomRecord }
  | { key: string; kind: 'mtt'; match: MttListRecord; size: CardSize; seriesName?: string }
  | { key: string; kind: 'game'; game: ExtendGameRecord; size?: CardSize }

export const MTT_ARTWORK_HEIGHT: Record<CardSize, number> = { large: 225, medium: 152, small: 89 }
export const GAME_ARTWORK_HEIGHT: Record<CardSize, number> = {
  large: 198.7,
  medium: 152.7,
  small: 121.3,
}
const CASINO_SIZE_CYCLE: readonly CardSize[] = ['large', 'medium', 'medium', 'small']
export const isRecommended = (record: { is_top?: unknown }): boolean =>
  record.is_top === 1

export function getCardSize(seriesType: unknown): CardSize {
  // C 版按系列配置直接展示；不随筛选结果数量提升卡片尺寸。
  const sizes: Record<number, CardSize> = { 1: 'large', 2: 'medium', 3: 'small' }
  return sizes[Number(seriesType)] || 'medium'
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
  section: ChannelCSection | 'search',
  now = Date.now(),
  series: readonly MttSeriesInfoRecord[] = [],
  games: readonly ExtendGameRecord[] = [],
): LobbyCard[] {
  const seriesById = new Map(
    series.filter((item) => Number(item.id) > 0).map((item) => [Number(item.id), item]),
  )
  const tables: LobbyCard[] = sortRoomRecordsForDisplay(
    section === 'home' ? rooms.filter(isRecommended) : rooms,
  ).map((room) => ({ key: `poker-${room.rid}`, kind: 'poker', room }))
  const mtts: LobbyCard[] = sortChannelCMtt(
    section === 'home' ? matches.filter(isRecommended) : matches,
    now,
  ).map((match) => {
    const matchSeries = seriesById.get(Number(match.series_id))
    return {
      key: `mtt-${match.match_id}`,
      kind: 'mtt',
      match,
      size: getCardSize(matchSeries?.type),
      seriesName: matchSeries?.name?.trim(),
    }
  })
  if (section === 'poker') return tables
  if (section === 'mtt') return mtts
  const casino: LobbyCard[] =
    section === 'home'
      ? games.map((game) => ({ key: `game-${game.id}`, kind: 'game', game }))
      : []
  return interleaveChannelCCards(tables, mtts, casino)
}

/** 首页娱乐场分类的瀑布流：接口图片尺寸一致，卡片高度按固定节奏循环。 */
export function buildCasinoCards(games: readonly ExtendGameRecord[]): LobbyCard[] {
  return games.map((game, index) => ({
    key: `casino-${game.id}-${index}`,
    kind: 'game',
    game,
    size: CASINO_SIZE_CYCLE[index % CASINO_SIZE_CYCLE.length]!,
  }))
}

/** 首页与搜索共用的 3 桌 + 1 MTT 混排；首页每个 MTT 后跟 1 个游戏，保留不足一组的剩余牌桌和比赛。 */
export function interleaveChannelCCards(
  tables: readonly LobbyCard[],
  mtts: readonly LobbyCard[],
  games: readonly LobbyCard[] = [],
): LobbyCard[] {
  const feed: LobbyCard[] = []
  let tableIndex = 0
  let matchIndex = 0
  let gameIndex = 0
  while (tableIndex < tables.length || matchIndex < mtts.length) {
    feed.push(...tables.slice(tableIndex, tableIndex + 3))
    tableIndex += 3
    if (matchIndex < mtts.length) {
      feed.push(mtts[matchIndex++]!)
      if (gameIndex < games.length) feed.push(games[gameIndex++]!)
    }
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

export function estimateCardHeight(card: LobbyCard): number {
  if (card.kind === 'game') return (card.size ? GAME_ARTWORK_HEIGHT[card.size] : 146.25) + 26.7
  return card.kind === 'mtt'
    ? MTT_ARTWORK_HEIGHT[card.size] + 60
    : 92.5 + 34 + roomDescription(card.room).length * 19
}

/** 首排左右顶部对齐，之后按已排高度放入较短列；列内始终保持输入顺序。 */
export function buildWaterfallColumns(cards: readonly LobbyCard[]): [LobbyCard[], LobbyCard[]] {
  const columns: [LobbyCard[], LobbyCard[]] = [[], []]
  const heights = [0, 0]
  cards.forEach((card) => {
    const column = heights[0]! <= heights[1]! ? 0 : 1
    columns[column].push(card)
    heights[column]! += estimateCardHeight(card) + 7
  })
  return columns
}
