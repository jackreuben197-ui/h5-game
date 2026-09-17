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
    <span
      v-if="active"
      class="tile__check"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M5 12.5 10 17.5 19 7" />
      </svg>
    </span>
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
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  aspect-ratio: 1 / 1;
  padding: 0.48rem 0.275rem 0.285rem;
  background: rgba(0, 0, 0, 0.12);
  border: 0.04rem solid transparent;
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
  background: rgba(122, 16, 32, 0.45);
  border-color: #fa2b4b;
  box-shadow:
    0 0 0.16rem rgba(250, 43, 75, 0.9),
    0 0 0.48rem rgba(250, 43, 75, 0.45);

  @include theme-light-own {
    background: rgba(250, 43, 75, 0.1);
    border-color: #fa2b4b;
    box-shadow:
      0 0 0.12rem rgba(250, 43, 75, 0.55),
      0 0 0.4rem rgba(250, 43, 75, 0.28);
  }
}

.tile--custom {
  background: rgba(0, 0, 0, 0.12);
  justify-content: center;

  @include theme-light-own {
    background: var(--wallet-l-surface-soft);
  }
}

.tile--custom.tile--active {
  background: rgba(122, 16, 32, 0.45);

  @include theme-light-own {
    background: rgba(250, 43, 75, 0.1);
  }
}

.tile__check {
  position: absolute;
  top: 0.13rem;
  right: 0.13rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #fa2b4b;

  svg {
    width: 0.3rem;
    height: 0.3rem;
    fill: none;
    stroke: #f9f9f9;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
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

.tile--active .tile__chip {
  background: #fa2b4b;

  :deep(.chip__amount) {
    color: #f9f9f9;
  }

  @include theme-light-own {
    box-shadow: none;
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
