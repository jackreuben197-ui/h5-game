<script setup lang="ts">
import { t } from '@/i18n'
import { requireRealUser } from '@/session/realUserGate'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

function openGuestAuth(mode: 'login' | 'register'): void {
  requireRealUser(undefined, { mode })
}
</script>

<template>
  <div v-if="!gameStore.isRealUser" class="guest-auth-actions">
    <button
      class="guest-auth-button guest-auth-button--register"
      type="button"
      @click="openGuestAuth('register')"
    >
      <span>{{ t('UILogin_TitleRegister') }}</span>
    </button>
    <button
      class="guest-auth-button guest-auth-button--login"
      type="button"
      @click="openGuestAuth('login')"
    >
      <span>{{ t('UILogin_BtnLogin') }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.guest-auth-actions {
  display: flex;
  gap: 0.1rem;
}

.guest-auth-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--guest-auth-button-height, 0.87rem);
  padding: var(--guest-auth-button-padding, 0 0.75rem);
  border-radius: 0.56rem;
  font-family: 'PingFang SC', sans-serif;
  font-size: 0.34rem;
  font-weight: 500;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;

  &:active {
    opacity: 0.85;
  }

  span {
    display: block;
    line-height: 1;
  }
}

.guest-auth-button--register {
  color: #f9f9f9;
  background: rgba(128, 128, 128, 0.2);
  border: 0.02rem solid rgba(249, 249, 249, 0.15);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);

  @include theme-light-own {
    background: linear-gradient(180deg, #808080 0%, #474747 100%);
    border-color: transparent;
  }
}

.guest-auth-button--login {
  color: #f9f9f9;
  background: rgba(250, 43, 75, 0.8);
  border: 0.02rem solid rgba(249, 249, 249, 0.25);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);

  @include theme-light-own {
    background: #07c09d;
    border-color: transparent;
  }
}
</style>
