<script setup lang="ts">
import { ref } from 'vue'
import { GameTable, GameTableColumn } from '@/components/Table'
import defaultAvatar from '@/assets/icons/icon_mtt_avatar.png'

interface PlayerRecord {
  rank: number
  name: string
  avatar: string
  rebuy: string
  addon: string
  chips: string
}

/* ===== 顶部统计信息 ===== */
const stats = ref({
  remaining: '20/20',
  participants: 1000,
  registered: 200,
  rebuyCount: '20/20',
  addonCount: 1000,
})

/* ===== 玩家列表 mock 数据 ===== */
const playerList = ref<PlayerRecord[]>([
  { rank: 1, name: 'Davis', avatar: defaultAvatar, rebuy: '--', addon: '--', chips: '15,000(30.5BB)' },
  { rank: 2, name: 'Lydia', avatar: defaultAvatar, rebuy: '--', addon: '--', chips: '15,000(30.5BB)' },
  { rank: 3, name: 'Lydia', avatar: defaultAvatar, rebuy: '--', addon: '--', chips: '15,000(30.5BB)' },
  { rank: 4, name: 'Skylar', avatar: defaultAvatar, rebuy: '--', addon: '--', chips: '15,000(30.5BB)' },
  { rank: 5, name: 'Miracle', avatar: defaultAvatar, rebuy: '--', addon: '--', chips: '15,000(30.5BB)' },
  { rank: 6, name: 'Paityn', avatar: defaultAvatar, rebuy: '--', addon: '--', chips: '15,000(30.5BB)' },
])

function handleRowClick(row: Record<string, any>): void {
  console.log('[MttPlayersTab] row click:', row)
}
</script>

<template>
  <div class="mtt-players-tab">
    <!-- 顶部统计卡片 -->
    <div class="players-stats-card">
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-num">{{ stats.remaining }}</div>
          <div class="stat-desc">比赛剰余人数</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ stats.participants }}</div>
          <div class="stat-desc">参赛人次</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ stats.registered }}</div>
          <div class="stat-desc">报名人次</div>
        </div>
      </div>
      <div class="stats-row stats-row--second">
        <div class="stat-item">
          <div class="stat-num">{{ stats.rebuyCount }}</div>
          <div class="stat-desc">重购人次</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ stats.addonCount }}</div>
          <div class="stat-desc">增购人次</div>
        </div>
      </div>
    </div>

    <!-- 玩家表格 -->
    <GameTable :data="playerList" @row-click="handleRowClick">
      <GameTableColumn prop="rank" label="名次" :flex="1" align="center" />
      <GameTableColumn prop="name" label="玩家" :flex="2" align="center">
        <template #default="{ row }">
          <div class="player-cell">
            <img :src="row.avatar" class="player-avatar" alt="avatar" />
            <span>{{ row.name }}</span>
          </div>
        </template>
      </GameTableColumn>
      <GameTableColumn prop="rebuy" label="重购" :flex="2" align="center" />
      <GameTableColumn prop="addon" label="增购" :flex="2" align="center" />
      <GameTableColumn prop="chips" label="筹码(BB)" :flex="3" align="center" />
    </GameTable>
  </div>
</template>

<style scoped lang="scss">
.mtt-players-tab {
  padding-top: 0.2rem;
}

/* ===== 顶部统计卡片 ===== */
.players-stats-card {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.76rem;
  padding: 0.4rem 0.5rem;
  margin-bottom: 0.4rem;
  backdrop-filter: blur(0.16px);
}

.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  &--second {
    justify-content: center;
    gap: 1.2rem;
    margin-top: 0.3rem;
  }
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.05rem;
}

.stat-num {
  font-size: 0.54rem;
  font-family: 'SF Pro', 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;
  line-height: 1.2;
}

.stat-desc {
  font-size: 0.22rem;
  font-family: 'SF Pro', 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.2;
}

/* ===== 玩家列自定义 ===== */
.player-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
}

.player-avatar {
  width: 0.48rem;
  height: 0.48rem;
  border-radius: 50%;
  object-fit: cover;
}
</style>
