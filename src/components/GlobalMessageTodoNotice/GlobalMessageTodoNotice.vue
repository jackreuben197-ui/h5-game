<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { postMsgMessageTodoAllInfoApi } from '@/api/msg'
import { postClubFundAuditApi } from '@/api/order'
import { postRoomClubApplyAuditApi, postRoomcenterFriendRoomApplyAuditApi } from '@/api/roomcenter'
import { postOrgClubApproValJoinApi } from '@/api/org'
import { Code, subscribeH5WsCode } from '@/bridge/ws/messageCenter'
import { decodeTodoListNotify } from '@/bridge/ws/todoListNotify'
import type {
  ClubMemberJoinListRecord,
  ClubMemberOrderListOrderInfo,
  MsgMessageTodoAllInfoData,
  MsgMessageTodoAllInfoDataElement,
  MsgMessageTodoAllInfoResponseData,
  UserRoomSitApplyRecordsRecord,
} from '@/api/models/msg'
import { formatDateTime } from '@/utils/time'
import { formatUC } from '@/utils/roomVisibility'
import ApproveRejectActions from '@/components/ApproveRejectActions/ApproveRejectActions.vue'
import avatarDefault from '@/assets/images/default_avatar.png'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.webp'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { invalidateCreditCache, invalidateUcCache } from '@/utils/messageCenterCache'
import { getLocale } from '@/i18n'

function tl(en: string, zh: string): string {
  return getLocale() === 'en' ? en : zh
}

type TodoSectionType = 'uc' | 'bringIn' | 'joinClub'

interface TodoSection {
  type: TodoSectionType
  title: string
}

const sectionDefs: TodoSection[] = [
  { type: 'uc', title: tl('Player Recharge Requests', '俱乐部玩家充值申请') },
  { type: 'bringIn', title: tl('Buy-in Requests', '买入申请') },
  { type: 'joinClub', title: tl('Club Join Requests', '加入俱乐部申请') },
]

const verifyLabel = computed(() => tl('Verify', '消息验证'))

const visible = ref(false)
const loading = ref(false)
const data = ref<MsgMessageTodoAllInfoData>({})
const todoCountMap = ref<MsgMessageTodoAllInfoDataElement[]>([])
const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()
let stopTodoWsListener: (() => void) | null = null

const watchedTodoTypes = [2, 3, 6] as const
const watchedTodoTypeSet = new Set<number>(watchedTodoTypes)

function parseAllInfoData(
  responseData: MsgMessageTodoAllInfoResponseData | undefined,
): MsgMessageTodoAllInfoData {
  if (!responseData) return {}
  const direct = responseData as MsgMessageTodoAllInfoData
  const nested = (responseData as { data?: MsgMessageTodoAllInfoData }).data
  if (nested && typeof nested === 'object') {
    return nested
  }
  return direct
}

function getList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

const ucList = computed<ClubMemberOrderListOrderInfo[]>(() => getList(data.value.user_order_list))
const bringInList = computed<UserRoomSitApplyRecordsRecord[]>(() =>
  getList(data.value.room_bring_in_list),
)
const joinClubList = computed<ClubMemberJoinListRecord[]>(() =>
  getList(data.value.club_user_join_list),
)

const displaySections = computed(() => {
  return sectionDefs.filter((section) => {
    if (section.type === 'uc') return ucList.value.length > 0
    if (section.type === 'bringIn') return bringInList.value.length > 0
    return joinClubList.value.length > 0
  })
})

function normalizeTodoCountMap(source: unknown): MsgMessageTodoAllInfoDataElement[] {
  const mapped = getList<MsgMessageTodoAllInfoDataElement>(source)
  if (!mapped.length) return []

  return mapped
    .map((item) => ({
      type: Number(item.type ?? 0),
      num: Math.max(0, Number(item.num ?? 0)),
    }))
    .filter((item) => watchedTodoTypeSet.has(Number(item.type ?? 0)))
}

