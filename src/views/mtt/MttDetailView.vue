<script setup lang="ts">
import { ref } from 'vue'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import FilterTabbar from '@/components/Tabbar/FilterTabbar.vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import MttStatusTab from './components/MttStatusTab.vue'
import MttPlayersTab from './components/MttPlayersTab.vue'
import MttRewardsTab from './components/MttRewardsTab.vue'
import MttTablesTab from './components/MttTablesTab.vue'
import MttBlindsTab from './components/MttBlindsTab.vue'
import type { FilterTabOption } from '@/components/Tabbar/FilterTabbar.vue'

type DetailTabName = 'status' | 'players' | 'rewards' | 'tables' | 'blinds'

const activeTab = ref<DetailTabName>('status')

const tabs = ref<FilterTabOption[]>([
  { name: 'status', title: '赛况' },
  { name: 'players', title: '玩家' },
  { name: 'rewards', title: '奖励' },
  { name: 'tables', title: '牌桌' },
  { name: 'blinds', title: '盲注' },
])

function handleRegister(): void {
  console.log('[MTT Detail] 报名 clicked')
}
</script>

<template>
  <div class="mtt-detail-page">
    <div class="bg-overlay"></div>

    <!-- 顶部返回 -->
    <HeaderBack title="黄金豪客赛" />

    <!-- Tab 筛选 -->
    <FilterTabbar v-model="activeTab" :tabs="tabs" active-bg="pill" />

    <!-- 内容区 -->
    <div class="mtt-detail-content">
      <MttStatusTab v-if="activeTab === 'status'" />
      <MttPlayersTab v-else-if="activeTab === 'players'" />
      <MttRewardsTab v-else-if="activeTab === 'rewards'" />
      <MttTablesTab v-else-if="activeTab === 'tables'" />
      <MttBlindsTab v-else-if="activeTab === 'blinds'" />
    </div>

    <!-- 底部报名按钮 -->
    <div class="detail-footer">
      <PrimaryButton text="报名" @click="handleRegister" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.mtt-detail-page {
  position: relative;
  height: 100dvh;
  color: #fff;
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 15% 92%, rgba(255, 173, 212, 0.32), transparent 34%),
    radial-gradient(circle at 88% 84%, rgba(102, 227, 255, 0.28), transparent 34%),
    radial-gradient(circle at 50% 56%, rgba(255, 255, 255, 0.12), transparent 48%);
}

/* ===== 内容滚动区 ===== */
.mtt-detail-content {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 0 0.38rem 0.4rem;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  min-height: 0;
}

/* ===== 底部按钮 ===== */
.detail-footer {
  position: relative;
  z-index: 1;
  padding: 0.2rem 0.54rem 0.4rem;
  flex-shrink: 0;
}
</style>
