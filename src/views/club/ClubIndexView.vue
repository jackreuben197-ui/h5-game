<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, type CSSProperties } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast, showSuccessToast } from 'vant'
import { getRoomIdsApi, getRoomsDetailApi } from '@/api/roomcenter'
import { enterTable } from '@/bridge/core'
import { subscribeH5WsMessages } from '@/bridge/ws/wsProxy'
import type { EnterTablePayload } from '@/bridge/protocol'
import StorageKey from '@/constants/storageKey'
import LoginSession from '@/session/loginSession'
import type { RoomRecord } from '@/api/models/roomcenter'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { localStore } from '@/utils/localStore'
import { checkIsShowForClubAndTribe } from '@/utils/roomVisibility'
import { t } from '@/i18n'
import serviceIcon from '@/assets/icons/icon_server.png'
import walletIcon from '@/assets/icons/icon_wallet.png'
import clubCoverAvatar from '@/assets/images/default_avatar.png'
import imgQuickActionCreateBg from '@/assets/images/club_qa_create_club_bg_shape.svg'
import imgQuickActionBoardBg from '@/assets/images/club_qa_data_board_bg_shape.svg'
import quickSafetyBg from '@/assets/images/club_header_quick_safety.jpg'
import quickRankingBg from '@/assets/images/club_header_quick_ranking.png'
import gameType6Plus from '@/assets/icons/game_type_6+.png'
import gameTypeNlh from '@/assets/icons/game_type_nlh.png'
import gameTypePlo from '@/assets/icons/game_type_plo.png'
import tabBg from '@/assets/icons/game_type_tab_bg.png'

type GameTypeTabName = 'all' | 'texas' | 'omaha' | 'sixPlus'
type ClubHeaderTabName = 'poker' | 'mahjong' | 'event'
const POKER_TYPE_LONG = 0
const POKER_TYPE_SHORT = 2

interface RoomGroupViewModel {
  groupKey: string
  gameType: number
  pokerType: number
  sb: number
  rooms: RoomRecord[]
  blindText: string
  gameName: string
  iconImage: string
  tableCount: number
  playerCount: number
}

interface RoomListCachePayload {
  version: number
  updatedAt: number
  records: RoomRecord[]
}

interface RoomGroupExpandedCachePayload {
  version: number
  updatedAt: number
  expandedMap: Record<string, boolean>
}

const ROOM_LIST_CACHE_VERSION = 1
const ROOM_GROUP_EXPANDED_CACHE_VERSION = 1

const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()
const router = useRouter()

// 顶部右侧切换风格开关：和旧版保持一致。
const activeTab = ref<GameTypeTabName>('all')
const clubHeaderTab = ref<ClubHeaderTabName>('poker')
const sourceRecords = ref<RoomRecord[]>([])
const expandedMap = reactive<Record<string, boolean>>({})
const announceExpanded = ref(false)
const pageStyle = computed<CSSProperties>(() => ({
  '--tab-bg': `url(${tabBg})`,
}))

const currentClub = computed(() => {
  return userInfoStore.currentClub || null
})

const selectedClubId = computed(() => toSafeInt(currentClub.value?.club_id))
const selectedTribeId = computed(() => toSafeInt(currentClub.value?.tribe_id))

const canCreateTable = computed(() => {
  const userLevel = toSafeInt(currentClub.value?.user_level)
  // 1=会长，2=副会长，3=管理员 均允许创建牌桌。
  return userLevel >= 1 && userLevel <= 3
})

const filteredRecords = computed(() => {
  const baseList = sourceRecords.value.filter((room) => {
    if (Number(room.game_type) >= 6) {
      return false
    }
    return checkIsShowForClubAndTribe(room, selectedClubId.value, selectedTribeId.value)
  })

  return baseList.filter((room) => matchTabRoom(room, activeTab.value))
})

const clubDisplayName = computed(() => {
  const name = String(currentClub.value?.club_name || '').trim()
  if (name) return name
  return 'xx俱乐部'
})

const clubDisplayId = computed(() => {
  const randomId = String(currentClub.value?.random_id || '').trim()
  if (randomId) return randomId
  const clubId = String(currentClub.value?.club_id || '').trim()
  if (clubId) return clubId
  return '--'
})

