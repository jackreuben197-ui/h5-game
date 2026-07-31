<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FilterTabOption } from '@/components/Tabbar/FilterTabbar.vue'
import serviceIcon from '@/assets/icons/icon_server.png'
import walletIcon from '@/assets/icons/icon_wallet.png'
import { useMttListStore } from '@/stores/mttList'
import { useUserInfoStore } from '@/stores/userInfo'
import { t } from '@/i18n'
import { openGlobalCustomerServiceChat } from '@/components/GlobalCustomerServiceChat/channel'
import { showFailToast } from 'vant'
import { isChannelPackageHost } from '@/utils/channelPackage'
import ClubZoneQuickActions from '@/components/Club/ClubZoneQuickActions.vue'

type MttTabName = 'all' | 'poker' | 'mahjong'

const activeTab = ref<MttTabName>('all')
const mttListStore = useMttListStore()
const userInfoStore = useUserInfoStore()
const router = useRouter()
const isChannelPackage = isChannelPackageHost()

const selectedClubId = computed(() => toSafeInt(userInfoStore.currentClub?.club_id))
const selectedTribeId = computed(() =>
  toSafeInt((userInfoStore.currentClub as Record<string, unknown> | null)?.tribe_id),
)

// 目前没有麻将赛事，暂时隐藏「全部 / 扑克赛事」切换 tab；恢复时改回 true 即可。
const showMttTabs = false

const mttTabs = computed<FilterTabOption[]>(() => [
  { name: 'all', title: resolveLabel('UIMatch_GtO8YEdb', t('UIMatch_GtO8YEdb')) },
  { name: 'poker', title: resolveLabel('UIHomePokerArea', t('UIMatchPokerTournament')) },
])

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

function resolveLabel(key: string, fallback: string): string {
  const translated = t(key)
  if (translated && translated !== key) {
    return translated
  }
  return fallback
}

function handleBack() {
  router.push('/home')
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
  <div class="mtt-list-page themeType2" @back="handleBack">
    <div class="bg-overlay"></div>

    <HeaderBack :title="t('UIHomeMttArea')" extra-padding>
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
    <FilterTabbar v-if="showMttTabs" v-model="activeTab" :tabs="mttTabs" />
    <MttContent :active-tab="activeTab" :class="{ 'mtt-content--no-tabs': !showMttTabs }" />
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
    background-image: url('@/assets/images/main_bg_light.png');
  }
}

.bg-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 15% 92%, rgba(255, 173, 212, 0.32), transparent 34%),
    radial-gradient(circle at 88% 84%, rgba(102, 227, 255, 0.28), transparent 34%),
    radial-gradient(circle at 50% 56%, rgba(255, 255, 255, 0.12), transparent 48%);

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
}

// tab 隐藏时列表不再有 tabbar 的外边距，补一点与 header 的间距。
.mtt-list-page :deep(.mtt-content--no-tabs) {
  margin-top: 0.3rem;
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
</style>
