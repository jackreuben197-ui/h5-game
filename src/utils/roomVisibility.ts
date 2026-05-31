import type { RoomRecord } from '@/api/models/roomcenter'

// 与 C# RoomOriginType 对齐：1 平台，2 联盟，3 俱乐部，4 朋友桌。
export const ROOM_ORIGIN_TYPE = {
  PLATFORM: 1,
  UNION: 2,
  CLUB: 3,
  FRIEND: 4,
} as const

interface RoomTribeClubRelateItem {
  tribe_id?: number | string
  tribeId?: number | string
  club_ids?: Array<number | string>
  clubIds?: Array<number | string>
  [key: string]: unknown
}

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return 0
  }
  return Math.floor(num)
}

function toNumberList(list: unknown): number[] {
  if (!Array.isArray(list)) {
    return []
  }
  return list.map((item) => toSafeInt(item)).filter((item) => Number.isFinite(item))
}

function getOriginType(room: RoomRecord): number {
  return toSafeInt(room.origin_type)
}

function getRelateClubIds(room: RoomRecord): number[] {
  return toNumberList(room.relate_club_ids)
}

function getRelateTribeClubList(room: RoomRecord): RoomTribeClubRelateItem[] {
  const raw = room.relate_tribe_club_list
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.filter(
    (item) => Boolean(item) && typeof item === 'object',
  ) as RoomTribeClubRelateItem[]
}

function getTribeId(item: RoomTribeClubRelateItem): number {
  return toSafeInt(item.tribe_id ?? item.tribeId)
}

function getClubIds(item: RoomTribeClubRelateItem): number[] {
  return toNumberList(item.club_ids ?? item.clubIds)
}

// C# CheckIsShowForClub：origin_type=CLUB 且 relate_club_ids 包含 0 或当前 clubId。
export function checkIsShowForClub(room: RoomRecord, clubId: number): boolean {
  const originType = getOriginType(room)
  if (originType !== ROOM_ORIGIN_TYPE.CLUB) {
    return false
  }

  const relateClubIds = getRelateClubIds(room)
  if (!relateClubIds.length) {
    return false
  }

  return relateClubIds.includes(0) || relateClubIds.includes(clubId)
}

// C# CheckIsShowForTribe：origin_type=UNION 且 relate_tribe_club_list 匹配 tribeId。
export function checkIsShowForTribe(room: RoomRecord, tribeId: number): boolean {
  const originType = getOriginType(room)
  if (originType !== ROOM_ORIGIN_TYPE.UNION) {
    return false
  }

  const relateList = getRelateTribeClubList(room)
  for (let i = 0; i < relateList.length; i += 1) {
    const relate = relateList[i]
    const relateTribeId = getTribeId(relate)
    if (relateTribeId === 0 || relateTribeId === tribeId) {
      return true
    }
  }

  return false
}

// C# CheckIsShowForClubAndTribe：俱乐部桌 + 联盟桌（联盟还需 club_id 命中）。
export function checkIsShowForClubAndTribe(
  room: RoomRecord,
  clubId: number,
  tribeId: number,
): boolean {
  // H5 兼容：未选中俱乐部时不做俱乐部筛选，避免页面空白。
  if (clubId <= 0) {
    return true
  }

  if (checkIsShowForClub(room, clubId)) {
    return true
  }

  if (tribeId <= 0) {
    return false
  }

  const originType = getOriginType(room)
  if (originType !== ROOM_ORIGIN_TYPE.UNION) {
    // 兼容旧接口字段缺失 origin_type 的情况，保留原有展示行为。
    return originType <= 0
  }

  const relateList = getRelateTribeClubList(room)
  if (!relateList.length) {
    return false
  }

  for (let i = 0; i < relateList.length; i += 1) {
    const relate = relateList[i]
    const relateTribeId = getTribeId(relate)
    const clubIds = getClubIds(relate)

    if (relateTribeId === 0) {
      if (clubIds.includes(0) || clubIds.includes(clubId)) {
        return true
      }
      continue
    }

    if (relateTribeId !== tribeId) {
      continue
    }

    if (!clubIds.length || clubIds.includes(0) || clubIds.includes(clubId)) {
      return true
    }
  }

  return false
}

export function formatUC(rawValue: number): string {
  const displayValue = rawValue / 100
  if (!Number.isFinite(displayValue)) {
    return '0'
  }

  // 对齐 C# 的 "0.##"：最多保留 2 位小数并去掉尾随 0。
  return displayValue.toFixed(2).replace(/\.?0+$/, '')
}
