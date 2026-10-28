<script setup lang="ts">
import { t } from '@/i18n'
import { inviteRewardMock, rewardProgress } from '@/features/channelC/rewards'
import ChannelCRewardFrame from './ChannelCRewardFrame.vue'
import ChannelCRewardItems from './ChannelCRewardItems.vue'
import ChannelCRewardHint from './ChannelCRewardHint.vue'

const show = defineModel<boolean>('show', { required: true })
const { validInvites, tiers } = inviteRewardMock
</script>

<template>
  <ChannelCRewardFrame v-model:show="show" :title="t('UIChannelC_InviteTitle')">
    <p class="c-reward-intro">{{ t('UIChannelC_InviteIntro') }}</p>
    <div class="c-invite-total">
      <p>{{ t('UIChannelC_ValidInvites') }}</p>
      <strong>{{ validInvites }}</strong> {{ t('Common_People') }}
    </div>
    <div v-for="tier in tiers" :key="tier.target" class="c-invite-tier">
      <div>
        <strong>{{ t('UIChannelC_InviteTarget', tier.target) }}</strong>
        <p>{{ t('UIChannelC_TargetPeople', tier.target) }}</p>
      </div>
      <div class="c-invite-progress">
        <div class="c-invite-reward">
          <ChannelCRewardItems :reward="tier" />
          <span
            class="c-reward-status"
            :class="{ credited: validInvites >= tier.target }"
          >
            {{
              t(validInvites >= tier.target ? 'UIChannelC_Credited' : 'UIChannelC_Pending')
            }}
          </span>
        </div>
        <p>
          {{ t('UIChannelC_InviteProgress', validInvites, tier.target) }}
          <b>{{ rewardProgress(validInvites, tier.target) }}%</b>
        </p>
        <div class="c-reward-meter">
          <i :style="{ width: `${rewardProgress(validInvites, tier.target)}%` }"></i>
        </div>
        <p v-if="validInvites < tier.target">
          {{ t('UIChannelC_RemainingPeople', tier.target - validInvites) }}
        </p>
      </div>
    </div>
    <ChannelCRewardHint />
    <p class="c-reward-rule">ⓘ {{ t('UIChannelC_InviteRule') }}</p>
  </ChannelCRewardFrame>
</template>

<style scoped lang="scss">
@use './reward-common';
.c-invite-total,
.c-invite-tier {
  margin: 0.2rem 0;
  padding: 0.3rem;
  border: 1px solid #b2f7e53b;
  border-radius: 0.24rem;
  background: #ffffff0a;
}
.c-invite-total p {
  margin: 0;
  font-size: 0.36rem;
}
.c-invite-total strong {
  color: #ffe99a;
  font-size: 1.12rem;
  line-height: 1.25;
}
.c-invite-tier {
  display: grid;
  grid-template-columns: 34% 1fr;
  gap: 0.25rem;
}
.c-invite-tier > div:first-child {
  border-right: 1px solid #ffffff24;
}
.c-invite-tier strong {
  font-size: 0.37rem;
}
.c-invite-tier p {
  margin: 0.1rem 0;
  font-size: 0.27rem;
}
.c-invite-reward {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.12rem;
}
.c-invite-progress b {
  float: right;
}
</style>
