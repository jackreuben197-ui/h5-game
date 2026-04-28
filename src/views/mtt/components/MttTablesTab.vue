<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { showToast } from 'vant'
import { GameTable, GameTableColumn } from '@/components/Table'
import peopleIcon from '@/assets/icons/icon_people.png'
import tableIcon from '@/assets/icons/icon_table.png'
import type {
  RoomcenterMttDetailData,
  RoomcenterMttRoomPlayer,
  RoomcenterMttRoomRecord,
} from '@/api/models/roomcenter'
import { postRoomcenterMttRoomsApi } from '@/api/roomcenter'
import { t } from '@/i18n'

interface TableRecord {
  tableNo: string
  players: number
  minChips: string
  maxChips: string
  rid: number
}

const props = defineProps<{
  data: RoomcenterMttDetailData | null
  matchId: number
}>()

const loading = ref(false)
const roomList = ref<RoomcenterMttRoomRecord[]>([])

function formatNum(n: number | undefined | null): string {
  if (n === undefined || n === null) return '-'
  return n.toLocaleString()
}

function getRoomMinMax(roomers: RoomcenterMttRoomPlayer[] | undefined): [number, number] {
  const list = Array.isArray(roomers) ? roomers : []
  if (!list.length) return [0, 0]

  let min = Number.MAX_SAFE_INTEGER
  let max = Number.MIN_SAFE_INTEGER
  list.forEach((item) => {
    const chip = Number(item.chip ?? 0)
    if (chip < min) min = chip
    if (chip > max) max = chip
  })

  if (min === Number.MAX_SAFE_INTEGER || max === Number.MIN_SAFE_INTEGER) return [0, 0]
  return [min, max]
}

const tableList = computed<TableRecord[]>(() => {
  return roomList.value.map((room) => {
    const rid = Number(room.rid ?? 0)
    const roomers = Array.isArray(room.roomers) ? room.roomers : []
    const [minChip, maxChip] = getRoomMinMax(roomers)

    return {
      tableNo: rid > 0 ? String(rid) : '-',
      players: roomers.length,
      minChips: roomers.length ? formatNum(minChip) : '-',
      maxChips: roomers.length ? formatNum(maxChip) : '-',
      rid,
    }
  })
})

const seatsPerTable = computed(() => {
  const seatCount = props.data?.mtt?.seat_count
  if (seatCount === undefined || seatCount === null) return '-'
  return String(seatCount)
})

const totalTables = computed(() => String(tableList.value.length))

function canEnterTable(): boolean {
  return (props.data?.mtt?.status ?? -1) === 1
}

function handleRowClick(row: Record<string, unknown>): void {
  const rid = Number(row.rid ?? 0)
  if (!rid) return

  if (!canEnterTable()) {
    showToast(t('curr_not_enter'))
    return
  }

  // TODO: 等 Gameplay 联调完成后，接入真正的观战/入桌路由
  showToast(`准备进入牌桌 ${rid}`)
}

async function loadRooms(): Promise<void> {
  if (!props.matchId) {
    roomList.value = []
    return
  }

  loading.value = true
  try {
    const response = await postRoomcenterMttRoomsApi(
      props.matchId,
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
    loading.value = false
  }
}

onMounted(() => {
  void loadRooms()
})

watch(() => props.matchId, () => {
  void loadRooms()
})
</script>

<template>
  <div class="mtt-tables-tab">
    <!-- 顶部统计 -->
    <div class="tables-stats-card">
      <div class="tables-stat-row">
        <div class="tables-stat-label">单桌人数</div>
        <div class="tables-stat-value">
          <img :src="peopleIcon" class="stat-icon" alt="people" />
          <span>{{ seatsPerTable }}</span>
        </div>
      </div>
      <div class="tables-stat-row">
        <div class="tables-stat-label">牌桌总数</div>
        <div class="tables-stat-value">
          <img :src="tableIcon" class="stat-icon" alt="table" />
          <span>{{ totalTables }}</span>
        </div>
      </div>
    </div>

    <!-- 牌桌表格 -->
    <GameTable
      :data="tableList"
      :loading="loading"
      height="7.2rem"
      @row-click="handleRowClick"
    >
      <GameTableColumn
        prop="tableNo"
        label="桌号"
        :flex="1"
        align="center"
      />
      <GameTableColumn
        prop="players"
        label="人数"
        :flex="1"
        align="center"
      />
      <GameTableColumn
        prop="minChips"
        label="最小筹码"
        :flex="2"
        align="center"
      />
      <GameTableColumn
        prop="maxChips"
        label="最大筹码"
        :flex="2"
        align="center"
      />
    </GameTable>
  </div>
</template>

<style scoped lang="scss">
.mtt-tables-tab {
  padding-top: 0.2rem;
}

/* ===== 顶部统计卡片 ===== */
.tables-stats-card {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.4rem;
}

.tables-stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.4rem;
  height: 1.2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3.9rem;
  backdrop-filter: blur(0.16px);
}

.tables-stat-label {
  font-size: 0.36rem;
  font-family: 'SF Pro', 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
}

.tables-stat-value {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  font-size: 0.36rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 600;
  color: #fff;
}

.stat-icon {
  width: 0.42rem;
  height: 0.42rem;
  object-fit: contain;
}
</style>
