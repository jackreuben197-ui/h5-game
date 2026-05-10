<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { postClubFundApplyListApi, postClubFundAuditApi } from '@/api/order'
import { postMsgMessageListApi, postMsgMessageUnreadClearApi } from '@/api/msg'
import {
  postRoomClubApplyAuditApi,
  postClubRoomSitApplyRecordsApi,
  postRoomcenterFriendRoomApplyAuditApi,
} from '@/api/roomcenter'
import type {
  MsgMessageListData,
  MsgMessageListMsgInfo,
  MsgMessageListResponseData,
} from '@/api/models/msg'
import { t } from '@/i18n'
import { formatDateTime } from '@/utils/time'
import avatarDefault from '@/assets/images/default_avatar.png'
import iconPeople from '@/assets/icons/icon_people.png'
import iconBalance from '@/assets/icons/icon_balance.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import mainBgUrl from '@/assets/images/main_bg.webp'

type MessagePageType = 'system' | 'credit' | 'uc' | 'other'
type CreditStatus = 'pending' | 'rejected' | 'approved-by-user' | 'approved'

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
  applyType?: number
  texasId?: string
  clubName: string
  time: string
  playerName: string
  playerId: string
  amount: string
  status: CreditStatus
  approverName?: string
  approverId?: string
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

const otherBannerBgFirst = mainBgUrl
const otherBannerBgDefault = mainBgUrl

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
  if (pageType.value === 'credit') return '买入申请'
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

const messageType = computed<number>(() => {
  const raw = Number(route.query.msgType)
  if (Number.isFinite(raw) && raw > 0) {
    return raw
  }
  return pageType.value === 'system' ? 4 : 1
})

function formatTime(value: unknown): string {
  return formatDateTime(value, 'YYYY-MM-DD HH:mm')
}

function formatAmount(value: unknown): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) {
    return '0'
  }
  return amount.toLocaleString('en-US')
}

function mapStatus(value: unknown): CreditStatus {
  const status = Number(value)
  if (status === 1) return 'pending'
  if (status === 2) return 'approved'
  if (status === 3 || status === 4 || status === 5 || status === 6) return 'rejected'
  return 'pending'
}

function buildMessageContent(item: MsgMessageListMsgInfo): {
  segments: MessageTextSegment[]
  text: string
} {
  const content = String(item.content ?? '')
  const remark = String(item.remark ?? '')
  const title = String(item.title ?? '')
  const msgType = Number(item.msg_type ?? 0)
  const templateTypeAlias: Partial<Record<number, number>> = {
    2025: 2005,
  }
  const mappedMsgType = templateTypeAlias[msgType] ?? msgType
  const templateKey = `MsgInfo_${mappedMsgType}`
  const translatedTemplate = t(templateKey)
  const template =
    translatedTemplate && translatedTemplate !== templateKey
      ? translatedTemplate
      : content || title || '--'

  const map: Record<string, string> = {
    '0': content,
    '1': remark,
    '2': title,
  }

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

    const value = map[tokenKey] ?? ''
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
}

