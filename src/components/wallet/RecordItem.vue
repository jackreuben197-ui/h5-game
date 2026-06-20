<script setup lang="ts">
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
  <button
    type="button"
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
  </button>
</template>

<style scoped lang="scss">
.record {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  width: 100%;
  padding: 0.4rem 0.75rem;
  border: 0.016rem solid rgba(242, 242, 242, 0.3);
  border-radius: 0.94rem;
  background: transparent;
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  cursor: pointer;
}

.record::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(16.6px);
  -webkit-backdrop-filter: blur(16.6px);
  background: linear-gradient(107.6deg, rgba(249, 249, 249, 0.1) 12.3%, rgba(249, 249, 249, 0.14) 33.3%, rgba(147, 147, 147, 0.2) 85.1%);
  mix-blend-mode: hard-light;
  pointer-events: none;
  z-index: 0;
}

.record::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow:
    inset 0 0 8.6px rgba(0, 0, 0, 0.5),
    inset 3.4px 2.6px 8.6px rgba(0, 0, 0, 0.1),
    inset 0 0 36.1px rgba(242, 242, 242, 0.3);
  z-index: 0;
}

.record > * {
  position: relative;
  z-index: 1;
}

.record__col {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.13rem;
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
  font-size: 0.3rem;
  color: #fff;
  line-height: 1.4;
  white-space: nowrap;
}
</style>
