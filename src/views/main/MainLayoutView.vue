<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import { useMainTabsStore, type MainTabKey } from '@/stores/mainTabs'
import { useGameStore } from '@/stores/game'

const route = useRoute()
const tabsStore = useMainTabsStore()
const gameStore = useGameStore()

// 背景素材由 CSS 根据 data-theme 选择，切换主题时无需重建页面。
const backgroundStyle = computed(() => ({
  '--main-bg-dark': `url(${mainBgUrl})`,
  '--main-bg-light': `url(${mainBgLightUrl})`,
}))

const isHomeRoute = computed(() => route.name === 'lobby')
const isPrimaryLayout = computed(() => route.meta.desktopLayout === 'primary')
const isGuestPreview = computed(() => !gameStore.isRealUser)

// 路由变化时同步底部 Tab 共享状态，确保子页面也能维持正确高亮。
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
      'main-layout--guest': isGuestPreview,
      'main-layout--authenticated': isPrimaryLayout && !isGuestPreview,
    }"
    :style="backgroundStyle"
  >
    <div class="main-layout-content">
      <!-- 子模块页面内容区域：由路由子页面渲染。 -->
      <section class="module-slot">
        <RouterView />
      </section>
    </div>
    <!-- 公共底部导航：跨模块复用。 -->
    <MainBottomTab />
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

// 首页的深色方案仍使用白底；浅色方案才切换到浅色主题背景图。
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
  // 统一作为“页面滚动容器”：在 html/body fixed 的场景下也可稳定滚动。
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
  // 子页面容器只负责承载内容，不再单独接管滚动。
  flex: 1;
  min-height: 0;
}
</style>