const clubCoverUrl = computed(() => {
  const logo = String(currentClub.value?.logo || '').trim()
  return logo || clubCoverAvatar
})

const clubNoticeText = computed(() => {
  const text = String(currentClub.value?.prologue || '').trim()
  if (text) {
    return text
  }
  return '暂未设置俱乐部公告'
})

const clubMemberCount = computed(() => {
  const countFromClub = toSafeInt(currentClub.value?.club_members)
  if (countFromClub > 0) {
    return String(countFromClub)
  }

  const count = sourceRecords.value.reduce((sum, room) => {
    const roomPlayers = Number(room.roomers) || (Array.isArray(room.users) ? room.users.length : 0)
    return sum + roomPlayers
  }, 0)
  return String(count || 0)
})

// 按 game_type + poker_type + 小盲分组，生成分组卡片展示模型。
const groupedRecords = computed<RoomGroupViewModel[]>(() => {
  const groupedMap: Record<string, RoomGroupViewModel> = {}

  filteredRecords.value.forEach((room) => {
    const gameType = Number(room.game_type) || 0
    const pokerType = Number(room.poker_type) || 0
    const sb = Number(room.sb) || 0
    const groupKey = `${gameType}_${pokerType}_${sb}`

    if (!groupedMap[groupKey]) {
      groupedMap[groupKey] = {
        groupKey,
        gameType,
        pokerType,
        sb,
        rooms: [],
        blindText: '',
        gameName: '',
        iconImage: '',
        tableCount: 0,
        playerCount: 0,
      }
    }

    groupedMap[groupKey].rooms.push(room)
  })

  return Object.values(groupedMap)
    .map((group) => {
      const playerCount = group.rooms.reduce((sum, room) => {
        const roomPlayers =
          Number(room.roomers) || (Array.isArray(room.users) ? room.users.length : 0)
        return sum + roomPlayers
      }, 0)

      return {
        ...group,
        blindText: formatBlind(group.sb),
        gameName: getGameName(group.gameType, group.pokerType),
        iconImage: getGameIconImage(group.gameType, group.pokerType),
        tableCount: group.rooms.length,
        playerCount,
      }
    })
    .sort((a, b) => {
      if (a.gameType !== b.gameType) return a.gameType - b.gameType
      if (a.pokerType !== b.pokerType) return a.pokerType - b.pokerType
      return a.sb - b.sb
    })
})

let unsubscribeWs: (() => void) | null = null

onMounted(() => {
  if (!userInfoStore.currentClub && userInfoStore.clubList.length) {
    userInfoStore.setCurrentClub(userInfoStore.clubList[0] || null)
  }

  if (!userInfoStore.currentClub || !String(userInfoStore.currentClub.club_id || '').trim()) {
    void router.replace('/club')
    return
  }

  bootstrapRoomList()

  unsubscribeWs = subscribeH5WsMessages((event) => {
    if (event.packet?.code === 140) {
      void fetchRooms({ silent: true })
    }
  })
})

onUnmounted(() => {
  unsubscribeWs?.()
  unsubscribeWs = null
})

// 进入页面先用缓存秒开，再静默刷新最新数据。
function bootstrapRoomList(): void {
  restoreRoomListCache()
  restoreRoomGroupExpandedCache()
  syncExpandedMapWithRecords(sourceRecords.value)
  void fetchRooms({ silent: true })
}

// 拉取牌桌列表：先拿 room id，再批量拿详情。
async function fetchRooms(options: { silent?: boolean } = {}): Promise<void> {
  try {
    const idRes = await getRoomIdsApi({})
    const idRecords =
      Number(idRes.code) === 0 && Array.isArray(idRes.data?.records) ? idRes.data.records : []

    const roomIds = idRecords
      .map((item) => Number(item?.rid))
      .filter((id) => Number.isFinite(id) && id > 0)

    if (!roomIds.length) {
      sourceRecords.value = []
      persistRoomListCache([])
      syncExpandedMapWithRecords([])
      persistRoomGroupExpandedCache()
      return
    }

    const detailRes = await getRoomsDetailApi({
      room_ids: roomIds,
      room_type: 0,
    })

    const records =
      Number(detailRes.code) === 0 && Array.isArray(detailRes.data?.records)
        ? detailRes.data.records
        : []
    sourceRecords.value = Array.isArray(records) ? records : []
    persistRoomListCache(sourceRecords.value)
    syncExpandedMapWithRecords(sourceRecords.value)
    persistRoomGroupExpandedCache()
  } catch (error) {
    // 静默刷新失败时保留旧列表，避免页面闪空。
    if (!options.silent) {
      const message = error instanceof Error ? error.message : '牌局列表刷新失败'
      showFailToast(message)
    }
  }
}

