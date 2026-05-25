<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import iconChips from '@/assets/icons/icon_chips.png'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconClock from '@/assets/icons/icon_mtt_clock.svg'
import iconRanking from '@/assets/icons/icon_mtt_ranking.svg'
import { getRoomcenterMttDetailApi, getRoomcenterMttMyawardApi } from '@/api/roomcenter'
import type { RoomcenterMttDetailData, RoomcenterMttMyawardData } from '@/api/models/roomcenter'
import { t, getLocale } from '@/i18n'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'
import { formatDateTime, toTimestampMs } from '@/utils/time'

const props = defineProps<{
  panelProps?: Record<string, unknown>
  emitPanelEvent: (event: string, payload?: unknown) => void
  closePanel: (reason?: string, payload?: unknown) => void
}>()

// ── 从 Cocos 传入的上下文参数 ──
const matchId = computed(() => props.panelProps?.matchId ?? props.panelProps?.match_id)
const matchName = computed(() =>
  String(props.panelProps?.matchName ?? props.panelProps?.match_name ?? ''),
)
const isRebuy = computed(() => Boolean(props.panelProps?.isRebuy ?? props.panelProps?.is_rebuy))
const currentBlindLevel = computed(() =>
  Number(props.panelProps?.currentBlindLevel ?? props.panelProps?.current_blind_level ?? 0),
)
const maxRebuyBlindLevel = computed(() =>
  Number(props.panelProps?.maxRebuyBlindLevel ?? props.panelProps?.max_rebuy_blind_level ?? 0),
)
const remainRebuyTimes = computed(() =>
  Number(props.panelProps?.remainRebuyTimes ?? props.panelProps?.remain_rebuy_times ?? 0),
)

// ── 决定展示哪个 case ──
// settlement: 展示排名奖励（isRebuy=false，或 isRebuy=true 但盲注已超重购上限）
// rebuy:      isRebuy=true 且盲注未超上限且还有重购次数 → 展示重购按钮
// confirm:    isRebuy=true 且盲注未超上限且次数耗尽 → 展示确认按钮
const panelCase = computed<'settlement' | 'rebuy' | 'confirm'>(() => {
  if (!isRebuy.value) return 'settlement'
  const withinRebuyPeriod =
    maxRebuyBlindLevel.value > 0 && currentBlindLevel.value < maxRebuyBlindLevel.value
  if (withinRebuyPeriod) {
    return remainRebuyTimes.value > 0 ? 'rebuy' : 'confirm'
  }
  return 'settlement'
})

// ── 动态拉取数据（仅 settlement case 需要） ──
const loading = ref(false)
const pollingRetried = ref(false)
const mttDetail = ref<RoomcenterMttDetailData | null>(null)
const awardData = ref<RoomcenterMttMyawardData | null>(null)

let pollTimer: ReturnType<typeof setTimeout> | null = null
let pollCount = 0
const MAX_POLL = 5
const POLL_INTERVAL_MS = 3000

async function fetchMttDetail() {
  if (!matchId.value) return
  try {
    const res = await getRoomcenterMttDetailApi(matchId.value as number | string)
    if (res.code === 0) mttDetail.value = res.data ?? null
  } catch {
    console.log('fetchMttDetail error')
  }
}

async function fetchAward(): Promise<boolean> {
  if (!matchId.value) return false
  try {
    const res = await getRoomcenterMttMyawardApi(matchId.value as number | string)
    if (res.code === 0 && res.data) {
      awardData.value = res.data
      return true
    }
  } catch {
    console.log('fetchAward error')
  }
  return false
}

async function startPolling() {
  pollCount = 0
  const attempt = async () => {
    const ok = await fetchAward()
    if (ok) {
      loading.value = false
      return
    }
    pollCount++
    pollingRetried.value = true
    if (pollCount < MAX_POLL) {
      pollTimer = setTimeout(attempt, POLL_INTERVAL_MS)
    } else {
      loading.value = false
    }
  }
  await attempt()
}

onMounted(async () => {
  if (panelCase.value === 'settlement' && matchId.value) {
    loading.value = true
    await fetchMttDetail()
    await startPolling()
  }
})

onUnmounted(() => {
  if (pollTimer != null) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
})

// ── 展示数据 ──

// 赛事名称：通过多语言模板解析 mtt.name，回退到 Cocos 传入的名称
const tournamentName = computed(() => {
  const rawName = mttDetail.value?.mtt?.name
  if (rawName) {
    return resolveTemplateTextByKey(rawName, getLocale()) || t(rawName) || rawName
  }
  return matchName.value
})

