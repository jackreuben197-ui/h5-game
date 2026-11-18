<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/i18n'
import { useUserInfoStore } from '@/stores/userInfo'
import 'vant/es/loading/style'

defineProps<{
  visible: boolean
}>()

const userInfoStore = useUserInfoStore()

// 仅在 CMS 配置确认并返回图标时展示俱乐部图标，冷启动未返回前绝不展示默认平台图标
const iconUrl = computed(() => {
  const storeIcon = userInfoStore.channelDefaultClub?.safari_icon_url
  if (storeIcon && storeIcon.trim()) {
    return storeIcon.trim()
  }
  return ''
})

// 仅在 CMS 配置确认并返回名称时展示俱乐部名称，未确认前不展示默认名称
const clubName = computed(() => {
  const storeLabel = userInfoStore.channelDefaultClub?.safari_label
  if (storeLabel && storeLabel.trim()) {
    return storeLabel.trim()
  }
  return ''
})

const loadingText = computed(() => {
  try {
    return t('UIChannelC_Loading') || 'Loading...'
  } catch {
    return 'Loading...'
  }
})
</script>

<template>
  <Transition name="club-splash-fade">
    <div v-if="visible" class="club-splash-loading" role="dialog" aria-modal="true">
      <div class="club-splash-loading__content">
        <Transition name="club-fade">
          <div v-if="iconUrl" class="club-splash-loading__icon-wrapper">
            <img :src="iconUrl" class="club-splash-loading__icon" alt="" />
          </div>
        </Transition>
        <Transition name="club-fade">
          <div v-if="clubName" class="club-splash-loading__title">{{ clubName }}</div>
        </Transition>

        <div class="club-splash-loading__spinner-box">
          <van-loading size="0.64rem" color="#07c09d" />
        </div>

        <div class="club-splash-loading__text">{{ loadingText }}</div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.club-splash-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--h5-shell-bg-color, #171a21);
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: constant(safe-area-inset-left);
  padding-left: env(safe-area-inset-left);
  padding-right: constant(safe-area-inset-right);
  padding-right: env(safe-area-inset-right);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  pointer-events: auto;
}

.club-splash-loading__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.club-splash-loading__icon-wrapper {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 0.36rem;
  overflow: hidden;
  box-shadow: 0 0.08rem 0.24rem rgba(0, 0, 0, 0.4);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.24rem;
}

.club-splash-loading__icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-splash-loading__title {
  color: #fff;
  font-size: 0.32rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  max-width: 4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 0.4rem;
}

.club-splash-loading__spinner-box {
  margin-bottom: 0.2rem;
}

.club-splash-loading__text {
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.26rem;
  letter-spacing: 0.02rem;
}

.club-fade-enter-active {
  transition: opacity 0.28s ease-out;
}
.club-fade-enter-from {
  opacity: 0;
}

.club-splash-fade-enter-active,
.club-splash-fade-leave-active {
  transition: opacity 0.35s cubic-bezier(0.25, 1, 0.5, 1);
}

.club-splash-fade-enter-from,
.club-splash-fade-leave-to {
  opacity: 0;
}
</style>
