<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { showFailToast } from 'vant'
import { postMiscCombineApi } from '@/api/misc'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.webp'
import tableCardBgUrl from '@/assets/images/table_card_bg.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import CareerSvgIcon from '../../components/CareerSvgIcon.vue'
import RadarChart from '@/components/Chart/RadarChart.vue'
import RingChart from '@/components/Chart/RingChart.vue'
import PokerCard from '@/components/GameCard/PokerCard.vue'
import { GameTable, GameTableColumn } from '@/components/Table'
import type { SortOrder } from '@/components/Table'
import FilterTabbar from '@/components/Tabbar/FilterTabbar.vue'
import type { FilterTabOption } from '@/components/Tabbar/FilterTabbar.vue'
import { decodeCard, parseHandRecordCards, type CardItem } from '@/api/models/replayDisplay'
import { useUserInfoStore } from '@/stores/userInfo'
import { useGameStore } from '@/stores/game'
import { userCache } from '@/utils/userCache'
import { createKeyedRefresh } from '@/utils/keyedRefresh'
import { USER_STORE_CAREER } from '@/utils/indexedDB'
import { t } from '@/i18n'
import { useTheme } from '@/composables/useTheme'

const title = computed(() => t('adaptation10124'))

type MainTabKey = 'personal' | 'opponent' | 'allin' | 'deck'

type ProfitRow = {
  id: string
  name: string
  avatar?: string
  hands: number
  lose: number
  win: number
  profit: number
}

type DeckRow = {
  id: string
  cards: [CardItem, CardItem]
  winCount: number
  totalHands: number
  winRate: number
  profit: number
}

// 背景素材由 CSS 根据 data-theme 选择，切换主题时无需重建页面。
const backgroundStyle = computed(() => ({
  '--club-data-bg-dark': `url(${mainBgUrl})`,
  '--club-data-bg-light': `url(${mainBgLightUrl})`,
}))

const mainTabs: Array<{ key: MainTabKey; label: string }> = [
  { key: 'personal', label: t('UICareer_Person') },
  { key: 'opponent', label: t('UICareer_Rivol') },
  { key: 'allin', label: t('adaptation30074') },
  { key: 'deck', label: t('UICareer_Deck') },
]

const personalGameTabs = ['NLH', 'PLO', '6+']
const opponentPeriodTabs = ['week', 'month', 'history']

const personalGameTabOptions: FilterTabOption[] = personalGameTabs.map((t) => ({
  name: t,
  title: t,
}))
const OPPONENT_PERIOD_TAB_LABEL: Record<string, string> = {
  week: t('UICareer_PersonWeek'),
  month: t('UICareer_PersonMonth'),
  history: t('UICareer_PersonCareer'),
}
const opponentPeriodTabOptions: FilterTabOption[] = opponentPeriodTabs.map((t) => ({
  name: t,
  title: OPPONENT_PERIOD_TAB_LABEL[t] ?? t,
}))
const OPPONENT_PERIOD_LABEL: Record<string, string> = {
  week: t('UICareer_WeekCount'),
  month: t('UICareer_MonthCount'),
  history: t('UICareer_HistoryCount'),
}
const opponentPeriodLabel = computed(
  () => OPPONENT_PERIOD_LABEL[selectedOpponentPeriod.value] ?? '',
)
const allInModeTabs = ['NLH', 'PLO', '6+', 'AOF 6+', 'AOF NLH', 'AOF PLO']
const deckModeTabs = ['NLH', '6+', 'AOF NLH', 'AOF 6+']

const selectedMainTab = ref<MainTabKey>('personal')
const selectedPersonalGame = ref(personalGameTabs[0])
const selectedOpponentPeriod = ref(opponentPeriodTabs[0])
const selectedAllInMode = ref(allInModeTabs[0])
const selectedDeckMode = ref(deckModeTabs[0])
const loading = ref(false)
const userInfoStore = useUserInfoStore()
const gameStore = useGameStore()
const { isLight } = useTheme()

const personalRingMeta = [
  { key: 'vpip', label: t('UIClub_Mlistinfo_rRyW4JkW'), color: '#ff5b5b' },
  { key: 'wins', label: t('UITexasInfo_winrate'), color: '#3c6dff' },
  { key: 'prf', label: t('UIClub_Text38'), color: '#f7bb46' },
  { key: 'wtsd', label: t('UIClub_Text39'), color: '#ff2626' },
  { key: 'bet3', label: t('UIClub_Again2'), color: '#66b7ff' },
  { key: 'allinWins', label: t('adaptation10318'), color: '#20f2c2' },
] as const

const personalRings = ref(personalRingMeta.map((item) => ({ ...item, value: 0 })))
const personalBestHand = ref<(CardItem | null)[]>([])
const opponentRows = ref<ProfitRow[]>([])
const deckRows = ref<DeckRow[]>([])
const allInSummary = ref([
  { label: t('UICareer_totalWin'), value: '0', highlight: 'up' as const },
  { label: 'All in', value: '0' },
  { label: t('UIMine_RecordItemsNormal_3RCUa3w8'), value: '0' },
  { label: t('UICareer_HuoWin'), value: '0' },
  { label: t('UICareer_AllinLost'), value: '0' },
])
const allInRateRows = ref([
  { key: 'active', label: t('UICareer_Zhudong'), rate: 0, color: '#50a7ec' },
  { key: 'passive', label: t('UICareer_Beidong'), rate: 0, color: '#fa2b4b' },
  { key: 'ahead', label: t('UICareer_Lingxian'), rate: 0, color: '#109657' },
  { key: 'behind', label: t('UICareer_Luohou'), rate: 0, color: '#b519d8' },
])

const radarPoints = computed(() => ({
  top: allInRateRows.value.find((r) => r.key === 'active')?.rate ?? 0,
  right: allInRateRows.value.find((r) => r.key === 'behind')?.rate ?? 0,
  bottom: allInRateRows.value.find((r) => r.key === 'ahead')?.rate ?? 0,
  left: allInRateRows.value.find((r) => r.key === 'passive')?.rate ?? 0,
}))

const personalCache = new Map<string, typeof personalRings.value>()
const personalBestHandCache = new Map<string, (CardItem | null)[]>()
const allInCache = new Map<
  string,
  { summary: typeof allInSummary.value; rates: typeof allInRateRows.value }
>()
const deckCache = new Map<string, DeckRow[]>()

const personalHasData = computed(() => {
  if (loading.value) {
    return true
  }
  const cacheValue = personalCache.get(selectedPersonalGame.value)
  return !!cacheValue
})

const OPPONENT_PAGE_SIZE = 30
const opponentOrderAsc = ref(true)
const opponentLoadingMore = ref(false)
const opponentFinished = ref(false)
const opponentSortCache = new Map<string, { rows: ProfitRow[]; finished: boolean }>()
const deckSortProp = ref('')
const deckSortOrder = ref<SortOrder>('')

