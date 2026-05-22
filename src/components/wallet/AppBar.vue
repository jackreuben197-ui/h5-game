<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import icArrowLeft from '@/assets/icons/wallet/ic_arrow_left.svg'
import icWallet from '@/assets/icons/wallet/ic_wallet.svg'
import icSupport from '@/assets/icons/wallet/ic_support.svg'
import PillButton from './PillButton.vue'
import { t } from '@/i18n'

interface Props {
  title?: string
  showActions?: boolean
}

withDefaults(defineProps<Props>(), {
  title: '',
  showActions: true,
})

const emit = defineEmits<{
  back: []
}>()

const router = useRouter()
const route = useRoute()

function onBack(): void {
  emit('back')
  if (route.name === 'lobby') return
  if (window.history.state?.back) {
    router.back()
    return
  }
  void router.push('/home')
}

function onWallet(): void {
  void router.push('/recharge')
}
</script>

<template>
  <header class="appbar">
    <button
      class="appbar__title"
      @click="onBack"
    >
      <img
        :src="icArrowLeft"
        alt="back"
        class="appbar__back"
      />
      <span class="wallet-t-title">{{ title || t('Wallet_Title') }}</span>
    </button>

    <div
      v-if="showActions"
      class="appbar__actions"
    >
      <PillButton
        :label="t('Wallet_AppBarRecharge')"
        :icon="icWallet"
        @click="onWallet"
      />
      <PillButton
        :label="t('Wallet_AppBarSupport')"
        :icon="icSupport"
      />
    </div>

    <div
      v-else
      class="appbar__actions"
    >
      <slot name="actions"></slot>
    </div>
  </header>
</template>

<style scoped lang="scss">
.appbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.213rem 0.347rem 0.213rem 0.8rem;
}

.appbar__title {
  display: flex;
  align-items: center;
  gap: 0.427rem;
  white-space: nowrap;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
}

.appbar__back {
  width: 0.32rem;
  height: 0.32rem;
  filter: brightness(0) saturate(100%) invert(22%) sepia(95%) saturate(4000%) hue-rotate(337deg) brightness(105%);
}

.appbar__actions {
  display: flex;
  align-items: center;
  gap: 0.16rem;
}
</style>
