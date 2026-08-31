<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { useRouter } from 'vue-router'
import { getUserClubApi } from '@/api/user'
import { getCowboyRoomListApi } from '@/api/gc'
import type { RoomRecord } from '@/api/models/roomcenter'
import StorageKey from '@/constants/storageKey'
import { useAppConfigStore } from '@/stores/appConfig'
import { useMttListStore } from '@/stores/mttList'
import { useRoomListStore } from '@/stores/roomList'
import { type ClubInfo, useUserInfoStore } from '@/stores/userInfo'
import { t } from '@/i18n'
import { localStore } from '@/utils/localStore'
import { useLobbyBannerImages } from '@/composables/useLobbyBannerImages'
import { useHomeAnnouncement } from '@/composables/useHomeAnnouncement'
import { checkIsShowForClubAndTribe } from '@/utils/roomVisibility'
import { filterVisibleMttRecords } from '@/utils/mttVisibility'
import { showGameToast } from '@/components/Toast'
import { openGlobalCustomerServiceChat } from '@/components/GlobalCustomerServiceChat/channel'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import { useGameStore } from '@/stores/game'
import { isChannelPackageHost } from '@/utils/channelPackage'
import PokerGameList from '@/views/home/gameList.vue'
import { useChannelBottomMenu } from '@/composables/useChannelBottomMenu'
import { requireRealUser } from '@/session/realUserGate'

const router = useRouter()
const userInfoStore = useUserInfoStore()
const roomListStore = useRoomListStore()
const mttListStore = useMttListStore()
const appConfigStore = useAppConfigStore()
const gameStore = useGameStore()
const isChannelPackage = isChannelPackageHost()
const { isVersionB: isChannelMenuVersionB } = useChannelBottomMenu()

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

const { bannerImages, fetchLobbyBannerImages } = useLobbyBannerImages()
const { noticeText, ensureHomeAnnouncementConfig } = useHomeAnnouncement()
const noticeTrackStyle = computed<CSSProperties>(() => ({
  '--notice-gap': `${NOTICE_GAP_PX}px`,
  '--notice-distance': `${noticeDistancePx.value}px`,
  '--notice-duration': `${noticeDurationSec.value}s`,
}))
const clubNameText = computed(
  () => toSafeString(currentClub.value?.club_name) || t('UILobby_Menu_menu_btn_club'),
)

const clubGoldText = computed(() =>
  gameStore.isRealUser ? toSafeNumber(currentClub.value?.user_gold) / 100 : 0,
)
const pokerTablesText = computed(() => `${homeRoomStats.value.poker.tables}`)
const pokerPlayersText = computed(() => `${homeRoomStats.value.poker.players}`)
// const miniGamePlayersText = computed(() => `${homeRoomStats.value.miniGame.players}`)
const miniGamePlayersText = 0
// const mahjongTablesText = computed(() => `${homeRoomStats.value.mahjong.tables}`)
const mahjongTablesText = 0
// const mahjongPlayersText = computed(() => `${homeRoomStats.value.mahjong.players}`)
const mahjongPlayersText = 0
const mttTablesText = computed(() => `${homeRoomStats.value.mtt.tables}`)
const mttPlayersText = computed(() => `${homeRoomStats.value.mtt.players}`)
type HomeContentMode = 'zones' | 'mtt' | 'poker'

// 渠道包版本 B 的首页固定保留首页信息区，底部嵌入扑克列表。
// 版本 A 与官方包继续沿用现有的单类型 / 专区入口行为。
const homeContentModeRaw = computed<HomeContentMode>(() => {
  const pokerTables = homeRoomStats.value.poker.tables
  const mttTables = homeRoomStats.value.mtt.tables
  if (isChannelMenuVersionB.value) {
    return 'poker'
  }
  if (mttTables > 0 && pokerTables === 0) {
    return 'mtt'
  }
  if (isChannelPackage && pokerTables > 0 && mttTables === 0) {
    return 'poker'
  }
  return 'zones'
})
// 首次进入时先按缓存渲染，等 room/mtt 两个 bootstrap 都完成再确定最终模式，
// 避免列表与专区入口在初始化中来回切换；初始化完成后跟随实时数据变化。
const initialized = ref(false)
const homeContentMode = ref<HomeContentMode>(homeContentModeRaw.value)

