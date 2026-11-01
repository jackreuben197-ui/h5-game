<script setup lang="ts">
import { t } from '@/i18n'
import { useTheme } from '@/composables/useTheme'
import hotDark from '@/assets/channelC/casino/hot-dark.webp'
import hotLight from '@/assets/channelC/casino/hot-light.webp'
import liveDark from '@/assets/channelC/casino/live-dark.webp'
import liveLight from '@/assets/channelC/casino/live-light.webp'
import slotsDark from '@/assets/channelC/casino/slots-dark.webp'
import slotsLight from '@/assets/channelC/casino/slots-light.webp'
import sportsDark from '@/assets/channelC/casino/sports-dark.webp'
import sportsLight from '@/assets/channelC/casino/sports-light.webp'
import fishingDark from '@/assets/channelC/casino/fishing-dark.webp'
import fishingLight from '@/assets/channelC/casino/fishing-light.webp'
import boardDark from '@/assets/channelC/casino/board-dark.webp'
import boardLight from '@/assets/channelC/casino/board-light.webp'
import minigameDark from '@/assets/channelC/casino/minigame-dark.webp'
import minigameLight from '@/assets/channelC/casino/minigame-light.webp'

defineProps<{ active: string }>()
defineEmits<{ select: [category: string] }>()
const { isDark } = useTheme()
const shortcuts = [
  { key: 'hot', label: 'UICasino_TabHot', dark: hotDark, light: hotLight },
  { key: 'zhenren', label: 'UICasino_TabLive', dark: liveDark, light: liveLight },
  { key: 'dianzi', label: 'UICasino_TabSlots', dark: slotsDark, light: slotsLight },
  { key: 'tiyu', label: 'UICasino_TabSports', dark: sportsDark, light: sportsLight },
  { key: 'buyu', label: 'UICasino_TabFishing', dark: fishingDark, light: fishingLight },
  { key: 'board', label: 'UICasino_TabCards', dark: boardDark, light: boardLight },
  { key: 'minigame', label: 'UICasino_TabMinigames', dark: minigameDark, light: minigameLight },
]
</script>

<template>
  <nav class="c-casino-shortcuts" :aria-label="t('UICasino_Title')">
    <button
      v-for="item in shortcuts"
      :key="item.key"
      type="button"
      class="c-casino-shortcut"
      :class="[`c-casino-shortcut--${item.key}`, { 'is-active': item.key === active }]"
      :aria-pressed="item.key === active"
      @click="$emit('select', item.key)"
    >
      <span class="c-shortcut-icon" aria-hidden="true">
        <img :src="isDark ? item.dark : item.light" alt="" />
      </span>
      <span class="c-shortcut-label">
        <span v-fit-text="{ maxLines: 1 }">{{ t(item.label) }}</span>
      </span>
    </button>
  </nav>
</template>

<style scoped lang="scss">
@use 'sass:math';
@use '@/styles/mixins' as *;

@function px($value) {
  @return math.div($value, 39) * 1rem;
}

.c-casino-shortcuts {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: px(46.363);
  margin-bottom: 0.128rem;
}
.c-casino-shortcut {
  position: relative;
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: px(41);
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.c-shortcut-label {
  position: relative;
  z-index: 1;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: px(50);
  height: px(14);
  color: #fff;
  font-size: px(11);
  font-weight: 500;
  line-height: 1.2;
  text-align: center;

  @include theme-light-own {
    color: #000;
  }
  > span {
    display: block;
    width: 100%;
    white-space: nowrap;
  }
}
.c-casino-shortcut.is-active::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: px(25.948);
  height: px(14);
  border-radius: px(16.558);
  box-shadow:
    px(-0.331) px(-1.987) px(2.318) rgba(255, 255, 255, 0.85),
    px(-0.662) px(-8.61) px(4.305) rgba(255, 255, 255, 0.74),
    px(-1.656) px(-19.207) px(5.795) rgba(255, 255, 255, 0.44),
    px(-2.649) px(-34.11) px(6.789) rgba(255, 255, 255, 0.13);
  transform: translateX(-50%);
}
.c-casino-shortcut.is-active .c-shortcut-label {
  width: auto;
  max-width: px(56);
  padding: 0 px(3.974);
  border: 0.331px solid rgba(255, 255, 255, 0.5);
  border-radius: px(16.558);
  background: #ff5708;
  color: #fff;

  @include theme-light-own {
    color: #fff;
  }
  > span {
    width: auto;
    max-width: px(48);
  }
}
.c-shortcut-icon {
  position: relative;
  z-index: 2;
  display: block;
  flex: none;

  img {
    position: absolute;
    display: block;
    max-width: none;
  }
}
.c-casino-shortcut--hot .c-shortcut-icon {
  width: px(28.873);
  height: px(38.077);
  margin-bottom: px(-6.012);

  img {
    top: 0;
    left: px(0.07);
    width: px(32.5);
    height: px(39);
  }
}
.c-casino-shortcut--zhenren .c-shortcut-icon {
  width: px(29.142);
  height: px(29.142);

  img {
    top: px(-0.542);
    left: px(-0.933);
    width: px(32.75);
    height: px(32.75);
  }
}
.c-casino-shortcut--dianzi .c-shortcut-icon {
  width: px(34.676);
  height: px(22.708);

  img {
    top: px(0.208);
    left: px(-1.275);
    width: px(53.75);
    height: px(42.5);
  }
}
.c-casino-shortcut--tiyu .c-shortcut-icon {
  width: px(28.368);
  height: px(28.368);

  img {
    top: px(-0.542);
    left: px(-1.287);
    width: px(42);
    height: px(47.5);
  }
}
.c-casino-shortcut--buyu .c-shortcut-icon {
  width: px(30.936);
  height: px(31.212);

  img {
    top: px(-0.542);
    left: px(-1.056);
    width: px(34.25);
    height: px(32.25);
  }
}
.c-casino-shortcut--board .c-shortcut-icon {
  width: px(27.108);
  height: px(27.108);

  img {
    top: px(-0.542);
    left: px(-0.857);
    width: px(31);
    height: px(31);
  }
}
.c-casino-shortcut--minigame .c-shortcut-icon {
  width: px(35.798);
  height: px(28.68);

  img {
    top: px(-0.792);
    left: px(-0.735);
    width: px(40);
    height: px(36.75);
  }
}
</style>
