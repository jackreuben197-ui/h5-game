import { t } from '@/i18n'
import { getGameKindByRt, getWinRate } from '@/utils/texasEquity'

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

// 对齐客户端 TexasCardUtil.GetCardSuit / GetCardNumberSort：
//   2..14  ♠ spade   rank = card           (2..14 → 2..10,J,Q,K,A)
//   17..29 ♥ heart   rank = card - 15
//   32..44 ♣ club    rank = card - 30
//   47..59 ♦ diamond rank = card - 45
// 落在 0/1/15/16/30/31/45/46 视为牌背（占位）。
export function decodeCard(card: number): CardItem {
  if (!Number.isFinite(card)) return { rank: '--', suit: 's' }
  const value = Math.floor(card)
  const rankByNumber = (n: number): string => {
    if (n < 2 || n > 14) return '--'
    return n <= 10 ? String(n) : (['J', 'Q', 'K', 'A'][n - 11] ?? '--')
  }
  if (value >= 2 && value <= 14) return { rank: rankByNumber(value), suit: 's' }
  if (value >= 17 && value <= 29) return { rank: rankByNumber(value - 15), suit: 'h' }
  if (value >= 32 && value <= 44) return { rank: rankByNumber(value - 30), suit: 'c' }
  if (value >= 47 && value <= 59) return { rank: rankByNumber(value - 45), suit: 'd' }
  return { rank: '--', suit: 's' }
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

// 对齐客户端 CardTypeUtil.GetCardTypeName：1..10 反向映射到 adaptation10062..10053。
function cardTypeName(cardTypeRaw: unknown): string {
  const cardType = toSafeNumber(cardTypeRaw)
  if (cardType < 1 || cardType > 10) return ''
  const langCode = 10063 - cardType
  const name = t(`adaptation${langCode}`)
  if (!name || name === `adaptation${langCode}`) return ''
  return `<color=#F8C255FF>${name}</color>`
}

// 对齐客户端 ReplayMsgController.GetTexasWinDesc。
// 关键“怪点”：result 与 table.pl 各自按 sn 排序后按 index 配对（不是按 sn 匹配），
//   - 越界（result 比 pl 长，弃牌玩家不在 pl）的 result 直接跳过；
//   - winName/winId 取自配对到的 pl，不是 result 本身。
// 这两个表现都是客户端真实行为，不复现就会输出与客户端不一致的文案。
export function getTexasWinDesc(replay: StatsReplayData, currentUserId?: number): string {
  const resultsRaw = replay.result ?? []
  const playersRaw = replay.table?.pl ?? []
  if (!resultsRaw.length) return ''

  const results = [...resultsRaw].sort(
    (a, b) => toSafeNumber(a.sn) - toSafeNumber(b.sn),
  )
  const players = [...playersRaw].sort(
    (a, b) => toSafeNumber(a.sn) - toSafeNumber(b.sn),
  )

  const procedure = replay.procedure
  const isHaveSecondCard =
    !!(procedure?.river?.scard && procedure.river.scard.length > 0) ||
    !!(procedure?.flop?.scard && procedure.flop.scard.length > 0)

  let curwin1 = 0
  let wincount1 = 0
  let selfIndex1 = -1
  let cardType1 = 0
  let winName1 = ''
  let winId1 = -1

  let curwin2 = 0
  let wincount2 = 0
  let cardType2 = 0
  let winName2 = ''
  let winId2 = -1

  for (let i = 0; i < results.length; i++) {
    const item = results[i]
    if (i >= players.length) continue
    const pl = players[i]

    const win1 = computeWinAmount(item, procedure, 0, isHaveSecondCard)
    if (win1 > 0) {
      wincount1++
      const plUid = toSafeNumber(pl.uid)
      const plSn = toSafeNumber(pl.sn)
      if (currentUserId && plUid === currentUserId) {
        selfIndex1 = i
        winName1 = String(pl.name ?? '')
        winId1 = plSn
        cardType1 = toSafeNumber(item.card_type)
      } else if (win1 > curwin1 && selfIndex1 === -1) {
        curwin1 = win1
        winName1 = String(pl.name ?? '')
        winId1 = plSn
        cardType1 = toSafeNumber(item.card_type)
      }
    }

    if (isHaveSecondCard) {
      const win2 = computeWinAmount(item, procedure, 1, isHaveSecondCard)
      if (win2 > 0) {
        wincount2++
        const plUid = toSafeNumber(pl.uid)
        const plSn = toSafeNumber(pl.sn)
        if (currentUserId && plUid === currentUserId) {
          winName2 = String(pl.name ?? '')
          winId2 = plSn
          cardType2 = toSafeNumber(item.card_type2)
        } else if (win2 > curwin2 && selfIndex1 === -1) {
          // 客户端这里就是判断 selfIndex1（不是 selfIndex2），完全照搬。
          curwin2 = win2
          winName2 = String(pl.name ?? '')
          winId2 = plSn
          cardType2 = toSafeNumber(item.card_type2)
        }
      }
    }
  }

  if (wincount1 === 0 && wincount2 === 0) return ''

  const deng1 = wincount1 > 1 ? '...' : ''
  const deng2 = wincount2 > 1 ? '...' : ''

  const allActions = [
    ...(procedure?.ante?.pl ?? []),
    ...(procedure?.preflop?.pl ?? []),
    ...(procedure?.flop?.pl ?? []),
    ...(procedure?.turn?.pl ?? []),
    ...(procedure?.river?.pl ?? []),
  ]
  let foldCount = 0
  const allinList: number[] = []
  for (const action of allActions) {
    const act = String(action.act ?? '').toLowerCase()
    if (act === 'fold') foldCount++
    else if (act === 'all in') {
      const sn = toSafeNumber(action.sn)
      if (sn > 0) allinList.push(sn)
    }
  }

  let str2 = ''
  if (isHaveSecondCard && winId2 !== -1) {
    str2 = getSecondCardStr(replay, winId2, winName2, wincount2, foldCount, deng2, cardType2, allinList)
  }

  // UIPaipu_winTips_6：bad-beat 翻盘。判定使用 flop+turn 的胜率而非 river（与客户端一致）。
  if (allinList.length >= 2 && winId1 !== -1 && allinList.includes(winId1)) {
    const { nlh, sixPlus } = getGameKindByRt(toSafeNumber(replay.rt))
    const publicCards: number[] = [
      ...(procedure?.flop?.card ?? []),
      ...(procedure?.turn?.card ?? []),
    ]
    const seatCards: Record<number, number[]> = {}
    let seatCardsOk = true
    for (const sn of allinList) {
      const entry = results.find((r) => toSafeNumber(r.sn) === sn)
      const cards = Array.isArray(entry?.card) ? entry?.card ?? [] : []
      if (!cards.length || cards.every((c) => toSafeNumber(c) === 0)) {
        // 弃牌玩家的 card 字段可能是 [0,0]，这里视为没有可用底牌，避免误算胜率。
        seatCardsOk = false
        break
      }
      seatCards[sn] = cards.map((c) => toSafeNumber(c))
    }
    if (seatCardsOk && publicCards.length > 0) {
      const rates = getWinRate(publicCards, seatCards, nlh, sixPlus)
      const winnerRate = rates[winId1] ?? 0
      if (winnerRate < 1 / allinList.length) {
        const ratePercent = `${Math.round(winnerRate * 100)}%`
        const str = t('UIPaipu_winTips_6', winName1, ratePercent)
        if (isHaveSecondCard && winId2 !== -1) return str + str2
        return str
      }
    }
  }

  if (foldCount >= results.length - wincount1) {
    return t('UIPaipu_winTips_4', winName1)
  }

  const typeName = cardTypeName(cardType1)
  const str3 = t('UIPaipu_winTips_5', winName1, deng1, typeName)
  if (isHaveSecondCard && winId2 !== -1) {
    if (winId1 === -1) return str2
    return str3 + str2
  }
  return str3
}

// 对齐客户端 Win()：累加该玩家在每条街的下注，识别保险；带二张牌时按 sp_detail 拆分输赢。
// 没有保险/二张牌的简单场景下，结果就等价于 result.win。
function computeWinAmount(
  result: StatsReplayResult,
  procedure: StatsReplayProcedure | undefined,
  index: 0 | 1,
  isHaveSecondCard: boolean,
): number {
  const seatID = toSafeNumber(result.sn)
  let insure = 0
  let handBet = 0
  const streets: (StatsReplayProcedureCell | undefined)[] = [
    procedure?.ante,
    procedure?.preflop,
    procedure?.flop,
    procedure?.turn,
    procedure?.river,
  ]
  for (let s = 0; s < streets.length; s++) {
    const cell = streets[s]
    const isRiver = s === streets.length - 1
    if (!cell?.pl) continue
    for (const action of cell.pl) {
      if (toSafeNumber(action.sn) !== seatID) continue
      if (String(action.act ?? '').toLowerCase() === 'insure') {
        const ins = toSafeNumber(action.ins)
        const amt = toSafeNumber(action.act_amt)
        if (isRiver) {
          if (ins === 0) insure -= amt
          else insure += ins
        } else {
          if (ins === 0) insure += amt
          else insure -= ins
        }
      }
      handBet += toSafeNumber(action.act_amt)
    }
  }

  const winAnte = toSafeNumber(result.win)
  if (!isHaveSecondCard) {
    return winAnte + (insure !== 0 ? insure : 0)
  }

  const spDetail = result.sp_detail ?? []
  const isWin1 = spDetail[0]?.is_winner === true
  const isWin2 = spDetail[1]?.is_winner === true
  const win1 = toSafeNumber(spDetail[0]?.win)
  const win2 = toSafeNumber(spDetail[1]?.win)
  const fee = toSafeNumber(result.fee)
  let fee1 = 0
  let fee2 = 0
  if (isWin1 && isWin2) {
    if (fee !== 0 && win1 + win2 !== 0) {
      fee1 = Math.floor((win1 * fee) / (win1 + win2))
      fee2 = fee - fee1
    }
  } else {
    fee1 = isWin1 ? fee : 0
    fee2 = isWin2 ? fee : 0
  }
  const handBet1 = Math.floor(handBet / 2)
  const handBet2 = handBet - handBet1
  const winAnte2 = index === 0 ? win1 - fee1 - handBet1 : win2 - fee2 - handBet2
  return winAnte2 + (insure !== 0 ? insure : 0)
}

// 二张牌（run-it-twice）的 bad-beat / 牌型胜利文案，结构对齐客户端 GetSecondCardStr。
function getSecondCardStr(
  replay: StatsReplayData,
  winId: number,
  winName: string,
  wincount: number,
  foldCount: number,
  deng: string,
  cardType: number,
  allinList: number[],
): string {
  const procedure = replay.procedure
  if (allinList.length >= 2 && winId !== -1 && allinList.includes(winId)) {
    const publicCards: number[] = [
      ...(procedure?.flop?.scard ?? []),
      ...(procedure?.turn?.scard ?? []),
      ...(procedure?.river?.scard ?? []),
    ]
    if (publicCards.length >= 5) {
      const { nlh, sixPlus } = getGameKindByRt(toSafeNumber(replay.rt))
      const seatCards: Record<number, number[]> = {}
      let ok = true
      for (const sn of allinList) {
        const entry = (replay.result ?? []).find((r) => toSafeNumber(r.sn) === sn)
        const cards = Array.isArray(entry?.card) ? entry?.card ?? [] : []
        if (!cards.length || cards.every((c) => toSafeNumber(c) === 0)) {
          ok = false
          break
        }
        seatCards[sn] = cards.map((c) => toSafeNumber(c))
      }
      if (ok) {
        const rates = getWinRate(publicCards, seatCards, nlh, sixPlus)
        const rate = rates[winId] ?? 0
        if (rate < 1 / allinList.length) {
          const ratePercent = `${Math.round(rate * 100)}%`
          return `\n${t('UIPaipu_winTips_6', winName, ratePercent)}`
        }
      }
    }
  }

  const resultsCount = (replay.result ?? []).length
  if (foldCount >= resultsCount - wincount) return ''
  const typeName = cardTypeName(cardType)
  return `\n${t('UIPaipu_winTips_5', winName, deng, typeName)}`
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
