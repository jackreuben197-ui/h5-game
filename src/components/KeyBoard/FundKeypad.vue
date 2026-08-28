<script setup lang="ts">
import backspaceIcon from '@/assets/icons/backspace_figma.svg'

const rows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', 'DEL'],
] as const

const emit = defineEmits<{
  press: [key: string]
}>()
</script>

<template>
  <div class="fund-keypad">
    <div v-for="(row, rowIndex) in rows" :key="rowIndex" class="fund-keypad-row">
      <button
        v-for="key in row"
        :key="key"
        type="button"
        class="keypad-btn"
        :class="{
          'keypad-btn--accent': key === 'C' || key === 'DEL',
          'keypad-btn--del': key === 'DEL',
        }"
        @click="emit('press', key)"
      >
        <span v-if="key !== 'DEL'">{{ key }}</span>
        <img v-else class="keypad-backspace-icon" :src="backspaceIcon" alt="" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.fund-keypad {
  display: flex;
  flex-direction: column;
  gap: 0.20587rem;
}

.fund-keypad-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.15261rem;
}

.keypad-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.35393rem;
  border: 0.01907rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.37751rem;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 0.61044rem;
  font-weight: 600;
}

.keypad-btn--accent {
  border-color: transparent;
  background: rgba(4, 209, 157, 0.26);

  @include theme-light {
    background: rgba(var(--c-brand-rgb), 0.48);
  }
}

.keypad-backspace-icon {
  display: block;
  width: 0.86rem;
  height: 0.562rem;
}
</style>
