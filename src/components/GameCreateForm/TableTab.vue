<script setup lang="ts">
import { computed } from 'vue'
import FilterTabbar, { type FilterTabOption } from '@/components/Tabbar/FilterTabbar.vue'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'

type TableTabSvgIconName = 'table' | 'microphone' | 'video'

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

function resolveSvgIcon(iconName: string): TableTabSvgIconName | '' {
  const iconMap: Record<string, TableTabSvgIconName> = {
    icon_table: 'table',
    icon_audio: 'microphone',
    icon_video: 'video',
  }
  return iconMap[iconName] || ''
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
        <AppSvgIcon
          v-if="resolveSvgIcon((tab as TabOption).icon || '')"
          :name="resolveSvgIcon((tab as TabOption).icon || '') || 'table'"
          class="table-tab__icon"
        />
        <img
          v-else-if="(tab as TabOption).icon"
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
@use '@/styles/mixins' as *;

.table-tab {
  padding: 0.15rem 0;
}

.table-tab--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.table-tab :deep(.filter-tabbar) {
  margin: 0;

  @include theme-light {
    background: rgba(134, 134, 134, 0.22);
  }
}

.table-tab__icon {
  width: 0.55rem;
  height: 0.55rem;
  object-fit: contain;
  color: #fff;

  @include theme-light {
    color: #000;
  }
}

.table-tab__text {
  font-size: 0.4rem;
  font-weight: 400;
  line-height: 1;
  color: rgba(255, 255, 255, 1);

  @include theme-light {
    color: var(--c-text);
  }
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

.table-tab :deep(.filter-tab__item--active) {
  @include theme-light {
    border-color: #fff;
    background: #fff;
  }
}
</style>
