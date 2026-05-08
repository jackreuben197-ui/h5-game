<script setup lang="ts">
import { ref } from 'vue'
import FieldTip from './FieldTip.vue'
import icEdit from '@/assets/icons/icon_edit.svg'

interface Props {
  label: string
  tip?: string
  modelValue: string | number
  disabled?: boolean
  placeholder?: string
  numberOnly?: boolean
  decimalDigits?: number
  min?: number
  max?: number
}

const props = withDefaults(defineProps<Props>(), {
  tip: '',
  disabled: false,
  placeholder: '',
  numberOnly: false,
  decimalDigits: 0,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()
const isEditing = ref(false)

function onInput(value: string) {
  const nextValue = props.numberOnly ? sanitizeNumberInput(value, props.decimalDigits) : value
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
}

function onFocus(): void {
  isEditing.value = true
}

function onBlur(): void {
  isEditing.value = false
  if (!props.numberOnly) return

  const clamped = clampNumberInput(
    String(props.modelValue ?? ''),
    props.decimalDigits,
    props.min,
    props.max,
  )
  if (clamped !== String(props.modelValue ?? '')) {
    emit('update:modelValue', clamped)
    emit('change', clamped)
  }
}

function sanitizeNumberInput(raw: string, decimalDigits: number): string {
  const normalized = String(raw || '')
  const safeDigits = Number.isFinite(decimalDigits) ? Math.max(0, Math.floor(decimalDigits)) : 0

  if (safeDigits === 0) {
    return normalized.replace(/\D+/g, '')
  }

  const cleaned = normalized.replace(/[^\d.]/g, '')
  const hasDot = cleaned.includes('.')
  const [intPartRaw, ...rest] = cleaned.split('.')
  const intPart = intPartRaw.replace(/\D+/g, '')
  const fracPart = rest.join('').replace(/\D+/g, '').slice(0, safeDigits)

  if (!hasDot) {
    return intPart
  }

  const safeInt = intPart || '0'
  return fracPart.length > 0 ? `${safeInt}.${fracPart}` : `${safeInt}.`
}

function clampNumberInput(raw: string, decimalDigits: number, min?: number, max?: number): string {
  const sanitized = sanitizeNumberInput(raw, decimalDigits)
  // 保留用户正在输入的小数点中间态，例如 "12."
  if (sanitized === '' || sanitized.endsWith('.')) {
    return sanitized
  }

  const parsed = Number(sanitized)
  if (!Number.isFinite(parsed)) {
    return ''
  }

  let next = parsed
  if (Number.isFinite(min)) {
    next = Math.max(next, Number(min))
  }
  if (Number.isFinite(max)) {
    next = Math.min(next, Number(max))
  }

  const safeDigits = Number.isFinite(decimalDigits) ? Math.max(0, Math.floor(decimalDigits)) : 0
  if (safeDigits === 0) {
    return String(Math.trunc(next))
  }
  return String(parseFloat(next.toFixed(safeDigits)))
}
</script>

<template>
  <div class="table-input-row">
    <div class="table-input__label">
      <span class="table-input__text">{{ label }}</span>
      <FieldTip :tip="tip" />
    </div>
    <div :class="['table-input__field-wrap', { 'table-input__field-wrap--editing': isEditing }]">
      <VanField
        :model-value="String(modelValue ?? '')"
        :disabled="disabled"
        :placeholder="placeholder"
        :type="numberOnly ? 'text' : 'text'"
        :inputmode="numberOnly ? (decimalDigits > 0 ? 'decimal' : 'numeric') : 'text'"
        class="table-input__field"
        @update:model-value="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />
      <img v-if="!isEditing" :src="icEdit" class="table-input__edit-icon" alt="" />
    </div>
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
  width: 100%;
  padding: 0;
  border-radius: 1.55rem;
  overflow: hidden;

  :deep(.van-field__control) {
    text-align: right;
    color: #fff;
    padding-right: 0.2rem;
  }

  :deep(.van-field__body) {
    padding: 0 0.2rem 0 0.28rem;
  }
}

.table-input__field-wrap {
  min-width: 2.9rem;
  width: 3.3rem;
  height: 0.93rem;
  display: flex;
  align-items: center;
  border-radius: 1.55rem;
  background: rgba(255, 255, 255, 0.18);
  background-blend-mode: soft-light;
  padding: 0 0.18rem 0 0.3rem;
  gap: 0.08rem;
}

.table-input__field-wrap--editing {
  .table-input__field {
    :deep(.van-field__control) {
      padding-right: 0.06rem;
    }
  }
}

.table-input__edit-icon {
  width: 0.3rem;
  height: 0.3rem;
  flex-shrink: 0;
  opacity: 0.9;
}

.van-field {
  background: transparent;
}
.van-cell:after {
  border: none;
}
</style>
