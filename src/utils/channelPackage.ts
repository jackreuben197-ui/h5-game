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
import {
  findConfiguredBaseDomain,
  isChannelPackageHostname,
  isConfiguredDomainHostname,
  parseActivePlatformDomains,
} from '@/utils/channelHost'

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
let platformQrCodeDomains: string[] = []

// 渠道包联调时可临时启用：
// const TEST_CHANNEL_INVITE_CODE = ''
const TEST_CHANNEL_INVITE_CODE = 'ksGuBmMk'
// const TEST_CHANNEL_INVITE_CODE = 'rhswehjy'
// const TEST_CHANNEL_INVITE_CODE = 'DtuDnwXY'

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
  // domain_type=1 专门用于生成俱乐部邀请二维码链接。
  platformQrCodeDomains = typeOneDomains
}

export function getPlatformMainDomains(): readonly string[] {
  return platformMainDomains
}

export function getPlatformQrCodeDomains(): readonly string[] {
  return platformQrCodeDomains
}

export function isOfficialPackageHost(hostname: string = window.location.hostname): boolean {
  const normalizedHost = readString(hostname).toLowerCase()
  return platformMainDomains.includes(normalizedHost)
}

export function isPlatformQrCodeHost(hostname: string = window.location.hostname): boolean {
  return isConfiguredDomainHostname(readString(hostname), platformQrCodeDomains)
}

function getPrimaryPlatformMainDomain(): string {
  return platformMainDomains[0] || ''
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

export function isChannelPackageHost(hostname: string = window.location.hostname): boolean {
  // 渠道包联调：取消下面两行注释可强制按渠道域名处理。
  // void hostname
  if (TEST_CHANNEL_INVITE_CODE) return true
  return isChannelPackageHostname(readString(hostname), platformMainDomains)
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
  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    start > 0 &&
    end >= start &&
    start <= now &&
    now <= end
  )
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
  const mainDomain = getPrimaryPlatformMainDomain()
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
  const currentUrl = new URL(window.location.href)
  const targetUrl = `${currentUrl.protocol}//${mainDomain}/#/`
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
  // 二维码域名和历史主域名都兼容“邀请码.域名”的分享结构；俱乐部独立
  // CNAME 域名没有邀请码前缀，继续由 /org/club/default 的 base_url 解析。
  const baseDomain =
    findConfiguredBaseDomain(normalizedHost, platformQrCodeDomains) ||
    findConfiguredBaseDomain(normalizedHost, platformMainDomains)
  if (!baseDomain || normalizedHost === baseDomain) {
    return ''
  }

  const suffix = `.${baseDomain}`
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

export function buildChannelClubInviteUrl(clubInviteCode?: string, safariBaseUrl?: string): string {
  const currentUrl = new URL(window.location.href)
  const customDomainOrigin = normalizeDomainOrigin(safariBaseUrl, currentUrl.protocol)
  if (customDomainOrigin) {
    return customDomainOrigin
  }

  const normalizedClubCode = readString(clubInviteCode)
  if (!normalizedClubCode) {
    return currentUrl.origin
  }

  const qrCodeDomain = pickPlatformQrCodeDomain()
  if (!qrCodeDomain) {
    const params = new URLSearchParams({ invite_code: normalizedClubCode })
    return `${currentUrl.origin}/#/?${params.toString()}`
  }

  return `${currentUrl.protocol}//${normalizedClubCode}.${qrCodeDomain}`
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
  const clubInviteUrl = buildChannelClubInviteUrl(clubInviteCode, safariBaseUrl)
  if (!normalizedCode) {
    return clubInviteUrl
  }

  const params = new URLSearchParams({
    mode: 'register',
    i: normalizedCode,
  })
  return appendHashQuery(clubInviteUrl, params)
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

  const baseUrl = inviteCode ? buildChannelClubInviteUrl(inviteCode) : currentUrl.origin
  return appendHashQuery(baseUrl, nextParams)
}
