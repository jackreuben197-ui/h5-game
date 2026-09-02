<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserInfoStore } from '@/stores/userInfo'
import { postRoomcenterFriendRoomsApi, postRoomcenterInvitationRoomApi } from '@/api/roomcenter'
import type { RoomRecord, RoomcenterFriendRoomRecord } from '@/api/models/roomcenter'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconAddDark from '@/assets/icons/icon_add.svg'
import iconAddLight from '@/assets/icons/icon_add_light.svg'
import { theme } from '@/utils/theme'
import iconAudioDark from '@/assets/icons/icon_audio.png'
import iconAudioLight from '@/assets/icons/icon_audio_light.png'
import iconVideoDark from '@/assets/icons/icon_video.png'
import iconVideoLight from '@/assets/icons/icon_video_light.png'
import iconPeopleDark from '@/assets/icons/icon_people.png'
import iconPeopleLight from '@/assets/icons/icon_people_light.png'
import iconTimeDark from '@/assets/icons/icon_time.png'
import iconTimeLight from '@/assets/icons/icon_time_light.png'
import iconNlh from '@/assets/icons/game_type_nlh.svg'
import iconPlo from '@/assets/icons/game_type_plo.svg'
import iconSixPlus from '@/assets/icons/game_type_6+.svg'
import iconMushroom from '@/assets/icons/table_icon_mushroom.png'
import iconSquid from '@/assets/icons/table_icon_squid.png'
import iconCritical from '@/assets/icons/table_icon_critical.png'
import NumericKeypad from '@/components/KeyBoard/NumericKeypad.vue'
import { showGameToast } from '@/components/Toast'
import { t } from '@/i18n'
import { enterTable } from '@/bridge/core'
import type { EnterTablePayload } from '@bridge-protocol'
import LoginSession from '@/session/loginSession'
import { useGameStore } from '@/stores/game'
import { useRoomListStore } from '@/stores/roomList'
import { ROOM_ORIGIN_TYPE } from '@/utils/roomVisibility'
import { formatRoomLeftAndTotalByUnity } from '@/utils/time'
import { requireRealUser } from '@/session/realUserGate'

const isLightTheme = computed(() => theme.value === 'light')
const iconAdd = computed(() => (isLightTheme.value ? iconAddLight : iconAddDark))
const iconAudio = computed(() => (isLightTheme.value ? iconAudioLight : iconAudioDark))
const iconVideo = computed(() => (isLightTheme.value ? iconVideoLight : iconVideoDark))
const iconPeople = computed(() => (isLightTheme.value ? iconPeopleLight : iconPeopleDark))
const iconTime = computed(() => (isLightTheme.value ? iconTimeLight : iconTimeDark))

const router = useRouter()
const userInfoStore = useUserInfoStore()
const gameStore = useGameStore()
const roomListStore = useRoomListStore()

const INVITE_CODE_LENGTH = 7
const inviteCode = ref<string[]>(Array(INVITE_CODE_LENGTH).fill(''))
const keypadOpen = ref(false)
const inviteCodeValue = computed(() => inviteCode.value.join(''))
const scrollContentRef = ref<HTMLElement | null>(null)

const activeFilter = ref('all')

const filters = [
  { key: 'all', get label() { return t('UIMatch_GtO8YEdb') } },
  { key: 'nlh', get label() { return t('UIFriendsTable_FilterNLH') } },
  { key: 'plo', get label() { return t('adaptation10009') } },
  { key: 'short', label: '6+' },
  // { key: 'mahjong', label: '麻将' },
]

interface FriendRoomListItem {
  rid?: number | string
  name?: string
  room_type?: number
  game_type?: number
  poker_type?: number
  limit_bet_type?: number
  status?: number
  ante?: number
  sb?: number
  bb?: number
  seat_count?: number
  empty_seat?: number
  roomers?: number
  play_duration?: number
  play_hands_limit?: number
  hand_num?: number
  invitation_code?: string
  private_room?: number
  room_password?: string
  anti_cheat_type?: number
  anti_cheat_video_type?: number
  bombpot?: number
  personal_type?: number
  seated_messaging?: number
  mushroom_mode?: number
  squid_on?: number
  random_ante?: string
  call_time?: number
  critical_hit?: number
  blind_name?: string
  blind_level_name?: string
  blind_level?: string | number
  blindtable_type_name?: string
  users?: Array<Record<string, unknown>>
  start_time?: string | number | null
  origin_type?: number
  [key: string]: unknown
}

