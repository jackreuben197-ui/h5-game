<script setup lang="ts">
import { usePlatformDiamondVisibility } from '@/composables/usePlatformDiamondVisibility'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import clubDetailButtonIconDark from '@/assets/icons/img_club_detail_button.png'
import clubDetailButtonIconLight from '@/assets/icons/img_club_detail_button_light.svg'
import { theme } from '@/utils/theme'
import { useRouter } from 'vue-router'
import type { RoomRecord } from '@/api/models/roomcenter'
import StorageKey from '@/constants/storageKey'
import { joinCasinoGame, getDeviceType } from '@/api/casino'
import { useGameLaunchStore } from '@/stores/gameLaunch'
import {
  reserveGameWindow,
  launchGameUrl,
  releaseGameWindow,
  beginGameLaunch,
  usesTelegramGameLauncher,
  type ReservedGameWindow,
} from '@/utils/externalGameWindow'
import homeHeaderFallback from '@/assets/images/home_header_large.png'
import { useMttListStore } from '@/stores/mttList'
import { useRoomListStore } from '@/stores/roomList'
import { type ClubInfo, useUserInfoStore } from '@/stores/userInfo'
import { useAppConfigStore } from '@/stores/appConfig'
import { t } from '@/i18n'
import { localStore } from '@/utils/localStore'
import { useLobbyBannerImages } from '@/composables/useLobbyBannerImages'
import { useHomeAnnouncement } from '@/composables/useHomeAnnouncement'
import { checkIsShowForClubAndTribe } from '@/utils/roomVisibility'
import { filterVisibleMttRecords } from '@/utils/mttVisibility'
import { showGameToast } from '@/components/Toast'
import { useCasinoStore } from '@/stores/casino'
import GameClubSelector from '@/components/GameClubSelector.vue'
import HomeBannerSwiper from '@/components/HomeBannerSwiper.vue'
import ChannelClubInfoPanel from '@/components/Club/ChannelClubInfoPanel.vue'
import HomeTopBar from '@/components/HomeTopBar.vue'
import { useGameStore } from '@/stores/game'
import PokerGameList from '@/views/home/gameList.vue'
import CasinoView from '@/views/home/CasinoView.vue'
import { useChannelBottomMenu } from '@/composables/useChannelBottomMenu'
import { isChannelPackageHost } from '@/utils/channelPackage'
import { getCowboyRoomListApi } from '@/api/gc'
import { requireRealUser } from '@/session/realUserGate'
import { ensureExperienceSession } from '@/session/experienceSession'

import imgPa from '@/assets/images/minigame-newui/pa.svg'
import imgMahjong from '@/assets/images/minigame-newui/ma.svg'
import imgFb from '@/assets/images/minigame-newui/fb.svg'
import imgCowboy from '@/assets/images/minigame-newui/sg.svg'
import imgPaPc from '@/assets/images/minigame-newui/pc_pa.png'
import imgMahjongPc from '@/assets/images/minigame-newui/pc_ma.png'
import imgFbPc from '@/assets/images/minigame-newui/pc_fb.png'

const isLightTheme = computed(() => theme.value === 'light')
const clubDetailButtonIcon = computed(() =>
  isLightTheme.value ? clubDetailButtonIconLight : clubDetailButtonIconDark,
)

const popularBannerGamesStatic = [
  {
    name: 'PA真人',
    svg: imgPa,
    svgPc: imgPaPc,
    gameApiType: 'pa_live',
    titleKey: 'UICasino_Game_PALive',
    subtitleKeys: ['UICasino_Game_PALiveTip1', 'UICasino_Game_PALiveTip2'],
  },
  {
    name: '麻将胡了',
    svg: imgMahjong,
    svgPc: imgMahjongPc,
    gameApiType: 'mahjong',
    titleKey: 'UICasino_Game_Mahjong',
    subtitleKeys: ['UICasino_Game_MahjongTip1', 'UICasino_Game_MahjongTip2'],
  },
  {
    name: 'FB体育',
    svg: imgFb,
    svgPc: imgFbPc,
    gameApiType: 'fb_sports',
    titleKey: 'UICasino_Game_FBSports',
    subtitleKeys: ['UICasino_Game_FBSportsTip1', 'UICasino_Game_FBSportsTip2'],
  },
  {
    name: '德州牛仔',
    svg: imgCowboy,
    svgPc: '',
    gameApiType: 'cow_boy',
    titleKey: 'UICasino_Game_Cowboy',
    subtitleKeys: [] as string[],
  },
]

const router = useRouter()
const userInfoStore = useUserInfoStore()

const roomListStore = useRoomListStore()
const mttListStore = useMttListStore()
const casinoStore = useCasinoStore()
const appConfigStore = useAppConfigStore()
const gameStore = useGameStore()
const gameLaunchStore = useGameLaunchStore()
const displayPlatformDiamond = usePlatformDiamondVisibility()
const { isChannelPackage, isVersionB } = useChannelBottomMenu()

const noticeScrollRef = ref<HTMLElement | null>(null)
const noticeItemRef = ref<HTMLElement | null>(null)
const shouldScrollNotice = ref(false)
const noticeDistancePx = ref(0)
const noticeDurationSec = ref(0)

const NOTICE_SPEED_PX_PER_SEC = 40
const NOTICE_GAP_PX = 48

let noticeResizeObserver: ResizeObserver | null = null

const showGameClubSelector = ref(false)
const pendingGameInfo = ref<{ apiType: string; gameType: string; roomId: number } | null>(null)

