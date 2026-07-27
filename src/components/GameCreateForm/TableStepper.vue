<script setup lang="ts">
import FieldTip from './FieldTip.vue'

interface Props {
  label: string
  tip?: string
  modelValue: string | number
  disabled?: boolean
  min?: number
  max?: number
  step?: number
  decimalDigits?: number
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  tip: '',
  disabled: false,
  min: 0,
  max: Infinity,
  step: 1,
  decimalDigits: 0,
  placeholder: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  change: [value: number]
}>()

function normalizeValue(value: string | number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return Number(props.min)
  }
  return parsed
}

function onInput(value: string | number): void {
  const nextValue = normalizeValue(value)
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
}
</script>

<template>
  <div class="table-stepper-row">
    <div class="table-stepper__label">
      <span class="table-stepper__text">{{ label }}</span>
      <FieldTip :tip="tip" />
    </div>

    <div :class="['table-stepper__field-wrap', { 'table-stepper__field-wrap--disabled': disabled }]">
      <VanStepper
        :model-value="modelValue"
        theme="round"
        :disabled="disabled"
        :min="min"
        :max="max"
        :step="step"
        :integer="decimalDigits <= 0"
        :decimal-length="decimalDigits"
        :placeholder="placeholder"
        class="table-stepper"
        @update:model-value="onInput"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.table-stepper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 1.15rem;
  position: relative;
}

.table-stepper__label {
  display: flex;
  align-items: center;
  gap: 0.09rem;
}

.table-stepper__text {
  font-size: 0.37rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;

  @include theme-light {
    color: var(--c-text);
  }
}

.table-stepper__field-wrap {
  width: 3.32rem;
  height: 0.93rem;
  display: flex;
  align-items: center;
  padding: 0 0.09rem;
  border-radius: 1.55rem;
  background: rgb(0, 0, 0);

  @include theme-light {
    background: rgba(134, 134, 134, 0.18);
  }

  &--disabled {
    opacity: 0.5;
  }
}

.table-stepper {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  :deep(.van-stepper__input) {
    flex: 1;
    min-width: 0;
    height: 0.76rem;
    margin: 0 0.12rem;
    padding: 0;
    background: transparent;
    color: #fff;
    font-size: 0.37rem;
    font-family: 'HONOR Sans CN', sans-serif;
    font-weight: 400;
    line-height: 0.76rem;
    text-align: center;

    @include theme-light {
      color: var(--c-text);
    }
  }

  :deep(.van-stepper__input::placeholder) {
    color: rgba(255, 255, 255, 0.45);

    @include theme-light {
      color: var(--c-text-muted);
    }
  }

  :deep(.van-stepper__minus),
  :deep(.van-stepper__plus) {
    width: 0.76rem;
    height: 0.76rem;
    flex-shrink: 0;
    border: none;
    border-radius: 0.7348rem;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.16) 0%,
      rgba(171, 171, 171, 0.16) 100%
    );
    box-shadow: 2.851px 2.534px 5.733px 0 rgba(255, 255, 255, 0.22) inset;
    color: #fff;

    @include theme-light {
      background: linear-gradient(180deg, #fff 0%, #e2e2e2 100%);
      box-shadow: 2.851px 2.534px 5.733px rgba(255, 255, 255, 0.62) inset;
      color: #000;
    }
  }

  :deep(.van-stepper__minus::before),
  :deep(.van-stepper__plus::before) {
    width: 0.24rem;
    height: 0.04rem;
    border-radius: 999px;
    background-color: currentColor;
  }

  :deep(.van-stepper__plus::after) {
    width: 0.04rem;
    height: 0.24rem;
    border-radius: 999px;
    background-color: currentColor;
  }

  :deep(.van-stepper__minus::after) {
    display: none;
  }

  :deep(.van-stepper__minus--disabled),
  :deep(.van-stepper__plus--disabled) {
    opacity: 0.35;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.16) 0%,
      rgba(171, 171, 171, 0.16) 100%
    );
    color: rgba(255, 255, 255, 0.7);

    @include theme-light {
      background: rgba(134, 134, 134, 0.12);
      color: rgba(0, 0, 0, 0.45);
    }
  }

  :deep(.van-stepper--round .van-stepper__input:disabled) {
    background: transparent;
    -webkit-text-fill-color: rgba(255, 255, 255, 0.7);

    @include theme-light {
      -webkit-text-fill-color: rgba(0, 0, 0, 0.45);
    }
  }
}
</style>

<style lang="scss">
:root[data-theme='light'] .table-stepper-row {
  .table-stepper__text {
    color: rgba(15, 8, 8, 0.85);
  }

  .table-stepper__field-wrap {
    background: rgba(0, 0, 0, 0.06);
  }

  .van-stepper__input {
    color: rgba(15, 8, 8, 0.85);

    &::placeholder {
      color: rgba(15, 8, 8, 0.4);
    }
  }

  .van-stepper__minus,
  .van-stepper__plus {
    background: linear-gradient(180deg, #ffffff 0%, #e2e2e2 100%);
    color: rgba(15, 8, 8, 0.85);
  }

  .van-stepper__minus--disabled,
  .van-stepper__plus--disabled {
    background: linear-gradient(180deg, #ffffff 0%, #e2e2e2 100%);
    color: rgba(15, 8, 8, 0.35);
  }
}
</style>
