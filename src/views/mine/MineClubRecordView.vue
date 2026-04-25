<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

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

const leftMetrics: SummaryMetric[] = [
  { label: '总带入', value: '25,600' },
  { label: '手数', value: '1,200' },
]

const rightMetrics: SummaryMetric[] = [
  { label: '入池率', value: '26%' },
  { label: '胜率', value: '54%' },
]

const detailRowsOne: SummaryMetric[] = [
  { label: '局数', value: '20' },
  { label: '总盈亏', value: '+5000' },
  { label: '大底池', value: '1024' },
  { label: 'MVP', value: '3' },
]

const detailRowsTwo: SummaryMetric[] = [
  { label: '摊牌', value: '8' },
  { label: '加注', value: '32' },
  { label: '诈唬', value: '5' },
  { label: '弃牌', value: '20' },
]

const records: RecordCard[] = [
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
]

function goBack(): void {
  void router.push('/mine/club-career')
}

function goToDetail(): void {
  void router.push('/mine/club-record/detail')
}
</script>

<template>
  <div class="record-page">
    <header class="page-head">
      <button class="back-btn" type="button" @click="goBack">‹</button>
      <h1>战绩</h1>
      <div class="head-icons">
        <span class="icon-dot">💬</span>
        <span class="icon-dot">▦</span>
      </div>
    </header>

    <div class="game-tabs">
      <button
        v-for="item in gameTabs"
        :key="item"
        type="button"
        class="plain-tab"
        :class="{ active: selectedGame === item }"
        @click="selectedGame = item"
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
          @click="selectedTime = item"
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
          <div class="profit-value">+5000</div>
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
        <div class="line" />
        <div class="detail-row">
          <div v-for="item in detailRowsTwo" :key="item.label" class="detail-cell">
            <span class="label">{{ item.label }}</span>
            <span class="value">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="list-wrap">
      <article v-for="item in records" :key="item.id" class="glass-card record-card" @click="goToDetail">
        <div class="timeline">6月</div>
        <div class="card-content">
          <div class="card-head">
            <div>{{ item.playerName }}</div>
            <div class="id">ID: {{ item.playerId }}</div>
          </div>
          <div class="line" />
          <div class="card-body">
            <div class="meta">
              <div><span>盲注级别:</span><span>{{ item.blinds }}</span></div>
              <div><span>手数:</span><span>{{ item.hands }}</span></div>
              <div><span>时长:</span><span>{{ item.duration }}</span></div>
              <div><span>结束时间:</span><span>{{ item.endAt }}</span></div>
            </div>
            <div class="profit" :class="{ pos: item.profit.startsWith('+') }">{{ item.profit }}</div>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped lang="scss">
.record-page {
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.46rem) 0.45rem 0.8rem;
  color: #f9f9f9;
  background:
    radial-gradient(60% 42% at 20% 10%, rgba(226, 163, 133, 0.6) 0%, rgba(226, 163, 133, 0) 100%),
    radial-gradient(55% 45% at 25% 85%, rgba(206, 107, 160, 0.6) 0%, rgba(206, 107, 160, 0) 100%),
    radial-gradient(45% 38% at 88% 84%, rgba(0, 183, 212, 0.58) 0%, rgba(0, 183, 212, 0) 100%),
    linear-gradient(160deg, #b58eb1 0%, #8d668d 54%, #6f5988 100%);
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 {
    margin: 0;
    font-size: 0.66rem;
    font-weight: 500;
  }
}

.back-btn {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.72rem;
  line-height: 1;
}

.head-icons {
  display: flex;
  align-items: center;
  gap: 0.14rem;

  .icon-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.16);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.22rem;
  }
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

.list-wrap {
  margin-top: 0.28rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
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
