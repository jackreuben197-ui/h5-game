<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { postUserBillApi } from '@/api/user'
import type { UserBillRecord, UserBillRoom_info, UserBillWallet } from '@/api/models/user'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconUc from '@/assets/icons/icon_chips.png'
import iconCredit from '@/assets/icons/credit_chip.png'
import { formatUC } from '@/utils/roomVisibility'
import { getLocale, t } from '@/i18n'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'
import { resolveOpCodeText } from '@/utils/opCodeText'
import { useUserInfoStore, type ClubInfo } from '@/stores/userInfo'

const userInfoStore = useUserInfoStore()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => '我的账单')

const tabs = ['联盟币', 'Club记分牌', '朋友桌记分牌', '钻石'] as const
type BillTab = (typeof tabs)[number]

const activeTab = ref<BillTab>('联盟币')
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const pageOffset = ref(0)
const pageContainerRef = ref<HTMLElement | null>(null)
const totalAmount = ref(0)
const PAGE_LIMIT = 20

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
  dateKey: string
  showDate: boolean
  name: string
  club: string
  inAmount: string
  outAmount: string
  canExpand: boolean
  records: BillRecordItem[]
}

interface WalletDetailItem {
  key: string
  clubName: string
  amount: string
}

const flowCards = ref<BillCardItem[]>([])
const walletDetails = ref<WalletDetailItem[]>([])
const walletDetailExpanded = ref(false)
const expandedCardIds = ref<string[]>([])

const billRequestByTab: Record<BillTab, { gold_type: number; origin_type?: number }> = {
  联盟币: { gold_type: 1 },
  Club记分牌: { gold_type: 3, origin_type: 3 },
  朋友桌记分牌: { gold_type: 3, origin_type: 4 },
  钻石: { gold_type: 4 },
}

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatAmount(value: unknown): string {
  if (activeTab.value === '钻石') {
    return toSafeNumber(value).toLocaleString('en-US')
  }
  return formatUC(toSafeNumber(value))
}

function formatFlowAmount(value: unknown): string {
  if (activeTab.value === '钻石') {
    return toSafeNumber(value).toLocaleString('en-US')
  }
  return Math.abs(toSafeNumber(value)).toLocaleString('en-US')
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
    return value.filter(
      (item): item is Record<string, unknown> => !!item && typeof item === 'object',
    )
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

function resolveDateParts(raw: unknown): {
  day: string
  month: string
  text: string
  dateKey: string
} {
  if (typeof raw === 'string' && raw.trim()) {
    const asNumber = Number(raw)
    const candidate =
      Number.isFinite(asNumber) && asNumber > 0 ? new Date(asNumber * 1000) : new Date(raw)
    if (!Number.isNaN(candidate.getTime())) {
      const year = candidate.getFullYear()
      const month = String(candidate.getMonth() + 1).padStart(2, '0')
      const day = String(candidate.getDate()).padStart(2, '0')
      return {
        day,
        month: candidate.toLocaleString('en-US', { month: 'short' }),
        text: raw,
        dateKey: `${year}-${month}-${day}`,
      }
    }
    return { day: '--', month: '--', text: raw, dateKey: raw.trim() }
  }

  const timestamp = toSafeNumber(raw)
  if (timestamp > 0) {
    const value = new Date(timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000)
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return {
      day,
      month: value.toLocaleString('en-US', { month: 'short' }),
      text: value.toLocaleString('zh-CN', { hour12: false }),
      dateKey: `${year}-${month}-${day}`,
    }
  }

  return { day: '--', month: '--', text: '--', dateKey: '--' }
}

function normalizeTimeText(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) {
    const candidate = new Date(raw)
    if (!Number.isNaN(candidate.getTime())) {
      const y = candidate.getFullYear()
      const m = String(candidate.getMonth() + 1).padStart(2, '0')
      const d = String(candidate.getDate()).padStart(2, '0')
      const hh = String(candidate.getHours()).padStart(2, '0')
      const mm = String(candidate.getMinutes()).padStart(2, '0')
      return `${y}/${m}/${d} ${hh}:${mm}`
    }
    return raw
  }
  return resolveDateParts(raw).text
}

