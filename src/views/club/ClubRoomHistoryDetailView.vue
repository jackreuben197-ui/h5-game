<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import RoomDataDetail from '@/components/RoomDataDetail/RoomDataDetail.vue'

const route = useRoute()
const router = useRouter()

import { t } from '@/i18n'

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--club-room-history-detail-bg-dark': `url(${mainBgUrl})`,
  '--club-room-history-detail-bg-light': `url(${mainBgLightUrl})`,
}))

function toSafeNumber(value: unknown): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const roomId = computed(() => toSafeNumber(route.query.roomId))
const matchId = computed(() => toSafeNumber(route.query.matchId))

onMounted(() => {
  if (!roomId.value && !matchId.value) {
    showFailToast(t('UIClub_Text31') + ' roomId/matchId ' + t('UIClub_Text32'))
    void router.back()
  }
})
</script>

<template>
  <div
    class="page-shell club-room-history-detail-page club-room-history-detail-bg"
    :style="backgroundStyle"
  >
    <HeaderBack :title="t('UIGuildDataRecordsDetails')" />
    <RoomDataDetail source="club" :room-id="roomId" :match-id="matchId" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.club-room-history-detail-bg {
  position: relative;
  height: 100dvh;
  background-image: var(--club-room-history-detail-bg-dark);
  background-size: cover;

  @include theme-light {
    background-color: #f3f4f6;
    background-image: var(--club-room-history-detail-bg-light);
  }
}
</style>
