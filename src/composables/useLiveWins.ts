import { computed } from 'vue'
import type { ExtendGameRecord } from '@/api/casino'
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
      gameTitle: readText(record.game_name),
      gameIcon: gameIcons.get(Number(record.game_id)),
      username: readText(record.user_info),
      finalAmount: Number(record.reward_amount),
      tag: readText(record.lab_text),
    }))
}

function collectGameIcons(groups: ExtendGameRecord[][]): Map<number, string> {
  const icons = new Map<number, string>()
  groups.flat().forEach((game) => {
    const icon = readText(game.game_icon)
    const id = Number(game.game_id ?? game.id)
    if (icon && id > 0 && !icons.has(id)) icons.set(id, icon)
  })
  return icons
}

export function useLiveWins() {
  const appConfigStore = useAppConfigStore()
  const casinoStore = useCasinoStore()

  const liveWinItems = computed(() =>
    buildLiveWinItems(
      appConfigStore.globalConfig?.extend_live_wins_info,
      collectGameIcons([
        casinoStore.gameRecords,
        casinoStore.popularBannerGames,
        ...Object.values(casinoStore.popularGamesByType),
      ]),
    ),
  )
  const liveWinInterval = computed(() => {
    const seconds = Number(appConfigStore.globalConfig?.extend_live_wins_rotation_interval)
    return (seconds > 0 ? seconds : DEFAULT_ROTATION_SECONDS) * 1000
  })

  return { liveWinItems, liveWinInterval }
}
