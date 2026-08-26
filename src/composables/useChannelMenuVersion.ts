import { computed, type ComputedRef } from 'vue'
import { useUserInfoStore, type ClubInfo } from '@/stores/userInfo'
import { isPrivateDomainMode } from '@/utils/channelPackage'

// 后台下发的底部导航配置：2 = 版本 A（首页聚合专区），其余 = 版本 B（专区各占一个 tab）。
const MENU_VERSION_A = 2

interface ChannelMenuVersion {
  isChannelPackage: ComputedRef<boolean>
  channelClub: ComputedRef<ClubInfo | null>
  isVersionB: ComputedRef<boolean>
}

// 渠道包的「当前俱乐部」：登录态取用户选中的，游客态回落到邀请码解析出的默认俱乐部。
// 版本判定必须走同一个来源，否则底部栏与页面会各自算出不同的版本。
export function useChannelMenuVersion(): ChannelMenuVersion {
  const userInfoStore = useUserInfoStore()

  const isChannelPackage = computed(() => isPrivateDomainMode())

  const channelClub = computed<ClubInfo | null>(
    () => userInfoStore.currentClub ?? userInfoStore.channelDefaultClub,
  )

  const isVersionB = computed(() => {
    if (!isChannelPackage.value) {
      return false
    }
    const h5Menu = channelClub.value?.h5_menu
    if (h5Menu === undefined || h5Menu === null) {
      return false
    }
    return Number(h5Menu) !== MENU_VERSION_A
  })

  return { isChannelPackage, channelClub, isVersionB }
}