// 把最新牌局列表写入本地缓存。
function persistRoomListCache(records: RoomRecord[]): void {
  const payload: RoomListCachePayload = {
    version: ROOM_LIST_CACHE_VERSION,
    updatedAt: Date.now(),
    records,
  }
  localStore.setItem(StorageKey.ROOM_LIST_CACHE, payload)
}

// 恢复上次牌局列表缓存，保证进入页面可秒开。
function restoreRoomListCache(): void {
  const cached = localStore.getItem<RoomListCachePayload | null>(StorageKey.ROOM_LIST_CACHE, null)
  if (!cached || typeof cached !== 'object') {
    return
  }

  if (cached.version !== ROOM_LIST_CACHE_VERSION || !Array.isArray(cached.records)) {
    return
  }

  sourceRecords.value = cached.records
}

// 缓存分组展开状态，避免静默刷新后折叠状态丢失。
function persistRoomGroupExpandedCache(): void {
  const payload: RoomGroupExpandedCachePayload = {
    version: ROOM_GROUP_EXPANDED_CACHE_VERSION,
    updatedAt: Date.now(),
    expandedMap: { ...expandedMap },
  }
  localStore.setItem(StorageKey.ROOM_GROUP_EXPANDED_CACHE, payload)
}

// 恢复上次分组展开状态（按 groupKey 记忆）。
function restoreRoomGroupExpandedCache(): void {
  const cached = localStore.getItem<RoomGroupExpandedCachePayload | null>(
    StorageKey.ROOM_GROUP_EXPANDED_CACHE,
    null,
  )
  if (!cached || typeof cached !== 'object') {
    return
  }
  if (
    cached.version !== ROOM_GROUP_EXPANDED_CACHE_VERSION ||
    !cached.expandedMap ||
    typeof cached.expandedMap !== 'object'
  ) {
    return
  }

  Object.keys(expandedMap).forEach((key) => {
    delete expandedMap[key]
  })
  Object.entries(cached.expandedMap).forEach(([key, value]) => {
    expandedMap[key] = value === true
  })
}

// 只保留当前列表存在的分组 key，避免缓存越积越多。
function syncExpandedMapWithRecords(records: RoomRecord[]): void {
  const validGroupKeySet = new Set<string>()
  records
    .filter((room) => Number(room.game_type) < 6)
    .forEach((room) => {
      validGroupKeySet.add(buildGroupKey(room))
    })

  Object.keys(expandedMap).forEach((groupKey) => {
    if (!validGroupKeySet.has(groupKey)) {
      delete expandedMap[groupKey]
    }
  })
}

function buildGroupKey(room: RoomRecord): string {
  const gameType = Number(room.game_type) || 0
  const pokerType = Number(room.poker_type) || 0
  const sb = Number(room.sb) || 0
  return `${gameType}_${pokerType}_${sb}`
}

async function handleTableClick(room: RoomRecord): Promise<void> {
  if (!gameStore.sessionToken) {
    showFailToast('登录状态已失效，请重新登录')
    return
  }

  let wsPort = Number(gameStore.websocketPort) || 0
  if (!wsPort) {
    try {
      // 对齐 Cocos ProcedureEnterLobby：进入大厅阶段同步 websocket 端口。
      wsPort = await LoginSession.EnsureWS()
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取 websocket 端口失败'
      showFailToast(message)
      return
    }
  }

  // 进入牌桌参数固定：名称 + 用户ID + token；附带房间信息用于切桌定位。
  const payload: EnterTablePayload = {
    userName: gameStore.loginNickname || gameStore.loginAccount || 'guest',
    userId: gameStore.loginUserId || gameStore.loginAccount || '',
    token: gameStore.sessionToken,
    websocketPort: wsPort,
    from: 'h5-lobby',
    roomId: String(room.rid ?? ''),
    roomName: String(room.name ?? ''),
    roomInfo: room,
  }

  enterTable(payload)
  gameStore.setLastEnterTable(payload)
  showSuccessToast(`已请求进入牌桌：${room.name || room.rid}`)
}

