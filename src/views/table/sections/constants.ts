// Shared option lists derived from CreateRoomConstant.cs

const TINY_BLINDS = [0.1, 0.2, 0.3, 0.4, 0.5]
const SMALL_BLINDS = [1, 2, 3, 4, 5]
const MIDDLE_BLINDS = [10, 15, 20, 25, 30, 50]
const BIG_BLINDS = [100, 200, 300, 500, 1000]

export const ALL_SB = [...TINY_BLINDS, ...SMALL_BLINDS, ...MIDDLE_BLINDS, ...BIG_BLINDS]

export const BLIND_OPTIONS = ALL_SB.map(sb => ({
  text: `${sb}/${sb * 2}`,
  value: sb,
}))

// SQUID_GAME_ROUNDS: 0-10
export const SQUID_ROUNDS_OPTIONS = Array.from({ length: 11 }, (_, i) => ({ text: String(i), value: i }))

// SQUID_OPEN_NUMBER: 2-9
export const SQUID_OPEN_NUM_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9].map(n => ({ text: String(n), value: n }))

// SQUID_DEPOSIT_PERCENT: 10%-100%
export const SQUID_DEPOSIT_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const pct = (i + 1) * 10
  return { text: `${pct}%`, value: pct }
})

// HIT_GAME_ROUNDS: 1-10
export const CRIT_ROUNDS_OPTIONS = Array.from({ length: 10 }, (_, i) => ({ text: String(i + 1), value: i + 1 }))

// MUSHROOM_MODE: 两种押金模式
export const MUSHROOM_MODE_OPTIONS = [
  { text: '追平Chipleader', value: 0 },
  { text: '固定带入金额', value: 1 },
]
