import type { MttListRecord, RoomCenterUserMatchListContrastMttInfo } from '@/api/models/roomcenter'

/** 同一分页可能同时包含完整记录和增量，清空值需要覆盖已缓存的配置。 */
export function mergeMttListPage(
  full: readonly MttListRecord[],
  changes: readonly RoomCenterUserMatchListContrastMttInfo[],
  cached: readonly MttListRecord[],
): MttListRecord[] {
  const page = new Map(full.map((record) => [Number(record.match_id), record]))
  for (const change of changes) {
    const id = Number(change.match_id)
    const previous = page.get(id) ?? cached.find((record) => Number(record.match_id) === id)
    if (previous) {
      const fields = Object.fromEntries(
        Object.entries(change).filter(([, value]) => value !== undefined),
      )
      page.set(id, { ...previous, ...fields })
    }
  }
  return [...page.values()]
}

/** 请求发出后收到的推送或报名结果优先于旧 HTTP 快照，包括新增和移除。 */
export function reconcileMttListResponse(
  incoming: readonly MttListRecord[],
  requested: readonly MttListRecord[],
  current: readonly MttListRecord[],
): MttListRecord[] {
  const requestedById = new Map(requested.map((record) => [Number(record.match_id), record]))
  const currentById = new Map(current.map((record) => [Number(record.match_id), record]))
  const result = new Map<number, MttListRecord>()
  for (const record of incoming) {
    const id = Number(record.match_id)
    const previous = requestedById.get(id)
    const latest = currentById.get(id)
    if (previous && !latest) continue
    result.set(id, latest && latest !== previous ? latest : record)
  }
  for (const record of current) {
    const id = Number(record.match_id)
    if (!result.has(id) && record !== requestedById.get(id)) result.set(id, record)
  }
  return [...result.values()]
}
