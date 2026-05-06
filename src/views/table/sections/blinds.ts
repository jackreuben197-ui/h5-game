import type { TableFormFieldConfig } from '../template'

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
