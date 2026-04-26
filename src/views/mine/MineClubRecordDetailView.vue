<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const title = computed(() => '战绩详情')

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

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
  buyIn: string
  hands: string
  vpip: string
  profit: string
}

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
  { id: 'p1', name: 'Player Name', uid: '11440454', buyIn: '200', hands: '123', vpip: '7%', profit: '+800' },
  { id: 'p2', name: 'Player Name', uid: '11440454', buyIn: '200', hands: '123', vpip: '7%', profit: '+400' },
]

function goBack(): void {
  void router.push('/mine/club-record')
}

function goToHands(): void {
  void router.push('/mine/club-record/hand')
}
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

        <article
          v-for="item in playerResults"
          :key="item.id"
          class="result-row"
          @click="goToHands"
        >
          <div class="left">
            <div class="avatar small"></div>
            <div>
              <div class="name">{{ item.name }}</div>
              <div class="sub">ID: {{ item.uid }}</div>
            </div>
          </div>
          <div class="right">
            <div class="profit">{{ item.profit }}</div>
            <div class="sub-row">
              <span>带入:{{ item.buyIn }}</span>
              <span>手数:{{ item.hands }}</span>
              <span>入池率:{{ item.vpip }}</span>
            </div>
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
  display: flex;
  justify-content: space-between;
  gap: 0.18rem;
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

.right {
  text-align: right;

  .profit {
    font-size: 0.45rem;
    color: #6be89d;
    font-weight: 700;
  }
}

.sub-row {
  margin-top: 0.05rem;
  display: flex;
  gap: 0.15rem;
  font-size: 0.24rem;
  color: rgba(255, 255, 255, 0.78);
}
</style>
