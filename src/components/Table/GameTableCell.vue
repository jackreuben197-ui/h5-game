<script setup lang="ts">
import { computed } from 'vue'
import type { ColumnConfig } from './types'

const props = defineProps<{
  col: ColumnConfig
  row: Record<string, any>
}>()

const value = computed(() => props.row[props.col.prop] ?? '')
const displayValue = computed(() => {
  const v = value.value
  return props.col.formatter ? String(props.col.formatter(v, props.row) ?? '') : String(v)
})

const cellStyle = computed(() => {
  const style: Record<string, string> = {
    textAlign: props.col.align,
    justifyContent: props.col.align === 'left' ? 'flex-start' : props.col.align === 'right' ? 'flex-end' : 'center',
  }
  if (props.col.width) {
    style.width = props.col.width
    style.flexShrink = '0'
    style.flexGrow = '0'
    style.flexBasis = props.col.width
  } else {
    style.flex = String(props.col.flex)
  }
  return style
})
</script>

<script lang="ts">
export default { name: 'GameTableCell' }
</script>

<template>
  <div class="game-table__cell" :style="cellStyle">
    <component
      :is="() => col.slotRender?.({ row, value })"
      v-if="col.slotRender"
    />
    <span v-else class="game-table__cell-text">{{ displayValue }}</span>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.game-table__cell {
  min-height: 0.85rem;
  display: flex;
  align-items: center;
  padding: 0.16rem 0.24rem;
  box-sizing: border-box;
  overflow: hidden;
}

.game-table__cell-text {
  font-size: 0.36rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
  word-break: break-all;

  @include theme-light {
    color: rgba(0, 0, 0, 0.9);
  }
}
</style>
