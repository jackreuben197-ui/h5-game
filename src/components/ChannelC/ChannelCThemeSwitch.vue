<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { t, tJoin } from '@/i18n'
import moonLight from '@/assets/channelC/theme-moon-light.svg'
import moonDark from '@/assets/channelC/theme-moon-dark.svg'
import sunLight from '@/assets/channelC/theme-sun-light.svg'
import sunDark from '@/assets/channelC/theme-sun-dark.svg'

const { isDark, setModeAnimated } = useTheme()
const label = computed(() =>
  tJoin(
    t('UIComponent_Text8'),
    isDark.value ? t('UIComponent_Text9') : t('UIComponent_Text10'),
    t('UIGameplaySetting_DesktopSetting_Theme'),
  ),
)
</script>

<template>
  <button
    class="c-theme-toggle"
    :class="{ 'is-dark': isDark }"
    type="button"
    role="switch"
    :aria-checked="isDark"
    :aria-label="label"
    :title="label"
    @click.stop="setModeAnimated(isDark ? 'light' : 'dark')"
  >
    <img class="c-theme-track-icon" :src="isDark ? sunDark : moonLight" alt="" />
    <span class="c-theme-knob">
      <img :src="isDark ? moonDark : sunLight" alt="" />
    </span>
  </button>
</template>

<style scoped lang="scss">
@use 'sass:math';

@function px($value) {
  @return math.div($value, 39) * 1rem;
}

.c-theme-toggle {
  position: relative;
  flex: none;
  box-sizing: border-box;
  width: px(54.21);
  height: px(31.085);
  padding: 0;
  border: 0.5px solid transparent;
  border-radius: px(35.449);
  background: #05c297;
  background-origin: border-box;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &.is-dark {
    border-color: rgba(223, 223, 223, 0.18);
    background: linear-gradient(143.7deg, #08263d 7.55%, #000 71.92%);
  }
}
.c-theme-track-icon {
  position: absolute;
  top: 50%;
  left: px(5.18);
  width: px(15.92);
  height: px(15.92);
  transform: translateY(-50%);
}
.is-dark .c-theme-track-icon {
  left: px(31.15);
  width: px(15.35);
  height: px(15.35);
}
.c-theme-knob {
  position: absolute;
  top: px(0.8);
  left: px(24);
  display: grid;
  place-items: center;
  width: px(27.68);
  height: px(27.68);
  border-radius: 50%;
  background: #f9f9f9;
  transition: left 320ms cubic-bezier(0.22, 1, 0.36, 1);

  img {
    width: px(15.35);
    height: px(15.35);
  }
}
.is-dark .c-theme-knob {
  left: px(0.5);

  img {
    width: px(15.92);
    height: px(15.92);
  }
}
</style>
