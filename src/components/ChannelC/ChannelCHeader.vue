<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '@/i18n'
import { useTheme } from '@/composables/useTheme'
import { useUserInfoStore } from '@/stores/userInfo'
import { useGameStore } from '@/stores/game'
import { requireRealUser } from '@/session/realUserGate'
import GuestAuthActions from '@/components/GuestAuthActions.vue'
import ChannelCThemeSwitch from './ChannelCThemeSwitch.vue'
import logo from '@/assets/channelC/logo-party-holdem.png'
import logoTextDark from '@/assets/channelC/logo-party-holdem-text-dark.png'
import search from '@/assets/channelC/search.svg'
import messageLight from '@/assets/channelC/message.svg'
import messageDark from '@/assets/channelC/message-dark.svg'
import defaultAvatar from '@/assets/images/default_avatar.png'
import defaultBanner from '@/assets/images/home_header_large.png'
import CasinoPromoBanner from '@/components/CasinoPromoBanner.vue'
import gameDark from '@/assets/channelC/game-reward-dark.webp'
import gameLight from '@/assets/channelC/game-reward-light.webp'
import noticeDark from '@/assets/channelC/announcement-dark.webp'
import noticeLight from '@/assets/channelC/announcement-light.webp'
import rechargeDark from '@/assets/channelC/recharge-reward-dark.webp'
import rechargeLight from '@/assets/channelC/recharge-reward-light.webp'
import inviteDark from '@/assets/channelC/invite-reward-dark.webp'
import inviteLight from '@/assets/channelC/invite-reward-light.webp'
import supportDark from '@/assets/channelC/support-dark.webp'
import supportLight from '@/assets/channelC/support-light.webp'
import type { ChannelCAction } from '@/features/channelC/rewards'

defineProps<{ banners: string[]; clubName: string }>()
defineEmits<{ action: [action: ChannelCAction] }>()
const router = useRouter()
const { isDark } = useTheme()
const user = useUserInfoStore()
const gameStore = useGameStore()
const avatar = computed(() => user.userInfo?.user?.avatar || defaultAvatar)
const actions: Array<{ key: ChannelCAction; label: string; dark: string; light: string }> = [
  { key: 'game', label: 'UIChannelC_GameRewardShort', dark: gameDark, light: gameLight },
  { key: 'notice', label: 'UIChannelC_Announcements', dark: noticeDark, light: noticeLight },
  { key: 'recharge', label: 'UIChannelC_RechargeGift', dark: rechargeDark, light: rechargeLight },
  { key: 'invite', label: 'UIChannelC_InviteGift', dark: inviteDark, light: inviteLight },
  { key: 'support', label: 'UIChannelC_Support', dark: supportDark, light: supportLight },
]

function openAccount(path: string) {
  if (requireRealUser(() => openAccount(path))) void router.push(path)
}

</script>

<template>
  <header class="c-header">
    <div class="c-logo" role="img" aria-label="PARTY HOLDEM">
      <template v-if="isDark">
        <span class="c-logo-mark"><img :src="logo" alt="" /></span>
        <img class="c-logo-text" :src="logoTextDark" alt="" />
      </template>
      <span v-else class="c-logo-full"><img :src="logo" alt="" /></span>
    </div>
    <div class="c-header-actions">
      <GuestAuthActions class="c-auth-actions" />
      <button
        v-if="gameStore.isRealUser"
        type="button"
        class="c-search"
        :aria-label="t('search')"
        @click="router.push('/channel/search')"
      >
        <img :src="search" alt="" />
      </button>
      <button
        v-if="gameStore.isRealUser"
        type="button"
        class="c-message"
        :aria-label="t('UIMine_MsgSystemContent')"
        @click="openAccount('/message')"
      >
        <img :src="isDark ? messageDark : messageLight" alt="" />
      </button>
      <button
        v-if="gameStore.isRealUser"
        type="button"
        class="c-user"
        :aria-label="t('UIMine_UserInfoSetting_title')"
        @click="openAccount('/mine/profile/edit')"
      >
        <img
          :src="avatar"
          alt=""
          @error="($event.target as HTMLImageElement).src = defaultAvatar"
        />
      </button>
    </div>
  </header>
  <div class="c-quick-row">
    <div class="c-quick-actions">
      <button
        v-for="action in actions"
        :key="action.key"
        type="button"
        @click="$emit('action', action.key)"
      >
        <span class="c-quick-icon"><img :src="isDark ? action.dark : action.light" alt="" /></span>
        <span>{{ t(action.label) }}</span>
      </button>
    </div>
    <ChannelCThemeSwitch />
  </div>
  <CasinoPromoBanner class="c-banner" :images="banners" :fallback-image="defaultBanner" />
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;
.c-header {
  height: 1.333rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.c-logo {
  display: flex;
  flex: 0 1 4.256rem;
  align-items: center;
  min-width: 0;
  height: 1.231rem;
  margin-left: 0.051rem;
  overflow: hidden;
}
.c-logo-full,
.c-logo-mark {
  position: relative;
  display: block;
  flex: none;
  height: 100%;
  overflow: hidden;

  img {
    position: absolute;
    top: -17.91%;
    height: 133.21%;
    max-width: none;
  }
}
.c-logo-full {
  width: 4.256rem;

  img {
    left: -3.4%;
    width: 103.47%;
  }
}
.c-logo-mark {
  width: 1.333rem;

  img {
    left: -10.84%;
    width: 330.3%;
  }
}
.c-logo-text {
  flex: none;
  width: 2.846rem;
  height: 100%;
  object-fit: cover;
}
.c-header-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.256rem;
}
.c-auth-actions {
  --guest-auth-button-height: 0.82rem;
  --guest-auth-button-padding: 0 0.4rem;
}
.c-header-actions button {
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 0.18rem;
  cursor: pointer;
}
.c-search {
  width: 0.82rem;
  height: 0.82rem;
  background: rgba(255, 255, 255, 0.12);
  @include theme-light-own {
    background: #fff;
  }

  img {
    width: 0.4615rem;
    height: 0.4615rem;
  }
}
.c-message {
  width: 0.82rem;
  height: 0.82rem;
  background: transparent;

  img {
    width: 100%;
    height: 100%;
  }
}
.c-header-actions .c-user {
  width: 0.923rem;
  height: 0.923rem;
  overflow: hidden;
  border: 1.5px solid #05c297;
  border-radius: 50%;
  background: #f3f4f6;
}
.c-user img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.c-quick-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 1.59rem;
  gap: 0.2rem;
}
.c-quick-actions {
  display: grid;
  width: 6.7rem;
  min-width: 0;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.14rem;
}
.c-quick-actions button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.103rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  font: inherit;
  font-size: 0.256rem;
  line-height: 1.4;
  cursor: pointer;
  min-width: 0;
  @include theme-light-own {
    color: rgba(0, 0, 0, 0.78);
  }
}
.c-quick-actions button > span:last-child {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  max-width: 100%;
  overflow: hidden;
  overflow-wrap: anywhere;
  text-align: center;
}
.c-quick-icon {
  display: grid;
  place-items: center;
  width: 0.872rem;
  height: 0.872rem;

  img {
    display: block;
    width: 100%;
    height: 100%;
  }
}
.casino-promo-banner-container.c-banner {
  margin: 0.051rem 0 0.128rem;
}
</style>
