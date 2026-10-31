import type { MttListRecord, MttSeriesInfoRecord, RoomRecord } from '@/api/models/roomcenter'
import {
  buildChannelCFeed,
  interleaveChannelCCards,
  type LobbyCard,
} from '@/features/channelC/model'

function normalize(value: string): string {
  return value.trim().normalize('NFKC').toLowerCase()
}

/** 搜索完整可见列表；热门标记不限制结果，尺寸仍使用原赛事系列的配置。 */
export function buildChannelCSearchFeed(
  rooms: RoomRecord[],
  matches: MttListRecord[],
  query: string,
  series: readonly MttSeriesInfoRecord[] = [],
  now = Date.now(),
  resolveName: (name: string, kind: LobbyCard['kind']) => string = (name) => name,
): LobbyCard[] {
  const word = normalize(query)
  if (!word) return []
  const cards = buildChannelCFeed(rooms, matches, 'search', now, series).filter((card) => {
    if (card.kind === 'game') return false
    const id = String(card.kind === 'poker' ? card.room.rid : (card.match.match_id ?? ''))
    const name =
      card.kind === 'poker'
        ? card.room.name || 'UITexasReport_Label_AllBarPZ'
        : card.match.name || `MTT #${id}`
    const localizedName = resolveName(name, card.kind) || name
    // MTT 名称按卡片当前语言展示的文案匹配，不把模板标识作为比赛名搜索。
    const values = card.kind === 'mtt' ? [id, localizedName] : [id, name, localizedName]
    return values.some((value) => normalize(value).includes(word))
  })
  return interleaveChannelCCards(
    cards.filter((card) => card.kind === 'poker'),
    cards.filter((card) => card.kind === 'mtt'),
  )
}
