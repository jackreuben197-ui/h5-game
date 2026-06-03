

export type ReplayActionTone = 'blue' | 'red' | 'black'
export type ReplayMetricIcon = 'mushroom' | 'chips'
export type CardSuit = 'c' | 'h' | 'd' | 's'
export interface CardItem { rank: string; suit: CardSuit }

export interface ReplayDisplayMetric {
  icon: ReplayMetricIcon
  value: string
}

export interface ReplayDisplayRow {
  seat: string
  name: string
  action: string
  amount: string
  stack: string
  muted: boolean
  actionTone: ReplayActionTone
}

export interface ReplayDisplayStreetSection {
  id: string
  title: string
  boardCards: CardItem[]
  metrics: ReplayDisplayMetric[]
  rows: ReplayDisplayRow[]
}

interface BuildReplayDisplaySectionsOptions {
  topMetricValue?: string
  bottomMetricValue?: string
  fallbackNamePrefix?: string
}

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatNumber(value: unknown): string {
  const numeric = toSafeNumber(value)
  return numeric.toLocaleString('en-US')
}

export function decodeCard(card: number): CardItem {
  const rankMap = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const suitMap: CardSuit[] = ['s', 'h', 'c', 'd']
  const normalized = ((Math.floor(card) % 52) + 52) % 52
  const rank = Number.isFinite(card) ? (rankMap[normalized % 13] ?? 'A') : '--'
  const suit = suitMap[Math.floor(normalized / 13)] ?? 's'
  return { rank, suit }
}

export function parseReplayLike<T>(value: unknown): T | null {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
  if (typeof value === 'object') return value as T
  return null
}

export function parseHandRecordCards(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map(item => toSafeNumber(item)).filter(item => Number.isFinite(item))
  }

  if (typeof value !== 'string') return []

  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => toSafeNumber(item))
    .filter(item => Number.isFinite(item))
}

function formatWinAmount(value: unknown): string {
  return toSafeNumber(value).toLocaleString('en-US')
}

function cardTypeName(cardTypeRaw: unknown): string {
  const cardType = toSafeNumber(cardTypeRaw)
  const map: Record<number, string> = {
    1: '高牌',
    2: '一对',
    3: '两对',
    4: '三条',
    5: '顺子',
    6: '同花',
    7: '葫芦',
    8: '四条',
    9: '同花顺',
    10: '皇家同花顺',
  }
  return '<font size="4">' + map[cardType] + '</font>'
}

function getTexasWinDesc(replay: StatsReplayData, currentUserId?: number): string {
  const players = replay.table?.pl ?? []
  const results = [...(replay.result ?? [])]
  if (!players.length || !results.length) return ''

  const playerBySeat = players.reduce<Record<number, StatsReplayTablePlayer>>((acc, player) => {
    const seat = toSafeNumber(player.sn)
    if (seat > 0) acc[seat] = player
    return acc
  }, {})

  const winners = results.filter(item => toSafeNumber(item.win) > 0)
  if (!winners.length) return ''

  let selectedWinner = winners[0]
  if (currentUserId) {
    const self = winners.find(item => {
      const seat = toSafeNumber(item.sn)
      return toSafeNumber(playerBySeat[seat]?.uid) === currentUserId
    })
    if (self) {
      selectedWinner = self
    } else {
      selectedWinner = winners.reduce((max, cur) => (toSafeNumber(cur.win) > toSafeNumber(max.win) ? cur : max), winners[0])
    }
  } else {
    selectedWinner = winners.reduce((max, cur) => (toSafeNumber(cur.win) > toSafeNumber(max.win) ? cur : max), winners[0])
  }

  const winnerSeat = toSafeNumber(selectedWinner.sn)
  const winnerName = String(playerBySeat[winnerSeat]?.name ?? `玩家${winnerSeat || ''}`)
  const suffix = winners.length > 1 ? '...' : ''

  const allActions = [
    ...(replay.procedure?.ante?.pl ?? []),
    ...(replay.procedure?.preflop?.pl ?? []),
    ...(replay.procedure?.flop?.pl ?? []),
    ...(replay.procedure?.turn?.pl ?? []),
    ...(replay.procedure?.river?.pl ?? []),
  ]
  const foldCount = allActions.filter(item => String(item.act ?? '').toLowerCase() === 'fold').length

  if (foldCount >= (results.length - winners.length)) {
    return `对手弃牌，${winnerName}获得胜利`
  }

  const typeName = cardTypeName(selectedWinner.card_type)
  if (typeName) {
    return `${winnerName}${suffix}以${typeName}牌型获得胜利`
  }

  return `${winnerName}${suffix}赢得最终胜利`
}

