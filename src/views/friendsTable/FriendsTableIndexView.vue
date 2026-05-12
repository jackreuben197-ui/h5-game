<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserInfoStore } from '@/stores/userInfo'
import { postRoomcenterFriendRoomsApi, postRoomcenterInvitationRoomApi } from '@/api/roomcenter'
import type { RoomcenterFriendRoomRecord } from '@/api/models/roomcenter'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconAdd from '@/assets/icons/icon_add.svg'
import iconAudio from '@/assets/icons/icon_audio.png'
import iconVideo from '@/assets/icons/icon_video.png'
import iconPeople from '@/assets/icons/icon_people.png'
import iconNlh from '@/assets/icons/game_type_nlh.png'
import iconPlo from '@/assets/icons/game_type_plo.png'
import iconSixPlus from '@/assets/icons/game_type_6+.png'
import NumericKeypad from '@/components/KeyBoard/NumericKeypad.vue'
import { showGameToast } from '@/components/Toast'
import { t } from '@/i18n'
import { enterTable } from '@/bridge/core'
import type { EnterTablePayload } from '@/bridge/protocol'
import LoginSession from '@/session/loginSession'
import { useGameStore } from '@/stores/game'
import { formatRoomLeftAndTotalByUnity } from '@/utils/time'

const router = useRouter()
const userInfoStore = useUserInfoStore()
const gameStore = useGameStore()

const INVITE_CODE_LENGTH = 7
const inviteCode = ref<string[]>(Array(INVITE_CODE_LENGTH).fill(''))
const keypadOpen = ref(false)
const inviteCodeValue = computed(() => inviteCode.value.join(''))
const scrollContentRef = ref<HTMLElement | null>(null)

const activeFilter = ref('all')
const filters = [
  { key: 'all', label: '全部' },
  { key: 'nlh', label: '德州' },
  { key: 'plo', label: '奥马哈' },
  { key: 'short', label: '6+' },
  // { key: 'mahjong', label: '麻将' },
]

const friendRooms = ref<RoomcenterFriendRoomRecord[]>([])
const loading = ref(false)
const joinLoading = ref(false)
type RoomStatus = 0 | 1 | 2 | 3 | 4 | 5

const displayUser = computed(() => {
  return {
    diamond: userInfoStore.userInfo?.user.diamonds ?? 0,
  }
})

function onInputCode(): void {
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
  action: 'digit' | 'clear' | 'backspace'
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
  if (isShortPokerType(pokerType)) return '短牌'
  if (gameType === 6) return '麻将'
  if (gameType === 0) return '德州'
  if (gameType >= 1 && gameType <= 3) return '奥马哈'
  return '德州'
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
  if (joinLoading.value) {
    return
  }

  if (code.length !== INVITE_CODE_LENGTH) {
    showGameToast(t('UIFriendsTable_JoinRoomNumberWrong', code))
    return
  }

  if (!gameStore.sessionToken) {
    showGameToast(t('tokenFail'))
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
      showGameToast('该邀请码对应赛事暂不支持在 H5 进入')
      return
    }

    if (Number(normalRoom.private_room) === 1) {
      showGameToast('私密房间请在客户端输入密码进入')
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
    const message = error instanceof Error ? error.message : '加入牌局失败'
    showGameToast(message)
  } finally {
    joinLoading.value = false
  }
}

async function handleJoinTable(): Promise<void> {
  keypadOpen.value = false
  const code = inviteCodeValue.value
  await joinByInvitationCode(code)
}

function onCreateRoom(): void {
  void router.push({ path: '/club/table/create', query: { origin_type: 4 } })
}

async function onEnterRoom(room: RoomcenterFriendRoomRecord): Promise<void> {
  if (joinLoading.value) {
    return
  }

  const status = toSafeNumber(room.status) as RoomStatus
  if (status === 3) {
    showGameToast('该牌桌已被强制关闭')
    return
  }
  if (status === 5) {
    showGameToast('该牌桌已关闭')
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
      showGameToast('房间信息异常')
      return
    }

    if (Number(room.private_room) === 1) {
      showGameToast('私密房间请通过邀请码进入')
      return
    }

    await enterFriendRoom(room, rid)
  }

  await tryEnter()
}

