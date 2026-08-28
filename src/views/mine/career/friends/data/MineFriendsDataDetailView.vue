<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.webp'
import RoomDataDetail from '@/components/RoomDataDetail/RoomDataDetail.vue'
import { t } from '@/i18n'

const route = useRoute()
const router = useRouter()

const backgroundStyle = computed(() => ({
  '--friends-data-detail-bg-dark': `url(${mainBgUrl})`,
  '--friends-data-detail-bg-light': `url(${mainBgLightUrl})`,
}))

function toSafeNumber(value: unknown): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const roomId = computed(() => toSafeNumber(route.query.roomId))

onMounted(() => {
  if (!roomId.value) {
    showFailToast(t('UIClub_Text31') + ' roomId ' + t('UIClub_Text32'))
    void router.back()
  }
})
</script>

<template>
  <div
    class="page-shell friends-data-detail-bg club-room-history-detail-page"
    :style="backgroundStyle"
  >
    <HeaderBack :title="t('UIGuildDataRecordsDetails')" />
    <RoomDataDetail source="friend" :room-id="roomId" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.friends-data-detail-bg {
  position: relative;
  min-height: 100dvh;
  color: var(--c-text);
  background-color: var(--c-page);
  background-image: var(--friends-data-detail-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light-own {
    color: #1a1a1a;
    background-color: #f4f6f8;
    background-image: var(--friends-data-detail-bg-light) !important;

    :deep(.back-trigger),
    :deep(.back-icon) {
      color: #1a1a1a;
    }

    :deep(.title) {
      color: #1a1a1a;
      text-shadow: none;
    }
  }
}
</style>
