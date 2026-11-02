<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '@/i18n'
import { requireRealUser } from '@/session/realUserGate'
import { openGlobalCustomerServiceChat } from '@/components/GlobalCustomerServiceChat/channel'
import platformInfoIcon from '@/assets/images/match_banner_platform_info.png'
import onlineShopIcon from '@/assets/images/match_banner_online_shop.png'
import onlineServiceIcon from '@/assets/images/match_banner_online_service.png'
import { getPlatformInfoLabel } from '@/views/platform/platformLabels'

const router = useRouter()

const platformInfoLabel = computed(() => getPlatformInfoLabel())

const actions = computed(() => [
  {
    key: 'platform-info',
    label: platformInfoLabel.value,
    icon: platformInfoIcon,
  },
  {
    key: 'shop',
    label: t('UIHappyShop_ActivityShop'),
    icon: onlineShopIcon,
  },
  {
    key: 'official-service',
    label: t('UIMineMain01'),
    icon: onlineServiceIcon,
  },
])

function handleAction(key: string): void {
  if (key === 'platform-info') {
    void router.push({ name: 'platform-articles' })
    return
  }

  if (key === 'shop') {
    if (!requireRealUser(() => handleAction(key))) return
    void router.push('/mine/shop')
    return
  }

  openGlobalCustomerServiceChat({ imServiceType: 2 })
}
</script>

<template>
  <section class="home-quick-actions" :aria-label="platformInfoLabel">
    <button
      v-for="action in actions"
      :key="action.key"
      class="home-quick-action"
      type="button"
      @click="handleAction(action.key)"
    >
      <span class="home-quick-action__icon-wrap">
        <img class="home-quick-action__icon" :src="action.icon" alt="" aria-hidden="true" />
      </span>
      <span class="home-quick-action__label">{{ action.label }}</span>
    </button>
  </section>
</template>

<style scoped lang="scss">
.home-quick-actions {
  display: flex;
  align-items: flex-start;
  gap: 0.48rem;
  padding: 0.24rem 0.38rem 0.42rem;
}

.home-quick-action {
  display: flex;
  width: 1.62rem;
  flex: 0 0 1.62rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.14rem;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: #fff;
  background: transparent;
  transition: transform 0.16s ease, opacity 0.16s ease;
}

.home-quick-action:active {
  transform: scale(0.97);
  opacity: 0.82;
}

.home-quick-action__icon-wrap {
  display: inline-flex;
  width: 1.62rem;
  height: 1.62rem;
  flex: 0 0 1.62rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.441rem;
}

.home-quick-action__icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.home-quick-action__label {
  width: 100%;
  overflow: hidden;
  font-size: 0.28rem;
  font-weight: 500;
  line-height: 1.2;
  text-overflow: ellipsis;
  text-align: center;
  white-space: nowrap;
  text-shadow: 0 0.025rem 0.317rem rgba(0, 0, 0, 0.6);
}

:root[data-theme='light'] .home-quick-action {
  color: #20252b;
}

:root[data-theme='light'] .home-quick-action__label {
  text-shadow: none;
}
</style>
