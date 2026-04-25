<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const gameTabs = ['德州', '短牌', '奥马哈']
const modeTabs = ['近期', '收藏']
const selectedGame = ref(gameTabs[0])
const selectedMode = ref(modeTabs[0])

interface HandCard {
  id: string
  title: string
  handId: string
  table: string
  pot: string
  hands: string
  profit: string
  negative?: boolean
}

const handCards: HandCard[] = [
  { id: '1', title: 'john wins with Royal Flush', handId: '11440454', table: '2/4(10)', pot: '1234', hands: '10', profit: '-5000' },
  { id: '2', title: 'john wins with Royal Flush', handId: '11440454', table: '2/4(10)', pot: '1234', hands: '10', profit: '-5000' },
  { id: '3', title: 'john wins with Royal Flush', handId: '11440454', table: '2/4(10)', pot: '1234', hands: '10', profit: '-5000' },
  { id: '4', title: 'john wins with Royal Flush', handId: '11440454', table: '2/4(10)', pot: '1234', hands: '10', profit: '-5000' },
]

function goBack(): void {
  void router.push('/mine')
}
</script>

<template>
  <div class="mine-glass-page">
    <header class="page-head">
      <button class="back-btn" type="button" @click="goBack">‹</button>
      <h1>Result</h1>
      <div class="placeholder" />
    </header>

    <div class="tabs game-tabs">
      <button
        v-for="item in gameTabs"
        :key="item"
        type="button"
        :class="['plain-tab', { active: selectedGame === item }]"
        @click="selectedGame = item"
      >
        {{ item }}
      </button>
    </div>

    <div class="tabs mode-tabs">
      <button
        v-for="item in modeTabs"
        :key="item"
        type="button"
        :class="['capsule-tab', { active: selectedMode === item }]"
        @click="selectedMode = item"
      >
        {{ item }}
      </button>
    </div>

    <section class="list-wrap">
      <article v-for="card in handCards" :key="card.id" class="glass-card hand-card">
        <div class="top-row">
          <div class="poker-pair">
            <div class="poker">10♣</div>
            <div class="poker red">J♦</div>
          </div>
          <div class="title">{{ card.title }}</div>
        </div>
        <div class="line" />
        <div class="bottom-row">
          <div class="meta">
            <div>Hand ID: {{ card.handId }}</div>
            <div>{{ card.table }}&nbsp;&nbsp;&nbsp;底池: {{ card.pot }}</div>
          </div>
          <div class="profit">
            <div :class="['money', { negative: card.negative !== false }]">{{ card.profit }}</div>
            <div>Hands:{{ card.hands }}</div>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped lang="scss">
.mine-glass-page {
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

.placeholder {
  width: 0.72rem;
}

.tabs {
  display: flex;
}

.game-tabs {
  margin-top: 0.4rem;
  justify-content: space-around;
}

.plain-tab {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.42rem;
  padding-bottom: 0.06rem;

  &.active {
    color: #fff;
    border-bottom: 0.03rem solid rgba(255, 255, 255, 0.9);
  }
}

.mode-tabs {
  margin-top: 0.3rem;
  border-radius: 0.56rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.08rem;
}

.capsule-tab {
  flex: 1;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: #fff;
  font-size: 0.44rem;
  padding: 0.2rem 0;

  &.active {
    background: rgba(255, 255, 255, 0.2);
    font-weight: 700;
  }
}

.list-wrap {
  margin-top: 0.38rem;
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
}

.glass-card {
  border-radius: 0.44rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.hand-card {
  padding: 0.28rem 0.3rem 0.24rem;
}

.top-row,
.bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.poker-pair {
  display: flex;
  gap: 0.08rem;
}

.poker {
  width: 0.64rem;
  height: 0.82rem;
  border-radius: 0.1rem;
  background: #fff;
  color: #000;
  font-size: 0.22rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0.08rem;

  &.red {
    color: #fa2b4b;
  }
}

.title {
  flex: 1;
  text-align: right;
  font-size: 0.34rem;
  font-weight: 600;
}

.line {
  height: 0.02rem;
  background: rgba(249, 249, 249, 0.2);
  margin: 0.16rem 0;
}

.meta {
  font-size: 0.31rem;
  line-height: 1.4;
}

.profit {
  text-align: right;
  font-size: 0.31rem;
}

.money {
  color: #05e7ae;
  font-size: 0.52rem;
  font-weight: 700;

  &.negative {
    color: #27d300;
  }
}
</style>
