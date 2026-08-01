<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { t } from '@/i18n'

const { isDark, setModeAnimated } = useTheme()

const targetThemeLabel = computed(() => (isDark.value ? t('UIComponent_Text9') : t('UIComponent_Text10')))

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
    :aria-label="t('UIComponent_Text8') + (targetThemeLabel) + t('UIGameplaySetting_DesktopSetting_Theme')"
    :title="t('UIComponent_Text8') + (targetThemeLabel) + t('UIGameplaySetting_DesktopSetting_Theme')"
    @click.stop="toggleTheme"
  >
    <span class="theme-quick-switch__thumb" aria-hidden="true"></span>
    <span class="theme-quick-switch__moon" aria-hidden="true"></span>
    <span class="theme-quick-switch__sun" aria-hidden="true">
      <span class="theme-quick-switch__sun-glyph"></span>
    </span>
  </button>
</template>

<style scoped lang="scss">
$icon-active: #000;
$icon-inactive: linear-gradient(128deg, #ff516c, #df2340);

.theme-quick-switch {
  position: relative;
  width: 1.3124rem;
  height: 0.7526rem;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(249, 249, 249, 0.51);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:focus-visible {
    outline: 2px solid #f9f9f9;
    outline-offset: 2px;
  }

  &:active .theme-quick-switch__thumb {
    transform: translateX(0.56rem) scale(0.93);
  }

  &.is-dark {
    .theme-quick-switch__moon {
      background: $icon-active;
    }

    .theme-quick-switch__sun-glyph {
      background: $icon-inactive;
    }

    .theme-quick-switch__thumb {
      transform: translateX(0);
    }

    &:active .theme-quick-switch__thumb {
      transform: translateX(0) scale(0.93);
    }
  }
}

.theme-quick-switch__thumb {
  position: absolute;
  top: 0.0412rem;
  left: 0.0412rem;
  z-index: 1;
  width: 0.6702rem;
  height: 0.6702rem;
  border-radius: 50%;
  background: #f9f9f9;
  transform: translateX(0.56rem);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16);
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.theme-quick-switch__moon,
.theme-quick-switch__sun {
  position: absolute;
  top: 50%;
  z-index: 2;
  transform: translateY(-50%);
  pointer-events: none;
}

.theme-quick-switch__moon {
  left: 0.1836rem;
  width: 0.3855rem;
  height: 0.3855rem;
  background: $icon-inactive;
  -webkit-mask: url('@/assets/icons/theme_moon.svg') center / contain no-repeat;
  mask: url('@/assets/icons/theme_moon.svg') center / contain no-repeat;
}

.theme-quick-switch__sun {
  right: 0.1744rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.4038rem;
  height: 0.4038rem;
}

.theme-quick-switch__sun-glyph {
  display: block;
  width: 0.3717rem;
  height: 0.3717rem;
  background: $icon-active;
  -webkit-mask: url('@/assets/icons/theme_sun.svg') center / contain no-repeat;
  mask: url('@/assets/icons/theme_sun.svg') center / contain no-repeat;
}

@media (prefers-reduced-motion: reduce) {
  .theme-quick-switch__thumb {
    transition-duration: 0.01ms;
  }
}
</style>
