<script setup lang="ts">
import { t } from '@/i18n'
defineProps<{ loading?: boolean; failed?: boolean }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div :aria-busy="loading">
    <p v-if="loading" class="c-reward-load-state">
      <van-loading size="18" />
      <span>{{ t('UIChannelC_Loading') }}</span>
    </p>
    <div v-else-if="failed" class="c-reward-load-state">
      <p>{{ t('UIChannelC_RewardLoadFailed') }}</p>
      <button type="button" @click="$emit('retry')">{{ t('UIChannelC_Retry') }}</button>
    </div>
    <slot v-else></slot>
  </div>
</template>

<style scoped lang="scss">
.c-reward-load-state {
  padding: 0.35rem 0;
  color: #bcdbd1;
  text-align: center;
  font-size: 0.29rem;
}
.c-reward-load-state button {
  padding: 0.12rem 0.35rem;
  color: #ecfff9;
  background: #ffffff1a;
  border: 1px solid #ffffff40;
  border-radius: 0.2rem;
}
</style>
