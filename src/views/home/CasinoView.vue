<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onActivated,
  watch,
} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { t } from '@/i18n'
import { showGameToast } from '@/components/Toast'
import { useCasinoStore } from '@/stores/casino'
import { useGameStore } from '@/stores/game'
import { useLoginModalStore } from '@/stores/loginModal'
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

// @ts-ignore
import fbSportsImg from '@/assets/images/minigame-newui/FB体育.png'
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
import mahjong1Svg from '@/assets/images/minigame-newui/麻将胡了.png'
// @ts-ignore
import mahjong2Svg from '@/assets/images/minigame-newui/麻将胡了2.png'

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

const casinoStore = useCasinoStore()
const gameStore = useGameStore()
const loginModalStore = useLoginModalStore()

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
    case 'panda_jdb':
    case 'slots_jdb':
      return 'hot-fish'
    case 'fb_sports':
    case 'panda_fbs':
      return 'hot-sports'
    case 'real_sports':
      return 'hot-esports'
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
    case 'panda_jdb':
    case 'slots_jdb':
      return 'buyu'
    case 'fb_sports':
    case 'panda_fbs':
      return 'tiyu'
    case 'real_sports':
      return 'dianjing'
    case 'real_lottery':
    case 'panda_game':
    case 'panda_pd':
    case 'slots_gpd':
    case 'leg_poker':
    case 'ky_poker':
    case 't1_game':
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
    default:
      return null
  }
}

