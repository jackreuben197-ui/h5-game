<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch, type CSSProperties } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import { enterTable } from '@/bridge/core'
import type { EnterTablePayload } from '@/bridge/protocol'
import StorageKey from '@/constants/storageKey'
import LoginSession from '@/session/loginSession'
import type { RoomRecord } from '@/api/models/roomcenter'
import { useGameStore } from '@/stores/game'
import { useRoomListStore } from '@/stores/roomList'
import { useUserInfoStore } from '@/stores/userInfo'
import { localStore } from '@/utils/localStore'
import { checkIsShowForClubAndTribe } from '@/utils/roomVisibility'
import serviceIcon from '@/assets/icons/icon_server.png'
import walletIcon from '@/assets/icons/icon_wallet.png'
import gameType6Plus from '@/assets/icons/game_type_6+.png'
import gameTypeNlh from '@/assets/icons/game_type_nlh.png'
import gameTypePlo from '@/assets/icons/game_type_plo.png'
import tabBg from '@/assets/icons/game_type_tab_bg.png'
import { t } from '@/i18n'
import { openGlobalCustomerServiceChat } from '@/components/GlobalCustomerServiceChat/channel'

type GameTypeTabName = 'all' | 'texas' | 'omaha' | 'sixPlus'
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

interface RoomGroupExpandedCachePayload {
  version: number
  updatedAt: number
  expandedMap: Record<string, boolean>
}

const ROOM_GROUP_EXPANDED_CACHE_VERSION = 1

const router = useRouter()
const gameStore = useGameStore()
const roomListStore = useRoomListStore()
const userInfoStore = useUserInfoStore()

// 顶部右侧切换风格开关：和旧版保持一致。
const activeTab = ref<GameTypeTabName>('all')
const expandedMap = reactive<Record<string, boolean>>({})
const pageStyle = computed<CSSProperties>(() => ({
  '--tab-bg': `url(${tabBg})`,
}))
const selectedClubId = computed(() => toSafeInt(userInfoStore.currentClub?.club_id))
const selectedTribeId = computed(() =>
  toSafeInt((userInfoStore.currentClub as Record<string, unknown> | null)?.tribe_id),
)

const filteredRecords = computed(() => {
  const baseList = roomListStore.records.filter((room) => Number(room.game_type) < 6)
  const scopedList = baseList.filter((room) =>
    checkIsShowForClubAndTribe(room, selectedClubId.value, selectedTribeId.value),
  )
  return scopedList.filter((room) => matchTabRoom(room, activeTab.value))
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
  roomListStore.bootstrapRoomList()
  restoreRoomGroupExpandedCache()
  syncExpandedMapWithRecords(roomListStore.records)
}

watch(
  () => roomListStore.records,
  (records) => {
    syncExpandedMapWithRecords(records)
    // 房间结构变化后同步一次展开状态缓存，防止无效 key 累积。
    persistRoomGroupExpandedCache()
  },
  {
    deep: false,
  },
)

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
    showFailToast(t('tokenFail'))
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
    from: 'h5-club-table',
    roomId: String(room.rid ?? ''),
    roomName: String(room.name ?? ''),
    roomInfo: room,
  }

  enterTable(payload)
  gameStore.setLastEnterTable(payload)
  // showSuccessToast(`已请求进入牌桌：${room.name || room.rid}`)
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
  if (tabName === 'texas') return gameType === 0 && pokerType === POKER_TYPE_LONG
  if (tabName === 'omaha') return [1, 2, 3].includes(gameType) && pokerType === POKER_TYPE_LONG
  if (tabName === 'sixPlus') return pokerType === POKER_TYPE_SHORT
  return true
}

function getGameName(gameType: number, pokerType: number): string {
  if (gameType === 0 && pokerType === POKER_TYPE_SHORT) return t('6+')
  if ([1, 2, 3].includes(gameType)) return t('UITexasInfo_Omaha')
  if (gameType === 0) return t('UITexasInfo_Texas')
  return '--'
}

function getGameIconImage(gameType: number, pokerType: number): string {
  if (gameType === 0 && pokerType === POKER_TYPE_SHORT) return gameType6Plus
  if ([1, 2, 3].includes(gameType)) return gameTypePlo
  return gameTypeNlh
}

function formatBlind(sb: number): string {
  // 对齐 Unity：房间盲注服务端单位是“分”，展示时统一 /100。
  const smallBlind = Number(sb) || 0
  const bigBlind = smallBlind * 2
  return `${formatBlindChipByUnity(smallBlind)} / ${formatBlindChipByUnity(bigBlind)}`
}

function formatBlindChipByUnity(rawValue: number): string {
  const safeRaw = Number(rawValue) || 0
  // 对齐 LanguageUtility.GetFormatLongNumberThousand：
  // 原值 >= 100000 时，先 /1000 再进入 /100 格式化，最终得到 xk。
  if (safeRaw >= 100000) {
    return `${formatBlindChipBaseByUnity(safeRaw / 1000)}k`
  }
  return formatBlindChipBaseByUnity(safeRaw)
}

function formatBlindChipBaseByUnity(rawValue: number): string {
  const displayValue = rawValue / 100
  if (!Number.isFinite(displayValue)) {
    return '0'
  }

  // 对齐 C# 的 "0.##"：最多保留 2 位小数并去掉尾随 0。
  return displayValue.toFixed(2).replace(/\.?0+$/, '')
}

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return 0
  }
  return Math.floor(num)
}
function handleBack() {
  router.push('/home')
}
function handleOpenCustomerService(): void {
  const clubId = selectedClubId.value
  if (clubId <= 0) {
    showFailToast('当前俱乐部信息无效')
    return
  }

  openGlobalCustomerServiceChat({
    imServiceType: 1,
    clubId,
    tribeId: selectedTribeId.value,
  })
}
</script>

<template>
  <div class="room-list-page themeType2" :style="pageStyle">
    <div class="bg-overlay"></div>
    <HeaderBack :title="t('UIHomePokerArea')" @back="handleBack">
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
            @click="handleOpenCustomerService"
          />
        </div>
      </template>
    </HeaderBack>
    <GameTypeTabbar
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

      <div v-if="!groupedRecords.length" class="empty-wrap">
        <VanIcon name="search" />
        <span>
          {{ t('UINoGameTip') }}
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
  padding-top: 0;
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  padding-right: 0.38rem;
  padding-bottom: 0.5333rem;
  padding-left: 0.38rem;
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
