<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { showFailToast, } from 'vant'
import { useRouter } from 'vue-router'
import { getUserClubApi } from '@/api/auth'
import { getCowboyRoomListApi } from '@/api/gc'
import { getMttListApi } from '@/api/mtt'
import type { RoomRecord } from '@/api/models/room'
import StorageKey from '@/constants/storageKey'
import homeHeaderFallback from '@/assets/images/home_header_1.png'
import { useRoomListStore } from '@/stores/roomList'
import { type ClubInfo, useUserInfoStore } from '@/stores/userInfo'
import { t } from '@/i18n'
import { localStore } from '@/utils/localStore'
import { checkIsShowForClubAndTribe } from '@/utils/roomVisibility'

const router = useRouter()
const userInfoStore = useUserInfoStore()
const roomListStore = useRoomListStore()

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
const miniGamePlayersText = computed(() => `${homeRoomStats.value.miniGame.players}`)
const mahjongTablesText = computed(() => `${homeRoomStats.value.mahjong.tables}`)
const mahjongPlayersText = computed(() => `${homeRoomStats.value.mahjong.players}`)
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

function toggleBalance(): void {
  balanceVisible.value = !balanceVisible.value
}

async function refreshBalance(): Promise<void> {
  try {
    await getUserClubApi()
  } catch (error) {
    const message = error instanceof Error ? error.message : '刷新余额失败'
    showFailToast(message)
  }
}

