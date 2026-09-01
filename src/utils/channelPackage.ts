import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'
export const CHANNEL_MAIN_DOMAIN = (import.meta.env.VITE_CHANNEL_MAIN_DOMAIN || '')
  .trim()
  .toLowerCase()
// 渠道包联调时可临时启用：
const TEST_CHANNEL_INVITE_CODE = ''
// const TEST_CHANNEL_INVITE_CODE = 'ksGuBmMk'
// const TEST_CHANNEL_INVITE_CODE = 'rhswehjy'

interface ParsedQueryParams {
  inviteCode: string
  traceHash: string
  agentInviteCode: string
  mode: string
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function getHashQueryParams(hashValue: string): URLSearchParams {
  const queryIndex = hashValue.indexOf('?')
  if (queryIndex < 0) {
    return new URLSearchParams()
  }
  return new URLSearchParams(hashValue.slice(queryIndex + 1))
}

function readParam(
  searchParams: URLSearchParams,
  hashParams: URLSearchParams,
  key: string,
): string {
  const fromSearch = readString(searchParams.get(key))
  if (fromSearch) {
    return fromSearch
  }
  return readString(hashParams.get(key))
}

export function isChannelPackageHost(hostname: string = window.location.hostname): boolean {
  // 渠道包联调：取消下面两行注释可强制按渠道域名处理。
  // void hostname
  if (TEST_CHANNEL_INVITE_CODE) return true
  const normalizedHost = readString(hostname).toLowerCase()
  if (!normalizedHost || !CHANNEL_MAIN_DOMAIN) {
    return false
  }

  return (
    normalizedHost !== CHANNEL_MAIN_DOMAIN && normalizedHost.endsWith(`.${CHANNEL_MAIN_DOMAIN}`)
  )
}

/**
 * 将 localStorage 中的数据拷贝到主域名。
 * 通过主域名的 URL 参数传递数据，主域名页面读取后写入自己的 storage。
 */
export function copyStorageToMainDomain(): void {
  const items: Record<string, string> = {}

  // 读取 localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.endsWith(StorageKey.LOGIN_DATA)) {
        items[key] = localStorage.getItem(key) || ''
      }
    }
  } catch (error) {
    console.warn('[channelPackage] failed to read localStorage:', error)
  }
  // 只清理由本次跳转迁移的登录数据，不能清空同源下 Cocos、Telegram
  // 或其他业务写入的 localStorage。
  Object.keys(items).forEach((key) => localStorage.removeItem(key))
  const currentUrl = new URL(window.location.href)
  const targetUrl = `${currentUrl.protocol}//${CHANNEL_MAIN_DOMAIN}/#/`
  // 将数据编码到 URL 参数中
  if (Object.keys(items).length > 0) {
    try {
      const encodedData = btoa(encodeURIComponent(JSON.stringify(items)))
      const separator = targetUrl.includes('?') ? '&' : '?'
      const url = `${targetUrl}${separator}storage_data=${encodeURIComponent(encodedData)}`
      window.location.href = url
    } catch (error) {
      console.warn('[channelPackage] failed to encode storage data:', error)
      window.location.href = targetUrl
    }
  } else {
    window.location.href = targetUrl
  }
}

/**
 * 从 URL 参数中读取并写入 storage 数据。
 * 应在主域名页面加载时调用。
 */
export function restoreStorageFromUrl(): void {
  try {
    const url = new URL(window.location.href)
    const urlParams = url.searchParams
    const hashParams = getHashQueryParams(url.hash || '')
    const encodedData = readParam(urlParams, hashParams, 'storage_data')
    if (!encodedData) {
      return
    }

    const jsonStr = decodeURIComponent(atob(encodedData))
    const items: Record<string, string> = JSON.parse(jsonStr)

    // 写入 localStorage
    for (const [key, value] of Object.entries(items)) {
      try {
        localStorage.setItem(key, value)
      } catch (error) {
        console.warn('[channelPackage] failed to set localStorage key:', key, error)
      }
    }

    // 清除 URL 参数
    url.searchParams.delete('storage_data')
    url.hash = url.hash.replace(/([&?])storage_data=[^&]*(&?)/, (match, p1, p2) => {
      if (p1 === '?' && p2) {
        return '?'
      }
      if (p1 === '?' || p1 === '&') {
        return ''
      }
      return match
    })
    window.history.replaceState({}, '', url.toString())
  } catch (error) {
    console.warn('[channelPackage] failed to restore storage from URL:', error)
  }
}

