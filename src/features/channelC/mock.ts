import type { RoomRecord } from '@/api/models/roomcenter'

/** 联调临时开关：仅补齐新字段，不创建房间、比赛或覆盖服务端业务数据。 */
export const CHANNEL_C_FIELD_MOCK_ENABLED = true

const menuAssignments = new Map<string, number>()
const roomFields = new Map<string, Partial<RoomRecord>>()

export function resolveChannelMenu(
  club: { club_id?: unknown; h5_menu?: unknown } | null,
  random = Math.random,
): number {
  const original = Number(club?.h5_menu) || 2
  if (!CHANNEL_C_FIELD_MOCK_ENABLED || !club?.club_id || original === 3) return original
  const key = String(club.club_id)
  if (!menuAssignments.has(key)) {
    menuAssignments.set(key, random() < 0.75 ? 3 : original)
  }
  return menuAssignments.get(key)!
}

export function withChannelCRoomFields(room: RoomRecord): RoomRecord {
  if (!CHANNEL_C_FIELD_MOCK_ENABLED) return room
  const key = String(room.rid)
  if (!roomFields.has(key)) {
    const description =
      Number(room.poker_type) === 2
        ? 'UIChannelC_ShortDescription'
        : Number(room.game_type) > 0
          ? 'UIChannelC_PloDescription'
          : 'UIChannelC_NlhDescription'
    roomFields.set(key, {
      gameplay_description: Math.random() < 0.6 ? description : '',
      table_feature: Math.random() < 0.6 ? 'UIChannelC_SocialFeature' : '',
    })
  }
  const fields = roomFields.get(key)!
  return {
    ...room,
    gameplay_description: room.gameplay_description ?? fields.gameplay_description,
    table_feature: room.table_feature ?? fields.table_feature,
  }
}