const apiFriendRooms = ref<FriendRoomListItem[]>([])
const loading = ref(false)
const joinLoading = ref(false)
type RoomStatus = 0 | 1 | 2 | 3 | 4 | 5

const displayUser = computed(() => {
  return {
    diamond: gameStore.isRealUser ? (userInfoStore.userInfo?.user.diamonds ?? 0) : 0,
  }
})

function onInputCode(): void {
  if (!requireRealUser(onInputCode)) return
  keypadOpen.value = true
}

function scrollForKeypad(): void {
  const rootFontSize = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize || '16',
  )
  const offset = Number.isFinite(rootFontSize) && rootFontSize > 0 ? rootFontSize * 2 : 32
  const mainLayoutScroll = document.querySelector('.main-layout-content') as HTMLElement | null
  const pageScroll = scrollContentRef.value

  ;[mainLayoutScroll, pageScroll].forEach((el) => {
    if (!el) return
    el.scrollTo({
      top: offset,
      behavior: 'smooth',
    })
  })
}

function onKeypadKeyPress(payload: {
  key: string
  action: 'digit' | 'clear' | 'backspace' | 'decimal'
  value: string
  accepted: boolean
}): void {
  if (!payload.accepted && payload.action !== 'clear' && payload.action !== 'backspace') {
    return
  }
  syncInviteCode(payload.value)
}

function toSafeNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function isShortPokerType(pokerType: unknown): boolean {
  const v = toSafeNumber(pokerType)
  // 朋友桌口径：2=6+短牌，0=德州/奥马哈长牌。
  return v === 2
}

function getGameTypeName(gameType: number, pokerType?: number): string {
  if (isShortPokerType(pokerType)) return t('PokerType_2')
  if (gameType === 6) return t('Mahjong_Name')
  if (gameType === 0) return t('adaptation10022')
  if (gameType >= 1 && gameType <= 3) return t('adaptation10009')
  return t('adaptation10022')
}

function getGameTypeIcon(gameType: number, pokerType?: number): string {
  if (isShortPokerType(pokerType)) return iconSixPlus
  if (gameType === 0) return iconNlh
  if (gameType >= 1 && gameType <= 3) return iconPlo
  return iconNlh
}

function getFilterKey(gameType: number, pokerType?: number): string {
  if (isShortPokerType(pokerType)) return 'short'
  if (gameType === 6) return 'all'
  if (gameType === 0) return 'nlh'
  if (gameType >= 1 && gameType <= 3) return 'plo'
  return 'nlh'
}

function getRoomRid(room: Pick<FriendRoomListItem, 'rid'>): string {
  return String(room.rid ?? '').trim()
}

function getRoomStartTimestamp(room: Pick<FriendRoomListItem, 'start_time'>): number {
  const raw = room.start_time
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 1e12 ? raw : raw * 1000
  }

  if (typeof raw === 'string') {
    const ts = Date.parse(raw)
    if (Number.isFinite(ts)) {
      return ts
    }
  }

  return 0
}

function normalizeFriendRoomRecord(
  record: RoomcenterFriendRoomRecord | RoomRecord,
): FriendRoomListItem {
  return {
    ...record,
    rid: record.rid,
    name: String(record.name || '').trim(),
    game_type: toSafeNumber(record.game_type),
    poker_type: toSafeNumber(record.poker_type),
    status: toSafeNumber(record.status),
    sb: toSafeNumber(record.sb),
    bb: toSafeNumber(record.bb),
    seat_count: toSafeNumber(record.seat_count),
    empty_seat: toSafeNumber(record.empty_seat),
    roomers: toSafeNumber(record.roomers),
    play_duration: toSafeNumber(record.play_duration),
    play_hands_limit: toSafeNumber(record.play_hands_limit),
    hand_num: toSafeNumber(record.hand_num),
    private_room: toSafeNumber(record.private_room),
    anti_cheat_type: toSafeNumber(record.anti_cheat_type),
    start_time:
      typeof record.start_time === 'string' || typeof record.start_time === 'number'
        ? record.start_time
        : null,
    users: Array.isArray(record.users) ? record.users : [],
    origin_type: toSafeNumber(record.origin_type),
  }
}

function getStoreFriendRooms(records: RoomRecord[]): FriendRoomListItem[] {
  return records
    .filter((room) => toSafeNumber(room.origin_type) === ROOM_ORIGIN_TYPE.FRIEND)
    .map((room) => normalizeFriendRoomRecord(room))
}