const currentJoinedClub = computed(() => userInfoStore.currentJoinedClub)
const channelUserLevel = computed(() => toSafeInt(currentJoinedClub.value?.user_level))
const canCreateChannelTable = computed(
  () =>
    isChannelPackage &&
    Boolean(gameStore.isRealUser && currentJoinedClub.value) &&
    channelUserLevel.value >= 1 &&
    channelUserLevel.value <= 3,
)
const canManageChannelClub = computed(
  () => isChannelPackage && Boolean(gameStore.isRealUser && currentJoinedClub.value),
)
const showChannelFloatingActions = computed(
  () => canCreateChannelTable.value || canManageChannelClub.value,
)

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

function openGuestAuth(mode: 'login' | 'register'): void {
  requireRealUser(undefined, { mode })
}

function goToClubDetail(): void {
  if (!requireRealUser(goToClubDetail)) return
  void router.push('/club/detail')
}

function goToCreateTable(): void {
  if (!requireRealUser(goToCreateTable)) return
  void router.push({
    path: '/club/table/create',
    query: { origin_type: 5, return_to: 'home' },
  })
}

function toggleBalance(): void {
  if (!requireRealUser(toggleBalance)) return
  balanceVisible.value = !balanceVisible.value
}

async function refreshBalance(): Promise<void> {
  if (!requireRealUser(refreshBalance)) return
  try {
    loading.value = true
    await getUserClubApi()
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIHome_Fail')
    showGameToast(message)
  } finally {
    loading.value = false
  }
}

function goToRecharge(): void {
  if (!requireRealUser(goToRecharge)) return
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
  if (!requireRealUser(handleOpenCustomerService)) return
  const clubId = selectedClubId.value
  if (clubId <= 0) {
    showGameToast(t('UIClub_CurrentClubNo'))
    return
  }

  openGlobalCustomerServiceChat({
    imServiceType: 1,
    clubId,
    tribeId: selectedTribeId.value,
  })
}

function openMiniGamePanel(): void {
  if (!requireRealUser(openMiniGamePanel)) return
  showGameToast(t('UIClub_InDeve'))
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
  if (!gameStore.sessionToken.trim()) {
    return
  }
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

watch(homeContentModeRaw, (val) => {
  // 初始化阶段忽略中间态；两个 bootstrap 完成后再让实时数据自由驱动展示。
  if (initialized.value) {
    homeContentMode.value = val
  }
})

watch(noticeText, () => {
  void updateNoticeMarquee()
})

watch(
  () => gameStore.sessionToken,
  (token, previousToken) => {
    if (token && token !== previousToken) {
      void fetchHomeMiniGameStats().catch((error) => {
        console.warn('[home] fetch mini game stats failed:', error)
      })
    }
  },
)

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
  [
    () => mttListStore.records,
    () => mttListStore.mttIdList,
    selectedClubId,
    selectedTribeId,
    // 全局配置异步到达后重算，平台 MTT 可见性依赖 club_display_platform_mtt。
    () => appConfigStore.clubDisplayPlatformMtt,
  ],
  () => {
    refreshHomeMttStatsFromStore()
  },
  {
    deep: false,
  },
)

