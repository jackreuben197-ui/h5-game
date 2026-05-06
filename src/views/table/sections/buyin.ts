import type { TableFormFieldConfig } from '../template'

const BUYIN_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const bb = (i + 1) * 50
  return { text: `${bb}BB`, value: bb }
})

export const buyinSection: TableFormFieldConfig[] = [
  {
    type: 'slider',
    label: '带入计分牌',
    modelValue: 'buyin_range',
    defaultValue: [50, 300],
    options: BUYIN_OPTIONS,
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
