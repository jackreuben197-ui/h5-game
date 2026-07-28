<script setup lang="ts">
import { computed } from 'vue'
import themeSun from '@/assets/icons/theme_sun.png'
import { useTheme } from '@/composables/useTheme'

const { isDark, setModeAnimated } = useTheme()

const targetThemeLabel = computed(() => (isDark.value ? '浅色' : '深色'))

function toggleTheme(): void {
  setModeAnimated(isDark.value ? 'light' : 'dark')
}
</script>

<template>
  <button
    class="theme-quick-switch"
    :class="{ 'is-dark': isDark }"
    type="button"
    role="switch"
    :aria-checked="isDark"
    :aria-label="`切换到${targetThemeLabel}主题`"
    :title="`切换到${targetThemeLabel}主题`"
    @click.stop="toggleTheme"
  >
    <span class="theme-quick-switch__moon" aria-hidden="true"></span>
    <img class="theme-quick-switch__sun" :src="themeSun" alt="" aria-hidden="true" />
    <span class="theme-quick-switch__thumb" aria-hidden="true"></span>
  </button>
</template>

<style scoped lang="scss">
.theme-quick-switch {
  position: relative;
  width: 0.723rem;
  height: 0.414rem;
  flex: none;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  isolation: isolate;
  -webkit-tap-highlight-color: transparent;

  &::before,
  &::after {
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: inherit;
    content: '';
    transition: opacity 320ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  &::before {
    background: linear-gradient(144deg, #69beff 8%, #2d84c7 72%);
    opacity: 1;
  }

  &::after {
    background: linear-gradient(144deg, #08263d 8%, #000 72%);
    box-shadow: inset 0 0 0 0.5px rgba(223, 223, 223, 0.18);
    opacity: 0;
  }

  &:focus-visible {
    outline: 2px solid #f9f9f9;
    outline-offset: 2px;
  }

  &:active .theme-quick-switch__thumb {
    transform: translateX(0.307rem) scale(0.93);
  }

  &.is-dark {
    &::before {
      opacity: 0;
    }

    &::after {
      opacity: 1;
    }

    .theme-quick-switch__moon {
      color: #000;
    }

    .theme-quick-switch__thumb {
      transform: translateX(0);
    }

    &:active .theme-quick-switch__thumb {
      transform: translateX(0) scale(0.93);
    }
  }
}

.theme-quick-switch__moon,
.theme-quick-switch__sun {
  position: absolute;
  top: 50%;
  z-index: 2;
  width: 0.212rem;
  height: 0.212rem;
  transform: translateY(-50%);
  pointer-events: none;
}

.theme-quick-switch__moon {
  left: 0.1rem;
  color: #fff;
  background-color: currentColor;
  -webkit-mask: url('@/assets/icons/theme_moon.svg') center / contain no-repeat;
  mask: url('@/assets/icons/theme_moon.svg') center / contain no-repeat;
  transition: color 260ms ease;
}

.theme-quick-switch__sun {
  right: 0.1rem;
  display: block;
  object-fit: contain;
}

.theme-quick-switch__thumb {
  position: absolute;
  top: 0.017rem;
  left: 0.02rem;
  z-index: 1;
  width: 0.369rem;
  height: 0.369rem;
  border-radius: 50%;
  background: #f9f9f9;
  transform: translateX(0.307rem);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16);
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .theme-quick-switch,
  .theme-quick-switch::before,
  .theme-quick-switch::after,
  .theme-quick-switch__moon,
  .theme-quick-switch__thumb {
    transition-duration: 0.01ms;
  }
}
</style>
