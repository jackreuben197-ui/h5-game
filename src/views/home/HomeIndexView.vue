<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { useRouter } from 'vue-router'
import { getUserClubApi } from '@/api/user'
import { getCowboyRoomListApi } from '@/api/gc'
import { postMiscBannerLobbyApi } from '@/api/misc'
import type { RoomRecord } from '@/api/models/roomcenter'
import StorageKey from '@/constants/storageKey'
import { joinCasinoGame, getDeviceType } from '@/api/casino'
import homeHeaderFallback from '@/assets/images/home_header_large.png'
import { useMttListStore } from '@/stores/mttList'
import { useRoomListStore } from '@/stores/roomList'
import { type ClubInfo, useUserInfoStore } from '@/stores/userInfo'
import { useAppConfigStore } from '@/stores/appConfig'
import { t, getLocale, toServerLang } from '@/i18n'
import { localStore } from '@/utils/localStore'
import { useCachedImage } from '@/utils/imageCache'
import { readLobbyBannerCache, writeLobbyBannerCache } from '@/utils/lobbyBannerCache'
import { checkIsShowForClubAndTribe } from '@/utils/roomVisibility'
import { filterVisibleMttRecords } from '@/utils/mttVisibility'
import { showGameToast } from '@/components/Toast'
import { useCasinoStore } from '@/stores/casino'
import { useMinigameStore } from '@/stores/minigame'
import GameClubSelector from '@/components/GameClubSelector.vue'
import { openBridgePanel } from '@/bridge/channels'
import { openGlobalCustomerServiceChat } from '@/components/GlobalCustomerServiceChat/channel'

import imgPa from '@/assets/images/minigame-newui/pa.svg'
import imgMahjong from '@/assets/images/minigame-newui/ma.svg'
import imgFb from '@/assets/images/minigame-newui/fb.svg'
import imgCowboy from '@/assets/images/minigame-newui/sg.svg'

const popularBannerGamesStatic = [
  {
    name: 'PA真人',
    svg: imgPa,
    gameApiType: 'pa_live',
    title: '真人荷官',
    titleEn: 'Live Dealer',
    subtitle: ['美女荷官发牌', '沉浸真人体验'],
    subtitleEn: ['Real live dealers', 'Immersive experience'],
  },
  {
    name: '麻将胡了',
    svg: imgMahjong,
    gameApiType: 'mahjong',
    title: '麻将胡了',
    titleEn: 'Mahjong Ways',
    subtitle: ['电子麻将畅玩', '胡牌乐翻天'],
    subtitleEn: ['Play video mahjong', 'Big wins await'],
  },
  {
    name: 'FB体育',
    svg: imgFb,
    gameApiType: 'fb_sports',
    title: '体育竞猜',
    titleEn: 'Sports Betting',
    subtitle: ['全球赛事竞猜', '激情一触即发'],
    subtitleEn: ['Global sports betting', 'Feel the excitement'],
  },
  {
    name: '德州牛仔',
    svg: imgCowboy,
    gameApiType: 'cow_boy',
    title: '德州牛仔',
    titleEn: 'Texas Cowboy',
    subtitle: [] as string[],
    subtitleEn: [] as string[],
  },
]

const router = useRouter()
const userInfoStore = useUserInfoStore()

// 部分卡片文案为硬编码中文：en 用英文，其余语言回退中文（与 i18n 规则一致）。
const localized = (en: string, cn: string): string => (getLocale() === 'en' ? en : cn)
const roomListStore = useRoomListStore()
const mttListStore = useMttListStore()
const casinoStore = useCasinoStore()
const minigameStore = useMinigameStore()
const appConfigStore = useAppConfigStore()

const loading = ref(false)
const balanceVisible = ref(true)
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

  pendingGameInfo.value = { apiType: game.gameApiType, gameType: '', roomId: game.roomId }
  showGameClubSelector.value = true
}

