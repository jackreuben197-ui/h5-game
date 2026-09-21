<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { FilterTabOption } from '@/components/Tabbar/FilterTabbar.vue'
import ChannelClubInfoPanel from '@/components/Club/ChannelClubInfoPanel.vue'
import ChannelClubManageFloatingButton from '@/components/Club/ChannelClubManageFloatingButton.vue'
import ClubIntroductionBar from '@/components/Club/ClubIntroductionBar.vue'
import HomeBannerSwiper from '@/components/HomeBannerSwiper.vue'
import HomeTopBar from '@/components/HomeTopBar.vue'
import MainBottomTab from '@/components/Tabbar/MainBottomTab.vue'
import { useLobbyBannerImages } from '@/composables/useLobbyBannerImages'
import { t } from '@/i18n'
import { ensureExperienceSession } from '@/session/experienceSession'
import { useMttListStore } from '@/stores/mttList'

type MttTabName = 'all' | 'poker' | 'mahjong'

const activeTab = ref<MttTabName>('all')
const mttListStore = useMttListStore()
const { bannerImages, fetchLobbyBannerImages } = useLobbyBannerImages()

// 目前没有麻将赛事，暂时隐藏「全部 / 扑克赛事」切换 tab。
const showMttTabs = false
const mttTabs = computed<FilterTabOption[]>(() => [
  { name: 'all', title: resolveLabel('UIMatch_GtO8YEdb', t('UIMatch_GtO8YEdb')) },
  { name: 'poker', title: resolveLabel('UIHomePokerArea', t('UIMatchPokerTournament')) },
])

function resolveLabel(key: string, fallback: string): string {
  const translated = t(key)
  return translated && translated !== key ? translated : fallback
}

onMounted(() => {
  void fetchLobbyBannerImages().catch((error) => {
    console.warn('[match-index] fetch lobby banner failed:', error)
  })
  void ensureExperienceSession()
    .catch((error) => {
      console.warn('[match-index] resolve session identity failed:', error)
    })
    .finally(() => mttListStore.bootstrapMttList())
})
</script>

<template>
  <div class="match-page room-list-page themeType2">
    <div class="bg-overlay"></div>

    <div class="match-stage">
      <HomeTopBar standalone sticky />
      <div class="match-banner">
        <HomeBannerSwiper :images="bannerImages" />
      </div>
      <ClubIntroductionBar standalone />
      <ChannelClubInfoPanel class="match-club-info" />
      <FilterTabbar v-if="showMttTabs" v-model="activeTab" :tabs="mttTabs" />
      <MttContent
        embedded
        :active-tab="activeTab"
        scroll-key="match-tab"
        :class="{ 'match-content--no-tabs': !showMttTabs }"
      />
    </div>

    <ChannelClubManageFloatingButton />
    <MainBottomTab />
  </div>
</template>

<style scoped lang="scss">
.match-page {
  position: relative;
  height: 100dvh;
  min-height: 100dvh;
  html[data-channel-package='1'] & {
    height: var(--app-full-height, var(--app-viewport-height, 100dvh));
    min-height: var(--app-full-height, var(--app-viewport-height, 100dvh));
  }
  overflow: hidden;
  color: #fff;
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
}

.match-stage {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior-y: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
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
}

.match-club-info {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  margin: 0.24rem 0.38rem;
}

.match-banner {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  margin: 0.12rem 0.38rem 0;
  overflow: hidden;
  border-radius: 0.8rem;
}

.match-page :deep(.match-content--no-tabs) {
  margin-top: 0.3rem;
}

.match-page :deep(.mtt-content) {
  flex: 1 0 auto;
  min-height: 0;
  max-height: none;
  overflow: visible;
  padding-bottom: calc(env(safe-area-inset-bottom) + 2.5rem);
}

.match-page :deep(.filter-tabbar) {
}

.match-page :deep(.filter-tab__text) {
}

.match-page :deep(.filter-tab__item--active) {
}
</style>
