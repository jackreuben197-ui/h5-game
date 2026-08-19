<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import { useMainTabsStore, type MainTabKey } from '@/stores/mainTabs'
import LoginModal from '@/views/login/LoginModal.vue'

const route = useRoute()
const tabsStore = useMainTabsStore()

// ΦâîµÖ»τ┤áµ¥Éτö▒ CSS µá╣µì« data-theme ΘÇëµï⌐∩╝îσêçµìóΣ╕╗Θóÿµù╢µùáΘ£ÇΘçìσ╗║Θí╡Θ¥óπÇé
const backgroundStyle = computed(() => ({
  '--main-bg-dark': `url(${mainBgUrl})`,
  '--main-bg-light': `url(${mainBgLightUrl})`,
}))

const isHomeRoute = computed(() => route.name === 'lobby' || route.name === 'guest-home')
const isPrimaryLayout = computed(() => route.meta.desktopLayout === 'primary')
const isGuestRoute = computed(() => String(route.name ?? '').startsWith('guest-'))

// Φ╖»τö▒σÅÿσîûµù╢σÉîµ¡Ñσ║òΘâ¿ Tab σà▒Σ║½τè╢µÇü∩╝îτí«Σ┐¥σ¡ÉΘí╡Θ¥óΣ╣ƒΦâ╜τ╗┤µîüµ¡úτí«Θ½ÿΣ║«πÇé
watch(
  () => route.meta.tabKey,
  (tabKey) => {
    if (typeof tabKey === 'string') {
      tabsStore.setActiveTab(tabKey as MainTabKey)
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    class="main-layout"
    :class="{
      'main-layout--home': isHomeRoute,
      'main-layout--primary': isPrimaryLayout,
      'main-layout--guest': isGuestRoute,
      'main-layout--authenticated': isPrimaryLayout && !isGuestRoute,
    }"
    :style="backgroundStyle"
  >
    <div class="main-layout-content">
      <!-- σ¡Éµ¿íσ¥ùΘí╡Θ¥óσåàσ«╣σî║σƒƒ∩╝Üτö▒Φ╖»τö▒σ¡ÉΘí╡Θ¥óµ╕▓µƒôπÇé -->
      <section class="module-slot">
        <RouterView />
      </section>
    </div>
    <!-- σà¼σà▒σ║òΘâ¿σ»╝Φê¬∩╝ÜΦ╖¿µ¿íσ¥ùσñìτö¿πÇé -->
    <MainBottomTab />
    <LoginModal />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.main-layout {
  position: relative;
  min-height: var(--app-full-height, var(--app-viewport-height, 100dvh));
  background-image: var(--main-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    background-color: var(--c-page);
    background-image: var(--main-bg-light);
  }
}

// ΘªûΘí╡τÜäµ╖▒Φë▓µû╣µíêΣ╗ìΣ╜┐τö¿τÖ╜σ║ò∩╝¢µ╡àΦë▓µû╣µíêµëìσêçµìóσê░µ╡àΦë▓Σ╕╗ΘóÿΦâîµÖ»σ¢╛πÇé
.main-layout--home {
  background-color: #fff;
  background-image: none;

  @include theme-light {
    background-color: var(--c-page);
    background-image: var(--main-bg-light);
  }
}

.main-layout-content {
  position: relative;
  z-index: 2;
  // τ╗ƒΣ╕ÇΣ╜£Σ╕║ΓÇ£Θí╡Θ¥óµ╗Üσè¿σ«╣σÖ¿ΓÇ¥∩╝Üσ£¿ html/body fixed τÜäσ£║µÖ»Σ╕ïΣ╣ƒσÅ»τ¿│σ«Üµ╗Üσè¿πÇé
  height: var(--app-full-height, var(--app-viewport-height, 100dvh));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior-y: none;
  padding: calc(var(--app-content-safe-area-top, env(safe-area-inset-top)) + 0.4rem) 0rem calc(env(safe-area-inset-bottom) + 2.72rem);
}

.module-slot {
  // σ¡ÉΘí╡Θ¥óσ«╣σÖ¿σÅ¬Φ┤ƒΦ┤úµë┐Φ╜╜σåàσ«╣∩╝îΣ╕ìσåìσìòτï¼µÄÑτ«íµ╗Üσè¿πÇé
  flex: 1;
  min-height: 0;
}
</style>
