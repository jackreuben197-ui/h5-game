<script setup lang="ts">
import { computed } from 'vue'

import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import mainBgUrl from '@/assets/images/main_bg.webp'
import iconTime from '@/assets/icons/icon_time.png'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const dateStart = '11/03/2024'
const dateEnd = '11/03/2024'
const timeStart = '00:00'
const timeEnd = '23:59'

const summaryCards = [
  [
    { label: '联盟回收', value: '+999999', trend: 'up' },
    { label: '回收联盟币', value: '0', trend: 'neutral' },
    { label: '联盟发放', value: '-999999', trend: 'down' },
    { label: '发放联盟币', value: '+999999', trend: 'up' },
  ],
  [
    { label: '服务费', value: '+999999', trend: 'up' },
    { label: '保险盈', value: '-999999', trend: 'down' },
    { label: 'MTT收益', value: '-999999', trend: 'down' },
  ],
] as const

function valueClass(trend: 'up' | 'down' | 'neutral'): string {
  if (trend === 'down') {
    return 'metric-value--down'
  }

  if (trend === 'neutral') {
    return 'metric-value--neutral'
  }

  return 'metric-value--up'
}
</script>

<template>
  <div class="page-shell club-wallet-logs-bg" :style="backgroundStyle">
    <HeaderBack :title="'收益管理'" />

    <section class="range-card">
      <div class="date-range">
        <button type="button" class="date-pill">
          <span class="date">{{ dateStart }}</span>
          <span class="time-line">
            <img :src="iconTime" alt="时间" />
            <span>{{ timeStart }}</span>
          </span>
        </button>
        <span class="dash" aria-hidden="true">—</span>
        <button type="button" class="date-pill">
          <span class="date">{{ dateEnd }}</span>
          <span class="time-line">
            <img :src="iconTime" alt="时间" />
            <span>{{ timeEnd }}</span>
          </span>
        </button>
      </div>

      <div class="balance-row">
        <div class="balance-col">
          <p class="balance-label">初始基金余额</p>
          <p class="balance-value">123456</p>
        </div>
        <span class="balance-split" aria-hidden="true"></span>
        <div class="balance-col">
          <p class="balance-label">实时基金余额</p>
          <p class="balance-value">123456</p>
        </div>
      </div>
    </section>

    <p class="timezone">时区：UTC+0</p>

    <section class="metrics-wrap">
      <article v-for="(group, groupIndex) in summaryCards" :key="groupIndex" class="metrics-card">
        <div
          v-for="(item, itemIndex) in group"
          :key="item.label"
          class="metric-item"
          :class="{ 'metric-item--with-divider': itemIndex < group.length - 1 }"
        >
          <p class="metric-label">{{ item.label }}</p>
          <p class="metric-value" :class="valueClass(item.trend)">{{ item.value }}</p>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped lang="scss">
.club-wallet-logs-bg {
  position: relative;
  height: 100dvh;
  background-size: cover;
}

.top-bar {
  min-height: 0.7rem;
  display: flex;
  align-items: center;
  padding-left: 0.32rem;
}

.back-btn {
  border: 0;
  background: transparent;
  color: #f9f9f9;
  display: inline-flex;
  align-items: center;
  gap: 0.16rem;
  padding: 0;
}

.back-icon {
  width: 0.18rem;
  height: 0.18rem;
  border-left: 0.03rem solid rgba(249, 249, 249, 0.95);
  border-bottom: 0.03rem solid rgba(249, 249, 249, 0.95);
  transform: rotate(45deg);
}

.back-title {
  font-size: 0.52rem;
  line-height: 1;
  font-weight: 500;
}

.range-card {
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  padding: 0.48rem 0.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.date-range {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.41341rem;
  margin-bottom: 0.22rem;
}

.date-pill {
  border: 0.02rem solid rgba(249, 249, 249, 0.08);
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  width: 3.2204rem;
  height: 1.50483rem;
  color: #fff;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 0.2196rem;

  .date {
    font-size: 0.32013rem;
    line-height: 0.42685rem;
  }

  .time-line {
    display: inline-flex;
    align-items: center;
    gap: 0.21341rem;
    font-size: 0.42685rem;
    line-height: 0.53355rem;

    img {
      width: 0.33147rem;
      height: 0.31867rem;
      object-fit: contain;
      opacity: 0.95;
    }
  }
}

.dash {
  font-size: 0.52685rem;
  line-height: 1;
  color: rgba(255, 255, 255, 0.9);
}

.balance-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.08rem;
}

.balance-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.04rem;
}

.balance-label {
  margin: 0;
  font-size: 0.27rem;
  line-height: 1.3;
  color: #f3f3f3;
}

.balance-value {
  margin: 0;
  font-size: 0.53rem;
  line-height: 1;
  color: #f9f9f9;
  font-weight: 500;
}

.balance-split {
  width: 0.01rem;
  height: 0.54rem;
  background: rgba(255, 255, 255, 0.24);
}

.timezone {
  text-align: right;
  margin: 0.2rem 0.4rem .82rem;
  color: rgba(249, 249, 249, 0.52);
  font-size: 0.22rem;
  line-height: 1;
  padding-right: 0.02rem;
}

.metrics-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.metrics-card {
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  padding: 0.36rem 0.12rem;
  margin-bottom: 0.22rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.03rem;
  min-height: 0.82rem;
}

.metric-item--with-divider {
  border-right: 0.01rem solid rgba(255, 255, 255, 0.18);
}

.metric-label {
  margin: 0;
  font-size: 0.24rem;
  line-height: 1.2;
  color: #f9f9f9;
}

.metric-value {
  margin: 0;
  font-size: 0.35rem;
  line-height: 1;
  font-weight: 700;
}

.metric-value--up {
  color: #ff5364;
}

.metric-value--down {
  color: #05e7ae;
}

.metric-value--neutral {
  color: #f9f9f9;
}

@media (max-width: 340px) {
  .back-title {
    font-size: 0.43rem;
  }

  .date-pill {
    min-width: 2.04rem;
    font-size: 0.27rem;
  }

  .balance-value {
    font-size: 0.43rem;
  }

  .metric-label {
    font-size: 0.21rem;
  }

  .metric-value {
    font-size: 0.29rem;
  }
}
</style>
