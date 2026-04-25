<script setup lang="ts">
import { useRouter } from 'vue-router'
import gameZoneMahjongMini from '@/assets/icons/game_zone_mahjong_mini.png'

interface HandRow {
  id: string
  roundType: string
  handId: string
  result: string
  score: string
  fanText: string
}

const router = useRouter()

const handRows: HandRow[] = [
  { id: 'h1', roundType: '推倒胡', handId: '11440454', result: 'Draw', score: '+88', fanText: '红中 x20' },
  { id: 'h2', roundType: '推倒胡', handId: '11440454', result: 'Draw', score: '-32', fanText: '明杠 x8' },
  { id: 'h3', roundType: '推倒胡', handId: '11440454', result: 'Draw', score: '+56', fanText: '清一色 x16' },
]

function goBack(): void {
  void router.push('/mine/club-mahjong/detail')
}

function goReport(): void {
  void router.push('/mine/club-record/report')
}
</script>

<template>
  <div class="record-hand-page">
    <header class="page-head">
      <button class="back-btn" type="button" @click="goBack">‹</button>
      <h1>Result</h1>
      <button class="head-action" type="button" @click="goReport">report</button>
    </header>

    <section class="glass-card overview-card">
      <div class="left-user">
        <div class="avatar" />
        <div>
          <div class="name">Player Name</div>
          <div class="hands">Hands 123</div>
        </div>
      </div>
      <div class="right-info">
        <div class="title">牌局名称</div>
        <div class="sub">ID: 11440454</div>
      </div>
    </section>

    <section class="list-wrap">
      <article v-for="item in handRows" :key="item.id" class="glass-card hand-card" @click="goReport">
        <div class="left-meta">
          <div class="round-chip">
            <img :src="gameZoneMahjongMini" alt="mahjong" />
            <span>{{ item.roundType }}</span>
          </div>
          <div class="sub-line">ID: {{ item.handId }}</div>
          <div class="sub-line">{{ item.result }}</div>
        </div>

        <div class="right-meta" :class="{ minus: item.score.startsWith('-') }">
          <div class="score">{{ item.score }}</div>
          <div class="fan-row">
            <span class="tile">中</span>
            <span>{{ item.fanText }}</span>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped lang="scss">
.record-hand-page {
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

.overview-card {
  margin-top: 0.35rem;
  padding: 0.24rem 0.32rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.2rem;
}

.left-user {
  display: flex;
  align-items: center;
  gap: 0.16rem;

  .avatar {
    width: 0.84rem;
    height: 0.84rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.48);
  }

  .name {
    font-size: 0.35rem;
  }

  .hands {
    margin-top: 0.05rem;
    font-size: 0.27rem;
    color: rgba(255, 255, 255, 0.74);
  }
}

.right-info {
  text-align: right;

  .title {
    font-size: 0.42rem;
  }

  .sub {
    margin-top: 0.08rem;
    font-size: 0.28rem;
    color: rgba(255, 255, 255, 0.78);
  }
}

.list-wrap {
  margin-top: 0.34rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.hand-card {
  padding: 0.24rem 0.3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.2rem;
}

.round-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;

  img {
    width: 0.48rem;
    height: 0.48rem;
    border-radius: 0.1rem;
    object-fit: cover;
  }

  span {
    font-size: 0.34rem;
  }
}

.sub-line {
  margin-top: 0.08rem;
  font-size: 0.28rem;
  color: rgba(255, 255, 255, 0.78);
}

.right-meta {
  text-align: right;
  color: #65e89f;

  &.minus {
    color: #ff8ea2;
  }
}

.score {
  font-size: 0.52rem;
  font-weight: 700;
}

.fan-row {
  margin-top: 0.06rem;
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
  font-size: 0.29rem;
}

.tile {
  width: 0.34rem;
  height: 0.44rem;
  border-radius: 0.06rem;
  background: #ffffff;
  color: #d6425e;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.26rem;
  font-weight: 700;
}
</style>
