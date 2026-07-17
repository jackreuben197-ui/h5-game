<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type PickTarget = 'start' | 'end'

type DayCell = {
  date: Date
  day: number
  inCurrentMonth: boolean
}

const props = withDefaults(defineProps<{
  visible: boolean
  startDate: Date
  endDate: Date
  minDate?: Date
  maxDate?: Date
  tipText?: string
  initialTarget?: PickTarget
}>(), {
  minDate: undefined,
  maxDate: undefined,
  tipText: '只支持查询最近三个月数据',
  initialTarget: 'start',
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'update:startDate', value: Date): void
  (e: 'update:endDate', value: Date): void
  (e: 'confirm', payload: { startDate: Date, endDate: Date }): void
  (e: 'close'): void
}>()

const weekLabels = ['m', 't', 'w', 't', 'f', 's', 's']

const startDateModel = ref(startOfDay(props.startDate))
const endDateModel = ref(startOfDay(props.endDate))
const pickingTarget = ref<PickTarget>(props.initialTarget)
const currentMonth = ref(new Date(endDateModel.value.getFullYear(), endDateModel.value.getMonth(), 1))

const monthTitle = computed(() => `${currentMonth.value.getFullYear()}年${currentMonth.value.getMonth() + 1}月`)
const startDateText = computed(() => formatDateSlash(startDateModel.value))
const endDateText = computed(() => formatDateSlash(endDateModel.value))

const calendarCells = computed<DayCell[]>(() => {
  const firstDay = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1)
  const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate()
  const offset = (firstDay.getDay() + 6) % 7
  const prevMonthLastDay = new Date(firstDay.getFullYear(), firstDay.getMonth(), 0).getDate()
  const cells: DayCell[] = []

  for (let i = 0; i < offset; i += 1) {
    const day = prevMonthLastDay - offset + i + 1
    cells.push({
      date: new Date(firstDay.getFullYear(), firstDay.getMonth() - 1, day),
      day,
      inCurrentMonth: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(firstDay.getFullYear(), firstDay.getMonth(), day),
      day,
      inCurrentMonth: true,
    })
  }

  const trailingCount = Math.max(0, 35 - cells.length)
  for (let i = 1; i <= trailingCount; i += 1) {
    cells.push({
      date: new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, i),
      day: i,
      inCurrentMonth: false,
    })
  }

  return cells.slice(0, 35)
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      return
    }

    startDateModel.value = startOfDay(props.startDate)
    endDateModel.value = startOfDay(props.endDate)
    pickingTarget.value = props.initialTarget
    currentMonth.value = new Date(endDateModel.value.getFullYear(), endDateModel.value.getMonth(), 1)
  },
)

watch(
  () => props.startDate,
  (value) => {
    if (!props.visible) {
      startDateModel.value = startOfDay(value)
    }
  },
)

watch(
  () => props.endDate,
  (value) => {
    if (!props.visible) {
      endDateModel.value = startOfDay(value)
    }
  },
)

function closePicker(): void {
  emit('update:visible', false)
  emit('close')
}

function confirmPicker(): void {
  let start = startOfDay(startDateModel.value)
  let end = startOfDay(endDateModel.value)

  if (start.getTime() > end.getTime()) {
    const temp = start
    start = end
    end = temp
  }

  startDateModel.value = start
  endDateModel.value = end
  emit('update:startDate', start)
  emit('update:endDate', end)
  emit('confirm', { startDate: start, endDate: end })
  emit('update:visible', false)
}

function goPrevYear(): void {
  currentMonth.value = new Date(currentMonth.value.getFullYear() - 1, currentMonth.value.getMonth(), 1)
}

function goPrevMonth(): void {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}