function handleWalletConfirm(clubId?: number) {
  showGameClubSelector.value = false
  if (!pendingGameInfo.value) return
  const { apiType, gameType, roomId } = pendingGameInfo.value
  joinGame(apiType, gameType, roomId, clubId)
  pendingGameInfo.value = null
}

const joinGame = async (apiType: string, gameType: string, roomId = 0, clubId?: number) => {
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

    if (res.code === 0 && res.data) {
      const gameUrl = res.data.url || res.data.game_url
      if (gameUrl) {
        if (isRealNameGame && deviceType === 1) {
          const width = screen.width
          const height = screen.height
          const windowFeatures = `width=${width},height=${height},scrollbars=yes,resizable=yes,location=yes`
          window.open(gameUrl, '_blank', windowFeatures)
        } else {
          window.open(gameUrl, '_blank', 'noopener,noreferrer')
        }
      } else {
        showGameToast(t('UIErrorNetwork') || 'No game URL available')
      }
    } else {
      showGameToast((res.msg as string) || t('UIErrorNetwork'))
    }
  } catch (error: any) {
    showGameToast(error?.response?.data?.msg || t('UIErrorNetwork'))
  }
}

interface ZoneStats {
  tables: number
  players: number
}

interface HomeZoneStats {
  poker: ZoneStats
  miniGame: ZoneStats
  mahjong: ZoneStats
  mtt: ZoneStats
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
    miniGame: { tables: 0, players: 0 },
    mahjong: { tables: 0, players: 0 },
    mtt: { tables: 0, players: 0 },
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
    miniGame: normalizeZoneStats(data.miniGame),
    mahjong: normalizeZoneStats(data.mahjong),
    mtt: normalizeZoneStats(data.mtt),
  }
}

// 首屏优先读取缓存，避免从 0 闪到真实值。
function restoreHomeRoomStatsCache(): HomeZoneStats | null {
  if (typeof window === 'undefined') {
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
const selectedClubId = computed(() => toSafeInt(userInfoStore.currentClub?.club_id))
const selectedTribeId = computed(() =>
  toSafeInt((userInfoStore.currentClub as Record<string, unknown> | null)?.tribe_id),
)

const currentClub = computed<ClubInfo | null>(() => {
  if (userInfoStore.currentClub) {
    return userInfoStore.currentClub
  }
  return userInfoStore.clubList[0] || null
})

const lobbyBannerUrl = ref('')
const clubBannerUrl = useCachedImage(() => lobbyBannerUrl.value || homeHeaderFallback)
const isFallbackBanner = computed<boolean>(() => !lobbyBannerUrl.value)
const noticeText = computed(() => {
  return toSafeString(currentClub.value?.prologue)
})
const noticeTrackStyle = computed<CSSProperties>(() => ({
  '--notice-gap': `${NOTICE_GAP_PX}px`,
  '--notice-distance': `${noticeDistancePx.value}px`,
  '--notice-duration': `${noticeDurationSec.value}s`,
}))
const clubNameText = computed(
  () =>
    toSafeString(currentClub.value?.club_name)
      .replace(/[(（]\s*disband\s*[)）]?/gi, '')
      .trim() || '俱乐部',
)

const clubGoldText = computed(() => toSafeNumber(currentClub.value?.user_gold) / 100)
const pokerTablesText = computed(() => `${homeRoomStats.value.poker.tables}`)
const pokerPlayersText = computed(() => `${homeRoomStats.value.poker.players}`)
// const miniGamePlayersText = computed(() => `${homeRoomStats.value.miniGame.players}`)
const miniGamePlayersText = 632
// const mahjongPlayersText = computed(() => `${homeRoomStats.value.mahjong.players}`)
const mahjongPlayersText = 788
const mttTablesText = computed(() => `${homeRoomStats.value.mtt.tables}`)
const mttPlayersText = computed(() => `${homeRoomStats.value.mtt.players}`)
// 扑克专区为空但赛事专区有数据时，用 MTT 列表替换游戏中心/热门游戏两块。
const shouldReplaceWithMttRaw = computed(
  () => homeRoomStats.value.poker.tables === 0 && homeRoomStats.value.mtt.tables > 0,
)
// 首次进入时先按缓存渲染，等 room/mtt 两个 bootstrap 都完成再确定最终 UI，
// 避免「默认 → MTT → 默认」的中间态闪烁；初始化完成后跟随实时数据变化。
const initialized = ref(false)
const shouldReplaceWithMtt = ref(shouldReplaceWithMttRaw.value)

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

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
  void router.push('/casino')
}
function goToMinigame(): void {
  void router.push('/minigame')
}

function toggleBalance(): void {
  balanceVisible.value = !balanceVisible.value
}

async function refreshBalance(): Promise<void> {
  try {
    loading.value = true
    await getUserClubApi()
  } catch (error) {
    const message = error instanceof Error ? error.message : '刷新余额失败'
    showGameToast(message)
  } finally {
    loading.value = false
  }
}

function goToRecharge(): void {
  void router.push('/wallet')
}
function handleOpenEmail(): void {
  const email = toSafeString(appConfigStore.globalConfig?.support_email)
  window.open(`mailto:${email}`, '_blank')
}

function handleOpenTelegram(): void {
  const raw = toSafeString(appConfigStore.globalConfig?.official_contact_address)
  let telegramUrl = ''
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    telegramUrl = toSafeString(parsed?.telegram)
  } catch (error) {
    console.warn('[home] parse official_contact_address failed:', error)
  }
  window.open(telegramUrl, '_blank')
}

