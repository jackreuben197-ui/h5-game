// Dependency-free reader for the Telegram Mini App start_param and the club invite
// code it may carry. Kept free of store / router / api imports so that both the
// low-level channel-package util (resolveInviteCode) and the deep-link dispatcher can
// use it without creating an import cycle.
//
// The Telegram Mini App is the exact analogue of a channel-package invite link: the
// club's invite code lives in the start_param instead of the `<code>.<domain>`
// subdomain. Feeding it through resolveInviteCode() lets the identical enrollment path
// (invite_code on login + /org/club/default preview) run inside Telegram unchanged.
//
// Accepted start_param forms (Telegram allows only A-Z a-z 0-9 _ -):
//   club_<inviteCode>              → pure "join this club" link (spec 2.2 main channel)
//   <inviteCode>                   → bare code (no action prefix, no underscore)
// The game links login_<roomId>_<clubRandomId> / home_<roomId>_<clubRandomId> carry a club
// *random id* (numeric), which is enrolled via the auto-join flow in telegramDeepLink — it is
// NOT a login invite_code, so it is intentionally not returned here.

const CLUB_PREFIX = 'club_'
const CODE_PATTERN = /^[A-Za-z0-9-]+$/

// Read a query param from both location.search and the hash. With a hash router the
// param may live before the `#` (search), after a `?` in the hash, or directly after
// the `#` (Telegram appends `#tgWebAppData=...&tgWebAppStartParam=...` with no `?`).
function readUrlQueryParam(name: string): string {
  try {
    const fromSearch = new URLSearchParams(window.location.search || '').get(name)
    if (fromSearch && fromSearch.trim()) {
      return fromSearch.trim()
    }

    const hash = window.location.hash || ''
    const queryIndex = hash.indexOf('?')
    if (queryIndex >= 0) {
      const fromHash = new URLSearchParams(hash.slice(queryIndex + 1)).get(name)
      if (fromHash && fromHash.trim()) {
        return fromHash.trim()
      }
    }

    const hashRaw = hash.replace(/^#\/?/, '')
    const fromHashDirect = new URLSearchParams(hashRaw).get(name)
    if (fromHashDirect && fromHashDirect.trim()) {
      return fromHashDirect.trim()
    }
  } catch {
    // malformed URL — ignore
  }
  return ''
}

// Raw start_param in priority order: Telegram SDK's parsed value, then the URL query
// param (tgWebAppStartParam / startapp), then the raw initData string.
export function readTelegramStartParam(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const unsafe = window.Telegram?.WebApp?.initDataUnsafe?.start_param
  if (typeof unsafe === 'string' && unsafe.trim()) {
    return unsafe.trim()
  }

  const fromUrl = readUrlQueryParam('tgWebAppStartParam') || readUrlQueryParam('startapp')
  if (fromUrl) {
    return fromUrl
  }

  const initData = String(window.__H5_TG_INIT_DATA__ || window.Telegram?.WebApp?.initData || '').trim()
  if (initData) {
    try {
      const fromInitData = new URLSearchParams(initData).get('start_param')
      if (fromInitData && fromInitData.trim()) {
        return fromInitData.trim()
      }
    } catch {
      // malformed initData — ignore
    }
  }

  return ''
}

// True inside a Telegram Mini App (globals set by index.html, or the injected SDK).
export function isTelegramMiniAppEnv(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return Boolean(window.__H5_TG_MINI_APP__ || window.Telegram?.WebApp)
}

// The club random id carried in a room-action start_param
// (login_<roomId>_<clubRandomId> / home_<roomId>_<clubRandomId>). '' when absent.
export function resolveTelegramClubRandomId(): string {
  const raw = readTelegramStartParam()
  if (!raw) {
    return ''
  }
  const parts = raw.split('_')
  if ((parts[0] === 'login' || parts[0] === 'home') && /^\d+$/.test(parts[2] || '')) {
    return parts[2]
  }
  return ''
}

// Extract the club invite code from the start_param, or '' when there is none.
export function resolveTelegramClubInviteCode(): string {
  const raw = readTelegramStartParam()
  if (!raw) {
    return ''
  }

  // Standalone "join this club" link (spec 2.2): club_<inviteCode>.
  if (raw.startsWith(CLUB_PREFIX)) {
    const code = raw.slice(CLUB_PREFIX.length).trim()
    return CODE_PATTERN.test(code) ? code : ''
  }

  // Bare invite code: no action prefix, no underscore.
  if (!raw.includes('_') && CODE_PATTERN.test(raw)) {
    return raw
  }

  // Room-action links (login_/home_) carry a club random id enrolled via auto-join, not an
  // invite_code — so nothing to return here.
  return ''
}
