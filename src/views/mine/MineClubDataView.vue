<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { showFailToast } from 'vant'
import { postMiscCombineApi } from '@/api/misc'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { useUserInfoStore } from '@/stores/userInfo'

const title = computed(() => 'Data')

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
  cards: [string, string]
  winCount: number
  totalHands: number
  winRate: number
  profit: number
}

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const mainTabs: Array<{ key: MainTabKey; label: string }> = [
  { key: 'personal', label: '个人' },
  { key: 'opponent', label: '对手' },
  { key: 'allin', label: '全下' },
  { key: 'deck', label: '牌组' },
]

const personalGameTabs = ['德州', '奥马哈', '短牌']
const opponentPeriodTabs = ['本周', '本月', '历史']
const allInModeTabs = ['Texas', 'Omaha', '6+', 'AOF 6+', 'AOF Texas', 'AOF Omaha']
const deckModeTabs = ['Texas', 'Omaha', 'AOF Texas', 'AOF Omaha']

const selectedMainTab = ref<MainTabKey>('personal')
const selectedPersonalGame = ref(personalGameTabs[0])
const selectedOpponentPeriod = ref(opponentPeriodTabs[0])
const selectedAllInMode = ref(allInModeTabs[0])
const selectedDeckMode = ref(deckModeTabs[0])
const loading = ref(false)
const userInfoStore = useUserInfoStore()

const personalRingMeta = [
  { key: 'vpip', label: '入池率', color: '#ff5b5b' },
  { key: 'wins', label: '胜率', color: '#3c6dff' },
  { key: 'prf', label: '翻牌加注率', color: '#f7bb46' },
  { key: 'wtsd', label: '摊牌胜率', color: '#ff2626' },
  { key: 'bet3', label: '再加注率', color: '#66b7ff' },
  { key: 'allinWins', label: '全下胜率', color: '#20f2c2' },
] as const

const personalRings = ref(personalRingMeta.map((item) => ({ ...item, value: 0 })))
const opponentRows = ref<ProfitRow[]>([])
const deckRows = ref<DeckRow[]>([])
const allInSummary = ref([
  { label: '累计盈利', value: '0', highlight: 'up' as const },
  { label: 'All in', value: '0' },
  { label: '手数', value: '0' },
  { label: '获胜', value: '0' },
  { label: '失利', value: '0' },
])
const allInRateRows = ref([
  { key: 'active', label: '主动', rate: 0, color: '#50a7ec' },
  { key: 'passive', label: '被动', rate: 0, color: '#fa2b4b' },
  { key: 'ahead', label: '领先', rate: 0, color: '#109657' },
  { key: 'behind', label: '落后', rate: 0, color: '#b519d8' },
])

const allInOverallRate = computed(() => {
  const winCount = toSafeNumber(allInSummary.value[3]?.value)
  const totalHands = toSafeNumber(allInSummary.value[2]?.value)
  if (totalHands <= 0) {
    return 0
  }
  return clampRate((winCount / totalHands) * 100)
})

const radarCanvasRef = ref<HTMLCanvasElement | null>(null)
const radarWrapRef = ref<HTMLDivElement | null>(null)
let radarRafId = 0
const onWindowResize = () => {
  if (selectedMainTab.value === 'allin') {
    scheduleRadarDraw()
  }
}

const passiveRate = computed(
  () => allInRateRows.value.find((item) => item.key === 'passive')?.rate ?? 0,
)
const backwardRate = computed(
  () => allInRateRows.value.find((item) => item.key === 'behind')?.rate ?? 0,
)
const leadingRate = computed(
  () => allInRateRows.value.find((item) => item.key === 'ahead')?.rate ?? 0,
)

const personalCache = new Map<string, typeof personalRings.value>()
const opponentCache = new Map<string, ProfitRow[]>()
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

