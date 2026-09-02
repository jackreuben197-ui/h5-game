<script setup lang="ts">
import {
  ref,
  computed,
  nextTick,
  onMounted,
  onActivated,
  watch,
} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { t, getLocale, textI18n } from '@/i18n'
import { showGameToast } from '@/components/Toast'
import { useCasinoStore } from '@/stores/casino'
import { useGameStore } from '@/stores/game'
import { useLoginModalStore } from '@/stores/loginModal'
import { useChannelBottomMenu } from '@/composables/useChannelBottomMenu'
import { useGameLaunchStore } from '@/stores/gameLaunch'
import {
  reserveGameWindow,
  launchGameUrl,
  releaseGameWindow,
  beginGameLaunch,
  usesTelegramGameLauncher,
  type ReservedGameWindow,
} from '@/utils/externalGameWindow'
import {
  getDeviceType,
  getPopularGamesHome,
  getPopularGamesClub,
  getPopularBannerGamesHome,
  getPopularBannerGamesClub,
  getGamesByCategoryHome,
  getGamesByCategoryClub,
  getGameClubList,
  joinCasinoGame,
  CATEGORY_API_TYPES,
  type ExtendGameRecord,
  type ExtendGameClubListRecord,
  type CategoryKey,
} from '@/api/casino'
import serviceIcon from '@/assets/icons/icon_server.png'
import walletIcon from '@/assets/icons/icon_wallet.png'
import mainBgUrl from '@/assets/images/main_bg.webp'
import GameClubSelector from '@/components/GameClubSelector.vue'

// Assets Imports
import img1 from '@/assets/images/img1.png'
import img2 from '@/assets/images/img2.png'
import iconHotlive from '@/assets/images/minigame-newui/icon_hotlive.png'
import img3 from '@/assets/images/minigame-newui/icon_777.svg'
import img4 from '@/assets/images/img4.png'
import img5 from '@/assets/images/img5.png'
import img6 from '@/assets/images/img6.png'
import img7 from '@/assets/images/img7.png'
import img8 from '@/assets/images/img8.png'
import imgMinigame from '@/assets/images/icon_minigame.png'

// @ts-ignore
import dbEsportsImg from '@/assets/images/minigame-newui/DB电竞.png'

import sideYellowBtn from '@/assets/images/sideyellowbtn.png'
import sideBlueBtn from '@/assets/images/sidebluebtn.png'
import popularTextIcon from '@/assets/images/minigame-newui/populartext.svg'

// @ts-ignore
import dbLiveSvg from '@/assets/images/minigame-newui/DB真人.png'
// @ts-ignore
import fbSportsSvg from '@/assets/images/minigame-newui/FB体育mini.png'
// @ts-ignore
import legPokerSvg from '@/assets/images/minigame-newui/乐游棋牌.png'
// @ts-ignore
import kyPokerSvg from '@/assets/images/minigame-newui/开元棋牌.png'
// @ts-ignore
import cowboyBlueSvg from '@/assets/images/minigame-newui/德州牛仔.png'
// @ts-ignore
import kyPokerWide from '@/assets/images/minigame-newui/mustacheman.png'
// @ts-ignore
import legPokerWide from '@/assets/images/minigame-newui/skinnyman.png'
import minigameBlockIcon from '@/assets/images/minigame-newui/games2.png'

interface GameBlock {
  key: string
  title: string
  subtitle: string
  icon: string
  layout?: string
  items: any[]
}

// ─── Router / Route ───────────────────────────────────────────────────────────
const router = useRouter()
const route = useRoute()
const props = defineProps<{ hideHeader?: boolean; clubId?: number }>()

function handleBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    void router.replace({ name: 'lobby' })
  }
}

const casinoStore = useCasinoStore()
const gameStore = useGameStore()
const loginModalStore = useLoginModalStore()
const gameLaunchStore = useGameLaunchStore()
const { isVersionB } = useChannelBottomMenu()

const isGuest = computed(() => !gameStore.sessionToken)

// Global mode = entered from home/bottom-nav (no club context)
const isGlobalMode = computed(() => {
  if (props.clubId && props.clubId > 0) return false
  const clubId = route.query.clubId
  return !clubId || clubId === '' || clubId === '0'
})

