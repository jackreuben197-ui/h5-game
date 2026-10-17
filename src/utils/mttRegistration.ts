interface MttRegistrationRecord {
  mtt_buy?: unknown
}

export function isMttRegistered(record: MttRegistrationRecord): boolean {
  const value = Number(record.mtt_buy)
  return Number.isFinite(value) && value > 0
}
