<script setup lang="ts">
import FieldTip from './FieldTip.vue'

interface Props {
  label: string
  tip?: string
  modelValue: boolean | string | number
  disabled?: boolean
  activeValue?: boolean | string | number
  inactiveValue?: boolean | string | number
  icon?: string
  tip2?: string
}

withDefaults(defineProps<Props>(), {
  tip: '',
  disabled: false,
  activeValue: true,
  inactiveValue: false,
  icon: '',
  tip2: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | string | number]
  change: [value: boolean | string | number]
}>()

function onChange(value: boolean | string | number) {
  emit('update:modelValue', value)
  emit('change', value)
}
const getIcon = (name: string) => {
  return new URL(`../../assets/icons/${name}.png`, import.meta.url).href
}
</script>

<template>
  <div class="table-switch-root">
    <div class="table-switch-row" :class="{ 'table-switch-row-with-icon': !!icon }">
      <div class="table-switch__label">
        <img v-if="icon" :src="getIcon(icon)" class="table-switch__icon" />
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
    <div v-if="tip2" class="table-switch__tip2">{{ tip2 }}</div>
  </div>
</template>

<style scoped lang="scss">
.table-switch-root {
  width: 100%;
}

.table-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 1.15rem;
  position: relative;
}
.table-switch-row-with-icon {
  height: 1.55rem;
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
  --van-switch-on-background: #78E490;
  --van-switch-off-background: rgba(255, 255, 255, 0.3);

  :deep(.van-switch__node) {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
}
.table-switch__icon {
  width: 1.25rem;
  height: 1.6rem;
}
.table-switch__tip2 {
  color: #fff;
}
</style>
