import type { TableFormFieldConfig } from '../template'

const MIN_VPIP_OPTIONS = [
  { text: '无限制', value: 0 },
  ...[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map((n) => ({ text: `${n}%`, value: n })),
]

// TOTAL_HAND_LIMIT: 50, 100, 300, 1000, 无限制(0)
const PLAY_HANDS_OPTIONS = [
  { text: '50', value: 50 },
  { text: '100', value: 100 },
  { text: '300', value: 300 },
  { text: '1000', value: 1000 },
  { text: '无限制', value: 0 },
]

export const limitsSection: TableFormFieldConfig[] = [
  {
    type: 'select',
    label: '最低入池率',
    tip: '玩家的VPIP低于此阈值将被限制在此桌游戏（无限制=不做要求）',
    modelValue: 'min_vpip',
    defaultValue: 0,
    options: MIN_VPIP_OPTIONS,
  },
  {
    type: 'select',
    label: '总手数限制',
    tip: '玩家在此桌累计游戏手数达到上限后将无法继续带入',
    modelValue: 'play_hands_limit',
    defaultValue: 0,
    options: PLAY_HANDS_OPTIONS,
  },
  {
    type: 'switch',
    label: 'IP限制',
    tip: '开启后，同一网络IP下只允许一名玩家同时在桌',
    modelValue: 'limit_ip',
    defaultValue: false,
  },
  {
    type: 'switch',
    label: 'GPS限制',
    tip: '开启后，地理位置过近的玩家不能同时在此桌游戏',
    modelValue: 'limit_gps',
    defaultValue: false,
  },
]
