<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import { postStatsCowboyHistoryRoomDetailApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import iconTime from '@/assets/icons/icon_time.png'

const title = computed(() => '牛仔战绩')

interface CowboyRecordItem {
  id: string
  name: string
  uid: string
  time: string
  amount: string
  positive: boolean
}

const router = useRouter()
const route = useRoute()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const loading = ref(false)
const records = ref<CowboyRecordItem[]>([])

const roomId = computed(() => Number(route.query.room_id ?? 0))
const fallbackTime = computed(() => String(route.query.time ?? '--'))

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatAmount(value: unknown): string {
  const amount = toSafeNumber(value)
  const abs = Math.abs(amount).toLocaleString('en-US')
  if (amount === 0) {
    return '0'
  }
  return amount > 0 ? `+${abs}` : `-${abs}`
}

function mapRecord(row: Record<string, unknown>, index: number): CowboyRecordItem {
  const win = toSafeNumber(row.user_win)
  return {
    id: String(row.user_random_id ?? row.user_id ?? index + 1),
    name: String(row.user_nick_name ?? 'Player'),
    uid: String(row.user_random_id ?? row.user_id ?? '--'),
    time: fallbackTime.value,
    amount: formatAmount(win),
    positive: win >= 0,
  }
}

async function fetchDetail(): Promise<void> {
  if (roomId.value <= 0) {
    records.value = []
    return
  }

  loading.value = true
  try {
    const response = await postStatsCowboyHistoryRoomDetailApi({
      room_id: roomId.value,
      limit: 50,
      offset: 0,
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载详情失败')
    }

    const rows = response.data?.records ?? []
    records.value = rows.map((row, index) => mapRecord(row as Record<string, unknown>, index))
  } catch (error) {
    records.value = []
    const message = error instanceof Error ? error.message : '加载详情失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

function goBack(): void {
  void router.push('/mine/club-career')
}

onMounted(() => {
  void fetchDetail()
})
</script>

<template>
  <div class="cowboy-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="list-wrap">
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!records.length" class="list-status">暂无战绩明细</p>
        <button
          v-for="item in records"
          :key="item.id"
          type="button"
          class="record-card"
        >
          <div class="left">
            <div class="avatar-wrap">
              <span class="cowboy-hat" aria-hidden="true">⌒</span>
            </div>
            <div class="info">
              <div class="name">{{ item.name }}</div>
              <div class="uid">ID: {{ item.uid }}</div>
            </div>
          </div>

          <div class="right">
            <div class="time-row">
              <img :src="iconTime" alt="time" />
              <span>{{ item.time }}</span>
            </div>
            <div class="amount" :class="item.positive ? 'up' : 'down'">{{ item.amount }}</div>
          </div>
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cowboy-page {
  position: relative;
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.52rem) 0 0.74rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  position: relative;
  padding: 0 0.49rem;
}

.list-wrap {
  margin-top: 0.54rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.list-status {
  margin: 0.3rem 0;
  text-align: center;
  font-size: 0.34rem;
  color: rgba(255, 255, 255, 0.85);
}

.record-card {
  width: 100%;
  border: 0;
  border-radius: 0.84rem;
  padding: 0.34rem 0.42rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.05rem);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
}

.left {
  display: flex;
  align-items: center;
  gap: 0.22rem;
}

.avatar-wrap {
  width: 1.36rem;
  height: 1.36rem;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.23);
  border: 0.02rem solid rgba(255, 255, 255, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cowboy-hat {
  font-size: 0.72rem;
  line-height: 1;
  color: #00f0c8;
  transform: translateY(-0.04rem);
}

.info {
  .name {
    font-size: 0.48rem;
    line-height: 1.2;
    font-weight: 600;
    color: #f3f3f3;
  }

  .uid {
    margin-top: 0.03rem;
    font-size: 0.33rem;
    line-height: 1.2;
    color: #aaa69e;
  }
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.08rem;
}

.time-row {
  display: inline-flex;
  align-items: center;
  gap: 0.11rem;
  font-size: 0.48rem;
  line-height: 1.2;
  font-weight: 600;

  img {
    width: 0.34rem;
    height: 0.34rem;
    opacity: 0.96;
  }
}

.amount {
  font-size: 0.48rem;
  line-height: 1.2;
  font-weight: 600;

  &.up {
    color: #ff132b;
  }

  &.down {
    color: #05e7ae;
  }
}

@media (max-width: 360px) {
  .cowboy-page {
    padding-left: 0.44rem;
    padding-right: 0.44rem;
  }

  .record-card {
    padding-left: 0.32rem;
    padding-right: 0.32rem;
  }

  .info .name,
  .time-row,
  .amount {
    font-size: 0.42rem;
  }
}
</style>
