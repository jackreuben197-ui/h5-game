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
  <ChannelCRewardFrame v-model:show="show" kind="recharge" :title="t('UIChannelC_RechargeTitle')">
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
    <div class="c-recharge-rules">
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
@use './reward-common' as *;
.c-reward-tabs {
  gap: r(3.78);
  margin: 0 r(5.66) r(11.33);
}
.c-reward-tabs button {
  min-height: r(35.867);
  border-radius: r(22.65);
  background: #00000045;
  font-size: r(14.158);
}
.c-reward-tabs button.active {
  background: #69beff;
}
.c-recharge-promotion {
  display: flex;
  align-items: center;
  gap: r(1.5);
  min-height: r(39.643);
  padding: r(6) r(9.5);
  border: r(0.944) solid #ffffff2e;
  border-radius: r(10.383);
  background: #ffffff1a;
  box-shadow: inset 0 0 r(4) #69beff33;
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
  grid-template-columns: 40% minmax(0, 1fr);
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
  margin-right: r(12);
  border-right: r(0.944) solid #7aa79133;
}
.c-recharge-amount p {
  margin: 0 0 r(5);
  font-size: r(12.27);
}
.c-recharge-amount strong {
  display: flex;
  align-items: center;
  gap: r(3);
  font-size: r(16.99);
  overflow-wrap: anywhere;
}
.c-recharge-coin {
  display: block;
  flex: none;
  width: r(22);
  height: r(22);
}
.c-recharge-coin img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
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
  margin-top: r(8);
  font-size: r(11.327);
}
.c-reward-primary {
  width: calc(100% - #{r(7.55)});
  height: r(52.857);
  margin: 0 auto;
  border: r(0.944) solid #ffffff66;
  border-radius: r(30.204);
  background: #69beff;
  color: #ecfff9;
  font-family: inherit;
  font-size: r(19.821);
  font-weight: 700;
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
