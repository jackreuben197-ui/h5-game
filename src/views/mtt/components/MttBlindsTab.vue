<script setup lang="ts">
import { ref } from 'vue'
import { GameTable, GameTableColumn } from '@/components/Table'

interface BlindRecord {
  level: number
  blinds: string
  ante: string
  duration: string
}

/* ===== 顶部统计 ===== */
const stats = ref({
  blindLevels: 40,
})

/* ===== 盲注列表 mock 数据 ===== */
const blindList = ref<BlindRecord[]>([
  { level: 1, blinds: '25/50', ante: '10,088', duration: '150,000' },
  { level: 1, blinds: '25/50', ante: '10,088', duration: '150,000' },
  { level: 1, blinds: '25/50', ante: '10,088', duration: '150,000' },
  { level: 1, blinds: '25/50', ante: '10,088', duration: '150,000' },
  { level: 1, blinds: '25/50', ante: '10,088', duration: '150,000' },
  { level: 1, blinds: '25/50', ante: '10,088', duration: '150,000' },
  { level: 1, blinds: '25/50', ante: '10,088', duration: '150,000' },
])
</script>

<template>
  <div class="mtt-blinds-tab">
    <!-- 顶部统计 -->
    <div class="blinds-stats-card">
      <div class="blinds-stat-row">
        <div class="blinds-stat-label">盲注级别数</div>
        <div class="blinds-stat-value">{{ stats.blindLevels }}</div>
      </div>
    </div>

    <!-- 盲注表格 -->
    <GameTable :data="blindList">
      <GameTableColumn prop="level" label="级别" :flex="1" align="center" />
      <GameTableColumn prop="blinds" label="盲注" :flex="1" align="center" />
      <GameTableColumn prop="ante" label="前注" :flex="2" align="center" />
      <GameTableColumn prop="duration" label="盲注时间" :flex="2" align="center" />
    </GameTable>
  </div>
</template>

<style scoped lang="scss">
.mtt-blinds-tab {
  padding-top: 0.2rem;
}

/* ===== 顶部统计卡片 ===== */
.blinds-stats-card {
  margin-bottom: 0.4rem;
}

.blinds-stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.4rem;
  height: 1.2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3.9rem;
  backdrop-filter: blur(0.16px);
}

.blinds-stat-label {
  font-size: 0.36rem;
  font-family: 'SF Pro', 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
}

.blinds-stat-value {
  font-size: 0.54rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
}
</style>
