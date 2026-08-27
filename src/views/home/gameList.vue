<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch, type CSSProperties } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import { enterTable } from '@/bridge/core'
import type { EnterTablePayload } from '@bridge-protocol'
import StorageKey from '@/constants/storageKey'
import LoginSession from '@/session/loginSession'
import type { RoomRecord } from '@/api/models/roomcenter'
import { useGameStore } from '@/stores/game'
import { useLoginModalStore } from '@/stores/loginModal'
import { useRoomListStore } from '@/stores/roomList'
import { useUserInfoStore } from '@/stores/userInfo'
import { localStore } from '@/utils/localStore'
import { checkIsShowForClubAndTribe } from '@/utils/roomVisibility'
import serviceIcon from '@/assets/icons/icon_server.png'
import walletIcon from '@/assets/icons/icon_wallet.png'
import gameType6Plus from '@/assets/icons/game_type_6+.svg'
import gameTypeNlh from '@/assets/icons/game_type_nlh.svg'
import gameTypePlo from '@/assets/icons/game_type_plo.svg'
import tabBg from '@/assets/icons/game_type_tab_bg.png'
import { t } from '@/i18n'
import { openGlobalCustomerServiceChat } from '@/components/GlobalCustomerServiceChat/channel'
import { isPrivateDomainMode } from '@/utils/channelPackage'
import ClubZoneQuickActions from '@/components/Club/ClubZoneQuickActions.vue'

interface Props {
  embedded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  embedded: false,
})

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
const loginModalStore = useLoginModalStore()
const roomListStore = useRoomListStore()
const userInfoStore = useUserInfoStore()
const isChannelPackage = computed(() => isPrivateDomainMode())

// 顶部右侧切换风格开关：和旧版保持一致。
const activeTab = ref<GameTypeTabName>('all')
const expandedMap = reactive<Record<string, boolean>>({})
const pageStyle = computed<CSSProperties>(() => ({
  '--tab-bg': `url(${tabBg})`,
}))
const selectedClubId = computed(() => toSafeInt(userInfoStore.currentClub?.club_id))
const selectedClubRandomId = computed(() => toSafeInt(userInfoStore.currentClub?.random_id))
const selectedTribeId = computed(() =>
  toSafeInt((userInfoStore.currentClub as Record<string, unknown> | null)?.tribe_id),
)