const routeClubId = computed<number | undefined>(() => {
  if (props.clubId && props.clubId > 0) return props.clubId
  const val = route.query.clubId
  if (!val || val === '' || val === '0') return undefined
  const n = parseInt(val as string, 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
})

const isFromHome = computed(() => route.query.fromHome === 'true')
const isFromBottomNav = computed(() => !!route.query.fromBottomNav)

// ─── Page background ─────────────────────────────────────────────────────────
const pageStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

// ─── Category State ───────────────────────────────────────────────────────────
type HotCategoryKey = 'hot' | CategoryKey
const selectedCategory = ref<HotCategoryKey>('hot')
const expandedBlocks = ref<Set<string>>(new Set())

// ─── Data ─────────────────────────────────────────────────────────────────────
const isInitLoading = ref(!casinoStore.hasFetchedInitialData)
const loadingPopularBanner = ref(false)
const loadingGames = ref(false)
const hasTriedBanner = ref(casinoStore.hasFetchedInitialData)

const gameRecords = computed(() => casinoStore.gameRecords)   // all games
const popularGamesByType = computed(() => casinoStore.popularGamesByType)
const popularBannerGames = computed(() => casinoStore.popularBannerGames)
const categoryGames = ref<ExtendGameRecord[]>([]) // games for non-hot category

// ─── Wallet Popup ─────────────────────────────────────────────────────────────
const showWalletPopup = ref(false)
const pendingGame = ref<GameItem | null>(null)

// ─── Game Item type ───────────────────────────────────────────────────────────
interface GameItem {
  title: string
  img: string
  gameId?: number
  gameApiType: string
  gameCode: string
  gameType: string | number
  gameRoomId?: number
  originalGame: ExtendGameRecord
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getHotCategoryByGameApiType = (gameApiType: string): string | null => {
  switch (gameApiType) {
    case 'real_name':
    case 'real_evo':
    case 'real_obo':
    case 'real_pa':
    case 'panda_fblive':
    case 'panda_asg':
      return 'hot-real'
    case 'real_elect':
    case 'panda_pgs':
    case 'slots_pgsoft':
    case 'zf_pgsoft':
    case 'slots_fc':
    case 'slots_cq9':
    case 'slots_fg':
    case 'slots_pa':
    case 'slotsb_jdb':
      return 'hot-slot'
    case 'real_fish':
    case 'sea_jdb':
    case 'panda_jdb':
    case 'slots_jdb':
      return 'hot-fish'
    case 'fb_sports':
    case 'panda_fbs':
    case 'shaba_sport':
    case 'panda_sport':
      return 'hot-sports'
    case 'real_sports':
      return 'hot-esports'
    case 'ky_poker':
    case 'leg_poker':
    case 't1_game':
      return 'hot-minigame'
    default:
      return null
  }
}

const getCategoryByGameApiType = (gameApiType: string): string | null => {
  switch (gameApiType) {
    case 'real_name':
    case 'real_evo':
    case 'real_obo':
    case 'real_pa':
    case 'panda_fblive':
    case 'panda_asg':
      return 'zhenren'
    case 'real_elect':
    case 'panda_pgs':
    case 'slots_pgsoft':
    case 'zf_pgsoft':
    case 'slots_fc':
    case 'slots_cq9':
    case 'slots_fg':
    case 'slots_pa':
    case 'slotsb_jdb':
      return 'dianzi'
    case 'real_fish':
    case 'sea_jdb':
    case 'panda_jdb':
    case 'slots_jdb':
      return 'buyu'
    case 'fb_sports':
    case 'panda_fbs':
    case 'shaba_sport':
    case 'panda_sport':
      return 'tiyu'
    case 'real_sports':
      return 'dianjing'
    case 'leg_poker':
    case 'ky_poker':
    case 't1_game':
      return 'minigame'
    case 'real_lottery':
    case 'panda_game':
    case 'panda_pd':
    case 'slots_gpd':
    case 'cow_boy':
      return null
    case 'go_poker':
      return 'board'
    case 'hn_marbles':
      return 'lottery'
    default:
      return null
  }
}

const getHotCategoryKey = (category: string): string | null => {
  switch (category) {
    case 'zhenren':
      return 'hot-real'
    case 'dianzi':
      return 'hot-slot'
    case 'buyu':
      return 'hot-fish'
    case 'tiyu':
      return 'hot-sports'
    case 'dianjing':
      return 'hot-esports'
    case 'minigame':
      return 'hot-minigame'
    default:
      return null
  }
}

const getCategoryFromBlockKey = (blockKey: string): string | null => {
  switch (blockKey) {
    case 'hot-slot':
      return 'dianzi'
    case 'hot-fish':
      return 'buyu'
    case 'hot-real':
      return 'zhenren'
    case 'hot-sports':
      return 'tiyu'
    case 'hot-esports':
      return 'dianjing'
    case 'hot-minigame':
      return 'minigame'
    default:
      return null
  }
}

const transformGameToItem = (game: any, preferSvg: boolean = false): GameItem => {
  const gameType = game.game_type || ''
  const gameApiType = game.game_api_type || ''
  const gameName = getLocalizedGameName(game.game_name || '')

  let gameImage = game.game_icon || game.game_url_p || ''

  if (gameName === '德州牛仔' || gameType === 'cow_boy' || gameApiType === 'cow_boy') {
    gameImage = cowboyBlueSvg
  } else if (gameName === 'DB真人' || gameName === 'DB Live' || (gameName && gameName.includes('DB视讯'))) {
    if (preferSvg) {
      gameImage = dbLiveSvg
    }
  } else if ((gameName && gameName.includes('乐游')) || gameName === 'LEG Poker' || gameApiType === 'leg_poker') {
    gameImage = legPokerSvg
  } else if ((gameName && gameName.includes('开元')) || gameName === 'KY Poker' || gameApiType === 'ky_poker') {
     gameImage = kyPokerSvg
  }

  return {
    title: gameName,
    img: gameImage,
    gameId: game.id,
    gameApiType: game.game_api_type || '',
    gameCode: game.game_code || '',
    gameType: game.game_type || '',
    gameRoomId: game.id ?? game.game_room_id ?? game.room_id ?? 0,
    originalGame: game,
  }
}

// 小游戏沿用原「小游戏专区」的横幅素材：卡片按整条 banner 展示，而不是方形图标。
const getMinigameWideImage = (item: GameItem): string => {
  const gameName = item.originalGame?.game_name || ''

  if (item.gameApiType === 'ky_poker' || gameName.includes('开元')) {
    return kyPokerWide
  }
  if (item.gameApiType === 'leg_poker' || gameName.includes('乐游')) {
    return legPokerWide
  }

  return item.originalGame?.game_icon || item.originalGame?.game_url_p || minigameBlockIcon
}

const MINIGAME_ORDER: Record<string, number> = {
  ky_poker: 0,
  leg_poker: 1,
  t1_game: 2,
}

// 每款小游戏单独成块（标题 + 整条 banner），与原「小游戏专区」页保持一致。
const buildMinigameBlocks = (games: GameItem[], keyPrefix: string): GameBlock[] =>
  games
    .map((item) => ({ ...item, img: getMinigameWideImage(item) }))
    .sort(
      (a, b) => (MINIGAME_ORDER[a.gameApiType] ?? 999) - (MINIGAME_ORDER[b.gameApiType] ?? 999),
    )
    .map((item, index) => {
      const isChinese = ['cn', 'zh'].includes(getLocale())
      // For non-Chinese locales, use the already-localized title as subtitle
      // to avoid showing raw Chinese server strings
      const rawDesc = (item.originalGame as any)?.desc || ''
      const subtitle = isChinese ? (rawDesc || item.title || '') : (item.title || '')
      return {
        key: `${keyPrefix}-${index}`,
        title: item.title || '',
        subtitle,
        icon: minigameBlockIcon,
        layout: 'wide',
        items: [item],
      }
    })

// Reactive locale — reading this ref inside computed() forces Vue to track
// locale changes and recompute game names when the user switches language.
const _locale = textI18n.locale

const localized = (en: string, cn: string): string => ['cn', 'zh'].includes(_locale.value) ? cn : en

function multilang(key: string, en: string, cn: string): string {
  const translated = t(key)
  if (translated && translated !== key) {
    return translated
  }
  return ['cn', 'zh'].includes(_locale.value) ? cn : en
}

const getLocalizedGameName = (gameName: string): string => {
  if (!gameName) return ''
  if (gameName.includes('开元')) return multilang('UICasino_Game_KYPoker', 'KY Poker', gameName)
  if (gameName.includes('乐游')) return multilang('UICasino_Game_LEGPoker', 'LEG Poker', gameName)
  if (gameName.includes('T1 Game') || gameName.includes('区块链')) return multilang('UICasino_Game_T1Poker', 'T1 Game Blockchain', gameName)
  if (gameName.includes('DB真人') || gameName.includes('DB视讯')) return multilang('UICasino_Game_DBLive', 'DB Live', gameName)
  return gameName
}

const SPORTS_ORDER: Record<string, number> = {
  fb_sports: 0,
  panda_fbs: 0,
  shaba_sport: 1,
  panda_sport: 2,
}

const sortSportsGames = (games: GameItem[]): GameItem[] =>
  [...games].sort(
    (a, b) => (SPORTS_ORDER[a.gameApiType] ?? 999) - (SPORTS_ORDER[b.gameApiType] ?? 999),
  )

const HOT_SLOT_ORDER: Record<string, number> = {
  麻将胡了2: 0,
  麻将胡了: 1,
  少林足球: 2,
  亡灵大盗: 3,
  赏金大对决: 4,
  唐伯虎点秋香: 5,
}

const sortHotSlotGames = (games: GameItem[]): GameItem[] =>
  [...games].sort(
    (a, b) => (HOT_SLOT_ORDER[a.title] ?? 999) - (HOT_SLOT_ORDER[b.title] ?? 999),
  )

const HOT_FISH_ORDER: Record<string, number> = {
  财神捕鱼: 0,
  捕鱼迪斯科: 1,
}

const sortHotFishGames = (games: GameItem[]): GameItem[] =>
  [...games].sort(
    (a, b) => (HOT_FISH_ORDER[a.title] ?? 999) - (HOT_FISH_ORDER[b.title] ?? 999),
  )

const HOT_REAL_ORDER: Record<string, number> = {
  real_name: 0,
  real_obo: 1,
  real_pa: 2,
}

const sortHotRealGames = (games: GameItem[]): GameItem[] => {
  const preferred = games
    .filter((item) => HOT_REAL_ORDER[item.gameApiType] !== undefined)
    .sort((a, b) => HOT_REAL_ORDER[a.gameApiType] - HOT_REAL_ORDER[b.gameApiType])
  const rest = games.filter((item) => HOT_REAL_ORDER[item.gameApiType] === undefined)
  return [...preferred, ...rest]
}

const getPopularGamesForCategory = (categoryKey: string): GameItem[] => {
  const games: any[] = []
  const gamesMap = new Map<string | number, any>()
  const gamesWithoutIdSet = new Set<string>()

  Object.keys(popularGamesByType.value).forEach((gameApiType) => {
    const categoryGames = popularGamesByType.value[gameApiType] || []
    categoryGames.forEach((game: any) => {
      const category = getHotCategoryByGameApiType(gameApiType)
      if (category === categoryKey) {
        const gameId = game.id || game.game_id
        let shouldAdd = false

        if (gameId) {
          if (!gamesMap.has(gameId)) {
            gamesMap.set(gameId, game)
            shouldAdd = true
          }
        } else {
          const compositeKey = `${gameApiType}_${game.game_name || game.game_code || ''}`
          if (!gamesWithoutIdSet.has(compositeKey)) {
            gamesWithoutIdSet.add(compositeKey)
            shouldAdd = true
          }
        }

        if (shouldAdd) {
          games.push(game)
        }
      }
    })
  })

  return games
    .filter((game: any) => {
      const hasImage = !!(game.game_icon || game.game_url_p)
      return hasImage
    })
    .sort((a: any, b: any) => {
      const aIsPopular = a.is_popular === 1 || (a.is_popular_p || 0) > 0 ? 1 : 0
      const bIsPopular = b.is_popular === 1 || (b.is_popular_p || 0) > 0 ? 1 : 0
      if (bIsPopular !== aIsPopular) {
        return bIsPopular - aIsPopular
      }
      if (b.is_popular_p !== a.is_popular_p) {
        return (b.is_popular_p || 0) - (a.is_popular_p || 0)
      }
      return (a.order_sort || 9999) - (b.order_sort || 9999)
    })
    .map((game: any) => transformGameToItem(game))
}

const getCategoryGames = (category: string): GameItem[] => {
  if (category === 'hot') {
    return []
  }

  const hotCategoryKey = getHotCategoryKey(category)
  const popularGames: any[] = []
  const popularGamesMap = new Map<string | number, any>()
  const popularGamesWithoutIdSet = new Set<string>()

  if (hotCategoryKey && Object.keys(popularGamesByType.value).length > 0) {
    Object.keys(popularGamesByType.value).forEach((gameApiType) => {
      const categoryGames = popularGamesByType.value[gameApiType] || []
      categoryGames.forEach((game: any) => {
        const hotCategory = getHotCategoryByGameApiType(gameApiType)
        if (hotCategory === hotCategoryKey) {
          const hasImage = !!(game.game_icon || game.game_url_p)
          const isPopular = game.is_popular === 1 || (game.is_popular_p || 0) > 0
          if (hasImage && isPopular) {
            const gameId = game.id || game.game_id
            let shouldAdd = false

            if (gameId) {
              if (!popularGamesMap.has(gameId)) {
                popularGamesMap.set(gameId, game)
                shouldAdd = true
              }
            } else {
              const compositeKey = `${gameApiType}_${game.game_name || game.game_code || ''}`
              if (!popularGamesWithoutIdSet.has(compositeKey)) {
                popularGamesWithoutIdSet.add(compositeKey)
                shouldAdd = true
              }
            }

            if (shouldAdd) {
              popularGames.push(game)
            }
          }
        }
      })
    })
  }

  const allGamesSource = [...gameRecords.value, ...categoryGames.value]
  const allGames = allGamesSource.filter((game: any) => {
    const gameCategory = getCategoryByGameApiType(game.game_api_type || '')
    return gameCategory === category
  })

  const popularGameIds = new Set(popularGames.map((g) => g.id || g.game_id))
  const popularGameParentIds = new Set(
    popularGames.map((g) => g.parent_id || 0).filter((id) => id > 0)
  )

  const seenGameIds = new Set<number>()

  const otherGames = allGames.filter((game: any) => {
    const gameId = game.id || game.game_id
    const parentId = game.parent_id || 0

    if (gameId && popularGameIds.has(gameId)) {
      return false
    }
    if (parentId > 0 && popularGameIds.has(parentId)) {
      return false
    }
    if (gameId && popularGameParentIds.has(gameId)) {
      return false
    }
    if (gameId && seenGameIds.has(gameId)) {
      return false
    }
    if (gameId) {
      seenGameIds.add(gameId)
    }
    return true
  })

  const sortedPopularGames = popularGames
    .sort((a: any, b: any) => {
      if (b.is_popular_p !== a.is_popular_p) {
        return (b.is_popular_p || 0) - (a.is_popular_p || 0)
      }
      return (a.order_sort || 9999) - (b.order_sort || 9999)
    })
    .map((game: any) => transformGameToItem(game))

  const transformedOtherGames = otherGames
    .map((game: any) => transformGameToItem(game))
    .filter((item) => item.originalGame)

  return [...sortedPopularGames, ...transformedOtherGames]
}

// ─── API calls are now in useCasinoStore ──────────────────────────────────────
async function fetchPopularGames(): Promise<void> {
  await casinoStore.fetchPopularGames(routeClubId.value, isGlobalMode.value)
}

async function fetchPopularBannerGames(): Promise<void> {
  if (casinoStore.popularBannerGames.length === 0) {
    loadingPopularBanner.value = true
  }
  try {
    await casinoStore.fetchPopularBannerGames(routeClubId.value, isGlobalMode.value)
  } finally {
    loadingPopularBanner.value = false
    hasTriedBanner.value = true
  }
}

// ─── API: fetchGamesByCategory ────────────────────────────────────────────────
async function fetchGamesByCategory(cat: CategoryKey): Promise<void> {
  loadingGames.value = true
  categoryGames.value = []
  try {
    const types = CATEGORY_API_TYPES[cat]
    const payload = {
      game_api_type: types,
      device_type: 4,
      search: '',
      limit: 300,
      offset: 0,
      id: 10,
    }
    const res = isGlobalMode.value
      ? await getGamesByCategoryHome(payload)
      : await getGamesByCategoryClub(payload, routeClubId.value!)

    if (res.code === 0 && res.data) {
      categoryGames.value = (res.data.list ?? res.data.records ?? []) as ExtendGameRecord[]
    }
  } catch {
    // keep empty
  } finally {
    loadingGames.value = false
  }
}

// ─── Category watcher ─────────────────────────────────────────────────────────
watch(selectedCategory, async (newCategory, oldCategory) => {
  if (oldCategory && newCategory !== 'hot' && oldCategory !== 'hot') {
    expandedBlocks.value.clear()
  } else if (oldCategory && newCategory === 'hot' && oldCategory !== 'hot') {
    expandedBlocks.value.clear()
  }

  if (newCategory === 'hot') {
    await fetchPopularGames()
  } else {
    await fetchGamesByCategory(newCategory as CategoryKey)
  }
})

// ─── Block expand/collapse logic ─────────────────────────────────────────────
const toggleBlockExpand = async (blockKey: string) => {
  const isExpanded = expandedBlocks.value.has(blockKey)
  if (isExpanded) {
    expandedBlocks.value.delete(blockKey)
    selectedCategory.value = 'hot'
  } else {
    const category = getCategoryFromBlockKey(blockKey)
    if (category) {
      selectedCategory.value = category as CategoryKey
      expandedBlocks.value.add(blockKey)
    }
  }
}

// ─── Computed: categoryBlocks ────────────────────────────────────────────────
const categoryBlocks = computed<GameBlock[]>(() => {
  const hotRealGames = sortHotRealGames(getPopularGamesForCategory('hot-real'))
  const hotSlotGames = sortHotSlotGames(getPopularGamesForCategory('hot-slot'))
  const hotFishGames = sortHotFishGames(getPopularGamesForCategory('hot-fish'))
  const hotSportsGames = sortSportsGames(getPopularGamesForCategory('hot-sports'))
  const hotEsportsGames = getPopularGamesForCategory('hot-esports')
  const hotMinigameGames = getPopularGamesForCategory('hot-minigame')

  const getBlockItems = (
    _blockKey: string,
    defaultGames: any[],
    defaultLimit: number,
  ) => {
    return defaultGames.length > 0 ? defaultGames.slice(0, defaultLimit) : []
  }

  return [
    {
      key: 'hot-real',
      title: t('UICasino_HotLive'),
      subtitle: t('UICasino_SubLive'),
      icon: img2,
      items: getBlockItems('hot-real', hotRealGames, 3),
    },
    {
      key: 'hot-slot',
      title: t('UICasino_HotSlots'),
      subtitle: t('UICasino_SubSlots'),
      icon: img3,
      items: hotSlotGames,
    },
    {
      key: 'hot-fish',
      title: t('UICasino_HotFishing'),
      subtitle: t('UICasino_SubFishing'),
      icon: img5,
      items: hotFishGames,
    },
    {
      key: 'hot-sports',
      title: t('UICasino_HotSports'),
      subtitle: t('UICasino_SubSports'),
      icon: img4,
      items: getBlockItems('hot-sports', hotSportsGames, 3),
    },
    ...buildMinigameBlocks(hotMinigameGames, 'hot-minigame'),
    {
      key: 'hot-esports',
      title: t('UICasino_HotEsports'),
      subtitle: t('UICasino_SubSports'),
      icon: img6,
      layout: 'wide',
      items:
        hotEsportsGames.length > 0
          ? [{ ...hotEsportsGames[0], img: dbEsportsImg }]
          : [{ title: '', img: dbEsportsImg }],
    },
  ]
})

// ─── Derived display blocks ───────────────────────────────────────────────────
const displayBlocks = computed<GameBlock[]>(() => {
  if (selectedCategory.value !== 'hot') {
    if (selectedCategory.value === 'tiyu') {
      const sportsGames = getCategoryGames('tiyu')
      const hotSportsGames = sortSportsGames(
        sportsGames.length > 0 ? sportsGames : getPopularGamesForCategory('hot-sports'),
      )
      const items =
        hotSportsGames.length > 0 ? hotSportsGames : [{ title: '', img: fbSportsSvg }]
      const sportsBlock = {
        key: 'hot-sports',
        title: t('UICasino_HotSports'),
        subtitle: t('UICasino_SubSports'),
        icon: img4,
        items,
      }
      return [sportsBlock]
    }

    if (selectedCategory.value === 'dianjing') {
      const hotEsportsGames = getPopularGamesForCategory('hot-esports')
      const esportsBlock = {
        key: 'hot-esports',
        title: t('UICasino_HotEsports'),
        subtitle: t('UICasino_SubSports'),
        icon: img6,
        layout: 'wide',
        items:
          hotEsportsGames.length > 0
            ? [{ ...hotEsportsGames[0], img: dbEsportsImg }]
            : [{ title: '', img: dbEsportsImg }],
      }
      return esportsBlock.items.length > 0 ? [esportsBlock] : []
    }

    if (selectedCategory.value === 'minigame') {
      return buildMinigameBlocks(getCategoryGames('minigame'), 'minigame')
    }

    const catGames = getCategoryGames(selectedCategory.value)
    if (catGames.length > 0) {
      const categoryInfo: Record<string, any> = {
        zhenren: { title: t('UICasino_TabLive'), subtitle: '', icon: img2 },
        dianzi: { title: t('UICasino_TabSlots'), subtitle: '', icon: img3 },
        buyu: { title: t('UICasino_TabFishing'), subtitle: '', icon: img5 },
        board: { title: t('UICasino_TabCards'), subtitle: '', icon: img7 },
        lottery: { title: t('UICasino_TabLottery'), subtitle: '', icon: img8 },
      }
      const info = categoryInfo[selectedCategory.value]
      if (info) {
        const items =
          selectedCategory.value === 'board' ? catGames.slice(1) : catGames
        return [
          {
            key: `category-${selectedCategory.value}`,
            title: info.title,
            subtitle: info.subtitle,
            icon: info.icon,
            items,
          },
        ]
      }
    }
    return []
  }

  return categoryBlocks.value.filter(
    (block) => block.items && block.items.length > 0,
  )
})

const hasWheelData = computed(() => {
  const hasGameRecords = gameRecords.value.some((g) => getCategoryByGameApiType(g.game_api_type || ''))

  const hasPopularGames =
    Object.keys(popularGamesByType.value).length > 0 &&
    Object.values(popularGamesByType.value).some(
      (games) => games && games.some((g: any) => getCategoryByGameApiType(g.game_api_type || ''))
    )

  const blocks = categoryBlocks.value
  const blocksWithActualGames = blocks.filter((block) => {
    if (block.key === 'hot-sports' || block.key === 'hot-esports') {
      return block.items.some((item) => (item.gameId || item.originalGame) && getCategoryByGameApiType(item.originalGame?.game_api_type || item.gameApiType || ''))
    }
    return block.items && block.items.some((item) => (item.gameId || item.originalGame) && getCategoryByGameApiType(item.originalGame?.game_api_type || item.gameApiType || ''))
  })

  return hasGameRecords || hasPopularGames || blocksWithActualGames.length > 0
})

const hasGames = computed(() => hasWheelData.value)

// ─── Category icon definitions ────────────────────────────────────────────────
const categoryTabs = computed(() => [
  { key: 'hot'      as HotCategoryKey, label: t('UICasino_TabHot'),       icon: '🔥' },
  { key: 'zhenren'  as HotCategoryKey, label: t('UICasino_TabLive'),      icon: '🎭' },
  { key: 'dianzi'   as HotCategoryKey, label: t('UICasino_TabSlots'),     icon: '🎰' },
  { key: 'tiyu'     as HotCategoryKey, label: t('UICasino_TabSports'),    icon: '⚽' },
  { key: 'buyu'     as HotCategoryKey, label: t('UICasino_TabFishing'),   icon: '🎣' },
  { key: 'dianjing' as HotCategoryKey, label: t('UICasino_TabEsports'),   icon: '🎮' },
  { key: 'board'    as HotCategoryKey, label: t('UICasino_TabCards'),     icon: '♟️' },
  { key: 'minigame' as HotCategoryKey, label: t('UICasino_TabMinigames'), icon: '🕹️' },
  { key: 'lottery'  as HotCategoryKey, label: t('UICasino_TabLottery'),   icon: '🎱' },
])

// ─── Game click handler (Section 5) ───────────────────────────────────────────
async function handleGameClick(item: GameItem): Promise<void> {
  const { gameApiType, gameType } = item

  // 游客仅能预览目录，进入具体游戏前先引导登录。
  if (isGuest.value) {
    loginModalStore.open({ mode: 'login' })
    return
  }

  // Step A: Cowboy intercept → show download prompt
  if (gameType === 'cow_boy' || gameApiType === 'cow_boy') {
    showGameToast(t('UICasino_DownloadAppTip'))
    return
  }

  // Step B (Global Mode): fetch club wallets and ask user to pick
  if (isGlobalMode.value) {
    pendingGame.value = item
    showWalletPopup.value = true
    return
  }

  // Step C: Join game directly
  await doJoinGame(item, routeClubId.value, reserveWindowForGame(item))
}

async function handleWalletConfirm(clubId?: number): Promise<void> {
  const reserved = pendingGame.value ? reserveWindowForGame(pendingGame.value) : null
  showWalletPopup.value = false
  if (!pendingGame.value) return
  await doJoinGame(pendingGame.value, clubId, reserved)
  pendingGame.value = null
}

function isDbRealNameGame(item: GameItem): boolean {
  return item.gameApiType === 'real_name' ||
    item.originalGame?.game_name === 'DB真人' ||
    !!(item.originalGame?.game_name?.includes('DB视讯'))
}

function reserveWindowForGame(item: GameItem): ReservedGameWindow {
  if (isDbRealNameGame(item) && getDeviceType() === 1) {
    return reserveGameWindow(
      `width=${screen.width},height=${screen.height},scrollbars=yes,resizable=yes,location=yes`,
    )
  }
  return reserveGameWindow()
}

async function doJoinGame(
  item: GameItem,
  clubId?: number,
  reserved: ReservedGameWindow = null,
): Promise<void> {
  const finishLaunch = beginGameLaunch()
  try {
    const isDbRealName = isDbRealNameGame(item)

    const deviceType = getDeviceType()

    const res = await joinCasinoGame(
      {
        game_api_type: item.gameApiType,
        game_room_id: item.gameRoomId || 0,
        game_type: isDbRealName ? '0' : String(item.gameType),
        amount: 0,
        device_type: isDbRealName ? 2 : deviceType,
        currency_type: 1,
      },
      clubId,
    )
    finishLaunch()
    if (res.code === 0 && res.data) {
      const gameUrl = res.data.url || res.data.game_url
      if (gameUrl) {
        if (!launchGameUrl(reserved, gameUrl, isDbRealName && deviceType === 1)) {
          releaseGameWindow(reserved)
          if (usesTelegramGameLauncher()) {
            showGameToast(t('UICasino_LaunchFail'))
          } else {
            gameLaunchStore.openFallback(gameUrl)
          }
        }
      } else {
        releaseGameWindow(reserved)
        showGameToast(t('UICasino_LaunchFail'))
      }
    } else {
      releaseGameWindow(reserved)
      showGameToast((res.msg as string) || t('UICasino_LaunchFail'))
    }
  } catch (error: any) {
    finishLaunch()
    releaseGameWindow(reserved)
    showGameToast(error?.response?.data?.msg || t('UICasino_LaunchFail'))
  }
}

function handleCardImgError(event: Event, item: GameItem): void {
  const imgEl = event.target as HTMLImageElement
  imgEl.style.display = 'none'
  const parent = imgEl.parentElement
  if (parent && !parent.querySelector('.app-card-placeholder')) {
    const placeholder = document.createElement('div')
    placeholder.className = 'app-card-placeholder'
    const titleText = item.title || ''
    placeholder.innerHTML = `<span class="placeholder-title">${titleText}</span>`
    parent.appendChild(placeholder)
  }
}

// ─── Service handler ──────────────────────────────────────────────────────────
function handleServiceClick(): void {
  showGameToast(t('UIClub_InDeve'))
}

// ─── Category row ─────────────────────────────────────────────────────────────
const iconRowRef = ref<HTMLElement | null>(null)

// 8 категорий с длинными подписями (es/pt/ru) не помещаются в 390px:
// строка скроллится по горизонтали, а выбранная категория подводится к центру.
function centerSelectedCategory(): void {
  const row = iconRowRef.value
  const item = row?.querySelector<HTMLElement>('.icon-item.selected')
  if (!row || !item) return
  const maxLeft = row.scrollWidth - row.clientWidth
  if (maxLeft <= 0) return
  const left = item.offsetLeft - (row.clientWidth - item.offsetWidth) / 2
  row.scrollTo({ left: Math.max(0, Math.min(left, maxLeft)), behavior: 'smooth' })
}

watch(selectedCategory, () => {
  void nextTick(centerSelectedCategory)
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    if (!casinoStore.hasFetchedInitialData) {
      await Promise.allSettled([
        fetchPopularGames(),
        fetchPopularBannerGames(),
      ])
      casinoStore.setHasFetchedInitialData(true)
    } else {
      // Refresh silently in background
      Promise.allSettled([
        fetchPopularGames(),
        fetchPopularBannerGames(),
      ])
    }
  } finally {
    isInitLoading.value = false
  }
  void nextTick(centerSelectedCategory)
})

onActivated(async () => {
  if (gameRecords.value.length === 0) await fetchPopularGames()
  if (!hasTriedBanner.value || casinoStore.popularBannerGames.length === 0) {
    await fetchPopularBannerGames()
  }
})
</script>

<template>
  <div
    class="casino-page room-list-page themeType2"
    :style="hideHeader ? {} : pageStyle"
    :class="{ 'is-embedded': hideHeader, 'room-list-page--embedded': hideHeader }"
  >
    <div class="bg-overlay" aria-hidden="true" v-if="!hideHeader"></div>

    <div class="room-list-stage">
      <!-- ── Header ─────────────────────────────────────────────────── -->
      <HeaderBack v-if="!hideHeader" :title="t('UICasino_Title')" :show-back="!isVersionB" extra-padding @back="handleBack">
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

    <div
      class="casino-content"
      :class="{ 'is-embedded': hideHeader, 'casino-content--with-tabbar': !hideHeader && isVersionB }"
    >
      <!-- ── Popular Banner (horizontal scroll) ─────────────────────── -->
      <!-- 热门游戏横向滚动条 暂时隐藏，后续可能恢复（删掉 v-if="false" 即可恢复） -->
      <section
      v-if="false"
      class="popular-banner-section"
      v-show="popularBannerGames.length > 0 || isInitLoading || loadingPopularBanner"
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
            @click="handleGameClick(transformGameToItem(game, true))"
          >
            <img
              :src="transformGameToItem(game, true).img"
              class="popular-game-img"
              @error="(e) => (e.target as HTMLImageElement).style.visibility = 'hidden'"
            />
          </button>
        </template>
        <!-- Skeleton Loader -->
        <template v-else>
          <div v-for="n in 6" :key="n" class="skeleton-item"></div>
        </template>
      </div>
    </section>

    <!-- ── Category Icon Row ──────────────────────────────────────── -->
    <section
      v-show="hasGames || isInitLoading"
      ref="iconRowRef"
      class="icon-row"
    >
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'hot' }"
        type="button"
        @click="selectedCategory = 'hot'"
      >
        <img :src="img1" :alt="t('UICasino_TabHot')" class="icon-img" />
        <span class="icon-label">{{ t('UICasino_TabHot') }}</span>
      </button>
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'zhenren' }"
        type="button"
        @click="selectedCategory = 'zhenren'"
      >
        <div class="icon-img-wrapper icon-img-wrapper-live">
          <img :src="img2" :alt="t('UICasino_TabLive')" class="icon-img" />
        </div>
        <span class="icon-label">{{ t('UICasino_TabLive') }}</span>
      </button>
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'dianzi' }"
        type="button"
        @click="selectedCategory = 'dianzi'"
      >
        <img :src="img3" :alt="t('UICasino_TabSlots')" class="icon-img" />
        <span class="icon-label">{{ t('UICasino_TabSlots') }}</span>
      </button>
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'tiyu' }"
        type="button"
        @click="selectedCategory = 'tiyu'"
      >
        <img :src="img4" :alt="t('UICasino_TabSports')" class="icon-img" />
        <span class="icon-label">{{ t('UICasino_TabSports') }}</span>
      </button>
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'buyu' }"
        type="button"
        @click="selectedCategory = 'buyu'"
      >
        <img :src="img5" :alt="t('UICasino_TabFishing')" class="icon-img" />
        <span class="icon-label">{{ t('UICasino_TabFishing') }}</span>
      </button>
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'dianjing' }"
        type="button"
        @click="selectedCategory = 'dianjing'"
      >
        <img :src="img6" :alt="t('UICasino_TabEsports')" class="icon-img" />
        <span class="icon-label">{{ t('UICasino_TabEsports') }}</span>
      </button>
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'board' }"
        type="button"
        @click="selectedCategory = 'board'"
      >
        <img :src="img7" :alt="t('UICasino_TabCards')" class="icon-img" />
        <span class="icon-label">{{ t('UICasino_TabCards') }}</span>
      </button>
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'minigame' }"
        type="button"
        @click="selectedCategory = 'minigame'"
      >
        <img :src="imgMinigame" :alt="t('UICasino_TabMinigames')" class="icon-img" />
        <span class="icon-label">{{ t('UICasino_TabMinigames') }}</span>
      </button>
      <!-- 彩票 分类 暂时隐藏，后续可能恢复
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'lottery' }"
        type="button"
        @click="selectedCategory = 'lottery'"
      >
        <img :src="img8" :alt="t('UICasino_TabLottery')" class="icon-img" />
        <span class="icon-label">{{ t('UICasino_TabLottery') }}</span>
      </button>
      -->
    </section>

    <!-- ── Category List ── -->
    <div
      v-if="hasGames"
      class="category-list"
    >
      <section
        v-for="block in displayBlocks"
        :key="block.key"
        class="category-block"
      >
        <div class="category-header">
          <div class="category-title-wrap">
            <div
              v-if="block.icon === img2"
              class="icon-img-wrapper icon-img-wrapper-live"
            >
              <img :src="iconHotlive" alt="" class="category-icon-img" />
            </div>
            <img
              v-else
              :src="block.icon"
              alt=""
              class="category-icon-img"
              :class="{
                'category-icon-small': block.icon === img3,
                'category-icon-contain': block.icon === minigameBlockIcon,
              }"
            />
            <div class="category-text">
              <span class="category-title">{{ block.title }}</span>
              <span class="category-sub">{{ block.subtitle }}</span>
            </div>
          </div>
        </div>
        <div class="game-card-grid-wrapper">
          <button
            v-if="block.key === 'hot-slot' && selectedCategory === 'hot'"
            class="expand-btn-absolute"
            type="button"
            @click="toggleBlockExpand(block.key)"
          >
            <img :src="sideYellowBtn" :alt="t('UICasino_AllGames')" class="expand-btn-img" />
            <span class="expand-btn-text">{{ t('UICasino_AllGames') }}</span>
          </button>
          <button
            v-if="block.key === 'hot-fish' && selectedCategory === 'hot'"
            class="expand-btn-absolute"
            type="button"
            @click="toggleBlockExpand(block.key)"
          >
            <img :src="sideBlueBtn" :alt="t('UICasino_AllGames')" class="expand-btn-img" />
            <span class="expand-btn-text">{{ t('UICasino_AllGames') }}</span>
          </button>
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
                  :class="[
                    { wide: block.layout === 'wide', 'minigame-banner': block.key.includes('minigame') },
                    block.key,
                  ]"
                >
                  <img
                    v-if="item.img"
                    :src="item.img"
                    :alt="item.title || 'item'"
                    class="app-card-img"
                    :class="{ wide: block.layout === 'wide' }"
                    @error="handleCardImgError($event, item)"
                  />
                  <div v-else class="app-card-placeholder">
                    <span class="placeholder-title">{{ item.title }}</span>
                  </div>
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

    <!-- Loading spinner / skeleton -->
    <div v-else-if="isInitLoading" class="loading-grid-wrapper">
      <div class="loading-grid">
        <div v-for="n in 9" :key="n" class="game-skeleton" aria-hidden="true"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="empty-state"
    >
      <span class="empty-icon">🎮</span>
      <p class="empty-text">{{ t('UICasino_NoGames') }}</p>
    </div>

    </div> <!-- End casino-content -->
    </div> <!-- End room-list-stage -->

    <!-- ── Wallet Picker Popup ────────────────────────────────────── -->
    <GameClubSelector
      v-model:show="showWalletPopup"
      @confirm="handleWalletConfirm"
      @cancel="pendingGame = null"
    />
    <MainBottomTab v-if="!hideHeader && isVersionB" />
  </div>
