<script setup lang="ts">
import { computed, reactive } from 'vue'
import TableSwitch from '@/components/GameCreateForm/TableSwitch.vue'
import TableSelect from '@/components/GameCreateForm/TableSelect.vue'
import TableSlider from '@/components/GameCreateForm/TableSlider.vue'
import TableInput from '@/components/GameCreateForm/TableInput.vue'
import { defaultTemplate, tableFormPart1List, type FieldValue, type TableFormFieldConfig } from './template.ts'

type FormState = Record<string, FieldValue>
const formState = reactive<FormState>(structuredClone(defaultTemplate))

const componentMap = {
  switch: TableSwitch,
  select: TableSelect,
  slider: TableSlider,
  input: TableInput,
} as const

function hitCondition(conditionValue: FieldValue | FieldValue[], formValue: FieldValue): boolean {
  if (Array.isArray(conditionValue)) {
    return conditionValue.includes(formValue)
  }
  return conditionValue === formValue
}

function checkConditions(
  conditions: TableFormFieldConfig['visibleWhen'] | TableFormFieldConfig['disabledWhen']
): boolean {
  if (!conditions || conditions.length === 0) {
    return true
  }
  return conditions.every((condition) => hitCondition(condition.equals, formState[condition.field]))
}

function isDisabled(item: TableFormFieldConfig): boolean {
  if (!item.disabledWhen || item.disabledWhen.length === 0) {
    return false
  }
  return checkConditions(item.disabledWhen)
}

const renderedFields = computed(() =>
  tableFormPart1List
    .filter((item) => checkConditions(item.visibleWhen))
    .map((item) => ({
      ...item,
      disabled: isDisabled(item),
    }))
)

function onFieldChange(field: TableFormFieldConfig, value: FieldValue): void {
  if (field.modelValue === 'bring_in' && value === 0) {
    formState.min_buyin = 100
    formState.table_name = ''
  }
}
</script>
<template>
  <div class="create-table-page app-scroll-standalone">
    {{ formState }}
    <div class="detail-form">
      <component
        :is="componentMap[field.type]"
        v-for="field in renderedFields"
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
        @change="onFieldChange(field, $event)"
      />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.create-table-page {
 position: relative;
  min-height: 100dvh;
  padding: 0 0.35rem calc(0.44rem + env(safe-area-inset-bottom));
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
  overflow-x: hidden;
  overflow-y: auto;
}

.detail-form {
  border-radius: 0.35rem;
  margin-top: 3rem;
  padding:0.25rem 0;
  background: rgba(0, 0, 0, 0.2);
}
.detail-form__item{
  margin: 0 0.5rem;
  border-bottom:1px solid rgba(255, 255, 255, 0.2);
}
</style>
