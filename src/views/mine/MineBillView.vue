<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { postUserBillApi, postUserWalletApi } from '@/api/user'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import iconDiamond from '@/assets/icons/icon_diamond.png'

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => '我的账单')

const tabs = ['UC', 'Club记分牌', '朋友桌记分牌', '钻石'] as const
type BillTab = (typeof tabs)[number]

const activeTab = ref<BillTab>('UC')
const loading = ref(false)
const totalAmount = ref(0)

interface BillRecordItem {
  name: string
  time: string
  amount: string
  positive?: boolean
}

interface BillCardItem {
  id: string
  day: string
  month: string
  title: string
  club: string
  inAmount: string
  outAmount: string
  records: BillRecordItem[]
}

const flowCards = ref<BillCardItem[]>([])

const billRequestByTab: Record<BillTab, { gold_type: number; origin_type?: number }> = {
  UC: { gold_type: 1 },
  Club记分牌: { gold_type: 3, origin_type: 3 },
  朋友桌记分牌: { gold_type: 3, origin_type: 4 },
  钻石: { gold_type: 4 },
}

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatAmount(value: unknown): string {
  return toSafeNumber(value).toLocaleString('en-US')
}

function formatSigned(value: unknown): string {
  const amount = toSafeNumber(value)
  if (amount === 0) {
    return '0'
  }
  const abs = Math.abs(amount).toLocaleString('en-US')
  return amount > 0 ? `+${abs}` : `-${abs}`
}

function pickRecordValue(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }
  return undefined
}

function extractList(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 4 || value === null || value === undefined) {
    return []
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
  }

  if (typeof value !== 'object') {
    return []
  }

  const obj = value as Record<string, unknown>
  const priorityKeys = ['list', 'records', 'items', 'data']
  for (const key of priorityKeys) {
    const nested = extractList(obj[key], depth + 1)
    if (nested.length) {
      return nested
    }
  }

  for (const nestedValue of Object.values(obj)) {
    const nested = extractList(nestedValue, depth + 1)
    if (nested.length) {
      return nested
    }
  }

  return []
}

function resolveDateParts(raw: unknown): { day: string; month: string; text: string } {
  if (typeof raw === 'string' && raw.trim()) {
    const asNumber = Number(raw)
    const candidate = Number.isFinite(asNumber) && asNumber > 0 ? new Date(asNumber * 1000) : new Date(raw)
    if (!Number.isNaN(candidate.getTime())) {
      return {
        day: String(candidate.getDate()).padStart(2, '0'),
        month: candidate.toLocaleString('en-US', { month: 'short' }),
        text: raw,
      }
    }
    return { day: '--', month: '--', text: raw }
  }

  const timestamp = toSafeNumber(raw)
  if (timestamp > 0) {
    const value = new Date(timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000)
    return {
      day: String(value.getDate()).padStart(2, '0'),
      month: value.toLocaleString('en-US', { month: 'short' }),
      text: value.toLocaleString('zh-CN', { hour12: false }),
    }
  }

  return { day: '--', month: '--', text: '--' }
}

function mapBillCard(row: Record<string, unknown>, index: number): BillCardItem {
  const title = String(
    pickRecordValue(row, ['title', 'room_name', 'game_room_name', 'op_name', 'op_desc']) ?? '账单记录',
  )
  const club = String(pickRecordValue(row, ['club_name', 'group_name', 'source_name']) ?? '--')

  const inAmount = pickRecordValue(row, ['all_bring_in', 'bring_in', 'in_amount'])
  const outAmount = pickRecordValue(row, ['bring_out', 'out_amount', 'all_bring_out'])
  const changeAmount = pickRecordValue(row, ['change_amount', 'gold_change', 'amount', 'change'])
  const timeRaw = pickRecordValue(row, ['create_time_str', 'create_time', 'time', 'created_at'])
  const timeInfo = resolveDateParts(timeRaw)

  const changeNumber = toSafeNumber(changeAmount)
  const record: BillRecordItem = {
    name: String(pickRecordValue(row, ['nick_name', 'name', 'op_name']) ?? '账单变动'),
    time: timeInfo.text,
    amount: formatSigned(changeAmount),
    positive: changeNumber > 0,
  }

  return {
    id: String(pickRecordValue(row, ['id', 'log_id', 'order_id']) ?? `${index + 1}`),
    day: timeInfo.day,
    month: timeInfo.month,
    title,
    club,
    inAmount: formatAmount(inAmount),
    outAmount: formatAmount(outAmount),
    records: [record],
  }
}