function goNextMonth(): void {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

function goNextYear(): void {
  currentMonth.value = new Date(currentMonth.value.getFullYear() + 1, currentMonth.value.getMonth(), 1)
}

function selectDay(date: Date): void {
  if (isDisabledDay(date)) {
    return
  }

  const selectedDate = startOfDay(date)
  if (pickingTarget.value === 'start') {
    startDateModel.value = selectedDate
    if (selectedDate.getTime() > endDateModel.value.getTime()) {
      endDateModel.value = selectedDate
      emit('update:endDate', selectedDate)
    }
    emit('update:startDate', selectedDate)
    pickingTarget.value = 'end'
  } else {
    endDateModel.value = selectedDate
    if (selectedDate.getTime() < startDateModel.value.getTime()) {
      startDateModel.value = selectedDate
      emit('update:startDate', selectedDate)
    }
    emit('update:endDate', selectedDate)
    pickingTarget.value = 'start'
  }

  if (selectedDate.getMonth() !== currentMonth.value.getMonth() || selectedDate.getFullYear() !== currentMonth.value.getFullYear()) {
    currentMonth.value = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  }
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isRangeStart(date: Date): boolean {
  return isSameDay(date, startDateModel.value)
}

function isRangeEnd(date: Date): boolean {
  return isSameDay(date, endDateModel.value)
}

function isInRange(date: Date): boolean {
  const target = startOfDay(date).getTime()
  const start = startOfDay(startDateModel.value).getTime()
  const end = startOfDay(endDateModel.value).getTime()
  return target > start && target < end
}

function isDisabledDay(date: Date): boolean {
  const target = startOfDay(date).getTime()
  const min = props.minDate ? startOfDay(props.minDate).getTime() : Number.NEGATIVE_INFINITY
  const max = props.maxDate ? startOfDay(props.maxDate).getTime() : Number.POSITIVE_INFINITY
  return target < min || target > max
}

function formatDateSlash(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
</script>

<template>
  <div v-if="visible" class="date-picker-mask" @click="closePicker">
    <div class="date-picker-sheet" @click.stop>
      <header class="picker-tip">
        <p>{{ tipText }}</p>
        <button type="button" class="picker-close" @click="closePicker">×</button>
      </header>

      <div class="picker-range-row">
        <button
          type="button"
          class="picker-date-btn"
          :class="{ active: pickingTarget === 'start' }"
          @click="pickingTarget = 'start'"
        >
          <span class="calendar-icon" aria-hidden="true"></span>
          <span>{{ startDateText }}</span>
        </button>
        <button
          type="button"
          class="picker-date-btn"
          :class="{ active: pickingTarget === 'end' }"
          @click="pickingTarget = 'end'"
        >
          <span class="calendar-icon" aria-hidden="true"></span>
          <span>{{ endDateText }}</span>
        </button>
      </div>

      <div class="picker-month-row">
        <div class="month-arrows">
          <button
            type="button"
            class="arrow-btn"
            aria-label="上一年"
            @click="goPrevYear"
          >
            «
          </button>
          <button
            type="button"
            class="arrow-btn"
            aria-label="上一月"
            @click="goPrevMonth"
          >
            ‹
          </button>
        </div>
        <p class="month-title">{{ monthTitle }}</p>
        <div class="month-arrows">
          <button
            type="button"
            class="arrow-btn"
            aria-label="下一月"
            @click="goNextMonth"
          >
            ›
          </button>
          <button
            type="button"
            class="arrow-btn"
            aria-label="下一年"
            @click="goNextYear"
          >
            »
          </button>
        </div>
      </div>

      <div class="calendar-wrap">
        <div class="weekday-row">
          <span v-for="(label, idx) in weekLabels" :key="`${label}-${idx}`">{{ label }}</span>
        </div>

        <div class="day-grid">
          <button
            v-for="cell in calendarCells"
            :key="cell.date.toISOString()"
            type="button"
            class="day-cell"
            :class="{
              muted: !cell.inCurrentMonth,
              disabled: isDisabledDay(cell.date),
              'in-range': isInRange(cell.date),
              'range-start': isRangeStart(cell.date),
              'range-end': isRangeEnd(cell.date),
            }"
            @click="selectDay(cell.date)"
          >
            <span>{{ String(cell.day).padStart(2, '0') }}</span>
          </button>
        </div>
      </div>

      <button type="button" class="picker-ok" @click="confirmPicker">OK</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.date-picker-mask {
  position: fixed;
  inset: 0;
  z-index: 24;
  background: rgba(12, 12, 12, 0.6);
  display: flex;
  align-items: flex-end;
}

.date-picker-sheet {
  width: 100%;
  padding: 0.64256rem 0.53211rem 0.5472rem;
  border-radius: 0.84459rem 0.84459rem 0 0;
  background: rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(0.16064rem);

  @include theme-light {
    border: 0.013rem solid rgba(255, 255, 255, 0.7);
    border-bottom: 0;
    background: rgba(73, 73, 73, 0.82);
    box-shadow: inset 0 0.08rem 0.3rem rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(0.42rem);
  }
}

.picker-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;

  @include theme-light {
    display: none;
  }

  p {
    margin: 0;
    font-size: 0.41861rem;
    line-height: 1.4;
    color: #fff;
  }
}

.picker-close {
  width: 1.024rem;
  height: 1.024rem;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 0.8rem;
  line-height: 1;
}

.picker-range-row {
  margin-top: 0.42667rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.42667rem;
}

.picker-date-btn {
  border: 0;
  height: 0.85141rem;
  border-radius: 0.64157rem;
  padding: 0 0.42208rem;
  background: rgba(6, 6, 6, 0.4);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.1912rem;
  font-size: 0.35893rem;
  line-height: 1.2;

  @include theme-light {
    background: rgba(30, 30, 30, 0.58);
  }

  &.active {
    box-shadow: 0 0 0 0.02rem rgba(var(--c-brand-rgb), 0.45) inset;
  }
}

.calendar-icon {
  width: 0.48rem;
  height: 0.48rem;
  border: 0.04rem solid rgba(243, 243, 243, 0.85);
  border-radius: 0.1rem;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -0.06rem;
    width: 0.06rem;
    height: 0.12rem;
    border-radius: 0.03rem;
    background: rgba(243, 243, 243, 0.85);
  }

  &::before {
    left: 0.09rem;
  }

  &::after {
    right: 0.09rem;
  }
}

