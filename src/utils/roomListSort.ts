import type { RoomRecord } from '@/api/models/roomcenter'
import { toTimestampMs } from '@/utils/time'

// 牌桌列表统一排序（需求 21）：
// 参与过的未满桌 > 其他未满桌 > 参与过的满桌 > 其他满桌；
// 同一优先级内按创建时间倒序（最新创建的在前）。
// store 内存列表与 IndexedDB 缓存（scope.rids 顺序）都走这套口径。

function toSafeInt(value: unknown, fallback = 0): number {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return fallback
  }
  return Math.floor(num)
}

export function isRoomParticipated(room: RoomRecord): boolean {
  return toSafeInt(room.participation_status) === 1
}

export function isRoomFull(room: RoomRecord): boolean {
  // 优先 seat_count/empty_seat（empty_seat=0 即满员）；缺失时退回 roomers/users 对比总座位。
  const seatCount = toSafeInt(room.seat_count)
  const emptySeat = toSafeInt(room.empty_seat, -1)
  if (seatCount > 0 && emptySeat >= 0) {
    return emptySeat === 0
  }

  const total = seatCount > 0 ? seatCount : 9
  const roomers = toSafeInt(room.roomers)
  const usersLength = Array.isArray(room.users) ? room.users.length : 0
  return (roomers || usersLength) >= total
}

function getRoomCreateTimestamp(room: RoomRecord): number {
  const createTs = toTimestampMs(room.create_time)
  if (createTs > 0) {
    return createTs
  }
  // 部分来源（旧缓存等）可能缺 create_time，退回 start_time。
  return toTimestampMs(room.start_time)
}

function getRoomSortPriority(room: RoomRecord): number {
  const fullRank = isRoomFull(room) ? 2 : 0
  const participatedRank = isRoomParticipated(room) ? 0 : 1
  return fullRank + participatedRank
}

export function compareRoomRecordsForDisplay(a: RoomRecord, b: RoomRecord): number {
  const priorityDiff = getRoomSortPriority(a) - getRoomSortPriority(b)
  if (priorityDiff !== 0) {
    return priorityDiff
  }

  const timeDiff = getRoomCreateTimestamp(b) - getRoomCreateTimestamp(a)
  if (timeDiff !== 0) {
    return timeDiff
  }

  // rid 自增，倒序等价于创建顺序倒序，兜底时间字段缺失的情况。
  return toSafeInt(b.rid) - toSafeInt(a.rid)
}

export function sortRoomRecordsForDisplay<T extends RoomRecord>(records: T[]): T[] {
  return [...records].sort(compareRoomRecordsForDisplay)
}
