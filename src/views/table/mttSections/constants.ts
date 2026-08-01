// Shared option lists derived from CreateRoomConstant.cs
import { t } from '@/i18n'

// ── 游戏类型 / 手牌数 ──────────────────────────────────────────

// PLO_TYPE: PLO手牌数 4/5/6
export const PLO_CARD_OPTIONS = [4, 5, 6].map((n) => ({ text: String(n), value: n }))

// ── 思考时间 ───────────────────────────────────────────────────

export const OP_DURATION_OPTIONS = [13, 15, 18, 20, 25].map((n) => ({ text: `${n}s`, value: n }))

// ── 游戏节奏 ───────────────────────────────────────────────────

export const GAME_RHYTHM_OPTIONS = [
  { text: "GG" + t('Mahjong_KnockdownMode'), value: 0 },
  { text: "HH" + t('Mahjong_KnockdownMode'), value: 1 },
]
