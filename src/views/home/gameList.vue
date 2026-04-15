<script setup lang="ts">
import { computed, onMounted, reactive, ref, type CSSProperties } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import RoomGroupCard from './components/RoomGroupCard.vue'
import { getRoomIdsApi, getRoomsDetailApi, type RoomRecord } from '@/api/room'
import { enterTable } from '@/bridge/bridge'
import type { EnterTablePayload } from '@/bridge/protocol'
import StorageKey from '@/constants/storageKey'
import { useGameStore } from '@/stores/game'
import { localStore } from '@/utils/localStore'
import serviceIcon from '@/assets/icons/icon_server.png'
import walletIcon from '@/assets/icons/icon_wallet.png'
import gameType6Plus from '@/assets/icons/game_type_6+.png'
import gameTypeNlh from '@/assets/icons/game_type_nlh.png'
import gameTypePlo from '@/assets/icons/game_type_plo.png'
import tabBg from '@/assets/icons/game_type_tab_bg.png'

interface TabOption {
  name: 'all' | 'texas' | 'omaha' | 'sixPlus'
  title: string
}

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

const TAB_OPTIONS: TabOption[] = [
  { name: 'all', title: '全部' },
  { name: 'texas', title: '德州' },
  { name: 'omaha', title: '奥马哈' },
  { name: 'sixPlus', title: '6+' },
]
const ROOM_LIST_CACHE_VERSION = 1

const router = useRouter()
const gameStore = useGameStore()

// 顶部右侧切换风格开关：和旧版保持一致。
const themeType = ref(false)
const activeTab = ref<TabOption['name']>('all')
const sourceRecords = ref<RoomRecord[]>([])
const expandedMap = reactive<Record<string, boolean>>({})
const pageStyle = computed<CSSProperties>(() => ({
  '--tab-bg': `url(${tabBg})`,
}))

