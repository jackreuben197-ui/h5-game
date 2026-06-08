import type { ClubInfo } from '@/stores/userInfo'
import { USER_STORE_CLUB_LIST } from '@/utils/indexedDB'
import { userCache } from '@/utils/userCache'

function normalizeClubId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim()
}

export async function readClubListCache(userId: string | number): Promise<ClubInfo[]> {
  const list = await userCache(userId).getAll<ClubInfo>(USER_STORE_CLUB_LIST)
  return list.filter((club) => club && normalizeClubId(club.club_id) !== '')
}

export async function writeClubListCache(
  userId: string | number,
  list: ClubInfo[],
): Promise<void> {
  const entries: Array<[string, ClubInfo]> = []
  if (Array.isArray(list)) {
    list.forEach((club) => {
      const clubId = normalizeClubId(club?.club_id)
      if (clubId) {
        entries.push([clubId, club])
      }
    })
  }
  await userCache(userId).bulkReplace(USER_STORE_CLUB_LIST, entries)
}

export async function clearClubListCache(userId: string | number): Promise<void> {
  await userCache(userId).clear(USER_STORE_CLUB_LIST)
}