const activeBannerGames = computed(() => {
  const apiGames = casinoStore.popularBannerGames || []
  // 临时隐藏牛仔（德州牛仔）入口。
  return popularBannerGamesStatic
    .filter((staticGame) => staticGame.gameApiType !== 'cow_boy')
    .map((staticGame) => {
      let matched = apiGames.find((g) => {
        if (staticGame.name === 'PA真人') {
          return (
            g.game_name?.includes('PA') ||
            g.game_api_type === 'pa_live' ||
            g.game_name?.includes('DB视讯') ||
            g.game_name === 'DB真人'
          )
        }
        if (staticGame.name === '麻将胡了') {
          return g.game_name === '麻将胡了' || g.game_api_type === 'slots_gpd'
        }
        if (staticGame.name === 'FB体育') {
          return g.game_api_type === 'fb_sports' || g.game_name === 'FB体育'
        }
        if (staticGame.name === '德州牛仔') {
          return (
            g.game_type === 'cow_boy' || g.game_api_type === 'cow_boy' || g.game_name === '德州牛仔'
          )
        }
        return false
      })

      // If not found in popularBannerGames, try gameRecords as fallback
      if (!matched) {
        const allGames = casinoStore.gameRecords || []
        matched = allGames.find((g) => {
          if (staticGame.name === 'PA真人')
            return (
              g.game_name?.includes('PA') ||
              g.game_api_type === 'pa_live' ||
              g.game_name?.includes('DB视讯') ||
              g.game_name === 'DB真人'
            )
          if (staticGame.name === '麻将胡了')
            return g.game_name === '麻将胡了' || g.game_api_type === 'slots_gpd'
          if (staticGame.name === 'FB体育')
            return g.game_api_type === 'fb_sports' || g.game_name === 'FB体育'
          if (staticGame.name === '德州牛仔')
            return (
              g.game_type === 'cow_boy' ||
              g.game_api_type === 'cow_boy' ||
              g.game_name === '德州牛仔'
            )
          return false
        })
      }

      return {
        ...staticGame,
        gameApiType: matched?.game_api_type || staticGame.gameApiType,
        roomId: matched?.id || matched?.game_room_id || 0,
      }
    })
})

function handleBannerGameClick(game: any) {
  if (game.gameApiType === 'cow_boy') {
    showGameToast(t('UIMineClubCowboyDownloadTip') || '下载牛仔游戏')
    return
  }

  // 后台没给该俱乐部开娱乐场时，游戏列表为空，直接提示，不再发起必然失败的进游戏请求。
  if (!hasCasinoAccess.value) {
    showGameToast(t('UICasino_ClubNotEnabled'))
    return
  }

  pendingGameInfo.value = { apiType: game.gameApiType, gameType: '', roomId: game.roomId }
  showGameClubSelector.value = true
}

function handleWalletConfirm(clubId?: number) {
  const reserved = pendingGameInfo.value
    ? reserveWindowForGame(pendingGameInfo.value.apiType)
    : null
  showGameClubSelector.value = false
  if (!pendingGameInfo.value) {
    releaseGameWindow(reserved)
    return
  }
  const { apiType, gameType, roomId } = pendingGameInfo.value
  joinGame(apiType, gameType, roomId, clubId, reserved)
  pendingGameInfo.value = null
}

function reserveWindowForGame(apiType: string): ReservedGameWindow {
  const isRealNameGame = apiType === 'real_name' || apiType === 'pa_live'
  if (isRealNameGame && getDeviceType() === 1) {
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
    const isRealNameGame = apiType === 'real_name' || apiType === 'pa_live'
    const finalGameType = ''
    const deviceType = getDeviceType()
    const finalDeviceType = isRealNameGame ? 2 : deviceType

    const res = await joinCasinoGame(
      {
        game_api_type: apiType,
        game_room_id: roomId,
        game_type: finalGameType,
        device_type: finalDeviceType,
        currency_type: 1,
      },
      clubId,
    )
    finishLaunch()

    if (res.code === 0 && res.data) {
      const gameUrl = res.data.url || res.data.game_url
      if (gameUrl) {
        if (!launchGameUrl(reserved, gameUrl, isRealNameGame && deviceType === 1)) {
          releaseGameWindow(reserved)
          if (usesTelegramGameLauncher()) {
            showGameToast(t('UICasino_ClubNotEnabled'))
          } else {
            gameLaunchStore.openFallback(gameUrl)
          }
        }
      } else {
        releaseGameWindow(reserved)
        showGameToast(t('UICasino_ClubNotEnabled'))
      }
    } else {
      releaseGameWindow(reserved)
      showGameToast((res.msg as string) || t('UICasino_ClubNotEnabled'))
    }
  } catch (error: any) {
    finishLaunch()
    releaseGameWindow(reserved)
    showGameToast(error?.response?.data?.msg || t('UICasino_ClubNotEnabled'))
  }
}

interface ZoneStats {
  tables: number
  players: number
}

interface HomeZoneStats {
  poker: ZoneStats
  mahjong: ZoneStats
  mtt: ZoneStats
  miniGame?: ZoneStats
}

interface HomeRoomStatsCachePayload {
  version: number
  updatedAt: number
  stats: HomeZoneStats
}

const HOME_ROOM_STATS_CACHE_VERSION = 1

function createEmptyZoneStats(): HomeZoneStats {
  return {
    poker: { tables: 0, players: 0 },
    mahjong: { tables: 0, players: 0 },
    mtt: { tables: 0, players: 0 },
    miniGame: { tables: 0, players: 0 },
  }
}

// 兜底清洗每个玩法统计，避免脏缓存导致页面展示异常。
function normalizeZoneStats(raw: unknown): ZoneStats {
  const data = (raw || {}) as Record<string, unknown>
  return {
    tables: toSafeNumber(data.tables),
    players: toSafeNumber(data.players),
  }
}

// 从 unknown 恢复 HomeZoneStats，缺字段时回落到 0。
function normalizeHomeZoneStats(raw: unknown): HomeZoneStats {
  const data = (raw || {}) as Record<string, unknown>
  return {
    poker: normalizeZoneStats(data.poker),
    mahjong: normalizeZoneStats(data.mahjong),
    mtt: normalizeZoneStats(data.mtt),
  }
}

