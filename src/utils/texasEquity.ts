// 德州/奥马哈胜率计算，1:1 移植自客户端 ReplayMsgController + CardTypeUtil。
//
// 客户端牌编码（pokerCards / TexasCardUtil.GetCardSuit）：
//   card = suitIdx * 15 + rank
//   suitIdx: 0=♠ 1=♥ 2=♣ 3=♦   rank: 2..14（14=A）
//   gap 0/1/15/16/30/31/45/46 当作牌背/无牌。
//
// 关键移植点：
//   - GetCardType / CompareCardType（7 选 5 枚举）
//   - BubbleSort（按 raw 值降序，刻意保留以匹配客户端的 CaculateValue 取数逻辑）
//   - Straight（A-5-4-3-2 或 A-9-8-7-6 时把 A 移到最末）
//   - CaculateValue（不同牌型挑不同位置的 rank 拼成比较值）
//   - GetWinRate（枚举剩余 public 牌，按 CardValue 比较，平分胜利计数）
//   - GenerateRandomCombinations（客户端是排列，等价于乘以阶乘；最终 equity 比例不变）

const WEIGHT_VALUE = 15

export const CARD_TYPE_HIGH_CARD = 1
export const CARD_TYPE_ONE_PAIR = 2
export const CARD_TYPE_TWO_PAIR = 3
export const CARD_TYPE_THREE_OF_A_KIND = 4
export const CARD_TYPE_STRAIGHT = 5
export const CARD_TYPE_FLUSH = 6
export const CARD_TYPE_FULL_HOUSE = 7
export const CARD_TYPE_FOUR_OF_A_KIND = 8
export const CARD_TYPE_STRAIGHT_FLUSH = 9
export const CARD_TYPE_ROYAL_FLUSH = 10

// 对齐客户端 StringHelper.GetGameTypeByType：返回 [nlh, sixPlus]。
// rt 0..5 是 NLH 标准/PL/AOF + 6+ 标准/PL/AOF；6..11 是 OMAHA4，依此类推。
// 真正用到的只是 gameType / pokerType，所以查表方式与客户端一致：
//   gameType = floor(rt / 6)  即 0=Texas, 1=Omaha4, 2=Omaha5, 3=Omaha6
//   pokerType = (rt % 6 >= 3) ? 2 : 0   即 标准=0, 6+=2
export function getGameKindByRt(rt: number): { nlh: boolean; sixPlus: boolean } {
  const value = Number.isFinite(rt) ? Math.trunc(rt) : 0
  const gameType = Math.floor(value / 6)
  const inSubBlock = value - gameType * 6
  const pokerType = inSubBlock >= 3 ? 2 : 0
  return { nlh: gameType === 0, sixPlus: pokerType === 2 }
}

// 对齐 pokerCards()：j*15+i，j=0..3，i=2..14。6+ 排除 rank<6 的牌。
export function pokerDeck(sixPlus: boolean): number[] {
  const out: number[] = []
  for (let suit = 0; suit < 4; suit++) {
    for (let rank = 2; rank <= 14; rank++) {
      if (sixPlus && rank < 6) continue
      out.push(suit * WEIGHT_VALUE + rank)
    }
  }
  return out
}

export function remainingDeck(except: number[], sixPlus: boolean): number[] {
  const exceptSet = new Set(except)
  return pokerDeck(sixPlus).filter((c) => !exceptSet.has(c))
}

// 客户端的 GenerateRandomCombinations 生成的是排列，但 equity 比例对排列/组合不敏感。
// 用组合更快，对每个组合计算一次胜负即可。
export function combinations(deck: number[], count: number): number[][] {
  const out: number[][] = []
  if (count <= 0) {
    out.push([])
    return out
  }
  const path: number[] = []
  const recurse = (start: number): void => {
    if (path.length === count) {
      out.push(path.slice())
      return
    }
    for (let i = start; i < deck.length; i++) {
      path.push(deck[i])
      recurse(i + 1)
      path.pop()
    }
  }
  recurse(0)
  return out
}

// ============== CardTypeUtil 移植 ==============

