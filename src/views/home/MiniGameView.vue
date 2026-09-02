<script setup lang="ts">
import { ref, onMounted, computed, onActivated } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCasinoStore } from '@/stores/casino'
import { useMinigameStore } from '@/stores/minigame'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { useLoginModalStore } from '@/stores/loginModal'
import { useGameLaunchStore } from '@/stores/gameLaunch'
import { useChannelBottomMenu } from '@/composables/useChannelBottomMenu'
import { requireRealUser } from '@/session/realUserGate'
import {
  reserveGameWindow,
  launchGameUrl,
  releaseGameWindow,
  beginGameLaunch,
  usesTelegramGameLauncher,
  type ReservedGameWindow,
} from '@/utils/externalGameWindow'
import { joinCasinoGame, getDeviceType, getPopularBannerGamesHome, getPopularBannerGamesClub } from '@/api/casino'
import { showToast } from 'vant'
import { t } from '@/i18n'

import mainBgUrl from '@/assets/images/main_bg.webp'


import walletIcon from '@/assets/icons/icon_wallet.png'
import serviceIcon from '@/assets/icons/icon_server.png'
import popularTextIcon from '@/assets/images/minigame-newui/populartext.svg'

import legPokerSvg from '@/assets/images/minigame-newui/skinnyman.png'
import kyPokerSvg from '@/assets/images/minigame-newui/mustacheman.png'
import cowboyBlueSvg from '@/assets/images/minigame-newui/cowboypng.png'
import mahjong1Svg from '@/assets/images/minigame-newui/麻将胡了.png'
import mahjong2Svg from '@/assets/images/minigame-newui/麻将胡了2.png'
import dbLiveSvg from '@/assets/images/minigame-newui/DB真人.png'
import fbSportsSvg from '@/assets/images/minigame-newui/FB体育mini.png'
import legPokerSvgCasino from '@/assets/images/minigame-newui/乐游棋牌.png'
import kyPokerSvgCasino from '@/assets/images/minigame-newui/开元棋牌.png'
import cowboyBlueSvgCasino from '@/assets/images/minigame-newui/德州牛仔.png'
import game2 from '@/assets/images/minigame-newui/games2.png'
import GameClubSelector from '@/components/GameClubSelector.vue'

const props = defineProps<{ hideHeader?: boolean; clubId?: number }>()

const router = useRouter()
const route = useRoute()
const casinoStore = useCasinoStore()
const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()
const loginModalStore = useLoginModalStore()
const gameLaunchStore = useGameLaunchStore()
const { isChannelPackage, channelClub } = useChannelBottomMenu()

const isGuest = computed(() => !gameStore.isRealUser)

function toSafeInt(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? Math.floor(num) : 0
}

