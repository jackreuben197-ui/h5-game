<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { MttItem, MttActionType } from '@/components/ListItem/MttCard.vue'
import type { MttIdInfoRecord, MttListRecord, MttSeriesInfoRecord } from '@/api/models/roomcenter'
import pokerMiniIcon from '@/assets/icons/game_zone_mtt_mini.png'
import mahjongMiniIcon from '@/assets/icons/game_zone_mahjong_mini.png'
import { useAppConfigStore } from '@/stores/appConfig'
import { useMttListStore } from '@/stores/mttList'
import { useUserInfoStore } from '@/stores/userInfo'
import { getLocale, t } from '@/i18n'
import { ROOM_ORIGIN_TYPE } from '@/utils/roomVisibility'
import { isMttRecordVisible } from '@/utils/mttVisibility'
import { useLoginModalStore } from '@/stores/loginModal'
import { useGameStore } from '@/stores/game'
import {
  multiLanguageTemplateVersion,
  resolveTemplateTextByKey,
} from '@/utils/multiLanguageTemplate'
import { formatDateTime, formatTodayAwareTimeLabel, toTimestampMs } from '@/utils/time'

const MttMatchStatus = { CREATED: 0, RUNNING: 1, CLOSED: 2, CANCEL: 3 } as const

type MttTabName = 'all' | 'poker' | 'mahjong'
type MttCategory = 'poker' | 'mahjong' | 'unknown'
type MttStage = 'upcoming' | 'registering' | 'late' | 'running' | 'finished'
type MttLayout = 'sm' | 'md' | 'lg'

type RawMttRecord = MttListRecord

interface MttViewItem extends MttItem {
  category: MttCategory
  stage: MttStage
  startAtMs: number
  applyStartAtMs: number
  lateEndAtMs: number
  seriesId: number
  pinnedTime: number
  originType: number
  relateClubIds: Array<number | string>
  relateTribeClubList: Array<Record<string, unknown>>
  raw: RawMttRecord
}

interface MttGroup {
  groupId: string
  title: string
  moreName: string
  layout: MttLayout
  items: MttViewItem[]
  defaultVisibleCount: number
}

interface MttRenderGroup extends MttGroup {
  expanded: boolean
  showViewAll: boolean
  displayItems: MttViewItem[]
}

interface Props {
  activeTab?: MttTabName
  embedded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  activeTab: 'all',
  embedded: false,
})

const router = useRouter()
const appConfigStore = useAppConfigStore()
const mttListStore = useMttListStore()
const userInfoStore = useUserInfoStore()
const loginModalStore = useLoginModalStore()
const gameStore = useGameStore()

const expandedGroupMap = ref<Record<string, boolean>>({})
const selectedClub = computed(
  () => userInfoStore.currentClub ?? userInfoStore.channelDefaultClub,
)
const selectedClubId = computed(() => toSafeInt(selectedClub.value?.club_id))
const selectedTribeId = computed(() =>
  toSafeInt((selectedClub.value as Record<string, unknown> | null)?.tribe_id),
)

const nowMs = ref(Date.now())
let ticker: number | null = null

onMounted(() => {
  ticker = window.setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  if (ticker !== null) {
    window.clearInterval(ticker)
    ticker = null
  }
})

const sourceRecords = computed<RawMttRecord[]>(() => mttListStore.records as RawMttRecord[])

const normalizedItems = computed<MttViewItem[]>(() =>
  sourceRecords.value.map((record) => {
    void multiLanguageTemplateVersion.value
    const matchId = toSafeInt(record.match_id)
    const mttIdMeta = mttListStore.mttIdMetaMap[matchId]
    return normalizeRecordToViewItem(record, mttIdMeta, nowMs.value)
  }),
)

const filteredItems = computed<MttViewItem[]>(() => {
  return normalizedItems.value.filter((item) => {
    // 基础可见性（排麻将 + club/tribe）由 isMttRecordVisible 统一兜底，保证首页统计与此处一致。
    if (
      !isMttRecordVisible(
        item.raw,
        mttListStore.mttIdMetaMap[toSafeInt(item.raw.match_id)],
        selectedClubId.value,
        selectedTribeId.value,
        appConfigStore.clubDisplayPlatformMtt,
      )
    ) {
      return false
    }
    // 顶部 tab 二次过滤：'all' 不再细分，'poker' 只留扑克类。
    if (props.activeTab !== 'all' && item.category !== props.activeTab) {
      return false
    }
    return true
  })
})

