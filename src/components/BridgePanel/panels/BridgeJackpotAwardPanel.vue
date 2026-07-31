<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/i18n'

const props = defineProps<{
  panelProps?: Record<string, unknown>
  emitPanelEvent: (event: string, payload?: unknown) => void
  closePanel: (reason?: string, payload?: unknown) => void
}>()

interface AwardUser {
  userRid: string
  nickname: string
  avatar: string
  award: number
  cardsType: number
  handValue: number
}

const rawList = computed<AwardUser[]>(() => {
  const raw = props.panelProps?.awardUsersList
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (item): item is AwardUser =>
      item &&
      typeof item === 'object' &&
      typeof (item as Record<string, unknown>).nickname === 'string' &&
      typeof (item as Record<string, unknown>).avatar === 'string',
  )
})

/** 只显示第一条 */
const winner = computed<AwardUser | null>(() => rawList.value[0] ?? null)

function formatAward(value: number): string {
  return `JP ${value / 100}`
}
</script>

<template>
  <section class="jackpot-award-panel">
    <!-- 标题 -->
    <div class="jackpot-award-panel__title">{{ t('UIBridgePanel_Text') }}</div>

    <!-- 中奖者信息 -->
    <div v-if="winner" class="jackpot-award-panel__card">
      <!-- 头像 + 昵称 -->
      <div class="jackpot-award-panel__user">
        <img class="jackpot-award-panel__avatar" :src="winner.avatar" :alt="winner.nickname" />
        <div class="jackpot-award-panel__name-bg">
          <span class="jackpot-award-panel__name">{{ winner.nickname }}</span>
        </div>
      </div>

      <!-- 奖金 -->
      <div class="jackpot-award-panel__award-pill">
        <span class="jackpot-award-panel__amount">{{ formatAward(winner.award) }}</span>
      </div>
    </div>

    <!-- 无数据占位 -->
    <div v-else class="jackpot-award-panel__empty">{{ t('UIBridgePanel_No') }}</div>
  </section>
</template>

<style scoped lang="scss">
.jackpot-award-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0rem 0.32rem 0.48rem;
}

/* ---- 标题 ---- */
.jackpot-award-panel__title {
  color: #fff;
  font-size: 0.56rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  line-height: 0.6rem;
  letter-spacing: 0.04em;
}

/* ---- 中奖卡片容器 ---- */
.jackpot-award-panel__card {
  margin-top: 0.4rem;
  width: 4.24rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ---- 用户区域：头像 + 昵称背景条 ---- */
.jackpot-award-panel__user {
  position: relative;
  width: 5rem;
  height: 2.53rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.jackpot-award-panel__avatar {
  width: 2.13rem;
  height: 2.13rem;
  border-radius: 9999px;
  object-fit: cover;
  box-shadow: 0 0.03rem 0.59rem rgba(0, 0, 0, 0.5);
}

.jackpot-award-panel__name-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0.67rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.17);
  border-radius: 999px;
  backdrop-filter: blur(2px);
  box-shadow: 0 0.27rem 0.37rem rgba(0, 0, 0, 0.25);
}

.jackpot-award-panel__name {
  color: #fff;
  font-size: 0.43rem;
  font-family: 'PingFang SC', sans-serif;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  // max-width: 5rem;
}

/* ---- 奖金药丸 ---- */
.jackpot-award-panel__award-pill {
  margin-top: 0.4rem;
  width: 4.24rem;
  height: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.51rem;
  background: linear-gradient(180deg, #69ffe6 0%, #079a8b 100%);
}

.jackpot-award-panel__amount {
  background: linear-gradient(180deg, #fff 0%, rgba(255, 255, 255, 0.85) 100%);
  background-clip: text;
  color: transparent;
  font-size: 0.68rem;
  font-family: 'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 700;
  letter-spacing: 0.014em;
}

/* ---- 空状态 ---- */
.jackpot-award-panel__empty {
  margin-top: 1rem;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.34rem;
}
</style>
