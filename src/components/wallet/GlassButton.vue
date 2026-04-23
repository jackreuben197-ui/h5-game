<script setup lang="ts">
interface Props {
  label: string
}

defineProps<Props>()
</script>

<template>
  <button class="gb">
    <span class="gb__label">{{ label }}</span>
  </button>
</template>

<style scoped lang="scss">
.gb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: clamp(5px, 1.8vw, 6.8px) clamp(11px, 4.1vw, 15.3px);
  background: rgba(255, 255, 255, 0.31);
  border: 0.445px solid rgba(242, 242, 242, 0.4);
  border-radius: clamp(12px, 4.5vw, 16.8px);
  box-shadow: 0.9px 1.1px 1.8px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  white-space: nowrap;
  min-width: clamp(56px, 18.7vw, 70px);
}

.gb__label {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: clamp(11px, 3.6vw, 13.5px);
  color: #fff;
  line-height: 0.95;
}
</style>
