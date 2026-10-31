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
  border: 0;
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
  color: rgba(0, 0, 0, 0.82);
  background: rgba(174, 174, 174, 0.52);
  box-shadow: 0.01rem 0.01rem 0.03rem rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(0.14rem);
}

.guest-auth-button--login {
  color: #fff;
  background: linear-gradient(157deg, #05c297 0%, #027a5c 100%);
  backdrop-filter: blur(0.55rem);

  @include theme-light-own {
    background: var(--c-brand);
  }
}
</style>
