export type FormFieldType = 'switch' | 'select' | 'slider' | 'input'
export type SliderRangeValue = [number, number]
export type FieldValue = string | number | boolean | SliderRangeValue
export type SliderMarkMode = 'all' | 'edge' | 'none'

export interface FieldOption {
  text: string
  value: string | number
}

export interface FieldCondition {
  field: string
  equals?: FieldValue | FieldValue[]
  notEquals?: FieldValue | FieldValue[]
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
  numberOnly?: boolean
  decimalDigits?: number
  needDouble?: boolean
  icon?: string
  tip2?: string
}
