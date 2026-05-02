<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRouter } from 'vue-router'
import { postRoomCenterHistoryListApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => '战绩')
interface SummaryMetric {
  label: string
  value: string
}

interface RecordCard {
  id: string
  playerName: string
  playerId: string
  blinds: string
  hands: string
  duration: string
  endAt: string
  profit: string
}

const gameTabs = ['德州', '奥马哈', '短牌']
const timeTabs = ['今天', '7天', '30天']
const selectedGame = ref(gameTabs[0])
const selectedTime = ref(timeTabs[0])
const loading = ref(false)

const leftMetrics = ref<SummaryMetric[]>([
  { label: '总带入', value: '25,600' },
  { label: '手数', value: '1,200' },
])

const rightMetrics = ref<SummaryMetric[]>([
  { label: '入池率', value: '26%' },
  { label: '胜率', value: '54%' },
])

const detailRowsOne = ref<SummaryMetric[]>([
  { label: '局数', value: '20' },
  { label: '总盈亏', value: '+5000' },
  { label: '大底池', value: '1024' },
  { label: 'MVP', value: '3' },
])

const detailRowsTwo = ref<SummaryMetric[]>([
  { label: '摊牌', value: '8' },
  { label: '加注', value: '32' },
  { label: '诈唬', value: '5' },
  { label: '弃牌', value: '20' },
])

const todayProfit = ref('+0')

const records = ref<RecordCard[]>([
  {
    id: 'r1',
    playerName: 'Player Name',
    playerId: '11440454',
    blinds: '5/10',
    hands: '20',
    duration: '2.5h',
    endAt: '06/04 22:56',
    profit: '+1024',
  },
  {
    id: 'r2',
    playerName: 'Player Name',
    playerId: '11440454',
    blinds: '5/10',
    hands: '18',
    duration: '1.8h',
    endAt: '06/03 21:40',
    profit: '-380',
  },
])

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatSigned(value: number): string {
  const abs = Math.abs(value).toLocaleString('en-US')
  if (value === 0) return '0'
  return value > 0 ? `+${abs}` : `-${abs}`
}

function resolveGameTypes(): number[] {
  if (selectedGame.value === '奥马哈') {
    return [1, 2, 3]
  }
  if (selectedGame.value === '短牌') {
    return [0]
  }
  return [0]
}

function formatDateText(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) {
    return raw
  }
  const timestamp = toSafeNumber(raw)
  if (timestamp <= 0) return '--'
  const date = new Date(timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('zh-CN', { hour12: false })
}

function extractRecords(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 4 || value === null || value === undefined) return []
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
  }
  if (typeof value !== 'object') return []
  const obj = value as Record<string, unknown>
  for (const key of ['records', 'list', 'items', 'data']) {
    const nested = extractRecords(obj[key], depth + 1)
    if (nested.length) return nested
  }
  for (const nestedValue of Object.values(obj)) {
    const nested = extractRecords(nestedValue, depth + 1)
    if (nested.length) return nested
  }
  return []
}

function mapRecord(row: Record<string, unknown>, index: number): RecordCard {
  const change = toSafeNumber(row.change ?? row.profit)
  const count = toSafeNumber(row.count ?? row.hand_num)
  const durationMinutes = Math.max(0, Math.round(toSafeNumber(row.player_duration) / 60))
  return {
    id: String(row.room_id ?? row.match_id ?? index + 1),
    playerName: String(row.name ?? row.game_room_name ?? 'Player Name'),
    playerId: String(row.room_id ?? row.match_id ?? '--'),
    blinds: `${toSafeNumber(row.sb ?? row.small_blind)}/${toSafeNumber(row.ante ?? 0)}`,
    hands: count > 0 ? String(count) : '--',
    duration: durationMinutes > 0 ? `${durationMinutes}m` : '--',
    endAt: formatDateText(row.time ?? row.end_time ?? row.start_time_str),
    profit: formatSigned(change),
  }
}

