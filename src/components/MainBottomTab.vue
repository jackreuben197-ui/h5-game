<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMainTabsStore, type MainTabKey } from '@/stores/mainTabs'

interface TabItem {
  key: MainTabKey
  label: string
  path: string
}

// 底部 5 个主模块入口与路由路径。
const tabs: TabItem[] = [
  { key: 'home', label: '首页', path: '/home' },
  { key: 'club', label: '俱乐部', path: '/club' },
  { key: 'recharge', label: '充值', path: '/recharge' },
  { key: 'message', label: '消息', path: '/message' },
  { key: 'mine', label: '我的', path: '/mine' },
]

const router = useRouter()
const tabsStore = useMainTabsStore()

// 当前激活项索引，用于计算“凸起背景”的横向位置。
const activeIndex = computed(() => {
  const index = tabs.findIndex((item) => item.key === tabsStore.activeTab)
  return index >= 0 ? index : 0
})

// 把激活项索引挂到 CSS 变量，让伪元素可平滑移动。
const tabStyle = computed(() => ({
  '--active-index': String(activeIndex.value),
}))

function onTabClick(tab: TabItem): void {
  tabsStore.setActiveTab(tab.key)
  void router.push(tab.path)
}
</script>

<template>
  <nav class="bottom-tab" :style="tabStyle" aria-label="底部切换栏">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="tab-button"
      :class="{ 'is-active': tabsStore.activeTab === tab.key }"
      @click="onTabClick(tab)"
    >
      <span class="tab-icon" aria-hidden="true">
        <svg v-if="tab.key === 'home'" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-9Z" />
        </svg>
        <svg v-else-if="tab.key === 'club'" viewBox="0 0 24 24" fill="currentColor">
          <path d="m4 6 4.8 4.2L12 6l3.2 4.2L20 6l-1.7 12.2A2 2 0 0 1 16.3 20H7.7a2 2 0 0 1-2-1.8L4 6Z" />
          <circle cx="12" cy="13.3" r="1.9" fill="#1e5d74" />
        </svg>
        <svg v-else-if="tab.key === 'recharge'" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v7A2.5 2.5 0 0 1 18.5 18h-13A2.5 2.5 0 0 1 3 15.5v-7Z" />
          <circle cx="17.2" cy="12" r="2.4" fill="#1e5d74" />
        </svg>
        <svg v-else-if="tab.key === 'message'" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 8a5 5 0 0 1 5-5h8a5 5 0 0 1 0 10h-1.5l-3.6 2.6a1 1 0 0 1-1.58-.81V13H8a5 5 0 0 1-5-5Z" />
          <path d="M12 13h4a4 4 0 0 1 0 8h-1.2l-2.8 2a1 1 0 0 1-1.58-.81V21H9a4 4 0 0 1-4-4v-.4A6.9 6.9 0 0 0 8 17h4v-4Z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20a8 8 0 0 1 16 0v1H4v-1Z" />
        </svg>
      </span>
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped lang="scss">
.bottom-tab {
  position: fixed;
  left: 0.3rem;
  right: 0.3rem;
  bottom: calc(env(safe-area-inset-bottom) + 0.28rem);
  z-index: 24;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.08rem;
  height: 2.08rem;
  padding: 0.16rem 0.18rem;
  border: 0.03rem solid rgba(236, 244, 255, 0.45);
  border-radius: 99rem;
  background:
    linear-gradient(92deg, rgba(129, 70, 124, 0.55) 0%, rgba(42, 123, 164, 0.62) 55%, rgba(24, 111, 146, 0.7) 100%),
    rgba(12, 32, 56, 0.35);
  box-shadow:
    0 -0.06rem 0.4rem rgba(145, 205, 250, 0.16) inset,
    0 0.14rem 0.4rem rgba(0, 26, 40, 0.32);
  backdrop-filter: blur(0.14rem);
  overflow: visible;
}

/* 激活项的大背景：通过伪元素做“向上凸起”的胶囊块。 */
.bottom-tab::before {
  content: '';
  position: absolute;
  top: -0.18rem;
  left: calc(0.18rem + ((100% - 0.36rem) / 5) * var(--active-index));
  width: calc((100% - 0.36rem) / 5 - 0.08rem);
  height: 1.82rem;
  border-radius: 0.58rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.12) 100%);
  border: 0.02rem solid rgba(255, 255, 255, 0.32);
  box-shadow:
    0 0.14rem 0.3rem rgba(0, 22, 38, 0.26),
    0 -0.04rem 0.18rem rgba(194, 228, 255, 0.34) inset;
  transition: left 0.28s ease;
  pointer-events: none;
}

.tab-button {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.12rem;
  color: rgba(250, 252, 255, 0.84);
  padding: 0.08rem 0.06rem;
  border-radius: 0.44rem;
  -webkit-tap-highlight-color: transparent;
}

.tab-button.is-active {
  color: #ffffff;
}

.tab-icon {
  width: 0.68rem;
  height: 0.68rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tab-icon svg {
  width: 100%;
  height: 100%;
}

.tab-label {
  font-size: 0.42rem;
  line-height: 1;
  font-weight: 500;
}
</style>
