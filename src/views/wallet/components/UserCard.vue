<script setup lang="ts">
import bannerBgUrl from '@/assets/images/wallet/banner_bg.png'
import icCoins from '@/assets/icons/wallet/ic_coins.png'
import TagPill from '@/components/wallet/TagPill.vue'
import { computed } from 'vue'
import { useUserInfoStore } from '@/stores/userInfo'

type Variant = 'compact' | 'expanded'

interface Props {
  avatar: string
  name: string
  userId: string | number
  balance?: string | number
  variant?: Variant
}

const props = withDefaults(defineProps<Props>(), {
  balance: '',
  variant: 'compact',
})

const userInfoStore = useUserInfoStore()
const displayAvatar = computed(() => (userInfoStore.userInfo?.user?.avatar as string) || props.avatar)
const displayName = computed(() => (userInfoStore.userInfo?.user?.nickname as string) || props.name)
const displayUserId = computed(() => (userInfoStore.userInfo?.user?.un_id as string | number) || props.userId)


const bannerBg = `url(${bannerBgUrl})`
</script>

<template>
  <div
    class="usercard"
    :class="`usercard--${variant}`"
  >
    <div class="usercard__head">
      <img
        :src="displayAvatar"
        alt=""
        class="usercard__avatar"
      />
      <div class="usercard__info">
        <div class="usercard__name">{{ displayName }}</div>
        <div class="usercard__id">
          <TagPill
            label="ID"
            variant="id"
          />
          <span class="usercard__id-value">{{ displayUserId }}</span>
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
@use '@/styles/mixins' as *;

.usercard {
  position: relative;
  overflow: hidden;
  border-radius: 0.8rem;
  padding: 0.25rem 0.37rem;
}

.usercard--expanded {
  height: 4.13rem;
  border-radius: 1.04rem;
  padding: 0.5rem 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: v-bind(bannerBg) center / 100% 100% no-repeat;
}

.usercard--compact {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.8rem;

  @include theme-light {
    background: linear-gradient(135deg, #cbd0d4 0%, #adb1b5 100%);
    box-shadow:
      inset 0.08rem 0.08rem 0.18rem rgba(255, 255, 255, 0.42),
      0 0.08rem 0.2rem rgba(70, 79, 88, 0.12);
  }
}

.usercard__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.285rem;
}

.usercard--expanded .usercard__head {
  gap: 0.57rem;
}

.usercard__avatar {
  width: 1.71rem;
  height: 1.71rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin-left: 4%;
}

.usercard--expanded .usercard__avatar {
  width: 1.9rem;
  height: 1.9rem;
}

.usercard__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.usercard__name {
  font-family: var(--wallet-font-num);
  font-weight: 700;
  font-size: 0.53rem;
  color: #fff;
  line-height: 1.05;
  white-space: pre-line;

  @include theme-light {
    color: #000;
  }
}

.usercard--expanded .usercard__name {
  font-size: 0.596rem;
}

.usercard__id {
  display: flex;
  align-items: center;
  gap: 0.06rem;
}

.usercard__id-value {
  font-family: var(--wallet-font-num);
  font-weight: 400;
  font-size: 0.23rem;
  color: #fff;

  @include theme-light {
    color: #000;
  }
}

.usercard--expanded .usercard__id-value {
  font-size: 0.25rem;
  font-weight: 600;
}

.usercard__actions {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
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
  gap: 0.11rem;
  color: #f9f9f9;
  padding-right: 0.48rem;
}

.usercard__balance-label {
  font-family: var(--wallet-font-num);
  font-weight: 400;
  font-size: 0.3rem;
}

.usercard__balance-value {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: 0.435rem;
}

.usercard__balance-chip {
  width: 0.773rem;
  height: 0.773rem;
}
</style>
