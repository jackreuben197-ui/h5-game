<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

interface DataRow {
  game: string
  playedGames: number
  hands: number
}

interface MenuItem {
  key: string
  text: string
  route?: string
}

const rows: DataRow[] = [
  { game: 'NLH', playedGames: 123, hands: 4567 },
  { game: 'PLO', playedGames: 22, hands: 4567 },
  { game: '6+', playedGames: 22, hands: 4567 },
  { game: 'Mahjong', playedGames: 22, hands: 4567 },
]

const menuList: MenuItem[] = [
  { key: 'data', text: '数据', route: '/mine/friends-data' },
  { key: 'record', text: '战绩', route: '/mine/friends-record' },
  { key: 'mahjong', text: 'Mahjong' },
  { key: 'sng', text: 'SNG战绩' },
  { key: 'mahjong-mtt', text: '麻将MTT战绩' },
]

const title = ref('数据')

function goBack(): void {
  void router.push('/mine')
}

function handleMenuClick(item: MenuItem): void {
  if (!item.route) {
    return
  }
  void router.push(item.route)
}
</script>

<template>
  <div class="mine-glass-page">
    <header class="page-head">
      <button class="back-btn" type="button" @click="goBack">‹</button>
      <h1>{{ title }}</h1>
      <button class="mini-chip" type="button">数据统计</button>
    </header>

    <section class="glass-card table-card">
      <div class="table-head">
        <span>玩法</span>
        <span>Played Games</span>
        <span>Hands</span>
      </div>
      <div v-for="item in rows" :key="item.game" class="table-row">
        <span>{{ item.game }}</span>
        <span>{{ item.playedGames }}</span>
        <span>{{ item.hands }}</span>
      </div>
    </section>

    <section class="glass-card list-card">
      <button v-for="item in menuList" :key="item.key" type="button" class="line-item" @click="handleMenuClick(item)">
        <span>{{ item.text }}</span>
        <span class="arrow">›</span>
      </button>
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
  line-height: 1;
}

.mini-chip {
  border: 0;
  border-radius: 0.34rem;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 0.24rem;
  padding: 0.12rem 0.22rem;
}

.glass-card {
  border-radius: 0.44rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.25);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.table-card {
  margin-top: 0.5rem;
  padding: 0.3rem 0.3rem 0.22rem;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  text-align: center;
}

.table-head {
  border-radius: 0.4rem;
  background: #00af83;
  font-size: 0.33rem;
  padding: 0.18rem 0;
}

.table-row {
  font-size: 0.42rem;
  padding: 0.3rem 0;
}

.list-card {
  margin-top: 0.24rem;
  padding: 0 0.36rem;
}

.line-item {
  width: 100%;
  border: 0;
  border-bottom: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: transparent;
  color: #fff;
  font-size: 0.42rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0;

  &:last-child {
    border-bottom: 0;
  }
}

.arrow {
  font-size: 0.66rem;
}
</style>