</template>

<style scoped lang="scss">
/* ── Page shell ──────────────────────────────────────────────────────────── */
.casino-page {
  height: var(--app-full-height, 100dvh);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
  background-color: #0d121c;
}

.casino-page.is-embedded {
  height: auto;
  min-height: 100%;
  background: transparent !important;
}

.bg-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: none;
  z-index: 0;
}

.action-wrap {
  display: flex;
  align-items: center;
  gap: 0.26rem;
  margin-right: 0.25rem;
}

/* ── Popular Banner Section ──────────────────────────────────────────────── */
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
    margin-left: -10px;
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
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.32rem;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Category Icon Row ───────────────────────────────────────────────────── */
.icon-row {
  width: 100%;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 0;
  display: flex;
  align-items: flex-start;
  gap: 0.16rem;
  position: relative;
  z-index: 1;
  // Нижний отступ — чтобы свечение выбранной пилюли не срезалось краем скроллера.
  padding: 0.16rem 0.1rem 0.16rem;
  box-sizing: border-box;
  // Длинные подписи (es/pt/ru) не влезают восьмёркой в 390px: строка едет вбок,
  // а не сжимается и не режет последний пункт. Скроллбар скрыт.
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.casino-page.is-embedded .icon-row {
  margin-top: 0;
}

.icon-item {
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  color: #dfe8f3;
  font-size: 0.72rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
  // Короткие подписи (cn/zh) по-прежнему укладываются в один экран без скролла;
  // длинные переносятся в две строки внутри max-width, а не растягивают пункт.
  flex: 1 0 auto;
  min-width: 0.95rem;
  max-width: 1.7rem;
  height: auto;
  &:active {
    transform: scale(0.95);
  }
}

.icon-img {
  width: 0.72rem;
  height: 0.72rem;
  object-fit: contain;
  object-position: center;
  display: block;
  margin: 0 auto;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.35));
  transition:
    transform 0.25s ease,
    filter 0.25s ease;
}

