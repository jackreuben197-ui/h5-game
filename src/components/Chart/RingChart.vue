<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value?: number
    color?: string
    size?: string
    strokeWidth?: number
    trackColor?: string
  }>(),
  {
    value: 0,
    color: '#ffffff',
    size: '1.92rem',
    strokeWidth: 16,
    trackColor: 'rgba(255, 255, 255, 0.16)',
  },
)

const r = computed(() => 50 - props.strokeWidth / 2)
const circumference = computed(() => 2 * Math.PI * r.value)
const dashoffset = computed(
  () => circumference.value * (1 - Math.max(0, Math.min(100, props.value)) / 100),
)
</script>

<template>
  <div class="ring-root" :style="{ width: size, height: size }">
    <svg class="ring-svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" :r="r" fill="none" :stroke="trackColor" :stroke-width="strokeWidth" />
      <circle
        class="ring-arc"
        cx="50"
        cy="50"
        :r="r"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashoffset"
        transform="rotate(-90 50 50)"
      />
    </svg>
    <div class="ring-slot">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ring-root {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ring-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.ring-arc {
  transition: stroke-dashoffset 0.6s ease;
}

.ring-slot {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
