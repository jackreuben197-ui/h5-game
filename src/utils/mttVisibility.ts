import type { MttIdInfoRecord, MttListRecord, RoomRecord } from '@/api/models/roomcenter'
import { checkIsShowForClubAndTribe } from '@/utils/roomVisibility'

// 与 MttContent.filteredItems 保持同一过滤口径：排除麻将 + 按 club/tribe 可见性筛选。
// 任何「首页 MTT 统计 / MTT 列表 / 其它需要展示赛事的入口」都应走这个 helper，避免分叉。

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return 0
  }
  return Math.floor(num)
}

function normalizeRelateTribeClubList(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item) => Boolean(item) && typeof item === 'object') as Array<
    Record<string, unknown>
  >
}

export function isMttRecordVisible(
  record: MttListRecord,
  meta: MttIdInfoRecord | undefined,
  clubId: number,
  tribeId: number,
): boolean {
  // 对齐 MttContent：麻将赛事固定隐藏（暂未开放）。
  const gameType = Number(record.game_type ?? 0)
  if (gameType === 6) {
    return false
  }

  const originType = toSafeInt(meta?.origin_type ?? record.origin_type)
  const relateClubIds = Array.isArray(meta?.relate_club_ids ?? record.relate_club_ids)
    ? ((meta?.relate_club_ids ?? record.relate_club_ids) as Array<number | string>)
    : []
  const relateTribeClubList = normalizeRelateTribeClubList(
    meta?.relate_tribe_club_list ?? record.relate_tribe_club_list,
  )

  const roomLike = {
    rid: 0,
    game_type: 0,
    poker_type: 0,
    sb: 0,
    origin_type: originType,
    relate_club_ids: relateClubIds,
    relate_tribe_club_list: relateTribeClubList,
  } as RoomRecord

  return checkIsShowForClubAndTribe(roomLike, clubId, tribeId)
}

export function filterVisibleMttRecords(
  records: MttListRecord[],
  metaMap: Record<number, MttIdInfoRecord>,
  clubId: number,
  tribeId: number,
): MttListRecord[] {
  return records.filter((record) => {
    const matchId = toSafeInt(record.match_id)
    return isMttRecordVisible(record, metaMap[matchId], clubId, tribeId)
  })
}
