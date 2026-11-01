<script setup lang="ts">
import { t } from '@/i18n'
import flameOne from '@/assets/channelC/casino/hot-flame-1.webp'
import flameTwo from '@/assets/channelC/casino/hot-flame-2.webp'
import flameThree from '@/assets/channelC/casino/hot-flame-3.webp'
import liveRing from '@/assets/channelC/casino/live-ring.webp'
import livePortrait from '@/assets/channelC/casino/live-portrait.png'
import sports from '@/assets/channelC/casino/sports.webp'
import fishing from '@/assets/channelC/casino/fishing.webp'
import board from '@/assets/channelC/casino/board.webp'
import minigame from '@/assets/channelC/casino/minigame.webp'

defineProps<{ active: string }>()
defineEmits<{ select: [category: string] }>()
const shortcuts = [
  { key: 'hot', label: 'UICasino_TabHot' },
  { key: 'zhenren', label: 'UICasino_TabLive' },
  { key: 'dianzi', label: 'UICasino_TabSlots' },
  { key: 'tiyu', label: 'UICasino_TabSports', icon: sports },
  { key: 'buyu', label: 'UICasino_TabFishing', icon: fishing },
  { key: 'board', label: 'UICasino_TabCards', icon: board },
  { key: 'minigame', label: 'UICasino_TabMinigames', icon: minigame },
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
      <span v-if="item.key === 'hot'" class="c-hot-icon" aria-hidden="true">
        <span class="c-flame c-flame--1"><span><img :src="flameOne" alt="" /></span></span>
        <span class="c-flame c-flame--2"><span><img :src="flameTwo" alt="" /></span></span>
        <span class="c-flame c-flame--3"><img :src="flameThree" alt="" /></span>
        <span class="c-hot-badge">HOT</span>
      </span>
      <span v-else-if="item.key === 'zhenren'" class="c-live-icon" aria-hidden="true">
        <span class="c-live-ring"><img :src="liveRing" alt="" /></span>
        <img class="c-live-portrait" :src="livePortrait" alt="" />
      </span>
      <span v-else-if="item.key === 'dianzi'" class="c-slots-icon" aria-hidden="true">
        <span v-for="index in 3" :key="index" class="c-slot-tile">7</span>
      </span>
      <span v-else class="c-shortcut-icon" aria-hidden="true">
        <span><img :src="item.icon" alt="" /></span>
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
  display: block;

  > span {
    position: absolute;
    display: block;
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
  }
}
.c-casino-shortcut--tiyu .c-shortcut-icon {
  width: px(28.368);
  height: px(28.368);

  > span {
    inset: -1.91% -43.31% -65.32% -4.7%;
  }
}
.c-casino-shortcut--buyu .c-shortcut-icon {
  width: px(30.936);
  height: px(31.212);

  > span {
    inset: -2.3% -7.61% -0.81% -3.09%;
  }
}
.c-casino-shortcut--board .c-shortcut-icon {
  width: px(27.108);
  height: px(27.108);

  > span {
    inset: -2.65% -10.58% -11.47% -3.53%;
  }
}
.c-casino-shortcut--minigame .c-shortcut-icon {
  width: px(35.798);
  height: px(28.68);

  > span {
    inset: -2.82% -9.02% -24.81% -2.17%;
  }
}
.c-hot-icon {
  position: relative;
  display: block;
  flex: none;
  width: px(28.873);
  height: px(38.077);
  margin-bottom: px(-6.012);
}
.c-flame {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    position: absolute;
    display: block;
  }
  > span {
    position: relative;
    display: block;
    flex: none;
  }
}
.c-flame--1 {
  top: px(8.39);
  left: px(12.61);
  width: px(15.908);
  height: px(18.142);

  > span {
    width: px(11.145);
    height: px(15.108);
    transform: rotate(-158.49deg) scaleY(-1);
  }
  img {
    top: -2.89%;
    right: -62.75%;
    bottom: -54.97%;
    left: -3.92%;
    width: 166.67%;
    height: 157.86%;
  }
}
.c-flame--2 {
  top: px(4.97);
  left: px(-1.32);
  width: px(19.166);
  height: px(21.871);

  > span {
    width: px(13.442);
    height: px(18.222);
    transform: rotate(158.59deg) scaleY(-1);
  }
  img {
    top: -2.4%;
    right: -52.02%;
    bottom: -45.57%;
    left: -3.25%;
    width: 155.27%;
    height: 147.97%;
  }
}
.c-flame--3 {
  top: px(0.3);
  left: px(5.81);
  width: px(16.482);
  height: px(24.723);

  img {
    top: -1.96%;
    left: -2.94%;
    width: 150%;
    height: 139.22%;
  }
}
.c-hot-badge {
  position: absolute;
  top: px(23.82);
  left: px(3.6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: px(20.803);
  height: px(7.19);
  border: 0.137px solid #ff5e00;
  border-radius: px(10.714);
  background: rgba(255, 255, 255, 0.2);
  color: #ffbf01;
  font-size: px(7.5);
  line-height: 1;
  -webkit-backdrop-filter: blur(1.6px);
  backdrop-filter: blur(1.6px);
}
.c-live-icon {
  position: relative;
  display: block;
  flex: none;
  width: px(29.142);
  height: px(29.142);
}
.c-live-ring {
  position: absolute;
  inset: -2.26% -9.03% -9.78% -3.01%;

  img {
    display: block;
    width: 100%;
    height: 100%;
  }
}
.c-live-portrait {
  position: absolute;
  top: px(2.48);
  left: px(2.42);
  width: px(24.295);
  height: px(24.295);
  border-radius: 50%;
  object-fit: cover;
  object-position: bottom;
}
.c-slots-icon {
  display: flex;
  flex: none;
  gap: px(0.735);
  padding-top: px(5.63);
  filter: drop-shadow(0.433px 0.65px 0.867px rgba(0, 0, 0, 0.1))
    drop-shadow(1.951px 2.384px 1.517px rgba(0, 0, 0, 0.09));
}
.c-slot-tile {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: px(11.069);
  height: px(17.078);
  overflow: hidden;
  border: 0.441px solid rgba(240, 240, 240, 0.4);
  border-radius: px(1.91);
  background: linear-gradient(
    179.67deg,
    rgba(174, 39, 39, 0.48) 3.46%,
    rgba(255, 156, 156, 0.64) 49.23%,
    rgba(214, 38, 38, 0.8) 109.02%
  );
  box-shadow:
    inset 0.588px 0.588px 1.205px rgba(0, 0, 0, 0.7),
    inset 0.714px 0.536px 1.785px #000,
    inset 0 0 3.571px 1.25px rgba(242, 242, 242, 0.4),
    0.714px 0.893px 1.428px rgba(0, 0, 0, 0.25);
  color: #fff;
  font-size: px(15.38);
  font-weight: 500;
  line-height: 0.95;
  text-shadow:
    1.18px 1.18px 2.361px rgba(0, 0, 0, 0.23),
    3.541px 3.541px 4.722px rgba(0, 0, 0, 0.2);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 56%;
    border-radius: px(1.469) px(1.469) 0 0;
    background: linear-gradient(181.27deg, rgba(255, 255, 255, 0.32) 2.54%, transparent 114.95%);
    mix-blend-mode: plus-lighter;
  }
}
</style>
