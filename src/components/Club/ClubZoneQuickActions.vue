<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast } from 'vant'
import { useUserInfoStore } from '@/stores/userInfo'
import { t } from '@/i18n'
import quickSafetyBg from '@/assets/images/club_header_quick_safety.jpg'
import quickRankingBg from '@/assets/images/club_header_quick_ranking.png'
import SafetyGuardDialog from '@/components/Dialog/SafetyGuardDialog.vue'

const userInfoStore = useUserInfoStore()
const showSafetyGuardPopup = ref(false)

const selectedTribeId = computed(() =>
  toSafeInt((userInfoStore.currentClub as Record<string, unknown> | null)?.tribe_id),
)

function toSafeInt(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? Math.floor(num) : 0
}

function handleQuickActionClick(action: 'safety' | 'ranking'): void {
  if (action === 'safety') {
    if (selectedTribeId.value <= 0) {
      showFailToast(t('UIClub_CurrentClubOfNot'))
      return
    }
    showSafetyGuardPopup.value = true
    return
  }

  showFailToast(t('UIClub_InDeve2'))
}
</script>

<template>
  <div class="club-zone-quick-actions">
    <button
      class="club-zone-quick-card club-zone-quick-card--safety"
      type="button"
      @click="handleQuickActionClick('safety')"
    >
      <img :src="quickSafetyBg" alt="" aria-hidden="true" />
      <span>{{ t('UISafety') }}</span>
    </button>

    <button
      class="club-zone-quick-card club-zone-quick-card--ranking"
      type="button"
      @click="handleQuickActionClick('ranking')"
    >
      <img :src="quickRankingBg" alt="" aria-hidden="true" />
      <span>{{ t('UINiuZai_RankListTitle') }}</span>
    </button>
  </div>

  <SafetyGuardDialog v-model:show="showSafetyGuardPopup" :tribe-id="selectedTribeId" />
</template>

<style scoped lang="scss">
.club-zone-quick-actions {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.2rem;
  padding: 0.12rem 0.38rem 0.24rem;
}

.club-zone-quick-card {
  position: relative;
  height: 1.7rem;
  padding: 0;
  border: 0.01rem solid rgba(255, 255, 255, 0.5);
  border-radius: 0.42rem;
  overflow: hidden;
  color: #fff;
  background: rgba(20, 36, 54, 0.5);
  box-shadow: 0 0.08rem 0.2rem rgba(0, 0, 0, 0.18);
}

.club-zone-quick-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(8, 15, 27, 0.2), rgba(8, 15, 27, 0.62));
}

.club-zone-quick-card img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-zone-quick-card span {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 0.34rem;
  font-weight: 700;
  text-shadow: 0 0.04rem 0.12rem rgba(0, 0, 0, 0.55);
}
</style>
