import { localStore } from '@/utils/localStore'
import type { MttFilter, PokerFilter } from './model'

const FILTER_STORAGE_KEY = 'CHANNEL_C_LIST_FILTERS'
const SCROLL_STORAGE_PREFIX = 'CHANNEL_C_LIST_SCROLL_'

const POKER_FILTER_VALUES: readonly PokerFilter[] = ['nlh', 'plo', 'short']
const MTT_FILTER_VALUES: readonly MttFilter[] = ['free', 'paid', 'hunter', 'snowball']

export interface ChannelCListFilters {
  poker: PokerFilter[]
  blind: number[]
  tournament: number[]
  mtt: MttFilter[]
}

function emptyFilters(): ChannelCListFilters {
  return { poker: [], blind: [], tournament: [], mtt: [] }
}

function hasBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function readArray(source: Record<string, unknown>, key: string): unknown[] {
  return Array.isArray(source[key]) ? (source[key] as unknown[]) : []
}

function normalizeIds(values: unknown[]): number[] {
  return [
    ...new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  ]
}

function normalizeStringValues<T extends string>(
  values: unknown[],
  allowed: readonly T[],
): T[] {
  const allowedValues = new Set<string>(allowed)
  return [
    ...new Set(
      values.filter((value): value is T => typeof value === 'string' && allowedValues.has(value)),
    ),
  ]
}

function normalizeFilters(value: unknown): ChannelCListFilters {
  const source = asRecord(value)
  return {
    poker: normalizeStringValues(readArray(source, 'poker'), POKER_FILTER_VALUES),
    blind: normalizeIds(readArray(source, 'blind')),
    tournament: normalizeIds(readArray(source, 'tournament')),
    mtt: normalizeStringValues(readArray(source, 'mtt'), MTT_FILTER_VALUES),
  }
}

function cloneFilters(filters: ChannelCListFilters): ChannelCListFilters {
  return {
    poker: [...filters.poker],
    blind: [...filters.blind],
    tournament: [...filters.tournament],
    mtt: [...filters.mtt],
  }
}

// 内存态让 SPA 内组件重建立即可读；localStorage 让 WebView 重载后仍可恢复。
let memoryFiltersLoaded = false
const memoryFilters: ChannelCListFilters = emptyFilters()
const memoryScrollPositions = new Map<string, number>()

export function readChannelCListFilters(): ChannelCListFilters {
  if (!memoryFiltersLoaded) {
    const stored = hasBrowserStorage() ? localStore.getItem<unknown>(FILTER_STORAGE_KEY) : null
    Object.assign(memoryFilters, normalizeFilters(stored))
    memoryFiltersLoaded = true
  }
  return cloneFilters(memoryFilters)
}

export function saveChannelCListFilters(filters: ChannelCListFilters): void {
  const normalized = cloneFilters(normalizeFilters(filters))
  Object.assign(memoryFilters, cloneFilters(normalized))
  memoryFiltersLoaded = true
  if (hasBrowserStorage()) localStore.setItem(FILTER_STORAGE_KEY, normalized)
}

function scrollStorageKey(section: string): string {
  return `${SCROLL_STORAGE_PREFIX}${section}`
}

export function saveChannelCListScroll(section: string, scrollTop: number): void {
  const position = Math.max(0, Math.round(Number(scrollTop) || 0))
  memoryScrollPositions.set(section, position)
  if (hasBrowserStorage()) localStore.setItem(scrollStorageKey(section), position)
}

export function readChannelCListScroll(section: string): number {
  const cached = memoryScrollPositions.get(section)
  if (cached !== undefined) return cached
  if (!hasBrowserStorage()) return 0

  const stored = localStore.getItem<unknown>(scrollStorageKey(section))
  const position = Number(stored)
  return Number.isFinite(position) && position > 0 ? Math.floor(position) : 0
}
