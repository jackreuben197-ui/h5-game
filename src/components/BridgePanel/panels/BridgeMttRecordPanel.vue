<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import { GameTable, GameTableColumn } from '@/components/Table'
import defaultAvatar from '@/assets/icons/icon_mtt_avatar.png'
import chipIcon from '@/assets/icons/icon_chips.png'
import arrowIcon from '@/assets/icons/wallet/ic_arrow_left.svg'
import { getLocale, t } from '@/i18n'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'
import { formatDateTime, toUnixSeconds } from '@/utils/time'
import { getMttBlindLevels } from '@/views/mtt/constants/mttBlindTable'
import {
  getRoomcenterMttDetailApi,
  postRoomcenterMttRanksApi,
  postRoomcenterMttHunterRanksApi,
  postRoomcenterMttRealPrizeApi,
  postRoomcenterMttRoomsApi,
} from '@/api/roomcenter'
import type {
  RoomcenterMttDetailData,
  RoomcenterMttRanksData,
  RoomcenterMttHunterRanksData,
  RoomcenterMttRealPrize,
  RoomcenterMttRoomRecord,
  RoomcenterMttBlindLevelDelay,
  RoomcenterMttPrize,
} from '@/api/models/roomcenter'

const props = defineProps<{
  panelProps?: Record<string, unknown>
  emitPanelEvent: (event: string, payload?: unknown) => void
  closePanel: (reason?: string, payload?: unknown) => void
}>()

// ── matchId ──────────────────────────────────────────────────────────────────
const matchId = computed(() => {
  const v = props.panelProps?.matchId ?? props.panelProps?.match_id
  return v != null ? Number(v) : 0
})

// ── remote data ──────────────────────────────────────────────────────────────
const gameStore = useGameStore()
const detailData = ref<RoomcenterMttDetailData | null>(null)
const rankData = ref<RoomcenterMttRanksData | null>(null)
const hunterData = ref<RoomcenterMttHunterRanksData | null>(null)
const rewardData = ref<RoomcenterMttRealPrize | null>(null)
const roomList = ref<RoomcenterMttRoomRecord[]>([])

const playersLoading = ref(false)
const tablesLoading = ref(false)
const rewardsLoading = ref(false)
const playerRequestCode = ref<number | null>(null)

// ── tabs ─────────────────────────────────────────────────────────────────────
type TableTab = 'players' | 'tables' | 'rewards' | 'blinds'
type PlayerMode = 'rank' | 'hunter'

const activeTab = ref<TableTab>('players')
const playerMode = ref<PlayerMode>('rank')
const loadedTabs = ref(new Set<TableTab>(['players']))

// ── countdown timer ───────────────────────────────────────────────────────────
const timerTick = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

// ── pagination (players, 20/page — mirrors Unity _ranksLimit = 20) ─────────
const PAGE_SIZE = 20
const playersPage = ref(1)

// ── data shortcuts ────────────────────────────────────────────────────────────
const mtt = computed(() => detailData.value?.mtt)
const more = computed(() => detailData.value?.more)
const realPrize = computed(() => detailData.value?.real_prize)
const isDiamond = computed(() => (mtt.value?.gold_type ?? 1) === 4)

// ── shared helpers ────────────────────────────────────────────────────────────
function fmtNum(n: number | undefined | null): string {
  if (n === undefined || n === null) return '-'
  return n.toLocaleString()
}

function fmtMoney(n: number | undefined | null): string {
  if (n === undefined || n === null) return '-'
  const val = isDiamond.value ? n : n / 100
  return val.toString()
}

function fmtBlinds(sbVal: number | undefined, ante: number | undefined): string {
  if (!sbVal) return '-'
  const base = `${fmtMoney(sbVal)}/${fmtMoney(sbVal * 2)}`
  //   return ante ? `${base} (${fmtMoney(ante)})` : base
  return ante ? `${base}` : base
}

function resolveName(rawName: string | undefined | null): string {
  if (!rawName) return '-'
  return resolveTemplateTextByKey(rawName, getLocale()) || t(rawName) || rawName
}

