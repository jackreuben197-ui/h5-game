<script setup lang="ts" generic="T extends string | number">
import { computed, ref } from 'vue'
import chevronDown from '@/assets/channelC/chevron-down.svg'
import { toggleFilterValue, type ChannelCFilterOption } from '@/features/channelC/filters'

const props = defineProps<{ allLabel: string; options: ChannelCFilterOption<T>[] }>()
const selected = defineModel<T[]>({ required: true })
const expanded = ref(false)
const label = computed(() =>
  selected.value.length
    ? props.options
        .filter((option) => selected.value.includes(option.value))
        .map((option) => option.label)
        .join(' / ')
    : props.allLabel,
)

function selectAll() {
  selected.value = []
  expanded.value = false
}
</script>

<template>
  <VanPopover
    v-model:show="expanded"
    placement="bottom-start"
    trigger="click"
    theme="light"
    :show-arrow="false"
    :offset="[0, 4]"
    :style="{
      '--van-popover-radius': '0.44rem',
      '--van-popover-light-background': '#fff',
      '--van-popover-light-text-color': '#000',
    }"
  >
    <template #reference>
      <button
        type="button"
        class="c-multiselect"
        :class="{ selected: selected.length }"
        :aria-expanded="expanded"
        :aria-label="label"
        :title="label"
        @keydown.esc="expanded = false"
      >
        <span>{{ label }}</span>
        <img class="c-multiselect-chevron" :class="{ expanded }" :src="chevronDown" alt="" />
      </button>
    </template>
    <div
      class="c-dropdown-options"
      role="group"
      :aria-label="allLabel"
      @keydown.esc="expanded = false"
    >
      <button
        type="button"
        class="c-dropdown-option"
        :aria-pressed="!selected.length"
        @click="selectAll"
      >
        <span>{{ allLabel }}</span>
        <van-icon v-if="!selected.length" name="success" />
      </button>
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="c-dropdown-option"
        :aria-pressed="selected.includes(option.value)"
        @click="selected = toggleFilterValue(selected, option.value)"
      >
        <span>{{ option.label }}</span>
        <van-icon v-if="selected.includes(option.value)" name="success" />
      </button>
    </div>
  </VanPopover>
</template>

<style scoped lang="scss">
.c-multiselect {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.06rem;
  min-width: 1.87rem;
  max-width: 2.7rem;
  padding: 0.227rem 0.22rem;
  border: 0;
  border-radius: 0.44rem;
  background: #fff;
  color: #000;
  font: inherit;
  font-size: 0.29rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &.selected {
    background: #02cfbb;
    color: #fff;
  }
}
.c-multiselect-chevron {
  flex: none;
  width: 0.264rem;
  height: 0.264rem;
  transition: transform 0.15s ease;

  &.expanded {
    transform: rotate(180deg);
  }
}
.c-dropdown-options {
  min-width: 1.87rem;
  max-width: min(7rem, calc(100vw - 0.5rem));
  max-height: min(9rem, 55vh);
  box-sizing: border-box;
  overflow-y: auto;
  padding: 0.064rem 0.22rem;
}
.c-dropdown-option {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.15rem;
  width: 100%;
  padding: 0.1635rem 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.29rem;
  font-weight: 700;
  line-height: 1;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;

  & + &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(0, 0, 0, 0.6);
    transform: scaleY(0.2);
  }
  .van-icon {
    flex: none;
  }
  &[aria-pressed='true'] {
    color: #02cfbb;
  }
}
</style>