// 开始时间：格式化为 YYYY/MM/DD HH:mm:ss
const startTime = computed(() => {
  const raw =
    mttDetail.value?.mtt?.start_time ?? props.panelProps?.startTime ?? props.panelProps?.start_time
  if (!raw) return ''
  return formatDateTime(toTimestampMs(raw), 'YYYY/MM/DD HH:mm:ss')
})

const totalParticipants = computed(() => mttDetail.value?.mtt?.participants ?? 0)

// 奖励
const poolAmount = computed(() => awardData.value?.award_gold ?? 0)
const hunterAmount = computed(() => awardData.value?.hunter_award ?? 0)
const hasHunterReward = computed(() => hunterAmount.value > 0)
const hasReward = computed(() => poolAmount.value > 0 || hunterAmount.value > 0)

// 排名
const yourRank = computed(() => awardData.value?.rank ?? 0)
const isFinal = computed(() => awardData.value?.is_final ?? false)

// 加载文案：初始显示等待结算，重试后显示排名计算中
const loadingText = computed(() =>
  pollingRetried.value ? t('Ranking_check') : t('UIMTTWaitforend'),
)

function handleDone(): void {
  props.emitPanelEvent('done')
  props.closePanel('done')
}

function handleRebuy(): void {
  props.emitPanelEvent('rebuy')
  props.closePanel('rebuy')
}

function handleConfirm(): void {
  props.emitPanelEvent('confirm')
  props.closePanel('confirm')
}
</script>

<template>
  <section class="mtt-settlement-panel">
    <!-- 赛事名称 -->
    <div v-if="tournamentName" class="mtt-settlement-panel__title">
      {{ tournamentName }}
    </div>

    <!-- ── Case: rebuy（可重购）── -->
    <template v-if="panelCase === 'rebuy'">
      <div class="mtt-settlement-panel__case-title">
        {{ t('UIMTTSignDialogReBuyTitle') }}
      </div>
      <PrimaryButton
        class="mtt-settlement-panel__btn"
        :text="t('MTT_Rebuy')"
        @click="handleRebuy"
      />
    </template>

    <!-- ── Case: confirm（无次数，不可重购）── -->
    <template v-else-if="panelCase === 'confirm'">
      <div class="mtt-settlement-panel__case-title">
        {{ t('UIMTT_Ranking_TiaoZheng') }}
      </div>
      <PrimaryButton class="mtt-settlement-panel__btn" text="OK" @click="handleConfirm" />
    </template>

    <!-- ── Case: settlement（结算）── -->
    <template v-else>
      <!-- 加载 / 轮询中 -->
      <div v-if="loading" class="mtt-settlement-panel__loading">
        {{ loadingText }}
      </div>

      <template v-else>
        <!-- 开始时间 -->
        <div v-if="startTime" class="mtt-settlement-panel__time-row">
          <img class="mtt-settlement-panel__time-icon" :src="iconClock" alt="clock" />
          <span class="mtt-settlement-panel__time-label">{{ t('MTT-Start Time') }}</span>
          <span class="mtt-settlement-panel__time-value">{{ startTime }}</span>
        </div>

        <!-- 有奖励 -->
        <template v-if="hasReward">
          <!-- 恭喜文案 -->
          <div class="mtt-settlement-panel__congrats">
            {{ t('UIMTT_Ranking_GongXi') }}
          </div>

          <!-- 奖池奖励 -->
          <div v-if="poolAmount > 0" class="mtt-settlement-panel__reward-row">
            <img class="mtt-settlement-panel__reward-icon" :src="iconChips" alt="chips" />
            <div class="mtt-settlement-panel__reward-content">
              <span class="mtt-settlement-panel__reward-amount">{{ poolAmount }}</span>
            </div>
          </div>

          <!-- 猎人奖励 -->
          <div v-if="hasHunterReward" class="mtt-settlement-panel__reward-row">
            <img class="mtt-settlement-panel__reward-icon" :src="iconDiamond" alt="diamond" />
            <div class="mtt-settlement-panel__reward-content">
              <span class="mtt-settlement-panel__reward-amount">{{ hunterAmount }}</span>
            </div>
          </div>

          <!-- 领奖说明 -->
          <div class="mtt-settlement-panel__reward-tips">
            {{ t('UIMTT_Ranking_GongXiTips') }}
          </div>
        </template>

        <!-- 无奖励 -->
        <div v-else class="mtt-settlement-panel__no-reward">
          {{ t('UIMTT_Ranking_TiaoZheng') }}
        </div>

        <!-- 排名（最终排名出来后才显示） -->
        <div v-if="isFinal && yourRank > 0" class="mtt-settlement-panel__ranking-row">
          <div class="mtt-settlement-panel__ranking-left">
            <img class="mtt-settlement-panel__ranking-icon" :src="iconRanking" alt="ranking" />
            <span class="mtt-settlement-panel__ranking-label">
              {{ t('UIMTT_Ranking_YourRank') }}
            </span>
          </div>
          <span class="mtt-settlement-panel__ranking-value">
            <span class="mtt-settlement-panel__ranking-current">{{ yourRank }}</span>
            <span class="mtt-settlement-panel__ranking-separator">/</span>
            <span class="mtt-settlement-panel__ranking-total">{{ totalParticipants }}</span>
          </span>
        </div>

        <!-- Done 按钮 -->
        <PrimaryButton class="mtt-settlement-panel__btn" text="Done" @click="handleDone" />
      </template>
    </template>
  </section>
