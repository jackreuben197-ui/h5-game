<script setup lang="ts">
import GameTableCell from './GameTableCell.vue'
import type { ColumnConfig } from './types'

defineProps<{
  row: Record<string, any>
  columns: ColumnConfig[]
}>()

const emit = defineEmits<{
  rowClick: [row: Record<string, any>]
}>()
</script>

<script lang="ts">
export default { name: 'GameTableRow' }
</script>

<template>
  <div class="game-table__row" @click="emit('rowClick', row)">
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
}
</style>