.icon-img-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-img-wrapper-live .category-icon-img {
 width: 20px;
  height: 20px;
  flex-shrink: 0;
  object-fit: contain;
}

.icon-label {
  text-align: center;
  width: 100%;
  display: block;
  line-height: 1.1;
  font-size: 10px;
  transition:
    box-shadow 0.25s ease,
    border-color 0.25s ease,
    transform 0.25s ease;
}

.icon-item.selected {
  transform: translateY(-2px);
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4));
  gap: 0.8px;
  position: relative;
}

.icon-item.selected::before {
  --glow-width: 1.35rem;
  --glow-height: 1.15rem;
  --glow-offset-top: 0.-12rem;
  content: '';
  position: absolute;
  top: var(--glow-offset-top);
  left: 50%;
  width: var(--glow-width);
  height: var(--glow-height);
  transform: translateX(-50%);
  border-radius: 50%;
  z-index: -1;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 122, 58, 0.42) 0%,
    rgba(255, 87, 8, 0.18) 45%,
    rgba(255, 87, 8, 0) 75%
  );
  pointer-events: none;
}

.icon-item.selected .icon-img {
  transform: scale(1.12);
  filter:
    drop-shadow(0 0 4px rgba(205, 170, 154, 0.511))
    drop-shadow(0 3px 20px rgba(255, 87, 8, 0.5));
}

