<script setup lang="ts">
import icCoins from '@/assets/icons/wallet/ic_coins.png'
import CryptoChip from './CryptoChip.vue'

interface Props {
  amount: string | number
  chip?: string | number
  active?: boolean
  custom?: boolean
}

withDefaults(defineProps<Props>(), {
  chip: '',
  active: false,
  custom: false,
})
</script>

<template>
  <button
    class="tile"
    :class="{ 'tile--active': active, 'tile--custom': custom }"
  >
    <template v-if="custom">
      <span class="tile__custom-label">{{ $txt('Wallet_CustomAmount') }}</span>
    </template>
    <template v-else>
      <div class="tile__head">
        <img
          :src="icCoins"
          alt=""
          class="tile__icon"
        />
        <span class="tile__amount">*{{ amount }}</span>
      </div>
      <CryptoChip
        :amount="chip"
        class="tile__chip"
      />
    </template>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  aspect-ratio: 1 / 1;
  padding: 0.48rem 0.275rem 0.285rem;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 0.64rem;
  width: 100%;
  min-width: 0;
  cursor: pointer;
  overflow: hidden;

  @include theme-light {
    background: rgba(134, 134, 134, 0.12);
  }
}

.tile--active {
  background: rgba(178, 0, 0, 0.23);
  border-top: 0.134px solid rgba(242, 242, 242, 0.3);
  border-right: 0.134px solid rgba(242, 242, 242, 0.3);
  border-bottom: 0.134px solid rgba(242, 242, 242, 0.3);
  border-left: 0.134px solid rgba(242, 242, 242, 0.3);
  border-radius: 0.78rem;
  box-shadow: 0.9px 1.1px 1.8px rgba(0, 0, 0, 0.25);

  @include theme-light {
    background: var(--c-brand);
    border-color: rgba(242, 242, 242, 0.3);
  }
}

.tile--custom {
  background: rgba(0, 0, 0, 0.12);
  justify-content: center;

  @include theme-light {
    background: rgba(134, 134, 134, 0.12);
  }
}

.tile__head {
  display: flex;
  align-items: center;
  gap: 0.07rem;
  margin-top: 0.36rem;
  min-width: 0;
  max-width: 100%;
}

.tile__icon {
  width: 0.36rem;
  height: 0.36rem;
  flex-shrink: 0;
}

.tile__amount {
  font-family: var(--wallet-font-num);
  font-weight: 700;
  font-size: 0.34rem;
  color: #f9f9f9;
  line-height: 1.4;
  white-space: nowrap;
  min-width: 0;

  @include theme-light {
    color: #000;
  }
}

.tile--active .tile__amount {
  @include theme-light {
    color: #fff;
  }
}

.tile__chip {
  width: 100%;
}

.tile__custom-label {
  font-family: var(--wallet-font-num);
  font-weight: 700;
  font-size: 0.29rem;
  color: #f9f9f9;
  line-height: 1.4;

  @include theme-light {
    color: #000;
  }
}
</style>
