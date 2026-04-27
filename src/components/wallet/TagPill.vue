<script setup lang="ts">
type Variant = 'light' | 'dark' | 'id'

interface Props {
  label: string | number
  variant?: Variant
}

withDefaults(defineProps<Props>(), {
  variant: 'light',
})
</script>

<template>
  <span
    class="tagpill"
    :class="`tagpill--${variant}`"
  >
    <span class="tagpill__label">{{ label }}</span>
  </span>
</template>

<style scoped lang="scss">
.tagpill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1.5px, 0.6vw, 2.8px) clamp(6px, 2.4vw, 9px);
  border-radius: 31px;
  line-height: 1.4;
  white-space: nowrap;
}

.tagpill--light {
  background: rgba(255, 255, 255, 0.21);
}

.tagpill--dark {
  background: rgba(40, 38, 38, 0.52);
  mix-blend-mode: color-burn;
}

.tagpill--id {
  background: rgba(255, 255, 255, 0.2);
  padding: 0 clamp(3.5px, 1.3vw, 4.9px);
  border-radius: clamp(3.3px, 1.21vw, 4.62px);
}

.tagpill__label {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: clamp(9px, 2.8vw, 11.2px);
  color: #fff;
  letter-spacing: 0.1px;
}

.tagpill--id .tagpill__label {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: clamp(7px, 2.15vw, 8.1px);
}
</style>
