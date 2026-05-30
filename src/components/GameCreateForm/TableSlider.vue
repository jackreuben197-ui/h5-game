<script setup lang="ts">
import { computed } from 'vue'
import FieldTip from './FieldTip.vue'

type SliderValue = number | [number, number]
type SliderMarkMode = 'all' | 'edge' | 'none'
type SliderRawValue = number | [number, number]

interface Option {
  text: string
  value: number
}

interface MarkItem {
  id: string
  value: number
  label: string
  percent: number
  isFirst: boolean
  isLast: boolean
}

interface Props {
  label: string
  tip?: string
  modelValue: number | [number, number] | string | boolean
  /** 非线性模式：传入 options 后 slider 内部走索引，对外暴露 options[i].value */
  options?: Option[]
  min?: number
  max?: number
  step?: number
  unit?: string
  disabled?: boolean
  range?: boolean
  markMode?: SliderMarkMode
}

const props = withDefaults(defineProps<Props>(), {
  tip: '',
  min: 0,
  max: 100,
  step: 1,
  unit: '',
  disabled: false,
  range: false,
  markMode: 'none',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | [number, number]]
  change: [value: number | [number, number]]
}>()

// ── options 模式 ──────────────────────────────────────────────────────────────

const isOptionsMode = computed(() => !!props.options?.length)
const normalizedOptions = computed<Option[]>(() => {
  if (!props.options?.length) return []
  return props.options
    .filter((item) => Number.isFinite(Number(item.value)))
    .map((item) => ({
      text: String(item.text ?? '').trim(),
      value: Number(item.value),
    }))
})

/** 当前 modelValue 在 options 中的索引 */
const optionIndex = computed(() => {
  if (!isOptionsMode.value || !normalizedOptions.value.length) return 0
  const idx = normalizedOptions.value.findIndex((o) => o.value === props.modelValue)
  return idx === -1 ? 0 : idx
})

const optionRangeIndex = computed<[number, number]>(() => {
  if (!isOptionsMode.value || !normalizedOptions.value.length) return [0, 0]
  const [rawStart, rawEnd] = Array.isArray(props.modelValue)
    ? props.modelValue
    : [
        normalizedOptions.value[0].value,
        normalizedOptions.value[normalizedOptions.value.length - 1].value,
      ]
  const startIdx = normalizedOptions.value.findIndex((o) => o.value === rawStart)
  const endIdx = normalizedOptions.value.findIndex((o) => o.value === rawEnd)
  const safeStart = startIdx === -1 ? 0 : startIdx
  const safeEnd = endIdx === -1 ? normalizedOptions.value.length - 1 : endIdx
  return [Math.min(safeStart, safeEnd), Math.max(safeStart, safeEnd)]
})

// ── 线性模式辅助 ──────────────────────────────────────────────────────────────

const linearValue = computed<SliderValue>(() => {
  if (Array.isArray(props.modelValue)) {
    const [a, b] = props.modelValue
    const sa = Number.isFinite(Number(a)) ? Number(a) : props.min!
    const sb = Number.isFinite(Number(b)) ? Number(b) : props.max!
    return [Math.min(sa, sb), Math.max(sa, sb)]
  }
  const n = Number(props.modelValue)
  return Number.isFinite(n) ? n : props.min!
})

// ── 传给 VanSlider 的值 ───────────────────────────────────────────────────────

const sliderValue = computed<SliderValue>(() =>
  isOptionsMode.value
    ? props.range
      ? optionRangeIndex.value
      : optionIndex.value
    : linearValue.value,
)

const sliderMin = computed(() => (isOptionsMode.value ? 0 : props.min!))
const sliderMax = computed(() =>
  isOptionsMode.value ? normalizedOptions.value.length - 1 : props.max!,
)
const sliderStep = computed(() => (isOptionsMode.value ? 1 : props.step!))

// ── 显示文本 ──────────────────────────────────────────────────────────────────

const displayValue = computed(() => {
  if (isOptionsMode.value) {
    if (props.range) {
      const [startIdx, endIdx] = optionRangeIndex.value
      const startOption = normalizedOptions.value[startIdx]
      const endOption = normalizedOptions.value[endIdx]
      const startLabel = startOption?.text || String(startOption?.value ?? '')
      const endLabel = endOption?.text || String(endOption?.value ?? '')
      return `${startLabel} ~ ${endLabel}`
    }
    const selected = normalizedOptions.value[optionIndex.value]
    return selected?.text || String(selected?.value ?? '')
  }
  if (Array.isArray(linearValue.value)) {
    const [a, b] = linearValue.value
    return `${fmt(a)} ~ ${fmt(b)}${props.unit}`
  }
  return `${fmt(linearValue.value as number)}${props.unit}`
})

function fmt(val: number): string {
  if (Number.isInteger(val)) return String(val)
  return String(parseFloat(val.toFixed(10)))
}

// ── 刻度（线性 & options 共用） ────────────────────────────────────────────────

const markItems = computed<MarkItem[]>(() => {
  if (props.markMode === 'none') return []

  if (isOptionsMode.value) {
    const options = normalizedOptions.value
    if (!options.length) return []

    return options.map((item, index) => {
      const percent = options.length === 1 ? 0 : (index / (options.length - 1)) * 100
      return {
        id: `opt_${index}_${item.value}`,
        value: item.value,
        label: item.text || String(item.value),
        percent,
        isFirst: index === 0,
        isLast: index === options.length - 1,
      }
    })
  }

  const step = props.step!
  const min = props.min!
  const max = props.max!
  if (step <= 0 || max < min) return []
  const total = Math.floor((max - min) / step)
  const values: number[] = []
  for (let i = 0; i <= total; i += 1) {
    values.push(min + i * step)
  }
  if (values[values.length - 1] !== max) {
    values.push(max)
  }

  return values.map((value, index) => ({
    id: `linear_${index}_${value}`,
    value,
    label: String(value),
    percent: max === min ? 0 : ((value - min) / (max - min)) * 100,
    isFirst: index === 0,
    isLast: index === values.length - 1,
  }))
})

