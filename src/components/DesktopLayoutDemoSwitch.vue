<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type DesktopLayoutMode = 'bounded' | 'ratio' | 'fluid' | 'phone'

interface LayoutOption {
  mode: DesktopLayoutMode
  label: string
  hint: string
}

const options: LayoutOption[] = [
  { mode: 'bounded', label: '推荐容器', hint: '最大 1600 × 1000' },
  { mode: 'ratio', label: '固定宽高比', hint: '固定 16:10，最大 1600 × 1000' },
  { mode: 'fluid', label: '全屏拉伸', hint: '铺满浏览器' },
  { mode: 'phone', label: '手机框', hint: '原 480px 方案' },
]

const route = useRoute()
const router = useRouter()

const isGuestRoute = computed(() => String(route.name || '').startsWith('guest-'))
const activeMode = computed<DesktopLayoutMode>(() => {
  const queryMode = route.query.desktop
  if (
    queryMode === 'ratio' ||
    queryMode === 'fluid' ||
    queryMode === 'phone' ||
    queryMode === 'bounded'
  ) {
    return queryMode
  }
  return 'bounded'
})

function applyLayoutAttributes(): void {
  const root = document.documentElement
  const guestDesktop = isGuestRoute.value
  root.dataset.desktopLayout = guestDesktop ? activeMode.value : 'phone'
  if (guestDesktop) {
    root.setAttribute('data-guest-desktop', '1')
  } else {
    root.removeAttribute('data-guest-desktop')
  }

  window.requestAnimationFrame(() => {
    window.dispatchEvent(new Event('h5:desktop-layout-change'))
    window.dispatchEvent(new Event('resize'))
  })
}

function selectMode(mode: DesktopLayoutMode): void {
  void router.replace({
    query: {
      ...route.query,
      desktop: mode,
    },
  })
}

watch([isGuestRoute, activeMode], applyLayoutAttributes, { immediate: true })

onBeforeUnmount(() => {
  const root = document.documentElement
  root.dataset.desktopLayout = 'phone'
  root.removeAttribute('data-guest-desktop')
  window.dispatchEvent(new Event('h5:desktop-layout-change'))
  window.dispatchEvent(new Event('resize'))
})
</script>

<template>
  <aside v-if="isGuestRoute" class="desktop-layout-demo" aria-label="桌面布局 Demo">
    <span class="desktop-layout-demo__title">桌面 Demo</span>
    <div class="desktop-layout-demo__options">
      <button
        v-for="option in options"
        :key="option.mode"
        type="button"
        class="desktop-layout-demo__button"
        :class="{ 'is-active': activeMode === option.mode }"
        :aria-pressed="activeMode === option.mode"
        :title="option.hint"
        @click="selectMode(option.mode)"
      >
        {{ option.label }}
      </button>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.desktop-layout-demo {
  display: none;
}

@media (min-width: 600px) {
  .desktop-layout-demo {
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px 7px 10px;
    border: 1px solid rgba(255, 255, 255, 0.58);
    border-radius: 14px;
    color: #fff;
    background: rgba(20, 23, 31, 0.78);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .desktop-layout-demo__title {
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }

  .desktop-layout-demo__options {
    display: flex;
    gap: 4px;
  }

  .desktop-layout-demo__button {
    min-height: 30px;
    padding: 0 10px;
    border: 0;
    border-radius: 9px;
    color: rgba(255, 255, 255, 0.74);
    background: transparent;
    font-size: 12px;
    line-height: 1;
    cursor: pointer;
    white-space: nowrap;

    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    &.is-active {
      color: #101820;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
    }
  }
}
</style>
