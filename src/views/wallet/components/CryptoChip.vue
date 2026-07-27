<script setup lang="ts">
import iconUsdt from '@/assets/icons/wallet/ic_usdt.svg'

interface Props {
  amount: string | number
}

withDefaults(defineProps<Props>(), {})
</script>

<template>
  <div class="chip">
    <!-- <img :src="iconUsdt" alt="" class="chip__icon" /> -->
    <span class="chip__amount">需支付{{ amount }}</span>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 0.63rem;
  padding: 0.15rem 0.1rem;
  min-width: 0;
  max-width: 100%;
  gap: 0.04rem;

  @include theme-light-own {
    box-shadow: inset 0 0 0 0.5px var(--wallet-l-border);
  }
}

.chip__icon {
  width: 0.32rem;
  height: 0.32rem;
  flex-shrink: 0;
}

.chip__amount {
color: #161616;
text-align: right;
font-feature-settings: 'liga' off, 'clig' off;
font-family: "SF Pro";
font-size: 9.398px;
font-style: normal;
font-weight: 590;
line-height: 132%;
}
</style>
