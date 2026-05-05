<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <div class="section-divider">
    <span class="section-divider__label">{{ label }}</span>
  </div>
</template>

<style scoped lang="scss">
.section-divider {
  display: flex;
  align-items: center;
  gap: 0.22rem;
  padding: 0.32rem 0.5rem 0.16rem;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.15);
  }
}

.section-divider__label {
  font-size: 0.28rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.45);
  white-space: nowrap;
  letter-spacing: 0.03em;
}
</style>
