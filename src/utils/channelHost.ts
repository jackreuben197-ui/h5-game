function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, '')
}

type DomainCandidates = string | readonly string[]

function normalizeDomainCandidates(domains: DomainCandidates): string[] {
  const values = Array.isArray(domains) ? domains : [domains]
  return Array.from(
    new Set(
      values
        .map((domain) => normalizeHostname(String(domain || '')))
        .filter((domain) => !!domain),
    ),
  )
}

function isLocalOrIpHostname(hostname: string): boolean {
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '::1' ||
    /^127(?:\.\d{1,3}){3}$/.test(hostname)
  ) {
    return true
  }

  // 自定义俱乐部入口只支持域名。IP 预览地址继续按官方/开发包处理。
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':')
}

export function isChannelSubdomainHostname(hostname: string, mainDomain: string): boolean {
  const normalizedHost = normalizeHostname(hostname)
  const normalizedMainDomain = normalizeHostname(mainDomain)
  if (!normalizedHost || !normalizedMainDomain) {
    return false
  }

  return (
    normalizedHost !== normalizedMainDomain &&
    normalizedHost.endsWith(`.${normalizedMainDomain}`)
  )
}

/** 返回 hostname 匹配到的配置域名；支持域名本身和其下级子域名。 */
export function findConfiguredBaseDomain(
  hostname: string,
  domains: DomainCandidates,
): string {
  const normalizedHost = normalizeHostname(hostname)
  if (!normalizedHost) return ''

  return (
    normalizeDomainCandidates(domains)
      .sort((left, right) => right.length - left.length)
      .find(
        (domain) => normalizedHost === domain || normalizedHost.endsWith(`.${domain}`),
      ) || ''
  )
}

export function isConfiguredDomainHostname(
  hostname: string,
  domains: DomainCandidates,
): boolean {
  return Boolean(findConfiguredBaseDomain(hostname, domains))
}

/**
 * 判断当前入口是否应按俱乐部渠道包渲染。
 *
 * 除了历史的 `邀请码.主域名`，通过 CNAME 接入的独立域名也属于渠道包。
 * 服务端下发的主域名是官方入口；localhost 和 IP 则保留开发预览行为。
 */
export function isChannelPackageHostname(
  hostname: string,
  mainDomains: DomainCandidates,
): boolean {
  const normalizedHost = normalizeHostname(hostname)
  if (!normalizedHost) {
    return false
  }
  if (isLocalOrIpHostname(normalizedHost)) {
    return false
  }

  const officialDomains = normalizeDomainCandidates(mainDomains)
  if (officialDomains.includes(normalizedHost)) {
    return false
  }

  return true
}

interface PlatformDomainRecord {
  domain?: unknown
  domain_type?: unknown
  status?: unknown
}

/** 解析全局配置中的平台域名 JSON，只保留指定类型且已生效的域名。 */
export function parseActivePlatformDomains(raw: unknown, expectedType: 1 | 2): string[] {
  let value = raw
  for (let depth = 0; depth < 2 && typeof value === 'string'; depth += 1) {
    const text = value.trim()
    if (!text) return []
    try {
      value = JSON.parse(text)
    } catch {
      return []
    }
  }

  const records = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)
      ? ((value as { data: unknown[] }).data)
      : []

  return Array.from(
    new Set(
      records
        .map((item) => item as PlatformDomainRecord)
        .filter(
          (item) =>
            Number(item.domain_type) === expectedType &&
            String(item.status || '').trim().toLowerCase() === 'active',
        )
        .map((item) => normalizeHostname(String(item.domain || '')))
        .filter((domain) => !!domain),
    ),
  )
}
