<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import FilterTabbar from '@/components/Tabbar/FilterTabbar.vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import MttStatusTab from './components/MttStatusTab.vue'
import MttPlayersTab from './components/MttPlayersTab.vue'
import MttRewardsTab from './components/MttRewardsTab.vue'
import MttTablesTab from './components/MttTablesTab.vue'
import MttBlindsTab from './components/MttBlindsTab.vue'
import MttBuyinModal from './components/MttBuyinModal.vue'
import type { FilterTabOption } from '@/components/Tabbar/FilterTabbar.vue'
import {
  MttPlayerStatus,
  type RoomcenterMttDetailData,
  type RoomcenterMttHunterRanksData,
  type RoomcenterMttRanksData,
  type RoomcenterMttRealPrize,
  type RoomcenterMttRoomRecord,
} from '@/api/models/roomcenter'
import {
  getRoomcenterMttDetailApi,
  mttBuyInApi,
  mttQuitApi,
  mttRebuyApi,
  postRoomcenterMttHunterRanksApi,
  postRoomcenterMttRanksApi,
  postRoomcenterMttRealPrizeApi,
  postRoomcenterMttRoomsApi,
} from '@/api/roomcenter'
import { getLocale, t } from '@/i18n'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'
import { toUnixSeconds } from '@/utils/time'
import { enterMtt } from '@/bridge/core'
import type { EnterMttPayload } from '@/bridge/protocol'
import { useGameStore } from '@/stores/game'
import LoginSession from '@/session/loginSession'

type DetailTabName = 'status' | 'players' | 'rewards' | 'tables' | 'blinds'

const route = useRoute()
const gameStore = useGameStore()
const activeTab = ref<DetailTabName>('status')
const detailData = ref<RoomcenterMttDetailData | null>(null)
const btnLoading = ref(false)
const showBuyinModal = ref(false)
const buyinModalTitle = ref<string | undefined>(undefined)
const buyinJoinMode = ref<'apply' | 'rebuy' | 'addon'>('apply')
const tick = ref(0)
let tickTimer: ReturnType<typeof setInterval> | null = null

/* ===== 各 tab 子数据（提升到父级管理，跨 tab 切换时数据保留） ===== */
const playersLoading = ref(false)
const rankData = ref<RoomcenterMttRanksData | null>(null)
const hunterData = ref<RoomcenterMttHunterRanksData | null>(null)
const playerRequestCode = ref<number | null>(null)

const tablesLoading = ref(false)
const roomList = ref<RoomcenterMttRoomRecord[]>([])

const rewardsLoading = ref(false)
const rewardData = ref<RoomcenterMttRealPrize | null>(null)

const matchId = computed(() => {
  const id = route.query.id
  return id ? Number(id) : 0
})

const pageTitle = computed(() => {
  const rawName = detailData.value?.mtt?.name
  if (!rawName) return ''
  return resolveTemplateTextByKey(rawName, getLocale()) || t(rawName) || rawName
})

const tabs = ref<FilterTabOption[]>([
  { name: 'status', title: t('UITexasReport_Label_AllBarSK') },
  { name: 'players', title: t('UITexasReport_player') },
  { name: 'rewards', title: t('MTT_State_Reward') },
  { name: 'tables', title: t('UITexasReport_Label_AllBarPZ') },
  { name: 'blinds', title: t('UITexasReport_Label_AllBarMZ') },
])

const stateCode = computed(() => detailData.value?.state_code ?? -1)

const btnConfig = computed<{ text: string; active: boolean }>(() => {
  const s = stateCode.value
  const leftRebuy = detailData.value?.state?.left_rebuy_times ?? 0
  const rebuyTotal = detailData.value?.mtt?.rebuy_times ?? 0
  switch (s) {
    case MttPlayerStatus.WAITING_APPLY:
      return { text: t('mtt_btn_waiting_start'), active: false }
    case MttPlayerStatus.CAN_APPLY_NOT_START:
      return { text: t('MTT-Apply'), active: true }
    case MttPlayerStatus.CAN_APPLY_DELAY:
      return { text: t('mtt_btn_delay'), active: true }
    case MttPlayerStatus.APPLIED_NOT_START:
      return { text: t('UIMTT_Cancelbaoming'), active: true }
    case MttPlayerStatus.CAN_JOIN:
      return { text: t('mtt_btn_enter'), active: true }
    case MttPlayerStatus.CANNOT_APPLY_STARTED:
      return { text: t('mtt_btn_sign_up_deadline'), active: false }
    case MttPlayerStatus.LOSE_CAN_REBUY:
      return leftRebuy > 0
        ? { text: t('MTT_Rebuy'), active: true }
        : { text: `${t('MTT_Rebuy')} ${leftRebuy}/${rebuyTotal}`, active: false }
    case MttPlayerStatus.LOSE:
      return { text: `${t('MTT_Rebuy')} ${leftRebuy}/${rebuyTotal}`, active: false }
    case MttPlayerStatus.JOIN_COMPLETE:
    case MttPlayerStatus.NOT_JOIN_COMPLETE:
      return { text: t('Mtt_Complete'), active: false }
    case MttPlayerStatus.CANNOT_JOIN_OVERTIME:
      return { text: t('Mtt_CannotJoinOvertime'), active: false }
    default:
      return { text: t('MTT-Apply'), active: false }
  }
})

