<script setup lang="ts">
import GlassCard from './GlassCard.vue'
import TagPill from './TagPill.vue'

interface Props {
  type: string
  amount: string | number
  payAmount: string | number
  time: string
  status: string
}

defineProps<Props>()
</script>

<template>
  <GlassCard
    tag="button"
    class="record"
  >
    <div class="record__col record__col--left">
      <TagPill
        :label="type"
        variant="dark"
      />
      <span class="record__label">{{ $txt('Wallet_OrderPayAmount') }}</span>
      <span class="record__label">{{ $txt('Wallet_ApplyTime') }}</span>
      <span class="record__label">{{ $txt('Wallet_OrderStatus') }}</span>
    </div>
    <div class="record__col record__col--right">
      <span class="record__value">{{ amount }}</span>
      <span class="record__value">{{ payAmount }}</span>
      <span class="record__value">{{ time }}</span>
      <span class="record__value">{{ status }}</span>
    </div>
  </GlassCard>
</template>

<style scoped lang="scss">
.record {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  width: 100%;
  cursor: pointer;
  box-shadow: none;
}

.record__col {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: clamp(4px, 1.3vw, 5px);
  justify-content: center;
  min-width: 0;
}

.record__col--right {
  align-items: flex-end;
}

.record__label,
.record__value {
  font-family: var(--wallet-font-num);
  font-weight: 500;
  font-size: clamp(10px, 3vw, 11.2px);
  color: #fff;
  line-height: 1.4;
  white-space: nowrap;
}
</style>
