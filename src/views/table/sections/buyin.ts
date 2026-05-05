import type { FormSection } from '../template'

// TEXAS_MIN_BRING_RATE=50, TEXAS_BRING_SLIDER_COUNT=16 → 50BB ~ 800BB
export const BUYIN_MIN = 50
export const BUYIN_MAX = 800
export const BUYIN_STEP = 50

export const buyinSection: FormSection = {
  key: 'buyin',
  label: '带入',
  fields: [
    {
      type: 'slider',
      label: '带入范围',
      tip: '玩家可携带筹码的最小/最大倍数（以大盲为单位）',
      modelValue: 'buyin_range',
      defaultValue: [100, 400] as [number, number],
      min: BUYIN_MIN,
      max: BUYIN_MAX,
      step: BUYIN_STEP,
      unit: 'BB',
      range: true,
      markMode: 'edge',
    },
    {
      type: 'switch',
      label: '带入审核',
      tip: '开启后，玩家的带入申请需要桌主审批方可入座',
      modelValue: 'control_buyin',
      defaultValue: false,
    },
  ],
}
