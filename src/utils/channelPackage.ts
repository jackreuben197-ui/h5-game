const CHANNEL_MAIN_DOMAIN = (
  import.meta.env.VITE_CHANNEL_MAIN_DOMAIN || ''
).trim().toLowerCase()

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

function readParam(searchParams: URLSearchParams, hashParams: URLSearchParams, key: string): string {
  const fromSearch = readString(searchParams.get(key))
  if (fromSearch) {
    return fromSearch
  }
  return readString(hashParams.get(key))
}

export function isChannelPackageHost(hostname: string = window.location.hostname): boolean {
  const normalizedHost = readString(hostname).toLowerCase()
  if (!normalizedHost) {
    return false
  }

  return (
    normalizedHost !== CHANNEL_MAIN_DOMAIN && normalizedHost.endsWith(`.${CHANNEL_MAIN_DOMAIN}`)
  )
}

export function extractInviteCodeFromSubdomain(hostname: string = window.location.hostname): string {
  const normalizedHost = readString(hostname).toLowerCase()
  if (!isChannelPackageHost(normalizedHost)) {
    return ''
  }

  const suffix = `.${CHANNEL_MAIN_DOMAIN}`
  const withoutSuffix = normalizedHost.slice(0, -suffix.length)
  const firstLabel = withoutSuffix.split('.')[0] || ''
  return readString(firstLabel)
}

export function parseInviteParamsFromLocation(url: URL = new URL(window.location.href)): ParsedQueryParams {
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
  const parsed = parseInviteParamsFromLocation()
  if (parsed.inviteCode) {
    return parsed.inviteCode
  }

  return extractInviteCodeFromSubdomain(hostname)
}

export function resolveTraceHash(): string {
  return parseInviteParamsFromLocation().traceHash
}

export function shouldOpenRegisterMode(): boolean {
  return parseInviteParamsFromLocation().mode === 'register'
}

export function buildChannelClubInviteUrl(): string {
  const currentUrl = new URL(window.location.href)
  return `${currentUrl.origin}`
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
  if (inviteCode) {
    nextParams.set('invite_code', inviteCode)
  }

  const traceHash = readString(options?.traceHash)
  if (traceHash) {
    nextParams.set('trace_hash', traceHash)
  }

  return `${currentUrl.origin}${currentUrl.pathname}#/login?${nextParams.toString()}`
}
