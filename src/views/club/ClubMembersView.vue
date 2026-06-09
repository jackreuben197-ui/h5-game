<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { showFailToast, showSuccessToast } from 'vant'
import { formatUC } from '@/utils/roomVisibility'
import {
  postClubFundChangeLogApi,
  postOrgClubCreditBalanceApi,
  postOrgClubCreditLimitApi,
  postOrgClubGoldApi,
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
import imgAvatar from '@/assets/images/default_avatar.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgBalance from '@/assets/icons/icon_chip_green.png'
import icTimeRefresh from '@/assets/icons/ic_time_refresh.svg'
import icSearch from '@/assets/icons/ic_search.svg'
import { useUserInfoStore } from '@/stores/userInfo'
import { t } from '@/i18n'
import mainBgUrl from '@/assets/images/main_bg.webp'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

type TabKey = 'account' | 'record'
type MemberRole = '会长' | '管理员' | '代理人' | '成员'
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
const activeTab = ref<TabKey>('account')
const searchKeyword = ref('')
const activeRange = ref<RecordRangeKey>('today')
const selectedRecordType = ref('all')
const showTypeMenu = ref(false)
const pageRef = ref<HTMLElement | null>(null)
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

const keypadRows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', 'DEL'],
] as const

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
    return quotaInput.value || '请输入整数'
  }

  return fundAmountInput.value || '请输入发放数量'
})

const fundSubmitLabel = computed(() => (fundActionTab.value === 'grant' ? '发放' : '回收'))
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
  const total =
    membersTotal.value ||
    toSafeNumber(userInfoStore.currentClub?.club_members) ||
    members.value.length
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
  { label: '俱乐部总余额', value: clubFundSummary.value.clubBalance, icon: 'chips' },
  { label: '成员在桌余额', value: clubFundSummary.value.membersTableBalance, icon: 'chips' },
  { label: '成员总余额', value: clubFundSummary.value.membersTotalBalance, icon: 'chips' },
])

const summaryBottom = computed<SummaryItem[]>(() => [
  { label: '成员总免审额', value: clubFundSummary.value.membersCreditLimit, icon: 'balance' },
  { label: '俱乐部钻石', value: clubFundSummary.value.clubDiamond, icon: 'diamond' },
])

const recordRanges: RecordRangeItem[] = [
  { key: 'today', label: '今天' },
  { key: 'seven', label: '7天' },
  { key: 'thirty', label: '30天' },
  { key: 'custom', label: '自定义' },
]

const recordStats = computed<RecordStatItem[]>(() => [
  { id: 1, label: '发放', value: formatUC(grantAmountTotal.value) },
  { id: 2, label: '回收', value: formatUC(recoverAmountTotal.value) },
  { id: 3, label: '分润', value: formatUC(profitAmountTotal.value) },
  { id: 4, label: '变动', value: formatUC(changeAmountTotal.value) },
])