function mergeFriendRooms(
  apiRooms: FriendRoomListItem[],
  storeRooms: FriendRoomListItem[],
): FriendRoomListItem[] {
  const roomMap = new Map<string, FriendRoomListItem>()

  apiRooms.forEach((room) => {
    const rid = getRoomRid(room)
    if (!rid) return
    roomMap.set(rid, room)
  })

  storeRooms.forEach((room) => {
    const rid = getRoomRid(room)
    if (!rid) return
    const prev = roomMap.get(rid)
    roomMap.set(rid, prev ? { ...prev, ...room } : room)
  })

  return Array.from(roomMap.values()).sort((a, b) => {
    const timeDiff = getRoomStartTimestamp(b) - getRoomStartTimestamp(a)
    if (timeDiff !== 0) return timeDiff
    return toSafeNumber(b.rid) - toSafeNumber(a.rid)
  })
}

const friendRooms = computed<FriendRoomListItem[]>(() => {
  if (!gameStore.isRealUser) return []
  return mergeFriendRooms(apiFriendRooms.value, getStoreFriendRooms(roomListStore.records))
})

const filteredRooms = computed(() => {
  if (activeFilter.value === 'all') return friendRooms.value
  return friendRooms.value.filter((room) => {
    const key = getFilterKey(Number(room.game_type), Number(room.poker_type))
    return key === activeFilter.value
  })
})

function syncInviteCode(raw: string): void {
  const digits = raw.replace(/\D/g, '').slice(0, INVITE_CODE_LENGTH)
  const next = Array(INVITE_CODE_LENGTH).fill('')
  for (let i = 0; i < digits.length; i += 1) {
    next[i] = digits[i] || ''
  }
  inviteCode.value = next
}

async function joinByInvitationCode(code: string): Promise<void> {
  if (!requireRealUser(() => joinByInvitationCode(code))) return
  if (joinLoading.value) {
    return
  }

  if (code.length !== INVITE_CODE_LENGTH) {
    showGameToast(t('UIFriendsTable_JoinRoomNumberWrong', code))
    return
  }

  joinLoading.value = true
  try {
    const response = await postRoomcenterInvitationRoomApi({ code })
    if (Number(response.code) !== 0) {
      return
    }

    const invitationData = response.data || {}
    const normalRoom = invitationData.data
    const sngRoom = invitationData.sng_data
    const mttRoom = invitationData.mtt_data

    // 对齐 Unity JoinRoom：三者都为空视为邀请码无效。
    if (!normalRoom && !sngRoom && !mttRoom) {
      showGameToast(t('UIFriendsTable_JoinRoomNumberWrong', code))
      return
    }

    // 对齐当前 H5 能力：仅处理普通朋友桌；SNG/MTT 先给出提示。
    if (!normalRoom) {
      showGameToast(t('UIFriendsTable_Code') + " H5 " + t('UICopyFriendRoomEnterRoom'))
      return
    }

    if (Number(normalRoom.private_room) === 1) {
      showGameToast(t('UIFriendsTable_CodeEnter'))
      return
    }

    const rid = Number(normalRoom.rid)
    if (!Number.isFinite(rid) || rid <= 0) {
      showGameToast(t('UIFriendsTable_JoinRoomNumberWrong', code))
      return
    }

    await enterFriendRoom(normalRoom, rid)
    keypadOpen.value = false
    syncInviteCode('')
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIFriendsTable_JoinTableGameFail')
    showGameToast(message)
  } finally {
    joinLoading.value = false
  }
}

async function handleJoinTable(): Promise<void> {
  if (!requireRealUser(handleJoinTable)) return
  keypadOpen.value = false
  const code = inviteCodeValue.value
  await joinByInvitationCode(code)
}

function onCreateRoom(): void {
  void router.push({ path: '/club/table/create', query: { origin_type: 4 } })
}

async function onEnterRoom(room: FriendRoomListItem): Promise<void> {
  if (!requireRealUser(() => onEnterRoom(room))) return
  if (joinLoading.value) {
    return
  }

  const status = toSafeNumber(room.status) as RoomStatus
  if (status === 3) {
    showGameToast(t('UIFriendsTable_TableDone'))
    return
  }
  if (status === 5) {
    showGameToast(t('UIFriendsTable_TableDone2'))
    return
  }

  const tryEnter = async (): Promise<void> => {
    const code = String(room.invitation_code || '').trim()
    if (code.length === INVITE_CODE_LENGTH) {
      await joinByInvitationCode(code)
      return
    }

    const rid = Number(room.rid)
    if (!Number.isFinite(rid) || rid <= 0) {
      showGameToast(t('UIFriendsTable_InfoError'))
      return
    }

    if (Number(room.private_room) === 1) {
      showGameToast(t('UIFriendsTable_CodeEnter2'))
      return
    }

    await enterFriendRoom(room, rid)
  }

  await tryEnter()
}

