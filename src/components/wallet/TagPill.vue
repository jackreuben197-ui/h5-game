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
@use '@/styles/mixins' as *;

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

  @include theme-light-own {
    border-radius: 31px;
    background: rgba(40, 38, 38, 0.22);
    mix-blend-mode: normal;
  }
}

.tagpill--id {
  background: rgba(255, 255, 255, 0.4);
  padding: 0.0216rem 0.1311rem;
  border-radius: 0.1123rem;

  @include theme-light-own {
    background: rgba(0, 0, 0, 0.4);
  }
}

.tagpill__label {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.28rem;
  color: #fff;
  letter-spacing: 0.1px;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }
}

.tagpill--id .tagpill__label {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: 0.2159rem;

  @include theme-light-own {
    color: #fff;
  }
}
</style>
