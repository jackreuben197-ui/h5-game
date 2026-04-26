<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const title = computed(() => '战绩')

import iconChips from '@/assets/icons/icon_chips.png'
import iconMttAvatar from '@/assets/icons/icon_mtt_avatar.png'

interface CowboyPlayerResult {
  id: string
  name: string
  uid: string
  amount: string
  up: boolean
}

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const playerResults: CowboyPlayerResult[] = [
  { id: '1', name: 'Player Name', uid: '11440454', amount: '-1,000', up: false },
  { id: '2', name: 'Player Name', uid: '11440454', amount: '+20,000', up: true },
]

function goBack(): void {
  void router.push('/mine/club-career')
}

function openDetail(): void {
  void router.push('/mine/club-cowboy/detail')
}
</script>

<template>
  <div class="cowboy-detail-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="glass-card summary-card">
        <div class="summary-top">
          <div class="summary-col">
            <div class="main">Hand Game Name</div>
            <div class="sub">ID: 11440454</div>
          </div>
          <div class="summary-col summary-col-right">
            <div class="main">29/12 14:00</div>
            <div class="sub">Texas Cowboy</div>
          </div>
        </div>

        <div class="summary-stats">
          <div class="stat-item">
            <div class="label">hand duration</div>
            <div class="value">1 Hour</div>
          </div>
          <div class="divider"></div>
          <div class="stat-item">
            <div class="label">total lot size</div>
            <div class="value">200</div>
          </div>
        </div>
      </section>

      <section class="result-list">
        <article
          v-for="item in playerResults"
          :key="item.id"
          class="glass-card result-card"
          @click="openDetail"
        >
          <div class="left">
            <img :src="iconMttAvatar" alt="avatar" class="avatar" />
            <div class="info">
              <div class="name">{{ item.name }}</div>
              <div class="uid">ID: {{ item.uid }}</div>
            </div>
          </div>

          <div class="right">
            <div class="amount" :class="item.up ? 'up' : 'down'">{{ item.amount }}</div>
            <img :src="iconChips" alt="chips" class="chips" />
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cowboy-detail-page {
  position: relative;
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.52rem) 0 0.74rem;
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
  border-radius: 0.66rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.05rem);
}

.summary-card {
  margin-top: 0.56rem;
  padding: 0.28rem 0.22rem 0.24rem;
}

.summary-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.18rem;
  padding: 0 0.16rem;
}

.summary-col {
  .main {
    font-size: 0.42rem;
    line-height: 1.2;
    color: #fff;
    font-weight: 500;
  }

  .sub {
    margin-top: 0.05rem;
    font-size: 0.33rem;
    line-height: 1.2;
    color: rgba(255, 255, 255, 0.7);
  }
}

.summary-col-right {
  text-align: right;
}

.summary-stats {
  margin-top: 0.24rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.14rem 0.2rem;
}

.stat-item {
  width: 45%;
  text-align: center;

  .label {
    font-size: 0.34rem;
    line-height: 1.2;
    color: #fff;
    opacity: 0.95;
  }

  .value {
    margin-top: 0.03rem;
    font-size: 0.56rem;
    line-height: 1.1;
    color: #fff;
    font-weight: 500;
  }
}

.divider {
  width: 0.02rem;
  height: 0.7rem;
  background: rgba(255, 255, 255, 0.16);
}

.result-list {
  margin-top: 0.24rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.result-card {
  border-radius: 0.84rem;
  padding: 0.34rem 0.42rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left {
  display: flex;
  align-items: center;
  gap: 0.22rem;
}

.avatar {
  width: 1.36rem;
  height: 1.36rem;
  border-radius: 50%;
  border: 0.02rem solid rgba(255, 255, 255, 0.28);
  object-fit: cover;
}

.info {
  .name {
    font-size: 0.5rem;
    line-height: 1.2;
    font-weight: 600;
    color: #f3f3f3;
  }

  .uid {
    margin-top: 0.03rem;
    font-size: 0.32rem;
    line-height: 1.2;
    color: #aaa69e;
  }
}

.right {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.amount {
  font-size: 0.52rem;
  line-height: 1.2;
  font-weight: 600;

  &.up {
    color: #ff132b;
  }

  &.down {
    color: #05e7ae;
  }
}

.chips {
  width: 0.52rem;
  height: 0.52rem;
}

@media (max-width: 360px) {
  .cowboy-detail-page {
    padding-left: 0.46rem;
    padding-right: 0.46rem;
  }

  .result-card {
    padding-left: 0.34rem;
    padding-right: 0.34rem;
  }

  .summary-col .main,
  .info .name,
  .amount {
    font-size: 0.44rem;
  }
}
</style>