.icon-item.selected .icon-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background:
    radial-gradient(120% 140% at 50% -20%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 60%),
    linear-gradient(180deg, #ff7a3a 0%, #ff5708 58%, #ec4a00 100%);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 50px;
  box-shadow:
    0 1px 6px rgba(255, 87, 8, 0.55),
    0 4px 14px rgba(255, 87, 8, 0.35),
    0 8px 24px rgba(255, 87, 8, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.5),
    inset 0 -10px 6px rgba(180, 52, 0, 0.35);
  // Длинная подпись переносится внутри пилюли, иначе она вылезает на соседние пункты.
  white-space: normal;
  transform: scale(0.85);
  padding-left: 0.16rem;
  padding-bottom: 0.16rem;
}

.casino-content {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
}

.casino-content.is-embedded {
  overflow: visible;
}

.casino-content--with-tabbar {
  padding-bottom: calc(3.0rem + env(safe-area-inset-bottom)) !important;
}

/* ── Category List ───────────────────────────────────────────────────────── */
.category-list {
  width: 100%;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 0.05rem;
  overflow: visible;
  position: relative;
  z-index: 1;
  padding: 0 0.1rem 0.15rem;
  box-sizing: border-box;
}

.category-block {
  background: transparent;
  border-radius: 0.32rem;
  padding: 0.12rem 0.05rem 0.08rem;
  box-shadow: none;
  border: none;
  overflow: visible;
}

