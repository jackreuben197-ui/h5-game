<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

interface SummaryMetric {
  label: string
  value: string
}

interface RecordCard {
  id: string
  month: string
  playerName: string
  playerId: string
  blind: string
  hands: string
  duration: string
  endAt: string
  profit: string
}

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => '麻将战绩')

const timeTabs = ['今天', '7天', '30天', '生涯']
const selectedTime = ref(timeTabs[0])

const leftMetrics: SummaryMetric[] = [
  { label: '总带入', value: '25,600' },
  { label: '手数', value: '1,200' },
]

const rightMetrics: SummaryMetric[] = [
  { label: '入池率', value: '26%' },
  { label: '胜率', value: '54%' },
]

const bottomMetrics: SummaryMetric[] = [
  { label: '局数', value: '20' },
  { label: '大底池', value: '1024' },
  { label: 'MVP', value: '3' },
]

const records: RecordCard[] = [
  {
    id: 'r1',
    month: '6月',
    playerName: 'Player Name',
    playerId: '11440454',
    blind: '5/10',
    hands: '20',
    duration: '2.5h',
    endAt: '06/04 22:56',
    profit: '+1024',
  },
  {
    id: 'r2',
    month: '6月',
    playerName: 'Player Name',
    playerId: '11440454',
    blind: '5/10',
    hands: '18',
    duration: '1.8h',
    endAt: '06/03 21:40',
    profit: '-380',
  },
  {
    id: 'r3',
    month: '5月',
    playerName: 'Player Name',
    playerId: '11440454',
    blind: '10/20',
    hands: '12',
    duration: '1.2h',
    endAt: '05/28 18:40',
    profit: '+560',
  },
]

function goBack(): void {
  void router.push('/mine/club-career')
}

function goDetail(): void {
  void router.push('/mine/club-mahjong/detail')
}
</script>

<template>
  <div class="mahjong-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
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
            <div class="profit-title">今日收益 <span class="info-dot">i</span></div>
            <div class="profit-value">+2500</div>
          </div>

          <div class="metric-col right">
            <div v-for="item in rightMetrics" :key="item.label" class="metric-item">
              <span class="metric-label">{{ item.label }}</span>
              <span class="metric-value">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <div class="bottom-metrics">
          <div v-for="item in bottomMetrics" :key="item.label" class="bottom-item">
            <span class="metric-label">{{ item.label }}</span>
            <span class="metric-value">{{ item.value }}</span>
          </div>
        </div>
      </section>

      <section class="list-wrap">
        <article
          v-for="item in records"
          :key="item.id"
          class="glass-card record-card"
          @click="goDetail"
        >
          <div class="timeline">{{ item.month }}</div>
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
                  <span>{{ item.blind }}</span>
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
.mahjong-page {
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
  font-size: 0.32rem;
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

.metric-col.right {
  text-align: right;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.metric-label {
  font-size: 0.25rem;
  color: rgba(255, 255, 255, 0.74);
}

.metric-value {
  font-size: 0.33rem;
  font-weight: 600;
}

.profit-box {
  text-align: center;

  .profit-title {
    font-size: 0.32rem;
    display: inline-flex;
    align-items: center;
    gap: 0.08rem;
  }

  .profit-value {
    margin-top: 0.12rem;
    font-size: 0.56rem;
    font-weight: 700;
    color: #6be89d;
  }
}

.info-dot {
  width: 0.26rem;
  height: 0.26rem;
  border-radius: 50%;
  border: 0.02rem solid rgba(255, 255, 255, 0.7);
  font-size: 0.2rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bottom-metrics {
  margin-top: 0.22rem;
  padding-top: 0.18rem;
  border-top: 0.02rem solid rgba(255, 255, 255, 0.16);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.1rem;
}

.bottom-item {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
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
  gap: 0.2rem;
}

.meta {
  display: grid;
  gap: 0.07rem;

  > div {
    font-size: 0.29rem;
    display: flex;
    gap: 0.08rem;
    color: rgba(255, 255, 255, 0.86);

    span:first-child {
      min-width: 1.4rem;
      color: rgba(255, 255, 255, 0.66);
    }
  }
}

.profit {
  align-self: center;
  font-size: 0.5rem;
  font-weight: 700;
  color: #ff8ba4;

  &.pos {
    color: #68ea9f;
  }
}
</style>
