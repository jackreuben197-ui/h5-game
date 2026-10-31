<script setup lang="ts">
import { computed } from 'vue'
import type { MttListRecord, RoomRecord } from '@/api/models/roomcenter'
import { buildWaterfallColumns, type LobbyCard } from '@/features/channelC/model'
import ChannelCPokerCard from './ChannelCPokerCard.vue'
import ChannelCMttCard from './ChannelCMttCard.vue'

const props = defineProps<{
  cards: readonly LobbyCard[]
  now: number
  label: string
  desktopIconUrl?: string
  joiningId?: string | null
}>()
defineEmits<{ join: [room: RoomRecord]; open: [match: MttListRecord] }>()
const columns = computed(() => buildWaterfallColumns(props.cards))
</script>

<template>
  <div class="c-waterfall" :aria-label="label">
    <div v-for="(column, index) in columns" :key="index" class="c-waterfall-column">
      <template v-for="card in column" :key="card.key">
        <ChannelCPokerCard
          v-if="card.kind === 'poker'"
          :room="card.room"
          :now="now"
          :desktop-icon-url="desktopIconUrl"
          :joining="joiningId === String(card.room.rid)"
          @join="$emit('join', $event)"
        />
        <ChannelCMttCard
          v-else
          :match="card.match"
          :size="card.size"
          :series-name="card.seriesName"
          :now="now"
          @open="$emit('open', $event)"
        />
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-waterfall {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 0.18rem var(--c-waterfall-column-gap, 0.18rem);
}
.c-waterfall-column {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  min-width: 0;
}
</style>
