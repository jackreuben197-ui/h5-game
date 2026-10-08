import StorageKey from '@/constants/storageKey'
import type { PrivateUcChargeConfigItem, PrivateUcFeeType } from '@bridge-protocol'
import type {
  DiamondConfigMap,
  DiamondSetting,
  MttRecordFeeConfig,
  PrivateUcConfigData,
  PrivateUcConfigRow,
} from '@/api/models/config'
import { localStore } from '@/utils/localStore'
import { appConfig } from '@/utils/appConfig'
import {
  findConfiguredBaseDomain,
  isChannelPackageHostname,
  isChannelSubdomainHostname,
  isConfiguredDomainHostname,
  parseActivePlatformDomains,
} from '@/utils/channelHost'
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

interface PlatformDomainGlobalConfig {
  plat_domain_qrcode_info?: unknown
  plat_domain_main_info?: unknown
}

interface ClubInviteSource {
  club_id?: number | string
  invitation_code?: string
  safari_base_url?: string
}

// 历史官方入口兼容：该域名未包含在测试环境 plat_domain_main_info 中，
// 但仍是有效官方包入口，必须避免按俱乐部自定义 CNAME 查询。
const BUILT_IN_OFFICIAL_DOMAINS = ['test2-game.awanptest.com']

let platformMainDomains: string[] = [...BUILT_IN_OFFICIAL_DOMAINS]
let platformOfficialMainDomains: string[] = []
let platformQrCodeDomains: string[] = []

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

