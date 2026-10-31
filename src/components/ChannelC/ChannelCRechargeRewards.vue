<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '@/i18n'
import { requireRealUser } from '@/session/realUserGate'
import type { RechargeActivityTier } from '@/features/channelC/rewards'
import ChannelCRewardLoadState from './ChannelCRewardLoadState.vue'
import ChannelCRewardFrame from './ChannelCRewardFrame.vue'
import ChannelCRewardItems from './ChannelCRewardItems.vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import coin from '@/assets/icons/wallet/ic_coins.png'
const props = defineProps<{
  tournamentName: string
  data: { first: RechargeActivityTier[]; daily: RechargeActivityTier[] }
  loading?: boolean
  failed?: boolean
}>()
defineEmits<{ retry: [] }>()
const show = defineModel<boolean>('show', { required: true })
const mode = ref<'first' | 'daily'>('first')
const router = useRouter()
const tiers = computed(() => props.data[mode.value])
function recharge() {
  if (!requireRealUser(recharge)) return
  show.value = false
  void router.push('/wallet')
}
</script>

<template>
  <ChannelCRewardFrame
    v-model:show="show"
    kind="recharge"
    :thin-border="mode === 'daily'"
    :title="t('UIChannelC_RechargeTitle')"
  >
    <div class="c-reward-tabs" role="tablist" :aria-label="t('UIChannelC_RechargeTitle')">
      <button
        type="button"
        role="tab"
        :aria-selected="mode === 'first'"
        :class="{ active: mode === 'first' }"
        @click="mode = 'first'"
      >
        {{ t('UIChannelC_FirstRecharge') }}
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="mode === 'daily'"
        :class="{ active: mode === 'daily' }"
        @click="mode = 'daily'"
      >
        {{ t('UIChannelC_DailyRecharge') }}
      </button>
    </div>
    <div class="c-recharge-promotion">
      <p>
        {{
          t(mode === 'first' ? 'UIChannelC_FirstRechargeIntro' : 'UIChannelC_DailyRechargeIntro')
        }}
      </p>
    </div>
    <ChannelCRewardLoadState :loading="loading" :failed="failed" @retry="$emit('retry')">
      <div class="c-recharge-tiers">
        <div
          v-for="(tier, index) in tiers"
          :key="`${tier.from}-${tier.to}-${index}`"
          class="c-recharge-tier"
          :class="{ 'c-recharge-tier--combined': tier.reward_gold && tier.rewards.length }"
        >
          <div class="c-recharge-amount">
            <p>{{ t('UIChannelC_SingleRecharge') }}</p>
            <strong>
              <span class="c-recharge-coin"><img :src="coin" alt="" /></span>
              <span>{{ tier.from }}-{{ tier.to }}</span>
            </strong>
          </div>
          <ChannelCRewardItems :reward="tier" :tournament-name="tournamentName" kind="recharge" />
        </div>
        <p v-if="!tiers.length" class="c-reward-empty">{{ t('UIChannelC_NoRewards') }}</p>
      </div>
    </ChannelCRewardLoadState>
    <div class="c-recharge-rules" :class="{ 'c-recharge-rules--first': mode === 'first' }">
      <p>
        {{
          t(
            mode === 'first'
              ? 'UIChannelC_FirstRechargeEligibility'
              : 'UIChannelC_DailyRechargeEligibility',
          )
        }}
      </p>
      <p>{{ t('UIChannelC_RechargeRange') }}</p>
    </div>
    <PrimaryButton
      class="c-reward-primary"
      :text="t('UIHappyShop_ToRechange')"
      :shadow="false"
      @click="recharge"
    />
  </ChannelCRewardFrame>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;
@use './reward-common' as *;
.c-reward-tabs {
  gap: r(3.78);
  margin: 0 r(5.66) r(11.33);
}
.c-reward-tabs button {
  min-height: r(35.867);
  border-color: rgba(64, 118, 101, 0.3);
  border-radius: r(23.597);
  background: #0000002e;
  font-size: r(14.158);
}
.c-reward-tabs button.active {
  border-color: rgba(255, 197, 208, 0.5);
  background: #05c297;
  box-shadow: none;
}
.c-recharge-promotion {
  display: flex;
  align-items: center;
  gap: r(5.66);
  min-height: r(39.643);
  padding: r(6) r(9.5) r(6) r(11.33);
  border: r(0.944) solid #ffffff2e;
  border-radius: r(10.383);
  background: #ffffff1a;
  box-shadow: inset 0 0 r(7.551) rgba(73, 218, 178, 0.23);
}
.c-recharge-promotion::before {
  content: '';
  flex: none;
  width: r(5.663);
  height: r(5.663);
  margin-inline: r(6.607);
  border-radius: 50%;
  background: #00f1ce;
  box-shadow: 0 0 r(6.607) #00ffd4;
}
.c-recharge-promotion p {
  margin: 0;
  font-size: r(12.27);
  font-weight: 500;
}
.c-recharge-tiers {
  display: flex;
  flex-direction: column;
  gap: r(10);
  min-height: r(216.15);
  margin-top: r(12.27);
}
.c-recharge-tier {
  display: grid;
  grid-template-columns: r(130.1) minmax(0, 1fr);
  align-items: center;
  min-height: r(63.24);
  padding: r(8.49) r(10) r(8.49) r(14.16);
  border: r(0.944) solid #5a9a7d33;
  border-radius: r(12.27);
  background: #00000045;
}
.c-recharge-tier--combined {
  min-height: r(69.847);
}
.c-recharge-amount {
  position: relative;
  margin-right: r(14.15);
}
.c-recharge-amount::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 0;
  width: r(0.944);
  height: r(33.036);
  background: #7aa79133;
  transform: translateY(-50%);
}
.c-recharge-amount p {
  margin: 0 0 r(5);
  font-size: r(12.27);
}
.c-recharge-amount strong {
  display: flex;
  align-items: center;
  gap: r(5.66);
  margin-left: r(-2.83);
  font-size: r(16.99);
  overflow-wrap: anywhere;
}
.c-recharge-coin {
  @include reward-coin(r(25.485));
}
.c-recharge-rules {
  margin: r(12.27) 0 r(15.1);
  text-align: center;
}
.c-recharge-rules p {
  margin: 0;
  font-size: r(12.27);
  line-height: 1.3;
}
.c-recharge-rules p + p {
  margin-top: r(6.65);
  font-size: r(11.327);
}
.c-recharge-rules--first p:first-child {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: r(10);

  &::before,
  &::after {
    content: '';
    flex: none;
    width: r(29);
    height: r(0.944);
    background: #93b5a366;
  }
}
.c-reward-primary {
  width: calc(100% - #{r(7.55)});
  height: r(52.857);
  margin: 0 auto;
  border: r(0.944) solid rgba(255, 181, 204, 0.4);
  border-radius: r(30.204);
  background: #05c297;
  color: #ecfff9;
  font-family: inherit;
  font-size: r(19.821);
  font-weight: 700;

  @include theme-dark {
    color: #130c16;
  }
}
.c-reward-primary::before {
  display: none;
}
.c-reward-empty button {
  border: 1px solid #ffffff40;
  border-radius: r(8);
  background: transparent;
  color: inherit;
  cursor: pointer;
}
</style>
