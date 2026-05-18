<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import TopActionButton from '@/components/Button/TopActionButton.vue'
import GameTable from '@/components/Table/GameTable.vue'
import GameTableColumn from '@/components/Table/GameTableColumn.vue'
import { getUserRoomSettleDetailApi } from '@/api/user'
import { useRoomListStore } from '@/stores/roomList'
import {
  type UserRoomSettleDetailData,
  type UserRoomSettleSelf,
  type UserRoomSettleUserInfo,
} from '@/api/models/user'
import iconStar from '@/assets/icons/icon_star.png'

const route = useRoute()
const roomListStore = useRoomListStore()

// ---- Types ----
interface PlayerRow extends UserRoomSettleUserInfo {
  _score: number // bring_out - bring_in
}

// ---- State ----
const loading = ref(true)
const settleData = ref<UserRoomSettleDetailData | null>(null)

const roomId = computed(() => String(route.query.roomId || route.params.roomId || ''))
const gamePlaySubType = computed(() => Number(route.query.gamePlaySubType || 0))
const bridgePayloadText = computed(() =>
  JSON.stringify(
    {
      fullPath: route.fullPath,
      params: route.params,
      query: route.query,
      roomId: roomId.value,
      gamePlaySubType: gamePlaySubType.value,
    },
    null,
    2,
  ),
)

// ---- Mock data (always visible as fallback) ----
const MOCK_LIST: UserRoomSettleUserInfo[] = [
  {
    user_random_id: 10086,
    nick_name: 'PokerKing',
    avatar: '',
    user_hand_num: 20,
    bring_in: 50000,
    bring_out: 48000,
  },
  {
    user_random_id: 20001,
    nick_name: 'LuckyAce',
    avatar: '',
    user_hand_num: 18,
    bring_in: 30000,
    bring_out: 55500,
  },
  {
    user_random_id: 20002,
    nick_name: 'SharkHunter',
    avatar: '',
    user_hand_num: 16,
    bring_in: 40000,
    bring_out: 15200,
  },
  {
    user_random_id: 20003,
    nick_name: 'FishBait',
    avatar: '',
    user_hand_num: 12,
    bring_in: 25000,
    bring_out: 61800,
  },
  {
    user_random_id: 20004,
    nick_name: 'RiverRat',
    avatar: '',
    user_hand_num: 15,
    bring_in: 35000,
    bring_out: 11400,
  },
  {
    user_random_id: 20005,
    nick_name: 'BluffMaster',
    avatar: '',
    user_hand_num: 19,
    bring_in: 45000,
    bring_out: 78300,
  },
  {
    user_random_id: 20006,
    nick_name: 'AcePlayer',
    avatar: '',
    user_hand_num: 14,
    bring_in: 28000,
    bring_out: 42100,
  },
  {
    user_random_id: 20007,
    nick_name: 'ChipLeader',
    avatar: '',
    user_hand_num: 20,
    bring_in: 52000,
    bring_out: 89000,
  },
]

const MOCK_DATA = {
  room_name: '测12345的牌局',
  room_id: 12345678,
  end_time: '20/04/2026 22:56',
  game_type: '德州-普通-無限注',
  self_settle: {
    user_random_id: 10086,
    nick_name: 'PokerKing',
    avatar: '',
    user_hand_num: 20,
    bring_in: 50000,
    bring_out: 48000,
  },
  list: MOCK_LIST,
}

// ---- Room info (from API or mock) ----
const roomInfo = computed(() => {
  const d = settleData.value
  if (!d) return MOCK_DATA
  return {
    room_name: (d as any).room_name || MOCK_DATA.room_name,
    room_id: (d as any).room_id || Number(roomId.value) || MOCK_DATA.room_id,
    end_time: (d as any).end_time || MOCK_DATA.end_time,
    game_type: (d as any).game_type || MOCK_DATA.game_type,
  }
})

// ---- Self info ----
const selfInfo = computed<UserRoomSettleSelf | null>(() => settleData.value?.self_settle ?? null)

const myProfit = computed<number>(() => {
  const s = selfInfo.value
  if (!s) return 0
  return (s.bring_out || 0) - (s.bring_in || 0)
})

const myHands = computed<number>(() => selfInfo.value?.user_hand_num ?? 0)

