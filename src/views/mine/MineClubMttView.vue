<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRouter } from 'vue-router'
import { postStatsMttHistoryListApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'

const router = useRouter()

const title = computed(() => 'MTT')

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

interface MttRecord {
  id: string
  roomId: string
  matchId: string
  month: string
  nickname: string
  playerId: string
  detailVariant: 'v1' | 'v2'
  rank: string
  reward: string
  rewardType: string
  finishTime: string
  blind: string
}

const gameTabs = ['NLH', 'PLO', '6+']
const timeTabs = ['今天', '7天', '30天']
const selectedGame = ref(gameTabs[0])
const selectedTime = ref(timeTabs[0])
const loading = ref(false)

const summary = ref([
  { label: 'total games', value: '20' },
  { label: 'awards', value: '15' },
  { label: 'first', value: '1' },
  { label: 'second', value: '6' },
  { label: 'third', value: '6' },
])

const mttRecords = ref<MttRecord[]>([
  {
    id: 'm1',
    roomId: '1',
    matchId: '',
    month: '6月',
    nickname: 'Tour Nickname',
    playerId: '11440454',
    detailVariant: 'v1',
    rank: '#1',
    reward: '500',
    rewardType: '积分',
    finishTime: '06/04 22:56',
    blind: '1/4 (1)',
  },
  {
    id: 'm2',
    roomId: '2',
    matchId: '',
    month: '6月',
    nickname: 'Tour Nickname',
    playerId: '11440454',
    detailVariant: 'v1',
    rank: '#3',
    reward: '200',
    rewardType: '积分',
    finishTime: '06/03 20:25',
    blind: '1/4 (1)',
  },
  {
    id: 'm3',
    roomId: '3',
    matchId: '',
    month: '5月',
    nickname: 'Tour Nickname',
    playerId: '11440454',
    detailVariant: 'v2',
    rank: '#2',
    reward: '300',
    rewardType: '积分',
    finishTime: '05/28 18:40',
    blind: '2/4 (1)',
  },
  {
    id: 'm4',
    roomId: '4',
    matchId: '',
    month: '5月',
    nickname: 'Tour Nickname',
    playerId: '11440454',
    detailVariant: 'v2',
    rank: '#6',
    reward: '80',
    rewardType: '积分',
    finishTime: '05/20 21:10',
    blind: '1/2 (1)',
  },
])

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatDateText(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) {
    return raw
  }
  const timestamp = toSafeNumber(raw)
  if (timestamp <= 0) {
    return '--'
  }
  const date = new Date(timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }
  return date.toLocaleString('zh-CN', { hour12: false })
}

function formatMonthLabel(timeText: string): string {
  const match = timeText.match(/(\d{1,2})\//)
  if (match) {
    return `${match[1]}月`
  }
  return '本月'
}

function resolveTimeType(): number {
  if (selectedTime.value === '7天') return 2
  if (selectedTime.value === '30天') return 3
  return 1
}

function extractMttRows(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 4 || value === null || value === undefined) {
    return []
  }
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is Record<string, unknown> => !!item && typeof item === 'object',
    )
  }
  if (typeof value !== 'object') {
    return []
  }

  const obj = value as Record<string, unknown>
  for (const key of ['records', 'list', 'items', 'data']) {
    const nested = extractMttRows(obj[key], depth + 1)
    if (nested.length) {
      return nested
    }
  }
  for (const nestedValue of Object.values(obj)) {
    const nested = extractMttRows(nestedValue, depth + 1)
    if (nested.length) {
      return nested
    }
  }
  return []
}

function mapMttRecord(row: Record<string, unknown>, index: number): MttRecord {
  const timeText = formatDateText(row.end_time_str ?? row.end_time ?? row.time)
  const rank = toSafeNumber(row.rank)
  return {
    id: String(row.room_id ?? row.match_id ?? index + 1),
    roomId: String(row.room_id ?? ''),
    matchId: String(row.match_id ?? ''),
    month: formatMonthLabel(timeText),
    nickname: String(row.nick_name ?? row.user_name ?? 'Tour Nickname'),
    playerId: String(row.user_random_id ?? '--'),
    detailVariant: rank > 0 && rank <= 3 ? 'v1' : 'v2',
    rank: rank > 0 ? `#${rank}` : '--',
    reward: String(toSafeNumber(row.award ?? row.hunter_award).toLocaleString('en-US')),
    rewardType: '积分',
    finishTime: timeText,
    blind: `${toSafeNumber(row.sb ?? row.small_blind)}/${toSafeNumber(
      row.ante ?? 0,
    )} (${toSafeNumber(row.buy_in_times ?? 1)})`,
  }
}

function refreshSummary(list: MttRecord[]): void {
  const totalGames = list.length
  const top1 = list.filter((item) => item.rank === '#1').length
  const top2 = list.filter((item) => item.rank === '#2').length
  const top3 = list.filter((item) => item.rank === '#3').length
  const awards = list.filter((item) => item.reward !== '0').length
  summary.value = [
    { label: 'total games', value: String(totalGames) },
    { label: 'awards', value: String(awards) },
    { label: 'first', value: String(top1) },
    { label: 'second', value: String(top2) },
    { label: 'third', value: String(top3) },
  ]
}