// 严格的 5 张牌牌型判定（对齐 GetExactCardType）。
function getExactCardType(cards: number[], sixPlus: boolean): number {
  if (cards.length < 5) return CARD_TYPE_HIGH_CARD
  const cardColor: number[] = new Array(5)
  const cardNumber: number[] = new Array(5)
  for (let i = 0; i < 5; i++) {
    if (cards[i] === -1) return CARD_TYPE_HIGH_CARD
    cardColor[i] = Math.floor(cards[i] / WEIGHT_VALUE)
    cardNumber[i] = cards[i] % WEIGHT_VALUE
  }

  let sameColor = true
  for (let i = 0; i < 4; i++) {
    if (cardColor[i] !== cardColor[i + 1]) {
      sameColor = false
      break
    }
  }

  if (sameColor) {
    const arr = cardNumber.slice()
    const arrSorted = arr.slice().sort((a, b) => a - b)
    if (isStraight(arrSorted, arr, sixPlus)) {
      if (arr.includes(14) && arr.includes(13)) return CARD_TYPE_ROYAL_FLUSH
      return CARD_TYPE_STRAIGHT_FLUSH
    }
    return CARD_TYPE_FLUSH
  }

  const sortedNums = cardNumber.slice().sort((a, b) => a - b)
  if (isStraight(sortedNums, null, sixPlus)) return CARD_TYPE_STRAIGHT

  const tempType = getTempCardType(cardNumber.slice())
  switch (tempType) {
    case 0:
      return CARD_TYPE_FULL_HOUSE
    case 1:
      return CARD_TYPE_ONE_PAIR
    case 2:
      return CARD_TYPE_THREE_OF_A_KIND
    case 3:
      return CARD_TYPE_TWO_PAIR
    case 4:
      return CARD_TYPE_FOUR_OF_A_KIND
    default:
      return CARD_TYPE_HIGH_CARD
  }
}

// 移植 IsStraight：array 应为升序排列；arrayStoreStraight 用于回写顺子原始牌（5 张）。
function isStraight(array: number[], arrayStoreStraight: number[] | null, sixPlus: boolean): boolean {
  let count = 0
  const store = arrayStoreStraight ?? []
  store.length = 0
  for (let i = array.length - 1; i > 0; i--) {
    if (array[i] - 1 === array[i - 1]) {
      count++
      store.push(array[i])
    } else {
      count = 0
      store.length = 0
    }
    if (i === 1 && count === 3) {
      store.push(array[i - 1])
    }
    if (count >= 4) {
      store.push(array[i - 1])
      return true
    }
  }

  if (count === 3) {
    store.sort((a, b) => a - b)
    if (sixPlus) {
      if (store[0] === 6) {
        for (const number of array) {
          if (number === 14) return true
        }
      }
    } else {
      if (store[0] === 2) {
        for (const number of array) {
          if (number === 14) return true
        }
      }
    }
  }
  return false
}

// 移植 GetTempCardType：返回 0 葫芦 / 1 一对 / 2 三条 / 3 两对 / 4 四条 / -1 高牌。
function getTempCardType(arrInfo: number[]): number {
  const work = arrInfo.slice()
  let countOfPair = 0
  let countOfThree = 0
  let countOfFour = 0
  for (let i = 0; i < work.length; i++) {
    let count = 0
    const value = work[i]
    for (let j = 0; j < work.length; j++) {
      if (i === j) continue
      if (value === work[j]) {
        count++
        work.splice(j, 1)
        j--
        if (work.length <= 1) break
      }
    }
    work.splice(i, 1)
    i--
    if (count === 2) countOfThree++
    else if (count === 1) countOfPair++
    else if (count === 3) countOfFour++
    if (work.length <= 1) break
  }

  if (countOfFour >= 1) return 4
  if ((countOfPair >= 1 && countOfThree >= 1) || countOfThree === 2) return 0
  if (countOfThree >= 1) return 2
  if (countOfPair >= 2) return 3
  if (countOfPair === 1) return 1
  return -1
}

// 短牌特殊：FULL_HOUSE 与 FLUSH 强弱互换（仅用于比较，不影响最终牌型名）。
function carTypeNumConvert(sixPlus: boolean, num: number): number {
  if (!sixPlus) return num
  if (num === CARD_TYPE_FULL_HOUSE) return CARD_TYPE_FLUSH
  if (num === CARD_TYPE_FLUSH) return CARD_TYPE_FULL_HOUSE
  return num
}

interface CompareState {
  carTypeNum: number
  lastMin: number
  highlightCards: number[]
}

