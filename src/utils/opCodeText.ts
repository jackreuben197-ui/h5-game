import { getLocale, t } from '@/i18n'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'

export function resolveOpCodeText(opCodeRaw: unknown): string {
  const opCode = String(opCodeRaw ?? '').trim()
  if (!opCode) {
    return ''
  }

  const key = `OpCodeString_${opCode}`
  return resolveTemplateTextByKey(key, getLocale()) || t(key) || key
}
