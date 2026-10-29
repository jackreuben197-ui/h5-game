<script setup lang="ts">
import { computed, ref } from 'vue'
import { t } from '@/i18n'
import { rewardProgress, type GameRewardTier } from '@/features/channelC/rewards'
import ChannelCRewardLoadState from './ChannelCRewardLoadState.vue'
import ChannelCRewardFrame from './ChannelCRewardFrame.vue'
import ChannelCRewardItems from './ChannelCRewardItems.vue'
import ChannelCRewardHint from './ChannelCRewardHint.vue'
import ChannelCRewardStatus from './ChannelCRewardStatus.vue'
const props = defineProps<{
  tournamentName: string
  groups: GameRewardTier[][]
  loading?: boolean
  failed?: boolean
}>()
defineEmits<{ retry: [] }>()
const show = defineModel<boolean>('show', { required: true })
const level = ref(1)
const levels = ['UIGuild_Tiny', 'UIGuild_Small', 'UIGuild_Middle', 'UIGuild_Big']
const tiers = computed(() => props.groups[level.value] ?? [])
</script>

<template>
  <ChannelCRewardFrame v-model:show="show" :title="t('UIChannelC_GameReward')">
    <p class="c-reward-intro">{{ t('UIChannelC_RewardIntro') }}</p>
    <div class="c-reward-tabs" role="tablist" :aria-label="t('adaptation20006')">
      <button
        v-for="(key, index) in levels"
        :key="key"
        type="button"
        role="tab"
        :aria-selected="level === index"
        :class="{ active: level === index }"
        @click="level = index"
      >
        {{ t(key) }}
      </button>
    </div>
    <ChannelCRewardLoadState :loading="loading" :failed="failed" @retry="$emit('retry')">
      <table class="c-game-rewards">
        <colgroup>
          <col class="c-game-blind-col" />
          <col class="c-game-progress-col" />
          <col class="c-game-reward-col" />
          <col class="c-game-status-col" />
        </colgroup>
        <thead>
          <tr>
            <th>
              {{ t('adaptation20006') }}<small>{{ t('UIChannelC_BlindPair') }}</small>
            </th>
            <th>{{ t('UIChannelC_ProgressHands') }}</th>
            <th>{{ t('MTT_State_Reward') }}</th>
            <th>{{ t('state') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="tier in tiers"
            :key="tier.sb"
            :class="{ 'c-game-bonus-row': tier.rewards.length }"
          >
            <td
              class="c-reward-amount"
              :class="{ 'c-reward-amount--compact': tier.blind.length > 6 }"
            >
              {{ tier.blind }}
            </td>
            <td>
              <p class="c-game-progress-copy">
                <b>{{ tier.played }}</b>{{ t('UIChannelC_HandCount', '', tier.required) }}
              </p>
              <div
                class="c-reward-meter"
                role="progressbar"
                :aria-label="t('UIChannelC_HandCount', tier.played, tier.required)"
                :aria-valuenow="rewardProgress(tier.played, tier.required)"
                :aria-valuemin="0"
                :aria-valuemax="100"
              >
                <i :style="{ width: `${rewardProgress(tier.played, tier.required)}%` }"></i>
              </div>
            </td>
            <td><ChannelCRewardItems :reward="tier" :tournament-name="tournamentName" /></td>
            <td><ChannelCRewardStatus :credited="tier.credited" :completed="tier.completed" /></td>
          </tr>
          <tr v-if="!tiers.length">
            <td colspan="4" class="c-reward-empty">{{ t('UIChannelC_NoRewards') }}</td>
          </tr>
        </tbody>
      </table>
    </ChannelCRewardLoadState>
    <ChannelCRewardHint />
  </ChannelCRewardFrame>
</template>

<style scoped lang="scss">
@use './reward-common' as *;
.c-reward-tabs {
  margin: 0 r(6.07) r(7.58);
}
.c-game-rewards {
  width: 100%;
  border-spacing: 0;
  table-layout: fixed;
  text-align: left;
}
.c-game-blind-col {
  width: 18.1%;
}
.c-game-progress-col {
  width: 34%;
}
.c-game-reward-col {
  width: 29%;
}
.c-game-status-col {
  width: 18.9%;
}
.c-game-rewards th,
.c-game-rewards td {
  padding: r(5) r(4);
  border-top: r(0.758) solid #5b9c8145;
  border-bottom: r(0.758) solid #5b9c8145;
  background: #14141461;
}
.c-game-rewards th:first-child,
.c-game-rewards td:first-child {
  padding-left: r(9.1);
  border-left: r(0.758) solid #5b9c8145;
  border-radius: r(9.098) 0 0 r(9.098);
}
.c-game-rewards th:last-child,
.c-game-rewards td:last-child {
  padding-right: r(5);
  border-right: r(0.758) solid #5b9c8145;
  border-radius: 0 r(9.098) r(9.098) 0;
}
.c-game-rewards th {
  height: r(34.119);
  font-size: r(9.857);
  line-height: 1.3;
  font-weight: 700;
}
.c-game-rewards th:last-child {
  text-align: center;
}
.c-game-rewards th small {
  display: block;
  color: #bcdbd1;
  font-size: r(8.34);
  font-weight: 400;
}
.c-game-rewards td {
  height: r(38.668);
  font-size: r(10.615);
  vertical-align: middle;
}
.c-game-rewards .c-game-bonus-row td {
  height: r(50.8);
}
.c-game-rewards .c-reward-amount {
  color: #fff39b;
  font-size: r(16.68);
  font-weight: 700;
  white-space: nowrap;
}
.c-game-rewards .c-reward-amount--compact {
  font-size: r(10.5);
}
.c-game-progress-copy {
  margin: 0;
  color: #bcdbd1;
  font-size: r(10.615);
  white-space: pre-wrap;
}
.c-game-progress-copy b {
  color: #fff39b;
}
.c-reward-meter {
  width: 90%;
}
.c-game-rewards :deep(.c-reward-status) {
  min-width: 100%;
  padding-inline: r(2);
}
</style>
