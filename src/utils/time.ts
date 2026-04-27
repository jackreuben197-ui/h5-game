import dayjs from 'dayjs'

// 统一把时间值转毫秒时间戳，兼容 number/string/Date。
export function toTimestampMs(value: unknown): number {
  if (value instanceof Date) {
    const dateTs = value.getTime()
    return Number.isFinite(dateTs) && dateTs > 0 ? dateTs : 0
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return 0
    // 小于 1e12 视作秒级时间戳，自动补齐到毫秒。
    return value < 1e12 ? Math.floor(value * 1000) : Math.floor(value)
  }

  if (typeof value === 'string') {
    const text = value.trim()
    if (!text) return 0
    const parsed = Date.parse(text)
    if (Number.isNaN(parsed) || parsed <= 0) return 0
    return parsed
  }

  return 0
}

// 毫秒时间戳转秒级时间戳（向下取整）。
export function toUnixSeconds(value: unknown): number {
  const timestampMs = toTimestampMs(value)
  if (timestampMs <= 0) return 0
  return Math.floor(timestampMs / 1000)
}

// 格式化日期时间字符串，默认输出月日时分。
export function formatDateTime(value: unknown, pattern = 'MM-DD HH:mm'): string {
  const timestampMs = toTimestampMs(value)
  if (timestampMs <= 0) return '--:--'
  return dayjs(timestampMs).format(pattern)
}

// 秒数转倒计时文案：优先 HH:mm:ss，不足 1 小时时 mm:ss。
export function formatDurationBySeconds(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (hours > 0) {
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
  }
  return `${pad2(minutes)}:${pad2(seconds)}`
}

// 补齐两位数字。
export function pad2(num: number): string {
  return String(Math.max(0, Math.floor(num))).padStart(2, '0')
}

// 判断目标时间是否处于“当前这一天”的 00:00:00 ~ 23:59:59.999 区间内。
export function isTodayBeforeEnd(targetTimestampMs: number, nowTimestampMs: number): boolean {
  if (targetTimestampMs <= 0 || nowTimestampMs <= 0) {
    return false
  }
  const nowDate = new Date(nowTimestampMs)
  const dayStart = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate(),
    0,
    0,
    0,
    0,
  ).getTime()
  const dayEnd = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate(),
    23,
    59,
    59,
    999,
  ).getTime()
  return targetTimestampMs >= dayStart && targetTimestampMs <= dayEnd
}

// 按“今日优先”规则格式化时间：
// 1) 若目标时间在当天结束前，返回“今日 HH:mm”；
// 2) 否则返回“MM-DD HH:mm”。
export function formatTodayAwareTimeLabel(
  targetTimestampMs: number,
  nowTimestampMs: number,
  todayPrefix = '今日',
): string {
  const hm = safeHm(targetTimestampMs)
  if (!hm) {
    return '--:--'
  }
  if (isTodayBeforeEnd(targetTimestampMs, nowTimestampMs)) {
    return `${todayPrefix} ${hm}`
  }
  return formatDateTime(targetTimestampMs, 'MM-DD HH:mm')
}

// 格式化到时分，非法时间返回空字符串。
export function safeHm(timestampMs: number): string {
  const text = formatDateTime(timestampMs, 'HH:mm')
  return text === '--:--' ? '' : text
}