const routeClubId = computed<number | undefined>(() => {
  if (props.clubId && props.clubId > 0) return props.clubId
  const val = route.query.clubId
  if (val && val !== '' && val !== '0') {
    const n = parseInt(val as string, 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  if (isChannelPackage) {
    const cid = toSafeInt(
      channelClub.value?.club_id ||
      userInfoStore.channelDefaultClub?.club_id ||
      userInfoStore.currentClub?.club_id ||
      userInfoStore.currentClubId,
    )
    if (cid > 0) return cid
  }
  return undefined
})

const isGlobalMode = computed(() => {
  if (isChannelPackage) return false
  if (props.clubId && props.clubId > 0) return false
  if (routeClubId.value && routeClubId.value > 0) return false
  return true
})

const minigameStore = useMinigameStore()

const popularBannerGames = computed(() => casinoStore.popularBannerGames)
const loadingPopularBanner = ref(false)

const mahjongGames = computed(() => minigameStore.mahjongGames)
const isInitLoading = computed(() => minigameStore.isInitLoading)

const showWalletPopup = ref(false)
const pendingGameInfo = ref<{ apiType: string; gameType: string; roomId: number } | null>(null)

const handleBack = () => {
  router.back()
}

const handleServiceClick = () => {
  router.push('/message/detail')
}

const pageStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

// Fetch banner games if empty
const fetchPopularBannerGames = async () => {
  if (popularBannerGames.value.length > 0) return
  loadingPopularBanner.value = true
  try {
    const payload = { device_type: getDeviceType(), search: '' }
    const res = isGlobalMode.value
      ? await getPopularBannerGamesHome(payload)
      : await getPopularBannerGamesClub(payload, routeClubId.value!)
    if (res.code === 0 && res.data?.list) {
      casinoStore.setPopularBannerGames(res.data.list)
    }
  } catch (error) {
    console.error('Failed to fetch banner games', error)
  } finally {
    loadingPopularBanner.value = false
  }
}



onMounted(async () => {
  if (isChannelPackage && !routeClubId.value) {
    await userInfoStore.ensureChannelDefaultClub().catch((e) => {
      console.warn('[minigame] ensureChannelDefaultClub failed:', e)
    })
  }
  fetchPopularBannerGames()
  minigameStore.preloadMinigameData(routeClubId.value, isGlobalMode.value)
})

onActivated(async () => {
  if (isChannelPackage && !routeClubId.value) {
    await userInfoStore.ensureChannelDefaultClub().catch(console.warn)
  }
  fetchPopularBannerGames()
  if (mahjongGames.value.length === 0) minigameStore.fetchMahjongData(routeClubId.value, isGlobalMode.value)
})

const getPopularGameImage = (game: any, preferSvg: boolean = false): string => {
  const gameType = game.game_type || ''
  const gameApiType = game.game_api_type || ''
  const gameName = game.game_name || ''

  let gameImage = game.game_icon || game.game_url_p || ''

  if (gameName === '麻将胡了') {
    gameImage = mahjong1Svg
  } else if (gameName === '麻将胡了2') {
    gameImage = mahjong2Svg
  } else if (gameName === '德州牛仔' || gameType === 'cow_boy' || gameApiType === 'cow_boy') {
    gameImage = cowboyBlueSvgCasino
  } else if (gameName === 'DB真人' || (gameName && gameName.includes('DB视讯'))) {
    if (preferSvg) {
      gameImage = dbLiveSvg
    }
  } else if (gameName === 'FB体育' || gameApiType === 'fb_sports') {
     gameImage = fbSportsSvg
  } else if ((gameName && gameName.includes('乐游')) || gameApiType === 'leg_poker') {
    gameImage = legPokerSvgCasino
  } else if ((gameName && gameName.includes('开元')) || gameApiType === 'ky_poker') {
     gameImage = kyPokerSvgCasino
  }

  return gameImage
}

const getMahjongGameImage = (game: any): string => {
  const gameApiType = game.game_api_type || "";
  const gameName = (game.game_name || "").toLowerCase();
  const gameType = game.game_type || "";

  let img = "";
  if (gameType === "cow_boy" || gameApiType === "cow_boy") {
    img = cowboyBlueSvg;
  } else if (gameApiType === "ky_poker" || gameName.includes("开元")) {
    img = kyPokerSvg;
  } else if (gameApiType === "leg_poker" || gameName.includes("乐游")) {
    img = legPokerSvg;
  }

  return img || game.game_icon || game.game_url_p || game2;
};

const mahjongBlocks = computed(() => {
  if (mahjongGames.value.length === 0) {
    return [];
  }

  const transformedGames = mahjongGames.value.map((game: any) => {
    const gameImage = getMahjongGameImage(game);
    return {
      title: game.game_name || "",
      desc: game.desc || "",
      img: gameImage,
      gameId: game.id,
      gameApiType: game.game_api_type,
      gameCode: game.game_code,
      gameType: game.game_type,
      originalGame: game,
    };
  });

  const sortedGames = transformedGames.sort((a: any, b: any) => {
    const getOrder = (item: any) => {
      if (item.gameType === "cow_boy" || item.gameApiType === "cow_boy") return 0;
      if (item.gameApiType === "ky_poker") return 1;
      if (item.gameApiType === "leg_poker") return 2;
      if (item.gameApiType === "slots_gpd") return 3;
      return 999;
    };
    return getOrder(a) - getOrder(b);
  });

  const blocks = sortedGames
    .filter((game) => game.img)
    // 隐藏牛仔（德州牛仔）入口。
    .filter((game) => game.gameType !== 'cow_boy' && game.gameApiType !== 'cow_boy')
    .map((game, index) => ({
      key: `mj-api-${index}`,
      title: game.title || game.originalGame?.game_name || "",
      subtitle: game.desc || game.originalGame?.desc || "",
      icon: game2,
      layout: "wide",
      items: [game],
    }));

  return blocks;
});

const handleImageError = (event: Event, item?: any): void => {
  const imgEl = event.target as HTMLImageElement
  imgEl.style.display = 'none'
  const parent = imgEl.parentElement
  if (parent && !parent.querySelector('.app-card-placeholder')) {
    const placeholder = document.createElement('div')
    placeholder.className = 'app-card-placeholder'
    const titleText = item?.title || imgEl.alt || ''
    placeholder.innerHTML = `<span class="placeholder-title">${titleText}</span>`
    parent.appendChild(placeholder)
  }
}

const handleGameClick = (game: any) => {
  if (!game) return

  // 游客仅能预览目录，进入具体游戏前先引导登录。
  if (!requireRealUser(() => handleGameClick(game))) {
    return
  }

  if (game.gameType === 'cow_boy' || game.gameApiType === 'cow_boy' || game.game_type === 'cow_boy' || game.game_api_type === 'cow_boy') {
    showToast(t('UIMineClubCowboyDownloadTip') || '下载牛仔游戏')
    return
  }


  const apiType = game.gameApiType || game.game_api_type;
  const gameType = game.gameType || game.game_type;
  const roomId = game.id || game.gameId || game.game_room_id || 0;

  if (isGlobalMode.value) {
    pendingGameInfo.value = { apiType, gameType, roomId }
    showWalletPopup.value = true
    return
  }

  joinGame(apiType, gameType, roomId, routeClubId.value, reserveWindowForGame(apiType))
}

const handleWalletConfirm = (clubId?: number) => {
  const reserved = pendingGameInfo.value
    ? reserveWindowForGame(pendingGameInfo.value.apiType)
    : null
  showWalletPopup.value = false
  if (!pendingGameInfo.value) {
    releaseGameWindow(reserved)
    return
  }
  const { apiType, gameType, roomId } = pendingGameInfo.value
  joinGame(apiType, gameType, roomId, clubId, reserved)
  pendingGameInfo.value = null
}

const reserveWindowForGame = (apiType: string): ReservedGameWindow => {
  if (apiType === 'real_name' && getDeviceType() === 1) {
    return reserveGameWindow(
      `width=${screen.width},height=${screen.height},scrollbars=yes,resizable=yes,location=yes`,
    )
  }
  return reserveGameWindow()
}

const joinGame = async (
  apiType: string,
  gameType: string,
  roomId = 0,
  clubId?: number,
  reserved: ReservedGameWindow = null,
) => {
  const finishLaunch = beginGameLaunch()
  try {
    const isRealNameGame = apiType === 'real_name'
    const finalGameType = ""
    const deviceType = getDeviceType()
    const finalDeviceType = isRealNameGame ? 2 : deviceType

    const res = await joinCasinoGame({
      game_api_type: apiType,
      game_room_id: roomId,
      game_type: finalGameType,
      device_type: finalDeviceType,
      currency_type: 1,
    }, clubId)
    finishLaunch()

    if (res.code === 0 && res.data) {
      const gameUrl = res.data.url || res.data.game_url
      if (gameUrl) {
        if (!launchGameUrl(reserved, gameUrl, isRealNameGame && deviceType === 1)) {
          releaseGameWindow(reserved)
          if (usesTelegramGameLauncher()) {
            showToast(t('UICasino_ClubNotEnabled'))
          } else {
            gameLaunchStore.openFallback(gameUrl)
          }
        }
      } else {
        releaseGameWindow(reserved)
        showToast(t('UICasino_ClubNotEnabled'))
      }
    } else {
      releaseGameWindow(reserved)
      showToast(res.msg || t('UICasino_ClubNotEnabled'))
    }
  } catch (error: any) {
    finishLaunch()
    releaseGameWindow(reserved)
    showToast(error?.response?.data?.msg || t('UICasino_ClubNotEnabled'))
  }
}
</script>

<template>
  <div class="minigame-page" :style="hideHeader ? {} : pageStyle" :class="{ 'is-embedded': hideHeader }">
    <div class="bg-overlay" aria-hidden="true" v-if="!hideHeader"></div>

    <HeaderBack v-if="!hideHeader" :title="t('UIMiniGame_Title')" @back="handleBack">
      <template #right>
        <div class="action-wrap">
          <TopActionButton
            :name="t('UIGuildFund_RechargeText')"
            :icon="walletIcon"
            icon-alt="wallet"
            @click="router.push('/wallet')"
          />
          <TopActionButton
            :name="t('UIMineMain01')"
            :icon="serviceIcon"
            icon-alt="service"
            @click="handleServiceClick"
          />
        </div>
      </template>
    </HeaderBack>

    <main class="page-content" :class="{ 'is-embedded': hideHeader }">

      <!-- 热门游戏横向滚动条 暂时隐藏，后续可能恢复（删掉 v-if="false" 即可恢复） -->
      <section
        v-if="false"
        class="popular-banner-section"
        v-show="popularBannerGames.length > 0 || loadingPopularBanner"
      >
        <div class="popular-indicator-wrapper">
          <img :src="popularTextIcon" class="popular-text-img" />
        </div>
        <div class="popular-games-scroll">
          <template v-if="popularBannerGames.length > 0">
            <button
              v-for="game in popularBannerGames"
              :key="game.id"
              class="popular-game-item"
              type="button"
              @click="handleGameClick(game)"
            >
              <img
                :src="getPopularGameImage(game, true)"
                class="popular-game-img"
                @error="(e) => (e.target as HTMLImageElement).style.visibility = 'hidden'"
              />
            </button>
          </template>

          <template v-else>
            <div v-for="n in 6" :key="n" class="skeleton-item"></div>
          </template>
        </div>
      </section>


      <div class="category-list">
        <section
          v-for="block in mahjongBlocks"
          :key="block.key"
          class="category-block"
        >
          <div class="category-header">
            <div class="category-title-wrap">
              <img
                :src="block.icon"
                alt=""
                class="category-icon-img"
              />
              <div class="category-text">
                <span class="category-title">{{ block.title }}</span>
                <span class="category-sub">{{ block.subtitle }}</span>
              </div>
            </div>
          </div>
          <div class="game-card-grid-wrapper">
            <div
              class="game-card-grid"
              :class="{ wide: block.layout === 'wide' }"
            >
              <template
                v-for="item in block.items"
                :key="`${block.key}-${item.gameId || item.gameCode || ''}-${item.img || ''}-${item.title || ''}`"
              >
                <button
                  class="app-card"
                  :class="{ wide: block.layout === 'wide' }"
                  type="button"
                  @click="handleGameClick(item)"
                >
                  <div
                    class="app-card-img-wrapper"
                    :class="[{ wide: block.layout === 'wide' }, block.key]"
                  >
                    <img
                      :src="item.img"
                      :alt="item.title || 'item'"
                      class="app-card-img"
                      :class="{ wide: block.layout === 'wide' }"
                      @error="handleImageError($event, item)"
                    />
                  </div>
                  <span v-if="!block.layout && item.title" class="app-card-title">
                    {{ item.title }}
                  </span>
                </button>
              </template>
            </div>
          </div>
        </section>
      </div>
    </main>
    <GameClubSelector
      v-model:show="showWalletPopup"
      @confirm="handleWalletConfirm"
      @cancel="pendingGameInfo = null"
    />
  </div>
</template>

<style scoped lang="scss">
.minigame-page {
  height: 100vh;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
  background-color: #0d121c;
}

.minigame-page.is-embedded {
  height: auto;
  min-height: 100%;
  background: transparent !important;
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 14, 25, 0.45);
  pointer-events: none;
  z-index: 0;
}

.action-wrap {
  display: flex;
  gap: 0.1rem;
  align-items: center;
  margin-right: 0.25rem;
}

.page-content {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  padding: 0 0.2rem 1rem;
}

.page-content.is-embedded {
  padding: 0;
  overflow: visible;
}


.popular-banner-section {
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: flex-start;
  align-items: center;
  gap: 3.544px;
  margin-top: 0.2rem;
  position: relative;
  z-index: 1;
  padding: 0;
  box-sizing: border-box;
  margin-top: 18.373px;
}

.popular-indicator-wrapper {
    display: flex !important;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 100%;
    flex-shrink: 0;
    margin-left: -13px;
    gap: 2px;
}

.popular-text-img {
  width: 38.323px;
  height: 54.793px;
  border-radius: 8.868px;
  object-fit: contain;
}

.popular-games-scroll {
  display: flex;
  flex-direction: row;
  gap: 3.544px;
  overflow-x: auto;
  scrollbar-width: none;
  width: 100%;
  padding: 0;
  margin: 0;
  &::-webkit-scrollbar {
    display: none;
  }
}

.popular-game-item {
  width: 44.643px;
  height: 47.292px;
  flex-shrink: 0;
  border-radius: 10.293px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.15s ease;
  &:active {
    transform: scale(0.95);
  }
}

.popular-game-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10.293px;
}

