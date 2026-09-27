import { t } from '@/i18n'

const SERVER_ERROR_I18N_KEY_PATTERN = /^ServerErrorCode_\d+$/

/**
 * 解析 Toast 文案：服务端错误 key 先走多语言，未匹配时返回空字符串以取消展示。
 */
export function resolveGameToastMessage(message: string): string {
  const normalizedMessage = String(message ?? '').trim()
  if (!normalizedMessage) {
    return ''
  }
  if (!SERVER_ERROR_I18N_KEY_PATTERN.test(normalizedMessage)) {
    return normalizedMessage
  }

  const translatedMessage = t(normalizedMessage).trim()
  return translatedMessage === normalizedMessage ? '' : translatedMessage
}
