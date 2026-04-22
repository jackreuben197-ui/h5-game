import type { App } from 'vue'
import { ref } from 'vue'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'
import { formatTxtMessage, parseTxtLanguage, type TxtLanguageMap } from './parser'

// 与 Cocos 保持一致：cn(简中) / zh(繁中) / en / pt。
export type LocaleCode = 'cn' | 'zh' | 'en' | 'pt'

const DEFAULT_LOCALE: LocaleCode = 'en'
const SHARED_I18N_BASE = 'assets/resources/config'

export const SUPPORTED_LOCALES: LocaleCode[] = ['en', 'pt', 'zh', 'cn']

const localeAssetUrls: Record<LocaleCode, string> = {
  en: resolveSharedLocaleUrl('USER_EN.txt'),
  pt: resolveSharedLocaleUrl('USER_PT.txt'),
  zh: resolveSharedLocaleUrl('USER_TW.txt'),
  cn: resolveSharedLocaleUrl('USER_ZH.txt'),
}
const dictionaries: Partial<Record<LocaleCode, TxtLanguageMap>> = {}
const loadingTasks = new Map<LocaleCode, Promise<void>>()
const dictionaryVersion = ref(0)

const currentLocale = ref<LocaleCode>(resolveInitialLocale())

export function getLocale(): LocaleCode {
  return currentLocale.value
}

export function setLocale(locale: string): void {
  const resolvedLocale = normalizeLocale(locale) ?? DEFAULT_LOCALE
  currentLocale.value = resolvedLocale
  void ensureLocaleLoaded(resolvedLocale)
  // 语言持久化键与 Cocos 对齐：dzpk_Language。
  localStore.setItem(StorageKey.Language, resolvedLocale)
}

export function t(key: string, ...args: Array<string | number>): string {
  // 建立响应式依赖：字典加载完成后触发模板重新渲染。
  void dictionaryVersion.value

  const currentDict = dictionaries[currentLocale.value]
  if (!currentDict) {
    void ensureLocaleLoaded(currentLocale.value)
  }

  const fallbackDict = dictionaries[DEFAULT_LOCALE]
  if (!fallbackDict) {
    void ensureLocaleLoaded(DEFAULT_LOCALE)
  }

  const message = currentDict?.[key] ?? fallbackDict?.[key] ?? key
  return formatTxtMessage(message, args)
}

export const textI18n = {
  locale: currentLocale,
  supportedLocales: SUPPORTED_LOCALES,
  getLocale,
  setLocale,
  t,
}

export const textI18nPlugin = {
  install(app: App): void {
    app.config.globalProperties.$txt = t
    void ensureLocaleLoaded(currentLocale.value)
    if (currentLocale.value !== DEFAULT_LOCALE) {
      void ensureLocaleLoaded(DEFAULT_LOCALE)
    }
  },
}

export async function ensureLocaleLoaded(locale: LocaleCode): Promise<void> {
  if (dictionaries[locale]) {
    return
  }
  const existingTask = loadingTasks.get(locale)
  if (existingTask) {
    return existingTask
  }

  const task = loadLocaleDictionary(locale)
  loadingTasks.set(locale, task)
  await task
  loadingTasks.delete(locale)
}

function resolveInitialLocale(): LocaleCode {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE
  }

  // 优先读取本地持久化语言；不存在再走浏览器语言。
  const saved = localStore.getItem<string>(StorageKey.Language, '')
  const savedLocale = normalizeLocale(saved)
  if (savedLocale) {
    return savedLocale
  }

  const browserLocale = normalizeLocale(window.navigator.language)
  return browserLocale ?? DEFAULT_LOCALE
}

function normalizeLocale(input: string | null | undefined): LocaleCode | null {
  if (!input) {
    return null
  }

  const normalized = input.toLowerCase().replace(/_/g, '-')
  if (
    normalized === 'tw' ||
    normalized === 'hk' ||
    normalized === 'zh-hant' ||
    normalized.startsWith('zh-tw') ||
    normalized.startsWith('zh-hk')
  ) {
    return 'zh'
  }
  if (
    normalized === 'cn' ||
    normalized === 'zh-cn' ||
    normalized === 'zh-hans' ||
    normalized.startsWith('zh-cn')
  ) {
    return 'cn'
  }
  if (normalized === 'zh') {
    return 'zh'
  }
  if (normalized.startsWith('zh')) {
    return 'cn'
  }
  if (normalized === 'br' || normalized.startsWith('pt')) {
    return 'pt'
  }
  if (normalized === 'us' || normalized.startsWith('en')) {
    return 'en'
  }
  return null
}

async function loadLocaleDictionary(locale: LocaleCode): Promise<void> {
  const url = localeAssetUrls[locale]
  // 开发环境禁用缓存，方便实时修改 txt 即时生效；生产环境使用强缓存。
  const cacheMode = import.meta.env.DEV ? 'no-cache' : 'force-cache'
  const response = await fetch(url, { cache: cacheMode })
  if (!response.ok) {
    console.warn('[i18n] locale file load failed:', locale, response.status)
    return
  }
  const raw = await response.text()
  dictionaries[locale] = parseTxtLanguage(raw)
  dictionaryVersion.value += 1
}

function resolveSharedLocaleUrl(fileName: string): string {
  const baseUrl = import.meta.env.BASE_URL || '/'
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${normalizedBase}${SHARED_I18N_BASE}/${fileName}`
}