function setMainTab(tab: MainTabKey): void {
  selectedMainTab.value = tab
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

function clearRadarRaf(): void {
  if (radarRafId) {
    cancelAnimationFrame(radarRafId)
    radarRafId = 0
  }
}

function scheduleRadarDraw(): void {
  clearRadarRaf()
  radarRafId = requestAnimationFrame(() => {
    drawAllInRadar()
  })
}

function drawAllInRadar(): void {
  const canvas = radarCanvasRef.value
  const wrap = radarWrapRef.value
  if (!canvas || !wrap) {
    return
  }

  const width = wrap.clientWidth
  const height = wrap.clientHeight
  if (!width || !height) {
    return
  }

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const centerX = width / 2
  const centerY = height / 2 + 6
  const radius = Math.min(width, height) * 0.26
  const levels = 5

  const pointAt = (axis: 'top' | 'right' | 'bottom' | 'left', value: number): [number, number] => {
    const scale = clampRate(value) / 100
    const length = radius * scale
    if (axis === 'top') return [centerX, centerY - length]
    if (axis === 'right') return [centerX + length, centerY]
    if (axis === 'bottom') return [centerX, centerY + length]
    return [centerX - length, centerY]
  }

  ctx.lineCap = 'round'
  for (let level = levels; level >= 1; level -= 1) {
    const ratio = level / levels
    const ring = [
      [centerX, centerY - radius * ratio],
      [centerX + radius * ratio, centerY],
      [centerX, centerY + radius * ratio],
      [centerX - radius * ratio, centerY],
    ]
    ctx.beginPath()
    ctx.moveTo(ring[0][0], ring[0][1])
    for (let i = 1; i < ring.length; i += 1) {
      ctx.lineTo(ring[i][0], ring[i][1])
    }
    ctx.closePath()
    ctx.strokeStyle = level === levels ? 'rgba(249, 249, 249, 0.92)' : 'rgba(249, 249, 249, 0.16)'
    ctx.lineWidth = level === levels ? 1.7 : 1
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.moveTo(centerX, centerY - radius)
  ctx.lineTo(centerX, centerY + radius)
  ctx.moveTo(centerX - radius, centerY)
  ctx.lineTo(centerX + radius, centerY)
  ctx.strokeStyle = 'rgba(249, 249, 249, 0.24)'
  ctx.lineWidth = 1
  ctx.stroke()

  const radarPoints: Array<[number, number]> = [
    pointAt('top', allInOverallRate.value),
    pointAt('right', backwardRate.value),
    pointAt('bottom', leadingRate.value),
    pointAt('left', passiveRate.value),
  ]

  const fill = ctx.createLinearGradient(
    centerX - radius,
    centerY - radius,
    centerX + radius,
    centerY + radius,
  )
  fill.addColorStop(0, 'rgba(249, 249, 249, 0.34)')
  fill.addColorStop(1, 'rgba(249, 249, 249, 0.14)')
  ctx.beginPath()
  ctx.moveTo(radarPoints[0][0], radarPoints[0][1])
  for (let i = 1; i < radarPoints.length; i += 1) {
    ctx.lineTo(radarPoints[i][0], radarPoints[i][1])
  }
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.strokeStyle = 'rgba(249, 249, 249, 0.78)'
  ctx.lineWidth = 1.3
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = 'rgba(249, 249, 249, 0.84)'
  for (const [x, y] of radarPoints) {
    ctx.beginPath()
    ctx.arc(x, y, 2, 0, Math.PI * 2)
    ctx.fill()
  }
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
    case '本周':
      return { start_time: endTime - 7 * daySeconds, end_time: endTime }
    case '本月':
      return { start_time: endTime - 30 * daySeconds, end_time: endTime }
    default:
      return { start_time: endTime - 90 * daySeconds, end_time: endTime }
  }
}

function resolvePersonalMode(mode: string): { game_types: number[]; poker_types: number[] } {
  if (mode === '奥马哈') {
    return { game_types: [1, 2, 3], poker_types: [0] }
  }
  if (mode === '短牌') {
    return { game_types: [0], poker_types: [2] }
  }
  return { game_types: [0], poker_types: [0] }
}

function resolveAllInMode(mode: string): {
  game_types: number[]
  poker_types: number[]
  aof_type: number
} {
  if (mode === 'Omaha') {
    return { game_types: [1, 2, 3], poker_types: [0], aof_type: 2 }
  }
  if (mode === '6+') {
    return { game_types: [0], poker_types: [2], aof_type: 2 }
  }
  if (mode === 'AOF 6+') {
    return { game_types: [0], poker_types: [2], aof_type: 1 }
  }
  if (mode === 'AOF Texas') {
    return { game_types: [0], poker_types: [0], aof_type: 1 }
  }
  if (mode === 'AOF Omaha') {
    return { game_types: [1, 2, 3], poker_types: [0], aof_type: 1 }
  }
  return { game_types: [0], poker_types: [0], aof_type: 2 }
}

function resolveDeckMode(mode: string): {
  game_types: number[]
  poker_types: number[]
  aof_type: number
} {
  if (mode === 'Omaha') {
    return { game_types: [1, 2, 3], poker_types: [0], aof_type: 2 }
  }
  if (mode === 'AOF Texas') {
    return { game_types: [0], poker_types: [0], aof_type: 1 }
  }
  if (mode === 'AOF Omaha') {
    return { game_types: [1, 2, 3], poker_types: [0], aof_type: 1 }
  }
  return { game_types: [0], poker_types: [0], aof_type: 2 }
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

  personalCache.set(
    mode,
    personalRingMeta.map((item) => ({
      ...item,
      value: metricMap[item.key] ?? 0,
    })),
  )
}

function setOpponentCache(period: string, records: unknown): void {
  const list = Array.isArray(records) ? records : []
  const rows = list.map((item, index) => {
    const row = typeof item === 'object' && item ? (item as Record<string, unknown>) : {}
    return {
      id: String(row.user_id ?? index),
      name: String(row.nickname ?? '--'),
      avatar: typeof row.avatar === 'string' ? row.avatar : undefined,
      hands: toSafeNumber(row.hand_count),
      lose: toSafeNumber(row.loss_count),
      win: toSafeNumber(row.profit_count),
      profit: toSafeNumber(row.profit_total),
    }
  })
  opponentCache.set(period, rows)
}

function setAllInCache(mode: string, stats: Record<string, unknown>): void {
  const handCount = toSafeNumber(stats.hand_count)
  const winCount = toSafeNumber(stats.profit_count)
  const loseCount = toSafeNumber(stats.loss_count)
  const profit = toSafeNumber(stats.profit_total)

  const summary = [
    { label: '累计盈利', value: formatSigned(profit), highlight: 'up' as const },
    { label: 'All in', value: winCount.toLocaleString('en-US') },
    { label: '手数', value: handCount.toLocaleString('en-US') },
    { label: '获胜', value: winCount.toLocaleString('en-US') },
    { label: '失利', value: loseCount.toLocaleString('en-US') },
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
      label: '主动',
      rate: activeCount > 0 ? clampRate((activeProfitCount / activeCount) * 100) : 0,
      color: '#50a7ec',
    },
    {
      key: 'passive',
      label: '被动',
      rate: passiveCount > 0 ? clampRate((passiveProfitCount / passiveCount) * 100) : 0,
      color: '#fa2b4b',
    },
    {
      key: 'ahead',
      label: '领先',
      rate: aheadCount > 0 ? clampRate((aheadProfitCount / aheadCount) * 100) : 0,
      color: '#109657',
    },
    {
      key: 'behind',
      label: '落后',
      rate: behindCount > 0 ? clampRate((behindProfitCount / behindCount) * 100) : 0,
      color: '#b519d8',
    },
  ]

  allInCache.set(mode, { summary, rates })
}

