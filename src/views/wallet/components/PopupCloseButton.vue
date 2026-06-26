<script setup lang="ts">
withDefaults(defineProps<{ absolute?: boolean }>(), { absolute: false })
defineEmits<{
  close: []
}>()
</script>

<template>
  <button
    class="popup-close"
    :class="{ 'popup-close--absolute': absolute }"
    type="button"
    aria-label="关闭"
    @click="$emit('close')"
  >
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
      <path d="M5 5 19 19M19 5 5 19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
    </svg>
  </button>
</template>

<style scoped lang="scss">
.popup-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 50%;
  border: 0.5px solid rgba(242, 242, 242, 0.4);
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s, transform 0.15s;
}

.popup-close--absolute {
  position: absolute;
  top: 12px;
  right: 16px;
  z-index: 6;
}

.popup-close:active {
  opacity: 0.8;
  transform: scale(0.92);
}
</style>
