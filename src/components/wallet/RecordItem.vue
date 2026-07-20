<script setup lang="ts">
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
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

const sharpBgStyle = {
  backgroundImage: `url(${sharpBgUrl})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
}
</script>

<template>
  <GlassCard
    tag="button"
    class="record"
  >
    <div
      class="record__bg"
      :style="sharpBgStyle"
    ></div>
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
@use '@/styles/mixins' as *;

.record {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  width: 100%;
  cursor: pointer;
  box-shadow: none;
  overflow: hidden;

  @include theme-light {
    background: #fff;
  }
}

.record__bg {
  position: absolute;
  inset: -12px;
  border-radius: inherit;
  filter: blur(10px);
  pointer-events: none;
  z-index: 0;

  @include theme-light {
    display: none;
  }
}

.record::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(0, 0, 0, 0.28);
  pointer-events: none;
  z-index: 1;

  @include theme-light {
    background: #fff;
  }
}

.record > *:not(.record__bg) {
  position: relative;
  z-index: 2;
}

.record.record::before {
  z-index: 3;
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

  @include theme-light {
    color: var(--c-text);
  }
}
</style>
