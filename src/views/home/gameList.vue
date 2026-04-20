<script setup lang="ts">
import { computed, onMounted, reactive, ref, type CSSProperties } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import RoomGroupCard from './components/RoomGroupCard.vue'
import GameTypeTabbar from '@/components/GameTypeTabbar.vue'
import PageBackHeader from '@/components/HeaderBack.vue'
import TopActionButton from '@/components/TopActionButton.vue'
import { getRoomIdsApi, getRoomsDetailApi } from '@/api/room'
import { enterTable } from '@/bridge/bridge'
import type { EnterTablePayload } from '@/bridge/protocol'
import StorageKey from '@/constants/storageKey'
import LoginSession from '@/session/loginSession'
import type { RoomRecord } from '@/api/models/room'
import { useGameStore } from '@/stores/game'
import { localStore } from '@/utils/localStore'
import serviceIcon from '@/assets/icons/icon_server.png'
import walletIcon from '@/assets/icons/icon_wallet.png'
import gameType6Plus from '@/assets/icons/game_type_6+.png'
import gameTypeNlh from '@/assets/icons/game_type_nlh.png'
import gameTypePlo from '@/assets/icons/game_type_plo.png'
import tabBg from '@/assets/icons/game_type_tab_bg.png'

type GameTypeTabName = 'all' | 'texas' | 'omaha' | 'sixPlus'

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

// 顶部右侧切换风格开关：和旧版保持一致。
const activeTab = ref<GameTypeTabName>('all')
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
    <PageBackHeader title="扑克专区">
      <template #right>
        <div class="action-wrap">
          <TopActionButton
            name="充值"
            :icon="walletIcon"
            icon-alt="wallet"
          />
          <TopActionButton
            name="客服"
            :icon="serviceIcon"
            icon-alt="service"
          />
        </div>
      </template>
    </PageBackHeader>

    <GameTypeTabbar v-model="activeTab" />

    <section class="group-list">
      <RoomGroupCard
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
          暂无牌桌
        </span>
      </div>
    </section>
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



.action-wrap {
  display: flex;
  align-items: center;
  gap: 0.26rem;
}

.group-list {
  position: relative;
  z-index: 1;
  margin-top: 0;
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  padding: 0 0.38rem 0.5333rem;
  background: rgba(255, 255, 255, 0.24);
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

</style>