// 移植 CompareCardType：每次 7 选 5 拿到一个 5 张组合，与已记录的 best 比较。
// allHigh 在 CardValue 链路里恒为 true，所以 highlight 直接取 5 张。
function compareCardType(card: number[], state: CompareState, sixPlus: boolean): void {
  const num = getExactCardType(card, sixPlus)
  const convCur = carTypeNumConvert(sixPlus, num)
  const convPrev = carTypeNumConvert(sixPlus, state.carTypeNum)

  if (convCur > convPrev) {
    state.carTypeNum = num
    state.lastMin = 100
    if (num === CARD_TYPE_STRAIGHT_FLUSH || num === CARD_TYPE_STRAIGHT) {
      for (let i = 0; i < 5; i++) {
        const r = card[i] % WEIGHT_VALUE
        if (r < state.lastMin) state.lastMin = r
      }
      if (state.lastMin === 2) {
        for (let i = 0; i < 5; i++) {
          if (card[i] % WEIGHT_VALUE === 14) state.lastMin = -1
        }
      }
      if (sixPlus) {
        for (let i = 0; i < 5; i++) {
          if (card[i] % WEIGHT_VALUE === 14) state.lastMin = -1
        }
      }
    } else if (num === CARD_TYPE_FOUR_OF_A_KIND) {
      for (let i = 0; i < 4; i++) {
        if ((card[i] % WEIGHT_VALUE) === (card[i + 1] % WEIGHT_VALUE)) {
          state.lastMin = card[i] % WEIGHT_VALUE
          break
        }
      }
    } else if (num === CARD_TYPE_FULL_HOUSE) {
      state.lastMin =
        (card[0] % WEIGHT_VALUE) +
        (card[1] % WEIGHT_VALUE) +
        (card[2] % WEIGHT_VALUE) +
        (card[3] % WEIGHT_VALUE) +
        (card[4] % WEIGHT_VALUE)
    } else if (num === CARD_TYPE_FLUSH) {
      state.lastMin = 0
      for (let i = 0; i < 5; i++) state.lastMin += card[i] % WEIGHT_VALUE
    } else if (num === CARD_TYPE_THREE_OF_A_KIND || num === CARD_TYPE_ONE_PAIR) {
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 5; j++) {
          if ((card[i] % WEIGHT_VALUE) === (card[j] % WEIGHT_VALUE)) {
            state.lastMin = card[i] % WEIGHT_VALUE
          }
        }
      }
    } else if (num === CARD_TYPE_TWO_PAIR) {
      let first = -1
      let second = -1
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 5; j++) {
          if ((card[i] % WEIGHT_VALUE) === (card[j] % WEIGHT_VALUE)) {
            if (first === -1) first = card[i] % WEIGHT_VALUE
            else second = card[i] % WEIGHT_VALUE
          }
        }
      }
      const maxOne = Math.max(first, second)
      const minOne = Math.min(first, second)
      state.lastMin = maxOne * 20 + minOne
    }
    state.highlightCards = card.slice()
  } else if (num === state.carTypeNum) {
    if (num === CARD_TYPE_STRAIGHT_FLUSH || num === CARD_TYPE_STRAIGHT) {
      let bigger = true
      for (let i = 0; i < 5; i++) {
        if ((card[i] % WEIGHT_VALUE) < state.lastMin) bigger = false
      }
      if (sixPlus) {
        for (let i = 0; i < 5; i++) {
          if (card[i] % WEIGHT_VALUE === 14) bigger = false
        }
      }
      if (bigger) {
        state.lastMin = 100
        for (let i = 0; i < 5; i++) {
          const r = card[i] % WEIGHT_VALUE
          if (r < state.lastMin) state.lastMin = r
        }
        if (state.lastMin === 2) {
          for (let i = 0; i < 5; i++) {
            if (card[i] % WEIGHT_VALUE === 14) state.lastMin = -1
          }
        }
        if (sixPlus) {
          for (let i = 0; i < 5; i++) {
            if (card[i] % WEIGHT_VALUE === 14) state.lastMin = -1
          }
        }
        state.highlightCards = card.slice()
      }
    } else if (num === CARD_TYPE_FOUR_OF_A_KIND) {
      let currentMin = 0
      for (let i = 0; i < 4; i++) {
        if ((card[i] % WEIGHT_VALUE) === (card[i + 1] % WEIGHT_VALUE)) {
          currentMin = card[i] % WEIGHT_VALUE
          break
        }
      }
      if (currentMin > state.lastMin) {
        state.lastMin = currentMin
        state.highlightCards = card.slice()
      }
    } else if (num === CARD_TYPE_FULL_HOUSE) {
      const newNum =
        (card[0] % WEIGHT_VALUE) +
        (card[1] % WEIGHT_VALUE) +
        (card[2] % WEIGHT_VALUE) +
        (card[3] % WEIGHT_VALUE) +
        (card[4] % WEIGHT_VALUE)
      if (state.lastMin < newNum) {
        state.lastMin = newNum
        state.highlightCards = card.slice()
      }
    } else if (num === CARD_TYPE_FLUSH) {
      let currentMin = 0
      for (let i = 0; i < 5; i++) currentMin += card[i] % WEIGHT_VALUE
      if (currentMin > state.lastMin) {
        state.lastMin = currentMin
        state.highlightCards = card.slice()
      }
    } else if (num === CARD_TYPE_THREE_OF_A_KIND || num === CARD_TYPE_ONE_PAIR) {
      let currentMin = 0
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 5; j++) {
          if ((card[i] % WEIGHT_VALUE) === (card[j] % WEIGHT_VALUE)) {
            currentMin = card[i] % WEIGHT_VALUE
          }
        }
      }
      if (currentMin > state.lastMin) {
        state.lastMin = currentMin
        state.highlightCards = card.slice()
      }
    } else if (num === CARD_TYPE_TWO_PAIR) {
      let first = -1
      let second = -1
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 5; j++) {
          if ((card[i] % WEIGHT_VALUE) === (card[j] % WEIGHT_VALUE)) {
            if (first === -1) first = card[i] % WEIGHT_VALUE
            else second = card[i] % WEIGHT_VALUE
          }
        }
      }
      const maxOne = Math.max(first, second)
      const minOne = Math.min(first, second)
      const currentMin = maxOne * 20 + minOne
      if (currentMin > state.lastMin) {
        state.lastMin = currentMin
        state.highlightCards = card.slice()
      }
    }
  }
}

