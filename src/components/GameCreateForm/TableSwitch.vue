<script setup lang="ts">
import FieldTip from './FieldTip.vue'

interface Props {
  label: string
  tip?: string
  modelValue: boolean | string | number
  disabled?: boolean
  activeValue?: boolean | string | number
  inactiveValue?: boolean | string | number
}

const props = withDefaults(defineProps<Props>(), {
  tip: '',
  disabled: false,
  activeValue: true,
  inactiveValue: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | string | number]
  change: [value: boolean | string | number]
}>()

function onChange(value: boolean | string | number) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <div class="table-switch-row">
    <div class="table-switch__label">
      <span class="table-switch__text">{{ label }}</span>
      <FieldTip :tip="tip" />
    </div>
    <VanSwitch
      :model-value="modelValue"
      :disabled="disabled"
      :active-value="activeValue"
      :inactive-value="inactiveValue"
      inactive-color="rgba(255, 255, 255, 0.17)"
      class="table-switch__switch"
      @update:model-value="onChange"
    />
  </div>
</template>

<style scoped lang="scss">
.table-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 1.15rem;
  position: relative;

  & + .table-switch-row::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0.51rem;
    right: 0.51rem;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
  }
}

.table-switch__label {
  display: flex;
  align-items: center;
  gap: 0.09rem;
}

.table-switch__text {
  font-size: 0.37rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;
}

.table-switch__switch {
  --van-switch-size: 0.6rem;
  --van-switch-width: 1.25rem;
  --van-switch-height: 0.62rem;
  --van-switch-node-size: 0.52rem;
  --van-switch-on-background: #05e7ae;
  --van-switch-off-background: rgba(255, 255, 255, 0.3);

  :deep(.van-switch__node) {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
}
</style>
