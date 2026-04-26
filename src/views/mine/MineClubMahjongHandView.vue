<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import gameZoneMahjongMini from '@/assets/icons/game_zone_mahjong_mini.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const title = computed(() => 'Result')

interface HandRow {
  id: string
  roundType: string
  handId: string
  result: string
  score: string
  fanText: string
}

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

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
  <div class="record-hand-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="glass-card overview-card">
        <div class="left-user">
          <div class="avatar"></div>
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
        <article
          v-for="item in handRows"
          :key="item.id"
          class="glass-card hand-card"
          @click="goReport"
        >
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
  </div>
</template>

<style scoped lang="scss">
.record-hand-page {
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
