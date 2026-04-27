<script setup lang="ts">
import { ref } from 'vue'
import { GameTable, GameTableColumn } from '@/components/Table'
import chipIcon from '@/assets/icons/icon_chips.png'

interface RewardRecord {
  rank: number
  reward: string
}

/* ===== 顶部统计 ===== */
const stats = ref({
  prizePool: 509,
  paidPlaces: 200,
})

/* ===== 奖励列表 mock 数据 ===== */
const rewardList = ref<RewardRecord[]>([
  { rank: 1, reward: '150,000' },
  { rank: 2, reward: '150,000' },
  { rank: 3, reward: '150,000' },
  { rank: 4, reward: '150,000' },
  { rank: 5, reward: '150,000' },
])
</script>

<template>
  <div class="mtt-rewards-tab">
    <!-- 顶部统计 -->
    <div class="rewards-stats-card">
      <div class="rewards-stat-row">
        <div class="rewards-stat-label">总奖金</div>
        <div class="rewards-stat-value">
          <img :src="chipIcon" class="stat-chip-icon" alt="chip" />
          <span>{{ stats.prizePool }}</span>
        </div>
      </div>
      <div class="rewards-stat-row">
        <div class="rewards-stat-label">奖励圈</div>
        <div class="rewards-stat-value">
          <span>{{ stats.paidPlaces }}</span>
        </div>
      </div>
    </div>

    <!-- 奖励表格 -->
    <GameTable :data="rewardList">
      <GameTableColumn prop="rank" label="名次" :flex="1" align="center" />
      <GameTableColumn prop="reward" label="奖励" :flex="1" align="center">
        <template #default="{ row }">
          <div class="reward-cell">
            <img :src="chipIcon" class="cell-chip-icon" alt="chip" />
            <span>{{ row.reward }}</span>
          </div>
        </template>
      </GameTableColumn>
    </GameTable>
  </div>
</template>

<style scoped lang="scss">
.mtt-rewards-tab {
  padding-top: 0.2rem;
}

/* ===== 顶部统计卡片 ===== */
.rewards-stats-card {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.4rem;
}

.rewards-stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.4rem;
  height: 1.2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3.9rem;
  backdrop-filter: blur(0.16px);
}

.rewards-stat-label {
  font-size: 0.36rem;
  font-family: 'SF Pro', 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
}

.rewards-stat-value {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  font-size: 0.36rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
}

.stat-chip-icon {
  width: 0.42rem;
  height: 0.42rem;
  object-fit: contain;
}

/* ===== 表格自定义 ===== */
.reward-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
}

.cell-chip-icon {
  width: 0.36rem;
  height: 0.36rem;
  object-fit: contain;
}
</style>
