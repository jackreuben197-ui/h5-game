<script setup lang="ts">
import buttonTopBg from '@/assets/images/button_top.svg'

interface Props {
  label: string
  icon?: string
}

withDefaults(defineProps<Props>(), {
  icon: '',
})
</script>

<template>
  <button class="pill">
    <img
      :src="buttonTopBg"
      alt=""
      class="pill__bg"
    />
    <span class="wallet-t-button pill__label">{{ label }}</span>
    <img
      v-if="icon"
      :src="icon"
      alt=""
      class="pill__icon"
    />
  </button>
</template>

<style scoped lang="scss">
.pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.16rem;
  min-width: 1.573rem;
  height: 0.587rem;
  padding: 0 0.213rem;
  white-space: nowrap;
}

.pill__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.pill__label {
  position: relative;
}

.pill__icon {
  position: relative;
  width: 0.4rem;
  height: 0.4rem;
}
</style>