onMounted(() => {
  if (!gameStore.isRealUser) {
    void appConfigStore.ensureGuestGlobalConfig()
  }
  void ensureClubDataReady()
  void ensureHomeAnnouncementConfig().catch((error) => {
    console.warn('[home] fetch announcement config failed:', error)
  })
  // 首页和列表页共用同一个 room store，进入首页时启动共享数据流。
  const roomListReady = roomListStore.bootstrapRoomList()
  // 首页和 MTT 列表页共用同一个 mtt store，避免重复请求。
  const mttListReady = mttListStore.bootstrapMttList()
  refreshHomePokerMahjongStatsFromStore()
  refreshHomeMttStatsFromStore()
  void fetchHomeMiniGameStats().catch((error) => {
    console.warn('[home] fetch mini game stats failed:', error)
  })
  void fetchLobbyBannerImages().catch((error) => {
    console.warn('[home] fetch lobby banner failed:', error)
  })
  void updateNoticeMarquee()

  // 等 room + mtt 都返回后再敲定最终布局，避免初始化阶段来回闪。
  void Promise.allSettled([roomListReady, mttListReady]).then(() => {
    homeContentMode.value = homeContentModeRaw.value
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
})

onBeforeUnmount(() => {
  if (noticeResizeObserver) {
    noticeResizeObserver.disconnect()
    noticeResizeObserver = null
  }
})
</script>

<template>
  <div class="home-page">
    <!-- 0. 正式首页统一承载游客/真实账号；游客仅额外显示注册、登录入口。 -->
    <div class="top-bar">
      <span class="top-bar__logo">POKER</span>
      <div v-if="!gameStore.isRealUser" class="top-bar__actions">
        <button
          class="top-bar__btn top-bar__btn--register"
          type="button"
          @click="openGuestAuth('register')"
        >
          {{ t('UILogin_TitleRegister') }}
        </button>
        <button
          class="top-bar__btn top-bar__btn--login"
          type="button"
          @click="openGuestAuth('login')"
        >
          {{ t('UIGuild_MemberManagerSortByLastLoginTime') }}
        </button>
      </div>
    </div>

    <!-- 1. 顶部俱乐部介绍轮播图 -->
    <div class="home-header">
      <HomeBannerSwiper :images="bannerImages" />
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
    <div class="club-panel">
      <!-- 左侧：客服 + 余额 + 刷新 + 充值 -->
      <div class="club-left">
        <div class="club-service-row">
          <span class="service-label"> {{ clubNameText }} </span>
          <img
            class="icon-sm icon-eye"
            src="@/assets/icons/icon_eye_open.svg"
            :alt="t('UIHome_Text') + '/' + t('UIHome_Text2')"
            @click="toggleBalance"
          />
        </div>
        <div class="club-balance-row">
          <img
            class="icon-sm"
            src="@/assets/icons/icon_chips.png"
            :alt="t('UIClub_CreateRoom31')"
          />
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

      <!-- 右侧：联系方式 -->
      <div class="club-right">
        <div class="contact-item" @click="handleOpenTelegram">
          <AppSvgIcon class="contact-icon" name="telegram" title="Telegram" />
          <span class="contact-label"> @game </span>
        </div>
        <div class="contact-item" @click="handleOpenEmail">
          <AppSvgIcon
            class="contact-icon"
            name="contact-user"
            :title="t('UISetting_SecurityBindEmailItem')"
          />
          <span class="contact-label"> {{ $txt('UISetting_SecurityBindEmailItem') }} </span>
        </div>
        <div
          v-if="currentClub?.support_im_rid"
          class="contact-item"
          @click="handleOpenCustomerService"
        >
          <AppSvgIcon
            class="contact-icon"
            name="customer-service"
            :title="'IM' + t('UIMineMain01')"
          />
          <span class="contact-label"> {{ $txt('UIMineMain01') }} </span>
        </div>
      </div>
    </div>

    <!-- 渠道包单类型直接展示列表；赛事和牌桌并存时展示专区入口。 -->
    <div class="home-swap-container">
      <Transition name="home-swap">
        <div v-if="homeContentMode === 'mtt'" key="mtt" class="home-swap-panel">
          <MttContent class="home-mtt-content" />
        </div>
        <PokerGameList
          v-else-if="homeContentMode === 'poker'"
          key="poker"
          embedded
          class="home-poker-content home-swap-panel"
        />
        <div v-else key="default" class="home-default-sections home-swap-panel">
          <!-- 4. 游戏模块 -->
          <div class="section-header">
            <span class="section-title">{{ t('UIHome_Text3') }}</span>
          </div>
          <div class="game-center-scroll">
            <div class="game-center-track">
              <!-- MTT赛事专区 -->
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

              <!-- 扑克专区 -->
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
                  <span class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
                  <img class="online-icon" src="@/assets/icons/game_zone_table_mini.png" alt="" />
                  <span class="online-num"> {{ pokerTablesText }} </span>
                  <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
                  <span class="online-num"> {{ pokerPlayersText }} </span>
                </div>
              </div>

              <!-- 小游戏专区 -->
              <div
                v-if="false"
                class="game-scroll-card game-card-minigame"
                @click="openMiniGamePanel"
              >
                <img
                  class="zone-lg-bg"
                  src="@/assets/icons/game_zone_minigame_lg.png"
                  :alt="t('UIClub_Text24')"
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

              <!-- 麻将专区 -->
              <div
                v-if="false"
                class="game-scroll-card game-card-mahjong"
                @click="showGameToast(t('UIClub_InDeve'))"
              >
                <img
                  class="zone-lg-bg"
                  src="@/assets/icons/game_zone_mahjong_lg.png"
                  :alt="t('Mahjong_Name')"
                />
                <div class="zone-info">
                  <div class="zone-header">
                    <span class="zone-title"> {{ t('UIHomeMahjongArea') }} </span>
                    <img
                      class="zone-mini-icon"
                      src="@/assets/icons/game_zone_mahjong_mini.png"
                      alt=""
                    />
                  </div>
                  <div class="zone-desc">
                    <div class="mr-4">{{ t('Mahjong_BloodFight') }}</div>
                    <div class="mr-4">{{ t('Mahjong_BloodRiver') }}</div>
                    <div class="mr-4">{{ t('Mahjong_Standard') }}</div>
                  </div>
                </div>
                <div class="zone-online-bar">
                  <span class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
                  <img class="online-icon" src="@/assets/icons/game_zone_table_mini.png" alt="" />
                  <span class="online-num"> {{ mahjongTablesText }} </span>
                  <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
                  <span class="online-num"> {{ mahjongPlayersText }} </span>
                </div>
              </div>

              <!-- 即将开放 -->
              <div class="game-scroll-card coming-soon-card coming-soon-right">
                <img
                  class="zone-lg-bg"
                  src="@/assets/icons/game_zone_comming_lg.png"
                  :alt="t('UIHomeComingSoon')"
                />
                <div class="coming-soon-overlay"></div>
                <span class="coming-soon-text"> {{ t('UIHomeComingSoon') }}</span>
              </div>

              <!-- 桌面端补齐第四张卡片，移动端维持原来的三张。 -->
              <div
                class="game-scroll-card coming-soon-card coming-soon-right desktop-only-game-card"
              >
                <img
                  class="zone-lg-bg"
                  src="@/assets/icons/game_zone_comming_lg.png"
                  :alt="t('UIHomeComingSoon')"
                />
                <div class="coming-soon-overlay"></div>
                <span class="coming-soon-text"> {{ t('UIHomeComingSoon') }}</span>
              </div>
            </div>
          </div>

          <!-- 5. 即将开放横向滚动 -->
          <div class="section-header">
            <span class="section-title">{{ t('UIHome_Text4') }}</span>
          </div>
          <div class="coming-soon-scroll">
            <div class="coming-soon-track">
              <div v-for="i in 4" :key="i" class="coming-soon-scroll-card">
                <div class="coming-soon-scroll-card__overlay"></div>
                <span class="coming-soon-scroll-card__text">{{ t('UIHomeComingSoon') }}</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <div v-if="showChannelFloatingActions" class="floating-action-area">
      <button
        v-if="canCreateChannelTable"
        class="create-table-btn"
        type="button"
        @click="goToCreateTable"
      >
        {{ t('UIGuild_CreateTable') }}
      </button>
      <button
        v-if="canManageChannelClub"
        class="floating-menu-btn"
        type="button"
        :aria-label="t('UIClub_ClubManager')"
        @click="goToClubDetail"
      >
        <span></span>
        <span></span>
        <span></span>
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
  padding: 0 0.4rem 2.3rem;
  background: transparent;
  min-height: max-content;
  box-sizing: border-box;
  overscroll-behavior-y: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  :deep(.group-item) {
    padding: 0.2667rem 0.2rem 0.45rem;
  }
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.2rem 0 0;
  flex-shrink: 0;
}

.top-bar__logo {
  font-size: 0.54rem;
  font-weight: 900;
  color: #000;
  text-shadow:
    0.5px 0 0 currentColor,
    -0.5px 0 0 currentColor,
    0 0.5px 0 currentColor,
    0 -0.5px 0 currentColor;
  letter-spacing: 0.05rem;
  font-family: 'HONOR Sans CN', sans-serif;
}

.top-bar__actions {
  display: flex;
  gap: 0.1rem;
}

.top-bar__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.18rem 0.75rem;
  border: 0;
  border-radius: 0.56rem;
  font-family: 'PingFang SC', sans-serif;
  font-size: 0.34rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;

  &:active {
    opacity: 0.85;
  }
}

