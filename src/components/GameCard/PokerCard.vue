<script setup lang="ts">
import { computed } from 'vue'
import iconCardC from '@/assets/icons/icon_card_c.svg'
import iconCardD from '@/assets/icons/icon_card_d.svg'
import iconCardH from '@/assets/icons/icon_card_h.svg'
import iconCardS from '@/assets/icons/icon_card_s.svg'

const props = withDefaults(defineProps<{
  rank: string
  suit: 'c' | 'h' | 'd' | 's'
  size?: string
}>(), {
  size: '1.84rem',
})

const SUIT_ICON: Record<string, string> = { c: iconCardC, d: iconCardD, h: iconCardH, s: iconCardS }

const isRed = computed(() => props.suit === 'h' || props.suit === 'd')
const suitIcon = computed(() => SUIT_ICON[props.suit])

// Default width: 69px / 37.5 = 1.84rem
const scale = computed(() => parseFloat(props.size) / 1.84)
</script>

<template>
  <div class="poker-card" :class="{ 'poker-card--red': isRed }">
    <span class="poker-card__rank">{{ rank }}</span>
    <img class="poker-card__suit-sm" :src="suitIcon" alt="" />
    <img class="poker-card__suit-lg" :src="suitIcon" alt="" />
  </div>
</template>

<style scoped lang="scss">
// 1rem = 37.5px  Default card: 69×103px, scale factor applied via v-bind

.poker-card {
  position: relative;
  flex-shrink: 0;
  width: calc(1.85rem * v-bind(scale));
  height: calc(2.75rem * v-bind(scale));
  border-radius: calc(0.32rem * v-bind(scale));
  background: #ffffff;
  overflow: hidden;

  &__rank {
    position: absolute;
    top: calc(0.1333rem * v-bind(scale));
    left: calc(0.1333rem * v-bind(scale));
    font-size: calc(0.72rem * v-bind(scale));
    font-weight: 700;
    line-height: 1;
    color: #000000;
  }

  &--red &__rank {
    color: #fa2b4b;
  }

  &__suit-sm {
    position: absolute;
    top: calc(0.15rem * v-bind(scale));
    right: calc(0.15rem * v-bind(scale));
    width: calc(0.7rem * v-bind(scale));
    height: calc(0.7rem * v-bind(scale));
    object-fit: contain;
  }

  &__suit-lg {
    position: absolute;
    bottom: calc(0.2667rem * v-bind(scale));
    left: calc(0.1333rem * v-bind(scale));
    width: calc(1.2rem * v-bind(scale));
    height: calc(1.2rem * v-bind(scale));
    object-fit: contain;
  }
}
</style>