const mttGroups = computed<MttGroup[]>(() =>
  buildGroupsBySeries(filteredItems.value, mttListStore.mttSeriesMap),
)

const renderGroups = computed<MttRenderGroup[]>(() =>
  mttGroups.value.map((group) => {
    const expanded = expandedGroupMap.value[group.groupId] === true
    const showViewAll =
      group.groupId !== 'no-series' && group.items.length > group.defaultVisibleCount
    return {
      ...group,
      expanded,
      showViewAll,
      displayItems:
        showViewAll && !expanded ? group.items.slice(0, group.defaultVisibleCount) : group.items,
    }
  }),
)

function handleCardAction(item: MttItem): void {
  if (!gameStore.sessionToken) {
    loginModalStore.open()
    return
  }
  router.push({ name: 'mtt-detail', query: { id: String(item.id) } })
}

function handleCardClick(item: MttItem): void {
  if (!gameStore.sessionToken) {
    loginModalStore.open()
    return
  }
  router.push({ name: 'mtt-detail', query: { id: String(item.id) } })
}

function handleViewAll(group: MttRenderGroup): void {
  expandedGroupMap.value[group.groupId] = !(expandedGroupMap.value[group.groupId] === true)
}

function buildGroupsBySeries(
  items: MttViewItem[],
  seriesMap: Record<number, MttSeriesInfoRecord>,
): MttGroup[] {
  const groups: MttGroup[] = []
  const sortedItems = [...items].sort((a, b) => a.startAtMs - b.startAtMs)

  const clubItems = sortedItems.filter((item) => item.originType === ROOM_ORIGIN_TYPE.CLUB)
  if (clubItems.length) {
    groups.push(buildGroup('club', resolveLabel('UIGuildMain_ClubGame', t('UIClub_Club3')), clubItems))
  }

  const noSeriesItems: MttViewItem[] = []
  const seriesBucketMap: Record<number, MttViewItem[]> = {}

  sortedItems.forEach((item) => {
    if (item.originType === ROOM_ORIGIN_TYPE.FRIEND || item.originType === ROOM_ORIGIN_TYPE.CLUB) {
      return
    }

    if (item.seriesId > 0 && seriesMap[item.seriesId]) {
      if (!seriesBucketMap[item.seriesId]) {
        seriesBucketMap[item.seriesId] = []
      }
      seriesBucketMap[item.seriesId].push(item)
      return
    }

    noSeriesItems.push(item)
  })

  const seriesIds = Object.keys(seriesBucketMap)
    .map((value) => Number(value))
    .filter((value) => value > 0)
    .sort((a, b) => compareSeriesOrder(a, b, seriesMap))

  seriesIds.forEach((seriesId) => {
    const seriesInfo = seriesMap[seriesId]
    const seriesName = resolveNameByUnityRule(toSafeString(seriesInfo?.name)) || t('UIClub_Text18') + " #" + (seriesId)
    const moreName = resolveNameByUnityRule(toSafeString(seriesInfo?.more_name))
    const seriesItems = [...seriesBucketMap[seriesId]].sort(compareSeriesRoom)
    const seriesLayout = resolveSeriesLayoutByType(toSafeInt(seriesInfo?.type), seriesItems.length)
    groups.push(buildGroup(`series-${seriesId}`, seriesName, seriesItems, seriesLayout, moreName))
  })

  if (noSeriesItems.length) {
    groups.push(buildGroup('no-series', '', noSeriesItems, 'lg'))
  }

  return groups
}

function buildGroup(
  groupId: string,
  title: string,
  items: MttViewItem[],
  layoutOverride?: MttLayout,
  moreName = '',
): MttGroup {
  const layout = layoutOverride || (items.length <= 1 ? 'lg' : items.length <= 4 ? 'md' : 'sm')
  return {
    groupId,
    title,
    moreName,
    layout,
    items,
    defaultVisibleCount: layout === 'lg' ? 1 : layout === 'md' ? 2 : 3,
  }
}

function compareSeriesOrder(
  seriesAId: number,
  seriesBId: number,
  seriesMap: Record<number, MttSeriesInfoRecord>,
): number {
  const createA = toSafeInt(seriesMap[seriesAId]?.create_time)
  const createB = toSafeInt(seriesMap[seriesBId]?.create_time)
  if (createA !== createB) {
    return createB - createA
  }
  return seriesBId - seriesAId
}

