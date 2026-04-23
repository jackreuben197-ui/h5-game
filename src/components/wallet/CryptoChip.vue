<script setup lang="ts">
interface Props {
  amount: string | number
}

defineProps<Props>()
</script>

<template>
  <div class="chip">
    <span class="chip__amount">{{ amount }}</span>
  </div>
</template>

<style scoped lang="scss">
.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: clamp(18px, 6.3vw, 23.8px);
  padding: clamp(4px, 1.5vw, 5.2px) clamp(3px, 1vw, 3.6px);
  min-width: 0;
  max-width: 100%;
}

.chip__amount {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: clamp(12px, 2.8vw, 12px);
  color: #161616;
  line-height: 1;
}
</style>
