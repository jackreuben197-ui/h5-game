<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { postStatsUserGameRecordListApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import gameZoneMahjongMini from '@/assets/icons/game_zone_mahjong_mini.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const title = computed(() => 'Result')

interface HandRow {
  id: string
  roundType: string
  handId: string
  result: string
  score: string
  fanText: string
}

const router = useRouter()
const route = useRoute()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const loading = ref(false)
const handRows = ref<HandRow[]>([])
const overviewTitle = ref('牌局名称')
const overviewId = ref('ID: --')
const overviewHands = ref('Hands 0')

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatSigned(value: unknown): string {
  const amount = toSafeNumber(value)
  if (amount === 0) return '0'
  const abs = Math.abs(amount).toLocaleString('en-US')
  return amount > 0 ? `+${abs}` : `-${abs}`
}

function resolveRoomId(): number {
  const raw = route.query.room_id
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

async function fetchMahjongHands(): Promise<void> {
  const roomId = resolveRoomId()
  if (roomId <= 0) {
    handRows.value = []
    return
  }

  loading.value = true
  try {
    const response = await postStatsUserGameRecordListApi({
      room_type: 2,
      room_id: roomId,
      game_types: [6],
      limit: 50,
      offset: 0,
    } as unknown as Record<string, unknown>)

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载麻将手牌失败')
    }

    const records = Array.isArray(response.data?.records) ? response.data.records : []
    const room = (records[0]?.room_record as Record<string, unknown>) ?? {}
    const userRowsRaw = Array.isArray(records[0]?.user_game_records)
      ? records[0]?.user_game_records
      : []
    const userRows = userRowsRaw.filter(
      (item): item is Record<string, unknown> => !!item && typeof item === 'object',
    )

    overviewTitle.value = String(room.name ?? '牌局名称')
    overviewId.value = `ID: ${String(room.room_id ?? roomId)}`
    overviewHands.value = `Hands ${userRows.length}`
    handRows.value = userRows.map((item, index) => ({
      id: String(item.id ?? item.room_unique_id ?? index + 1),
      roundType: '推倒胡',
      handId: String(item.room_unique_id ?? item.id ?? '--'),
      result: toSafeNumber(item.change) >= 0 ? 'Win' : 'Lose',
      score: formatSigned(item.change),
      fanText: `底池 x${toSafeNumber(item.bet_pot)}`,
    }))
  } catch (error) {
    handRows.value = []
    const message = error instanceof Error ? error.message : '加载麻将手牌失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

function goReport(): void {
  void router.push('/mine/club-record/report')
}

onMounted(() => {
  void fetchMahjongHands()
})
</script>

<template>
  <div class="page-shell record-hand-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="glass-card overview-card">
        <div class="left-user">
          <div class="avatar"></div>
          <div>
            <div class="name">Player Name</div>
            <div class="hands">{{ overviewHands }}</div>
          </div>
        </div>
        <div class="right-info">
          <div class="title">{{ overviewTitle }}</div>
          <div class="sub">{{ overviewId }}</div>
        </div>
      </section>

      <section class="list-wrap">
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!handRows.length" class="list-status">暂无麻将手牌</p>
        <article
          v-for="item in handRows"
          :key="item.id"
          class="glass-card hand-card"
          @click="goReport"
        >
          <div class="left-meta">
            <div class="round-chip">
              <img :src="gameZoneMahjongMini" alt="mahjong" />
              <span>{{ item.roundType }}</span>
            </div>
            <div class="sub-line">ID: {{ item.handId }}</div>
            <div class="sub-line">{{ item.result }}</div>
          </div>

          <div class="right-meta" :class="{ minus: item.score.startsWith('-') }">
            <div class="score">{{ item.score }}</div>
            <div class="fan-row">
              <span class="tile">中</span>
              <span>{{ item.fanText }}</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.record-hand-page {
  height: 100dvh;
  // padding-top: calc(env(safe-area-inset-top) + 0.46rem);
  padding-bottom: 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  padding: 0 0.45rem;
}

.glass-card {
  border-radius: 0.42rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.overview-card {
  margin-top: 0.35rem;
  padding: 0.24rem 0.32rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.2rem;
}

.left-user {
  display: flex;
  align-items: center;
  gap: 0.16rem;

  .avatar {
    width: 0.84rem;
    height: 0.84rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.48);
  }

  .name {
    font-size: 0.35rem;
  }

  .hands {
    margin-top: 0.05rem;
    font-size: 0.27rem;
    color: rgba(255, 255, 255, 0.74);
  }
}

.right-info {
  text-align: right;

  .title {
    font-size: 0.42rem;
  }

  .sub {
    margin-top: 0.08rem;
    font-size: 0.28rem;
    color: rgba(255, 255, 255, 0.78);
  }
}

.list-wrap {
  margin-top: 0.34rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.list-status {
  text-align: center;
  font-size: 0.3rem;
  opacity: 0.78;
  margin: 0.2rem 0;
}

.hand-card {
  padding: 0.24rem 0.3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.2rem;
}

.round-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;

  img {
    width: 0.48rem;
    height: 0.48rem;
    border-radius: 0.1rem;
    object-fit: cover;
  }

  span {
    font-size: 0.34rem;
  }
}

.sub-line {
  margin-top: 0.08rem;
  font-size: 0.28rem;
  color: rgba(255, 255, 255, 0.78);
}

.right-meta {
  text-align: right;
  color: #65e89f;

  &.minus {
    color: #ff8ea2;
  }
}

.score {
  font-size: 0.52rem;
  font-weight: 700;
}

.fan-row {
  margin-top: 0.06rem;
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
  font-size: 0.29rem;
}

.tile {
  width: 0.34rem;
  height: 0.44rem;
  border-radius: 0.06rem;
  background: #ffffff;
  color: #d6425e;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.26rem;
  font-weight: 700;
}
</style>