function buildFallbackTodoCountMap(): MsgMessageTodoAllInfoDataElement[] {
  return [
    { type: 2, num: ucList.value.length },
    { type: 3, num: joinClubList.value.length },
    { type: 6, num: bringInList.value.length },
  ]
}

function setTodoCountMapFromApi(): void {
  const normalized = normalizeTodoCountMap(data.value.num_map)
  todoCountMap.value = normalized.length ? normalized : buildFallbackTodoCountMap()
}

function updateTodoTypeCount(type: number, num: number): void {
  if (!watchedTodoTypeSet.has(type)) return

  const safeNum = Math.max(0, Number(num || 0))
  const list = [...todoCountMap.value]
  const index = list.findIndex((item) => Number(item.type ?? 0) === type)
  if (index >= 0) {
    list[index] = {
      ...list[index],
      type,
      num: safeNum,
    }
  } else {
    list.push({ type, num: safeNum })
  }
  todoCountMap.value = list
}

const totalCount = computed(() => {
  return todoCountMap.value.reduce((sum, item) => sum + Number(item.num ?? 0), 0)
})

const hasAnyTodo = computed(() => displaySections.value.length > 0)
const shouldShowFloat = computed(() => !!gameStore.sessionToken && totalCount.value > 0)

const pageBackgroundStyle = computed(() => ({
  '--todo-panel-bg-dark': `url(${mainBgUrl})`,
  '--todo-panel-bg-light': `url(${mainBgLightUrl})`,
}))

// 拖动相关状态
const floatPosition = ref({ top: '40%' })
let isDragging = false
let startY = 0
let startTop = 0

function onFloatPointerDown(event: PointerEvent): void {
  isDragging = true
  startY = event.clientY
  const computedTop = floatPosition.value.top
  startTop = parseFloat(computedTop) || 40
  ;(event.currentTarget as HTMLElement)?.setPointerCapture(event.pointerId)
}

function onFloatPointerMove(event: PointerEvent): void {
  if (!isDragging) return
  const deltaY = event.clientY - startY
  const percentageDelta = (deltaY / window.innerHeight) * 100
  const newTop = Math.max(5, Math.min(95, startTop + percentageDelta))
  floatPosition.value = { top: `${newTop}%` }
}

function onFloatPointerUp(): void {
  isDragging = false
}

function formatTime(value: unknown): string {
  return formatDateTime(value, 'YYYY/M/D  HH:mm:ss')
}

function formatUcAmount(value: unknown): string {
  return `+${formatUC(Number(value ?? 0))}`
}

function formatBringInAmount(value: unknown): string {
  return `+${formatUC(Number(value ?? 0))}`
}

async function fetchTodoAllInfo(): Promise<void> {
  if (loading.value) return
  if (!gameStore.sessionToken.trim()) return

  loading.value = true
  // 后台轮询：业务码非 0（如无俱乐部/无权限）属正常情况，静默处理，不弹错误提示。
  const response = await postMsgMessageTodoAllInfoApi(
    { todo_types: [2, 3, 6] },
    { suppressBusinessToast: true },
  )
  loading.value = false

  if (response.code !== 0) {
    data.value = {}
    visible.value = false
    return
  }

  data.value = parseAllInfoData(response.data)
  setTodoCountMapFromApi()

  if (totalCount.value <= 0) {
    visible.value = false
  }
}

async function auditUc(item: ClubMemberOrderListOrderInfo, pass: boolean): Promise<void> {
  if (!item.order_no) return

  const response = await postClubFundAuditApi({
    order_no: item.order_no,
    audit_type: pass ? 1 : 2,
  })

  if (response.code === 0) {
    // 悬浮窗审核拿不到消息页里已映射好的列表，直接让对应俱乐部的缓存失效即可，
    // 下次打开消息页会重新拉取，不会读到已审核完的旧状态。
    void invalidateUcCache(gameStore.loginUserId, item.club_id)
    await fetchTodoAllInfo()
  }
}

