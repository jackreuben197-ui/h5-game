import type { FormSection } from '../template'

const SEAT_COUNT_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9].map(n => ({ text: String(n), value: n }))

const THINKING_TIME_OPTIONS = [13, 15, 18, 20, 25].map(n => ({ text: `${n}s`, value: n }))

const TABLE_TIME_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 6, 8].map(n => ({
  text: `${n}h`,
  value: n,
}))

const GAME_RHYTHM_OPTIONS = [
  { text: 'GG模式', value: 0 },
  { text: 'HH模式', value: 1 },
  { text: 'WPK模式', value: 2 },
]

export const baseSection: FormSection = {
  key: 'base',
  label: '基础',
  fields: [
    {
      type: 'input',
      label: '牌桌名称',
      modelValue: 'table_name',
      defaultValue: '',
      placeholder: '选填',
    },
    {
      type: 'select',
      label: '座位数',
      modelValue: 'seat_count',
      defaultValue: 9,
      options: SEAT_COUNT_OPTIONS,
    },
    {
      type: 'select',
      label: '思考时间',
      modelValue: 'thinking_time',
      defaultValue: 15,
      options: THINKING_TIME_OPTIONS,
    },
    {
      type: 'select',
      label: '牌局时长',
      modelValue: 'table_time',
      defaultValue: 1,
      options: TABLE_TIME_OPTIONS,
    },
    {
      type: 'select',
      label: '游戏节奏',
      tip: 'GG模式：快节奏；HH模式：标准节奏；WPK模式：超快节奏',
      modelValue: 'game_rhythm',
      defaultValue: 0,
      options: GAME_RHYTHM_OPTIONS,
    },
    {
      type: 'switch',
      label: '空桌自动关闭',
      tip: '开启后，牌桌无人时将在一段时间后自动关闭',
      modelValue: 'auto_close',
      defaultValue: true,
    },
  ],
}