function getFantasyHighCardType(result: StatsReplayFantasyResult): number {
  const groups = result.grp ?? []
  return groups.reduce((max, group) => {
    const type = toSafeNumber(group.card_type)
    return type > max ? type : max
  }, 0)
}

function getFantasyWinDesc(replay: StatsReplayFantasyData, currentUserId?: number): string {
  const players = replay.table?.pl ?? []
  const results = [...(replay.result ?? [])]
  if (!players.length || !results.length) return ''

  const playerBySeat = players.reduce<Record<number, StatsReplayFantasyTablePlayer>>((acc, player) => {
    const seat = toSafeNumber(player.sn)
    if (seat > 0) acc[seat] = player
    return acc
  }, {})

  const winners = results.filter(item => toSafeNumber(item.win) > 0)
  if (!winners.length) return ''

  let selectedWinner = winners[0]
  if (currentUserId) {
    const self = winners.find(item => {
      const seat = toSafeNumber(item.sn)
      return toSafeNumber(playerBySeat[seat]?.uid) === currentUserId
    })
    if (self) {
      selectedWinner = self
    } else {
      selectedWinner = winners.reduce((max, cur) => (toSafeNumber(cur.win) > toSafeNumber(max.win) ? cur : max), winners[0])
    }
  } else {
    selectedWinner = winners.reduce((max, cur) => (toSafeNumber(cur.win) > toSafeNumber(max.win) ? cur : max), winners[0])
  }

  const winnerSeat = toSafeNumber(selectedWinner.sn)
  const winnerName = String(playerBySeat[winnerSeat]?.name ?? `玩家${winnerSeat || ''}`)
  const suffix = winners.length > 1 ? '...' : ''

  if (selectedWinner.nft) {
    return `${winnerName}${suffix}赢得最终胜利，并拿到进范资格`
  }

  const typeName = cardTypeName(getFantasyHighCardType(selectedWinner))
  if (typeName) {
    return `${winnerName}${suffix}赢得最终胜利，并拿到${typeName}牌型`
  }

  return `${winnerName}${suffix}赢得最终胜利`
}

export function GetWinDescRich(
  replay: StatsReplayData | null,
  replayFantasy: StatsReplayFantasyData | null,
  currentUserId?: number,
): string {
  if (replay) {
    return getTexasWinDesc(replay, currentUserId)
  }
  if (replayFantasy) {
    return getFantasyWinDesc(replayFantasy, currentUserId)
  }
  return ''
}