const recordTypeOptions: RecordTypeOption[] = [
  { key: 'all', textKey: 'adaptation10123', fallbackText: '所有', opCodes: null },
  {
    key: 'grant',
    textKey: 'UIClub_FundGive',
    fallbackText: '发放',
    opCodes: ['CLUBTOUSER', 'PAYUSER'],
  },
  {
    key: 'recycle',
    textKey: 'UIClub_FundDetail_recycle',
    fallbackText: '回收',
    opCodes: ['CLUBRECOVEUSER', 'TAKEOVER'],
  },
  {
    key: 'room_service_fee',
    textKey: 'UIGuildClubRoomFee',
    fallbackText: '房间服务费',
    opCodes: ['PFTROOM', 'PFTINSUR'],
  },
  {
    key: 'deposit',
    textKey: 'UIGuildClubManagerDepositsTip',
    fallbackText: '存款',
    opCodes: ['TRIBETOCLUB', 'RECHARGE', 'RECHGTRB'],
  },
  {
    key: 'withdraw',
    textKey: 'UIGuildClubManagerWithdrawTip',
    fallbackText: '取款',
    opCodes: ['TRIBERECOVECLUB'],
  },
  {
    key: 'mtt_service_fee',
    textKey: 'UIGuildClubMTTFee',
    fallbackText: 'MTT服务费',
    opCodes: ['PFTMTT'],
  },
  {
    key: 'insurance_income',
    textKey: 'UIGuildClubInsuranceIncome',
    fallbackText: '保险收入',
    opCodes: ['INSURIN', 'INSUROUT'],
  },
  {
    key: 'deposit_detail',
    textKey: 'UIGuildClubDepositFee',
    fallbackText: '押金明细',
    opCodes: ['DEPOSITADV', 'DEPOSITRTN'],
  },
  {
    key: 'player_profit_deduct',
    textKey: 'UIGuildClubPlayerProfitDeduction',
    fallbackText: '玩家盈利扣除',
    opCodes: ['USERDEDUCTROOM'],
  },
  {
    key: 'sng_service_fee',
    textKey: 'UISNGFee',
    fallbackText: 'SNG服务费',
    opCodes: ['PFTSNG'],
  },
  {
    key: 'club_balance_out',
    textKey: 'UIGuildClubAccountOut',
    fallbackText: '联盟平账支出',
    opCodes: ['TRIBEBALCLUB', 'CLUBBALUSER'],
  },
  {
    key: 'tribe_grant',
    textKey: 'UIAllianceRelease',
    fallbackText: '联盟发放',
    opCodes: ['TRIBETOCLUB'],
  },
  {
    key: 'cowboy_income',
    textKey: 'UIGuildClubDetailsCowboyTip',
    fallbackText: '牛仔收入',
    opCodes: ['PFTCBIN'],
  },
  {
    key: 'cowboy_compensation',
    textKey: 'UINiuZaiPFTCBOUT',
    fallbackText: '牛仔赔付',
    opCodes: ['PFTCBOUT'],
  },
  {
    key: 'prop_exchange',
    textKey: 'UIPropExchangeDes',
    fallbackText: '道具兑换',
    opCodes: ['WHEELAWARD'],
  },
  {
    key: 'mahjong_mtt_fee',
    textKey: 'UIMahjongMTT12',
    fallbackText: '麻将MTT服务费',
    opCodes: ['MJPFTMTT'],
  },
  {
    key: 'other',
    textKey: 'UIChatReport008',
    fallbackText: '其他',
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

  return {}
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
    type: opCodeText || opCode || '未知',
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
  return otherType ? resolveRecordTypeLabel(otherType) : opCode || '未知'
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

async function fetchClubGoldSummary(): Promise<void> {
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
      throw new Error(typeof response.msg === 'string' ? response.msg : '获取俱乐部基金失败')
    }

    clubGoldSummary.value = response.data
  } catch (error) {
    clubGoldSummary.value = null
    const message = error instanceof Error ? error.message : '获取俱乐部基金失败'
    showFailToast(message)
  } finally {
    loadingClubGold.value = false
  }
}

async function fetchRecordRows(reset = false): Promise<void> {
  if (loadingRecords.value || loadingMoreRecords.value) {
    return
  }

  if (!reset && !hasMoreRecords.value) {
    return
  }

  const currentClub = userInfoStore.currentClub
  if (!currentClub?.random_id) {
    if (reset) {
      recordRows.value = []
      hasMoreRecords.value = false
      recordsTotal.value = 0
    }
    return
  }

  if (reset) {
    loadingRecords.value = true
    recordOffset.value = 0
    hasMoreRecords.value = true
  } else {
    loadingMoreRecords.value = true
  }

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
      order_type: 2,
      ...rangePayload,
    })

    if (response.code !== 0 || !response.data) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '获取基金记录失败')
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
  } catch (error) {
    if (reset) {
      recordRows.value = []
      hasMoreRecords.value = false
      recordsTotal.value = 0
    }
    const message = error instanceof Error ? error.message : '获取基金记录失败'
    showFailToast(message)
  } finally {
    if (reset) {
      loadingRecords.value = false
    } else {
      loadingMoreRecords.value = false
    }
  }
}

function onRecordScroll(event: Event): void {
  if (
    activeTab.value !== 'record' ||
    loadingRecords.value ||
    loadingMoreRecords.value ||
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
    return { role: '会长', identityType: 'founder' }
  }

  if (userLevel === 2 || userLevel === 3) {
    return { role: '管理员', identityType: 'admin' }
  }

  if (userLevel === 4 || memberType === 2) {
    return { role: '代理人', identityType: 'agent' }
  }

  return { role: '成员', identityType: 'player' }
}