.category-header {
  display: flex;
  padding-left: 3.012px;
  align-items: center;
  gap: 4.217px;
  align-self: stretch;
  margin-bottom: 6px;
  margin-top: 4px;
  padding-bottom: 0;
  margin-left: 0;
}

.category-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.05rem;
}

.category-text {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.35rem;
}

.category-title {
  color: #FFF;
  font-feature-settings: 'liga' off, 'clig' off;
  font-family: "HONOR Sans CN";
  font-size: 16.867px;
  font-style: normal;
  font-weight: 500;
  line-height: 120%;
}

.category-sub {
  color: rgba(255, 255, 255, 0.60);
  font-feature-settings: 'liga' off, 'clig' off;
  font-family: "HONOR Sans CN";
  font-size: 8.133px;
  font-style: normal;
  font-weight: 500;
  line-height: 120%;
}

.expand-btn {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, opacity 0.2s ease;
  flex-shrink: 0;
  margin-left: auto;
}

.expand-btn-absolute {
  position: absolute;
  right: -12px;
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
  z-index: 10;
  &:active {
    transform: scale(0.95);
    opacity: 0.8;
  }
}

.expand-btn-text {
  position: absolute;
  color: #fff;
  font-size: 0.24rem;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: 0.02rem;
  pointer-events: none;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  white-space: nowrap;
}

