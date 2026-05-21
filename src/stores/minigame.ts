import { defineStore } from 'pinia'
import {
  type ExtendGameRecord,
  getDeviceType,
  getPopularGamesHome,
  getPopularGamesClub,
  getPopularBannerGamesHome,
  getPopularBannerGamesClub,
} from '@/api/casino'

interface MinigameState {
  mahjongGames: ExtendGameRecord[]
  hasFetchedInitialData: boolean
  isInitLoading: boolean
}

export const useMinigameStore = defineStore('minigame', {
  state: (): MinigameState => ({
    mahjongGames: [],
    hasFetchedInitialData: false,
    isInitLoading: false,
  }),

  actions: {
    setMahjongGames(games: ExtendGameRecord[]) {
      this.mahjongGames = games
    },
    setHasFetchedInitialData(val: boolean) {
      this.hasFetchedInitialData = val
    },
    setIsInitLoading(val: boolean) {
      this.isInitLoading = val
    },

    async fetchMahjongData(clubId?: number, isGlobalMode: boolean = true) {
      this.setIsInitLoading(true)
      try {
        const payload = {
          device_type: getDeviceType(),
          search: "",
        }
        const response = isGlobalMode
          ? await getPopularGamesHome(payload)
          : await getPopularGamesClub(payload, clubId!);

        const bannerResponse = isGlobalMode
          ? await getPopularBannerGamesHome(payload)
          : await getPopularBannerGamesClub(payload, clubId!);

        if (response || bannerResponse) {
          let games1 = response?.data?.list || response?.data?.records || [];
          if (!Array.isArray(games1)) games1 = typeof games1 === 'object' && games1 !== null ? Object.values(games1) : [];

          let games2 = bannerResponse?.data?.list || bannerResponse?.data?.records || [];
          if (!Array.isArray(games2)) games2 = typeof games2 === 'object' && games2 !== null ? Object.values(games2) : [];

          const games = [...games1, ...games2];

          const filteredGames = games.filter((game: any) => {
            const gameApiType = (game.game_api_type || "").toLowerCase();
            const gameType = (String(game.game_type) || "").toLowerCase();
            const gameName = (game.game_name || "").toLowerCase();

            return (
              gameApiType.includes('cow_boy') || gameType.includes('cow_boy') || gameName.includes('牛仔') ||
              gameApiType.includes('ky_poker') || gameType.includes('ky_poker') || gameName.includes('开元') ||
              gameApiType.includes('leg_poker') || gameType.includes('leg_poker') || gameName.includes('乐游') ||
              gameApiType.includes('t1_game') || gameType.includes('t1_game') || gameName.includes('t1')
            );
          });

          const uniqueGames: ExtendGameRecord[] = [];
          const seen = new Set();
          for (const g of filteredGames) {
            const key = g.id || g.game_api_type || g.game_type;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueGames.push(g as ExtendGameRecord);
            }
          }

          this.setMahjongGames(uniqueGames)
        }
      } catch (error) {
        console.error('Failed to fetch mahjong data', error);
      } finally {
        this.setIsInitLoading(false)
      }
    },

    async preloadMinigameData(clubId?: number, isGlobalMode: boolean = true) {
      if (this.hasFetchedInitialData) return
      await this.fetchMahjongData(clubId, isGlobalMode)
      this.setHasFetchedInitialData(true)
    }
  },
})