function compareSeriesRoom(a: MttViewItem, b: MttViewItem): number {
  if (a.pinnedTime !== b.pinnedTime) {
    return b.pinnedTime - a.pinnedTime
  }
  return a.startAtMs - b.startAtMs
}

function resolveCategory(record: RawMttRecord): MttCategory {
  const gameType = Number(record.game_type ?? 0)
  if (gameType === 6) {
    return 'mahjong'
  }
  if (gameType >= 0 && gameType <= 3) {
    return 'poker'
  }
  return 'unknown'
}

function normalizeRecordToViewItem(
  record: RawMttRecord,
  mttIdMeta: MttIdInfoRecord | undefined,
  nowTimestamp: number,
): MttViewItem {
  const category = resolveCategory(record)
  const stage = resolveStage(record, nowTimestamp)
  const startAtMs = toTimestampMs(record.start_time)
  const applyStartAtMs = toTimestampMs(record.apply_start_time)
  const lateEndAtMs = calcLateEndMs(record, startAtMs)

  const action = resolveAction(stage)
  const statusView = resolveStatusView(stage, startAtMs, applyStartAtMs, lateEndAtMs, nowTimestamp)
  const rawName = toSafeString(record.name)
  const title = resolveNameByUnityRule(rawName) || `MTT #${record.match_id ?? '-'}`.trim()
  const participants = Number(record.participants ?? 0)
  const applyFeePool = toSafeInt(record.apply_fee_pool)
  const prizePool = toSafeInt(record.prize_base_pool ?? record.prize_pool)
  const prizeType = toSafeInt(record.prize_type)
  const rebuyTimes = toSafeInt(record.rebuy_times)
  const addonBeginBl = toSafeInt(record.addon_begin_bl)
  const addonEndBl = toSafeInt(record.addon_end_bl)
  const antiCheatType = toSafeInt(record.anti_cheat_type)
  const startTime = formatDateTime(startAtMs, 'YYYY/MM/DD HH:mm:ss')

  return {
    id: record.match_id ?? `${title}-${startAtMs}`,
    title,
    coverImage: (record.mtt_banner_url || '').trim() || undefined,
    gameIcon: (record.game_icon || '').trim() || getDefaultGameIcon(category),
    applyFeePool,
    prizePool,
    startTime,
    registeredCount: Math.max(0, participants),
    maxCount: resolveMaxCount(record, participants),
    prizeType,
    rebuyTimes,
    addonBeginBl,
    addonEndBl,
    antiCheatType,
    actionType: action.type,
    actionLabel: action.label,
    statusLabel: statusView.label,
    statusTheme: statusView.theme,
    category,
    stage,
    startAtMs,
    applyStartAtMs,
    lateEndAtMs,
    seriesId: toSafeInt(record.series_id),
    pinnedTime: toSafeInt(record.pinned_time),
    originType: toSafeInt(mttIdMeta?.origin_type ?? record.origin_type),
    relateClubIds: normalizeListField(
      mttIdMeta?.relate_club_ids ?? record.relate_club_ids ?? [],
    ) as Array<number | string>,
    relateTribeClubList: normalizeRelateTribeClubList(
      mttIdMeta?.relate_tribe_club_list ?? record.relate_tribe_club_list,
    ),
    raw: record,
  }
}

function normalizeListField(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function normalizeRelateTribeClubList(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item) => Boolean(item) && typeof item === 'object') as Array<
    Record<string, unknown>
  >
}

function resolveSeriesLayoutByType(seriesType: number, total: number): MttLayout {
  if (total <= 1) return 'lg'
  if (seriesType === 1) return 'lg'
  if (seriesType === 2) return 'md'
  if (seriesType === 3) return total === 2 ? 'md' : 'sm'
  return total <= 4 ? 'md' : 'sm'
}

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return 0
  }
  return Math.floor(num)
}

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function resolveLabel(key: string, fallback: string): string {
  const translated = t(key)
  if (translated && translated !== key) {
    return translated
  }
  return fallback
}

// Сервер отдаёт названия серий готовым текстом по-китайски (more_name = «全部月赛»),
// мультиязычного шаблона под них нет. До правки на бэкенде подменяем известные строки
// ключом словаря; когда сервер начнёт слать ключ или шаблон — карта просто перестанет
// срабатывать, и её можно удалить.
const SERVER_TEXT_KEY_MAP: Record<string, string> = {
  全部月赛: 'UIMTT_SeriesMoreAllMonthly',
  全部月賽: 'UIMTT_SeriesMoreAllMonthly',
}