function resolveNameByLocale(raw: unknown): string {
  const safeName = typeof raw === 'string' ? raw.trim() : ''
  if (!safeName) {
    return ''
  }
  return resolveTemplateTextByKey(safeName, getLocale()) || t(safeName) || safeName
}

function resolveNameFromMultiLangObj(raw: unknown): string {
  if (!raw || typeof raw !== 'object') {
    return ''
  }

  const source = raw as Record<string, unknown>
  const locale = getLocale()
  const localeKeys: Record<string, string[]> = {
    zh: ['zh', 'cn', 'zh_name', 'cn_name'],
    cn: ['zh', 'cn', 'zh_name', 'cn_name'],
    en: ['en', 'us', 'en_name', 'us_name'],
    pt: ['pt', 'br', 'pt_name', 'br_name'],
  }

  const keys = localeKeys[locale] ?? localeKeys.en
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  for (const key of ['name', 'title', 'default']) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

function isMttCard(row: UserBillWallet, nameCandidates: string[]): boolean {
  if (toSafeNumber(row.src_match_id) > 0) {
    return true
  }
  if (typeof row.match_tribe_name === 'string' && row.match_tribe_name.trim()) {
    return true
  }

  const texts = [row.op_code, ...nameCandidates]
    .map((item) =>
      String(item ?? '')
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean)
  return texts.some((text) => text.includes('mtt') || text.includes('match'))
}

function mapBillRecord(row: UserBillRecord): BillRecordItem {
  const changeValue = toSafeNumber(row.gold_change)
  const opCodeName = resolveOpCodeText(row.op_code)

  return {
    name: opCodeName || '账单变动',
    time: normalizeTimeText(row.create_time),
    amount: formatSigned(changeValue),
    positive: changeValue > 0,
  }
}

function mapBillCard(row: UserBillWallet, index: number): BillCardItem {
  const roomInfo = (row.room_info as UserBillRoom_info | undefined) || undefined
  const records = Array.isArray(roomInfo?.records)
    ? roomInfo.records.map((item) => mapBillRecord(item))
    : []

  const rawName = String(
    pickRecordValue(row as Record<string, unknown>, [
      'name',
      'title',
      'room_name',
      'game_room_name',
    ]) ?? '',
  )
  const localizedNameByKey = resolveNameByLocale(rawName)
  const localizedNameByMultiObj = resolveNameFromMultiLangObj(row.multi_lang_names_obj)
  const fallbackName =
    resolveOpCodeText(row.op_code) ||
    localizedNameByMultiObj ||
    localizedNameByKey ||
    rawName ||
    '账单记录'
  const roomName = localizedNameByMultiObj || localizedNameByKey || rawName
  const cardName = roomName || fallbackName
  const club = String(
    roomInfo?.club_name ??
      pickRecordValue(row as Record<string, unknown>, ['club_name', 'group_name', 'source_name']) ??
      '--',
  )

  const inAmount = roomInfo?.bring_in_amount
  const outAmount = roomInfo?.bring_out_amount
  const changeAmount = pickRecordValue(row as Record<string, unknown>, [
    'change_amount',
    'gold_change',
    'amount',
    'change',
  ])
  const timeRaw = pickRecordValue(row as Record<string, unknown>, [
    'create_time_str',
    'create_time',
    'time',
    'created_at',
  ])
  const timeInfo = resolveDateParts(timeRaw)

  const fallbackRecord: BillRecordItem = {
    name: fallbackName,
    time: timeInfo.text,
    amount: formatSigned(changeAmount),
    positive: toSafeNumber(changeAmount) > 0,
  }

  const finalRecords = records.length ? records : [fallbackRecord]
  const bringInAmount = toSafeNumber(inAmount)
  const bringOutAmount = toSafeNumber(outAmount)
  const hasBringInAndOut = bringInAmount > 0 && bringOutAmount > 0
  const isDiamondTab = activeTab.value === '钻石'
  const isMtt = isMttCard(row, [cardName, fallbackName])
  const canExpand = !isDiamondTab && !isMtt && hasBringInAndOut && finalRecords.length > 0

  return {
    id: String(
      pickRecordValue(row as Record<string, unknown>, ['id', 'log_id', 'order_id']) ??
        `${index + 1}`,
    ),
    day: timeInfo.day,
    month: timeInfo.month,
    dateKey: timeInfo.dateKey,
    showDate: true,
    name: cardName,
    club,
    inAmount: formatFlowAmount(inAmount),
    outAmount: formatFlowAmount(outAmount),
    canExpand,
    records: finalRecords,
  }
}

function mapWalletDetails(): WalletDetailItem[] {
  if (!Array.isArray(userInfoStore.clubList) || userInfoStore.clubList.length === 0) {
    return []
  }
  if (activeTab.value === '钻石') {
    totalAmount.value = userInfoStore.userInfo?.user.diamonds ?? 0
  }
  if (activeTab.value === '钻石' || activeTab.value === '朋友桌记分牌') {
    return []
  }
  totalAmount.value = 0
  return userInfoStore.clubList
    .filter(
      (item): item is ClubInfo =>
        !!item && typeof item === 'object' && !(activeTab.value === '联盟币' && item.tribe_id === 0),
    )
    .map((item, index) => {
      const clubName = String(item.club_name ?? '').trim() || `俱乐部${index + 1}`
      const amount =
        activeTab.value === '联盟币'
          ? (item.user_gold ?? 0)
          : activeTab.value === 'Club记分牌'
            ? (item.user_credit ?? 0)
            : 0
      totalAmount.value += amount
      return {
        key: `${clubName}-${index}`,
        clubName,
        amount: formatAmount(amount),
      }
    })
}

const showWalletDetailButton = computed(() => {
  if (activeTab.value === '联盟币' || activeTab.value === 'Club记分牌') {
    return walletDetails.value.length > 0
  }
  return false
})

function isCardExpanded(cardId: string): boolean {
  return expandedCardIds.value.includes(cardId)
}

function toggleCardExpanded(cardId: string): void {
  const targetCard = flowCards.value.find((card) => card.id === cardId)
  if (!targetCard?.canExpand) {
    return
  }

  if (isCardExpanded(cardId)) {
    expandedCardIds.value = expandedCardIds.value.filter((id) => id !== cardId)
    return
  }
  expandedCardIds.value = [...expandedCardIds.value, cardId]
}

function toggleWalletDetails(): void {
  if (!showWalletDetailButton.value) {
    return
  }
  walletDetailExpanded.value = !walletDetailExpanded.value
}

function applyDateVisibility(cards: BillCardItem[]): BillCardItem[] {
  let previousDateKey = ''
  return cards.map((card) => {
    const showDate = card.dateKey !== previousDateKey
    previousDateKey = card.dateKey
    return {
      ...card,
      showDate,
    }
  })
}

function isNearBottom(container: HTMLElement): boolean {
  const threshold = 80
  return container.scrollTop + container.clientHeight >= container.scrollHeight - threshold
}

function handlePageScroll(): void {
  const container = pageContainerRef.value
  if (!container || !isNearBottom(container)) {
    return
  }
  void loadMoreBillData()
}

async function fetchBillData(reset = true): Promise<void> {
  if (reset) {
    loading.value = true
    walletDetailExpanded.value = false
    expandedCardIds.value = []
    hasMore.value = true
    pageOffset.value = 0
    walletDetails.value = mapWalletDetails()
    flowCards.value = []
  } else {
    loadingMore.value = true
  }

  const payload = {
    ...billRequestByTab[activeTab.value],
    limit: PAGE_LIMIT,
    offset: reset ? 0 : pageOffset.value,
    order_type: 2,
  }

  try {
    const billRes = await postUserBillApi(payload)

    if (billRes.code !== 0) {
      throw new Error(typeof billRes.msg === 'string' ? billRes.msg : '加载账单失败')
    }

    const rows = extractList(billRes.data?.list) as UserBillWallet[]
    const mapped = rows.map((row, index) => mapBillCard(row, index))

    if (reset) {
      flowCards.value = applyDateVisibility(mapped)
    } else {
      flowCards.value = applyDateVisibility([...flowCards.value, ...mapped])
    }

    pageOffset.value += rows.length
    hasMore.value = rows.length >= PAGE_LIMIT
  } catch (error) {
    if (reset) {
      flowCards.value = []
      walletDetails.value = []
      totalAmount.value = 0
      pageOffset.value = 0
      hasMore.value = false
    }
    const message = error instanceof Error ? error.message : '加载账单失败'
    showFailToast(message)
  } finally {
    if (reset) {
      loading.value = false
    } else {
      loadingMore.value = false
    }
  }
}

async function loadMoreBillData(): Promise<void> {
  if (loading.value || loadingMore.value || !hasMore.value) {
    return
  }
  await fetchBillData(false)
}

function selectTab(tab: BillTab): void {
  if (activeTab.value === tab) {
    return
  }
  activeTab.value = tab
  void fetchBillData(true)
}

onMounted(() => {
  void fetchBillData(true)
})
</script>

<template>
  <div
    ref="pageContainerRef"
    class="page-shell mine-glass-page bill-page"
    :style="backgroundStyle"
    @scroll.passive="handlePageScroll"
  >
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
          <span class="tab-label">{{ item }}</span>
        </button>
      </div>

      <section v-if="activeTab !== '朋友桌记分牌'" class="glass-card total-card">
        <div v-if="activeTab === '联盟币'" class="label">联盟币总金额</div>
        <div v-else-if="activeTab === 'Club记分牌'" class="label">俱乐部记分牌总额度</div>
        <div v-else-if="activeTab === '钻石'" class="label">钻石余额</div>
        <div class="amount-row">
          <img v-if="activeTab === '联盟币'" :src="iconUc" alt="chip" />
          <img v-else-if="activeTab === 'Club记分牌'" :src="iconCredit" alt="chip" />
          <img v-else :src="iconDiamond" alt="diamond" />
          <strong>{{ formatAmount(totalAmount) }}</strong>
        </div>
        <div v-if="walletDetailExpanded" class="wallet-detail-wrap">
          <div class="wallet-detail-list">
            <div v-for="item in walletDetails" :key="item.key" class="wallet-detail-row">
              <span class="club">{{ item.clubName }}</span>
              <span class="value">{{ item.amount }}</span>
            </div>
          </div>
        </div>
        <button
          v-if="showWalletDetailButton"
          :class="['detail-btn', { 'detail-btn--no-border': walletDetailExpanded }]"
          type="button"
          @click="toggleWalletDetails"
        >
          查看明细
          <span :class="['arrow', { expanded: walletDetailExpanded }]"></span>
        </button>
      </section>

      <section class="timeline">
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!flowCards.length" class="list-status">暂无账单记录</p>
        <article v-for="card in flowCards" :key="card.id" :class="['timeline-item', { 'timeline-item--new-date': card.showDate }]">
          <div :class="['date-col', { 'date-col--continued': !card.showDate }]">
            <div v-if="card.showDate" class="date">{{ card.day }}</div>
            <div v-if="card.showDate" class="month">{{ card.month }}</div>
            <span class="dot"></span>
          </div>

          <div class="glass-card flow-card">
            <div :class="['flow-head', { 'flow-head--no-divider': !card.canExpand }]">
              <div>
                <div class="title">{{ card.name }}</div>
                <div class="sub">{{ card.club }}</div>
                <div class="sub">总带入:{{ card.inAmount }}</div>
              </div>
              <div class="right-box">
                <button
                  v-if="card.canExpand"
                  class="record-toggle"
                  type="button"
                  @click="toggleCardExpanded(card.id)"
                >
                  <span :class="['arrow', { expanded: isCardExpanded(card.id) }]"></span>
                </button>
                <div class="sub right">总带出: {{ card.outAmount }}</div>
              </div>
            </div>

            <div
              v-for="row in card.canExpand && isCardExpanded(card.id) ? card.records : []"
              :key="`${card.id}-${row.time}-${row.amount}`"
              class="flow-row"
            >
              <div>
                <div class="name">{{ row.name }}</div>
                <div class="time">{{ row.time }}</div>
              </div>
              <div :class="['money', { positive: row.positive }]">{{ row.amount }}</div>
            </div>
          </div>
        </article>
        <p v-if="!loading && loadingMore" class="list-status">加载更多中...</p>
        <p v-else-if="!loading && flowCards.length && !hasMore" class="list-status">
          没有更多记录了
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mine-glass-page {
  position: relative;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
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
  margin-left: -0.49rem;
  margin-right: -0.49rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.tab {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.32rem;
  padding: 0.1rem 0;
  white-space: nowrap;
  display: flex;
  justify-content: center;
  align-items: center;

  &.active {
    color: #fff;

    .tab-label {
      border-bottom: 0.03rem solid rgba(255, 255, 255, 0.9);
    }
  }
}

.tab-label {
  display: inline-block;
  padding-bottom: 0.06rem;
}

.glass-card {
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.12rem;
  border: 0;
  border-top: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: transparent;
  color: #f3f3f3;
  font-size: 0.28rem;
  padding-top: 0.16rem;

  &.detail-btn--no-border {
    border-top: 0;
    padding-top: 0.08rem;
  }
}

.wallet-detail-wrap {
  margin-top: 0.16rem;
  border-radius: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 14px;
}

.wallet-detail-list {
  padding: 0.04rem 0;
}

.wallet-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.08rem 0;
  font-size: 0.26rem;

  .club {
    opacity: 0.82;
  }

  .value {
    font-weight: 600;
  }
}

.arrow {
  width: 0.154rem;
  height: 0.154rem;
  border-right: 0.03rem solid rgba(255, 255, 255, 0.82);
  border-bottom: 0.03rem solid rgba(255, 255, 255, 0.82);
  transform: rotate(45deg);
  transition: transform 0.2s ease;

  &.expanded {
    transform: rotate(-135deg);
  }
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

.timeline-item--new-date {
  margin-top: 0.4rem;

  &:first-child {
    margin-top: 0;
  }
}

.date-col {
  position: relative;
  text-align: right;
  font-size: 0.24rem;
  min-height: 1rem;
  padding-right: 0.1rem;

  &::after {
    content: '';
    position: absolute;
    right: -0.06rem;
    top: 0.3rem;
    width: 0.02rem;
    bottom: -0.3rem;
    background: rgba(255, 255, 255, 0.42);
  }

  &.date-col--continued {
    .dot {
      top: 0.05rem;
    }

    &::after {
      top: 0.16rem;
    }
  }

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

  &.flow-head--no-divider {
    border-bottom: 0;
    padding-bottom: 0;
  }

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
    margin-top: 0.26rem;
    text-align: right;
  }
}

.right-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.14rem;
}

.record-toggle {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.82);
  display: flex;
  align-items: center;
  gap: 0.08rem;
  font-size: 0.24rem;
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
  color: #ff132b;
  font-weight: 700;

  &.positive {
    color: #78e490;
  }
}
</style>
