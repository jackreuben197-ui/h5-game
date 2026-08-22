<script setup lang="ts">
import bannerBgUrl from '@/assets/images/img_user_banner_bg.png'
import icCoins from '@/assets/icons/wallet/ic_coins.png'
import icChipRed from '@/assets/icons/icon_chip_red.png'
import TagPill from '@/components/wallet/TagPill.vue'
import { computed } from 'vue'
import { useUserInfoStore } from '@/stores/userInfo'

type Variant = 'compact' | 'expanded' | 'glass'

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

// Glass banner balance: prefer the passed-in value, fall back to the live gold balance.
const displayBalance = computed(() => {
  if (props.balance !== '' && props.balance != null) return props.balance
  const gold = userInfoStore.userInfo?.user?.gold
  return typeof gold === 'number' ? gold.toLocaleString() : '0'
})


const bannerBg = `url(${bannerBgUrl})`
</script>

<template>
  <div
    class="usercard"
    :class="`usercard--${variant}`"
  >
    <div
      v-if="variant === 'glass'"
      class="usercard__shelf"
    ></div>

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
      v-if="variant === 'glass'"
      class="usercard__gbal"
    >
      <span class="usercard__gbal-value">{{ displayBalance }}</span>
      <img
        :src="icChipRed"
        alt=""
        class="usercard__gbal-chip"
      />
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

  @include theme-light-own {
    border-radius: 29.219px;
    background: rgba(0, 0, 0, 0.19);
    border: none;
    box-shadow: none;
  }
}

/* ── Glass deposit banner (Figma node 53:63363) ──────────────────────────── */
.usercard--glass {
  width: 100%;
  aspect-ratio: 340 / 175;
  padding: 0;
  border-radius: 1rem;
  border: 0.017rem solid rgba(242, 242, 242, 0.7);
  background: linear-gradient(
    119.6deg,
    rgba(249, 249, 249, 0.24) 12.3%,
    rgba(249, 249, 249, 0.32) 33.3%,
    rgba(147, 147, 147, 0.4) 85.1%
  );
  backdrop-filter: blur(0.635rem);
  -webkit-backdrop-filter: blur(0.635rem);
  box-shadow:
    3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25),
    inset 0 0 0.23rem rgba(0, 0, 0, 0.9),
    inset 0 0 0.46rem 0.16rem rgba(242, 242, 242, 0.5);

  // dark gradient inner card
  &::before {
    content: '';
    position: absolute;
    inset: 0.26% 5.53% 10.17% 5.78%;
    border-radius: 0.79rem;
    border: 0.017rem solid rgba(242, 242, 242, 0.8);
    background: linear-gradient(146.3deg, rgb(61, 61, 61) 7.55%, rgb(29, 29, 29) 71.92%);
    box-shadow:
      0.106rem 0.073rem 0.285rem rgba(69, 69, 69, 0.27),
      0.423rem 0.293rem 0.512rem rgba(69, 69, 69, 0.24),
      0.96rem 0.65rem 0.699rem rgba(69, 69, 69, 0.14);
    z-index: 0;
  }

  @include theme-light-own {
    aspect-ratio: auto;
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 1.1rem;
    box-shadow: 0 0.04rem 0.14rem rgba(34, 34, 34, 0.08);
    opacity: 1;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    padding: 0.35rem 0.45rem;

    &::before {
      display: none;
    }

    .usercard__shelf {
      display: none;
    }

    .usercard__head {
      position: relative;
      top: auto;
      left: auto;
      gap: 0.35rem;
    }

    .usercard__avatar {
      width: 1.4rem;
      height: 1.4rem;
    }

    .usercard__name {
      color: rgba(0, 0, 0, 1);
      font-weight: 700;
      font-size: 0.4rem;
    }

    .usercard__id-value {
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.26rem;
    }

    .usercard__gbal {
      position: relative;
      right: auto;
      bottom: auto;
      margin-top: 0.15rem;
      justify-content: flex-end;
    }

    .usercard__gbal-value {
      color: rgba(0, 0, 0, 0.85);
      font-weight: 700;
    }
  }
}

// frosted glass shelf backing the balance (Rectangle 2)
.usercard__shelf {
  position: absolute;
  inset: 48.89% 0.14% 0.57% 22.43%;
  border-radius: 1.2rem 0.79rem 0.79rem 0.79rem;
  background: linear-gradient(
    119.6deg,
    rgba(249, 249, 249, 0.16) 12.3%,
    rgba(249, 249, 249, 0.22) 33.3%,
    rgba(147, 147, 147, 0.28) 85.1%
  );
  backdrop-filter: blur(0.5rem);
  -webkit-backdrop-filter: blur(0.5rem);
  box-shadow: inset 0 0 0.34rem rgba(242, 242, 242, 0.4);
  z-index: 1;
}

.usercard--glass .usercard__head {
  position: absolute;
  top: 9.9%;
  left: 11.4%;
  gap: 0.48rem;
  z-index: 2;
}

.usercard--glass .usercard__avatar {
  width: 1.893rem;
  height: 1.893rem;
  margin-left: 0;
  object-position: bottom;
}

.usercard--glass .usercard__info {
  gap: 0.16rem;
}

.usercard--glass .usercard__name {
  font-size: 0.27rem;
  font-weight: 400;
  white-space: nowrap;
}

.usercard--glass .usercard__id-value {
  font-size: 0.257rem;
  font-weight: 600;
}

.usercard__gbal {
  position: absolute;
  right: 9%;
  bottom: 13%;
  display: flex;
  align-items: center;
  gap: 0.114rem;
  z-index: 2;
}

.usercard__gbal-value {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: 0.46rem;
  line-height: 1.4;
  color: #f9f9f9;
}

.usercard__gbal-chip {
  width: 0.71rem;
  height: 0.79rem;
  object-fit: contain;
  transform: rotate(5deg);
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

  @include theme-light-own {
    color: var(--wallet-l-text);
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

  @include theme-light-own {
    color: var(--wallet-l-text);
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
