import type { TableFormFieldConfig } from '../template'

const PLAY_DURATION_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 6, 8].map((h) => ({
  text: `${h}`,
  value: h * 3600,
}))

export const durationSection: TableFormFieldConfig[] = [
  {
    type: 'slider',
    label: '时长 (h)',
    modelValue: 'game_duration',
    defaultValue: 1800,
    options: PLAY_DURATION_OPTIONS,
    markMode: 'all',
  },
]
