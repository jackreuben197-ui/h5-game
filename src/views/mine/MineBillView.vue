<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { postUserBillApi, postUserDiamondsWalletApi, postUserWalletApi } from '@/api/user'
import type {
  UserBillRecord,
  UserBillRoom_info,
  UserBillWallet,
  UserDiamondsWalletData,
  UserWalletWallet,
} from '@/api/models/user'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconUc from '@/assets/icons/icon_chips.png'
import iconCredit from '@/assets/icons/icon_credit_chip.png'
import { formatUC } from '@/utils/roomVisibility'
import { getLocale, t } from '@/i18n'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'
import { resolveOpCodeText } from '@/utils/transText'
import { useUserInfoStore } from '@/stores/userInfo'
import { useGameStore } from '@/stores/game'
import { userCache } from '@/utils/userCache'
import { USER_STORE_BILL_DATA } from '@/utils/indexedDB'
import { formatDateTime } from '@/utils/time'

const userInfoStore = useUserInfoStore()
const gameStore = useGameStore()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => '我的账单')

const tabGoldTypes = [
  { label: '联盟币', value: 1 },
  { label: 'Club计分牌', value: 2 },
  { label: '朋友桌计分牌', value: 3 },
  { label: '钻石', value: 4 },
] as const

const activeTab = ref(1)
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
  isDateLastData: boolean
  name: string
  club: string
  inAmount: string
  outAmount: string
  canExpand: boolean
  diamondChange: number
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
const diamondProfit = ref<UserDiamondsWalletData>({
  all_profit: 0,
  today_profit: 0,
  yestoday_profit: 0,
})

const billRequestByTab: Record<number, { gold_type: number; origin_type?: number }> = {
  1: { gold_type: 1 },
  2: { gold_type: 3, origin_type: 3 },
  3: { gold_type: 3, origin_type: 4 },
  4: { gold_type: 4 },
}

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatAmount(value: unknown): string {
  if (activeTab.value === 4) {
    return toSafeNumber(value).toLocaleString('en-US')
  }
  return formatUC(toSafeNumber(value))
}