const transformGameToItem = (game: any, preferSvg: boolean = false): GameItem => {
  const gameType = game.game_type || ''
  const gameApiType = game.game_api_type || ''
  const gameName = game.game_name || ''

  let gameImage = game.game_icon || game.game_url_p || ''

  if (gameName === '麻将胡了') {
    gameImage = mahjong1Svg
  } else if (gameName === '麻将胡了2') {
    gameImage = mahjong2Svg
  } else if (gameName === '德州牛仔' || gameType === 'cow_boy' || gameApiType === 'cow_boy') {
    gameImage = cowboyBlueSvg
  } else if (gameName === 'DB真人' || (gameName && gameName.includes('DB视讯'))) {
    if (preferSvg) {
      gameImage = dbLiveSvg
    }
  } else if (gameName === 'FB体育' || gameApiType === 'fb_sports') {
     gameImage = fbSportsSvg
  } else if ((gameName && gameName.includes('乐游')) || gameApiType === 'leg_poker') {
    gameImage = legPokerSvg
  } else if ((gameName && gameName.includes('开元')) || gameApiType === 'ky_poker') {
     gameImage = kyPokerSvg
  }

  return {
    title: game.game_name || '',
    img: gameImage,
    gameId: game.id,
    gameApiType: game.game_api_type || '',
    gameCode: game.game_code || '',
    gameType: game.game_type || '',
    gameRoomId: game.id ?? game.game_room_id ?? game.room_id ?? 0,
    originalGame: game,
  }
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
  const hotRealGames = getPopularGamesForCategory('hot-real')
  const hotSlotGames = getPopularGamesForCategory('hot-slot')
  const hotFishGames = getPopularGamesForCategory('hot-fish')
  const hotSportsGames = getPopularGamesForCategory('hot-sports')
  const hotEsportsGames = getPopularGamesForCategory('hot-esports')

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
      title: '热门真人',
      subtitle: '性感荷官 倾情演绎',
      icon: img2,
      items: getBlockItems('hot-real', hotRealGames, 3),
    },
    {
      key: 'hot-slot',
      title: '热门电子',
      subtitle: '火爆游戏 轻松爆奖',
      icon: img3,
      items: getBlockItems('hot-slot', hotSlotGames, 3),
    },
    {
      key: 'hot-fish',
      title: '热门捕鱼',
      subtitle: '经典捕鱼 轻松爆奖',
      icon: img5,
      items: getBlockItems('hot-fish', hotFishGames, 3),
    },
    {
      key: 'hot-sports',
      title: '热门体育',
      subtitle: 'SPORTS',
      icon: img4,
      layout: 'wide',
      items:
        hotSportsGames.length > 0
          ? [{ ...hotSportsGames[0], img: fbSportsImg }]
          : [{ title: '', img: fbSportsImg }],
    },
    {
      key: 'hot-esports',
      title: '热门电竞',
      subtitle: 'ESPORTS',
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
      const hotSportsGames = getPopularGamesForCategory('hot-sports')
      const sportsBlock = {
        key: 'hot-sports',
        title: '热门体育',
        subtitle: 'SPORTS',
        icon: img4,
        layout: 'wide',
        items:
          hotSportsGames.length > 0
            ? [{ ...hotSportsGames[0], img: fbSportsImg }]
            : [{ title: '', img: fbSportsImg }],
      }
      return sportsBlock.items.length > 0 ? [sportsBlock] : []
    }

    if (selectedCategory.value === 'dianjing') {
      const hotEsportsGames = getPopularGamesForCategory('hot-esports')
      const esportsBlock = {
        key: 'hot-esports',
        title: '热门电竞',
        subtitle: 'ESPORTS',
        icon: img6,
        layout: 'wide',
        items:
          hotEsportsGames.length > 0
            ? [{ ...hotEsportsGames[0], img: dbEsportsImg }]
            : [{ title: '', img: dbEsportsImg }],
      }
      return esportsBlock.items.length > 0 ? [esportsBlock] : []
    }

    const catGames = getCategoryGames(selectedCategory.value)
    if (catGames.length > 0) {
      const categoryInfo: Record<string, any> = {
        zhenren: { title: '真人', subtitle: '', icon: img2 },
        dianzi: { title: '电子', subtitle: '', icon: img3 },
        buyu: { title: '捕鱼', subtitle: '', icon: img5 },
        board: { title: '棋牌', subtitle: '', icon: img7 },
        lottery: { title: '彩票', subtitle: '', icon: img8 },
      }
      const info = categoryInfo[selectedCategory.value]
      if (info) {
        return [
          {
            key: `category-${selectedCategory.value}`,
            title: info.title,
            subtitle: info.subtitle,
            icon: info.icon,
            items: catGames,
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
  { key: 'hot'      as HotCategoryKey, label: '热门',  icon: '🔥' },
  { key: 'zhenren'  as HotCategoryKey, label: '真人',  icon: '🎭' },
  { key: 'dianzi'   as HotCategoryKey, label: '电子',  icon: '🎰' },
  { key: 'tiyu'     as HotCategoryKey, label: '体育',  icon: '⚽' },
  { key: 'buyu'     as HotCategoryKey, label: '捕鱼',  icon: '🎣' },
  { key: 'dianjing' as HotCategoryKey, label: '电竞',  icon: '🎮' },
  { key: 'board'    as HotCategoryKey, label: '棋牌',  icon: '♟️' },
  { key: 'lottery'  as HotCategoryKey, label: '彩票',  icon: '🎱' },
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
    showGameToast('请下载客户端APP获取完整版本')
    return
  }

  // Step B (Global Mode): fetch club wallets and ask user to pick
  if (isGlobalMode.value) {
    pendingGame.value = item
    showWalletPopup.value = true
    return
  }

  // Step C: Join game directly
  await doJoinGame(item, routeClubId.value)
}

async function handleWalletConfirm(clubId?: number): Promise<void> {
  showWalletPopup.value = false
  if (!pendingGame.value) return
  await doJoinGame(pendingGame.value, clubId)
  pendingGame.value = null
}

async function doJoinGame(item: GameItem, clubId?: number): Promise<void> {
  try {
    const isDbRealName = item.gameApiType === 'real_name' ||
      item.originalGame?.game_name === 'DB真人' ||
      !!(item.originalGame?.game_name?.includes('DB视讯'))

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
    if (res.code === 0 && res.data) {
      const gameUrl = res.data.url || res.data.game_url
      if (gameUrl) {
        if (isDbRealName && deviceType === 1) {
          const width = screen.width;
          const height = screen.height;
          const windowFeatures = `width=${width},height=${height},scrollbars=yes,resizable=yes,location=yes`;
          window.open(gameUrl, '_blank', windowFeatures)
        } else {
          window.open(gameUrl, '_blank', 'noopener,noreferrer')
        }
      } else {
        showGameToast('游戏跳转失败，请稍后重试')
      }
    } else {
      showGameToast((res.msg as string) || '游戏跳转失败，请稍后重试')
    }
  } catch (error: any) {
    showGameToast(error?.response?.data?.msg || '游戏跳转失败，请稍后重试')
  }
}

// ─── Service handler ──────────────────────────────────────────────────────────
function handleServiceClick(): void {
  showGameToast(t('UIMineMain01') + '开发中')
}

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
})

onActivated(async () => {
  if (gameRecords.value.length === 0) await fetchPopularGames()
  if (!hasTriedBanner.value || casinoStore.popularBannerGames.length === 0) {
    await fetchPopularBannerGames()
  }
})
</script>

