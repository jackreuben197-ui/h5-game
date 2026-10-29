<script setup lang="ts">
import { t } from '@/i18n'
import checkIcon from '@/assets/channelC/reward-check.svg'
withDefaults(defineProps<{ credited: boolean; kind?: 'game' | 'invite' }>(), { kind: 'game' })
</script>

<template>
  <span class="c-reward-status" :class="[{ credited }, `c-reward-status--${kind}`]">
    <span v-if="credited" class="c-reward-status-icon" aria-hidden="true">
      <img class="c-reward-status-check" :src="checkIcon" alt="" />
    </span>
    <span class="c-reward-status-copy">{{ t(credited ? 'UIChannelC_Credited' : 'UIChannelC_Pending') }}</span>
  </span>
</template>

<style scoped lang="scss">
@use './reward-common' as *;
.c-reward-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: r(3);
  min-width: r(56.107);
  min-height: r(20.471);
  padding: r(2) r(4);
  border: r(0.758) solid rgba(197, 148, 53, 0.43);
  border-radius: r(17);
  color: #dec064;
  background: rgba(110, 85, 31, 0.27);
  font-size: r(9.857);
  font-weight: 400;
  line-height: 1.3;
  white-space: normal;
  text-align: center;
}
.credited {
  color: #8affce;
  border-color: #00c87680;
  background: #006d4473;
}
.c-reward-status-copy {
  min-width: 0;
  overflow-wrap: anywhere;
}
.c-reward-status-icon {
  position: relative;
  flex: none;
  width: r(12.889);
  height: r(12.889);
  border-radius: 50%;
  background: #00c684;
}
.c-reward-status-check {
  position: absolute;
  left: r(1.6);
  top: r(2.7);
  width: r(9.25);
  height: auto;
}
.c-reward-status--invite {
  min-width: r(59.677);
  min-height: r(23.018);
  font-size: r(11.083);
  .c-reward-status-icon {
    width: r(14.493);
    height: r(14.493);
  }
  .c-reward-status-check {
    left: r(1.8);
    top: r(3);
    width: r(10.401);
  }
}
</style>
