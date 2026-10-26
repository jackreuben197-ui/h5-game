import { postOrgTribeInfoByClubApi, postOrgTribeSearchByIdApi } from '@/api/org'
import type { OrgClubData, OrgTribeSearchByIdData } from '@/api/models/org'

const pending = new Map<number, Promise<OrgTribeSearchByIdData | null>>()
const pendingByClub = new Map<number, Promise<OrgTribeSearchByIdData | null>>()

async function loadTribeAppConfig(tribeRandomId: number): Promise<OrgTribeSearchByIdData | null> {
  const inFlight = pending.get(tribeRandomId)
  if (inFlight) return inFlight

  const request = postOrgTribeSearchByIdApi({ tribe_random_id: tribeRandomId })
    .then((response) => {
      if (Number(response.code) !== 0 || !response.data) return null
      return response.data
    })
    .catch((error) => {
      console.warn('[tribeAppConfig] load failed:', tribeRandomId, error)
      return null
    })
    .finally(() => pending.delete(tribeRandomId))
  pending.set(tribeRandomId, request)
  return request
}

async function loadTribeAppConfigByClub(clubId: number): Promise<OrgTribeSearchByIdData | null> {
  const inFlight = pendingByClub.get(clubId)
  if (inFlight) return inFlight

  const request = postOrgTribeInfoByClubApi({ club_id: clubId })
    .then(async (response) => {
      if (Number(response.code) !== 0) return null
      const tribeBase = response.data?.tribe_base
      if (!tribeBase) return null
      const tribeRandomId = Number(tribeBase.random_id)
      if (Number.isInteger(tribeRandomId) && tribeRandomId > 0) {
        const tribe = await loadTribeAppConfig(tribeRandomId)
        if (tribe) return tribe
      }
      return tribeBase
    })
    .catch((error) => {
      console.warn('[tribeAppConfig] load by club failed:', clubId, error)
      return null
    })
    .finally(() => pendingByClub.delete(clubId))
  pendingByClub.set(clubId, request)
  return request
}

/** 俱乐部配置保持原字段；联盟配置单独保存，展示时逐字段决定优先级。 */
export async function withTribeAppConfig<T extends OrgClubData>(club: T): Promise<T> {
  const tribeRandomId = Number(club.tribe_random_id)
  const tribeId = Number(club.tribe_id)
  const clubId = Number(club.club_id)
  const tribe = Number.isInteger(tribeRandomId) && tribeRandomId > 0
    ? await loadTribeAppConfig(tribeRandomId)
    : Number.isInteger(tribeId) && tribeId > 0 && Number.isInteger(clubId) && clubId > 0
      ? await loadTribeAppConfigByClub(clubId)
      : null
  if (!tribe) return club
  return {
    ...club,
    tribe_safari_icon_url: String(tribe.safari_icon_url || '').trim(),
    tribe_safari_label: String(tribe.safari_label || '').trim(),
    tribe_room_logo: String(tribe.room_logo || '').trim(),
  }
}