</template>

<style scoped lang="scss">
.mtt-settlement-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.3rem 0.41rem 0.43rem;
  gap: 0.21rem;
  width: 100%;
  box-sizing: border-box;
}

/* ── 赛事名称 ── */
.mtt-settlement-panel__title {
  color: #fff;
  font-size: 0.5rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  text-align: center;
  line-height: 1.3;
}

/* ── case 标题（rebuy / confirm 的说明文案） ── */
.mtt-settlement-panel__case-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.42rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 600;
  text-align: center;
  padding: 0.2rem 0;
}

/* ── 加载中 ── */
.mtt-settlement-panel__loading {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.37rem;
  font-family: 'HONOR Sans CN', sans-serif;
  text-align: center;
  padding: 0.5rem 0;
}

/* ── 恭喜文案 ── */
.mtt-settlement-panel__congrats {
  color: #fff;
  font-size: 0.42rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 600;
  text-align: center;
}

/* ── 领奖说明 ── */
.mtt-settlement-panel__reward-tips {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.32rem;
  font-family: 'HONOR Sans CN', sans-serif;
  text-align: center;
  line-height: 1.4;
}

/* ── 无奖励提示 ── */
.mtt-settlement-panel__no-reward {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.37rem;
  font-family: 'HONOR Sans CN', sans-serif;
  text-align: center;
  padding: 0.2rem 0;
}

/* ── 开始时间行 ── */
.mtt-settlement-panel__time-row {
  width: 100%;
  height: 1.07rem;
  display: flex;
  align-items: center;
  padding: 0 0.38rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.62rem;
  box-sizing: border-box;
  gap: 0.1rem;
}

.mtt-settlement-panel__time-icon {
  width: 0.32rem;
  height: 0.32rem;
  object-fit: contain;
  flex-shrink: 0;
}

.mtt-settlement-panel__time-label {
  color: #fff;
  font-size: 0.35rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
}

.mtt-settlement-panel__time-value {
  color: #fff;
  font-size: 0.41rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  margin-left: auto;
}

/* ── 奖励行 ── */
.mtt-settlement-panel__reward-row {
  width: 100%;
  height: 2.24rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(
    158deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(229.6, 229.6, 229.6, 0.1) 100%
  );
  border-radius: 0.77rem;
}

.mtt-settlement-panel__reward-icon {
  width: 0.85rem;
  height: 0.85rem;
  object-fit: contain;
  flex-shrink: 0;
}

.mtt-settlement-panel__reward-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.mtt-settlement-panel__reward-amount {
  background: var(--primary, #05e7ae);
  color: transparent;
  background-clip: text;
  -webkit-background-clip: text;
  font-size: 0.78rem;
  font-family: 'Keania One', sans-serif;
  font-weight: 400;
  line-height: 1.1;
  text-shadow: 0 0.11rem 0.11rem rgba(0, 0, 0, 0.25);
}

.mtt-settlement-panel__reward-sub {
  color: #fff;
  font-size: 0.37rem;
  font-family: 'Keania One', sans-serif;
  font-weight: 400;
  text-shadow: 0 0.11rem 0.11rem rgba(0, 0, 0, 0.25);
}

/* ── 排名行 ── */
.mtt-settlement-panel__ranking-row {
  width: 100%;
  height: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mtt-settlement-panel__ranking-left {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.mtt-settlement-panel__ranking-icon {
  width: 0.45rem;
  height: 0.45rem;
  object-fit: contain;
  flex-shrink: 0;
}

.mtt-settlement-panel__ranking-label {
  color: #fff;
  font-size: 0.35rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
}

.mtt-settlement-panel__ranking-value {
  font-size: 0.56rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
}

.mtt-settlement-panel__ranking-current {
  background: var(--primary, #05e7ae);
  color: transparent;
  background-clip: text;
  -webkit-background-clip: text;
}

.mtt-settlement-panel__ranking-separator {
  color: #fff;
}

.mtt-settlement-panel__ranking-total {
  color: #fff;
}

/* ── 按钮 ── */
.mtt-settlement-panel__btn {
  width: 100%;
}
</style>
