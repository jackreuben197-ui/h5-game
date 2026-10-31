import { computed, ref, watch, type Ref } from 'vue'
import {
  CATEGORY_API_TYPES,
  getGamesByCategoryClub,
  type ExtendGameRecord,
} from '@/api/casino'
import type { LiveWinItem } from '@/components/LiveWinsTicker.vue'
import { useAppConfigStore } from '@/stores/appConfig'
import { useCasinoStore } from '@/stores/casino'

const ACTIVE_STATE = 1
const DEFAULT_ROTATION_SECONDS = 3

interface LiveWinRecord {
  id?: unknown
  game_id?: unknown
  game_name?: unknown
  user_info?: unknown
  reward_amount?: unknown
  sorting?: unknown
  lab_text?: unknown
  state?: unknown
}

function parseLiveWinRecords(raw: unknown): LiveWinRecord[] {
  let value = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return []
    }
  }
  const list = Array.isArray(value) ? value : (value as { data?: unknown } | null)?.data
  return Array.isArray(list) ? (list as LiveWinRecord[]) : []
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function buildLiveWinItems(
  raw: unknown,
  gameIcons: ReadonlyMap<number, string>,
): LiveWinItem[] {
  return parseLiveWinRecords(raw)
    .filter((record) => {
      const amount = Number(record?.reward_amount)
      return (
        Number(record?.state) === ACTIVE_STATE &&
        Boolean(readText(record?.game_name)) &&
        Number.isFinite(amount) &&
        amount > 0
      )
    })
    .sort((a, b) => Number(a.sorting) - Number(b.sorting) || Number(a.id) - Number(b.id))
    .map((record) => ({
      id: String(record.id),
      gameId: Number(record.game_id),
      gameTitle: readText(record.game_name),
      gameIcon: gameIcons.get(Number(record.game_id)),
      username: readText(record.user_info),
      finalAmount: Number(record.reward_amount),
      tag: readText(record.lab_text),
    }))
}

function collectGames(groups: ExtendGameRecord[][]): Map<number, ExtendGameRecord> {
  const games = new Map<number, ExtendGameRecord>()
  groups.flat().forEach((game) => {
    const id = Number(game.game_id ?? game.id)
    if (id > 0 && !games.has(id)) games.set(id, game)
  })
  return games
}

function collectGameIcons(games: Map<number, ExtendGameRecord>): Map<number, string> {
  const icons = new Map<number, string>()
  games.forEach((game, id) => {
    const icon = readText(game.game_icon)
    if (icon) icons.set(id, icon)
  })
  return icons
}

export function useLiveWins(clubId?: Ref<number>) {
  const appConfigStore = useAppConfigStore()
  const casinoStore = useCasinoStore()
  const catalogGames = ref<ExtendGameRecord[]>([])

  const games = computed(() =>
    collectGames([
      catalogGames.value,
      casinoStore.gameRecords,
      casinoStore.popularBannerGames,
      ...Object.values(casinoStore.popularGamesByType),
    ]),
  )
  const liveWinItems = computed(() =>
    buildLiveWinItems(
      appConfigStore.globalConfig?.extend_live_wins_info,
      collectGameIcons(games.value),
    ),
  )
  const liveWinInterval = computed(() => {
    const seconds = Number(appConfigStore.globalConfig?.extend_live_wins_rotation_interval)
    return (seconds > 0 ? seconds : DEFAULT_ROTATION_SECONDS) * 1000
  })

  const missingGameKey = computed(() => {
    if (!clubId?.value || !casinoStore.gameRecords.length) return ''
    const missing = liveWinItems.value
      .filter((item) => item.gameId && !games.value.has(item.gameId))
      .map((item) => item.gameId)
    return missing.length ? `${clubId.value}:${missing.join(',')}` : ''
  })
  let loadedGameKey = ''
  watch(
    missingGameKey,
    async (key) => {
      if (!key || key === loadedGameKey) return
      loadedGameKey = key
      try {
        const res = await getGamesByCategoryClub(
          { game_api_type: Object.values(CATEGORY_API_TYPES).flat(), limit: 1000 },
          clubId!.value,
        )
        if (res.code === 0 && res.data) {
          catalogGames.value = res.data.list ?? res.data.records ?? []
        }
      } catch (error) {
        console.warn('[live-wins] load game catalog failed:', error)
      }
    },
    { immediate: true },
  )

  function findLiveWinGame(item: LiveWinItem): ExtendGameRecord | undefined {
    return item.gameId ? games.value.get(item.gameId) : undefined
  }

  return { liveWinItems, liveWinInterval, findLiveWinGame }
}
