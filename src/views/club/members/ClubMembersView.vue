<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast, showSuccessToast } from 'vant'
import { formatUC } from '@/utils/roomVisibility'
import {
  postClubFundChangeLogApi,
  postOrgClubCreditBalanceApi,
  postOrgClubCreditLimitApi,
  postOrgClubGoldApi,
  postOrgClubSearchByIdApi,
  postOrgMemberListApi,
} from '@/api/org'
import { postGuildGiveRecycleApi } from '@/api/order'
import { postClubSendDiamondsApi } from '@/api/user'
import type {
  ClubFundChangeLogRecord,
  OrgClubGoldData,
  OrgMemberListRecord,
} from '@/api/models/org'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import DateRangePicker from '@/components/DateRangePicker/DateRangePicker.vue'
import imgAvatar from '@/assets/images/default_avatar_for_club.png'
import imgDiamond from '@/assets/icons/ic_diamond_shadow.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgBalance from '@/assets/icons/icon_chip_green.png'
import icTimeRefresh from '@/assets/icons/ic_time_refresh.png'
import icSearch from '@/assets/icons/ic_search.svg'
import backspaceIcon from '@/assets/icons/backspace_figma.svg'
import icUserShadow from '@/assets/icons/ic_user_shadow.png'
import icJackpotChecked from '@/assets/icons/ic_jackpot_checked.svg'
import { useUserInfoStore } from '@/stores/userInfo'
import { useGameStore } from '@/stores/game'
import { USER_STORE_CLUB_MANAGE } from '@/utils/indexedDB'
import { toPlain, userCache } from '@/utils/userCache'
import { t, tJoin } from '@/i18n'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.webp'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--club-members-bg-dark': `url(${mainBgUrl})`,
  '--club-members-bg-light': `url(${mainBgLightUrl})`,
}))

type TabKey = 'account' | 'record'
type MemberRole = string
type MemberIdentity = 'founder' | 'admin' | 'agent' | 'player'
type FundAssetTab = 'coin' | 'quota' | 'diamond'
type FundActionTab = 'grant' | 'recycle'
type QuotaEditField = 'disposable' | 'review'
type QuotaAdjustMode = 'increase' | 'decrease'

interface SummaryItem {
  label: string
  value: number
  icon: 'diamond' | 'chips' | 'balance'
}

interface MemberItem {
  id: number
  name: string
  uid: string
  role: MemberRole
  identityType: MemberIdentity
  isBoundAgent: boolean
  avatar: string
  diamond: number
  uc: number
  disposableCredit: number
  reviewCredit: number
  freeLimit: string
  agentName: string
}

type RecordRangeKey = 'today' | 'seven' | 'thirty' | 'custom'

interface RecordRangeItem {
  key: RecordRangeKey
  label: string
}

interface RecordStatItem {
  id: number
  label: string
  value: string
}

interface FundRecordItem {
  id: number
  date: string
  time: string
  opCode: string
  type: string
  quantity: string
  balance: string
  remark: string
  remarkId: string
  showFromTag: boolean
  fromName?: string
  fromId?: string
}

interface RecordTypeOption {
  key: string
  textKey: string
  fallbackText: string
  opCodes?: string[] | null
}

const router = useRouter()
const userInfoStore = useUserInfoStore()
const gameStore = useGameStore()
const activeTab = ref<TabKey>('account')
const searchKeyword = ref('')
const activeRange = ref<RecordRangeKey>('today')
const selectedRecordType = ref('all')
const showTypeMenu = ref(false)
const recordOrderType = ref<1 | 2>(2)
const isDatePickerVisible = ref(false)
const customEndDate = ref(startOfDay(new Date()))
const customStartDate = ref(startOfDay(addDays(customEndDate.value, -6)))
const minSelectableDate = startOfDay(addMonths(new Date(), -3))
const maxSelectableDate = endOfDay(new Date())
const recordListRef = ref<HTMLElement | null>(null)
const showFundSheet = ref(false)
const activeMember = ref<MemberItem | null>(null)
const fundAssetTab = ref<FundAssetTab>('coin')
const fundActionTab = ref<FundActionTab>('grant')
const fundAmountInput = ref('')
const quotaEditField = ref<QuotaEditField | null>(null)
const quotaAdjustMode = ref<QuotaAdjustMode>('increase')
const quotaInput = ref('')
const disposableQuota = ref(0)
const reviewQuota = ref(0)
const loadingMembers = ref(false)
const loadingMoreMembers = ref(false)
const hasMoreMembers = ref(true)
const membersOffset = ref(0)
const membersTotal = ref(0)
const clubMemberTotal = ref<number | null>(null)
const memberListTotalGold = ref(0)
const clubGoldSummary = ref<OrgClubGoldData | null>(null)
const loadingClubGold = ref(false)
const recordOffset = ref(0)
const hasMoreRecords = ref(true)
const loadingRecords = ref(false)
const loadingMoreRecords = ref(false)
const recordsTotal = ref(0)
const grantAmountTotal = ref(0)
const recoverAmountTotal = ref(0)
const profitAmountTotal = ref(0)
const changeAmountTotal = ref(0)
const submittingFund = ref(false)

const PAGE_SIZE = 20

// club_manage 缓存：二次进入先渲染上次结果，再静默刷新覆盖（key 约定见 utils/indexedDB.ts）。
// 列表连同 offset/hasMore/统计一起存，触底加载后回写累计结果（更新而非覆盖）。
interface CachedMemberList {
  items: MemberItem[]
  total: number
  totalGold: number
  offset: number
  hasMore: boolean
}

interface CachedFundRecords {
  items: FundRecordItem[]
  offset: number
  hasMore: boolean
  total: number
  grantAmount: number
  recoverAmount: number
  profitAmount: number
  changeAmount: number
}

// 静默刷新在飞标记：期间列表展示的是缓存、offset 还未重算，须挡住触底加载防止重复拼页。
let silentMembersRefreshing = false
let silentRecordsRefreshing = false

function clubManageCache() {
  return userCache(gameStore.loginUserId)
}

function fundClubId(): number {
  return toSafeNumber(userInfoStore.currentClub?.club_id)
}

function fundSummaryCacheKey(): string {
  return `${fundClubId()}_fund_summary`
}

function fundMembersCacheKey(): string {
  return `${fundClubId()}_fund_members`
}

function fundRecordsCacheKey(): string {
  const customRangeKey =
    activeRange.value === 'custom'
      ? `_${customStartDate.value.getTime()}_${customEndDate.value.getTime()}`
      : ''
  return `${fundClubId()}_fund_records_${activeRange.value}_${selectedRecordType.value}_${recordOrderType.value}${customRangeKey}`
}

const currentFundBalanceText = computed(() => {
  if (!activeMember.value) {
    return '0'
  }

  if (fundAssetTab.value === 'diamond') {
    return formatCount(activeMember.value.diamond)
  }

  return formatUC(activeMember.value.uc)
})

const currentInputText = computed(() => {
  if (fundAssetTab.value === 'quota' && quotaEditField.value) {
    return quotaInput.value || t('UI_PleaseInputInteger')
  }

  return fundAmountInput.value || t('UIGuildMemberOperationGiveNumber')
})

const fundSubmitLabel = computed(() =>
  fundActionTab.value === 'grant'
    ? t('UIClub_FundDetail_5iSXE2Uj')
    : t('UIClub_FundDetail_recycle'),
)
const isFounderOfCurrentClub = computed(
  () => toSafeNumber(userInfoStore.currentClub?.user_level) === 1,
)
const shouldShowCoinFundTab = computed(() => toSafeNumber(userInfoStore.currentClub?.tribe_id) > 0)
const shouldShowDiamondFundTab = computed(() => isFounderOfCurrentClub.value)
const availableFundAssetTabs = computed<FundAssetTab[]>(() => {
  const tabs: FundAssetTab[] = []
  if (shouldShowCoinFundTab.value) {
    tabs.push('coin')
  }
  tabs.push('quota')
  if (shouldShowDiamondFundTab.value) {
    tabs.push('diamond')
  }
  return tabs
})
const members = ref<MemberItem[]>([])

const memberTotalText = computed(() => {
  const cachedTotal = toSafeNumber(userInfoStore.currentClub?.club_members)
  const total = clubMemberTotal.value ?? (cachedTotal || members.value.length)
  const upperLimit = toSafeNumber(userInfoStore.currentClub?.upper_limit)

  if (upperLimit > 0) {
    return `${total}/${upperLimit}`
  }

  return String(total)
})

const clubFundSummary = computed(() => {
  const club = userInfoStore.currentClub as Record<string, unknown> | null
  const clubFund = clubGoldSummary.value as Record<string, unknown> | null
  const membersUcTotal = members.value.reduce((sum, item) => sum + item.uc, 0)
  const membersCreditLimitTotal = members.value.reduce((sum, item) => sum + item.reviewCredit, 0)

  return {
    clubBalance: pickNumber(
      clubFund,
      ['gold', 'club_gold'],
      pickNumber(club, ['club_gold', 'gold', 'user_gold', 'total_gold'], memberListTotalGold.value),
    ),
    membersTableBalance: pickNumber(
      clubFund,
      ['members_table_gold'],
      pickNumber(club, ['members_table_gold'], 0),
    ),
    membersTotalBalance: pickNumber(
      clubFund,
      ['members_gold'],
      pickNumber(club, ['members_gold'], membersUcTotal),
    ),
    membersCreditLimit: pickNumber(
      clubFund,
      ['club_credit_limit_total', 'club_gold_credit_limit_total'],
      pickNumber(
        club,
        ['club_credit_limit_total', 'club_gold_credit_limit_total', 'members_credit_limit_total'],
        membersCreditLimitTotal,
      ),
    ),
    clubDiamond: pickNumber(
      clubFund,
      ['diamond', 'diamonds'],
      pickNumber(club, ['diamond', 'diamonds'], 0),
    ),
  }
})

const summaryTop = computed<SummaryItem[]>(() => [
  { label: t('UIClub_Club4'), value: clubFundSummary.value.clubBalance, icon: 'chips' },
  {
    label: t('UIClub_FundDetail_TableBalance'),
    value: clubFundSummary.value.membersTableBalance,
    icon: 'chips',
  },
  {
    label: t('UIClub_FundDetail_OverallBalance'),
    value: clubFundSummary.value.membersTotalBalance,
    icon: 'chips',
  },
])

const summaryBottom = computed<SummaryItem[]>(() => [
  { label: t('UIClub_Member2'), value: clubFundSummary.value.membersCreditLimit, icon: 'balance' },
  {
    label: t('UIClub_FundDetail_ClubDiamond'),
    value: clubFundSummary.value.clubDiamond,
    icon: 'diamond',
  },
])

