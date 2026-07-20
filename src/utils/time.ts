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

    // 接口时间字段也可能以字符串形式返回秒/毫秒时间戳。
    if (/^\d+(?:\.\d+)?$/.test(text)) {
      const numeric = Number(text)
      if (!Number.isFinite(numeric) || numeric <= 0) return 0
      return numeric < 1e12 ? Math.floor(numeric * 1000) : Math.floor(numeric)
    }

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

// 对齐 Unity 房间时长显示规则：>=3600 显示 h/m，>=60 显示 m，其余显示 s。
export function formatDurationByUnity(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.trunc(totalSeconds) : 0
  if (safeSeconds >= 3600) {
    const hour = Math.trunc(safeSeconds / 3600)
    const minute = Math.trunc((safeSeconds % 3600) / 60)
    if (minute > 0) {
      return `${hour}h${minute}m`
    }
    return `${hour}h`
  }
  if (safeSeconds >= 60) {
    return `${Math.trunc(safeSeconds / 60)}m`
  }
  return `${safeSeconds}s`
}

// 对齐 Unity ShowRemainingTimer(showSeconds=false)：按 天/时/分/秒 单位词格式化时长。
// units 传入形如 ['天','小时','分钟','秒'] 的单位数组（i18n key UIMatch_itemTime 按 ^ 分隔）。
export function formatDurationWithUnits(totalSeconds: number, units: string[]): string {
  const [dayUnit = 'd', hourUnit = 'h', minuteUnit = 'm', secondUnit = 's'] = units
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.trunc(totalSeconds)) : 0
  const days = Math.trunc(safeSeconds / 86400)
  const hours = Math.trunc((safeSeconds % 86400) / 3600)
  const minutes = Math.trunc((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (safeSeconds >= 86400) {
    return `${days}${dayUnit}${hours}${hourUnit}${minutes}${minuteUnit}`
  }
  if (safeSeconds >= 3600) {
    return minutes === 0
      ? `${hours}${hourUnit}`
      : `${hours}${hourUnit}${minutes}${minuteUnit}`
  }
  if (safeSeconds >= 60) {
    return `${minutes}${minuteUnit}`
  }
  return `${seconds}${secondUnit}`
}

// 统一输出“剩余时长/总时长”。
export function formatRoomLeftAndTotalByUnity(startTime: unknown, totalSeconds: number): string {
  const safeTotal = Number.isFinite(totalSeconds) ? Math.max(0, Math.trunc(totalSeconds)) : 0
  const startSeconds = toUnixSeconds(startTime)
  let leftSeconds = safeTotal

  if (startSeconds > 0) {
    leftSeconds = Math.max(0, startSeconds + safeTotal - Math.floor(Date.now() / 1000))
  }

  return `${formatDurationByUnity(leftSeconds)}/${formatDurationByUnity(safeTotal)}`
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

// 取某一天的 00:00:00.000。
export function startOfDay(value: unknown): Date {
  const timestampMs = toTimestampMs(value)
  const base = timestampMs > 0 ? dayjs(timestampMs) : dayjs()
  return base.startOf('day').toDate()
}

// 取某一天的 23:59:59.999。
export function endOfDay(value: unknown): Date {
  const timestampMs = toTimestampMs(value)
  const base = timestampMs > 0 ? dayjs(timestampMs) : dayjs()
  return base.endOf('day').toDate()
}

// 在给定时间上偏移 N 个月（可为负）。
export function addMonths(value: unknown, months: number): Date {
  const timestampMs = toTimestampMs(value)
  const base = timestampMs > 0 ? dayjs(timestampMs) : dayjs()
  return base.add(months, 'month').toDate()
}

// 在给定时间上偏移 N 天（可为负）。
export function addDays(value: unknown, days: number): Date {
  const timestampMs = toTimestampMs(value)
  const base = timestampMs > 0 ? dayjs(timestampMs) : dayjs()
  return base.add(days, 'day').toDate()
}

// 取本地日期 YYYY-MM-DD，常用于按“自然日”做唯一标记。
export function getLocalDateKey(value: unknown = Date.now()): string {
  const timestampMs = toTimestampMs(value)
  const date = timestampMs > 0 ? new Date(timestampMs) : new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
