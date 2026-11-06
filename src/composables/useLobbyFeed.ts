import { computed } from 'vue'
import type { RoomRecord } from '@/api/models/roomcenter'
import { useAppConfigStore } from '@/stores/appConfig'
import { useMttListStore } from '@/stores/mttList'
import { useRoomListStore } from '@/stores/roomList'
import { type ClubInfo, useUserInfoStore } from '@/stores/userInfo'
import { usePlatformDiamondVisibility } from '@/composables/usePlatformDiamondVisibility'
import { isChannelPackageHost } from '@/utils/channelPackage'
import { isMttRecordVisible } from '@/utils/mttVisibility'
import { checkIsShowForClubAndTribe } from '@/utils/roomVisibility'

function toSafeInt(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? Math.floor(num) : 0
}

/** 首页统计与两个专区共享可见范围：官网汇总已加入俱乐部，渠道使用入口俱乐部。 */
export function useLobbyFeed() {
  const appConfigStore = useAppConfigStore()
  const mttListStore = useMttListStore()
  const roomListStore = useRoomListStore()
  const userInfoStore = useUserInfoStore()
  const displayPlatformDiamond = usePlatformDiamondVisibility()
  const isChannelPackage = computed(() => {
    void appConfigStore.globalConfig
    return isChannelPackageHost()
  })
  const visibilityClubs = computed<Array<ClubInfo | null>>(() => {
    if (isChannelPackage.value) {
      return [userInfoStore.channelDefaultClub ?? userInfoStore.currentClub]
    }
    const clubs = userInfoStore.clubList.filter((club) => toSafeInt(club.club_id) > 0)
    // 未加入俱乐部时沿用原有无俱乐部规则，展示接口已授权返回的游客内容。
    return clubs.length ? clubs : [null]
  })

  function isRoomVisibleForClub(room: RoomRecord, club: ClubInfo | null): boolean {
    return checkIsShowForClubAndTribe(
      room,
      toSafeInt(club?.club_id),
      toSafeInt(club?.tribe_id),
      true,
      displayPlatformDiamond.value,
    )
  }

  // 在原始列表上筛选一次，同一联盟经多个俱乐部可见时也只展示一份。
  const visibleRooms = computed(() =>
    roomListStore.records.filter((room) =>
      visibilityClubs.value.some((club) => isRoomVisibleForClub(room, club)),
    ),
  )
  const visibleMatches = computed(() =>
    mttListStore.records.filter((record) =>
      visibilityClubs.value.some((club) =>
        isMttRecordVisible(
          record,
          mttListStore.mttIdMetaMap[toSafeInt(record.match_id)],
          toSafeInt(club?.club_id),
          toSafeInt(club?.tribe_id),
          appConfigStore.clubDisplayPlatformMtt,
          displayPlatformDiamond.value,
        ),
      ),
    ),
  )

  function resolveRoomClub(room: RoomRecord): ClubInfo | null {
    const clubs = visibilityClubs.value
    const currentClubId = toSafeInt(userInfoStore.currentClub?.club_id)
    // 当前俱乐部可进桌时优先使用；跨联盟牌桌选用实际匹配的已加入俱乐部。
    const currentClub = clubs.find(
      (club) => toSafeInt(club?.club_id) === currentClubId && isRoomVisibleForClub(room, club),
    )
    return currentClub ?? clubs.find((club) => isRoomVisibleForClub(room, club)) ?? null
  }

  return { visibleRooms, visibleMatches, resolveRoomClub }
}
