<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import iconNlh from '@/assets/icons/game_type_nlh.svg'
import iconPlo from '@/assets/icons/game_type_plo.svg'
import iconSixPlus from '@/assets/icons/game_type_6+.svg'
import { useRoute, useRouter } from 'vue-router'
import { postOrgClubGoldApi } from '@/api/org'
import { useUserInfoStore } from '@/stores/userInfo'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { t } from '@/i18n'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

interface GameTypeItem {
  key: string
  title: string
  icon: string
  game_play_type: number
}
const router = useRouter()
const route = useRoute()
const userInfoStore = useUserInfoStore()
const selectedKey = ref('')
const originType = computed(() => {
  const v = Number(route.query.origin_type)
  return Number.isFinite(v) && v > 0 ? v : undefined
})
const showJackpot = computed(() => originType.value !== 4)
const shouldReturnHome = computed(() => route.query.return_to === 'home')
// 1.NLH 2.PLO 3.6+ 4.fantasy 5.牛仔 6.麻将 7.mtt 8.SNG 9.惯蛋
const gameTypes: GameTypeItem[] = [
  { key: 'nlh', game_play_type: 1, title: t('adaptation10022'), icon: iconNlh },
  { key: 'plo', game_play_type: 2, title: t('adaptation10009'), icon: iconPlo },
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
  const query: Record<string, string | number> = { game_play_type: item.game_play_type }
  if (originType.value !== undefined) {
    query.origin_type = originType.value
  }
  if (shouldReturnHome.value) {
    query.return_to = 'home'
  }
  if (item.key === 'mtt') {
    void router.push({ path: '/createMtt', query })
  } else {
    void router.push({ path: '/createTable', query })
  }
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
const handleBack = () => {
  if (shouldReturnHome.value && originType.value !== 4) {
    router.replace('/home')
    return
  }
  router.replace({ name: originType.value === 4 ? 'friendsTable' : 'club-index' })
}

onMounted(() => {
  void prefetchClubDiamondBalance()
})
</script>

<template>
  <div class="page-shell club-table-create-page" :style="backgroundStyle">
    <HeaderBack :title="t('UIGuild_CreateTable')" @back="handleBack">
      <template #right>
        <TopActionButton
          v-if="showJackpot"
          :name="t('jackpot')"
          icon-alt="wallet"
          large
          @click="router.push('/club/jackpot')"
        />
      </template>
    </HeaderBack>
    <div class="club-table-create-overlay"></div>

    <section class="club-table-create-body">
      <div class="title-wrap">
        <h1>{{ t('UITable_Text') }}</h1>
        <div class="title-divider" aria-hidden="true">
          <span></span>
          <span></span>
        </div>
        <p>{{ t('UITable_Text2') }}</p>
      </div>

      <div class="type-grid">
        <button
          v-for="item in gameTypes"
          :key="item.key"
          type="button"
          class="type-card"
          :class="{
            'type-card--active': selectedKey === item.key,
            'custom-card-icon': item.key === 'mtt',
          }"
          @click="onSelect(item)"
        >
          <img class="type-card-icon" :src="item.icon" :alt="item.title" />
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.club-table-create-page {
  position: relative;
  height: 100dvh;
  padding: 0 0.32rem calc(0.44rem + env(safe-area-inset-bottom));
  overflow-x: hidden;
  overflow-y: auto;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.club-table-create-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

:deep(.page-back-header) {
  padding-left: 0;
  padding-right: 0;
  padding-top: calc(
    var(--app-top-padding) + var(--app-content-safe-area-top, env(safe-area-inset-top)) + 0.2rem
  );
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
  border-radius: 0.186rem;
  border-radius: 0.79rem;
  background: transparent;
  border: none;
  outline: none;
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
.custom-card-icon {
  overflow: hidden;
  img {
    width: 2.9rem;
    height: 2.8rem;
    transform: translate(7%, 12%);
  }
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
