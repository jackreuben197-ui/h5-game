import { getLocale, t } from '@/i18n'
import {
  multiLanguageTemplateVersion,
  resolveTemplateTextByKey,
} from '@/utils/multiLanguageTemplate'

/** 道具名称优先使用服务端多语言；模板 key 继续走现有公共模板缓存。 */
export function rewardItemName(name = '', multiLanguage?: unknown, fallback = 'MTT'): string {
  void multiLanguageTemplateVersion.value
  let localized = ''
  if (typeof multiLanguage === 'string') {
    try {
      const parsed: unknown = JSON.parse(multiLanguage)
      if (parsed && typeof parsed === 'object') return rewardItemName(name, parsed, fallback)
    } catch {
      /* 普通字符串是现有多语言模板 key 或名称。 */
    }
    localized = multiLanguage
  } else if (multiLanguage && typeof multiLanguage === 'object' && !Array.isArray(multiLanguage)) {
    const values = multiLanguage as Record<string, unknown>
    const locale = getLocale()
    const key = locale === 'en' ? 'us_name' : locale === 'pt' ? 'br_name' : 'cn_name'
    const value = values[key]
    if (typeof value === 'string') localized = value
    if (!localized && typeof values.template_id === 'string') localized = values.template_id
  }
  const raw = localized || name || fallback
  return resolveTemplateTextByKey(raw, getLocale()) || t(raw)
}
