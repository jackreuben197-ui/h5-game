import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChannelBottomMenu } from '@/composables/useChannelBottomMenu'
import { useUserInfoStore } from '@/stores/userInfo'

/** 首屏先渲染；渠道配置异步到达后再校正历史链接，避免路由守卫阻塞挂载。 */
export function useChannelCVersionRouting() {
  const route = useRoute()
  const router = useRouter()
  const user = useUserInfoStore()
  const { isVersionC } = useChannelBottomMenu()
  const legacyToC: Record<string, string> = {
    'game-list': 'channel-c-poker',
    'match-index': 'channel-c-mtt',
  }
  const cToLegacy: Record<string, string> = {
    'channel-c-poker': 'game-list',
    'channel-c-mtt': 'match-index',
  }
  watch(
    [isVersionC, () => user.channelDefaultClub, () => route.name],
    ([versionC, club, name]) => {
      if (!club) return
      const target = (versionC ? legacyToC : cToLegacy)[String(name)]
      if (target) void router.replace({ name: target, query: route.query })
    },
    { immediate: true },
  )
}
