<script setup lang="ts">
import ava2 from '@/assets/images/wallet/avatars/ava2.png'
import mainBgUrl from '@/assets/images/main_bg.webp'
import AppBar from '@/components/wallet/AppBar.vue'
import UserCard from '@/components/wallet/UserCard.vue'
import TransactionItem from '@/components/wallet/TransactionItem.vue'
import { t } from '@/i18n'

interface Transaction {
  kind: 'in' | 'out'
  type: string
  gameName: string
  userId: string
  amount: string
  positive: boolean
  time: string
  chipAmount: string
}

const transactions: Transaction[] = [
  {
    kind: 'in',
    type: t('Wallet_TxGameIn'),
    gameName: t('Wallet_TxGameName'),
    userId: '8677650585',
    amount: '1,000',
    positive: true,
    time: '22:56',
    chipAmount: '55,555,555',
  },
  {
    kind: 'out',
    type: t('Wallet_TxWithdraw'),
    gameName: t('Wallet_TxGameName'),
    userId: '8677650585',
    amount: '1,000',
    positive: false,
    time: '22:56',
    chipAmount: '55,555,555',
  },
  {
    kind: 'in',
    type: t('Wallet_TxRecharge'),
    gameName: '',
    userId: '',
    amount: '1,000',
    positive: true,
    time: '22:56',
    chipAmount: '55,555,555',
  },
  {
    kind: 'out',
    type: t('Wallet_TxWithdraw'),
    gameName: '',
    userId: '',
    amount: '1,000',
    positive: false,
    time: '22:56',
    chipAmount: '55,555,555',
  },
]
</script>

<template>
  <div
    class="wallet-history-screen"
    :style="{ backgroundImage: `url(${mainBgUrl})` }"
  >
    <AppBar
      :title="t('Wallet_Title')"
      :show-actions="false"
    >
      <template #actions>
        <span></span>
      </template>
    </AppBar>

    <div class="content">
      <UserCard
        variant="expanded"
        :avatar="ava2"
        name="Carter Torff"
        user-id="8677650585"
        balance="123,456,78"
      />

      <div class="list">
        <TransactionItem
          v-for="(tx, i) in transactions"
          :key="i"
          v-bind="tx"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.wallet-history-screen {
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content {
  padding: clamp(6px, 2vw, 10px) clamp(14px, 4.55vw, 17px) calc(env(safe-area-inset-bottom) + clamp(20px, 6.4vw, 28px));
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 3.1vw, 12px);
}

.list {
  display: flex;
  flex-direction: column;
  gap: clamp(6px, 2.15vw, 8px);
}
</style>
