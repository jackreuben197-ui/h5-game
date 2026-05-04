export type FormFieldType = 'switch' | 'select' | 'slider' | 'input'
export type SliderRangeValue = [number, number]
export type FieldValue = string | number | boolean | SliderRangeValue
export type SliderMarkMode = 'all' | 'edge' | 'none'

export interface FieldOption {
  text: string
  value: FieldValue
}

export interface FieldCondition {
  field: string
  equals: FieldValue | FieldValue[]
}

export interface TableFormFieldConfig {
  type: FormFieldType
  label: string
  tip?: string
  modelValue: string
  defaultValue: FieldValue
  visibleWhen?: FieldCondition[]
  disabledWhen?: FieldCondition[]
  options?: FieldOption[]
  activeValue?: FieldValue
  inactiveValue?: FieldValue
  min?: number
  max?: number
  step?: number
  unit?: string
  range?: boolean
  markMode?: SliderMarkMode
  placeholder?: string
}

export const tableFormPart1List: TableFormFieldConfig[] = [
  {
    type: 'select',
    label: '手牌数',
    tip: '手牌数Tip手牌数Tip手牌数Tip',
    modelValue: 'card_num',
    defaultValue: 4,
    options: [
      { text: '4', value: 4 },
      { text: '5', value: 5 },
      { text: '6', value: 6 },
    ],
  },
  {
    type: 'select',
    label: '手牌数',
    tip: '手牌数Tip手牌数Tip手牌数Tip',
    modelValue: 'card_num',
    defaultValue: 4,
    options: [
      { text: '4', value: 4 },
      { text: '5', value: 5 },
      { text: '6', value: 6 },
    ],
  },
  {
    type: 'select',
    label: '手牌数',
    tip: '手牌数Tip手牌数Tip手牌数Tip',
    modelValue: 'card_num',
    defaultValue: 4,
    options: [
      { text: '4', value: 4 },
      { text: '5', value: 5 },
      { text: '6', value: 6 },
    ],
  },
  {
    type: 'select',
    label: '手牌数',
    tip: '手牌数Tip手牌数Tip手牌数Tip',
    modelValue: 'card_num',
    defaultValue: 4,
    options: [
      { text: '4', value: 4 },
      { text: '5', value: 5 },
      { text: '6', value: 6 },
    ],
  },
  {
    type: 'select',
    label: '手牌数',
    tip: '手牌数Tip手牌数Tip手牌数Tip',
    modelValue: 'card_num',
    defaultValue: 4,
    options: [
      { text: '4', value: 4 },
      { text: '5', value: 5 },
      { text: '6', value: 6 },
    ],
  },
  {
    type: 'select',
    label: '手牌数',
    tip: '手牌数Tip手牌数Tip手牌数Tip',
    modelValue: 'card_num',
    defaultValue: 4,
    options: [
      { text: '44444444444444', value: 4 },
      { text: '5', value: 5 },
      { text: '6', value: 6 },
    ],
  },
  {
    type: 'switch',
    label: '带入审核',
    tip: '带入审核Tip带入审核Tip带入审核Tip带入审核Tip带入审核Tip带入审核Tip带入审核Tip带入审核Tip带入审核Tip带入审核Tip带入审核Tip带入审核Tip带入审核Tip带入审核Tip',
    modelValue: 'bring_in',
    defaultValue: 1,
    activeValue: 1,
    inactiveValue: 0,
  },
  {
    type: 'slider',
    label: '最小带入',
    modelValue: 'min_buyin',
    defaultValue: 100,
    min: 100,
    max: 1000,
    step: 100,
    unit: 'BB',
    markMode: 'edge',
    visibleWhen: [{ field: 'bring_in', equals: 1 }],
  },
  {
    type: 'slider',
    label: '买入范围(显示步数)',
    tip: '双滑块示例：显示全部步数',
    modelValue: 'buyin_range_with_marks',
    defaultValue: [200, 800],
    min: 100,
    max: 1000,
    step: 100,
    unit: 'BB',
    range: true,
    markMode: 'all',
  },
  {
    type: 'slider',
    label: '买入范围(不显示步数)',
    tip: '双滑块示例：不显示底部步数',
    modelValue: 'buyin_range_no_marks',
    defaultValue: [300, 900],
    min: 100,
    max: 1000,
    step: 100,
    unit: 'BB',
    range: true,
    markMode: 'none',
  },
  {
    type: 'input',
    label: '牌桌名称',
    modelValue: 'table_name',
    defaultValue: '',
    placeholder: '请输入牌桌名称',
    disabledWhen: [{ field: 'bring_in', equals: 0 }],
  },
]
export const defaultTemplate = {
  table_name: '',
  card_num: 4,
  bring_in: 1,
  min_buyin: 100,
  buyin_range_with_marks: [200, 800] as [number, number],
  buyin_range_no_marks: [300, 900] as [number, number],
}
