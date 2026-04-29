import { ref } from 'vue'
import { getMultiLanguageTemplateApi } from '@/api/config'
import type { MultiLanguageTemplateRecord } from '@/api/models/config'
import StorageKey from '@/constants/storageKey'
import type { LocaleCode } from '@/i18n'
import { getLocale } from '@/i18n'
import { localStore } from '@/utils/localStore'
import { createLogger } from '@/utils/logger'

const log = createLogger('[i18n]')

interface MultiLanguageTemplateCachePayload {
  version: number
  updatedAt: number
  records: MultiLanguageTemplateRecord[]
}

const MULTI_LANGUAGE_TEMPLATE_CACHE_VERSION = 1

// 提供给视图层的响应式版本号：模板数据变化时触发重算。
export const multiLanguageTemplateVersion = ref(0)

const cnMap: Record<string, string> = {}
const enMap: Record<string, string> = {}
const ptMap: Record<string, string> = {}

let hasLoaded = false
let loadingTask: Promise<void> | null = null

restoreFromCache()

// 外部统一入口：确保模板已加载（有缓存先用缓存）。
export async function ensureMultiLanguageTemplateLoaded(): Promise<void> {
  if (hasLoaded) {
    return
  }

  if (loadingTask) {
    await loadingTask
    return
  }

  loadingTask = fetchAndCacheTemplates()
    .catch((error) => {
      log.warn('multiLanguageTemplate load failed:', error)
    })
    .finally(() => {
      hasLoaded = true
      loadingTask = null
    })

  await loadingTask
}

// 对齐 Unity GetRoomNameByKey：按当前语言从模板映射名字，支持 key 后缀拼接。
export function resolveTemplateTextByKey(rawName: string, locale: LocaleCode = getLocale()): string {
  const safeName = typeof rawName === 'string' ? rawName.trim() : ''
  if (!safeName) {
    return ''
  }

  const [templateKey, ...suffixParts] = safeName.split('-')
  if (!templateKey) {
    return ''
  }

  const nameMap = pickLocaleMap(locale)
  const mappedName = nameMap[templateKey]
  if (!mappedName) {
    return ''
  }

  if (!suffixParts.length) {
    return mappedName
  }

  return `${mappedName}-${suffixParts.join('-')}`
}

async function fetchAndCacheTemplates(): Promise<void> {
  const response = await getMultiLanguageTemplateApi()
  const records = Number(response.code) === 0 && Array.isArray(response.data) ? response.data : []
  applyRecords(records)
  persistToCache(records)
}

function applyRecords(records: MultiLanguageTemplateRecord[]): void {
  clearMaps()

  records.forEach((record) => {
    const templateId = String(record.template_id || '').trim()
    if (!templateId) return

    cnMap[templateId] = normalizeName(record.cn_name)
    enMap[templateId] = normalizeName(record.us_name)
    ptMap[templateId] = normalizeName(record.br_name)
  })

  multiLanguageTemplateVersion.value += 1
}

function pickLocaleMap(locale: LocaleCode): Record<string, string> {
  if (locale === 'cn' || locale === 'zh') {
    return cnMap
  }
  if (locale === 'pt') {
    return ptMap
  }
  return enMap
}

function normalizeName(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function clearMaps(): void {
  Object.keys(cnMap).forEach((key) => {
    delete cnMap[key]
  })
  Object.keys(enMap).forEach((key) => {
    delete enMap[key]
  })
  Object.keys(ptMap).forEach((key) => {
    delete ptMap[key]
  })
}

function persistToCache(records: MultiLanguageTemplateRecord[]): void {
  const payload: MultiLanguageTemplateCachePayload = {
    version: MULTI_LANGUAGE_TEMPLATE_CACHE_VERSION,
    updatedAt: Date.now(),
    records,
  }
  localStore.setItem(StorageKey.MULTI_LANGUAGE_TEMPLATE_CACHE, payload)
}

function restoreFromCache(): void {
  const cached = localStore.getItem<MultiLanguageTemplateCachePayload | null>(
    StorageKey.MULTI_LANGUAGE_TEMPLATE_CACHE,
    null,
  )
  if (!cached || typeof cached !== 'object') {
    return
  }
  if (cached.version !== MULTI_LANGUAGE_TEMPLATE_CACHE_VERSION || !Array.isArray(cached.records)) {
    return
  }

  applyRecords(cached.records)
}
