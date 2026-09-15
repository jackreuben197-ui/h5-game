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
    <span class="home-top-bar__logo">POKER</span>
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
        {{ t('UIGuild_MemberManagerSortByLastLoginTime') }}
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
  color: #000;
  font-family: 'HONOR Sans CN', sans-serif;
  font-size: 0.54rem;
  font-weight: 900;
  letter-spacing: 0.05rem;
  text-shadow:
    0.5px 0 0 currentColor,
    -0.5px 0 0 currentColor,
    0 0.5px 0 currentColor,
    0 -0.5px 0 currentColor;
}

.home-top-bar__actions {
  display: flex;
  gap: 0.1rem;
}

.home-top-bar__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.18rem 0.75rem;
  border: 0;
  border-radius: 0.56rem;
  font-family: 'PingFang SC', sans-serif;
  font-size: 0.34rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;

  &:active {
    opacity: 0.85;
  }
}

.home-top-bar__btn--register {
  color: rgba(0, 0, 0, 0.82);
  background: rgba(174, 174, 174, 0.52);
  box-shadow: 0.01rem 0.01rem 0.03rem rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(0.14rem);

  @include theme-light {
    color: #fff;
  }
}

.home-top-bar__btn--login {
  color: #fff;
  background: linear-gradient(157deg, #05e7ae 0%, #027a5c 100%);
  backdrop-filter: blur(0.55rem);

  @include theme-light {
    background: var(--c-brand);
  }
}
</style>
