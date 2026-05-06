<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import TableSwitch from '@/components/GameCreateForm/TableSwitch.vue'
import TableSelect from '@/components/GameCreateForm/TableSelect.vue'
import TableSlider from '@/components/GameCreateForm/TableSlider.vue'
import QuickCreateView from './QuickCreateView.vue'
import { nlhSections } from './sections/index'
import { defaultNlhFormState, type NlhFormState } from './sections/formState'
import type { FieldValue, TableFormFieldConfig } from './template'

const formState = reactive<NlhFormState>({ ...defaultNlhFormState })

// section 渲染时动态访问 formState，用此别名绕过 TS 索引限制
const formStateMap = formState as Record<string, FieldValue>

const activeTab = ref<'quick' | 'pro'>('pro')

const componentMap: Record<string, unknown> = {
  switch: TableSwitch,
  select: TableSelect,
  slider: TableSlider,
}

function hitCondition(conditionValue: FieldValue | FieldValue[], formValue: FieldValue): boolean {
  if (Array.isArray(conditionValue)) {
    return (conditionValue as FieldValue[]).some((candidate) =>
      isSameFieldValue(candidate, formValue),
    )
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
  return conditions!.every((cond) => hitCondition(cond.equals, formStateMap[cond.field]))
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
  nlhSections.map((section) => ({
    fields: section.filter((f) => isVisible(f)).map((f) => ({ ...f, disabled: isDisabled(f) })),
  })),
)


function onFieldChange(field: TableFormFieldConfig, value: FieldValue): void {
  if (field.modelValue !== 'buyin_range' || !Array.isArray(value)) {
    return
  }

  const start = Number(value[0])
  const end = Number(value[1])
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return
  }

  const minRate = Math.min(start, end)
  const maxRate = Math.max(start, end)
  formState.min_rate = minRate
  formState.max_rate = maxRate
  formState.buyin_range = [minRate, maxRate]
}
</script>

<template>
  <div class="create-table-page app-scroll-standalone">
    <!-- Header with tabs -->
    <HeaderBack>
      <div class="header-tabs">
        <button
          :class="['header-tab', { 'header-tab--active': activeTab === 'quick' }]"
          @click="activeTab = 'quick'"
        >
          一键开桌
        </button>
        <button
          :class="['header-tab', { 'header-tab--active': activeTab === 'pro' }]"
          @click="activeTab = 'pro'"
        >
          专业参数
        </button>
      </div>
    </HeaderBack>

    <!-- Quick create tab -->
    <template v-if="activeTab === 'quick'">
      <QuickCreateView />
    </template>

    <!-- Pro params tab -->
    <template v-if="activeTab === 'pro'">
      <!-- Table name row -->
      <div class="table-name-row">
        <span class="table-name__label">牌局名称</span>
        <input
          v-model="formState.name"
          class="table-name__input"
          type="text"
          placeholder="德州/短牌/奥马哈"
          :maxlength="20"
        />
        <span class="table-name__count">{{ formState.name.length }}/20</span>
      </div>

      <!-- Form sections -->
      <div class="detail-form">
        <div v-for="(section, index) in renderedSections" :key="index" class="detail-form__section">
          <component
            :is="componentMap[field.type]"
            v-for="field in section.fields"
            :key="field.modelValue"
            v-model:model-value="formStateMap[field.modelValue]"
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
            :disabled="field.disabled"
            :need-double="field.needDouble"
            @change="onFieldChange(field, $event)"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.create-table-page {
  position: relative;
  min-height: 100dvh;
  padding: 0 0 calc(1.6rem + env(safe-area-inset-bottom));
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
  overflow-x: hidden;
  overflow-y: auto;
}

/* Header tabs */
.header-tabs {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin: 0 auto;
  transform: translateX(-0.5rem);
}

.header-tab {
  background: transparent;
  border: none;
  font-size: 0.4rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.08rem 0 0;
  position: relative;

  &--active {
    font-weight: 700;
    color: #fff;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: #fff;
      border-radius: 1px;
    }
  }
}

/* Table name row */
.table-name-row {
  display: flex;
  align-items: center;
  height: 1.23rem;
  margin: 0.35rem 0.35rem 0;
  padding: 0 0.51rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.43rem;
  backdrop-filter: blur(0.16px);
}
.detail-form__section {
  margin: 0.38rem 0.35rem 0;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.43rem;
  backdrop-filter: blur(0.16px);
  padding: 0.13rem 0.5rem;
}

.table-name__label {
  font-size: 0.37rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;
  white-space: nowrap;
}

.table-name__input {
  flex: 1;
  min-width: 0;
  margin-left: 0.53rem;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.4rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
}

.table-name__count {
  margin-left: 0.27rem;
  font-size: 0.37rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #b4b4b4;
  white-space: nowrap;
}

/* Detail form */
.detail-form {
  border-radius: 0.35rem;
  padding: 0.08rem 0 0.25rem;
}

.detail-form__item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);

  &:last-of-type {
    border-bottom: none;
  }
}
</style>