<template>
  <div class="casino-page" :style="hideHeader ? {} : pageStyle" :class="{ 'is-embedded': hideHeader }">
    <div class="bg-overlay" aria-hidden="true" v-if="!hideHeader"></div>

    <!-- ── Header ─────────────────────────────────────────────────── -->
    <HeaderBack v-if="!hideHeader" :title="t('UIHomeMinigameArea')">
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

    <div class="casino-content" :class="{ 'is-embedded': hideHeader }">
      <!-- ── Popular Banner (horizontal scroll) ─────────────────────── -->
      <section
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
      class="icon-row"
    >
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'hot' }"
        type="button"
        @click="selectedCategory = 'hot'"
      >
        <img :src="img1" alt="热门" class="icon-img" />
        <span class="icon-label">热门</span>
      </button>
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'zhenren' }"
        type="button"
        @click="selectedCategory = 'zhenren'"
      >
        <div class="icon-img-wrapper icon-img-wrapper-live">
          <img :src="img2" alt="真人" class="icon-img" />
        </div>
        <span class="icon-label">真人</span>
      </button>
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'dianzi' }"
        type="button"
        @click="selectedCategory = 'dianzi'"
      >
        <img :src="img3" alt="电子" class="icon-img" />
        <span class="icon-label">电子</span>
      </button>
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'tiyu' }"
        type="button"
        @click="selectedCategory = 'tiyu'"
      >
        <img :src="img4" alt="体育" class="icon-img" />
        <span class="icon-label">体育</span>
      </button>
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'buyu' }"
        type="button"
        @click="selectedCategory = 'buyu'"
      >
        <img :src="img5" alt="捕鱼" class="icon-img" />
        <span class="icon-label">捕鱼</span>
      </button>
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'dianjing' }"
        type="button"
        @click="selectedCategory = 'dianjing'"
      >
        <img :src="img6" alt="电竞" class="icon-img" />
        <span class="icon-label">电竞</span>
      </button>
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'board' }"
        type="button"
        @click="selectedCategory = 'board'"
      >
        <img :src="img7" alt="棋牌" class="icon-img" />
        <span class="icon-label">棋牌</span>
      </button>
      <button
        class="icon-item"
        :class="{ selected: selectedCategory === 'lottery' }"
        type="button"
        @click="selectedCategory = 'lottery'"
      >
        <img :src="img8" alt="彩票" class="icon-img" />
        <span class="icon-label">彩票</span>
      </button>
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
              :class="{ 'category-icon-small': block.icon === img3 }"
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
      <p class="empty-text">暂无游戏</p>
    </div>

    </div> <!-- End casino-content -->

    <!-- ── Wallet Picker Popup ────────────────────────────────────── -->
    <GameClubSelector
      v-model:show="showWalletPopup"
      @confirm="handleWalletConfirm"
      @cancel="pendingGame = null"
    />
  </div>
</template>

<style scoped lang="scss">
/* ── Page shell ──────────────────────────────────────────────────────────── */
.casino-page {
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

.casino-page.is-embedded {
  height: auto;
  min-height: 100%;
  background: transparent !important;
}

.bg-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 15% 92%, rgba(255, 173, 212, 0.22), transparent 34%),
    radial-gradient(circle at 88% 84%, rgba(102, 227, 255, 0.18), transparent 34%),
    radial-gradient(circle at 50% 56%, rgba(255, 255, 255, 0.06), transparent 48%);
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
  margin-top: 0.5rem;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  align-items: center;
  justify-items: center;
  gap: 2px;
  position: relative;
  z-index: 1;
  padding: 0 0.1rem;
  box-sizing: border-box;
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
  width: 100%;
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
}

.icon-item.selected {
  transform: translateY(-2px);
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4));
  gap: 0.8px;
}

.icon-item.selected .icon-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: #ff5708;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50px;
  box-shadow:
    -14px -177px 49px rgba(212, 201, 201, 0.02),
    -8px -113px 45px rgba(255, 255, 255, 0.13),
    -5px -63px 38px rgba(255, 255, 255, 0.44),
    -2px -28px 28px rgba(255, 255, 255, 0.74),
    -1px -6px 15px rgba(255, 255, 255, 0.85);
  white-space: nowrap;
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

/* ── Category List ───────────────────────────────────────────────────────── */
.category-list {
  width: 100%;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 0.15rem;
  overflow: visible;
  position: relative;
  z-index: 1;
  padding: 0 0.1rem;
  box-sizing: border-box;
}

.category-block {
  background: transparent;
  border-radius: 0.32rem;
  padding: 0.45rem 0.15rem 0.4rem;
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
  margin-bottom: -1px;
  margin-top: 8px;
  padding-bottom: 4px;
  margin-left: -0.50rem;
}

.category-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.05rem;
}

.category-text {
  display: flex;
  flex-direction: row;
  align-items: baseline;
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
  right: -30px;
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
  gap: 0.3rem;
  margin-bottom: -14px;
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
  width: 106.627px;
height: 112.952px;
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

.app-card-img {
  width: 100%;
  height: auto;
  object-fit: cover;
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
    right: -20px;
  }
}
</style>