const recordRanges: RecordRangeItem[] = [
  { key: 'today', label: t('UIData_Today') },
  { key: 'seven', label: tJoin(7, t('UIHappyShop_ActivityShopDay')) },
  { key: 'thirty', label: tJoin(30, t('UIHappyShop_ActivityShopDay')) },
  { key: 'custom', label: t('UIGuild_MemberDetailsTimeCustom') },
]

const recordStats = computed<RecordStatItem[]>(() => [
  { id: 1, label: t('UIClub_FundDetail_5iSXE2Uj'), value: formatUC(grantAmountTotal.value) },
  { id: 2, label: t('UIClub_FundDetail_recycle'), value: formatUC(recoverAmountTotal.value) },
  { id: 3, label: t('UIClub_Text28'), value: formatUC(profitAmountTotal.value) },
])

const recordTypeOptions: RecordTypeOption[] = [
  { key: 'all', textKey: 'adaptation10123', fallbackText: t('adaptation10123'), opCodes: null },
  {
    key: 'grant',
    textKey: 'UIClub_FundGive',
    fallbackText: t('UIClub_FundDetail_5iSXE2Uj'),
    opCodes: ['CLUBTOUSER', 'PAYUSER'],
  },
  {
    key: 'recycle',
    textKey: 'UIClub_FundDetail_recycle',
    fallbackText: t('UIClub_FundDetail_recycle'),
    opCodes: ['CLUBRECOVEUSER', 'TAKEOVER'],
  },
  {
    key: 'room_service_fee',
    textKey: 'UIGuildClubRoomFee',
    fallbackText: t('UIGuildClubRoomFee'),
    opCodes: ['PFTROOM', 'PFTINSUR'],
  },
  {
    key: 'deposit',
    textKey: 'UIGuildClubManagerDepositsTip',
    fallbackText: t('UIGuildClubManagerDepositsTip'),
    opCodes: ['TRIBETOCLUB', 'RECHARGE', 'RECHGTRB'],
  },
  {
    key: 'withdraw',
    textKey: 'UIGuildClubManagerWithdrawTip',
    fallbackText: t('UIGuildClubManagerWithdrawTip'),
    opCodes: ['TRIBERECOVECLUB'],
  },
  {
    key: 'mtt_service_fee',
    textKey: 'UIGuildClubMTTFee',
    fallbackText: 'MTT' + t('UIMine_WalletPlatform_fee_f'),
    opCodes: ['PFTMTT'],
  },
  {
    key: 'insurance_income',
    textKey: 'UIGuildClubInsuranceIncome',
    fallbackText: t('UIGuildClubInsuranceIncome'),
    opCodes: ['INSURIN', 'INSUROUT'],
  },
  {
    key: 'deposit_detail',
    textKey: 'UIGuildClubDepositFee',
    fallbackText: t('UIGuildClubDepositFee'),
    opCodes: ['DEPOSITADV', 'DEPOSITRTN'],
  },
  {
    key: 'player_profit_deduct',
    textKey: 'UIGuildClubPlayerProfitDeduction',
    fallbackText: t('UIGuildClubPlayerProfitDeduction'),
    opCodes: ['USERDEDUCTROOM'],
  },
  {
    key: 'sng_service_fee',
    textKey: 'UISNGFee',
    fallbackText: 'SNG' + t('UIMine_WalletPlatform_fee_f'),
    opCodes: ['PFTSNG'],
  },
  {
    key: 'club_balance_out',
    textKey: 'UIGuildClubAccountOut',
    fallbackText: t('UIClub_Union2'),
    opCodes: ['TRIBEBALCLUB', 'CLUBBALUSER'],
  },
  {
    key: 'tribe_grant',
    textKey: 'UIAllianceRelease',
    fallbackText: t('UIClub_league_issue'),
    opCodes: ['TRIBETOCLUB'],
  },
  {
    key: 'cowboy_income',
    textKey: 'UIGuildClubDetailsCowboyTip',
    fallbackText: t('UIGuildClubDetailsCowboyTip'),
    opCodes: ['PFTCBIN'],
  },
  {
    key: 'cowboy_compensation',
    textKey: 'UINiuZaiPFTCBOUT',
    fallbackText: t('UINiuZaiPFTCBOUT'),
    opCodes: ['PFTCBOUT'],
  },
  {
    key: 'prop_exchange',
    textKey: 'UIPropExchangeDes',
    fallbackText: t('UIPropExchangeDes'),
    opCodes: ['WHEELAWARD'],
  },
  {
    key: 'mahjong_mtt_fee',
    textKey: 'UIMahjongMTT12',
    fallbackText: t('Mahjong_Name') + 'MTT' + t('UIMine_WalletPlatform_fee_f'),
    opCodes: ['MJPFTMTT'],
  },
  {
    key: 'other',
    textKey: 'UIChatReport008',
    fallbackText: t('Complanin007'),
    opCodes: ['OTHER'],
  },
]

const recordRows = ref<FundRecordItem[]>([])

function formatCount(value: number): string {
  return value.toLocaleString('en-US')
}

function toSafeNumber(value: unknown): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function pickNumber(source: Record<string, unknown> | null, keys: string[], fallback = 0): number {
  if (!source) {
    return fallback
  }

  for (const key of keys) {
    const raw = source[key]
    if (raw === undefined || raw === null || raw === '') {
      continue
    }

    const parsed = Number(raw)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function formatSignedFenAmount(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return '0'
  }

  const absText = formatUC(Math.abs(value))
  return value > 0 ? `+${absText}` : `-${absText}`
}

function resolveRecordRange(): { start_time?: number; end_time?: number } {
  const now = new Date()
  const endTime = Math.floor(now.getTime() / 1000)

  if (activeRange.value === 'today') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    return { start_time: Math.floor(start.getTime() / 1000), end_time: endTime }
  }

  if (activeRange.value === 'seven') {
    const start = endTime - 7 * 24 * 60 * 60
    return { start_time: start, end_time: endTime }
  }

  if (activeRange.value === 'thirty') {
    const start = endTime - 30 * 24 * 60 * 60
    return { start_time: start, end_time: endTime }
  }

  if (activeRange.value === 'custom') {
    return {
      start_time: Math.floor(startOfDay(customStartDate.value).getTime() / 1000),
      end_time: Math.min(
        Math.floor(endOfDay(customEndDate.value).getTime() / 1000),
        Math.floor(Date.now() / 1000),
      ),
    }
  }

  return {}
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function addDays(date: Date, days: number): Date {
  const value = new Date(date)
  value.setDate(value.getDate() + days)
  return value
}

function addMonths(date: Date, months: number): Date {
  const value = new Date(date)
  value.setMonth(value.getMonth() + months)
  return value
}

function getSelectedRecordOpCodes(): string[] | undefined {
  const selected = recordTypeOptions.find((item) => item.key === selectedRecordType.value)
  if (!selected?.opCodes?.length) {
    return undefined
  }
  return selected.opCodes
}

function resolveRecordTypeLabel(option: RecordTypeOption): string {
  const text = t(option.textKey)
  if (text && text !== option.textKey) {
    return text
  }
  return option.fallbackText
}

function splitDateTime(value?: string): { time: string; date: string } {
  const raw = String(value || '').trim()
  if (!raw) {
    return { time: '--', date: '--' }
  }

  const date = new Date(raw)
  if (!Number.isNaN(date.getTime())) {
    return {
      date: date.toLocaleDateString('zh-CN'),
      time: date.toLocaleTimeString('zh-CN', { hour12: false }),
    }
  }

  const normalized = raw.replace('T', ' ')
  const [datePart = '--', timePart = '--'] = normalized.split(' ')
  const simpleTime = timePart.split('.')[0].replace('Z', '') || '--'
  return { date: datePart, time: simpleTime }
}

function pickFirstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value ?? '').trim()
    if (text) {
      return text
    }
  }
  return ''
}

function mapFundRecord(record: ClubFundChangeLogRecord, index: number): FundRecordItem {
  const dateTime = splitDateTime(record.create_time)
  const opCode = String(record.op_code || '')
    .trim()
    .toUpperCase()
  const opCodeText = resolveFundTypeText(opCode)
  const remarkName =
    pickFirstNonEmpty(
      record.op_nick_name,
      record.src_nick_name,
      (record as Record<string, unknown>).nick_name,
      record.name,
      record.user_nick_name,
    ) || '--'
  const remarkId =
    pickFirstNonEmpty(
      record.op_random_id,
      record.src_random_id,
      record.user_random_num,
      (record as Record<string, unknown>).random_num,
    ) || '--'
  const balance = toSafeNumber(record.gold_after)
  const quantity = toSafeNumber(record.gold_change)
  const isPftRoom = opCode === 'PFTROOM'
  const fromName = isPftRoom ? String(record.user_nick_name || '').trim() : ''
  const fromId = isPftRoom ? String(record.user_random_num || '').trim() : ''

  return {
    id: index,
    date: dateTime.date,
    time: dateTime.time,
    opCode,
    type: opCodeText || opCode || t('ServerErrorCode_90002'),
    quantity: formatSignedFenAmount(quantity),
    balance: formatUC(balance),
    remark: remarkName,
    remarkId,
    showFromTag: Boolean(isPftRoom && fromName && fromId),
    fromName: fromName || undefined,
    fromId: fromId || undefined,
  }
}

function resolveFundTypeText(opCode: string): string {
  const currentType = recordTypeOptions.find((item) => item.key === selectedRecordType.value)
  if (currentType && currentType.key !== 'all') {
    return resolveRecordTypeLabel(currentType)
  }

  const matched = recordTypeOptions.find(
    (item) => item.key !== 'all' && item.opCodes?.includes(opCode),
  )
  if (matched) {
    return resolveRecordTypeLabel(matched)
  }

  const otherType = recordTypeOptions.find((item) => item.key === 'other')
  return otherType ? resolveRecordTypeLabel(otherType) : opCode || t('ServerErrorCode_90002')
}

function patchActiveMemberOnList(): void {
  if (!activeMember.value) {
    return
  }

  const index = members.value.findIndex((item) => item.id === activeMember.value?.id)
  if (index < 0) {
    return
  }

  const nextMembers = [...members.value]
  nextMembers[index] = {
    ...nextMembers[index],
    ...activeMember.value,
    freeLimit: `${formatUC(activeMember.value.disposableCredit)}/${formatUC(activeMember.value.reviewCredit)}`,
  }
  members.value = nextMembers
}

