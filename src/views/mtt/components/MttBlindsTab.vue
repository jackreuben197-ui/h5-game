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
  markerColor: string
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

// 对齐 Unity UIMatchMttDetailBlindComponent.SetItemInfo 的级别标记：
// 截止买入(max_rebuy_bl, TextColor28 红)、增购开启(addon_begin_bl, TextColor26 绿)、
// 增购截止(addon_end_bl, TextColor27 黄)；同级别命中多个时按客户端覆盖顺序 end > begin > rebuy。
function resolveMarker(level: number): { text: string; color: string } {
  const addonBegin = Number(mtt.value?.addon_begin_bl ?? 0)
  const addonEnd = Number(mtt.value?.addon_end_bl ?? 0)
  const maxRebuy = Number(mtt.value?.max_rebuy_bl ?? 0)

  if (level === addonEnd && addonEnd > 0) {
    return { text: t('MTT_Blind_Deadline_add_cl'), color: '#FFC706' }
  }
  if (level === addonBegin && addonBegin > 0) {
    return { text: t('MTT_Blind_Deadline_add_op'), color: '#80CD10' }
  }
  if (level === maxRebuy && maxRebuy > 0) {
    return { text: t('MTT_Blind_Deadline_to_buy'), color: '#FF4368' }
  }
  return { text: '', color: '' }
}

const blindList = computed<BlindRecord[]>(() => {
  const levels = getMttBlindLevels(mtt.value?.blindtable_type)
  const currentLevel = Number(more.value?.bl ?? 0)

  return levels.map((item, index) => {
    const level = index + 1
    const delayTimes = delayMap.value.get(level) ?? 0
    const isCurrent = currentLevel > 0 && currentLevel === level
    const marker = resolveMarker(level)

    return {
      level: isCurrent ? `▶${level}` : String(level),
      blinds: `${formatBlindUnit(item.sb)}/${formatBlindUnit(item.sb * 2)}`,
      ante: formatBlindUnit(item.ante),
      duration: durationText.value,
      addTime: `+${delayTimes}`,
      marker: marker.text,
      markerColor: marker.color,
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
        <div class="blinds-stat-label">{{ t('UIMatchBlindLevelCount') }}</div>
        <div class="blinds-stat-value">{{ blindLevels }}</div>
      </div>
    </div>

    <!-- 盲注表格 -->
    <GameTable :data="blindList" height="12rem">
      <GameTableColumn
        prop="level"
        :label="t('UITexasReport_Text_BlindLevelTip')"
        :flex="1"
        align="center"
      >
        <template #default="{ row }">
          <div class="level-cell">
            <span class="level-text">{{ row.level }}</span>
            <span v-if="row.marker" class="level-marker" :style="{ color: row.markerColor }">
              {{ row.marker }}
            </span>
          </div>
        </template>
      </GameTableColumn>
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
@use '@/styles/mixins' as *;

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
  padding: 0 1.8rem;
  height: 1.2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3.9rem;
  backdrop-filter: blur(0.16px);

  @include theme-light {
    background: #fff;
  }
}

.blinds-stat-label {
  text-align: center;
  font-size: 0.36rem;
  font-family: 'SF Pro', 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;

  @include theme-light {
    color: #000;
  }
}

.blinds-stat-value {
  font-size: 0.54rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;

  @include theme-light {
    color: #000;
  }
}

/* ===== 级别列：级别号 + 截止买入/增购标记 ===== */
.level-cell {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.04rem;
}

.level-text {
  font-size: 0.36rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;

  @include theme-light {
    color: rgba(0, 0, 0, 0.9);
  }
}

/* 标记文案（如 EN "Late Registration"）较长，列又窄：缩小字号并允许换行 */
.level-marker {
  max-width: 100%;
  font-size: 0.22rem;
  line-height: 1.2;
  text-align: center;
  white-space: normal;
  word-break: break-word;
}
</style>
