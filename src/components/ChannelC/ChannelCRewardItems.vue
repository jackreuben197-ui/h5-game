<script setup lang="ts">
import { t } from '@/i18n'
import type { RewardBundle } from '@/features/channelC/rewards'
import { rewardItemName } from '@/features/rechargeReward/display'
import coin from '@/assets/icons/wallet/ic_coins.png'
import ticket from '@/assets/channelC/reward-ticket.svg'
withDefaults(
  defineProps<{
    reward: RewardBundle
    tournamentName?: string
    kind?: 'game' | 'recharge' | 'invite'
  }>(),
  { tournamentName: 'MTT', kind: 'game' },
)
</script>

<template>
  <div class="c-reward-items" :class="`c-reward-items--${kind}`">
    <span v-if="reward.reward_gold > 0" class="c-reward-coins">
      <span class="c-reward-coin"><img :src="coin" alt="" /></span>
      <b>{{ reward.reward_gold }}</b>
      <span class="c-reward-coin-label">{{ t('UIChannelC_AllianceCoin') }}</span>
    </span>
    <span v-for="item in reward.rewards" :key="item.prop_id" class="c-reward-ticket">
      <img
        v-if="kind === 'recharge'"
        class="c-reward-ticket-icon"
        :src="item.icon || ticket"
        alt=""
      />
      <span>
        {{
          t(
            kind === 'recharge' ? 'UIChannelC_TicketGift' : 'UIChannelC_GameTicketReward',
            rewardItemName(item.name, item.multi_language, tournamentName),
            item.quantity,
          )
        }}
        <small v-if="item.value && item.value > 0">
          ({{ t('UIRechargeReward_Value', item.value) }} ×{{ item.quantity }})
        </small>
      </span>
    </span>
    <span v-if="reward.reward_gold === 0 && !reward.rewards.length">—</span>
  </div>
</template>

<style scoped lang="scss">
@use './reward-common' as *;
.c-reward-items {
  display: flex;
  flex-direction: column;
  gap: r(2);
  min-width: 0;
  color: #fff39b;
  font-size: r(10.615);
  line-height: 1.3;
}
.c-reward-coins {
  display: flex;
  align-items: center;
  gap: r(3);
}
.c-reward-coin {
  display: inline-block;
  flex: none;
  width: r(22);
  height: r(22);
}
.c-reward-coin img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.c-reward-ticket {
  display: flex;
  align-items: center;
  min-width: 0;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.c-reward-ticket-icon {
  flex: none;
  width: r(33.98);
  height: auto;
  margin-right: r(6.6);
}
.c-reward-ticket small {
  font-size: r(9);
  font-weight: 400;
  opacity: 0.8;
}
.c-reward-items--game .c-reward-ticket {
  font-size: r(10);
}
.c-reward-items--recharge {
  color: #ecfff9;
  font-size: r(11.327);
  .c-reward-coins {
    order: 1;
    color: #fff39b;
    font-size: r(12.27);
  }
  .c-reward-coins b {
    font-weight: 400;
  }
  .c-reward-coins b::before {
    content: '+ ';
  }
}
.c-reward-items--invite {
  .c-reward-coins {
    gap: r(4);
  }
  .c-reward-coins b {
    font-size: r(17.051);
  }
  .c-reward-coin-label {
    color: #bcdbd1;
    font-size: r(10.23);
  }
}
</style>
