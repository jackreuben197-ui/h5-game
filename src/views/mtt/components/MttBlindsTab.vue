<script setup lang="ts">
import { computed } from 'vue'
import { GameTable, GameTableColumn } from '@/components/Table'
import type { RoomcenterMttBlindLevelDelay, RoomcenterMttDetailData } from '@/api/models/roomcenter'
import { getMttBlindLevels } from '@/views/mtt/constants/mttBlindTable'
import { t } from '@/i18n'

interface BlindRecord {
  level: string
  blinds: string
  ante: string
  duration: string
  addTime: string
  marker: string
}

const props = defineProps<{
  data: RoomcenterMttDetailData | null
  matchId: number
}>()

const mtt = computed(() => props.data?.mtt)
const more = computed(() => props.data?.more)

// 对齐 Unity StringHelper.GetLongStringUnit:
// 1) 基础显示按 /100
// 2) >= 100000 显示 K，>= 100000000 显示 M（按客户端截断，不四舍五入）
function formatBlindUnit(n: number | undefined | null): string {
  if (n === undefined || n === null) return '-'
  if (!Number.isFinite(n)) return '-'

  const value = Math.max(0, Math.trunc(n))
  if (value === 0) return '0'

  if (value < 100000) {
    return `${value / 100}`
  }

  if (value < 100000000) {
    const thousand = Math.trunc(value / 100000)
    const others = Math.trunc((value % 100000) / 10000)
    return others !== 0 ? `${thousand}.${others}K` : `${thousand}K`
  }

  const million = Math.trunc(value / 100000000)
  const othersm = Math.trunc((value % 100000000) / 10000000)
  return othersm !== 0 ? `${million}.${othersm}M` : `${million}M`
}

const delayMap = computed(() => {
  const map = new Map<number, number>()
  const table = mtt.value?.blind_level_delay_time_table
  if (!Array.isArray(table)) return map

  table.forEach((item) => {
    const record = item as RoomcenterMttBlindLevelDelay
    const level = Number(record.level ?? 0)
    if (!level) return
    map.set(level, Number(record.delay_times ?? 0))
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

function markerText(level: number): string {
  const addonBegin = Number(mtt.value?.addon_begin_bl ?? 0)
  const addonEnd = Number(mtt.value?.addon_end_bl ?? 0)
  const maxRebuy = Number(mtt.value?.max_rebuy_bl ?? 0)

  if (level === addonBegin && addonBegin > 0) {
    return t('MTT_Blind_Deadline_add_op')
  }
  if (level === addonEnd && addonEnd > 0) {
    return t('MTT_Blind_Deadline_add_cl')
  }
  if (level === maxRebuy && maxRebuy > 0) {
    return t('MTT_Blind_Deadline_to_buy')
  }
  return '-'
}

const blindList = computed<BlindRecord[]>(() => {
  const levels = getMttBlindLevels(mtt.value?.blindtable_type)
  const currentLevel = Number(more.value?.bl ?? 0)

  return levels.map((item, index) => {
    const level = index + 1
    const delayTimes = delayMap.value.get(level) ?? 0
    const isCurrent = currentLevel > 0 && currentLevel === level

    return {
      level: isCurrent ? `▶${level}` : String(level),
      blinds: `${formatBlindUnit(item.sb)}/${formatBlindUnit(item.sb * 2)}`,
      ante: formatBlindUnit(item.ante),
      duration: durationText.value,
      addTime: `+${delayTimes}`,
      marker: markerText(level),
    }
  })
})

const blindLevels = computed(() => blindList.value.length)
</script>

<template>
  <div class="mtt-blinds-tab">
    <!-- 顶部统计 -->
    <div class="blinds-stats-card">
      <div class="blinds-stat-row">
        <div class="blinds-stat-label">盲注级别数</div>
        <div class="blinds-stat-value">{{ blindLevels }}</div>
      </div>
    </div>

    <!-- 盲注表格 -->
    <GameTable :data="blindList" height="12rem">
      <GameTableColumn
        prop="level"
        label="级别"
        :flex="1"
        align="center"
      />
      <GameTableColumn
        prop="blinds"
        label="盲注"
        :flex="2"
        align="center"
      />
      <GameTableColumn
        prop="ante"
        label="前注"
        :flex="1"
        align="center"
      />
      <GameTableColumn
        prop="duration"
        label="盲注时间"
        :flex="2"
        align="center"
      />
      <!-- <GameTableColumn
        prop="addTime"
        label="加时"
        :flex="1"
        align="center"
      />
      <GameTableColumn
        prop="marker"
        label="提示"
        :flex="2"
        align="center"
      /> -->
    </GameTable>
  </div>
</template>

<style scoped lang="scss">
.mtt-blinds-tab {
  padding-top: 0.2rem;
}

/* ===== 顶部统计卡片 ===== */
.blinds-stats-card {
  margin-bottom: 0.4rem;
}

.blinds-stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.4rem;
  height: 1.2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3.9rem;
  backdrop-filter: blur(0.16px);
}

.blinds-stat-label {
  font-size: 0.36rem;
  font-family: 'SF Pro', 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
}

.blinds-stat-value {
  font-size: 0.54rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
}
</style>