function handleToggleGroup(groupKey: string): void {
  const expanded = expandedMap[groupKey] === true
  expandedMap[groupKey] = !expanded
  persistRoomGroupExpandedCache()
}

function handleClubHeaderTabClick(tab: ClubHeaderTabName): void {
  clubHeaderTab.value = tab
  if (tab === 'mahjong') {
    showFailToast('麻将专区开发中')
    return
  }
  if (tab === 'event') {
    showFailToast('赛事开发中')
  }
}

function handleQuickActionClick(action: 'safety' | 'ranking'): void {
  if (action === 'safety') {
    showFailToast('安全卫士功能开发中')
    return
  }
  showFailToast('排行榜功能开发中')
}

function handleCreateTableClick(): void {
  if (!canCreateTable.value) {
    showFailToast('仅管理员或创始人可创建牌桌')
    return
  }

  void router.push('/club/table/create')
}

function handleFloatingMenuClick(): void {
  goToClubDetail()
}

function goToClubDetail(): void {
  void router.push('/club/detail')
}

function toggleAnnounceExpanded(): void {
  announceExpanded.value = !announceExpanded.value
}

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return 0
  }
  return Math.floor(num)
}

function matchTabRoom(room: RoomRecord, tabName: GameTypeTabName): boolean {
  const gameType = Number(room.game_type) || 0
  const pokerType = Number(room.poker_type) || 0

  if (tabName === 'all') return true
  if (tabName === 'texas') return gameType === 0 && pokerType === POKER_TYPE_LONG
  if (tabName === 'omaha') return [1, 2, 3].includes(gameType) && pokerType === POKER_TYPE_LONG
  if (tabName === 'sixPlus') return pokerType === POKER_TYPE_SHORT
  return true
}

function getGameName(gameType: number, pokerType: number): string {
  if (gameType === 0 && pokerType === POKER_TYPE_SHORT) return '6+'
  if ([1, 2, 3].includes(gameType)) return '奥马哈'
  if (gameType === 0) return '德州扑克'
  return '扑克'
}

function getGameIconImage(gameType: number, pokerType: number): string {
  if (gameType === 0 && pokerType === POKER_TYPE_SHORT) return gameType6Plus
  if ([1, 2, 3].includes(gameType)) return gameTypePlo
  return gameTypeNlh
}

function formatBlind(sb: number): string {
  const smallBlind = Number(sb) || 0
  const bigBlind = smallBlind * 2
  return `${formatChip(smallBlind)} / ${formatChip(bigBlind)}`
}

function formatChip(rawValue: number): string {
  const safeRaw = Number(rawValue) || 0
  if (safeRaw >= 100000) {
    return `${formatChipBase(safeRaw / 1000)}k`
  }
  return formatChipBase(safeRaw)
}

function formatChipBase(rawValue: number): string {
  const display = rawValue / 100
  if (!Number.isFinite(display)) return '0'
  return display.toFixed(2).replace(/\.?0+$/, '')
}
</script>

