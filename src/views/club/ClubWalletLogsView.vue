<script setup lang="ts">
import { computed } from 'vue'

import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import { t } from '@/i18n'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--wallet-bg-dark': `url(${mainBgUrl})`,
  '--wallet-bg-light': `url(${mainBgLightUrl})`,
}))

const dateStart = '11/03/2024'
const dateEnd = '11/03/2024'

const summaryCards = [
  [
    { label: t('UIClub_league_recycling'), value: '+999999', trend: 'up' },
    { label: t('UIClub_UnionCoin2'), value: '0', trend: 'neutral' },
    { label: t('UIClub_league_issue'), value: '-999999', trend: 'down' },
    { label: t('UIClub_UnionCoin3'), value: '+999999', trend: 'up' },
  ],
  [
    { label: t('UIMine_WalletPlatform_fee_f'), value: '+999999', trend: 'up' },
    { label: t('UIClub_Insurance'), value: '-999999', trend: 'down' },
    { label: "MTT" + t('UIData_YGvXd5iXr_010'), value: '-999999', trend: 'down' },
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
      <div class="date-row">
        <button type="button" class="date-pill">
          <span class="calendar-icon" aria-hidden="true"></span>
          <span>{{ dateStart }}</span>
        </button>
        <span class="range-divider" aria-hidden="true"></span>
        <button type="button" class="date-pill">
          <span class="calendar-icon" aria-hidden="true"></span>
          <span>{{ dateEnd }}</span>
        </button>
      </div>

      <div class="balance-row">
        <div class="balance-col">
          <p class="balance-label">{{ t('UIGuildMgr_InitFund') }}</p>
          <p class="balance-value">123456</p>
        </div>
        <span class="balance-split" aria-hidden="true"></span>
        <div class="balance-col">
          <p class="balance-label">{{ t('UIGuildMgr_CrrentFund') }}</p>
          <p class="balance-value">123456</p>
        </div>
      </div>
    </section>

    <p class="timezone">{{ t('UICommon_TimeZone') }}：UTC+0</p>

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
@use '@/styles/mixins' as *;

.club-wallet-logs-bg {
  position: relative;
  height: 100dvh;
  background-size: cover;
  background-image: var(--wallet-bg-dark);

  @include theme-light {
    color: #111;
    background-image: var(--wallet-bg-light);
  }
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
  border-radius: 0.44rem;
  padding: 0.18rem 0.2rem;
  background: rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(0.16rem);
  display: flex;
  flex-direction: column;
  gap: 0.12rem;

  @include theme-light {
    background: #fff;
  }
}

.date-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.14rem;
}

.date-pill {
  min-width: 2.26rem;
  min-height: 0.82rem;
  border: 0.01rem solid rgba(255, 255, 255, 0.26);
  border-radius: 0.42rem;
  background: rgba(255, 255, 255, 0.14);
  color: #f3f3f3;
  font-size: 0.31rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;

  @include theme-light {
    border-color: transparent;
    color: rgba(17, 17, 17, 0.76);
    background: #efedef;
  }
}

.range-divider {
  width: 0.25rem;
  height: 0.03rem;
  border-radius: 999px;
  background: rgba(249, 249, 249, 0.72);

  @include theme-light {
    background: rgba(17, 17, 17, 0.42);
  }
}

.calendar-icon {
  width: 0.2rem;
  height: 0.2rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.9);
  border-radius: 0.05rem;
  position: relative;

  @include theme-light {
    border-color: rgba(17, 17, 17, 0.68);
  }
}

.calendar-icon::before,
.calendar-icon::after {
  content: '';
  position: absolute;
  top: -0.05rem;
  width: 0.03rem;
  height: 0.05rem;
  border-radius: 999px;
  background: rgba(249, 249, 249, 0.9);

  @include theme-light {
    background: rgba(17, 17, 17, 0.68);
  }
}

.calendar-icon::before {
  left: 0.03rem;
}

.calendar-icon::after {
  right: 0.03rem;
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

  @include theme-light {
    color: rgba(17, 17, 17, 0.76);
  }
}

.balance-value {
  margin: 0;
  font-size: 0.53rem;
  line-height: 1;
  color: #f9f9f9;
  font-weight: 500;

  @include theme-light {
    color: #111;
  }
}

.balance-split {
  width: 0.01rem;
  height: 0.54rem;
  background: rgba(255, 255, 255, 0.24);

  @include theme-light {
    background: rgba(17, 17, 17, 0.14);
  }
}

.timezone {
  margin: 0;
  align-self: flex-end;
  color: rgba(249, 249, 249, 0.52);
  font-size: 0.22rem;
  line-height: 1;
  padding-right: 0.02rem;

  @include theme-light {
    color: rgba(17, 17, 17, 0.5);
  }
}

.metrics-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.metrics-card {
  border-radius: 0.42rem;
  padding: 0.16rem 0.12rem;
  background: rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(0.16rem);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));

  @include theme-light {
    background: #fff;
  }
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

  @include theme-light {
    border-right-color: rgba(17, 17, 17, 0.12);
  }
}

.metric-label {
  margin: 0;
  font-size: 0.24rem;
  line-height: 1.2;
  color: #f9f9f9;

  @include theme-light {
    color: #111;
  }
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
  color: var(--c-brand);

  @include theme-light {
    color: #00af83;
  }
}

.metric-value--neutral {
  color: #f9f9f9;

  @include theme-light {
    color: #111;
  }
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
