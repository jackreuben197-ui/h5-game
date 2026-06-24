<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { postStatsUserGameRecordListApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { t } from '@/i18n'

const title = computed(() => 'Result')

const router = useRouter()
const route = useRoute()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

interface HandRow {
  id: string
  title: string
  handId: string
  pot: string
  profit: string
  hands: string
}

const loading = ref(false)
const handRows = ref<HandRow[]>([])
const overviewTitle = ref(t('UIClub_RoomCreat_0HvQkjkd'))
const overviewId = ref('ID: --')
const overviewHands = ref('Hands 0')

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

function resolveRoomId(): number {
  const raw = route.query.room_id
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

function mapHandRows(rows: Record<string, unknown>[]): HandRow[] {
  return rows.map((row, index) => ({
    id: String(row.id ?? row.room_unique_id ?? index + 1),
    title: String(row.name ?? 'Hand Record'),
    handId: String(row.room_unique_id ?? row.id ?? '--'),
    pot: toSafeNumber(row.bet_pot).toLocaleString('en-US'),
    profit: formatSigned(row.change),
    hands: toSafeNumber(row.hand_num).toLocaleString('en-US'),
  }))
}

async function fetchHandRows(): Promise<void> {
  const roomId = resolveRoomId()
  if (roomId <= 0) {
    handRows.value = []
    return
  }

  loading.value = true
  try {
    const response = await postStatsUserGameRecordListApi({
      room_type: 1,
      room_id: roomId,
      limit: 50,
      offset: 0,
    } as unknown as Record<string, unknown>)

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_LoadDetailFail6'))
    }

    const records = Array.isArray(response.data?.records) ? response.data.records : []
    const room = (records[0]?.room_record as Record<string, unknown>) ?? {}
    const userRowsRaw = Array.isArray(records[0]?.user_game_records)
      ? records[0]?.user_game_records
      : []
    const userRows = userRowsRaw.filter(
      (item): item is Record<string, unknown> => !!item && typeof item === 'object',
    )

    overviewTitle.value = String(room.name ?? t('UIClub_RoomCreat_0HvQkjkd'))
    overviewId.value = `ID: ${String(room.room_id ?? roomId)}`
    overviewHands.value = `Hands ${userRows.length}`
    handRows.value = mapHandRows(userRows)
  } catch (error) {
    handRows.value = []
    const message = error instanceof Error ? error.message : t('UIClub_LoadDetailFail6')
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

function goReport(): void {
  void router.push('/mine/friends-record/report')
}

onMounted(() => {
  void fetchHandRows()
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
        <p v-if="loading" class="list-status">{{ t('SuperView2') }}...</p>
        <p v-else-if="!handRows.length" class="list-status">{{ t('UIClub_NoRecord2') }}</p>
        <article
          v-for="item in handRows"
          :key="item.id"
          class="glass-card hand-card"
          @click="goReport"
        >
          <div class="top-row">
            <div class="poker-pair">
              <div class="poker">10</div>
              <div class="poker red">J</div>
            </div>
            <div class="title">{{ item.title }}</div>
          </div>
          <div class="line"></div>
          <div class="bottom-row">
            <div class="meta">
              <div>Hand ID: {{ item.handId }}</div>
              <div>Pot: {{ item.pot }}</div>
            </div>
            <div class="profit" :class="{ positive: item.profit.startsWith('+') }">
              <div class="money">{{ item.profit }}</div>
              <div class="hands-count">Hands: {{ item.hands }}</div>
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
  padding: 0.28rem 0.3rem;
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
  width: 0.52rem;
  height: 0.8rem;
  border-radius: 0.1rem;
  background: #fff;
  color: #111;
  font-size: 0.28rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;

  &.red {
    color: #df495f;
  }
}

.title {
  flex: 1;
  text-align: right;
  font-size: 0.34rem;
}

.line {
  height: 0.02rem;
  margin: 0.16rem 0;
  background: rgba(255, 255, 255, 0.15);
}

.meta {
  font-size: 0.3rem;
  line-height: 1.5;
}

.profit {
  text-align: right;

  .money {
    font-size: 0.52rem;
    color: #ff8498;
    font-weight: 700;
  }

  .hands-count {
    margin-top: 0.04rem;
    font-size: 0.29rem;
  }

  &.positive {
    .money {
      color: #65e89f;
    }
  }
}
</style>
