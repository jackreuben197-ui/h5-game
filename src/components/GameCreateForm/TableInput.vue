<script setup lang="ts">
import FieldTip from './FieldTip.vue'

interface Props {
  label: string
  tip?: string
  modelValue: string | number
  disabled?: boolean
  placeholder?: string
}

withDefaults(defineProps<Props>(), {
  tip: '',
  disabled: false,
  placeholder: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

function onInput(value: string) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <div class="table-input-row">
    <div class="table-input__label">
      <span class="table-input__text">{{ label }}</span>
      <FieldTip :tip="tip" />
    </div>
    <VanField
      :model-value="String(modelValue ?? '')"
      :disabled="disabled"
      :placeholder="placeholder"
      class="table-input__field"
      @update:model-value="onInput"
    />
  </div>
</template>

<style scoped lang="scss">
.table-input-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 1.15rem;
  position: relative;
}

.table-input__label {
  display: flex;
  align-items: center;
  gap: 0.09rem;
}

.table-input__text {
  font-size: 0.37rem;
  color: #fff;
  font-weight: 400;
}

.table-input__field {
  width: 3.2rem;
  padding: 0;
  border-radius: 0.2rem;
  overflow: hidden;

  :deep(.van-field__control) {
    text-align: right;
    color: #fff;
  }
}
.van-field{
  background: transparent;
}
</style>
