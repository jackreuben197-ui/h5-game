export interface DiamondPriceConfig {
  raw_price: number
  pay_price: number
  discount: number
  start_date: string
  end_date: string
  start_time: number
  end_time: number
  status: number
}

export interface DiamondPriceValue {
  original: number
  current: number
  activeDiscount: boolean
  config: DiamondPriceConfig | null
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function toSafeConfig(raw: Record<string, unknown>): DiamondPriceConfig {
  return {
    raw_price: toFiniteNumber(raw.raw_price, 0),
    pay_price: toFiniteNumber(raw.pay_price, 0),
    discount: toFiniteNumber(raw.discount, 0),
    start_date: typeof raw.start_date === 'string' ? raw.start_date : '',
    end_date: typeof raw.end_date === 'string' ? raw.end_date : '',
    start_time: toFiniteNumber(raw.start_time, 0),
    end_time: toFiniteNumber(raw.end_time, 0),
    status: toFiniteNumber(raw.status, 0),
  }
}

export function parseDiamondPriceConfig(rawJson: unknown): DiamondPriceConfig | null {
  if (!rawJson || typeof rawJson !== 'string') {
    return null
  }

  try {
    const parsed = JSON.parse(rawJson)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }
    return toSafeConfig(parsed as Record<string, unknown>)
  } catch {
    return null
  }
}

export function resolveDiamondPriceValue(
  rawJson: unknown,
  defaults: { original: number; current: number },
  nowSeconds = Math.floor(Date.now() / 1000),
): DiamondPriceValue {
  const config = parseDiamondPriceConfig(rawJson)
  if (!config) {
    return {
      original: defaults.original,
      current: defaults.current,
      activeDiscount: false,
      config: null,
    }
  }

  const inPeriod =
    config.start_time > 0 &&
    config.end_time > 0 &&
    nowSeconds >= config.start_time &&
    nowSeconds <= config.end_time

  return {
    original: config.raw_price,
    current: inPeriod ? config.pay_price : config.raw_price,
    activeDiscount: inPeriod,
    config,
  }
}
