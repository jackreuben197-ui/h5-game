<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { postStatsRoomDetailApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const title = computed(() => '战绩详情')

interface SeatPlayer {
  name: string
  chips: string
  tag?: string
  highlight?: boolean
}

interface PlayerResult {
  id: string
  name: string
  uid: string
  amount: string
  selfDraw: string
  catchWin: string
  discardLose: string
  concealedKong: string
  exposedKong: string
}

const router = useRouter()
const route = useRoute()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const loading = ref(false)
const currentRoomId = ref(0)
const detailTitle = ref('Hand Name')
const detailSub = ref('ID: --')
const detailTime = ref('--')
const totalAmount = ref('+0')

const seatPlayers = ref<SeatPlayer[]>([
  { name: 'Hanna', chips: '120', tag: '土豪' },
  { name: 'Paityn', chips: '3340', tag: 'MVP', highlight: true },
  { name: 'Giana', chips: '120', tag: '土豪' },
])

const summaryItems = ref([
  { label: '带入', value: '1200' },
  { label: '底池', value: '3580' },
  { label: '手数', value: '20' },
  { label: '时长', value: '2.3h' },
])

const playerResults = ref<PlayerResult[]>([
  {
    id: 'p1',
    name: 'Player Name',
    uid: '11440454',
    amount: '+1200',
    selfDraw: '20',
    catchWin: '20',
    discardLose: '20',
    concealedKong: '20',
    exposedKong: '20',
  },
  {
    id: 'p2',
    name: 'Player Name',
    uid: '11440454',
    amount: '-600',
    selfDraw: '12',
    catchWin: '8',
    discardLose: '20',
    concealedKong: '6',
    exposedKong: '4',
  },
])

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatSigned(value: number): string {
  const abs = Math.abs(value).toLocaleString('en-US')
  if (value === 0) {
    return '0'
  }
  return value > 0 ? `+${abs}` : `-${abs}`
}

function extractRoomId(): number {
  const raw = route.query.room_id ?? route.query.id
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

async function fetchDetail(): Promise<void> {
  const roomId = extractRoomId()
  if (roomId <= 0) {
    return
  }

  loading.value = true
  try {
    const response = await postStatsRoomDetailApi(
      {
        limit: 50,
        offset: 0,
      },
      { id: roomId },
    )

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载麻将战绩详情失败')
    }

    const roomData = response.data?.room_data
    const usersRaw = roomData?.user_list
    const users = Array.isArray(usersRaw) ? usersRaw : []

    currentRoomId.value = toSafeNumber(roomData?.room_id)
    detailTitle.value = String(roomData?.game_room_name ?? 'Hand Name')
    detailSub.value = `ID: ${String(roomData?.room_id ?? '--')}`
    detailTime.value = `${String(roomData?.start_time ?? '--')} - ${String(roomData?.end_time ?? '--')}`

    summaryItems.value = [
      { label: '带入', value: toSafeNumber(roomData?.all_bring_in).toLocaleString('en-US') },
      { label: '底池', value: toSafeNumber(roomData?.all_bet_pot ?? roomData?.max_bet_pot).toLocaleString('en-US') },
      { label: '手数', value: toSafeNumber(roomData?.room_total_hand_num).toLocaleString('en-US') },
      { label: '时长', value: `${Math.max(0, Math.round(toSafeNumber(roomData?.player_duration) / 3600))}h` },
    ]

    seatPlayers.value = users.slice(0, 3).map((user, index) => ({
      name: String(user.nick_name ?? `Player ${index + 1}`),
      chips: toSafeNumber(user.finally_game_results ?? user.original_results).toLocaleString('en-US'),
      tag: index === 1 ? 'MVP' : undefined,
      highlight: index === 1,
    }))

    playerResults.value = users.map((user, index) => ({
      id: String(user.user_random_id ?? index + 1),
      name: String(user.nick_name ?? 'Player Name'),
      uid: String(user.user_random_id ?? '--'),
      amount: formatSigned(toSafeNumber(user.finally_game_results ?? user.original_results)),
      selfDraw: String(toSafeNumber(user.mj_win_self_draw_count)),
      catchWin: String(toSafeNumber(user.mj_win_discard_count)),
      discardLose: String(toSafeNumber(user.mj_lose_discard_count)),
      concealedKong: String(toSafeNumber(user.mj_concealed_kong_count)),
      exposedKong: String(toSafeNumber(user.mj_exposed_kong_count)),
    }))

    const total = playerResults.value.reduce((sum, item) => sum + toSafeNumber(item.amount.replace(/,/g, '')), 0)
    totalAmount.value = formatSigned(total)
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载麻将战绩详情失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

function goToHands(): void {
  void router.push({
    path: '/mine/club-mahjong/hand',
    query: {
      room_id: currentRoomId.value > 0 ? String(currentRoomId.value) : undefined,
    },
  })
}

onMounted(() => {
  void fetchDetail()
})
</script>

<template>
  <div class="record-detail-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="glass-card sort-bar">
        <span>按结束时间</span>
        <span class="arrow">▾</span>
      </section>

      <section class="glass-card table-section">
        <div class="seat-row">
          <article
            v-for="(item, index) in seatPlayers"
            :key="item.name + index"
            class="seat"
            :class="{ highlight: item.highlight }"
          >
            <div class="avatar"></div>
            <div v-if="item.tag" class="tag">{{ item.tag }}</div>
            <div class="name">{{ item.name }}</div>
            <div class="chips">{{ item.chips }}</div>
          </article>
        </div>

        <div class="hand-summary">
          <div class="name-line">
            <div>
              <div class="title">{{ detailTitle }}</div>
              <div class="sub">{{ detailSub }}</div>
            </div>
            <div class="time">{{ detailTime }}</div>
          </div>
          <div class="summary-grid">
            <div v-for="item in summaryItems" :key="item.label" class="summary-item">
              <span class="label">{{ item.label }}</span>
              <span class="value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="glass-card result-section">
        <div class="section-head">
          <div>牌局结算</div>
          <div class="total">{{ totalAmount }}</div>
        </div>

        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!playerResults.length" class="list-status">暂无结算数据</p>

        <article
          v-for="item in playerResults"
          :key="item.id"
          class="result-row"
          @click="goToHands"
        >
          <div class="top">
            <div class="left">
              <div class="avatar small"></div>
              <div>
                <div class="name">{{ item.name }}</div>
                <div class="sub">ID: {{ item.uid }}</div>
              </div>
            </div>
            <div class="amount" :class="{ minus: item.amount.startsWith('-') }">{{ item.amount }}</div>
          </div>
          <div class="stats-row">
            <span>自摸:{{ item.selfDraw }}</span>
            <span>接炮:{{ item.catchWin }}</span>
            <span>点炮:{{ item.discardLose }}</span>
            <span>暗杠:{{ item.concealedKong }}</span>
            <span>明杠:{{ item.exposedKong }}</span>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.record-detail-page {
  min-height: 100dvh;
  padding-top: calc(env(safe-area-inset-top) + 0.46rem);
  padding-bottom: 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  padding: 0 0.45rem;
}

.glass-card {
  border-radius: 0.42rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.sort-bar {
  margin-top: 0.36rem;
  padding: 0.22rem 0.34rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.34rem;

  .arrow {
    font-size: 0.26rem;
    opacity: 0.82;
  }
}

.table-section {
  margin-top: 0.34rem;
  padding: 0.28rem;
}

.seat-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.2rem;
}

.seat {
  text-align: center;

  .avatar {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.45);
    margin: 0 auto;
  }

  .tag {
    margin-top: 0.08rem;
    display: inline-flex;
    padding: 0.02rem 0.14rem;
    border-radius: 0.2rem;
    background: rgba(255, 210, 120, 0.2);
    color: #ffd977;
    font-size: 0.24rem;
  }

  .name {
    margin-top: 0.09rem;
    font-size: 0.28rem;
  }

  .chips {
    margin-top: 0.02rem;
    font-size: 0.3rem;
    color: #f7e37f;
  }

  &.highlight {
    .avatar {
      width: 1.3rem;
      height: 1.3rem;
      background: rgba(255, 255, 255, 0.62);
    }
  }
}

.hand-summary {
  margin-top: 0.26rem;
  border-top: 0.02rem solid rgba(255, 255, 255, 0.16);
  padding-top: 0.24rem;
}

.name-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 0.16rem;

  .title {
    font-size: 0.44rem;
  }

  .sub {
    margin-top: 0.06rem;
    font-size: 0.3rem;
    color: rgba(255, 255, 255, 0.74);
  }

  .time {
    font-size: 0.27rem;
    color: rgba(255, 255, 255, 0.78);
    text-align: right;
  }
}

.summary-grid {
  margin-top: 0.25rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.08rem;
}

.summary-item {
  text-align: center;

  .label {
    font-size: 0.24rem;
    color: rgba(255, 255, 255, 0.72);
  }

  .value {
    display: block;
    margin-top: 0.06rem;
    font-size: 0.37rem;
    font-weight: 600;
  }
}

.result-section {
  margin-top: 0.32rem;
  padding: 0.26rem 0;
}

.section-head {
  padding: 0 0.35rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.33rem;

  .total {
    color: #65e89f;
    font-size: 0.45rem;
    font-weight: 700;
  }
}

.result-row {
  margin-top: 0.16rem;
  padding: 0.22rem 0.35rem;
  border-top: 0.02rem solid rgba(255, 255, 255, 0.15);
}

.list-status {
  margin: 0.2rem 0;
  text-align: center;
  font-size: 0.3rem;
  color: rgba(255, 255, 255, 0.8);
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.2rem;
}

.left {
  display: flex;
  gap: 0.14rem;

  .avatar.small {
    width: 0.66rem;
    height: 0.66rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.52);
  }

  .name {
    font-size: 0.34rem;
  }

  .sub {
    margin-top: 0.05rem;
    font-size: 0.25rem;
    color: rgba(255, 255, 255, 0.7);
  }
}

.amount {
  font-size: 0.45rem;
  color: #6be89d;
  font-weight: 700;

  &.minus {
    color: #ff8ea2;
  }
}

.stats-row {
  margin-top: 0.12rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.12rem 0.22rem;
  font-size: 0.24rem;
  color: rgba(255, 255, 255, 0.78);
}
</style>