async function fetchBillData(): Promise<void> {
  loading.value = true
  const payload = {
    ...billRequestByTab[activeTab.value],
    limit: 20,
    offset: 0,
    order_type: 2,
  }

  try {
    const [billRes, walletRes] = await Promise.all([
      postUserBillApi(payload),
      postUserWalletApi(billRequestByTab[activeTab.value]),
    ])

    if (billRes.code !== 0) {
      throw new Error(typeof billRes.msg === 'string' ? billRes.msg : '加载账单失败')
    }

    if (walletRes.code !== 0) {
      throw new Error(typeof walletRes.msg === 'string' ? walletRes.msg : '加载钱包余额失败')
    }

    const rows = extractList(billRes.data?.list)
    flowCards.value = rows.map((row, index) => mapBillCard(row, index))
    totalAmount.value = toSafeNumber(walletRes.data?.amount)
  } catch (error) {
    flowCards.value = []
    totalAmount.value = 0
    const message = error instanceof Error ? error.message : '加载账单失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

function selectTab(tab: BillTab): void {
  if (activeTab.value === tab) {
    return
  }
  activeTab.value = tab
  void fetchBillData()
}

onMounted(() => {
  void fetchBillData()
})
</script>

<template>
  <div class="mine-glass-page bill-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <p class="hint">只支持查询最近三个月数据</p>

      <div class="bill-tabs">
        <button
          v-for="item in tabs"
          :key="item"
          type="button"
          :class="['tab', { active: activeTab === item }]"
          @click="selectTab(item)"
        >
          {{ item }}
        </button>
      </div>

      <section class="glass-card total-card">
        <div class="label">UC总余额</div>
        <div class="amount-row">
          <img :src="iconDiamond" alt="chip" />
          <strong>{{ formatAmount(totalAmount) }}</strong>
        </div>
        <button class="detail-btn" type="button">查看明细</button>
      </section>

      <section class="timeline">
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!flowCards.length" class="list-status">暂无账单记录</p>
        <article v-for="card in flowCards" :key="card.id" class="timeline-item">
          <div class="date-col">
            <div class="date">{{ card.day }}</div>
            <div class="month">{{ card.month }}</div>
            <span class="dot"></span>
          </div>

          <div class="glass-card flow-card">
            <div class="flow-head">
              <div>
                <div class="title">{{ card.title }} <small>(ID: 11440454)</small></div>
                <div class="sub">{{ card.club }}</div>
                <div class="sub">总带入:{{ card.inAmount }}</div>
              </div>
              <div class="sub right">总带出: {{ card.outAmount }}</div>
            </div>

            <div v-for="row in card.records" :key="`${card.id}-${row.time}-${row.amount}`" class="flow-row">
              <div>
                <div class="name">{{ row.name }}</div>
                <div class="time">{{ row.time }}</div>
              </div>
              <div :class="['money', { positive: row.positive }]">{{ row.amount }}</div>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mine-glass-page {
  position: relative;
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.52rem) 0 0.8rem;
  color: #f3f3f3;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  position: relative;
  padding: 0 0.49rem;
}

.placeholder {
  width: 0.72rem;
}

.hint {
  margin: 0.1rem 0 0;
  font-size: 0.24rem;
  opacity: 0.7;
}

.bill-tabs {
  margin-top: 0.24rem;
  display: flex;
  gap: 0.26rem;
  overflow-x: auto;
}

.tab {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.32rem;
  padding: 0.1rem 0;
  white-space: nowrap;

  &.active {
    color: #fff;
    border-bottom: 0.03rem solid rgba(255, 255, 255, 0.9);
  }
}

.glass-card {
  border-radius: 0.44rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.total-card {
  margin-top: 0.3rem;
  padding: 0.3rem 0.4rem;

  .label {
    font-size: 0.26rem;
    opacity: 0.72;
  }

  .amount-row {
    margin-top: 0.08rem;
    display: flex;
    align-items: center;
    gap: 0.14rem;

    img {
      width: 0.5rem;
    }

    strong {
      font-size: 0.66rem;
      line-height: 1;
    }
  }
}

.detail-btn {
  margin-top: 0.2rem;
  width: 100%;
  border: 0;
  background: transparent;
  color: #f3f3f3;
  font-size: 0.28rem;
  padding-top: 0.16rem;
  border-top: 0.02rem solid rgba(249, 249, 249, 0.2);
}

.timeline {
  margin-top: 0.34rem;
  display: flex;
  flex-direction: column;
  gap: 0.26rem;
}

.list-status {
  text-align: center;
  font-size: 0.26rem;
  opacity: 0.76;
  padding: 0.24rem 0;
}

.timeline-item {
  display: grid;
  grid-template-columns: 0.76rem 1fr;
  gap: 0.18rem;
}

.date-col {
  position: relative;
  text-align: right;
  font-size: 0.24rem;

  .dot {
    position: absolute;
    right: -0.12rem;
    top: 0.14rem;
    width: 0.14rem;
    height: 0.14rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
  }
}

.flow-card {
  padding: 0.26rem 0.3rem;
}

.flow-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.16rem;
  padding-bottom: 0.16rem;
  border-bottom: 0.02rem solid rgba(249, 249, 249, 0.2);

  .title {
    font-size: 0.34rem;

    small {
      opacity: 0.8;
      font-size: 0.25rem;
    }
  }

  .sub {
    margin-top: 0.04rem;
    font-size: 0.26rem;
    opacity: 0.78;
  }

  .right {
    white-space: nowrap;
    margin-top: 0.52rem;
  }
}

.flow-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.18rem 0;
  border-bottom: 0.02rem solid rgba(249, 249, 249, 0.18);

  &:last-child {
    border-bottom: 0;
  }

  .name {
    font-size: 0.34rem;
  }

  .time {
    font-size: 0.25rem;
    opacity: 0.7;
  }
}

.money {
  font-size: 0.38rem;
  color: #05e7ae;
  font-weight: 700;

  &.positive {
    color: #ff132b;
  }
}
</style>
