import type { RoomRecord, RoomUser } from '@/api/models/roomcenter'
import { formatDurationByUnity, toTimestampMs } from '@/utils/time'

export function roomDescription(room: RoomRecord): string[] {
  return [room.room_intro?.trim(), room.room_features?.trim()].filter((text): text is string =>
    Boolean(text),
  )
}

/** 与现有牌桌一致，小盲 × 2 × 最小买入 BB 倍率，结果仍为服务端金额单位。 */
export function getRoomBuyIn(room: RoomRecord): number {
  const smallBlind = Math.max(0, Number(room.sb) || 0)
  const minRate = Math.max(0, Number(room.min_rate) || 0)
  return smallBlind * 2 * minRate
}

/** 沿用现有牌桌的剩余/总时长，未开局显示完整时长，已到期固定为 0。 */
export function getRoomTimeText(room: RoomRecord, now = Date.now()): string {
  const total = Math.max(0, Math.floor(Number(room.play_duration) || 0))
  const start = toTimestampMs(room.start_time)
  const elapsed = start > 0 ? Math.max(0, Math.floor((now - start) / 1000)) : 0
  const remaining = Math.max(0, total - elapsed)
  const format = (seconds: number) => formatDurationByUnity(seconds).replace(/h(?=\d)/, 'h ')
  return `${format(remaining)}/${format(total)}`
}

// 新稿锚点：1~7 固定；8 人桌最后一位居中，9 人桌 8/9 位沿顺时针拆至底部两侧。
const FIXED_SEATS = [
  [25, 81.8],
  [9.1, 61.2],
  [25, 33.5],
  [49.7, 26],
  [75.5, 33.5],
  [90.4, 61.2],
  [75.5, 81.8],
]
const SEATS_8 = [...FIXED_SEATS, [49.7, 83.9]]
const SEATS_9 = [...FIXED_SEATS, [59.1, 83.9], [42.1, 83.9]]

export function getOccupiedSeats(
  room: RoomRecord,
): Array<{ seat: number; user: RoomUser; x: number; y: number }> {
  const users = Array.isArray(room.users) ? room.users : []
  // 以桌位上限决定布局，9 人桌即使暂时无人坐 9 号位也保持拥挤布局。
  const isNineSeatTable =
    Number(room.seat_count) >= 9 || users.some((user) => Number(user.seat) === 9)
  const positions = isNineSeatTable ? SEATS_9 : SEATS_8
  const seen = new Set<number>()
  return users
    .flatMap((user) => {
      const seat = Number(user.seat)
      if (!Number.isInteger(seat) || seat < 1 || seat > positions.length || seen.has(seat))
        return []
      seen.add(seat)
      const [x, y] = positions[seat - 1]!
      return [{ seat, user, x: x!, y: y! }]
    })
    .sort((a, b) => a.seat - b.seat)
}
