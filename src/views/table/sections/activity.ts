import type { TableFormFieldConfig } from '../template'

export const activitySection: TableFormFieldConfig[] = [
  {
    type: 'switch',
    label: '活跃度积分',
    tip: '开启后，玩家在此桌的游戏行为将计入俱乐部活跃度积分',
    modelValue: 'fee_on',
    defaultValue: false,
  },
]