// 首屏优先读取缓存，避免从 0 闪到真实值。
function restoreHomeRoomStatsCache(): HomeZoneStats | null {
  // 渠道包的展示结果依赖 CMS 钻石开关；持久化统计没有携带该上下文，不能跨页面刷新复用。
  if (typeof window === 'undefined' || isChannelPackageHost()) {
    return null
  }

  const cached = localStore.getItem<HomeRoomStatsCachePayload | null>(
    StorageKey.HOME_ROOM_STATS_CACHE,
    null,
  )
  if (!cached || typeof cached !== 'object') {
    return null
  }

  if (cached.version !== HOME_ROOM_STATS_CACHE_VERSION) {
    return null
  }

  return normalizeHomeZoneStats(cached.stats)
}

// 玩法统计更新后写入缓存，供下次进入首页秒开。
function persistHomeRoomStatsCache(stats: HomeZoneStats): void {
  if (typeof window === 'undefined') {
    return
  }

  const payload: HomeRoomStatsCachePayload = {
    version: HOME_ROOM_STATS_CACHE_VERSION,
    updatedAt: Date.now(),
    stats,
  }
  localStore.setItem(StorageKey.HOME_ROOM_STATS_CACHE, payload)
}

const homeRoomStats = ref<HomeZoneStats>(restoreHomeRoomStatsCache() || createEmptyZoneStats())
const currentClub = computed<ClubInfo | null>(() => {
  if (userInfoStore.currentClub) {
    return userInfoStore.currentClub
  }
  return userInfoStore.clubList[0] || (isChannelPackage ? userInfoStore.channelDefaultClub : null)
})
const selectedClubId = computed(() => toSafeInt(currentClub.value?.club_id))
const selectedTribeId = computed(() =>
  toSafeInt((currentClub.value as Record<string, unknown> | null)?.tribe_id),
)

const { bannerImages, isBannerLoaded, fetchLobbyBannerImages } = useLobbyBannerImages()
// 仅在服务端 banner 确认且无配置时，才回落到内置单图和 hero 文案。
// 在服务端接口未完成返回前 (isBannerLoaded === false)，保持为空数组，不盲目展示默认图。
const displayBannerImages = computed<string[]>(() => {
  if (!isBannerLoaded.value) return []
  return bannerImages.value.length ? bannerImages.value : [homeHeaderFallback]
})
const isFallbackBanner = computed<boolean>(() => isBannerLoaded.value && !bannerImages.value.length)
const { noticeText, ensureHomeAnnouncementConfig } = useHomeAnnouncement()
const noticeTrackStyle = computed<CSSProperties>(() => ({
  '--notice-gap': `${NOTICE_GAP_PX}px`,
  '--notice-distance': `${noticeDistancePx.value}px`,
  '--notice-duration': `${noticeDurationSec.value}s`,
}))
const pokerTablesText = computed(() => `${homeRoomStats.value.poker.tables}`)
const pokerPlayersText = computed(() => `${homeRoomStats.value.poker.players}`)
// const mahjongPlayersText = computed(() => `${homeRoomStats.value.mahjong.players}`)
const mahjongPlayersText = 788
const mttTablesText = computed(() => `${homeRoomStats.value.mtt.tables}`)
const mttPlayersText = computed(() => `${homeRoomStats.value.mtt.players}`)
const channelCasinoClubId = computed(() =>
  isChannelPackage
    ? toSafeInt(currentClub.value?.club_id || userInfoStore.channelDefaultClub?.club_id)
    : 0,
)

// 渠道包下 casinoStore 按俱乐部维度取数，非空即代表后台给该俱乐部开了娱乐场/小游戏。
const hasChannelCasinoGames = computed(
  () => channelCasinoClubId.value > 0 && casinoStore.gameRecords.length > 0,
)

// 热门游戏三个入口都是娱乐场（第三方）游戏：俱乐部没开通时游戏列表为空。
// popularBannerGames 带本地缓存，可能是上一次全局数据的残留，故只认实时拉取的 gameRecords。
const hasCasinoAccess = computed(() => casinoStore.gameRecords.length > 0)

// 私域版首页三块内容：赛事 / 扑克 / 娱乐场。赛事、扑克按「是否创建了内容」判断，
// 娱乐场按俱乐部维度的游戏列表是否非空判断（没开权限时后台返回空）。
const channelSections = computed(() => ({
  mtt: homeRoomStats.value.mtt.tables > 0,
  poker: homeRoomStats.value.poker.tables > 0,
  casino: hasChannelCasinoGames.value,
}))

const channelSectionCount = computed(
  () => Object.values(channelSections.value).filter(Boolean).length,
)

type HomeContentMode = 'zones' | 'mtt' | 'poker' | 'casino'

// 私域版：只开一块内容时不给入口，直接铺列表；开两块及以上（以及一块都没有）时展示专区入口。
// 官方包继续沿用原有的「仅有赛事时直接展示 MTT」行为。
const homeContentModeRaw = computed<HomeContentMode>(() => {
  const pokerTables = homeRoomStats.value.poker.tables
  const mttTables = homeRoomStats.value.mtt.tables
  if (isChannelPackage) {
    if (isVersionB.value) {
      // In Version B, /home always directly displays poker.
      return 'poker'
    }
    if (channelSectionCount.value === 1) {
      if (channelSections.value.poker) {
        return 'poker'
      }
      if (channelSections.value.mtt) {
        return 'mtt'
      }
      return 'casino'
    }
    return 'zones'
  }
  if (mttTables > 0 && pokerTables === 0) {
    return 'mtt'
  }
  return 'zones'
})
// 首屏不猜测布局：俱乐部配置、全局配置、牌桌和 MTT 全部稳定后再一次性展示。
const homeContentMode = ref<HomeContentMode>(homeContentModeRaw.value)
const homeContentReady = ref(false)

function commitHomeContentMode(): void {
  homeContentMode.value = homeContentModeRaw.value
}

// 专区入口只在 zones 模式渲染：赛事 / 扑克常驻（没内容也保留入口，点进去是空态），
// 娱乐场没给俱乐部开通时隐藏——那里点进去只会报错。
const showCasinoZoneCard = computed(() => !isChannelPackage || channelSections.value.casino)
// 热门游戏整条都是娱乐场的游戏，没开娱乐场的俱乐部不该看到。
const showHotGamesSection = computed(() => !isChannelPackage || channelSections.value.casino)

