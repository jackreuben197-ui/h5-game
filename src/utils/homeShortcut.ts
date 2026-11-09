export const HOME_SHORTCUT_QUERY_PARAM = 'icon'
export const HOME_SHORTCUT_CACHE_KEY = 'dzpk_h5_home_shortcut'

export interface HomeShortcutRecord {
  code: string
  label: string
  iconUrl: string
}

export interface HomeShortcutGlobalConfig {
  plat_domain_home_config_info?: unknown
}

interface LocationLike {
  search?: string
  hash?: string
}

let homeShortcutRecords: HomeShortcutRecord[] | null = null

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeHttpUrl(value: unknown): string {
  const raw = readString(value)
  if (!raw) return ''
  try {
    const base =
      typeof window === 'undefined' ? 'https://platform.invalid/' : String(window.location.href)
    const url = new URL(raw, base)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

function readRecordList(raw: unknown): unknown[] | null {
  let value = raw
  for (let depth = 0; depth < 2 && typeof value === 'string'; depth += 1) {
    const text = value.trim()
    if (!text) return null
    try {
      value = JSON.parse(text)
    } catch {
      return null
    }
  }
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: unknown[] }).data
  }
  return null
}

export function parseHomeShortcutRecords(raw: unknown): HomeShortcutRecord[] | null {
  const list = readRecordList(raw)
  if (!list) return null
  const records: HomeShortcutRecord[] = []
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    if (Number(row.status) !== 1) continue
    const code = readString(row.random_code)
    if (!code) continue
    const label = readString(row.description)
    const iconUrl = normalizeHttpUrl(row.icon_url)
    if (!label && !iconUrl) continue
    records.push({ code, label, iconUrl })
  }
  return records
}

export function setHomeShortcutRecords(raw: unknown): void {
  homeShortcutRecords = parseHomeShortcutRecords(raw)
}

export function getHomeShortcutRecords(): readonly HomeShortcutRecord[] | null {
  return homeShortcutRecords
}

function defaultLocation(): LocationLike {
  return typeof window === 'undefined' ? {} : window.location
}

export function readHomeShortcutCode(location: LocationLike = defaultLocation()): string {
  const search = readString(location.search)
  if (search) {
    const fromSearch = readString(new URLSearchParams(search).get(HOME_SHORTCUT_QUERY_PARAM))
    if (fromSearch) return fromSearch
  }
  const hash = readString(location.hash)
  const queryIndex = hash.indexOf('?')
  if (queryIndex < 0) return ''
  return readString(new URLSearchParams(hash.slice(queryIndex)).get(HOME_SHORTCUT_QUERY_PARAM))
}

function readHomeShortcutCache(): HomeShortcutRecord | null {
  try {
    const raw = window.localStorage.getItem(HOME_SHORTCUT_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const code = readString(parsed.code)
    const label = readString(parsed.label)
    const iconUrl = readString(parsed.iconUrl)
    if (!code || (!label && !iconUrl)) return null
    return { code, label, iconUrl }
  } catch {
    return null
  }
}

export function writeHomeShortcutCache(record: HomeShortcutRecord): void {
  try {
    window.localStorage.setItem(HOME_SHORTCUT_CACHE_KEY, JSON.stringify(record))
  } catch {
    return
  }
}

export function clearHomeShortcutCache(): void {
  try {
    window.localStorage.removeItem(HOME_SHORTCUT_CACHE_KEY)
  } catch {
    return
  }
}

export function resolveHomeShortcutConfig(
  location: LocationLike = defaultLocation(),
): HomeShortcutRecord | null {
  const code = readHomeShortcutCode(location)
  if (!code) return null
  if (homeShortcutRecords) {
    return homeShortcutRecords.find((record) => record.code === code) ?? null
  }
  const cached = readHomeShortcutCache()
  return cached && cached.code === code ? cached : null
}

export function hasUnresolvedHomeShortcutCode(location: LocationLike = defaultLocation()): boolean {
  const code = readHomeShortcutCode(location)
  if (!code || !homeShortcutRecords) return false
  return !homeShortcutRecords.some((record) => record.code === code)
}