function setDeckCache(mode: string, records: unknown): void {
  const list = Array.isArray(records) ? records : []
  const rows = list.map((item, index) => {
    const row = typeof item === 'object' && item ? (item as Record<string, unknown>) : {}
    const cards = parseDeckCards(row.hand_card_type)
    return {
      id: `${mode}-${index}`,
      cards,
      winCount: toSafeNumber(row.profit_count),
      totalHands: toSafeNumber(row.hand_count),
      winRate: clampRate(toSafeNumber(row.profit_ratio)),
      profit: toSafeNumber(row.profit_total),
    }
  })
  deckCache.set(mode, rows)
}

function applyCurrentPersonal(): void {
  personalRings.value =
    personalCache.get(selectedPersonalGame.value) ??
    personalRingMeta.map((item) => ({ ...item, value: 0 }))
}

function applyCurrentOpponent(): void {
  opponentRows.value = opponentCache.get(selectedOpponentPeriod.value) ?? []
}

function applyCurrentAllIn(): void {
  const value = allInCache.get(selectedAllInMode.value)
  allInSummary.value = value?.summary ?? [
    { label: '累计盈利', value: '0', highlight: 'up' as const },
    { label: 'All in', value: '0' },
    { label: '手数', value: '0' },
    { label: '获胜', value: '0' },
    { label: '失利', value: '0' },
  ]
  allInRateRows.value = value?.rates ?? [
    { key: 'active', label: '主动', rate: 0, color: '#50a7ec' },
    { key: 'passive', label: '被动', rate: 0, color: '#fa2b4b' },
    { key: 'ahead', label: '领先', rate: 0, color: '#109657' },
    { key: 'behind', label: '落后', rate: 0, color: '#b519d8' },
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
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载俱乐部数据失败')
    }
    return (response.data as Record<string, unknown>) || {}
  } catch (error) {
    if (!silent) {
      const message = error instanceof Error ? error.message : '加载俱乐部数据失败'
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

async function loadOpponent(period: string, silent = false): Promise<void> {
  if (opponentCache.has(period)) {
    return
  }
  const range = resolvePeriodRange(period)
  const payload = {
    api_list: [31],
    user_rival_room_stats_req: withClubId({
      gold_type: 1,
      order_type: 2,
      limit: 50,
      offset: 0,
      ...range,
    }),
  }
  const data = await requestCombine(payload, silent)
  if (!data) {
    return
  }
  const rivalResp = (data.user_rival_room_stats_resp ?? {}) as Record<string, unknown>
  setOpponentCache(period, rivalResp.records)
}

async function loadAllIn(mode: string, silent = false): Promise<void> {
  if (allInCache.has(mode)) {
    return
  }
  const range = resolvePeriodRange('历史')
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
  const range = resolvePeriodRange('历史')
  const modeConfig = resolveDeckMode(mode)
  const payload = {
    api_list: [33],
    user_card_type_room_stats_req: withClubId({
      gold_type: 1,
      order_type: 6,
      limit: 50,
      offset: 0,
      ...range,
      ...modeConfig,
    }),
  }
  const data = await requestCombine(payload, silent)
  if (!data) {
    return
  }
  const cardTypeResp = (data.user_card_type_room_stats_resp ?? {}) as Record<string, unknown>
  setDeckCache(mode, cardTypeResp.records)
}

async function loadInitial(): Promise<void> {
  loading.value = true
  try {
    const personalMode = selectedPersonalGame.value
    const opponentPeriod = selectedOpponentPeriod.value
    const allInMode = selectedAllInMode.value
    const deckMode = selectedDeckMode.value

    const payload = {
      api_list: [28, 31, 32, 33],
      stats_user_stats_req: withClubId({
        filter_type: 1,
        room_type: 0,
        time_type: 4,
        time_long: nowSeconds(),
        ...resolvePersonalMode(personalMode),
      }),
      user_rival_room_stats_req: withClubId({
        gold_type: 1,
        order_type: 2,
        limit: 50,
        offset: 0,
        ...resolvePeriodRange(opponentPeriod),
      }),
      user_allin_room_stats_req: withClubId({
        gold_type: 1,
        ...resolvePeriodRange('历史'),
        ...resolveAllInMode(allInMode),
      }),
      user_card_type_room_stats_req: withClubId({
        gold_type: 1,
        order_type: 6,
        limit: 50,
        offset: 0,
        ...resolvePeriodRange('历史'),
        ...resolveDeckMode(deckMode),
      }),
    }

    const data = await requestCombine(payload)
    if (!data) {
      return
    }

    const statsResp = (data.stats_user_stats_resp ?? {}) as Record<string, unknown>
    const roomData = (statsResp.room_data as Record<string, unknown>) ?? {}
    setPersonalCache(personalMode, roomData)

    const rivalResp = (data.user_rival_room_stats_resp ?? {}) as Record<string, unknown>
    setOpponentCache(opponentPeriod, rivalResp.records)

    const allInResp = (data.user_allin_room_stats_resp ?? {}) as Record<string, unknown>
    setAllInCache(allInMode, (allInResp.stats as Record<string, unknown>) ?? {})

    const cardTypeResp = (data.user_card_type_room_stats_resp ?? {}) as Record<string, unknown>
    setDeckCache(deckMode, cardTypeResp.records)

    applyCurrentPersonal()
    applyCurrentOpponent()
    applyCurrentAllIn()
    applyCurrentDeck()
  } finally {
    loading.value = false
  }
}

async function preloadAllTabs(): Promise<void> {
  const preloadTasks: Array<Promise<void>> = []

  for (const mode of personalGameTabs) {
    if (mode !== selectedPersonalGame.value) {
      preloadTasks.push(loadPersonal(mode, true))
    }
  }

  for (const period of opponentPeriodTabs) {
    if (period !== selectedOpponentPeriod.value) {
      preloadTasks.push(loadOpponent(period, true))
    }
  }

  for (const mode of allInModeTabs) {
    if (mode !== selectedAllInMode.value) {
      preloadTasks.push(loadAllIn(mode, true))
    }
  }

  for (const mode of deckModeTabs) {
    if (mode !== selectedDeckMode.value) {
      preloadTasks.push(loadDeck(mode, true))
    }
  }

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
    if (!opponentCache.has(selectedOpponentPeriod.value)) {
      loading.value = true
      await loadOpponent(selectedOpponentPeriod.value)
      loading.value = false
    }
    applyCurrentOpponent()
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

  if (!deckCache.has(selectedDeckMode.value)) {
    loading.value = true
    await loadDeck(selectedDeckMode.value)
    loading.value = false
  }
  applyCurrentDeck()
}

watch(selectedMainTab, () => {
  void ensureCurrentTabData()
  if (selectedMainTab.value === 'allin') {
    void nextTick(() => {
      scheduleRadarDraw()
    })
  }
})

watch(selectedPersonalGame, () => {
  void ensureCurrentTabData()
})

watch(selectedOpponentPeriod, () => {
  void ensureCurrentTabData()
})

watch(selectedAllInMode, () => {
  void ensureCurrentTabData()
})

watch(
  [allInRateRows, allInOverallRate],
  () => {
    if (selectedMainTab.value !== 'allin') {
      return
    }
    void nextTick(() => {
      scheduleRadarDraw()
    })
  },
  { deep: true },
)

watch(selectedDeckMode, () => {
  void ensureCurrentTabData()
})

onMounted(() => {
  window.addEventListener('resize', onWindowResize)

  void (async () => {
    await loadInitial()
    await nextTick()
    scheduleRadarDraw()
    void preloadAllTabs()
  })()
})

onBeforeUnmount(() => {
  clearRadarRaf()
  window.removeEventListener('resize', onWindowResize)
})
</script>

<template>
  <div class="page-shell club-data-page" :style="backgroundStyle">
    <HeaderBack :title="title" extra-padding />

    <div class="content-wrap">
      <p v-if="loading" class="panel-status">加载中...</p>
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
        <div class="segmented game-segmented">
          <button
            v-for="tab in personalGameTabs"
            :key="tab"
            type="button"
            class="segment"
            :class="{ active: selectedPersonalGame === tab }"
            @click="selectedPersonalGame = tab"
          >
            {{ tab }}
          </button>
        </div>

        <template v-if="personalHasData">
          <section class="ring-grid">
            <article v-for="ring in personalRings" :key="ring.key" class="ring-card">
              <van-circle
                class="ring-donut"
                :size="'1.92rem'"
                :rate="ring.value"
                :speed="100"
                :stroke-width="60"
                :color="ring.color"
                layer-color="rgba(255, 255, 255, 0.16)"
              >
                <div class="ring-inner">
                  <div class="ring-value">{{ ring.value }}%</div>
                  <div class="ring-label">{{ ring.label }}</div>
                </div>
              </van-circle>
            </article>
          </section>

          <section class="glass-pill title-pill">
            <span>近3个月内玩牌数据统计</span>
            <span class="pie-icon" aria-hidden="true"></span>
          </section>

          <section class="glass-card biggest-card">
            <div class="biggest-title">Possible Biggest Hand</div>
            <div class="card-row">
              <div class="poker-card">A ♣</div>
              <div class="poker-card red">J ♥</div>
              <div class="poker-card">10 ◆</div>
              <div class="poker-card back"></div>
              <div class="poker-card back"></div>
            </div>
          </section>
        </template>

        <template v-else>
          <section class="title-row">
            <div class="title-text">Statistics of the week</div>
            <button class="sort-btn" type="button">
              Descending
              <span class="arrow">▾</span>
            </button>
          </section>

          <section class="empty-wrap">
            <div class="empty-icon" aria-hidden="true">✕</div>
            <div class="empty-text">暂无数据</div>
          </section>
        </template>
      </template>

      <template v-else-if="selectedMainTab === 'opponent'">
        <div class="segmented period-segmented">
          <button
            v-for="tab in opponentPeriodTabs"
            :key="tab"
            type="button"
            class="segment"
            :class="{ active: selectedOpponentPeriod === tab }"
            @click="selectedOpponentPeriod = tab"
          >
            {{ tab }}
          </button>
        </div>

        <section class="title-row">
          <div class="title-text">Statistics of the week</div>
          <button class="sort-btn" type="button">
            Descending
            <span class="arrow">▾</span>
          </button>
        </section>

        <section class="glass-card table-card">
          <header class="table-head">
            <span>玩家</span>
            <span>手数</span>
            <span>负</span>
            <span>胜</span>
            <span>盈利</span>
          </header>

          <article v-for="row in opponentRows" :key="row.id" class="table-row">
            <div class="player-cell">
              <span
                class="avatar"
                :style="row.avatar ? { backgroundImage: `url(${row.avatar})` } : undefined"
                aria-hidden="true"
              ></span>
              <span class="name">{{ row.name }}</span>
            </div>
            <span>{{ row.hands }}</span>
            <span>{{ row.lose }}</span>
            <span>{{ row.win }}</span>
            <span :class="profitClass(row.profit)">{{ formatProfit(row.profit) }}</span>
          </article>
        </section>
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
            <span class="pie-icon" aria-hidden="true"></span>
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
            <span class="pie-icon" aria-hidden="true"></span>
          </div>

          <div ref="radarWrapRef" class="allin-radar-wrap">
            <canvas ref="radarCanvasRef" class="allin-radar-canvas"></canvas>

            <div class="radar-badge radar-badge-top">
              <span class="badge-label">rate</span>
              <span class="badge-rate">{{ allInOverallRate }}%</span>
            </div>
            <div class="radar-badge radar-badge-left">
              <span class="badge-label">Passive</span>
              <span class="badge-rate">{{ passiveRate }}%</span>
            </div>
            <div class="radar-badge radar-badge-right">
              <span class="badge-label">Backward</span>
              <span class="badge-rate">{{ backwardRate }}%</span>
            </div>
            <div class="radar-badge radar-badge-bottom">
              <span class="badge-label">Leading</span>
              <span class="badge-rate">{{ leadingRate }}%</span>
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

        <section class="glass-card table-card deck-table-card">
          <header class="table-head deck-head">
            <span>hand type</span>
            <span>获胜</span>
            <span class="sortable-head">
              总手数
              <span class="sort-caret" aria-hidden="true"></span>
            </span>
            <span class="sortable-head">
              胜率
              <span class="sort-caret" aria-hidden="true"></span>
            </span>
            <span>盈利</span>
          </header>

          <article v-for="row in deckRows" :key="row.id" class="table-row deck-row">
            <div class="deck-hand-cell">
              <div class="mini-card">
                <span class="rank">{{ row.cards[0].slice(0, -1) }}</span>
                <span class="suit">{{ row.cards[0].slice(-1) }}</span>
              </div>
              <div class="mini-card red">
                <span class="rank">{{ row.cards[1].slice(0, -1) }}</span>
                <span class="suit">{{ row.cards[1].slice(-1) }}</span>
              </div>
            </div>
            <span>{{ row.winCount }}</span>
            <span>{{ row.totalHands }}</span>
            <span>{{ row.winRate }}</span>
            <span :class="profitClass(row.profit)">{{ formatProfit(row.profit) }}</span>
          </article>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-data-page {
  position: relative;
  height: 100dvh;
  padding: 0 0 0.72rem;
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

  &.active {
    color: #fff;
    font-weight: 600;
    border-bottom: 0.03rem solid rgba(249, 249, 249, 0.95);
  }
}

.segmented {
  margin-top: 0.34rem;
  border-radius: 0.56rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.06rem;
  display: grid;
  gap: 0.06rem;
}

.game-segmented,
.period-segmented {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.segment {
  border: 0;
  border-radius: 0.52rem;
  background: transparent;
  color: #f9f9f9;
  font-size: 0.42rem;
  padding: 0.2rem 0;

  &.active {
    background: rgba(255, 255, 255, 0.16);
    border: 0.02rem solid rgba(249, 249, 249, 0.9);
    font-weight: 700;
  }
}

.glass-card {
  border-radius: 0.42rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.15);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.06rem);
}

.glass-pill {
  border-radius: 0.4rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.12);
  background: rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(0.06rem);
}