async function fetchClubGoldSummary(silent = false): Promise<void> {
  if (loadingClubGold.value) {
    return
  }

  const currentClub = userInfoStore.currentClub
  if (!currentClub?.random_id) {
    clubGoldSummary.value = null
    return
  }

  loadingClubGold.value = true
  try {
    const response = await postOrgClubGoldApi({
      club_random_id: currentClub.random_id,
    })

    if (response.code !== 0 || !response.data) {
      throw new Error(
        typeof response.msg === 'string' ? response.msg : t('UIClub_FetchClubFundFail'),
      )
    }

    clubGoldSummary.value = response.data
    void clubManageCache().put(USER_STORE_CLUB_MANAGE, fundSummaryCacheKey(), response.data)
  } catch (error) {
    // 静默刷新失败保留缓存展示，不打断用户。
    if (!silent) {
      clubGoldSummary.value = null
      const message = error instanceof Error ? error.message : t('UIClub_FetchClubFundFail')
      showFailToast(message)
    }
  } finally {
    loadingClubGold.value = false
  }
}

async function refreshClubCapacity(): Promise<void> {
  const currentClub = userInfoStore.currentClub
  if (!currentClub?.random_id) {
    return
  }

  try {
    const response = await postOrgClubSearchByIdApi({
      club_random_id: currentClub.random_id,
    })
    const upperLimit = Number(response.data?.upper_limit)
    if (response.code === 0 && Number.isFinite(upperLimit) && upperLimit >= 0) {
      userInfoStore.syncCurrentClubFields({ upper_limit: upperLimit })
    }
  } catch (error) {
    // 上限刷新失败时保留列表缓存值，成员列表仍可正常使用。
    console.error('refreshClubCapacity error', error)
  }
}

async function fetchRecordRows(reset = false, silent = false): Promise<void> {
  if (loadingRecords.value || loadingMoreRecords.value || silentRecordsRefreshing) {
    return
  }

  if (!reset && !hasMoreRecords.value) {
    return
  }

  const currentClub = userInfoStore.currentClub
  if (!currentClub?.random_id) {
    if (reset && !silent) {
      recordRows.value = []
      hasMoreRecords.value = false
      recordsTotal.value = 0
    }
    return
  }

  if (reset) {
    // 静默刷新期间缓存仍在展示，offset/hasMore 等成功后一并重算。
    if (silent) {
      silentRecordsRefreshing = true
    } else {
      loadingRecords.value = true
      recordOffset.value = 0
      hasMoreRecords.value = true
    }
  } else {
    loadingMoreRecords.value = true
  }

  const cacheKey = fundRecordsCacheKey()

  try {
    const currentOffset = reset ? 0 : recordOffset.value
    const rangePayload = resolveRecordRange()
    const response = await postClubFundChangeLogApi({
      club_random_id: currentClub.random_id,
      limit: PAGE_SIZE,
      offset: currentOffset,
      gold_type: 1,
      op_codes: getSelectedRecordOpCodes(),
      sort_type: 1,
      order_type: recordOrderType.value,
      ...rangePayload,
    })

    if (response.code !== 0 || !response.data) {
      throw new Error(
        typeof response.msg === 'string' ? response.msg : t('UIClub_FetchFundRecordFail'),
      )
    }

    // 响应回来时已切换时间/类型筛选 → 丢弃，避免覆盖新筛选的数据/缓存。
    if (cacheKey !== fundRecordsCacheKey()) {
      return
    }

    const rawRows = Array.isArray(response.data.list) ? response.data.list : []
    const nextRows = rawRows.map((item, index) => mapFundRecord(item, currentOffset + index + 1))

    recordRows.value = reset ? nextRows : [...recordRows.value, ...nextRows]
    recordOffset.value = currentOffset + rawRows.length

    const total = toSafeNumber(response.data.total)
    recordsTotal.value = total
    grantAmountTotal.value = toSafeNumber(response.data.total_info?.grant_amount)
    recoverAmountTotal.value = toSafeNumber(response.data.total_info?.recover_amount)
    profitAmountTotal.value = toSafeNumber(response.data.total_info?.profit_amount)
    changeAmountTotal.value = toSafeNumber(response.data.total_info?.change_amount)

    if (total > 0) {
      hasMoreRecords.value = recordOffset.value < total
    } else {
      hasMoreRecords.value = rawRows.length >= PAGE_SIZE
    }

    // 触底加载写回的是累计后的完整列表（更新而非覆盖）。
    void clubManageCache().put(
      USER_STORE_CLUB_MANAGE,
      cacheKey,
      toPlain({
        items: recordRows.value,
        offset: recordOffset.value,
        hasMore: hasMoreRecords.value,
        total: recordsTotal.value,
        grantAmount: grantAmountTotal.value,
        recoverAmount: recoverAmountTotal.value,
        profitAmount: profitAmountTotal.value,
        changeAmount: changeAmountTotal.value,
      } satisfies CachedFundRecords),
    )
  } catch (error) {
    if (silent) {
      return
    }
    if (reset) {
      recordRows.value = []
      hasMoreRecords.value = false
      recordsTotal.value = 0
    }
    const message = error instanceof Error ? error.message : t('UIClub_FetchFundRecordFail')
    showFailToast(message)
  } finally {
    if (reset) {
      if (silent) {
        silentRecordsRefreshing = false
      } else {
        loadingRecords.value = false
      }
    } else {
      loadingMoreRecords.value = false
    }
  }
}

function applyCachedRecords(cached: CachedFundRecords | null): boolean {
  if (!cached?.items?.length) {
    return false
  }

  recordRows.value = cached.items
  recordOffset.value = cached.offset
  hasMoreRecords.value = cached.hasMore
  recordsTotal.value = cached.total
  grantAmountTotal.value = cached.grantAmount
  recoverAmountTotal.value = cached.recoverAmount
  profitAmountTotal.value = cached.profitAmount
  changeAmountTotal.value = cached.changeAmount
  return true
}

// 切换筛选：命中该筛选的缓存 → 先渲染再静默刷新；未命中 → 正常 loading 拉取。
async function loadRecordsWithCache(): Promise<void> {
  const cacheKey = fundRecordsCacheKey()
  const cached = await clubManageCache().get<CachedFundRecords>(USER_STORE_CLUB_MANAGE, cacheKey)
  if (cacheKey !== fundRecordsCacheKey()) {
    return
  }
  const hit = applyCachedRecords(cached)
  await fetchRecordRows(true, hit)
}

function onRecordScroll(event: Event): void {
  if (
    activeTab.value !== 'record' ||
    loadingRecords.value ||
    loadingMoreRecords.value ||
    silentRecordsRefreshing ||
    !hasMoreRecords.value
  ) {
    return
  }

  const target = event.target as HTMLElement | null
  if (!target) {
    return
  }

  const remain = target.scrollHeight - (target.scrollTop + target.clientHeight)
  if (remain <= 80) {
    void fetchRecordRows(false)
  }
}

function resolveRole(record: OrgMemberListRecord): {
  role: MemberRole
  identityType: MemberIdentity
} {
  const userLevel = toSafeNumber(record.user_level)
  const memberType = toSafeNumber(record.club_member_type)
  const isBoss = toSafeNumber(record.is_boss) === 1

  if (isBoss || userLevel === 1) {
    return { role: t('UIClub_UserLevelOwner'), identityType: 'founder' }
  }

  if (userLevel === 2 || userLevel === 3) {
    return { role: t('UIGuild_FilterButtonManager'), identityType: 'admin' }
  }

  if (userLevel === 4 || memberType === 2) {
    return { role: t('UIClub_AgentItem'), identityType: 'agent' }
  }

  return { role: t('UIClub_Info_Members'), identityType: 'player' }
}

function mapMember(record: OrgMemberListRecord): MemberItem {
  const id = toSafeNumber(record.user_id)
  const roleInfo = resolveRole(record)
  const clubGoldCredit = toSafeNumber(record.club_gold_credit)
  const clubGoldCreditLimit = toSafeNumber(record.club_gold_credit_limit)

  return {
    id,
    name: String(record.remark_name || record.nick_name || t('UIClub_Info_Members') + (id || '--')),
    uid: String(record.random_num || '--'),
    role: roleInfo.role,
    identityType: roleInfo.identityType,
    isBoundAgent: toSafeNumber(record.agent_random_id) > 0,
    diamond: toSafeNumber(record.diamonds),
    uc: toSafeNumber(record.gold),
    disposableCredit: clubGoldCredit,
    reviewCredit: clubGoldCreditLimit,
    freeLimit: `${formatUC(clubGoldCredit)}/${formatUC(clubGoldCreditLimit)}`,
    agentName: String(record.agent_nick_name || '-'),
    avatar: String(record.avatar || imgAvatar),
  }
}

function pickDefaultFundAssetTab(): FundAssetTab {
  return availableFundAssetTabs.value[0] || 'quota'
}

function syncActiveMemberFromMembers(): void {
  if (!activeMember.value) {
    return
  }

  const latest = members.value.find((item) => item.id === activeMember.value?.id)
  if (!latest) {
    return
  }

  activeMember.value = latest
  disposableQuota.value = latest.disposableCredit
  reviewQuota.value = latest.reviewCredit
}

// 基金操作成功后的整体刷新：数据已在屏上，走静默刷新避免闪 loading。
async function refreshFundData(): Promise<void> {
  patchActiveMemberOnList()
  await Promise.all([
    fetchMembers(true, true),
    fetchClubGoldSummary(true),
    fetchRecordRows(true, true),
  ])
  syncActiveMemberFromMembers()
}

