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
