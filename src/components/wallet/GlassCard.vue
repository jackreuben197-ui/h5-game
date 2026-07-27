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
@use '@/styles/mixins' as *;

.glass-card {
  position: relative;
  backdrop-filter: blur(16.5px);
  -webkit-backdrop-filter: blur(16.5px);
  background: var(--wallet-glass-bg);
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);

  @include theme-light-own {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border: 0.5px solid var(--wallet-glass-border);
    box-shadow: 0 0.08rem 0.2rem rgba(70, 79, 88, 0.1);
  }
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

  @include theme-light-own {
    display: none;
  }
}
</style>