const sortedDeckRows = computed<Record<string, any>[]>(() => {
  if (!deckSortProp.value || !deckSortOrder.value) return deckRows.value
  const prop = deckSortProp.value
  return [...deckRows.value].sort((a, b) => {
    const aVal = Number(a[prop as keyof typeof a]) || 0
    const bVal = Number(b[prop as keyof typeof b]) || 0
    return deckSortOrder.value === 'asc' ? aVal - bVal : bVal - aVal
  })
})

function setMainTab(tab: MainTabKey): void {
  selectedMainTab.value = tab
}

function onDeckSort(col: { prop: string }, order: SortOrder): void {
  deckSortProp.value = col.prop
  deckSortOrder.value = order
}

function formatProfit(value: number): string {
  const absValue = Math.abs(value)
  return `${value >= 0 ? '+' : '-'}${absValue}`
}

function profitClass(value: number): string {
  return value >= 0 ? 'profit-up' : 'profit-down'
}

function toSafeNumber(value: unknown): number {
  if (typeof value === 'string') {
    const numericText = value.replace(/,/g, '').trim()
    const numeric = Number(numericText)
    return Number.isFinite(numeric) ? numeric : 0
  }
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function clampRate(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10))
}

function formatSigned(value: number): string {
  const abs = Math.abs(value).toLocaleString('en-US')
  if (value === 0) {
    return '0'
  }
  return value > 0 ? `+${abs}` : `-${abs}`
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

function withClubId<T extends Record<string, unknown>>(request: T): T {
  if (userInfoStore.currentClub?.club_id) {
    return {
      ...request,
      club_id: userInfoStore.currentClub.club_id,
    }
  }
  return request
}

function resolvePeriodRange(period: string): { start_time: number; end_time: number } {
  const endTime = nowSeconds()
  const daySeconds = 24 * 3600
  switch (period) {
    case 'week':
      return { start_time: endTime - 7 * daySeconds, end_time: endTime }
    case 'month':
      return { start_time: endTime - 30 * daySeconds, end_time: endTime }
    default:
      return { start_time: endTime - 90 * daySeconds, end_time: endTime }
  }
}

function resolvePersonalMode(mode: string): {
  game_types: number[]
  poker_types: number[]
  max_card_game_type: number
} {
  if (mode === 'PLO') {
    return { game_types: [1, 2, 3], poker_types: [0], max_card_game_type: 2 }
  }
  if (mode === '6+') {
    return { game_types: [0], poker_types: [2], max_card_game_type: 3 }
  }
  return { game_types: [0], poker_types: [0], max_card_game_type: 1 }
}

function resolveAllInMode(mode: string): {
  game_types: number[]
  poker_types: number[]
  aof_type: number
} {
  if (mode === 'PLO') {
    return { game_types: [1, 2, 3], poker_types: [0], aof_type: 2 }
  }
  if (mode === '6+') {
    return { game_types: [0], poker_types: [2], aof_type: 2 }
  }
  if (mode === 'AOF 6+') {
    return { game_types: [0], poker_types: [2], aof_type: 1 }
  }
  if (mode === 'AOF NLH') {
    return { game_types: [0], poker_types: [0], aof_type: 1 }
  }
  if (mode === 'AOF PLO') {
    return { game_types: [1, 2, 3], poker_types: [0], aof_type: 1 }
  }
  return { game_types: [0], poker_types: [0], aof_type: 2 }
}

function resolveDeckMode(mode: string): {
  game_types: number[]
  poker_types: number[]
  aof_type: number
} {
  if (mode === '6+') {
    return { game_types: [0], poker_types: [2], aof_type: 2 }
  }
  if (mode === 'AOF NLH') {
    return { game_types: [0], poker_types: [0], aof_type: 1 }
  }
  if (mode === 'AOF 6+') {
    return { game_types: [0], poker_types: [2], aof_type: 1 }
  }
  return { game_types: [0], poker_types: [0], aof_type: 2 }
}

const FACE_CARD_RANK: Record<string, string> = { '11': 'J', '12': 'Q', '13': 'K', '14': 'A' }
function toDeckRank(str: string): string {
  return FACE_CARD_RANK[str] || str
}

function parseDeckCards(value: unknown): [string, string] {
  if (typeof value !== 'string') {
    return ['--', '--']
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return ['--', '--']
  }
  const splitByDelimiter = trimmed.split(/[\s,|/]+/).filter(Boolean)
  if (splitByDelimiter.length >= 2) {
    return [splitByDelimiter[0], splitByDelimiter[1]]
  }
  if (trimmed.length >= 4) {
    return [trimmed.slice(0, 2), trimmed.slice(2, 4)]
  }
  return [trimmed, '--']
}

function setPersonalCache(mode: string, roomData: Record<string, unknown>): void {
  const metricMap: Record<string, number> = {
    vpip: clampRate(toSafeNumber(roomData.vpip)),
    wins: clampRate(toSafeNumber(roomData.wins)),
    prf: clampRate(toSafeNumber(roomData.prf)),
    wtsd: clampRate(toSafeNumber(roomData.wtsd)),
    bet3: clampRate(toSafeNumber(roomData.bet3)),
    allinWins: clampRate(toSafeNumber(roomData.allinWins)),
  }

  const rings = personalRingMeta.map((item) => ({
    ...item,
    value: metricMap[item.key] ?? 0,
  }))
  personalCache.set(mode, rings)

  const maxCardStr = typeof roomData.max_card_data === 'string' ? roomData.max_card_data : ''
  const cardNums = maxCardStr ? parseHandRecordCards(maxCardStr) : []
  const bestHand = Array.from({ length: 5 }, (_, i) => {
    const n = cardNums[i]
    return n != null && n > 0 ? decodeCard(n) : null
  })
  personalBestHandCache.set(mode, bestHand)

  void career().put(USER_STORE_CAREER, careerKey('personal', mode), { rings, bestHand })
}

function setAllInCache(mode: string, stats: Record<string, unknown>): void {
  const handCount = toSafeNumber(stats.hand_count)
  const winCount = toSafeNumber(stats.profit_count)
  const loseCount = toSafeNumber(stats.loss_count)
  const profit = toSafeNumber(stats.profit_total)

  const summary = [
    { label: t('UICareer_totalWin'), value: formatSigned(profit), highlight: 'up' as const },
    { label: 'All in', value: winCount.toLocaleString('en-US') },
    { label: t('UIMine_RecordItemsNormal_3RCUa3w8'), value: handCount.toLocaleString('en-US') },
    { label: t('UICareer_HuoWin'), value: winCount.toLocaleString('en-US') },
    { label: t('UICareer_AllinLost'), value: loseCount.toLocaleString('en-US') },
  ]

  const activeCount = toSafeNumber(stats.active_count)
  const passiveCount = toSafeNumber(stats.passive_count)
  const aheadCount = toSafeNumber(stats.ahead_count)
  const behindCount = toSafeNumber(stats.behind_count)
  const activeProfitCount = toSafeNumber(stats.active_profit_count)
  const passiveProfitCount = toSafeNumber(stats.passive_profit_count)
  const aheadProfitCount = toSafeNumber(stats.ahead_profit_count)
  const behindProfitCount = toSafeNumber(stats.behind_profit_count)

  const rates = [
    {
      key: 'active',
      label: t('UICareer_Zhudong'),
      rate: activeCount > 0 ? clampRate((activeProfitCount / activeCount) * 100) : 0,
      color: '#50a7ec',
    },
    {
      key: 'passive',
      label: t('UICareer_Beidong'),
      rate: passiveCount > 0 ? clampRate((passiveProfitCount / passiveCount) * 100) : 0,
      color: '#fa2b4b',
    },
    {
      key: 'ahead',
      label: t('UICareer_Lingxian'),
      rate: aheadCount > 0 ? clampRate((aheadProfitCount / aheadCount) * 100) : 0,
      color: '#109657',
    },
    {
      key: 'behind',
      label: t('UICareer_Luohou'),
      rate: behindCount > 0 ? clampRate((behindProfitCount / behindCount) * 100) : 0,
      color: '#b519d8',
    },
  ]
  allInCache.set(mode, { summary, rates })
  void career().put(USER_STORE_CAREER, careerKey('allin', mode), { summary, rates })
}

function setDeckCache(mode: string, records: unknown): void {
  const list = Array.isArray(records) ? records : []
  const rows = list.map((item, index) => {
    const row = typeof item === 'object' && item ? (item as Record<string, unknown>) : {}
    const [s1, s2] = parseDeckCards(row.hand_card_type)
    return {
      id: `${mode}-${index}`,
      cards: [
        { rank: toDeckRank(s1), suit: 's' as const },
        { rank: toDeckRank(s2), suit: 'h' as const },
      ] as [CardItem, CardItem],
      winCount: toSafeNumber(row.profit_count),
      totalHands: toSafeNumber(row.hand_count),
      winRate: clampRate(toSafeNumber(row.profit_ratio)),
      profit: Math.round(toSafeNumber(row.profit_total) / 100),
    }
  })
  deckCache.set(mode, rows)
  if (rows.length > 0) void career().put(USER_STORE_CAREER, careerKey('deck', mode), rows)
}

// ── IDB helpers ──────────────────────────────────────────────────────────────
// DB partition: gameStore.loginUserId (same key used across the whole app)
// Store: USER_STORE_CAREER (战绩/数据共用，由 type 段区分)
// Key pattern: `${clubId}_data_${tab}_${subKey}`
//   e.g. "456_data_deck_NLH"、"0_data_allin_NLH"、"0_data_opponent_week_1"
// 俱乐部 id 0 = 全部俱乐部；朋友桌生涯不进 data 这条线（friends 暂无数据子页）。

function careerKey(tab: string, subKey: string): string {
  const clubId = userInfoStore.currentClub?.club_id || 0
  return `${clubId}_data_${tab}_${subKey}`
}

// deck / opponent 两条数据流各自一个 refresher，getKey 写得更清晰。
// 命中缓存的静默刷新走 refresh()：立即触发，20s TTL 内同 key 跳过，同 key 已在飞则合并。
// cache miss 仍然 await + loading，不延迟。
const deckRefresher = createKeyedRefresh(
  () => careerKey('deck', selectedDeckMode.value),
  { freshTtl: 20_000 },
)
const opponentRefresher = createKeyedRefresh(
  () => careerKey('opponent', `${selectedOpponentPeriod.value}_${opponentOrderAsc.value ? 1 : 2}`),
  { freshTtl: 20_000 },
)

function setOpponentCache(cacheKey: string, rows: ProfitRow[], finished: boolean): void {
  const entry = { rows, finished }
  opponentSortCache.set(cacheKey, entry)
  void career().put(USER_STORE_CAREER, careerKey('opponent', cacheKey), entry)
}

function career() {
  return userCache(gameStore.loginUserId)
}

async function restoreAllFromIDB(): Promise<void> {
  const db = career()

  // deck
  await Promise.all(
    deckModeTabs.map(async (mode) => {
      const rows = await db.get<DeckRow[]>(USER_STORE_CAREER, careerKey('deck', mode))
      if (rows?.length && !deckCache.has(mode)) deckCache.set(mode, rows)
    }),
  )

  // personal
  await Promise.all(
    personalGameTabs.map(async (mode) => {
      const entry = await db.get<{
        rings: typeof personalRings.value
        bestHand: (CardItem | null)[]
      }>(USER_STORE_CAREER, careerKey('personal', mode))
      if (entry && !personalCache.has(mode)) {
        personalCache.set(mode, entry.rings)
        personalBestHandCache.set(mode, entry.bestHand)
      }
    }),
  )

  // allin
  await Promise.all(
    allInModeTabs.map(async (mode) => {
      const entry = await db.get<{
        summary: typeof allInSummary.value
        rates: typeof allInRateRows.value
      }>(USER_STORE_CAREER, careerKey('allin', mode))
      if (entry && !allInCache.has(mode)) allInCache.set(mode, entry)
    }),
  )

  // opponent (first page per period)
  await Promise.all(
    opponentPeriodTabs.map(async (period) => {
      const cacheKey = `${period}_${opponentOrderAsc.value ? 1 : 2}`
      if (opponentSortCache.has(cacheKey)) return
      const entry = await db.get<{ rows: ProfitRow[]; finished: boolean }>(
        USER_STORE_CAREER,
        careerKey('opponent', cacheKey),
      )
      if (entry) opponentSortCache.set(cacheKey, entry)
    }),
  )
}

async function refreshDeckMode(mode: string): Promise<void> {
  const modeConfig = resolveDeckMode(mode)
  const payload = {
    api_list: [33],
    user_card_type_room_stats_req: withClubId({
      gold_type: 1,
      order_type: 6,
      limit: 50,
      offset: 0,
      start_time: 0,
      end_time: 0,
      ...modeConfig,
    }),
  }
  const data = await requestCombine(payload, true)
  if (!data) return
  const cardTypeResp = (data.user_card_type_room_stats_resp ?? {}) as Record<string, unknown>
  setDeckCache(mode, cardTypeResp.list)
  if (selectedMainTab.value === 'deck' && selectedDeckMode.value === mode) {
    applyCurrentDeck()
  }
}

function applyCurrentPersonal(): void {
  personalRings.value =
    personalCache.get(selectedPersonalGame.value) ??
    personalRingMeta.map((item) => ({ ...item, value: 0 }))
  personalBestHand.value = personalBestHandCache.get(selectedPersonalGame.value) ?? []
}

function applyCurrentAllIn(): void {
  const value = allInCache.get(selectedAllInMode.value)
  allInSummary.value = value?.summary ?? [
    { label: t('UICareer_totalWin'), value: '0', highlight: 'up' as const },
    { label: 'All in', value: '0' },
    { label: t('UIMine_RecordItemsNormal_3RCUa3w8'), value: '0' },
    { label: t('UICareer_HuoWin'), value: '0' },
    { label: t('UICareer_AllinLost'), value: '0' },
  ]
  allInRateRows.value = value?.rates ?? [
    { key: 'active', label: t('UICareer_Zhudong'), rate: 0, color: '#50a7ec' },
    { key: 'passive', label: t('UICareer_Beidong'), rate: 0, color: '#fa2b4b' },
    { key: 'ahead', label: t('UICareer_Lingxian'), rate: 0, color: '#109657' },
    { key: 'behind', label: t('UICareer_Luohou'), rate: 0, color: '#b519d8' },
  ]
}

function applyCurrentDeck(): void {
  deckRows.value = deckCache.get(selectedDeckMode.value) ?? []
}

async function requestCombine(
  payload: Record<string, unknown>,
  silent = false,
): Promise<Record<string, unknown> | null> {
  try {
    const response = await postMiscCombineApi(payload)
    if (response.code !== 0) {
      throw new Error(
        typeof response.msg === 'string' ? response.msg : t('UIClub_LoadClubDataFail2'),
      )
    }
    return (response.data as Record<string, unknown>) || {}
  } catch (error) {
    if (!silent) {
      const message = error instanceof Error ? error.message : t('UIClub_LoadClubDataFail2')
      showFailToast(message)
    }
    return null
  }
}

async function loadPersonal(mode: string, silent = false): Promise<void> {
  if (personalCache.has(mode)) {
    return
  }
  const gameConfig = resolvePersonalMode(mode)
  const payload = {
    api_list: [28],
    stats_user_stats_req: withClubId({
      filter_type: 1,
      room_type: 0,
      time_type: 4,
      time_long: nowSeconds(),
      ...gameConfig,
    }),
  }
  const data = await requestCombine(payload, silent)
  if (!data) {
    return
  }
  const statsResp = (data.stats_user_stats_resp ?? {}) as Record<string, unknown>
  const roomData = (statsResp.room_data as Record<string, unknown>) ?? {}
  setPersonalCache(mode, roomData)
}

async function loadOpponentPage(reset = false, silent = false): Promise<void> {
  if (opponentLoadingMore.value) return
  if (!reset && opponentFinished.value) return

  opponentLoadingMore.value = true
  const offset = reset ? 0 : opponentRows.value.length
  const range = resolvePeriodRange(selectedOpponentPeriod.value)
  const cacheKey = `${selectedOpponentPeriod.value}_${opponentOrderAsc.value ? 1 : 2}`

  if (reset) {
    const cached = opponentSortCache.get(cacheKey)
    if (cached) {
      opponentRows.value = cached.rows
      opponentFinished.value = cached.finished
      opponentLoadingMore.value = false
      return
    }
  }

  const guard = opponentRefresher.begin()
  try {
    const data = await requestCombine(
      {
        api_list: [31],
        user_rival_room_stats_req: withClubId({
          gold_type: 1,
          order_type: opponentOrderAsc.value ? 1 : 2,
          limit: OPPONENT_PAGE_SIZE,
          offset,
          ...range,
        }),
      },
      silent || !reset,
    )

    if (!guard.isCurrent()) return
    if (!data) {
      if (reset) opponentFinished.value = true
      return
    }

    const rivalResp = (data.user_rival_room_stats_resp ?? {}) as Record<string, unknown>
    const records = Array.isArray(rivalResp.records) ? rivalResp.records : []
    const newRows: ProfitRow[] = records.map((item: unknown, idx: number) => {
      const row = typeof item === 'object' && item ? (item as Record<string, unknown>) : {}
      return {
        id: String(row.user_id ?? offset + idx),
        name: String(row.nickname ?? '--'),
        avatar: typeof row.avatar === 'string' ? row.avatar : undefined,
        hands: toSafeNumber(row.hand_count),
        lose: toSafeNumber(row.loss_count),
        win: toSafeNumber(row.profit_count),
        profit: toSafeNumber(row.profit_total),
      }
    })

    if (reset) {
      opponentRows.value = newRows
    } else {
      opponentRows.value = [...opponentRows.value, ...newRows]
    }

    opponentFinished.value = newRows.length < OPPONENT_PAGE_SIZE

    if (reset) {
      setOpponentCache(cacheKey, opponentRows.value, opponentFinished.value)
    }
  } finally {
    opponentLoadingMore.value = false
  }
}

async function refreshOpponentSilently(): Promise<void> {
  const cacheKey = `${selectedOpponentPeriod.value}_${opponentOrderAsc.value ? 1 : 2}`
  const data = await requestCombine(
    {
      api_list: [31],
      user_rival_room_stats_req: withClubId({
        gold_type: 1,
        order_type: opponentOrderAsc.value ? 1 : 2,
        limit: OPPONENT_PAGE_SIZE,
        offset: 0,
        ...resolvePeriodRange(selectedOpponentPeriod.value),
      }),
    },
    true,
  )
  if (!data) return
  // Discard if user changed period/sort while request was in-flight
  if (cacheKey !== `${selectedOpponentPeriod.value}_${opponentOrderAsc.value ? 1 : 2}`) return
  const rivalResp = (data.user_rival_room_stats_resp ?? {}) as Record<string, unknown>
  const records = Array.isArray(rivalResp.records) ? rivalResp.records : []
  const newRows: ProfitRow[] = records.map((item, idx) => {
    const row = typeof item === 'object' && item ? (item as Record<string, unknown>) : {}
    return {
      id: String(row.user_id ?? idx),
      name: String(row.nickname ?? '--'),
      avatar: typeof row.avatar === 'string' ? row.avatar : undefined,
      hands: toSafeNumber(row.hand_count),
      lose: toSafeNumber(row.loss_count),
      win: toSafeNumber(row.profit_count),
      profit: toSafeNumber(row.profit_total),
    }
  })
  opponentRows.value = newRows
  opponentFinished.value = newRows.length < OPPONENT_PAGE_SIZE
  setOpponentCache(cacheKey, newRows, opponentFinished.value)
}

function applyOpponentFromCache(cacheKey: string): boolean {
  const cached = opponentSortCache.get(cacheKey)
  if (!cached) return false
  opponentRows.value = cached.rows
  opponentFinished.value = cached.finished
  return true
}

function toggleOpponentSort(): void {
  opponentOrderAsc.value = !opponentOrderAsc.value
  opponentFinished.value = false

  const newKey = `${selectedOpponentPeriod.value}_${opponentOrderAsc.value ? 1 : 2}`
  if (applyOpponentFromCache(newKey)) {
    void opponentRefresher.refresh(() => refreshOpponentSilently())
  } else {
    opponentRows.value = []
    void loadOpponentPage(true)
  }
}

function onOpponentLoad(): void {
  void loadOpponentPage()
}

async function loadAllIn(mode: string, silent = false): Promise<void> {
  if (allInCache.has(mode)) {
    return
  }
  const range = resolvePeriodRange('history')
  const modeConfig = resolveAllInMode(mode)
  const payload = {
    api_list: [32],
    user_allin_room_stats_req: withClubId({
      gold_type: 1,
      ...range,
      ...modeConfig,
    }),
  }
  const data = await requestCombine(payload, silent)
  if (!data) {
    return
  }
  const allInResp = (data.user_allin_room_stats_resp ?? {}) as Record<string, unknown>
  const stats = (allInResp.stats as Record<string, unknown>) ?? {}
  setAllInCache(mode, stats)
}

async function loadDeck(mode: string, silent = false): Promise<void> {
  if (deckCache.has(mode)) {
    return
  }
  const modeConfig = resolveDeckMode(mode)
  const payload = {
    api_list: [33],
    user_card_type_room_stats_req: withClubId({
      gold_type: 1,
      order_type: 6,
      limit: 50,
      offset: 0,
      start_time: 0,
      end_time: 0,
      ...modeConfig,
    }),
  }
  const data = await requestCombine(payload, silent)
  if (!data) {
    return
  }
  const cardTypeResp = (data.user_card_type_room_stats_resp ?? {}) as Record<string, unknown>
  setDeckCache(mode, cardTypeResp.list)
}

async function loadInitial(): Promise<void> {
  loading.value = true
  try {
    const mode = selectedPersonalGame.value
    const data = await requestCombine({
      api_list: [28],
      stats_user_stats_req: withClubId({
        filter_type: 1,
        room_type: 0,
        time_type: 4,
        time_long: nowSeconds(),
        ...resolvePersonalMode(mode),
      }),
    })
    if (data) {
      const statsResp = (data.stats_user_stats_resp ?? {}) as Record<string, unknown>
      setPersonalCache(mode, (statsResp.room_data as Record<string, unknown>) ?? {})
      applyCurrentPersonal()
    }
  } finally {
    loading.value = false
  }
}

async function loadOtherInitial(): Promise<void> {
  const opponentPeriod = selectedOpponentPeriod.value
  const allInMode = selectedAllInMode.value
  const deckMode = selectedDeckMode.value

  const apiList: number[] = []
  const payload: Record<string, unknown> = {}

  if (opponentRows.value.length === 0 && !opponentLoadingMore.value) {
    apiList.push(31)
    payload.user_rival_room_stats_req = withClubId({
      gold_type: 1,
      order_type: opponentOrderAsc.value ? 1 : 2,
      limit: OPPONENT_PAGE_SIZE,
      offset: 0,
      ...resolvePeriodRange(opponentPeriod),
    })
  }
  if (!allInCache.has(allInMode)) {
    apiList.push(32)
    payload.user_allin_room_stats_req = withClubId({
      gold_type: 1,
      ...resolvePeriodRange('history'),
      ...resolveAllInMode(allInMode),
    })
  }
  if (!deckCache.has(deckMode)) {
    apiList.push(33)
    payload.user_card_type_room_stats_req = withClubId({
      gold_type: 1,
      order_type: 6,
      limit: 50,
      offset: 0,
      start_time: 0,
      end_time: 0,
      ...resolveDeckMode(deckMode),
    })
  }

  if (apiList.length === 0) return

  const data = await requestCombine({ api_list: apiList, ...payload }, true)
  if (!data) return

  if (apiList.includes(31)) {
    const rivalResp = (data.user_rival_room_stats_resp ?? {}) as Record<string, unknown>
    const records = Array.isArray(rivalResp.records) ? rivalResp.records : []
    const newRows: ProfitRow[] = records.map((item: unknown, idx: number) => {
      const row = typeof item === 'object' && item ? (item as Record<string, unknown>) : {}
      return {
        id: String(row.user_id ?? idx),
        name: String(row.nickname ?? '--'),
        avatar: typeof row.avatar === 'string' ? row.avatar : undefined,
        hands: toSafeNumber(row.hand_count),
        lose: toSafeNumber(row.loss_count),
        win: toSafeNumber(row.profit_count),
        profit: toSafeNumber(row.profit_total),
      }
    })
    const opponentCacheKey = `${opponentPeriod}_${opponentOrderAsc.value ? 1 : 2}`
    // 数据缓存无条件写入（下次进入可命中）；UI 只在 period/sort 仍是 mount 时记录的值时才覆盖。
    const finished = newRows.length < OPPONENT_PAGE_SIZE
    setOpponentCache(opponentCacheKey, newRows, finished)
    if (opponentCacheKey === `${selectedOpponentPeriod.value}_${opponentOrderAsc.value ? 1 : 2}`) {
      opponentRows.value = newRows
      opponentFinished.value = finished
    }
  }
  if (apiList.includes(32)) {
    const allInResp = (data.user_allin_room_stats_resp ?? {}) as Record<string, unknown>
    setAllInCache(allInMode, (allInResp.stats as Record<string, unknown>) ?? {})
  }
  if (apiList.includes(33)) {
    const cardTypeResp = (data.user_card_type_room_stats_resp ?? {}) as Record<string, unknown>
    setDeckCache(deckMode, cardTypeResp.list)
  }

  const tab = selectedMainTab.value
  if (tab === 'allin') applyCurrentAllIn()
  else if (tab === 'deck') applyCurrentDeck()
}

async function preloadAllTabs(): Promise<void> {
  const preloadTasks: Array<Promise<void>> = []

  for (const mode of personalGameTabs) {
    if (mode !== selectedPersonalGame.value) {
      preloadTasks.push(loadPersonal(mode, true))
    }
  }

  for (const mode of allInModeTabs) {
    if (mode !== selectedAllInMode.value) {
      preloadTasks.push(loadAllIn(mode, true))
    }
  }

  // Deck modes are handled by refreshDeckMode (stale-while-revalidate), skip here.

  await Promise.all(preloadTasks)
}

async function ensureCurrentTabData(): Promise<void> {
  if (selectedMainTab.value === 'personal') {
    if (!personalCache.has(selectedPersonalGame.value)) {
      loading.value = true
      await loadPersonal(selectedPersonalGame.value)
      loading.value = false
    }
    applyCurrentPersonal()
    return
  }

  if (selectedMainTab.value === 'opponent') {
    if (opponentRows.value.length === 0 && !opponentLoadingMore.value) {
      loading.value = true
      await loadOpponentPage(true)
      loading.value = false
    }
    return
  }

  if (selectedMainTab.value === 'allin') {
    if (!allInCache.has(selectedAllInMode.value)) {
      loading.value = true
      await loadAllIn(selectedAllInMode.value)
      loading.value = false
    }
    applyCurrentAllIn()
    return
  }

  if (deckCache.has(selectedDeckMode.value)) {
    applyCurrentDeck()
    // 命中缓存：立即触发 SWR；20s TTL 内同 mode 跳过，避免来回切重发。
    void deckRefresher.refresh(() => refreshDeckMode(selectedDeckMode.value))
  } else {
    loading.value = true
    await loadDeck(selectedDeckMode.value)
    loading.value = false
    applyCurrentDeck()
  }
}

watch(selectedMainTab, () => {
  void ensureCurrentTabData()
})

watch(selectedPersonalGame, () => {
  void ensureCurrentTabData()
})

watch(selectedOpponentPeriod, () => {
  opponentFinished.value = false
  const newKey = `${selectedOpponentPeriod.value}_${opponentOrderAsc.value ? 1 : 2}`
  if (applyOpponentFromCache(newKey)) {
    void opponentRefresher.refresh(() => refreshOpponentSilently())
  } else {
    opponentRows.value = []
    void loadOpponentPage(true)
  }
})

watch(selectedAllInMode, () => {
  void ensureCurrentTabData()
})

watch(selectedDeckMode, () => {
  void ensureCurrentTabData()
})

watch(
  () => userInfoStore.currentClubId,
  () => {
    // Club changed — clear memory caches, restore from IDB for new club, reload current tab
    deckCache.clear()
    personalCache.clear()
    personalBestHandCache.clear()
    allInCache.clear()
    opponentSortCache.clear()
    opponentRows.value = []
    opponentFinished.value = false
    // 之前 club 的 debounce 调度也要取消，避免触发旧 key 的请求。
    deckRefresher.clear()
    opponentRefresher.clear()
    void (async () => {
      await restoreAllFromIDB()
      void ensureCurrentTabData()
    })()
  },
)

onMounted(() => {
  void (async () => {
    // Restore all tabs from IDB first (fast), apply current tab immediately
    await restoreAllFromIDB()
    applyCurrentPersonal()
    applyCurrentAllIn()
    if (selectedMainTab.value === 'deck') applyCurrentDeck()
    if (opponentSortCache.size > 0) {
      const cacheKey = `${selectedOpponentPeriod.value}_${opponentOrderAsc.value ? 1 : 2}`
      const cached = opponentSortCache.get(cacheKey)
      if (cached) {
        opponentRows.value = cached.rows
        opponentFinished.value = cached.finished
      }
    }

    await loadInitial()
    void (async () => {
      await loadOtherInitial()
      void preloadAllTabs()
      // Background-refresh all deck modes (stale-while-revalidate)
      for (const mode of deckModeTabs) {
        void refreshDeckMode(mode)
      }
    })()
  })()
})

onBeforeUnmount(() => {
  deckRefresher.clear()
  opponentRefresher.clear()
})
</script>

<template>
  <div class="page-shell club-data-page" :style="backgroundStyle">
    <HeaderBack :title="title" extra-padding />

    <div class="content-wrap">
      <!-- <p v-if="loading" class="panel-status">{{ t('SuperView2') }}...</p> -->
      <div class="main-tabs">
        <button
          v-for="tab in mainTabs"
          :key="tab.key"
          type="button"
          class="main-tab"
          :class="{ active: selectedMainTab === tab.key }"
          @click="setMainTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <template v-if="selectedMainTab === 'personal'">
        <div class="sub-tab-wrap">
          <FilterTabbar v-model="selectedPersonalGame" :tabs="personalGameTabOptions" />
        </div>

        <template v-if="personalHasData">
          <section class="ring-grid">
            <article v-for="ring in personalRings" :key="ring.key" class="ring-card">
              <RingChart
                class="ring-donut"
                size="1.92rem"
                :value="ring.value"
                :color="ring.color"
                :track-color="isLight ? 'rgba(32, 32, 32, 0.12)' : 'rgba(255, 255, 255, 0.16)'"
              >
                <div class="ring-inner">
                  <div class="ring-value">{{ ring.value }}%</div>
                  <div class="ring-label">{{ ring.label }}</div>
                </div>
              </RingChart>
            </article>
          </section>

          <section class="glass-pill title-pill">
            <span>{{ t('UIClub_Text37') }}3{{ t('UIClub_Data') }}</span>
            <CareerSvgIcon name="data" class="data-icon" />
          </section>

          <section class="glass-card biggest-card">
            <div class="biggest-title">{{ t('UICareer_MaxCadType') }}</div>
            <div class="card-row">
              <template v-for="i in 5" :key="i">
                <PokerCard
                  v-if="personalBestHand[i - 1]"
                  :rank="personalBestHand[i - 1]!.rank"
                  :suit="personalBestHand[i - 1]!.suit"
                  size="1rem"
                />
                <img v-else class="card-back" :src="tableCardBgUrl" alt="" />
              </template>
            </div>
          </section>
        </template>

        <template v-else>
          <section class="empty-wrap">
            <AppSvgIcon name="empty-data" class="empty-icon" />
            <div class="empty-text">暂无数据</div>
          </section>
        </template>
      </template>

      <template v-else-if="selectedMainTab === 'opponent'">
        <div class="sub-tab-wrap">
          <FilterTabbar v-model="selectedOpponentPeriod" :tabs="opponentPeriodTabOptions" />
        </div>
        <section class="title-row">
          <div class="title-text">{{ opponentPeriodLabel }}</div>
          <button class="sort-btn" type="button" @click="toggleOpponentSort">
            {{ opponentOrderAsc ? '升序' : '降序' }}
            <CareerSvgIcon
              name="dropdown"
              class="sort-arrow"
              :class="{ 'sort-arrow--asc': opponentOrderAsc }"
            />
          </button>
        </section>
        <div class="opponent-table-wrap">
          <GameTable
            :loading="opponentLoadingMore"
            :data="opponentRows"
            height="9rem"
            flat
            header-variant="ghost"
            :finished="opponentFinished"
            @load="onOpponentLoad"
          >
            <GameTableColumn prop="name" label="玩家" :flex="1.55" align="center">
              <template #default="{ row }">
                <div class="player-cell">
                  <img
                    class="avatar"
                    :src="row.avatar || undefined"
                    aria-hidden="true"
                    @error="(e) => ((e.target as HTMLImageElement).src = '')"
                  />
                  <div class="name">{{ row.name }}</div>
                </div>
              </template>
            </GameTableColumn>
            <GameTableColumn prop="hands" label="手数" :flex="1" />
            <GameTableColumn prop="lose" label="负" :flex="1" />
            <GameTableColumn prop="win" label="胜" :flex="1" />
            <GameTableColumn prop="profit" label="盈利" :flex="1.5">
              <template #default="{ row }">
                <span :class="profitClass(row.profit)">{{ formatProfit(row.profit) }}</span>
              </template>
            </GameTableColumn>
          </GameTable>
          <div
            v-if="!loading && !opponentLoadingMore && opponentRows.length === 0"
            class="table-empty"
          >
            暂无数据
          </div>
        </div>
      </template>

      <template v-else-if="selectedMainTab === 'allin'">
        <section class="glass-card allin-summary-card">
          <div class="allin-mode-grid">
            <button
              v-for="mode in allInModeTabs"
              :key="mode"
              type="button"
              class="mode-chip"
              :class="{ active: selectedAllInMode === mode }"
              @click="selectedAllInMode = mode"
            >
              {{ mode }}
            </button>
          </div>

          <div class="section-title">
            <span>近3个月内玩牌数据统计</span>
            <CareerSvgIcon name="data" class="data-icon" />
          </div>

          <div class="summary-list">
            <div v-for="item in allInSummary" :key="item.label" class="summary-row">
              <span>{{ item.label }}</span>
              <span :class="item.highlight === 'up' ? 'profit-up' : ''">{{ item.value }}</span>
            </div>
          </div>
        </section>

        <section class="glass-card radar-card">
          <div class="section-title">
            <span>ALL IN 胜率分布图</span>
            <CareerSvgIcon name="data" class="data-icon" />
          </div>
          <div class="allin-radar-wrap">
            <RadarChart v-bind="radarPoints" />
            <div class="radar-badge radar-badge-top">
              <span class="badge-label">主动</span>
              <span class="badge-rate">{{ radarPoints.top }}%</span>
            </div>
            <div class="radar-badge radar-badge-left">
              <span class="badge-label">被动</span>
              <span class="badge-rate">{{ radarPoints.left }}%</span>
            </div>
            <div class="radar-badge radar-badge-right">
              <span class="badge-label">落后</span>
              <span class="badge-rate">{{ radarPoints.right }}%</span>
            </div>
            <div class="radar-badge radar-badge-bottom">
              <span class="badge-label">领先</span>
              <span class="badge-rate">{{ radarPoints.bottom }}%</span>
            </div>
          </div>
        </section>
      </template>

      <template v-else>
        <section class="glass-card deck-tabs-card">
          <div class="deck-tab-grid">
            <button
              v-for="mode in deckModeTabs"
              :key="mode"
              type="button"
              class="mode-chip deck-mode-chip"
              :class="{ active: selectedDeckMode === mode }"
              @click="selectedDeckMode = mode"
            >
              {{ mode }}
            </button>
          </div>
        </section>

        <section class="deck-title">近三个月内玩牌数据统计</section>

        <div class="deck-table-wrap">
          <GameTable
            :data="sortedDeckRows"
            height="9.15rem"
            flat
            header-variant="ghost"
            @sort-change="onDeckSort"
          >
            <GameTableColumn prop="cards" label="牌型" :flex="1.5" align="center">
              <template #default="{ row }">
                <div class="deck-hand-cell">
                  <PokerCard :rank="row.cards[0].rank" :suit="row.cards[0].suit" size="0.62rem" />
                  <PokerCard :rank="row.cards[1].rank" :suit="row.cards[1].suit" size="0.62rem" />
                </div>
              </template>
            </GameTableColumn>
            <GameTableColumn prop="winCount" label="获胜" :flex="0.8" />
            <GameTableColumn prop="totalHands" label="总手数" :flex="1" :sortable="true" />
            <GameTableColumn prop="winRate" label="胜率" :flex="0.8" :sortable="true" />
            <GameTableColumn prop="profit" label="盈利" :flex="1.5" :sortable="true">
              <template #default="{ row }">
                <span :class="profitClass(row.profit)">{{ formatProfit(row.profit) }}</span>
              </template>
            </GameTableColumn>
          </GameTable>
          <div v-if="!loading && sortedDeckRows.length === 0" class="table-empty">暂无数据</div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.club-data-page {
  position: relative;
  height: 100dvh;
  overflow-y: auto;
  padding: 0 0 0.72rem;
  color: #f9f9f9;
  background-image: var(--club-data-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: var(--c-text);
    background-color: var(--c-page);
    background-image: var(--club-data-bg-light);
  }
}

.content-wrap {
  position: relative;
  padding: 0 0.49rem;
}

.panel-status {
  margin: 0.3rem 0 0;
  text-align: center;
  font-size: 0.36rem;
  color: rgba(249, 249, 249, 0.7);

  @include theme-light {
    color: var(--c-text-muted);
  }
}

.back-btn {
  width: 0.8rem;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.72rem;
  text-align: left;
  padding: 0;
}

.head-spacer {
  width: 0.8rem;
}

.main-tabs {
  margin-top: 0.28rem;
  display: flex;
  justify-content: space-around;
}

.main-tab {
  border: 0;
  padding: 0.08rem 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.38rem;
  line-height: 1.1;

  @include theme-light {
    color: rgba(0, 0, 0, 0.7);
  }

  &.active {
    color: #fff;
    font-weight: 600;
    border-bottom: 0.03rem solid rgba(249, 249, 249, 0.95);

    @include theme-light {
      color: var(--c-brand);
      border-bottom-color: var(--c-brand);
    }
  }
}

.sub-tab-wrap {
  margin-top: 0.6rem;

  :deep(.filter-tabbar) {
    margin: 0;
  }

  @include theme-light {
    :deep(.filter-tabbar) {
      background: #e3e3e3;
    }

    :deep(.filter-tab__text) {
      color: var(--c-text);
    }

    :deep(.filter-tab__item--active) {
      border-color: #fff;
      background: #fff;
    }
  }
}

.glass-card {
  border-radius: 0.9rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.15);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.06rem);

  @include theme-light {
    border-color: transparent;
    background: var(--c-surface);
  }
}