<template>
  <div class="room-list-page themeType2" :style="pageStyle">
    <div class="bg-overlay"></div>
    <HeaderBack>
      <div class="club-identity">
        <div class="club-avatar">
          <img :src="clubCoverUrl" alt="club avatar" />
        </div>

        <div class="club-meta">
          <p class="club-name">
            {{ clubDisplayName }}
          </p>
          <div class="club-sub-meta">
            <div class="club-id-wrap">
              <span class="club-id-tag">ID</span>
              <span class="club-id-text">{{ clubDisplayId }}</span>
            </div>
            <div class="club-member-wrap">
              <span class="club-member-dot"></span>
              <span>{{ clubMemberCount }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="action-wrap">
        <TopActionButton
          :name="t('UIGuildFund_RechargeText')"
          :icon="walletIcon"
          icon-alt="wallet"
          @click="router.push('/wallet')"
        />
        <TopActionButton :name="t('UIMineMain01')" :icon="serviceIcon" icon-alt="service" />
      </div>
    </HeaderBack>
    <header class="club-header">
      <button
        class="announce-bar"
        :class="{ 'announce-bar--expanded': announceExpanded }"
        type="button"
        @click="toggleAnnounceExpanded"
      >
        <span class="announce-text">{{ clubNoticeText }}</span>
        <span class="announce-arrow" :class="{ 'announce-arrow--expanded': announceExpanded }">
          ›
        </span>
      </button>

      <div class="club-header-tabs">
        <button
          class="club-header-tab"
          :class="{ 'club-header-tab--active': clubHeaderTab === 'poker' }"
          type="button"
          @click="handleClubHeaderTabClick('poker')"
        >
          扑克专区
        </button>
        <button
          class="club-header-tab"
          :class="{ 'club-header-tab--active': clubHeaderTab === 'mahjong' }"
          type="button"
          @click="handleClubHeaderTabClick('mahjong')"
        >
          麻将专区
        </button>
        <button
          class="club-header-tab"
          :class="{ 'club-header-tab--active': clubHeaderTab === 'event' }"
          type="button"
          @click="handleClubHeaderTabClick('event')"
        >
          赛事
        </button>
      </div>

      <div class="club-quick-actions">
        <button
          class="club-quick-card club-quick-card--safety"
          type="button"
          @click="handleQuickActionClick('safety')"
        >
          <img
            class="quick-card-photo quick-card-photo--safety"
            :src="quickSafetyBg"
            alt=""
            aria-hidden="true"
          />
          <img
            class="quick-card-layer quick-card-layer--safety-bg"
            :src="imgQuickActionCreateBg"
            alt=""
            aria-hidden="true"
          />
          <span class="quick-card-title">安全卫士</span>
        </button>

        <button
          class="club-quick-card club-quick-card--ranking"
          type="button"
          @click="handleQuickActionClick('ranking')"
        >
          <img
            class="quick-card-photo quick-card-photo--ranking"
            :src="quickRankingBg"
            alt=""
            aria-hidden="true"
          />
          <img
            class="quick-card-layer quick-card-layer--ranking-bg"
            :src="imgQuickActionBoardBg"
            alt=""
            aria-hidden="true"
          />
          <span class="quick-card-title">排行榜</span>
        </button>
      </div>
    </header>

    <GameTypeTabbar
      v-model="activeTab"
      class="club-game-tabs"
      :tabs="[
        { name: 'all', title: t('UIMatch_GtO8YEdb') },
        { name: 'texas', title: t('UITexasInfo_Texas') },
        { name: 'omaha', title: t('UITexasInfo_Omaha') },
        { name: 'sixPlus', title: t('6+') },
      ]"
    />

    <section class="group-list">
      <PokerTableGroupCard
        v-for="group in groupedRecords"
        :key="group.groupKey"
        :group="group"
        :expanded="expandedMap[group.groupKey] === true"
        @toggle="handleToggleGroup"
        @table-click="handleTableClick"
      />

      <div v-if="!groupedRecords.length" class="empty-wrap">
        <VanIcon name="search" />
        <span>
          {{ t('UINoGameTip') }}
        </span>
      </div>
    </section>

    <div class="floating-action-area">
      <button
        v-if="canCreateTable"
        class="create-table-btn"
        type="button"
        @click="handleCreateTableClick"
      >
        创建牌桌
      </button>
      <button
        :class="{ 'floating-menu-btn--solo': !canCreateTable }"
        class="floating-menu-btn"
        type="button"
        aria-label="更多操作"
        @click="handleFloatingMenuClick"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.room-list-page {
  position: relative;
  min-height: 100dvh;
  color: #fff;
  overflow: hidden;
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 15% 92%, rgba(255, 173, 212, 0.32), transparent 34%),
    radial-gradient(circle at 88% 84%, rgba(102, 227, 255, 0.28), transparent 34%),
    radial-gradient(circle at 50% 56%, rgba(255, 255, 255, 0.12), transparent 48%);
}

.club-header {
  position: relative;
  z-index: 2;
  padding: calc(env(safe-area-inset-top) + 0.457rem) 0.456rem 0.22rem;
}

