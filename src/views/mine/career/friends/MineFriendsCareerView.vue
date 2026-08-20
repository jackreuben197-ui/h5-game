<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRouter } from 'vue-router'
import { postFriendRoomStatsApi } from '@/api/stats'
import type { FriendRoomStatsRecord } from '@/api/models/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import CareerSvgIcon from '@/views/mine/components/CareerSvgIcon.vue'
import { showGameToast } from '@/components/Toast'
import { useGameStore } from '@/stores/game'
import { userCache } from '@/utils/userCache'
import { USER_STORE_CAREER } from '@/utils/indexedDB'
import { t } from '@/i18n'

const router = useRouter()
const gameStore = useGameStore()

// 缓存（IndexedDB career）：store=USER_STORE_CAREER，key=`-1_home`。
// 朋友桌首页接口无筛选参数（postFriendRoomStatsApi({}) 返回全部玩法的全量数据），
// 单一 key 即可；-1 与俱乐部生涯的 sourceId(0/clubId) 隔开。
const HOME_CACHE_KEY = '-1_home'
function homeCache() {
  return userCache(gameStore.loginUserId)
}

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--friends-career-bg-dark': `url(${mainBgUrl})`,
  '--friends-career-bg-light': `url(${mainBgLightUrl})`,
}))

interface DataRow {
  game: string
  playedGames: number
  hands: number
}

interface MenuItem {
  key: string
  label: string
  icon: 'data' | 'record' | 'mtt' | 'mahjong'
  route?: string
}

const rows = ref<DataRow[]>([
  { game: 'NLH', playedGames: 0, hands: 0 },
  { game: 'PLO', playedGames: 0, hands: 0 },
  { game: '6+', playedGames: 0, hands: 0 },
  // { game: 'Mahjong', playedGames: 0, hands: 0 },
])

const loading = ref(false)

const menuList: MenuItem[] = [
  { key: 'data', label: t('adaptation10124'), icon: 'data', route: '/mine/career/friends/data' },
  {
    key: 'record',
    label: t('UICareerRecord'),
    icon: 'record',
    route: '/mine/career/friends/record',
  },
  // { key: 'mahjong', label: t('Mahjong_Name'), icon: 'mahjong' },
  // { key: 'sng', label: "SNG" + t('UICareerRecord'), icon: 'mtt' },
  // { key: 'mahjong-mtt', label: t('Mahjong_Name') + "MTT" + t('UICareerRecord'), icon: 'mahjong' },
]

function handleMenuClick(item: MenuItem): void {
  if (!item.route) {
    showGameToast(t('UIClub_InDeve'))
    return
  }
  void router.push(item.route)
}

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

async function requestSummary(silent: boolean): Promise<void> {
  if (!silent) loading.value = true
  try {
    const response = await postFriendRoomStatsApi({})
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_LoadDataFail2'))
    }

    const data = response.data as Record<string, unknown> | undefined
    const nlh = data?.friend_room_stats_nlh as FriendRoomStatsRecord | undefined
    const plo = data?.friend_room_stats_plo as FriendRoomStatsRecord | undefined
    const sixPlus = data?.friend_room_stats_6 as FriendRoomStatsRecord | undefined

    const next: DataRow[] = [
      { game: 'NLH', playedGames: toSafeNumber(nlh?.game_num), hands: toSafeNumber(nlh?.hand_num) },
      { game: 'PLO', playedGames: toSafeNumber(plo?.game_num), hands: toSafeNumber(plo?.hand_num) },
      {
        game: '6+',
        playedGames: toSafeNumber(sixPlus?.game_num),
        hands: toSafeNumber(sixPlus?.hand_num),
      },
      // {
      //   game: 'Mahjong',
      //   playedGames: toSafeNumber(mahjong?.game_num),
      //   hands: toSafeNumber(mahjong?.hand_num),
      // },
    ]
    rows.value = next
    void homeCache().put(USER_STORE_CAREER, HOME_CACHE_KEY, next)
  } catch (error) {
    if (!silent) {
      const message = error instanceof Error ? error.message : t('UIClub_LoadDataFail2')
      showFailToast(message)
    }
  } finally {
    if (!silent) loading.value = false
  }
}

async function fetchGameSummary(): Promise<void> {
  const cached = await homeCache().get<DataRow[]>(USER_STORE_CAREER, HOME_CACHE_KEY)
  if (cached?.length) {
    rows.value = cached
    loading.value = false
    // 后台静默刷新覆盖缓存
    void requestSummary(true)
    return
  }
  await requestSummary(false)
}

onMounted(() => {
  void fetchGameSummary()
})
</script>

