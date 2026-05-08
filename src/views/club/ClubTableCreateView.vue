<script setup lang="ts">
import { onMounted, ref } from 'vue'
import iconNlh from '@/assets/icons/game_type_nlh.png'
import iconPlo from '@/assets/icons/game_type_plo.png'
import iconSixPlus from '@/assets/icons/game_type_6+.png'
import { useRouter } from 'vue-router'
import { postOrgClubGoldApi } from '@/api/org'
import { useUserInfoStore } from '@/stores/userInfo'

interface GameTypeItem {
  key: string
  title: string
  icon: string
  game_play_type: number
}
const router = useRouter()
const userInfoStore = useUserInfoStore()
const selectedKey = ref('')

const gameTypes: GameTypeItem[] = [
  { key: 'nlh', game_play_type: 1, title: '德州', icon: iconNlh },
  { key: 'plo', game_play_type: 2, title: '奥马哈', icon: iconPlo },
  { key: 'six_plus', game_play_type: 3, title: '6+', icon: iconSixPlus },
  // { key: 'aof', title: 'AOF', icon: iconAof },
  // { key: 'mushroom', title: '蘑菇桌', icon: iconMushroom },
  // { key: 'squid', title: '深海桌', icon: iconSquid },
  // { key: 'critical', title: '竞技桌', icon: iconCritical },
  // { key: 'mahjong', title: '麻将', icon: iconMahjong },
  // { key: 'custom', title: '自定义', icon: iconCustom },
]

function onSelect(item: GameTypeItem): void {
  selectedKey.value = item.key
  // showFailToast(`${item.title} 创建流程开发中`)
  void router.push({ path: '/createTable', query: { game_play_type: item.game_play_type } })
}

async function prefetchClubDiamondBalance(): Promise<void> {
  const clubRandomId = userInfoStore.currentClub?.random_id
  if (!clubRandomId) {
    return
  }

  try {
    const response = await postOrgClubGoldApi({
      club_random_id: clubRandomId,
    })
    if (response.code === 0 && response.data) {
      userInfoStore.syncCurrentClubDiamond(Number(response.data.diamond ?? 0))
    }
  } catch {
    // 预拉余额失败不阻塞后续流程，保持静默。
  }
}

onMounted(() => {
  void prefetchClubDiamondBalance()
})
</script>

<template>
  <div class="club-table-create-page">
    <HeaderBack :title="'创建牌桌'" />
    <div class="club-table-create-overlay"></div>

    <section class="club-table-create-body">
      <div class="title-wrap">
        <h1>选择游戏类型</h1>
        <div class="title-divider" aria-hidden="true">
          <span></span>
          <span></span>
        </div>
        <p>开始创建</p>
      </div>

      <div class="type-grid">
        <button
          v-for="item in gameTypes"
          :key="item.key"
          type="button"
          class="type-card"
          :class="{ 'type-card--active': selectedKey === item.key }"
          @click="onSelect(item)"
        >
          <img class="type-card-icon" :src="item.icon" :alt="item.title" />
          <span class="type-card-title">{{ item.title }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.club-table-create-page {
  position: relative;
  min-height: 100dvh;
  padding: 0 0.32rem calc(0.44rem + env(safe-area-inset-bottom));
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
  overflow-x: hidden;
  overflow-y: auto;
}

.club-table-create-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

:deep(.page-back-header) {
  padding-left: 0;
  padding-right: 0;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
  padding-bottom: 0;
}

.club-table-create-body {
  position: relative;
  z-index: 2;
  margin-top: 0.86rem;
}

.title-wrap {
  text-align: center;
  color: #fff;
}

.title-wrap h1 {
  margin: 0;
  font-size: 0.508rem;
  font-weight: 500;
  line-height: 1.2;
}

.title-divider {
  margin: 0.2rem auto 0;
  width: 7.245rem;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-divider span {
  width: 1.455rem;
  height: 0.013rem;
  background: rgba(255, 255, 255, 0.42);
}

.title-wrap p {
  margin: 0.14rem 0 0;
  font-size: 0.508rem;
  font-weight: 500;
  line-height: 1.2;
  opacity: 0.92;
}

.type-grid {
  margin-top: 0.93rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 0.37rem;
  row-gap: 0.32rem;
  padding: 0 0.16rem;
}

.type-card {
  position: relative;
  min-height: 2.953rem;
  border: 0.01rem solid rgba(255, 255, 255, 0.32);
  border-radius: 0.186rem;
  border-radius: 0.79rem;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.18rem;
  color: #fff;
  padding: 0rem 0rem;
}

.type-card-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.type-card-title {
  position: absolute;
  left: 50%;
  bottom: 0.15rem;
  width: 2.13rem;
  height: 0.78rem;
  transform: translateX(-50%);
  border-radius: 999px;
  text-align: center;
  font-size: 0.375rem;
  line-height: 0.78rem;
  font-weight: 400;
  text-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  background: rgba(10, 10, 10, 0.29);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  border: 0.0133rem solid rgba(255, 255, 255, 0.34);
}

@media (max-width: 360px) {
  .type-grid {
    padding: 0;
    column-gap: 0.24rem;
    row-gap: 0.24rem;
  }

  .type-card {
    min-height: 2.68rem;
  }

  .type-card-icon {
    width: 1.34rem;
    height: 1.34rem;
  }
}
</style>
