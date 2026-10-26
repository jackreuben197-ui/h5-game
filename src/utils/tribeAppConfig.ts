import { postOrgTribeSearchByIdApi } from '@/api/org'
import type { OrgClubData, OrgTribeSearchByIdData } from '@/api/models/org'

const pending = new Map<number, Promise<OrgTribeSearchByIdData | null>>()

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

/** 俱乐部配置保持原字段；联盟配置单独保存，展示时逐字段决定优先级。 */
export async function withTribeAppConfig<T extends OrgClubData>(club: T): Promise<T> {
  const tribeRandomId = Number(club.tribe_random_id)
  if (!Number.isInteger(tribeRandomId) || tribeRandomId <= 0) return club
  const tribe = await loadTribeAppConfig(tribeRandomId)
  if (!tribe) return club
  return {
    ...club,
    tribe_safari_icon_url: String(tribe.safari_icon_url || '').trim(),
    tribe_safari_label: String(tribe.safari_label || '').trim(),
    tribe_room_logo: String(tribe.room_logo || '').trim(),
  }
}
