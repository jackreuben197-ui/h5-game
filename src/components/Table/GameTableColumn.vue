<script setup lang="ts">
import { inject, onMounted, onUnmounted, useSlots } from 'vue'
import { TABLE_INJECT_KEY } from './types'
import type { SelectOption } from './types'

const props = withDefaults(
  defineProps<{
    prop: string
    label: string
    flex?: number
    width?: string
    sortable?: boolean
    select?: SelectOption[]
    align?: 'left' | 'center' | 'right'
    fixed?: boolean
    formatter?: (value: any, row: Record<string, any>) => any
  }>(),
  {
    flex: 1,
    sortable: false,
    align: 'center',
    fixed: false,
    formatter: (v: any) => v,
  },
)

const slots = useSlots()
const table = inject(TABLE_INJECT_KEY)

onMounted(() => {
  table?.registerColumn({
    prop: props.prop,
    label: props.label,
    flex: props.flex,
    width: props.width,
    sortable: props.sortable,
    select: props.select,
    align: props.align,
    fixed: props.fixed,
    formatter: props.formatter,
    slotRender: slots.default as any,
  })
})

onUnmounted(() => {
  table?.unregisterColumn(props.prop)
})
</script>

<script lang="ts">
export default { name: 'GameTableColumn' }
</script>

<template>
  <div v-if="false"></div>
</template>
