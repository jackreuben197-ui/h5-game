import type { MttListRecord, MttSeriesInfoRecord, RoomRecord } from '@/api/models/roomcenter'
import { getPokerKind, matchesMttFilter, type MttFilter, type PokerFilter } from './model'

export interface ChannelCFilterOption<T extends string | number> {
  value: T
  label: string
}

export function toggleFilterValue<T>(selected: readonly T[], value: T): T[] {
  return selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]
}

/** 小盲金额沿用服务端的百分之一单位；从完整可见列表取值，不随已选玩法消失。 */
export function getRoomBlindOptions(rooms: readonly RoomRecord[]): number[] {
  return [
    ...new Set(rooms.map((room) => Number(room.sb)).filter((sb) => Number.isFinite(sb) && sb > 0)),
  ].sort((a, b) => a - b)
}

export function formatRoomBlind(sb: number): string {
  return `${Number((sb / 100).toFixed(8))}/${Number((sb / 50).toFixed(8))}`
}

/** 沿用后台 mtt_series_list 配置，不按当前比赛数量裁剪配置项。 */
export function getTournamentTypeOptions(
  series: readonly MttSeriesInfoRecord[],
): ChannelCFilterOption<number>[] {
  const seen = new Set<number>()
  return series.flatMap((item) => {
    const value = Number(item.id)
    if (!Number.isInteger(value) || value <= 0 || seen.has(value)) return []
    seen.add(value)
    return [{ value, label: item.name?.trim() || String(value) }]
  })
}

export function matchesPokerFilters(
  room: RoomRecord,
  kinds: readonly PokerFilter[],
  blinds: readonly number[],
): boolean {
  return (
    (!kinds.length || kinds.includes(getPokerKind(room))) &&
    (!blinds.length || blinds.includes(Number(room.sb)))
  )
}

export function matchesTournamentFilters(
  match: MttListRecord,
  types: readonly number[],
  categories: readonly MttFilter[],
): boolean {
  return (
    (!types.length || types.includes(Number(match.series_id))) &&
    (!categories.length || categories.some((category) => matchesMttFilter(match, category)))
  )
}
