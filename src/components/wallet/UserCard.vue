<script setup lang="ts">
import bannerBgUrl from '@/assets/images/wallet/banner_bg.png'
import icCoins from '@/assets/icons/wallet/ic_coins.png'
import TagPill from './TagPill.vue'

type Variant = 'compact' | 'expanded'

interface Props {
  avatar: string
  name: string
  userId: string | number
  balance?: string | number
  variant?: Variant
}

withDefaults(defineProps<Props>(), {
  balance: '',
  variant: 'compact',
})

const bannerBg = `url(${bannerBgUrl})`
</script>

<template>
  <div
    class="usercard"
    :class="`usercard--${variant}`"
  >
    <div class="usercard__head">
      <img
        :src="avatar"
        alt=""
        class="usercard__avatar"
      />
      <div class="usercard__info">
        <div class="usercard__name">{{ name }}</div>
        <div class="usercard__id">
          <TagPill
            label="ID"
            variant="id"
          />
          <span class="usercard__id-value">{{ userId }}</span>
        </div>
      </div>
      <div
        v-if="variant === 'compact'"
        class="usercard__actions"
      >
        <slot name="actions"></slot>
      </div>
    </div>

    <div
      v-if="variant === 'expanded' && balance !== ''"
      class="usercard__balance"
    >
      <span class="usercard__balance-label">{{ $txt('Wallet_BalanceLabel') }}</span>
      <span class="usercard__balance-value">{{ balance }}</span>
      <img
        :src="icCoins"
        alt=""
        class="usercard__balance-chip"
      />
    </div>

    <slot name="extra"></slot>
  </div>
</template>

<style scoped lang="scss">
.usercard {
  position: relative;
  overflow: hidden;
  border-radius: clamp(22px, 8vw, 29.2px);
  padding: clamp(7px, 2.5vw, 9.3px) clamp(10px, 3.7vw, 14px);
}

.usercard--expanded {
  height: clamp(128px, 41.3vw, 155px);
  border-radius: clamp(30px, 10.4vw, 39px);
  padding: clamp(14px, 5vw, 18px) clamp(14px, 5vw, 18px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: v-bind(bannerBg) center / 100% 100% no-repeat;
}

.usercard--compact {
  background: rgba(0, 0, 0, 0.2);
  border-radius: clamp(22px, 8vw, 29.2px);
}

.usercard__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: clamp(8px, 2.85vw, 10.7px);
}

.usercard--expanded .usercard__head {
  gap: clamp(16px, 5.7vw, 21.4px);
}

.usercard__avatar {
  width: clamp(52px, 17.1vw, 65px);
  height: clamp(52px, 17.1vw, 65px);
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin-left: 4%;
}

.usercard--expanded .usercard__avatar {
  width: clamp(60px, 19vw, 71px);
  height: clamp(60px, 19vw, 71px);
}

.usercard__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(3px, 1vw, 3.75px);
}

.usercard__name {
  font-family: var(--wallet-font-num);
  font-weight: 700;
  font-size: clamp(16px, 5.3vw, 20px);
  color: #fff;
  line-height: 1.05;
  white-space: pre-line;
}

.usercard--expanded .usercard__name {
  font-size: clamp(18px, 5.96vw, 22.4px);
}

.usercard__id {
  display: flex;
  align-items: center;
  gap: clamp(1.5px, 0.6vw, 2.2px);
}

.usercard__id-value {
  font-family: var(--wallet-font-num);
  font-weight: 400;
  font-size: clamp(7.5px, 2.3vw, 8.5px);
  color: #fff;
}

.usercard--expanded .usercard__id-value {
  font-size: clamp(8px, 2.5vw, 9.6px);
  font-weight: 600;
}

.usercard__actions {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 3.2vw, 12px);
  align-items: stretch;
  margin-top: 18px;
  align-self: flex-start;
}

.usercard__balance {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: clamp(3px, 1.1vw, 4.2px);
  color: #f9f9f9;
  padding-right: clamp(14px, 4.8vw, 18px);
}

.usercard__balance-label {
  font-family: var(--wallet-font-num);
  font-weight: 400;
  font-size: clamp(10px, 3vw, 11.3px);
}

.usercard__balance-value {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: clamp(14px, 4.35vw, 16.3px);
}

.usercard__balance-chip {
  width: clamp(24px, 7.73vw, 29px);
  height: clamp(24px, 7.73vw, 29px);
}
</style>