async function fetchMembers(reset = false, silent = false): Promise<void> {
  if (loadingMembers.value || loadingMoreMembers.value || silentMembersRefreshing) {
    return
  }

  if (!reset && !hasMoreMembers.value) {
    return
  }

  const currentClub = userInfoStore.currentClub
  if (!currentClub?.random_id && !currentClub?.club_id) {
    if (reset && !silent) {
      members.value = []
      membersTotal.value = 0
      hasMoreMembers.value = false
    }
    showFailToast(t('UIClub_NotFoundClub'))
    return
  }

  if (reset) {
    // 静默刷新期间缓存仍在展示，offset/hasMore 等成功后一并重算。
    if (silent) {
      silentMembersRefreshing = true
    } else {
      loadingMembers.value = true
      membersOffset.value = 0
      hasMoreMembers.value = true
    }
  } else {
    loadingMoreMembers.value = true
  }

  // 只有未筛选的成员列表才写缓存，搜索结果不落库。
  const searchAtStart = searchKeyword.value.trim()

  try {
    const currentOffset = reset ? 0 : membersOffset.value
    const response = await postOrgMemberListApi({
      club_id: currentClub?.club_id,
      club_random_id: currentClub?.random_id,
      search: searchAtStart,
      sort_type: 8,
      order_type: 2,
      gold_type: 1,
      simple: false,
      hide_slave: true,
      limit: PAGE_SIZE,
      offset: currentOffset,
    })

    if (response.code !== 0 || !response.data) {
      const message = typeof response.msg === 'string' ? response.msg : t('UIClub_FetchMemberFail')
      throw new Error(message)
    }

    const rawMembers = Array.isArray(response.data.data) ? response.data.data : []
    const nextMembers = rawMembers.map(mapMember)

    members.value = reset ? nextMembers : [...members.value, ...nextMembers]
    membersOffset.value = currentOffset + rawMembers.length

    const rawTotal = Number(response.data.total)
    const hasValidTotal = Number.isFinite(rawTotal) && rawTotal >= 0
    const total = hasValidTotal ? rawTotal : members.value.length
    membersTotal.value = total
    memberListTotalGold.value = toSafeNumber(response.data.total_info?.total_gold)

    // 只有未筛选的列表总数才代表俱乐部真实人数，搜索结果不能覆盖页头人数。
    if (reset && !searchAtStart) {
      clubMemberTotal.value = total
      userInfoStore.syncCurrentClubFields({ club_members: total })
    }

    if (hasValidTotal) {
      hasMoreMembers.value = membersOffset.value < total
    } else {
      hasMoreMembers.value = rawMembers.length >= PAGE_SIZE
    }

    // 触底加载写回的是累计后的完整列表（更新而非覆盖）。
    if (!searchAtStart) {
      void clubManageCache().put(
        USER_STORE_CLUB_MANAGE,
        fundMembersCacheKey(),
        toPlain({
          items: members.value,
          total: membersTotal.value,
          totalGold: memberListTotalGold.value,
          offset: membersOffset.value,
          hasMore: hasMoreMembers.value,
        } satisfies CachedMemberList),
      )
    }
  } catch (error) {
    if (silent) {
      return
    }
    if (reset) {
      members.value = []
      membersTotal.value = 0
      hasMoreMembers.value = false
    }
    const message = error instanceof Error ? error.message : t('UIClub_FetchMemberFail')
    showFailToast(message)
  } finally {
    if (reset) {
      if (silent) {
        silentMembersRefreshing = false
      } else {
        loadingMembers.value = false
      }
    } else {
      loadingMoreMembers.value = false
    }
  }
}

function loadNextPage(): void {
  if (!loadingMembers.value && !loadingMoreMembers.value && hasMoreMembers.value) {
    void fetchMembers(false)
  }
}

function onMembersScroll(event: Event): void {
  const target = event.target as HTMLElement | null
  if (!target) {
    return
  }

  const remain = target.scrollHeight - (target.scrollTop + target.clientHeight)
  if (remain <= 80) {
    loadNextPage()
  }
}

function iconByType(type: SummaryItem['icon']): string {
  if (type === 'diamond') {
    return imgDiamond
  }

  if (type === 'balance') {
    return imgBalance
  }

  return imgChips
}

function switchTab(tab: TabKey): void {
  activeTab.value = tab

  if (tab === 'account') {
    showTypeMenu.value = false
    return
  }

  if (!recordRows.value.length) {
    void fetchRecordRows(true)
  }
}

function onIncomeQuery(): void {
  void router.push('/club/wallet/logs')
}

function openMemberDetail(member: MemberItem): void {
  void router.push({
    path: `/club/member/${member.id}`,
    query: {
      identity: member.identityType,
      bound: member.isBoundAgent ? '1' : '0',
      name: member.name,
      uid: member.uid,
      diamonds: String(member.diamond),
    },
  })
}

function openFundSheet(member: MemberItem): void {
  activeMember.value = member
  showFundSheet.value = true
  fundAssetTab.value = pickDefaultFundAssetTab()
  fundActionTab.value = 'grant'
  fundAmountInput.value = ''
  quotaInput.value = ''
  quotaEditField.value = null
  quotaAdjustMode.value = 'increase'
  disposableQuota.value = member.disposableCredit
  reviewQuota.value = member.reviewCredit
}

function closeFundSheet(): void {
  showFundSheet.value = false
  quotaEditField.value = null
}

function switchFundAsset(tab: FundAssetTab): void {
  if (!availableFundAssetTabs.value.includes(tab)) {
    return
  }

  fundAssetTab.value = tab

  if (tab !== 'coin') {
    fundActionTab.value = 'grant'
  }

  if (tab !== 'quota') {
    quotaEditField.value = null
    quotaInput.value = ''
    quotaAdjustMode.value = 'increase'
  }
}

function switchFundAction(action: FundActionTab): void {
  fundActionTab.value = action
}

function editQuota(field: QuotaEditField): void {
  quotaEditField.value = field
  quotaInput.value = ''
  quotaAdjustMode.value = 'increase'
}

async function submitQuotaUpdate(options: {
  field: QuotaEditField
  amount: number
  isReset: boolean
  adjustMode?: QuotaAdjustMode
}): Promise<void> {
  const member = activeMember.value
  if (!member?.id) {
    showFailToast(t('UIClub_NotFoundMember'))
    return
  }

  const signedAmount =
    options.adjustMode === 'decrease' ? -Math.abs(options.amount) : Math.abs(options.amount)
  const payload = {
    user_id: member.id,
    gold_type: 3,
    amount: options.isReset ? 0 : signedAmount * 100,
    is_reset: options.isReset,
  }

  const response =
    options.field === 'disposable'
      ? await postOrgClubCreditBalanceApi(payload)
      : await postOrgClubCreditLimitApi(payload)

  if (response.code !== 0) {
    throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_Fail9'))
  }
}

async function resetQuota(field: QuotaEditField): Promise<void> {
  if (submittingFund.value) {
    return
  }

  submittingFund.value = true
  try {
    await submitQuotaUpdate({
      field,
      amount: 0,
      isReset: true,
    })

    showSuccessToast(t('UIClub_Success2'))
    if (field === 'disposable') {
      disposableQuota.value = 0
      if (activeMember.value) {
        activeMember.value = {
          ...activeMember.value,
          disposableCredit: 0,
        }
      }
    } else {
      reviewQuota.value = 0
      if (activeMember.value) {
        activeMember.value = {
          ...activeMember.value,
          reviewCredit: 0,
        }
      }
    }
    quotaEditField.value = null
    quotaInput.value = ''
    await refreshFundData()
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_Fail10')
    showFailToast(message)
  } finally {
    submittingFund.value = false
  }
}

function onKeypadPress(key: string): void {
  const isQuotaEditing = fundAssetTab.value === 'quota' && quotaEditField.value
  const target = isQuotaEditing ? quotaInput : fundAmountInput

  if (key === 'C') {
    target.value = ''
    return
  }

  if (key === 'DEL') {
    target.value = target.value.slice(0, -1)
    return
  }

  if (target.value.length >= 9) {
    return
  }

  target.value += key
}

async function onFundConfirm(): Promise<void> {
  if (fundAssetTab.value === 'quota') {
    if (!quotaEditField.value || !quotaInput.value) {
      return
    }

    const amount = Number.parseInt(quotaInput.value, 10)
    if (Number.isNaN(amount) || amount <= 0) {
      showFailToast(t('UIClub_PleaseOf'))
      return
    }

    if (submittingFund.value) {
      return
    }

    submittingFund.value = true
    try {
      await submitQuotaUpdate({
        field: quotaEditField.value,
        amount,
        isReset: false,
        adjustMode: quotaAdjustMode.value,
      })

      showSuccessToast(t('UIClub_Success3'))
      const factor = quotaAdjustMode.value === 'increase' ? 1 : -1
      if (quotaEditField.value === 'disposable') {
        disposableQuota.value = Math.max(0, disposableQuota.value + amount * factor * 100)
        if (activeMember.value) {
          activeMember.value = {
            ...activeMember.value,
            disposableCredit: disposableQuota.value,
          }
        }
      } else {
        reviewQuota.value = Math.max(0, reviewQuota.value + amount * factor * 100)
        if (activeMember.value) {
          activeMember.value = {
            ...activeMember.value,
            reviewCredit: reviewQuota.value,
          }
        }
      }

      quotaInput.value = ''
      quotaEditField.value = null
      await refreshFundData()
    } catch (error) {
      const message = error instanceof Error ? error.message : t('UIClub_Fail9')
      showFailToast(message)
    } finally {
      submittingFund.value = false
    }
    return
  }

  if (submittingFund.value) {
    return
  }

  const member = activeMember.value
  const amount = Number.parseInt(fundAmountInput.value, 10)
  if (!member?.id || Number.isNaN(amount) || amount <= 0) {
    showFailToast(t('UIClub_PleaseOf2'))
    return
  }

  submittingFund.value = true
  try {
    let response: { code?: number; msg?: string } = {}

    if (fundAssetTab.value === 'diamond') {
      const clubId = toSafeNumber(userInfoStore.currentClub?.club_id)
      if (!clubId) {
        throw new Error(t('UIClub_NotFoundClub'))
      }

      response = await postClubSendDiamondsApi(
        {
          user_ids: [member.id],
          amount,
        },
        clubId,
      )
    } else {
      response = await postGuildGiveRecycleApi({
        user_ids: [member.id],
        gold_num: amount * 100,
        gold_type: 1,
        op_type: fundActionTab.value === 'grant' ? 1 : 2,
      })
    }

    if (response.code !== 0) {
      throw new Error(
        typeof response.msg === 'string' ? response.msg : t('Uiclubrechargeconfirmorderfailed'),
      )
    }

    if (activeMember.value) {
      if (fundAssetTab.value === 'diamond') {
        activeMember.value = {
          ...activeMember.value,
          diamond: Math.max(0, activeMember.value.diamond + amount),
        }
      } else {
        const delta = fundActionTab.value === 'grant' ? amount * 100 : -amount * 100
        activeMember.value = {
          ...activeMember.value,
          uc: Math.max(0, activeMember.value.uc + delta),
        }
      }
    }

    showSuccessToast(
      fundActionTab.value === 'grant' ? t('UIClub_SendPropsSucceed') : t('UIClub_RecycleSucceed'),
    )
    closeFundSheet()
    await refreshFundData()
  } catch (error) {
    const message = error instanceof Error ? error.message : t('Uiclubrechargeconfirmorderfailed')
    showFailToast(message)
  } finally {
    submittingFund.value = false
  }
}

function onSearchSubmit(): void {
  void fetchMembers(true)
}

