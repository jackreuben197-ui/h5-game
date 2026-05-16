// Shared option lists derived from CreateRoomConstant.cs
import { t } from '@/i18n'
import type { FieldOption } from '../template'

// ── 前注表（按 SB 面值索引）────────────────────────────────────

type BlindEntry = {
  /** 记分牌满额（分）*/
  scoreboard: number
  /** 可选前注面值列表；0 = 不设前注 */
  preNote: number[]
}

// 键为 SB 面值（与 ALL_SB 对应），preNote 为前注面值选项
export const BLIND_DEFAULT: Record<number, BlindEntry> = {
  0.1: { scoreboard: 20, preNote: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 3, 4, 6, 8, 15, 30] },
  0.2: { scoreboard: 40, preNote: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 3, 4, 6, 8, 15, 30] },
  0.3: { scoreboard: 60, preNote: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 3, 4, 6, 8, 15, 30] },
  0.4: { scoreboard: 80, preNote: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 3, 4, 6, 8, 15, 30] },
  0.5: { scoreboard: 100, preNote: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 3, 4, 6, 8, 15, 30] },
  1: { scoreboard: 200, preNote: [0, 1, 2, 4, 8, 16, 20, 30] },
  2: { scoreboard: 400, preNote: [0, 1, 2, 4, 8, 16, 32, 40, 60] },
  3: { scoreboard: 600, preNote: [0, 1, 3, 6, 9, 15, 20, 30, 60] },
  4: { scoreboard: 800, preNote: [0, 1, 2, 4, 8, 16, 32, 40, 60] },
  5: { scoreboard: 1000, preNote: [0, 1, 2, 5, 10, 20, 40, 80, 100, 150] },
  10: { scoreboard: 2000, preNote: [0, 2, 5, 10, 20, 40, 80, 160, 200, 300] },
  15: { scoreboard: 3000, preNote: [0, 5, 10, 15, 30, 40, 60, 90, 120, 150, 300] },
  20: { scoreboard: 4000, preNote: [0, 5, 10, 20, 40, 80, 160, 320, 400, 600] },
  25: { scoreboard: 5000, preNote: [0, 5, 10, 25, 50, 100, 200, 400, 500, 750] },
  30: { scoreboard: 6000, preNote: [0, 5, 10, 25, 30, 50, 100, 200, 400, 500, 750] },
  50: { scoreboard: 10000, preNote: [0, 10, 25, 50, 100, 200, 400, 800, 1000, 1500] },
  100: { scoreboard: 20000, preNote: [0, 25, 50, 100, 200, 400, 800, 1600, 2000, 3000] },
  200: { scoreboard: 40000, preNote: [0, 50, 100, 200, 400, 800, 1600, 3200, 4000, 6000] },
  300: { scoreboard: 60000, preNote: [0, 75, 150, 300, 600, 1200, 2400, 4800, 6000, 9000] },
  500: { scoreboard: 100000, preNote: [0, 125, 250, 500, 1000, 2000, 4000, 8000, 10000, 15000] },
  1000: {
    scoreboard: 200000,
    preNote: [0, 250, 500, 1000, 2000, 4000, 8000, 16000, 20000, 30000],
  },
}

/**
 * 根据表单 sb 值（单位：分）返回前注选项。
 * value 为分（× 100），0 = 不设前注。
 */
export function getAnteOptions(sb: number): FieldOption[] {
  const entry = BLIND_DEFAULT[sb / 100]
  if (!entry) return [{ text: '0', value: 0 }]
  return entry.preNote.map((v) => ({
    // text: v === 0 ? '0' : v >= 1000 ? `${v / 1000}k` : String(v),
    text: String(v),
    value: Math.round(v * 100),
  }))
}

// ── 盲注 ──────────────────────────────────────────────────────

const TINY_BLINDS = [0.1, 0.2, 0.3, 0.4, 0.5]
const SMALL_BLINDS = [1, 2, 3, 4, 5]
const MIDDLE_BLINDS = [10, 15, 20, 25, 30, 50]
const BIG_BLINDS = [100, 200, 300, 500, 1000]

export const ALL_SB = [...TINY_BLINDS, ...SMALL_BLINDS, ...MIDDLE_BLINDS, ...BIG_BLINDS]

export const BLIND_OPTIONS = ALL_SB.map((sb) => ({
  text: `${sb}`,
  value: sb * 100,
}))

// ── 游戏类型 / 手牌数 ──────────────────────────────────────────

// PLO_TYPE: PLO手牌数 4/5/6
export const PLO_CARD_OPTIONS = [4, 5, 6].map((n) => ({ text: String(n), value: n }))

