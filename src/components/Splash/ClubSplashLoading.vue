<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/i18n'
import defaultClubIcon from '@/assets/icons/NEX-GAME.png'

defineProps<{
  visible: boolean
}>()

const iconUrl = computed(() => {
  if (typeof window !== 'undefined') {
    try {
      const cached = window.localStorage.getItem('dzpk_h5_safari_icon')
      if (cached && cached.trim()) return cached.trim()
    } catch {}
  }
  return defaultClubIcon || '/icons/NEX-GAME.png'
})

const clubName = computed(() => {
  if (typeof window !== 'undefined') {
    try {
      const cached = window.localStorage.getItem('dzpk_h5_safari_label')
      if (cached && cached.trim()) return cached.trim()
    } catch {}
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
        <div class="club-splash-loading__icon-wrapper">
          <img :src="iconUrl" class="club-splash-loading__icon" alt="" />
        </div>
        <div v-if="clubName" class="club-splash-loading__title">{{ clubName }}</div>

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
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--h5-shell-bg-color, #171a21);
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
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

.club-splash-fade-enter-active,
.club-splash-fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.club-splash-fade-enter-from,
.club-splash-fade-leave-to {
  opacity: 0;
}
</style>