function switchRange(range: RecordRangeKey): void {
  if (range === 'custom') {
    isDatePickerVisible.value = true
    return
  }

  activeRange.value = range
  void loadRecordsWithCache()
}

function onCustomDateConfirm(): void {
  activeRange.value = 'custom'
  recordListRef.value?.scrollTo({ top: 0 })
  void loadRecordsWithCache()
}

function toggleRecordOrder(): void {
  recordOrderType.value = recordOrderType.value === 2 ? 1 : 2
  showTypeMenu.value = false
  recordListRef.value?.scrollTo({ top: 0 })
  void loadRecordsWithCache()
}

function toggleTypeMenu(): void {
  showTypeMenu.value = !showTypeMenu.value
}

function chooseType(typeKey: string): void {
  selectedRecordType.value = typeKey
  showTypeMenu.value = false
  void loadRecordsWithCache()
}

function roleClass(role: MemberRole): string {
  if (role === t('UIClub_Info_Members')) {
    return 'role-badge--member'
  }

  if (role === t('UIClub_AgentItem')) {
    return 'role-badge--agent'
  }

  return 'role-badge--admin'
}

// 进页面先读 club_manage 缓存渲染，命中的部分走静默刷新，未命中的照常 loading。
async function restoreFundCache(): Promise<{
  summary: boolean
  members: boolean
  records: boolean
}> {
  const [cachedSummary, cachedMembers, cachedRecords] = await Promise.all([
    clubManageCache().get<OrgClubGoldData>(USER_STORE_CLUB_MANAGE, fundSummaryCacheKey()),
    clubManageCache().get<CachedMemberList>(USER_STORE_CLUB_MANAGE, fundMembersCacheKey()),
    clubManageCache().get<CachedFundRecords>(USER_STORE_CLUB_MANAGE, fundRecordsCacheKey()),
  ])

  if (cachedSummary) {
    clubGoldSummary.value = cachedSummary
  }
  if (cachedMembers?.items?.length) {
    members.value = cachedMembers.items
    membersTotal.value = cachedMembers.total
    memberListTotalGold.value = cachedMembers.totalGold
    membersOffset.value = cachedMembers.offset
    hasMoreMembers.value = cachedMembers.hasMore
    clubMemberTotal.value = cachedMembers.total
  }

  return {
    summary: Boolean(cachedSummary),
    members: Boolean(cachedMembers?.items?.length),
    records: applyCachedRecords(cachedRecords),
  }
}

onMounted(() => {
  void (async () => {
    const hit = await restoreFundCache()
    await Promise.all([
      fetchMembers(true, hit.members),
      fetchClubGoldSummary(hit.summary),
      fetchRecordRows(true, hit.records),
      refreshClubCapacity(),
    ])
  })()
})
</script>