export function extractInviteCodeFromSubdomain(
  hostname: string = window.location.hostname,
): string {
  // 渠道邀请码联调：先启用文件顶部的 TEST_CHANNEL_INVITE_CODE，再取消下面两行注释。
  // void hostname
  if (TEST_CHANNEL_INVITE_CODE) return TEST_CHANNEL_INVITE_CODE
  const normalizedHost = readString(hostname).toLowerCase()
  if (!isChannelPackageHost(normalizedHost)) {
    return ''
  }

  const suffix = `.${CHANNEL_MAIN_DOMAIN}`
  const withoutSuffix = normalizedHost.slice(0, -suffix.length)
  const firstLabel = withoutSuffix.split('.')[0] || ''
  return readString(firstLabel)
}

export function parseInviteParamsFromLocation(
  url: URL = new URL(window.location.href),
): ParsedQueryParams {
  const searchParams = url.searchParams
  const hashParams = getHashQueryParams(url.hash || '')
  const agentInviteCode = readParam(searchParams, hashParams, 'i')

  return {
    inviteCode: readParam(searchParams, hashParams, 'invite_code'),
    traceHash: readParam(searchParams, hashParams, 'trace_hash') || agentInviteCode,
    agentInviteCode,
    mode: readParam(searchParams, hashParams, 'mode'),
  }
}

export function resolveInviteCode(hostname: string = window.location.hostname): string {
  // 渠道邀请码联调：先启用文件顶部的 TEST_CHANNEL_INVITE_CODE，再取消下面两行注释。
  // void hostname
  if (TEST_CHANNEL_INVITE_CODE) return TEST_CHANNEL_INVITE_CODE
  const parsed = parseInviteParamsFromLocation()
  if (parsed.inviteCode) {
    return parsed.inviteCode
  }

  return extractInviteCodeFromSubdomain(hostname)
}

export function resolveTraceHash(): string {
  return parseInviteParamsFromLocation().traceHash
}

export function resolveAgentInviteCode(): string {
  const parsed = parseInviteParamsFromLocation()
  if (parsed.agentInviteCode) {
    return parsed.agentInviteCode
  }

  // URL 中没有参数 i 时，尝试从本地缓存读取
  try {
    const cached = localStore.getItem<string>(StorageKey.AGENT_INVITE_CODE)
    if (cached) {
      return cached
    }
  } catch {
    // localStorage 不可用时忽略
  }

  return ''
}

/**
 * 将 URL 中的参数 i（代理邀请码）缓存到本地存储。
 * 在应用启动时调用，确保首次打开分享链接时参数不丢失。
 */
export function cacheAgentInviteCodeIfPresent(): void {
  const parsed = parseInviteParamsFromLocation()
  if (parsed.agentInviteCode) {
    try {
      localStore.setItem(StorageKey.AGENT_INVITE_CODE, parsed.agentInviteCode)
    } catch (error) {
      console.warn('[channelPackage] failed to cache agentInviteCode:', error)
    }
  }
}

/**
 * 清除本地缓存的代理邀请码。
 * 在登录/注册成功后调用。
 */
export function clearAgentInviteCodeCache(): void {
  try {
    localStore.removeItem(StorageKey.AGENT_INVITE_CODE)
  } catch {
    // localStorage 不可用时忽略
  }
}

export function shouldOpenRegisterMode(): boolean {
  return parseInviteParamsFromLocation().mode === 'register'
}

export function buildChannelClubInviteUrl(clubInviteCode?: string): string {
  const currentUrl = new URL(window.location.href)
  const normalizedClubCode = readString(clubInviteCode)
  if (!normalizedClubCode || !CHANNEL_MAIN_DOMAIN) {
    return currentUrl.origin
  }

  const port = currentUrl.port ? `:${currentUrl.port}` : ''
  return `${currentUrl.protocol}//${normalizedClubCode}.${CHANNEL_MAIN_DOMAIN}${port}`
}

export function buildChannelAgentInviteUrl(
  agentInviteCode: string,
  clubInviteCode?: string,
): string {
  const normalizedCode = readString(agentInviteCode)
  const clubInviteUrl = buildChannelClubInviteUrl(clubInviteCode)
  if (!normalizedCode) {
    return clubInviteUrl
  }

  const params = new URLSearchParams({
    mode: 'register',
    i: normalizedCode,
  })
  return `${clubInviteUrl}/#/?${params.toString()}`
}

export function buildChannelRegisterUrl(options?: {
  inviteCode?: string
  traceHash?: string
}): string {
  const currentUrl = new URL(window.location.href)
  const nextParams = new URLSearchParams()
  nextParams.set('mode', 'register')
  const inviteCode = readString(options?.inviteCode)
  const traceHash = readString(options?.traceHash)
  if (inviteCode && !traceHash) {
    nextParams.set('i', inviteCode)
  }
  if (traceHash) {
    nextParams.set('trace_hash', traceHash)
  }

  return `${currentUrl.protocol}//${inviteCode}.${currentUrl.hostname}/#/?${nextParams.toString()}`
}