function refreshSummary(list: RecordCard[]): void {
  const gameCount = list.length
  const hands = list.reduce((sum, item) => sum + toSafeNumber(item.hands), 0)
  const profit = list.reduce((sum, item) => sum + toSafeNumber(item.profit.replace(/,/g, '')), 0)
  const maxBlind = list.reduce((max, item) => Math.max(max, toSafeNumber(item.blinds.split('/')[0])), 0)
  const winners = list.filter(item => item.profit.startsWith('+')).length

  leftMetrics.value = [
    { label: '总带入', value: hands.toLocaleString('en-US') },
    { label: '手数', value: hands.toLocaleString('en-US') },
  ]
  rightMetrics.value = [
    { label: '入池率', value: gameCount > 0 ? `${Math.min(100, Math.round((hands / Math.max(gameCount, 1)) * 10))}%` : '0%' },
    { label: '胜率', value: gameCount > 0 ? `${Math.round((winners / gameCount) * 100)}%` : '0%' },
  ]
  detailRowsOne.value = [
    { label: '局数', value: String(gameCount) },
    { label: '总盈亏', value: formatSigned(profit) },
    { label: '大底池', value: maxBlind.toLocaleString('en-US') },
    { label: 'MVP', value: String(winners) },
  ]
  detailRowsTwo.value = [
    { label: '摊牌', value: String(Math.max(0, gameCount - winners)) },
    { label: '加注', value: String(Math.max(0, hands - gameCount)) },
    { label: '诈唬', value: String(Math.max(0, Math.round(gameCount * 0.2))) },
    { label: '弃牌', value: String(Math.max(0, gameCount * 2)) },
  ]
  todayProfit.value = formatSigned(profit)
}