async function enterFriendRoom(roomInfo: unknown, roomId: number): Promise<void> {
  if (!requireRealUser(() => enterFriendRoom(roomInfo, roomId))) return

  // 端口已缓存不等于连接已建立；等待 OPEN 后再向 Cocos 下发进桌消息。
  const wsPort = await LoginSession.EnsureWS()

  const payload: EnterTablePayload = {
    userName: gameStore.loginNickname || gameStore.loginAccount || 'guest',
    userId: gameStore.loginUserId || gameStore.loginAccount || '',
    token: gameStore.sessionToken,
    websocketPort: wsPort,
    from: 'h5-friends-table',
    roomId: String(roomId),
    roomName:
      String((roomInfo as Record<string, unknown>)?.name || '').trim() ||
      String((roomInfo as Record<string, unknown>)?.invitation_code || '').trim() ||
      `room_${roomId}`,
    roomInfo,
  }

  enterTable(payload)
  gameStore.setLastEnterTable(payload)
}

function formatBlinds(sb: number, bb?: number): string {
  const big = bb ?? sb * 2
  return `${formatChip(sb)}/${formatChip(big)}`
}

function formatChip(raw: number): string {
  const safeRaw = toSafeNumber(raw)
  if (safeRaw >= 100000) {
    return `${formatChipBase(safeRaw / 1000)}k`
  }
  return formatChipBase(safeRaw)
}

function formatChipBase(raw: number): string {
  const display = raw / 100
  const fixed = Number.isInteger(display) ? display.toFixed(0) : display.toFixed(2)
  return fixed.replace(/\.?0+$/, '')
}

function getBlindLabel(room: FriendRoomListItem): string {
  const blindName = String(
    room.blind_name || room.blind_level_name || room.blind_level || room.blindtable_type_name || '',
  ).trim()
  if (blindName) return blindName

  const sb = toSafeNumber(room.sb)
  if (sb <= 0) return '--'
  const bb = toSafeNumber(room.bb, sb * 2)
  return formatBlinds(sb, bb)
}

function getRoomDuration(room: FriendRoomListItem): string {
  const gameType = toSafeNumber(room.game_type)
  const handNum = toSafeNumber(room.hand_num)
  const handLimit = toSafeNumber(room.play_hands_limit)

  if (gameType === 6 && handLimit > 0) {
    return `${handNum}/${handLimit}`
  }

  const playDuration = toSafeNumber(room.play_duration)
  if (playDuration > 0) {
    return formatRoomLeftAndTotalByUnity(room.start_time, playDuration)
  }
  return ''
}

function isAudioTable(room: FriendRoomListItem): boolean {
  return toSafeNumber(room.anti_cheat_type) === 2
}

function isVideoTable(room: FriendRoomListItem): boolean {
  return toSafeNumber(room.anti_cheat_type) === 3
}

interface FeatureIconItem {
  key: 'mushroom' | 'squid' | 'critical'
  src: string
  alt: string
}

function getFeatureIcons(room: FriendRoomListItem): FeatureIconItem[] {
  const result: FeatureIconItem[] = []
  if (toSafeNumber(room.mushroom_mode) > 0) {
    result.push({ key: 'mushroom', src: iconMushroom, alt: 'mushroom' })
  }
  if (toSafeNumber(room.squid_on) === 1) {
    result.push({ key: 'squid', src: iconSquid, alt: 'squid' })
  }
  if (toSafeNumber(room.critical_hit) === 1) {
    result.push({ key: 'critical', src: iconCritical, alt: 'critical' })
  }
  return result
}
function isParticipated(room: FriendRoomListItem): boolean {
  return room.participation_status == 1
}
function getRoomSeatRatio(room: FriendRoomListItem): string {
  const seatCount = toSafeNumber(room.seat_count)
  const emptySeat = toSafeNumber(room.empty_seat, -1)
  const roomers = toSafeNumber(room.roomers)
  const usersLength = Array.isArray(room.users) ? room.users.length : 0

  const total = seatCount > 0 ? seatCount : 9
  const current =
    seatCount > 0 && emptySeat >= 0 ? Math.max(0, seatCount - emptySeat) : roomers || usersLength

  return `${current}/${total}`
}