// 移植 GetCardType：7 选 5 找最优，allHigh=true（CardValue 链路恒为 true）。
function getCardType(cards: number[], sixPlus: boolean): { cardType: number; high: number[] } {
  const m = cards.slice()
  while (m.length < 7) m.push(-1)

  const state: CompareState = { carTypeNum: 0, lastMin: 100, highlightCards: [] }
  const card: number[] = [0, 0, 0, 0, 0]
  for (let i = 0; i < 3; i++) {
    card[0] = m[i]
    for (let j = i + 1; j < 4; j++) {
      card[1] = m[j]
      for (let a = j + 1; a < 5; a++) {
        card[2] = m[a]
        for (let b = a + 1; b < 6; b++) {
          card[3] = m[b]
          for (let c = b + 1; c < 7; c++) {
            card[4] = m[c]
            compareCardType(card, state, sixPlus)
          }
        }
      }
    }
  }
  return { cardType: state.carTypeNum, high: state.highlightCards }
}

// 移植 GetOmahaCardType：手牌挑 2 张 + 公共牌挑 3 张。
function getOmahaCardType(
  hand: number[],
  pub: number[],
  sixPlus: boolean,
): { cardType: number; high: number[] } {
  const publicPadded = pub.slice()
  while (publicPadded.length < 5) publicPadded.push(-1)

  const state: CompareState = { carTypeNum: 0, lastMin: 100, highlightCards: [] }
  for (let i = 0; i < hand.length - 1; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      const card: number[] = [hand[i], hand[j], 0, 0, 0]
      for (let a = 0; a < 5 - 2; a++) {
        for (let b = a + 1; b < 5 - 1; b++) {
          for (let c = b + 1; c < 5; c++) {
            card[2] = publicPadded[a]
            card[3] = publicPadded[b]
            card[4] = publicPadded[c]
            compareCardType(card, state, sixPlus)
          }
        }
      }
    }
  }
  return { cardType: state.carTypeNum, high: state.highlightCards }
}

// 移植 BubbleSort：按原始牌值降序。
function bubbleSortDesc(arr: number[]): void {
  arr.sort((a, b) => b - a)
}

// 移植 Straight：A 当 1 处理时把 A 移到末尾，让 lastMin 取到“5”作为顺子最小牌。
function adjustStraight(sixPlus: boolean, high: number[]): void {
  if (high.length < 5) return
  const r0 = high[0] % WEIGHT_VALUE
  const r1 = high[1] % WEIGHT_VALUE
  const r2 = high[2] % WEIGHT_VALUE
  const r3 = high[3] % WEIGHT_VALUE
  const r4 = high[4] % WEIGHT_VALUE

  const isWheel =
    (!sixPlus && r0 === 14 && r1 === 5 && r2 === 4 && r3 === 3 && r4 === 2) ||
    (sixPlus && r0 === 14 && r1 === 9 && r2 === 8 && r3 === 7 && r4 === 6)
  if (isWheel) {
    const n0 = high[0]
    high[0] = high[1]
    high[1] = high[2]
    high[2] = high[3]
    high[3] = high[4]
    high[4] = n0
  }
}

