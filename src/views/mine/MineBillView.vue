<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.webp'
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
import iconChipGreen from '@/assets/icons/icon_chip_green.png'
import { formatUC } from '@/utils/roomVisibility'
import { getLocale, t } from '@/i18n'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'
import { resolveBillOpCodeText, resolveBillTitle } from '@/utils/transText'
import { useUserInfoStore } from '@/stores/userInfo'
import { useGameStore } from '@/stores/game'
import { userCache } from '@/utils/userCache'
import { USER_STORE_BILL_DATA } from '@/utils/indexedDB'
import { formatDateTime } from '@/utils/time'

const userInfoStore = useUserInfoStore()
const gameStore = useGameStore()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--mine-bill-bg-dark': `url(${mainBgUrl})`,
  '--mine-bill-bg-light': `url(${mainBgLightUrl})`,
}))

const title = computed(() => t('UIMine_Bill'))

const tabGoldTypes = [
  { label: t('UC'), value: 1 },
  { label: t('UIMine_ClubChips'), value: 2 },
  { label: t('UIClub_Table'), value: 3 },
  { label: t('UIMine_VIP_diamond'), value: 4 },
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
  key: string
  id: string
  // 当前卡片所属 tab，模板里用来决定行 4 左侧 icon 与是否走钻石分支。
  tab: number
  // 左侧时间线进度条：日/月分组显示，跨日才高亮，同日只画连接线。
  day: string
  month: string
  dateKey: string
  showDate: boolean
  isDateLastData: boolean
  // 行 1：标题（非钻石含 src_type 前缀 + 房间名；钻石只取 op_code 文案）+ 内联 ID（仅非钻石）。
  titleText: string
  idInlineText: string
  // 行 1 右：变动金额（非可展开卡片才展示）。
  changeAmountText: string
  changeAmountPositive: boolean
  // 行 3 右 / 行 4 右复用。
  club: string
  time: string
  // 钻石专用：行 3 左 = 牌局名，行 4 左 = "ID:xxx"。
  diamondTableName: string
  diamondTableIdText: string
  // UC/记分牌非可展开：行 4 左 = 变动后余额（gold_after）。
  balanceAfterShown: boolean
  balanceAfterText: string
  // 可展开（牌桌带入带出）：行 4 左 = 总带入，右 = 总带出，展开后是 records 子列表。
  canExpand: boolean
  inAmount: string
  outAmount: string
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
  return Math.abs(toSafeNumber(Number(value || 0) / 100)).toLocaleString('en-US')
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
  // room_info.records 内嵌的子记录沿用同一份解析逻辑（含 CBBI/CBBO → BRINGIN/BRINGOUT 归一化）。
  const opCodeName = resolveBillOpCodeText({ opCode: row.op_code }, activeTab.value)

  return {
    name: opCodeName || t('UIClub_Text35'),
    time: formatDate(row.create_time),
    amount: formatSigned(changeValue),
    positive: changeValue > 0,
  }
}