.skeleton-item {
  width: 44px;
  height: 47px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}


.category-list {
  display: flex;
  flex-direction: column;
  // gap: 0.3rem;
  margin-top: 13.25px;
  width: 100%;
}

.category-block {
  background: transparent;
  border-radius: 0.32rem;
  // padding: 0.15rem 0.15rem 0.4rem;
  box-shadow: none;
  border: none;
  overflow: visible;
}

.category-header {
  display: flex;
  padding-left: 3px;
  align-items: center;
  gap: 4px;
  align-self: stretch;
  margin-bottom: -1px;
  margin-top: 8px;
  padding-bottom: 4px;
  position: relative;
  width: 100%;
  min-height: 24px;
}

.category-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.category-icon-img {
 width: 25.602px;
height: 23.722px;
  object-fit: contain;
}

.category-text {
  display: flex;
  align-items: center;
  gap: 6px;
}

.category-title {
  color: #FFF;
  font-family: "HONOR Sans CN", sans-serif;
  font-size: 16.867px;
  font-weight: 500;
  line-height: 120%;
}

.category-sub {
  color: rgba(255, 255, 255, 0.60);
  font-family: "HONOR Sans CN", sans-serif;
  font-size: 10.133px;
  font-weight: 500;
  line-height: 120%;
  margin-left: 2px;
}

.game-card-grid-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.game-card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.1rem;
  padding: 0.15rem 0 0;
  width: 100%;

  &.wide {
    grid-template-columns: 1fr;
    gap: 0.2rem;
    padding: 0.1rem 0;
  }
}

.app-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  width: 100%;
  padding: 0;
  border-radius: 0.24rem;
  background: transparent;
  border: none;
  transition: transform 0.2s ease, filter 0.2s ease;
  overflow: visible;

  &:active {
    transform: scale(0.95);
    filter: brightness(0.9);
  }

  &.wide {
    height: auto;
    border-radius: 0.4rem;
    overflow: hidden;
  }
}

.app-card-img-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 0.24rem;
  background: transparent;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;

  &.wide {
    aspect-ratio: 350 / 120;
    width: 343.374px;
    // height: 120px;
    // max-width: 100%;
    // border-radius: 0.4rem;
    // box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  }
}

.app-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.24rem;

  &.wide {
    border-radius: 0.4rem;
    object-fit: cover;
  }
}

.app-card-title {
  color: #fff;
  font-size: 0.24rem;
  font-weight: 500;
  text-align: center;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 0.05rem;
  margin-top: 0.05rem;
}
</style>
