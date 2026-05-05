<script setup lang="ts">
import { computed, reactive } from 'vue'
import TableSwitch from '@/components/GameCreateForm/TableSwitch.vue'
import TableSelect from '@/components/GameCreateForm/TableSelect.vue'
import TableSlider from '@/components/GameCreateForm/TableSlider.vue'
import TableInput from '@/components/GameCreateForm/TableInput.vue'
import SectionDivider from '@/components/GameCreateForm/SectionDivider.vue'
import { nlhSections, buildDefaultState } from './sections/index'
import type { FieldValue, TableFormFieldConfig } from './template'

type FormState = Record<string, FieldValue>
const formState = reactive<FormState>(buildDefaultState(nlhSections))

const componentMap = {
  switch: TableSwitch,
  select: TableSelect,
  slider: TableSlider,
  input: TableInput,
} as const

function hitCondition(conditionValue: FieldValue | FieldValue[], formValue: FieldValue): boolean {
  if (Array.isArray(conditionValue)) {
    return (conditionValue as FieldValue[]).some(candidate => isSameFieldValue(candidate, formValue))
  }
  return isSameFieldValue(conditionValue, formValue)
}

function isSameFieldValue(left: FieldValue, right: FieldValue): boolean {
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false
    if (left.length !== right.length) return false
    return left.every((item, index) => item === right[index])
  }
  return left === right
}

function checkConditions(
  conditions: TableFormFieldConfig['visibleWhen'] | TableFormFieldConfig['disabledWhen'],
): boolean {
  return conditions!.every(cond => hitCondition(cond.equals, formState[cond.field]))
}

function isVisible(field: TableFormFieldConfig): boolean {
  if (!field.visibleWhen || field.visibleWhen.length === 0) return true
  return checkConditions(field.visibleWhen)
}

function isDisabled(field: TableFormFieldConfig): boolean {
  if (!field.disabledWhen || field.disabledWhen.length === 0) return false
  return checkConditions(field.disabledWhen)
}

const renderedSections = computed(() =>
  nlhSections
    .map(section => ({
      ...section,
      fields: section.fields
        .filter(f => isVisible(f))
        .map(f => ({ ...f, disabled: isDisabled(f) })),
    }))
    .filter(section => section.fields.length > 0),
)
</script>

<template>
  <div class="create-table-page app-scroll-standalone">
    <div class="detail-form">
      <template v-for="section in renderedSections" :key="section.key">
        <SectionDivider :label="section.label" />
        <component
          :is="componentMap[field.type]"
          v-for="field in section.fields"
          :key="field.modelValue"
          v-model:model-value="formState[field.modelValue]"
          class="detail-form__item"
          :label="field.label"
          :tip="field.tip"
          :options="field.options"
          :active-value="field.activeValue"
          :inactive-value="field.inactiveValue"
          :min="field.min"
          :max="field.max"
          :step="field.step"
          :unit="field.unit"
          :range="field.range"
          :mark-mode="field.markMode"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
        />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.create-table-page {
  position: relative;
  min-height: 100dvh;
  padding: 0 0.35rem calc(1.6rem + env(safe-area-inset-bottom));
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
  overflow-x: hidden;
  overflow-y: auto;
}

.detail-form {
  border-radius: 0.35rem;
  margin-top: 3rem;
  padding: 0.08rem 0 0.25rem;
  background: rgba(0, 0, 0, 0.2);
}

.detail-form__item {
  margin: 0 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);

  &:last-of-type {
    border-bottom: none;
  }
}
</style>
