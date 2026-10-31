<script setup lang="ts">
import { computed } from 'vue'
import { t, ucLabel } from '@/i18n'
import type { RewardBundle } from '@/features/channelC/rewards'
import { rewardItemName } from '@/features/rechargeReward/display'
import coin from '@/assets/icons/wallet/ic_coins.png'
import ticket from '@/assets/channelC/reward-ticket.svg'
import gameTicket from '@/assets/channelC/reward-ticket-game.svg'
const props = withDefaults(
  defineProps<{
    reward: RewardBundle
    tournamentName?: string
    kind?: 'game' | 'recharge' | 'invite'
  }>(),
  { tournamentName: 'MTT', kind: 'game' },
)
const tickets = computed(() =>
  props.reward.rewards.map((item) => {
    const name = rewardItemName(item.name, item.multi_language, props.tournamentName)
    const quantity = `×${item.quantity}`
    const text =
      props.kind === 'game'
        ? `${name} ${quantity}`
        : t(
            props.kind === 'recharge' ? 'UIChannelC_TicketGift' : 'UIChannelC_GameTicketReward',
            name,
            item.quantity,
          )
    const index = text.lastIndexOf(quantity)
    return {
      item,
      icon: props.kind === 'invite' ? '' : item.icon || (props.kind === 'game' ? gameTicket : ticket),
      before: index < 0 ? text : text.slice(0, index),
      quantity: index < 0 ? '' : quantity,
      after: index < 0 ? '' : text.slice(index + quantity.length),
    }
  }),
)
</script>

<template>
  <div class="c-reward-items" :class="`c-reward-items--${kind}`">
    <span v-if="reward.reward_gold > 0" class="c-reward-coins">
      <span class="c-reward-coin"><img :src="coin" alt="" /></span>
      <b>{{ reward.reward_gold }}</b>
      <span class="c-reward-coin-label">{{ ucLabel() }}</span>
    </span>
    <span
      v-for="{ item, icon, before, quantity, after } in tickets"
      :key="item.prop_id"
      class="c-reward-ticket"
    >
      <span v-if="icon" class="c-reward-ticket-slot">
        <img class="c-reward-ticket-icon" :src="icon" alt="" />
      </span>
      <span>
        {{ before }}<b class="c-reward-quantity">{{ quantity }}</b>{{ after }}
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
  min-width: 0;
  color: #fff39b;
  font-size: r(10.615);
  line-height: 1.3;
}
.c-reward-coins {
  display: flex;
  align-items: center;
  gap: r(3.8);
  font-weight: 700;
}
.c-reward-coin {
  @include reward-coin(r(22.746));
}
.c-reward-ticket {
  display: flex;
  align-items: center;
  min-width: 0;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.c-reward-ticket-slot {
  flex: none;
  margin-right: r(6.6);
}
.c-reward-ticket-icon {
  display: block;
  width: r(33.98);
  height: auto;
}
.c-reward-quantity {
  color: #fff39b;
}
.c-reward-ticket small {
  font-size: r(9);
  font-weight: 400;
  opacity: 0.8;
}
.c-reward-items--game .c-reward-ticket {
  gap: r(3.8);
  font-size: r(9.857);
}
.c-reward-items--game .c-reward-ticket-slot {
  display: grid;
  place-items: center;
  width: r(22.746);
  margin-right: 0;
}
.c-reward-items--game .c-reward-ticket-icon {
  width: r(27.295);
  max-width: none;
  transform: rotate(-16deg);
}
.c-reward-items--recharge {
  color: #ecfff9;
  font-size: r(11.327);
  .c-reward-coins {
    order: 1;
    gap: r(5.66);
    color: #fff39b;
    font-size: r(12.27);
    font-weight: 400;
  }
  .c-reward-coin {
    width: r(22.653);
    height: r(22.653);
  }
  .c-reward-coins b {
    font-weight: 400;
  }
  .c-reward-coins b::before {
    content: '+ ';
  }
}
:root[data-locale='cn'],
:root[data-locale='zh'] {
  .c-reward-items--recharge .c-reward-coin-label {
    margin-left: r(-5.66);
  }
}
.c-reward-items--invite {
  .c-reward-coins {
    gap: r(5.1);
  }
  .c-reward-coin {
    width: r(27.281);
    height: r(27.281);
  }
  .c-reward-coins b {
    font-size: r(17.051);
  }
  .c-reward-coin-label {
    color: #bcdbd1;
    font-size: r(10.23);
    font-weight: 400;
  }
}
</style>
