<script setup lang="ts">
import { t } from '@/i18n'
import { requireRealUser } from '@/session/realUserGate'
import { useGameStore } from '@/stores/game'

withDefaults(defineProps<{ standalone?: boolean }>(), {
  standalone: false,
})

const gameStore = useGameStore()

function openGuestAuth(mode: 'login' | 'register'): void {
  requireRealUser(undefined, { mode })
}
</script>

<template>
  <div class="home-top-bar" :class="{ 'home-top-bar--standalone': standalone }">
    <span class="home-top-bar__logo">NEX-GAME</span>
    <div v-if="!gameStore.isRealUser" class="home-top-bar__actions">
      <button
        class="home-top-bar__btn home-top-bar__btn--register"
        type="button"
        @click="openGuestAuth('register')"
      >
        {{ t('UILogin_TitleRegister') }}
      </button>
      <button
        class="home-top-bar__btn home-top-bar__btn--login"
        type="button"
        @click="openGuestAuth('login')"
      >
        {{ t('UIClub_Mlist_denglu') }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.home-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 0.2rem 0 0;
}

.home-top-bar--standalone {
  position: relative;
  z-index: 2;
  padding: calc(var(--app-content-safe-area-top, env(safe-area-inset-top)) + 0.6rem) 0.4rem 0;
}

.home-top-bar__logo {
  color: #f9f9f9;
  font-family: 'HONOR Sans CN', sans-serif;
  font-size: 0.54rem;
  font-weight: 900;
  letter-spacing: 0.05rem;

  @include theme-light {
    color: rgba(15, 8, 8, 0.82);
  }
}

.home-top-bar__actions {
  display: flex;
  gap: 0.14rem;
}

.home-top-bar__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0.12rem 0.65rem;
  border: none;
  border-radius: 0.56rem;
  font-family: 'PingFang SC', sans-serif;
  font-size: 0.3rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;

  &:active {
    opacity: 0.85;
  }
}

.home-top-bar__btn--register {
  background: rgba(128, 128, 128, 0.2);
  color: #f9f9f9;
  border: 0.02rem solid rgba(249, 249, 249, 0.15);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);

  @include theme-light {
    background: rgba(255, 255, 255, 0.72);
    color: rgba(15, 8, 8, 0.82);
    border-color: rgba(0, 0, 0, 0.08);
  }
}

.home-top-bar__btn--login {
  background: rgba(250, 43, 75, 0.8);
  color: #f9f9f9;
  border: 0.02rem solid rgba(249, 249, 249, 0.25);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);

  @include theme-light {
    background: rgba(250, 43, 75, 0.92);
    border-color: rgba(255, 255, 255, 0.4);
  }
}
</style>