function formatFlowAmount(value: unknown): string {
  if (activeTab.value === 4) {
    return toSafeNumber(value).toLocaleString('en-US')
  }
  return Math.abs(toSafeNumber(Number(value) / 100)).toLocaleString('en-US')
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
const formatDate = (date: string | undefined) => formatDateTime(date, 'DD/MM/YYYY HH:mm')

function mapBillRecord(row: UserBillRecord): BillRecordItem {
  const changeValue = toSafeNumber(row.gold_change) / (row.gold_type != 4 ? 100 : 1)
  const opCodeName = resolveOpCodeText(row.op_code)

  return {
    name: opCodeName || '账单变动',
    time: formatDate(row.create_time),
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
  const club = row.room_info && row.room_info.club_name ? row.room_info.club_name : row.club_name
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
  const isDiamondTab = activeTab.value === 4
  const isMtt = isMttCard(row, [cardName, fallbackName])
  const canExpand = !isDiamondTab && !isMtt && hasBringInAndOut && finalRecords.length > 0

  return {
    id: String(row.src_room_id || row.src_match_id),
    day: timeInfo.day,
    month: timeInfo.month,
    dateKey: timeInfo.dateKey,
    showDate: true,
    isDateLastData: false,
    name: cardName,
    club: club || '',
    inAmount: formatFlowAmount(inAmount),
    outAmount: formatFlowAmount(outAmount),
    diamondChange: row.gold_change || 0,
    canExpand,
    records: finalRecords,
  }
}

function mapWalletList(wallet: UserWalletWallet[] | undefined): WalletDetailItem[] {
  const list = Array.isArray(wallet) ? wallet : []
  return list.map((item, index) => {
    const clubName = String(item.club_name ?? '').trim() || `俱乐部${index + 1}`
    return {
      key: `${clubName}-${index}`,
      clubName,
      amount: formatAmount(item.gold),
    }
  })
}

// 对齐 Unity UIMineBillComponent.RefreshTotalBillUC / RefreshTotalBillClubScore：
// tab 1/2 顶部"总额度"与"明细"全部来自 /user/my_wallets，而不是汇总 clubList。
async function fetchWallet(
  goldType: number,
): Promise<{ amount: number; details: WalletDetailItem[] } | null> {
  try {
    const res = await postUserWalletApi({ gold_type: goldType, origin_type: 0 })
    if (res.code !== 0 || !res.data) {
      return null
    }
    return {
      amount: toSafeNumber(res.data.amount),
      details: mapWalletList(res.data.wallet),
    }
  } catch {
    return null
  }
}

const showWalletDetailButton = computed(() => {
  if (activeTab.value === 1 || activeTab.value === 2) {
    return walletDetails.value.length > 0
  }
  return activeTab.value == 4
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
  return cards.map((card, index) => {
    const prevCard = cards[index - 1]
    const nextCard = cards[index + 1]
    return {
      ...card,
      showDate: card.dateKey !== prevCard?.dateKey,
      isDateLastData: card.dateKey !== nextCard?.dateKey,
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

async function fetchDiamondsWallet(): Promise<boolean> {
  try {
    const res = await postUserDiamondsWalletApi({})
    if (res.code !== 0 || !res.data) {
      return false
    }
    diamondProfit.value = res.data
    return true
  } catch {
    return false
  }
}

// ── 缓存（IndexedDB bill_data） ────────────────────────────────────────────────
// 参考 MineClubDataView 的 careerKey 设计：库按 loginUserId 分用户，
// store 用 USER_STORE_BILL_DATA，key = `${clubId}-${tab}`。
interface BillCachePayload {
  flowCards: BillCardItem[]
  walletDetails: WalletDetailItem[]
  totalAmount: number
  diamondProfit: UserDiamondsWalletData
  hasMore: boolean
  pageOffset: number
}

function billCache() {
  return userCache(String(gameStore.loginUserId ?? '').trim())
}

function billCacheKey(tab: number): string {
  const clubId = userInfoStore.currentClub?.club_id ?? 0
  return `${clubId}-${tab}`
}

async function readBillCache(tab: number): Promise<BillCachePayload | null> {
  const uid = String(gameStore.loginUserId ?? '').trim()
  if (!uid) return null
  return billCache().get<BillCachePayload>(USER_STORE_BILL_DATA, billCacheKey(tab))
}

// JSON 深克隆解开 Vue 的 reactive Proxy，避免 WebView 把 Proxy 当成
// 不可序列化对象、让 IndexedDB.put 静默失败。
function plainClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function writeBillCache(tab: number): void {
  const uid = String(gameStore.loginUserId ?? '').trim()
  if (!uid) return
  const payload: BillCachePayload = {
    flowCards: plainClone(flowCards.value),
    walletDetails: plainClone(walletDetails.value),
    totalAmount: totalAmount.value,
    diamondProfit: plainClone(diamondProfit.value),
    hasMore: hasMore.value,
    pageOffset: pageOffset.value,
  }
  void billCache().put(USER_STORE_BILL_DATA, billCacheKey(tab), payload)
}

function applyCacheToState(payload: BillCachePayload): void {
  flowCards.value = payload.flowCards
  walletDetails.value = payload.walletDetails
  totalAmount.value = payload.totalAmount
  diamondProfit.value = payload.diamondProfit
  hasMore.value = payload.hasMore
  pageOffset.value = payload.pageOffset
}

// silent=true 时不展示 loading、失败时不清空，用于"缓存优先 + 静默刷新"。
async function fetchBillData(reset = true, silent = false): Promise<void> {
  const tab = activeTab.value
  if (reset && !silent) {
    loading.value = true
    walletDetailExpanded.value = false
    expandedCardIds.value = []
    hasMore.value = true
    pageOffset.value = 0
    flowCards.value = []
    walletDetails.value = []
    totalAmount.value = 0
    diamondProfit.value = { all_profit: 0, today_profit: 0, yestoday_profit: 0 }
  } else if (!reset) {
    loadingMore.value = true
  }

  const payload = {
    ...billRequestByTab[tab],
    limit: PAGE_LIMIT,
    offset: reset ? 0 : pageOffset.value,
    order_type: 2,
  }

  const walletGold = tab === 1 || tab === 2 ? billRequestByTab[tab].gold_type : 0
  const walletPromise = reset
    ? tab === 4
      ? fetchDiamondsWallet()
      : walletGold > 0
      ? fetchWallet(walletGold)
      : Promise.resolve(null)
    : Promise.resolve(null)

  try {
    const billRes = await postUserBillApi(payload)
    if (billRes.code !== 0) {
      throw new Error(typeof billRes.msg === 'string' ? billRes.msg : '加载账单失败')
    }

    const rows = extractList(billRes.data?.list) as UserBillWallet[]
    const mapped = rows.map((row, index) => mapBillCard(row, index))

    // tab 在请求期间被切换了，丢弃结果。
    if (tab !== activeTab.value) {
      return
    }

    if (reset) {
      flowCards.value = applyDateVisibility(mapped)
      pageOffset.value = rows.length
    } else {
      flowCards.value = applyDateVisibility([...flowCards.value, ...mapped])
      pageOffset.value += rows.length
    }
    hasMore.value = rows.length >= PAGE_LIMIT

    if (reset) {
      const walletResult = await walletPromise
      if (tab !== activeTab.value) return
      if (tab === 4) {
        totalAmount.value = toSafeNumber(diamondProfit.value.diamonds_wallet?.diamonds)
      } else if (walletGold > 0) {
        const w = walletResult as { amount: number; details: WalletDetailItem[] } | null
        if (w) {
          totalAmount.value = w.amount
          walletDetails.value = w.details
        }
      } else {
        totalAmount.value = 0
        walletDetails.value = []
      }
      writeBillCache(tab)
    }
  } catch (error) {
    if (reset && !silent) {
      flowCards.value = []
      walletDetails.value = []
      totalAmount.value = 0
      pageOffset.value = 0
      hasMore.value = false
    }
    if (!silent) {
      const message = error instanceof Error ? error.message : '加载账单失败'
      showFailToast(message)
    }
  } finally {
    if (reset && !silent) {
      loading.value = false
    }
    if (!reset) {
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

// 缓存优先：先渲染本地缓存，再静默刷新接口、更新缓存。
async function loadTab(tab: number): Promise<void> {
  walletDetailExpanded.value = false
  expandedCardIds.value = []
  const cached = await readBillCache(tab)
  if (tab !== activeTab.value) {
    return
  }
  if (cached) {
    // 缓存命中时强制关掉 loading（防止上一次未完成的 fetch 残留 spinner）。
    loading.value = false
    applyCacheToState(cached)
    void fetchBillData(true, true)
  } else {
    await fetchBillData(true, false)
  }
}

function selectTab(tab: number): void {
  if (activeTab.value === tab) {
    return
  }
  activeTab.value = tab
  void loadTab(tab)
}

onMounted(() => {
  void loadTab(activeTab.value)
})
</script>

<template>
  <div
    ref="pageContainerRef"
    class="page-shell mine-glass-page bill-page"
    :style="backgroundStyle"
    @scroll.passive="handlePageScroll"
  >
    <HeaderBack :title="title" extra-padding />

    <div class="content-wrap">
      <p class="hint">只支持查询最近三个月数据</p>

      <div class="bill-tabs">
        <button
          v-for="item in tabGoldTypes"
          :key="item.value"
          type="button"
          :class="['tab', { active: activeTab === item.value }]"
          @click="selectTab(item.value)"
        >
          {{ item.label }}
        </button>
      </div>

      <section v-if="activeTab !== 3" class="glass-card total-card">
        <div v-if="activeTab === 1" class="label">联盟币总金额</div>
        <div v-else-if="activeTab === 2" class="label">俱乐部记分牌总额度</div>
        <div v-else-if="activeTab === 4" class="label">钻石余额</div>
        <div class="amount-row">
          <img v-if="activeTab === 1" :src="iconUc" alt="chip" />
          <img v-else-if="activeTab === 2" :src="iconCredit" alt="chip" />
          <img v-else :src="iconDiamond" alt="diamond" />
          <strong>{{ formatAmount(totalAmount) }}</strong>
        </div>
        <div v-if="activeTab == 4" class="diamond-income">
          今日收益：{{ formatAmount(diamondProfit.today_profit) }}
        </div>
        <div
          v-if="walletDetailExpanded"
          class="wallet-detail-list"
          :class="{ 'wallet-detail-list-diamond': activeTab == 4 }"
        >
          <template v-if="activeTab !== 4">
            <div v-for="item in walletDetails" :key="item.key" class="wallet-detail-row">
              <span class="club">{{ item.clubName }}</span>
              <span class="value">{{ item.amount }}</span>
            </div>
          </template>
          <div v-else>
            <div class="diamond-detail-title">被查看手牌收益</div>
            <div class="diamond-detail-item">
              <span class="diamond-detail-label">累积收益</span>
              <span>
                {{ formatAmount(diamondProfit.all_profit) }}
                <img :src="iconDiamond" alt="diamond" />
              </span>
            </div>
            <div class="diamond-detail-item">
              <span class="diamond-detail-label">昨日收益</span>
              <span>
                {{ formatAmount(diamondProfit.yestoday_profit) }}
                <img :src="iconDiamond" alt="diamond" />
              </span>
            </div>
          </div>
        </div>
        <div v-if="!walletDetailExpanded" class="divided"></div>
        <button
          v-if="showWalletDetailButton"
          class="detail-btn"
          type="button"
          @click="toggleWalletDetails"
        >
          {{ walletDetailExpanded ? '收起' : '查看明细' }}
          <van-icon class="arrow" :class="{ expanded: walletDetailExpanded }" name="arrow-down" />
        </button>
      </section>

      <section class="timeline" :class="{ 'timeline--friend': activeTab == 3 }">
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!flowCards.length" class="list-status">暂无账单记录</p>
        <article
          v-for="card in flowCards"
          :key="card.id"
          class="timeline-item"
          :class="{
            'timeline-item--top': card.showDate && flowCards.length > 1,
          }"
        >
          <div
            :class="[
              'date-col',
              {
                'date-col--continued': !card.showDate,
                'date-col--bottom': card.isDateLastData,
              },
            ]"
          >
            <div v-if="card.showDate" class="date">{{ card.day }}</div>
            <div v-if="card.showDate" class="month">{{ card.month }}</div>
            <img v-if="card.showDate" src="@/assets/icons/icon_time.png" class="date-icon" alt="" />
          </div>

          <div v-if="activeTab != 4" class="glass-card flow-card">
            <div class="flow-head">
              <div>
                <div class="title">
                  {{ card.name }}
                  <span>(ID:{{ card.id }})</span>
                </div>
                <div class="sub">{{ card.club }}</div>
                <div class="sub">总带入:{{ card.inAmount }}</div>
              </div>
              <div class="right-box">
                <van-icon
                  class="arrow"
                  :class="{ expanded: isCardExpanded(card.id) }"
                  name="arrow-down"
                  @click="toggleCardExpanded(card.id)"
                />
                <div class="sub right" :class="{ 'no-club': card.club == '' }">
                  总带出: {{ card.outAmount }}
                </div>
              </div>
            </div>
            <div v-if="isCardExpanded(card.id)" class="divided club-divided"></div>
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
          <div v-else class="glass-card flow-card diamond-card">
            <!-- {{ card }} -->
            <div class="flow-head">
              <div>
                <div class="title-item">
                  <span class="title">
                    {{ card.records[0].name }}
                  </span>
                  <div :class="['money', { positive: card.diamondChange > 0 }]">
                    {{ card.diamondChange }}
                  </div>
                </div>
                <div class="sub-item">
                  <span class="left">{{ card.name }}(ID:{{ card.id }})</span>
                  <span class="right">{{ formatDate(card.records[0].time) }}</span>
                </div>
              </div>
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
  padding: 0 0 0.8rem;
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
  margin: 0rem 0 0;
  font-size: 0.304rem;
  opacity: 0.5;
}

.bill-tabs {
  margin-top: 0.16rem;
  display: flex;
  padding: 0 0.2rem;
  justify-content: space-between;
  overflow-x: auto;
}

.tab {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.37rem;
  padding: 0.1rem 0 0rem;
  white-space: nowrap;

  &.active {
    color: #fff;
    border-bottom: 0.03rem solid rgba(255, 255, 255, 0.9);
  }
}

.glass-card {
  border-radius: 0.7rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.total-card {
  margin-top: 0.5rem;
  padding: 0.5rem 0.5rem 0.3rem;

  .label {
    font-size: 0.3rem;
    opacity: 0.5;
  }

  .amount-row {
    margin-top: 0.08rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;

    img {
      width: 0.65rem;
    }

    strong {
      font-size: 0.6rem;
      line-height: 1;
    }
  }
}

.detail-btn {
  margin-top: 0.05rem;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border: 0;
  background: transparent;
  color: #f3f3f3;
  font-size: 0.28rem;
  padding-top: 0.3rem;
}
.divided {
  margin-top: 0.32rem;
  border-top: 1px solid rgba(163, 163, 163, 0.2);
}
.club-divided {
  margin-top: 0.1rem;
  border-top: 1px solid rgba($color: #ffffff, $alpha: 0.4);
}
.diamond-income {
  font-size: 0.386rem;
  line-height: 0.7rem;
}

.wallet-detail-list {
  margin-top: 0.35rem;
  border-radius: 0.372rem;
  background: rgba($color: #000000, $alpha: 0.2);
  padding: 0.35rem 0.43rem 0.28rem;
}
.wallet-detail-list-diamond {
  margin-top: 0.24rem;
  padding-bottom: 0.35rem;
}
.diamond-detail-title {
  margin-top: 0.08rem;
  font-size: 0.27rem;
  text-align: center;
}
.diamond-detail-item {
  display: flex;
  justify-content: space-between;
  margin-top: 0.2rem;
  span {
    font-size: 0.32rem;
    font-weight: 700;
  }
  .diamond-detail-label {
    font-weight: 400;
  }
  img {
    margin-left: 0.05rem;
    width: 0.32rem;
    height: 0.24rem;
  }
}

.wallet-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.09rem 0;
  font-size: 0.26rem;

  .value {
    font-weight: 700;
    font-size: 0.32rem;
  }
}

.arrow {
  transform: rotate(0deg);
  transition: transform 0.2s ease;
  &.expanded {
    transform: rotate(180deg);
  }
}

.timeline {
  display: flex;
  flex-direction: column;
  // gap: 0.26rem;
}
.timeline--friend {
  margin-top: 0.6rem;
}

.list-status {
  text-align: center;
  font-size: 0.26rem;
  opacity: 0.76;
  padding: 0.24rem 0;
}

.timeline-item {
  display: grid;
  grid-template-columns: 1.2rem 1fr;
  gap: 0.18rem;
  margin-bottom: 0.16rem;
}
.timeline-item--top {
  margin-top: 0.6rem;
}

.date-col {
  position: relative;
  text-align: right;
  font-size: 0.24rem;
  min-height: 1rem;
  width: 0.9rem;
  padding-right: 0.3rem;
  // border: 1px solid red;

  &::after {
    content: '';
    position: absolute;
    right: -0rem;
    top: 0.4rem;
    width: 0.02rem;
    bottom: -0.3rem;
    background: rgba(255, 255, 255, 1);
  }
  &.date-col--continued::after {
    top: 0rem;
  }
  &.date-col--continued {
    .date-icon {
      top: 0.05rem;
    }
  }
  &.date-col--bottom::after {
    bottom: 0rem;
  }
  .date,
  .month {
    font-size: 0.3rem;
    line-height: 0.2rem;
    margin-bottom: 0.1rem;
  }

  .date-icon {
    position: absolute;
    right: -0.2rem;
    top: 0rem;
    width: 0.267rem;
    height: 0.267rem;
    border-radius: 50%;
  }
}

.flow-card {
  padding: 0.32rem 0.4rem;
}

.flow-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.16rem;
  padding-bottom: 0.16rem;

  .title {
    font-size: 0.384rem;
    line-height: 0.6rem;
    span {
      font-size: 0.27rem;
      opacity: 0.94;
    }

    small {
      opacity: 0.8;
      font-size: 0.25rem;
    }
  }

  .sub {
    font-size: 0.306rem;
    opacity: 0.7;
  }

  .right {
    white-space: nowrap;
    margin-top: 0.6rem;
    text-align: right;
  }
  .no-club {
    margin-top: 0.1rem;
  }
}

.right-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.14rem;
}
.diamond-card {
  .flow-head {
    display: block;
    width: 100%;
  }
  .title {
    margin-bottom: 0.22rem;
  }
  .title-item,
  .sub-item {
    display: flex;
    width: 100%;
    justify-content: space-between;
  }
  .sub-item {
    opacity: 0.7;
  }
  .left {
    font-size: 0.279rem;
  }
  .right {
    margin-top: 0;
    font-size: 0.304rem;
  }
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
  padding: 0.3rem 0;
  border-bottom: 0.02rem solid rgba(249, 249, 249, 0.18);

  &:last-child {
    border-bottom: 0;
  }

  .name {
    font-size: 0.384rem;
  }

  .time {
    font-size: 0.306rem;
    opacity: 0.7;
  }
}

.money {
  font-size: 0.33rem;
  color: #ff132b;
  font-weight: 700;

  &.positive {
    color: #05e7ae;
  }
}
</style>