/* ===== 数据加载 ===== */

async function loadDetail(): Promise<void> {
  if (!matchId.value) return
  try {
    const res = await getRoomcenterMttDetailApi(matchId.value)
    if (res.code === 0 && res.data) detailData.value = res.data
  } catch {
    // silently ignore
  }
}

function emptyRankData(): RoomcenterMttRanksData {
  return { alive: 0, total: 0, sb: 0, limit: 0, offset: 0, records: [] }
}

function emptyHunterData(): RoomcenterMttHunterRanksData {
  return { total: 0, sb: 0, limit: 0, offset: 0, records: [] }
}

async function loadRankList(): Promise<void> {
  if (!matchId.value) {
    rankData.value = emptyRankData()
    playerRequestCode.value = null
    return
  }
  try {
    const response = await postRoomcenterMttRanksApi(
      matchId.value,
      { limit: 200, offset: 0 },
      { suppressBusinessCodes: [10001] },
    )
    const code = Number(response.code ?? -1)
    if (Number(response.code) === 0 && response.data) {
      rankData.value = response.data
      // 同步 alive / total 到 detailData，供其他 tab 共享
      syncRankDataToDetail(response.data)
      playerRequestCode.value = null
      return
    }
    rankData.value = emptyRankData()
    playerRequestCode.value = Number.isFinite(code) ? code : -1
  } catch {
    rankData.value = emptyRankData()
    playerRequestCode.value = null
  }
}

async function loadHunterList(): Promise<void> {
  const hunterOn = (detailData.value?.mtt?.hunter_on ?? 0) === 1
  if (!matchId.value || !hunterOn) {
    hunterData.value = emptyHunterData()
    playerRequestCode.value = null
    return
  }
  try {
    const response = await postRoomcenterMttHunterRanksApi(
      matchId.value,
      { limit: 200, offset: 0 },
      { suppressBusinessCodes: [10001] },
    )
    const code = Number(response.code ?? -1)
    if (Number(response.code) === 0 && response.data) {
      hunterData.value = response.data
      playerRequestCode.value = null
      return
    }
    hunterData.value = emptyHunterData()
    playerRequestCode.value = Number.isFinite(code) ? code : -1
  } catch {
    hunterData.value = emptyHunterData()
    playerRequestCode.value = null
  }
}

async function loadPlayersData(mode: 'rank' | 'hunter' = 'rank'): Promise<void> {
  playersLoading.value = true
  const hunterOn = (detailData.value?.mtt?.hunter_on ?? 0) === 1
  try {
    // 始终加载排名数据；hunter 模式下同时加载猎人榜
    const tasks: Promise<void>[] = [loadRankList()]
    if (mode === 'hunter' || hunterOn) {
      tasks.push(loadHunterList())
    }
    await Promise.all(tasks)
  } finally {
    playersLoading.value = false
  }
}

async function loadRoomsData(): Promise<void> {
  if (!matchId.value) {
    roomList.value = []
    return
  }
  tablesLoading.value = true
  try {
    const response = await postRoomcenterMttRoomsApi(
      matchId.value,
      { limit: 200, offset: 0 },
      { suppressBusinessToast: true },
    )
    if (Number(response.code) === 0 && response.data) {
      roomList.value = Array.isArray(response.data.records) ? response.data.records : []
      return
    }
    roomList.value = []
  } catch {
    roomList.value = []
  } finally {
    tablesLoading.value = false
  }
}

