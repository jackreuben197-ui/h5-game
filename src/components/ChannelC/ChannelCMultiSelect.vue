<script setup lang="ts" generic="T extends string | number">
import { computed, ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { toggleFilterValue, type ChannelCFilterOption } from '@/features/channelC/filters'

const props = defineProps<{ allLabel: string; options: ChannelCFilterOption<T>[] }>()
const selected = defineModel<T[]>({ required: true })
const expanded = ref(false)
const { isDark } = useTheme()
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
    :theme="isDark ? 'dark' : 'light'"
    :show-arrow="false"
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
        <van-icon :name="expanded ? 'arrow-up' : 'arrow-down'" />
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
@use '@/styles/mixins' as *;

.c-multiselect {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.06rem;
  min-width: 1.87rem;
  max-width: 2.7rem;
  padding: 0.227rem 0.22rem;
  border: 0;
  border-radius: 0.44rem;
  background: #ffffff30;
  color: #fff;
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
  .van-icon {
    flex: none;
  }
  @include theme-light {
    background: #fff;
    color: #17191e;
  }
  &.selected {
    background: #69beff;
    color: #fff;
  }
}
.c-dropdown-options {
  min-width: 3.5rem;
  max-width: min(7rem, calc(100vw - 0.5rem));
  max-height: min(9rem, 55vh);
  overflow-y: auto;
  padding: 0.14rem;
}
.c-dropdown-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.2rem;
  width: 100%;
  padding: 0.25rem;
  border: 0;
  border-radius: 0.14rem;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.32rem;
  text-align: left;
  overflow-wrap: anywhere;
  cursor: pointer;

  .van-icon {
    flex: none;
  }
  &[aria-pressed='true'] {
    background: #69beff30;
    color: #69beff;
  }
}
</style>