async function auditBringIn(item: UserRoomSitApplyRecordsRecord, pass: boolean): Promise<void> {
  if (!item.id) return
  if (item.club_id === 0) {
    const response = await postRoomcenterFriendRoomApplyAuditApi({
      room_id: item.room_id,
      apply_id: item.id,
      action: pass ? 2 : 3,
    })
    if (response.code === 0) {
      void invalidateCreditCache(gameStore.loginUserId)
      await fetchTodoAllInfo()
    }
    return
  }

  const response = await postRoomClubApplyAuditApi({
    apply_id: item.id,
    audit_op: pass ? 2 : 3,
  })
  if (response.code === 0) {
    void invalidateCreditCache(gameStore.loginUserId)
    await fetchTodoAllInfo()
  }
}

async function auditJoinClub(item: ClubMemberJoinListRecord, pass: boolean): Promise<void> {
  if (!item.id) return

  const response = await postOrgClubApproValJoinApi({
    apply_id: item.id,
    audit_op: pass ? 2 : 3,
  })

  if (response.code === 0) {
    await fetchTodoAllInfo()
  }
}

function openPanel(): void {
  if (!shouldShowFloat.value) return
  void fetchTodoAllInfo().finally(() => {
    if (!hasAnyTodo.value) return
    visible.value = true
  })
}

function closePanel(): void {
  visible.value = false
}

watch(
  () => gameStore.sessionToken,
  (token) => {
    if (token.trim()) {
      void fetchTodoAllInfo()
      return
    }

    data.value = {}
    todoCountMap.value = []
    visible.value = false
  },
)

function initTodoWsListener(): void {
  if (stopTodoWsListener) return

  stopTodoWsListener = subscribeH5WsCode(Code.MSG_S_TODO_LIST, (message) => {
    const payload = decodeTodoListNotify(message.rawBuffer)
    if (!payload) return
    const type = Number(payload.type || 0)
    updateTodoTypeCount(type, Number(payload.num || 0))

    // 推送只带 type/num，不带俱乐部信息：带入/UC 数量变化可能来自其他管理员的审核，
    // 消息页缓存也要跟着失效，避免下次打开先看到一瞬间的过期状态。
    if (type === 2) {
      void invalidateUcCache(gameStore.loginUserId, userInfoStore.currentClubId)
    } else if (type === 6) {
      void invalidateCreditCache(gameStore.loginUserId)
    }

    if (totalCount.value <= 0) {
      visible.value = false
    }
  })
}

onMounted(() => {
  // 随机初始化垂直位置，避免多个悬浮窗重叠
  floatPosition.value = { top: `${30 + Math.random() * 30}%` }

  initTodoWsListener()
  void fetchTodoAllInfo()
})

onBeforeUnmount(() => {
  stopTodoWsListener?.()
  stopTodoWsListener = null
})
</script>

