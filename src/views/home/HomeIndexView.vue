<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { useRouter } from 'vue-router'
import { getUserClubApi } from '@/api/user'
import { getCowboyRoomListApi } from '@/api/gc'
import type { RoomRecord } from '@/api/models/roomcenter'
import StorageKey from '@/constants/storageKey'
import { joinCasinoGame, getDeviceType } from '@/api/casino'
import homeHeaderFallback from '@/assets/images/home_header_2.png'
import { useMttListStore } from '@/stores/mttList'
import { useRoomListStore } from '@/stores/roomList'
import { type ClubInfo, useUserInfoStore } from '@/stores/userInfo'
import { t } from '@/i18n'
import { localStore } from '@/utils/localStore'
import { checkIsShowForClubAndTribe } from '@/utils/roomVisibility'
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
  { name: 'PA真人', svg: imgPa, gameApiType: 'pa_live' },
  { name: '麻将胡了', svg: imgMahjong, gameApiType: 'mahjong' },
  { name: 'FB体育', svg: imgFb, gameApiType: 'fb_sports' },
  { name: '德州牛仔', svg: imgCowboy, gameApiType: 'cow_boy' },
]

const router = useRouter()
const userInfoStore = useUserInfoStore()
const roomListStore = useRoomListStore()
const mttListStore = useMttListStore()
const casinoStore = useCasinoStore()
const minigameStore = useMinigameStore()

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
  return popularBannerGamesStatic.map(staticGame => {
    let matched = apiGames.find(g => {
      if (staticGame.name === 'PA真人') {
        return g.game_name?.includes('PA') || g.game_api_type === 'pa_live' || g.game_name?.includes('DB视讯') || g.game_name === 'DB真人'
      }
      if (staticGame.name === '麻将胡了') {
        return g.game_name === '麻将胡了' || g.game_api_type === 'slots_gpd'
      }
      if (staticGame.name === 'FB体育') {
        return g.game_api_type === 'fb_sports' || g.game_name === 'FB体育'
      }
      if (staticGame.name === '德州牛仔') {
        return g.game_type === 'cow_boy' || g.game_api_type === 'cow_boy' || g.game_name === '德州牛仔'
      }
      return false
    })

    // If not found in popularBannerGames, try gameRecords as fallback
    if (!matched) {
      const allGames = casinoStore.gameRecords || []
      matched = allGames.find(g => {
        if (staticGame.name === 'PA真人') return g.game_name?.includes('PA') || g.game_api_type === 'pa_live' || g.game_name?.includes('DB视讯') || g.game_name === 'DB真人'
        if (staticGame.name === '麻将胡了') return g.game_name === '麻将胡了' || g.game_api_type === 'slots_gpd'
        if (staticGame.name === 'FB体育') return g.game_api_type === 'fb_sports' || g.game_name === 'FB体育'
        if (staticGame.name === '德州牛仔') return g.game_type === 'cow_boy' || g.game_api_type === 'cow_boy' || g.game_name === '德州牛仔'
        return false
      })
    }

    return {
      ...staticGame,
      gameApiType: matched?.game_api_type || staticGame.gameApiType,
      roomId: matched?.id || matched?.game_room_id || 0
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

    if (res.code === 0 && res.data) {
      const gameUrl = res.data.url || res.data.game_url
      if (gameUrl) {
        if (isRealNameGame && deviceType === 1) {
          const width = screen.width;
          const height = screen.height;
          const windowFeatures = `width=${width},height=${height},scrollbars=yes,resizable=yes,location=yes`;
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

const clubBannerUrl = computed(() => toSafeString(currentClub.value?.banner) || homeHeaderFallback)
const noticeText = computed(() => {
  return toSafeString(currentClub.value?.prologue)
})
const noticeTrackStyle = computed<CSSProperties>(() => ({
  '--notice-gap': `${NOTICE_GAP_PX}px`,
  '--notice-distance': `${noticeDistancePx.value}px`,
  '--notice-duration': `${noticeDurationSec.value}s`,
}))
const clubNameText = computed(() => toSafeString(currentClub.value?.club_name) || '俱乐部')

const clubGoldText = computed(() => toSafeNumber(currentClub.value?.user_gold) / 100)
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
function handleService(): void {
  showGameToast('功能开发中')
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
  router.push('/home2')
  // openBridgePanel({
  //   // panelType: 'mttRecord',
  //   panelType: 'mttSettlement',
  //   closeOnClickOverlay: true,
  //   // showH5Bg: true,
  //   props: {
  //     matchId: 92180450,
  //     matchName: 'MTT202603121773282270383563',
  //     isRebuy: false,
  //     startTime: '',
  //     currentBlindLevel: 0,
  //     maxRebuyBlindLevel: 10,
  //     remainRebuyTimes: 2,
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

// 首页 MTT 统计：直接复用共享 MTT 列表 store，避免首页和列表页分叉取数。
function refreshHomeMttStatsFromStore(): void {
  const nextMtt = { tables: 0, players: 0 }
  mttListStore.records.forEach((item) => {
    nextMtt.tables += toSafeNumber(item.rooms)
    nextMtt.players += toSafeNumber(item.participants)
  })

  homeRoomStats.value = {
    ...homeRoomStats.value,
    mtt: nextMtt,
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
  [() => roomListStore.records, selectedClubId, selectedTribeId],
  () => {
    refreshHomePokerMahjongStatsFromStore()
  },
  {
    deep: false,
  },
)

watch(
  () => mttListStore.records,
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
  roomListStore.bootstrapRoomList()
  // 首页和 MTT 列表页共用同一个 mtt store，避免重复请求。
  mttListStore.bootstrapMttList()
  refreshHomePokerMahjongStatsFromStore()
  refreshHomeMttStatsFromStore()
  void fetchHomeMiniGameStats().catch((error) => {
    console.warn('[home] fetch mini game stats failed:', error)
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
  <div class="home-page">
    <!-- 1. 顶部俱乐部介绍图 -->
    <div class="home-header">
      <img class="home-header-img" :src="clubBannerUrl" alt="俱乐部介绍" />
    </div>

    <!-- 2. 公告栏 -->
    <div class="notice-bar">
      <img class="notice-icon" src="@/assets/icons/icon_notice.png" alt="公告" />
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
            src="@/assets/icons/icon_eye_open.png"
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
          <img
            class="icon-sm icon-refresh"
            src="@/assets/icons/icon_refresh.png"
            alt="刷新"
            @click="refreshBalance"
          />
          <button class="recharge-btn" @click="goToRecharge">
            {{ t('OpCodeString_RECHARGE') }}
          </button>
        </div>
      </div>

      <!-- 分割线 -->
      <div class="club-divider"></div>

      <!-- 右侧：联系方式 -->
      <div class="club-right">
        <div class="contact-item" @click="handleService">
          <img class="contact-icon" src="@/assets/icons/icon_service_1.png" alt="Telegram" />
          <span class="contact-label"> @game </span>
        </div>
        <div class="contact-item" @click="handleService">
          <img class="contact-icon" src="@/assets/icons/icon_service_2.png" alt="邮箱" />
          <span class="contact-label"> {{ $txt('UISetting_SecurityBindEmailItem') }} </span>
        </div>
        <div
          v-if="currentClub?.support_im_rid"
          class="contact-item"
          @click="handleOpenCustomerService"
        >
          <img class="contact-icon" src="@/assets/icons/icon_service_3.png" alt="IM客服" />
          <span class="contact-label"> {{ $txt('UIMineMain01') }} </span>
        </div>
      </div>
    </div>

    <!-- 4. 游戏模块 -->
    <div class="game-zones">
      <!-- 左侧：MTT赛事 + 小游戏 -->
      <div class="game-zone-left">
        <!-- MTT赛事专区 / 扑克比赛 -->
        <div
          class="game-card game-card-mtt"
          style="flex: 1; min-height: 5.54rem"
          @click="goToMttList"
        >
          <!-- Background photo composite -->
          <div class="mtt-bg-wrap">
            <img class="mtt-bg-main" src="@/assets/images/game_zone_mtt_bg.png" alt="" />
            <div class="mtt-bg-inner">
              <img class="mtt-bg-tex" src="@/assets/images/game_zone_mtt_bg2.png" alt="" />
            </div>
          </div>
          <!-- Base warm overlay: rgba(71,35,25,0.3) -->
          <div class="mtt-layer-base"></div>
          <!-- Blur vignette layer 1: blur(34.67px) + rgba(49,35,29,0.81) + mask -->
          <div class="mtt-layer-blur1"></div>
          <!-- Blur vignette layer 2: blur(39.623px) + rgba(37,25,21,0.93) + mask -->
          <div class="mtt-layer-blur2"></div>
          <!-- Title centered, top:49.22px -->
          <div class="mtt-title-wrap">
            <span class="mtt-title">{{ t('UIHomeMttArea') }}</span>
          </div>
          <!-- Top-right vector icon: left:151.04px top:10.03px size:9px -->
          <img class="mtt-vector-icon" src="@/assets/icons/game_zone_mtt_vector.png" alt="" />
          <!-- Online bar: centered, top:182.03px -->
          <div class="mtt-online-bar">
            <span class="mtt-bar-label">{{ t('UIClub_Mlist_zaixian') }}</span>
            <div class="mtt-bar-group">
              <span class="mtt-table-rect"></span>
              <span class="mtt-bar-label">{{ mttTablesText }}桌</span>
            </div>
            <div class="mtt-bar-group">
              <img class="mtt-user-icon" src="@/assets/icons/icon_solar_user_bold.png" alt="" />
              <span class="mtt-bar-label">{{ mttPlayersText }}人</span>
            </div>
          </div>
        </div>

        <!-- 小游戏专区 -->
        <div
          class="game-card game-card-minigame"
          style="min-height: 2.7rem"
          @click="goToMinigame"
        >
          <!-- Title: left:38.04px top:41.03px, font 15px ExtraBold -->
          <div class="mg-title-wrap">
            <span class="mg-title">{{ t('UIHomeMinigameArea') }}</span>
          </div>
          <!-- Mask group icon: inset(8.94% 6.7% 81.16% 86.25%) top-right -->
          <div class="mg-mask-group">
            <div class="mg-mask-inner">
              <img class="mg-mask-img" src="@/assets/images/game_zone_minigame_mask.png" alt="" />
            </div>
          </div>
          <!-- Online bar: left:53.04px top:80.03px, rgba(199,199,199,0.15) mix-blend-plus-lighter -->
          <div class="mg-online-bar">
            <div class="mg-online-bg" aria-hidden="true"></div>
            <div class="mg-online-content">
              <span class="mg-bar-label">{{ t('UIClub_Mlist_zaixian') }}</span>
              <div class="mg-bar-group">
                <img class="mg-user-icon" src="@/assets/icons/icon_solar_user_bold.png" alt="" />
                <span class="mg-bar-label">{{ miniGamePlayersText }}人</span>
              </div>
            </div>
          </div>
          <!-- Character Object: inset(-12.06% 76.76% 45.39% -3.52%), overflow-hidden -->
          <div class="mg-character-wrap">
            <div class="mg-character-inner">
              <img
                class="mg-character-img"
                src="@/assets/images/game_zone_minigame_object.png"
                alt=""
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：德州扑克 + 娱乐场 -->
      <div class="game-zone-right">
        <!-- 德州扑克 -->
        <div class="game-card poker-card" @click="goToGameList">
          <!-- ip5 2: masked secondary image (bottom area composite) -->
          <div class="pk-ip2-wrap">
            <img class="pk-ip2-img" src="@/assets/images/game_zone_poker_ip2.png" alt="" />
          </div>
          <!-- ip5 1: main IP character, left:-0.04px top:3.55px size:167.965×224.016px -->
          <div class="pk-ip1-wrap">
            <img class="pk-ip1-img" src="@/assets/images/game_zone_poker_ip.png" alt="" />
          </div>
          <!-- Title: left:45.04px top:9.03px, 15px ExtraBold -->
          <div class="pk-title-wrap">
            <span class="pk-title">{{ t('UIHomePokerArea') }}</span>
          </div>
          <!-- Vector icon: left:144.04px top:9.03px, 12×10px -->
          <img class="pk-vector-icon" src="@/assets/icons/game_zone_poker_vector.png" alt="" />
          <!-- Online bar: left:32.04px top:188.03px, blur+rgba(56,55,55,0.61) -->
          <div class="pk-online-bar">
            <span class="pk-bar-label">{{ t('UIClub_Mlist_zaixian') }}</span>
            <div class="pk-bar-stats">
              <div class="pk-bar-group pk-bar-group--table">
                <span class="pk-table-rect"></span>
                <span class="pk-bar-label">{{ pokerTablesText }}桌</span>
              </div>
              <div class="pk-bar-group pk-bar-group--people">
                <img class="pk-user-icon" src="@/assets/icons/icon_solar_user_bold.png" alt="" />
                <span class="pk-bar-label">{{ pokerPlayersText }}人</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 娱乐场（右侧下方）-->
        <div class="game-card en-card" @click="goToCasino">
          <div class="en-bg1-wrap">
            <img class="en-bg1-img" src="@/assets/images/game_zone_entertainment_bg1.png" alt="" />
          </div>
          <div class="en-bg2-wrap">
            <img class="en-bg2-img" src="@/assets/images/game_zone_entertainment_bg2.png" alt="" />
          </div>
          <div class="en-base-overlay"></div>
          <div class="en-blur1"></div>
          <div class="en-blur2"></div>
          <div class="en-title-wrap">
            <span class="en-title">娱乐场</span>
          </div>
          <img
            class="en-vector-icon"
            src="@/assets/icons/game_zone_entertainment_vector.png"
            alt=""
          />
          <div class="en-online-bar">
            <div class="en-online-bg" aria-hidden="true"></div>
            <div class="en-online-content">
              <span class="en-bar-label">{{ t('UIClub_Mlist_zaixian') }}</span>
              <div class="en-bar-group">
                <img class="en-user-icon" src="@/assets/icons/icon_solar_user_bold.png" alt="" />
                <span class="en-bar-label">{{ miniGamePlayersText }}人</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. 底部4个热门游戏 (原即将开放) -->
    <div class="coming-soon-row">
      <div v-for="(game, index) in activeBannerGames" :key="index" class="coming-soon-small" @click="handleBannerGameClick(game)">
        <img class="coming-soon-full-svg" :src="game.svg" alt="" />
      </div>
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
  gap: 0.24rem;
  padding: 0 0.4rem 4rem; // 底部留出 tabbar 高度
  background: transparent;
  // 由 MainLayoutView 统一滚动，这里不再单独设滚动容器。
  min-height: max-content;
  box-sizing: border-box;
  // 隐藏滚动条但保留滚动功能
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

/* ===== 1. 顶部 Header ===== */
.home-header {
  width: 100%;
  border-radius: 0.42rem;
  overflow: hidden;
  flex-shrink: 0;
}

.home-header-img {
  width: 100%;
  height: 3.7rem;
  object-fit: cover;
  display: block;
}

/* ===== 2. 公告栏 ===== */
.notice-bar {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  padding: 0rem 0.18rem;
  border-radius: 505.114px;
  height: 0.5rem;
  min-height: 0.5rem;
  background: rgba(76, 76, 76, 0.3);
  position: relative;
  box-shadow:
  /* 左上高光 */
    inset 1px 1px 0px 0px rgba(255, 255, 255, 0.35),
    /* 右下高光 */ inset -1px -1px 0px 0px rgba(255, 255, 255, 0.35);
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
  color: #fff;
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
  color: rgba(255, 255, 255, 1);
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

/* ===== 3. 俱乐部控件 ===== */
.club-panel {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.17);
  border-radius: 1rem;
  padding: 0.1rem 0.6rem;
  min-height: 1.54rem;
  gap: 0;
  box-shadow:
  /* 左上高光 */
    inset 1px 1px 0px 0px rgba(255, 255, 255, 0.35),
    /* 右下高光 */ inset -1px -1px 0px 0px rgba(255, 255, 255, 0.35);
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

.icon-service {
  width: 0.36rem;
  height: 0.36rem;
}

.service-label {
  font-size: 0.3rem;
  color: #fff;
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
  color: #fff;
  font-weight: 500;
  text-align: center;
  min-width: 0.5rem;
}

.usdt-amount {
  font-size: 0.24rem;
  opacity: 0.9;
}

.recharge-btn {
  width: 1.3rem;
  padding: 0.06rem 0rem;
  background: rgba(37, 37, 37, 0.49);
  border: none;
  border-radius: 1rem;
  color: #fff;
  font-size: 0.28rem;
  cursor: pointer;
  white-space: nowrap;
}

.club-divider {
  width: 0.02rem;
  height: 1.2rem;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 0.28rem;
  flex-shrink: 0;
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
  object-fit: contain;
}

.contact-label {
  font-size: 0.2rem;
  color: #fff;
  text-align: center;
  max-width: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 4. 游戏模块 ===== */
.game-zones {
  display: flex;
  gap: 0.3rem;
}

.game-zone-left {
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
  flex: 1;
}

.game-zone-right {
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
  flex: 1;
}

/* 游戏卡片通用 */
.game-card {
  position: relative;
  // background: rgba(0, 0, 0, 0.22);
  border-radius: 0.56rem;
  border: 0.02rem solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(6px);
  // overflow: hidden;
  padding: 0.14rem 0.24rem 0.14rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  min-height: 2.69rem;
  max-width: 4.45rem;

  &:active {
    opacity: 0.85;
  }
}

/* ===== MTT Card (Figma: node 95:47087) ===== */
.game-card-mtt {
  overflow: hidden;
  background: none;
}

// Background photo composite (oversized, positioned at Figma coords)
.mtt-bg-wrap {
  position: absolute;
  left: -3.808rem; // -142.81px / 37.5
  top: -0.234rem; // -8.76px / 37.5
  width: 9.847rem; // 369.263px / 37.5
  height: 5.781rem; // 216.787px / 37.5
  pointer-events: none;
}

.mtt-bg-main {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: none;
  display: block;
}

.mtt-bg-inner {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.mtt-bg-tex {
  position: absolute;
  left: 0;
  top: -8.19%;
  width: 116.04%;
  height: 116.38%;
  object-fit: cover;
  max-width: none;
  display: block;
}

// Base warm overlay: rgba(71,35,25,0.3) — covers whole card
.mtt-layer-base {
  position: absolute;
  inset: 0;
  background: rgba(71, 35, 25, 0.3);
  border-radius: 0.56rem;
  pointer-events: none;
  z-index: 1;
}

// Blur layer 1: backdrop-blur(34.67px) + dark fill + radial mask (vignette edges)
.mtt-layer-blur1 {
  position: absolute;
  // inset: -0.948rem -0.954rem -0.923rem -0.92rem;
  backdrop-filter: blur(0.925rem); // 34.67px / 37.5
  background: rgba(49, 35, 29, 0.81);
  border-radius: 1.057rem; // 39.623px / 37.5
  pointer-events: none;
  z-index: 1;
  // Approximate Figma mask: transparent center, dark edges
  mask-image: radial-gradient(ellipse 35% 37% at 50% 50%, transparent 0%, black 100%);
  -webkit-mask-image: radial-gradient(ellipse 35% 37% at 50% 50%, transparent 0%, black 100%);
}

// Blur layer 2: backdrop-blur(39.623px) + darker fill + radial mask
.mtt-layer-blur2 {
  position: absolute;
  inset: -0.894rem -0.723rem -0.687rem -0.818rem;
  backdrop-filter: blur(1.057rem); // 39.623px / 37.5
  background: rgba(37, 25, 21, 0.93);
  border-radius: 1.057rem;
  border: 0.027rem solid #000; // 1px solid black
  pointer-events: none;
  z-index: 1;
  mask-image: radial-gradient(ellipse 38% 40% at 50% 50%, transparent 0%, black 100%);
  -webkit-mask-image: radial-gradient(ellipse 38% 40% at 50% 50%, transparent 0%, black 100%);
}

// Title: centered, top:49.22px
.mtt-title-wrap {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 1.313rem; // 49.22px / 37.5
  padding: 0.16rem 0.197rem; // 6px / 37.5, 7.379px / 37.5
  border-radius: 1.333rem;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  z-index: 2;
}

.mtt-title {
  font-size: 0.4rem; // 15px / 37.5
  font-weight: 800;
  color: #fff;
  white-space: nowrap;
  line-height: 1;
}

// Top-right vector icon: left:151.04px top:10.03px size:9px
.mtt-vector-icon {
  position: absolute;
  left: 4.028rem; // 151.04px / 37.5
  top: 0.267rem; // 10.03px / 37.5
  width: 0.24rem; // 9px / 37.5
  height: 0.24rem;
  object-fit: contain;
  pointer-events: none;
  z-index: 2;
}

// Online bar: centered bottom, top:182.03px
.mtt-online-bar {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 4.854rem; // 182.03px / 37.5
  backdrop-filter: blur(0.037rem); // 1.4px / 37.5
  background: rgba(56, 55, 55, 0.61);
  padding: 0.08rem 0.133rem; // 3px / 37.5, 5px / 37.5
  border-radius: 0.133rem; // 5px / 37.5
  display: flex;
  gap: 0.133rem; // 5px / 37.5
  align-items: center;
  white-space: nowrap;
  z-index: 2;
}

.mtt-bar-label {
  font-size: 0.213rem; // 8px / 37.5
  color: #fff;
  line-height: 0.24rem; // 9px / 37.5
  font-weight: 500;
}

// Table + people stat groups
.mtt-bar-group {
  display: flex;
  gap: 0.053rem; // 2px / 37.5
  align-items: center;
  width: 0.853rem; // 32px / 37.5
}

// White rounded rectangle = table indicator
.mtt-table-rect {
  display: inline-block;
  width: 0.187rem; // 7px / 37.5
  height: 0.107rem; // 4px / 37.5
  background: #fff;
  border-radius: 50px;
  flex-shrink: 0;
}

// User icon: 6px × 7px
.mtt-user-icon {
  width: 0.16rem; // 6px / 37.5
  height: 0.187rem; // 7px / 37.5
  flex-shrink: 0;
  object-fit: contain;
  display: block;
}
/* ===== Mini Game Card (Figma: node 95:47115) ===== */
.game-card-minigame {
  overflow: visible; // character spills outside card boundary
  background: rgba(148, 148, 148, 0.1);
  // backdrop-filter: blur(6px) already inherited from .game-card
}

// Title: left:38.04px top:41.03px, 15px ExtraBold white
.mg-title-wrap {
  position: absolute;
  left: 1.014rem; // 38.04px / 37.5
  top: 1.094rem; // 41.03px / 37.5
  padding: 0.16rem 0.197rem; // 6px / 37.5, 7.379px / 37.5
  border-radius: 1.333rem; // 50px
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  z-index: 2;
}

.mg-title {
  font-size: 0.4rem; // 15px / 37.5
  font-weight: 800;
  color: #fff;
  white-space: nowrap;
  line-height: 1;
}

// Mask group icon top-right: inset(8.94% 6.7% 81.16% 86.25%) of card
.mg-mask-group {
  position: absolute;
  top: 8.94%;
  right: 6.7%;
  bottom: 81.16%;
  left: 86.25%;
  z-index: 2;
}

.mg-mask-inner {
  position: absolute;
  top: -7.14%;
  right: -6.07%;
  bottom: -7.14%;
  left: -6.07%;
}

.mg-mask-img {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: contain;
}

// Online bar: left:53.04px top:80.03px
// bg: rgba(199,199,199,0.15) mix-blend-mode:plus-lighter on a separate abs div
.mg-online-bar {
  position: absolute;
  left: 1.414rem; // 53.04px / 37.5
  top: 2.134rem; // 80.03px / 37.5
  padding: 0.08rem 0.133rem; // 3px / 37.5, 5px / 37.5
  border-radius: 0.133rem; // 5px / 37.5
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 2;
}

.mg-online-bg {
  position: absolute;
  inset: 0;
  background: rgba(199, 199, 199, 0.15);
  mix-blend-mode: plus-lighter;
  border-radius: 0.133rem;
  pointer-events: none;
}

.mg-online-content {
  position: relative;
  display: flex;
  gap: 0.133rem; // 5px / 37.5
  align-items: flex-start;
  width: 100%;
}

.mg-bar-label {
  font-size: 0.213rem; // 8px / 37.5
  color: #fff;
  line-height: 0.24rem; // 9px / 37.5
  font-weight: 500;
  white-space: nowrap;
}

// People stat group: gap:3px, width:32px
.mg-bar-group {
  display: flex;
  gap: 0.08rem; // 3px / 37.5
  align-items: center;
  width: 0.853rem; // 32px / 37.5
}

// User icon: 6px × 7px
.mg-user-icon {
  width: 0.16rem; // 6px / 37.5
  height: 0.187rem; // 7px / 37.5
  flex-shrink: 0;
  object-fit: contain;
  display: block;
}

// Character Object: inset(-12.06% 76.76% 45.39% -3.52%) — extends above+left of card
.mg-character-wrap {
  position: absolute;
  top: -12.06%;
  right: 76.76%;
  bottom: 45.39%;
  left: -3.52%;
  pointer-events: none;
  z-index: 1;
}

.mg-character-inner {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.mg-character-img {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
}

/* ===== Poker Card (Figma: node 95:47139) ===== */
.poker-card {
  flex: 1;
  min-height: 5.54rem;
  overflow: hidden;
  background: rgba(148, 148, 148, 0.1);
  // backdrop-filter: blur(6px) from .game-card
}

// ip5 1: main character — left:-0.04px≈0, top:3.55px, 167.965×224.016px
.pk-ip1-wrap {
  position: absolute;
  left: 0;
  top: 0.095rem; // 3.55px / 37.5
  width: 4.479rem; // 167.965px / 37.5
  height: 5.974rem; // 224.016px / 37.5
  pointer-events: none;
}

.pk-ip1-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: none;
  pointer-events: none;
}

// ip5 2: secondary image revealed through mask (lower portion of card)
// mask-position: -8.44px 171.443px, mask-size: 187.183px 62.311px
.pk-ip2-wrap {
  position: absolute;
  left: 0.008rem; // 0.3px / 37.5
  top: 0.095rem; // 3.55px / 37.5
  width: 4.479rem; // 167.965px / 37.5
  height: 5.974rem; // 224.016px / 37.5
  pointer-events: none;
  mask-image: url('@/assets/images/game_zone_poker_mask.png');
  -webkit-mask-image: url('@/assets/images/game_zone_poker_mask.png');
  mask-position: -0.225rem 4.572rem; // -8.44px / 37.5, 171.443px / 37.5
  -webkit-mask-position: -0.225rem 4.572rem;
  mask-size: 4.991rem 1.661rem; // 187.183px / 37.5, 62.311px / 37.5
  -webkit-mask-size: 4.991rem 1.661rem;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  mask-mode: alpha;
}

.pk-ip2-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: none;
  pointer-events: none;
}

// Title: left:45.04px top:9.03px, 15px ExtraBold white
.pk-title-wrap {
  position: absolute;
  left: 1.201rem; // 45.04px / 37.5
  top: 0.241rem; // 9.03px / 37.5
  padding: 0.16rem 0.197rem; // 6px / 37.5, 7.379px / 37.5
  border-radius: 1.333rem;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  z-index: 2;
}

.pk-title {
  font-size: 0.4rem; // 15px / 37.5
  font-weight: 800;
  color: #fff;
  white-space: nowrap;
  line-height: 1;
}

// Vector icon: left:144.04px top:9.03px, 12×10px
.pk-vector-icon {
  position: absolute;
  left: 3.841rem; // 144.04px / 37.5
  top: 0.241rem; // 9.03px / 37.5
  width: 0.32rem; // 12px / 37.5
  height: 0.267rem; // 10px / 37.5
  object-fit: contain;
  pointer-events: none;
  z-index: 2;
}

// Online bar: left:32.04px top:188.03px, backdrop-blur+rgba(56,55,55,0.61)
.pk-online-bar {
  position: absolute;
  left: 0.854rem; // 32.04px / 37.5
  top: 5.014rem; // 188.03px / 37.5
  backdrop-filter: blur(0.037rem); // 1.4px / 37.5
  background: rgba(56, 55, 55, 0.61);
  padding: 0.08rem 0.133rem; // 3px / 37.5, 5px / 37.5
  border-radius: 0.133rem; // 5px / 37.5
  display: flex;
  gap: 0.133rem; // 5px / 37.5
  align-items: center;
  white-space: nowrap;
  z-index: 2;
}

.pk-bar-label {
  font-size: 0.213rem; // 8px / 37.5
  color: #fff;
  line-height: 0.24rem; // 9px / 37.5
  font-weight: 500;
}

.pk-bar-stats {
  display: flex;
  gap: 0.133rem; // 5px / 37.5
  align-items: center;
}

// Table group: gap 2px; People group: gap 3px
.pk-bar-group {
  display: flex;
  align-items: center;
  width: 0.853rem; // 32px / 37.5
}

.pk-bar-group--table {
  gap: 0.053rem;
} // 2px / 37.5
.pk-bar-group--people {
  gap: 0.08rem;
} // 3px / 37.5

// White rounded rect = table icon (7×4px)
.pk-table-rect {
  display: inline-block;
  width: 0.187rem; // 7px / 37.5
  height: 0.107rem; // 4px / 37.5
  background: #fff;
  border-radius: 50px;
  flex-shrink: 0;
}

// User icon: 6×7px
.pk-user-icon {
  width: 0.16rem; // 6px / 37.5
  height: 0.187rem; // 7px / 37.5
  flex-shrink: 0;
  object-fit: contain;
  display: block;
}

/* ===== Entertainment Card (Figma: node 95:47160) ===== */
.en-card {
  min-height: 2.7rem;
  overflow: hidden;
  background: none;
}

.en-bg1-wrap {
  position: absolute;
  left: -1.36rem;
  top: -2.08rem;
  width: 12.762rem;
  height: 7.493rem;
  pointer-events: none;
}

.en-bg1-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: none;
}

.en-bg2-wrap {
  position: absolute;
  left: 0;
  top: -2.826rem;
  width: 4.453rem;
  height: 6.667rem;
  pointer-events: none;
}

.en-bg2-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: none;
}

.en-base-overlay {
  position: absolute;
  inset: 0;
  // background: rgba(40, 40, 40, 0.2);
  border-radius: 0.56rem;
  z-index: 1;
}

.en-blur1 {
  position: absolute;
  // inset: -0.948rem -0.953rem -0.925rem -0.92rem;
  // backdrop-filter: blur(0.925rem);
  // -webkit-backdrop-filter: blur(0.925rem);
  // background: rgba(49, 35, 29, 0.81);
  border-radius: 1.057rem;
  pointer-events: none;
  z-index: 1;
  mask-image: radial-gradient(ellipse 35% 37% at 50% 50%, transparent 0%, black 100%);
  -webkit-mask-image: radial-gradient(ellipse 35% 37% at 50% 50%, transparent 0%, black 100%);
}

.en-blur2 {
  position: absolute;
  inset: -0.75rem -0.607rem -0.555rem -0.698rem;
  backdrop-filter: blur(1.057rem);
  -webkit-backdrop-filter: blur(1.057rem);
  background: rgba(37, 25, 21, 0.93);
  border-radius: 1.057rem;
  border: 0.027rem solid #000;
  pointer-events: none;
  z-index: 1;
  mask-image: radial-gradient(ellipse 38% 40% at 50% 50%, transparent 0%, black 100%);
  -webkit-mask-image: radial-gradient(ellipse 38% 40% at 50% 50%, transparent 0%, black 100%);
}

.en-title-wrap {
  position: absolute;
  left: 1.521rem;
  top: 1.094rem;
  padding: 0.16rem 0.197rem;
  border-radius: 1.333rem;
  z-index: 2;
  white-space: nowrap;
}

.en-title {
  font-size: 0.4rem;
  font-weight: 800;
  color: #fff;
}

.en-vector-icon {
  position: absolute;
  left: 4.028rem;
  top: 0.267rem;
  width: 0.24rem;
  height: 0.24rem;
  z-index: 2;
}

.en-online-bar {
  position: absolute;
  left: 1.361rem;
  top: 2.107rem;
  padding: 0.08rem 0.133rem;
  border-radius: 0.133rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 2;
}

.en-online-bg {
  position: absolute;
  inset: 0;
  background: rgba(199, 199, 199, 0.15);
  mix-blend-mode: plus-lighter;
  border-radius: 0.133rem;
  pointer-events: none;
}

.en-online-content {
  position: relative;
  display: flex;
  gap: 0.133rem;
  align-items: flex-start;
}

.en-bar-label {
  font-size: 0.213rem;
  color: #fff;
  line-height: 0.24rem;
  font-weight: 500;
}

.en-bar-group {
  display: flex;
  gap: 0.08rem;
  align-items: center;
  width: 0.853rem;
}

.en-user-icon {
  width: 0.16rem;
  height: 0.187rem;
  flex-shrink: 0;
  object-fit: contain;
}

/* ===== 5. 底部4个即将开放 (修改为静态游戏入口) ===== */
.coming-soon-row {
  display: flex;
  gap: 0.12rem;
}

.coming-soon-small {
  position: relative;
  flex: 1;
  width: 2.165rem;
  height: 2.293rem;
  border-radius: 0.5rem;
  overflow: hidden;
  aspect-ratio: 81 / 86;
  background: rgba(0,0,0,0.2);
  cursor: pointer;
}

.coming-soon-full-svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