function goToRecharge(): void {
  void router.push('/recharge')
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

// 首页 MTT 统计：使用 /api/roomcenter/mtt/list 聚合桌数与参赛人数。
async function fetchHomeMttStats(): Promise<void> {
  const nextMtt = { tables: 0, players: 0 }
  const limit = 100
  let offset = 0
  let page = 0
  const maxPages = 10

  while (page < maxPages) {
    const response = await getMttListApi({
      limit,
      offset,
      status: [0, 1],
      game_type: [0, 1, 2, 3],
      order: ['start_asc'],
    })

    const records =
      Number(response.code) === 0 && Array.isArray(response.data?.records)
        ? response.data.records
        : []
    records.forEach((item) => {
      nextMtt.tables += toSafeNumber(item.rooms)
      nextMtt.players += toSafeNumber(item.participants)
    })

    const total = toSafeNumber(response.data?.total)
    const loadedCount = offset + records.length
    if (!records.length || loadedCount >= total || records.length < limit) {
      break
    }

    offset += limit
    page += 1
  }

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

onMounted(() => {
  void ensureClubDataReady()
  // 首页和列表页共用同一个 room store，进入首页时启动共享数据流。
  roomListStore.bootstrapRoomList()
  refreshHomePokerMahjongStatsFromStore()
  void fetchHomeMiniGameStats().catch((error) => {
    console.warn('[home] fetch mini game stats failed:', error)
  })
  void fetchHomeMttStats().catch((error) => {
    console.warn('[home] fetch mtt stats failed:', error)
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
          <img class="icon-sm" src="@/assets/icons/icon_balance.png" alt="余额" />
          <span class="balance-amount">
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
        <div class="contact-item">
          <img class="contact-icon" src="@/assets/icons/icon_service_1.png" alt="Telegram" />
          <span class="contact-label"> @game </span>
        </div>
        <div class="contact-item">
          <img class="contact-icon" src="@/assets/icons/icon_service_2.png" alt="邮箱" />
          <span class="contact-label"> {{ $txt('UISetting_SecurityBindEmailItem') }} </span>
        </div>
        <div class="contact-item">
          <img class="contact-icon" src="@/assets/icons/icon_service_3.png" alt="IM客服" />
          <span class="contact-label"> {{ $txt('UIMineMain01') }} </span>
        </div>
      </div>
    </div>

    <!-- 4. 游戏模块 -->
    <div class="game-zones">
      <!-- 左侧：麻将 + MTT + 小游戏 -->
      <div class="game-zone-left">
        <!-- 麻将专区 -->
        <div class="game-card game-card-mahjong" @click="goToGameList">
          <img
            class="zone-lg-icon zone-lg-icon-mahjong"
            src="@/assets/icons/game_zone_mahjong_lg.png"
            alt="麻将"
          />
          <img class="zone-mini-icon" src="@/assets/icons/game_zone_mahjong_mini.png" alt="" />
          <div class="zone-info">
            <span class="zone-title"> {{ t('UIHomeMahjongArea') }} </span>
            <p class="zone-desc">
              <span class="mr-4"> {{ t('Mahjong_BloodFight') }}</span>
              <span class="mr-4"> {{ t('Mahjong_BloodRiver') }}</span>
              <span class="mr-4"> {{ t('Mahjong_Standard') }}</span>
            </p>
            <p class="zone-sub-desc">{{ t('UIHomeMahjongAreaTip') }}</p>
          </div>
          <div class="zone-online-bar">
            <span class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
            <img class="online-icon" src="@/assets/icons/game_zone_table_mini.png" alt="" />
            <span class="online-num"> {{ mahjongTablesText }} </span>
            <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
            <span class="online-num"> {{ mahjongPlayersText }} </span>
          </div>
        </div>

        <!-- MTT赛事专区 -->
        <div class="game-card game-card-mtt" @click="goToMttList">
          <img
            class="zone-lg-icon zone-lg-icon-mtt"
            src="@/assets/icons/game_zone_mtt_lg.png"
            alt="MTT"
          />
          <img class="zone-mini-icon" src="@/assets/icons/game_zone_mtt_mini.png" alt="" />
          <div class="zone-info">
            <span class="zone-title"> {{ t('UIHomeMttArea') }} </span>
            <p class="zone-desc">
              <span>{{ t('UIHomeMttPokerTip') }}</span>
              <span>{{ t('UIHomeMttMahjongTip') }}</span>
            </p>
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

        <!-- 小游戏专区 -->
        <div class="game-card game-card-minigame" @click="goToGameList">
          <img
            class="zone-lg-icon zone-lg-icon-minigame"
            src="@/assets/icons/game_zone_minigame_lg.png"
            alt="小游戏"
          />
          <img class="zone-mini-icon" src="@/assets/icons/game_zone_minigame_mini.png" alt="" />
          <div class="zone-info">
            <span class="zone-title"> {{ t('UIHomeMinigameArea') }} </span>
            <p class="zone-desc">{{ t('UIData_YGvXd5iXr_011') }}</p>
          </div>
          <div class="zone-online-bar">
            <span class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
            <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
            <span class="online-num"> {{ miniGamePlayersText }} </span>
          </div>
        </div>
      </div>

      <!-- 右侧：扑克专区 + 即将开放 -->
      <div class="game-zone-right">
        <!-- 扑克专区 -->
        <div class="game-card poker-card" @click="goToGameList">
          <img class="poker-bg" src="@/assets/images/home_game_zone_poker.png" alt="扑克背景" />
          <div class="poker-overlay"></div>
          <img
            class="zone-mini-icon poker-mini"
            src="@/assets/icons/game_zone_poker_mini.png"
            alt=""
          />
          <div class="zone-info poker-info">
            <span class="zone-title"> {{ t('UIHomePokerArea') }} </span>
            <div class="poker-desc-area">
              <p class="zone-sub-desc text-left">{{ t('UITexasRule_texas') }}</p>
              <p class="zone-sub-desc text-right">{{ t('UITexasRule_omaha') }}</p>
              <p class="zone-sub-desc text-left">{{ t('PokerType_2') }}</p>
              <p class="zone-sub-desc">{{ t('UIHomeMahjongAreaTip') }}</p>
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

        <!-- 即将开放（右侧下方）-->
        <div class="game-card coming-soon-card coming-soon-right">
          <img
            class="coming-soon-bg"
            src="@/assets/images/home_comming_soon_1.png"
            alt="即将开放"
          />
          <div class="coming-soon-overlay"></div>
          <span class="coming-soon-text"> {{ t('UIHomeComingSoon') }}</span>
        </div>
      </div>
    </div>

    <!-- 5. 底部4个即将开放 -->
    <div class="coming-soon-row">
      <div v-for="i in 4" :key="i" class="coming-soon-small">
        <img
          class="coming-soon-small-bg"
          src="@/assets/images/home_comming_soon_2.png"
          alt="即将开放"
        />
        <div class="coming-soon-small-overlay"></div>
        <span class="coming-soon-small-text"> {{ t('UIHomeComingSoon') }}</span>
      </div>
    </div>
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
  background: rgba(0, 0, 0, 0.22);
  border-radius: 1rem;
  height: 0.5rem;
  min-height: 0.5rem;
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
  /* 左上高光 */ inset 1px 1px 0px 0px rgba(255, 255, 255, 0.35),
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
  min-width: 0.9rem;
}

.usdt-amount {
  font-size: 0.24rem;
  opacity: 0.9;
}

.recharge-btn {
  width: 1.3rem;
  padding: 0.06rem 0rem;
  background: rgba(93, 4, 40, 0.25);
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

.zone-lg-icon {
  position: absolute;
  object-fit: contain;
  pointer-events: none;
  z-index: 3;
}
.game-card-mahjong {
  background: url('@/assets/images/home_left_card_bg_1.png') center/cover no-repeat;
}
.game-card-mtt {
  background: url('@/assets/images/home_left_card_bg_2.png') center/cover no-repeat;
}
.game-card-minigame {
  overflow: hidden;
  background: url('@/assets/images/home_left_card_bg_3.png') center/cover no-repeat;
}
.zone-lg-icon-mahjong {
  width: 1.8rem;
  height: 1.7rem;
  left: -0.45rem;
  top: -0.55rem;
}
.zone-lg-icon-mtt {
  width: 0.96rem;
  height: 0.96rem;
  left: -0.05rem;
  top: -0.2rem;
  bottom: 0.26rem;
}
.zone-lg-icon-minigame {
  width: 1.4rem;
  height: 1.6rem;
  left: -0.05rem;
  bottom: -0.1rem;
}

.zone-mini-icon {
  position: absolute;
  top: 0.26rem;
  right: 0.24rem;
  width: 0.35rem;
  height: 0.27rem;
  object-fit: contain;
}

.zone-info {
  text-align: center;
}

.zone-title {
  font-size: 0.4rem;
  font-weight: 800;
  color: #fff;
  display: block;
  margin-bottom: 0.4rem;
}
.poker-desc-area {
  height: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
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
  background: rgba(200, 200, 200, 0.25);
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

/* 扑克专区特殊样式 */
.poker-card {
  flex: 1;
  min-height: 5.54rem;
  overflow: hidden;
}

.poker-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
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

/* 即将开放（右侧下方）*/
.coming-soon-card {
  min-height: 2.7rem;
  padding: 0;
}

.coming-soon-right {
  position: relative;
  border-radius: 0.56rem;
  overflow: hidden;
}

.coming-soon-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
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

/* ===== 5. 底部4个即将开放 ===== */
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
}

.coming-soon-small-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.coming-soon-small-overlay {
  position: absolute;
  inset: 0;
}

.coming-soon-small-text {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 0.293rem;
  font-weight: 400;
  color: #fff;
}
</style>
