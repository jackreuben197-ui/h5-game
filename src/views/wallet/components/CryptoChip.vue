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
  border-radius: 0.63rem;
  padding: 0.15rem 0.1rem;
  min-width: 0;
  max-width: 100%;
}

.chip__amount {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: 0.28rem;
  color: #161616;
  line-height: 1;
}
</style>
