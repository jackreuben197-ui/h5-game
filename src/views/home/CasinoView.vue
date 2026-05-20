<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { showGameToast } from '@/components/Toast'
import { t } from '@/i18n'
import serviceIcon from '@/assets/icons/icon_server.png'
import walletIcon from '@/assets/icons/icon_wallet.png'
import mainBgUrl from '@/assets/images/main_bg.webp'

const router = useRouter()

// Page background styling
const pageStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

function handleServiceClick() {
  showGameToast(t('UIMineMain01') + '开发中')
}
</script>

<template>
  <div class="casino-page" :style="pageStyle">
    <div class="bg-overlay"></div>
    
    <HeaderBack :title="t('UIHomeMinigameArea')">
      <template #right>
        <div class="action-wrap">
          <TopActionButton
            :name="t('UIGuildFund_RechargeText')"
            :icon="walletIcon"
            icon-alt="wallet"
            @click="router.push('/wallet')"
          />
          <TopActionButton 
            :name="t('UIMineMain01')" 
            :icon="serviceIcon" 
            icon-alt="service" 
            @click="handleServiceClick"
          />
        </div>
      </template>
    </HeaderBack>
  </div>
</template>

<style scoped lang="scss">
.casino-page {
  position: relative;
  min-height: 100dvh;
  color: #fff;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 15% 92%, rgba(255, 173, 212, 0.28), transparent 34%),
    radial-gradient(circle at 88% 84%, rgba(102, 227, 255, 0.24), transparent 34%),
    radial-gradient(circle at 50% 56%, rgba(255, 255, 255, 0.08), transparent 48%);
  z-index: 0;
}

.action-wrap {
  display: flex;
  align-items: center;
  gap: 0.26rem;
}
</style>
