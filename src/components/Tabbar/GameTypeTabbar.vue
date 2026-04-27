<script setup lang="ts">
import tabActiveBg from '@/assets/images/game_type_tab_active_bg.svg?url'
import tabActiveLgBg from '@/assets/images/game_type_tab_active_lg_bg.svg?url'

export interface TabOption {
  name: string
  title: string
}

export type GameTypeTabbarSize = 'md' | 'lg'

interface Props {
  modelValue: string
  tabs: TabOption[]
  size?: GameTypeTabbarSize
}

const props = withDefaults(defineProps<Props>(), {
  // 默认普通尺寸，不传 size 时保持现有页面行为不变。
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const tabOptions = computed(() => props.tabs)

const tabbarStyle = computed<Record<string, string>>(() => {
  // 根据 size 切换激活态背景图：普通版 / 大号版。
  const activeBg = props.size === 'lg' ? tabActiveLgBg : tabActiveBg
  return {
    '--tab-active-bg': `url("${activeBg}")`,
  }
})

function handleUpdate(value: string | number): void {
  emit('update:modelValue', String(value))
}
</script>

<script lang="ts">
import { computed } from 'vue'
export default { name: 'GameTypeTabbar' }
</script>

<template>
  <VanTabs
    :model-value="props.modelValue"
    :border="false"
    line-width="0"
    line-height="0"
    animated
    color="#ffffff"
    background="transparent"
    title-active-color="#ffffff"
    title-inactive-color="rgba(255, 255, 255, 0.65)"
    :class="['room-tabs', props.size === 'lg' ? 'room-tabs--lg' : '']"
    :style="tabbarStyle"
    @update:model-value="handleUpdate"
  >
    <VanTab
      v-for="tab in tabOptions"
      :key="tab.name"
      :name="tab.name"
      :title="tab.title"
    />
  </VanTabs>
</template>

<style lang="scss">
.room-tabs {
  --tab-active-bg: none;
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
  background:
    center calc(100% + var(--tab-active-offset-y)) /
    100% var(--tab-active-height) no-repeat;
  background-image: var(--tab-active-bg);
}
</style>