async function loadRewardsData(): Promise<void> {
  if (!matchId.value) {
    rewardData.value = null
    return
  }
  rewardsLoading.value = true
  try {
    const response = await postRoomcenterMttRealPrizeApi(matchId.value)
    if (Number(response.code) === 0 && response.data) {
      rewardData.value = response.data
      return
    }
    rewardData.value = null
  } catch {
    rewardData.value = null
  } finally {
    rewardsLoading.value = false
  }
}

/** 将 rankData 中的 alive / total 同步回 detailData，实现跨 tab 数据共享 */
function syncRankDataToDetail(ranks: RoomcenterMttRanksData): void {
  if (!detailData.value) return
  if (ranks.alive !== undefined && ranks.alive !== null) {
    detailData.value = { ...detailData.value, alive: ranks.alive }
  }
  if (ranks.total !== undefined && ranks.total !== null) {
    detailData.value = { ...detailData.value, enter_total: ranks.total }
  }
}

/** tab 切换时静默刷新对应子数据（已有数据则后台刷新，不展示 loading 占位） */
function loadActiveTabData(): void {
  if (activeTab.value === 'players') {
    void loadPlayersData()
  } else if (activeTab.value === 'tables') {
    void loadRoomsData()
  } else if (activeTab.value === 'rewards') {
    void loadRewardsData()
  }
}

// 对齐 Unity UIMatchMttDetailComponent.Update()：
// 当 state_code 为 WAITING_APPLY 时，每秒检查 apply_start_time，
// 到达后重新拉取详情，服务端会返回新的 state_code（CAN_APPLY_NOT_START）。
watch(tick, () => {
  if (stateCode.value !== MttPlayerStatus.WAITING_APPLY) return
  const applyStart = toUnixSeconds(detailData.value?.mtt?.apply_start_time)
  if (applyStart && Math.floor(Date.now() / 1000) >= applyStart) {
    void loadDetail()
  }
})

// tab 切换时静默刷新
watch(activeTab, () => {
  loadActiveTabData()
})

onMounted(() => {
  void loadDetail()
  tickTimer = setInterval(() => { tick.value++ }, 1000)
})

onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer)
})

async function handleBtnClick(): Promise<void> {
  if (!btnConfig.value.active || btnLoading.value) return
  const s = stateCode.value

  // 报名：弹买入弹窗
  if (s === MttPlayerStatus.CAN_APPLY_NOT_START || s === MttPlayerStatus.CAN_APPLY_DELAY) {
    buyinJoinMode.value = 'apply'
    buyinModalTitle.value = undefined // 使用默认 UIMTTSignDialogBuyTitle
    showBuyinModal.value = true
    return
  }

  // 重购：先校验次数，弹买入弹窗（对齐 Unity MttRebuyAsync availableTimes < 1 检查）
  if (s === MttPlayerStatus.LOSE_CAN_REBUY) {
    const leftTimes = detailData.value?.state?.left_rebuy_times ?? 0
    if (leftTimes < 1) {
      // 按钮不可点时不应到达此处，防御性兜底
      return
    }
    buyinJoinMode.value = 'rebuy'
    buyinModalTitle.value = t('MTT_Rebuy')
    showBuyinModal.value = true
    return
  }

  // 进入牌桌：通知 Cocos 进入 MTT 房间（对齐 Unity ShowGameplayUI + EnterForegroundAsync）
  if (s === MttPlayerStatus.CAN_JOIN) {
    btnLoading.value = true
    try {
      const wsPort = await LoginSession.EnsureWS().catch(() => 0)
      const mttData = detailData.value?.mtt
      const payload: EnterMttPayload = {
        userName: gameStore.loginNickname || gameStore.loginAccount || 'guest',
        userId: gameStore.loginUserId || gameStore.loginAccount || '',
        websocketPort: typeof wsPort === 'number' ? wsPort : 0,
        from: 'h5-lobby',
        matchId: matchId.value,
        matchInfo: mttData ?? {},
      }
      enterMtt(payload)
    } finally {
      btnLoading.value = false
    }
    return
  }

  // 取消报名
  if (s === MttPlayerStatus.APPLIED_NOT_START) {
    btnLoading.value = true
    try {
      const res = await mttQuitApi(matchId.value)
      if (res && res.code === 0) await loadDetail()
    } finally {
      btnLoading.value = false
    }
  }
}

