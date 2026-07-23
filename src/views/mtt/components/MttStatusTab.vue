<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import hunterIcon from '@/assets/icons/icon_mtt_hunter.png'
import chipsIcon from '@/assets/icons/icon_chip_red.png'
import diamondIcon from '@/assets/icons/icon_diamond.png'
import type { RoomcenterMttDetailData } from '@/api/models/roomcenter'
import { formatDateTime, toUnixSeconds } from '@/utils/time'
import { getLocale, t } from '@/i18n'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'

const props = defineProps<{
  data: RoomcenterMttDetailData | null
}>()

/* ===== 倒计时 tick ===== */
const timerTick = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timerInterval = setInterval(() => {
    timerTick.value++
  }, 1000)
})
onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

/* ===== 数据快捷引用 ===== */
const mtt = computed(() => props.data?.mtt)
const more = computed(() => props.data?.more)
const realPrize = computed(() => props.data?.real_prize)

/* ===== 工具函数 ===== */
function fmtNum(n: number | undefined | null): string {
  if (n === undefined || n === null) return '-'
  return n.toLocaleString()
}

const isDiamond = computed(() => (mtt.value?.gold_type ?? 1) === 4)
const currencyIcon = computed(() => (isDiamond.value ? diamondIcon : chipsIcon))

function fmtMoney(n: number | undefined | null): string {
  if (n === undefined || n === null) return '-'
  const val = isDiamond.value ? n : n / 100
  return val.toLocaleString()
}

function resolveName(rawName: string | undefined | null): string {
  if (!rawName) return '-'
  return resolveTemplateTextByKey(rawName, getLocale()) || t(rawName) || rawName
}

function calcBB(chip: number | undefined | null, sb: number | undefined | null): string {
  if (!chip || !sb) return '(-BB)'
  return `(${(chip / (sb * 2)).toFixed(0)}BB)`
}

function fmtBlinds(sb: number | undefined, ante: number | undefined): string {
  if (!sb) return '-'
  const base = `${fmtMoney(sb)}/${fmtMoney(sb * 2)}`
  return ante ? `${base} (${fmtMoney(ante)})` : base
}

/* ===== 状态卡片 ===== */
const statusLabel = computed(() => {
  const s = mtt.value?.status
  if (s === 0) return t('MTT-Applying')
  if (s === 1) return t('MTT-Processing')
  if (s === 2) return t('Mtt_Complete')
  return '-'
})

const startTimeLabel = computed(() => formatDateTime(mtt.value?.start_time, 'HH:mm'))
// 状态卡片带日/月；中列大倒计时宽度有限仍用 HH:mm
const startTimeCardLabel = computed(() => formatDateTime(mtt.value?.start_time, 'DD/MM HH:mm'))

const buyInTotal = computed(() => {
  const pool = mtt.value?.apply_fee_pool ?? 0
  const svc = mtt.value?.apply_fee_service ?? 0
  const hunter = mtt.value?.apply_fee_hunter ?? 0
  return pool + svc + hunter
})

/* ===== 数据统计面板 — 左列 ===== */
const prizePool = computed(() => fmtMoney(more.value?.prize_pool ?? realPrize.value?.award))
const championPrize = computed(() => fmtMoney(realPrize.value?.prizes?.[0]?.award))
const unbrokenGuarantee = computed(() => fmtMoney(mtt.value?.prize_base_pool))
const nextPrize = computed(() => fmtMoney(realPrize.value?.prizes?.[1]?.award))

/* ===== 数据统计面板 — 中列 ===== */
const currentLevel = computed(() => more.value?.bl ?? 0)
const isPreStart = computed(() => (mtt.value?.status ?? -1) === 0)

const centerTimerSeconds = computed(() => {
  void timerTick.value
  if (isPreStart.value) {
    const startTimeSec = toUnixSeconds(mtt.value?.start_time)
    if (!startTimeSec) return 0
    const remaining = startTimeSec - Math.floor(Date.now() / 1000)
    return remaining > 0 ? remaining : 0
  }
  const interval = mtt.value?.upblind_interval ?? 0
  const nu = more.value?.nu ?? 0
  if (!nu) return interval
  const nowSec = Math.floor(Date.now() / 1000)
  let remaining = interval - (nowSec - nu)
  if (remaining > interval) remaining = remaining % interval || interval
  if (remaining <= 0) return interval
  return remaining
})