export function GetWinDesc(
  replay: StatsReplayData | null,
  replayFantasy: StatsReplayFantasyData | null,
  anonymous = false,
  currentUserId?: number,
): string {
  let desc = GetWinDescRich(replay, replayFantasy, currentUserId)
  desc = desc.replace(/<\/color>/g, '').replace(/<color=#F8C255FF>/g, '').replace(/\n/g, '')

  if (currentUserId && replay?.table?.pl && replay?.result) {
    const self = replay.table.pl.find(player => toSafeNumber(player.uid) === currentUserId)
    if (self) {
      const result = replay.result.find(item => toSafeNumber(item.sn) === toSafeNumber(self.sn))
      if (result) {
        desc = `赢取${formatWinAmount(result.win)} ${desc}`.trim()
      }
    }
  } else if (currentUserId && replayFantasy?.table?.pl && replayFantasy?.result) {
    const self = replayFantasy.table.pl.find(player => toSafeNumber(player.uid) === currentUserId)
    if (self) {
      const result = replayFantasy.result.find(item => toSafeNumber(item.sn) === toSafeNumber(self.sn))
      if (result) {
        desc = `赢取${formatWinAmount(result.win)} ${desc}`.trim()
      }
    }
  }

  if (anonymous) {
    return desc
  }

  return desc
}

function cardListFromUnknown(value: unknown): CardItem[] {
  if (!Array.isArray(value)) return []
  return value.map(item => decodeCard(toSafeNumber(item))).filter(c => c.rank !== '--')
}

function normalizeAction(actionRaw: unknown, raiseTimes: number): string {
  const action = String(actionRaw ?? '').trim().toLowerCase()

  switch (action) {
    case 'small blind':
      return 'SB'
    case 'big blind':
      return 'BB'
    case 'call':
      return 'CALL'
    case 'check':
      return 'CHECK'
    case 'straddle':
      return 'STRADDLE'
    case 'all in':
      return 'ALL IN'
    case 'fold':
      return 'FOLD'
    case 'insure':
      return 'INS'
    case 'bet':
      if (raiseTimes <= 1) return 'B'
      if (raiseTimes === 2) return 'R'
      return `${raiseTimes}B`
    case 'raise':
      if (raiseTimes <= 1) return 'R'
      if (raiseTimes === 2) return 'R'
      return `${raiseTimes}B`
    default:
      return action ? action.toUpperCase() : '--'
  }
}

function resolveActionTone(actionLabel: string): ReplayActionTone {
  if (actionLabel === 'SB' || actionLabel === 'BB' || actionLabel === 'CALL') {
    return 'blue'
  }
  if (actionLabel === 'FOLD' || actionLabel === 'F') {
    return 'black'
  }
  return 'red'
}

function getRemainingPositionLabels(count: number): string[] {
  if (count <= 0) return []
  if (count === 1) return ['CO']
  if (count === 2) return ['HJ', 'CO']
  if (count === 3) return ['UTG', 'HJ', 'CO']
  if (count === 4) return ['UTG', 'MP', 'HJ', 'CO']
  if (count === 5) return ['UTG', 'UTG+1', 'MP', 'HJ', 'CO']
  return ['UTG', 'UTG+1', 'MP1', 'MP2', 'HJ', 'CO'].slice(0, count)
}

function buildPositionMap(table: StatsReplayData['table'] | StatsReplayFantasyData['table'] | undefined): Record<number, string> {
  const players = table?.pl ?? []
  const allSeats = players
    .map(player => toSafeNumber(player.sn))
    .filter(sn => sn > 0)

  const uniqueSeats = Array.from(new Set(allSeats)).sort((a, b) => a - b)
  if (!uniqueSeats.length) return {}

  const btnSeat = toSafeNumber(table?.btn)
  const btnIndex = uniqueSeats.indexOf(btnSeat)
  const orderedSeats =
    btnIndex >= 0
      ? [...uniqueSeats.slice(btnIndex), ...uniqueSeats.slice(0, btnIndex)]
      : [...uniqueSeats]

  const map: Record<number, string> = {}
  const assigned = new Set<number>()

  if (orderedSeats[0]) {
    map[orderedSeats[0]] = 'BTN'
    assigned.add(orderedSeats[0])
  }

  const sbSeat = toSafeNumber((table as StatsReplayData['table'])?.sb?.sn)
  const bbSeat = toSafeNumber((table as StatsReplayData['table'])?.bb?.sn)

  if (sbSeat > 0 && uniqueSeats.includes(sbSeat)) {
    map[sbSeat] = 'SB'
    assigned.add(sbSeat)
  }

  if (bbSeat > 0 && uniqueSeats.includes(bbSeat)) {
    map[bbSeat] = 'BB'
    assigned.add(bbSeat)
  }

  if (!sbSeat && orderedSeats[1]) {
    map[orderedSeats[1]] = 'SB'
    assigned.add(orderedSeats[1])
  }

  if (!bbSeat && orderedSeats[2]) {
    map[orderedSeats[2]] = 'BB'
    assigned.add(orderedSeats[2])
  }

  const remainingSeats = orderedSeats.filter(sn => !assigned.has(sn))
  const labels = getRemainingPositionLabels(remainingSeats.length)

  remainingSeats.forEach((seat, idx) => {
    map[seat] = labels[idx] ?? `P${idx + 1}`
  })

  return map
}

function buildSeatNameMap(
  replay: StatsReplayData | null,
  replayFantasy: StatsReplayFantasyData | null,
  fallbackNamePrefix: string,
): Record<number, string> {
  const players = replay?.table?.pl ?? replayFantasy?.table?.pl ?? []
  return players.reduce<Record<number, string>>((acc, player, idx) => {
    const seat = toSafeNumber(player.sn)
    if (!seat) return acc
    acc[seat] = String(player.name ?? `${fallbackNamePrefix} ${idx + 1}`)
    return acc
  }, {})
}

function buildResultBySeat(replay: StatsReplayData | null): Record<number, number> {
  return (replay?.result ?? []).reduce<Record<number, number>>((acc, result) => {
    const seat = toSafeNumber(result.sn)
    if (seat > 0) {
      acc[seat] = toSafeNumber(result.win)
    }
    return acc
  }, {})
}

function mapNormalCellRows(
  cell: StatsReplayProcedureCell | undefined,
  seatNameMap: Record<number, string>,
  positionMap: Record<number, string>,
  resultBySeat: Record<number, number>,
  fallbackNamePrefix: string,
): ReplayDisplayRow[] {
  const list = cell?.pl ?? []
  if (!list.length) return []

  let raiseTimes = 0

  return list.map((action, index) => {
    const seat = toSafeNumber(action.sn)
    const actionRaw = String(action.act ?? '').trim().toLowerCase()

    if (actionRaw === 'bet' || actionRaw === 'raise') {
      raiseTimes += 1
    }

    const actionLabel = normalizeAction(actionRaw, raiseTimes)
    const isFold = actionLabel === 'FOLD' || actionLabel === 'F'

    return {
      seat: positionMap[seat] ?? String(seat || '--'),
      name: seatNameMap[seat] ?? `${fallbackNamePrefix} ${index + 1}`,
      action: actionLabel,
      amount: formatNumber(action.act_amt),
      stack: isFold ? '' : formatNumber(action.c ?? resultBySeat[seat]),
      muted: isFold,
      actionTone: resolveActionTone(actionLabel),
    }
  })
}

function mapFantasyRows(
  procedure: StatsReplayFantasyProcedure | undefined,
  seatNameMap: Record<number, string>,
  positionMap: Record<number, string>,
  fallbackNamePrefix: string,
): ReplayDisplayRow[] {
  const list = procedure?.preflop?.pl
  if (!list?.length) return []

  let raiseTimes = 0

  return list.map((action, index) => {
    const actionRecord = action as Record<string, unknown>
    const seat = toSafeNumber(actionRecord.sn)
    const actionRaw = String(actionRecord.act ?? '').trim().toLowerCase()

    if (actionRaw === 'bet' || actionRaw === 'raise') {
      raiseTimes += 1
    }

    const actionLabel = normalizeAction(actionRaw, raiseTimes)
    const isFold = actionLabel === 'FOLD' || actionLabel === 'F'

    return {
      seat: positionMap[seat] ?? String(seat || '--'),
      name: seatNameMap[seat] ?? `${fallbackNamePrefix} ${index + 1}`,
      action: actionLabel,
      amount: formatNumber(actionRecord.act_amt),
      stack: isFold ? '' : formatNumber(actionRecord.c),
      muted: isFold,
      actionTone: resolveActionTone(actionLabel),
    }
  })
}

function buildMetrics(topMetricValue?: string, bottomMetricValue?: string): ReplayDisplayMetric[] {
  const metrics: ReplayDisplayMetric[] = []

  if (topMetricValue) {
    metrics.push({ icon: 'mushroom', value: topMetricValue })
  }

  if (bottomMetricValue) {
    metrics.push({ icon: 'chips', value: bottomMetricValue })
  }

  return metrics
}

export function buildReplayDisplaySections(
  replay: StatsReplayData | null,
  replayFantasy: StatsReplayFantasyData | null,
  options: BuildReplayDisplaySectionsOptions = {},
): ReplayDisplayStreetSection[] {
  const {
    topMetricValue,
    bottomMetricValue,
    fallbackNamePrefix = 'Player',
  } = options

  const seatNameMap = buildSeatNameMap(replay, replayFantasy, fallbackNamePrefix)
  const resultBySeat = buildResultBySeat(replay)

  const sections: ReplayDisplayStreetSection[] = []

  if (replay?.procedure) {
    const positionMap = buildPositionMap(replay.table)
    const streetList: Array<{ key: 'preflop' | 'flop' | 'turn' | 'river'; title: string }> = [
      { key: 'preflop', title: 'Preflop' },
      { key: 'flop', title: 'Flop' },
      { key: 'turn', title: 'Turn' },
      { key: 'river', title: 'River' },
    ]

    streetList.forEach((street, idx) => {
      const cell = replay.procedure?.[street.key]
      const rows = mapNormalCellRows(cell, seatNameMap, positionMap, resultBySeat, fallbackNamePrefix)
      if (!rows.length) return

      sections.push({
        id: `${street.title}-${idx}`,
        title: street.title,
        boardCards: cardListFromUnknown(cell?.card),
        metrics: buildMetrics(topMetricValue, bottomMetricValue),
        rows,
      })
    })

    return sections
  }

  if (replayFantasy?.procedure) {
    const positionMap = buildPositionMap(replayFantasy.table)
    const rows = mapFantasyRows(replayFantasy.procedure, seatNameMap, positionMap, fallbackNamePrefix)
    if (rows.length) {
      sections.push({
        id: 'fantasy-preflop',
        title: 'Preflop',
        boardCards: [],
        metrics: buildMetrics(topMetricValue, bottomMetricValue),
        rows,
      })
    }
  }

  return sections
}


// /api/stats/user/game/record/list replay（标准牌局）
export interface StatsReplaySpDetail {
  win?: number
  is_winner?: boolean
  [key: string]: unknown
}

export interface StatsReplayEhcs {
  et?: string
  ein?: number
  eout?: number
  [key: string]: unknown
}

export interface StatsReplayResult {
  sn?: number
  win?: number
  ins?: number
  fee?: number
  active?: boolean
  maxcard_idx?: number[]
  card_type?: number
  card?: number[]
  ehcs?: StatsReplayEhcs[]
  dpt?: number
  sp_detail?: StatsReplaySpDetail[]
  maxcard_idx2?: number[]
  card_type2?: number
  jawd?: number
  [key: string]: unknown
}

export interface StatsReplayTablePlayer {
  sn?: number
  c?: number
  avatar?: string
  name?: string
  uid?: number
  sqd_cnt?: number
  [key: string]: unknown
}

export interface StatsReplayTableBlind {
  sn?: number
  bet?: number
  [key: string]: unknown
}

export interface StatsReplayTable {
  ante?: number
  pl?: StatsReplayTablePlayer[]
  sb?: StatsReplayTableBlind
  bb?: StatsReplayTableBlind
  btn?: number
  seatcount?: number
  mrm_pool?: number
  mrm_base?: number
  [key: string]: unknown
}

export interface StatsReplayAction {
  c?: number
  pot_out?: number
  sn?: number
  act?: string
  act_amt?: number
  ins?: number
  [key: string]: unknown
}

export interface StatsReplayProcedureCell {
  pl?: StatsReplayAction[]
  card?: number[]
  scard?: number[]
  showcard?: boolean
  [key: string]: unknown
}

export interface StatsReplayProcedure {
  ante?: StatsReplayProcedureCell
  preflop?: StatsReplayProcedureCell
  flop?: StatsReplayProcedureCell
  turn?: StatsReplayProcedureCell
  river?: StatsReplayProcedureCell
  [key: string]: unknown
}

export interface StatsReplayData {
  result?: StatsReplayResult[]
  etime?: number
  straddle?: boolean
  stime?: number
  hand?: number
  table?: StatsReplayTable
  name?: string
  rid?: number
  mid?: number
  unique?: string
  procedure?: StatsReplayProcedure
  rt?: number
  igpf?: boolean
  sec?: boolean
  multi_lang_names_obj?: unknown
  [key: string]: unknown
}

// /api/stats/user/game/record/list replay_ft（Fantasy）
export interface StatsReplayFantasyGroup {
  maxcard_idx?: number[]
  card_type?: number
  card?: number[]
  nuts?: boolean
  ft?: boolean
  [key: string]: unknown
}

export interface StatsReplayFantasyResult {
  sn?: number
  win?: number
  wp?: number
  fee?: number
  ft?: boolean
  nft?: boolean
  grp?: StatsReplayFantasyGroup[]
  bd?: number
  bn?: number
  bnc?: number
  [key: string]: unknown
}

export interface StatsReplayFantasyTablePlayer {
  sn?: number
  c?: number
  avatar?: string
  name?: string
  uid?: number
  ft?: boolean
  [key: string]: unknown
}

export interface StatsReplayFantasyTable {
  ante?: number
  pl?: StatsReplayFantasyTablePlayer[]
  btn?: number
  seatcount?: number
  [key: string]: unknown
}

export interface StatsReplayFantasyAction {
  c?: number
  pot_out?: number
  sn?: number
  act?: string
  act_amt?: number
  [key: string]: unknown
}

export interface StatsReplayFantasyPreflop {
  pl?: StatsReplayFantasyAction[]
  [key: string]: unknown
}

export interface StatsReplayFantasyStreet {
  pl?: StatsReplayFantasyAction[] | string[]
  cards_grp?: number[][]
  [key: string]: unknown
}

export interface StatsReplayFantasyProcedure {
  preflop?: StatsReplayFantasyPreflop
  flop?: StatsReplayFantasyStreet
  turn?: StatsReplayFantasyStreet
  river?: StatsReplayFantasyStreet
  [key: string]: unknown
}

export interface StatsReplayFantasyData {
  result?: StatsReplayFantasyResult[]
  etime?: number
  stime?: number
  hand?: number
  table?: StatsReplayFantasyTable
  name?: string
  rid?: number
  unique?: string
  procedure?: StatsReplayFantasyProcedure
  [key: string]: unknown
}

// /api/stats/user/game/record/list replay_mj（当前 C# 侧未定义细节，先保留动态结构）
export interface StatsReplayMahjongData {
  [key: string]: unknown
}