.glass-pill {
  border-radius: 0.7rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.12);
  background: rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(0.06rem);

  @include theme-light {
    border-color: transparent;
    background: var(--c-surface);
  }
}

.ring-grid {
  margin-top: 0.6rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem 1rem;
}

.ring-card {
  display: flex;
  justify-content: center;
}

.ring-donut {
  border-radius: 50%;
  box-shadow:
    0 0.06rem 0.18rem rgba(0, 0, 0, 0.2),
    /* 左上高光 */ inset 0.2px 0.2px 0px 0px rgba(255, 255, 255, 0.85);
}

.ring-inner {
  width: 1.18rem;
  height: 1.18rem;
  border-radius: 9999px;
  background: rgba(116, 90, 116, 0.52);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;

  @include theme-light {
    background: rgba(128, 128, 128, 0.52);
  }
}

.ring-value {
  font-size: 0.27rem;
  font-weight: 700;
  line-height: 1.1;
}

.ring-label {
  margin-top: 0.05rem;
  font-size: 0.13rem;
  line-height: 1.1;
  color: rgba(249, 249, 249, 0.86);
}

.title-pill {
  margin-top: 0.6rem;
  padding: 0.35rem 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.42rem;
  font-weight: 600;
}

.data-icon {
  width: 0.52rem;
  height: 0.52rem;
  color: #fff;

  @include theme-light {
    color: var(--c-brand);
  }
}

