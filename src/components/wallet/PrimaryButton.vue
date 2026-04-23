<script setup lang="ts">
interface Props {
  label: string
}

defineProps<Props>()
</script>

<template>
  <button class="pbtn">
    <span class="pbtn__label">{{ label }}</span>
  </button>
</template>

<style scoped lang="scss">
.pbtn {
  width: 100%;
  height: clamp(44px, 14.4vw, 54px);
  border-radius: clamp(28px, 10.5vw, 39.6px);
  background: var(--wallet-grad-primary);
  border: 0.5px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.pbtn__label {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: clamp(13px, 4vw, 15px);
  color: #fff;
  line-height: 1.2;
}
</style>