const currentJoinedClub = computed(() => userInfoStore.currentJoinedClub)
const canManageChannelClub = computed(
  () => isChannelPackage && Boolean(gameStore.isRealUser && currentJoinedClub.value),
)
const showChannelFloatingActions = computed(() => canManageChannelClub.value)

function toSafeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return 0
  }
  return Math.floor(num)
}

function ensureClubDataReady(): void {
  // 仅消费 store 已有俱乐部数据，不在首页回流时触发 user/club 请求。
  if (!userInfoStore.currentClub && userInfoStore.clubList.length) {
    userInfoStore.setCurrentClub(userInfoStore.clubList[0] || null)
  }
}

function goToGameList(): void {
  void router.push('/gameList')
}
function goToMttList(): void {
  void router.push('/mttList')
}
function goToCasino(): void {
  // 渠道包只有一个俱乐部：娱乐场（含小游戏）按俱乐部维度取数，跟随后台的俱乐部开关。
  if (isChannelPackage && channelCasinoClubId.value > 0) {
    void router.push({ path: '/casino', query: { clubId: String(channelCasinoClubId.value) } })
    return
  }
  void router.push('/casino')
}

function goToClubDetail(): void {
  if (!requireRealUser(goToClubDetail)) return
  void router.push('/club/detail')
}

function openMiniGamePanel(): void {
  if (!requireRealUser(openMiniGamePanel)) return
  showGameToast(t('UIClub_InDeve'))
}

function getRoomPlayers(room: RoomRecord): number {
  return Number(room.roomers) || (Array.isArray(room.users) ? room.users.length : 0)
}

function classifyRoomToZone(room: RoomRecord): 'poker' | 'mahjong' | null {
  const gameType = Number(room.game_type)
  if (!Number.isFinite(gameType)) {
    return null
  }
  if (gameType <= 4) return 'poker'
  if (gameType === 6) return 'mahjong'
  return null
}

// 首页扑克/麻将统计直接复用共享牌桌列表，避免和 gameList 数据源分叉。
function refreshHomePokerMahjongStatsFromStore(): void {
  const nextStats = createEmptyZoneStats()
  roomListStore.records.forEach((room) => {
    // 对齐 C# RequestTableDataListForClubOrTribe：先按俱乐部/联盟关系过滤可见牌桌。
    if (
      !checkIsShowForClubAndTribe(
        room,
        selectedClubId.value,
        selectedTribeId.value,
        true,
        displayPlatformDiamond.value,
      )
    ) {
      return
    }

    const zone = classifyRoomToZone(room)
    if (!zone) {
      return
    }

    nextStats[zone].tables += 1
    const playersNum = getRoomPlayers(room)
    nextStats[zone].players += playersNum
  })

  homeRoomStats.value = {
    ...homeRoomStats.value,
    poker: nextStats.poker,
    mahjong: nextStats.mahjong,
  }
  persistHomeRoomStatsCache(homeRoomStats.value)
}

// 首页 MTT 统计：和 MttContent 走同一份过滤口径（排麻将 + club/tribe 可见性），
// 保证「首页显示 N 桌 M 人」和「进入 MTT 列表后看到的赛事数 / 报名总人数」完全一致。
// tables = 可见赛事数；players = 可见赛事 participants 之和。
function refreshHomeMttStatsFromStore(): void {
  const visibleRecords = filterVisibleMttRecords(
    mttListStore.records,
    mttListStore.mttIdMetaMap,
    selectedClubId.value,
    selectedTribeId.value,
    appConfigStore.clubDisplayPlatformMtt,
    displayPlatformDiamond.value,
  )
  const players = visibleRecords.reduce((sum, item) => sum + toSafeNumber(item.participants), 0)

  homeRoomStats.value = {
    ...homeRoomStats.value,
    mtt: {
      tables: visibleRecords.length,
      players,
    },
  }
  persistHomeRoomStatsCache(homeRoomStats.value)
}

function extractCowboyOnlineCount(raw: unknown): number {
  if (!raw || typeof raw !== 'object') {
    return 0
  }
  const data = raw as Record<string, unknown>
  if ('online' in data) {
    return toSafeNumber(data.online)
  }

  const records = Array.isArray(data.records) ? data.records : []
  if (records.length) {
    return records.reduce((total, item) => {
      const record = item as Record<string, unknown>
      return total + toSafeNumber(record.online)
    }, 0)
  }

  return extractCowboyOnlineCount(data.data)
}

async function fetchHomeMiniGameStats(): Promise<void> {
  const response = await getCowboyRoomListApi({
    limit: 100,
    offset: 0,
  })
  const online = Number(response.code) === 0 ? extractCowboyOnlineCount(response.data) : 0

  homeRoomStats.value = {
    ...homeRoomStats.value,
    miniGame: {
      tables: 0,
      players: online,
    },
  }
  persistHomeRoomStatsCache(homeRoomStats.value)
}

async function updateNoticeMarquee(): Promise<void> {
  await nextTick()

  const containerWidth = noticeScrollRef.value?.clientWidth || 0
  const itemWidth = noticeItemRef.value?.scrollWidth || 0
  if (!containerWidth || !itemWidth) {
    shouldScrollNotice.value = false
    noticeDistancePx.value = 0
    noticeDurationSec.value = 0
    return
  }

  // 文本较短时保持静态展示，不触发滚动。
  if (itemWidth <= containerWidth) {
    shouldScrollNotice.value = false
    noticeDistancePx.value = 0
    noticeDurationSec.value = 0
    return
  }

  // 固定速度滚动：根据总位移距离自动算时长，保证长短文本速度一致。
  const distance = itemWidth + NOTICE_GAP_PX
  noticeDistancePx.value = distance
  noticeDurationSec.value = Number((distance / NOTICE_SPEED_PX_PER_SEC).toFixed(3))
  shouldScrollNotice.value = true
}

