<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import type { ExtendGameRecord } from '@/api/casino'
import type { MttListRecord, RoomRecord } from '@/api/models/roomcenter'
import { buildWaterfallColumns, type LobbyCard } from '@/features/channelC/model'
import ChannelCPokerCard from './ChannelCPokerCard.vue'
import ChannelCMttCard from './ChannelCMttCard.vue'
import ChannelCGameCard from './ChannelCGameCard.vue'

const props = defineProps<{
  cards: readonly LobbyCard[]
  now: number
  label: string
  desktopIconUrl?: string
  joiningId?: string | null
}>()
defineEmits<{
  join: [room: RoomRecord]
  open: [match: MttListRecord]
  play: [game: ExtendGameRecord]
}>()
const root = shallowRef<HTMLElement | null>(null)
const columnCount = ref(2)
let observer: ResizeObserver | null = null

function updateColumnCount() {
  const el = root.value
  if (!el) return
  const style = getComputedStyle(el)
  const minColumn = parseFloat(style.getPropertyValue('--c-waterfall-min-column')) || 0
  const gap = parseFloat(style.columnGap) || 0
  columnCount.value =
    minColumn > 0 ? Math.max(2, Math.floor((el.clientWidth + gap) / (minColumn + gap))) : 2
}

onMounted(() => {
  updateColumnCount()
  if (typeof ResizeObserver !== 'undefined' && root.value) {
    observer = new ResizeObserver(updateColumnCount)
    observer.observe(root.value)
  } else {
    window.addEventListener('resize', updateColumnCount)
  }
})
onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  window.removeEventListener('resize', updateColumnCount)
})

const columns = computed(() => buildWaterfallColumns(props.cards, columnCount.value))
</script>

<template>
  <div
    ref="root"
    class="c-waterfall"
    :style="{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }"
    :aria-label="label"
  >
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
          v-else-if="card.kind === 'mtt'"
          :match="card.match"
          :size="card.size"
          :series-name="card.seriesName"
          :now="now"
          @open="$emit('open', $event)"
        />
        <ChannelCGameCard
          v-else
          :game="card.game"
          :size="card.size"
          @play="$emit('play', $event)"
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
@media (min-width: 600px) {
  .c-waterfall {
    --c-waterfall-min-column: 210px;
  }
}
</style>
