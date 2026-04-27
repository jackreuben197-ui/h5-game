<script setup lang="ts">
import { computed, onMounted, reactive, ref, type CSSProperties } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast, showSuccessToast } from 'vant'
import { getRoomIdsApi, getRoomsDetailApi } from '@/api/room'
import { enterTable } from '@/bridge/core'
import type { EnterTablePayload } from '@/bridge/protocol'
import StorageKey from '@/constants/storageKey'
import LoginSession from '@/session/loginSession'
import type { RoomRecord } from '@/api/models/room'
import { useGameStore } from '@/stores/game'
import { localStore } from '@/utils/localStore'
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
const router = useRouter()

// 顶部右侧切换风格开关：和旧版保持一致。
const activeTab = ref<GameTypeTabName>('all')
const clubHeaderTab = ref<ClubHeaderTabName>('poker')
const sourceRecords = ref<RoomRecord[]>([])
const expandedMap = reactive<Record<string, boolean>>({})
const pageStyle = computed<CSSProperties>(() => ({
  '--tab-bg': `url(${tabBg})`,
}))

const filteredRecords = computed(() => {
  const baseList = sourceRecords.value.filter((room) => Number(room.game_type) < 6)
  return baseList.filter((room) => matchTabRoom(room, activeTab.value))
})

const clubDisplayName = computed(() => {
  const nickname = String(gameStore.loginNickname || '').trim()
  if (nickname) return `${nickname}俱乐部`
  return 'xx俱乐部'
})

const clubDisplayId = computed(() => {
  return String(gameStore.loginUserId || gameStore.loginAccount || '8677650585')
})

