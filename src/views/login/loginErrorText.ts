import { getLocale, t, type LocaleCode } from '@/i18n'
import { extractBusinessCode, hasI18nText, resolveApiErrorText } from '@/utils/apiError'

export type LoginContactType = 'account' | 'email'

export const LOGIN_FAILED_CODE = 20020
const ACCOUNT_EXISTS_CODE = 90005
const CHINESE_LOCALES = new Set<LocaleCode>(['cn', 'zh'])

export function resolveLoginErrorText(error: unknown, contactType: LoginContactType): string {
  const key = resolveOverrideKey(extractBusinessCode(error), contactType)
  if (key && hasI18nText(key)) {
    return t(key)
  }
  return resolveApiErrorText(error)
}

function resolveOverrideKey(code: number | undefined, contactType: LoginContactType): string {
  if (code === LOGIN_FAILED_CODE) {
    return CHINESE_LOCALES.has(getLocale()) ? '' : 'adaptation10148'
  }
  if (code === ACCOUNT_EXISTS_CODE) {
    return contactType === 'email' ? 'UILogin_EmailHasRegist' : 'error1109'
  }
  return ''
}