.biggest-card {
  margin-top: 0.6rem;
  padding: 0.2rem 0.35rem 0.5rem;
}

.biggest-title {
  text-align: center;
  font-size: 0.37rem;
  color: rgba(249, 249, 249, 0.72);
  font-weight: 600;

  @include theme-light {
    color: rgba(0, 0, 0, 0.7);
  }
}

.card-row {
  margin-top: 0.5rem;
  display: flex;
  justify-content: center;
  gap: 0.12rem;
}

.card-back {
  width: 1.01rem;
  height: 1.52rem;
  border-radius: 0.12rem;
  flex-shrink: 0;
  object-fit: cover;
  display: block;
}

.title-row {
  margin-top: 0.55rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-text {
  font-size: 0.43rem;
  font-weight: 500;
}

.sort-btn {
  border: 0;
  border-radius: 0.4rem;
  background: rgba(0, 0, 0, 0.46);
  color: #fff;
  font-size: 0.33rem;
  padding: 0.12rem 0.24rem;
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
}

.sort-arrow {
  width: 0.3rem;
  height: 0.3rem;
  color: #fff;
  transition: transform 0.25s ease;

  &--asc {
    transform: rotate(180deg);
  }
}

.empty-wrap {
  margin-top: 3.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon {
  width: 1.2533rem;
  height: 1.5733rem;
  color: rgba(255, 255, 255, 0.66);

  @include theme-light {
    color: var(--c-brand);
  }
}

.empty-text {
  margin-top: 0.24rem;
  font-size: 0.42rem;
  color: rgba(255, 255, 255, 0.66);

  @include theme-light {
    color: var(--c-brand);
  }
}

.opponent-table-wrap,
.deck-table-wrap {
  position: relative;
  border-radius: 0.6rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.15);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.06rem);
  padding: 0.5rem 0.4rem 0.16rem;
  overflow: hidden;
  font-size: 0.28rem;

  @include theme-light {
    border-color: transparent;
    background: var(--c-surface);
  }
}

