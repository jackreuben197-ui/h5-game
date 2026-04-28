<script setup lang="ts">
interface Props {
  tabs: string[]
  modelValue?: number
}

withDefaults(defineProps<Props>(), {
  modelValue: 0,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()
</script>

<template>
  <div class="tpg">
    <button
      v-for="(t, i) in tabs"
      :key="i"
      class="tpg__pill"
      :class="modelValue === i ? 'tpg__pill--active' : 'tpg__pill--inactive'"
      @click="emit('update:modelValue', i)"
    >
      <span class="tpg__label">{{ t }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.tpg {
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
}

.tpg__pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.48rem;
  height: 0.75rem;
  border-radius: 0.74rem;
  backdrop-filter: blur(22.4px);
  -webkit-backdrop-filter: blur(22.4px);
  cursor: pointer;
  white-space: nowrap;
  border: none;
}

.tpg__pill::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(139deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.tpg__pill--active {
  background: var(--wallet-grad-primary);
  box-shadow: 3.9px 2.7px 10.2px rgba(110, 2, 2, 0.27);
}

.tpg__pill--inactive {
  background: rgba(0, 0, 0, 0.36);
  box-shadow: 3.9px 2.7px 10.2px rgba(51, 51, 51, 0.27);
}

.tpg__label {
  font-family: var(--wallet-font-cn);
  font-weight: 400;
  font-size: 0.215rem;
  color: #fff;
}
</style>
