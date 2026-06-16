import type { InjectionKey, VNode } from 'vue'

export type SortOrder = 'asc' | 'desc' | ''

export interface SelectOption {
  text: string
  value: any
}

export interface ColumnConfig {
  prop: string
  label: string
  flex: number
  width?: string
  sortable: boolean
  select?: SelectOption[]
  align: 'left' | 'center' | 'right'
  fixed: boolean
  formatter: (value: any, row: Record<string, any>) => any
  slotRender?: (scope: { row: Record<string, any>; value: any }) => VNode[]
}

export interface TableContext {
  registerColumn: (col: ColumnConfig) => void
  unregisterColumn: (prop: string) => void
  flat?: boolean
}

export const TABLE_INJECT_KEY: InjectionKey<TableContext> = Symbol('GameTable')
