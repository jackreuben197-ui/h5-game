import { ref, watch, type Ref } from 'vue'
import { CATEGORY_API_TYPES, getGamesByCategoryClub, type ExtendGameRecord } from '@/api/casino'

const CATALOG_API_TYPES = Object.entries(CATEGORY_API_TYPES)
  .filter(([category]) => category !== 'lottery')
  .flatMap(([, types]) => types)

export function useCasinoCatalog(clubId: Ref<number>) {
  const games = ref<ExtendGameRecord[]>([])
  const loading = ref(false)

  watch(
    clubId,
    async (id) => {
      if (!id) return
      loading.value = true
      try {
        const res = await getGamesByCategoryClub(
          { game_api_type: CATALOG_API_TYPES, limit: 1000 },
          id,
        )
        if (id === clubId.value && res.code === 0 && res.data) {
          games.value = res.data.list ?? res.data.records ?? []
        }
      } catch (error) {
        console.warn('[casino] load game catalog failed:', error)
      } finally {
        if (id === clubId.value) loading.value = false
      }
    },
    { immediate: true },
  )

  return { games, loading }
}
