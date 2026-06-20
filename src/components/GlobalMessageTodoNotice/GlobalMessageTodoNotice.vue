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
import avatarDefault from '@/assets/images/default_avatar.png'
import iconPeople from '@/assets/icons/icon_people.png'
import iconBalance from '@/assets/icons/icon_balance.png'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { useGameStore } from '@/stores/game'

type TodoSectionType = 'uc' | 'bringIn' | 'joinClub'

interface TodoSection {
  type: TodoSectionType
  title: string
}

const sectionDefs: TodoSection[] = [
  { type: 'uc', title: '俱乐部玩家充值申请' },
  { type: 'bringIn', title: '买入申请' },
  { type: 'joinClub', title: '加入俱乐部申请' },
]

const visible = ref(false)
const loading = ref(false)
const data = ref<MsgMessageTodoAllInfoData>({})
const todoCountMap = ref<MsgMessageTodoAllInfoDataElement[]>([])
const gameStore = useGameStore()
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
  backgroundImage: `url(${mainBgUrl})`,
}))

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
  const response = await postMsgMessageTodoAllInfoApi({ todo_types: [2, 3, 6] })
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
      await fetchTodoAllInfo()
    }
    return
  }

  const response = await postRoomClubApplyAuditApi({
    apply_id: item.id,
    audit_op: pass ? 2 : 3,
  })
  if (response.code === 0) {
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
    updateTodoTypeCount(Number(payload.type || 0), Number(payload.num || 0))

    if (totalCount.value <= 0) {
      visible.value = false
    }
  })
}

onMounted(() => {
  initTodoWsListener()
  void fetchTodoAllInfo()
})

onBeforeUnmount(() => {
  stopTodoWsListener?.()
  stopTodoWsListener = null
})
</script>

<template>
  <div v-if="shouldShowFloat" class="todo-float-wrap">
    <button class="todo-float-btn" type="button" @click="openPanel">
      <span class="todo-float-text">消息验证</span>
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
              <div class="card-top card-top--uc">
                <div class="meta-club">
                  <img :src="item.club_logo ? String(item.club_logo) : avatarDefault" alt="club" />
                  <span>{{ item.club_name || '--' }}</span>
                </div>
                <p class="meta-time">{{ formatTime(item.create_time) }}</p>
              </div>

              <div class="card-main">
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
                <div class="pending-actions">
                  <button class="action-btn" type="button" @click="auditUc(item, true)">✓</button>
                  <button
                    class="action-btn action-btn--deny"
                    type="button"
                    @click="auditUc(item, false)"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div class="card-footer">
                <img :src="iconPeople" alt="uc" />
                <p>申请充值：{{ formatUcAmount(Number(item.gold_num) || Number(item.amount)) }}</p>
              </div>
            </article>
          </section>

          <section v-if="bringInList.length > 0" class="todo-section">
            <h3>买入申请</h3>
            <article v-for="item in bringInList" :key="String(item.id ?? '')" class="todo-card">
              <div class="card-top card-top--credit">
                <p class="meta-left">德州 ID: {{ item.room_id || '--' }}</p>
                <p class="meta-time">{{ formatTime(item.create_time) }}</p>
                <div class="meta-club">
                  <img
                    :src="item.sender_icon ? String(item.sender_icon) : avatarDefault"
                    alt="club"
                  />
                  <span>{{ item.sender_name || '--' }}</span>
                </div>
              </div>

              <div class="card-main">
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
                <div class="pending-actions">
                  <button class="action-btn" type="button" @click="auditBringIn(item, true)">
                    ✓
                  </button>
                  <button
                    class="action-btn action-btn--deny"
                    type="button"
                    @click="auditBringIn(item, false)"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div class="card-footer card-footer--credit">
                <img :src="iconBalance" alt="bring in" />
                <p>买入申请：{{ formatBringInAmount(item.bring_in) }}</p>
              </div>
            </article>
          </section>

          <section v-if="joinClubList.length > 0" class="todo-section">
            <h3>加入俱乐部申请</h3>
            <article
              v-for="item in joinClubList"
              :key="String(item.id ?? '')"
              class="todo-card todo-card--join"
            >
              <div class="card-main card-main--join">
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
                <div class="pending-actions">
                  <button class="action-btn" type="button" @click="auditJoinClub(item, true)">
                    ✓
                  </button>
                  <button
                    class="action-btn action-btn--deny"
                    type="button"
                    @click="auditJoinClub(item, false)"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div class="join-divider"></div>

              <div class="join-footer">
                <div class="meta-club">
                  <img :src="item.logo ? String(item.logo) : avatarDefault" alt="club" />
                  <span>{{ item.club_name || '--' }}</span>
                </div>
                <p class="meta-time">{{ formatTime(item.create_time) }}</p>
              </div>
            </article>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.todo-float-wrap {
  position: fixed;
  right: -0.01rem;
  top: 40%;
  z-index: 120;
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
  background: #55F329;
  color: #fff;
  position: relative;
  box-shadow: 0 0.08rem 0.24rem rgba(0, 0, 0, 0.28);
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
}

.todo-panel-frost {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.98rem);
  mix-blend-mode: luminosity;
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
  }
}

.todo-card {
  border-radius: 0.74rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.1rem);
  padding: 0.32rem 0.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.12rem;
}

.card-top--credit {
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

.card-main {
  border-radius: 4.23rem;
  min-height: 1.5rem;
  background: rgba(255, 255, 255, 0.14);
  padding-right: 0.28rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-main--join {
  border-radius: 0;
  min-height: 1.58rem;
  background: transparent;
  padding-right: 0;
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
  gap: 0.34rem;
}

.action-btn {
  width: 0.97rem;
  height: 0.97rem;
  border-radius: 50%;
  border: 0.013rem solid #fff;
  background: rgba(255, 255, 255, 0.2);
  color: #f3f3f3;
  font-size: 0.52rem;
  line-height: 1;
  padding: 0;
}

.action-btn--deny {
  color: #ff3048;
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
  }
}

.card-footer--credit {
  img {
    width: 0.33rem;
    height: 0.33rem;
  }
}

.todo-card--join {
  gap: 0.2rem;
}

.join-divider {
  width: 100%;
  height: 0.013rem;
  background: rgba(255, 255, 255, 0.25);
}

.join-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
