import type { FormSection } from '../template'

export const activitySection: FormSection = {
  key: 'activity',
  label: '活跃度积分',
  fields: [
    {
      type: 'switch',
      label: '活跃度积分',
      tip: '开启后，玩家在此桌的游戏行为将计入俱乐部活跃度积分',
      modelValue: 'activity_points',
      defaultValue: false,
    },
  ],
}
