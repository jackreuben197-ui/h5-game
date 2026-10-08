import type { OrgClubSearchInfoData } from '@/api/models/org'
import { isIos } from '@/utils/iosWebClip'
import { isClubLinkContext } from '@/utils/channelPackage'
import nexGameIcon from '@/assets/icons/NEX-GAME.png'
import officialLogoIcon from '@/assets/icons/Official_web_logo.jpeg'

export const DEFAULT_CLUB_NAME = 'NEW-GAME'
export const DEFAULT_CLUB_ICON = nexGameIcon || '/icons/NEX-GAME.png'
export const OFFICIAL_WEB_NAME = '派对德州'
export const OFFICIAL_WEB_ICON = officialLogoIcon || '/icons/Official_web_logo.jpeg'

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

export function applySafariWebAppConfig(club?: OrgClubSearchInfoData | null): void {
  if (typeof document === 'undefined') {
    return
  }

  const isClub = isClubLinkContext()

  if (isClub) {
    const raw = (club || {}) as Record<string, unknown>
    const customLabel =
      normalizedText(club?.safari_label) ||
      normalizedText(raw.safari_name) ||
      normalizedText(raw.safari_title) ||
      normalizedText(raw.desktop_name) ||
      normalizedText(raw.app_name) ||
      normalizedText(raw.app_title)

    const label = customLabel || DEFAULT_CLUB_NAME

    const customIcon =
      normalizedHttpUrl(club?.safari_icon_url) ||
      normalizedHttpUrl(raw.safari_icon) ||
      normalizedHttpUrl(raw.desktop_icon) ||
      normalizedHttpUrl(raw.app_icon) ||
      normalizedHttpUrl(club?.logo)

    const iconUrl = customIcon || DEFAULT_CLUB_ICON

    document.title = label
    ensureMeta('apple-mobile-web-app-title')?.setAttribute('content', label)
    ensureMeta('application-name')?.setAttribute('content', label)

    const touchIcon = ensureLink('apple-touch-icon')
    touchIcon?.setAttribute('href', iconUrl)

    const favicon = ensureLink('icon')
    favicon?.setAttribute('href', iconUrl)
    favicon?.setAttribute(
      'type',
      iconUrl.endsWith('.jpeg') || iconUrl.endsWith('.jpg') ? 'image/jpeg' : 'image/png',
    )

    try {
      window.localStorage.setItem('dzpk_h5_safari_label', label)
      window.localStorage.setItem('dzpk_h5_safari_icon', iconUrl)
    } catch {}

    updateWebManifest(label, iconUrl, true)
  } else {
    document.title = OFFICIAL_WEB_NAME
    ensureMeta('apple-mobile-web-app-title')?.setAttribute('content', OFFICIAL_WEB_NAME)
    ensureMeta('application-name')?.setAttribute('content', OFFICIAL_WEB_NAME)

    const touchIcon = ensureLink('apple-touch-icon')
    touchIcon?.setAttribute('href', OFFICIAL_WEB_ICON)

    const favicon = ensureLink('icon')
    favicon?.setAttribute('href', OFFICIAL_WEB_ICON)
    favicon?.setAttribute('type', 'image/jpeg')

    try {
      window.localStorage.removeItem('dzpk_h5_safari_label')
      window.localStorage.removeItem('dzpk_h5_safari_icon')
    } catch {}

    updateWebManifest(OFFICIAL_WEB_NAME, OFFICIAL_WEB_ICON, false)
  }
}

function updateWebManifest(label: string, iconUrl: string, isClub: boolean): void {
  if (typeof document === 'undefined') return

  let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')

  if (!isClub) {
    if (manifestLink) {
      manifestLink.setAttribute('href', '/manifest.webmanifest')
    }
    return
  }

  if (isIos()) {
    if (manifestLink) {
      manifestLink.remove()
    }
    return
  }

  const iconType =
    iconUrl.endsWith('.jpeg') || iconUrl.endsWith('.jpg') ? 'image/jpeg' : 'image/png'

  const manifestData = {
    name: label,
    short_name: label,
    start_url: window.location.href,
    display: 'standalone',
    background_color: '#222627',
    theme_color: '#222627',
    icons: [
      {
        src: iconUrl,
        sizes: '192x192 512x512',
        type: iconType,
        purpose: 'any maskable',
      },
    ],
  }

  const dataUrl =
    'data:application/manifest+json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(manifestData))

  if (manifestLink) {
    manifestLink.setAttribute('href', dataUrl)
  } else {
    const link = document.createElement('link')
    link.rel = 'manifest'
    link.href = dataUrl
    document.head.appendChild(link)
  }
}