const hasMoreMsgList = computed(() => {
  if (msgTotal.value === 0) return false
  return msgOffset.value < msgTotal.value
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
  if (append && loadedCount === 0) {
    msgTotal.value = msgOffset.value
  }

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

async function loadMoreMessagesIfNeeded(): Promise<void> {
  if (pageType.value !== 'system' && pageType.value !== 'other') return
  if (!hasMoreMsgList.value || msgListLoading.value) return

  const container = pageShellRef.value
  if (!container) return

  const scrollTop = container.scrollTop
  const viewportHeight = container.clientHeight
  const pageHeight = container.scrollHeight
  const threshold = 120

  if (scrollTop + viewportHeight >= pageHeight - threshold) {
    await fetchMsgList(pageType.value, true)
  }
}

function onPageScroll(): void {
  void loadMoreMessagesIfNeeded()
}

async function fetchCreditList(): Promise<void> {
  const response = await postClubRoomSitApplyRecordsApi({
    apply_type: 0,
    limit: 50,
    offset: 0,
  })
  if (response.code !== 0) {
    creditMessages.value = []
    return
  }

  const records = Array.isArray(response.data?.data) ? response.data.data : []
  creditMessages.value = records.map((item) => {
    const entry = item as Record<string, unknown>
    return {
      id: item.id,
      roomId: item.room_id,
      applyType: Number(entry.apply_type ?? 2),
      texasId: `房间ID: ${String(item.room_id ?? '--')}`,
      clubName: String(item.sender_name ?? item.room_name ?? '--'),
      time: formatTime(item.create_time),
      playerName: String(item.user_name ?? '--'),
      playerId: String(item.user_random_id ?? '--'),
      amount: `${formatAmount(item.hands)}手`,
      status: mapStatus(item.status),
      approverName: item.op_user_name ? String(item.op_user_name) : undefined,
      approverId: item.op_user_random_id ? String(item.op_user_random_id) : undefined,
    }
  })
}

async function fetchUcList(): Promise<void> {
  const response = await postClubFundApplyListApi({ limit: 50, offset: 0 })
  if (response.code !== 0) {
    ucMessages.value = []
    return
  }

  const records = Array.isArray(response.data?.list) ? response.data.list : []
  ucMessages.value = records.map((item) => {
    const unknownItem = item as Record<string, unknown>
    const rawStatus = unknownItem.order_status ?? unknownItem.status
    return {
      orderNo: item.order_no,
      clubName: String(item.club_name ?? '--'),
      time: formatTime(unknownItem.create_time),
      playerName: String(item.nickname ?? '--'),
      playerId: String(item.user_random_id ?? '--'),
      amount: `+${formatAmount(item.gold_num ?? item.amount)}`,
      status: mapStatus(rawStatus),
      approverName: unknownItem.audit_name ? String(unknownItem.audit_name) : undefined,
      approverId: unknownItem.audit_user_id ? String(unknownItem.audit_user_id) : undefined,
    }
  })
}

async function auditCredit(item: CreditMessageItem, pass: boolean): Promise<void> {
  if (!item.id) return
  const isFriendApply = Number(item.applyType ?? 2) === 1
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
    if (type === 'credit') {
      await fetchCreditList()
      return
    }
    if (type === 'uc') {
      await fetchUcList()
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
              <img :src="avatarDefault" alt="club" />
              <span>{{ item.clubName }}</span>
            </div>
          </div>

          <div class="request-body" :class="[`status-${item.status}`]">
            <div class="player-block">
              <img class="player-avatar" :src="avatarDefault" alt="avatar" />
              <div class="player-text">
                <p class="player-name">{{ item.playerName }}</p>
                <p class="player-id">ID: {{ item.playerId }}</p>
              </div>
            </div>

            <div v-if="item.status === 'pending'" class="pending-actions">
              <button
                class="action-btn action-btn--ok"
                type="button"
                @click="auditCredit(item, true)"
              >
                ✓
              </button>
              <button
                class="action-btn action-btn--deny"
                type="button"
                @click="auditCredit(item, false)"
              >
                ✕
              </button>
            </div>

            <p v-else-if="item.status === 'rejected'" class="state-text">已拒绝</p>

            <div v-else-if="item.status === 'approved-by-user'" class="approver-block">
              <p class="approver-line">{{ item.approverName }}</p>
              <p class="approver-line">ID: {{ item.approverId }}</p>
              <p class="state-text">已通过</p>
            </div>

            <p v-else class="state-text">已通过</p>
          </div>

          <div class="request-footer">
            <img :src="iconBalance" alt="balance" />
            <p>买入申请：{{ item.amount }}</p>
          </div>
        </article>
      </section>

      <section v-else-if="pageType === 'uc'" class="request-list">
        <article v-for="(item, index) in ucMessages" :key="`uc-${index}`" class="request-card">
          <div class="request-top">
            <div class="meta-club meta-club--lead">
              <img :src="avatarDefault" alt="club" />
              <span>{{ item.clubName }}</span>
            </div>
            <p class="meta-time">{{ item.time }}</p>
          </div>

          <div class="request-body" :class="[`status-${item.status}`]">
            <div class="player-block">
              <img class="player-avatar" :src="avatarDefault" alt="avatar" />
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

            <div v-else-if="item.status === 'approved-by-user'" class="approver-block">
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
            <div
              class="other-banner-bg"
              :style="{ backgroundImage: `url(${index === 0 ? otherBannerBgFirst : otherBannerBgDefault})` }"
              aria-hidden="true"
            ></div>
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
              <img :src="avatarDefault" alt="club" />
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
  border-radius: 0.738rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.16rem);
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

.status-rejected {
  background: rgba(255, 19, 43, 0.4);
}

.status-approved-by-user,
.status-approved {
  background: rgba(5, 231, 174, 0.3);
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

.action-btn {
  width: 0.97rem;
  height: 0.97rem;
  border-radius: 50%;
  border: 0.013rem solid #fff;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
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
  top: 0;
  width: 7.458rem;
  min-height: 1.385rem;
  border-radius: 0.24rem;
  overflow: hidden;
  padding: 0.2rem 1.36rem 0.2rem 0.467rem;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.other-banner--wrap {
  min-height: 1.439rem;
}

.other-banner-bg {
  position: absolute;
  inset: -0.1rem;
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  filter: blur(0.1rem);
  transform: scale(1.05);
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
