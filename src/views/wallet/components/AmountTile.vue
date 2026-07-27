<script setup lang="ts">
import icCoins from '@/assets/icons/icon_chip_red.png'
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

  @include theme-light-own {
    background: var(--wallet-l-surface-soft);
  }
}

.tile--active {
  justify-content: flex-end;
  gap: 0.523rem; /* 19.601px */
  padding: 0.25rem 0.276rem 0.286rem; /* 9.4px 10.34px 10.716px */
  border-radius: 0.78rem; /* 29.219px */
  background: radial-gradient(
    47.75% 48.13% at 41.94% 52.55%,
    rgba(37, 49, 107, 0.5) 0%,
    rgba(16, 16, 16, 0.5) 100%
  );
  background-blend-mode: soft-light;
  border: 0.134px solid rgba(242, 242, 242, 0.3);
  box-shadow: 0.9px 1.1px 1.8px rgba(0, 0, 0, 0.25);

  @include theme-light-own {
    background: var(--wallet-l-accent);
    background-blend-mode: normal;
    border-color: rgba(242, 242, 242, 0.3);
    box-shadow: none;
  }
}

.tile--custom {
  background: rgba(0, 0, 0, 0.12);
  justify-content: center;

  @include theme-light-own {
    background: var(--wallet-l-surface-soft);
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

  @include theme-light-own {
    color: var(--wallet-l-text);
  }
}

.tile--active .tile__amount {
  @include theme-light-own {
    color: var(--wallet-l-text);
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

  @include theme-light-own {
    color: var(--wallet-l-text);
  }
}
</style>
