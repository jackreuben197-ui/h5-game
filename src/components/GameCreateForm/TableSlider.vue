<script setup lang="ts">
import { computed } from 'vue'
import FieldTip from './FieldTip.vue'

type SliderValue = number | [number, number]
type SliderMarkMode = 'all' | 'edge' | 'none'
type SliderIncomingValue = SliderValue | string | boolean

interface Props {
  label: string
  tip?: string
  modelValue: SliderIncomingValue
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
  'update:modelValue': [value: SliderValue]
  change: [value: SliderValue]
}>()

const markList = computed(() => {
  if (props.markMode === 'none') {
    return [] as number[]
  }

  const safeStep = Number(props.step || 0)
  const safeMin = Number(props.min || 0)
  const safeMax = Number(props.max || 0)
  if (safeStep <= 0 || safeMax < safeMin) {
    return [] as number[]
  }

  const total = Math.floor((safeMax - safeMin) / safeStep)
  const marks: number[] = []
  for (let i = 0; i <= total; i += 1) {
    marks.push(safeMin + i * safeStep)
  }
  const last = marks[marks.length - 1]
  if (last !== safeMax) {
    marks.push(safeMax)
  }
  return marks
})

const displayValue = computed(() => {
  if (Array.isArray(normalizedModelValue.value)) {
    const [start, end] = normalizedModelValue.value
    return `${start} ~ ${end}${props.unit || ''}`
  }
  return `${normalizedModelValue.value}${props.unit || ''}`
})

const normalizedModelValue = computed<SliderValue>(() => {
  if (Array.isArray(props.modelValue)) {
    const [rawStart, rawEnd] = props.modelValue
    const start = Number(rawStart)
    const end = Number(rawEnd)
    const safeStart = Number.isFinite(start) ? start : Number(props.min || 0)
    const safeEnd = Number.isFinite(end) ? end : Number(props.max || 0)
    return [Math.min(safeStart, safeEnd), Math.max(safeStart, safeEnd)]
  }

  if (typeof props.modelValue === 'number') {
    return Number.isFinite(props.modelValue) ? props.modelValue : Number(props.min || 0)
  }

  const parsed = Number(props.modelValue)
  if (Number.isFinite(parsed)) {
    return parsed
  }
  return Number(props.min || 0)
})

function shouldShowMarkLabel(index: number): boolean {
  if (props.markMode === 'all') {
    return true
  }
  if (props.markMode === 'edge') {
    return index === 0 || index === markList.value.length - 1
  }
  return false
}

function onChange(value: SliderValue) {
  emit('update:modelValue', value)
  emit('change', value)
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
      :model-value="normalizedModelValue"
      :min="min"
      :max="max"
      :step="step"
      :range="range"
      :disabled="disabled"
      @update:model-value="onChange"
    />
    <div v-if="markMode !== 'none' && markList.length" class="table-slider__marks">
      <div
        v-for="(mark, index) in markList"
        :key="`${mark}_${index}`"
        class="table-slider__mark-item"
      >
        <span v-if="shouldShowMarkLabel(index)" class="table-slider__mark-label">{{ mark }}</span>
        <span v-else class="table-slider__mark-label table-slider__mark-label--empty">&nbsp;</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.table-slider-row {
  padding: 0.24rem 0;
  position: relative;

  &--disabled {
    opacity: 0.5;
  }
}

.table-slider__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.18rem;
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
  font-size: 0.32rem;
  color: rgba(255, 255, 255, 0.92);
}

:deep(.van-slider) {
  width: calc(100% - 0.4rem);
  margin: 0.3rem 0.2rem 0.2rem;
}

:deep(.van-slider__button) {
  width: 0.44rem;
  height: 0.44rem;
  border: 0.01rem solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: none;
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

.table-slider__marks {
  display: flex;
  justify-content: space-between;
  margin: 0 0;
}

.table-slider__mark-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.table-slider__mark-label {
  margin-top: 0.02rem;
  font-size: 0.22rem;
  line-height: 1;
  color: rgba(255, 255, 255, 0.84);
  font-family: 'Afacad', sans-serif;
}

.table-slider__mark-label--empty {
  opacity: 0;
}
</style>