.top-bar__btn--register {
  color: rgba(0, 0, 0, 0.82);
  background: rgba(174, 174, 174, 0.52);
  box-shadow: 0.01rem 0.01rem 0.03rem rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(0.14rem);

  @include theme-light {
    color: #fff;
  }
}

.top-bar__btn--login {
  color: #fff;
  background: linear-gradient(157deg, #05e7ae 0%, #027a5c 100%);
  backdrop-filter: blur(0.55rem);

  @include theme-light {
    background: var(--c-brand);
  }
}

.home-header {
  width: 100%;
  border-radius: 0.8rem;
  overflow: hidden;
  flex-shrink: 0;
}

.notice-bar {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  padding: 0rem 0.18rem;
  background-color: #fff;
  border: 0.302px solid rgba(0, 0, 0, 0.16);
  border-radius: 1rem;
  height: 0.5rem;
  min-height: 0.5rem;
  box-sizing: border-box;
}

.notice-icon {
  width: 0.43rem;
  height: 0.43rem;
  flex-shrink: 0;
}

.notice-marquee {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.notice-label {
  font-size: 0.28rem;
  color: #000;
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
  color: #000;
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
  background: #fff;
  border-radius: 1rem;
  padding: 0.1rem 0.6rem;
  min-height: 1.54rem;
  gap: 0;
  border: 0.302px solid rgba(0, 0, 0, 0.16);
  box-sizing: border-box;
  box-shadow:
    inset 1px 1px 0px 0px rgba(255, 255, 255, 0.35),
    inset -1px -1px 0px 0px rgba(255, 255, 255, 0.35);
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
  color: #000;
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
  color: #000;
  font-weight: 500;
  text-align: center;
  min-width: 0.5rem;
}

.recharge-btn {
  width: 1.3rem;
  padding: 0.06rem 0rem;
  background: #e7e7e7;
  border: none;
  border-radius: 1rem;
  color: #000;
  font-size: 0.28rem;
  cursor: pointer;
  white-space: nowrap;
}

.club-right {
  display: flex;
  align-items: center;
  gap: 0.28rem;
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
  border-radius: 50%;
  box-sizing: border-box;
  color: #0ca7ef;
  background: #f7f8fa;

  @include theme-light {
    color: #000;
  }
}

.contact-label {
  font-size: 0.2rem;
  color: #000;
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
      color: rgba(0, 0, 0, 0.77);
    }
  }
}