.ring-grid {
  margin-top: 0.3rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.3rem 0.34rem;
}

.ring-card {
  display: flex;
  justify-content: center;
}

.ring-donut {
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0.06rem 0.18rem rgba(0, 0, 0, 0.2);
}

.ring-inner {
  width: 1.34rem;
  height: 1.34rem;
  border-radius: 9999px;
  background: rgba(116, 90, 116, 0.52);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-value {
  font-size: 0.36rem;
  font-weight: 700;
  line-height: 1.1;
}

.ring-label {
  margin-top: 0.05rem;
  font-size: 0.18rem;
  line-height: 1.1;
  color: rgba(249, 249, 249, 0.86);
}

.title-pill {
  margin-top: 0.28rem;
  padding: 0.25rem 0.42rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.42rem;
  font-weight: 600;
}

.pie-icon {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  border: 0.04rem solid rgba(249, 249, 249, 0.95);
  border-right-color: transparent;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    width: 0.24rem;
    height: 0.04rem;
    background: rgba(249, 249, 249, 0.95);
    top: 0.18rem;
    right: -0.02rem;
    transform: rotate(-34deg);
    border-radius: 0.03rem;
  }
}

.biggest-card {
  margin-top: 0.24rem;
  padding: 0.3rem 0.35rem 0.36rem;
}