const filteredRecords = computed(() => {
  const baseList = roomListStore.records.filter((room) => Number(room.game_type) < 5)
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
    .filter((room) => Number(room.game_type) < 5)
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
    loginModalStore.open()
    return
  }

  let wsPort = Number(gameStore.websocketPort) || 0
  if (!wsPort) {
    try {
      // 对齐 Cocos ProcedureEnterLobby：进入大厅阶段同步 websocket 端口。
      wsPort = await LoginSession.EnsureWS()
    } catch (error) {
      const message = error instanceof Error ? error.message : t('UIClub_Fetch') + " websocket " + t('UIClub_Fail3')
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
    clubId: selectedClubId.value,
    clubRandomId: selectedClubRandomId.value,
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
  if (gameType === 0 && pokerType === POKER_TYPE_SHORT) return t('UIFriendsTable_Create_6P')
  if ([1, 2, 3].includes(gameType)) return t('adaptation10009')
  if (gameType === 0) return t('UIClub_Text19')
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
    showFailToast(t('UIClub_CurrentClubNo'))
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
  <div
    class="room-list-page poker-zone-page themeType2"
    :class="{ 'room-list-page--embedded': props.embedded }"
    :style="pageStyle"
  >
    <div v-if="!props.embedded" class="bg-overlay"></div>

    <div class="room-list-stage">
      <HeaderBack
        v-if="!props.embedded"
        :title="t('UIHomePokerArea')"
        extra-padding
        @back="handleBack"
      >
        <template #right>
          <div class="action-wrap">
            <TopActionButton
              :name="t('UIGuildFund_RechargeText')"
              :icon="walletIcon"
              icon-alt="wallet"
              @click="router.push('/wallet')"
            />
            <TopActionButton
              v-if="userInfoStore.currentClub?.support_im_rid"
              :name="t('UIMineMain01')"
              :icon="serviceIcon"
              icon-alt="service"
              @click="handleOpenCustomerService"
            />
          </div>
        </template>
      </HeaderBack>
      <ClubZoneQuickActions v-if="isChannelPackage && !props.embedded" />
      <GameTypeTabbar
        v-model="activeTab"
        :class="{ 'home-embedded-tabs': props.embedded }"
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
          :force-light="props.embedded"
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

.room-list-page--embedded {
  min-height: 0;
  overflow: visible;
  background-image: none;
}

.room-list-stage {
  position: relative;
  z-index: 1;
  width: 100%;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: none;
}

.action-wrap {
  display: flex;
  align-items: center;
  gap: 0.26rem;
  margin-right: 0.25rem;
}

.group-list {
  position: relative;
  z-index: 1;
  margin-top: -0.03rem;
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  align-self: stretch;
  border-radius: 0.533rem 0.533rem 0 0;
  padding: 0.2rem 0 0.8rem;
  background: rgba(34, 34, 34, 0.5);
  backdrop-filter: blur(0.2213rem);
}

.room-list-page--embedded .group-list {
  max-height: none;
  overflow: visible;
  padding-right: 0;
  padding-bottom: 0.2rem;
  padding-left: 0;
}

.room-list-page--embedded :deep(.home-embedded-tabs),
.room-list-page--embedded :deep(.home-embedded-tabs .van-tabs__wrap),
.room-list-page--embedded :deep(.home-embedded-tabs .van-tabs__nav) {
  background: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}

.empty-wrap {
  padding: 1.4933rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2133rem;
  font-size: 0.3467rem;
  color: rgba(255, 255, 255, 0.82);
}
</style>

<style lang="scss">
:root[data-theme='light'] .poker-zone-page {
  --c-brand: #05c297;
  --c-brand-rgb: 5, 194, 151;

  color: rgba(0, 0, 0, 1);
  background-image: url('@/assets/images/main_bg_light.webp');

  .back-trigger,
  .back-icon {
    color: rgba(0, 0, 0, 1);
  }

  .title {
    text-shadow: none;
  }

  .room-tabs {
    --tab-active-bg: url('@/assets/images/game_type_tab_active_bg_light.svg') !important;
    --van-tab-text-color: rgba(34, 34, 34, 0.72);
    --van-tab-active-text-color: #111;

    .van-tab {
      color: rgba(34, 34, 34, 0.72) !important;
    }

    .van-tab--active {
      color: #111 !important;
    }
  }

  .group-list {
    background: rgba(255, 255, 255, 0.72);

    .group-item {
      &::after {
        background: rgba(0, 0, 0, 0.12);
      }

      .count-text {
        color: rgba(0, 0, 0, 0.72);
      }

      .count-icon {
        filter: brightness(0);
        opacity: 0.72;
      }

      .toggle-btn {
        background: rgba(34, 34, 34, 0.16);
      }

      .toggle-icon {
        filter: brightness(0);
      }
    }

    .table-main {
      background: rgba(34, 34, 34, 0.16);
      box-shadow: 0 0.08rem 0.2rem rgba(70, 79, 88, 0.08);
    }

    .table-name {
      border-color: rgba(0, 0, 0, 0.06);
      background: rgba(0, 0, 0, 0.05);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }

    .table-bg {
      background: rgba(49, 49, 49, 0.2);
      -webkit-mask: url('@/assets/images/game_list_card_table_bg.png') center / 100% 100% no-repeat;
      mask: url('@/assets/images/game_list_card_table_bg.png') center / 100% 100% no-repeat;
    }

    .table-center {
      background: rgba(0, 0, 0, 0.22);
      color: #fff;
    }

    .seat-name {
      color: #fff;
    }

    .meta-icon[alt='time'] {
      filter: brightness(0);
    }
  }

  .empty-wrap {
    color: rgba(0, 0, 0, 0.6);
  }
}
</style>