function resolveNameByUnityRule(rawName: string): string {
  if (!rawName) {
    return ''
  }

  const serverTextKey = SERVER_TEXT_KEY_MAP[rawName.trim()]
  if (serverTextKey) {
    const mappedByKey = t(serverTextKey)
    if (mappedByKey && mappedByKey !== serverTextKey) {
      return mappedByKey
    }
  }

  const mappedName = resolveTemplateTextByKey(rawName, getLocale())
  if (mappedName) {
    return mappedName
  }

  const translated = t(rawName)
  if (translated && translated !== rawName) {
    return translated
  }
  return rawName
}

function resolveStage(record: RawMttRecord, nowTimestamp: number): MttStage {
  const status = toSafeInt(record.status)
  if (status === MttMatchStatus.CREATED) {
    const applyStart = toTimestampMs(record.apply_start_time)
    return applyStart > 0 && nowTimestamp < applyStart ? 'upcoming' : 'registering'
  }
  if (status === MttMatchStatus.RUNNING) {
    const enTime = calcLateEndMs(record, toTimestampMs(record.start_time))
    return enTime > 0 && nowTimestamp < enTime ? 'late' : 'running'
  }
  return 'finished'
}

function resolveAction(stage: MttStage): { type: MttActionType; label: string } {
  switch (stage) {
    case 'upcoming':
      return { type: 'inProgress', label: t('mtt_btn_waiting_start') }
    case 'registering':
      return { type: 'register', label: t('MTT-Apply') }
    case 'late':
      return { type: 'late', label: t('mtt_btn_delay') }
    case 'running':
      return { type: 'join', label: t('mtt_btn_enter') }
    default:
      return { type: 'full', label: t('mtt_btn_sign_up_deadline') }
  }
}

function resolveStatusView(
  stage: MttStage,
  startAtMs: number,
  applyStartAtMs: number,
  lateEndAtMs: number,
  nowTimestamp: number,
): { label: string; theme: 'warning' | 'success' | 'danger' | 'default' } {
  const applyTarget = applyStartAtMs > 0 ? applyStartAtMs : startAtMs
  const lateTarget = lateEndAtMs > 0 ? lateEndAtMs : startAtMs
  switch (stage) {
    case 'upcoming':
      return { label: formatTodayAwareTimeLabel(applyTarget, nowTimestamp), theme: 'default' }
    case 'registering':
      return { label: t('MTT-Applying'), theme: 'success' }
    case 'late':
      return {
        label: `${t('UIMTTLatestRegister')} ${formatTodayAwareTimeLabel(lateTarget, nowTimestamp)}`,
        theme: 'warning',
      }
    case 'running':
      return {
        label: `${t('UIMTTLatestRegister')} ${formatTodayAwareTimeLabel(lateTarget, nowTimestamp)}`,
        theme: 'danger',
      }
    default:
      return { label: t('mtt_btn_sign_up_deadline'), theme: 'default' }
  }
}

function resolveMaxCount(record: RawMttRecord, participants: number): number {
  const seatCount = Number(record.seat_count ?? 0)
  const upperLimit = Number(record.limit_participants ?? 0)
  return Math.max(upperLimit, seatCount, participants, 1)
}
//TODO 未计算休息时间
function calcLateEndMs(record: RawMttRecord, startAtMs: number): number {
  const upblindIntervalSec = Number(record.upblind_interval ?? 0)
  const maxDelayApplyBl = Number(record.max_delay_apply_bl ?? 0)
  if (startAtMs <= 0 || upblindIntervalSec <= 0 || maxDelayApplyBl <= 1) return 0
  // 升盲截止前经过的升盲次数
  const upblindTimes = maxDelayApplyBl - 1
  let endMs = startAtMs + upblindIntervalSec * 1000 * upblindTimes
  // 期间会休息几次（每 break_interval 次升盲休息一次），每次休息 break_duration 分钟
  const breakInterval = Number(record.break_interval ?? 0)
  const breakDurationMin = Number(record.break_duration ?? 0)
  if (breakInterval > 0 && breakDurationMin > 0) {
    const breakTimes = Math.floor(upblindTimes / breakInterval)
    endMs += breakTimes * breakDurationMin * 60 * 1000
  }
  return endMs
}

