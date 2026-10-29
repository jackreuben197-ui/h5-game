<script setup lang="ts">
import GuestAuthActions from '@/components/GuestAuthActions.vue'

withDefaults(defineProps<{ standalone?: boolean }>(), {
  standalone: false,
})
</script>

<template>
  <div class="home-top-bar" :class="{ 'home-top-bar--standalone': standalone }">
    <span class="home-top-bar__logo">POKER</span>
    <GuestAuthActions />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.home-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 0.2rem 0 0;
}

.home-top-bar--standalone {
  position: relative;
  z-index: 2;
  padding: calc(var(--app-content-safe-area-top, env(safe-area-inset-top)) + 0.6rem) 0.4rem 0;
}

.home-top-bar__logo {
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
  font-size: 0.54rem;
  font-weight: 900;
  letter-spacing: 0.05rem;
  text-shadow:
    0.5px 0 0 currentColor,
    -0.5px 0 0 currentColor,
    0 0.5px 0 currentColor,
    0 -0.5px 0 currentColor;

  @include theme-light {
    color: #000;
  }
}
</style>
