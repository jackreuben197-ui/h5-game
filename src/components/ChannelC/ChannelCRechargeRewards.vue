<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '@/i18n'
import { requireRealUser } from '@/session/realUserGate'
import { rechargeRewardTiers } from '@/features/channelC/rewards'
import ChannelCRewardFrame from './ChannelCRewardFrame.vue'
import ChannelCRewardItems from './ChannelCRewardItems.vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import coin from '@/assets/icons/icon_chips.png'

defineProps<{ tournamentName: string }>()
const show = defineModel<boolean>('show', { required: true })
const mode = ref<'first' | 'daily'>('first')
const router = useRouter()

function recharge() {
  if (!requireRealUser(recharge)) return
  show.value = false
  void router.push('/wallet')
}
</script>

<template>
  <ChannelCRewardFrame v-model:show="show" :title="t('UIChannelC_RechargeTitle')">
    <div class="c-reward-tabs">
      <button type="button" :class="{ active: mode === 'first' }" @click="mode = 'first'">
        {{ t('UIChannelC_FirstRecharge') }}
      </button>
      <button type="button" :class="{ active: mode === 'daily' }" @click="mode = 'daily'">
        {{ t('UIChannelC_DailyRecharge') }}
      </button>
    </div>
    <p class="c-recharge-promotion">
      ●
      {{ t(mode === 'first' ? 'UIChannelC_FirstRechargeIntro' : 'UIChannelC_DailyRechargeIntro') }}
    </p>
    <div v-for="tier in rechargeRewardTiers" :key="tier.from" class="c-recharge-tier">
      <div>
        <p>{{ t('UIChannelC_SingleRecharge') }}</p>
        <strong><img :src="coin" alt="" />{{ tier.from }}–{{ tier.to }}</strong>
      </div>
      <ChannelCRewardItems :reward="tier" :tournament-name="tournamentName" />
    </div>
    <p class="c-reward-rule">
      {{ t(mode === 'first' ? 'UIChannelC_FirstRechargeRule' : 'UIChannelC_DailyRechargeRule') }}
    </p>
    <PrimaryButton
      class="c-reward-primary"
      :text="t('UIHappyShop_ToRechange')"
      :shadow="false"
      @click="recharge"
    />
  </ChannelCRewardFrame>
</template>

<style scoped lang="scss">
@use './reward-common';
.c-recharge-promotion {
  padding: 0.2rem 0.3rem;
  border: 1px solid #8ff4e55e;
  border-radius: 0.2rem;
  background: #08b7a630;
  color: #b6fff1;
  font-weight: 700;
}
.c-recharge-tier {
  display: grid;
  grid-template-columns: 39% 1fr;
  align-items: center;
  gap: 0.22rem;
  margin: 0.22rem 0;
  padding: 0.25rem 0.28rem;
  border: 1px solid #b2f7e52b;
  border-radius: 0.24rem;
  background: #001d1966;
}
.c-recharge-tier p {
  margin: 0 0 0.1rem;
  font-size: 0.27rem;
}
.c-recharge-tier strong {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  font-size: 0.43rem;
}
.c-recharge-tier img {
  width: 0.58rem;
  height: 0.58rem;
  object-fit: contain;
}
</style>