.expand-btn-img {
  width: auto;
  height: 1.6rem;
  object-fit: contain;
  display: block;
}

.category-icon-img {
  width: 30px;
  height: 30px;
  border-radius: 0.2rem;
  object-fit: cover;
  box-shadow: none;
}

.category-icon-small {
  width: 0.80rem;
  object-fit: contain;
  height: 0.80rem;
}

.game-card-grid-wrapper {
  position: relative;
}

.game-card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.18rem;
  margin-bottom: 0;
}

.game-card-grid.wide {
  grid-template-columns: 1fr;
  gap: 0.9rem;
}

.app-card {
  border: none;
  border-radius: 0.36rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  background: transparent;
}

.app-card.wide {
  padding: 0;
  border-radius: 0.36rem;
  overflow: visible;
  align-items: flex-start;
  border: none;
  box-shadow: none;
  position: relative;
  width: 100%;
}

.app-card-img-wrapper {
  position: relative;
  width: 100%;
  height: auto;
  aspect-ratio: 106.627 / 112.952;
  border-radius: 0.36rem;
  overflow: hidden;
}

.app-card-img-wrapper.wide {
  width: 100%;
  height: clamp(150px, 8vw, 200px);
  overflow: hidden;
  position: relative;
  border-radius: 0.36rem;
  display: block;
}

