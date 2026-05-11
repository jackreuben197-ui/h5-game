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
      <div class="bell__content">
        <!-- Bell Icon SVG matching the reference image shape -->
        <svg class="bell__svg" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" />
        </svg>
        
        <!-- Badge positioned on the "shoulder" of the bell as in the picture -->
        <div v-if="showBadge && count && count > 0" class="bell__badge">
          {{ count }}
        </div>
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
  width: 52.554px;
  height: 52.554px;
  padding: 0;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  background: linear-gradient(128deg, rgba(5, 231, 174, 0.40) 7.55%, rgba(2, 122, 92, 0.40) 71.92%);
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.bell__content {
  position: relative;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bell__svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.1));
}

.bell__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #FF2D46; /* Bright red matching the picture */
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  border: 1.5px solid transparent; /* No thick white border in the pic, just a clean circle */
  line-height: 1;
  font-family: Arial, sans-serif;
  z-index: 1;
}
</style>
