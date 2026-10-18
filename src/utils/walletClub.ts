export interface WalletClubLike {
  club_id?: unknown
  user_gold?: unknown
}

function normalizeClubId(value: unknown): string {
  if (Array.isArray(value)) {
    return normalizeClubId(value[0])
  }

  if (value === undefined || value === null) {
    return ''
  }

  const normalized = String(value).trim()
  const numeric = Number(normalized)
  return normalized && Number.isInteger(numeric) && numeric > 0 ? String(numeric) : ''
}

/**
 * Resolve the wallet club strictly from /user_club-derived records.
 * A directed route club takes precedence over the globally selected club.
 */
export function resolveWalletClub<T extends WalletClubLike>(
  clubList: readonly T[],
  currentClubId: unknown,
  channelDefaultClub: T | null | undefined,
  directedClubId?: unknown,
): T | null {
  const directedId = normalizeClubId(directedClubId)
  const selectedId = directedId || normalizeClubId(currentClubId)

  if (selectedId) {
    const joinedClub = clubList.find((club) => normalizeClubId(club.club_id) === selectedId)
    if (joinedClub) {
      return joinedClub
    }

    if (normalizeClubId(channelDefaultClub?.club_id) === selectedId) {
      return channelDefaultClub ?? null
    }

    // An explicit club context must never silently display another club's balance.
    return null
  }

  return clubList[0] ?? channelDefaultClub ?? null
}

export function resolveWalletClubId(club: WalletClubLike | null | undefined): number | undefined {
  const clubId = Number(club?.club_id)
  return Number.isFinite(clubId) && clubId > 0 ? clubId : undefined
}

export function resolveWalletClubGold(club: WalletClubLike | null | undefined): number {
  const gold = Number(club?.user_gold)
  return Number.isFinite(gold) ? gold : 0
}
