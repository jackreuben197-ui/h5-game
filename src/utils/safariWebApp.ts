import type { OrgClubSearchInfoData } from '@/api/models/org'

function normalizedText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizedHttpUrl(value: unknown): string {
  const raw = normalizedText(value)
  if (!raw || typeof window === 'undefined') {
    return ''
  }

  try {
    const url = new URL(raw, window.location.href)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

function ensureMeta(name: string): HTMLMetaElement | null {
  if (typeof document === 'undefined') {
    return null
  }

  const existing = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (existing) {
    return existing
  }

  const meta = document.createElement('meta')
  meta.name = name
  document.head.appendChild(meta)
  return meta
}

function ensureLink(rel: string): HTMLLinkElement | null {
  if (typeof document === 'undefined') {
    return null
  }

  const existing = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (existing) {
    return existing
  }

  const link = document.createElement('link')
  link.rel = rel
  document.head.appendChild(link)
  return link
}

/**
 * 将俱乐部 CMS 中的 Safari 配置同步到当前文档。
 * apple-touch-icon 的优先级高于 manifest 图标，适合按域名异步加载配置的场景。
 */
export function applySafariWebAppConfig(club: OrgClubSearchInfoData | null | undefined): void {
  if (!club || typeof document === 'undefined') {
    return
  }

  const raw = club as Record<string, unknown>
  const label =
    normalizedText(club.safari_label) ||
    normalizedText(raw.safari_name) ||
    normalizedText(raw.safari_title) ||
    normalizedText(raw.desktop_name) ||
    normalizedText(raw.app_name) ||
    normalizedText(club.club_name)

  if (label) {
    document.title = label
    ensureMeta('apple-mobile-web-app-title')?.setAttribute('content', label)
    ensureMeta('application-name')?.setAttribute('content', label)
  }

  const iconUrl =
    normalizedHttpUrl(club.safari_icon_url) ||
    normalizedHttpUrl(raw.safari_icon) ||
    normalizedHttpUrl(club.logo)

  if (iconUrl) {
    const touchIcon = ensureLink('apple-touch-icon')
    touchIcon?.setAttribute('href', iconUrl)

    const favicon = ensureLink('icon')
    favicon?.setAttribute('href', iconUrl)
    favicon?.setAttribute('type', 'image/png')
  }

  // 移除可能存在的 manifest 引用，避免 iOS 17+ Safari 强制以静态 manifest 里的固定名称覆盖俱乐部自定义桌面名称
  const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (manifestLink) {
    manifestLink.remove()
  }
}
