<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { postStatsUserGameRecordListApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const title = computed(() => 'Result')

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const gameTabs = ['德州', '短牌', '奥马哈']
const modeTabs = ['近期', '收藏']
const selectedGame = ref(gameTabs[0])
const selectedMode = ref(modeTabs[0])

interface HandCard {
  id: string
  title: string
  handId: string
  table: string
  pot: string
  hands: string
  profit: string
  negative?: boolean
}

const loading = ref(false)
const handCards = ref<HandCard[]>([])

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatSigned(value: unknown): string {
  const amount = toSafeNumber(value)
  if (amount === 0) {
    return '0'
  }
  const abs = Math.abs(amount).toLocaleString('en-US')
  return amount > 0 ? `+${abs}` : `-${abs}`
}

function resolveGameFilter(): { game_types: number[]; poker_types?: number[] } {
  if (selectedGame.value === '奥马哈') {
    return { game_types: [1, 2, 3] }
  }
  if (selectedGame.value === '短牌') {
    return { game_types: [0], poker_types: [2] }
  }
  return { game_types: [0] }
}

function mapRowToCards(row: Record<string, unknown>, index: number): HandCard[] {
  const roomRecord = (row.room_record as Record<string, unknown>) ?? {}
  const gameRecords = Array.isArray(row.user_game_records) ? row.user_game_records : []
  const roomName = String(roomRecord.name ?? 'Hand Record')
  const handTable = `${toSafeNumber(roomRecord.small_blind)}/${toSafeNumber(roomRecord.random_ante ?? 0)}(${toSafeNumber(roomRecord.poker_type)})`

  return gameRecords.map((item, itemIndex) => {
    const record = (item as Record<string, unknown>) ?? {}
    const handId = String(record.room_unique_id ?? record.id ?? '--')
    const pot = toSafeNumber(record.bet_pot).toLocaleString('en-US')
    const hands = toSafeNumber(record.hand_num).toLocaleString('en-US')
    const profit = formatSigned(record.change)
    return {
      id: `${index + 1}-${itemIndex + 1}-${handId}`,
      title: String(record.name ?? roomName),
      handId,
      table: handTable,
      pot,
      hands,
      profit,
      negative: !profit.startsWith('+'),
    }
  })
}

async function fetchHandCollection(): Promise<void> {
  loading.value = true
  try {
    const filter = resolveGameFilter()
    const response = await postStatsUserGameRecordListApi({
      ...filter,
      room_type: 0,
      limit: 20,
      offset: 0,
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载手牌记录失败')
    }

    const records = Array.isArray(response.data?.records) ? response.data.records : []
    const flat = records.flatMap((row, index) => mapRowToCards((row as Record<string, unknown>) ?? {}, index))
    handCards.value = selectedMode.value === '收藏'
      ? flat.filter(card => card.handId && card.handId !== '--').slice(0, 20)
      : flat
  } catch (error) {
    handCards.value = []
    const message = error instanceof Error ? error.message : '加载手牌记录失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

function selectGame(tab: string): void {
  if (selectedGame.value === tab) return
  selectedGame.value = tab
  void fetchHandCollection()
}

function selectMode(tab: string): void {
  if (selectedMode.value === tab) return
  selectedMode.value = tab
  void fetchHandCollection()
}

onMounted(() => {
  void fetchHandCollection()
})
</script>

<template>
  <div class="mine-glass-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <div class="tabs game-tabs">
        <button
          v-for="item in gameTabs"
          :key="item"
          type="button"
          :class="['plain-tab', { active: selectedGame === item }]"
          @click="selectGame(item)"
        >
          {{ item }}
        </button>
      </div>

      <div class="tabs mode-tabs">
        <button
          v-for="item in modeTabs"
          :key="item"
          type="button"
          :class="['capsule-tab', { active: selectedMode === item }]"
          @click="selectMode(item)"
        >
          {{ item }}
        </button>
      </div>

      <section class="list-wrap">
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!handCards.length" class="list-status">暂无手牌记录</p>
        <article v-for="card in handCards" :key="card.id" class="glass-card hand-card">
          <div class="top-row">
            <div class="poker-pair">
              <div class="poker">10♣</div>
              <div class="poker red">J♦</div>
            </div>
            <div class="title">{{ card.title }}</div>
          </div>
          <div class="line"></div>
          <div class="bottom-row">
            <div class="meta">
              <div>Hand ID: {{ card.handId }}</div>
              <div>{{ card.table }}&nbsp;&nbsp;&nbsp;底池: {{ card.pot }}</div>
            </div>
            <div class="profit">
              <div :class="['money', { negative: card.negative !== false }]">{{ card.profit }}</div>
              <div>Hands:{{ card.hands }}</div>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mine-glass-page {
  min-height: 100dvh;
  padding-top: calc(env(safe-area-inset-top) + 0.46rem);
  padding-bottom: 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  padding: 0 0.45rem;
}

.tabs {
  display: flex;
}

.game-tabs {
  margin-top: 0.4rem;
  justify-content: space-around;
}

.plain-tab {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.42rem;
  padding-bottom: 0.06rem;

  &.active {
    color: #fff;
    border-bottom: 0.03rem solid rgba(255, 255, 255, 0.9);
  }
}

.mode-tabs {
  margin-top: 0.3rem;
  border-radius: 0.56rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.08rem;
}

.capsule-tab {
  flex: 1;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: #fff;
  font-size: 0.44rem;
  padding: 0.2rem 0;

  &.active {
    background: rgba(255, 255, 255, 0.2);
    font-weight: 700;
  }
}

.list-wrap {
  margin-top: 0.38rem;
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
}

.list-status {
  text-align: center;
  font-size: 0.3rem;
  opacity: 0.78;
  padding: 0.24rem 0;
}

.glass-card {
  border-radius: 0.44rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.hand-card {
  padding: 0.28rem 0.3rem 0.24rem;
}

.top-row,
.bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.poker-pair {
  display: flex;
  gap: 0.08rem;
}

.poker {
  width: 0.64rem;
  height: 0.82rem;
  border-radius: 0.1rem;
  background: #fff;
  color: #000;
  font-size: 0.22rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0.08rem;

  &.red {
    color: #fa2b4b;
  }
}

.title {
  flex: 1;
  text-align: right;
  font-size: 0.34rem;
  font-weight: 600;
}

.line {
  height: 0.02rem;
  background: rgba(249, 249, 249, 0.2);
  margin: 0.16rem 0;
}

.meta {
  font-size: 0.31rem;
  line-height: 1.4;
}

.profit {
  text-align: right;
  font-size: 0.31rem;
}

.money {
  color: #05e7ae;
  font-size: 0.52rem;
  font-weight: 700;

  &.negative {
    color: #27d300;
  }
}
</style>
