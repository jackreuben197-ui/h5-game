import { defineStore } from 'pinia'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { isPrivateDomainMode } from '@/utils/channelPackage'
import {
  type ExtendGameRecord,
  getDeviceType,
  getPopularGamesHome,
  getPopularGamesClub,
  getPopularBannerGamesHome,
  getPopularBannerGamesClub,
} from '@/api/casino'

const BANNER_STORAGE_KEY = 'casino_popular_banner_v1'

function toSafeInt(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? Math.floor(num) : 0
}

async function resolveCasinoContext(
  clubId?: number,
  isGlobalMode: boolean = true,
): Promise<{ effectiveClubId: number; effectiveGlobalMode: boolean }> {
  const isPrivate = isPrivateDomainMode()
  const userInfoStore = useUserInfoStore()
  let resolvedClubId = toSafeInt(
    clubId ||
    userInfoStore.currentClubId ||
    userInfoStore.currentClub?.club_id ||
    userInfoStore.channelDefaultClub?.club_id,
  )

  if (isPrivate && resolvedClubId <= 0) {
    try {
      const defaultClub = await userInfoStore.ensureChannelDefaultClub()
      if (defaultClub?.club_id) {
        resolvedClubId = toSafeInt(defaultClub.club_id)
      }
    } catch {
      // ignore
    }
  }

  const effectiveGlobalMode = isPrivate ? false : (resolvedClubId > 0 ? false : isGlobalMode)
  return { effectiveClubId: resolvedClubId, effectiveGlobalMode }
}

function loadBannerFromStorage(): ExtendGameRecord[] {
  try {
    const raw = localStorage.getItem(BANNER_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as ExtendGameRecord[]
    }
  } catch {
    // ignore
  }
  return []
}

interface CasinoState {
  selectedTab: 'wheel' | 'mahjong'
  popularBannerGames: ExtendGameRecord[]
  gameRecords: ExtendGameRecord[]
  popularGamesByType: Record<string, ExtendGameRecord[]>
  hasFetchedInitialData: boolean
}

