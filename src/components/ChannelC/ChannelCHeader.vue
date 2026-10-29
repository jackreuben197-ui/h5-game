<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '@/i18n'
import { useTheme } from '@/composables/useTheme'
import { useUserInfoStore } from '@/stores/userInfo'
import { requireRealUser } from '@/session/realUserGate'
import ThemeQuickSwitch from '@/components/ThemeQuickSwitch.vue'
import logo from '@/assets/channelC/logo.png'
import search from '@/assets/channelC/search.svg'
import messageLight from '@/assets/channelC/message.svg'
import messageDark from '@/assets/channelC/message-dark.svg'
import defaultAvatar from '@/assets/images/default_avatar.png'
import defaultBanner from '@/assets/images/home_header_1.png'
import game from '@/assets/channelC/game-reward.svg'
import notice from '@/assets/channelC/announcement.svg'
import recharge from '@/assets/channelC/recharge-reward.svg'
import invite from '@/assets/channelC/invite-reward.svg'
import support from '@/assets/channelC/support.svg'
import type { ChannelCAction } from '@/features/channelC/rewards'

const props = defineProps<{ banner: string; clubName: string }>()
defineEmits<{ action: [action: ChannelCAction] }>()
const router = useRouter()
const { isDark } = useTheme()
const user = useUserInfoStore()
const avatar = computed(() => user.userInfo?.user?.avatar || defaultAvatar)
const bannerUrl = computed(() => props.banner?.trim() || defaultBanner)
const actions: Array<{ key: ChannelCAction; label: string; icon: string }> = [
  { key: 'game', label: 'UIChannelC_GameReward', icon: game },
  { key: 'notice', label: 'UIChannelC_Announcements', icon: notice },
  { key: 'recharge', label: 'UIChannelC_RechargeGift', icon: recharge },
  { key: 'invite', label: 'UIChannelC_InviteGift', icon: invite },
  { key: 'support', label: 'UIChannelC_Support', icon: support },
]

function openAccount(path: string) {
  if (requireRealUser(() => openAccount(path))) void router.push(path)
}

function fallbackBanner(event: Event) {
  const image = event.target as HTMLImageElement
  if (image.getAttribute('src') !== defaultBanner) image.src = defaultBanner
}
</script>

<template>
  <header class="c-header">
    <img class="c-logo" :src="logo" alt="POKER" />
    <div class="c-header-actions">
      <button
        type="button"
        class="c-search"
        :aria-label="t('search')"
        @click="router.push('/channel/search')"
      >
        <img :src="search" alt="" />
      </button>
      <button
        type="button"
        class="c-message"
        :aria-label="t('UIMine_MsgSystemContent')"
        @click="openAccount('/message')"
      >
        <img :src="isDark ? messageDark : messageLight" alt="" />
      </button>
      <button
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
        <span class="c-quick-icon"><img :src="action.icon" alt="" /></span>
        <span>{{ t(action.label) }}</span>
      </button>
    </div>
    <ThemeQuickSwitch class="c-theme-switch" />
  </div>
  <div class="c-banner">
    <img :src="bannerUrl" :alt="clubName" @error="fallbackBanner" />
  </div>
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
  width: 3.795rem;
  height: 1.436rem;
  margin-top: 0.02rem;
  margin-left: 0.1rem;
  object-fit: contain;
}
.c-header-actions {
  display: flex;
  align-items: center;
  gap: 0.256rem;
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
  background: #00000029;
  @include theme-light {
    background: #fff;
  }
}
.c-message {
  background: transparent;
}
.c-header-actions .c-user {
  width: 0.923rem;
  height: 0.923rem;
  overflow: hidden;
  border: 1.5px solid #69beff;
  border-radius: 50%;
  background: #00000029;
  @include theme-light {
    background: #fff;
  }
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
  margin-top: 0.15rem;
}
.c-quick-actions button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #000c;
  font: inherit;
  font-size: 0.256rem;
  line-height: 1.4;
  cursor: pointer;
  min-width: 0;
}
.c-quick-actions button > span:last-child {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  max-width: 100%;
  height: 0.6rem;
  overflow: hidden;
  overflow-wrap: anywhere;
  text-align: center;
}
.c-quick-icon {
  display: grid;
  place-items: center;
  width: 0.872rem;
  height: 0.872rem;
}
.c-theme-switch {
  transform: scale(1.85);
  transform-origin: right center;
  margin: 0 0.05rem 0 0.4rem;
}
.c-banner {
  width: 100%;
  aspect-ratio: 372 / 69;
  margin: 0.075rem 0 0.128rem;
  border-radius: 0.282rem;
  overflow: hidden;
}
.c-banner img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 1px solid #69beff;
  border-radius: inherit;
}
</style>
