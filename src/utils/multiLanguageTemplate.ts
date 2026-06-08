import { ref } from 'vue'
import { getMultiLanguageTemplateApi } from '@/api/config'
import type { MultiLanguageTemplateRecord } from '@/api/models/config'
import StorageKey from '@/constants/storageKey'
import type { LocaleCode } from '@/i18n'
import { getLocale } from '@/i18n'
import { PUBLIC_STORE_MULTI_LANGUAGE_TEMPLATE, openPublicIndexedDB } from '@/utils/indexedDB'
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
const restoreCacheTask = restoreFromCache().catch((error) => {
  log.warn('multiLanguageTemplate restore cache failed:', error)
})

// 外部统一入口：确保模板已加载（有缓存先用缓存）。
export async function ensureMultiLanguageTemplateLoaded(): Promise<void> {
  await restoreCacheTask

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
  await persistToCache(records)
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

async function persistToCache(records: MultiLanguageTemplateRecord[]): Promise<void> {
  const db = await openPublicIndexedDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PUBLIC_STORE_MULTI_LANGUAGE_TEMPLATE, 'readwrite')
    const store = tx.objectStore(PUBLIC_STORE_MULTI_LANGUAGE_TEMPLATE)
    store.clear()

    records.forEach((record) => {
      const templateId = String(record.template_id || '').trim()
      if (templateId) {
        store.put(record, templateId)
      }
    })

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })

  localStore.removeItem(StorageKey.MULTI_LANGUAGE_TEMPLATE_CACHE)
}

async function restoreFromCache(): Promise<void> {
  const indexedDBRecords = await readIndexedDBCache()
  if (indexedDBRecords.length > 0) {
    applyRecords(indexedDBRecords)
    return
  }

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
  await persistToCache(cached.records)
}

async function readIndexedDBCache(): Promise<MultiLanguageTemplateRecord[]> {
  const db = await openPublicIndexedDB()
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(PUBLIC_STORE_MULTI_LANGUAGE_TEMPLATE, 'readonly')
      .objectStore(PUBLIC_STORE_MULTI_LANGUAGE_TEMPLATE)
      .getAll()
    req.onsuccess = () => resolve(Array.isArray(req.result) ? (req.result as MultiLanguageTemplateRecord[]) : [])
    req.onerror = () => reject(req.error)
  })
}