<template>
  <div
    v-if="shouldShowFloat"
    class="todo-float-wrap"
    :style="floatPosition"
    @pointerdown="onFloatPointerDown"
    @pointermove="onFloatPointerMove"
    @pointerup="onFloatPointerUp"
    @pointerleave="onFloatPointerUp"
  >
    <button class="todo-float-btn" type="button" @click.stop="openPanel">
      <span class="todo-float-text">{{ verifyLabel }}</span>
      <span v-if="totalCount > 0" class="todo-float-count">{{ totalCount }}</span>
    </button>
  </div>

  <div v-if="visible" class="todo-panel-mask">
    <div class="todo-panel" :style="pageBackgroundStyle">
      <div class="todo-panel-frost"></div>
      <div class="todo-panel-inner">
        <header class="todo-panel-header">
          <button class="back-btn" type="button" aria-label="back" @click="closePanel">‹</button>
          <h2>消息</h2>
        </header>

        <div class="todo-content">
          <section v-if="ucList.length > 0" class="todo-section">
            <h3>俱乐部玩家充值申请</h3>
            <article
              v-for="item in ucList"
              :key="String(item.order_no ?? item.user_random_id ?? '')"
              class="todo-card"
            >
              <div class="card-footer">
                <p>申请充值：{{ formatUcAmount(item.gold_num) }}</p>
              </div>

              <div class="card-divider"></div>

              <div class="card-header">
                <div class="player-block">
                  <img
                    class="player-avatar"
                    :src="item.avatar ? String(item.avatar) : avatarDefault"
                    alt="avatar"
                  />
                  <div class="player-text">
                    <p class="player-name">{{ item.nickname || '--' }}</p>
                    <p class="player-id">ID: {{ item.user_random_id || '--' }}</p>
                  </div>
                </div>
                <div class="card-aside">
                  <div class="meta-club">
                    <img
                      :src="item.club_logo ? String(item.club_logo) : avatarDefault"
                      alt="club"
                    />
                    <span>{{ item.club_name || '--' }}</span>
                  </div>
                  <p class="meta-time">{{ formatTime(item.create_time) }}</p>
                </div>
              </div>

              <ApproveRejectActions
                @approve="auditUc(item, true)"
                @reject="auditUc(item, false)"
              />
            </article>
          </section>

          <section v-if="bringInList.length > 0" class="todo-section">
            <h3>买入申请</h3>
            <article v-for="item in bringInList" :key="String(item.id ?? '')" class="todo-card">
              <div class="card-footer card-footer--credit">
                <p>买入申请：{{ formatBringInAmount(item.bring_in) }}</p>
              </div>

              <div class="card-divider"></div>

              <div class="card-header">
                <div class="player-block">
                  <img
                    class="player-avatar"
                    :src="item.avatar ? String(item.avatar) : avatarDefault"
                    alt="avatar"
                  />
                  <div class="player-text">
                    <p class="player-name">{{ item.user_name || '--' }}</p>
                    <p class="player-id">ID: {{ item.user_random_id || '--' }}</p>
                  </div>
                </div>
                <div class="card-aside">
                  <div class="meta-club">
                    <img
                      v-if="item.sender_icon && item.sender_icon.search('https') > 0"
                      :src="item.sender_icon ? String(item.sender_icon) : avatarDefault"
                      alt="club"
                    />
                    <span>
                      {{
                        item.sender_name === 'FRIEND ROOM'
                          ? item.room_name
                          : item.sender_name || '--'
                      }}
                    </span>
                  </div>
                  <p class="meta-time">{{ formatTime(item.create_time) }}</p>
                </div>
              </div>

              <ApproveRejectActions
                @approve="auditBringIn(item, true)"
                @reject="auditBringIn(item, false)"
              />
            </article>
          </section>

          <section v-if="joinClubList.length > 0" class="todo-section">
            <h3>加入俱乐部申请</h3>
            <article
              v-for="item in joinClubList"
              :key="String(item.id ?? '')"
              class="todo-card"
            >
              <div class="card-header">
                <div class="player-block">
                  <img
                    class="player-avatar"
                    :src="item.avatar ? String(item.avatar) : avatarDefault"
                    alt="avatar"
                  />
                  <div class="player-text">
                    <p class="player-name">{{ item.nickname || '--' }}</p>
                    <p class="player-id">ID: {{ item.user_random_id || '--' }}</p>
                  </div>
                </div>
                <div class="card-aside">
                  <div class="meta-club">
                    <img :src="item.logo ? String(item.logo) : avatarDefault" alt="club" />
                    <span>{{ item.club_name || '--' }}</span>
                  </div>
                  <p class="meta-time">{{ formatTime(item.create_time) }}</p>
                </div>
              </div>

              <ApproveRejectActions
                @approve="auditJoinClub(item, true)"
                @reject="auditJoinClub(item, false)"
              />
            </article>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.todo-float-wrap {
  position: fixed;
  right: -0.01rem;
  top: 40%;
  z-index: 120;
  touch-action: none;
  transition: top 0.15s ease-out;
}

.todo-float-btn {
  min-width: 2.2rem;
  height: 0.9rem;
  border: 0;
  border-radius: 0.45rem 0 0 0.45rem;
  padding: 0 0.35rem 0 0.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    148deg,
    rgba(var(--c-brand-rgb), 0.59) 7.5%,
    rgba(2, 122, 92, 0.59) 71.9%
  );
  color: #fff;
  position: relative;
  box-shadow: 0 0.08rem 0.24rem rgba(0, 0, 0, 0.28);

  @include theme-light {
    background: linear-gradient(148deg, rgba(5, 231, 174, 0.59) 7.5%, rgba(2, 122, 92, 0.59) 71.9%);
  }
}