.app-card-img-wrapper.wide.minigame-banner {
  height: auto;
  aspect-ratio: auto;
  border-radius: 0.4rem;

  .app-card-img.wide {
    height: auto;
    object-fit: contain;
    border-radius: 0.4rem;
    display: block;
  }
}

.category-icon-contain {
  object-fit: contain;
  border-radius: 0;
}

.app-card-img {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.app-card-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 0.36rem;
  background: linear-gradient(135deg, rgba(45, 52, 65, 0.95) 0%, rgba(20, 24, 32, 0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.15rem;
  box-sizing: border-box;
  text-align: center;
}

.placeholder-title {
  font-size: 0.32rem;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 600;
  line-height: 1.25;
  word-break: break-word;
}

.app-card-img.wide {
  width: 100%;
  height: 100%;
  object-fit: fill;
}

.app-card-title {
  display: none;
}

/* ── Loading Skeleton & Empty States ────────────────────────────────────── */
.loading-grid-wrapper {
  width: 100%;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
  padding: 0.4rem;
  position: relative;
  z-index: 1;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.2rem;
}

.game-skeleton {
  aspect-ratio: 1;
  border-radius: 0.2rem;
  background: linear-gradient(90deg,
    rgba(255,255,255,0.06) 25%,
    rgba(255,255,255,0.12) 50%,
    rgba(255,255,255,0.06) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 2rem 0;
  position: relative;
  z-index: 1;

  .empty-icon { font-size: 1.2rem; }
  .empty-text {
    font-size: 0.3rem;
    color: rgba(255,255,255,0.4);
  }
}

/* ── Responsive adjustments ──────────────────────────────────────────────── */
@media (max-width: 375px) {
  .icon-row {
    gap: 1px;
  }
  .icon-img {
    width: 0.64rem;
    height: 0.64rem;
  }
  .icon-item {
    font-size: 0.68rem;
  }
  .expand-btn-absolute {
    right: -8px;
  }
}

@media (min-width: 600px) {
  .casino-page:not(.is-embedded) {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    min-height: 100dvh;
  }

  .casino-content {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    height: calc(var(--content-stage-height, 1024px) - 112px);
    overflow-y: auto;
  }

  .popular-banner-section {
    max-width: 480px;
    margin: 16px auto 0;
    padding: 0 4px;
    gap: 6px;
  }

  .popular-indicator-wrapper {
    margin-left: 0;
  }

  .popular-text-img {
    width: 34px;
    height: 46px;
  }

  .popular-games-scroll {
    gap: 6px;
  }

  .popular-game-item {
    width: 44px;
    height: 48px;
    border-radius: 10px;
  }

  .icon-row {
    max-width: 480px;
    gap: 4px;
    padding: 14px 4px 0;
    margin: 0 auto;
    grid-template-columns: repeat(8, 1fr);
  }

  .icon-img {
    width: 34px;
    height: 34px;
  }

  .icon-label {
    font-size: 11px;
    margin-top: 3px;
  }

  .category-list {
    max-width: 480px;
    padding: 0 4px 40px;
    margin: 14px auto 0;
    gap: 12px;
  }

  .category-header {
    margin-bottom: 8px;
  }

  .category-icon-img {
    width: 24px;
    height: 24px;
  }

  .category-title {
    font-size: 17px;
  }

  .category-sub {
    font-size: 11px;
  }

  .game-card-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .app-card-img-wrapper {
    border-radius: 16px;
    aspect-ratio: 140 / 140;
  }

  .loading-grid-wrapper {
    max-width: 480px;
    padding: 16px 4px;
  }

  .loading-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
}
</style>

<style lang="scss">
:root[data-theme='light'] .casino-page {
  color: rgba(15, 8, 8, 0.85);

  &:not(.is-embedded) {
    background-color: #f3f4f6;
    background-image: url('@/assets/images/main_bg_light.webp') !important;
  }

  .back-trigger,
  .back-icon {
    color: rgba(0, 0, 0, 1);
  }

  .title {
    text-shadow: none;
  }

  .icon-item {
    color: rgba(15, 8, 8, 0.85);
    text-shadow: none;
  }

  .icon-img {
    filter: none;
  }

  .category-title {
    color: rgba(15, 8, 8, 0.85);
  }

  .category-sub {
    color: rgba(0, 0, 0, 0.6);
  }

  .skeleton-item,
  .game-skeleton {
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.04) 25%,
      rgba(0, 0, 0, 0.08) 50%,
      rgba(0, 0, 0, 0.04) 75%
    );
    background-size: 200% 100%;
  }

  .empty-state .empty-text {
    color: rgba(0, 0, 0, 0.45);
  }
}
</style>