function getDefaultGameIcon(category: MttCategory): string {
  return category === 'mahjong' ? mahjongMiniIcon : pokerMiniIcon
}
</script>

<template>
  <section class="mtt-content" :class="{ 'mtt-content--embedded': props.embedded }">
    <template v-if="renderGroups.length">
      <div v-for="group in renderGroups" :key="group.groupId" class="mtt-group">
        <div v-if="group.title || group.showViewAll" class="mtt-group__header">
          <span v-if="group.title" class="mtt-group__title">{{ group.title }}</span>
          <span v-else class="mtt-group__title mtt-group__title--empty"></span>
          <button
            v-if="group.showViewAll"
            type="button"
            class="mtt-group__toggle"
            :aria-expanded="group.expanded"
            @click="handleViewAll(group)"
          >
            <span class="mtt-group__toggle-text">
              {{ group.expanded ? t('UIMinePutAway') : group.moreName || t('UIHappyShop_ShowAll') }}
            </span>
            <VanIcon :name="group.expanded ? 'arrow-up' : 'arrow-down'" />
          </button>
        </div>

        <div v-if="group.layout === 'sm'" class="mtt-grid mtt-grid--sm">
          <MttCard
            v-for="item in group.displayItems"
            :key="item.id"
            size="sm"
            :item="item"
            @action="handleCardAction"
            @click="handleCardClick"
          />
        </div>

        <div v-else-if="group.layout === 'md'" class="mtt-grid mtt-grid--md">
          <MttCard
            v-for="item in group.displayItems"
            :key="item.id"
            size="md"
            :item="item"
            @action="handleCardAction"
            @click="handleCardClick"
          />
        </div>

        <div v-else class="mtt-grid mtt-grid--lg">
          <MttCard
            v-for="item in group.displayItems"
            :key="item.id"
            size="lg"
            :item="item"
            @action="handleCardAction"
            @click="handleCardClick"
          />
        </div>
      </div>
    </template>

    <div v-else class="empty-wrap">
      <VanIcon name="search" />
      <span>{{ t('UIMatchNoTournaments') }}</span>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.mtt-content {
  position: relative;
  z-index: 1;
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  padding: 0.1rem 0.38rem 0.5rem;
}

.mtt-content--embedded {
  max-height: none;
  overflow: visible;
}

.mtt-group {
  margin-bottom: 0.48rem;
}

.mtt-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0.4rem 0.32rem;
}

.mtt-group__title {
  min-width: 0;
  font-size: 0.4893rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;

  @include theme-light {
    color: var(--c-text);
  }
}

.mtt-group__title--empty {
  min-height: 0.5866rem;
}

.mtt-group__toggle {
  display: inline-flex;
  flex: 0 1 auto;
  align-items: center;
  justify-content: center;
  gap: 0.08rem;
  max-width: 50%;
  min-height: 0.64rem;
  // Зелёная пилюля как у кнопки 报名 на карточке: полупрозрачная плашка читалась
  // как заголовок, а не как элемент управления.
  padding: 0.08rem 0.28rem;
  border: none;
  border-radius: 0.5067rem;
  appearance: none;
  font-size: 0.32rem;
  font-weight: 700;
  color: #fff;
  background: var(--c-brand);
  cursor: pointer;
  line-height: 1.2;
  transition:
    filter 0.15s ease,
    transform 0.15s ease;

  &:active {
    filter: brightness(0.92);
    transform: scale(0.97);
  }

  // На светлом фоне белый текст на мятной заливке читается плохо — контраст даёт чёрный.
  // Именно theme-light-own: upstream-миксин theme-light выключен флагом и ничего не эмитит.
  @include theme-light-own {
    color: #000;
  }
}

.mtt-group__toggle-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mtt-grid {
  width: 100%;
}

.mtt-grid--sm {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.16rem;
}

.mtt-grid--md {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.13rem;
}

.mtt-grid--lg {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.empty-wrap {
  margin-top: 1.4933rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2133rem;
  font-size: 0.3467rem;
  color: rgba(255, 255, 255, 0.82);

  @include theme-light {
    color: rgba(34, 34, 34, 0.58);
  }
}
</style>

<style lang="scss">
:root[data-theme='light'] .mtt-content {
  .mtt-group__title {
    color: rgba(15, 8, 8, 0.85);
  }

  .mtt-group__toggle {
    color: rgba(34, 34, 34, 0.72);
  }

  .empty-wrap {
    color: rgba(34, 34, 34, 0.58);
  }
}
</style>