.club-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.16rem;
}

.club-identity {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.096rem;
}

.header-back-btn {
  width: 0.765rem;
  height: 0.765rem;
  border: 0;
  padding: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.header-back-btn svg {
  width: 0.189rem;
  height: 0.322rem;
}

.club-avatar {
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 50%;
  overflow: hidden;
  border: 0.0133rem solid rgba(255, 255, 255, 0.24);
}

.club-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-meta {
  min-width: 0;
}

.club-name {
  margin: 0;
  max-width: min(2.9rem, 42vw);
  font-size: 0.345rem;
  font-weight: 700;
  line-height: 0.83;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.club-sub-meta {
  margin-top: 0.08rem;
  display: flex;
  align-items: center;
  gap: 0.1446rem;
  font-size: 0.257rem;
  opacity: 0.94;
}

.club-id-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.0655rem;
}

.club-id-tag {
  height: 0.306rem;
  min-width: 0.36rem;
  border-radius: 0.112rem;
  padding: 0 0.089rem;
  background: rgba(255, 255, 255, 0.4);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.216rem;
}

.club-id-text {
  opacity: 0.95;
}

.club-member-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
}

.club-member-dot {
  width: 0.249rem;
  height: 0.211rem;
  border-radius: 0.053rem;
  background: linear-gradient(180deg, #ffd771 0%, #f59f37 100%);
}

.action-wrap {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  flex-shrink: 0;
}

.head-action-btn {
  width: 1.564rem;
  height: 0.586rem;
  padding: 0 0.14rem;
  border: 0.008rem solid rgba(255, 255, 255, 0.28);
  border-radius: 0.401rem;
  background: rgba(255, 255, 255, 0.21);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(0.08rem);
  box-shadow: 0 0.05rem 0.15rem rgba(0, 0, 0, 0.24);
}

.head-action-label {
  font-size: 0.2246rem;
  line-height: 1.2;
  text-shadow: 0 0.03rem 0.12rem rgba(0, 0, 0, 0.32);
}

.head-action-icon {
  width: 0.399rem;
  height: 0.399rem;
  object-fit: contain;
}

.announce-bar {
  margin-top: 0.217rem;
  width: 100%;
  min-height: 1.0577rem;
  border: 0;
  border-radius: 0.4016rem;
  padding: 0.1847rem 0.3936rem;
  color: #fff;
  display: inline-flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.2rem;
  background: rgba(34, 34, 34, 0.39);
  box-shadow: inset 0 0 0 0.0133rem rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(0.8133rem);
  transition: min-height 0.2s ease;
}

.announce-bar--expanded {
  min-height: 3.25rem;
}

.announce-text {
  min-width: 0;
  font-size: 0.3454rem;
  line-height: 1.4;
  text-align: left;
  flex: 1;
  line-clamp: 2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.announce-bar--expanded .announce-text {
  line-clamp: 6;
  -webkit-line-clamp: 6;
}

.announce-arrow {
  margin-left: 0.08rem;
  font-size: 0.42rem;
  line-height: 1;
  opacity: 0.88;
  transform: rotate(90deg);
  transition: transform 0.2s ease;
}

.announce-arrow--expanded {
  transform: rotate(-90deg);
}

.club-quick-actions {
  margin-top: 0.4177rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.3293rem;
}

.club-header-tabs {
  margin-top: 0.4177rem;
  display: flex;
  align-items: center;
  gap: 0.6587rem;
  padding: 0 0.4562rem;
  height: 0.6483rem;
}

.club-header-tab {
  position: relative;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.3521rem;
  line-height: 0.95;
  font-weight: 500;
  padding: 0 0 0.03rem;
  opacity: 0.92;
}

.club-header-tab--active {
  color: #fff;
  font-weight: 700;
}

.club-header-tab--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 0.032rem;
  border-radius: 999px;
  background: rgba(234, 234, 234, 0.92);
  box-shadow: 0 0 0.06rem rgba(255, 255, 255, 0.45);
}

.club-quick-card {
  position: relative;
  height: 1.9357rem;
  border: 0.0107rem solid rgba(255, 255, 255, 0.36);
  border-radius: 0.6105rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: linear-gradient(140deg, rgba(90, 167, 230, 0.24), rgba(10, 40, 65, 0.56));
  box-shadow: 0 0.08rem 0.2rem rgba(0, 0, 0, 0.26);
}

.club-quick-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(97deg, rgba(16, 25, 38, 0.08) 8%, rgba(10, 18, 34, 0.55) 72%);
  z-index: 1;
  pointer-events: none;
}

