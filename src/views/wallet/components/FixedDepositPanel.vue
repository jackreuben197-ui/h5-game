<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import defaultAvatar from '@/assets/images/default_avatar.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import UserCard from '@/views/wallet/components/UserCard.vue'
import ClubDepositPanel from '@/views/wallet/components/ClubDepositPanel.vue'
import { t } from '@/i18n'
import { useUserInfoStore } from '@/stores/userInfo'
import { formatUC } from '@/utils/roomVisibility'

const router = useRouter()
const userInfoStore = useUserInfoStore()

const currentClub = computed(() => userInfoStore.currentClub ?? userInfoStore.clubList[0] ?? null)
const clubBalance = computed(() => Number(currentClub.value?.user_gold ?? 0))

const userName = computed(() => String(userInfoStore.userInfo?.user?.nickname ?? '-'))
const userId = computed(() => userInfoStore.userInfo?.user?.un_id ?? '-')
const avatarUrl = computed(
  () => String(userInfoStore.userInfo?.user?.avatar ?? '') || defaultAvatar,
)

function goDetails(): void {
  void router.push('/wallet/details')
}
</script>

<template>
  <div class="deposit-screen" :style="{ backgroundImage: `url(${mainBgUrl})` }">
    <HeaderBack :title="t('UIGuildFund_RechargeText')" extra-padding>
      <template #right>
        <button class="details-pill" @click="goDetails">
          <span class="wallet-t-button details-pill__label">{{ t('Wallet_Details') }}</span>
        </button>
      </template>
    </HeaderBack>

    <div class="deposit-scrollable">
      <div class="deposit-content">
        <UserCard
          class="deposit-banner"
          variant="glass"
          :avatar="avatarUrl"
          :name="userName"
          :user-id="userId"
          :balance="formatUC(clubBalance)"
        />

        <ClubDepositPanel />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.deposit-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  // Фон задаётся инлайном (:style), поэтому светлый перебиваем через !important.
  @include theme-light-own {
    background-image: url('@/assets/images/main_bg_light.webp') !important;

    :deep(.back-trigger),
    :deep(.back-icon) {
      color: var(--wallet-l-text);
    }

    :deep(.title) {
      text-shadow: none;
    }
  }
}

.deposit-scrollable {
  flex: 1;
  overflow-y: auto;
}

.deposit-content {
  padding: 0.3rem var(--app-side-padding) 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Fixed-deposit appbar action: dark-gradient "明细" pill (Figma node 53:63392). */
.details-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 0.747rem;
  padding: 0 0.48rem;
  border-radius: 0.74rem;
  border: 0.016rem solid rgba(242, 242, 242, 0.8);
  background: linear-gradient(145.4deg, rgb(67, 65, 66) 7.55%, rgb(34, 34, 34) 71.92%);
  backdrop-filter: blur(0.597rem);
  -webkit-backdrop-filter: blur(0.597rem);
  box-shadow:
    0.103rem 0.072rem 0.271rem rgba(51, 51, 51, 0.27),
    0.398rem 0.271rem 0.486rem rgba(48, 48, 48, 0.24),
    0.9rem 0.613rem 0.653rem rgba(50, 50, 50, 0.14);
  cursor: pointer;

  @include theme-light-own {
    border-color: rgba(242, 242, 242, 0.8);
    background: var(--wallet-l-accent);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow: none;
  }
}

.details-pill__label {
  white-space: nowrap;

  @include theme-light-own {
    color: var(--wallet-l-on-accent);
  }
}
</style>