// 表格内无数据时显示的占位文本，覆盖在 GameTable 表体区域。
.table-empty {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.4rem;
  color: rgba(249, 249, 249, 0.7);
  pointer-events: none;

  @include theme-light {
    color: var(--c-text-muted);
  }
}
:deep(.game-table__header-cell) {
  padding: 0.4rem 0.2rem;
}
:deep(.game-table__header-label),
:deep(.game-table__cell),
:deep(.game-table__cell-text) {
  font-size: 0.28rem !important;
}

.club-data-page {
  @include theme-light {
    :deep(.game-table__header-inner--ghost) {
      background: #cfcfcf;
    }

    :deep(.game-table__header-label),
    :deep(.game-table__cell-text) {
      color: var(--c-text);
    }

    :deep(.game-table__sort-icon) {
      color: rgba(0, 0, 0, 0.35);
    }

    :deep(.game-table__sort-icon--active) {
      color: var(--c-text);
    }

    :deep(.game-table__row--flat) {
      border-bottom-color: rgba(0, 0, 0, 0.1);
    }

    :deep(.game-table__finished-text) {
      color: var(--c-text-muted);
    }
  }
}

.opponent-table-wrap {
  margin-top: 0.6rem;
}

.deck-table-wrap {
  margin-top: 0.24rem;
}

