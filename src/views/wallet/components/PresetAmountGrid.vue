<script setup lang="ts">
import AmountTile from './AmountTile.vue'

export interface Preset {
  amount: string | number
  chip: string | number
  id?: number
  payPrice?: number
}

interface Props {
  presets: Preset[]
  activeIndex?: number
}

withDefaults(defineProps<Props>(), {
  activeIndex: 0,
})

const emit = defineEmits<{
  select: [index: number]
  custom: []
}>()
</script>

<template>
  <div class="grid">
    <AmountTile
      v-for="(p, i) in presets"
      :key="i"
      :amount="p.amount"
      :chip="p.chip"
      :active="activeIndex === i"
      @click="emit('select', i)"
    />
    <AmountTile
      amount=""
      custom
      @click="emit('custom')"
    />
  </div>
</template>

<style scoped lang="scss">
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.29rem;
  width: 100%;
}
</style>
