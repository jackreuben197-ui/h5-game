export type HomeContentMode = 'zones' | 'mtt' | 'poker'

interface HomeContentModeContext {
  sessionKey: string
  isChannelPackage: boolean
  clubId: number
  tribeId: number
  displayPlatformMtt: boolean
  displayPlatformDiamond: boolean | undefined
  isChannelMenuVersionB: boolean
}

// 只保留在当前 SPA 生命周期内：页面刷新后必须重新确认 CMS 配置，不能复用旧展示结果。
const memoryCache = new Map<string, HomeContentMode>()

export function buildHomeContentModeCacheKey(context: HomeContentModeContext): string {
  return JSON.stringify([
    context.sessionKey,
    context.isChannelPackage,
    context.clubId,
    context.tribeId,
    context.displayPlatformMtt,
    context.displayPlatformDiamond ?? null,
    context.isChannelMenuVersionB,
  ])
}

export function getHomeContentModeCache(key: string): HomeContentMode | null {
  return memoryCache.get(key) ?? null
}

export function setHomeContentModeCache(key: string, mode: HomeContentMode): void {
  memoryCache.set(key, mode)
}