<template>
  <div class="page-shell mine-glass-page friends-career-page" :style="backgroundStyle">
    <HeaderBack :title="t('PageMineFriendTableCareer')" extra-padding>
      <template #right>
        <div class="action-wrap">
          <TopActionButton
            :name="t('UIClub_Mlistinfo_GiVUYG7E')"
            icon-alt="wallet"
            @click="
              handleMenuClick({
                key: 'data',
                label: t('adaptation10124'),
                icon: 'data',
                route: '/mine/career/friends/my-data',
              })
            "
          />
        </div>
      </template>
    </HeaderBack>

    <div class="content-wrap">
      <section class="glass-card table-card">
        <div class="table-head">
          <div class="table-head-inner">
            <span>{{ t('UIData_game') }}</span>
            <span>{{ t('UIData_YGvXd5iXr_003') }}</span>
            <span>{{ t('UIMine_RecordItemsNormal_3RCUa3w8') }}</span>
          </div>
        </div>
        <div v-if="loading" class="table-status">{{ t('SuperView2') }}...</div>
        <div v-for="item in rows" :key="item.game" class="table-row">
          <span class="game-type-label">{{ item.game }}</span>
          <span>{{ item.playedGames }}</span>
          <span>{{ item.hands }}</span>
        </div>
      </section>

      <section class="glass-card list-card">
        <button
          v-for="item in menuList"
          :key="item.key"
          type="button"
          class="line-item"
          @click="handleMenuClick(item)"
        >
          <div class="menu-left">
            <div class="icon-box">
              <CareerSvgIcon :name="item.icon" :title="item.label" class="menu-icon" />
            </div>
            <span class="menu-label">{{ item.label }}</span>
          </div>
          <CareerSvgIcon name="arrow-right" class="menu-arrow" />
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.mine-glass-page {
  position: relative;
  height: 100dvh;
  padding: 0 0 0.8rem;
  color: #f9f9f9;
  background-image: var(--friends-career-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: var(--c-text);
    background-color: var(--c-page);
    background-image: var(--friends-career-bg-light);
  }
}

.content-wrap {
  position: relative;
  padding: 0 0.49rem;
}

.back-btn {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.72rem;
  line-height: 1;
}

.mini-chip {
  border: 0;
  border-radius: 0.34rem;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 0.24rem;
  padding: 0.12rem 0.22rem;
}

.glass-card {
  border-radius: 0.7rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.25);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);

  @include theme-light {
    border-color: transparent;
    background: var(--c-surface);
    backdrop-filter: none;
  }
}

.table-card {
  margin-top: 0.4rem;
  padding: 0.4rem 0.5rem 0.35rem;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  text-align: center;
}

.table-head {
  border-radius: 0.4rem;
  // background: #00af83;
  font-size: 0.361rem;
  padding: 0.15rem 0.15rem;
  margin-bottom: 0.1rem;
  box-shadow:
    0 0 0.9rem 0.1rem rgba(var(--c-brand-rgb), 0.9) inset,
    /* 左上高光 */ inset 0.5px 0.5px 0px 0px rgba(255, 255, 255, 0.85),
    /* 右下高光 */ inset -0.5px -0.5px 0px 0px rgba(255, 255, 255, 0.85);
}
.table-head-inner {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  text-align: center;
  border-radius: 0.4rem;
  color: #fff;
  background: rgba(var(--c-brand-rgb), 0.9);
  box-shadow: 0 0 0.1rem 0.05rem rgba(var(--c-brand-rgb), 0.9);
  box-sizing: border-box;
}

.table-row {
  font-size: 0.337rem;
  padding: 0.24rem 0;
}

.table-status {
  text-align: center;
  font-size: 0.337rem;
  padding: 0.24rem 0;
  opacity: 0.78;
}
.game-type-label {
  font-size: 0.4rem;
}

.list-card {
  margin-top: 0.45rem;
  padding: 0.2rem 0.4rem;
}

.line-item {
  width: 100%;
  border: 0;
  border-bottom: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: transparent;
  color: #fff;
  font-size: 0.42rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.2rem 0;

  @include theme-light {
    color: var(--c-text);
    border-bottom-color: rgba(0, 0, 0, 0.1);
  }

  &:last-child {
    border-bottom: 0;
  }
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.icon-box {
  width: 0.62rem;
  height: 0.62rem;
  display: flex;
  align-items: center;
  justify-content: center;

}

.menu-icon {
  display: block;
  width: 0.533rem;
  height: 0.533rem;
  color: var(--c-brand);
  filter: drop-shadow(0 0 0.12rem rgba(var(--c-brand-rgb), 0.22));
}

.menu-label {
  font-size: 0.42rem;
  line-height: 1.2;
}

.menu-arrow {
  display: block;
  width: 0.27rem;
  height: 0.48rem;
  color: rgba(255, 255, 255, 0.88);

  @include theme-light {
    color: #888;
  }
}

.action-wrap {
  @include theme-light {
    :deep(.action-btn) {
      color: #fff;
      background: var(--c-brand);
    }
  }
}
</style>
