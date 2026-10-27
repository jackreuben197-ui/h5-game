function normalizedText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizedHttpUrl(value: unknown): string {
  const raw = normalizedText(value)
  if (!raw) return ''

  try {
    const base = typeof window === 'undefined' ? 'https://platform.invalid/' : window.location.href
    const url = new URL(raw, base)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

function ensureMeta(name: string): HTMLMetaElement | null {
  if (typeof document === 'undefined') return null
  const existing = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (existing) return existing
  const meta = document.createElement('meta')
  meta.name = name
  document.head.appendChild(meta)
  return meta
}

function ensureLink(rel: string): HTMLLinkElement | null {
  if (typeof document === 'undefined') return null
  const existing = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (existing) return existing
  const link = document.createElement('link')
  link.rel = rel
  document.head.appendChild(link)
  return link
}

export interface SafariAppConfigSource {
  safari_icon_url?: string
  safari_label?: string
}

/** 服务端已按俱乐部、联盟优先级返回最终字段；空值才回退平台。 */
export function resolveSafariWebAppConfig(
  club: SafariAppConfigSource | null | undefined,
  platformIconUrl = '/icon.png',
  platformLabel = 'Newpkr',
): { label: string; iconUrl: string; hasCustomIcon: boolean } {
  const label = normalizedText(club?.safari_label) || normalizedText(platformLabel) || 'Newpkr'
  const customIconUrl = normalizedHttpUrl(club?.safari_icon_url)
  return {
    label,
    iconUrl: customIconUrl || normalizedHttpUrl(platformIconUrl),
    hasCustomIcon: Boolean(customIconUrl),
  }
}

/** 同步 Safari 主屏幕元数据；空配置时恢复平台默认图标和名称。 */
export function applySafariWebAppConfig(club: SafariAppConfigSource | null | undefined): void {
  if (typeof document === 'undefined') return
  const config = resolveSafariWebAppConfig(club)
  document.title = config.label
  ensureMeta('apple-mobile-web-app-title')?.setAttribute('content', config.label)
  ensureLink('apple-touch-icon')?.setAttribute('href', config.iconUrl)

  const favicon = ensureLink('icon')
  favicon?.setAttribute('href', config.hasCustomIcon ? config.iconUrl : '/favicon.svg')
  favicon?.setAttribute('type', config.hasCustomIcon ? 'image/png' : 'image/svg+xml')
}
