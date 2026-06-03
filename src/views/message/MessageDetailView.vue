<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { postClubFundApplyListApi, postClubFundAuditApi } from '@/api/order'
import { postMsgMessageListApi, postMsgMessageUnreadClearApi } from '@/api/msg'
import {
  postRoomClubApplyAuditApi,
  postUserRoomSitApplyRecordsApi,
  postRoomcenterFriendRoomApplyAuditApi,
} from '@/api/roomcenter'
import type {
  MsgMessageListData,
  MsgMessageListMsgInfo,
  MsgMessageListResponseData,
} from '@/api/models/msg'
import { t } from '@/i18n'
import { formatDateTime } from '@/utils/time'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'
import avatarDefault from '@/assets/images/default_avatar.png'
import imgDefaultAva from '@/assets/images/img_default_ava.png'
import iconPeople from '@/assets/icons/icon_people.png'
import iconDollars from '@/assets/icons/ic_dollars.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { formatUC } from '@/utils/roomVisibility'

type MessagePageType = 'system' | 'credit' | 'uc' | 'other'
type CreditStatus = 'pending' | 'rejected' | 'approved'

const MSG_SUB_TYPE = {
  MsgBagTypeGetTickets: 1000,
  MsgBagTypeUserTransferTicketsToSelf: 1001,
  MsgBagTypeUserTransferTicketsToOther: 1002,
  MsgBagTypeSignUpMatch: 1007,
  MsgBagTypeAwardPropsByEveryDayTask: 1008,
  MsgBagTypeAwardPropsByAchievementsTask: 1009,
  MsgBagTypeAwardPropsByVipInvitationReward: 1010,
  MsgBagTypeClubGrantGold: 1011,
  MsgBagTypeTribeGivePropToClub: 1012,
  MsgClubTypeRechargeRequest: 2003,
  MsgClubTypeWithdrawRequest: 2004,
  MsgClubTypeRechargeRefuse: 2005,
  MsgClubTypeRecselfpft: 2022,
  MsgClubTypeCloseClub: 2024,
  MsgClubTypeUserGradeQuickly: 2025,
  MsgClubTypeUserGradeDrain: 2026,
  MsgClubTypeAutoCloseSevenDays: 2027,
  MsgClubTypeAutoCloseOneDay: 2028,
  MsgClubTypeAutoCloseNow: 2029,
  MsgMoneyTypeReleaseClubFunds: 3000,
  MsgMoneyTypeMatchWin: 3002,
  MsgMoneyTypeMatchSignUp: 3003,
  MsgSuper1AwardDiscount: 3013,
  MsgCLUBTOUSER: 3023,
  MsgCLUBRECOVEUSER: 3024,
  MsgMoneyTypeTribeToClub: 3025,
  MsgMoneyTypeTribeRecoveClub: 3026,
  MsgMoneyTypeDiamondTribeToUser: 3029,
  MSG_CLUB_TYPE_JACKPOT_AWD: 2023,
  MSG_MONEY_TYPE_JACKPOT_AWD: 3032,
  MsgTribeTypeKickOutUser: 5014,
} as const

interface SystemMessageItem {
  segments: MessageTextSegment[]
  time: string
}

interface MessageTextSegment {
  text: string
  green?: boolean
}

interface CreditMessageItem {
  id?: number
  roomId?: number
  texasId?: string
  clubName: string
  time: string
  playerName: string
  playerId: string
  amount: string
  status: CreditStatus
  approverName?: string
  approverId?: string
  avatar: string
  senderIcon?: string
}

interface UcMessageItem {
  orderNo?: string
  status: CreditStatus
  clubName: string
  time: string
  playerName: string
  playerId: string
  amount: string
  approverName?: string
  approverId?: string
  avatar: string
  clubLogo?: string
}

interface OtherMessageItem {
  segments: MessageTextSegment[]
  plainText: string
  clubName: string
  senderIcon?: string
  time: string
  wrap?: boolean
}

const route = useRoute()

const pageType = computed<MessagePageType>(() => {
  const type = route.query.type
  if (type === 'system' || type === 'credit' || type === 'uc' || type === 'other') {
    return type
  }
  return 'other'
})

const pageTitle = computed(() => {
  const titleFromQuery = route.query.title
  if (typeof titleFromQuery === 'string' && titleFromQuery.trim()) return titleFromQuery

  if (pageType.value === 'system') return '系统消息'
  if (pageType.value === 'credit') return '带入申请'
  if (pageType.value === 'uc') return 'UC申请'
  return '消息'
})

