import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'
import {
  isTelegramMiniAppEnv,
  readTelegramStartParam,
  resolveTelegramClubInviteCode,
  resolveTelegramClubRandomId,
} from '@/utils/telegramStartParam'

// 渠道包 = 邀请子域名 <邀请码>.<部署主域名>。部署主域名形如 sub.brand.tld（3 段，
// 如 prvw-game.trackyourchoice.com / ccsgame.recognitionway.com），邀请码作为额外前缀 → 共 ≥4 段。
// 主域名与邀请码全部从「当前网站 host」(window.location.hostname) 推导 —— 与 buildChannelClubInviteUrl 同源，
// 故「生成链接」与「识别链接」天然一致，不依赖后端 API 域名 / config.json，自动适配每日轮换域名与独立测试域名。
const DEPLOY_APEX_LABEL_COUNT = 3
const RESERVED_SUBDOMAINS = new Set(['www'])
// 与 index.html 的 TG_MINI_APP_PARAM 保持一致。
const TG_MINI_APP_PARAM = 'tg_mini_app'

export const CHANNEL_MAIN_DOMAIN = (import.meta.env.VITE_CHANNEL_MAIN_DOMAIN || '')
  .trim()
  .toLowerCase()
// 渠道包联调时可临时启用：
const TEST_CHANNEL_INVITE_CODE = ''
// const TEST_CHANNEL_INVITE_CODE = 'ksGuBmMk'
// const TEST_CHANNEL_INVITE_CODE = 'rhswehjy'
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
  if (TEST_CHANNEL_INVITE_CODE) return true
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

export function hasTelegramClubParam(): boolean {
  if (!isTelegramMiniAppEnv()) {
    return false
  }

  if (resolveTelegramClubInviteCode() || resolveTelegramClubRandomId()) {
    return true
  }

  const startParam = readTelegramStartParam()
  if (startParam && startParam.trim()) {
    return true
  }

  const parsed = parseInviteParamsFromLocation()
  if (parsed.inviteCode || parsed.agentInviteCode) {
    return true
  }

  try {
    const url = new URL(window.location.href)
    const searchParams = url.searchParams
    const hash = url.hash || ''
    const queryIndex = hash.indexOf('?')
    const hashParams =
      queryIndex >= 0 ? new URLSearchParams(hash.slice(queryIndex + 1)) : new URLSearchParams()
    const clubRandomId =
      searchParams.get('club_random_id') ||
      searchParams.get('clubRandomId') ||
      hashParams.get('club_random_id') ||
      hashParams.get('clubRandomId')
    if (clubRandomId && clubRandomId.trim()) {
      return true
    }
  } catch {
    // malformed URL — ignore
  }

  return false
}

// A Telegram Mini App opened through a club channel (with club start_param / query params)
// is a private-domain context (4 tabs). Opened directly without club parameters, it is the
// Platform Version (5 tabs).
export function isTelegramClubContext(): boolean {
  return isTelegramMiniAppEnv() && hasTelegramClubParam()
}

// Private-domain mode = channel-package subdomain OR Telegram club context. This drives the
// private-domain UI (channel bottom nav: Home/Club/Deposit/Messages/My, single-club club page,
// channel-scoped room list). For non-Telegram web it is identical to isChannelPackageHost(),
// so existing flows are unchanged; it only adds the private-domain UI inside Telegram.
export function isPrivateDomainMode(hostname: string = window.location.hostname): boolean {
  return isChannelPackageHost(hostname) || isTelegramClubContext()
}

// 跳主域名会换 origin：sessionStorage 里的 Mini App 标记随之丢失，新地址里也不再有
// tgWebAppData，于是 Telegram 环境「消失」——底部导航、安全区适配、initData 兜底登录全部失效。
// 与 storage_data 同理，把 Telegram 身份一并带到目标地址，由 index.html 在新 origin 上还原。
function collectTelegramHandoffParams(): URLSearchParams {
  const params = new URLSearchParams()
  if (!isTelegramMiniAppEnv()) {
    return params
  }

  params.set(TG_MINI_APP_PARAM, '1')
  const initData = String(
    window.__H5_TG_INIT_DATA__ || window.Telegram?.WebApp?.initData || '',
  ).trim()
  if (initData) {
    params.set('tgWebAppData', initData)
  }
  return params
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
  // 与 buildChannelClubInviteUrl 一致：保留端口，否则本地 / 非 80 端口部署会跳到打不开的地址。
  const portSuffix = currentUrl.port ? `:${currentUrl.port}` : ''
  const targetUrl = `${currentUrl.protocol}//${getChannelMainDomain()}${portSuffix}/#/`
  const params = collectTelegramHandoffParams()
  // 将数据编码到 URL 参数中
  if (Object.keys(items).length > 0) {
    try {
      params.set('storage_data', btoa(encodeURIComponent(JSON.stringify(items))))
    } catch (error) {
      console.warn('[channelPackage] failed to encode storage data:', error)
    }
  }

  const query = params.toString()
  window.location.href = query ? `${targetUrl}?${query}` : targetUrl
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
  if (TEST_CHANNEL_INVITE_CODE) return TEST_CHANNEL_INVITE_CODE
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
  if (TEST_CHANNEL_INVITE_CODE) return TEST_CHANNEL_INVITE_CODE
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
  const parsed = parseInviteParamsFromLocation()
  if (parsed.traceHash) {
    return parsed.traceHash
  }
  return resolveAgentInviteCode()
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

export function buildChannelClubInviteUrl(inviteCode?: string): string {
  const currentUrl = new URL(window.location.href)
  const code = readString(inviteCode)
  if (!code) {
    return `${currentUrl.origin}/#/home`
  }

  let baseHost = currentUrl.hostname
  const mainDomain = getChannelMainDomain()
  if (mainDomain && isChannelPackageHost(currentUrl.hostname)) {
    baseHost = mainDomain
  }
  const portSuffix = currentUrl.port ? `:${currentUrl.port}` : ''
  return `${currentUrl.protocol}//${code}.${baseHost}${portSuffix}/#/home`
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

  // 邀请码只放在 ?i= 参数里，链接用当前页面 origin（无需拼子域名/硬编码域名）。
  return `${currentUrl.origin}/#/?${nextParams.toString()}`
}