// ---- Table data ----
const tableData = computed<PlayerRow[]>(() => {
  const list = settleData.value?.list
  if (!list?.length) return MOCK_LIST.map(rowToPlayerRow)
  return list.map(rowToPlayerRow)
})

function rowToPlayerRow(info: UserRoomSettleUserInfo): PlayerRow {
  const score = (info.bring_out || 0) - (info.bring_in || 0)
  return { ...info, _score: score }
}

// ---- Formatters ----
function formatScore(val: number): string {
  if (val > 0) return `+${val.toLocaleString('en-US')}`
  if (val < 0) return `${val.toLocaleString('en-US')}`
  return '0'
}

function formatBuyIn(_val: unknown, row: Record<string, any>): string {
  return Number(row.bring_in || 0).toLocaleString('en-US')
}

function scoreFormatter(_val: unknown, row: Record<string, any>): string {
  return formatScore(Number(row._score ?? 0))
}

// Score color class
function _scoreClass(row: Record<string, any>): string {
  const v = Number(row._score ?? 0)
  if (v > 0) return 'score--pos'
  if (v < 0) return 'score--neg'
  return ''
}

// ---- Actions ----
async function fetchSettle(): Promise<void> {
  loading.value = true
  try {
    if (!roomId.value) {
      settleData.value = null
      return
    }
    const res = await getUserRoomSettleDetailApi(roomId.value)
    if (res.code === 0 && res.data) {
      settleData.value = res.data
    } else {
      settleData.value = null
    }
  } catch (error) {
    console.warn('[TableGameEnd] fetch failed:', error)
    settleData.value = null
  } finally {
    loading.value = false
  }
}

function handleFavorite(): void {
  // TODO: favorite logic
}

onMounted(() => {
  console.log('[TableGameEnd] bridge route payload:', {
    fullPath: route.fullPath,
    params: route.params,
    query: route.query,
    roomId: roomId.value,
    gamePlaySubType: gamePlaySubType.value,
  })
  // 回到 H5 结算页时主动静默刷新一次牌桌列表，确保已结束牌桌及时从列表移除。
  void roomListStore.fetchRooms({ silent: true })
  void fetchSettle()
})
</script>

<template>
  <div class="page-shell settle-page main-bg">
    <!-- Header -->
    <HeaderBack title="牌局统计">
      <template #right>
        <TopActionButton name="" :icon="iconStar" @click="handleFavorite" />
      </template>
    </HeaderBack>

    <main class="settle-content">
      <!-- Loading -->
      <div v-if="loading" class="settle-loading">
        <van-loading size="0.5rem" color="rgba(255,255,255,0.6)" />
        <span>加载结算数据...</span>
      </div>

      <template v-else>
        <!-- ====== Top Summary Card ====== -->
        <section class="summary-card">
          <!-- Row 1: 牌局名+ID | 时间+玩法 -->
          <div class="summary-top">
            <div class="summary-left">
              <p class="room-name">{{ roomInfo.room_name }}</p>
              <p class="room-id">
                <span class="id-badge">ID</span>
                <span class="id-num">{{ roomInfo.room_id }}</span>
              </p>
            </div>
            <div class="summary-right">
              <p class="room-time">{{ roomInfo.end_time }}</p>
              <p class="room-type">{{ roomInfo.game_type }}</p>
            </div>
          </div>

          <!-- Divider -->
          <div class="summary-divider"></div>

          <!-- Row 2: 个人战绩 标题 -->
          <p class="summary-title">个人战绩</p>

          <!-- Row 3: 总手数 | 战绩 -->
          <div class="summary-stats">
            <div class="stat-block stat--hands">
              <span class="stat-value">{{ myHands }}/{{ myHands }}</span>
              <span class="stat-label">总手数</span>
            </div>
            <div class="stat-block stat--profit">
              <span class="stat-value">{{ formatScore(myProfit) }}</span>
              <span class="stat-label">战绩</span>
            </div>
          </div>
        </section>

        <section class="debug-card">
          <p class="debug-title">Bridge Payload</p>
          <pre class="debug-content">{{ bridgePayloadText }}</pre>
        </section>

        <!-- ====== Player Table ====== -->
        <GameTable :data="tableData" height="auto" :show-header="true">
          <GameTableColumn prop="nick_name" label="玩家" :flex="2" align="left" />
          <GameTableColumn prop="user_random_id" label="ID" :flex="1.5" align="center" />
          <GameTableColumn
            prop="bring_in"
            label="买入"
            :flex="1.5"
            align="center"
            :formatter="formatBuyIn"
          />
          <GameTableColumn
            prop="_score"
            label="和分"
            :flex="1.5"
            align="right"
            :formatter="scoreFormatter"
          />
        </GameTable>
      </template>
    </main>
  </div>
