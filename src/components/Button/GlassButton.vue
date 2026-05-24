<script setup lang="ts">
interface Props {
  label: string
}

defineProps<Props>()
</script>

<template>
  <button class="gb">
    <div class="gb__blur" />
    <span class="gb__label">{{ label }}</span>
    <svg class="gb__arrow" width="5" height="8" viewBox="0 0 5 8" fill="none">
      <path d="M1 1L4 4L1 7" stroke="#f9f9f9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <div class="gb__inner-shadow" />
  </button>
</template>

<style scoped lang="scss">
.gb {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.1rem;
  padding: 0.12rem 0.16rem 0.12rem 0.21rem;
  width: 100%;
  border-radius: 0.6rem;
  border: none;
  background: transparent;
  box-shadow: 0.014rem 0.017rem 0.027rem 0 rgba(0, 0, 0, 0.25);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;

  &:active { opacity: 0.8; }
}

// Градиентный blur-фон
.gb__blur {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(3.7px);
  -webkit-backdrop-filter: blur(3.7px);
  background: linear-gradient(152.51deg, rgba(248, 253, 255, 0.8) 3.37%, rgba(199, 199, 199, 0.8) 37.46%);
  mix-blend-mode: hard-light;
  pointer-events: none;
}

.gb__label {
  position: relative;
  z-index: 1;
  color: #f9f9f9;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 0.275rem;
  font-weight: 600;
  line-height: 1.4;
}

.gb__arrow {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

// Внутренняя тень поверх всего
.gb__inner-shadow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 0 0.069rem 0 rgba(242, 242, 242, 0.9);
}
</style>