<template>
  <div class="page-shell club-members-desktop-page club-members-bg" :style="backgroundStyle">
    <HeaderBack :title="t('UIGuildMemberDetailspermissions005')">
      <template #right>
        <p class="member-total">
          {{ t('UIClub_Text27') }} <span>{{ memberTotalText }}</span>
        </p>
      </template>
    </HeaderBack>
    <div class="club-members">
      <nav class="member-tabs" :aria-label="t('UIClub_Fund3')">
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'account' }"
          @click="switchTab('account')"
        >
          {{ t('UIGuild_Fund_Acount') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'record' }"
          @click="switchTab('record')"
        >
          {{ t('Text_RecordLine') }}
        </button>
      </nav>

      <template v-if="activeTab === 'account'">
        <section class="summary-card">
          <div class="summary-grid summary-grid--top">
            <div v-for="item in summaryTop" :key="item.label" class="summary-item">
              <p class="summary-label">{{ item.label }}</p>
              <p class="summary-value">
                <img :src="iconByType(item.icon)" alt="" aria-hidden="true" />
                <span>{{ formatUC(item.value) }}</span>
              </p>
            </div>
          </div>
          <div class="summary-grid summary-grid--bottom">
            <div v-for="item in summaryBottom" :key="item.label" class="summary-item">
              <p class="summary-label">{{ item.label }}</p>
              <p class="summary-value">
                <img :src="iconByType(item.icon)" alt="" aria-hidden="true" />
                <span v-if="item.icon !== 'diamond'">{{ formatUC(item.value) }}</span>
                <span v-else>{{ item.value }}</span>
              </p>
            </div>

            <!-- <button type="button" class="income-btn" @click="onIncomeQuery">
              <span>{{ t('UIClub_Income5') }}</span>
              <img :src="icTimeRefresh" alt="" class="income-icon" aria-hidden="true" />
            </button> -->
          </div>
        </section>

        <section class="search-card">
          <img :src="icSearch" alt="" class="search-icon" aria-hidden="true" />
          <input
            v-model.trim="searchKeyword"
            type="text"
            :placeholder="t('UIClub_Player')"
            @keydown.enter="onSearchSubmit"
          />
        </section>

        <section
          class="members-list"
          :aria-label="t('UIGuild_MemberList')"
          @scroll="onMembersScroll"
        >
          <article v-for="member in members" :key="member.id" class="member-card">
            <span class="role-badge" :class="roleClass(member.role)">{{ member.role }}</span>

            <div class="member-main" @click="openMemberDetail(member)">
              <div class="member-left">
                <img
                  class="member-avatar"
                  :src="member.avatar"
                  :alt="member.name + t('UIMine_UserInfoSetting_btn_head')"
                />
                <div class="member-base">
                  <button type="button" class="member-name">
                    {{ member.name }}
                  </button>
                  <p class="member-id-row">
                    <span class="id-pill">ID</span>
                    <span>{{ member.uid }}</span>
                  </p>
                </div>
              </div>

              <p class="member-diamond">
                <img :src="imgDiamond" alt="" aria-hidden="true" />
                <span>{{ member.diamond }}</span>
              </p>
            </div>

            <div class="member-data-strip" @click="openFundSheet(member)">
              <div class="data-item">
                <p class="data-label">
                  <img :src="imgChips" alt="" aria-hidden="true" />
                  <span>{{ t('UIClubCreditLimit1') }}</span>
                </p>
                <p class="data-value">{{ formatUC(member.uc) }}</p>
              </div>

              <div class="data-item">
                <p class="data-label">
                  <img :src="imgBalance" alt="" aria-hidden="true" />
                  <span>{{ t('UIClubTalbe_CreditTitle') }}</span>
                </p>
                <p class="data-value">{{ member.freeLimit }}</p>
              </div>

              <div class="data-item">
                <p class="data-label data-label--agent">
                  <img :src="icUserShadow" alt="" aria-hidden="true" />
                  <span>{{ t('UIClub_Agent2') }}</span>
                </p>
                <p class="data-value">{{ member.agentName }}</p>
              </div>
            </div>
          </article>

          <p v-if="!members.length && !loadingMembers" class="member-list-status">
            {{ t('UIClub_NoMemberData') }}
          </p>
          <p v-if="loadingMembers" class="member-list-status">{{ t('SuperView2') }}...</p>
          <p v-else-if="members.length && loadingMoreMembers" class="member-list-status">
            {{ t('UIClub_LoadMore') }}...
          </p>
          <p v-else-if="members.length && !hasMoreMembers" class="member-list-status">
            {{ t('UIClub_NoMore') }}
          </p>
        </section>
      </template>

      <template v-else>
        <section class="record-panel">
          <header class="record-head">
            <span>{{ t('UIClub_Data2') }}</span>
            <span>{{ t('UICommon_TimeZone') }} UTC+0</span>
          </header>

          <div class="range-tabs">
            <button
              v-for="item in recordRanges"
              :key="item.key"
              type="button"
              class="range-tab"
              :class="{ 'range-tab--active': activeRange === item.key }"
              @click="switchRange(item.key)"
            >
              <span v-fit-text="{ maxLines: 1 }" class="tab-label">{{ item.label }}</span>
            </button>
          </div>

          <div class="record-stats">
            <article v-for="stat in recordStats" :key="stat.id" class="record-stat-item">
              <p class="record-stat-label">{{ stat.label }}</p>
              <p class="record-stat-value">{{ stat.value }}</p>
            </article>
          </div>
        </section>
        <div class="record-table-wrap">
          <div class="record-table-head">
            <button
              type="button"
              class="head-cell head-cell--time"
              :aria-label="recordOrderType === 2 ? t('UIClub_Time3') : t('UIClub_Time4')"
              @click="toggleRecordOrder"
            >
              <span>{{ t('TimeItem') }}</span>
              <svg class="tiny-arrow" :class="{ 'tiny-arrow--open': recordOrderType === 1 }" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3.5 4.5L6 7L8.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button type="button" class="head-cell head-cell--type" @click="toggleTypeMenu">
              <span>{{ t('UIMatchFilter_DPY5kR') }}</span>
              <svg class="tiny-arrow" :class="{ 'tiny-arrow--open': showTypeMenu }" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3.5 4.5L6 7L8.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <span class="head-cell head-cell--quantity">{{ t('UIGuild_MembeDetailNumberTip') }}</span>
            <span class="head-cell head-cell--balance">{{ t('UIClub_CreateRoom31') }}</span>
            <span class="head-cell">{{ t('UINotesName') }}</span>
          </div>

          <div v-if="showTypeMenu" class="type-dropdown">
            <button
              v-for="option in recordTypeOptions"
              :key="option.key"
              type="button"
              class="type-option"
              :class="{ 'type-option--active': selectedRecordType === option.key }"
              @click="chooseType(option.key)"
            >
              {{ resolveRecordTypeLabel(option) }}
            </button>
          </div>

          <section ref="recordListRef" class="record-list" @scroll="onRecordScroll">
            <article
              v-for="row in recordRows"
              :key="row.id"
              class="record-row"
              :class="{
                'record-row--pftroom': row.opCode === 'PFTROOM',
                'record-row--from': row.showFromTag && row.fromName && row.fromId,
              }"
            >
              <div v-if="row.showFromTag && row.fromName && row.fromId" class="from-chip">
                From: {{ row.fromName }}（ID: {{ row.fromId }}）
              </div>

              <div class="record-main-grid">
                <p class="time-cell">
                  <span>{{ row.time }}</span>
                  <span class="sub-line">{{ row.date }}</span>
                </p>
                <p class="type-cell">{{ row.type }}</p>
                <p class="quantity-cell">{{ row.quantity }}</p>
                <p class="balance-cell">{{ row.balance }}</p>
                <p class="remark-cell">
                  <span class="remark-main" :title="row.remark">{{ row.remark }}</span>
                  <span class="sub-line">ID:{{ row.remarkId }}</span>
                </p>
              </div>
            </article>

            <p v-if="!recordRows.length && !loadingRecords" class="record-list-status">
              {{ t('UIClub_NoRecord4') }}
            </p>
            <p v-if="loadingRecords" class="record-list-status">{{ t('SuperView2') }}...</p>
            <p v-else-if="recordRows.length && loadingMoreRecords" class="record-list-status">
              {{ t('UIClub_LoadMore') }}...
            </p>
            <p v-else-if="recordRows.length && !hasMoreRecords" class="record-list-status">
              {{ t('UIClub_NoMore') }}
            </p>
          </section>
        </div>
      </template>

      <div v-if="showFundSheet" class="fund-sheet-mask" @click="closeFundSheet"></div>

      <section v-if="showFundSheet && activeMember" class="fund-sheet" @click.stop>
        <div class="fund-tabs" role="tablist" :aria-label="t('UIClub_Fund')">
          <button
            v-if="shouldShowCoinFundTab"
            type="button"
            class="fund-tab"
            :class="{ 'fund-tab--active': fundAssetTab === 'coin' }"
            @click="switchFundAsset('coin')"
          >
            {{ t('UIClubCreditLimit1') }}
          </button>
          <button
            type="button"
            class="fund-tab"
            :class="{ 'fund-tab--active': fundAssetTab === 'quota' }"
            @click="switchFundAsset('quota')"
          >
            {{ t('UIClubTalbe_CreditAmount') }}
          </button>
          <button
            v-if="shouldShowDiamondFundTab"
            type="button"
            class="fund-tab"
            :class="{ 'fund-tab--active': fundAssetTab === 'diamond' }"
            @click="switchFundAsset('diamond')"
          >
            {{ t('UIMine_VIP_diamond') }}
          </button>
        </div>

        <div v-if="fundAssetTab === 'coin'" class="fund-action-switch">
          <button
            type="button"
            class="action-tab"
            :class="{ 'action-tab--active': fundActionTab === 'grant' }"
            @click="switchFundAction('grant')"
          >
            {{ t('UIClub_FundDetail_5iSXE2Uj') }}
          </button>
          <button
            type="button"
            class="action-tab"
            :class="{ 'action-tab--active': fundActionTab === 'recycle' }"
            @click="switchFundAction('recycle')"
          >
            {{ t('UIClub_FundDetail_recycle') }}
          </button>
        </div>

        <div v-if="fundAssetTab === 'quota'" class="quota-body">
          <div class="sheet-row sheet-row--top">
            <p class="sheet-label">{{ t('user_name') }}</p>
            <p class="sheet-username">
              <span>{{ activeMember.name }}</span>
              <span class="sheet-id-tag">ID</span>
              <span>{{ activeMember.uid }}</span>
            </p>
          </div>

          <div class="sheet-row">
            <div class="quota-group-label">
              <p>{{ t('OpCodeString_CREDITBRINGOUT') }}</p>
              <p>{{ formatUC(disposableQuota) }}</p>
            </div>
            <div class="quota-actions">
              <button
                type="button"
                class="quota-action quota-action--primary"
                @click="editQuota('disposable')"
              >
                {{ t('UICommon_Edit') }}
              </button>
              <button type="button" class="quota-action" @click="resetQuota('disposable')">
                {{ t('UIlobbyfilterTips02') }}
              </button>
            </div>
          </div>

          <section v-if="quotaEditField === 'disposable'" class="quota-editor">
            <div class="quota-mode-row">
              <button
                type="button"
                class="quota-mode"
                :class="{ 'quota-mode--active': quotaAdjustMode === 'increase' }"
                @click="quotaAdjustMode = 'increase'"
              >
                <img v-if="quotaAdjustMode === 'increase'" :src="icJackpotChecked" class="quota-mode-icon" aria-hidden="true" />
                {{ t('UICredit_AddAmount') }}
              </button>
              <button
                type="button"
                class="quota-mode"
                :class="{ 'quota-mode--active': quotaAdjustMode === 'decrease' }"
                @click="quotaAdjustMode = 'decrease'"
              >
                <img v-if="quotaAdjustMode === 'decrease'" :src="icJackpotChecked" class="quota-mode-icon" aria-hidden="true" />
                {{ t('UICredit_SubAmount') }}
              </button>
            </div>
            <div class="quota-input-pill">{{ currentInputText }}</div>
          </section>

          <div class="sheet-row">
            <div class="quota-group-label">
              <p>{{ t('OpCodeString_CREDITGRANT') }}</p>
              <p>{{ formatUC(reviewQuota) }}</p>
            </div>
            <div class="quota-actions">
              <button
                type="button"
                class="quota-action quota-action--primary"
                @click="editQuota('review')"
              >
                {{ t('UICommon_Edit') }}
              </button>
              <button type="button" class="quota-action" @click="resetQuota('review')">
                {{ t('UIlobbyfilterTips02') }}
              </button>
            </div>
          </div>

          <section v-if="quotaEditField === 'review'" class="quota-editor">
            <div class="quota-mode-row">
              <button
                type="button"
                class="quota-mode"
                :class="{ 'quota-mode--active': quotaAdjustMode === 'increase' }"
                @click="quotaAdjustMode = 'increase'"
              >
                <img v-if="quotaAdjustMode === 'increase'" :src="icJackpotChecked" class="quota-mode-icon" aria-hidden="true" />
                {{ t('UICredit_AddAmount') }}
              </button>
              <button
                type="button"
                class="quota-mode"
                :class="{ 'quota-mode--active': quotaAdjustMode === 'decrease' }"
                @click="quotaAdjustMode = 'decrease'"
              >
                <img v-if="quotaAdjustMode === 'decrease'" :src="icJackpotChecked" class="quota-mode-icon" aria-hidden="true" />
                {{ t('UICredit_SubAmount') }}
              </button>
            </div>
            <div class="quota-input-pill">{{ currentInputText }}</div>
          </section>
        </div>

        <div v-else class="sheet-meta">
          <div class="sheet-row sheet-row--top">
            <p class="sheet-label">{{ t('user_name') }}</p>
            <p class="sheet-username">
              <span>{{ activeMember.name }}</span>
              <span class="sheet-id-tag">ID</span>
              <span>{{ activeMember.uid }}</span>
            </p>
          </div>

          <div class="sheet-row">
            <p class="sheet-label">{{ t('UIClub_CreateRoom31') }}</p>
            <p class="sheet-balance">
              <img
                :src="fundAssetTab === 'diamond' ? imgDiamond : imgChips"
                alt=""
                aria-hidden="true"
              />
              <span>{{ currentFundBalanceText }}</span>
            </p>
          </div>

          <div class="sheet-row">
            <p class="sheet-label">{{ t('UIClub_SendItem_number') }}</p>
            <p class="sheet-balance">
              <img
                :src="fundAssetTab === 'diamond' ? imgDiamond : imgChips"
                alt=""
                aria-hidden="true"
              />
              <span :class="{ 'sheet-placeholder': !fundAmountInput }">{{ currentInputText }}</span>
            </p>
          </div>
        </div>

        <div class="fund-keypad">
          <button v-for="n in ['1','2','3','4','5','6','7','8','9']" :key="n" class="keypad-btn" @click="onKeypadPress(n)">{{ n }}</button>
          <button class="keypad-btn keypad-btn--accent" @click="onKeypadPress('C')">C</button>
          <button class="keypad-btn" @click="onKeypadPress('0')">0</button>
          <button class="keypad-btn keypad-btn--accent" @click="onKeypadPress('DEL')">
            <img class="keypad-del-icon" :src="backspaceIcon" alt="" aria-hidden="true" />
          </button>
        </div>

        <div class="sheet-footer-actions">
          <button type="button" class="sheet-footer-btn" @click="closeFundSheet">
            {{ t('adaptation10013') }}
          </button>
          <button
            type="button"
            class="sheet-footer-btn sheet-footer-btn--confirm"
            @click="onFundConfirm"
          >
            {{ fundSubmitLabel }}
          </button>
        </div>
      </section>
    </div>

    <DateRangePicker
      v-model:visible="isDatePickerVisible"
      v-model:start-date="customStartDate"
      v-model:end-date="customEndDate"
      :min-date="minSelectableDate"
      :max-date="maxSelectableDate"
      :show-tip="false"
      @confirm="onCustomDateConfirm"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

// 整页只留列表一个滚动条：page-shell 不滚（覆盖基类 overflow-y:auto），
// 页签/汇总卡/搜索框固定，members-list / record-list 自己滚。
.club-members-bg {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background-image: var(--club-members-bg-dark);
  background-size: cover;
  padding-bottom: 0.2rem;

  @include theme-light {
    background-color: #f3f4f6;
    background-image: var(--club-members-bg-light);
  }
}

.club-members {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 0.34rem;
  padding-top: 0.2rem;
}

.member-total {
  margin: 0;
  font-size: 0.32rem;
  line-height: 1;
  color: rgba(249, 249, 249, 0.9);
  padding-left: 0.32rem;
}

.member-tabs {
  display: inline-flex;
  align-self: center;
  gap: 1.60643rem;
  min-height: 0.68166rem;
}

.tab-btn {
  position: relative;
  border: 0;
  background: transparent;
  padding: 0 0.03rem 0.09rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.37029rem;
  line-height: 1;
  font-weight: 500;
}

.tab-btn--active {
  color: #f9f9f9;
  font-weight: 700;
}

.tab-btn--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 0.045rem;
  border-radius: 999px;
  background: rgba(234, 234, 234, 0.95);
}

.summary-card {
  padding: 0.43919rem;
  border-radius: 1rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.1);
  background: rgba(170, 170, 170, 0.1);
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);
  display: flex;
  flex-direction: column;
  gap: 0.39696rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.80321rem;
}

.summary-grid--bottom {
  align-items: center;
}

.summary-item {
  display: flex;
  flex-direction: column;
  text-align: center;
  gap: 0.06rem;
}

.summary-label {
  margin: 0;
  font-size: 0.32013rem;
  line-height: 1.2;
  color: #f3f3f3;
}

.summary-value {
  display: flex;
  justify-content: center;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.045rem;
  font-size: 0.3rem;
  line-height: 1;
  font-weight: 700;
  color: #f9f9f9;
}

.summary-value img {
  width: 0.42rem;
  height: 0.42rem;
  object-fit: contain;
}

.income-btn {
  min-height: 0.96rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.04);
  border-radius: 1rem;
  background: rgba(170, 170, 170, 0.04);
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);
  color: #f3f3f3;
  font-size: 0.26rem;
  line-height: 1;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.16rem;
}