.picker-month-row {
  margin-top: 0.372rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.month-arrows {
  display: inline-flex;
  align-items: center;
  gap: 0.18667rem;
}

.arrow-btn {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.64rem;
  width: 0.64rem;
  height: 0.64rem;
  line-height: 0.64rem;
  padding: 0;
}

.month-title {
  margin: 0;
  color: #fff;
  font-size: 0.49547rem;
  line-height: 1.4;
}

.calendar-wrap {
  margin-top: 0.16rem;
  padding: 0.26667rem;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  justify-items: center;
  opacity: 0.7;

  span {
    font-size: 0.26667rem;
    line-height: 0.42667rem;
    text-transform: lowercase;
  }
}

.day-grid {
  margin-top: 0.08rem;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.day-cell {
  border: 0;
  background: transparent;
  color: #fff;
  height: 0.98667rem;
  padding: 0;
  position: relative;
  font-size: 0.32rem;
  line-height: 0.42667rem;
  display: grid;
  place-items: center;

  > span {
    position: relative;
    z-index: 2;
  }

  &.disabled,
  &.muted {
    opacity: 0.3;
  }

  &.in-range::before,
  &.range-start::before,
  &.range-end::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0.14667rem;
    bottom: 0.14667rem;
    background: rgba(var(--c-brand-rgb), 0.17);
    z-index: 1;
  }

  &.range-start::before {
    border-radius: 0.49333rem 0 0 0.49333rem;
  }

  &.range-end::before {
    border-radius: 0 0.49333rem 0.49333rem 0;
  }

  &.range-start.range-end::before {
    border-radius: 0.49333rem;
  }

  &.range-start::after,
  &.range-end::after {
    content: '';
    position: absolute;
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background: var(--c-brand);
    z-index: 1;
  }
}

.picker-ok {
  margin-top: 0.37333rem;
  width: 100%;
  height: 1.43581rem;
  border: 0.01333rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.05573rem;
  background: linear-gradient(168.11deg, #05e7ae 7.55%, #027a5c 71.92%);
  color: #fff;
  font-size: 0.4rem;
  font-weight: 500;

  @include theme-light {
    border-color: transparent;
    background: var(--c-brand);
  }
}
</style>