async function handleBuyinConfirm(payload: { ticket: boolean; ratio: number; useFree: boolean; clubId?: number }): Promise<void> {
  showBuyinModal.value = false
  const id = matchId.value
  btnLoading.value = true
  try {
    const isRebuy = buyinJoinMode.value === 'rebuy'
    const apiPayload = {
      ticket: payload.ticket,
      ratio: payload.ratio,
      use_free: payload.useFree,
      club_id: payload.clubId ?? detailData.value?.mtt?.club_id ?? 0,
    }
    const res = isRebuy
      ? await mttRebuyApi(id, apiPayload)
      : await mttBuyInApi(id, apiPayload)
    if (res && res.code === 0) {
      await loadDetail()
    }
  } finally {
    btnLoading.value = false
  }
}

/* ===== 子组件事件处理 ===== */
function handlePlayersRefresh(mode: 'rank' | 'hunter'): void {
  void loadPlayersData(mode)
}

async function handleEnterTable(rid: number): Promise<void> {
  if (btnLoading.value) return
  btnLoading.value = true
  try {
    const wsPort = await LoginSession.EnsureWS().catch(() => 0)
    const mttData = detailData.value?.mtt
    const payload: EnterMttPayload = {
      userName: gameStore.loginNickname || gameStore.loginAccount || 'guest',
      userId: gameStore.loginUserId || gameStore.loginAccount || '',
      websocketPort: typeof wsPort === 'number' ? wsPort : 0,
      from: 'h5-lobby',
      matchId: matchId.value,
      matchInfo: mttData ?? {},
      roomId: rid,
      isLookOn: true,
    }
    enterMtt(payload)
  } finally {
    btnLoading.value = false
  }
}
</script>

<template>
  <div class="mtt-detail-page">
    <div class="bg-overlay"></div>

    <!-- 顶部返回 -->
    <HeaderBack :title="pageTitle" />

    <!-- Tab 筛选 -->
    <FilterTabbar
      v-model="activeTab"
      :tabs="tabs"
      active-bg="pill"
      class="filter-bar"
    />

    <!-- 内容区 -->
    <div class="mtt-detail-content">
      <MttStatusTab v-if="activeTab === 'status'" :data="detailData" />
      <MttPlayersTab
        v-else-if="activeTab === 'players'"
        :data="detailData"
        :match-id="matchId"
        :rank-data="rankData"
        :hunter-data="hunterData"
        :loading="playersLoading"
        :player-request-code="playerRequestCode"
        @refresh="handlePlayersRefresh"
      />
      <MttRewardsTab
        v-else-if="activeTab === 'rewards'"
        :data="detailData"
        :match-id="matchId"
        :reward-data="rewardData"
        :loading="rewardsLoading"
        @refresh="loadRewardsData"
      />
      <MttTablesTab
        v-else-if="activeTab === 'tables'"
        :data="detailData"
        :match-id="matchId"
        :room-list="roomList"
        :loading="tablesLoading"
        @refresh="loadRoomsData"
        @enter-table="handleEnterTable"
      />
      <MttBlindsTab v-else-if="activeTab === 'blinds'" :data="detailData" :match-id="matchId" />
    </div>

    <!-- 底部报名按钮 -->
    <div class="detail-footer">
      <PrimaryButton
        :text="btnConfig.text"
        :disabled="!btnConfig.active || btnLoading"
        @click="handleBtnClick"
      />
    </div>

    <!-- 买入弹窗（报名/重购复用，join-mode 控制费用计算，title 控制标题） -->
    <MttBuyinModal
      v-model:show="showBuyinModal"
      :mtt="detailData?.mtt"
      :mtt-id="matchId"
      :join-mode="buyinJoinMode"
      :title="buyinModalTitle"
      @confirm="handleBuyinConfirm"
    />
  </div>
</template>

<style scoped lang="scss">
.filter-bar{
  margin: 0.3rem;
}
.mtt-detail-page {
  position: relative;
  height: 100dvh;
  color: #fff;
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 15% 92%, rgba(255, 173, 212, 0.32), transparent 34%),
    radial-gradient(circle at 88% 84%, rgba(102, 227, 255, 0.28), transparent 34%),
    radial-gradient(circle at 50% 56%, rgba(255, 255, 255, 0.12), transparent 48%);
}

/* ===== 内容滚动区 ===== */
.mtt-detail-content {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 0 0.30rem 0.4rem;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  min-height: 0;
}

/* ===== 底部按钮 ===== */
.detail-footer {
  position: relative;
  z-index: 1;
  padding: 0.2rem 0.54rem 0.4rem;
  flex-shrink: 0;
}
</style>
