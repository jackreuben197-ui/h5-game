<script setup lang="ts">
import { GameDialog } from '@/components/Dialog'
import { t } from '@/i18n'

withDefaults(defineProps<{ title: string; dialogWidth?: string }>(), {
  dialogWidth: 'min(9.3rem, calc(100vw - 0.48rem))',
})
const show = defineModel<boolean>('show', { required: true })
</script>

<template>
  <GameDialog
    v-model:show="show"
    :dialog-width="dialogWidth"
    body-max-height="78dvh"
    :show-footer="false"
    :close-on-click-overlay="true"
    :card-style="{ background: 'linear-gradient(155deg, #15594f, #032d27)', padding: '0.4rem' }"
  >
    <template #title>
      <header class="c-reward-heading">
        <button
          type="button"
          class="c-reward-close"
          :aria-label="t('adaptation10013')"
          @click="show = false"
        ></button>
        <h2>
          <span aria-hidden="true">✦</span>
          <strong>{{ title }}</strong>
          <span aria-hidden="true">✦</span>
        </h2>
      </header>
    </template>
    <section class="c-reward-frame">
      <slot></slot>
    </section>
  </GameDialog>
</template>

<style scoped lang="scss">
.c-reward-frame {
  color: #effffb;
  font-size: 0.31rem;
  text-align: left;
}
.c-reward-heading {
  position: relative;
  min-height: 0.8rem;
  color: #effffb;
}
h2 {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
  align-items: center;
  margin: 0 0.85rem;
  font-size: 0.57rem;
  line-height: 1.4;
  text-align: center;
}
h2 span {
  color: #fff0a7;
}
.c-reward-close {
  position: absolute;
  top: 0;
  right: 0;
  display: grid;
  place-items: center;
  width: 0.72rem;
  height: 0.72rem;
  padding: 0;
  border: 1px solid #b6ffed55;
  border-radius: 50%;
  background: #ffffff12;
  color: #fff;
  cursor: pointer;
}
.c-reward-close::before,
.c-reward-close::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0.32rem;
  height: 1.5px;
  border-radius: 1px;
  background: currentColor;
  transform: translate(-50%, -50%) rotate(45deg);
}
.c-reward-close::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}
</style>
