import type { RoomcenterMttDetailData } from '@/api/models/roomcenter'

export interface PrefetchedMttDetail {
  id: number
  sessionToken: string
  detail: RoomcenterMttDetailData
}

// 仅在 Banner 跳转和详情页首次挂载之间复用。普通入口和后续状态刷新继续走接口。
let pending: (PrefetchedMttDetail & { expiresAt: number }) | undefined

export function stageMttDetailForNavigation(match: PrefetchedMttDetail): () => void {
  const entry = { ...match, expiresAt: Date.now() + 15_000 }
  pending = entry
  return () => {
    if (pending === entry) pending = undefined
  }
}

export function takeMttDetailForNavigation(id: number, sessionToken: string) {
  const entry = pending
  pending = undefined
  if (
    entry?.id === id &&
    entry.sessionToken === sessionToken &&
    entry.expiresAt > Date.now()
  ) {
    return entry.detail
  }
}
