<script setup lang="ts">
import { computed } from 'vue'
import HomeQuickActions from '@/components/Home/HomeQuickActions.vue'
import MttContent from '@/components/Mtt/MttContent.vue'
import ThemeQuickSwitch from '@/components/ThemeQuickSwitch.vue'
import { t } from '@/i18n'
import { theme } from '@/utils/theme'
import imgPokerSpadeDark from '@/assets/icons/club_poker_spade.svg'
import imgPokerSpadeLight from '@/assets/icons/club_poker_spade_light.svg'
import imgPokerHeartDark from '@/assets/icons/club_poker_heart.svg'
import imgPokerHeartLight from '@/assets/icons/club_poker_heart_light.svg'
import imgPokerClubDark from '@/assets/icons/club_poker_club.svg'
import imgPokerClubLight from '@/assets/icons/club_poker_club_light.svg'
import imgPokerDiamondDark from '@/assets/icons/club_poker_diamond.svg'
import imgPokerDiamondLight from '@/assets/icons/club_poker_diamond_light.svg'

const isLightTheme = computed(() => theme.value === 'light')
const dividerIcons = computed(() =>
  isLightTheme.value
    ? [imgPokerSpadeLight, imgPokerHeartLight, imgPokerClubLight, imgPokerDiamondLight]
    : [imgPokerSpadeDark, imgPokerHeartDark, imgPokerClubDark, imgPokerDiamondDark],
)

</script>

<template>
  <div class="home-new-page">
    <header class="home-new-header title-bar main-primary-header">
      <h1 class="home-new-title title">{{ t('UITabbarMatch') }}</h1>
      <ThemeQuickSwitch class="home-new-theme-switch" />
    </header>

    <HomeQuickActions />

    <section class="home-new-divider" aria-hidden="true">
      <span class="home-new-divider__line"></span>
      <img v-for="(icon, index) in dividerIcons" :key="index" class="home-new-divider__icon" :src="icon" alt="" />
      <span class="home-new-divider__line"></span>
    </section>

    <section class="home-new-mtt">
      <MttContent embedded scroll-key="official-home-mtt" />
    </section>
  </div>
</template>

<style scoped lang="scss">
.home-new-page {
  width: 100%;
  min-height: 100%;
  padding-top: 0.2rem;
  color: #fff;
}

.home-new-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  padding: 0 0.78rem;
}

.home-new-title {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 510;
  line-height: 1.2;
  text-shadow: 0 0.22rem 0.5rem rgba(0, 0, 0, 0.35);
}

.home-new-divider {
  display: flex;
  align-items: center;
  gap: 0.14rem;
  margin: 0.02rem 0.68rem 0.14rem;
}

.home-new-divider__line {
  height: 0.02rem;
  flex: 1;
  background: rgba(255, 255, 255, 0.15);
}

.home-new-divider__icon {
  width: 0.445rem;
  height: 0.445rem;
  flex: 0 0 0.445rem;
  object-fit: contain;
}

.home-new-mtt {
  padding: 0 0.38rem 0.5rem;
}

.home-new-mtt :deep(.mtt-content) {
  padding: 0;
}

:root[data-theme='light'] .home-new-page {
  color: #1f2429;
}

:root[data-theme='light'] .home-new-divider__line {
  background: rgba(31, 36, 41, 0.15);
}
</style>
