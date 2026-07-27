<script setup lang="ts">
import { computed, ref } from 'vue'
import FieldTip from './FieldTip.vue'
import icDropdown from '@/assets/icons/icon_dropdown.svg'

interface Option {
  text: string
  value: string | number
}

interface Props {
  label: string
  tip?: string
  modelValue: string | number
  options: Option[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tip: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number]
}>()

const expanded = ref(false)

const displayText = computed(() => {
  const opt = props.options.find((o) => o.value === props.modelValue)
  return opt ? opt.text : ''
})

function onSelectOption(selected: Option) {
  emit('update:modelValue', selected.value)
  emit('change', selected.value)
  expanded.value = false
}

function onPopoverVisibilityChange(next: boolean): void {
  if (props.disabled && next) {
    expanded.value = false
    return
  }
  expanded.value = next
}
</script>

<template>
  <div class="table-select-row">
    <div class="table-select__label">
      <span class="table-select__text">{{ label }}</span>
      <FieldTip :tip="tip" />
    </div>
    <VanPopover
      class="table-select__popover"
      :show="expanded"
      placement="bottom-end"
      theme="dark"
      :show-arrow="false"
      @update:show="onPopoverVisibilityChange"
    >
      <template #reference>
        <div :class="['table-select__field', { 'table-select__field--disabled': disabled }]">
          <span class="table-select__value">{{ displayText }}</span>
          <img
            :src="icDropdown"
            class="table-select__arrow"
            :class="{ 'table-select__arrow--up': expanded }"
            alt=""
          />
        </div>
      </template>
      <div class="table-select__dropdown">
        <button
          v-for="option in options"
          :key="String(option.value)"
          type="button"
          class="table-select__option"
          :class="{ 'table-select__option--active': option.value === modelValue }"
          @click="onSelectOption(option)"
        >
          {{ option.text }}
        </button>
      </div>
    </VanPopover>
  </div>
</template>

<style scoped lang="scss">
.table-select-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 1.15rem;
  position: relative;
  z-index: 1;
}

.table-select__label {
  display: flex;
  align-items: center;
  gap: 0.09rem;
}

.table-select__text {
  font-size: 0.37rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;
}

.table-select__field {
  min-width: 2.27rem;
  height: 0.93rem;
  background: rgba(34, 34, 34, 0.6);
  border-radius: 1.55rem;
  padding: 0 0.28rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.11rem;
  cursor: pointer;

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.table-select__value {
  min-width: 1.3rem;
  text-align: center;
  font-size: 0.37rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;
}

.table-select__arrow {
  width: 0.3rem;
  height: 0.3rem;
  transition: transform 0.2s ease;
}

.table-select__arrow--up {
  transform: rotate(180deg);
}

.table-select__dropdown {
  min-width: 2.27rem;
  max-width: 4.4rem;
  max-height: 3.5rem;
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  padding: 0.14rem;
  border-radius: 0.18rem;
  background: rgba(20, 24, 28, 0.96);
  box-shadow: 0 0.1rem 0.28rem rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
  z-index: 120;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.table-select__dropdown::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.table-select__popover {
  :deep(.van-popover__wrapper) {
    display: block;
  }

  :deep(.van-popover__content) {
    padding: 0;
  }

  :deep(.van-popover__arrow) {
    display: none !important;
  }
}

.table-select__option {
  width: 100%;
  border: none;
  border-radius: 0.14rem;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  font-size: 0.29rem;
  line-height: 1;
  padding: 0.14rem 0.2rem;
  text-align: left;
}

.table-select__option--active {
  background: #78E490;
  color: #08392d;
}
</style>

<style lang="scss">
:root[data-theme='light'] .table-select-row {
  .table-select__text,
  .table-select__value {
    color: rgba(15, 8, 8, 0.85);
  }

  .table-select__field {
    background: rgba(0, 0, 0, 0.15);
  }

  .table-select__arrow {
    filter: invert(1);
  }

  .table-select__dropdown {
    background: rgba(255, 255, 255, 0.96);
    border-color: rgba(0, 0, 0, 0.12);
  }

  .table-select__option {
    background: rgba(0, 0, 0, 0.06);
    color: rgba(15, 8, 8, 0.85);
  }

  .table-select__option--active {
    background: #78e490;
    color: #08392d;
  }
}
</style>
