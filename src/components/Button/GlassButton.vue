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
  padding: 0.18rem 0.41rem;
  background: rgba(255, 255, 255, 0.31);
  border: 0.445px solid rgba(242, 242, 242, 0.4);
  border-radius: 0.45rem;
  box-shadow: 0.9px 1.1px 1.8px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  white-space: nowrap;
  min-width: 1.87rem;
}

.gb__label {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.36rem;
  color: #fff;
  line-height: 0.95;
}
</style>