.player-cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  // gap: 0.12rem;
}

.avatar {
  width: 0.88rem;
  height: 0.88rem;
  border-radius: 50%;
  border: 0.02rem solid rgba(249, 249, 249, 0.34);
  background: rgba(249, 249, 249, 0.15);
  object-fit: cover;
  display: block;

  @include theme-light {
    border-color: rgba(32, 32, 32, 0.18);
    background: rgba(32, 32, 32, 0.08);
  }
}

.name {
  font-size: 0.29rem;
}

.profit-up {
  color: var(--c-profit);
  font-weight: 600;
}

.profit-down {
  color: var(--c-loss);
  font-weight: 600;
}

.allin-summary-card {
  margin-top: 0.34rem;
  border-radius: 0.67rem;
  padding: 0.48rem 0.58rem 0.34rem;
}

.allin-mode-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.24rem;
}

.mode-chip {
  border: 0;
  border-radius: 1.16rem;
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  font-size: 0.34rem;
  min-height: 0.78rem;
  padding: 0;
  font-weight: 500;
  transition: background-color 0.2s ease;

  @include theme-light {
    background: #cfcfcf;
    color: var(--c-text);
  }

  &.active {
    background: rgba(var(--c-brand-rgb), 0.6);
    font-weight: 600;

    @include theme-light {
      background: var(--c-brand);
      color: var(--c-text);
    }
  }
}

