<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRouter } from 'vue-router'
import { postFriendRoomStatsApi } from '@/api/stats'
import type { FriendRoomStatsRecord } from '@/api/models/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { showGameToast } from '@/components/Toast'
import { t } from '@/i18n'

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

interface DataRow {
  game: string
  playedGames: number
  hands: number
}

interface MenuItem {
  key: string
  text: string
  route?: string
}

const rows = ref<DataRow[]>([
  { game: 'NLH', playedGames: 0, hands: 0 },
  { game: 'PLO', playedGames: 0, hands: 0 },
  { game: '6+', playedGames: 0, hands: 0 },
  { game: 'Mahjong', playedGames: 0, hands: 0 },
])

const loading = ref(false)

const menuList: MenuItem[] = [
  { key: 'data', text: '数据', route: '/mine/career/friends/data' },
  { key: 'record', text: '战绩', route: '/mine/career/friends/record' },
  { key: 'mahjong', text: 'Mahjong' },
  { key: 'sng', text: 'SNG战绩' },
  { key: 'mahjong-mtt', text: '麻将MTT战绩' },
]

function handleMenuClick(item: MenuItem): void {
  if (!item.route) {
    showGameToast('功能开发中')
    return
  }
  void router.push(item.route)
}

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

async function fetchGameSummary(): Promise<void> {
  loading.value = true
  try {
    const response = await postFriendRoomStatsApi({})
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载朋友生涯数据失败')
    }

    const data = response.data as Record<string, unknown> | undefined
    const nlh = data?.friend_room_stats_nlh as FriendRoomStatsRecord | undefined
    const plo = data?.friend_room_stats_plo as FriendRoomStatsRecord | undefined
    const sixPlus = data?.friend_room_stats_6 as FriendRoomStatsRecord | undefined
    const mahjong = data?.friend_room_stats_mj as FriendRoomStatsRecord | undefined

    rows.value = [
      { game: 'NLH', playedGames: toSafeNumber(nlh?.game_num), hands: toSafeNumber(nlh?.hand_num) },
      { game: 'PLO', playedGames: toSafeNumber(plo?.game_num), hands: toSafeNumber(plo?.hand_num) },
      {
        game: '6+',
        playedGames: toSafeNumber(sixPlus?.game_num),
        hands: toSafeNumber(sixPlus?.hand_num),
      },
      {
        game: 'Mahjong',
        playedGames: toSafeNumber(mahjong?.game_num),
        hands: toSafeNumber(mahjong?.hand_num),
      },
    ]
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载朋友生涯数据失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchGameSummary()
})
</script>

<template>
  <div class="page-shell mine-glass-page" :style="backgroundStyle">
    <HeaderBack :title="t('PageMineFriendTableCareer')" extra-padding>
      <template #right>
        <div class="action-wrap">
          <TopActionButton
            name="数据统计"
            icon-alt="wallet"
            @click="
              handleMenuClick({ key: 'data', text: '数据', route: '/mine/career/friends/my-data' })
            "
          />
        </div>
      </template>
    </HeaderBack>

    <div class="content-wrap">
      <section class="glass-card table-card">
        <div class="table-head">
          <span>玩法</span>
          <span>Played Games</span>
          <span>Hands</span>
        </div>
        <div v-if="loading" class="table-status">加载中...</div>
        <div v-for="item in rows" :key="item.game" class="table-row">
          <span>{{ item.game }}</span>
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
          <span>{{ item.text }}</span>
          <span class="arrow">›</span>
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mine-glass-page {
  position: relative;
  height: 100dvh;
  padding: 0 0 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
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
  border-radius: 0.44rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.25);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.table-card {
  margin-top: 0.5rem;
  padding: 0.3rem 0.3rem 0.22rem;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  text-align: center;
}

.table-head {
  border-radius: 0.4rem;
  background: #00af83;
  font-size: 0.33rem;
  padding: 0.18rem 0;
}

.table-row {
  font-size: 0.42rem;
  padding: 0.3rem 0;
}

.table-status {
  text-align: center;
  font-size: 0.3rem;
  padding: 0.24rem 0;
  opacity: 0.78;
}

.list-card {
  margin-top: 0.24rem;
  padding: 0 0.36rem;
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
  padding: 0.3rem 0;

  &:last-child {
    border-bottom: 0;
  }
}

.arrow {
  font-size: 0.66rem;
}
</style>
