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
import type { FilterTabOption } from '@/components/Tabbar/FilterTabbar.vue'
import { MttPlayerStatus, type RoomcenterMttDetailData } from '@/api/models/roomcenter'
import { getRoomcenterMttDetailApi, mttBuyInApi, mttQuitApi, mttRebuyApi } from '@/api/roomcenter'
import { getLocale, t } from '@/i18n'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'
import { toUnixSeconds } from '@/utils/time'

type DetailTabName = 'status' | 'players' | 'rewards' | 'tables' | 'blinds'

const route = useRoute()
const activeTab = ref<DetailTabName>('status')
const detailData = ref<RoomcenterMttDetailData | null>(null)
const btnLoading = ref(false)
const tick = ref(0)
let tickTimer: ReturnType<typeof setInterval> | null = null

const matchId = computed(() => {
  const id = route.query.id
  return id ? Number(id) : 0
})

const pageTitle = computed(() => {
  const rawName = detailData.value?.mtt?.name
  if (!rawName) return 'MTT 详情'
  return resolveTemplateTextByKey(rawName, getLocale()) || t(rawName) || rawName
})

const tabs = ref<FilterTabOption[]>([
  { name: 'status', title: '赛况' },
  { name: 'players', title: '玩家' },
  { name: 'rewards', title: '奖励' },
  { name: 'tables', title: '牌桌' },
  { name: 'blinds', title: '盲注' },
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

async function loadDetail(): Promise<void> {
  if (!matchId.value) return
  try {
    const res = await getRoomcenterMttDetailApi(matchId.value)
    if (res.code === 0 && res.data) detailData.value = res.data
  } catch {
    // silently ignore
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

onMounted(() => {
  void loadDetail()
  tickTimer = setInterval(() => { tick.value++ }, 1000)
})

onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer)
})

async function handleBtnClick(): Promise<void> {
  if (!btnConfig.value.active || btnLoading.value) return
  const id = matchId.value
  const clubId = detailData.value?.mtt?.club_id ?? 0
  btnLoading.value = true
  try {
    let res: { code?: number } | null = null
    switch (stateCode.value) {
      case MttPlayerStatus.CAN_APPLY_NOT_START:
      case MttPlayerStatus.CAN_APPLY_DELAY:
        res = await mttBuyInApi(id, { ticket: false, ratio: 0, use_free: false, club_id: clubId })
        break
      case MttPlayerStatus.APPLIED_NOT_START:
        res = await mttQuitApi(id)
        break
      case MttPlayerStatus.LOSE_CAN_REBUY:
        res = await mttRebuyApi(id, { ticket: false, ratio: 0, use_free: false, club_id: clubId })
        break
      case MttPlayerStatus.CAN_JOIN:
        showToast(t('mtt_btn_enter'))
        return
    }
    if (res && res.code === 0) {
      await loadDetail()
    }
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
    <FilterTabbar v-model="activeTab" :tabs="tabs" active-bg="pill" />

    <!-- 内容区 -->
    <div class="mtt-detail-content">
      <MttStatusTab v-if="activeTab === 'status'" :data="detailData" />
      <MttPlayersTab v-else-if="activeTab === 'players'" :data="detailData" :match-id="matchId" />
      <MttRewardsTab v-else-if="activeTab === 'rewards'" :data="detailData" :match-id="matchId" />
      <MttTablesTab v-else-if="activeTab === 'tables'" :data="detailData" :match-id="matchId" />
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
  </div>
</template>

<style scoped lang="scss">
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
  padding: 0 0.38rem 0.4rem;
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
