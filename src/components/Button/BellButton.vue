<script setup lang="ts">
import { ref } from 'vue'
import { t } from '@/i18n'

const props = defineProps<{
  count?: number
  showBadge?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const bellRef = ref<HTMLElement | null>(null)

let startX = 0
let startY = 0
let initialX = 0
let initialY = 0

function onTouchStart(e: TouchEvent) {
  isDragging.value = false
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY

  initialX = position.value.x
  initialY = position.value.y
}

function onTouchMove(e: TouchEvent) {
  const dx = e.touches[0].clientX - startX
  const dy = e.touches[0].clientY - startY

  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
    isDragging.value = true
  }

  position.value = {
    x: initialX + dx,
    y: initialY + dy,
  }

  e.preventDefault()
}

function onTouchEnd() {
  if (!isDragging.value) {
    emit('click')
  }
  isDragging.value = false
}
</script>

<template>
  <div
    ref="bellRef"
    class="bell-wrapper"
    :style="{
      transform: `translate(${position.x}px, ${position.y}px)`,
      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
    }"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <button class="bell">
      <span class="bell__text">{{ t('GlobalFloat_InTransaction') }}</span>
      <div v-if="showBadge && count && count > 0" class="bell__badge">
        {{ count }}
      </div>
    </button>
  </div>
</template>

<style scoped lang="scss">
.bell-wrapper {
  position: absolute;
  z-index: 1000;
  touch-action: none;
}

.bell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.4rem;
  height: 0.8rem;
  border-radius: 1rem;
  background: #69BEFF;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  white-space: nowrap;
}

.bell__text {
  color: #fff;
  font-size: 0.37rem;
  font-weight: 600;
  line-height: 1;
}

.bell__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #FF2D46;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  font-family: Arial, sans-serif;
  z-index: 1;
}
</style>
