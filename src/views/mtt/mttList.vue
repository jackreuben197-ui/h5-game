<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import serviceIcon from '@/assets/icons/icon_server.png'
import walletIcon from '@/assets/icons/icon_wallet.png'
import clubDetailButtonIconDark from '@/assets/icons/img_club_detail_button.png'
import clubDetailButtonIconLight from '@/assets/icons/img_club_detail_button_light.svg'
import { useMttListStore } from '@/stores/mttList'
import { useUserInfoStore } from '@/stores/userInfo'
import { useGameStore } from '@/stores/game'
import { theme } from '@/utils/theme'
import { t } from '@/i18n'
import { openGlobalCustomerServiceChat } from '@/components/GlobalCustomerServiceChat/channel'
import { showFailToast } from 'vant'
import { useChannelMenuVersion } from '@/composables/useChannelMenuVersion'
import ClubZoneQuickActions from '@/components/Club/ClubZoneQuickActions.vue'

const mttListStore = useMttListStore()
const userInfoStore = useUserInfoStore()
const gameStore = useGameStore()
const router = useRouter()
const { isChannelPackage, isVersionB } = useChannelMenuVersion()

const clubDetailButtonIcon = computed(() =>
  theme.value === 'light' ? clubDetailButtonIconLight : clubDetailButtonIconDark,
)
const canManageChannelClub = computed(
  () =>
    isChannelPackage.value &&
    Boolean(gameStore.sessionToken && userInfoStore.currentJoinedClub),
)

const selectedClubId = computed(() => toSafeInt(userInfoStore.currentClub?.club_id))
const selectedTribeId = computed(() =>
  toSafeInt((userInfoStore.currentClub as Record<string, unknown> | null)?.tribe_id),
)

onMounted(() => {
  // 与首页共用同一个 MTT 数据源：先读缓存秒开，再静默刷新。
  mttListStore.bootstrapMttList()
})

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return 0
  }
  return Math.floor(num)
}

function handleBack() {
  router.push('/home')
}

function goToClubDetail(): void {
  void router.push('/club/detail')
}

function handleOpenCustomerService() {
  const clubId = selectedClubId.value
  if (clubId <= 0) {
    showFailToast(t('UIClub_CurrentClubNo'))
    return
  }

  openGlobalCustomerServiceChat({
    imServiceType: 1,
    clubId,
    tribeId: selectedTribeId.value,
  })
}
</script>

<template>
  <div class="mtt-list-page room-list-page themeType2" @back="handleBack">
    <div class="bg-overlay"></div>

    <div class="room-list-stage mtt-list-stage">
      <HeaderBack
        :title="isVersionB ? t('UITabbarTournaments') : t('UIHomeMttArea')"
        :show-back="!isVersionB"
        extra-padding
      >
        <template #right>
          <div class="action-wrap">
            <TopActionButton
              :name="t('UIGuildFund_RechargeText')"
              :icon="walletIcon"
              icon-alt="wallet"
              @click="router.push('/wallet')"
            />
            <TopActionButton
              v-if="userInfoStore.currentClub?.support_im_rid"
              :name="t('UIMineMain01')"
              :icon="serviceIcon"
              icon-alt="service"
              @click="handleOpenCustomerService"
            />
          </div>
        </template>
      </HeaderBack>
      <ClubZoneQuickActions v-if="isChannelPackage" />
      <MttContent :class="{ 'mtt-content--with-tabbar': isVersionB }" />
    </div>
    <div
      v-if="canManageChannelClub"
      class="floating-action-area"
      :class="{ 'floating-action-area--with-tabbar': isVersionB }"
    >
      <button
        class="floating-menu-btn"
        type="button"
        :aria-label="t('UIClub_ClubManager')"
        @click="goToClubDetail"
      >
        <img :src="clubDetailButtonIcon" alt="" />
      </button>
    </div>
    <MainBottomTab v-if="isChannelPackage && isVersionB" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.mtt-list-page {
  position: relative;
  min-height: 100dvh;
  color: #fff;
  overflow: hidden;
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;

  @include theme-light {
    color: var(--c-text);
    background-image: url('@/assets/images/main_bg_light.webp');
  }
}

.bg-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: none;

  @include theme-light {
    background:
      radial-gradient(circle at 8% 4%, rgba(var(--c-brand-rgb), 0.2), transparent 30%),
      radial-gradient(circle at 92% 9%, rgba(var(--c-brand-rgb), 0.14), transparent 26%);
  }
}

.action-wrap {
  display: flex;
  align-items: center;
  gap: 0.26rem;
  margin-right: 0.25rem;
}

.floating-action-area {
  position: fixed;
  right: 0.48rem;
  bottom: calc(0.6rem + env(safe-area-inset-bottom));
  z-index: 23;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  &--with-tabbar {
    bottom: calc(2.82rem + env(safe-area-inset-bottom));
  }
}

.floating-menu-btn {
  width: 1.04rem;
  height: 1.04rem;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.mtt-list-page :deep(.filter-tabbar) {
  @include theme-light {
    background: rgba(134, 134, 134, 0.22);
  }
}

.mtt-list-page :deep(.filter-tab__text) {
  @include theme-light {
    color: var(--c-text);
  }
}

.mtt-list-page :deep(.filter-tab__item--active) {
  @include theme-light {
    border-color: #fff;
    background: #fff;
  }
}

:deep(.mtt-content--with-tabbar) {
  padding-bottom: calc(2.3rem + env(safe-area-inset-bottom)) !important;
}
</style>

<style lang="scss">
:root[data-theme='light'] .mtt-list-page {
  --c-brand: #05c297;
  --c-brand-rgb: 5, 194, 151;

  color: rgba(15, 8, 8, 0.85);
  background-image: url('@/assets/images/main_bg_light.webp');

  .back-trigger,
  .back-icon {
    color: rgba(0, 0, 0, 1);
  }

  .title {
    text-shadow: none;
  }

  .bg-overlay {
    background:
      radial-gradient(circle at 8% 4%, rgba(var(--c-brand-rgb), 0.2), transparent 30%),
      radial-gradient(circle at 92% 9%, rgba(var(--c-brand-rgb), 0.14), transparent 26%);
  }

  .filter-tabbar {
    background: rgba(134, 134, 134, 0.22);
  }

  .filter-tab__text {
    color: rgba(15, 8, 8, 0.85);
  }

  .filter-tab__item--active {
    border-color: #fff;
    background: #fff;
  }
}
</style>
