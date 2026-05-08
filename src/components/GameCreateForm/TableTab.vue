<script setup lang="ts">
import { computed } from 'vue'
import FilterTabbar, { type FilterTabOption } from '@/components/Tabbar/FilterTabbar.vue'

interface Option {
  text: string
  value: string | number
  button?: string
  icon?: string
}

interface TabOption extends FilterTabOption {
  icon?: string
}

interface Props {
  modelValue: string | number
  options: Option[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number]
}>()

const tabs = computed<TabOption[]>(() =>
  props.options.map((option) => ({
    name: String(option.value),
    title: option.text,
    icon: option.button || option.icon || '',
  })),
)

const activeName = computed(() => String(props.modelValue))

const getIcon = (name: string) => {
  return new URL(`../../assets/icons/${name}.png`, import.meta.url).href
}

function resolveIcon(iconName: string): string {
  if (!iconName) return ''
  if (iconName.startsWith('http://') || iconName.startsWith('https://')) {
    return iconName
  }
  if (iconName.startsWith('/') || iconName.startsWith('data:')) {
    return iconName
  }
  return getIcon(iconName)
}

function onTabChange(nextName: string): void {
  if (props.disabled) return
  const selected = props.options.find((option) => String(option.value) === nextName)
  if (!selected) return
  emit('update:modelValue', selected.value)
  emit('change', selected.value)
}
</script>

<template>
  <div :class="['table-tab', { 'table-tab--disabled': disabled }]">
    <FilterTabbar
      :model-value="activeName"
      :tabs="tabs"
      @update:model-value="onTabChange"
    >
      <template #tab="{ tab }">
        <img
          v-if="(tab as TabOption).icon"
          :src="resolveIcon((tab as TabOption).icon || '')"
          class="table-tab__icon"
          alt=""
        />
        <span
          v-if="(tab as TabOption).title"
          class="table-tab__text"
        >
          {{ (tab as TabOption).title }}
        </span>
      </template>
    </FilterTabbar>
  </div>
</template>

<style scoped lang="scss">
.table-tab {
  padding: 0.15rem 0;
}

.table-tab--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.table-tab :deep(.filter-tabbar) {
  margin: 0;
}

.table-tab__icon {
  width: 0.55rem;
  height: 0.55rem;
  object-fit: contain;
}

.table-tab__text {
  font-size: 0.4rem;
  font-weight: 400;
  line-height: 1;
  color: rgba(255, 255, 255, 1);
}

.table-tab :deep(.inner-content) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
}

.table-tab :deep(.filter-tab__item--active) .table-tab__text {
  font-weight: 700;
}
</style>
