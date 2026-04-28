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
  padding: 0.06rem 0.24rem;
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
  padding: 0 0.13rem;
  border-radius: 0.121rem;
}

.tagpill__label {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.28rem;
  color: #fff;
  letter-spacing: 0.1px;
}

.tagpill--id .tagpill__label {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: 0.215rem;
}
</style>