async function fetchFriendRooms(): Promise<void> {
  if (!gameStore.isRealUser) {
    apiFriendRooms.value = []
    return
  }
  loading.value = true
  try {
    const res = await postRoomcenterFriendRoomsApi({
      limit: 200,
      offset: 0,
    })
    if (res.code === 0 && Array.isArray(res.data?.records)) {
      apiFriendRooms.value = res.data.records.map((room) => normalizeFriendRoomRecord(room))
    }
  } catch (error) {
    console.warn('[friendsTable] fetch rooms failed:', error)
  } finally {
    loading.value = false
  }
}
function goToMineShop(): void {
  if (!requireRealUser(goToMineShop)) return
  void router.push('/mine/shop')
}

onMounted(() => {
  if (gameStore.isRealUser) {
    roomListStore.bootstrapRoomList()
    void fetchFriendRooms()
  }
})

watch(
  () => gameStore.isRealUser,
  (isReal) => {
    if (!isReal) {
      apiFriendRooms.value = []
      return
    }
    roomListStore.bootstrapRoomList()
    void fetchFriendRooms()
  },
)

watch(
  () => keypadOpen.value,
  (open) => {
    if (!open) return
    void nextTick(() => {
      requestAnimationFrame(() => {
        scrollForKeypad()
      })
    })
  },
)
</script>

<template>
  <div class="friends-table-page">
    <!-- 顶部标题栏 -->
    <div class="title-bar main-primary-header">
      <div v-fit-text="{ maxLines: 1 }" class="title">{{ t('UIMessage_Default') }}</div>
      <div class="currency-info main-primary-currency" @click="goToMineShop">
        <div class="icon-diamond">
          <img :src="iconDiamond" :alt="t('UIMine_VIP_diamond')" />
        </div>
        <div class="num">{{ displayUser.diamond }}</div>
        <div class="icon-recharge">
          <img :src="iconAdd" :alt="t('UIMine_WalletAdd_EjPOTlsz')" />
        </div>
      </div>
    </div>

    <!-- 中间可滚动区域 -->
    <div ref="scrollContentRef" class="scroll-content">
      <div class="main-content">
        <!-- 加入牌局 -->
        <div class="section join-section">
          <div v-fit-text="{ maxLines: 2 }" class="section-title">{{ t('UIFriendsTable_JoinTableGame') }}</div>
          <div v-fit-text="{ maxLines: 2 }" class="section-subtitle">{{ t('UIDialogInvitationCodeTitle') }}</div>
          <div class="invite-inputs" @click="onInputCode">
            <div v-for="(digit, index) in inviteCode" :key="index" class="invite-input-wrap">
              <span class="invite-digit">{{ digit }}</span>
            </div>
          </div>

          <button class="action-btn" @click="handleJoinTable">
            <van-loading v-if="joinLoading" />
            <span v-else v-fit-text="{ maxLines: 1 }">{{ t('UIFriendsTable_Join') }}</span>
          </button>
        </div>

        <!-- 快速组局 -->
        <div class="section create-section">
          <div v-fit-text="{ maxLines: 2 }" class="section-title">{{ t('UIFriendsTable_Round') }}</div>
          <button v-fit-text="{ maxLines: 1 }" class="action-btn" @click="onCreateRoom">{{ t('UIFriendsTable_Text') }}</button>
        </div>
      </div>

      <!-- 当前牌桌 -->
      <div class="section table-section">
        <div class="table-header">
          <div class="table-header-line"></div>
          <div class="table-header-center">
            <div class="table-header-title">{{ t('UIFriendsTable_CurrentTable') }}</div>
            <div class="table-header-sub">{{ t('UIFriendsTable_OfTable') }}</div>
          </div>
          <div class="table-header-line"></div>
        </div>

        <!-- 筛选标签 -->
        <div class="filter-tabs">
          <div
            v-for="filter in filters"
            :key="filter.key"
            class="filter-tab"
            :class="{ active: activeFilter === filter.key }"
            @click="activeFilter = filter.key"
          >
            {{ filter.label }}
          </div>
        </div>

        <!-- 牌桌列表 -->
        <div class="table-list">
          <div
            v-for="room in filteredRooms"
            :key="String(room.rid ?? '')"
            class="table-card"
            @click="onEnterRoom(room)"
          >
            <!-- 左侧游戏图标 -->
            <div class="table-card-left">
              <div class="type-card">
                <img
                  class="type-card-icon"
                  :src="getGameTypeIcon(Number(room.game_type), Number(room.poker_type))"
                  alt=""
                />
              </div>
              <span class="type-card-title">
                {{ getGameTypeName(Number(room.game_type), Number(room.poker_type)) }}
              </span>
            </div>

            <!-- 中间信息 -->
            <div class="table-card-info">
              <div class="info-row">
                <span class="blinds">{{ getBlindLabel(room) }}</span>
                <span class="room-name ml-2">{{ room.name }}</span>
              </div>
              <div class="info-row">
                <!-- <span class="tag">{{ getRoomStateLabel(room) }}</span> -->
              </div>
              <div class="info-row info-row-last">
                <div class="duration">
                  <img class="icon-time" :src="iconTime" alt="" />
                  <span>{{ getRoomDuration(room) }}</span>
                </div>
                <div class="media-icons">
                  <img v-if="isAudioTable(room)" class="icon-media" :src="iconAudio" alt="" />
                  <img v-if="isVideoTable(room)" class="icon-media" :src="iconVideo" alt="" />
                  <img
                    v-for="item in getFeatureIcons(room)"
                    :key="item.key"
                    class="icon-feature"
                    :src="item.src"
                    :alt="item.alt"
                  />
                  <span v-if="isParticipated(room)" class="participated">{{ t('UIFriendsTable_Text3') }}</span>
                </div>
              </div>
            </div>

            <!-- 右侧人数 -->
            <div class="table-card-right">
              <div class="seat-ratio">
                <img class="room-users-icon" :src="iconPeople" alt="" />
                <span>{{ getRoomSeatRatio(room) }}</span>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredRooms.length === 0 && !loading" class="empty-state">
            <div class="empty-text">{{ t('UIFriendsTable_NoTable') }}</div>
          </div>
        </div>
      </div>
    </div>
    <NumericKeypad
      :open="keypadOpen"
      :initial-value="inviteCodeValue"
      :max-length="INVITE_CODE_LENGTH"
      :allow-leading-zero="true"
      :show-input-area="false"
      :show-mask="false"
      :max="9999999"
      :confirm-text="t('UIClub_RoomJoin')"
      @close="keypadOpen = false"
      @key-press="onKeypadKeyPress"
      @submit="handleJoinTable"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.friends-table-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: min(100%, var(--app-max-width));
  margin: 0 auto;
  padding: 0 0;
  color: var(--c-text);
}