async function enterFriendRoom(roomInfo: unknown, roomId: number): Promise<void> {
  if (!gameStore.sessionToken) {
    showGameToast(t('tokenFail'))
    return
  }

  let wsPort = Number(gameStore.websocketPort) || 0
  if (!wsPort) {
    wsPort = await LoginSession.EnsureWS()
  }

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

function getBlindLabel(room: RoomcenterFriendRoomRecord): string {
  const blindName = String(
    room.blind_name || room.blind_level_name || room.blind_level || room.blindtable_type_name || '',
  ).trim()
  if (blindName) return blindName

  const sb = toSafeNumber(room.sb)
  if (sb <= 0) return '--'
  const bb = toSafeNumber(room.bb, sb * 2)
  return formatBlinds(sb, bb)
}

function getRoomDuration(room: RoomcenterFriendRoomRecord): string {
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

function getRoomStateLabel(room: RoomcenterFriendRoomRecord): string {
  const status = toSafeNumber(room.status) as RoomStatus
  if (status === 1) return '未开始'
  if (status === 2) return '进行中'
  if (status === 3) return '已强制关闭'
  if (status === 4) return '即将关闭'
  if (status === 5) return '已关闭'
  return '未开始'
}

function isAudioTable(room: RoomcenterFriendRoomRecord): boolean {
  return toSafeNumber(room.anti_cheat_type) === 2
}

function isVideoTable(room: RoomcenterFriendRoomRecord): boolean {
  return toSafeNumber(room.anti_cheat_type) === 3
}

function getRoomSeatRatio(room: RoomcenterFriendRoomRecord): string {
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
  loading.value = true
  try {
    const res = await postRoomcenterFriendRoomsApi({
      limit: 200,
      offset: 0,
    })
    if (res.code === 0 && Array.isArray(res.data?.records) && res.data.records.length > 0) {
      friendRooms.value = res.data.records as RoomcenterFriendRoomRecord[]
    }
  } catch (error) {
    console.warn('[friendsTable] fetch rooms failed:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchFriendRooms()
})

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
    <div class="title-bar">
      <div class="title">朋友桌</div>
      <div class="currency-info">
        <div class="icon-diamond">
          <img :src="iconDiamond" alt="钻石" />
        </div>
        <div class="num">{{ displayUser.diamond }}</div>
        <div class="icon-recharge">
          <img :src="iconAdd" alt="充值" />
        </div>
      </div>
    </div>

    <!-- 中间可滚动区域 -->
    <div ref="scrollContentRef" class="scroll-content">
      <div class="main-content">
        <!-- 加入牌局 -->
        <div class="section join-section">
          <div class="section-title">加入牌局</div>
          <div class="section-subtitle">输入邀请码，和朋友一起切磋</div>
          <div class="invite-inputs" @click="onInputCode">
            <div v-for="(digit, index) in inviteCode" :key="index" class="invite-input-wrap">
              <span class="invite-digit">{{ digit }}</span>
            </div>
          </div>

          <button class="action-btn" @click="handleJoinTable">
            <van-loading v-if="joinLoading" />
            <span v-else>立即加入</span>
          </button>
        </div>

        <!-- 快速组局 -->
        <div class="section create-section">
          <div class="section-title">快速组局</div>
          <button class="action-btn" @click="onCreateRoom">开始创建</button>
        </div>
      </div>

      <!-- 当前牌桌 -->
      <div class="section table-section">
        <div class="table-header">
          <div class="table-header-line"></div>
          <div class="table-header-center">
            <div class="table-header-title">当前牌桌</div>
            <div class="table-header-sub">显示目前有效的牌桌</div>
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
              <div class="type-card-title">
                {{ getGameTypeName(Number(room.game_type), Number(room.poker_type)) }}
              </div>
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
                  <img class="icon-time" src="@/assets/icons/icon_time.png" alt="" />
                  <span>{{ getRoomDuration(room) }}</span>
                </div>
                <div class="media-icons">
                  <img v-if="isAudioTable(room)" class="icon-media" :src="iconAudio" alt="" />
                  <img v-if="isVideoTable(room)" class="icon-media" :src="iconVideo" alt="" />
                </div>
              </div>
            </div>

            <!-- 右侧人数 -->
            <div class="table-card-right">
              <div class="seat-ratio">
                <img class="icon-people" :src="iconPeople" alt="" />
                <span>{{ getRoomSeatRatio(room) }}</span>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredRooms.length === 0 && !loading" class="empty-state">
            <div class="empty-text">暂无牌桌</div>
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
      confirm-text="加入"
      @close="keypadOpen = false"
      @key-press="onKeypadKeyPress"
      @submit="handleJoinTable"
    />
  </div>
</template>

<style scoped lang="scss">
.friends-table-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 0;
  color: var(--color-text-main2);
}

/* ===== 顶部标题栏 ===== */
.title-bar {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  min-height: 1rem;
  padding: 0 0.78rem;
  .title {
    font-size: 0.65rem;
    font-weight: 510;
    line-height: 1;
    text-shadow: 0 0.22rem 0.5rem rgba(0, 0, 0, 0.35);
  }
  .currency-info {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--color-bg-shadow);
    height: 0.72rem;
    padding: 0 0.24rem;
    border-radius: 0.6rem;
    overflow: hidden;
    gap: 0.2rem;
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
      line-height: 1;
      font-size: 0.5rem;
      font-weight: 700;
    }
    .icon-recharge {
      width: 0.47rem;
      height: 0.47rem;
      display: flex;
      align-items: center;
      justify-content: center;
      img {
        width: 100%;
      }
    }
  }
}