watch(noticeText, () => {
  void updateNoticeMarquee()
})

watch(
  () => gameStore.isRealUser,
  (isRealUser) => {
    if (isRealUser) {
      void fetchHomeMiniGameStats().catch((error) => {
        console.warn('[home] fetch mini game stats failed:', error)
      })
    }
  },
)

watch(
  [() => roomListStore.records, selectedClubId, selectedTribeId, displayPlatformDiamond],
  () => {
    refreshHomePokerMahjongStatsFromStore()
    if (homeContentReady.value) {
      commitHomeContentMode()
    }
  },
  {
    deep: false,
  },
)

watch(
  [
    () => mttListStore.records,
    () => mttListStore.mttIdList,
    selectedClubId,
    selectedTribeId,
    // 全局配置异步到达后重算，平台 MTT 可见性依赖 club_display_platform_mtt。
    () => appConfigStore.clubDisplayPlatformMtt,
    displayPlatformDiamond,
  ],
  () => {
    refreshHomeMttStatsFromStore()
    if (homeContentReady.value) {
      commitHomeContentMode()
    }
  },
  {
    deep: false,
  },
)

async function bootstrapHomeContent(): Promise<void> {
  // 渠道俱乐部必须先于身份识别完成，因为它同时决定游客列表 scope、俱乐部标题和 h5_menu。
  if (isChannelPackage) {
    await userInfoStore.ensureChannelDefaultClub()
  }

  await ensureExperienceSession().catch((error) => {
    console.warn('[home] resolve session identity failed:', error)
  })
  if (gameStore.isRealUser) {
    void fetchHomeMiniGameStats().catch((error) => {
      console.warn('[home] fetch mini game stats failed:', error)
    })
  }
  ensureClubDataReady()

  // 首页显示前必须确认本会话的最新全局配置。postAuthSync 若已在请求，这里会复用同一 promise；
  // 身份初始化失败且没有 token 时，回退到免登录配置接口。
  const sessionKey = gameStore.sessionToken.trim()
  const configReady = sessionKey
    ? appConfigStore.ensureFreshGlobalConfig(sessionKey)
    : ensureHomeAnnouncementConfig()
  const roomListReady = roomListStore.bootstrapRoomList()
  const mttListReady = mttListStore.bootstrapMttList()
  await Promise.allSettled([configReady, roomListReady, mttListReady])

  // 两份列表及其共同过滤上下文全部稳定后，一次提交统计和页面模式。
  refreshHomePokerMahjongStatsFromStore()
  refreshHomeMttStatsFromStore()
  const casinoClubId = channelCasinoClubId.value
  await casinoStore
    .preloadCasinoData(casinoClubId || undefined, isChannelPackage ? false : casinoClubId <= 0)
    .catch((e) => {
      console.warn('[home] preload casino data failed:', e)
    })

  commitHomeContentMode()
  homeContentReady.value = true
}

onMounted(() => {
  // 首页和两个列表页共用 store；俱乐部、身份和配置就绪后一次性提交首屏。
  void bootstrapHomeContent()
  void fetchLobbyBannerImages().catch((error) => {
    console.warn('[home] fetch lobby banner failed:', error)
  })
  void updateNoticeMarquee()

  if (typeof ResizeObserver !== 'undefined') {
    noticeResizeObserver = new ResizeObserver(() => {
      void updateNoticeMarquee()
    })
    if (noticeScrollRef.value) {
      noticeResizeObserver.observe(noticeScrollRef.value)
    }
  }
})

onBeforeUnmount(() => {
  if (noticeResizeObserver) {
    noticeResizeObserver.disconnect()
    noticeResizeObserver = null
  }
})
</script>

