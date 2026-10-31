<script setup lang="ts">
import { t } from '@/i18n'
import { rewardProgress, type InviteRewardTier } from '@/features/channelC/rewards'
import ChannelCRewardLoadState from './ChannelCRewardLoadState.vue'
import ChannelCRewardFrame from './ChannelCRewardFrame.vue'
import ChannelCRewardItems from './ChannelCRewardItems.vue'
import ChannelCRewardHint from './ChannelCRewardHint.vue'
import ChannelCRewardStatus from './ChannelCRewardStatus.vue'
defineProps<{
  data: { validInvites: number; tiers: InviteRewardTier[] }
  loading?: boolean
  failed?: boolean
}>()
defineEmits<{ retry: [] }>()
const show = defineModel<boolean>('show', { required: true })
</script>

<template>
  <ChannelCRewardFrame v-model:show="show" kind="invite" :title="t('UIChannelC_InviteTitle')">
    <p class="c-reward-intro">{{ t('UIChannelC_InviteIntro') }}</p>
    <ChannelCRewardLoadState :loading="loading" :failed="failed" @retry="$emit('retry')">
      <div class="c-invite-total">
        <p>{{ t('UIChannelC_ValidInvites') }}</p>
        <div>
          <strong>{{ data.validInvites }}</strong>
          <span>{{ t('Common_People') }}</span>
        </div>
      </div>
      <div v-for="tier in data.tiers" :key="tier.target" class="c-invite-tier">
        <div class="c-invite-target">
          <strong>{{ t('UIChannelC_InviteTarget', tier.target) }}</strong>
          <p>{{ t('UIChannelC_TargetPeople', tier.target) }}</p>
        </div>
        <div class="c-invite-progress">
          <div class="c-invite-reward">
            <ChannelCRewardItems :reward="tier" kind="invite" />
            <ChannelCRewardStatus
              :credited="tier.credited"
              :completed="tier.completed"
              kind="invite"
            />
          </div>
          <p class="c-invite-progress-copy">
            <span>
{{
              t('UIChannelC_InviteProgress', tier.current ?? data.validInvites, tier.target)
            }}
</span>
            <span>
{{
                Math.round(rewardProgress(tier.current ?? data.validInvites, tier.target))
              }}%
</span>
          </p>
          <div
            class="c-reward-meter"
            role="progressbar"
            :aria-label="
              t('UIChannelC_InviteProgress', tier.current ?? data.validInvites, tier.target)
            "
            :aria-valuenow="rewardProgress(tier.current ?? data.validInvites, tier.target)"
            :aria-valuemin="0"
            :aria-valuemax="100"
          >
            <i
              :style="{
                width: `${rewardProgress(tier.current ?? data.validInvites, tier.target)}%`,
              }"
            ></i>
          </div>
          <p v-if="(tier.current ?? data.validInvites) < tier.target" class="c-invite-remaining">
            {{ t('UIChannelC_RemainingPeople', tier.target - (tier.current ?? data.validInvites)) }}
          </p>
        </div>
      </div>
      <p v-if="!data.tiers.length" class="c-reward-empty">{{ t('UIChannelC_NoRewards') }}</p>
    </ChannelCRewardLoadState>
    <ChannelCRewardHint kind="invite" />
    <div class="c-invite-rule">
      <span class="c-invite-info" aria-hidden="true">i</span>
      <p>{{ t('UIChannelC_InviteRule') }}</p>
    </div>
  </ChannelCRewardFrame>
</template>

<style scoped lang="scss">
@use './reward-common' as *;
.c-reward-intro {
  margin-bottom: r(15.3);
  font-size: r(11.083);
}
.c-invite-total {
  min-height: r(85.253);
  margin-bottom: r(5.97);
  padding: r(11.94) r(14.49) 0;
  border: r(0.853) solid #ffffff24;
  border-radius: r(10.23);
  background: #ffffff14;
}
.c-invite-total p {
  margin: 0;
  font-size: r(13.641);
  font-weight: 500;
}
.c-invite-total > div {
  display: flex;
  align-items: baseline;
  gap: r(10);
  color: #fff39b;
}
.c-invite-total strong {
  font-size: r(44.332);
  line-height: 1.05;
}
.c-invite-total span {
  font-size: r(18.756);
}
.c-invite-tier {
  display: grid;
  grid-template-columns: minmax(29.3%, min-content) minmax(0, 1fr);
  gap: r(14.49);
  margin-top: r(5.97);
  padding: r(10.23) r(14.49);
  border: r(0.853) solid #81b69e66;
  border-radius: r(10.23);
  background: #00000045;
}
.c-invite-target {
  padding: r(3.4) r(4) 0 0;
  border-right: r(0.853) solid #71a18a3b;
}
.c-invite-target strong {
  font-size: r(15.346);
}
.c-invite-target p {
  margin: r(5.1) 0 0;
  color: #bcdbd1;
  font-size: r(11.083);
}
.c-invite-reward {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: r(4);
  min-height: r(25);
}
.c-invite-progress-copy {
  display: flex;
  justify-content: space-between;
  gap: r(4);
  margin: r(4.84) 0 r(3.4);
  font-size: r(11.083);
}
.c-reward-meter {
  height: r(9.378);
  margin: 0;
  box-shadow: inset 0 0 0 r(0.853) rgba(101, 154, 136, 0.36);
}
.c-reward-meter i {
  box-shadow: 0 0 r(5.968) rgba(0, 232, 191, 0.36);
}
.c-invite-remaining {
  margin: r(7) 0 0;
  font-size: r(11.083);
}
.c-invite-rule {
  display: flex;
  align-items: center;
  gap: r(7.67);
  margin: r(5.1) r(9.38) 0;
  color: #bcdbd1;
}
.c-invite-rule p {
  margin: 0;
  font-size: r(9.378);
  line-height: 1.3;
}
.c-invite-info {
  display: grid;
  place-items: center;
  flex: none;
  width: r(19.608);
  height: r(19.608);
  border-radius: 50%;
  background: #00bda5;
  color: #ecfff9;
  font-size: r(13.641);
  font-weight: 700;
}
</style>
