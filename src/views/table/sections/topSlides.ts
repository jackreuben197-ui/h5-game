import type { FieldOption, TableFormFieldConfig } from '../template'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'
import { TABLE_TIME_OPTIONS } from './constants'
// 盲注
const SB_OPTIONS = [
  10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 1000, 1500, 2000, 2500, 3000, 5000, 10000, 20000,
  30000, 50000, 100000,
].map((v) => ({
  text: `${v / 100}/${v / 50}`,
  value: v,
}))

export const blindsSection: TableFormFieldConfig[] = [
  {
    type: 'slider',
    label: '小盲/大盲',
    modelValue: 'sb',
    defaultValue: 10,
    options: SB_OPTIONS,
  },
]

export const sbToValue = (sb: number) => sb / 100

// 带入
export interface BringinBbRange {
  minBb: number
  maxBb: number
}

export const DEFAULT_BRINGIN_BB_RANGE: BringinBbRange = {
  minBb: 50,
  maxBb: 5000,
}

export function parseBringinBbRange(raw: unknown): BringinBbRange {
  if (!raw) {
    return DEFAULT_BRINGIN_BB_RANGE
  }

  try {
    const parsed =
      typeof raw === 'string'
        ? (JSON.parse(raw) as { min_bb?: number; max_bb?: number })
        : (raw as { min_bb?: number; max_bb?: number })
    const min = Number(parsed?.min_bb)
    const max = Number(parsed?.max_bb)
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return DEFAULT_BRINGIN_BB_RANGE
    }
    const safeMin = Math.max(1, Math.floor(min))
    const safeMax = Math.max(safeMin, Math.floor(max))
    return { minBb: safeMin, maxBb: safeMax }
  } catch {
    return DEFAULT_BRINGIN_BB_RANGE
  }
}

function readBringinRangeFromCache(): unknown {
  const cache = localStore.getItem<Record<string, unknown> | null>(
    StorageKey.APP_CONFIG_CACHE,
    null,
  )
  if (!cache || typeof cache !== 'object') {
    return null
  }
  const globalConfig = (cache as { globalConfig?: Record<string, unknown> }).globalConfig
  if (globalConfig && typeof globalConfig === 'object') {
    return globalConfig.friend_club_bringin_min_max_bb_range
  }
  // 兼容可能的平铺结构
  return (cache as Record<string, unknown>).friend_club_bringin_min_max_bb_range
}

export function resolveBringinBbRange(rawFromStore: unknown): BringinBbRange {
  if (rawFromStore !== undefined && rawFromStore !== null && rawFromStore !== '') {
    return parseBringinBbRange(rawFromStore)
  }
  return parseBringinBbRange(readBringinRangeFromCache())
}

export function buildBuyinOptions(range: BringinBbRange, sb: number): FieldOption[] {
  // sb 在表单里是按“分”存储，展示时需要先 /100。
  const bigBlind = Math.max(0.01, (Number(sb) * 2) / 100)
  const step = Math.max(1, range.minBb)
  const options: FieldOption[] = []
  for (let ratio = range.minBb; ratio <= range.maxBb; ratio += step) {
    options.push({
      // 展示的是实际带入值（倍率 * 当前大盲）
      text: formatAmount(ratio * bigBlind),
      // 传递给表单/请求仍是倍率（BB）
      value: ratio,
    })
  }
  const last = options[options.length - 1]
  if (!last || last.value !== range.maxBb) {
    options.push({
      text: formatAmount(range.maxBb * bigBlind),
      value: range.maxBb,
    })
  }
  return options
}

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) {
    return '0'
  }
  if (Number.isInteger(value)) {
    return String(value)
  }
  return String(parseFloat(value.toFixed(2)))
}

export const buyinSection: TableFormFieldConfig[] = [
  {
    type: 'slider',
    label: '带入计分牌',
    modelValue: 'buyin_range',
    defaultValue: [50, 300],
    options: [],
    range: true,
    markMode: 'edge',
  },
  // {
  //   type: 'switch',
  //   label: '带入审核',
  //   tip: '开启后，玩家的带入申请需要桌主审批方可入座',
  //   modelValue: 'control_buyin',
  //   defaultValue: false,
  // },
]

//时长

export const durationSection: TableFormFieldConfig[] = [
  {
    type: 'slider',
    label: '时长 (h)',
    modelValue: 'game_duration',
    defaultValue: 1800,
    options: TABLE_TIME_OPTIONS,
    markMode: 'all',
  },
]
