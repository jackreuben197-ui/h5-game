import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'
import {
  isTelegramMiniAppEnv,
  resolveTelegramClubInviteCode,
  resolveTelegramClubRandomId,
} from '@/utils/telegramStartParam'

// 渠道包 = 邀请子域名 <邀请码>.<部署主域名>。部署主域名形如 sub.brand.tld（3 段，
// 如 prvw-game.trackyourchoice.com / ccsgame.recognitionway.com），邀请码作为额外前缀 → 共 ≥4 段。
// 主域名与邀请码全部从「当前网站 host」(window.location.hostname) 推导 —— 与 buildChannelClubInviteUrl 同源，
// 故「生成链接」与「识别链接」天然一致，不依赖后端 API 域名 / config.json，自动适配每日轮换域名与独立测试域名。
const DEPLOY_APEX_LABEL_COUNT = 3
const RESERVED_SUBDOMAINS = new Set(['www'])

function getHostLabels(hostname: string): string[] {
  return readString(hostname).toLowerCase().split('.').filter(Boolean)
}

// 部署主域名：取末尾 DEPLOY_APEX_LABEL_COUNT 段（裸主域名时即其自身）。
export function getChannelMainDomain(hostname: string = window.location.hostname): string {
  const labels = getHostLabels(hostname)
  if (labels.length <= DEPLOY_APEX_LABEL_COUNT) {
    return labels.join('.')
  }
  return labels.slice(labels.length - DEPLOY_APEX_LABEL_COUNT).join('.')
}
// const TEST_CHANNEL_INVITE_CODE = 'DYyhWokm'

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
  const labels = getHostLabels(hostname)
  // 裸主域名 / localhost / 单段 host 不是邀请子域名
  if (labels.length <= DEPLOY_APEX_LABEL_COUNT) {
    return false
  }
  // 纯 IP（hostname 已去端口）不算渠道子域名
  if (labels.every((label) => /^\d+$/.test(label))) {
    return false
  }
  // www.<主域名> 之类保留前缀不是邀请码
  if (RESERVED_SUBDOMAINS.has(labels[0])) {
    return false
  }
  return true
}

// A Telegram Mini App opened through a club channel is a private-domain context — the same as
// a channel-package subdomain.
export function isTelegramClubContext(): boolean {
  return isTelegramMiniAppEnv()
}

// Private-domain mode = channel-package subdomain OR Telegram club context. This drives the
// private-domain UI (channel bottom nav: Home/Club/Deposit/Messages/My, single-club club page,
// channel-scoped room list). For non-Telegram web it is identical to isChannelPackageHost(),
// so existing flows are unchanged; it only adds the private-domain UI inside Telegram.
export function isPrivateDomainMode(hostname: string = window.location.hostname): boolean {
  return isChannelPackageHost(hostname) || isTelegramClubContext()
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
  localStorage.clear()
  const currentUrl = new URL(window.location.href)
  // 与 buildChannelClubInviteUrl 一致：保留端口，否则本地 / 非 80 端口部署会跳到打不开的地址。
  const portSuffix = currentUrl.port ? `:${currentUrl.port}` : ''
  const targetUrl = `${currentUrl.protocol}//${getChannelMainDomain()}${portSuffix}/#/`
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
  if (!isChannelPackageHost(hostname)) {
    return ''
  }
  // 邀请码 = host 最前面的标签
  return getHostLabels(hostname)[0] || ''
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
  // void hostname
  // return TEST_CHANNEL_INVITE_CODE
  const parsed = parseInviteParamsFromLocation()
  if (parsed.inviteCode) {
    return parsed.inviteCode
  }

  // Telegram Mini App: no invite subdomain / ?invite_code= exists, so the club invite
  // code is carried in the deep-link start_param. Treated identically to a channel
  // subdomain code — it flows into /org/club/default (preview) and the login payload
  // (enrollment), so the channel-package auto-join mechanism works unchanged in Telegram.
  const fromTelegram = resolveTelegramClubInviteCode()
  if (fromTelegram) {
    return fromTelegram
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
  console.log('[channelPackage] cacheAgentInviteCodeIfPresent called, parsed:', parsed)
  if (parsed.agentInviteCode) {
    try {
      localStore.setItem(StorageKey.AGENT_INVITE_CODE, parsed.agentInviteCode)
      console.log('[channelPackage] cached agentInviteCode:', parsed.agentInviteCode)
    } catch (error) {
      console.warn('[channelPackage] failed to cache agentInviteCode:', error)
    }
  } else {
    console.log('[channelPackage] no agentInviteCode in URL, skipping cache')
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

// channel 模式下，分享链接直接用当前页面 origin —— 邀请码已“内嵌”在当前 <邀请码>.<基础域名> 子域名里，
// 接收端从子域名还原邀请码。无需拼域名，自动适配测试/正式环境。
export function buildChannelClubInviteUrl(inviteCode?: string): string {
  const currentUrl = new URL(window.location.href)
  const code = readString(inviteCode)
  if (!code) {
    return `${currentUrl.origin}/#/guest/home`
  }

  // 用「当前访问网站的域名」(window.location.hostname) 作为基准域名（可能每天变化，故动态读取，不写死/不取后端 API 域名）。
  // 邀请码作为子域名前缀：https://<邀请码>.<当前网站域名>/#/guest/home（依赖泛域名解析）。
  // 若当前已处于渠道子域名（host 带邀请码前缀），先去掉该前缀，避免二次拼接。
  let baseHost = currentUrl.hostname
  const mainDomain = getChannelMainDomain()
  if (mainDomain && isChannelPackageHost(currentUrl.hostname)) {
    baseHost = mainDomain
  }
  const portSuffix = currentUrl.port ? `:${currentUrl.port}` : ''
  return `${currentUrl.protocol}//${code}.${baseHost}${portSuffix}/#/guest/home`
}

export function buildChannelAgentInviteUrl(agentInviteCode: string): string {
  const currentUrl = new URL(window.location.href)
  const normalizedCode = readString(agentInviteCode)
  if (!normalizedCode) {
    return buildChannelClubInviteUrl()
  }

  return `${currentUrl.origin}/#/?i=${encodeURIComponent(normalizedCode)}`
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

  // 邀请码只放在 ?i= 参数里，链接用当前页面 origin（无需拼子域名/硬编码域名）。
  return `${currentUrl.origin}/#/?${nextParams.toString()}`
}
