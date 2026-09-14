import { computed } from 'vue'
import { useUserInfoStore } from '@/stores/userInfo'
import { isChannelDiamondFreeMode, isChannelPackageHost } from '@/utils/channelPackage'

/** undefined 保留官方包规则；渠道包过渡期隐藏平台钻石桌和比赛，过渡期结束后恢复 CMS 控制。 */
export function usePlatformDiamondVisibility() {
  const userInfoStore = useUserInfoStore()
  return computed<boolean | undefined>(() => {
    if (!isChannelPackageHost()) return undefined
    if (isChannelDiamondFreeMode()) return false
    // 游客和登录用户都使用渠道所属俱乐部，避免切换俱乐部改变渠道配置。
    return Number(userInfoStore.channelDefaultClub?.diamond_room_switch) === 1
  })
}
