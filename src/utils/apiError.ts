import axios from 'axios'
import { t } from '@/i18n'

const GENERIC_ERROR_KEY = 'error999'
const LEGACY_CODE_MESSAGE = /^error:\s*(\d+)$/i

export class ApiBusinessError extends Error {
  readonly code: number
  readonly serverMessage: string

  constructor(code: number, serverMessage = '') {
    super(translateBusinessCode(code, serverMessage))
    this.name = 'ApiBusinessError'
    this.code = code
    this.serverMessage = String(serverMessage || '')
  }
}

export function hasI18nText(key: string): boolean {
  const text = t(key)
  return !!text && text !== key
}

export function translateBusinessCode(code: number, serverMessage = ''): string {
  const key = `ServerErrorCode_${code}`
  if (hasI18nText(key)) {
    return t(key)
  }

  const message = String(serverMessage || '').trim()
  if (message && !isTechnicalMessage(message)) {
    return message
  }

  return `${t(GENERIC_ERROR_KEY)} (${code})`
}

export function extractBusinessCode(error: unknown): number | undefined {
  if (error instanceof ApiBusinessError) {
    return error.code
  }

  if (axios.isAxiosError(error)) {
    const code = (error.response?.data as { code?: number } | undefined)?.code
    return typeof code === 'number' ? code : undefined
  }

  if (error instanceof Error) {
    const matched = LEGACY_CODE_MESSAGE.exec(error.message.trim())
    return matched ? Number(matched[1]) : undefined
  }

  return undefined
}

export function resolveApiErrorText(error: unknown, fallback = ''): string {
  if (error instanceof ApiBusinessError) {
    return translateBusinessCode(error.code, error.serverMessage)
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { code?: number; message?: string } | undefined
    if (typeof data?.code === 'number' && data.code !== 0) {
      return translateBusinessCode(data.code, data.message)
    }
    return fallback || t(GENERIC_ERROR_KEY)
  }

  if (error instanceof Error) {
    const code = extractBusinessCode(error)
    if (code !== undefined) {
      return translateBusinessCode(code)
    }
    const message = error.message.trim()
    if (message && !isTechnicalMessage(message)) {
      return message
    }
  }

  return fallback || t(GENERIC_ERROR_KEY)
}

function isTechnicalMessage(message: string): boolean {
  return /(json:|unmarshal|Go struct|panic|sql:|EOF|undefined|\[object)/i.test(message)
}