.income-icon {
  width: 0.4rem;
  height: 0.4rem;
  object-fit: contain;
  flex-shrink: 0;
}

.search-card {
  min-height: 1.06827rem;
  padding: 0.12669rem 0.2027rem 0.12669rem 0.44763rem;
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  display: flex;
  align-items: center;
  gap: 0.16649rem;
}

.search-icon {
  width: 0.4rem;
  height: 0.4rem;
  object-fit: contain;
  flex: 0 0 auto;
}

.search-card input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 0.41338rem;
  line-height: 1;
  color: #fff;
  font-family: inherit;
}

.search-card input::placeholder {
  color: rgba(255, 255, 255, 0.95);
}

.members-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 0.27027rem;
  padding-top: 0.15rem;
  padding-bottom: 0.21rem;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.member-list-status {
  margin: 0;
  text-align: center;
  font-size: 0.292rem;
  color: rgba(249, 249, 249, 0.75);
  padding: 0.12rem 0;
}

.record-panel {
  position: relative;
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  padding: 0.36318rem 0.43919rem;
  display: flex;
  flex-direction: column;
  gap: 0.22727rem;
  min-height: 0;
  margin-inline: 0.32rem;
}

.record-head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.78371rem;
  font-size: 0.25862rem;
  line-height: 1;
  color: rgba(249, 249, 249, 0.68);
  padding: 0;
}

.range-tabs {
  height: 1.44426rem;
  border-radius: 0.68rem;
  background: rgba(0, 0, 0, 0.2);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  gap: 0.1rem;
  padding: 0.06rem;
}

.range-tab {
  border: 0;
  white-space: nowrap;
  border-radius: 0.62rem;
  background: transparent;
  color: #f9f9f9;
  opacity: 0.86;
  font-size: 0.36197rem;
  line-height: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-label {
  display: block;
  width: 100%;
  text-align: center;
  white-space: nowrap;
}

.range-tab--active {
  background: rgba(249, 249, 249, 0.5);
  font-weight: 700;
  opacity: 1;
}

.record-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  padding: 0;
}

.record-stat-item {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.07356rem;
  text-align: center;
}

.record-stat-label {
  width: 100%;
  margin: 0;
  font-size: 0.28213rem;
  color: rgba(249, 249, 249, 0.82);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-stat-value {
  width: 100%;
  margin: 0;
  font-size: 0.46rem;
  line-height: 1;
  color: #f9f9f9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-table-wrap {
  --record-columns: 1fr 1.15fr 1.15fr 0.9fr 1.25fr;
  --record-col-gap: 0.04rem;
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.15674rem;
  min-height: 0;
  overflow: hidden;
  margin-inline: 0.32rem;
}

.record-table-head {
  position: relative;
  min-height: 0.77586rem;
  border-radius: 9999px;
  display: grid;
  grid-template-columns: var(--record-columns);
  column-gap: var(--record-col-gap);
  align-items: center;
  padding: 0 0.2rem;
  color: #f9f9f9;
  font-size: 0.27429rem;
  line-height: 1.4;
  font-weight: 500;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0.16rem;
    left: 1.74%;
    right: 2.06%;
    height: 0.462rem;
    border-radius: 9999px;
    background: var(--c-brand, #05c297);
    z-index: 0;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: inherit;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(0.24rem);
    z-index: 1;
    pointer-events: none;
  }
}

.head-cell {
  position: relative;
  z-index: 2;
  border: 0;
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: inherit;
  line-height: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.06757rem;

  &--quantity,
  &--balance {
    justify-content: center;
  }
}

.tiny-arrow {
  width: 0.28rem;
  height: 0.28rem;
  transition: transform 0.2s ease;
  display: inline-block;

  &--open {
    transform: rotate(180deg);
  }
}

.tiny-arrow--up {
  transform: rotate(135deg);
}

.type-dropdown {
  position: absolute;
  top: 0.9rem;
  left: 1.35rem;
  width: 3.9899rem;
  max-height: 10.2633rem;
  overflow: auto;
  border-radius: 0.42929rem;
  padding: 0.36195rem 0.43771rem;
  background: rgba(0, 0, 0, 0.37);
  backdrop-filter: blur(0.16rem);
  -webkit-backdrop-filter: blur(0.16rem);
  z-index: 5;
}

.type-option {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0.15189rem 0;
  text-align: left;
  color: rgba(249, 249, 249, 0.92);
  font-size: 0.304rem;
  line-height: 1.3;
  border-bottom: 0.015rem solid rgba(255, 255, 255, 0.2);
}

.type-option:last-child {
  border-bottom: 0;
}

.type-option--active {
  color: #fff;
  font-weight: 700;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 0.07837rem;
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

.record-list-status {
  margin: 0;
  text-align: center;
  font-size: 0.292rem;
  color: rgba(249, 249, 249, 0.75);
  padding: 0.12rem 0;
}

.record-row {
  position: relative;
  overflow: hidden;
  border-radius: 0.37751rem;
  background: rgba(0, 0, 0, 0.22);
  padding: 0.16rem 0;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 0.06rem;
  min-height: 0.72rem;
  box-sizing: border-box;
}

.record-row--from {
  padding-top: 0.59rem;
  min-height: 1.43rem;
}

.record-row--pftroom {
  background: rgba(0, 0, 0, 0.26);
}

.from-chip {
  position: absolute;
  top: 0;
  left: 0;
  max-width: 84%;
  border-radius: 0.37751rem 0 0.145rem 0;
  background: var(--c-brand);
  height: 0.44144rem;
  padding: 0 0.29rem;
  color: #0b1c20;
  font-size: 0.264rem;
  line-height: 1.4;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-main-grid {
  display: grid;
  grid-template-columns: var(--record-columns);
  column-gap: var(--record-col-gap);
  align-items: center;
  padding: 0 0.16rem;
  color: #fff;
}

.record-main-grid p {
  margin: 0;
  font-size: 0.26167rem;
  line-height: 1.15;
}

.time-cell,
.type-cell,
.quantity-cell,
.balance-cell,
.remark-cell {
  min-width: 0;
}

.time-cell,
.remark-cell {
  display: flex;
  flex-direction: column;
  gap: 0.03rem;
}

.time-cell > span,
.type-cell,
.sub-line {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.balance-cell {
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-all;
}

.remark-main {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remark-cell {
  width: 100%;
  align-items: center;
  text-align: center;
  overflow: hidden;
}

.remark-cell > span {
  display: block;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-line {
  font-size: 0.22727rem;
  color: rgba(249, 249, 249, 0.55);
}

.quantity-cell {
  width: 100%;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-card {
  position: relative;
  padding: 0.16064rem 0.43919rem 0.28112rem;
  border-radius: 1rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.1);
  background: rgba(170, 170, 170, 0.1);
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);
}

.role-badge {
  position: absolute;
  top: -0.15rem;
  left: 0.03rem;
  padding: 0 0.15rem;
  min-height: 0.45rem;
  border-radius: 0.225rem 0.225rem 0 0.225rem;
  display: inline-flex;
  align-items: center;
  font-size: 0.24738rem;
  font-weight: 600;
  color: #fff;
  background: rgba(181, 115, 255, 1);
  box-shadow: 0 0.03rem 0.09rem rgba(0, 0, 0, 0.25);
}


.member-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.24rem;
}

.member-left {
  display: inline-flex;
  align-items: center;
  gap: 0.32095rem;
  min-width: 0;
}

.member-avatar {
  width: 1.03614rem;
  height: 1.03614rem;
  border-radius: 999px;
  object-fit: cover;
}

.member-base {
  display: flex;
  flex-direction: column;
  gap: 0.25338rem;
  min-width: 0;
}

.member-name {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  font-size: 0.30522rem;
  line-height: 1;
  font-weight: 700;
  color: #fff;
}

.member-id-row {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.06552rem;
  font-size: 0.25661rem;
  line-height: 1;
  color: rgba(249, 249, 249, 0.92);
}

.id-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0.50208rem;
  height: 0.30976rem;
  border-radius: 0.075rem;
  font-size: 0.21595rem;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
}

.member-diamond {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.16851rem;
  font-size: 0.30522rem;
  line-height: 1;
  font-weight: 700;
  color: #fff;
}

.member-diamond img {
  width: 0.53333rem;
  height: 0.42786rem;
  object-fit: contain;
}

.member-data-strip {
  margin-top: 0.16064rem;
  padding: 0.11824rem 0.58277rem;
  border-radius: 1.44001rem;
  background: rgba(34, 34, 34, 0.62);
  backdrop-filter: blur(1.60643rem);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.21rem;
  cursor: pointer;
}

.fund-sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(12, 12, 12, 0.6);
  z-index: 40;
}

.fund-sheet {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(100%, 10rem);
  border-radius: 0.84459rem 0.84459rem 0 0;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  border-bottom: none;
  padding: 0.64257rem 0.53209rem calc(0.5472rem + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  box-shadow: 0 -0.16rem 0.53rem rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 0.43373rem;
  z-index: 41;
}

.fund-tabs {
  display: flex;
  justify-content: center;
  gap: 1.28514rem;
}

.fund-tab {
  border: 0;
  background: transparent;
  color: rgba(249, 249, 249, 0.7);
  font-size: 0.37951rem;
  padding: 0;
  line-height: 0.95;
}

.fund-tab--active {
  color: #f9f9f9;
  border-bottom: 0.034rem solid #f9f9f9;
  padding-bottom: 4px;
}

.fund-action-switch {
  align-self: center;
  width: 8.08835rem;
  min-height: 1.35743rem;
  border-radius: 158.361px;
  background: linear-gradient(125.7deg, rgba(255, 255, 255, 0.1) 21.1%, rgba(230, 230, 230, 0.1) 71.4%);
  backdrop-filter: blur(0.162px);
  -webkit-backdrop-filter: blur(0.162px);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 3.57px;
  gap: 0;
}

.action-tab {
  position: relative;
  border: 0;
  border-radius: 158.361px;
  background: transparent;
  color: rgba(249, 249, 249, 0.7);
  font-size: 0.40541rem;
  overflow: hidden;
}

.action-tab--active {
  color: #f9f9f9;
}

.action-tab--active::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(249, 249, 249, 0.5);
  mix-blend-mode: hard-light;
  pointer-events: none;
}

.sheet-meta,
.quota-body {
  display: flex;
  flex-direction: column;
  gap: 0.337rem;
}

.sheet-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.24rem;
}

.sheet-row--top {
  margin-top: 0.05rem;
}

.sheet-label {
  margin: 0;
  color: rgba(249, 249, 249, 0.7);
  font-size: 0.432rem;
}

.sheet-username,
.sheet-balance {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.12rem;
  color: #f9f9f9;
  font-size: 0.434rem;
  font-weight: 500;
}

.sheet-id-tag {
  min-width: 0.72rem;
  height: 0.56rem;
  border-radius: 0.204rem;
  padding: 0 0.238rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.4);
  font-size: 0.393rem;
}