.biggest-title {
  text-align: center;
  font-size: 0.44rem;
  color: rgba(249, 249, 249, 0.72);
  font-weight: 600;
}

.card-row {
  margin-top: 0.24rem;
  display: flex;
  justify-content: center;
  gap: 0.08rem;
}

.poker-card {
  width: 0.76rem;
  height: 1.1rem;
  border-radius: 0.12rem;
  background: #fff;
  color: #1a1a1a;
  font-size: 0.28rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;

  &.red {
    color: #fa2b4b;
  }

  &.back {
    background: repeating-linear-gradient(
      45deg,
      #30b6ff 0,
      #30b6ff 0.08rem,
      #2f86e7 0.08rem,
      #2f86e7 0.16rem
    );
    border: 0.02rem solid rgba(249, 249, 249, 0.28);
    box-shadow: inset 0 0 0 0.02rem rgba(255, 255, 255, 0.24);
  }
}

.title-row {
  margin-top: 0.46rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-text {
  font-size: 0.46rem;
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

  .arrow {
    font-size: 0.24rem;
    line-height: 1;
  }
}

.empty-wrap {
  margin-top: 3.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon {
  width: 0.98rem;
  height: 1.08rem;
  border: 0.1rem solid rgba(249, 249, 249, 0.65);
  border-radius: 0.24rem;
  clip-path: polygon(50% 0, 100% 18%, 100% 80%, 50% 100%, 0 80%, 0 18%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(249, 249, 249, 0.75);
  font-size: 0.42rem;
  line-height: 1;
}

.empty-text {
  margin-top: 0.18rem;
  font-size: 0.42rem;
  color: rgba(249, 249, 249, 0.9);
}

.table-card {
  margin-top: 0.22rem;
  padding: 0.2rem 0.22rem 0.12rem;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 1.55fr repeat(4, 1fr);
  align-items: center;
}

.table-head {
  border-radius: 0.46rem;
  background: rgba(255, 255, 255, 0.2);
  min-height: 0.9rem;
  padding: 0 0.2rem;
  font-size: 0.28rem;
  font-weight: 600;
}

.table-row {
  min-height: 1.05rem;
  padding: 0 0.2rem;
  font-size: 0.32rem;
  border-bottom: 0.02rem solid rgba(249, 249, 249, 0.11);

  &:last-child {
    border-bottom: 0;
  }
}

.player-cell {
  display: flex;
  align-items: center;
  gap: 0.12rem;
}

.avatar {
  width: 0.48rem;
  height: 0.48rem;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 28%, #ffd8b6 0%, #c88145 42%, #5e3a26 100%);
  border: 0.02rem solid rgba(249, 249, 249, 0.34);
}

.name {
  font-size: 0.31rem;
}

.profit-up {
  color: #ff2748;
  font-weight: 600;
}

.profit-down {
  color: #05e7ae;
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

  &.active {
    background: rgba(5, 231, 174, 0.6);
    font-weight: 600;
  }
}

.section-title {
  margin-top: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.4rem;
  font-weight: 600;
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

.allin-summary-card .pie-icon,
.radar-card .pie-icon {
  width: 0.613rem;
  height: 0.613rem;
  border-width: 0.035rem;

  &::after {
    width: 0.27rem;
    height: 0.03rem;
    top: 0.24rem;
  }
}

.allin-radar-wrap {
  position: relative;
  margin-top: 0.26rem;
  height: 6.75rem;
}

.allin-radar-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
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
  bottom: 0.24rem;
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
    background: rgba(5, 231, 174, 0.6);
    color: #fff;
    font-weight: 600;
  }
}

.deck-title {
  margin-top: 0.28rem;
  font-size: 0.34rem;
  line-height: 1.2;
  font-weight: 500;
}

.deck-table-card {
  margin-top: 0.24rem;
  border-radius: 0.67rem;
  padding: 0.36rem 0.36rem 0.24rem;
  max-height: 9.15rem;
  overflow: auto;
}

.deck-head,
.deck-row {
  grid-template-columns: 1.85fr 0.8fr 1fr 0.8fr 1fr;
}

.deck-head {
  min-height: 0.96rem;
  border-radius: 0.72rem;
  font-size: 0.3rem;
  padding: 0 0.24rem;
}

.deck-row {
  min-height: 1rem;
  padding: 0 0.24rem;
  border-bottom: 0.01rem solid rgba(249, 249, 249, 0.2);
  font-size: 0.28rem;

  &:last-child {
    border-bottom: 0;
  }
}

.sortable-head {
  display: inline-flex;
  align-items: center;
  gap: 0.06rem;
}

.sort-caret {
  width: 0;
  height: 0;
  border-left: 0.06rem solid transparent;
  border-right: 0.06rem solid transparent;
  border-top: 0.1rem solid rgba(249, 249, 249, 0.92);
}

.deck-hand-cell {
  display: flex;
  align-items: center;
  gap: 0.08rem;
}

.mini-card {
  width: 0.62rem;
  height: 0.9rem;
  border-radius: 0.1rem;
  border: 0.01rem solid rgba(20, 44, 69, 0.28);
  box-shadow: inset 0 0 0 0.01rem rgba(255, 255, 255, 0.35);
  background-size: cover;
  background-position: center;
  background: linear-gradient(170deg, #ffffff 0%, #f1f6ff 100%);
  color: #111;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 0.04rem 0.06rem;

  .rank {
    font-size: 0.17rem;
    line-height: 1;
    font-weight: 700;
  }

  .suit {
    margin-top: 0.03rem;
    font-size: 0.15rem;
    line-height: 1;
    font-weight: 700;
  }

  &.red {
    color: #fa2b4b;
  }
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
