<script setup lang="ts">
import { t } from '@/i18n'
import type { RewardBundle } from '@/features/channelC/rewards'
import coin from '@/assets/icons/icon_chips.png'
import ticket from '@/assets/icons/icon_ticket.png'

defineProps<{ reward: RewardBundle; tournamentName?: string }>()
</script>

<template>
  <div class="c-reward-items">
    <span v-if="reward.coins">
      <img :src="coin" alt="" />
      <b>{{ reward.coins }}</b> {{ t('UIChannelC_AllianceCoin') }}
    </span>
    <span v-if="reward.tickets">
      <img :src="ticket" alt="" />{{
        t('UIChannelC_TicketGift', tournamentName || 'MTT', reward.tickets)
      }}
    </span>
    <span v-if="reward.cashTickets">
      <img :src="ticket" alt="" />{{ t('UIChannelC_CashTicket', reward.cashTickets) }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.c-reward-items {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
  color: #fff3b9;
  font-size: 0.29rem;
}
.c-reward-items span {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}
.c-reward-items img {
  flex: none;
  width: 0.53rem;
  height: 0.53rem;
  object-fit: contain;
}
</style>
