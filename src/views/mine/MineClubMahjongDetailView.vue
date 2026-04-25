<script setup lang="ts">
import { useRouter } from 'vue-router'

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

const seatPlayers: SeatPlayer[] = [
  { name: 'Hanna', chips: '120', tag: '土豪' },
  { name: 'Paityn', chips: '3340', tag: 'MVP', highlight: true },
  { name: 'Giana', chips: '120', tag: '土豪' },
]

const summaryItems = [
  { label: '带入', value: '1200' },
  { label: '底池', value: '3580' },
  { label: '手数', value: '20' },
  { label: '时长', value: '2.3h' },
]

const playerResults: PlayerResult[] = [
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
]

function goBack(): void {
  void router.push('/mine/club-mahjong')
}

function goToHands(): void {
  void router.push('/mine/club-mahjong/hand')
}
</script>

<template>
  <div class="record-detail-page">
    <header class="page-head">
      <button class="back-btn" type="button" @click="goBack">‹</button>
      <h1>战绩详情</h1>
      <button class="head-action" type="button">筛选</button>
    </header>

    <section class="glass-card sort-bar">
      <span>按结束时间</span>
      <span class="arrow">▾</span>
    </section>

    <section class="glass-card table-section">
      <div class="seat-row">
        <article v-for="(item, index) in seatPlayers" :key="item.name + index" class="seat" :class="{ highlight: item.highlight }">
          <div class="avatar" />
          <div class="tag" v-if="item.tag">{{ item.tag }}</div>
          <div class="name">{{ item.name }}</div>
          <div class="chips">{{ item.chips }}</div>
        </article>
      </div>

      <div class="hand-summary">
        <div class="name-line">
          <div>
            <div class="title">Hand Name</div>
            <div class="sub">ID: 11440454</div>
          </div>
          <div class="time">29/12 14:00 - 3/1 15:00</div>
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
        <div class="total">+1200</div>
      </div>

      <article v-for="item in playerResults" :key="item.id" class="result-row" @click="goToHands">
        <div class="top">
          <div class="left">
            <div class="avatar small" />
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
</template>

<style scoped lang="scss">
.record-detail-page {
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
}

.head-action {
  border: 0;
  border-radius: 0.26rem;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 0.3rem;
  padding: 0.08rem 0.2rem;
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
