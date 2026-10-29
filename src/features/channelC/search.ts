import type { MttListRecord, MttSeriesInfoRecord, RoomRecord } from '@/api/models/roomcenter'
import {
  buildChannelCFeed,
  interleaveChannelCCards,
  type LobbyCard,
} from '@/features/channelC/model'

function normalize(value: string): string {
  return value.trim().normalize('NFKC').toLowerCase()
}

/** 搜索完整可见列表；热门标记不限制结果，尺寸仍取原赛事系列的完整场次数。 */
export function buildChannelCSearchFeed(
  rooms: RoomRecord[],
  matches: MttListRecord[],
  query: string,
  series: readonly MttSeriesInfoRecord[] = [],
  now = Date.now(),
  resolveName: (name: string) => string = (name) => name,
): LobbyCard[] {
  const word = normalize(query)
  if (!word) return []
  const cards = buildChannelCFeed(rooms, matches, 'search', now, series).filter((card) => {
    const id = String(card.kind === 'poker' ? card.room.rid : (card.match.match_id ?? ''))
    const name =
      card.kind === 'poker'
        ? card.room.name || 'UITexasReport_Label_AllBarPZ'
        : card.match.name || `MTT #${id}`
    return [id, name, resolveName(name)].some((value) => normalize(value).includes(word))
  })
  return interleaveChannelCCards(
    cards.filter((card) => card.kind === 'poker'),
    cards.filter((card) => card.kind === 'mtt'),
  )
}