.section-title {
  margin-top: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.4rem;
  font-weight: 600;
  color: #fff;

  @include theme-light {
    color: var(--c-text);
  }
}

.summary-list {
  margin-top: 0.26rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 0.6rem;
  font-size: 0.34rem;
  line-height: 1.4;
}

.radar-card {
  margin-top: 0.28rem;
  border-radius: 0.67rem;
  padding: 0.48rem 0.58rem 0.4rem;
}

.allin-summary-card .section-title,
.radar-card .section-title {
  margin-top: 0.34rem;
  font-size: 0.338rem;
  font-weight: 500;
}

.allin-radar-wrap {
  position: relative;
  margin-top: 0.26rem;
  height: 6.75rem;
}

.radar-badge {
  position: absolute;
  border: 0.038rem solid #f9f9f9;
  border-radius: 0.38rem;
  color: #f9f9f9;
  min-height: 1.31rem;
  padding: 0.19rem 0.32rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  line-height: 1;
}

.badge-label {
  font-size: 0.3rem;
  font-weight: 400;
}

.badge-rate {
  margin-top: 0.1rem;
  font-size: 0.4rem;
  font-weight: 700;
}

.radar-badge-top {
  left: 50%;
  top: 0.18rem;
  transform: translateX(-50%);
  background: #50a7ec;
  min-width: 1.54rem;
}

