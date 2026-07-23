<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { postStatsJackpotGoldChangeLogsApi } from '@/api/stats'
import { showFailToast } from 'vant'
import type { StatsJackpotGoldChangeLogsDataItem } from '@/api/models/stats'
import { formatUC } from '@/utils/roomVisibility'
import { t } from '@/i18n'

interface ContributionRecord {
  id: string
  player: string
  playerId: string
  gameId: string
  gameIdSub: string
  contribution: string
  gameType: string
  time: string
}

const records = ref<ContributionRecord[]>([])
const route = useRoute()
const loading = ref(false)
const loadingMore = ref(false)
const listOffset = ref(0)
const hasMore = ref(true)

const PAGE_SIZE = 20

const hasItems = computed(() => records.value.length > 0)

function mapGameType(gameType: number | undefined): string {
  switch (gameType) {
    case 0:
      return 'NLH'
    case 1:
      return 'PLO'
    case 2:
      return 'PLO5'
    case 3:
      return '6+'
    default:
      return 'NLH'
  }
}

async function fetchContributionRecords(reset = false): Promise<void> {
  const jackpotId = Number(route.query.id)
  if (!jackpotId) {
    records.value = []
    hasMore.value = false
    return
  }
  if (!reset && !hasMore.value) return

  if (reset) {
    loading.value = true
    listOffset.value = 0
    hasMore.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const currentOffset = reset ? 0 : listOffset.value
    const response = await postStatsJackpotGoldChangeLogsApi({
      jackpot_id: jackpotId,
      op_codes: ['JACKPOTCONTRI'],
      limit: PAGE_SIZE,
      offset: currentOffset,
    })
    const rawItems: StatsJackpotGoldChangeLogsDataItem[] = response.data.items ?? []
    const mappedItems = rawItems.map((item: StatsJackpotGoldChangeLogsDataItem, index: number) => ({
      id: `${reset ? '0' : String(currentOffset + index)}`,
      player: item.user_name ?? 'name',
      playerId: `ID:${item.user_rid ?? ''}`,
      gameId: item.room_name ?? 'name',
      gameIdSub: `ID:${item.src_room_id ?? ''}`,
      contribution:
        item.gold_change != null
          ? `${item.gold_change > 0 ? '+' : ''}${formatUC(item.gold_change)}`
          : '0',
      gameType: mapGameType(item.game_type),
      time: item.create_time?.replace('T', '\n').replace('Z', '') ?? '',
    }))

    if (reset) {
      records.value = mappedItems
    } else {
      records.value = [...records.value, ...mappedItems]
    }

    listOffset.value = currentOffset + rawItems.length
    hasMore.value = rawItems.length >= PAGE_SIZE
  } catch {
    if (reset) {
      records.value = []
      hasMore.value = false
    } else {
      showFailToast(t('MSG_LoadFail') + '，' + t('UIClub_Text4'))
    }
  } finally {
    if (reset) {
      loading.value = false
    } else {
      loadingMore.value = false
    }
  }
}

function loadNextPage(): void {
  if (!loading.value && !loadingMore.value && hasMore.value) {
    void fetchContributionRecords(false)
  }
}

function onPageScroll(event: Event): void {
  const target = event.target as HTMLElement | null
  if (!target) return
  const remain = target.scrollHeight - (target.scrollTop + target.clientHeight)
  if (remain <= 80) {
    loadNextPage()
  }
}

watch(
  () => route.query.id,
  (newId) => {
    if (newId) {
      void fetchContributionRecords(true)
    }
  },
)

onMounted(() => {
  void fetchContributionRecords(true)
})
</script>

<template>
  <div class="page-shell record-page" @scroll="onPageScroll">
    <HeaderBack :title="'贡献记录'" />

    <section class="record-table-wrap">
      <!-- 表头：底层绿色光晕 + 半透明 pill -->
      <div class="record-header-wrap">
        <div class="record-header-glow"></div>
        <div class="record-header-pill">
          <div class="col-player">{{ t('UIMine_RecordItemMatch_2TZCjaqM') }}</div>
          <div class="col-gameid">{{ t('UIClub_RoomCreat_0HvQkjkd') }}</div>
          <div class="col-value">{{ t('UIClubJackpotRecordDetail_ContributionTip') }}</div>
          <div class="col-type">{{ t('UIData_game') }}</div>
          <div class="col-hand">{{ t('TimeItem') }}</div>
        </div>
      </div>

      <!-- 数据行 -->
      <div class="record-rows">
        <div v-for="row in records" :key="row.id" class="record-row-pill">
          <div class="col-player">
            <div class="cell-info">
              <span class="info-name">{{ row.player }}</span>
              <span class="info-sub">{{ row.playerId }}</span>
            </div>
          </div>
          <div class="col-gameid">
            <div class="cell-info">
              <span class="info-name">{{ row.gameId }}</span>
              <span class="info-sub">{{ row.gameIdSub }}</span>
            </div>
          </div>
          <div class="col-value" :class="row.contribution.startsWith('+') ? 'val-pos' : 'val-neg'">
            {{ row.contribution }}
          </div>
          <div class="col-type">{{ row.gameType }}</div>
          <div class="col-hand">
            {{ row.time }}
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!hasItems && loading" class="record-empty">
        <AppSvgIcon name="empty-data" class="empty-icon" />
        <p>{{ t('SuperView2') }}...</p>
      </div>
      <div v-else-if="!hasItems && !loading" class="record-empty">
        <AppSvgIcon name="empty-data" class="empty-icon" />
        <p>{{ t('UIClub_FundDetail_xYlV8VBZ') }}</p>
      </div>
      <div v-else-if="loadingMore" class="pool-loading-more">{{ t('SuperView2') }}...</div>
      <div v-else-if="!hasMore && hasItems" class="pool-loading-more">{{ t('UIClub_NoMore') }}</div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

