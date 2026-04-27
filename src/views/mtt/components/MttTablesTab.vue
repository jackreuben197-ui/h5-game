<script setup lang="ts">
import { ref } from 'vue'
import { GameTable, GameTableColumn } from '@/components/Table'
import peopleIcon from '@/assets/icons/icon_people.png'
import tableIcon from '@/assets/icons/icon_table.png'

interface TableRecord {
  tableNo: string
  players: number
  minChips: string
  maxChips: string
}

/* ===== 顶部统计 ===== */
const stats = ref({
  seatsPerTable: 9,
  totalTables: 9,
})

/* ===== 牌桌列表 mock 数据 ===== */
const tableList = ref<TableRecord[]>([
  { tableNo: '208', players: 29, minChips: '10,088', maxChips: '150,000' },
  { tableNo: '208', players: 29, minChips: '10,088', maxChips: '150,000' },
  { tableNo: '208', players: 29, minChips: '10,088', maxChips: '150,000' },
  { tableNo: '208', players: 29, minChips: '10,088', maxChips: '150,000' },
  { tableNo: '208', players: 29, minChips: '10,088', maxChips: '150,000' },
  { tableNo: '208', players: 29, minChips: '10,088', maxChips: '150,000' },
])
</script>

<template>
  <div class="mtt-tables-tab">
    <!-- 顶部统计 -->
    <div class="tables-stats-card">
      <div class="tables-stat-row">
        <div class="tables-stat-label">单桌人数</div>
        <div class="tables-stat-value">
          <img :src="peopleIcon" class="stat-icon" alt="people" />
          <span>{{ stats.seatsPerTable }}</span>
        </div>
      </div>
      <div class="tables-stat-row">
        <div class="tables-stat-label">牌桌总数</div>
        <div class="tables-stat-value">
          <img :src="tableIcon" class="stat-icon" alt="table" />
          <span>{{ stats.totalTables }}</span>
        </div>
      </div>
    </div>

    <!-- 牌桌表格 -->
    <GameTable :data="tableList">
      <GameTableColumn prop="tableNo" label="桌号" :flex="1" align="center" />
      <GameTableColumn prop="players" label="人数" :flex="1" align="center" />
      <GameTableColumn prop="minChips" label="最小筹码" :flex="2" align="center" />
      <GameTableColumn prop="maxChips" label="最大筹码" :flex="2" align="center" />
    </GameTable>
  </div>
</template>

<style scoped lang="scss">
.mtt-tables-tab {
  padding-top: 0.2rem;
}

/* ===== 顶部统计卡片 ===== */
.tables-stats-card {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.4rem;
}

.tables-stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.4rem;
  height: 1.2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3.9rem;
  backdrop-filter: blur(0.16px);
}

.tables-stat-label {
  font-size: 0.36rem;
  font-family: 'SF Pro', 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
}

.tables-stat-value {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  font-size: 0.36rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 600;
  color: #fff;
}

.stat-icon {
  width: 0.42rem;
  height: 0.42rem;
  object-fit: contain;
}
</style>
