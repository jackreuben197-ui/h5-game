<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import RoomDataDetail from '@/components/RoomDataDetail/RoomDataDetail.vue'

const route = useRoute()
const router = useRouter()

const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

function toSafeNumber(value: unknown): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const roomId = computed(() => toSafeNumber(route.query.roomId))

onMounted(() => {
  if (!roomId.value) {
    showFailToast('缺少 roomId 参数')
    void router.back()
  }
})
</script>

<template>
  <div class="page-shell friends-data-detail-bg" :style="backgroundStyle">
    <HeaderBack :title="'数据详情'" />
    <RoomDataDetail source="friend" :room-id="roomId" />
  </div>
</template>

<style scoped lang="scss">
.friends-data-detail-bg {
  position: relative;
  height: 100dvh;
  background-size: cover;
}
</style>