/* ===== Θí╢Θâ¿µáçΘóÿµáÅ ===== */
.title-bar {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.78rem;
  .title {
    min-width: 0;
    white-space: nowrap;
    font-size: 0.65rem;
    font-weight: 510;
    line-height: 120%;
    color: #fff;
    text-shadow: 0 0.22rem 0.5rem rgba(0, 0, 0, 0.35);

    @include theme-light-own {
      text-shadow: none;
      color: #000 !important;
    }
  }
  .currency-info {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.2);
    min-height: 0.8rem;
    padding: 0 0.24rem;
    border-radius: 0.6rem;
    overflow: hidden;
    gap: 0.2rem;

    @include theme-light-own {
      color: #000;
      background: #fff;
      box-shadow: 0 0.04rem 0.14rem rgba(34, 34, 34, 0.08);
    }
    .icon-diamond {
      width: 0.59rem;
      height: 0.59rem;
      display: flex;
      justify-content: center;
      align-items: center;

      img {
        width: 100%;
      }
    }
    .num {
      line-height: 140%;
      font-size: 0.5rem;
      font-weight: 700;
    }
    .icon-recharge {
      width: 0.47rem;
      height: 0.47rem;
      display: flex;
      align-items: center;
      justify-content: center;

      color: #dadada;

      @include theme-light-own {
        color: var(--c-brand);
      }
    }

    .icon-recharge-svg {
      width: 100%;
      height: 100%;
    }
  }
}

