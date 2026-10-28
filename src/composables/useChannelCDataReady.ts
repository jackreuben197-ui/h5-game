import { computed, onMounted, ref, type Ref } from 'vue'
import { useUserInfoStore } from '@/stores/userInfo'
import { useGameStore } from '@/stores/game'
import { useAppConfigStore } from '@/stores/appConfig'
import { useRoomListStore } from '@/stores/roomList'
import { useMttListStore } from '@/stores/mttList'
import { ensureExperienceSession } from '@/session/experienceSession'

/** 首页复用现有启动流程，独立牌桌/比赛和搜索深链补齐同一份真实数据。 */
export function useChannelCDataReady(externalReady?: Ref<boolean | undefined>) {
  const loaded = ref(false)
  const ready = computed(() => externalReady?.value ?? loaded.value)

  onMounted(async () => {
    if (externalReady?.value !== undefined) return
    const user = useUserInfoStore()
    const game = useGameStore()
    const app = useAppConfigStore()
    try {
      await Promise.all([
        user.ensureChannelDefaultClub(),
        app.ensureGuestGlobalConfig(),
        ensureExperienceSession(),
      ])
      if (game.isRealUser && game.sessionToken) {
        await app.ensureFreshGlobalConfig(game.sessionToken)
      }
      await Promise.all([
        useRoomListStore().bootstrapRoomList(),
        useMttListStore().bootstrapMttList(),
      ])
    } catch (error) {
      console.warn('[channel-c] load lobby data failed:', error)
    } finally {
      loaded.value = true
    }
  })

  return ready
}
