import type { App } from 'vue'
import { ref } from 'vue'
import i18n from '@silenthill/h5-cc-i18n'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'
import { formatTxtMessage, type FormatArg, type FormatArgs } from './parser'
import { createLogger } from '@/utils/logger'

const log = createLogger('[i18n]')

// 对外仍沿用 Cocos 历史代码：cn(简中) / zh(繁中) / en / pt；新增语言的 code 与包内 locale 一致。
// 持久化、桥协议、上层组件全部基于这套 code，切勿改动。
export type LocaleCode =
  | 'cn'
  | 'zh'
  | 'en'
  | 'pt'
  | 'de'
  | 'es'
  | 'fr'
  | 'hi'
  | 'it'
  | 'ja'
  | 'ko'
  | 'ru'
  | 'th'
  | 'vi'

const DEFAULT_LOCALE: LocaleCode = 'cn'

export const SUPPORTED_LOCALES: LocaleCode[] = [
  'en',
  'pt',
  'zh',
  'cn',
  'de',
  'es',
  'fr',
  'hi',
  'it',
  'ja',
  'ko',
  'ru',
  'th',
  'vi',
]

// 旧代码 → @silenthill/h5-cc-i18n 包内代码的双向映射。
const LEGACY_TO_PACKAGE: Record<LocaleCode, string> = {
  cn: i18n.LANG_ZH_CN,
  zh: i18n.LANG_ZH_TW,
  en: i18n.LANG_EN,
  pt: i18n.LANG_PT,
  de: i18n.LANG_DE,
  es: i18n.LANG_ES,
  fr: i18n.LANG_FR,
  hi: i18n.LANG_HI,
  it: i18n.LANG_IT,
  ja: i18n.LANG_JA,
  ko: i18n.LANG_KO,
  ru: i18n.LANG_RU,
  th: i18n.LANG_TH,
  vi: i18n.LANG_VI,
}

const currentLocale = ref<LocaleCode>(resolveInitialLocale())

// data-locale на <html> позволяет стилям зависеть от языка: у иероглифических
// строк другая плотность, и им нередко нужен свой кегль.
function applyDocumentLocale(locale: LocaleCode): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-locale', locale)
}

// 初始化时把 package 的 locale 拉齐到外部 code，避免 i18n.get 在握手前取到默认值。
applyPackageLocale(currentLocale.value)
applyDocumentLocale(currentLocale.value)

export function getLocale(): LocaleCode {
  return currentLocale.value
}

export function setLocale(locale: string): void {
  const previousLocale = currentLocale.value
  const resolvedLocale = normalizeLocale(locale) ?? DEFAULT_LOCALE

  // 先切换底层词典，再更新响应式状态。否则依赖 locale 的 computed 可能在
  // 词典仍是旧语言时重新求值，并缓存旧文案。
  applyPackageLocale(resolvedLocale)
  currentLocale.value = resolvedLocale
  applyDocumentLocale(resolvedLocale)

  // 语言持久化键与 Cocos 对齐：dzpk_Language。
  localStore.setItem(StorageKey.Language, resolvedLocale)
  if (previousLocale !== resolvedLocale) {
    notifyLocaleChangedToCocos(resolvedLocale)
  }
}

// 对外 LocaleCode -> 服务端 lang 字符串（zh_CN / en_US / ru_RU ...）。
const LOCALE_TO_SERVER_LANG: Record<LocaleCode, string> = {
  cn: 'zh_CN',
  zh: 'zh_TW',
  en: 'en_US',
  pt: 'pt_BR',
  de: 'de_DE',
  es: 'es_ES',
  fr: 'fr_FR',
  hi: 'hi_IN',
  it: 'it_IT',
  ja: 'ja_JP',
  ko: 'ko_KR',
  ru: 'ru_RU',
  th: 'th_TH',
  vi: 'vi_VN',
}

// 服务端还没有配置某个语言的内容时统一回落到英文。
export const FALLBACK_SERVER_LANG = 'en_US'

export function toServerLang(locale: LocaleCode = currentLocale.value): string {
  return LOCALE_TO_SERVER_LANG[locale] ?? 'zh_TW'
}

export function t(key: string, ...args: FormatArg[] | [FormatArgs]): string {
  // 读 ref 以便组件在 setLocale 时自动重渲染。
  const locale = currentLocale.value
  // H5 是语言状态来源；读取时保证页面级词典与 H5 当前状态一致，
  // setLocale 产生的变化会通过 syncLanguage 同步给 Cocos。
  applyPackageLocale(locale)
  const message = i18n.get(key, key) || key
  return formatTxtMessage(message, args)
}

const NO_SEPARATOR_LOCALES = new Set<LocaleCode>(['cn', 'zh', 'ja'])

export function tJoin(...parts: (string | number | null | undefined)[]): string {
  const separator = NO_SEPARATOR_LOCALES.has(currentLocale.value) ? '' : ' '
  return parts
    .map((part) => (part === null || part === undefined ? '' : String(part).trim()))
    .filter((part) => part.length > 0)
    .join(separator)
}

export const SUPPORTED_LOCALES_OPTIONS: { label: string; value: LocaleCode }[] = [
  { label: '简体中文', value: 'cn' },
  { label: '繁體中文', value: 'zh' },
  { label: 'English', value: 'en' },
  { label: 'Português', value: 'pt' },
  { label: 'Deutsch', value: 'de' },
  { label: 'Español', value: 'es' },
  { label: 'Français', value: 'fr' },
  { label: 'हिन्दी', value: 'hi' },
  { label: 'Italiano', value: 'it' },
  { label: '日本語', value: 'ja' },
  { label: '한국어', value: 'ko' },
  { label: 'Русский', value: 'ru' },
  { label: 'ไทย', value: 'th' },
  { label: 'Tiếng Việt', value: 'vi' },
]

export const textI18n = {
  locale: currentLocale,
  tJoin,
  supportedLocales: SUPPORTED_LOCALES,
  getLocale,
  setLocale,
  t,
}

export const textI18nPlugin = {
  install(app: App): void {
    app.config.globalProperties.$txt = t
    // 启动时将初始 locale 同步给 Cocos；forwardLanguageChangedToCocos 内部会等 Bridge 握手完成后再发送。
    notifyLocaleChangedToCocos(currentLocale.value)
  },
}

function applyPackageLocale(locale: LocaleCode): void {
  const target = LEGACY_TO_PACKAGE[locale]
  if (!target) {
    return
  }
  try {
    i18n.setLocale(target)
  } catch (error) {
    log.warn('i18n.setLocale failed:', error)
  }
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
  const primary = normalized.split('-')[0] as LocaleCode
  if (SUPPORTED_LOCALES.includes(primary)) {
    return primary
  }
  return null
}

function notifyLocaleChangedToCocos(locale: LocaleCode): void {
  // 避免 i18n 与 bridge 在模块初始化阶段产生强耦合循环引用。
  void import('@/bridge/sync')
    .then(({ forwardLanguageChangedToCocos }) => {
      forwardLanguageChangedToCocos(locale)
    })
    .catch((error) => {
      log.warn('notify locale to cocos failed:', error)
    })
}
