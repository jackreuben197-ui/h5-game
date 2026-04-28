<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import hunterIcon from '@/assets/icons/icon_mtt_hunter.png'
import type { RoomcenterMttDetailData } from '@/api/models/roomcenter'
import { formatDateTime, formatDurationBySeconds, toUnixSeconds } from '@/utils/time'
import { getLocale, t } from '@/i18n'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'

const props = defineProps<{
  data: RoomcenterMttDetailData | null
}>()

/* ===== 倒计时 tick ===== */
const timerTick = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null
onMounted(() => { timerInterval = setInterval(() => { timerTick.value++ }, 1000) })
onUnmounted(() => { if (timerInterval) clearInterval(timerInterval) })

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
  if (s === 0) return '报名中'
  if (s === 1) return '进行中'
  if (s === 2) return '已结束'
  return '-'
})

const startTimeLabel = computed(() => formatDateTime(mtt.value?.start_time, 'HH:mm'))

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

const levelTimeLeftLabel = computed(() => formatDurationBySeconds(centerTimerSeconds.value))
const blindsLabel = computed(() => fmtBlinds(more.value?.sb, more.value?.ante))
const nextBlindsLabel = computed(() => fmtBlinds(more.value?.nsb, more.value?.nante))

/* ===== 数据统计面板 — 右列 ===== */
const remainingPlayers = computed(() => {
  const alive = props.data?.alive
  const total = realPrize.value?.participants
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
    ? `${formatDateTime(m.enter_time, 'DD/MM HH:mm')} (级别${m.max_delay_apply_bl ?? '-'})`
    : '-'
  const holdTimeLabel = m.force_close_time
    ? `${Math.ceil(m.force_close_time / 60)}分钟`
    : '-'

  let buyLimitLabel: string
  const bl = more.value?.bl ?? 0
  const maxDelayBl = m.max_delay_apply_bl ?? 0
  if (maxDelayBl > bl) {
    const limitStr = (m.limit_total_buy_times ?? 0) >= 1000
      ? t('UIMTT_wuxianzhi')
      : fmtNum(m.limit_total_buy_times)
    buyLimitLabel = t('MTT_State_DelayDetailNoAddOn', limitStr, String(maxDelayBl))
  } else {
    buyLimitLabel = t('MTT_State_CannotDelay')
  }

  return [
    { label: '赛事名称', value: resolveName(m.name) },
    { label: '比赛类型', value: '无限注德州扑克' },
    { label: '游戏类型', value: gameTypeName.value, icon: (m.hunter_on ?? 0) > 0 ? hunterIcon : undefined },
    { label: '开始时间', value: formatDateTime(m.start_time, 'DD/MM/YYYY-HH:mm') },
    { label: '买入', value: buyInLabel.value },
    { label: t('MTT_State_ShangXian'), value: buyLimitLabel, tip: true },
    { label: '重购', value: fmtNum(m.rebuy_times) },
    { label: '保底奖池', value: fmtMoney(m.prize_base_pool) },
    { label: '起始筹码', value: initialBB },
    { label: '延迟报名', value: enterTimeLabel },
    { label: '预计赛程时长', value: holdTimeLabel },
    { label: '盲注间距', value: interval > 0 ? `${Math.floor(interval / 60)}分钟` : '-' },
    { label: '牌桌类型', value: m.seat_count ? `${m.seat_count}人桌` : '-' },
    { label: '最少/最多玩家', value: `${m.limit_min ?? '-'}~${realPrize.value?.participants ?? '-'}` },
    { label: '开赛条件', value: '-' },
    { label: '休息时间', value: '-' },
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
          <span class="meta-label">开赛时间:</span>
          <span class="meta-value">{{ startTimeLabel }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">买入:</span>
          <div class="meta-value-with-icon">
            <img :src="hunterIcon" class="meta-icon" alt="coin" />
            <span>{{ fmtMoney(buyInTotal) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据统计面板 -->
    <div class="stats-panel">
      <div class="stats-grid">
        <!-- 左列 -->
        <div class="stats-col">
          <div class="stat-item">
            <div class="stat-label">总奖金</div>
            <div class="stat-value">{{ prizePool }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">冠军</div>
            <div class="stat-value">{{ championPrize }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">未破保金额</div>
            <div class="stat-value">{{ unbrokenGuarantee }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">下一级奖金</div>
            <div class="stat-value">{{ nextPrize }}</div>
          </div>
        </div>

        <!-- 中列 -->
        <div class="stats-col stats-col--center">
          <div class="level-card">
            <div class="level-label">{{ isPreStart ? '距离开始' : `级别 ${currentLevel}` }}</div>
            <div class="level-timer">{{ levelTimeLeftLabel }}</div>
            <div v-if="!isPreStart" class="level-break">下一次休息 -</div>
          </div>
          <div class="blind-info">
            <div class="blind-row">
              <div class="blind-label">盲注</div>
              <div class="blind-value">{{ blindsLabel }}</div>
            </div>
            <div class="blind-row">
              <div class="blind-label">下-级</div>
              <div class="blind-value">{{ nextBlindsLabel }}</div>
            </div>
          </div>
        </div>

        <!-- 右列 -->
        <div class="stats-col">
          <div class="stat-item">
            <div class="stat-label">剩余玩家</div>
            <div class="stat-value">{{ remainingPlayers }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">买入/重购</div>
            <div class="stat-value">{{ rebuyCount }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">钱圈名额</div>
            <div class="stat-value">{{ moneyBubble }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">我的排名</div>
            <div class="stat-value">{{ myRank }}</div>
          </div>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="stats-divider">
      </div>

      <!-- 筹码统计 -->
      <div class="chips-row">
        <div class="chip-item">
          <div class="chip-label">最高筹码</div>
          <div class="chip-value">{{ fmtMoney(highestChips) }}</div>
          <div class="chip-bb">{{ highestChipsBB }}</div>
        </div>
        <div class="chip-item">
          <div class="chip-label">平均筹码</div>
          <div class="chip-value">{{ fmtMoney(avgChips) }}</div>
          <div class="chip-bb">{{ avgChipsBB }}</div>
        </div>
        <div class="chip-item">
          <div class="chip-label">最低筹码</div>
          <div class="chip-value">{{ fmtMoney(lowestChips) }}</div>
          <div class="chip-bb">{{ lowestChipsBB }}</div>
        </div>
        <div class="chip-item">
          <div class="chip-label">初始筹码</div>
          <div class="chip-value">{{ fmtMoney(initialChips) }}</div>
          <div class="chip-bb">{{ initialChipsBB }}</div>
        </div>
      </div>
    </div>

    <!-- 赛事信息 -->
    <div class="info-section">
      <div v-for="(item, index) in matchInfo" :key="index" class="info-row">
        <div class="info-label">
          {{ item.label }}
          <VanIcon v-if="item.tip" name="question-o" class="info-tip" />
        </div>
        <div class="info-value">
          <img
            v-if="item.icon"
            :src="item.icon"
            class="info-icon"
            alt="icon"
          />
          <span>{{ item.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mtt-status-tab {
  display: flex;
  flex-direction: column;
}

/* ===== 介绍图 banner ===== */
.game-banner {
  width: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-bottom: 0.3rem;
}

.game-banner__img {
  width: 100%;
  display: block;
  object-fit: cover;
}

/* ===== 状态卡片 ===== */
.status-card {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.22rem 0.27rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.66rem;
  box-shadow: 0 -0.21rem 0.54rem rgba(10, 184, 247, 0.54) inset;
  margin-bottom: 0.3rem;
}

.status-badge {
  width: 2.05rem;
  height: 1.68rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0ab8f7;
  border-radius: 0.43rem;
  font-size: 0.36rem;
  font-weight: 600;
  color: #fff;
  box-shadow: 0.03rem 0.04rem 0.07rem rgba(0, 0, 0, 0.18);
  flex-shrink: 0;
}

.status-meta {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
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
}

.meta-value {
  color: #fff;
  font-weight: 400;
}

.meta-value-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  color: #fff;
}

.meta-icon {
  width: 0.5rem;
  height: 0.5rem;
  object-fit: contain;
}

/* ===== 数据统计面板 ===== */
.stats-panel {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.77rem;
  padding: 0.37rem 0.45rem;
  margin-bottom: 0.3rem;
}

.stats-grid {
  display: flex;
  justify-content: space-between;
  gap: 0.3rem;
}

.stats-col {
  display: flex;
  flex-direction: column;
  gap: 0.48rem;
  flex: 1;
}

.stats-col--center {
  flex: 1.4;
  align-items: center;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.28rem;
  color: #fcfcfc;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  margin-bottom: 0.12rem;
}

.stat-value {
  font-size: 0.39rem;
  color: #fff;
  font-weight: 600;
  font-family: 'HONOR Sans CN', sans-serif;
}

/* 级别卡片 */
.level-card {
  width: 100%;
  background: linear-gradient(158deg, rgba(255, 255, 255, 0.1) 0%, rgba(230, 230, 230, 0.1) 100%);
  border-radius: 0.77rem;
  padding: 0.2rem 0.15rem 0.15rem;
  text-align: center;
  margin-bottom: 0.2rem;
}

.level-label {
  font-size: 0.28rem;
  color: #fcfcfc;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
}

.level-timer {
  font-size: 1.1rem;
  color: #fff;
  font-weight: 400;
  font-family: 'Keania One', 'HONOR Sans CN', sans-serif;
  line-height: 1.2;
  margin: 0.1rem 0;
}

.level-break {
  font-size: 0.25rem;
  color: #fcfcfc;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
}

/* 盲注信息 */
.blind-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.blind-row {
  text-align: center;
}

.blind-label {
  font-size: 0.28rem;
  color: #fcfcfc;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  margin-bottom: 0.12rem;
}

.blind-value {
  font-size: 0.39rem;
  color: #fff;
  font-weight: 600;
  font-family: 'HONOR Sans CN', sans-serif;
}

/* 分隔线 */
.stats-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.3rem 0;
  position: relative;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
  }
}

.divider-icon {
  width: 0.5rem;
  height: 0.5rem;
  margin: 0 0.2rem;
  object-fit: contain;
}

/* 筹码统计 */
.chips-row {
  display: flex;
  justify-content: space-between;
  gap: 0.2rem;
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
  margin-bottom: 0.12rem;
}

.chip-value {
  font-size: 0.39rem;
  color: #fefefe;
  font-weight: 600;
  font-family: 'HONOR Sans CN', sans-serif;
}

.chip-bb {
  font-size: 0.24rem;
  color: #b6b6b6;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  margin-top: 0.08rem;
}

/* ===== 赛事信息 ===== */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.18rem 0.45rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.77rem;
  min-height: 0.72rem;
}

.info-label {
  font-size: 0.33rem;
  color: #ebebeb;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
}

.info-tip {
  font-size: 0.3rem;
  color: #ebebeb;
  opacity: 0.7;
}

.info-value {
  font-size: 0.33rem;
  color: #fff;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
}

.info-icon {
  width: 0.38rem;
  height: 0.38rem;
  object-fit: contain;
}
</style>