// ── 座位数（按游戏类型） ────────────────────────────────────────

export const SEAT_COUNT_NLH_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
  text: String(n),
  value: n,
}))
export const SEAT_COUNT_PLO5_OPTIONS = [2, 3, 4, 5, 6, 7].map((n) => ({
  text: String(n),
  value: n,
}))
export const SEAT_COUNT_PLO6_OPTIONS = [2, 3, 4, 5, 6].map((n) => ({ text: String(n), value: n }))
export const SEAT_COUNT_SIX_PLUS_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
  text: String(n),
  value: n,
}))
export const SEAT_COUNT_FANTASY_OPTIONS = [2, 3].map((n) => ({ text: String(n), value: n }))

// ── 思考时间 ───────────────────────────────────────────────────

export const OP_DURATION_OPTIONS = [13, 15, 18, 20, 25].map((n) => ({ text: `${n}s`, value: n }))
export const OP_DURATION_EGG_OPTIONS = [10, 20, 30, 60].map((n) => ({ text: `${n}s`, value: n }))
export const OP_DURATION_FANTASY_OPTIONS = [15, 30, 40, 50, 60, 90, 120, 150, 180, 240, 300].map(
  (n) => ({
    text: `${n}s`,
    value: n,
  }),
)

// ── 游戏节奏 ───────────────────────────────────────────────────

export const GAME_RHYTHM_OPTIONS = [
  { text: 'GG模式', value: 0 },
  { text: 'HH模式', value: 1 },
  { text: 'WPK模式', value: 2 },
]

// ── 牌局时长（小时 → 秒） ──────────────────────────────────────

export const TABLE_TIME_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 6, 8].map((h) => ({
  text: String(h),
  value: h * 3600,
}))

export const TABLE_TIME_MAHJONG_OPTIONS = [0.5, 1, 2, 3, 4, 5, 6, 12].map((h) => ({
  text: String(h),
  value: h * 3600,
}))

// ── 封顶限制（麻将/掼蛋） ──────────────────────────────────────

export const MAX_WIN_RATE_OPTIONS = [2, 4, 8, 16, 32, 64, 128, 256].map((n) => ({
  text: String(n),
  value: n,
}))
export const MAX_WIN_RATE_SCORE_OPTIONS = [2, 4, 8, 16, 32].map((n) => ({
  text: String(n),
  value: n,
}))
export const MAX_WIN_RATE_EGG_OPTIONS = [
  ...[16, 32, 64, 128].map((n) => ({ text: String(n), value: n })),
  { text: '无限制', value: 0 },
]

// ── Straddle ────────────────────────────────────────────────────

// STRADDLE: 0-13
export const STRADDLE_OPTIONS = Array.from({ length: 14 }, (_, i) => ({
  text: String(i),
  value: i,
}))

// ── 补盲 ────────────────────────────────────────────────────────

export const FILL_BLIND_OPTIONS = [
  { text: '过盲', value: 0 },
  { text: '补盲', value: 1 },
]

// ── 带入相关 ────────────────────────────────────────────────────

// BRING_CHIPLEADER: 追平至Chipleader的百分比 (0-100%)
export const BRING_CHIPLEADER_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((n) => ({
  text: `${n}%`,
  value: n,
}))

// ALLOWED_MIN_CHIPS: 允许最低筹码（BB）
export const ALLOWED_MIN_CHIPS_OPTIONS = [0, 5, 10].map((n) => ({
  text: String(`${n}%`),
  value: n,
}))

// BRING_IN_LIMIT: 带入上限 (BB倍率), 0 = 无限制
export const BRING_IN_LIMIT_OPTIONS = [
  ...[400, 600, 800, 1000, 1500].map((n) => ({ text: String(n) + 'BB', value: n })),
  { text: '无限制', value: 0 },
]

// BRING_OUT / ChipsOut: 带出方式
export const BRING_OUT_OPTIONS = [
  { text: '关闭', value: 0 },
  { text: '自动', value: 1 },
  { text: '手动', value: 2 },
]

// ── 收费 ────────────────────────────────────────────────────────

// PAYMENT_METHOD: 收费方式
export const PAYMENT_METHOD_OPTIONS = [
  { text: '按比例', value: 0 },
  { text: '固定收费', value: 1 },
]

// SERVER_FEE: 服务费 0%–10% (步长 0.5%)
export const SERVER_FEE_OPTIONS = Array.from({ length: 21 }, (_, i) => {
  const v = parseFloat((i * 0.5).toFixed(1))
  return { text: `${v}%`, value: v }
})

