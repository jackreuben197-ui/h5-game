<script setup lang="ts">
import { computed } from 'vue'
import tabActiveBg from '@/assets/images/game_type_tab_active_bg.svg?url'
import tabActiveLgBg from '@/assets/images/game_type_tab_active_lg_bg.svg?url'
import tabActiveLightMask from '@/assets/images/game_type_tab_active_light_mask.svg?url'
import tabActiveLgLightMask from '@/assets/images/game_type_tab_active_lg_light_mask.svg?url'
import { showGameToast } from '@/components/Toast'

export interface TabOption {
  name: string
  title: string
  disabled?: boolean
  disabledToast?: string
  [key: string]: unknown
}

export type GameTypeTabbarSize = 'md' | 'lg'

interface Props {
  modelValue: string
  tabs: TabOption[]
  size?: GameTypeTabbarSize
  forceLight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  // 默认普通尺寸，不传 size 时保持现有页面行为不变。
  size: 'md',
  forceLight: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const tabOptions = computed(() => props.tabs)

const tabbarStyle = computed<Record<string, string>>(() => {
  // 根据 size 切换激活态背景图：普通版 / 大号版。
  const activeBg = props.size === 'lg' ? tabActiveLgBg : tabActiveBg
  const activeLightMask = props.size === 'lg' ? tabActiveLgLightMask : tabActiveLightMask
  return {
    '--tab-active-bg': `url("${activeBg}")`,
    '--tab-active-light-mask': `url("${activeLightMask}")`,
  }
})

function handleUpdate(value: string | number): void {
  emit('update:modelValue', String(value))
}

function handleBeforeChange(value: string | number): boolean {
  const targetName = String(value)
  const targetTab = props.tabs.find((tab) => tab.name === targetName)
  if (targetTab?.disabled) {
    if (typeof targetTab.disabledToast === 'string' && targetTab.disabledToast.trim()) {
      showGameToast(targetTab.disabledToast.trim())
    }
    return false
  }
  return true
}
</script>

<script lang="ts">
export default { name: 'GameTypeTabbar' }
</script>

<template>
  <VanTabs
    :active="props.modelValue"
    :border="false"
    line-width="0"
    line-height="0"
    animated
    color="#ffffff"
    background="transparent"
    :title-active-color="props.forceLight ? '#111111' : '#ffffff'"
    :title-inactive-color="props.forceLight ? 'rgba(34, 34, 34, 0.72)' : 'rgba(255, 255, 255, 0.65)'"
    :class="[
      'room-tabs',
      props.size === 'lg' ? 'room-tabs--lg' : '',
      props.forceLight ? 'room-tabs--force-light' : '',
    ]"
    :style="tabbarStyle"
    :before-change="handleBeforeChange"
    @update:active="handleUpdate"
  >
    <VanTab v-for="tab in tabOptions" :key="tab.name" :name="tab.name" :title="tab.title" />
  </VanTabs>
</template>

<style lang="scss">
@use '@/styles/mixins' as *;

.room-tabs {
  --tab-active-bg: none;
  --tab-active-light-mask: none;
  --tab-base-height: 0.9rem;
  --tab-top-cut: 0.25rem;
  --tab-bottom-overlap: 0.01rem;
  --tab-item-padding-x: 0.06rem;
  --tab-text-padding-x: 0.12rem;
  --tab-active-offset-y: 1px;
  --tab-active-overscan: 0px;
  --tab-active-height: 108%;

  position: relative;
  z-index: 1;
  margin-bottom: calc(-1 * var(--tab-bottom-overlap));

  @include theme-light {
    --van-tab-text-color: rgba(34, 34, 34, 0.72);
    --van-tab-active-text-color: #111;
  }
}

.room-tabs .van-tab {
  @include theme-light {
    color: rgba(34, 34, 34, 0.72) !important;
  }
}

.room-tabs .van-tab--active {
  @include theme-light {
    color: #111 !important;
  }
}

.room-tabs--force-light {
  --van-tab-text-color: rgba(34, 34, 34, 0.72);
  --van-tab-active-text-color: #111;
}

.room-tabs--force-light .van-tab {
  color: rgba(34, 34, 34, 0.72) !important;
}

.room-tabs--force-light .van-tab--active {
  color: #111 !important;
}

.room-tabs .van-tabs__wrap {
  height: var(--tab-base-height);
  margin: 0 0.12rem;
  overflow: visible;
}

.room-tabs .van-tabs__nav {
  height: 100%;
  background: transparent;
  overflow: visible;
}

.room-tabs .van-tab {
  height: 100%;
  line-height: 1;
  padding: 0 var(--tab-item-padding-x);
  display: flex;
  align-items: flex-end;
  font-size: 0.35rem;
  font-weight: 600;
}

.room-tabs .van-tab__text {
  width: 100%;
  height: calc(var(--tab-base-height) - var(--tab-top-cut));
  padding: 0 var(--tab-text-padding-x);
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  line-height: 1;
  white-space: nowrap;
}

.room-tabs .van-tabs__line {
  display: none !important;
}

/* 新版激活态背景（SVG 形状背景，不遮挡文字） */
.themeType2 .room-tabs .van-tab--active .van-tab__text {
  background: center calc(100% + var(--tab-active-offset-y)) / 100% var(--tab-active-height)
    no-repeat;
  background-image: var(--tab-active-bg);

  @include theme-light {
    isolation: isolate;
    background-image: none;
  }
}

.themeType2 .room-tabs .van-tab--active .van-tab__text::before {
  @include theme-light {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background: #fff;
    -webkit-mask: var(--tab-active-light-mask) center
      calc(100% + var(--tab-active-offset-y)) / 100% var(--tab-active-height) no-repeat;
    mask: var(--tab-active-light-mask) center calc(100% + var(--tab-active-offset-y)) / 100%
      var(--tab-active-height) no-repeat;
  }
}

.themeType2 .room-tabs.room-tabs--force-light .van-tab--active .van-tab__text {
  isolation: isolate;
  background-image: none;
}

.themeType2 .room-tabs.room-tabs--force-light .van-tab--active .van-tab__text::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: #fff;
  -webkit-mask: var(--tab-active-light-mask) center
    calc(100% + var(--tab-active-offset-y)) / 100% var(--tab-active-height) no-repeat;
  mask: var(--tab-active-light-mask) center calc(100% + var(--tab-active-offset-y)) / 100%
    var(--tab-active-height) no-repeat;
}
</style>
