<script setup lang="ts">
import tabMaskImage from '@/assets/icons/game_type_tab_bg.png'

interface TabOption {
  name: 'all' | 'texas' | 'omaha' | 'sixPlus'
  title: string
}

interface Props {
  modelValue: TabOption['name']
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: TabOption['name']]
}>()

// 牌局筛选固定为 4 个类型，组件内统一维护。
const TAB_OPTIONS: TabOption[] = [
  { name: 'all', title: '全部' },
  { name: 'texas', title: '德州' },
  { name: 'omaha', title: '奥马哈' },
  { name: 'sixPlus', title: '6+' },
]

const tabbarStyle = {
  '--default-tab-mask': `url(${tabMaskImage})`,
}

function handleUpdate(value: string | number): void {
  emit('update:modelValue', value as TabOption['name'])
}
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
    class="room-tabs"
    :style="tabbarStyle"
    @update:model-value="handleUpdate"
  >
    <VanTab
      v-for="tab in TAB_OPTIONS"
      :key="tab.name"
      :name="tab.name"
      :title="tab.title"
    />
  </VanTabs>
</template>

<style lang="scss">
.room-tabs {
  --tab-base-height: 0.9rem;
  --tab-top-cut: 0.15rem;
  --tab-bottom-overlap: 0.13rem;
  --tab-item-padding-x: 0.06rem;
  --tab-text-padding-x: 0.12rem;

  position: relative;
  z-index: 1;
  margin-bottom: calc(-1 * var(--tab-bottom-overlap));
}

.room-tabs .van-tabs__wrap {
  margin: 0 0.12rem;
  overflow: visible;
}

.room-tabs .van-tabs__nav {
  background: transparent;
  overflow: visible;
}

.room-tabs .van-tab {
  height: var(--tab-base-height);
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
  white-space: nowrap;
}

.room-tabs .van-tabs__line {
  display: none !important;
}

.themeType2 .room-tabs .van-tab--active .van-tab__text {
  background: rgba(255, 255, 255, 0.15);
  -webkit-mask: center bottom / 100% 100% no-repeat;
  -webkit-mask-image: var(--tab-bg, var(--default-tab-mask));
  mask: center bottom / 100% 100% no-repeat;
  mask-image: var(--tab-bg, var(--default-tab-mask));
}
</style>