<template>
  <div
    class="home-page"
    :class="{
      'home-page--fit': homeContentMode === 'zones',
      'home-page--mtt': homeContentReady && homeContentMode === 'mtt',
      'is-version-b': isVersionB
    }"
  >
    <!-- 0. 正式首页统一承载游客/真实账号；游客仅额外显示注册、登录入口。 -->
    <HomeTopBar />

    <!-- 1. 顶部俱乐部介绍轮播图 -->
    <div class="home-header">
      <div class="home-header__inner">
        <HomeBannerSwiper :images="displayBannerImages" />
        <Transition name="banner-fade">
          <div v-if="isFallbackBanner" class="home-header__hero">
            <div class="home-header__text">
              <p class="home-header__title">全民代理</p>
              <p class="home-header__subtitle">一键创建你的线上俱乐部</p>
            </div>
            <span class="home-header__pill">xypk.com</span>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 2. 公告栏 -->
    <div class="notice-bar">
      <img class="notice-icon" src="@/assets/icons/icon_notice.svg" :alt="t('Serverbulletin')" />
      <div class="notice-marquee">
        <span class="notice-label mr-4"> {{ $txt('Serverbulletin') }}: </span>
        <div ref="noticeScrollRef" class="notice-scroll">
          <div
            class="notice-track"
            :class="{ 'is-scroll': shouldScrollNotice }"
            :style="noticeTrackStyle"
          >
            <span ref="noticeItemRef" class="notice-item">
              {{ noticeText }}
            </span>
            <span v-if="shouldScrollNotice" class="notice-item" aria-hidden="true">
              {{ noticeText }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 俱乐部控件 -->
    <ChannelClubInfoPanel />

    <!-- 渠道包单类型直接展示列表；赛事和牌桌并存时展示专区入口。 -->
    <div class="home-swap-container" :aria-busy="!homeContentReady">
      <Transition name="home-swap">
        <div
          v-if="homeContentReady && homeContentMode === 'mtt'"
          key="mtt"
          class="home-swap-panel"
        >
          <MttContent embedded class="home-mtt-content" scroll-key="home-mtt" />
        </div>
        <div
          v-else-if="homeContentReady && homeContentMode === 'poker'"
          key="poker"
          class="home-poker-content home-swap-panel"
        >
          <PokerGameList embedded scroll-key="home-poker" />
        </div>
        <div
          v-else-if="homeContentReady && homeContentMode === 'casino'"
          key="casino"
          class="home-casino-content home-swap-panel"
        >
          <CasinoView :hide-header="true" :club-id="channelCasinoClubId" />
        </div>
        <div
          v-else-if="homeContentReady"
          key="default"
          class="home-default-sections home-swap-panel"
        >
          <!-- 4. 游戏模块 -->
          <div class="section-header">
            <span class="section-title">{{ t('UIHome_Text3') }}</span>
          </div>
          <div class="game-center-scroll">
            <div class="game-center-track">
              <div class="game-scroll-card game-card-mtt" @click="goToMttList">
                <img class="zone-lg-bg" src="@/assets/icons/game_zone_mtt_lg.png" alt="MTT" />
                <div class="zone-info">
                  <div class="zone-header">
                    <span class="zone-title"> {{ t('UIHomeMttArea') }} </span>
                    <img
                      class="zone-mini-icon"
                      src="@/assets/icons/game_zone_mtt_mini.png"
                      alt=""
                    />
                  </div>
                  <div class="zone-desc">
                    <span>{{ t('UIHomeMttPokerTip') }}</span>
                  </div>
                  <p class="zone-sub-desc">{{ t('UIHomeMttAreaTip') }}</p>
                </div>
                <div class="zone-online-bar">
                  <span v-fit-text="{ maxLines: 1 }" class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
                  <img class="online-icon" src="@/assets/icons/game_zone_table_mini.png" alt="" />
                  <span class="online-num"> {{ mttTablesText }} </span>
                  <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
                  <span class="online-num"> {{ mttPlayersText }} </span>
                </div>
              </div>

              <div class="game-scroll-card poker-card" @click="goToGameList">
                <img
                  class="zone-lg-bg"
                  src="@/assets/icons/game_zone_poker_lg.png"
                  :alt="t('UIClub_Text15')"
                />
                <div class="poker-overlay"></div>
                <div class="zone-info poker-info">
                  <div class="zone-header">
                    <span class="zone-title"> {{ t('UIHomePokerArea') }} </span>
                    <img
                      class="zone-mini-icon poker-mini"
                      src="@/assets/icons/game_zone_poker_mini.png"
                      alt=""
                    />
                  </div>
                  <div class="poker-desc-area">
                    <p class="zone-sub-desc">{{ t('UITexasRule_texas') }}</p>
                    <p class="zone-sub-desc">{{ t('UITexasRule_omaha') }}</p>
                    <p class="zone-sub-desc">{{ t('PokerType_2') }}</p>
                  </div>
                </div>
                <div class="zone-online-bar">
                  <span v-fit-text="{ maxLines: 1 }" class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
                  <img class="online-icon" src="@/assets/icons/game_zone_table_mini.png" alt="" />
                  <span class="online-num"> {{ pokerTablesText }} </span>
                  <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
                  <span class="online-num"> {{ pokerPlayersText }} </span>
                </div>
              </div>

              <div
                v-if="showCasinoZoneCard"
                class="game-scroll-card game-card-mahjong"
                @click="goToCasino"
              >
                <img
                  class="zone-lg-bg"
                  src="@/assets/icons/game_zone_mahjong_lg.png"
                  :alt="t('Mahjong_Name')"
                />
                <div class="zone-info">
                  <div class="zone-header">
                    <span class="zone-title"> {{ t('UICasino_Title') }} </span>
                    <img
                      class="zone-mini-icon"
                      src="@/assets/icons/game_zone_mahjong_mini.png"
                      alt=""
                    />
                  </div>
                  <div class="zone-desc casino-desc">
                    <p>{{ t('UICasino_SubText') }}</p>
                    <p>{{ t('UICasino_TopProviders') }}</p>
                  </div>
                </div>
                <div class="zone-online-bar">
                  <span v-fit-text="{ maxLines: 1 }" class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
                  <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
                  <span class="online-num"> {{ mahjongPlayersText }} </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 5. 热门游戏 -->
          <div v-if="showHotGamesSection" class="section-header">
            <span class="section-title">{{ t('UIHome_Text4') }}</span>
          </div>
          <div v-if="showHotGamesSection" class="coming-soon-scroll">
            <div class="coming-soon-track">
              <div
                v-for="(game, index) in activeBannerGames"
                :key="index"
                class="coming-soon-scroll-card"
                @click="handleBannerGameClick(game)"
              >
                <picture class="coming-soon-scroll-card__picture">
                  <source v-if="game.svgPc" media="(min-width: 600px)" :srcset="game.svgPc" />
                  <img class="coming-soon-scroll-card__img" :src="game.svg" alt="" />
                </picture>
                <div class="coming-soon-scroll-card__label">
                  <span class="coming-soon-scroll-card__title">
                    {{ t(game.titleKey) }}
                  </span>
                  <span
                    v-for="(subtitleKey, i) in game.subtitleKeys"
                    :key="i"
                    class="coming-soon-scroll-card__subtitle"
                    :class="{ 'coming-soon-scroll-card__subtitle--first': i === 0 }"
                  >
                    {{ t(subtitleKey) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <GameClubSelector
      v-model:show="showGameClubSelector"
      @confirm="handleWalletConfirm"
      @cancel="showGameClubSelector = false"
    />

    <div v-if="showChannelFloatingActions" class="floating-action-area">
      <button
        v-if="canManageChannelClub"
        class="floating-menu-btn"
        type="button"
        :aria-label="t('UIClub_ClubManager')"
        @click="goToClubDetail"
      >
        <img :src="clubDetailButtonIcon" alt="" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.home-page {
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
  padding: 0 0.4rem calc(2.6rem + env(safe-area-inset-bottom));
  background: transparent;
  min-height: max-content;
  box-sizing: border-box;
  overscroll-behavior-y: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  &.is-version-b {
    padding-bottom: calc(2.5rem + env(safe-area-inset-bottom));
  }

  :deep(.group-item) {
    padding: 0.2667rem 0.2rem 0.45rem;
  }
}

.home-page--fit,
.home-page.home-page--mtt {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding-bottom: 0;
  overflow: hidden;
}

.home-page--fit .notice-bar,
.home-page--fit .club-panel {
  flex-shrink: 0;
}

.home-page--fit .home-swap-container {
  flex: 1 0 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.home-page--fit .home-default-sections {
  flex: 1 0 auto;
  min-height: 0;
}

.home-page--fit .game-center-scroll,
.home-page--fit .coming-soon-scroll {
  flex: 1 0 3.9rem;
  min-height: 0;
  // 卡片素材 444×587，宽 2.95rem 时原始高度就是 3.9rem。没有这个上限时，
  // 只剩一行的场景（俱乐部没开娱乐场 → 热门游戏整条隐藏）会把卡片拉满整屏。
  max-height: 3.9rem;
}
.home-header {
  width: 100%;
  border-radius: 0.8rem;
  overflow: hidden;
  flex: 1 1 3.68rem;
  min-height: 0;
  max-height: 5.5rem;
}

.home-header__inner {
  position: relative;
  width: 100%;
  height: 100%;
  container-type: size;
}

.home-header__hero {
  position: absolute;
  left: 0;
  right: 0;
  top: 0.56rem;
  top: min(15.2cqh, 0.56rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  pointer-events: none;
}

.home-header__title,
.home-header__subtitle {
  margin: 0;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  font-size: 0.62rem;
  font-size: min(16.9cqh, 0.62rem);
  line-height: 1.2;
  letter-spacing: 0.01rem;
  color: #fff;
  text-align: center;
  white-space: nowrap;
}

.home-header__pill {
  margin-top: 0.26rem;
  margin-top: min(7.1cqh, 0.26rem);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.12rem 0.5rem;
  padding: min(3.3cqh, 0.12rem) min(13.6cqh, 0.5rem);
  border-radius: 999px;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  font-size: 0.6rem;
  font-size: min(16.3cqh, 0.6rem);
  color: #fff;
  white-space: nowrap;
  background: rgba(37, 37, 37, 0.49);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.home-header__text {
  display: flex;
  flex-direction: column;
  align-items: center;
}

@container (max-height: 2.6rem) {
  .home-header__hero {
    top: 0;
    bottom: 0;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.5rem;
  }

  .home-header__text {
    align-items: flex-start;
  }

  .home-header__title,
  .home-header__subtitle {
    font-size: 0.46rem;
    text-align: left;
  }

  .home-header__pill {
    margin-top: 0;
    font-size: 0.4rem;
    padding: 0.1rem 0.4rem;
  }
}

@container (min-height: 4rem) {
  .home-header__hero {
    top: 0;
    bottom: 0;
    justify-content: center;
  }
}

.notice-bar {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  padding: 0rem 0.18rem;
  border-radius: 1rem;
  height: 0.5rem;
  min-height: 0.5rem;
  position: relative;
  background: rgba(170, 170, 170, 0.1);
  border: 0.02rem solid rgba(249, 249, 249, 0.1);
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);
}

.notice-icon {
  width: 0.43rem;
  height: 0.43rem;
  flex-shrink: 0;
  filter: brightness(0) invert(1);
}

.notice-marquee {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.notice-label {
  font-size: 0.28rem;
  color: #f9f9f9;
  white-space: nowrap;
  flex-shrink: 0;
}

.notice-scroll {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.notice-track {
  display: inline-flex;
  align-items: center;
  min-width: max-content;
  gap: var(--notice-gap, 48px);
  white-space: nowrap;
  will-change: transform;
}

.notice-track.is-scroll {
  animation: notice-scroll var(--notice-duration, 16s) linear infinite;
}

.notice-item {
  font-size: 0.28rem;
  line-height: 0.6rem;
  color: #f9f9f9;
  font-weight: 400;
  white-space: nowrap;
}

@keyframes notice-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-1 * var(--notice-distance, 0px)));
  }
}

.home-mtt-content {
  padding: 0.1rem 0.38rem 0rem;
}
// 保持和 .home-page 的直接子级同样的纵向堆叠 + 间距。
.home-default-sections {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0 0.4rem;
}

// 默认模块 <=> MTT 列表切换用淡入淡出：改用 opacity，去掉 overflow:hidden，
// 否则容器会裁掉游戏中心横向滚动到屏幕边缘的“出血边”（与 dev_merge_0624 一致）。
.home-swap-container {
  position: relative;
  margin-left: -0.4rem;
  margin-right: -0.4rem;
  min-height: 5rem;
}

.home-page--mtt .home-swap-container {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.home-page--mtt .home-swap-panel {
  height: 100%;
  min-height: 0;
}

.home-page--mtt .home-mtt-content {
  height: 100%;
  min-height: 0;
  max-height: none;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior-y: contain;
}

.home-swap-panel {
  width: 100%;
}

.home-casino-content {
  padding: 0 0.4rem 1.2rem;
}

.home-poker-content {
  :deep(.room-tabs) {
    margin-right: 0;
    margin-left: 0;
  }
  :deep(.group-list) {
    padding: 0 0.2rem;
  }
}

.home-swap-enter-active,
.home-swap-leave-active {
  transition: opacity 0.32s ease;
  will-change: opacity;
}

// 切换期间旧面板脱离流，避免撑高容器；新面板在流内决定容器高度。
.home-swap-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.home-swap-enter-from {
  opacity: 0;
}
.home-swap-enter-to {
  opacity: 1;
}
.home-swap-leave-from {
  opacity: 1;
}
.home-swap-leave-to {
  opacity: 0;
}

.section-header {
  padding: 0.12rem 0 0;
  .section-title {
    font-size: 0.38rem;
    font-weight: 700;
    margin-bottom: 0rem;
    color: #f9f9f9;
    font-family: 'HONOR Sans CN', sans-serif;
  }
}

.game-center-scroll {
  width: calc(100% + 0.8rem);
  margin-left: -0.4rem;
  margin-right: -0.4rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.game-center-track {
  display: flex;
  height: 100%;
  gap: 0.15rem;
  width: max-content;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
}

.game-scroll-card {
  flex-shrink: 0;
  width: 2.95rem;
  // 固定高度：小屏不再压缩卡片，改由页面向下滚动（内容延伸到 appbar 下方，用户滚动查看）。
  height: 100%;
  border-radius: 0.37rem;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background: linear-gradient(135deg, #956eff 0%, #7447ef 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.26rem 0.2rem 0.2rem;
  box-sizing: border-box;

  &:active {
    opacity: 0.85;
  }
}

.poker-card {
  background: linear-gradient(135deg, #65a879 0%, #329147 100%);
}

.game-card-mahjong {
  background: linear-gradient(135deg, #ff9cab 0%, #df2340 100%);

  .zone-info {
    position: relative;
  }

  .casino-desc {
    text-shadow: 0 0.02rem 0.06rem rgba(0, 0, 0, 0.3);

    p {
      margin: 0;
      white-space: nowrap;
      font-size: 0.2rem;
      line-height: 1.5;
    }
  }
}

.zone-lg-bg {
  position: absolute;
  inset: 0;
  object-fit: cover;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.zone-mini-icon {
  margin-top: 0.08rem;
  width: 0.3rem;
  height: 0.3rem;
}

.zone-info {
  z-index: 1;
  .zone-header {
    display: flex;
    justify-content: space-between;
  }
}

.zone-title {
  font-size: 0.33rem;
  font-weight: 800;
  color: #fff;
  display: block;
  margin-bottom: 0.1rem;
}

.poker-desc-area {
  display: flex;
  flex-direction: column;
}

.zone-desc {
  font-size: 0.22rem;
  font-weight: 400;
  color: #fff;
  margin: 0;
  line-height: 1.5;
}

.zone-sub-desc {
  font-size: 0.22rem;
  font-weight: 400;
  color: #fff;
  margin: 0.06rem 0 0;
}

.zone-online-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  background: rgba(56, 55, 55, 0.61);
  border-radius: 1rem;
  padding: 0.06rem 0.2rem;
  margin-top: 0.18rem;
  height: 0.4rem;
  width: 100%;
  z-index: 2;
}

.online-text {
  min-width: 0;
  white-space: nowrap;
  font-size: 0.22rem;
  color: #fff;
}

.online-icon {
  width: 0.22rem;
  height: 0.22rem;
  margin-left: 0.1rem;
  object-fit: contain;
}

.online-num {
  font-size: 0.22rem;
  color: #fff;
}

.poker-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.poker-mini {
  z-index: 1;
}

.poker-info {
  position: relative;
  z-index: 1;
  padding-left: 0;
  flex: 1;
}

.coming-soon-card {
  padding: 0;
}

.desktop-only-game-card {
  display: none;
}

.coming-soon-right {
  position: relative;
  border-radius: 0.56rem;
  overflow: hidden;
}

.coming-soon-overlay {
  position: absolute;
  inset: 0;
}

.coming-soon-text {
  position: relative;
  z-index: 1;
  display: block;
  text-align: center;
  font-size: 0.36rem;
  font-weight: 700;
  color: #fff;
  margin: auto;
  padding: 1rem 0;
  width: 100%;
}

.coming-soon-scroll {
  width: calc(100% + 0.8rem);
  margin-left: -0.4rem;
  margin-right: -0.4rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.coming-soon-track {
  display: flex;
  height: 100%;
  gap: 0.15rem;
  padding-bottom: 0.1rem;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
  width: max-content;
}

.coming-soon-scroll-card {
  flex-shrink: 0;
  width: 2.95rem;
  // 与 .game-scroll-card 一致：固定高度，不再随屏幕压缩，改由页面滚动兜底。
  height: 100%;
  border-radius: 0.51rem;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 0.01rem solid rgba(249, 249, 249, 0.4);

  &:active {
    opacity: 0.85;
  }
}

.coming-soon-scroll-card__picture {
  display: contents;
}

.coming-soon-scroll-card__img {
  width: 100%;
  height: 100%;
  // 图片无内置文字：靠上对齐、超出部分从底部裁掉，底部给代码 label 让位。
  object-fit: cover;
  object-position: top center;
  display: block;
}

// 名称/描述改为代码渲染，缩放时不会像图片内文字那样被裁切/糊。
.coming-soon-scroll-card__label {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  padding: 0.36rem 0.24rem 0.16rem;
  color: #fff;
  text-align: left;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0) 100%);
  pointer-events: none;
}

.coming-soon-scroll-card__title {
  font-size: 0.34rem;
  font-weight: 700;
  line-height: 1.15;
}

.coming-soon-scroll-card__subtitle {
  font-size: 0.22rem;
  font-weight: 400;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.82);
}

// 只在标题与副标题之间留 0.12rem，副标题各行仍靠 line-height 紧凑排列。
.coming-soon-scroll-card__subtitle--first {
  margin-top: 0.12rem;
}

.floating-action-area {
  position: fixed;
  right: 0.48rem;
  bottom: calc(2.82rem + env(safe-area-inset-bottom));
  z-index: 23;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.14rem;
}

.floating-menu-btn {
  width: 1.04rem;
  height: 1.04rem;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

// PC/Desktop Overrides from outsource layout
@media (min-width: 600px) {
  .home-page {
    gap: 0.24rem;
  }
  .home-page--fit {
    height: auto;
    overflow: visible;
  }
  .home-page--fit .home-swap-container,
  .home-page--fit .home-default-sections {
    flex: none;
  }
  .home-page--fit .game-center-scroll,
  .home-page--fit .coming-soon-scroll {
    flex: none;
    max-height: none;
  }
  .home-header {
    flex: none;
    flex-shrink: 0;
    max-height: none;
  }
}

.banner-fade-enter-active,
.banner-fade-leave-active {
  transition: opacity 0.35s ease-in-out;
}

.banner-fade-enter-from,
.banner-fade-leave-to {
  opacity: 0;
}
</style>
