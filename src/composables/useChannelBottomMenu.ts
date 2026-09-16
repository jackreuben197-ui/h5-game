import { usePlatformDiamondVisibility } from '@/composables/usePlatformDiamondVisibility'
import { computed } from 'vue'
import { useAppConfigStore } from '@/stores/appConfig'
import { useMttListStore } from '@/stores/mttList'
import { useRoomListStore } from '@/stores/roomList'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { isPrivateDomainMode } from '@/utils/channelPackage'
import { filterVisibleMttRecords } from '@/utils/mttVisibility'
import { checkIsShowForClubAndTribe } from '@/utils/roomVisibility'

function toSafeInt(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? Math.floor(num) : 0
}

/** 渠道包底部导航的版本与动态玩法入口。 */
export function useChannelBottomMenu() {
  const gameStore = useGameStore()
  const displayPlatformDiamond = usePlatformDiamondVisibility()
  const userInfoStore = useUserInfoStore()
  const roomListStore = useRoomListStore()
  const mttListStore = useMttListStore()
  const appConfigStore = useAppConfigStore()
  // Telegram 俱乐部深链与渠道子域名同属私域模式，底部导航版本判定必须一致。
  const isChannelPackage = isPrivateDomainMode()

  const channelClub = computed(() => {
    // 游客只能使用渠道公开俱乐部配置，不能让残留的真实用户 clubList 改变菜单版本。
    if (gameStore.isGuestAccount) {
      return userInfoStore.channelDefaultClub
    }
    return (
      userInfoStore.currentJoinedClub ||
      userInfoStore.currentClub ||
      userInfoStore.clubList[0] ||
      userInfoStore.channelDefaultClub
    )
  })
  const selectedClubId = computed(() => toSafeInt(channelClub.value?.club_id))
  const selectedTribeId = computed(() => toSafeInt(channelClub.value?.tribe_id))
  // h5_menu 是渠道包配置，只认 /org/club/default 返回的渠道俱乐部；
  // 登录后的当前俱乐部仅用于牌桌和比赛的可见性过滤，不能决定渠道菜单版本。
  const h5Menu = computed(() => userInfoStore.channelDefaultClub?.h5_menu)

  // 俱乐部数据尚未到达时先保持默认版本 A，避免首屏导航闪变。
  const isVersionB = computed(
    () =>
      isChannelPackage &&
      h5Menu.value !== null &&
      h5Menu.value !== undefined &&
      Number(h5Menu.value) === 1,
  )

  const hasPoker = computed(() =>
    roomListStore.records.some(
      (room) =>
        Number(room.game_type) < 5 &&
        checkIsShowForClubAndTribe(
          room,
          selectedClubId.value,
          selectedTribeId.value,
          true,
          displayPlatformDiamond.value,
        ),
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
        displayPlatformDiamond.value,
      ).length > 0,
  )

  // 小游戏尚未接入：保留开关和菜单能力，暂时固定隐藏。
  const hasMiniGame = computed(() => false)

  return {
    isChannelPackage,
    channelClub,
    isVersionB,
    hasPoker,
    hasMtt,
    hasMiniGame,
  }
}
