<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { useMainTabsStore, type MainTabKey } from '@/stores/mainTabs'

const route = useRoute()
const tabsStore = useMainTabsStore()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

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
  <div class="main-layout" :style="backgroundStyle">
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
.main-layout {
  position: relative;
  min-height: 100dvh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.main-layout-content {
  position: relative;
  z-index: 2;
  // 统一作为“页面滚动容器”：在 html/body fixed 的场景下也可稳定滚动。
  height: 100dvh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior-y: contain;
  padding: calc(env(safe-area-inset-top) + 0.4rem) 0rem calc(env(safe-area-inset-bottom) + 2.72rem);
}

.module-slot {
  // 子页面容器只负责承载内容，不再单独接管滚动。
  flex: 1;
  min-height: 0;
}
</style>
