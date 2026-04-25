<script setup lang="ts">
import { useRouter } from 'vue-router'
import iconTime from '@/assets/icons/icon_time.png'

interface CowboyRecordItem {
  id: string
  name: string
  uid: string
  time: string
  amount: string
  positive: boolean
}

const router = useRouter()

const records: CowboyRecordItem[] = [
  { id: '1', name: 'Player Name', uid: '11440454', time: '19/03 12:00', amount: '+123,456', positive: true },
  { id: '2', name: 'Player Name', uid: '11440454', time: '19/03 12:00', amount: '-123,456', positive: false },
  { id: '3', name: 'Player Name', uid: '11440454', time: '19/03 12:00', amount: '+123,456', positive: true },
  { id: '4', name: 'Player Name', uid: '11440454', time: '19/03 12:00', amount: '-123,456', positive: false },
  { id: '5', name: 'Player Name', uid: '11440454', time: '19/03 12:00', amount: '-123,456', positive: false },
  { id: '6', name: 'Player Name', uid: '11440454', time: '19/03 12:00', amount: '+123,456', positive: true },
  { id: '7', name: 'Player Name', uid: '11440454', time: '19/03 12:00', amount: '-123,456', positive: false },
  { id: '8', name: 'Player Name', uid: '11440454', time: '19/03 12:00', amount: '+123,456', positive: true },
]

function goBack(): void {
  void router.push('/mine/club-career')
}
</script>

<template>
  <div class="cowboy-page">
    <header class="page-head">
      <button class="back-btn" type="button" @click="goBack">‹</button>
      <h1>牛仔战绩</h1>
      <div class="head-spacer" />
    </header>

    <section class="list-wrap">
      <button
        v-for="item in records"
        :key="item.id"
        type="button"
        class="record-card"
      >
        <div class="left">
          <div class="avatar-wrap">
            <span class="cowboy-hat" aria-hidden="true">⌒</span>
          </div>
          <div class="info">
            <div class="name">{{ item.name }}</div>
            <div class="uid">ID: {{ item.uid }}</div>
          </div>
        </div>

        <div class="right">
          <div class="time-row">
            <img :src="iconTime" alt="time" />
            <span>{{ item.time }}</span>
          </div>
          <div class="amount" :class="item.positive ? 'up' : 'down'">{{ item.amount }}</div>
        </div>
      </button>
    </section>
  </div>
</template>

<style scoped lang="scss">
.cowboy-page {
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.46rem) 0.63rem 0.74rem;
  color: #f9f9f9;
  background:
    radial-gradient(58% 45% at 18% 12%, rgba(232, 166, 140, 0.56) 0%, rgba(232, 166, 140, 0) 100%),
    radial-gradient(54% 44% at 24% 83%, rgba(215, 89, 173, 0.56) 0%, rgba(215, 89, 173, 0) 100%),
    radial-gradient(44% 38% at 86% 84%, rgba(0, 180, 215, 0.62) 0%, rgba(0, 180, 215, 0) 100%),
    linear-gradient(162deg, #b88da6 0%, #93678f 52%, #5d3f78 100%);
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.2;
    font-weight: 400;
  }
}

.back-btn {
  width: 0.76rem;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.72rem;
  line-height: 1;
  text-align: left;
  padding: 0;
}

.head-spacer {
  width: 0.76rem;
}

.list-wrap {
  margin-top: 0.54rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.record-card {
  width: 100%;
  border: 0;
  border-radius: 0.84rem;
  padding: 0.34rem 0.42rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.05rem);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
}

.left {
  display: flex;
  align-items: center;
  gap: 0.22rem;
}

.avatar-wrap {
  width: 1.36rem;
  height: 1.36rem;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.23);
  border: 0.02rem solid rgba(255, 255, 255, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cowboy-hat {
  font-size: 0.72rem;
  line-height: 1;
  color: #00f0c8;
  transform: translateY(-0.04rem);
}

.info {
  .name {
    font-size: 0.48rem;
    line-height: 1.2;
    font-weight: 600;
    color: #f3f3f3;
  }

  .uid {
    margin-top: 0.03rem;
    font-size: 0.33rem;
    line-height: 1.2;
    color: #aaa69e;
  }
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.08rem;
}

.time-row {
  display: inline-flex;
  align-items: center;
  gap: 0.11rem;
  font-size: 0.48rem;
  line-height: 1.2;
  font-weight: 600;

  img {
    width: 0.34rem;
    height: 0.34rem;
    opacity: 0.96;
  }
}

.amount {
  font-size: 0.48rem;
  line-height: 1.2;
  font-weight: 600;

  &.up {
    color: #ff132b;
  }

  &.down {
    color: #05e7ae;
  }
}

@media (max-width: 360px) {
  .cowboy-page {
    padding-left: 0.44rem;
    padding-right: 0.44rem;
  }

  .record-card {
    padding-left: 0.32rem;
    padding-right: 0.32rem;
  }

  .info .name,
  .time-row,
  .amount {
    font-size: 0.42rem;
  }
}
</style>