</template>

<style scoped lang="scss">
.settle-page {
  min-height: 100dvh;
  padding-top: calc(env(safe-area-inset-top) + 0.46rem);
  padding-bottom: env(safe-area-inset-bottom);
  color: #f9f9f9;
}

.settle-content {
  padding: 0.24rem 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

/* ---- Loading ---- */
.settle-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.24rem;
  padding: 3rem 0;
  font-size: 0.34rem;
  color: rgba(255, 255, 255, 0.55);
}

/* ============================================================
   Summary Card — 严格对齐 Figma 1792_17727
   border-radius: 28.49px → 0.76rem
   background: rgba(0,0,0,0.20)
   ============================================================ */
.summary-card {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.76rem;
  backdrop-filter: blur(0.16px);
  -webkit-backdrop-filter: blur(0.16px);
  padding: 0.44rem 0.44rem 0.38rem;
}

.debug-card {
  background: rgba(0, 0, 0, 0.18);
  border-radius: 0.48rem;
  padding: 0.28rem 0.32rem;
}

.debug-title {
  margin: 0 0 0.16rem;
  font-size: 0.28rem;
  color: rgba(255, 255, 255, 0.72);
}

.debug-content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 0.24rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
}

/* ---- Row 1: 牌局名+ID | 时间+玩法 ---- */
.summary-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.summary-left {
  display: flex;
  flex-direction: column;
  gap: 0.04rem;
}

.room-name {
  margin: 0;
  font-size: 0.38rem;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  line-height: 1.2;
  color: #fff;
}

.room-id {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.08rem;
  line-height: 1;
}

.id-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.02rem 0.1rem;
  font-size: 0.22rem;
  font-weight: 590;
  font-family: 'SF Pro', sans-serif;
  color: #fff;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 0.11rem;
  line-height: 1.2;
}

.id-num {
  font-size: 0.26rem;
  font-weight: 510;
  font-family: 'SF Pro', sans-serif;
  color: rgba(255, 255, 255, 0.7);
}

.summary-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.02rem;
}

.room-time {
  margin: 0;
  font-size: 0.3rem;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.3;
}

.room-type {
  margin: 0;
  font-size: 0.3rem;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.3;
}

/* ---- Divider ---- */
.summary-divider {
  height: 1px;
  margin: 0.32rem 0 0.28rem;
  background: rgba(163, 163, 163, 0.2);
}

/* ---- Row 2: 个人战绩 标题 ---- */
.summary-title {
  margin: 0;
  text-align: center;
  font-size: 0.38rem;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  color: #fff;
  line-height: 1.2;
}

/* ---- Row 3: 总手数 | 战绩 ---- */
.summary-stats {
  display: flex;
  justify-content: center;
  gap: 0.92rem;
  margin-top: 0.32rem;
}

.stat-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.06rem;
}

.stat-value {
  font-size: 0.64rem;
  font-weight: 510;
  font-family: 'SF Pro', sans-serif;
  line-height: 1;
}

.stat-label {
  font-size: 0.22rem;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  opacity: 0.5;
  color: #fff;
  line-height: 1;
}

.stat--hands .stat-value {
  color: var(--red, #ff132b);
}

.stat--profit .stat-value {
  color: var(--primary, #05e7ae);
}

/* ---- Table score colors override ---- */
:deep(.game-table__row .game-table__cell) {
  &:last-child .game-table__cell-text {
    font-family: 'HONOR Sans CN', sans-serif;
    font-weight: 500;

    /* positive → red, negative → green (matches Figma) */
    &[class*='score--pos'],
    &[class*='text-pos'] {
      color: var(--red, #ff132b);
    }

    &[class*='score--neg'],
    &[class*='text-neg'] {
      color: var(--primary, #05e7ae);
    }
  }
}
</style>