// TEXAS_SERVER_FEE: 服务费 0%–5% (步长 0.5%)
export const TEXAS_SERVER_FEE_OPTIONS = Array.from({ length: 11 }, (_, i) => {
  const v = parseFloat((i * 0.5).toFixed(1))
  return { text: `${v}%`, value: v }
})

// PROFIT_SHARING_TYPE: 分润类型
export const PROFIT_SHARING_OPTIONS = [
  { text: '上下分', value: 0 },
  { text: '平均分', value: 1 },
]

// SERVER_CAPPING: 服务费封顶方式 (BB 或 按人数)
export const SERVER_CAPPING_OPTIONS = [
  { text: 'BB', value: 0 },
  { text: '人数', value: 1 },
]

// CAP_BIGBLIND: 封顶（大盲倍数）0–10 (步长 0.5)
export const CAP_BIGBLIND_OPTIONS = Array.from({ length: 21 }, (_, i) => {
  const v = parseFloat((i * 0.5).toFixed(1))
  return { text: String(v), value: v }
})

// ── 保险 ────────────────────────────────────────────────────────

// INSURANCE_MODE: 保险模式
export const INSURANCE_MODE_OPTIONS = [
  { text: '不强制全选OUTS', value: 0 },
  { text: '强制全选OUTS', value: 1 },
]

// CLASSIC_INSURANCE_TURN: 经典保险转牌强制投保阈值 (胜率‰)
export const CLASSIC_INSURANCE_TURN_OPTIONS = [125, 200, 333, 500, 1000].map((n) => ({
  text: String(n),
  value: n,
}))

// ── 限制条件 ────────────────────────────────────────────────────

// MIN_VPIP_LIMIT: 最低入池率限制, 0 = 无限制
export const MIN_VPIP_OPTIONS = [
  { text: '无限制', value: 0 },
  ...[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map((n) => ({ text: `${n}%`, value: n })),
]

// TOTAL_HAND_LIMIT: 总手数限制, 0 = 无限制
export const TOTAL_HAND_OPTIONS = [
  { text: '50', value: 50 },
  { text: '100', value: 100 },
  { text: '300', value: 300 },
  { text: '1000', value: 1000 },
  { text: '无限制', value: 0 },
]

// ── 安全屋 ──────────────────────────────────────────────────────

export const SAFE_ROOM_OPTIONS = [
  { text: '可看公共牌', value: 1 },
  { text: '不可看公共牌', value: 2 },
]

// ── 麻将 ────────────────────────────────────────────────────────

// MAHJONG_STANDARD_FAN_TYPE: 推倒胡番型倍率
export const MAHJONG_FAN_TYPE_OPTIONS = [0, 2, 4, 6, 8, 10, 12].map((n) => ({
  text: String(n),
  value: n,
}))

// ── 德州带入范围常量 ─────────────────────────────────────────────

export const TEXAS_MIN_BRING_RATE = 50
export const TEXAS_MAX_BRING_RATE = 800
export const TEXAS_BRING_SLIDER_COUNT = 16

// ── 鱿鱼游戏 ────────────────────────────────────────────────────

// SQUID_GAME_ROUNDS: 0-10
export const SQUID_ROUNDS_OPTIONS = Array.from({ length: 11 }, (_, i) => ({
  text: String(i),
  value: i,
}))

// SQUID_OPEN_NUMBER: 2-9
export const SQUID_OPEN_NUM_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
  text: String(n),
  value: n,
}))

// SQUID_DEPOSIT_PERCENT: 10%-100%
export const SQUID_DEPOSIT_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const pct = (i + 1) * 10
  return { text: `${pct}%`, value: pct }
})

// ── 暴击 / 蘑菇 ─────────────────────────────────────────────────

// HIT_GAME_ROUNDS: 1-10
export const CRIT_ROUNDS_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  text: String(i + 1),
  value: i + 1,
}))

// MUSHROOM_MODE: 两种押金模式
export const MUSHROOM_MODE_OPTIONS = [
  { text: t('UIMushMoneyMode1'), value: 1 },
  { text: t('UIMushMoneyMode2'), value: 2 },
]
export const CHAT_TYPE_OPTIONS = [
  { text: t('UIBackDialog_ticketsbtnClose'), value: 0 },
  { text: t('UICreateTablePlayer'), value: 1 },
  { text: t('UICreateTablePlayerAndOther'), value: 2 },
]
export const GAME_DELAY_TIMES_OPTIONS = Array.from({ length: 5 }, (_, i) => ({
  text: String(i + 1),
  value: i + 1,
}))