const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const systemMessages = ref<SystemMessageItem[]>([])
const creditMessages = ref<CreditMessageItem[]>([])
const ucMessages = ref<UcMessageItem[]>([])
const otherMessages = ref<OtherMessageItem[]>([])
const pageShellRef = ref<HTMLElement | null>(null)
const msgLimit = 10
const msgOffset = ref(0)
const msgTotal = ref(0)
const msgListLoading = ref(false)
const msgHasMore = ref(true)

const creditOffset = ref(0)
const creditTotal = ref(0)
const creditLoading = ref(false)
const creditHasMore = ref(true)

const ucOffset = ref(0)
const ucTotal = ref(0)
const ucLoading = ref(false)
const ucHasMore = ref(true)

const messageType = computed<number>(() => {
  const raw = Number(route.query.msgType)
  if (Number.isFinite(raw) && raw > 0) {
    return raw
  }
  return pageType.value === 'system' ? 4 : 1
})

function formatTime(value: unknown): string {
  return formatDateTime(value, 'YYYY/MM/DD HH:mm')
}

function mapStatus(value: unknown): CreditStatus {
  const status = Number(value)
  if (status === 1) return 'pending'
  if (status === 2) return 'approved'
  if (status === 3 || status === 4 || status === 5 || status === 6) return 'rejected'
  return 'pending'
}

function formatNumericText(value: unknown, divideBy = 1): string {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return String(value ?? '')
  }
  return (numeric / divideBy).toLocaleString('en-US')
}