.club-quick-card::after {
  content: '';
  position: absolute;
  inset: -0.0107rem;
  border-radius: inherit;
  border: 0.0107rem solid rgba(255, 255, 255, 0.58);
  box-shadow: inset 0 0 0.08rem rgba(255, 255, 255, 0.34),
    inset 0 0 0.2rem rgba(255, 255, 255, 0.14), 0 0 0.08rem rgba(255, 255, 255, 0.18);
  filter: blur(0.002rem);
  pointer-events: none;
  z-index: 4;
}

.club-quick-card--safety {
  background: linear-gradient(145deg, rgba(83, 187, 245, 0.3), rgba(41, 71, 108, 0.68));
}

.club-quick-card--ranking {
  background: linear-gradient(145deg, rgba(245, 172, 90, 0.26), rgba(74, 36, 24, 0.7));
}

.quick-card-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.quick-card-photo--safety,
.quick-card-photo--ranking {
  transform: scale(1.04);
}

.quick-card-photo--safety {
  object-position: 42% 55%;
}

.quick-card-photo--ranking {
  object-position: center 58%;
}

.quick-card-layer {
  position: absolute;
  pointer-events: none;
  object-fit: contain;
  z-index: 2;
}

.quick-card-layer--safety-bg {
  width: 1.52rem;
  height: 1.2rem;
  left: -0.26rem;
  top: -0.04rem;
  opacity: 0.5;
}

.quick-card-layer--ranking-bg {
  width: 1.46rem;
  height: 1.42rem;
  left: -0.24rem;
  top: -0.04rem;
  opacity: 0.52;
}

.quick-card-title {
  position: relative;
  z-index: 3;
  margin-left: 0;
  font-size: 0.4177rem;
  font-weight: 700;
  letter-spacing: 0.002rem;
  color: #fff;
  text-shadow: 0 0.03rem 0.16rem rgba(0, 0, 0, 0.54);
}

@media (max-width: 360px) {
  .club-name {
    max-width: min(2.2rem, 36vw);
  }

  .head-action-btn {
    width: min(1.38rem, 21vw);
  }

  .quick-card-title {
    font-size: 0.36rem;
  }
}

.group-list {
  position: relative;
  z-index: 1;
  margin-top: 0;
  max-height: calc(100dvh - 7.85rem);
  overflow-y: auto;
  padding: 0.34rem 0.38rem 2.2rem;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(0.8032rem) saturate(1.04);
}

.floating-action-area {
  position: fixed;
  left: 0.44rem;
  right: 0.36rem;
  bottom: calc(0.3rem + env(safe-area-inset-bottom));
  z-index: 10;
  display: flex;
  align-items: center;
}

.create-table-btn {
  flex: 1;
  height: 1.25rem;
  border: 0.0133rem solid rgba(242, 242, 242, 0.8);
  border-radius: 0.958rem;
  background-image: linear-gradient(168deg, #05e7ae 7.55%, #027a5c 71.92%);
  color: #fbfbfb;
  font-size: 0.46rem;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  backdrop-filter: blur(0.08rem);
  box-shadow: 0 0.16rem 0.32rem rgba(0, 0, 0, 0.22);
}

.floating-menu-btn {
  margin-left: -0.58rem;
  width: 0.92rem;
  height: 0.92rem;
  border: none;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 25%, #056a57 0%, #01382f 75%);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.08rem;
  box-shadow: 0 0.14rem 0.3rem rgba(0, 0, 0, 0.38);
  z-index: 99;
}

.floating-menu-btn--solo {
  margin-left: auto;
}

.floating-menu-btn span {
  width: 0.25rem;
  height: 0.06rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
}

.empty-wrap {
  margin-top: 1.4933rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2133rem;
  font-size: 0.3467rem;
  color: rgba(255, 255, 255, 0.82);
}
</style>
