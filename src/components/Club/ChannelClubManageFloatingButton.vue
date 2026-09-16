<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import clubDetailButtonIconDark from '@/assets/icons/img_club_detail_button.png'
import clubDetailButtonIconLight from '@/assets/icons/img_club_detail_button_light.svg'
import { useChannelBottomMenu } from '@/composables/useChannelBottomMenu'
import { t } from '@/i18n'
import { requireRealUser } from '@/session/realUserGate'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { isChannelPackageHost } from '@/utils/channelPackage'
import { theme } from '@/utils/theme'

const router = useRouter()
const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()
const isChannelPackage = isChannelPackageHost()
const { isVersionB } = useChannelBottomMenu()

// 版本 B 没有俱乐部底部 Tab，赛事页和牌桌页必须保留独立的俱乐部管理入口。
const canManageClub = computed(
  () =>
    isChannelPackage &&
    isVersionB.value &&
    gameStore.isRealUser &&
    Boolean(userInfoStore.currentJoinedClub),
)

const clubDetailButtonIcon = computed(() =>
  theme.value === 'light' ? clubDetailButtonIconLight : clubDetailButtonIconDark,
)

function goToClubDetail(): void {
  if (!requireRealUser(goToClubDetail)) return
  void router.push('/club/detail')
}
</script>

<template>
  <div v-if="canManageClub" class="club-manage-floating-action">
    <button
      class="club-manage-floating-button"
      type="button"
      :aria-label="t('UIClub_ClubManager')"
      @click="goToClubDetail"
    >
      <img :src="clubDetailButtonIcon" alt="" />
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.club-manage-floating-action {
  position: fixed;
  right: 0.48rem;
  bottom: calc(2.82rem + env(safe-area-inset-bottom));
  z-index: 23;
}

.club-manage-floating-button {
  width: 1.04rem;
  height: 1.04rem;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style>
