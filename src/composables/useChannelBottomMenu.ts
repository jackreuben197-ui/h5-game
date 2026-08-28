import { computed, onMounted, watch } from 'vue'
import { useAppConfigStore } from '@/stores/appConfig'
import { useMttListStore } from '@/stores/mttList'
import { useRoomListStore } from '@/stores/roomList'
import { useUserInfoStore } from '@/stores/userInfo'
import { isChannelPackageHost } from '@/utils/channelPackage'
import { filterVisibleMttRecords } from '@/utils/mttVisibility'
import { checkIsShowForClubAndTribe } from '@/utils/roomVisibility'

function toSafeInt(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? Math.floor(num) : 0
}

/** 渠道包底部导航的版本与动态玩法入口。 */
export function useChannelBottomMenu() {
  const userInfoStore = useUserInfoStore()
  const roomListStore = useRoomListStore()
  const mttListStore = useMttListStore()
  const appConfigStore = useAppConfigStore()
  const isChannelPackage = isChannelPackageHost()

  const channelClub = computed(
    () =>
      userInfoStore.currentJoinedClub ||
      userInfoStore.currentClub ||
      userInfoStore.clubList[0] ||
      userInfoStore.channelDefaultClub,
  )
  const selectedClubId = computed(() => toSafeInt(channelClub.value?.club_id))
  const selectedTribeId = computed(() => toSafeInt(channelClub.value?.tribe_id))

  // 俱乐部数据尚未到达时先保持默认版本 A，避免首屏导航闪变。
  const isVersionB = computed(
    () =>
      isChannelPackage &&
      channelClub.value !== null &&
      channelClub.value !== undefined &&
      Number(channelClub.value.h5_menu) !== 2,
  )

  const hasPoker = computed(() =>
    roomListStore.records.some(
      (room) =>
        Number(room.game_type) < 5 &&
        checkIsShowForClubAndTribe(room, selectedClubId.value, selectedTribeId.value),
    ),
  )

  const hasMtt = computed(
    () =>
      filterVisibleMttRecords(
        mttListStore.records,
        mttListStore.mttIdMetaMap,
        selectedClubId.value,
        selectedTribeId.value,
        appConfigStore.clubDisplayPlatformMtt,
      ).length > 0,
  )

  // 小游戏尚未接入：保留开关和菜单能力，暂时固定隐藏。
  const hasMiniGame = computed(() => false)

  function bootstrapVersionBData(): void {
    if (!isVersionB.value) return
    void roomListStore.bootstrapRoomList()
    void mttListStore.bootstrapMttList()
  }

  watch(isVersionB, bootstrapVersionBData, { immediate: true })

  onMounted(() => {
    if (!isChannelPackage) return
    void userInfoStore.ensureChannelDefaultClub()
    bootstrapVersionBData()
  })

  return {
    isChannelPackage,
    isVersionB,
    hasPoker,
    hasMtt,
    hasMiniGame,
  }
}
