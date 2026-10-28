<script setup lang="ts">
import { computed, ref } from 'vue'
import { t } from '@/i18n'
import { gameRewardGroups, rewardProgress } from '@/features/channelC/rewards'
import ChannelCRewardFrame from './ChannelCRewardFrame.vue'
import ChannelCRewardItems from './ChannelCRewardItems.vue'
import ChannelCRewardHint from './ChannelCRewardHint.vue'

defineProps<{ tournamentName: string }>()
const show = defineModel<boolean>('show', { required: true })
const level = ref(1)
const levels = ['UIGuild_Tiny', 'UIGuild_Small', 'UIGuild_Middle', 'UIGuild_Big']
const tiers = computed(() => gameRewardGroups[level.value]!)
</script>

<template>
  <ChannelCRewardFrame
    v-model:show="show"
    :title="t('UIChannelC_GameReward')"
    dialog-width="min(10.8rem, calc(100vw - 0.48rem))"
  >
    <p class="c-reward-intro">{{ t('UIChannelC_RewardIntro') }}</p>
    <div class="c-reward-tabs">
      <button
        v-for="(key, index) in levels"
        :key="key"
        type="button"
        :class="{ active: level === index }"
        @click="level = index"
      >
        {{ t(key) }}
      </button>
    </div>
    <table class="c-game-rewards">
      <thead>
        <tr>
          <th>{{ t('adaptation20006') }}</th>
          <th>{{ t('UIChannelC_ProgressHands') }}</th>
          <th>{{ t('MTT_State_Reward') }}</th>
          <th>{{ t('state') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tier in tiers" :key="tier.blind">
          <td class="c-reward-amount">{{ tier.blind }}</td>
          <td>
            <b>{{ t('UIChannelC_HandCount', tier.played, tier.required) }}</b>
            <div class="c-reward-meter">
              <i :style="{ width: `${rewardProgress(tier.played, tier.required)}%` }"></i>
            </div>
          </td>
          <td><ChannelCRewardItems :reward="tier" :tournament-name="tournamentName" /></td>
          <td>
            <span class="c-reward-status" :class="{ credited: tier.played >= tier.required }">
              {{ t(tier.played >= tier.required ? 'UIChannelC_Credited' : 'UIChannelC_Pending') }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <ChannelCRewardHint />
  </ChannelCRewardFrame>
</template>

<style scoped lang="scss">
@use './reward-common';
.c-game-rewards {
  width: 100%;
  border-spacing: 0 0.1rem;
  table-layout: fixed;
  text-align: left;
}
th {
  font-size: 0.25rem;
  font-weight: 500;
  padding: 0.16rem 0.08rem;
  word-break: keep-all;
}
th:first-child {
  width: 25%;
}
th:nth-child(2) {
  width: 26%;
}
th:nth-child(3) {
  width: 31%;
}
th:last-child {
  width: 18%;
}
td {
  padding: 0.18rem 0.08rem;
  border-top: 1px solid #b2f7e52b;
  border-bottom: 1px solid #b2f7e52b;
  background: #001d1980;
  font-size: 0.26rem;
}
td:first-child {
  border-left: 1px solid #b2f7e52b;
  border-radius: 0.2rem 0 0 0.2rem;
}
td:last-child {
  border-right: 1px solid #b2f7e52b;
  border-radius: 0 0.2rem 0.2rem 0;
}
.c-reward-amount {
  font-size: 0.34rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.c-game-rewards :deep(.c-reward-items) {
  min-width: 0;
  font-size: 0.26rem;
  overflow-wrap: anywhere;
}
.c-game-rewards :deep(.c-reward-items span) {
  flex-wrap: wrap;
  gap: 0.04rem 0.06rem;
}
</style>
