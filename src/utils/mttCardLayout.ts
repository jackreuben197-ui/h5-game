export type MttCardLayout = 'sm' | 'md' | 'lg'

/** A/B 共用赛事系列卡片规则；数量不足时提升为较大的卡片。 */
export function resolveSeriesLayoutByType(seriesType: number, total: number): MttCardLayout {
  if (total <= 1) return 'lg'
  if (seriesType === 1) return 'lg'
  if (seriesType === 2) return 'md'
  if (seriesType === 3) return total === 2 ? 'md' : 'sm'
  return total <= 4 ? 'md' : 'sm'
}
