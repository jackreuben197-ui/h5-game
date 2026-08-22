// Shim for @silenthill/h5-cc-i18n.
// The real runtime is loaded as a UMD bundle via <script src="./h5-cc-i18n.min.js"> in index.html,
// which sets window.__H5_CC_I18N__. This module forwards to that global.

interface H5CCI18n {
  LANG_ZH_CN: string
  LANG_ZH_TW: string
  LANG_EN: string
  LANG_PT: string
  LANG_DE: string
  LANG_ES: string
  LANG_FR: string
  LANG_HI: string
  LANG_IT: string
  LANG_JA: string
  LANG_KO: string
  LANG_RU: string
  LANG_TH: string
  LANG_VI: string
  readonly currentLocale?: string
  getCurrentLocale?(): string
  setLocale(locale: string): void
  get(key: string, fallback?: string): string
}

const i18n: H5CCI18n = (window as any).__H5_CC_I18N__ ?? {
  LANG_ZH_CN: 'zh-CN',
  LANG_ZH_TW: 'zh-TW',
  LANG_EN: 'en',
  LANG_PT: 'pt',
  LANG_DE: 'de',
  LANG_ES: 'es',
  LANG_FR: 'fr',
  LANG_HI: 'hi',
  LANG_IT: 'it',
  LANG_JA: 'ja',
  LANG_KO: 'ko',
  LANG_RU: 'ru',
  LANG_TH: 'th',
  LANG_VI: 'vi',
  currentLocale: '',
  getCurrentLocale() { return '' },
  setLocale() {},
  get(key: string, fallback?: string) { return fallback ?? key },
}

export default i18n