export const useCasinoStore = defineStore('casino', {
  state: (): CasinoState => ({
    selectedTab: 'wheel',
    popularBannerGames: loadBannerFromStorage(),
    gameRecords: [],
    popularGamesByType: {},
    hasFetchedInitialData: false,
  }),

  actions: {
    setSelectedTab(tab: 'wheel' | 'mahjong') {
      this.selectedTab = tab
    },

    setPopularBannerGames(games: ExtendGameRecord[]) {
      this.popularBannerGames = games
      try {
        localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(games))
      } catch {
        // quota exceeded or private mode – silently ignore
      }
    },
    setGameRecords(records: ExtendGameRecord[]) {
      this.gameRecords = records
    },
    setPopularGamesByType(gamesByType: Record<string, ExtendGameRecord[]>) {
      this.popularGamesByType = gamesByType
    },
    setHasFetchedInitialData(val: boolean) {
      this.hasFetchedInitialData = val
    },

    async fetchPopularGames(clubId?: number, isGlobalMode: boolean = true) {
      try {
        const { effectiveClubId, effectiveGlobalMode } = await resolveCasinoContext(clubId, isGlobalMode)
        const payload = { device_type: getDeviceType(), search: '' }
        const res = effectiveGlobalMode || effectiveClubId <= 0
          ? await getPopularGamesHome(payload)
          : await getPopularGamesClub(payload, effectiveClubId)

        if (res.code === 0 && res.data) {
          const listData = res.data.list ?? res.data.records ?? []
          if (listData && typeof listData === 'object' && !Array.isArray(listData)) {
            const gamesByType: Record<string, ExtendGameRecord[]> = {}
            const allGames: ExtendGameRecord[] = []
            Object.keys(listData).forEach((gameApiType) => {
              const games = (listData as any)[gameApiType]
              if (Array.isArray(games)) {
                gamesByType[gameApiType] = games as ExtendGameRecord[]
                const popularGames = games.filter(
                  (game: any) => game.is_popular === 1 || (game.is_popular_p || 0) > 0,
                )
                allGames.push(...(popularGames as ExtendGameRecord[]))
              }
            })
            this.setPopularGamesByType(gamesByType)
            this.setGameRecords(allGames)
          } else if (Array.isArray(listData)) {
            this.setGameRecords(listData as ExtendGameRecord[])
            const gamesByType: Record<string, ExtendGameRecord[]> = {}
            listData.forEach((game: any) => {
              if (game.game_api_type) {
                const apiType = game.game_api_type
                if (!gamesByType[apiType]) {
                  gamesByType[apiType] = []
                }
                gamesByType[apiType].push(game as ExtendGameRecord)
              }
            })
            this.setPopularGamesByType(gamesByType)
          } else {
            const records = res.data.records ?? []
            const recordsArray = Array.isArray(records) ? records : []
            this.setGameRecords(recordsArray as ExtendGameRecord[])
            const gamesByType: Record<string, ExtendGameRecord[]> = {}
            recordsArray.forEach((game: any) => {
              if (game.game_api_type) {
                const apiType = game.game_api_type
                if (!gamesByType[apiType]) {
                  gamesByType[apiType] = []
                }
                gamesByType[apiType].push(game as ExtendGameRecord)
              }
            })
            this.setPopularGamesByType(gamesByType)
          }
        }
      } catch (error) {
        console.error('Failed to fetch popular games:', error)
      }
    },

    async fetchPopularBannerGames(clubId?: number, isGlobalMode: boolean = true) {
      try {
        const { effectiveClubId, effectiveGlobalMode } = await resolveCasinoContext(clubId, isGlobalMode)
        if (this.gameRecords.length === 0) {
          await this.fetchPopularGames(effectiveClubId, effectiveGlobalMode)
        }

        let apiGames: ExtendGameRecord[] = []
        try {
          const res = effectiveGlobalMode || effectiveClubId <= 0
            ? await getPopularBannerGamesHome({ device_type: getDeviceType(), game_type: '', search: '' })
            : await getPopularBannerGamesClub({ device_type: getDeviceType(), game_type: '', search: '' }, effectiveClubId)
          if (res.code === 0 && res.data && res.data.list) {
            apiGames = res.data.list as ExtendGameRecord[]
          }
        } catch (e) {
          // ignore
        }

        const allSources = [...this.gameRecords, ...apiGames]

        const targets = [
          {
            id: 'cowboy',
            check: (g: any) => g.game_type === 'cow_boy' || g.game_api_type === 'cow_boy' || g.game_name === '德州牛仔',
            fallback: null
          },
          {
            id: 'db_video',
            check: (g: any) => g.game_name?.includes('DB视讯') || g.game_name === 'DB真人',
            fallback: null
          },
          {
            id: 'fb_sports',
            check: (g: any) => g.game_api_type === 'fb_sports' || g.game_name === 'FB体育',
            fallback: null
          },
          {
            id: 'mj_2',
            check: (g: any) => g.game_name === '麻将胡了2',
            fallback: null
          },
          {
            id: 'mj_1',
            check: (g: any) => g.game_name === '麻将胡了',
            fallback: null
          },
          {
            id: 'leg',
            check: (g: any) => g.game_api_type === 'leg_poker' || g.game_name?.includes('乐游'),
            fallback: { id: 'manual_leg' as any, game_name: '乐游棋牌', game_api_type: 'leg_poker' } as ExtendGameRecord
          },
          {
            id: 'ky',
            check: (g: any) => g.game_api_type === 'ky_poker' || g.game_name?.includes('开元'),
            fallback: { id: 'manual_ky' as any, game_name: '开元棋牌', game_api_type: 'ky_poker' } as ExtendGameRecord
          }
        ]

        const finalGames: ExtendGameRecord[] = []
        const usedIds = new Set()

        targets.forEach(target => {
          let found = allSources.find(g => target.check(g))
          if (!found && target.fallback) {
            found = target.fallback
          }
          if (found) {
            const uniqueKey = found.id || found.game_api_type || found.game_type
            if (!usedIds.has(uniqueKey)) {
              finalGames.push(found)
              usedIds.add(uniqueKey)
            }
          }
        })

        if (finalGames.length >= 3) {
          this.setPopularBannerGames(finalGames)
        } else {
          const manualIds = new Set(finalGames.map(g => g.id))
          const textIds = new Set(finalGames.map(g => g.game_name))
          const additional = apiGames.filter(g =>
            !manualIds.has(g.id) && !textIds.has(g.game_name)
          )
          const merged = [...finalGames, ...additional]
          if (merged.length >= 5) {
            this.setPopularBannerGames(merged)
          }
        }
      } catch (error) {
        console.error('Failed to fetch popular banner games:', error)
      }
    },

    async preloadCasinoData(clubId?: number, isGlobalMode: boolean = true) {
      if (this.hasFetchedInitialData && this.gameRecords.length > 0) return
      const { effectiveClubId, effectiveGlobalMode } = await resolveCasinoContext(clubId, isGlobalMode)
      await Promise.allSettled([
        this.fetchPopularGames(effectiveClubId, effectiveGlobalMode),
        this.fetchPopularBannerGames(effectiveClubId, effectiveGlobalMode),
      ])
      const gameStore = useGameStore()
      if (gameStore.sessionToken && this.gameRecords.length > 0) {
        this.setHasFetchedInitialData(true)
      }
    }
  },
})
