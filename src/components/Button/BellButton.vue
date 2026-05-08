<script setup lang="ts">
import { ref } from 'vue'

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
    y: initialY + dy
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
      transition: isDragging ? 'none' : 'transform 0.1s ease-out'
    }"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <button class="bell">
      <div class="bell__icon">
        <!-- New clean Bell SVG -->
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="white"/>
        </svg>
      </div>
      
      <!-- Custom Badge UI -->
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
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  background: linear-gradient(128deg, rgba(5, 231, 174, 0.4) 7%, rgba(2, 122, 92, 0.4) 72%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0.11rem;
  border: none;
}

.bell__icon {
  width: 0.85rem;
  height: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bell__icon svg {
  width: 100%;
  height: 100%;
}

.bell__badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ff4d4f;
  color: white;
  border-radius: 50%;
  min-width: 0.4rem;
  height: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.24rem;
  font-weight: bold;
  border: 1px solid white;
}
</style>