/* ===== σÅ»µ╗Üσè¿σåàσ«╣σî║ ===== */
.scroll-content {
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  padding: 0 0 1.5rem;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
.main-content {
  position: relative;
  height: 16.8rem;
}
.main-content::before {
  content: '  ';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('@/assets/images/friend_table_bg.svg') no-repeat center top;
  background-size: 100% auto;
  opacity: 0.1;
  pointer-events: none;

  @include theme-light-own {
    opacity: 1;
  }
}
.main-content::after {
  content: '  ';
  position: absolute;
  top: 1.1rem;
  left: 0;
  width: 100%;
  height: 90%;
  background: url('@/assets/images/friend_table_bg2.svg') no-repeat center top;
  background-size: 100% auto;
  opacity: 0.5;
  pointer-events: none;

  @include theme-light-own {
    opacity: 0;
  }
}

/* ===== ΘÇÜτö¿σî║σ¥ù ===== */
.section {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.6rem;
}

.section-title {
  max-width: 78%;
  margin-inline: auto;
  font-size: 0.6rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 600;
  color: #fff;
  text-align: center;
  line-height: 1;
  margin-bottom: 0.35rem;

  @include theme-light-own {
    color: #000 !important;
  }
}

.section-subtitle {
  max-width: 84%;
  margin-inline: auto;
  font-size: 0.4rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  line-height: 1;
  margin-bottom: 0.85rem;

  @include theme-light-own {
    color: rgba(0, 0, 0, 0.62) !important;
  }
}

.action-btn {
  width: 6.44rem;
  height: 1.42rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.4rem;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 1rem;
  color: rgba(249, 249, 249, 0.9);
  box-shadow: inset 0.4px 0.4px 0px 0px rgba(255, 255, 255, 1);
  font-size: 0.48rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  cursor: pointer;
  white-space: normal;
  text-align: center;
  line-height: 1.1;
  word-break: break-word;

  @include theme-light-own {
    color: rgba(249, 249, 249, 0.9);
    background: var(--c-brand);
    box-shadow: none;
  }
}

/* ===== σèáσàÑτëîσ▒Ç ===== */
.join-section {
  padding-top: 3.9rem;
  .invite-inputs {
    display: flex;
    justify-content: center;
    gap: 0.15rem;
    margin-bottom: 0.8rem;
  }

  .invite-input-wrap {
    width: 1.08rem;
    height: 1.08rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.19);
    border: 0.5px solid rgba(255, 255, 255, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;

    @include theme-light-own {
      background: rgba(0, 0, 0, 0.13);
      border-color: rgba(255, 40, 40, 0.08);
    }
  }

  .invite-input {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 0.6rem;
    font-family: 'HONOR Sans CN', sans-serif;
    font-weight: 500;
    color: #f9f9f9;
  }

  .invite-digit {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: transparent;
    font-size: 0.6rem;
    font-family: 'HONOR Sans CN', sans-serif;
    font-weight: 500;
    color: #f9f9f9;
    line-height: 1;

    @include theme-light-own {
      color: var(--c-text);
    }
  }
}

/* ===== σ┐½ΘÇƒτ╗äσ▒Ç ===== */
.create-section {
  margin-bottom: 0.6rem;
  .section-title {
    margin-bottom: 0.55rem;
  }
}

/* ===== σ╜ôσëìτëîµíî ===== */
.table-section {
  margin-top: 0.6rem;
  align-items: stretch;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.3rem;

  .table-header-line {
    width: 1.45rem;
    height: 0.5px;
    margin-top: 0.2rem;
    background: rgba(249, 249, 249, 0.5);

    @include theme-light-own {
      background: rgba(0, 0, 0, 0.16);
    }
  }

  .table-header-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.08rem;
  }

  .table-header-title {
    font-size: 0.51rem;
    font-family: 'SF Pro', sans-serif;
    font-weight: 400;
    color: #f9f9f9;
    text-align: center;
    line-height: 1;

    @include theme-light-own {
      color: #000 !important;
    }
  }

  .table-header-sub {
    margin-top: 0.1rem;
    font-size: 0.27rem;
    font-family: 'SF Pro', sans-serif;
    font-weight: 400;
    color: #f9f9f9;
    text-align: center;
    line-height: 1;

    @include theme-light-own {
      color: rgba(0, 0, 0, 0.62) !important;
    }
  }
}

/* τ¡¢ΘÇëµáçτ¡╛ */
.filter-tabs {
  display: flex;
  justify-content: space-between;
  gap: 0.22rem;
  margin: 0.2em 0.9rem 0.3rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.filter-tab {
  flex-shrink: 0;
  font-size: 0.35rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  padding: 0.1rem 0 0;
  margin: 0 0.15rem;
  cursor: pointer;
  border-bottom: 1.2px solid transparent;
  transition: all 0.2s;

  @include theme-light-own {
    color: rgba(0, 0, 0, 0.54);
  }

  &.active {
    color: #fff;
    font-weight: 700;
    border-bottom-color: #eaeaea;

    @include theme-light-own {
      color: var(--c-brand);
      border-bottom-color: var(--c-brand);
    }
  }
}

/* τëîµíîσêùΦí¿ */
.table-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.1rem 0.6rem;
}

.table-card {
  position: relative;
  display: flex;
  align-items: center;
  height: 2.05rem;
  border-radius: 4rem;
  background: rgba(255, 255, 255, 0.15);
  border: 0.5px solid transparent;
  padding: 0 0.3rem 0 0.15rem;
  // overflow: hidden;
  cursor: pointer;
  transition: opacity 0.2s;

  @include theme-light-own {
    background: #fff;
    border-color: #000;
  }

  &:active {
    opacity: 0.85;
  }
}