const clubMemberCount = computed(() => {
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

onMounted(() => {
  bootstrapRoomList()
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

function handleTopActionClick(action: 'recharge' | 'service'): void {
  if (action === 'recharge') {
    showFailToast('充值功能开发中')
    return
  }
  showFailToast('客服功能开发中')
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
  showFailToast('创建牌桌功能开发中')
}

function handleFloatingMenuClick(): void {
  goToClubDetail()
}

function goToClubDetail(): void {
  void router.push('/club/detail')
}

function handleBack(): void {
  void router.push('/club')
}

function matchTabRoom(room: RoomRecord, tabName: GameTypeTabName): boolean {
  const gameType = Number(room.game_type) || 0
  const pokerType = Number(room.poker_type) || 0

  if (tabName === 'all') return true
  if (tabName === 'texas') return gameType === 0 && pokerType === 0
  if (tabName === 'omaha') return [1, 2, 3].includes(gameType) && pokerType === 0
  if (tabName === 'sixPlus') return gameType === 6 || pokerType === 1
  return true
}

function getGameName(gameType: number, pokerType: number): string {
  if (gameType === 6 || pokerType === 1) return '6+'
  if ([1, 2, 3].includes(gameType)) return '奥马哈'
  if (gameType === 0) return '德州扑克'
  return '扑克'
}

function getGameIconImage(gameType: number, pokerType: number): string {
  if (gameType === 6 || pokerType === 1) return gameType6Plus
  if ([1, 2, 3].includes(gameType)) return gameTypePlo
  return gameTypeNlh
}

function formatBlind(sb: number): string {
  const smallBlind = Number(sb) || 0
  const bigBlind = smallBlind * 2
  return `${formatChip(smallBlind)} / ${formatChip(bigBlind)}`
}

function formatChip(value: number): string {
  const num = Number(value) || 0
  if (num >= 1000) {
    const text = (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)
    return `${text}k`
  }
  return `${num}`
}
</script>

<template>
  <div
    class="room-list-page themeType2"
    :style="pageStyle"
  >
    <div class="bg-overlay" />
    <header class="club-header">
      <div class="club-header-row">
        <div class="club-identity">
          <button
            class="header-back-btn"
            type="button"
            aria-label="返回"
            @click="handleBack"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 7 12"
              fill="none"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6.31419 0.26268C6.66443 0.61292 6.66443 1.18077 6.31419 1.53101L2.16518 5.68002L6.31419 9.82903C6.66443 10.1793 6.66443 10.7471 6.31419 11.0974C5.96395 11.4476 5.39609 11.4476 5.04585 11.0974L0.26268 6.31419C-0.08756 5.96395 -0.08756 5.3961 0.26268 5.04586L5.04585 0.26268C5.39609 -0.08756 5.96395 -0.08756 6.31419 0.26268Z"
                fill="white"
              />
            </svg>
          </button>

          <div class="club-avatar">
            <img
              :src="clubCoverAvatar"
              alt="club avatar"
            >
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
                <span class="club-member-dot" />
                <span>{{ clubMemberCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="action-wrap">
          <button
            class="head-action-btn"
            type="button"
            @click="handleTopActionClick('recharge')"
          >
            <span class="head-action-label">充值</span>
            <img
              class="head-action-icon"
              :src="walletIcon"
              alt="wallet"
            >
          </button>
          <button
            class="head-action-btn"
            type="button"
            @click="handleTopActionClick('service')"
          >
            <span class="head-action-label">客服</span>
            <img
              class="head-action-icon"
              :src="serviceIcon"
              alt="service"
            >
          </button>
        </div>
      </div>

      <button
        class="announce-bar"
        type="button"
      >
        <span class="announce-text">xxxxxx俱乐部公告</span>
        <span class="announce-arrow">›</span>
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
          >
          <img
            class="quick-card-layer quick-card-layer--safety-bg"
            :src="imgQuickActionCreateBg"
            alt=""
            aria-hidden="true"
          >
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
          >
          <img
            class="quick-card-layer quick-card-layer--ranking-bg"
            :src="imgQuickActionBoardBg"
            alt=""
            aria-hidden="true"
          >
          <span class="quick-card-title">排行榜</span>
        </button>
      </div>
    </header>

    <GameTypeTabbar
      class="club-game-tabs"
      v-model="activeTab"
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

      <div
        v-if="!groupedRecords.length"
        class="empty-wrap"
      >
        <VanIcon name="search" />
        <span>
          {{ t('UINoGameTip') }}
        </span>
      </div>
    </section>

    <div class="floating-action-area">
      <button
        class="create-table-btn"
        type="button"
        @click="handleCreateTableClick"
      >
        创建牌桌
      </button>
      <button
        class="floating-menu-btn"
        type="button"
        aria-label="更多操作"
        @click="handleFloatingMenuClick"
      >
        <span />
        <span />
        <span />
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
  background:
    radial-gradient(circle at 15% 92%, rgba(255, 173, 212, 0.32), transparent 34%),
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
  height: 1.0557rem;
  border: 0;
  border-radius: 1.0557rem;
  padding: 0 0.289rem;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(34, 34, 34, 0.1);
  box-shadow: inset 0 0 0 0.0133rem rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(0.8133rem);
}

.announce-text {
  min-width: 0;
  font-size: 0.3454rem;
  line-height: 0.83;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  flex: 1;
}

.announce-arrow {
  margin-left: 0.08rem;
  font-size: 0.42rem;
  line-height: 1;
  opacity: 0.88;
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
  box-shadow:
    inset 0 0 0.08rem rgba(255, 255, 255, 0.34),
    inset 0 0 0.2rem rgba(255, 255, 255, 0.14),
    0 0 0.08rem rgba(255, 255, 255, 0.18);
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

:deep(.club-game-tabs.room-tabs) {
  --tab-base-height: 0.8193rem;
  --tab-top-cut: 0.171rem;
  --tab-item-padding-x: 0.08rem;
  --tab-text-padding-x: 0;
  --tab-active-offset-y: 0;
  --tab-active-height: 100%;

  margin: 0.106rem 0 0;
}

:deep(.club-game-tabs.room-tabs .van-tabs__wrap) {
  margin: 0 0.4562rem;
}

:deep(.club-game-tabs.room-tabs .van-tab) {
  font-size: 0.3521rem;
  font-weight: 500;
}

:deep(.themeType2 .club-game-tabs.room-tabs .van-tab--active) {
  font-weight: 700;
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
  border-top-left-radius: 0.498rem;
  border-top-right-radius: 0.498rem;
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