// 1rem = 37.5px

.record-page {
  position: relative;
  height: 100dvh;
  padding: 0 0.3467rem 0.64rem;
  overflow-x: hidden;
  overflow-y: auto;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.record-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  backdrop-filter: blur(36.5px);
  background: rgba(0, 0, 0, 0.2);
  mix-blend-mode: luminosity;
  z-index: 0;
}

:deep(.page-back-header) {
  position: relative;
  z-index: 2;
  padding-left: 0;
  padding-right: 0;
  padding-top: calc(var(--app-top-padding) + var(--app-content-safe-area-top, env(safe-area-inset-top)) + 0.2rem);
  min-height: 1.46rem;
}

// 表格容器
.record-table-wrap {
  position: relative;
  z-index: 2;
  margin: 0.1293rem auto 0; // 4.837px / 37.5
  width: 9.2863rem; // 348.237px / 37.5
  max-width: calc(100vw - 0.6934rem);
  display: flex;
  flex-direction: column;
  gap: 0.1293rem;
}

// 表头
.record-header-wrap {
  position: relative;
  width: 100%;
  flex-shrink: 0;
}

.record-header-glow {
  position: absolute;
  left: 1.76%;
  top: 0.172rem; // 6.45px / 37.5
  width: 96.2%;
  height: 0.5073rem; // 19.024px / 37.5
  border-radius: 0.7136rem; // 26.763px / 37.5
  background: rgba(86, 153, 205, 1);
}

.record-header-pill {
  position: relative;
  display: flex;
  align-items: center;
  height: 0.8512rem; // 31.922px / 37.5
  padding: 0 0.4471rem; // 16.767px / 37.5
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4.2992rem; // 161.221px / 37.5
  color: #f9f9f9;
  font-size: 0.308rem; // 11.54px / 37.5

  @include theme-light {
    color: #fff;
    background: rgba(var(--c-brand-rgb), 0.72);
    box-shadow: inset 0 0 0.16rem rgba(255, 255, 255, 0.7);
  }
}

// 数据行
.record-rows {
  display: flex;
  flex-direction: column;
  gap: 0.1293rem;
}

.record-row-pill {
  display: flex;
  align-items: center;
  height: 0.8512rem;
  padding: 0 0.4127rem; // 15.477px / 37.5
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4.2992rem;
  color: rgba(225, 238, 255, 0.9);

  @include theme-light {
    color: var(--c-text);
    background: var(--c-surface);
  }
}

// 列定义
.col-player {
  flex-shrink: 0;
  width: 1.617rem; // 60.619px / 37.5
  display: flex;
  align-items: center;
}

.col-gameid {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.col-value {
  flex-shrink: 0;
  width: 1.617rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.3009rem; // 11.285px / 37.5
  white-space: nowrap;
}

.col-type {
  flex-shrink: 0;
  width: 1.617rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.3009rem;
  white-space: nowrap;
}

.col-hand {
  flex-shrink: 0;
  width: 2.1066rem; // 78.998px / 37.5
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0.4rem;
}

// 表头列居中覆盖
.record-header-pill .col-player {
  justify-content: center;
}

// 双行信息单元格
.cell-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.info-name {
  font-size: 0.2933rem; // 11px / 37.5
  color: #ffffff;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 1.547rem; // 58px / 37.5

  @include theme-light {
    color: var(--c-text);
  }
}

.info-sub {
  font-size: 0.2133rem; // 8px / 37.5
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.2;
  white-space: nowrap;

  @include theme-light {
    color: var(--c-text-muted);
  }
}

// 金额颜色
.val-pos {
  color: var(--c-profit);
}

.val-neg {
  color: var(--c-loss);
}

// 扑克牌
.cards-row {
  display: flex;
  gap: 0.0533rem; // 1.997px / 37.5
}

.mini-card {
  flex-shrink: 0;
  width: 0.3416rem; // 12.809px / 37.5
  height: 0.5123rem; // 19.211px / 37.5
  background: #ffffff;
  border-radius: 0.1867rem; // 7px / 37.5
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.0267rem 0.0267rem 0.04rem;

  &__rank {
    font-size: 0.1333rem; // 5px / 37.5
    font-weight: 700;
    line-height: 1;
    color: #000000;
  }

  &__suit {
    font-size: 0.1493rem; // ~5.6px
    line-height: 1;
    color: #000000;
    align-self: center;
  }

  &--red {
    .mini-card__rank,
    .mini-card__suit {
      color: #fa2b4b;
    }
  }
}

/* Empty state */
.record-empty {
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon {
  width: 1.248rem;
  height: 1.56rem;
  object-fit: contain;

  @include theme-light {
    color: var(--c-brand);
  }
}

.record-empty p {
  margin: 0.24rem 0 0;
  font-size: 0.3734rem;
  color: rgba(225, 234, 248, 0.88);
  text-align: center;

  @include theme-light {
    color: var(--c-text);
  }
}

.pool-loading-more {
  margin: 0.42rem 0 0;
  text-align: center;
  color: rgba(225, 234, 248, 0.88);
  font-size: 0.32rem;

  @include theme-light {
    color: var(--c-text-muted);
  }
}
</style>