// 保持和 .home-page 的直接子级同样的纵向堆叠 + 间距。
.home-default-sections {
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
  padding: 0 0.4rem;
}

// 默认模块 <=> MTT 列表切换的横向推入（新面板从右滑入，旧面板向左滑出）。
.home-swap-container {
  position: relative;
  // overflow: hidden;
  // width: 100%;
  margin-left: -0.4rem;
  margin-right: -0.4rem;
  min-height: 5rem;
}

.home-swap-panel {
  width: 100%;
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
  transition: transform 0.32s ease;
  will-change: transform;
}

// 切换期间旧面板脱离流，避免撑高容器；新面板在流内决定容器高度。
.home-swap-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.home-swap-enter-from {
  transform: translateX(100%);
}
.home-swap-enter-to {
  transform: translateX(0);
}
.home-swap-leave-from {
  transform: translateX(0);
}
.home-swap-leave-to {
  transform: translateX(-100%);
}

.section-header {
  padding: 0.12rem 0 0;
  .section-title {
    font-size: 0.38rem;
    font-weight: 700;
    margin-bottom: 0rem;
    color: #000;
    font-family: 'HONOR Sans CN', sans-serif;
  }
}

.game-center-scroll {
  width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.game-center-track {
  display: flex;
  gap: 0.15rem;
  width: max-content;
}

.game-scroll-card {
  flex-shrink: 0;
  width: 2.95rem;
  // 同时兜底窄高(14PM 932)与窄矮(SE 667):用 vh 做陡峭斜率,clamp 在两端各自落到 min/max。
  height: clamp(2.8rem, calc(25vh - 65px), 3.91rem);
  border-radius: 0.37rem;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background: #54b78d;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.26rem 0.2rem 0.2rem;
  box-sizing: border-box;

  &:active {
    opacity: 0.85;
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
  width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.coming-soon-track {
  display: flex;
  gap: 0.15rem;
  padding-bottom: 0.1rem;
  width: max-content;
}

.coming-soon-scroll-card {
  flex-shrink: 0;
  width: 2.95rem;
  height: clamp(2rem, calc(35vh - 158px), 3.91rem);
  border-radius: 0.51rem;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 0.01rem solid rgba(249, 249, 249, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    opacity: 0.85;
  }
}

.coming-soon-scroll-card__overlay {
  position: absolute;
  inset: 0;
  background: url('@/assets/images/home_comming_soon_2.png') center / cover no-repeat;
  border-radius: inherit;
}

.coming-soon-scroll-card__text {
  position: relative;
  z-index: 1;
  font-size: 0.29rem;
  font-weight: 500;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
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

.create-table-btn {
  width: 3.1rem;
  height: 0.94rem;
  border: 0.0133rem solid rgba(242, 242, 242, 0.8);
  border-radius: 0.6rem;
  background-image: linear-gradient(168deg, #05e7ae 7.55%, #027a5c 71.92%);
  color: #fbfbfb;
  font-size: 0.34rem;
  font-weight: 500;
  box-shadow: 0 0.12rem 0.26rem rgba(0, 0, 0, 0.22);

  @include theme-light {
    border-color: transparent;
    background: var(--c-brand);
    box-shadow: 0 0.12rem 0.28rem rgba(var(--c-brand-rgb), 0.25);
  }
}

.floating-menu-btn {
  width: 0.86rem;
  height: 0.86rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 25%, #056a57 0%, #01382f 75%);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.07rem;
  box-shadow: 0 0.12rem 0.26rem rgba(0, 0, 0, 0.34);
}

.floating-menu-btn span {
  width: 0.23rem;
  height: 0.055rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
}
</style>
