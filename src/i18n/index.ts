import type { App } from 'vue'
import { ref } from 'vue'
import i18n from '@silenthill/h5-cc-i18n'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'
import { formatTxtMessage, type FormatArg, type FormatArgs } from './parser'
import { createLogger } from '@/utils/logger'
import enOverrides from './en-overrides.json'
import zhCnOverrides from './zh-cn-overrides.json'

const log = createLogger('[i18n]')

// 对外仍沿用 Cocos 历史代码：cn(简中) / zh(繁中) / en / pt。
// 持久化、桥协议、上层组件全部基于这套 code，切勿改动。
export type LocaleCode = 'cn' | 'zh' | 'en' | 'pt'

const DEFAULT_LOCALE: LocaleCode = 'cn'

export const SUPPORTED_LOCALES: LocaleCode[] = ['en', 'pt', 'zh', 'cn']

// 旧代码 → @silenthill/h5-cc-i18n 包内代码的双向映射。
const LEGACY_TO_PACKAGE: Record<LocaleCode, string> = {
  cn: i18n.LANG_ZH_CN,
  zh: i18n.LANG_ZH_TW,
  en: i18n.LANG_EN,
  pt: i18n.LANG_PT,
}

const currentLocale = ref<LocaleCode>(resolveInitialLocale())

// 初始化时把 package 的 locale 拉齐到外部 code，避免 i18n.get 在握手前取到默认值。
applyPackageLocale(currentLocale.value)

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

  // 语言持久化键与 Cocos 对齐：dzpk_Language。
  localStore.setItem(StorageKey.Language, resolvedLocale)
  if (previousLocale !== resolvedLocale) {
    notifyLocaleChangedToCocos(resolvedLocale)
  }
}

// 英文补全：包内 en 词条为空时用我们维护的英文覆盖（由 CN 翻译而来）。
const EN_OVERRIDES = enOverrides as Record<string, string>

// CN 覆盖：从 dev_merge_0624 维护的中文覆盖，优先于包内 cn 词条
// （既补包内空缺，也可覆盖包内被 refactor 改动的措辞，如 账号登录/账号注册）。
const CN_OVERRIDES = zhCnOverrides as Record<string, string>

// CN 值缓存：CN 词条运行时不变，临时切到 CN 取值后切回，避免重复切换 locale。
const cnValueCache = new Map<string, string>()
function getCnValue(key: string): string {
  if (CN_OVERRIDES[key]) return CN_OVERRIDES[key]
  const cached = cnValueCache.get(key)
  if (cached !== undefined) return cached
  const packageLocale = LEGACY_TO_PACKAGE[currentLocale.value]
  i18n.setLocale(LEGACY_TO_PACKAGE.cn)
  const value = i18n.get(key, '') || ''
  i18n.setLocale(packageLocale)
  cnValueCache.set(key, value)
  return value
}

// 对外 LocaleCode -> 服务端 lang 字符串：服务端各接口统一接 zh_CN / zh_TW / en_US / pt_BR。
export function toServerLang(locale: LocaleCode = currentLocale.value): string {
  if (locale === 'en') return 'en_US'
  if (locale === 'zh') return 'zh_TW'
  if (locale === 'pt') return 'pt_BR'
  return 'zh_TW'
}

export function t(key: string, ...args: FormatArg[] | [FormatArgs]): string {
  // 读 ref 以便组件在 setLocale 时自动重渲染。
  const locale = currentLocale.value
  // 英文优先用我们维护的覆盖词条：既补包内空缺，也可覆盖包内既有英文（如 Texas→Hold'em）。
  if (locale === 'en' && EN_OVERRIDES[key]) {
    return formatTxtMessage(EN_OVERRIDES[key], args)
  }
  // 简中优先用我们维护的覆盖词条（覆盖 refactor 改动的措辞）。
  if (locale === 'cn' && CN_OVERRIDES[key]) {
    return formatTxtMessage(CN_OVERRIDES[key], args).replace(/\bUC\b/g, '联盟币')
  }
  let message = i18n.get(key, '') || ''
  if (!message) {
    // 其他语言缺失时复用 CN，最后兜底用 key。
    message = getCnValue(key) || key
  }
  const formatted = formatTxtMessage(message, args)
  return locale === 'cn' ? formatted.replace(/\bUC\b/g, '联盟币') : formatted
}

export const SUPPORTED_LOCALES_OPTIONS = [
  { label: '简体中文', value: 'cn' },
  { label: '繁體中文', value: 'zh' },
  { label: 'English', value: 'en' },
  { label: 'Português', value: 'pt' },
]

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
