function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, '')
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

/**
 * 判断当前入口是否应按俱乐部渠道包渲染。
 *
 * 除了历史的 `邀请码.主域名`，通过 CNAME 接入的独立域名也属于渠道包。
 * 构建时配置的主域名是官方入口；localhost 和 IP 则保留开发预览行为。
 */
export function isChannelPackageHostname(hostname: string, mainDomain: string): boolean {
  const normalizedHost = normalizeHostname(hostname)
  const normalizedMainDomain = normalizeHostname(mainDomain)
  if (!normalizedHost || !normalizedMainDomain || normalizedHost === normalizedMainDomain) {
    return false
  }
  if (isChannelSubdomainHostname(normalizedHost, normalizedMainDomain)) {
    return true
  }
  if (isLocalOrIpHostname(normalizedHost)) {
    return false
  }

  return true
}
