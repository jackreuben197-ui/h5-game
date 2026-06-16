<script setup lang="ts">
import { inject, computed } from 'vue'
import GameTableCell from './GameTableCell.vue'
import type { ColumnConfig } from './types'
import { TABLE_INJECT_KEY } from './types'

defineProps<{
  row: Record<string, any>
  columns: ColumnConfig[]
  isSummary?: boolean
}>()

const emit = defineEmits<{
  rowClick: [row: Record<string, any>]
}>()

const table = inject(TABLE_INJECT_KEY)
const isFlat = computed(() => table?.flat ?? false)
</script>

<script lang="ts">
export default { name: 'GameTableRow' }
</script>

<template>
  <div
    class="game-table__row"
    :class="{ 'game-table__row--summary': isSummary, 'game-table__row--flat': isFlat }"
    @click="emit('rowClick', row)"
  >
    <GameTableCell
      v-for="col in columns"
      :key="col.prop"
      :col="col"
      :row="row"
    />
  </div>
</template>

<style scoped lang="scss">
.game-table__row {
  display: flex;
  align-items: stretch;
  min-height: 0.85rem;
  border-radius: 0.425rem;
  background: rgba(0, 0, 0, 0.2);
  overflow: hidden;

  &--flat {
    background: none;
    border-radius: 0;
    overflow: visible;
    border-bottom: 0.02rem solid rgba(249, 249, 249, 0.11);
  }
}
</style>