function handleOpenCustomerService(): void {
  const clubId = selectedClubId.value
  if (clubId <= 0) {
    showGameToast('当前俱乐部信息无效')
    return
  }

  openGlobalCustomerServiceChat({
    imServiceType: 1,
    clubId,
    tribeId: selectedTribeId.value,
  })
}

function openMiniGamePanel(): void {
  showGameToast('功能开发中')
  // openBridgePanel({
  //   panelType: 'notification',
  //   title: '', // GameDialog 标题，可留空
  //   props: {
  //     page1: {
  //       id: 1001,
  //       type: 1,
  //       name: 'XXXX123.com',
  //       icon: 'https://static.awanptest.com/pint-intl-test/image-normal/20250904131213-AUVNG.png',
  //       title: '立即下載XPoker立即下載XPoker立即下載XPoker',
  //       url: 'https://download.example.com/xpoker.apk',
  //       status: 1,
  //       create_time: Math.floor(Date.now() / 1000) - 3600,
  //     },
  //     page2: [
  //       {
  //         id: 2001,
  //         type: 2,
  //         title: '系統維護公告',
  //         content:
  //           '<p style="margin-top:200px">今晚 22:00-24:00 系統升級，請提前下牌。</p><p style="margin-top:200px">今晚 22:00-24:00 系統升級，請提前下牌。</p>',
  //         weight: 100,
  //         status: 1,
  //         create_time: Math.floor(Date.now() / 1000) - 1800,
  //       },
  //       {
  //         id: 2002,
  //         type: 2,
  //         title: '活動上線',
  //         content:
  //           '<p>新春活動火熱進行中，登錄即送鑽石！</p><p><span style="color:#05E7AE">活动内容一：</span>参与指定牌局即可获得返水奖励，返水比例最高提升至 0.8%，上不封顶。</p>',
  //         weight: 80,
  //         status: 1,
  //         create_time: Math.floor(Date.now() / 1000) - 86400,
  //       },
  //     ],
  //     page3: {
  //       id: 3001,
  //       type: 3,
  //       title: 'USDT 充值地址',
  //       content: 'TRC20 網絡，請勿轉錯TRC20 網絡，請勿轉錯TRC20 網絡，請勿轉錯',
  //       urls: [
  //         'TXxxxxxxxxxxx',
  //         'TYyyyyyyyyyyyy',
  //         'TYyyyyyyyyyyyy',
  //         'TYyyyyyyyyyyyy',
  //         'TYyyyyyyyyyyyy',
  //         '1',
  //         '1',
  //         '1',
  //         '1',
  //         'www.www.www',
  //       ],
  //       status: 1,
  //       create_time: Math.floor(Date.now() / 1000) - 5400,
  //     },
  //   },
  // })
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
    if (!checkIsShowForClubAndTribe(room, selectedClubId.value, selectedTribeId.value)) {
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

// 从牛仔列表响应中提取在线人数：优先使用 data.online，其次汇总 records[*].online。
function extractCowboyOnlineCount(raw: unknown): number {
  if (!raw || typeof raw !== 'object') {
    return 0
  }
  const data = raw as Record<string, unknown>
  // 服务端直接返回 online 时，首页只使用这个字段。
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

  // 兼容 data.data 的嵌套结构。
  return extractCowboyOnlineCount(data.data)
}

// 首页小游戏统计：使用 /api/gc/cowboy/room/list，仅取 online 字段。
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

// 首页顶部 banner：先读 public_cache 即刻渲染，再静默请求最新数据并回写缓存。
async function fetchLobbyBanner(): Promise<void> {
  const lang = toServerLang(getLocale())

  const cached = await readLobbyBannerCache(lang)
  const cachedUrl = toSafeString(cached?.lobby?.image_url)
  if (cachedUrl) {
    lobbyBannerUrl.value = cachedUrl
  }

  const response = await postMiscBannerLobbyApi({
    lang,
    type: 1,
    offset: 0,
    limit: 10,
  })
  if (Number(response.code) !== 0 || !response.data) {
    return
  }
  const url = toSafeString(response.data?.lobby?.image_url)
  if (url) {
    lobbyBannerUrl.value = url
  }
  void writeLobbyBannerCache(lang, response.data)
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

watch(shouldReplaceWithMttRaw, (val) => {
  // 初始化阶段忽略中间态；两个 bootstrap 完成后再让实时数据自由驱动展示。
  if (initialized.value) {
    shouldReplaceWithMtt.value = val
  }
})

watch(noticeText, () => {
  void updateNoticeMarquee()
})

watch(
  [() => roomListStore.records, selectedClubId, selectedTribeId],
  () => {
    refreshHomePokerMahjongStatsFromStore()
  },
  {
    deep: false,
  },
)

watch(
  [() => mttListStore.records, () => mttListStore.mttIdList, selectedClubId, selectedTribeId],
  () => {
    refreshHomeMttStatsFromStore()
  },
  {
    deep: false,
  },
)

onMounted(() => {
  void ensureClubDataReady()
  // 首页和列表页共用同一个 room store，进入首页时启动共享数据流。
  const roomListReady = roomListStore.bootstrapRoomList()
  // 首页和 MTT 列表页共用同一个 mtt store，避免重复请求。
  const mttListReady = mttListStore.bootstrapMttList()
  refreshHomePokerMahjongStatsFromStore()
  refreshHomeMttStatsFromStore()
  void fetchHomeMiniGameStats().catch((error) => {
    console.warn('[home] fetch mini game stats failed:', error)
  })
  void fetchLobbyBanner().catch((error) => {
    console.warn('[home] fetch lobby banner failed:', error)
  })
  void updateNoticeMarquee()

  // 等 room + mtt 都返回后再敲定「默认 vs MTT」布局，避免初始化阶段来回闪。
  void Promise.allSettled([roomListReady, mttListReady]).then(() => {
    shouldReplaceWithMtt.value = shouldReplaceWithMttRaw.value
    initialized.value = true
  })

  if (typeof ResizeObserver !== 'undefined') {
    noticeResizeObserver = new ResizeObserver(() => {
      void updateNoticeMarquee()
    })
    if (noticeScrollRef.value) {
      noticeResizeObserver.observe(noticeScrollRef.value)
    }
  }

  casinoStore.preloadCasinoData(undefined, true).catch((e) => {
    console.warn('[home] preload casino data failed:', e)
  })
  minigameStore.preloadMinigameData(undefined, true).catch((e) => {
    console.warn('[home] preload minigame data failed:', e)
  })
})

onBeforeUnmount(() => {
  if (noticeResizeObserver) {
    noticeResizeObserver.disconnect()
    noticeResizeObserver = null
  }
})
</script>

<template>
  <div class="home-page" :class="{ 'home-page--fit': !shouldReplaceWithMtt }">
    <!-- 0. 顶部栏：登录态仅保留 POKER 品牌 -->
    <div class="top-bar">
      <div></div>
    </div>

    <!-- 1. 顶部俱乐部介绍图 -->
    <div class="home-header">
      <div class="home-header__inner">
        <img class="home-header-img" :src="clubBannerUrl" alt="俱乐部介绍" />
        <div v-if="isFallbackBanner" class="home-header__hero">
          <div class="home-header__text">
            <p class="home-header__title">全民代理</p>
            <p class="home-header__subtitle">一键创建你的线上俱乐部</p>
          </div>
          <span class="home-header__pill">xypk.com</span>
        </div>
      </div>
    </div>

    <!-- 2. 公告栏 -->
    <div class="notice-bar">
      <img class="notice-icon" src="@/assets/icons/icon_notice.svg" alt="公告" />
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
    <div class="club-panel">
      <!-- 左侧：客服 + 余额 + 刷新 + 充值 -->
      <div class="club-left">
        <div class="club-service-row">
          <span class="service-label"> {{ clubNameText }} </span>
          <img
            class="icon-sm icon-eye"
            src="@/assets/icons/icon_eye_open.svg"
            alt="显示/隐藏"
            @click="toggleBalance"
          />
        </div>
        <div class="club-balance-row">
          <img class="icon-sm" src="@/assets/icons/diamondicon.svg" alt="余额" />
          <span v-if="loading" class="balance-amount">
            <van-loading size="16" />
          </span>
          <span v-else class="balance-amount">
            {{ balanceVisible ? clubGoldText : '****' }}
          </span>
          <svg
            class="icon-sm icon-refresh"
            xmlns="http://www.w3.org/2000/svg"
            width="19"
            height="19"
            viewBox="0 0 19 19"
            fill="none"
            @click="refreshBalance"
          >
            <path
              d="M9.22333 18.4467C4.12929 18.4467 0 14.3174 0 9.22333C0 4.12929 4.12929 0 9.22333 0C14.3174 0 18.4467 4.12929 18.4467 9.22333C18.4467 14.3174 14.3174 18.4467 9.22333 18.4467ZM13.669 13.9051C14.7823 12.8498 15.4836 11.4326 15.6471 9.90734C15.8106 8.38207 15.4257 6.84842 14.5613 5.58114C13.6969 4.31385 12.4095 3.39575 10.9298 2.9913C9.45006 2.58685 7.87467 2.72248 6.48585 3.37389L7.38512 4.99259C8.08695 4.68756 8.85365 4.56198 9.61612 4.62715C10.3786 4.69233 11.1128 4.94622 11.7527 5.36594C12.3926 5.78566 12.918 6.35802 13.2815 7.03142C13.645 7.70481 13.8352 8.45808 13.835 9.22333H11.068L13.669 13.9051ZM11.9608 15.0728L11.0615 13.4541C10.3597 13.7591 9.59301 13.8847 8.83055 13.8195C8.06808 13.7543 7.33382 13.5004 6.69394 13.0807C6.05407 12.661 5.5287 12.0886 5.16519 11.4152C4.80168 10.7418 4.61145 9.98858 4.61167 9.22333H7.37866L4.77769 4.54157C3.66433 5.59684 2.96308 7.01406 2.79958 8.53933C2.63608 10.0646 3.021 11.5982 3.88539 12.8655C4.74978 14.1328 6.03715 15.0509 7.51688 15.4554C8.9966 15.8598 10.572 15.7242 11.9608 15.0728Z"
              fill="#ABABAB"
            />
          </svg>
          <button class="recharge-btn" @click="goToRecharge">
            {{ t('OpCodeString_RECHARGE') }}
          </button>
        </div>
      </div>

      <div class="club-divider"></div>

      <!-- 右侧：联系方式 -->
      <div class="club-right">
        <div class="contact-item" @click="handleOpenTelegram">
          <img class="contact-icon" src="@/assets/icons/icon_service_1.svg" alt="Telegram" />
          <span class="contact-label"> @game </span>
        </div>
        <div class="contact-item" @click="handleOpenEmail">
          <img class="contact-icon" src="@/assets/icons/icon_service_2.svg" alt="邮箱" />
          <span class="contact-label"> {{ $txt('UISetting_SecurityBindEmailItem') }} </span>
        </div>
        <div
          v-if="currentClub?.support_im_rid"
          class="contact-item"
          @click="handleOpenCustomerService"
        >
          <img class="contact-icon" src="@/assets/icons/icon_service_3.svg" alt="IM客服" />
          <span class="contact-label"> {{ $txt('UIMineMain01') }} </span>
        </div>
      </div>
    </div>

    <!-- 扑克专区为空但赛事专区有数据时，用 MTT 列表替换 4/5 两个模块。 -->
    <div class="home-swap-container">
      <Transition name="home-swap">
        <MttContent
          v-if="shouldReplaceWithMtt"
          key="mtt"
          class="home-mtt-content home-swap-panel"
        />
        <div v-else key="default" class="home-default-sections home-swap-panel">
          <!-- 4. 游戏模块 -->
          <div class="section-header">
            <span class="section-title">{{ localized('Game Center', '游戏中心') }}</span>
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
                  <span class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
                  <img class="online-icon" src="@/assets/icons/game_zone_table_mini.png" alt="" />
                  <span class="online-num"> {{ mttTablesText }} </span>
                  <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
                  <span class="online-num"> {{ mttPlayersText }} </span>
                </div>
              </div>

              <div class="game-scroll-card poker-card" @click="goToGameList">
                <img class="zone-lg-bg" src="@/assets/icons/game_zone_poker_lg.png" alt="扑克" />
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
                  <span class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
                  <img class="online-icon" src="@/assets/icons/game_zone_table_mini.png" alt="" />
                  <span class="online-num"> {{ pokerTablesText }} </span>
                  <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
                  <span class="online-num"> {{ pokerPlayersText }} </span>
                </div>
              </div>

              <div class="game-scroll-card game-card-minigame" @click="goToMinigame">
                <img
                  class="zone-lg-bg"
                  src="@/assets/icons/game_zone_minigame_lg.png"
                  alt="小游戏"
                />
                <div class="zone-info">
                  <div class="zone-header">
                    <span class="zone-title"> {{ t('UIHomeMinigameArea') }} </span>
                    <img
                      class="zone-mini-icon"
                      src="@/assets/icons/game_zone_minigame_mini.png"
                      alt=""
                    />
                  </div>
                  <p class="zone-desc">{{ t('UIData_YGvXd5iXr_011') }}</p>
                </div>
                <div class="zone-online-bar">
                  <span class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
                  <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
                  <span class="online-num"> {{ miniGamePlayersText }} </span>
                </div>
              </div>

              <div class="game-scroll-card game-card-mahjong" @click="goToCasino">
                <img class="zone-lg-bg" src="@/assets/icons/game_zone_mahjong_lg.png" alt="麻将" />
                <div class="zone-info">
                  <div class="zone-header">
                    <span class="zone-title"> {{ localized('Casino', '娱乐场') }} </span>
                    <img
                      class="zone-mini-icon"
                      src="@/assets/icons/game_zone_mahjong_mini.png"
                      alt=""
                    />
                  </div>
                  <div class="zone-desc casino-desc">
                    <p>{{ localized('Live, Slots, Sports', '真人视讯 电子娱乐 体育竞猜') }}</p>
                    <p>{{ localized('Top Providers', '全球一线厂商') }}</p>
                  </div>
                </div>
                <div class="zone-online-bar">
                  <span class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
                  <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
                  <span class="online-num"> {{ mahjongPlayersText }} </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 5. 热门游戏 -->
          <div class="section-header">
            <span class="section-title">{{ localized('Hot Games', '热门游戏') }}</span>
          </div>
          <div class="coming-soon-scroll">
            <div class="coming-soon-track">
              <div
                v-for="(game, index) in activeBannerGames"
                :key="index"
                class="coming-soon-scroll-card"
                @click="handleBannerGameClick(game)"
              >
                <img class="coming-soon-scroll-card__img" :src="game.svg" alt="" />
                <div class="coming-soon-scroll-card__label">
                  <span class="coming-soon-scroll-card__title">{{
                    localized(game.titleEn, game.title || game.name)
                  }}</span>
                  <span
                    v-for="(line, i) in (getLocale() === 'en' ? game.subtitleEn : game.subtitle) ||
                    []"
                    :key="i"
                    class="coming-soon-scroll-card__subtitle"
                    :class="{ 'coming-soon-scroll-card__subtitle--first': i === 0 }"
                    >{{ line }}</span
                  >
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
  </div>
</template>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0 0.4rem 2.3rem;
  background: transparent;
  min-height: max-content;
  box-sizing: border-box;
  overscroll-behavior-y: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.home-page--fit {
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
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.2rem 0 0;
  flex-shrink: 0;
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

.home-header-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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

.club-panel {
  display: flex;
  align-items: center;
  background: rgba(76, 76, 76, 0.2);
  border-radius: 1rem;
  padding: 0.1rem 0.6rem;
  min-height: 1.54rem;
  gap: 0;
  border: 0.02rem solid rgba(249, 249, 249, 0.1);
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);
}

.club-left {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  flex: 1;
}

.club-service-row {
  display: flex;
  align-items: center;
  gap: 0.12rem;
}

.service-label {
  font-size: 0.3rem;
  color: #f9f9f9;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 4rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.club-balance-row {
  display: flex;
  align-items: center;
  gap: 0.12rem;
}

.icon-sm {
  width: 0.4rem;
  height: 0.4rem;
  flex-shrink: 0;
}

.icon-eye {
  width: 0.453rem;
  height: 0.347rem;
}
.icon-eye,
.icon-refresh {
  cursor: pointer;
  margin-right: 0.1rem;
}

.balance-amount {
  font-size: 0.38rem;
  color: #f9f9f9;
  font-weight: 500;
  text-align: center;
  min-width: 0.5rem;
}

.recharge-btn {
  width: 1.3rem;
  padding: 0.06rem 0rem;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 1rem;
  color: #f9f9f9;
  font-size: 0.28rem;
  cursor: pointer;
  white-space: nowrap;
}

.club-divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  align-self: stretch;
  margin: 6px 0.28rem;
}

.club-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.28rem;
  flex: 1;
}

.contact-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.contact-icon {
  width: 0.8rem;
  height: 0.8rem;
  object-fit: contain;
}

.contact-label {
  font-size: 0.2rem;
  color: #f9f9f9;
  text-align: center;
  max-width: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mtt-content {
  :deep(.mtt-group) {
    .mtt-group__title {
      color: #000;
    }
    .mtt-group__toggle {
      color: rgba($color: #000000, $alpha: 0.77);
    }
  }
}

// 保持和 .home-page 的直接子级同样的纵向堆叠 + 间距。
.home-default-sections {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

// 默认模块 <=> MTT 列表切换用淡入淡出：改用 opacity，去掉 overflow:hidden，
// 否则容器会裁掉游戏中心横向滚动到屏幕边缘的“出血边”（与 dev_merge_0624 一致）。
.home-swap-container {
  position: relative;
  width: 100%;
}

.home-swap-panel {
  width: 100%;
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

.game-card-minigame {
  background: linear-gradient(135deg, #21b4fa 0%, #1b67f0 100%);

  .zone-lg-bg {
    object-fit: contain;
    object-position: bottom right;
  }
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
</style>