function mapBillCard(row: UserBillWallet, index: number): BillCardItem {
  const tab = activeTab.value
  const isDiamondTab = tab === 4
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
  const roomName = localizedNameByMultiObj || localizedNameByKey || rawName
  const titleCtx = {
    opCode: row.op_code,
    goldType: row.gold_type,
    srcType: row.src_type as number | undefined,
    roomName,
    roomInfo: {
      originType: row.room_info?.origin_type,
      shareTable: row.room_info?.share_table,
      gameType: row.room_info?.game_type as number | undefined,
      pokerType: row.room_info?.poker_type,
    },
  }
  const opCodeLabel = resolveBillOpCodeText(titleCtx, tab)
  const fullTitle = resolveBillTitle(titleCtx, tab)
  const fallbackName = opCodeLabel || roomName || rawName || ''

  const idNumber = row.src_room_id || row.src_match_id || 0
  const idValue = String(idNumber)
  const hasId = idNumber > 0

  // 钻石卡片：标题位只放 op_code 文案，牌局名/ID 落到行 3 左 / 行 4 左。
  // 其它 tab：沿用 Unity _titleSB（op_code + src_type 前缀 + 房间名）+ (ID:xxx) 内联。
  const titleText = isDiamondTab
    ? opCodeLabel || fallbackName
    : fullTitle || roomName || fallbackName
  const idInlineText = !isDiamondTab && hasId && titleText ? `(ID:${idValue})` : ''
  const diamondTableName = isDiamondTab ? roomName || rawName || '' : ''
  const diamondTableIdText = isDiamondTab && hasId ? `ID:${idValue}` : ''

  const club = (row.room_info && row.room_info.club_name) || row.club_name || ''

  // 变动金额：UC/记分牌按 Unity SetFallOrRiseLong 除 100；钻石按 SetFallOrRise 不除。
  const goldChangeRaw = toSafeNumber(row.gold_change)
  const goldChangeValue = isDiamondTab ? goldChangeRaw : goldChangeRaw / 100
  const changeAmountText = formatSigned(goldChangeValue)
  const changeAmountPositive = goldChangeValue > 0

  // 变动后余额：钻石不展示；其它 tab 仅在 gold_after > 0 时展示，icon 走 tab 决定。
  const goldAfterRaw = toSafeNumber(row.gold_after)
  const balanceAfterShown = !isDiamondTab && goldAfterRaw > 0
  const balanceAfterText = balanceAfterShown ? formatFlowAmount(row.gold_after) : ''

  const bringInAmount = toSafeNumber(roomInfo?.bring_in_amount)
  const bringOutAmount = toSafeNumber(roomInfo?.bring_out_amount)
  const hasBringInAndOut = bringInAmount > 0 && bringOutAmount > 0
  const isMtt = isMttCard(row, [titleText, fallbackName])
  const canExpand = !isDiamondTab && !isMtt && hasBringInAndOut && records.length > 0

  const timeRaw = pickRecordValue(row as Record<string, unknown>, [
    'create_time_str',
    'create_time',
    'time',
    'created_at',
  ])
  const timeInfo = resolveDateParts(timeRaw)

  return {
    key: `${idNumber}_${row.create_time || index}`,
    id: idValue,
    tab,
    day: timeInfo.day,
    month: timeInfo.month,
    dateKey: timeInfo.dateKey,
    showDate: true,
    isDateLastData: false,
    titleText,
    idInlineText,
    changeAmountText,
    changeAmountPositive,
    club,
    time: formatDate(row.create_time || ''),
    diamondTableName,
    diamondTableIdText,
    balanceAfterShown,
    balanceAfterText,
    canExpand,
    inAmount: formatFlowAmount(roomInfo?.bring_in_amount),
    outAmount: formatFlowAmount(roomInfo?.bring_out_amount),
    records,
  }
}

