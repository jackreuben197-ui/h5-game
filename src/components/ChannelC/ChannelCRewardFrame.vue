<script setup lang="ts">
import { GameDialog } from '@/components/Dialog'
import { t } from '@/i18n'
import type { RewardKind } from '@/features/channelC/rewards'
import closeIcon from '@/assets/channelC/reward-close.svg'

withDefaults(defineProps<{ title: string; kind?: RewardKind }>(), { kind: 'game' })
const show = defineModel<boolean>('show', { required: true })
</script>

<template>
  <GameDialog
    v-model:show="show"
    class="c-reward-dialog"
    :class="`c-reward-dialog--${kind}`"
    dialog-width="min(9.4872rem, calc(100vw - 0.5128rem))"
    body-max-height="calc(100dvh - 3rem)"
    :show-footer="false"
    :close-on-click-overlay="true"
    :overlay-style="{ '--c-overlay': 'rgba(0, 0, 0, 0.53)' }"
    :card-style="{
      background: 'rgba(0, 0, 0, 0.1)',
      border: 'var(--reward-card-border)',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    }"
  >
    <template #title>
      <header class="c-reward-heading">
        <h2>
          <span aria-hidden="true">✦</span>
          <strong>{{ title }}</strong>
          <span aria-hidden="true">✦</span>
        </h2>
        <button
          type="button"
          class="c-reward-close"
          :aria-label="t('adaptation10013')"
          @click="show = false"
        >
          <img :src="closeIcon" alt="" />
        </button>
      </header>
    </template>
    <section class="c-reward-frame"><slot></slot></section>
  </GameDialog>
</template>

<style lang="scss">
@use 'sass:math';
@function r($px) {
  @return math.div($px, 39) * 1rem;
}

.c-reward-dialog.van-dialog {
  top: calc(50% + #{r(0.94)});
  max-width: calc(100vw - 0.5128rem);
}

// 虚化与 Vant 淡入位于同一层，避免父层 opacity 动画隔断内层的背景采样。
.game-dialog.c-reward-dialog.van-dialog {
  border-radius: var(--reward-card-radius) !important;
  backdrop-filter: blur(72px);
  -webkit-backdrop-filter: blur(72px);
}

// GameDialog 会 teleport；活动弹窗专用类隔离全局主题覆盖。
.c-reward-dialog {
  --reward-card-border: #{r(0.2)} solid rgba(242, 242, 242, 0.6);
  --reward-card-radius: #{r(21.988)};
  --reward-heading-size: #{r(21.988)};
  --reward-close-size: #{r(28.811)};
  --reward-close-top: #{r(-7.58)};
  --reward-close-right: #{r(-2.28)};
  .game-dialog__card {
    gap: r(4.58);
    padding: r(20.47) r(14.96) r(19.47);
    border: r(0.2) solid rgba(242, 242, 242, 0.6);
    border-radius: var(--reward-card-radius);
    background: rgba(0, 0, 0, 0.1);
    box-shadow: inset r(-2.275) r(-2.275) r(10.615) rgba(255, 255, 255, 0.4),
      inset r(1.516) r(2.275) r(23.86) rgba(255, 255, 255, 0.64),
      0 r(5.307) r(13.648) rgba(0, 0, 0, 0.19);
  }
  .game-dialog__title,
  .game-dialog__body {
    font-family: var(--font-family-sf);
    line-height: 1.3;
  }
  .c-reward-frame {
    color: #ecfff9;
    font-size: r(11);
    text-align: left;
  }
  .c-reward-heading {
    position: relative;
  }
  .c-reward-heading h2 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: r(12);
    margin: 0 r(30);
    color: #ecfff9;
    font-size: var(--reward-heading-size);
    line-height: 1.3;
  }
  .c-reward-heading h2 span {
    color: #fff39b;
    font-weight: 400;
    font-size: 0.94em;
  }
  .c-reward-close {
    position: absolute;
    top: var(--reward-close-top);
    right: var(--reward-close-right);
    display: grid;
    place-items: center;
    width: var(--reward-close-size);
    height: var(--reward-close-size);
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }
  .c-reward-close img {
    display: block;
    width: var(--reward-close-size);
    height: auto;
  }
  button:focus-visible {
    outline: 2px solid #ecfff9;
    outline-offset: 2px;
  }
}
.c-reward-dialog--recharge {
  --reward-card-border: #{r(1.227)} solid rgba(242, 242, 242, 0.6);
  --reward-card-radius: #{r(27.372)};
  --reward-heading-size: #{r(26.429)};
  --reward-close-size: #{r(35.867)};
  --reward-close-top: #{r(-12.3)};
  --reward-close-right: #{r(-6.4)};
  .game-dialog__card {
    gap: r(13.22);
    padding: r(25.5) r(19.54) r(26.8);
    border-width: r(1.227);
  }
}
.c-reward-dialog--invite {
  --reward-card-radius: #{r(24.724)};
  --reward-heading-size: #{r(26.429)};
  --reward-close-size: #{r(32.396)};
  --reward-close-top: #{r(-9.38)};
  --reward-close-right: #{r(-3.5)};
  .game-dialog__card {
    gap: r(11.68);
    padding: r(23.67) r(17.7) r(15.15);
  }
}
</style>
