import type { FormSection } from '../template'
import { BLIND_OPTIONS } from './constants'

const FILL_BLIND_OPTIONS = [
  { text: '过盲', value: 0 },
  { text: '补盲', value: 1 },
]

export const blindsSection: FormSection = {
  key: 'blinds',
  label: '盲注',
  fields: [
    {
      type: 'select',
      label: '大小盲',
      tip: '小盲/大盲，单位与筹码一致',
      modelValue: 'blind',
      defaultValue: 1,
      options: BLIND_OPTIONS,
    },
    {
      type: 'switch',
      label: 'Straddle',
      tip: '开启后，大盲左侧玩家可在翻牌前额外下注两倍大盲',
      modelValue: 'straddle',
      defaultValue: false,
    },
    {
      type: 'select',
      label: '补盲模式',
      tip: '过盲：新玩家等待一圈后入局；补盲：新玩家立即补交盲注入局',
      modelValue: 'fill_blind',
      defaultValue: 0,
      options: FILL_BLIND_OPTIONS,
    },
  ],
}