function mapMember(record: OrgMemberListRecord): MemberItem {
  const id = toSafeNumber(record.user_id)
  const roleInfo = resolveRole(record)
  const clubGoldCredit = toSafeNumber(record.club_gold_credit)
  const clubGoldCreditLimit = toSafeNumber(record.club_gold_credit_limit)

  return {
    id,
    name: String(record.remark_name || record.nick_name || `成员${id || '--'}`),
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

async function refreshFundData(): Promise<void> {
  patchActiveMemberOnList()
  await Promise.all([fetchMembers(true), fetchClubGoldSummary(), fetchRecordRows(true)])
  syncActiveMemberFromMembers()
}

async function fetchMembers(reset = false): Promise<void> {
  if (loadingMembers.value || loadingMoreMembers.value) {
    return
  }

  if (!reset && !hasMoreMembers.value) {
    return
  }

  const currentClub = userInfoStore.currentClub
  if (!currentClub?.random_id && !currentClub?.club_id) {
    if (reset) {
      members.value = []
      membersTotal.value = 0
      hasMoreMembers.value = false
    }
    showFailToast('未找到俱乐部信息')
    return
  }

  if (reset) {
    loadingMembers.value = true
    membersOffset.value = 0
    hasMoreMembers.value = true
  } else {
    loadingMoreMembers.value = true
  }

  try {
    const currentOffset = reset ? 0 : membersOffset.value
    const response = await postOrgMemberListApi({
      club_id: currentClub?.club_id,
      club_random_id: currentClub?.random_id,
      search: searchKeyword.value.trim(),
      sort_type: 8,
      order_type: 2,
      gold_type: 1,
      simple: false,
      hide_slave: true,
      limit: PAGE_SIZE,
      offset: currentOffset,
    })

    if (response.code !== 0 || !response.data) {
      const message = typeof response.msg === 'string' ? response.msg : '获取成员列表失败'
      throw new Error(message)
    }

    const rawMembers = Array.isArray(response.data.data) ? response.data.data : []
    const nextMembers = rawMembers.map(mapMember)

    members.value = reset ? nextMembers : [...members.value, ...nextMembers]
    membersOffset.value = currentOffset + rawMembers.length

    const total = toSafeNumber(response.data.total)
    membersTotal.value = total > 0 ? total : members.value.length
    memberListTotalGold.value = toSafeNumber(response.data.total_info?.total_gold)

    if (total > 0) {
      hasMoreMembers.value = membersOffset.value < total
    } else {
      hasMoreMembers.value = rawMembers.length >= PAGE_SIZE
    }
  } catch (error) {
    if (reset) {
      members.value = []
      membersTotal.value = 0
      hasMoreMembers.value = false
    }
    const message = error instanceof Error ? error.message : '获取成员列表失败'
    showFailToast(message)
  } finally {
    if (reset) {
      loadingMembers.value = false
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

function onPageScroll(event: Event): void {
  if (activeTab.value !== 'account') {
    return
  }

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
    showFailToast('未找到成员信息')
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
    throw new Error(typeof response.msg === 'string' ? response.msg : '额度修改失败')
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

    showSuccessToast('重置成功')
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
    const message = error instanceof Error ? error.message : '重置失败'
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
      showFailToast('请输入正确的额度')
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

      showSuccessToast('额度修改成功')
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
      const message = error instanceof Error ? error.message : '额度修改失败'
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
    showFailToast('请输入正确的发放数量')
    return
  }

  submittingFund.value = true
  try {
    let response: { code?: number; msg?: string } = {}

    if (fundAssetTab.value === 'diamond') {
      const clubId = toSafeNumber(userInfoStore.currentClub?.club_id)
      if (!clubId) {
        throw new Error('未找到俱乐部信息')
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
      throw new Error(typeof response.msg === 'string' ? response.msg : '操作失败')
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

    showSuccessToast(fundActionTab.value === 'grant' ? '发放成功' : '回收成功')
    closeFundSheet()
    await refreshFundData()
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败'
    showFailToast(message)
  } finally {
    submittingFund.value = false
  }
}

function onSearchSubmit(): void {
  void fetchMembers(true)
}

function switchRange(range: RecordRangeKey): void {
  activeRange.value = range
  void fetchRecordRows(true)
}

function toggleTypeMenu(): void {
  showTypeMenu.value = !showTypeMenu.value
}

function chooseType(typeKey: string): void {
  selectedRecordType.value = typeKey
  showTypeMenu.value = false
  void fetchRecordRows(true)
}

function roleClass(role: MemberRole): string {
  if (role === '成员') {
    return 'role-badge--member'
  }

  if (role === '代理人') {
    return 'role-badge--agent'
  }

  return 'role-badge--admin'
}

onMounted(() => {
  void Promise.all([fetchMembers(true), fetchClubGoldSummary(), fetchRecordRows(true)])
})
</script>

<template>
  <div
    ref="pageRef"
    class="page-shell club-members-bg"
    :style="backgroundStyle"
    @scroll="onPageScroll"
  >
    <HeaderBack :title="'基金管理'">
      <template #right>
        <p class="member-total">
          会员总数 <span>{{ memberTotalText }}</span>
        </p>
      </template>
    </HeaderBack>
    <div class="club-members">
      <nav class="member-tabs" aria-label="基金页签">
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'account' }"
          @click="switchTab('account')"
        >
          账户
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'record' }"
          @click="switchTab('record')"
        >
          记录
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

            <button type="button" class="income-btn" @click="onIncomeQuery">
              <span>收益查询</span>
              <img :src="icTimeRefresh" alt="" class="income-icon" aria-hidden="true" />
            </button>
          </div>
        </section>

        <section class="search-card">
          <img :src="icSearch" alt="" class="search-icon" aria-hidden="true" />
          <input
            v-model.trim="searchKeyword"
            type="text"
            placeholder="玩家查询"
            @keydown.enter="onSearchSubmit"
          />
        </section>

        <section class="members-list" aria-label="成员列表">
          <article v-for="member in members" :key="member.id" class="member-card">
            <span class="role-badge" :class="roleClass(member.role)">{{ member.role }}</span>

            <div class="member-main">
              <div class="member-left">
                <img class="member-avatar" :src="member.avatar" :alt="`${member.name}头像`" />
                <div class="member-base">
                  <button type="button" class="member-name" @click="openMemberDetail(member)">
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
                  <span>UC</span>
                </p>
                <p class="data-value">{{ formatUC(member.uc) }}</p>
              </div>

              <div class="data-item">
                <p class="data-label">
                  <img :src="imgBalance" alt="" aria-hidden="true" />
                  <span>免审额</span>
                </p>
                <p class="data-value">{{ member.freeLimit }}</p>
              </div>

              <div class="data-item">
                <p class="data-label data-label--agent">
                  <span>所属代理</span>
                </p>
                <p class="data-value">{{ member.agentName }}</p>
              </div>
            </div>
          </article>

          <p v-if="!members.length && !loadingMembers" class="member-list-status">暂无成员数据</p>
          <p v-if="loadingMembers" class="member-list-status">加载中...</p>
          <p v-else-if="members.length && loadingMoreMembers" class="member-list-status">
            加载更多...
          </p>
          <p v-else-if="members.length && !hasMoreMembers" class="member-list-status">没有更多了</p>
        </section>
      </template>

      <template v-else>
        <section class="record-panel">
          <header class="record-head">
            <span>支持查询三个月数据</span>
            <span>时区 UTC+0</span>
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
              {{ item.label }}
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
            <button type="button" class="head-cell head-cell--time">
              <span>时间</span>
              <svg class="tiny-arrow" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3.5 4.5L6 7L8.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button type="button" class="head-cell head-cell--type" @click="toggleTypeMenu">
              <span>类型</span>
              <svg class="tiny-arrow" :class="{ 'tiny-arrow--open': showTypeMenu }" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3.5 4.5L6 7L8.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <span class="head-cell head-cell--quantity">数量</span>
            <span class="head-cell head-cell--balance">余额</span>
            <span class="head-cell">备注</span>
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
              :class="{ 'record-row--pftroom': row.opCode === 'PFTROOM' }"
            >
              <div v-if="row.showFromTag && row.fromName && row.fromId" class="from-chip">
                <span class="from-label">From</span>
                <span>{{ row.fromName }}</span>
                <span class="from-id-pill">ID</span>
                <span>{{ row.fromId }}</span>
              </div>

              <div class="record-main-grid">
                <p class="time-cell">
                  <span>{{ row.date }}</span>
                  <span class="sub-line">{{ row.time }}</span>
                </p>
                <p class="type-cell">{{ row.type }}</p>
                <p class="quantity-cell">{{ row.quantity }}</p>
                <p class="balance-cell">{{ row.balance }}</p>
                <p class="remark-cell">
                  <span class="remark-main" :title="row.remark">{{ row.remark }}</span>
                  <span class="sub-line">{{ row.remarkId }}</span>
                </p>
              </div>
            </article>

            <p v-if="!recordRows.length && !loadingRecords" class="record-list-status">暂无记录</p>
            <p v-if="loadingRecords" class="record-list-status">加载中...</p>
            <p v-else-if="recordRows.length && loadingMoreRecords" class="record-list-status">
              加载更多...
            </p>
            <p v-else-if="recordRows.length && !hasMoreRecords" class="record-list-status">
              没有更多了
            </p>
          </section>
        </div>
      </template>

      <div v-if="showFundSheet" class="fund-sheet-mask" @click="closeFundSheet"></div>

      <section v-if="showFundSheet && activeMember" class="fund-sheet" @click.stop>
        <div class="fund-tabs" role="tablist" aria-label="基金资产类型">
          <button
            v-if="shouldShowCoinFundTab"
            type="button"
            class="fund-tab"
            :class="{ 'fund-tab--active': fundAssetTab === 'coin' }"
            @click="switchFundAsset('coin')"
          >
            联盟币
          </button>
          <button
            type="button"
            class="fund-tab"
            :class="{ 'fund-tab--active': fundAssetTab === 'quota' }"
            @click="switchFundAsset('quota')"
          >
            额度
          </button>
          <button
            v-if="shouldShowDiamondFundTab"
            type="button"
            class="fund-tab"
            :class="{ 'fund-tab--active': fundAssetTab === 'diamond' }"
            @click="switchFundAsset('diamond')"
          >
            钻石
          </button>
        </div>

        <div v-if="fundAssetTab === 'coin'" class="fund-action-switch">
          <button
            type="button"
            class="action-tab"
            :class="{ 'action-tab--active': fundActionTab === 'grant' }"
            @click="switchFundAction('grant')"
          >
            发放
          </button>
          <button
            type="button"
            class="action-tab"
            :class="{ 'action-tab--active': fundActionTab === 'recycle' }"
            @click="switchFundAction('recycle')"
          >
            回收
          </button>
        </div>

        <div v-if="fundAssetTab === 'quota'" class="quota-body">
          <div class="sheet-row sheet-row--top">
            <p class="sheet-label">用户名</p>
            <p class="sheet-username">
              <span>{{ activeMember.name }}</span>
              <span class="sheet-id-tag">ID</span>
              <span>{{ activeMember.uid }}</span>
            </p>
          </div>

          <div class="sheet-row">
            <div class="quota-group-label">
              <p>可支配额度</p>
              <p>{{ formatUC(disposableQuota) }}</p>
            </div>
            <div class="quota-actions">
              <button
                type="button"
                class="quota-action quota-action--primary"
                @click="editQuota('disposable')"
              >
                修改
              </button>
              <button type="button" class="quota-action" @click="resetQuota('disposable')">
                重置
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
                增加额度
              </button>
              <button
                type="button"
                class="quota-mode"
                :class="{ 'quota-mode--active': quotaAdjustMode === 'decrease' }"
                @click="quotaAdjustMode = 'decrease'"
              >
                减少额度
              </button>
            </div>
            <div class="quota-input-pill">{{ currentInputText }}</div>
          </section>

          <div class="sheet-row">
            <div class="quota-group-label">
              <p>免审核额度</p>
              <p>{{ formatUC(reviewQuota) }}</p>
            </div>
            <div class="quota-actions">
              <button
                type="button"
                class="quota-action quota-action--primary"
                @click="editQuota('review')"
              >
                修改
              </button>
              <button type="button" class="quota-action" @click="resetQuota('review')">重置</button>
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
                增加额度
              </button>
              <button
                type="button"
                class="quota-mode"
                :class="{ 'quota-mode--active': quotaAdjustMode === 'decrease' }"
                @click="quotaAdjustMode = 'decrease'"
              >
                减少额度
              </button>
            </div>
            <div class="quota-input-pill">{{ currentInputText }}</div>
          </section>
        </div>

        <div v-else class="sheet-meta">
          <div class="sheet-row sheet-row--top">
            <p class="sheet-label">用户名</p>
            <p class="sheet-username">
              <span>{{ activeMember.name }}</span>
              <span class="sheet-id-tag">ID</span>
              <span>{{ activeMember.uid }}</span>
            </p>
          </div>

          <div class="sheet-row">
            <p class="sheet-label">余额</p>
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
            <p class="sheet-label">发放数量</p>
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
          <div v-for="(row, rowIndex) in keypadRows" :key="rowIndex" class="fund-keypad-row">
            <button
              v-for="key in row"
              :key="key"
              type="button"
              class="keypad-btn"
              :class="{
                'keypad-btn--accent': key === 'C' || key === 'DEL',
                'keypad-btn--del': key === 'DEL',
              }"
              @click="onKeypadPress(key)"
            >
              <span v-if="key !== 'DEL'">{{ key }}</span>
              <Icon v-else icon="solar:backspace-bold" />
            </button>
          </div>
        </div>

        <div class="sheet-footer-actions">
          <button type="button" class="sheet-footer-btn" @click="closeFundSheet">取消</button>
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
  </div>
</template>

<style scoped lang="scss">
.club-members-bg {
  position: relative;
  height: 100dvh;
  background-size: cover;
}

.club-members {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100dvh;
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
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
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
  gap: 0.06rem;
}

.summary-label {
  margin: 0;
  font-size: 0.32013rem;
  line-height: 1.2;
  color: #f3f3f3;
}

.summary-value {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.045rem;
  font-size: 0.43204rem;
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
  border: 0;
  border-radius: 0.51rem;
  background: rgba(180, 178, 178, 0.18);
  color: #f3f3f3;
  font-size: 0.32013rem;
  line-height: 1;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.06rem;
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
  gap: 0.27027rem;
  padding-bottom: 0.21rem;
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
}

.record-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.range-tab--active {
  background: rgba(249, 249, 249, 0.5);
  font-weight: 700;
  opacity: 1;
}

.record-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.09028rem;
  padding: 0;
}

.record-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.07356rem;
  text-align: center;
}

.record-stat-label {
  margin: 0;
  font-size: 0.28213rem;
  color: rgba(249, 249, 249, 0.82);
}

.record-stat-value {
  margin: 0;
  font-size: 0.54054rem;
  line-height: 1;
  color: #f9f9f9;
}

.record-table-wrap {
  --record-columns: 1.2fr 1fr 1fr 1fr 1.2fr;
  --record-col-gap: 0.08rem;
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.15674rem;
  min-height: 0;
  overflow: hidden;
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
    background: #5699cd;
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

.type-dropdown {
  position: absolute;
  top: 0.9rem;
  left: 0.08rem;
  width: 3.9899rem;
  max-height: 10.2633rem;
  overflow: auto;
  border-radius: 0.42929rem;
  padding: 0.36195rem 0.43771rem;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(0.18rem);
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
  overflow: auto;
  padding-right: 0;
}

.record-list-status {
  margin: 0;
  text-align: center;
  font-size: 0.292rem;
  color: rgba(249, 249, 249, 0.75);
  padding: 0.12rem 0;
}

.record-row {
  border-radius: 0.37751rem;
  background: rgba(0, 0, 0, 0.22);
  padding: 0.08rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.06rem;
}

.record-row--pftroom {
  background: rgba(0, 0, 0, 0.26);
}

.from-chip {
  align-self: flex-start;
  margin: 0 0.16rem;
  border-radius: 0.34rem;
  background: rgba(255, 255, 255, 0.17);
  border: 0.02rem solid rgba(255, 255, 255, 0.32);
  padding: 0.06rem 0.14rem;
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
  color: rgba(249, 249, 249, 0.86);
  font-size: 0.224rem;
}

.from-label {
  opacity: 0.7;
}

.from-id-pill {
  border-radius: 0.18153rem;
  background: rgba(255, 255, 255, 0.3);
  padding: 0 0.08rem;
  color: #fff;
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
.balance-cell,
.sub-line {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remark-main {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-line {
  font-size: 0.22727rem;
  color: rgba(249, 249, 249, 0.55);
}

.quantity-cell {
  border-radius: 0.37751rem;
  background: rgba(255, 255, 255, 0.15);
  min-height: 0.51rem;
  width: 100%;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.16rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-card {
  position: relative;
  padding: 0.16064rem 0.43919rem 0.28112rem;
  border-radius: 1.05574rem;
  background:
    radial-gradient(78% 88% at 12% 34%, rgba(188, 117, 151, 0.5), rgba(188, 117, 151, 0)),
    radial-gradient(94% 88% at 92% 74%, rgba(47, 161, 212, 0.46), rgba(47, 161, 212, 0)),
    rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(0.21rem);
}

.role-badge {
  position: absolute;
  top: -0.15rem;
  left: 0.03rem;
  padding: 0 0.15rem;
  min-height: 0.45rem;
  border-radius: 0.225rem;
  display: inline-flex;
  align-items: center;
  font-size: 0.24738rem;
  font-weight: 600;
  color: #fff;
  box-shadow: 0 0.03rem 0.09rem rgba(0, 0, 0, 0.25);
}

.role-badge--admin {
  background: linear-gradient(152deg, rgba(85, 243, 41, 1) 8%, rgba(62, 173, 6, 1) 72%);
}

.role-badge--agent {
  background: linear-gradient(152deg, rgba(85, 243, 41, 1) 8%, rgba(62, 173, 6, 1) 72%);
}

.role-badge--member {
  background: linear-gradient(152deg, #15d39f 8%, #017157 72%);
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
  background: rgba(255, 255, 255, 0.3);
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
  padding: 0.64257rem 0.53209rem calc(0.5472rem + env(safe-area-inset-bottom));
  background: linear-gradient(
    90deg,
    rgba(0, 8, 20, 0.95) 0%,
    rgba(5, 5, 5, 0.95) 52%,
    rgba(0, 8, 20, 0.95) 100%
  );
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
}

.fund-action-switch {
  align-self: center;
  width: 8.08835rem;
  min-height: 1.35743rem;
  border-radius: 4.223rem;
  background: rgba(255, 255, 255, 0.2);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 0.09521rem;
}

.action-tab {
  border: 0;
  border-radius: 4.223rem;
  background: transparent;
  color: #f9f9f9;
  font-size: 0.40541rem;
}

.action-tab--active {
  border: 0.005rem solid rgba(249, 249, 249, 0.85);
  background: rgba(255, 255, 255, 0.2);
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
  background: rgba(5, 231, 174, 0.4);
  color: #fff;
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

.quota-mode::before {
  content: '';
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  border: 0.03rem solid rgba(255, 255, 255, 0.5);
  box-sizing: border-box;
}

.quota-mode--active {
  color: #fff;
}

.quota-mode--active::before {
  border-color: rgba(95, 247, 209, 0.92);
  box-shadow: inset 0 0 0 0.1rem rgba(95, 247, 209, 0.85);
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
  display: flex;
  flex-direction: column;
  gap: 0.20587rem;
}

.fund-keypad-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.15261rem;
}

.keypad-btn {
  min-height: 1.35393rem;
  border: 0.01907rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.37751rem;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 0.61044rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.keypad-btn--accent {
  background: rgba(4, 209, 157, 0.26);
  border-color: transparent;
}

.keypad-btn--del {
  font-size: 0.61044rem;
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
  gap: 0.25291rem;
}

.sheet-footer-btn {
  min-height: 1.4372rem;
  border: 0;
  border-radius: 1.05761rem;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 0.4rem;
}

.sheet-footer-btn--confirm {
  border: 0.013rem solid rgba(242, 242, 242, 0.8);
  background: linear-gradient(156deg, rgba(85, 243, 41, 1) 8%, rgba(62, 173, 6, 1) 72%);
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

.data-label--agent::before {
  content: '';
  width: 0.195rem;
  height: 0.195rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  flex: 0 0 auto;
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
</style>