function formatTimestampTitle(rawTitle: string): string {
  const timestamp = Number(rawTitle)
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return rawTitle
  }
  return formatDateTime(timestamp * 1000, 'YYYY-MM-DD HH:mm')
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength)}...`
}

function getCoinTypeName(coinType: number): string {
  if (coinType === 1) {
    const i18nText = t('UIGuild_VipCountGoldType1')
    return i18nText && i18nText !== 'UIGuild_VipCountGoldType1' ? i18nText : '联盟币'
  }
  if (coinType === 2) {
    const i18nText = t('UIGuild_VipCountGoldType2')
    return i18nText && i18nText !== 'UIGuild_VipCountGoldType2' ? i18nText : 'USDT'
  }
  return ''
}

function resolveRoomTypeName(item: MsgMessageListMsgInfo): string {
  const key = String(item.multi_language_id ?? '')
  if (!key) return ''

  if (key.includes(',')) {
    const [first] = key.split(',')
    return resolveTemplateTextByKey(first) || t(first) || first
  }

  return resolveTemplateTextByKey(key) || t(key) || key
}

function resolveLocalizedName(rawKey: string): string {
  const key = String(rawKey ?? '').trim()
  if (!key) return ''
  return resolveTemplateTextByKey(key) || t(key) || key
}

function normalizeBagTitleByType(msgType: number, rawTitle: string): string {
  const needsTitleSplit =
    msgType === MSG_SUB_TYPE.MsgBagTypeGetTickets ||
    msgType === MSG_SUB_TYPE.MsgBagTypeUserTransferTicketsToSelf ||
    msgType === MSG_SUB_TYPE.MsgBagTypeUserTransferTicketsToOther ||
    msgType === MSG_SUB_TYPE.MsgBagTypeAwardPropsByEveryDayTask ||
    msgType === MSG_SUB_TYPE.MsgBagTypeAwardPropsByAchievementsTask ||
    msgType === MSG_SUB_TYPE.MsgBagTypeAwardPropsByVipInvitationReward

  if (!needsTitleSplit || !rawTitle.includes('X')) {
    return rawTitle
  }

  const splitIndex = rawTitle.lastIndexOf('X')
  if (splitIndex <= 0 || splitIndex >= rawTitle.length - 1) {
    return rawTitle
  }

  const propKey = rawTitle.slice(0, splitIndex).trim()
  const count = rawTitle.slice(splitIndex + 1).trim()
  const propName = resolveLocalizedName(propKey)
  if (!propName || !count) {
    return rawTitle
  }

  return `${truncateText(propName, 17)} x${count}`
}

function parseRemarkCoin(remark: string): { amount: string; coinType: number; coinName: string } {
  const [amount = '', coinTypeRaw = ''] = remark.split('_')
  const coinType = Number(coinTypeRaw)
  return {
    amount,
    coinType,
    coinName: getCoinTypeName(coinType),
  }
}

function buildArgsByMsgType(item: MsgMessageListMsgInfo, title: string): string[] {
  const content = String(item.content ?? '')
  const remark = String(item.remark ?? '')
  const msgType = Number(item.msg_type ?? 0)
  const senderName = String(item.sender_name ?? '')

  if (msgType === MSG_SUB_TYPE.MsgBagTypeUserTransferTicketsToSelf) {
    return [title, content]
  }

  if (msgType === MSG_SUB_TYPE.MsgBagTypeUserTransferTicketsToOther) {
    return [content, title]
  }

  if (
    msgType === MSG_SUB_TYPE.MsgBagTypeAwardPropsByEveryDayTask ||
    msgType === MSG_SUB_TYPE.MsgBagTypeAwardPropsByAchievementsTask ||
    msgType === MSG_SUB_TYPE.MsgBagTypeAwardPropsByVipInvitationReward
  ) {
    return [remark, title]
  }

  if (msgType === MSG_SUB_TYPE.MsgClubTypeUserGradeDrain) {
    return [content, remark]
  }

  if (
    msgType === MSG_SUB_TYPE.MsgClubTypeRechargeRequest ||
    msgType === MSG_SUB_TYPE.MsgClubTypeWithdrawRequest ||
    msgType === MSG_SUB_TYPE.MsgBagTypeSignUpMatch ||
    msgType === MSG_SUB_TYPE.MsgMoneyTypeMatchSignUp
  ) {
    return [content, remark, title]
  }

  if (msgType === MSG_SUB_TYPE.MsgSuper1AwardDiscount) {
    return [resolveTemplateTextByKey(content) || content, remark]
  }

  if (msgType === MSG_SUB_TYPE.MsgBagTypeClubGrantGold) {
    return [title, formatNumericText(content)]
  }

  if (msgType === MSG_SUB_TYPE.MsgBagTypeTribeGivePropToClub) {
    const propName = resolveTemplateTextByKey(title) || title
    return [senderName, `${propName}*${content}`]
  }

  if (msgType === MSG_SUB_TYPE.MsgMoneyTypeReleaseClubFunds) {
    const { amount, coinName } = parseRemarkCoin(remark)
    return [amount, coinName]
  }

  if (msgType === MSG_SUB_TYPE.MsgCLUBTOUSER || msgType === MSG_SUB_TYPE.MsgCLUBRECOVEUSER) {
    const { amount, coinName } = parseRemarkCoin(remark)
    return [content, amount, coinName]
  }

  if (msgType === MSG_SUB_TYPE.MsgMoneyTypeDiamondTribeToUser) {
    const { amount } = parseRemarkCoin(remark)
    return [senderName, amount]
  }

  if (msgType === MSG_SUB_TYPE.MsgMoneyTypeMatchWin) {
    const roomType = resolveRoomTypeName(item)
    return [`${roomType}${content}`, formatNumericText(remark), title]
  }

  if (msgType === MSG_SUB_TYPE.MsgTribeTypeKickOutUser) {
    return [content, remark]
  }

  if (msgType === MSG_SUB_TYPE.MsgClubTypeRecselfpft) {
    return [content, formatNumericText(remark)]
  }

  if (
    msgType === MSG_SUB_TYPE.MsgClubTypeAutoCloseSevenDays ||
    msgType === MSG_SUB_TYPE.MsgClubTypeAutoCloseOneDay
  ) {
    return [content]
  }

  if (msgType === MSG_SUB_TYPE.MsgClubTypeAutoCloseNow) {
    return [content, remark]
  }

  if (
    msgType === MSG_SUB_TYPE.MSG_CLUB_TYPE_JACKPOT_AWD ||
    msgType === MSG_SUB_TYPE.MSG_MONEY_TYPE_JACKPOT_AWD
  ) {
    return [title, formatNumericText(remark, 100)]
  }

  if (msgType === MSG_SUB_TYPE.MsgMoneyTypeTribeToClub) {
    return [senderName, content, formatNumericText(remark), title]
  }

  if (msgType === MSG_SUB_TYPE.MsgMoneyTypeTribeRecoveClub) {
    return [senderName, content, formatNumericText(remark, 100), title]
  }

  const defaultRoomType = resolveRoomTypeName(item)
  return [`${defaultRoomType}${content}`, formatNumericText(remark), title]
}

function buildMessageContent(item: MsgMessageListMsgInfo): {
  segments: MessageTextSegment[]
  text: string
} {
  const content = String(item.content ?? '')
  const msgType = Number(item.msg_type ?? 0)

  let title = String(item.title ?? '')
  if (title && /^\d+(\.\d+)?$/.test(title)) {
    title = formatNumericText(title)
  }
  if (
    msgType === MSG_SUB_TYPE.MsgBagTypeSignUpMatch ||
    msgType === MSG_SUB_TYPE.MsgMoneyTypeMatchSignUp
  ) {
    title = formatTimestampTitle(title)
  }
  title = normalizeBagTitleByType(msgType, title)

  const templateTypeAlias: Partial<Record<number, number>> = {
    [MSG_SUB_TYPE.MsgClubTypeUserGradeQuickly]: MSG_SUB_TYPE.MsgClubTypeRechargeRefuse,
  }
  const mappedMsgType = templateTypeAlias[msgType] ?? msgType
  const templateKey = `MsgInfo_${mappedMsgType}`
  const translatedTemplate = t(templateKey)
  const template =
    translatedTemplate && translatedTemplate !== templateKey
      ? translatedTemplate
      : content || title || '--'

  if (msgType === MSG_SUB_TYPE.MsgClubTypeCloseClub) {
    const segments: MessageTextSegment[] = []
    if (content) {
      segments.push({ text: content, green: true })
    }
    segments.push({ text: '已解散' })
    return {
      segments,
      text: `${content}已解散`,
    }
  }

  const args = buildArgsByMsgType(item, title)

  const safeTemplate = template || '--'
  const segments: MessageTextSegment[] = []
  let cursor = 0
  const matcher = /\{(\d+)\}/g
  let match = matcher.exec(safeTemplate)

  while (match) {
    const [token, tokenKey] = match
    const tokenStart = match.index

    if (tokenStart > cursor) {
      const plain = safeTemplate.slice(cursor, tokenStart)
      if (plain) {
        segments.push({ text: plain })
      }
    }

    const value = args[Number(tokenKey)] ?? ''
    if (value) {
      segments.push({ text: value, green: true })
    }

    cursor = tokenStart + token.length
    match = matcher.exec(safeTemplate)
  }

  if (cursor < safeTemplate.length) {
    const tail = safeTemplate.slice(cursor)
    if (tail) {
      segments.push({ text: tail })
    }
  }

  if (segments.length === 0) {
    segments.push({ text: safeTemplate })
  }

  const text = segments.map((segment) => segment.text).join('')

  return {
    segments,
    text: text || '--',
  }
}

function computeWrap(text: string): boolean {
  return text.length > 18
}

function getMsgListData(
  payload: MsgMessageListResponseData | MsgMessageListData,
): MsgMessageListData {
  const directData = payload as MsgMessageListData
  if (Array.isArray(directData.list)) {
    return {
      offset: Number(directData.offset ?? 0),
      total: Number(directData.total ?? 0),
      list: directData.list,
      limit: Number(directData.limit ?? 0),
    }
  }

  const nestedData = (payload as MsgMessageListResponseData).data
  if (nestedData && Array.isArray(nestedData.list)) {
    return {
      offset: Number(nestedData.offset ?? 0),
      total: Number(nestedData.total ?? 0),
      list: nestedData.list,
      limit: Number(nestedData.limit ?? 0),
    }
  }

  return {
    offset: 0,
    total: 0,
    list: [],
    limit: 0,
  }
}

function resetMsgPagination(): void {
  msgOffset.value = 0
  msgTotal.value = 0
  msgHasMore.value = true
}

function resetCreditPagination(): void {
  creditOffset.value = 0
  creditTotal.value = 0
  creditHasMore.value = true
}

function resetUcPagination(): void {
  ucOffset.value = 0
  ucTotal.value = 0
  ucHasMore.value = true
}

const hasMoreMsgList = computed(() => {
  return msgHasMore.value
})

async function fetchMsgList(target: 'system' | 'other', append = false): Promise<void> {
  if (msgListLoading.value) return
  if (append && !hasMoreMsgList.value) return

  msgListLoading.value = true
  const requestOffset = append ? msgOffset.value : 0
  const response = await postMsgMessageListApi({
    msg_type: messageType.value,
    limit: msgLimit,
    offset: requestOffset,
  })
  msgListLoading.value = false

  if (response.code !== 0) {
    if (!append && target === 'system') {
      systemMessages.value = []
    } else if (!append) {
      otherMessages.value = []
    }
    return
  }

  const rawData = response.data as MsgMessageListResponseData | MsgMessageListData
  const data = getMsgListData(rawData)
  const records: MsgMessageListMsgInfo[] = data.list
  msgTotal.value = Number(data.total ?? 0)
  const loadedCount = records.length
  msgOffset.value = requestOffset + loadedCount
  msgHasMore.value = msgTotal.value > 0 ? msgOffset.value < msgTotal.value : loadedCount >= msgLimit

  if (target === 'system') {
    const mapped = records.map((item) => ({
      segments: buildMessageContent(item).segments,
      time: formatTime(item.create_time),
    }))
    systemMessages.value = append ? [...systemMessages.value, ...mapped] : mapped
  } else {
    const mapped = records.map((item) => {
      const messageContent = buildMessageContent(item)
      return {
        clubName: String(item.sender_name ?? '系统消息'),
        senderIcon: item.sender_icon ? String(item.sender_icon) : '',
        time: formatTime(item.create_time),
        wrap: computeWrap(messageContent.text),
        plainText: messageContent.text,
        segments: messageContent.segments,
      }
    })
    otherMessages.value = append ? [...otherMessages.value, ...mapped] : mapped
  }

  if (!append) {
    await postMsgMessageUnreadClearApi({ msg_type: messageType.value })
  }
}

async function fillViewportMessages(target: 'system' | 'other'): Promise<void> {
  await nextTick()
  const container = pageShellRef.value
  if (!container) return

  while (
    hasMoreMsgList.value &&
    !msgListLoading.value &&
    container.scrollHeight <= container.clientHeight + 12
  ) {
    await fetchMsgList(target, true)
    await nextTick()
  }
}

async function fillViewportCreditList(): Promise<void> {
  await nextTick()
  const container = pageShellRef.value
  if (!container) return

  while (
    creditHasMore.value &&
    !creditLoading.value &&
    container.scrollHeight <= container.clientHeight + 12
  ) {
    await fetchCreditList(true)
    await nextTick()
  }
}

async function fillViewportUcList(): Promise<void> {
  await nextTick()
  const container = pageShellRef.value
  if (!container) return

  while (
    ucHasMore.value &&
    !ucLoading.value &&
    container.scrollHeight <= container.clientHeight + 12
  ) {
    await fetchUcList(true)
    await nextTick()
  }
}

async function loadMoreMessagesIfNeeded(): Promise<void> {
  const container = pageShellRef.value
  if (!container) return

  const scrollTop = container.scrollTop
  const viewportHeight = container.clientHeight
  const pageHeight = container.scrollHeight
  const threshold = 120

  if (scrollTop + viewportHeight < pageHeight - threshold) {
    return
  }

  if (pageType.value === 'credit') {
    if (!creditHasMore.value || creditLoading.value) return
    await fetchCreditList(true)
    return
  }

  if (pageType.value === 'uc') {
    if (!ucHasMore.value || ucLoading.value) return
    await fetchUcList(true)
    return
  }

  if (pageType.value === 'system' || pageType.value === 'other') {
    if (!hasMoreMsgList.value || msgListLoading.value) return
    await fetchMsgList(pageType.value, true)
  }
}

function onPageScroll(): void {
  void loadMoreMessagesIfNeeded()
}

async function fetchCreditList(append = false): Promise<void> {
  if (creditLoading.value) return
  if (append && !creditHasMore.value) return

  creditLoading.value = true
  const requestOffset = append ? creditOffset.value : 0
  const response = await postUserRoomSitApplyRecordsApi({
    limit: msgLimit,
    offset: requestOffset,
  })
  creditLoading.value = false

  if (response.code !== 0) {
    if (!append) {
      creditMessages.value = []
    }
    return
  }

  const payload = response.data
  const records = Array.isArray(payload?.data) ? payload.data : []
  creditTotal.value = Number(payload?.total ?? 0)
  creditOffset.value = requestOffset + records.length
  creditHasMore.value =
    creditTotal.value > 0 ? creditOffset.value < creditTotal.value : records.length >= msgLimit

  const mapped = records.map((item) => {
    return {
      id: item.id,
      roomId: item.room_id,
      texasId: `房间ID: ${String(item.room_id ?? '--')}`,
      clubName: String(item.sender_name ?? item.room_name ?? '--'),
      time: formatTime(item.create_time),
      playerName: String(item.user_name ?? '--'),
      playerId: String(item.user_random_id ?? '--'),
      amount: `${formatUC(item.bring_in ?? 0)}`,
      status: mapStatus(item.status),
      approverName: item.op_user_name ? String(item.op_user_name) : undefined,
      approverId: item.op_user_random_id ? String(item.op_user_random_id) : undefined,
      avatar: item.avatar ? String(item.avatar) : avatarDefault,
      senderIcon: item.sender_icon ? String(item.sender_icon) : '',
    }
  })

  creditMessages.value = append ? [...creditMessages.value, ...mapped] : mapped
}

async function fetchUcList(append = false): Promise<void> {
  if (ucLoading.value) return
  if (append && !ucHasMore.value) return

  ucLoading.value = true
  const requestOffset = append ? ucOffset.value : 0
  const response = await postClubFundApplyListApi({
    limit: msgLimit,
    offset: requestOffset,
    order_status: 1,
  })
  ucLoading.value = false

  if (response.code !== 0) {
    if (!append) {
      ucMessages.value = []
    }
    return
  }

  const payload = response.data
  const records = Array.isArray(payload?.list) ? payload.list : []
  ucTotal.value = Number(payload?.total ?? 0)
  ucOffset.value = requestOffset + records.length
  ucHasMore.value = ucTotal.value > 0 ? ucOffset.value < ucTotal.value : records.length >= msgLimit

  const mapped = records.map((item) => {
    const unknownItem = item as Record<string, unknown>
    const rawStatus = unknownItem.order_status ?? unknownItem.status
    return {
      orderNo: item.order_no,
      clubName: String(item.club_name ?? '--'),
      time: formatTime(item.create_time),
      playerName: String(item.nickname ?? '--'),
      playerId: String(item.user_random_id ?? '--'),
      amount: `+${formatUC(item.amount ?? 0)}`,
      status: mapStatus(rawStatus),
      approverName: item.audit_name ? String(item.audit_name) : undefined,
      approverId: item.audit_user_id ? String(item.audit_user_id) : undefined,
      avatar: item.avatar ? String(item.avatar) : avatarDefault,
      clubLogo: item.club_logo ? String(item.club_logo) : '',
    }
  })

  ucMessages.value = append ? [...ucMessages.value, ...mapped] : mapped
}

async function auditCredit(item: CreditMessageItem, pass: boolean): Promise<void> {
  if (!item.id) return
  const isFriendApply = item.clubName === ''
  if (isFriendApply) {
    const response = await postRoomcenterFriendRoomApplyAuditApi({
      room_id: item.roomId,
      apply_id: item.id,
      action: pass ? 2 : 3,
    })
    if (response.code === 0) {
      await fetchCreditList()
    }
  } else {
    const response = await postRoomClubApplyAuditApi({
      apply_id: item.id,
      audit_op: pass ? 2 : 3,
    })
    if (response.code === 0) {
      await fetchCreditList()
    }
  }
}

async function auditUc(item: UcMessageItem, pass: boolean): Promise<void> {
  if (!item.orderNo) return
  const response = await postClubFundAuditApi({
    order_no: item.orderNo,
    audit_type: pass ? 1 : 2,
  })
  if (response.code === 0) {
    await fetchUcList()
  }
}

watch(
  () => [pageType.value, messageType.value],
  async ([type]) => {
    resetMsgPagination()
    resetCreditPagination()
    resetUcPagination()
    if (type === 'credit') {
      await fetchCreditList()
      await fillViewportCreditList()
      return
    }
    if (type === 'uc') {
      await fetchUcList()
      await fillViewportUcList()
      return
    }
    if (type === 'system') {
      await fetchMsgList('system')
      await fillViewportMessages('system')
      return
    }
    await fetchMsgList('other')
    await fillViewportMessages('other')
  },
  { immediate: true },
)

onMounted(() => {
  pageShellRef.value?.addEventListener('scroll', onPageScroll, { passive: true })
})

onBeforeUnmount(() => {
  pageShellRef.value?.removeEventListener('scroll', onPageScroll)
})
</script>

<template>
  <div ref="pageShellRef" class="page-shell message-detail-page" :style="backgroundStyle">
    <HeaderBack :title="pageTitle" />

    <div class="content-wrap">
      <section v-if="pageType === 'system'" class="system-list">
        <article
          v-for="(item, index) in systemMessages"
          :key="`system-${index}-${item.time}`"
          class="system-card"
        >
          <p class="system-content">
            <span
              v-for="(segment, segmentIndex) in item.segments"
              :key="`system-segment-${index}-${segmentIndex}`"
              :class="{ green: segment.green }"
            >
              {{ segment.text }}
            </span>
          </p>
          <p class="system-time">{{ item.time }}</p>
        </article>
      </section>

      <section v-else-if="pageType === 'credit'" class="request-list">
        <article
          v-for="(item, index) in creditMessages"
          :key="`credit-${index}`"
          class="request-card"
        >
          <div class="request-top request-top--credit">
            <p class="meta-left">{{ item.texasId }}</p>
            <p class="meta-time">{{ item.time }}</p>
            <div class="meta-club">
              <img :src="item.senderIcon" alt="club" />
              <span>{{ item.clubName }}</span>
            </div>
          </div>

          <div class="request-body" :class="[`status-${item.status}`]">
            <div class="player-block">
              <img class="player-avatar" :src="item.avatar" alt="avatar" />
              <div class="player-text">
                <p class="player-name">{{ item.playerName }}</p>
                <p class="player-id">ID: {{ item.playerId }}</p>
              </div>
            </div>

            <div v-if="item.status === 'pending'" class="pending-actions">
              <div class="action-wrap">
                <button
                  class="action-btn action-btn--ok"
                  type="button"
                  @click="auditCredit(item, true)"
                >
                  ✓
                </button>
              </div>
              <div class="action-wrap">
                <button
                  class="action-btn action-btn--deny"
                  type="button"
                  @click="auditCredit(item, false)"
                >
                  ✕
                </button>
              </div>
            </div>

            <p v-else-if="item.status === 'rejected'" class="state-text">已拒绝</p>

            <div v-else-if="item.status === 'approved' && item.approverId" class="approver-block">
              <p class="approver-line">{{ item.approverName }}</p>
              <p class="approver-line">ID: {{ item.approverId }}</p>
              <p class="state-text">已通过</p>
            </div>

            <p v-else class="state-text">已通过</p>
          </div>

          <div class="request-footer">
            <img :src="iconDollars" alt="balance" />
            <p>带入申请：{{ item.amount }}</p>
          </div>
        </article>
      </section>

      <section v-else-if="pageType === 'uc'" class="request-list">
        <article v-for="(item, index) in ucMessages" :key="`uc-${index}`" class="request-card">
          <div class="request-top">
            <div class="meta-club meta-club--lead">
              <img :src="item.clubLogo" alt="club" />
              <span>{{ item.clubName }}</span>
            </div>
            <p class="meta-time">{{ item.time }}</p>
          </div>

          <div class="request-body" :class="[`status-${item.status}`]">
            <div class="player-block">
              <img class="player-avatar" :src="item.avatar" alt="avatar" />
              <div class="player-text">
                <p class="player-name">{{ item.playerName }}</p>
                <p class="player-id">ID: {{ item.playerId }}</p>
              </div>
            </div>

            <div v-if="item.status === 'pending'" class="pending-actions">
              <button class="action-btn action-btn--ok" type="button" @click="auditUc(item, true)">
                ✓
              </button>
              <button
                class="action-btn action-btn--deny"
                type="button"
                @click="auditUc(item, false)"
              >
                ✕
              </button>
            </div>

            <p v-else-if="item.status === 'rejected'" class="state-text">已拒绝</p>

            <div v-else-if="item.status === 'approved' && item.approverId" class="approver-block">
              <p class="approver-line">{{ item.approverName }}</p>
              <p class="approver-line">ID: {{ item.approverId }}</p>
              <p class="state-text">已通过</p>
            </div>

            <p v-else class="state-text">已通过</p>
          </div>

          <div class="request-footer request-footer--uc">
            <img :src="iconPeople" alt="uc" />
            <p>申请充值：{{ item.amount }}</p>
          </div>
        </article>
      </section>

      <section v-else class="other-list">
        <article
          v-for="(item, index) in otherMessages"
          :key="`other-${index}`"
          class="other-item"
          :class="{ 'other-item--first': index === 0 }"
        >
          <div class="other-banner" :class="{ 'other-banner--wrap': item.wrap }">
            <p class="other-title" :class="{ 'other-title--wrap': item.wrap }">
              <span
                v-for="(segment, segmentIndex) in item.segments"
                :key="`other-segment-${index}-${segmentIndex}`"
                :class="{ green: segment.green }"
              >
                {{ segment.text }}
              </span>
            </p>

            <button v-if="item.senderIcon" class="sender-btn" type="button" aria-label="sender">
              <img :src="item.senderIcon" alt="sender" />
            </button>
          </div>

          <div class="other-meta-row">
            <div class="other-meta-club">
              <img :src="imgDefaultAva" alt="club" />
              <span>{{ item.clubName }}</span>
            </div>
            <p class="other-time">{{ item.time }}</p>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.message-detail-page {
  height: 100dvh;
  color: #f3f3f3;
  padding-top: calc(env(safe-area-inset-top) + 0.46rem);
  padding-bottom: calc(env(safe-area-inset-bottom) + 0.7rem);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-sizing: border-box;
}

.content-wrap {
  padding: 0 0.456rem;
}

.system-list,
.request-list,
.other-list {
  margin-top: 0.56rem;
  display: flex;
  flex-direction: column;
}

.system-list {
  gap: 0.293rem;
}

.system-card {
  min-height: 4.578rem;
  border-radius: 0.74rem;
  border: 0.02rem solid rgba(255, 255, 255, 0.28);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.12rem);
  padding: 0.8rem 0.72rem 0.7rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.system-content {
  margin: 0;
  font-size: 0.384rem;
  line-height: 1.4;
  font-weight: 600;
  color: #fff;
}

.system-time {
  margin: 0.24rem 0 0;
  font-size: 0.333rem;
  color: #fff;
}

.request-list {
  gap: 0.24rem;
}

.request-card {
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  box-shadow: inset 1px 1px 0px rgba(255, 255, 255, 0.08);
  padding: 0.32rem 0.304rem 0.304rem;
}

.request-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.2rem;
}

.request-top--credit {
  .meta-time {
    flex: 1;
    text-align: center;
  }
}

.meta-left,
.meta-time,
.meta-club span {
  margin: 0;
  font-size: 0.27rem;
  line-height: 1.4;
  color: #f3f3f3;
}

.meta-time {
  opacity: 0.95;
  white-space: nowrap;
}

.meta-club {
  display: inline-flex;
  align-items: center;
  gap: 0.11rem;

  img {
    width: 0.48rem;
    height: 0.48rem;
    border-radius: 50%;
    object-fit: cover;
  }
}

.meta-club--lead {
  span {
    font-size: 0.27rem;
  }
}

.request-body {
  margin-top: 0.32rem;
  border-radius: 4.223rem;
  min-height: 1.499rem;
  padding: 0 0.28rem 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.14);
}

.status-pending {
  background: rgba(199, 199, 199, 0.14);
}

.status-rejected {
  background: rgba(250, 43, 75, 0.4);
}

.status-approved-by-user,
.status-approved {
  background: rgba(37, 221, 0, 0.3);
}

.player-block {
  display: inline-flex;
  align-items: center;
  gap: 0.213rem;
}

.player-avatar {
  width: 1.49rem;
  height: 1.5rem;
  border-radius: 50%;
  object-fit: cover;
}

.player-text {
  display: flex;
  flex-direction: column;
}

.player-name {
  margin: 0;
  font-size: 0.44rem;
  line-height: 1.1;
  color: #f3f3f3;
}

.player-id {
  margin: 0.08rem 0 0;
  font-size: 0.304rem;
  line-height: 1;
  color: rgba(243, 243, 243, 0.5);
}

.pending-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.action-wrap {
  width: 0.97rem;
  height: 0.97rem;
  border-radius: 50%;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  box-shadow: inset 1px 1px 0px rgba(255, 255, 255, 0.12);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn {
  border: 0;
  background: transparent;
  font-size: 0.52rem;
  line-height: 1;
  padding: 0;
}

.action-btn--ok {
  color: #f3f3f3;
}

.action-btn--deny {
  color: #ff3048;
}

.state-text {
  margin: 0;
  font-size: 0.312rem;
  font-weight: 500;
  color: #fff;
}

.approver-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.08rem;
}

.approver-line {
  margin: 0;
  font-size: 0.26rem;
  line-height: 1;
  color: #fff;
}

.request-footer {
  margin-top: 0.31rem;
  padding-left: 0.345rem;
  display: inline-flex;
  align-items: center;
  gap: 0.27rem;

  img {
    width: 0.33rem;
    height: 0.33rem;
  }

  p {
    margin: 0;
    font-size: 0.355rem;
    line-height: 1.2;
    color: #f9f9f9;
  }
}

.request-footer--uc img {
  width: 0.72rem;
  height: 0.72rem;
}

.other-list {
  gap: 0.262rem;
}

.other-item {
  position: relative;
  width: 100%;
  min-height: 2.272rem;
}

.other-banner {
  position: relative;
  left: 1.301rem;
  width: 7.458rem;
  min-height: 1.385rem;
  border-radius: 0.8rem 0.8rem 0.8rem 0;
  border: 0.02rem solid rgba(0, 0, 0, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  box-shadow: inset 1px 1px 0px rgba(255, 255, 255, 0.08);
  padding: 0.2rem 1.36rem 0.2rem 0.467rem;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.other-banner--wrap {
  min-height: 1.439rem;
}

.other-title {
  margin: 0;
  position: relative;
  z-index: 1;
  font-size: 0.355rem;
  line-height: 1.4;
  color: #fbfbfb;
  white-space: normal;
  word-break: break-word;
}

.other-title--wrap {
  width: 100%;
}

.highlight {
  font-weight: 500;
}

.highlight--red {
  color: #ff132b;
}

.highlight--green {
  color: #05e7ae;
}

.green {
  color: #05e7ae;
}

.sender-btn {
  position: absolute;
  right: 0.264rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0.88rem;
  height: 0.88rem;
  border: 0;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
}

.other-meta-row {
  margin-top: 0.12rem;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.other-meta-club {
  display: inline-flex;
  align-items: center;
  gap: 0.253rem;

  img {
    width: 1.267rem;
    height: 1.258rem;
    border-radius: 50%;
    object-fit: cover;
  }

  span {
    font-size: 0.355rem;
    line-height: 1.4;
    color: #fbfbfb;
  }
}

.other-time {
  margin: 0;
  font-size: 0.321rem;
  line-height: 1;
  color: rgba(251, 251, 251, 0.59);
  white-space: nowrap;
}
</style>