const filteredRecords = computed(() => {
  const baseList = sourceRecords.value.filter((room) => Number(room.game_type) < 6)
  return baseList.filter((room) => matchTabRoom(room, activeTab.value))
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
        const roomPlayers = Number(room.roomers) || (Array.isArray(room.users) ? room.users.length : 0)
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
  void fetchRooms({ silent: true })
}

// 拉取牌桌列表：先拿 room id，再批量拿详情。
async function fetchRooms(options: { silent?: boolean } = {}): Promise<void> {
  try {
    const idRes = await getRoomIdsApi({})
    const idRecords = Number(idRes.code) === 0 && Array.isArray(idRes.data?.records) ? idRes.data.records : []

    const roomIds = idRecords
      .map((item) => Number(item?.rid))
      .filter((id) => Number.isFinite(id) && id > 0)

    if (!roomIds.length) {
      sourceRecords.value = []
      persistRoomListCache([])
      resetExpandedMap()
      return
    }

    const detailRes = await getRoomsDetailApi({
      room_ids: roomIds,
      room_type: 0,
    })

    const records = Number(detailRes.code) === 0 && Array.isArray(detailRes.data?.records) ? detailRes.data.records : []
    sourceRecords.value = Array.isArray(records) ? records : []
    persistRoomListCache(sourceRecords.value)
    resetExpandedMap()
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

function resetExpandedMap(): void {
  Object.keys(expandedMap).forEach((key) => {
    delete expandedMap[key]
  })
}

function handleBack(): void {
  router.back()
}

function handleTodoClick(): void {
  themeType.value = !themeType.value
}

function handleTableClick(room: RoomRecord): void {
  if (!gameStore.sessionToken) {
    showFailToast('登录状态已失效，请重新登录')
    return
  }

  // 进入牌桌参数固定：名称 + 用户ID + token；附带房间信息用于切桌定位。
  const payload: EnterTablePayload = {
    userName: gameStore.loginNickname || gameStore.loginAccount || 'guest',
    userId: gameStore.loginUserId || gameStore.loginAccount || '',
    token: gameStore.sessionToken,
    from: 'h5-lobby',
    roomId: String(room.rid ?? ''),
    roomName: String(room.name ?? ''),
  }

  enterTable(payload)
  gameStore.setLastEnterTable(payload)
  showSuccessToast(`已请求进入牌桌：${room.name || room.rid}`)
}

function handleToggleGroup(groupKey: string): void {
  const expanded = expandedMap[groupKey] !== false
  expandedMap[groupKey] = !expanded
}

function matchTabRoom(room: RoomRecord, tabName: TabOption['name']): boolean {
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
  return `盲注 ${formatChip(smallBlind)}/${formatChip(bigBlind)}`
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
  <div class="room-list-page" :class="{ themeType1: !themeType, themeType2: themeType }" :style="pageStyle">
    <div class="bg-overlay" />

    <header class="top-bar">
      <div class="title-wrap" @click="handleBack">
        <VanIcon name="arrow-left" class="back-icon" />
        <span class="title">扑克专区</span>
      </div>

      <div class="action-wrap">
        <button class="action-btn" type="button" @click="handleTodoClick">
          <span class="action-label">切换</span>
          <img class="action-icon" :src="walletIcon" alt="wallet" />
        </button>
        <button class="action-btn" type="button" @click="handleTodoClick">
          <span class="action-label">风格</span>
          <img class="action-icon" :src="serviceIcon" alt="service" />
        </button>
      </div>
    </header>

    <VanTabs
      v-model:active="activeTab"
      :border="false"
      line-width="0"
      line-height="0"
      animated
      color="#ffffff"
      background="transparent"
      title-active-color="#ffffff"
      title-inactive-color="rgba(255, 255, 255, 0.65)"
      class="room-tabs"
    >
      <VanTab v-for="tab in TAB_OPTIONS" :key="tab.name" :name="tab.name" :title="tab.title" />
    </VanTabs>

    <section class="group-list">
      <RoomGroupCard
        v-for="group in groupedRecords"
        :key="group.groupKey"
        :group="group"
        :theme-type="themeType"
        :expanded="expandedMap[group.groupKey] !== false"
        @toggle="handleToggleGroup"
        @table-click="handleTableClick"
      />

      <div v-if="!groupedRecords.length" class="empty-wrap">
        <VanIcon name="search" />
        <span>暂无牌桌</span>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.room-list-page {
  --glass-bg: rgba(255, 255, 255, 0.15);
  --glass-border: rgba(255, 255, 255, 0.34);

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

.top-bar {
  position: relative;
  z-index: 1;
  min-height: 1.1733rem;
  padding: 0.48rem 0.4267rem 0.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.16rem;
}

.back-icon {
  font-size: 0.5rem;
  color: rgba(255, 255, 255, 0.95);
}

.title {
  font-size: 0.7rem;
  line-height: 1rem;
  font-weight: 600;
  text-shadow: 0 0.22rem 0.5rem rgba(0, 0, 0, 0.35);
}

.action-wrap {
  display: flex;
  align-items: center;
  gap: 0.26rem;
}

.action-btn {
  width: 1.75rem;
  height: 0.67rem;
  padding: 0 0.15rem;
  border: 0.0267rem solid var(--glass-border);
  border-radius: 0.4267rem;
  color: #fff;
  background: var(--glass-bg);
  backdrop-filter: blur(0.35rem) saturate(1.02);
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.25rem;
}

.action-icon {
  width: 0.45rem;
  height: 0.45rem;
  object-fit: contain;
}

.room-tabs {
  position: relative;
  z-index: 1;
}

:deep(.room-tabs .van-tabs__wrap) {
  margin: 0 0 0 0.5rem;
  overflow: visible;
}

:deep(.room-tabs .van-tabs__nav) {
  background: transparent;
  overflow: visible;
}

:deep(.room-tabs .van-tab) {
  height: 0.85rem;
  font-size: 0.389rem;
  font-weight: 600;
}

:deep(.room-tabs .van-tab__text) {
  width: 100%;
  height: 0.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

:deep(.room-tabs .van-tabs__line) {
  display: none !important;
}

.group-list {
  position: relative;
  z-index: 1;
  margin-top: -0.0133rem;
  max-height: calc(100dvh - 3.2rem);
  overflow-y: auto;
  padding: 0 0.55rem 0.5333rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(0.3533rem) saturate(1.04);
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

/* 主题 1：激活 tab 使用原始底图。 */
.themeType1 :deep(.room-tabs .van-tab--active .van-tab__text) {
  background: center bottom / 100% 100% no-repeat;
  background-image: var(--tab-bg);
  font-weight: 700;
}

/* 主题 2：激活 tab 使用毛玻璃遮罩版本。 */
.themeType2 :deep(.room-tabs .van-tab--active .van-tab__text::before) {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(0.3533rem) saturate(1.02);
  mask: center bottom / 100% 100% no-repeat;
  mask-image: var(--tab-bg);
}
</style>