function showMarkLabel(index: number): boolean {
  if (props.markMode === 'all') return true
  if (props.markMode === 'edge') return index === 0 || index === markItems.value.length - 1
  return false
}

const selectedBounds = computed<[number, number]>(() => {
  if (isOptionsMode.value) {
    if (Array.isArray(props.modelValue)) {
      const a = Number(props.modelValue[0])
      const b = Number(props.modelValue[1])
      const safeA = Number.isFinite(a) ? a : 0
      const safeB = Number.isFinite(b) ? b : 0
      return [Math.min(safeA, safeB), Math.max(safeA, safeB)]
    }
    const val = Number(props.modelValue)
    const safe = Number.isFinite(val) ? val : 0
    return [safe, safe]
  }

  if (Array.isArray(linearValue.value)) {
    const [a, b] = linearValue.value
    return [Math.min(a, b), Math.max(a, b)]
  }

  const single = Number(linearValue.value)
  const safe = Number.isFinite(single) ? single : 0
  return [safe, safe]
})

function isMarkActive(markValue: number): boolean {
  const [start, end] = selectedBounds.value
  if (props.range) {
    return markValue >= start && markValue <= end
  }
  return Math.abs(markValue - start) < 1e-9
}

// ── 事件 ─────────────────────────────────────────────────────────────────────

function onChange(raw: SliderValue) {
  if (isOptionsMode.value) {
    const options = normalizedOptions.value
    if (!options.length) {
      return
    }

    let mapped: SliderRawValue
    if (Array.isArray(raw)) {
      const [startIndex, endIndex] = raw
      const safeStart = clampOptionIndex(startIndex, options.length)
      const safeEnd = clampOptionIndex(endIndex, options.length)
      const startValue = options[Math.min(safeStart, safeEnd)].value
      const endValue = options[Math.max(safeStart, safeEnd)].value
      mapped = [startValue, endValue]
    } else {
      const safeIndex = clampOptionIndex(raw, options.length)
      mapped = options[safeIndex].value
    }

    emit('update:modelValue', mapped)
    emit('change', mapped)
    return
  }
  emit('update:modelValue', raw)
  emit('change', raw)
}

function clampOptionIndex(value: number, length: number): number {
  const int = Math.round(Number(value))
  if (!Number.isFinite(int)) return 0
  if (int < 0) return 0
  if (int > length - 1) return length - 1
  return int
}
</script>

<template>
  <div class="table-slider-row" :class="{ 'table-slider-row--disabled': disabled }">
    <div class="table-slider__head">
      <div class="table-slider__label">
        <span class="table-slider__text">{{ label }}</span>
        <FieldTip :tip="tip" />
      </div>
      <span class="table-slider__value">{{ displayValue }}</span>
    </div>

    <VanSlider
      :model-value="sliderValue"
      :min="sliderMin"
      :max="sliderMax"
      :step="sliderStep"
      :range="range"
      :disabled="disabled"
      @update:model-value="onChange"
    />

    <div v-if="markItems.length" class="table-slider__marks">
      <div
        v-for="(mark, index) in markItems"
        :key="mark.id"
        class="table-slider__mark-item"
        :class="{
          'table-slider__mark-item--first': mark.isFirst,
          'table-slider__mark-item--last': mark.isLast,
        }"
        :style="{ left: `${mark.percent}%` }"
      >
        <span
          v-if="showMarkLabel(index)"
          class="table-slider__mark-label"
          :class="{ 'table-slider__mark-label--active': isMarkActive(mark.value) }"
        >
          {{ mark.label }}
        </span>
        <span v-else class="table-slider__mark-label table-slider__mark-label--empty">&nbsp;</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.table-slider-row {
  padding: 0.24rem 0;

  &--disabled {
    opacity: 0.5;
  }
}

.table-slider__head {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.table-slider__label {
  display: flex;
  align-items: center;
  gap: 0.09rem;
}

.table-slider__text {
  font-size: 0.37rem;
  color: #fff;
}

.table-slider__value {
  font-size: 0.44rem;
  color: rgba(255, 255, 255, 0.92);
}

:deep(.van-slider) {
  width: calc(100% - 0.4rem);
  margin: 0.56rem 0.2rem 0.3rem;
  height: 0.12rem;
  background-color: #999999;
}

:deep(.van-slider__bar) {
  background: #78E490;
}

:deep(.van-slider__button) {
  width: 0.7rem;
  height: 0.75rem;
  border: none;
  background: url('@/assets/icons/ic_tumbler.svg') center / contain no-repeat;
  box-shadow: none;
}

.table-slider__marks {
  position: relative;
  width: calc(100% - 0.2rem);
  margin: 0.65rem auto 0.1rem;
  height: 0.45rem;
}

.table-slider__mark-item {
  position: absolute;
  transform: translateX(-50%);
}

.table-slider__mark-item--first {
  transform: translateX(0);
}

.table-slider__mark-item--last {
  transform: translateX(-100%);
}

.table-slider__mark-label {
  font-size: 0.44rem;
  line-height: 1;
  color: rgba(255, 255, 255, 0.4);
  font-family: 'Afacad', sans-serif;
}

.table-slider__mark-label--active {
  color: #fff;
}

.table-slider__mark-label--empty {
  opacity: 0;
}
</style>