function fmtMMSS(totalSeconds: number, maxSeconds = 99 * 60 + 59): string {
  const capped = Math.min(Math.max(0, Math.floor(totalSeconds)), maxSeconds)
  const m = Math.floor(capped / 60)
  const s = capped % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── tournament name ───────────────────────────────────────────────────────────
const tournamentName = computed(() => {
  const rawName = mtt.value?.name
  if (rawName) return resolveName(rawName)
  const fallback = props.panelProps?.tournamentName ?? props.panelProps?.tournament_name
  return typeof fallback === 'string' ? fallback : ''
})

// ── stats panel (mirrors MttStatusTab stats-panel section) ───────────────────
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

const levelTimeLeftLabel = computed(() => {
  const sec = centerTimerSeconds.value
  if (isPreStart.value && sec > 3600) return formatDateTime(mtt.value?.start_time, 'HH:mm')
  if (isPreStart.value) return fmtMMSS(sec, 59 * 60 + 59)
  return fmtMMSS(sec)
})

// const currentLevel = computed(() => more.value?.bl ?? 0)
const blindsLabel = computed(() => fmtBlinds(more.value?.sb, more.value?.ante))
const nextBlindsLabel = computed(() => fmtBlinds(more.value?.nsb, more.value?.nante))

// overview stats
const prizePool = computed(() => fmtMoney(more.value?.prize_pool ?? realPrize.value?.award))
const myRank = computed(() => {
  const myUrid = Number(gameStore.loginUserId)
  if (!myUrid) return '-'
  const record = rankData.value?.records?.find((r) => Number(r.urid) === myUrid)
  if (!record?.rank) return '-'
  return String(record.rank)
})
const sbVal = computed(() => more.value?.sb)
const highestChips = computed(() => more.value?.max_chip ?? 0)
const avgChips = computed(() => more.value?.avg_chip ?? 0)
const lowestChips = computed(() => more.value?.min_chip ?? 0)

// 在桌/买入
const aliveAndBuy = computed(() => {
  const alive = detailData.value?.alive
  const total = mtt.value?.total_buy_times
  if (alive === undefined && total === undefined) return '-'
  return `${alive ?? '-'}/${total ?? '-'}`
})

// 下一注时长
const nextBlindDurationLabel = computed(() => {
  const interval = mtt.value?.upblind_interval ?? 0
  if (!interval) return '-'
  const minutes = Math.floor(interval / 60)
  const text = t('UITexasReport_Text_MatchNextBlindTime', minutes)
  return text === 'UITexasReport_Text_MatchNextBlindTime' ? `${minutes}min` : text
})

// 比赛已进行（自开赛起经过的时间）
function fmtHHMMSS(s: number): string {
  const total = Math.max(0, Math.floor(s))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(
    2,
    '0',
  )}`
}

const elapsedSeconds = computed(() => {
  void timerTick.value
  if (!mtt.value?.start_time) return 0
  const startSec = toUnixSeconds(mtt.value.start_time)
  if (!startSec) return 0
  const elapsed = Math.floor(Date.now() / 1000) - startSec
  return elapsed > 0 ? elapsed : 0
})

const elapsedLabel = computed(() => fmtHHMMSS(elapsedSeconds.value))

// ── players tab ───────────────────────────────────────────────────────────────
const showHunterMode = computed(() => (mtt.value?.hunter_on ?? 0) === 1)
const showPlayerNullTips = computed(
  () => playerRequestCode.value === 10001 && !playersLoading.value,
)

interface PlayerRow {
  rank: string
  name: string
  avatar: string
  tableNo: string
  chips: string
  hunter: string
  rid: number
}

const currentRankSb = computed(() =>
  playerMode.value === 'hunter'
    ? Number(hunterData.value?.sb ?? 0)
    : Number(rankData.value?.sb ?? 0),
)

const allPlayers = computed<PlayerRow[]>(() => {
  if (playerMode.value === 'hunter') {
    return (hunterData.value?.records ?? []).map((item) => ({
      rank: item.rank ? String(item.rank) : '-',
      name: item.name ?? '-',
      avatar: defaultAvatar,
      tableNo: '--',
      chips: '--',
      hunter: fmtNum(item.award),
      rid: Number(item.rid ?? 0),
    }))
  }
  const sb = currentRankSb.value
  return (rankData.value?.records ?? []).map((item) => {
    const chip = Number(item.chip ?? 0)
    const rawAvatar = (item as Record<string, unknown>).avatar
    const rid = Number(item.rid ?? 0)
    return {
      rank: item.rank ? String(item.rank) : '-',
      name: item.name ?? '-',
      avatar: typeof rawAvatar === 'string' && rawAvatar ? rawAvatar : defaultAvatar,
      tableNo: rid > 0 ? String(rid) : '--',
      chips: chip > 0 ? `${fmtMoney(chip)}(${Number((chip / (sb * 2)).toFixed(1))}BB)` : '--',
      hunter: '--',
      rid,
    }
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(allPlayers.value.length / PAGE_SIZE)))

const pagedPlayers = computed(() => {
  const start = (playersPage.value - 1) * PAGE_SIZE
  return allPlayers.value.slice(start, start + PAGE_SIZE)
})

watch(playerMode, () => {
  playersPage.value = 1
})
watch(showHunterMode, (on) => {
  if (!on && playerMode.value === 'hunter') playerMode.value = 'rank'
})

// 当前盲注级别倒计时归零后自动拉取最新详情（获取下一级别 nu）
let pendingDetailRefresh: ReturnType<typeof setTimeout> | null = null
watch(centerTimerSeconds, (sec) => {
  if (!isPreStart.value && sec <= 0 && !pendingDetailRefresh) {
    pendingDetailRefresh = setTimeout(() => {
      void loadDetail()
      pendingDetailRefresh = null
    }, 1500)
  }
})

// ── tables tab ────────────────────────────────────────────────────────────────
interface TableRow {
  tableNo: string
  players: number
  minChips: string
  maxChips: string
  rid: number
}

const tableRows = computed<TableRow[]>(() =>
  roomList.value.map((room) => {
    const rid = Number(room.rid ?? 0)
    const roomers = Array.isArray(room.roomers) ? room.roomers : []
    let min = Number.MAX_SAFE_INTEGER
    let max = Number.MIN_SAFE_INTEGER
    roomers.forEach((r) => {
      const c = Number(r.chip ?? 0)
      if (c < min) min = c
      if (c > max) max = c
    })
    const hasData = roomers.length > 0 && min !== Number.MAX_SAFE_INTEGER
    return {
      tableNo: rid > 0 ? String(rid) : '-',
      players: roomers.length,
      minChips: hasData ? fmtMoney(min) : '-',
      maxChips: hasData ? fmtMoney(max) : '-',
      rid,
    }
  }),
)

// ── rewards tab ───────────────────────────────────────────────────────────────
interface RewardRow {
  rank: string
  reward: string
}

function formatRewardItem(item: RoomcenterMttPrize): string {
  const award = item.award ?? 0
  const goods = Array.isArray(item.goods) ? item.goods : []
  const awardStr = award > 0 ? fmtMoney(award) : ''
  let goodsStr = ''
  goods.forEach((good: { na?: string; n?: number }, idx: number) => {
    const name = resolveName(good.na)
    if (!name || name === '-') return
    goodsStr += idx === 0 && award <= 0 ? `${name} x${good.n ?? 0}` : `+${name} x${good.n ?? 0}`
  })
  const isHunterOn = (mtt.value?.hunter_on ?? 0) > 0
  const bountyStr = t('UIReward_Bounty')
  if (!isHunterOn) return award > 0 ? `${awardStr}${goodsStr}` : goodsStr || '-'
  if (award > 0 || goodsStr) return `${awardStr}${goodsStr}+${bountyStr}`
  return bountyStr
}

const rewardRows = computed<RewardRow[]>(() => {
  const list = rewardData.value?.prizes ?? realPrize.value?.prizes ?? []
  return list.map((item) => {
    const min = item.min ?? 0
    const max = item.max ?? 0
    return {
      rank: min > 0 ? (min === max || max <= 0 ? String(min) : `${min}-${max}`) : '-',
      reward: formatRewardItem(item),
    }
  })
})

const totalPrizePool = computed(() => fmtMoney(rewardData.value?.award ?? realPrize.value?.award))
const paidPlaces = computed(() => fmtNum(rewardData.value?.award_num ?? realPrize.value?.award_num))
const paidPlacesLabel = computed(() => {
  const num = rewardData.value?.award_num ?? realPrize.value?.award_num
  if (!num) return '-'
  const text = t('UITexasReport_Text_RewardReward', num)
  return text === 'UITexasReport_Text_RewardReward' ? String(num) : text
})

// ── blinds tab ────────────────────────────────────────────────────────────────
// formatBlindUnit mirrors Unity StringHelper.GetLongStringUnit (truncate, no rounding)
function formatBlindUnit(n: number | undefined | null): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return '-'
  const value = Math.max(0, Math.trunc(n))
  if (value === 0) return '0'
  if (value < 100000) return String(value / 100)
  if (value < 100000000) {
    const k = Math.trunc(value / 100000)
    const r = Math.trunc((value % 100000) / 10000)
    return r !== 0 ? `${k}.${r}K` : `${k}K`
  }
  const m = Math.trunc(value / 100000000)
  const rm = Math.trunc((value % 100000000) / 10000000)
  return rm !== 0 ? `${m}.${rm}M` : `${m}M`
}

const delayMap = computed(() => {
  const map = new Map<number, number>()
  const table = mtt.value?.blind_level_delay_time_table
  if (!Array.isArray(table)) return map
  table.forEach((item) => {
    const record = item as RoomcenterMttBlindLevelDelay
    const level = Number(record.level ?? 0)
    if (level) map.set(level, Number(record.delay_times ?? 0))
  })
  return map
})

const durationText = computed(() => {
  const interval = Number(mtt.value?.upblind_interval ?? 0)
  if (interval <= 0) return '-'
  const minutes = Math.floor(interval / 60)
  const text = t('UITexasReport_Text_MatchNextBlindTime', minutes)
  return text === 'UITexasReport_Text_MatchNextBlindTime' ? `${minutes}分钟` : text
})

interface BlindRow {
  level: string
  blinds: string
  ante: string
  duration: string
}

const blindRows = computed<BlindRow[]>(() => {
  const levels = getMttBlindLevels(mtt.value?.blindtable_type)
  const currentBlindLevel = Number(more.value?.bl ?? 0)
  return levels.map((item, index) => {
    const level = index + 1
    return {
      level: currentBlindLevel > 0 && currentBlindLevel === level ? `▶${level}` : String(level),
      blinds: `${formatBlindUnit(item.sb)}/${formatBlindUnit(item.sb * 2)}`,
      ante: formatBlindUnit(item.ante),
      duration: durationText.value,
    }
  })
})

const blindLevelCount = computed(() => blindRows.value.length)

// ── API ───────────────────────────────────────────────────────────────────────
async function loadDetail(): Promise<void> {
  if (!matchId.value) return
  try {
    const res = await getRoomcenterMttDetailApi(matchId.value)
    if (res.code === 0 && res.data) detailData.value = res.data
  } catch {
    /* ignore */
  }
}

async function loadRanks(): Promise<void> {
  if (!matchId.value) return
  playersLoading.value = true
  playerRequestCode.value = null
  try {
    const res = await postRoomcenterMttRanksApi(
      matchId.value,
      { limit: 200, offset: 0 },
      { suppressBusinessCodes: [10001] },
    )
    const code = Number(res.code ?? -1)
    if (code === 0 && res.data) {
      rankData.value = res.data
      if (res.data.alive !== undefined && detailData.value)
        detailData.value = { ...detailData.value, alive: res.data.alive }
      if (res.data.total !== undefined && detailData.value)
        detailData.value = { ...detailData.value, enter_total: res.data.total }
    } else {
      playerRequestCode.value = Number.isFinite(code) ? code : -1
    }
  } finally {
    playersLoading.value = false
  }
}

async function loadHunterRanks(): Promise<void> {
  if (!matchId.value || !showHunterMode.value) return
  try {
    const res = await postRoomcenterMttHunterRanksApi(
      matchId.value,
      { limit: 200, offset: 0 },
      { suppressBusinessCodes: [10001] },
    )
    if (res.code === 0 && res.data) hunterData.value = res.data
  } catch {
    /* ignore */
  }
}

async function loadRooms(): Promise<void> {
  if (!matchId.value) return
  tablesLoading.value = true
  try {
    const res = await postRoomcenterMttRoomsApi(
      matchId.value,
      { limit: 200, offset: 0 },
      { suppressBusinessToast: true },
    )
    if (res.code === 0 && res.data)
      roomList.value = Array.isArray(res.data.records) ? res.data.records : []
  } finally {
    tablesLoading.value = false
  }
}

async function loadRewards(): Promise<void> {
  if (!matchId.value) return
  rewardsLoading.value = true
  try {
    const res = await postRoomcenterMttRealPrizeApi(matchId.value)
    if (res.code === 0 && res.data) rewardData.value = res.data
  } finally {
    rewardsLoading.value = false
  }
}

function selectTab(tab: TableTab): void {
  activeTab.value = tab
  if (loadedTabs.value.has(tab)) return
  loadedTabs.value.add(tab)
  if (tab === 'tables') void loadRooms()
  else if (tab === 'rewards') void loadRewards()
}

watch(playerMode, (mode) => {
  if (mode === 'hunter' && !hunterData.value) void loadHunterRanks()
})

onMounted(() => {
  timerInterval = setInterval(() => {
    timerTick.value++
  }, 1000)
  void loadDetail().then(() => {
    void loadRanks()
    if (showHunterMode.value) void loadHunterRanks()
  })
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (pendingDetailRefresh) clearTimeout(pendingDetailRefresh)
})
</script>

<template>
  <section class="mrp">
    <!-- ── 标题 ── -->
    <div class="mrp__title">{{ tournamentName }}</div>

    <!-- ── 概况面板 ── -->
    <div class="mrp__stats">
      <div class="mrp__stats-grid">
        <!-- 左列：我的排名 / 下一注时长 / 比赛已进行 / 最大筹码 -->
        <div class="mrp__col">
          <div class="mrp__stat-item">
            <div class="mrp__stat-label">{{ t('UITexasReportMTT_MyRank_Tip') }}</div>
            <div class="mrp__stat-value">{{ myRank }}</div>
          </div>
          <div class="mrp__stat-item">
            <div class="mrp__stat-label">{{ t('UITexasReport_Text_MatchNextBlindTimeTip') }}</div>
            <div class="mrp__stat-value">{{ nextBlindDurationLabel }}</div>
          </div>
          <div class="mrp__stat-item">
            <div class="mrp__stat-label">{{ t('MTT_State_UseTime') }}</div>
            <div class="mrp__stat-value mrp__stat-value--mono">{{ elapsedLabel }}</div>
          </div>
          <div class="mrp__stat-item">
            <div class="mrp__stat-label">{{ t('UIMTT_chouma5') }}</div>
            <div class="mrp__stat-value">{{ fmtMoney(highestChips) }}</div>
          </div>
        </div>

        <!-- 中列：当前级别 / 时间卡片（占2格高度）/ 平均筹码 -->
        <div class="mrp__col mrp__col--center">
          <div class="mrp__stat-item">
            <div class="mrp__stat-label">{{ t('UITexasReport_Text_BlindLevelTip') }}</div>
            <div class="mrp__stat-value">{{ blindsLabel }}</div>
          </div>
          <div class="mrp__level-card">
            <div v-if="false" class="mrp__level-label">
              {{
                isPreStart
                  ? t('UIMTT_ListdistancestartTip')
                  : t('UITexasReport_Text_MatchZmsysjTip')
              }}
            </div>
            <div class="mrp__level-timer">{{ levelTimeLeftLabel }}</div>
          </div>
          <div class="mrp__stat-item">
            <div class="mrp__stat-label">{{ t('UIMTT_chouma2') }}</div>
            <div class="mrp__stat-value">{{ fmtMoney(avgChips) }}</div>
          </div>
        </div>

        <!-- 右列：在桌/买入 / 总奖池 / 下一盲注 / 最小筹码 -->
        <div class="mrp__col">
          <div class="mrp__stat-item">
            <div class="mrp__stat-label">{{ t('UITexasReport_Text_MatchOnTableBuy') }}</div>
            <div class="mrp__stat-value">{{ aliveAndBuy }}</div>
          </div>
          <div class="mrp__stat-item">
            <div class="mrp__stat-label">{{ t('UITexasReport_Text_MatchTotalBonusTip') }}</div>
            <div class="mrp__stat-value">{{ prizePool }}</div>
          </div>
          <div class="mrp__stat-item">
            <div class="mrp__stat-label">{{ t('UITexasReport_Text_MatchNextBlindTip') }}</div>
            <div class="mrp__stat-value">{{ nextBlindsLabel }}</div>
          </div>
          <div class="mrp__stat-item">
            <div class="mrp__stat-label">{{ t('UIMTT_chouma3') }}</div>
            <div class="mrp__stat-value">{{ fmtMoney(lowestChips) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Tab 切换栏 ── -->
    <div class="mrp__tabs">
      <button
        :class="['mrp__tab', { 'mrp__tab--active': activeTab === 'players' }]"
        type="button"
        @click="selectTab('players')"
      >
        {{ t('UITexasReport_player') }}
      </button>
      <button
        :class="['mrp__tab', { 'mrp__tab--active': activeTab === 'tables' }]"
        type="button"
        @click="selectTab('tables')"
      >
        {{ t('UITexasReport_Label_AllBarPZ') }}
      </button>
      <button
        :class="['mrp__tab', { 'mrp__tab--active': activeTab === 'rewards' }]"
        type="button"
        @click="selectTab('rewards')"
      >
        {{ t('MTT_State_Reward') }}
      </button>
      <button
        :class="['mrp__tab', { 'mrp__tab--active': activeTab === 'blinds' }]"
        type="button"
        @click="selectTab('blinds')"
      >
        {{ t('UITexasReport_Label_AllBarMZ') }}
      </button>
    </div>

    <!-- ── Tab 内容 ── -->
    <div class="mrp__content">
      <!-- ─ 名次(玩家) ─ -->
      <div v-if="activeTab === 'players'" class="mrp__tab-panel">
        <!-- 猎人模式切换 -->
        <div v-if="showHunterMode" class="mrp__mode-switch">
          <button
            :class="['mrp__mode-btn', { 'mrp__mode-btn--active': playerMode === 'rank' }]"
            type="button"
            @click="playerMode = 'rank'"
          >
            {{ t('UITexasReport_player') }}
          </button>
          <button
            :class="['mrp__mode-btn', { 'mrp__mode-btn--active': playerMode === 'hunter' }]"
            type="button"
            @click="playerMode = 'hunter'"
          >
            {{ t('UIReward_Bounty') }}
          </button>
        </div>

        <!-- 玩家表格 -->
        <GameTable :data="pagedPlayers" :loading="playersLoading">
          <GameTableColumn prop="rank" :label="t('UI_Rank')" :flex="1" align="center" />
          <GameTableColumn prop="name" :label="t('UITexasReport_player')" :flex="2" align="center">
            <template #default="{ row }">
              <div class="mrp__player-cell">
                <span>{{ row.name }}</span>
              </div>
            </template>
          </GameTableColumn>
          <GameTableColumn
            v-if="playerMode === 'rank'"
            prop="tableNo"
            :label="t('UITexasReport_Text_DeskNumTip')"
            :flex="1"
            align="center"
          />
          <GameTableColumn
            v-if="playerMode === 'rank'"
            prop="chips"
            :label="t('UIChipsBB')"
            :flex="3"
            align="center"
          />
          <GameTableColumn
            v-if="playerMode === 'hunter'"
            prop="hunter"
            :label="t('UIReward_Bounty')"
            :flex="2"
            align="center"
          />
        </GameTable>

        <div v-if="showPlayerNullTips" class="mrp__null-tips">
          {{ t('MTTDetailPlayer_nulltips') }}
        </div>
      </div>

      <!-- ─ 牌桌 ─ -->
      <div v-else-if="activeTab === 'tables'" class="mrp__tab-panel">
        <GameTable :data="tableRows" :loading="tablesLoading">
          <GameTableColumn
            prop="tableNo"
            :label="t('UITexasReport_Text_DeskNumTip')"
            :flex="1"
            align="center"
          />
          <GameTableColumn
            prop="players"
            :label="t('UITexasReport_Text_DeskPlayerCountTip')"
            :flex="1"
            align="center"
          />
          <GameTableColumn prop="minChips" :label="t('UIMTT_chouma3')" :flex="2" align="center" />
          <GameTableColumn prop="maxChips" :label="t('UIMTT_chouma5')" :flex="2" align="center" />
        </GameTable>
      </div>

      <!-- ─ 奖励 ─ -->
      <div v-else-if="activeTab === 'rewards'" class="mrp__tab-panel">
        <div class="mrp__reward-summary">
          <div class="mrp__reward-summary-item">
            <span class="mrp__reward-summary-label">
              {{ t('UITexasReport_Text_RewardTotalBonusTip') }}
            </span>
            <span class="mrp__reward-summary-value">{{ totalPrizePool }}</span>
          </div>
          <div class="mrp__reward-summary-item">
            <span class="mrp__reward-summary-label">
              {{ t('UITexasReport_Text_RewardRewardTip') }}
            </span>
            <span class="mrp__reward-summary-value">{{ paidPlacesLabel }}</span>
          </div>
        </div>
        <GameTable :data="rewardRows" :loading="rewardsLoading">
          <GameTableColumn prop="rank" :label="t('UI_Rank')" :flex="1" align="center" />
          <GameTableColumn prop="reward" :label="t('MTT_State_Reward')" :flex="2" align="center">
            <template #default="{ row }">
              <div class="mrp__reward-cell">
                <img :src="chipIcon" class="mrp__chip-icon" alt="chip" />
                <span>{{ row.reward }}</span>
              </div>
            </template>
          </GameTableColumn>
        </GameTable>
      </div>

      <!-- ─ 盲注 ─ -->
      <div v-else-if="activeTab === 'blinds'" class="mrp__tab-panel">
        <GameTable :data="blindRows">
          <GameTableColumn
            prop="level"
            :label="t('UITexasReport_Text_BlindLevelTip')"
            :flex="1"
            align="center"
          />
          <GameTableColumn
            prop="blinds"
            :label="t('UITexasReport_Label_AllBarMZ')"
            :flex="2"
            align="center"
          />
          <GameTableColumn
            prop="ante"
            :label="t('UITexasReport_Text_BlindAnteTip')"
            :flex="1"
            align="center"
          />
          <GameTableColumn
            prop="duration"
            :label="t('UITexasReport_Text_BlindBlindTimeTip')"
            :flex="2"
            align="center"
          />
        </GameTable>
      </div>
    </div>

    <!-- ── 分页滑块（仅名次Tab，固定底部）── -->
    <div v-if="activeTab === 'players' && totalPages >= 1" class="mrp__page-bar-content">
      <div class="mrp__page-bar">
        <img
          :src="arrowIcon"
          alt=""
          class="mrp__page-arrow"
          type="button"
          :disabled="playersPage <= 1"
          @click="playersPage = Math.max(1, playersPage - 1)"
        />

        <div class="mrp__page-slider-wrap">
          <VanSlider
            :model-value="playersPage"
            :min="1"
            :max="totalPages"
            :step="1"
            @update:model-value="playersPage = Number($event)"
          />
        </div>
        <img
          :src="arrowIcon"
          alt=""
          class="mrp__page-arrow mrp__page-arrow-right"
          type="button"
          :disabled="playersPage >= totalPages"
          @click="playersPage = Math.min(totalPages, playersPage + 1)"
        />
      </div>
      <div class="mrp__page-info">{{ playersPage }} / {{ totalPages }}</div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.mrp {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100dvh;
  box-sizing: border-box;
  color: #f9f9f9;
  font-family: 'HONOR Sans CN', sans-serif;
  // background: rgba(6, 7, 10, 0.5);
  background: none;
  backdrop-filter: blur(0.18rem);
  -webkit-backdrop-filter: blur(0.18rem);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: rgba(8, 8, 8, 0.28);
    backdrop-filter: blur(0.08rem);
    -webkit-backdrop-filter: blur(0.08rem);
  }
}

/* ── 标题 ── */
.mrp__title {
  flex-shrink: 0;
  padding: 0.5rem 0.3rem 0.4rem;
  font-size: 0.62rem;
  font-weight: 400;
  text-align: center;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 概况面板 ── */
.mrp__stats {
  flex-shrink: 0;
  margin: 0 0.24rem 0.2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.64rem;
  padding: 0.37rem 0.15rem;
  box-shadow:
  /* 左上高光 */ inset 0.2px 0.2px 0px 0px rgba(255, 255, 255, 0.85),
    /* 右下高光 */ inset -0.2px -0.2px 0px 0px rgba(255, 255, 255, 0.85);
}

.mrp__stats-grid {
  display: flex;
  gap: 0.1rem;
  align-items: stretch;
}

.mrp__col {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  gap: 0.4rem;
}

.mrp__col--center {
  flex: 1.2;
  align-items: stretch;
}

.mrp__stat-item {
  text-align: center;
}

.mrp__stat-label {
  font-size: 0.35rem;
  //   color: rgba(252, 252, 252, 0.75);
  font-weight: 400;
  line-height: 1.3;
}

.mrp__stat-value {
  font-size: 0.38rem;
  color: #fff;
  font-weight: 600;
  line-height: 1.3;

  &--mono {
    font-family: 'Keania One', 'Afacad', monospace;
    font-size: 0.38rem;
    font-weight: 600;
    font-family: 'HONOR Sans CN', sans-serif;
    letter-spacing: 0.01rem;
  }
}

/* 级别卡片（占中列 2 格高度） */
.mrp__level-card {
  flex: 1;
  background: linear-gradient(158deg, rgba(255, 255, 255, 0.1) 0%, rgba(230, 230, 230, 0.1) 100%);
  border-radius: 0.48rem;
  padding: 0.1rem 0.08rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.mrp__level-label {
  font-size: 0.2rem;
  color: rgba(252, 252, 252, 0.75);
  font-weight: 400;
  line-height: 1.3;
}

.mrp__level-timer {
  font-size: 0.72rem;
  color: #fff;
  font-weight: 400;
  font-family: 'Keania One', sans-serif;
  line-height: 1.15;
  margin: 0.04rem 0 0.02rem;
}

/* ── Tab 切换栏 ── */
.mrp__tabs {
  flex-shrink: 0;
  display: flex;
  margin: 0 0.24rem 0.16rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4rem;
  overflow: hidden;
  height: 1.3rem;
}

.mrp__tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  font-size: 0.4rem;
  font-family: 'PingFang SC', sans-serif;
  font-weight: 500;
  color: rgba(249, 249, 249, 0.8);
  cursor: pointer;

  &:active {
    opacity: 0.85;
  }
}

.mrp__tab--active {
  background: rgba(255, 255, 255, 0.17);
  border-radius: 4rem;
  color: #fff;
  box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 1), inset 0 0 0 0.5px rgba(255, 255, 255, 0.16);
}

/* ── Tab 内容 ── */
.mrp__content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 0.24rem 0.16rem;
  overflow: hidden;
}

.mrp__tab-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
}

/* 猎人模式切换 */
.mrp__mode-switch {
  display: flex;
  justify-content: center;
  gap: 0.2rem;
}

.mrp__mode-btn {
  min-width: 1.5rem;
  height: 0.64rem;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 0.4rem;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.18);
  font-size: 0.26rem;
  font-family: 'HONOR Sans CN', sans-serif;
}

.mrp__mode-btn--active {
  color: #fff;
  border-color: #0ab8f7;
  background: rgba(10, 184, 247, 0.28);
}

/* 分页滑块栏（固定底部） */
.mrp__page-bar-content {
  background: rgba(0, 0, 0, 0.15);
  padding: 0.3rem 0.32rem 0.5rem;
}
.mrp__page-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.mrp__page-arrow {
  flex-shrink: 0;
  width: 0.7rem;
  height: 0.7rem;
  padding: 0.24rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);

  &:disabled {
    opacity: 0.25;
    cursor: default;
  }
}
.mrp__page-arrow-right {
  rotate: 180deg;
}

.mrp__page-slider-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  margin: 0 0.3rem;
}

.mrp__page-info {
  font-size: 0.26rem;
  color: #fff;
  text-align: center;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.mrp__page-slider-wrap :deep(.van-slider) {
  height: 0.12rem;
  background: rgba(255, 255, 255, 0.3);
  //   margin: 0 0.1rem;
}

.mrp__page-slider-wrap :deep(.van-slider__button) {
  width: 0.56rem;
  height: 0.56rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(198, 176, 186, 0.9);
  backdrop-filter: blur(100px) saturate(1.5);
  -webkit-backdrop-filter: blur(100px) saturate(1.5);
  box-shadow: none;
}
:deep(.game-table__row) {
  background: rgba($color: #000000, $alpha: 0.1);
}

/* 玩家列 */
.mrp__player-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.08rem;
}

.mrp__player-avatar {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

/* 奖励列 */
.mrp__reward-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.08rem;
}

.mrp__chip-icon {
  width: 0.32rem;
  height: 0.32rem;
  object-fit: contain;
  flex-shrink: 0;
}

/* 奖励汇总行 */
.mrp__reward-summary {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0rem 0.24rem;
  //   background: rgba(255, 255, 255, 0.06);
  border-radius: 0.32rem;
}

.mrp__reward-summary-item {
  //   display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.06rem;
}

.mrp__reward-summary-label {
  font-size: 0.28rem;
  color: rgba(255, 255, 255, 0.65);
  vertical-align: middle;
  line-height: 1.3;
}

.mrp__reward-summary-value {
  font-size: 0.38rem;
  color: #fff;
  font-weight: 600;
  line-height: 1;
}

/* 空数据提示 */
.mrp__null-tips {
  text-align: center;
  font-size: 0.24rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.3;
}
</style>