.sheet-balance img {
  width: 0.533rem;
  height: 0.533rem;
  object-fit: contain;
}

.sheet-placeholder {
  color: rgba(249, 249, 249, 0.85);
}

.quota-group-label {
  margin: 0;
  color: rgba(249, 249, 249, 0.7);
  font-size: 0.432rem;
  line-height: 1.35;
}

.quota-group-label p {
  margin: 0;
}

.quota-actions {
  display: inline-flex;
  gap: 0.225rem;
}

.quota-action {
  min-width: 1.895rem;
  height: 0.851rem;
  border: 0;
  border-radius: 4.016rem;
  padding: 0 0.422rem;
  background: rgba(6, 6, 6, 0.45);
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.322rem;
}

.quota-action--primary {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(153, 153, 153, 0.22) 100%);
  color: #78e490;
}

.quota-editor {
  border-radius: 0.44053rem;
  padding: 0.56rem;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.33467rem;
}

.quota-mode-row {
  display: flex;
  align-items: center;
  gap: 0.26667rem;
}

.quota-mode {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.317rem;
  display: inline-flex;
  align-items: center;
  gap: 0.079rem;
}

.quota-mode-radio {
  width: 0.4rem;
  height: 0.4rem;
  flex: 0 0 auto;
}

.quota-mode--active {
  color: #fff;
}

.quota-mode--active::before {
  display: none;
}

.quota-mode-icon {
  width: 0.4rem;
  height: 0.4rem;
  object-fit: contain;
  flex-shrink: 0;
}

.quota-input-pill {
  min-height: 0.88rem;
  border-radius: 0.68472rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.24rem 0.34667rem;
  display: flex;
  align-items: center;
  color: rgba(249, 249, 249, 0.95);
  font-size: 0.325rem;
}

.fund-keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.22rem;
  touch-action: manipulation;
}

.keypad-btn {
  position: relative;
  height: 50.904px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(233, 233, 233, 0.2) 0%, rgba(165, 165, 165, 0.4) 100%);
  mix-blend-mode: plus-lighter;
  border-radius: 14.157px;
  border: none;
  backdrop-filter: blur(6.02px);
  -webkit-backdrop-filter: blur(6.02px);
  font-weight: 500;
  font-size: 0.61rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
  touch-action: manipulation;
}

.keypad-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 0.71px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0) 55%,
    rgba(255, 255, 255, 0) 61%,
    rgba(255, 255, 255, 0.5) 100%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.keypad-btn:active {
  opacity: 0.7;
  transform: scale(0.96);
}

.keypad-btn--accent {
  border-radius: 60.241px;
  background: rgba(245, 45, 45, 0.2);
  mix-blend-mode: plus-lighter;
}

.keypad-del-icon {
  width: 50px;
  height: 32px;
}

.del-icon {
  width: 0.86rem;
  height: 0.562rem;
  border: 0.049rem solid rgba(255, 255, 255, 0.92);
  border-left: 0;
  border-radius: 0.113rem;
  position: relative;
}

.del-icon::before {
  content: '';
  position: absolute;
  left: -0.3rem;
  top: 50%;
  width: 0.3rem;
  height: 0.3rem;
  transform: translateY(-50%) rotate(45deg);
  border-top: 0.049rem solid rgba(255, 255, 255, 0.92);
  border-left: 0.049rem solid rgba(255, 255, 255, 0.92);
}

.del-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 0.22rem;
  height: 0.22rem;
  border-top: 0.045rem solid rgba(255, 255, 255, 0.92);
  border-right: 0.045rem solid rgba(255, 255, 255, 0.92);
  transform: rotate(135deg);
}

.sheet-footer-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9.738px;
}

.sheet-footer-btn {
  height: 55.184px;
  border: 0.02rem solid rgba(249, 249, 249, 0.1);
  border-radius: 1rem;
  background: rgba(170, 170, 170, 0.1);
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);
  color: #fff;
  font-size: 0.4rem;
}

.sheet-footer-btn--confirm {
  color: #78e490;
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: 0.075rem;
  min-width: 0;
}

.data-label,
.data-value {
  margin: 0;
  font-size: 0.25703rem;
  line-height: 1.1;
  color: #fff;
}

.data-label {
  opacity: 0.7;
  display: inline-flex;
  align-items: center;
  gap: 0.045rem;
}

.data-label img {
  width: 0.24rem;
  height: 0.24rem;
  object-fit: contain;
}

.data-value {
  font-weight: 500;
  white-space: nowrap;
}



.club-members-bg {
  @include theme-light-own {
    background-image: var(--club-members-bg-light);

    :deep(.back-trigger),
    :deep(.back-icon) {
      color: #000;
    }

    :deep(.title) {
      color: #000;
      text-shadow: none;
    }

    .member-total {
      color: rgba(34, 34, 34, 0.82);
    }

    .tab-btn {
      color: rgba(34, 34, 34, 0.62);
    }

    .tab-btn--active {
      color: #222;
    }

    .tab-btn--active::after {
      background: var(--c-brand, #05c297);
    }

    .summary-card,
    .record-panel {
      background: #fff;
      backdrop-filter: none;
      box-shadow: 0 0.06rem 0.2rem rgba(0, 0, 0, 0.05);
    }

    .summary-label,
    .summary-value {
      color: #222;
    }

    .income-btn {
      background: rgba(139, 136, 136, 0.15);
      color: #222;
    }

    .income-icon,
    .income-icon::after {
      border-color: rgba(34, 34, 34, 0.82);
    }

    .search-card {
      background: rgba(0, 0, 0, 0.05);
      border-color: rgba(0, 0, 0, 0.06);
      box-shadow: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }

    .search-icon {
      filter: brightness(0);
      opacity: 0.7;
    }

    .search-card input {
      color: rgba(15, 8, 8, 0.85);
    }

    .search-card input::placeholder {
      color: rgba(15, 8, 8, 0.45);
    }

    .member-list-status,
    .record-list-status {
      color: rgba(34, 34, 34, 0.58);
    }

    .member-card {
      background: #fff;
      backdrop-filter: none;
      box-shadow: 0 0.06rem 0.2rem rgba(0, 0, 0, 0.06);
    }

    .role-badge--admin,
    .role-badge--agent,
    .role-badge--member {
      background: linear-gradient(152deg, #65e89f 8%, #05c297 78%);
    }

    .member-name,
    .member-diamond,
    .member-id-row {
      color: #222;
    }

    .id-pill {
      background: rgba(0, 0, 0, 0.4);
      color: #fff;
    }

    .member-data-strip {
      background: rgba(34, 34, 34, 0.08);
      backdrop-filter: none;
    }

    .data-label,
    .data-value {
      color: #222;
    }

    .data-label--agent::before {
      background: rgba(34, 34, 34, 0.78);
    }

    .record-head,
    .record-stat-label,
    .record-stat-value {
      color: #222;
    }

    .record-stat-item:not(:last-child)::after {
      background: rgba(34, 34, 34, 0.16);
    }

    .range-tabs {
      background: rgba(139, 136, 136, 0.15);
    }

    .range-tab {
      color: rgba(34, 34, 34, 0.72);
    }

    .range-tab--active {
      background: #cfcfcf;
      color: #222;
    }

    .record-table-head {
      background: var(--c-brand, #05c297);
      &::before {
        background: var(--c-brand, #05c297);
      }
    }

    .type-dropdown {
      background: rgba(0, 0, 0, 0.37);
      box-shadow: none;
      backdrop-filter: blur(0.16rem);
      -webkit-backdrop-filter: blur(0.16rem);
    }

    .type-option {
      color: rgba(255, 255, 255, 0.92);
      border-bottom-color: rgba(255, 255, 255, 0.2);
    }

    .type-option--active {
      color: #fff;
    }

    .record-row,
    .record-row--pftroom {
      background: #fff;
    }

    .record-main-grid {
      color: #222;
    }

    .sub-line {
      color: rgba(34, 34, 34, 0.5);
    }

    .from-chip {
      background: var(--c-brand, #05c297);
      color: #0b1c20;
    }

    // Figma 9394:27766 / 9394:28387：浅色页面上的基金操作浮窗仍保持
    // 深灰玻璃层与白色内容，操作强调色切换为浅色主题绿。
    .fund-sheet {
      background: linear-gradient(
        180deg,
        rgba(102, 106, 108, 0.96) 0%,
        rgba(76, 79, 81, 0.97) 58%,
        rgba(61, 63, 64, 0.98) 100%
      );
      box-shadow:
        0 -0.12rem 0.48rem rgba(0, 0, 0, 0.2),
        inset 0 0.02rem 0 rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(0.42rem);
      -webkit-backdrop-filter: blur(0.42rem);
    }

    .quota-action--primary {
      background: var(--c-brand, #05c297);
      color: #fff;
    }

    .quota-action:not(.quota-action--primary) {
      background: rgba(6, 6, 6, 0.4);
      color: rgba(255, 255, 255, 0.55);
      box-shadow: 0.014rem 0.016rem 0.032rem rgba(0, 0, 0, 0.25);
    }

    .quota-editor {
      background: rgba(255, 255, 255, 0.18);
      box-shadow: inset 0 0.02rem 0 rgba(255, 255, 255, 0.16);
    }

    .keypad-btn {
      border-color: rgba(255, 255, 255, 0.28);
      background: rgba(12, 12, 12, 0.38);
    }

    .keypad-btn--accent {
      border-color: transparent;
      background: rgba(5, 194, 151, 0.76);
    }

    .sheet-footer-btn {
      background: rgba(6, 6, 6, 0.5);
    }

    .sheet-footer-btn--confirm {
      border-color: rgba(242, 242, 242, 0.8);
      background: var(--c-brand, #05c297);
    }
  }
}

@media (max-width: 340px) {
  .member-total {
    font-size: 0.32013rem;
  }

  .tab-btn {
    font-size: 0.405rem;
  }

  .summary-value {
    font-size: 0.34504rem;
  }

  .member-name {
    font-size: 0.42rem;
  }

  .record-stat-value {
    font-size: 0.63rem;
  }

  .record-main-grid p {
    font-size: 0.27rem;
  }
}

:deep(.page-back-header .title) {
  font-size: 0.48rem !important;
}
</style>
