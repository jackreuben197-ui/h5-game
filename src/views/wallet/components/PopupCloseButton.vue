<script setup lang="ts">
defineEmits<{
  close: []
}>()
</script>

<template>
  <button class="popup-close" type="button" aria-label="关闭" @click="$emit('close')">
    <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
      <path d="M5 5 19 19M19 5 5 19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
    </svg>
  </button>
</template>

<style scoped lang="scss">
.popup-close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 50%;
  border: 0.5px solid rgba(242, 242, 242, 0.4);
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s, transform 0.15s;
}

.popup-close:active {
  opacity: 0.8;
  transform: scale(0.92);
}
</style>
