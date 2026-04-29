<script setup lang="ts">
interface Props {
  tag?: string
  radius?: string
  padding?: string
}

withDefaults(defineProps<Props>(), {
  tag: 'div',
  radius: '1rem',
  padding: '0.4rem 0.75rem',
})
</script>

<template>
  <component
    :is="tag"
    class="glass-card"
    :style="{ borderRadius: radius, padding: padding }"
  >
    <slot></slot>
  </component>
</template>

<style scoped lang="scss">
.glass-card {
  position: relative;
  backdrop-filter: blur(16.5px);
  -webkit-backdrop-filter: blur(16.5px);
  background: var(--wallet-glass-bg);
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
}

.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(139deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
</style>
