<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

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
  <div class="mine-glass-page" :style="backgroundStyle">
    <HeaderBack :title="title">
      <template #right>
        <div class="action-wrap">
          <TopActionButton
            name="数据统计"
            icon-alt="wallet"
            text-style="justify-content:center"
          />
        </div>
      </template>
    </HeaderBack>

    <div class="content-wrap">
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
        <button
          v-for="item in menuList"
          :key="item.key"
          type="button"
          class="line-item"
          @click="handleMenuClick(item)"
        >
          <span>{{ item.text }}</span>
          <span class="arrow">›</span>
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mine-glass-page {
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