function normalizeDomainOrigin(value: unknown, fallbackProtocol: string): string {
  const rawDomain = readString(value)
  if (!rawDomain) return ''

  try {
    const url = new URL(rawDomain.includes('://') ? rawDomain : `${fallbackProtocol}//${rawDomain}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.origin
  } catch {
    return ''
  }
}

export function configurePlatformDomains(
  config: PlatformDomainGlobalConfig | null | undefined,
): void {
  const typeOneDomains = parseActivePlatformDomains(config?.plat_domain_qrcode_info, 1)
  const typeTwoDomains = parseActivePlatformDomains(config?.plat_domain_main_info, 2)

  // 两种平台域名本身都属于官方包；只有其下的邀请码子域名按渠道包处理。
  platformMainDomains = Array.from(
    new Set([...BUILT_IN_OFFICIAL_DOMAINS, ...typeOneDomains, ...typeTwoDomains]),
  )
  platformOfficialMainDomains = typeTwoDomains
  // domain_type=1 专门用于生成俱乐部邀请二维码链接。
  platformQrCodeDomains = typeOneDomains
}

function findPlatformBaseDomain(hostname: string): string {
  return (
    findConfiguredBaseDomain(hostname, platformQrCodeDomains) ||
    findConfiguredBaseDomain(hostname, platformMainDomains)
  )
}

export function getPlatformMainDomains(): readonly string[] {
  return platformMainDomains
}

export function getPlatformQrCodeDomains(): readonly string[] {
  return platformQrCodeDomains
}

export function isOfficialPackageHost(hostname: string = window.location.hostname): boolean {
  const normalizedHost = readString(hostname).toLowerCase()
  if (!normalizedHost) return false
  if (findPlatformBaseDomain(normalizedHost)) {
    return platformMainDomains.includes(normalizedHost)
  }
  return normalizedHost === resolveChannelMainDomain(normalizedHost)
}

export function isPlatformQrCodeHost(hostname: string = window.location.hostname): boolean {
  return isConfiguredDomainHostname(readString(hostname), platformQrCodeDomains)
}

function resolvePlatformRedirectDomain(hostname: string): string {
  const qrCodeBaseDomain = findConfiguredBaseDomain(hostname, platformQrCodeDomains)
  if (qrCodeBaseDomain) {
    return platformOfficialMainDomains[0] || qrCodeBaseDomain
  }
  return findConfiguredBaseDomain(hostname, platformMainDomains) || getChannelMainDomain(hostname)
}

function pickPlatformQrCodeDomain(): string {
  if (!platformQrCodeDomains.length) return ''
  const index = Math.floor(Math.random() * platformQrCodeDomains.length)
  return platformQrCodeDomains[index] || platformQrCodeDomains[0] || ''
}

function appendHashQuery(baseUrl: string, params: URLSearchParams): string {
  const query = params.toString()
  if (!query) return baseUrl
  return baseUrl.includes('/#/?') ? `${baseUrl}&${query}` : `${baseUrl}/#/?${query}`
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

// 主域名：优先取运行时 config.json（按环境部署），否则退回当前 host 的末三段。
// 构建期的 VITE_CHANNEL_MAIN_DOMAIN 对所有环境只有一个值，在轮换的预览域名上会失效，
// 于是主域名本身会被判成渠道包，并向 /org/club/default 发出 base_url 查询。
export function resolveChannelMainDomain(hostname: string = window.location.hostname): string {
  const configured = readString(appConfig.channelMainDomain).toLowerCase()
  return configured || getChannelMainDomain(hostname)
}

// 纯 IP 不是渠道域名：主域名缺省时会退化成「自身末三段」，127.0.0.1 会被当成 0.0.1 的子域名。
function isNumericHost(hostname: string): boolean {
  const labels = getHostLabels(hostname)
  return labels.length > 0 && labels.every((label) => /^\d+$/.test(label))
}

function isReservedOrNumericHost(hostname: string): boolean {
  return RESERVED_SUBDOMAINS.has(getHostLabels(hostname)[0] || '') || isNumericHost(hostname)
}

export function isChannelPackageHost(hostname: string = window.location.hostname): boolean {
  if (TEST_CHANNEL_INVITE_CODE) return true
  const normalizedHost = readString(hostname).toLowerCase()
  if (isReservedOrNumericHost(normalizedHost)) {
    return false
  }
  if (normalizedHost.endsWith('.localhost')) {
    const labels = getHostLabels(normalizedHost)
    return labels.length >= 2 && labels[0] !== 'localhost' && labels[0] !== 'www'
  }
  const mainDomains = findPlatformBaseDomain(normalizedHost)
    ? platformMainDomains
    : resolveChannelMainDomain(normalizedHost)
  return isChannelPackageHostname(normalizedHost, mainDomains)
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

export function isClubLinkContext(hostname: string = window.location.hostname): boolean {
  if (isPrivateDomainMode(hostname)) return true
  if (typeof window !== 'undefined' && hasClubLinkParams()) return true
  return false
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
 * 渠道包不再使用钻石体系。
 *
 * 开启后仅渠道包隐藏钻石钱包、账单，以及尚未配置私域 UC 收费的功能；
 * 已纳入私域 UC 收费的业务入口自行切换为 UC 展示。
 */
export const CHANNEL_PACKAGE_DIAMOND_FREE_MODE = true

// 私域 UC 收费总开关：关闭后下发价格统一归零，H5 / Cocos 一起隐藏 1～9 的收费与图标。
export const CHANNEL_PACKAGE_UC_CHARGE_ENABLED = true

export const PRIVATE_UC_FEE_TYPE = {
  CLUB_NAME: 1,
  REPLAY_COLLECT: 2,
  MTT_RECORD: 3,
  NICKNAME: 4,
  ADD_TIME: 5,
  VIEW_PUBLIC_CARDS: 6,
  NORMAL_TABLE_RECORD: 7,
  VIEW_ONE_PLAYER: 8,
  VIEW_ALL_PLAYERS: 9,
} as const satisfies Record<string, PrivateUcFeeType>

// 私域 UC 收费定义共 1～9；不在这 9 类中的原钻石收费仍由各端保持隐藏。
const DEFINED_PRIVATE_UC_FEE_TYPES: PrivateUcFeeType[] = [
  PRIVATE_UC_FEE_TYPE.CLUB_NAME,
  PRIVATE_UC_FEE_TYPE.REPLAY_COLLECT,
  PRIVATE_UC_FEE_TYPE.MTT_RECORD,
  PRIVATE_UC_FEE_TYPE.NICKNAME,
  PRIVATE_UC_FEE_TYPE.ADD_TIME,
  PRIVATE_UC_FEE_TYPE.VIEW_PUBLIC_CARDS,
  PRIVATE_UC_FEE_TYPE.NORMAL_TABLE_RECORD,
  PRIVATE_UC_FEE_TYPE.VIEW_ONE_PLAYER,
  PRIVATE_UC_FEE_TYPE.VIEW_ALL_PLAYERS,
]

// 接口失败或某收费项未配置时价格为 0，两端都隐藏收费与 UC 图标。
const PRIVATE_UC_PRICE_BY_FEE_TYPE: Record<PrivateUcFeeType, number> = {
  [PRIVATE_UC_FEE_TYPE.CLUB_NAME]: 0,
  [PRIVATE_UC_FEE_TYPE.REPLAY_COLLECT]: 0,
  [PRIVATE_UC_FEE_TYPE.MTT_RECORD]: 0,
  [PRIVATE_UC_FEE_TYPE.NICKNAME]: 0,
  [PRIVATE_UC_FEE_TYPE.ADD_TIME]: 0,
  [PRIVATE_UC_FEE_TYPE.VIEW_PUBLIC_CARDS]: 0,
  [PRIVATE_UC_FEE_TYPE.NORMAL_TABLE_RECORD]: 0,
  [PRIVATE_UC_FEE_TYPE.VIEW_ONE_PLAYER]: 0,
  [PRIVATE_UC_FEE_TYPE.VIEW_ALL_PLAYERS]: 0,
}

export function getPrivateUcChargeConfigs(): PrivateUcChargeConfigItem[] {
  return DEFINED_PRIVATE_UC_FEE_TYPES.map((feeType) => ({
    feeType,
    price: CHANNEL_PACKAGE_UC_CHARGE_ENABLED ? PRIVATE_UC_PRICE_BY_FEE_TYPE[feeType] : 0,
  }))
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function parseJsonRecord(value: string): Record<string, unknown> | null {
  if (!value.trim()) return null
  try {
    return readRecord(JSON.parse(value))
  } catch {
    return null
  }
}

function readFiniteNumber(value: unknown): number | null {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

function toUcAmount(value: unknown, unitScale: number): number {
  const amount = readFiniteNumber(value)
  return amount === null ? 0 : amount / unitScale
}

function isInTimeWindow(startTime: unknown, endTime: unknown): boolean {
  const start = Number(startTime)
  const end = Number(endTime)
  const now = Math.floor(Date.now() / 1000)
  return Number.isFinite(start) && Number.isFinite(end) && start > 0 && end >= start
    && start <= now && now <= end
}

function parsePrivateUcSetting(setting: string, unitScale: number): DiamondSetting[] {
  if (!setting.trim()) return []
  try {
    const parsed = JSON.parse(setting)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const row = readRecord(item)
      if (!row) return []
      const sb = readFiniteNumber(row.sb)
      if (sb === null) return []
      const normalized: DiamondSetting = {
        sb,
        blind_type: Math.floor(readFiniteNumber(row.blind_type) ?? 0),
        price: toUcAmount(row.price, unitScale),
        discount_price: toUcAmount(row.discount_price, unitScale),
        discount: readFiniteNumber(row.discount) ?? 1,
      }
      if (row.record_floor !== undefined) {
        normalized.record_floor = toUcAmount(row.record_floor, unitScale)
      }
      if (row.record_ratio !== undefined) {
        normalized.record_ratio = readFiniteNumber(row.record_ratio) ?? 0
      }
      if (row.decimal_type !== undefined) {
        normalized.decimal_type = Math.floor(readFiniteNumber(row.decimal_type) ?? 0)
      }
      return [normalized]
    })
  } catch {
    return []
  }
}

export interface NormalizedPrivateUcConfig {
  chargeItems: PrivateUcChargeConfigItem[]
  diamondConfig: DiamondConfigMap
  mttRecordFeeConfig: MttRecordFeeConfig | null
}

function readMttRecordFeeConfig(
  row: PrivateUcConfigRow,
  unitScale: number,
): MttRecordFeeConfig | null {
  const config = parseJsonRecord(row.str_value)
  if (!config || Number(config.status) !== 1) return null
  return {
    status: 1,
    floor_price: toUcAmount(config.floor_price, unitScale),
    ratio: readFiniteNumber(config.ratio) ?? 0,
    decimal_type: Math.floor(readFiniteNumber(config.decimal_type) ?? 1),
    discount: readFiniteNumber(config.discount) ?? 1,
    start_time: Math.floor(readFiniteNumber(config.start_time) ?? 0),
    end_time: Math.floor(readFiniteNumber(config.end_time) ?? 0),
  }
}

export function normalizePrivateUcConfig(raw: PrivateUcConfigData): NormalizedPrivateUcConfig {
  const unitScale = Number(raw?.unit_scale)
  const rows = Array.isArray(raw?.data) ? raw.data : []
  const chargeItems = getPrivateUcChargeConfigs()
  const chargeItemMap = new Map(chargeItems.map((item) => [item.feeType, item]))
  const diamondConfig: DiamondConfigMap = {}
  let mttRecordFeeConfig: MttRecordFeeConfig | null = null

  if (!CHANNEL_PACKAGE_UC_CHARGE_ENABLED || !Number.isFinite(unitScale) || unitScale <= 0) {
    return { chargeItems, diamondConfig, mttRecordFeeConfig }
  }

  for (const row of rows) {
    const feeType = Number(row.fee_type) as PrivateUcFeeType
    if (!DEFINED_PRIVATE_UC_FEE_TYPES.includes(feeType)) continue

    // 只有收费类型 1～4 的全局价格/规则来自私域 UC 接口。
    // 5 的加时次数/每日免费次数和 6 的查看模式/每日免费次数已经迁回
    // /config/global/config 的 private_* key，不能再从这里的 config_kind=1 读取。
    if (row.config_kind === 1 && feeType <= PRIVATE_UC_FEE_TYPE.NICKNAME) {
      const config = parseJsonRecord(row.str_value)
      const item = chargeItemMap.get(feeType)
      if (!item) continue
      switch (feeType) {
        case PRIVATE_UC_FEE_TYPE.CLUB_NAME:
          item.price = toUcAmount(config?.price, unitScale)
          break
        case PRIVATE_UC_FEE_TYPE.REPLAY_COLLECT:
          item.price = toUcAmount(row.value, unitScale)
          break
        case PRIVATE_UC_FEE_TYPE.MTT_RECORD:
          mttRecordFeeConfig = readMttRecordFeeConfig(row, unitScale)
          item.price = mttRecordFeeConfig?.floor_price ?? 0
          break
        case PRIVATE_UC_FEE_TYPE.NICKNAME: {
          if (!config || Number(config.status) !== 1) break
          const price = isInTimeWindow(config.start_time, config.end_time)
            ? config.pay_price
            : config.raw_price
          item.price = toUcAmount(price, unitScale)
          break
        }
      }
      continue
    }

    if (row.config_kind !== 2 || row.status !== 1 || row.config_type <= 0 || row.type_ext < 0) {
      continue
    }
    const setting = parsePrivateUcSetting(row.setting, unitScale)
    if (!setting.length) continue
    if (!diamondConfig[row.config_type]) diamondConfig[row.config_type] = {}
    diamondConfig[row.config_type][row.type_ext] = {
      id: row.id,
      config_type: row.config_type,
      status: row.status,
      type_ext: row.type_ext,
      start_date: row.start_date,
      end_date: row.end_date,
      start_time: row.start_time,
      end_time: row.end_time,
      setting,
    }
  }

  return { chargeItems, diamondConfig, mttRecordFeeConfig }
}

export function isPrivateUcChargeVisible(
  price: number,
  hostname: string = window.location.hostname,
): boolean {
  return isChannelPackageHost(hostname) && Number.isFinite(price) && price > 0
}

export function isChannelDiamondFreeMode(hostname: string = window.location.hostname): boolean {
  return CHANNEL_PACKAGE_DIAMOND_FREE_MODE && isChannelPackageHost(hostname)
}

/**
 * 将 localStorage 中的数据拷贝到主域名。
 * 通过主域名的 URL 参数传递数据，主域名页面读取后写入自己的 storage。
 */
export function copyStorageToMainDomain(): void {
  const currentUrl = new URL(window.location.href)
  const mainDomain = resolvePlatformRedirectDomain(currentUrl.hostname)
  if (!mainDomain) {
    console.warn('[channelPackage] platform main domain is unavailable; skip redirect')
    return
  }

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
  // 与 buildChannelClubInviteUrl 一致：保留端口，否则本地 / 非 80 端口部署会跳到打不开的地址。
  const portSuffix = currentUrl.port ? `:${currentUrl.port}` : ''
  const targetUrl = `${currentUrl.protocol}//${mainDomain}${portSuffix}/#/`
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
  const normalizedHost = readString(hostname).toLowerCase()
  if (isReservedOrNumericHost(normalizedHost)) {
    return ''
  }
  if (normalizedHost.endsWith('.localhost')) {
    const labels = getHostLabels(normalizedHost)
    if (labels.length >= 2 && labels[0] !== 'localhost' && labels[0] !== 'www') {
      return labels[0]
    }
  }
  // 二维码域名和历史主域名都兼容“邀请码.域名”的分享结构；俱乐部独立
  // CNAME 域名没有邀请码前缀，继续由 /org/club/default 的 base_url 解析。
  const baseDomain = findPlatformBaseDomain(normalizedHost)
  if (baseDomain) {
    if (normalizedHost === baseDomain) {
      return ''
    }
    const withoutSuffix = normalizedHost.slice(0, -(baseDomain.length + 1))
    return readString(withoutSuffix.split('.')[0] || '')
  }
  // 自定义域名也属于渠道包，但它没有可作为邀请码的主域名前缀。
  if (!isChannelSubdomainHostname(normalizedHost, resolveChannelMainDomain(normalizedHost))) {
    return ''
  }
  // 邀请码 = host 最前面的标签
  return getHostLabels(hostname)[0] || ''
}

export function resolveUrlClubId(url: URL = new URL(window.location.href)): number {
  const searchParams = url.searchParams
  const hashParams = getHashQueryParams(url.hash || '')
  const rawId =
    readParam(searchParams, hashParams, 'club_id') ||
    readParam(searchParams, hashParams, 'clubId') ||
    readParam(searchParams, hashParams, 'c') ||
    readParam(searchParams, hashParams, 'club')
  const num = parseInt(rawId, 10)
  return isNaN(num) || num <= 0 ? 0 : num
}

export function resolveUrlClubRandomId(url: URL = new URL(window.location.href)): number {
  const searchParams = url.searchParams
  const hashParams = getHashQueryParams(url.hash || '')
  const rawId =
    readParam(searchParams, hashParams, 'random_id') ||
    readParam(searchParams, hashParams, 'club_random_id') ||
    readParam(searchParams, hashParams, 'clubRandomId')
  const num = parseInt(rawId, 10)
  return isNaN(num) || num <= 0 ? 0 : num
}

export function hasClubLinkParams(url: URL = new URL(window.location.href)): boolean {
  if (typeof window === 'undefined') return false
  const inviteCode =
    readParam(url.searchParams, getHashQueryParams(url.hash || ''), 'invite_code') ||
    readParam(url.searchParams, getHashQueryParams(url.hash || ''), 'code') ||
    readParam(url.searchParams, getHashQueryParams(url.hash || ''), 'i')
  if (inviteCode) return true
  if (resolveUrlClubId(url) > 0) return true
  if (resolveUrlClubRandomId(url) > 0) return true
  if (resolveTelegramClubRandomId()) return true
  return false
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

const INVITE_LANDING_HASH = '/#/home'

export function shouldOpenRegisterMode(): boolean {
  return parseInviteParamsFromLocation().mode === 'register'
}

function buildChannelClubOrigin(inviteCode?: string, safariBaseUrl?: string): string {
  const currentUrl = new URL(window.location.href)
  const customDomainOrigin = normalizeDomainOrigin(safariBaseUrl, currentUrl.protocol)
  if (customDomainOrigin) {
    return customDomainOrigin
  }

  const code = readString(inviteCode)
  if (!code) {
    return currentUrl.origin
  }

  const portSuffix = currentUrl.port ? `:${currentUrl.port}` : ''
  if (findPlatformBaseDomain(currentUrl.hostname)) {
    const qrCodeDomain = pickPlatformQrCodeDomain()
    if (!qrCodeDomain) {
      const params = new URLSearchParams({ invite_code: code })
      return `${currentUrl.origin}/#/?${params.toString()}`
    }
    return `${currentUrl.protocol}//${code}.${qrCodeDomain}${portSuffix}`
  }

  let baseHost = currentUrl.hostname
  const mainDomain = getChannelMainDomain()
  if (mainDomain && isChannelPackageHost(currentUrl.hostname)) {
    baseHost = mainDomain
  }
  return `${currentUrl.protocol}//${code}.${baseHost}${portSuffix}`
}

export function buildChannelClubInviteUrl(inviteCode?: string, safariBaseUrl?: string): string {
  const baseUrl = buildChannelClubOrigin(inviteCode, safariBaseUrl)
  return baseUrl.includes('/#/') ? baseUrl : `${baseUrl}${INVITE_LANDING_HASH}`
}

export function resolveChannelClubInviteFields(
  club: ClubInviteSource | null | undefined,
  channelDefaultClub: ClubInviteSource | null | undefined,
): { clubInviteCode: string; safariBaseUrl: string } {
  const clubId = readString(String(club?.club_id ?? ''))
  const channelClubId = readString(String(channelDefaultClub?.club_id ?? ''))
  const matchingChannelClub =
    clubId && channelClubId && clubId === channelClubId ? channelDefaultClub : undefined

  return {
    clubInviteCode:
      readString(club?.invitation_code) || readString(matchingChannelClub?.invitation_code),
    safariBaseUrl:
      readString(club?.safari_base_url) || readString(matchingChannelClub?.safari_base_url),
  }
}

export function buildChannelAgentInviteUrl(
  agentInviteCode: string,
  clubInviteCode?: string,
  safariBaseUrl?: string,
): string {
  const normalizedCode = readString(agentInviteCode)
  if (!normalizedCode) {
    return buildChannelClubInviteUrl(clubInviteCode, safariBaseUrl)
  }

  const params = new URLSearchParams({
    mode: 'register',
    i: normalizedCode,
  })
  return appendHashQuery(buildChannelClubOrigin(clubInviteCode, safariBaseUrl), params)
}

export function buildChannelRegisterUrl(options?: {
  inviteCode?: string
  traceHash?: string
  safariBaseUrl?: string
}): string {
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

  return appendHashQuery(buildChannelClubOrigin(inviteCode, options?.safariBaseUrl), nextParams)
}