function fmtMMSS(totalSeconds: number, maxSeconds = 99 * 60 + 59): string {
  const capped = Math.min(Math.max(0, Math.floor(totalSeconds)), maxSeconds)
  const m = Math.floor(capped / 60)
  const s = capped % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const levelTimeLeftLabel = computed(() => {
  const sec = centerTimerSeconds.value
  // 开赛前超过1小时：直接显示开赛时刻（HH:mm）
  if (isPreStart.value && sec > 3600) return startTimeLabel.value
  // 开赛前1小时内：倒计时，最大 59:59
  if (isPreStart.value) return fmtMMSS(sec, 59 * 60 + 59)
  // 盲注级别倒计时：最大 99:59
  return fmtMMSS(sec)
})
const blindsLabel = computed(() => fmtBlinds(more.value?.sb, more.value?.ante))
const nextBlindsLabel = computed(() => fmtBlinds(more.value?.nsb, more.value?.nante))

/* ===== 数据统计面板 — 右列 ===== */
const remainingPlayers = computed(() => {
  const alive = props.data?.alive
  const total = props.data?.enter_total
  if (alive === undefined || alive === null) return '-'
  return `${alive}/${total ?? '-'}`
})

const rebuyCount = computed(() => {
  const buyin = mtt.value?.total_buyin_times
  const rebuy = mtt.value?.total_rebuy_times
  return `${buyin ?? '-'}/${rebuy ?? '-'}`
})

const moneyBubble = computed(() => fmtNum(realPrize.value?.award_num))
const myRank = computed(() => '-')

/* ===== 筹码统计 ===== */
const sb = computed(() => more.value?.sb)
const highestChips = computed(() => more.value?.max_chip ?? 0)
const highestChipsBB = computed(() => calcBB(highestChips.value, sb.value))
const avgChips = computed(() => more.value?.avg_chip ?? 0)
const avgChipsBB = computed(() => calcBB(avgChips.value, sb.value))
const lowestChips = computed(() => more.value?.min_chip ?? 0)
const lowestChipsBB = computed(() => calcBB(lowestChips.value, sb.value))
const initialChips = computed(() => mtt.value?.initial_score ?? 0)
const initialChipsBB = computed(() => calcBB(initialChips.value, sb.value))

/* ===== 赛事信息列表 ===== */
const GAME_TYPE_NAMES = ['NLH', 'PLO4', 'PLO5', 'PLO6']
const SIX_PLUS_GAME_TYPE_NAMES = ['NLH 6+', 'PLO4 6+', 'PLO5 6+', 'PLO6 6+']

const gameTypeName = computed(() => {
  const gt = mtt.value?.game_type ?? 0
  return (mtt.value?.poker_type === 2 ? SIX_PLUS_GAME_TYPE_NAMES : GAME_TYPE_NAMES)[gt] ?? '-'
})

const buyInLabel = computed(() => {
  const pool = mtt.value?.apply_fee_pool ?? 0
  const svc = mtt.value?.apply_fee_service ?? 0
  const hunter = mtt.value?.apply_fee_hunter ?? 0
  return (mtt.value?.hunter_on ?? 0) > 0
    ? `${fmtMoney(pool)}+${fmtMoney(svc)}+${fmtMoney(hunter)}`
    : `${fmtMoney(pool)}+${fmtMoney(svc)}`
})

const matchInfo = computed(() => {
  const m = mtt.value
  if (!m) return []
  const interval = m.upblind_interval ?? 0
  const initialBB = sb.value
    ? `${fmtMoney(m.initial_score)} (${((m.initial_score ?? 0) / (sb.value * 2)).toFixed(0)}BB)`
    : fmtMoney(m.initial_score)
  const enterTimeLabel = m.enter_time
    ? `${formatDateTime(m.enter_time, 'DD/MM HH:mm')} (${t('UITexasReport_Text_BlindLevelTip')}${m.max_delay_apply_bl ?? '-'})`
    : '-'
  const holdTimeLabel = m.force_close_time
    ? `${Math.ceil(m.force_close_time / 60)}${t('UIClubData_Text_time')}`
    : '-'

  let buyLimitLabel: string
  const bl = more.value?.bl ?? 0
  const maxDelayBl = m.max_delay_apply_bl ?? 0
  if (maxDelayBl > bl) {
    const limitStr =
      (m.limit_total_buy_times ?? 0) >= 1000
        ? t('UIMTT_wuxianzhi')
        : fmtNum(m.limit_total_buy_times)
    buyLimitLabel = t('MTT_State_DelayDetailNoAddOn', limitStr, String(maxDelayBl))
  } else {
    buyLimitLabel = t('MTT_State_CannotDelay')
  }

  const limitBetType = m.limit_bet_type ?? 0
  const betTypeLabel = t(`BetType_${limitBetType}`)

  return [
    { label: t('UIMatchName'), value: resolveName(m.name) },
    { label: t('MTT_State_gametype'), value: betTypeLabel },
    {
      label: t('UI_GameType'),
      value: gameTypeName.value,
      icon: (m.hunter_on ?? 0) > 0 ? hunterIcon : undefined,
    },
    {
      label: t('UIMTT_ListdistancestartText'),
      value: formatDateTime(m.start_time, 'DD/MM/YYYY-HH:mm'),
    },
    { label: t('MTT_xq_buy'), value: buyInLabel.value },
    { label: t('MTT_State_ShangXian'), value: buyLimitLabel, tip: true },
    { label: t('MTT_Rebuy'), value: fmtNum(m.rebuy_times) },
    { label: t('UIMatchGuaranteedPool'), value: fmtMoney(m.prize_base_pool) },
    { label: t('UIMTT_chouma1'), value: initialBB },
    { label: t('MTT_State_DelayApply'), value: enterTimeLabel },
    { label: t('UIMatchEstimatedDuration'), value: holdTimeLabel },
    {
      label: t('UIMatchBlindInterval'),
      value: interval > 0 ? `${Math.floor(interval / 60)}${t('UIClubData_Text_time')}` : '-',
    },
    {
      label: t('UITexas_TableType'),
      value: m.seat_count ? t('UIMatch_PersonTable', m.seat_count) : '-',
    },
    {
      label: t('UIMatchMinMaxPlayers'),
      value: `${m.limit_min ?? '-'}~${realPrize.value?.participants ?? '-'}`,
    },
    { label: t('UIMatchStartCondition'), value: '-' },
    {
      label: t('UIMatchBreakTime'),
      value:
        m.break_interval && m.break_duration
          ? `${t('BlindUpTimes', { num: m.break_interval })}，${t('UIMatchBreakTime')}${t('UITexasReport_Text_MatchZmsysj', String(m.break_duration))}`
          : '-',
    },
  ]
})
</script>

<template>
  <div class="mtt-status-tab">
    <!-- 介绍图 banner -->
    <div v-if="mtt?.game_icon" class="game-banner">
      <img :src="mtt.game_icon" class="game-banner__img" alt="" />
    </div>

    <!-- 状态卡片 -->
    <div class="status-card">
      <div class="status-badge">{{ statusLabel }}</div>
      <div class="status-meta">
        <div class="meta-row">
          <span class="meta-label">{{ t('MTT-Start Time') }}</span>
          <span class="meta-value">{{ startTimeCardLabel }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">{{ t('MTT_xq_buy') }}:</span>
          <div class="meta-value-with-icon">
            <img :src="currencyIcon" class="meta-icon" alt="coin" />
            <span>{{ fmtMoney(buyInTotal) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据统计面板 -->
    <div class="stats-panel">
      <div class="stats-grid">
        <!-- 左列 -->
        <div class="stats-col stats-col--left">
          <div class="stat-item">
            <div class="stat-label">{{ t('UIMTT_zongjiangjin') }}</div>
            <div class="stat-value">{{ prizePool }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{{ t('UIMatchChampion') }}</div>
            <div class="stat-value">{{ championPrize }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{{ t('UIMTT_weipobao') }}</div>
            <div class="stat-value">{{ unbrokenGuarantee }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{{ t('UIMatchNextLevelPrize') }}</div>
            <div class="stat-value">{{ nextPrize }}</div>
          </div>
        </div>
        <div class="stats-col-divider"></div>

        <!-- 中列 -->
        <div class="stats-col--center">
          <div class="level-card">
            <div class="level-label">{{ isPreStart ? '距离开始' : `级别 ${currentLevel}` }}</div>
            <div class="level-timer">{{ levelTimeLeftLabel }}</div>
            <div v-if="!isPreStart" class="level-break">{{ t('UIMatchNextBreak') }} -</div>
          </div>
          <div class="blind-info">
            <div class="blind-row">
              <div class="blind-label">{{ t('adaptation20006') }}</div>
              <div class="blind-value">{{ blindsLabel }}</div>
            </div>
            <div class="blind-row">
              <div class="blind-label">{{ t('UIMTT_xiayijibie') }}</div>
              <div class="blind-value">{{ nextBlindsLabel }}</div>
            </div>
          </div>
        </div>
        <div class="stats-col-divider"></div>

        <!-- 右列 -->
        <div class="stats-col stats-col--right">
          <div class="stat-item">
            <div class="stat-label">{{ t('UIMTT_shengyuwanjia') }}</div>
            <div class="stat-value">{{ remainingPlayers }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{{ t('UIMTT_maichong') }}</div>
            <div class="stat-value">{{ rebuyCount }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{{ t('UIMTT_qianquanmingci') }}</div>
            <div class="stat-value">{{ moneyBubble }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{{ t('UITexasReportMTT_MyRank_Tip') }}</div>
            <div class="stat-value">{{ myRank }}</div>
          </div>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="stats-divider"></div>

      <!-- 筹码统计 -->
      <div class="chips-row">
        <div class="chip-item">
          <div class="chip-label">{{ t('UIMTT_chouma5') }}</div>
          <div class="chip-value">{{ fmtMoney(highestChips) }}</div>
          <div class="chip-bb">{{ highestChipsBB }}</div>
        </div>
        <div class="chip-item">
          <div class="chip-label">{{ t('UIMTT_chouma2') }}</div>
          <div class="chip-value">{{ fmtMoney(avgChips) }}</div>
          <div class="chip-bb">{{ avgChipsBB }}</div>
        </div>
        <div class="chip-item">
          <div class="chip-label">{{ t('UIMTT_chouma3') }}</div>
          <div class="chip-value">{{ fmtMoney(lowestChips) }}</div>
          <div class="chip-bb">{{ lowestChipsBB }}</div>
        </div>
        <div class="chip-item">
          <div class="chip-label">{{ t('UIMTT_chouma1') }}</div>
          <div class="chip-value">{{ fmtMoney(initialChips) }}</div>
          <div class="chip-bb">{{ initialChipsBB }}</div>
        </div>
      </div>
    </div>
    <div class="event-desc">
      <p>{{ t('eventDesc') }}</p>
      <div>{{ mtt?.activity_detail }}</div>
    </div>

    <!-- 赛事信息 -->
    <div class="info-section">
      <div v-for="(item, index) in matchInfo" :key="index" class="info-row">
        <div class="info-label">
          {{ item.label }}
          <VanIcon v-if="item.tip" name="question-o" class="info-tip" />
        </div>
        <div class="info-value">
          <img v-if="item.icon" :src="item.icon" class="info-icon" alt="icon" />
          <span>{{ item.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.mtt-status-tab {
  display: flex;
  flex-direction: column;
}

/* ===== 介绍图 banner ===== */
.game-banner {
  width: 100%;
  max-height: 4.8rem;
  border-radius: 0.46rem;
  overflow: hidden;
  margin-bottom: 0.2rem;
}

.game-banner__img {
  width: 100%;
  display: block;
  object-fit: contain;
}

/* ===== 状态卡片 ===== */
.status-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.22rem 0.27rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.66rem;
  box-shadow: 0 -0.21rem 0.54rem rgba(78, 135, 97, 0.54) inset;
  margin-bottom: 0.2rem;

  @include theme-light {
    background: #fff;
    box-shadow: 0 -0.21rem 0.54rem rgba(var(--c-brand-rgb), 0.3) inset;
  }
}

.status-badge {
  width: 2.05rem;
  height: 1.68rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(65, 137, 80, 1);
  border-radius: 0.43rem;
  font-size: 0.36rem;
  font-weight: 600;
  color: #fff;
  box-shadow: 0.03rem 0.04rem 0.07rem rgba(0, 0, 0, 0.18);
  flex-shrink: 0;

  @include theme-light {
    background: var(--c-brand);
  }
}

.status-meta {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.39rem;
  font-family: 'HONOR Sans CN', sans-serif;
}

.meta-label {
  color: #fff;
  font-weight: 400;

  @include theme-light {
    color: #000;
  }
}

.meta-value {
  color: #fff;
  font-weight: 400;

  @include theme-light {
    color: #000;
  }
}

.meta-value-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  color: #fff;

  @include theme-light {
    color: #000;
  }
}

.meta-icon {
  width: 0.42rem;
  height: 0.42rem;
  object-fit: contain;
}

/* ===== 数据统计面板 ===== */
.stats-panel {
  background: linear-gradient(
    98.37deg,
    rgba(255, 255, 255, 0.1) 21.1%,
    rgba(230, 230, 230, 0.1) 71.4%
  );
  backdrop-filter: blur(2px);
  border-radius: 0.77rem;
  padding: 0.37rem 0.45rem;
  margin-bottom: 0.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.stats-grid {
  display: flex;
  align-items: stretch;
  min-height: 5.22rem;
}

.stats-col {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-shrink: 0;
  width: 1.93rem;
}

.stats-col--left {
  text-align: left;
}

.stats-col--right {
  text-align: right;
}

.stats-col--center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0.24rem;
}

.stats-col-divider {
  width: 1px;
  flex-shrink: 0;
  align-self: stretch;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 0.08rem;
}

.stat-label {
  font-size: 0.28rem;
  color: #fcfcfc;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;

  @include theme-light {
    color: #000;
  }
}

.stat-value {
  font-size: 0.39rem;
  color: #fff;
  font-weight: 600;
  font-family: 'HONOR Sans CN', sans-serif;

  @include theme-light {
    color: #000;
  }
}

/* 级别卡片 */
.level-card {
  width: 100%;
  height: 2.72rem;
  background: linear-gradient(
    99.49deg,
    rgba(255, 255, 255, 0.1) 21.1%,
    rgba(230, 230, 230, 0.1) 71.4%
  );
  border-radius: 0.77rem;
  padding: 0.08rem 0.15rem 0.19rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.19rem;
}

.level-label {
  font-size: 0.28rem;
  color: #fcfcfc;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;

  @include theme-light {
    color: #000;
  }
}

.level-timer {
  font-size: 1.1rem;
  color: #fff;
  font-weight: 400;
  font-family: 'Keania One';
  line-height: 1.1;
}

.level-break {
  font-size: 0.25rem;
  color: #fcfcfc;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;

  @include theme-light {
    color: rgba(0, 0, 0, 0.7);
  }
}

/* 盲注信息 */
.blind-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-between;
}

.blind-row {
  text-align: center;
}

.blind-label {
  font-size: 0.28rem;
  color: #fcfcfc;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;

  @include theme-light {
    color: #000;
  }
}

.blind-value {
  font-size: 0.39rem;
  color: #fff;
  font-weight: 600;
  font-family: 'HONOR Sans CN', sans-serif;

  @include theme-light {
    color: #000;
  }
}

/* 分隔线 */
.stats-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  opacity: 0.5;
}

/* 筹码统计 */
.chips-row {
  display: flex;
  justify-content: space-between;
}

.chip-item {
  flex: 1;
  text-align: center;
}

.chip-label {
  font-size: 0.28rem;
  color: #fcfcfc;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;

  @include theme-light {
    color: #000;
  }
}

.chip-value {
  font-size: 0.39rem;
  color: #fefefe;
  font-weight: 600;
  height: 0.4rem;
  line-height: 0.4rem;
  font-family: 'HONOR Sans CN', sans-serif;

  @include theme-light {
    color: #000;
  }
}

.chip-bb {
  font-size: 0.24rem;
  color: #b6b6b6;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;

  @include theme-light {
    color: #696969;
  }
}
.event-desc {
  p {
    color: #fff;
    font-family: 'HONOR Sans CN';
    font-size: 0.38008rem;
    font-style: normal;
    font-weight: 600;
    line-height: 140%; /* 0.53211rem */
    margin: 0 0.5rem;

    @include theme-light {
      color: #000;
    }
  }
  div {
    display: flex;
    height: 1.98624rem;
    padding: 0.2rem 0.45rem 0.25rem;
    flex-direction: column;
    gap: 0.39552rem;
    align-self: stretch;
    border-radius: 0.51592rem;
    background: rgba(0, 0, 0, 0.2);
    margin: 0.1rem 0 0.4rem;
    color: rgba(255, 255, 255, 0.7);

    @include theme-light {
      background: #fff;
      color: rgba(0, 0, 0, 0.7);
    }
  }
}

/* ===== 赛事信息 ===== */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.1rem 0.45rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.77rem;
  min-height: 0.72rem;

  @include theme-light {
    background: #fff;
  }
}

.info-label {
  font-size: 0.33rem;
  color: #ebebeb;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;

  @include theme-light {
    color: #000;
  }
}

.info-tip {
  font-size: 0.3rem;
  color: #ebebeb;
  opacity: 0.7;

  @include theme-light {
    color: #000;
  }
}

.info-value {
  font-size: 0.33rem;
  color: #fff;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;

  @include theme-light {
    color: #000;
  }
}

.info-icon {
  width: 0.38rem;
  height: 0.38rem;
  object-fit: contain;
}
</style>