// 移植 CaculateValue。
function calculateValue(cardType: number, high: number[]): number {
  const n0 = high[0] % WEIGHT_VALUE
  const n1 = high[1] % WEIGHT_VALUE
  const n2 = high[2] % WEIGHT_VALUE
  const n3 = high[3] % WEIGHT_VALUE
  const n4 = high[4] % WEIGHT_VALUE
  switch (cardType) {
    case CARD_TYPE_HIGH_CARD:
      return (cardType << 20) + (n0 << 16) + (n1 << 12) + (n2 << 8) + (n3 << 4) + n4
    case CARD_TYPE_ONE_PAIR:
      return (cardType << 20) + (n0 << 12) + (n2 << 8) + (n3 << 4) + n4
    case CARD_TYPE_TWO_PAIR:
      return (cardType << 20) + (n0 << 8) + (n3 << 4) + n4
    case CARD_TYPE_THREE_OF_A_KIND:
      return (cardType << 20) + (n0 << 8) + (n3 << 4) + n4
    case CARD_TYPE_STRAIGHT:
      return (cardType << 20) + n0
    case CARD_TYPE_FLUSH:
      return (cardType << 20) + (n0 << 16) + (n1 << 12) + (n2 << 8) + (n3 << 4) + n4
    case CARD_TYPE_FULL_HOUSE:
      return (cardType << 20) + (n0 << 4) + n3
    case CARD_TYPE_FOUR_OF_A_KIND:
      return (cardType << 20) + (n0 << 4) + n4
    case CARD_TYPE_STRAIGHT_FLUSH:
      return (cardType << 20) + n0
    case CARD_TYPE_ROYAL_FLUSH:
      return (cardType << 20) + n0
    default:
      return 0
  }
}

// 移植 CardValue：包括短牌的 FULL_HOUSE / FLUSH 互换。
export function cardValue(
  hand: number[],
  pub: number[],
  sixPlus: boolean,
  nlh: boolean,
): number {
  let cardType: number
  let high: number[]
  if (nlh) {
    const all = hand.concat(pub)
    ;({ cardType, high } = getCardType(all, sixPlus))
  } else {
    ;({ cardType, high } = getOmahaCardType(hand, pub, sixPlus))
  }

  if (sixPlus) {
    if (cardType === CARD_TYPE_FULL_HOUSE) cardType = CARD_TYPE_FLUSH
    else if (cardType === CARD_TYPE_FLUSH) cardType = CARD_TYPE_FULL_HOUSE
  }

  bubbleSortDesc(high)
  adjustStraight(sixPlus, high)
  return calculateValue(cardType, high)
}

// 移植 GetWinRate：枚举剩余牌补齐公共牌，逐组合比较谁的 CardValue 最大；平分胜利计数。
// 返回 seat -> equity (0..1)。
export function getWinRate(
  publicCards: number[],
  seatCards: Record<number, number[]>,
  nlh: boolean,
  sixPlus: boolean,
  extCard: number[] = [],
): Record<number, number> {
  const known: number[] = publicCards.concat(extCard)
  for (const sn of Object.keys(seatCards)) {
    known.push(...seatCards[Number(sn)])
  }
  const remain = remainingDeck(known, sixPlus)
  const needLen = Math.max(0, 5 - publicCards.length)
  const arrange = combinations(remain, needLen)

  const total = arrange.length
  const winCount: Record<number, number> = {}

  for (const extra of arrange) {
    const publc = publicCards.concat(extra)
    let maxValue = -1
    let maxSeats: number[] = []
    for (const sn of Object.keys(seatCards)) {
      const seat = Number(sn)
      const current = cardValue(seatCards[seat], publc, sixPlus, nlh)
      if (current > maxValue) {
        maxValue = current
        maxSeats = [seat]
      } else if (current === maxValue) {
        maxSeats.push(seat)
      }
    }
    const share = 1 / maxSeats.length
    for (const seat of maxSeats) {
      winCount[seat] = (winCount[seat] ?? 0) + share
    }
  }

  const result: Record<number, number> = {}
  for (const sn of Object.keys(seatCards)) {
    const seat = Number(sn)
    result[seat] = total > 0 ? (winCount[seat] ?? 0) / total : 0
  }
  return result
}
