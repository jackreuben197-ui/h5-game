interface ClubWalletLike {
  club_id: number | string
}

export function filterWalletsForCurrentClub<T extends ClubWalletLike>(
  wallets: readonly T[],
  channelPackage: boolean,
  currentClubId: unknown,
): T[] {
  if (!channelPackage) return [...wallets]

  const clubId = Number(currentClubId)
  if (!Number.isFinite(clubId) || clubId <= 0) return []

  return wallets.filter((wallet) => Number(wallet.club_id) === clubId)
}