async function fetchMttHistory(): Promise<void> {
  loading.value = true
  try {
    const response = await postStatsMttHistoryListApi({
      time_type: resolveTimeType(),
      filter_type: 3,
      limit: 20,
      offset: 0,
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载 MTT 战绩失败')
    }

    const rows = extractMttRows(response.data)
    mttRecords.value = rows.map((row, index) => mapMttRecord(row, index))
    refreshSummary(mttRecords.value)
  } catch (error) {
    mttRecords.value = []
    const message = error instanceof Error ? error.message : '加载 MTT 战绩失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

function goDetail(item: MttRecord): void {
  void router.push({
    path: '/mine/club-mtt/detail',
    query: {
      variant: item.detailVariant,
      id: item.id,
      room_id: item.roomId || undefined,
      match_id: item.matchId || undefined,
    },
  })
}

function selectGame(tab: string): void {
  selectedGame.value = tab
  void fetchMttHistory()
}

function selectTime(tab: string): void {
  selectedTime.value = tab
  void fetchMttHistory()
}

onMounted(() => {
  void fetchMttHistory()
})
</script>

<template>
  <div class="page-shell club-mtt-page" :style="backgroundStyle">
    <HeaderBack :title="title" extra-padding />

    <div class="content-wrap">
      <nav class="game-tabs" aria-label="玩法切换">
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
      </nav>

      <section class="glass-card summary-card">
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
        <div class="summary-row">
          <div v-for="item in summary" :key="item.label" class="summary-item">
            <div class="value">{{ item.value }}</div>
            <div class="label">{{ item.label }}</div>
          </div>
        </div>
      </section>

      <section class="list-wrap">
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!mttRecords.length" class="list-status">暂无 MTT 战绩</p>
        <article
          v-for="item in mttRecords"
          :key="item.id"
          class="glass-card mtt-card"
          @click="goDetail(item)"
        >
          <div class="timeline">{{ item.month }}</div>
          <div class="card-content">
            <div class="row-top">
              <div>
                <div class="name">{{ item.nickname }}</div>
                <div class="sub">(ID: {{ item.playerId }})</div>
              </div>
              <div class="result">
                <div class="rank">{{ item.rank }}</div>
                <div class="reward">{{ item.rewardType }} {{ item.reward }}</div>
              </div>
            </div>
            <div class="line"></div>
            <div class="row-bottom">
              <div class="time">结束: {{ item.finishTime }}</div>
              <div class="blind">盲注: {{ item.blind }}</div>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-mtt-page {
  position: relative;
  height: 100dvh;
  padding: 0 0 0.8rem;
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
  margin-top: 0.34rem;
  display: flex;
  justify-content: space-around;
}

.plain-tab {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.74);
  font-size: 0.42rem;
  padding-bottom: 0.06rem;

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

.summary-card {
  margin-top: 0.3rem;
  padding: 0.24rem 0.28rem;
}

.time-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.08rem;
  padding: 0.08rem;
  border-radius: 0.52rem;
  background: rgba(255, 255, 255, 0.2);
}

.time-tab {
  border: 0;
  border-radius: 0.44rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.35rem;
  padding: 0.18rem 0;

  &.active {
    background: rgba(255, 255, 255, 0.16);
    font-weight: 700;
  }
}

.summary-row {
  margin-top: 0.24rem;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.1rem;
}

.summary-item {
  text-align: center;

  .value {
    font-size: 0.43rem;
    font-weight: 700;
  }

  .label {
    margin-top: 0.06rem;
    font-size: 0.22rem;
    color: rgba(255, 255, 255, 0.72);
  }
}

.list-wrap {
  margin-top: 0.26rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.list-status {
  text-align: center;
  font-size: 0.3rem;
  opacity: 0.78;
  padding: 0.2rem 0;
}

.mtt-card {
  padding: 0.26rem;
  display: grid;
  grid-template-columns: 0.74rem 1fr;
  gap: 0.16rem;
}

.timeline {
  font-size: 0.3rem;
  color: rgba(255, 255, 255, 0.92);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0.42rem;
    left: 0.35rem;
    width: 0.02rem;
    height: calc(100% - 0.28rem);
    background: rgba(255, 255, 255, 0.28);
  }
}

.name {
  font-size: 0.36rem;
}

.sub {
  margin-top: 0.03rem;
  font-size: 0.27rem;
  color: rgba(255, 255, 255, 0.76);
}

.row-top {
  display: flex;
  justify-content: space-between;
  gap: 0.2rem;
}

.result {
  text-align: right;

  .rank {
    font-size: 0.34rem;
    font-weight: 700;
    color: #ffe084;
  }

  .reward {
    margin-top: 0.05rem;
    font-size: 0.28rem;
  }
}

.line {
  margin: 0.16rem 0;
  height: 0.02rem;
  background: rgba(255, 255, 255, 0.16);
}

.row-bottom {
  display: flex;
  justify-content: space-between;
  font-size: 0.26rem;
  color: rgba(255, 255, 255, 0.8);
}
</style>