/* σ╖ªΣ╛ºµ╕╕µêÅσ¢╛µáç */
.table-card-left {
  position: relative;
  flex-shrink: 0;
  width: 1.54rem;
  height: 1.71rem;
  transform: translateX(-0.4rem);
  display: flex;
  align-items: center;
  justify-content: center;

  .type-card {
    width: 1.54rem;
    height: 1.71rem;
    border-radius: 0.44rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    backdrop-filter: blur(10px);
    background: rgba($color: #fff, $alpha: 0.3);
    border: 0.5px solid rgba(255, 255, 255, 1);

    @include theme-light-own {
      background: #fff;
      border-color: rgba(255, 255, 255, 0.78);
      box-shadow: 0 0.027rem 0.4rem rgba(0, 0, 0, 0.25);
    }
  }

  .type-card-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .type-card-title {
    position: absolute;
    bottom: 0.15rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.05rem 0.15rem;
    background: rgba(9, 9, 9, 0.19);
    border-radius: 3rem;
    font-size: 0.21rem;
    font-family: 'SF Pro', sans-serif;
    font-weight: 590;
    color: #fff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
    white-space: nowrap;
  }
}

/* Σ╕¡Θù┤Σ┐íµü» */
.table-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.09rem;
  padding: 0 0.2rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.05rem;
}

.blinds {
  font-size: 0.31rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #f8f8f8;
  line-height: 1;

  @include theme-light-own {
    color: #000;
  }
}

.room-name {
  font-size: 0.4rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  color: #f8f8f8;
  letter-spacing: 0.15px;
  line-height: 1;

  @include theme-light-own {
    color: #000;
  }
}

.tag {
  font-size: 0.31rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #f9f9f9;
  letter-spacing: 0.47px;
  line-height: 1;

  @include theme-light-own {
    color: #000;
  }
}

.duration {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  font-size: 0.31rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #f9f9f9;
  letter-spacing: 0.47px;
  line-height: 1;

  @include theme-light-own {
    color: #000;
  }

  .icon-time {
    width: 0.382rem;
    height: 0.382rem;
    color: currentColor;
    opacity: 0.51;
  }
}

.media-icons {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  color: rgba(249, 249, 249, 0.65);

  @include theme-light-own {
    color: rgba(0, 0, 0, 0.31);
  }
}

.icon-media {
  width: 0.395rem;
  height: 0.395rem;
}

.icon-feature {
  width: 0.4rem;
  height: 0.4rem;
  object-fit: contain;
}
.participated {
  font-size: 0.23rem;
  border-radius: 0.5rem;
  padding: 0.053rem 0.16rem;
  background-color: rgba($color: #000000, $alpha: 0.24);

  @include theme-light-own {
    color: rgba(0, 0, 0, 0.62);
    background: rgba(0, 0, 0, 0.08);
  }
}
.media-label {
  font-size: 0.24rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  color: rgba(249, 249, 249, 0.85);
  line-height: 1;
}

/* σÅ│Σ╛ºΣ║║µò░ */
.table-card-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.seat-ratio {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  padding: 0.08rem 0.2rem;
  min-width: 1.263rem;
  height: 0.532rem;
  justify-content: center;
  border: 1px solid transparent;
  background: rgba(0, 0, 0, 0.05);
  box-shadow:
  /* σ╖ªΣ╕èΘ½ÿσàë */
    inset 0.4px 0.4px 0px 0px rgba(255, 255, 255, 0.5),
    /* σÅ│Σ╕ïΘ½ÿσàë */ inset -0.4px -0.4px 0px 0px rgba(255, 255, 255, 0.5);
  background-blend-mode: multiply;
  border-radius: 3.2rem;
  font-size: 0.31rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
  line-height: 1;

  @include theme-light-own {
    color: #000;
    background: rgba(97, 74, 246, 0.05);
    border-color: var(--c-brand);
    box-shadow: none;
  }

  .room-users-icon {
    width: 0.453rem;
    height: 0.317rem;
    color: currentColor;

    @include theme-light-own {
      color: var(--c-brand);
    }
  }
}

/* τ⌐║τè╢µÇü */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 0;
}

.empty-text {
  font-size: 0.35rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;

  @include theme-light-own {
    color: rgba(0, 0, 0, 0.4) !important;
  }
}

:root[data-locale='cn'],
:root[data-locale='zh'] {
  .action-btn {
    font-size: 0.62rem;
  }
}

:root[data-locale='en'] {
  .action-btn {
    font-size: 0.58rem;
  }
}
</style>