async function fetchClubRecords(): Promise<void> {
  loading.value = true
  try {
    const response = await postRoomCenterHistoryListApi({
      limit: 20,
      offset: 0,
      game_types: resolveGameTypes(),
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载战绩失败')
    }

    const rows = extractRecords(response.data?.records)
    records.value = rows.map((row, index) => mapRecord(row, index))
    refreshSummary(records.value)
  } catch (error) {
    records.value = []
    const message = error instanceof Error ? error.message : '加载战绩失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

function goBack(): void {
  void router.push('/mine/club-career')
}

function goToDetail(item: RecordCard): void {
  const roomId = Number(item.id.replace(/\D/g, '')) || 0
  void router.push({
    path: '/mine/club-record/detail',
    query: {
      room_id: roomId > 0 ? String(roomId) : undefined,
      id: item.id,
    },
  })
}

function selectGame(tab: string): void {
  selectedGame.value = tab
  void fetchClubRecords()
}

function selectTime(tab: string): void {
  selectedTime.value = tab
  void fetchClubRecords()
}

onMounted(() => {
  void fetchClubRecords()
})
</script>

<template>
  <div class="record-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <div class="game-tabs">
        <button
          v-for="item in gameTabs"
          :key="item"
          type="button"
          class="plain-tab"
          :class="{ active: selectedGame === item }"
          @click="selectGame(item)"
        >
          {{ item }}
        </button>
      </div>

      <section class="glass-card stats-card">
        <div class="time-tabs">
          <button
            v-for="item in timeTabs"
            :key="item"
            type="button"
            class="time-tab"
            :class="{ active: selectedTime === item }"
            @click="selectTime(item)"
          >
            {{ item }}
          </button>
        </div>

        <div class="main-metrics">
          <div class="metric-col">
            <div v-for="item in leftMetrics" :key="item.label" class="metric-item">
              <span class="metric-label">{{ item.label }}</span>
              <span class="metric-value">{{ item.value }}</span>
            </div>
          </div>

          <div class="profit-box">
            <div class="profit-title">今日收益</div>
            <div class="profit-value">{{ todayProfit }}</div>
          </div>

          <div class="metric-col right">
            <div v-for="item in rightMetrics" :key="item.label" class="metric-item">
              <span class="metric-label">{{ item.label }}</span>
              <span class="metric-value">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-row">
            <div v-for="item in detailRowsOne" :key="item.label" class="detail-cell">
              <span class="label">{{ item.label }}</span>
              <span class="value">{{ item.value }}</span>
            </div>
          </div>
          <div class="line"></div>
          <div class="detail-row">
            <div v-for="item in detailRowsTwo" :key="item.label" class="detail-cell">
              <span class="label">{{ item.label }}</span>
              <span class="value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="content-list">
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!records.length" class="list-status">暂无战绩记录</p>
        <article
          v-for="item in records"
          :key="item.id"
          class="glass-card record-card"
          @click="goToDetail(item)"
        >
          <div class="timeline">6月</div>
          <div class="card-content">
            <div class="card-head">
              <div>{{ item.playerName }}</div>
              <div class="id">ID: {{ item.playerId }}</div>
            </div>
            <div class="line"></div>
            <div class="card-body">
              <div class="meta">
                <div>
                  <span>盲注级别:</span>
                  <span>{{ item.blinds }}</span>
                </div>
                <div>
                  <span>手数:</span>
                  <span>{{ item.hands }}</span>
                </div>
                <div>
                  <span>时长:</span>
                  <span>{{ item.duration }}</span>
                </div>
                <div>
                  <span>结束时间:</span>
                  <span>{{ item.endAt }}</span>
                </div>
              </div>
              <div class="profit" :class="{ pos: item.profit.startsWith('+') }">{{ item.profit }}</div>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.record-page {
  position: relative;
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.52rem) 0 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  position: relative;
  padding: 0 0.49rem;
}

.game-tabs {
  margin-top: 0.38rem;
  display: flex;
  justify-content: space-around;
}

.plain-tab {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.42rem;
  padding: 0.05rem 0;

  &.active {
    color: #fff;
    border-bottom: 0.03rem solid rgba(255, 255, 255, 0.92);
  }
}

.glass-card {
  border-radius: 0.42rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.stats-card {
  margin-top: 0.3rem;
  padding: 0.24rem 0.3rem;
}

.time-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.08rem;
  border-radius: 0.5rem;
  padding: 0.08rem;
  background: rgba(255, 255, 255, 0.2);
}

.time-tab {
  border: 0;
  border-radius: 0.42rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.35rem;
  padding: 0.18rem 0;

  &.active {
    background: rgba(255, 255, 255, 0.18);
    font-weight: 700;
  }
}

.main-metrics {
  margin-top: 0.28rem;
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 0.2rem;
  align-items: center;
}

.metric-col {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;

  .metric-label {
    font-size: 0.25rem;
    color: rgba(255, 255, 255, 0.74);
  }

  .metric-value {
    font-size: 0.33rem;
    font-weight: 600;
  }
}

.metric-col.right {
  text-align: right;
}

.profit-box {
  text-align: center;

  .profit-title {
    font-size: 0.32rem;
  }

  .profit-value {
    margin-top: 0.12rem;
    font-size: 0.56rem;
    font-weight: 700;
    color: #6be89d;
  }
}

.detail-grid {
  margin-top: 0.22rem;

  .line {
    height: 0.02rem;
    background: rgba(255, 255, 255, 0.18);
    margin: 0.14rem 0;
  }
}

.detail-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.08rem;
}

.detail-cell {
  text-align: center;
  display: flex;
  flex-direction: column;

  .label {
    font-size: 0.24rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .value {
    margin-top: 0.06rem;
    font-size: 0.36rem;
    font-weight: 600;
  }
}

.content-list {
  margin-top: 0.28rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.list-status {
  text-align: center;
  font-size: 0.3rem;
  opacity: 0.78;
  margin: 0.2rem 0;
}

.record-card {
  padding: 0.28rem;
  display: grid;
  grid-template-columns: 0.8rem 1fr;
  gap: 0.2rem;
}

.timeline {
  font-size: 0.32rem;
  color: rgba(255, 255, 255, 0.9);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0.42rem;
    left: 0.45rem;
    width: 0.02rem;
    height: 2.2rem;
    background: rgba(255, 255, 255, 0.35);
  }
}

.card-content {
  .line {
    height: 0.02rem;
    background: rgba(255, 255, 255, 0.15);
    margin: 0.18rem 0;
  }
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.43rem;

  .id {
    font-size: 0.29rem;
    color: rgba(255, 255, 255, 0.78);
  }
}

.card-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 0.07rem;
  font-size: 0.3rem;

  div {
    display: flex;
    gap: 0.16rem;
  }
}

.profit {
  font-size: 0.54rem;
  font-weight: 700;
  color: #ff7a8f;

  &.pos {
    color: #4ee58f;
  }
}
</style>