/* ===== 可滚动内容区 ===== */
.scroll-content {
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
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
}

/* ===== 通用区块 ===== */
.section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.6rem;
}

.section-title {
  font-size: 0.72rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 600;
  color: #fff;
  text-align: center;
  line-height: 1;
  margin-bottom: 0.35rem;
}

.section-subtitle {
  font-size: 0.4rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  line-height: 1;
  margin-bottom: 0.85rem;
}

.action-btn {
  width: 6.44rem;
  height: 1.42rem;
  line-height: 1.42rem;
  padding: 0 1.8rem;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 1rem;
  color: rgba(249, 249, 249, 0.9);
  box-shadow:
  /* 左上高光 */ inset 0.4px 0.4px 0px 0px rgba(255, 255, 255, 1);
  font-size: 0.48rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

/* ===== 加入牌局 ===== */
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
  }
}

/* ===== 快速组局 ===== */
.create-section {
  margin-bottom: 0.6rem;
  .section-title {
    margin-bottom: 0.55rem;
  }
}

/* ===== 当前牌桌 ===== */
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
  }

  .table-header-sub {
    margin-top: 0.1rem;
    font-size: 0.27rem;
    font-family: 'SF Pro', sans-serif;
    font-weight: 400;
    color: #f9f9f9;
    text-align: center;
    line-height: 1;
  }
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
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

  &.active {
    color: #fff;
    font-weight: 700;
    border-bottom-color: #eaeaea;
  }
}

/* 牌桌列表 */
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
  padding: 0 0.3rem 0 0.15rem;
  // overflow: hidden;
  cursor: pointer;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.85;
  }
}

/* 左侧游戏图标 */
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

/* 中间信息 */
.table-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
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
}

.room-name {
  font-size: 0.4rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  color: #f8f8f8;
  letter-spacing: 0.15px;
  line-height: 1;
}

.tag {
  font-size: 0.31rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #f9f9f9;
  letter-spacing: 0.47px;
  line-height: 1;
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

  .icon-time {
    width: 0.35rem;
    height: 0.35rem;
    object-fit: contain;
  }
}

.media-icons {
  display: flex;
  align-items: center;
  gap: 0.08rem;
}

.icon-media {
  width: 0.35rem;
  height: 0.35rem;
  object-fit: contain;
}

.media-label {
  font-size: 0.24rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  color: rgba(249, 249, 249, 0.85);
  line-height: 1;
}

/* 右侧人数 */
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
  background: rgba(0, 0, 0, 0.05);
  box-shadow:
  /* 左上高光 */ inset 0.4px 0.4px 0px 0px rgba(255, 255, 255, 0.5),
    /* 右下高光 */ inset -0.4px -0.4px 0px 0px rgba(255, 255, 255, 0.5);
  background-blend-mode: multiply;
  border-radius: 3.2rem;
  font-size: 0.31rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
  line-height: 1;

  .icon-people {
    width: 0.35rem;
    height: 0.35rem;
    object-fit: contain;
  }
}

/* 空状态 */
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
}
</style>
