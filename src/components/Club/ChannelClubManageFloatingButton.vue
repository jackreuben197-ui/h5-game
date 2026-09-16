<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useChannelBottomMenu } from '@/composables/useChannelBottomMenu'
import { t } from '@/i18n'
import { requireRealUser } from '@/session/realUserGate'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { isChannelPackageHost } from '@/utils/channelPackage'

const router = useRouter()
const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()
const isChannelPackage = isChannelPackageHost()
const { isVersionB } = useChannelBottomMenu()

// 版本 B 没有俱乐部底部 Tab，赛事页和牌桌页必须保留独立的俱乐部管理入口。
const canManageClub = computed(
  () =>
    isChannelPackage &&
    isVersionB.value &&
    gameStore.isRealUser &&
    Boolean(userInfoStore.currentJoinedClub),
)

function goToClubDetail(): void {
  if (!requireRealUser(goToClubDetail)) return
  void router.push('/club/detail')
}
</script>

<template>
  <div v-if="canManageClub" class="club-manage-floating-action">
    <button
      class="club-manage-floating-button"
      type="button"
      :aria-label="t('UIClub_ClubManager')"
      @click="goToClubDetail"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.club-manage-floating-action {
  position: fixed;
  right: 0.48rem;
  bottom: calc(2.82rem + env(safe-area-inset-bottom));
  z-index: 23;
}

.club-manage-floating-button {
  width: 0.86rem;
  height: 0.86rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 25%, #056a57 0%, #01382f 75%);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.07rem;
  box-shadow: 0 0.12rem 0.26rem rgba(0, 0, 0, 0.34);

  @include theme-light {
    background: #505050;
    box-shadow: 0 0.12rem 0.28rem rgba(var(--c-brand-rgb), 0.28);
  }
}

.club-manage-floating-button span {
  width: 0.23rem;
  height: 0.055rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
}
</style>
