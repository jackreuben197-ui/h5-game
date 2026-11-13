import { MttPlayerStatus, type MttListRecord } from '@/api/models/roomcenter'
import {
  getAllMttSngIdsApi,
  getRoomcenterMttDetailApi,
  postRoomCenterUserMatchListApi,
} from '@/api/roomcenter'
import { usePlatformDiamondVisibility } from '@/composables/usePlatformDiamondVisibility'
import { ensureExperienceSessionReady } from '@/session/experienceSession'
import { useAppConfigStore } from '@/stores/appConfig'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { filterVisibleMttRecords } from '@/utils/mttVisibility'
import { toTimestampMs } from '@/utils/time'
import type { PrefetchedMttDetail } from '@/utils/mttDetailHandoff'

// Banner 只跳过「报名已截止」的比赛，跳转目标是模板下开赛时间最早的一场：
// 报名未开始、开放报名、已开赛但仍在延迟报名，以及当前玩家已报名待开赛/待入场，都仍然进入该场。
// 5 及以后（报名截止、淘汰、完赛等）属于报名结束，改匹配下一场开赛时间最早的比赛。
const REGISTRATION_OPEN_STATES: ReadonlySet<number> = new Set<number>([
  MttPlayerStatus.WAITING_APPLY,
  MttPlayerStatus.CAN_APPLY_NOT_START,
  MttPlayerStatus.CAN_APPLY_DELAY,
  MttPlayerStatus.APPLIED_NOT_START,
  MttPlayerStatus.CAN_JOIN,
])

function isRegistrationOpen(stateCode: unknown): boolean {
  return REGISTRATION_OPEN_STATES.has(Number(stateCode))
}

export function useLobbyBannerMatch() {
  const game = useGameStore()
  const user = useUserInfoStore()
  const config = useAppConfigStore()
  const showPlatformDiamond = usePlatformDiamondVisibility()

  return async function resolveMatch(
    clubId: number,
    templateId: string,
  ): Promise<PrefetchedMttDetail | undefined> {
    if (Number(user.channelDefaultClub?.club_id) !== clubId) return
    if (!game.sessionToken && !(await ensureExperienceSessionReady())) return
    const token = game.sessionToken
    const club = user.channelDefaultClub
    if (Number(club?.club_id) !== clubId) return
    const isCurrentSession = () =>
      game.sessionToken === token && Number(user.channelDefaultClub?.club_id) === clubId

    // 点击时重查可见赛事，包含刚建的比赛及刚发生的报名状态变化。
    const index = await getAllMttSngIdsApi()
    if (Number(index.code) !== 0 || !isCurrentSession()) return
    const metadata = Object.fromEntries(
      (index.data?.mtt_id_list ?? []).map((item) => [Number(item.match_id), item]),
    )
    const ids = Object.keys(metadata).map(Number).filter((id) => Number.isSafeInteger(id) && id > 0)
    const records: MttListRecord[] = []
    for (let i = 0; i < ids.length; i += 100) {
      const response = await postRoomCenterUserMatchListApi({
        mtt_ids: ids.slice(i, i + 100),
        room_type: 0,
      })
      if (Number(response.code) !== 0 || !isCurrentSession()) return
      records.push(...(response.data?.mtt_list ?? []))
    }

    const candidates = filterVisibleMttRecords(
      records,
      metadata,
      clubId,
      Number(club?.tribe_id) || 0,
      config.clubDisplayPlatformMtt,
      showPlatformDiamond.value,
    )
      .flatMap((match) => {
        const id = Number(match.match_id)
        const start = toTimestampMs(match.start_time)
        const knownTemplate = match.template_id ?? metadata[id]?.template_id
        const status = Number(match.status)
        // 不再按 apply_start_time 过滤：报名未开始的比赛同样是最早开赛的目标。
        if (
          !Number.isSafeInteger(id) || id <= 0 || start <= 0 ||
          (status !== 0 && status !== 1) ||
          (Number(knownTemplate) > 0 && String(knownTemplate) !== templateId)
        ) return []
        return [{ id, start }]
      })
      .sort((a, b) => a.start - b.start || a.id - b.id)

    // 旧版列表没有模板 ID。按开赛时间分批查询详情，并以服务端当前状态排除报名已截止的比赛。
    for (let i = 0; i < candidates.length; i += 6) {
      const batch = candidates.slice(i, i + 6)
      const details = await Promise.all(batch.map(({ id }) => getRoomcenterMttDetailApi(id)))
      if (!isCurrentSession()) return
      const matchIndex = details.findIndex(({ code, data }) => {
        const status = Number(data?.mtt?.status)
        return Number(code) === 0 &&
          (status === 0 || status === 1) &&
          String(data?.mtt?.template_id) === templateId &&
          isRegistrationOpen(data?.state_code)
      })
      const match = batch[matchIndex]
      const detail = details[matchIndex]?.data
      if (match && detail) return { id: match.id, sessionToken: token, detail }
    }
  }
}