.radar-badge-left {
  left: 0;
  top: 2.08rem;
  background: #fa2b4b;
  min-width: 1.78rem;
}

.radar-badge-right {
  right: 0;
  top: 2.08rem;
  background: #b519d8;
  min-width: 2.22rem;
}

.radar-badge-bottom {
  left: 50%;
  bottom: 0rem;
  transform: translateX(-50%);
  background: #109657;
  min-width: 1.94rem;
}

.deck-tabs-card {
  margin-top: 0.34rem;
  border-radius: 0.67rem;
  padding: 0.38rem 0.32rem;
}

.deck-tab-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.14rem;
}

.deck-mode-chip {
  height: 0.78rem;
  border-radius: 0.58rem;
  font-size: 0.34rem;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.19);

  &.active {
    background: rgba(var(--c-brand-rgb), 0.6);
    color: #fff;
    font-weight: 600;

    @include theme-light {
      color: var(--c-text);
    }
  }
}

.deck-title {
  margin-top: 0.28rem;
  font-size: 0.34rem;
  line-height: 1.2;
  font-weight: 500;
}

.deck-hand-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.08rem;
}

@media (max-width: 360px) {
  .club-data-page {
    padding-left: 0.34rem;
    padding-right: 0.34rem;
  }

  .ring-inner {
    width: 1.24rem;
    height: 1.24rem;
  }

  .ring-label {
    font-size: 0.16rem;
  }
}
</style>
