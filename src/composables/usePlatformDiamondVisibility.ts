import { computed } from 'vue'
import { useUserInfoStore } from '@/stores/userInfo'
import { isChannelPackageHost } from '@/utils/channelPackage'

/** undefined 保留官方包规则；渠道包只在 CMS 明确开启时展示平台钻石桌和比赛。 */
export function usePlatformDiamondVisibility() {
  const userInfoStore = useUserInfoStore()
  return computed<boolean | undefined>(() => {
    if (!isChannelPackageHost()) return undefined
    // 游客和登录用户都使用渠道所属俱乐部，避免切换俱乐部改变渠道配置。
    return Number(userInfoStore.channelDefaultClub?.diamond_room_switch) === 1
  })
}
