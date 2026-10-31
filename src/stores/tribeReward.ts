import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { postPropTribeRewardInfoApi } from '@/api/prop'
import type { TribeRewardInfoData } from '@/api/models/prop'
import { presentTribeRewards } from '@/features/tribeReward/presentation'
import { useGameStore } from '@/stores/game'

/** 按账号和俱乐部隔离；弹窗打开查询，通知到达时合并刷新，禁止旧请求覆盖新账号。 */
export const useTribeRewardStore = defineStore('tribe-reward', () => {
  const game = useGameStore()
  const data = ref<TribeRewardInfoData | null>(null)
  const loading = ref(false)
  const failed = ref(false)
  const revision = ref(0)
  const clubId = ref(0)
  const presentation = computed(() => presentTribeRewards(data.value))
  let version = 0
  let inFlight: Promise<void> | null = null
  let refreshQueued = false
  let identity = ''

  function reset() {
    version += 1
    inFlight = null
    refreshQueued = false
    data.value = null
    loading.value = false
    failed.value = false
    clubId.value = 0
    identity = ''
  }
  watch(() => [game.sessionToken, game.loginUserId, game.isRealUser], reset, { flush: 'sync' })

  function load(targetClubId: number, force = false): Promise<void> {
    if (!game.isRealUser || !Number.isSafeInteger(targetClubId) || targetClubId <= 0) {
      reset()
      failed.value = true
      return Promise.resolve()
    }
    const nextIdentity = `${game.loginUserId}:${game.sessionToken}`
    if (clubId.value !== targetClubId || identity !== nextIdentity) {
      reset()
      clubId.value = targetClubId
      identity = nextIdentity
    }
    if (inFlight) {
      refreshQueued ||= force
      return inFlight
    }
    const requestVersion = version
    loading.value = true
    failed.value = false
    inFlight = (async () => {
      try {
        do {
          refreshQueued = false
          try {
            const response = await postPropTribeRewardInfoApi({
              club_id: targetClubId,
              reward_type: 'all',
            })
            if (requestVersion !== version) return
            if (response.code !== 0 || !response.data) throw new Error('reward-info-unavailable')
            data.value = response.data
            failed.value = false
          } catch {
            if (requestVersion !== version) return
            failed.value = true
          }
        } while (refreshQueued && requestVersion === version)
      } finally {
        if (requestVersion === version) {
          loading.value = false
          inFlight = null
        }
      }
    })()
    return inFlight
  }
  function invalidate(tribeId: number, changedClubId: number) {
    if (clubId.value > 0 && (clubId.value === changedClubId || data.value?.tribe_id === tribeId)) {
      revision.value += 1
    }
  }
  return { data, loading, failed, revision, clubId, presentation, load, reset, invalidate }
})