.todo-float-text {
  font-size: 0.346rem;
  line-height: 1;
}

.todo-float-count {
  min-width: 0.42rem;
  height: 0.42rem;
  border-radius: 0.22rem;
  background: #ff132b;
  color: #fff;
  font-size: 0.28rem;
  line-height: 0.42rem;
  text-align: center;
  padding: 0 0.08rem;
  position: absolute;
  left: 0.04rem;
  top: -0.16rem;
}

.todo-panel-mask {
  position: fixed;
  inset: 0;
  z-index: 121;
}

.todo-panel {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: var(--c-page);
  background-image: var(--todo-panel-bg-dark);

  @include theme-light {
    background-image: var(--todo-panel-bg-light);
  }
}

.todo-panel-frost {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.98rem);
  mix-blend-mode: luminosity;

  @include theme-light {
    background: transparent;
    backdrop-filter: none;
    mix-blend-mode: normal;
  }
}

.todo-panel-inner {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.todo-panel-header {
  height: calc(env(safe-area-inset-top) + 1.46rem);
  padding: calc(env(safe-area-inset-top) + 0.34rem) 0.46rem 0.26rem;
  display: flex;
  align-items: center;
  gap: 0.12rem;

  h2 {
    margin: 0;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 500;
    line-height: 1.2;

    @include theme-light {
      color: #000;
    }
  }
}

.back-btn {
  width: 0.7rem;
  height: 0.7rem;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.8rem;
  line-height: 1;
  padding: 0;

  @include theme-light {
    color: #000;
  }
}

.todo-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 0.4rem 0.46rem calc(env(safe-area-inset-bottom) + 0.6rem);
  display: flex;
  flex-direction: column;
  gap: 0.46rem;
}

.todo-section {
  display: flex;
  flex-direction: column;
  gap: 0.24rem;

  h3 {
    margin: 0;
    font-size: 0.41rem;
    line-height: 1.4;
    color: #fff;
    font-weight: 500;

    @include theme-light {
      color: #000;
    }
  }
}

.todo-card {
  position: relative;
  border-radius: 1.036rem;
  background: var(--wallet-glass-bg);
  backdrop-filter: blur(16.5px);
  -webkit-backdrop-filter: blur(16.5px);
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
  padding: 0.32rem 0.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.todo-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(139deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0) 100%);
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

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.21rem;
}

.card-aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 0.03rem;
}

.meta-left,
.meta-time,
.meta-club span {
  margin: 0;
  font-size: 0.27rem;
  line-height: 1.4;
  color: #f3f3f3;

  @include theme-light {
    color: #000;
  }
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

.player-block {
  display: inline-flex;
  align-items: center;
  gap: 0.21rem;
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

  @include theme-light {
    color: #000;
  }
}

.player-id {
  margin: 0.08rem 0 0;
  font-size: 0.304rem;
  line-height: 1;
  color: rgba(243, 243, 243, 0.5);

  @include theme-light {
    color: rgba(0, 0, 0, 0.5);
  }
}

.card-footer {
  display: inline-flex;
  align-items: center;
  gap: 0.26rem;
  padding-left: 0.35rem;

  img {
    width: 0.72rem;
    height: 0.72rem;
  }

  p {
    margin: 0;
    font-size: 0.355rem;
    line-height: 1.2;
    color: #f9f9f9;

    @include theme-light {
      color: #000;
    }
  }

  .card-footer__chip {
    width: 0.4rem;
    height: 0.4rem;
    margin-left: calc(0.1rem - 0.26rem);
  }
}

.card-footer--credit {
  img {
    width: 0.33rem;
    height: 0.33rem;
  }
}

.card-divider {
  height: 0.0267rem;
  margin: 0 0.32rem;
  background: #a3a3a333;
}

</style>
