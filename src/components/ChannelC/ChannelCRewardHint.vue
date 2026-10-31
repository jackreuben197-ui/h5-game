<script setup lang="ts">
import { computed } from 'vue'
import { t, ucLabel } from '@/i18n'
import giftIcon from '@/assets/channelC/reward-gift.svg'
const props = withDefaults(defineProps<{ kind?: 'game' | 'invite' }>(), { kind: 'game' })
const coinLocation = computed(() => {
  const text = t('UIChannelC_CoinRewardLocation')
  const label = ucLabel()
  return props.kind === 'invite' && label !== 'UC' ? text.replace(label, `${label}（UC）`) : text
})
</script>

<template>
  <div class="c-reward-hint" :class="`c-reward-hint--${kind}`">
    <img :src="giftIcon" alt="" />
    <div>
      <strong>{{ t('UIChannelC_AutoReward') }}</strong>
      <p>{{ coinLocation }}</p>
      <p>{{ t('UIChannelC_TicketRewardLocation') }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use './reward-common' as *;
.c-reward-hint {
  display: flex;
  align-items: center;
  gap: r(15.16);
  min-height: r(64.447);
  margin-top: r(6.8);
  padding: r(6.06) r(12) r(6.06) r(27.3);
  border: r(0.758) solid #ffffff29;
  border-radius: r(9.098);
  background: #ffffff14;
  font-size: r(11.373);
  line-height: 1.3;
}
.c-reward-hint img {
  flex: none;
  width: r(47.008);
  height: auto;
}
.c-reward-hint p {
  margin: r(3) 0 0;
  color: #bcdbd1;
  font-size: r(9.857);
}
.c-reward-hint--invite {
  gap: r(12.78);
  min-height: r(69.908);
  margin-top: r(5.96);
  padding: r(6.82) r(10) r(6.82) r(22.17);
  border-color: #ffffff1a;
  border-radius: r(10.23);
  font-size: r(11.935);
  img {
    width: r(52.857);
  }
  p {
    margin-top: r(4);
    font-size: r(10.23);
  }
}
</style>