function mapWalletList(wallet: UserWalletWallet[] | undefined): WalletDetailItem[] {
  const list = Array.isArray(wallet) ? wallet : []
  return list.map((item, index) => {
    const clubName =
      String(item.club_name ?? '').trim() || t('UILobby_Menu_menu_btn_club') + (index + 1)
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

// 变动后余额行的 icon：UC=icon_chips、记分牌(2/3)=icon_credit_chip、钻石=icon_diamond（钻石实际不展示余额，留兜底）。
function balanceIconFor(tab: number): string {
  if (tab === 1) return iconUc
  if (tab === 4) return iconDiamond
  return iconCredit
}

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
  // -v2：行结构变更（去 day/month/dateKey，新增 titleText/diamondTable* 等），需失效旧缓存。
  return `${clubId}-${tab}-v2`
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
      throw new Error(typeof billRes.msg === 'string' ? billRes.msg : t('UIClub_LoadFail3'))
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
      const message = error instanceof Error ? error.message : t('UIClub_LoadFail3')
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
      <p class="hint">{{ t('UIGuildtThreeMonthDataTip') }}</p>

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
        <div v-if="activeTab === 1" class="label">{{ t('UC') }}{{ t('UIClub_Text33') }}</div>
        <div v-else-if="activeTab === 2" class="label">{{ t('UIMineAllClub') }}</div>
        <div v-else-if="activeTab === 4" class="label">{{ t('UIMineAllDiamond') }}</div>
        <div class="amount-row">
          <img v-if="activeTab === 1" :src="iconUc" alt="chip" />
          <img v-else-if="activeTab === 2" :src="iconChipGreen" alt="chip" />
          <img v-else :src="iconDiamond" alt="diamond" />
          <strong>{{ formatAmount(totalAmount) }}</strong>
        </div>
        <div v-if="activeTab == 4" class="diamond-income">
          {{ t('UIBill_payLookHandCardTodayWin') }}：{{ formatAmount(diamondProfit.today_profit) }}
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
            <div class="diamond-detail-title">{{ t('UIBill_payLookHandCardTitle') }}</div>
            <div class="diamond-detail-item">
              <span class="diamond-detail-label">{{ t('UIClub_Income6') }}</span>
              <span>
                {{ formatAmount(diamondProfit.all_profit) }}
                <img :src="iconDiamond" alt="diamond" />
              </span>
            </div>
            <div class="diamond-detail-item">
              <span class="diamond-detail-label">{{ t('UIBill_payLookHandCardTtdWin') }}</span>
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
          {{ walletDetailExpanded ? t('UIMinePutAway') : t('UIClub_Text110') }}
          <van-icon class="arrow" :class="{ expanded: walletDetailExpanded }" name="arrow-down" />
        </button>
      </section>

      <section class="timeline" :class="{ 'timeline--friend': activeTab == 3 }">
        <p v-if="loading" class="list-status">{{ t('SuperView2') }}...</p>
        <p v-else-if="!flowCards.length" class="list-status">{{ t('UIClub_NoRecord5') }}</p>
        <article
          v-for="card in flowCards"
          :key="card.key"
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

          <div class="glass-card flow-card">
            <!-- 行 1：标题 + (ID 内联，仅非钻石) + 变动金额（仅非可展开）/ 展开箭头（仅可展开） -->
            <div class="bill-row bill-row-title">
              <div class="title-cell">
                <span class="name">{{ card.titleText }}</span>
                <span v-if="card.idInlineText" class="id-inline">{{ card.idInlineText }}</span>
              </div>
              <div class="title-right">
                <span
                  v-if="!card.canExpand"
                  :class="['money', { positive: card.changeAmountPositive }]"
                >
                  {{ card.changeAmountText }}
                </span>
                <van-icon
                  v-if="card.canExpand"
                  class="arrow"
                  :class="{ expanded: isCardExpanded(card.id) }"
                  name="arrow-down"
                  @click="toggleCardExpanded(card.id)"
                />
              </div>
            </div>

            <!-- 行 3：左 = (钻石)牌局名 / (非钻石&有变动后余额)文案 / (可展开)空白；右 = 俱乐部名 -->
            <div class="bill-row bill-row-3">
              <span class="row-left">
                <template v-if="card.canExpand"></template>
                <template v-else-if="card.tab === 4">{{ card.diamondTableName }}</template>
                <template v-else-if="card.balanceAfterShown">
                  {{ t('UIMineChangeBalance') }}
                </template>
              </span>
              <span class="row-right">{{ card.club }}</span>
            </div>

            <!-- 行 4：左 = (钻石)牌局ID / (非钻石&有变动后余额)余额值+icon / (可展开)总带入；右 = (可展开)总带出 / 日期 -->
            <div class="bill-row bill-row-4">
              <span class="row-left">
                <template v-if="card.canExpand">{{ t('UITexasGameEnding_allBring') }}: {{ card.inAmount }}</template>
                <template v-else-if="card.tab === 4">{{ card.diamondTableIdText }}</template>
                <template v-else-if="card.balanceAfterShown">
                  <img :src="balanceIconFor(card.tab)" alt="" class="balance-icon" />
                  <span>{{ card.balanceAfterText }}</span>
                </template>
              </span>
              <span class="row-right">
                <template v-if="card.canExpand">{{ t('UIMineAllBringOut') }}: {{ card.outAmount }}</template>
                <template v-else>{{ card.time }}</template>
              </span>
            </div>

            <template v-if="card.canExpand && isCardExpanded(card.id)">
              <div class="divided club-divided"></div>
              <div
                v-for="row in card.records"
                :key="`${card.id}-${row.time}-${row.amount}`"
                class="flow-row"
              >
                <div>
                  <div class="name">{{ row.name }}</div>
                  <div class="time">{{ row.time }}</div>
                </div>
                <div :class="['money', { positive: row.positive }]">{{ row.amount }}</div>
              </div>
            </template>
          </div>
        </article>
        <p v-if="!loading && loadingMore" class="list-status">{{ t('UIClub_LoadMore2') }}...</p>
        <p v-else-if="!loading && flowCards.length && !hasMore" class="list-status">
          {{ t('UIClub_NoMoreRecord') }}
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.mine-glass-page {
  position: relative;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 0 0.8rem;
  color: #f3f3f3;
  background-color: var(--c-page);
  background-image: var(--mine-bill-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: #000;
    background-image: var(--mine-bill-bg-light);
  }
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

  @include theme-light {
    color: rgba(0, 0, 0, 0.7);

    &.active {
      color: var(--c-brand);
      border-bottom-color: var(--c-brand);
    }
  }
}

.glass-card {
  border-radius: 0.7rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);

  @include theme-light {
    border-color: transparent;
    background: #fff;
  }
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

  @include theme-light {
    color: #000;
  }
}
.divided {
  margin-top: 0.32rem;
  border-top: 1px solid rgba(163, 163, 163, 0.2);

  @include theme-light {
    border-top-color: rgba(0, 0, 0, 0.06);
  }
}
.club-divided {
  margin-top: 0.1rem;
  border-top: 1px solid rgba($color: #ffffff, $alpha: 0.4);

  @include theme-light {
    border-top-color: rgba(0, 0, 0, 0.06);
  }
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

  @include theme-light {
    background: rgba(0, 0, 0, 0.06);
  }
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

  &::after {
    content: '';
    position: absolute;
    right: -0rem;
    top: 0.4rem;
    width: 0.02rem;
    bottom: -0.3rem;
    background: rgba(255, 255, 255, 1);

    @include theme-light {
      background: rgba(0, 0, 0, 0.25);
    }
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
  padding: 0.28rem 0.4rem;
}

.bill-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.16rem;
}

// 行 3 / 4 高度固定，俱乐部名 / 变动后余额都不显示时也保持卡片节奏。
.bill-row-3,
.bill-row-4 {
  min-height: 0.45rem;
  font-size: 0.306rem;
  opacity: 0.85;
}
.bill-row-3 {
  margin-top: 0.1rem;
  font-size: 0.3rem;
  color: rgba($color: #ffffff, $alpha: 0.7);

  @include theme-light {
    color: rgba(0, 0, 0, 0.7);
  }
}
.bill-row-4 {
  margin-top: 0.06rem;
  font-size: 0.3rem;
  color: rgba($color: #ffffff, $alpha: 0.7);

  @include theme-light {
    color: rgba(0, 0, 0, 0.7);
  }
}

.bill-row-title {
  line-height: 0.6rem;
  min-height: 0.6rem;

  .title-cell {
    display: flex;
    align-items: baseline;
    gap: 0.1rem;
    min-width: 0;
    flex: 1;
  }
  .name {
    display: inline-block;
    max-width: 3.7rem;
    font-size: 0.32rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .id-inline {
    font-size: 0.27rem;
    opacity: 0.94;
    flex-shrink: 0;
  }
  .title-right {
    display: flex;
    align-items: center;
    gap: 0.18rem;
    flex-shrink: 0;
  }
}

.row-left {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row-right {
  white-space: nowrap;
  text-align: right;
  flex-shrink: 0;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.balance-icon {
  width: 0.3rem;
  height: 0.3rem;
  flex-shrink: 0;
}

.flow-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0;
  border-bottom: 0.02rem solid rgba(249, 249, 249, 0.18);

  @include theme-light {
    border-bottom-color: rgba(0, 0, 0, 0.06);
  }

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
  color: var(--c-loss);
  font-weight: 700;

  &.positive {
    color: var(--c-profit);
  }
}
</style>

<style lang="scss">
:root[data-theme='light'] .bill-page {
  --c-brand: #05c297;
  --c-brand-rgb: 5, 194, 151;
  --c-loss: #05c297;
  --c-profit: #e5384f;

  color: rgba(15, 8, 8, 0.85);
  background-color: #f3f4f6;
  background-image: var(--mine-bill-bg-light);

  .back-trigger,
  .back-icon {
    color: rgba(15, 8, 8, 0.85);
  }

  .title {
    text-shadow: none;
  }

  .tab {
    color: rgba(15, 8, 8, 0.7);

    &.active {
      color: #05c297;
      border-bottom-color: #05c297;
    }
  }

  .glass-card {
    background: rgba(255, 255, 255, 1);
    border-color: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .detail-btn {
    color: rgba(15, 8, 8, 0.85);
  }

  .divided,
  .club-divided {
    border-top-color: rgba(0, 0, 0, 0.08);
  }

  .wallet-detail-list {
    background: rgba(0, 0, 0, 0.06);
  }

  .date-col::after {
    background: rgba(0, 0, 0, 0.25);
  }

  .bill-row-3,
  .bill-row-4 {
    color: rgba(15, 8, 8, 0.7);
  }

  .flow-row {
    border-bottom-color: rgba(0, 0, 0, 0.08);
  }
}
</style>
