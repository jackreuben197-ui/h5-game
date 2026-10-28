<script setup lang="ts">
import { t } from '@/i18n'
import gift from '@/assets/icons/wallet/ic_gift.png'
</script>

<template>
  <div class="c-reward-hint">
    <img :src="gift" alt="" />
    <div>
      <strong>{{ t('UIChannelC_AutoReward') }}</strong>
      <p>{{ t('UIChannelC_RewardLocation') }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-reward-hint {
  display: flex;
  align-items: center;
  gap: 0.24rem;
  margin-top: 0.22rem;
  padding: 0.25rem;
  border: 1px solid #b2f7e53b;
  border-radius: 0.24rem;
  background: #ffffff0a;
  font-size: 0.29rem;
  line-height: 1.6;
}
.c-reward-hint img {
  width: 1.1rem;
  height: 1.1rem;
  object-fit: contain;
}
p {
  margin: 0.08rem 0 0;
  font-size: 0.26rem;
}
</style>
