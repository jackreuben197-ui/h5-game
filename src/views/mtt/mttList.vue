<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { MttItem, MttActionType } from '@/components/ListItem/MttCard.vue'
import type { MttIdInfoRecord, MttListRecord, MttSeriesInfoRecord } from '@/api/models/roomcenter'
import type { RoomRecord } from '@/api/models/roomcenter'
import type { FilterTabOption } from '@/components/Tabbar/FilterTabbar.vue'
import serviceIcon from '@/assets/icons/icon_server.png'
import walletIcon from '@/assets/icons/icon_wallet.png'
import pokerMiniIcon from '@/assets/icons/game_zone_mtt_mini.png'
import mahjongMiniIcon from '@/assets/icons/game_zone_mahjong_mini.png'
import { useMttListStore } from '@/stores/mttList'
import { useUserInfoStore } from '@/stores/userInfo'
import { getLocale, t } from '@/i18n'
import { checkIsShowForClubAndTribe, ROOM_ORIGIN_TYPE } from '@/utils/roomVisibility'
import {
  multiLanguageTemplateVersion,
  resolveTemplateTextByKey,
} from '@/utils/multiLanguageTemplate'
import { formatDateTime, formatTodayAwareTimeLabel, toTimestampMs } from '@/utils/time'
import { openGlobalCustomerServiceChat } from '@/components/GlobalCustomerServiceChat/channel'
import { showFailToast } from 'vant'

// 赛事级别状态（对应服务端 status 字段，与 Unity MttMatchStatus 枚举一致）
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
  layout: MttLayout
  items: MttViewItem[]
  defaultVisibleCount: number
}

interface MttRenderGroup extends MttGroup {
  expanded: boolean
  showViewAll: boolean
  displayItems: MttViewItem[]
}

const activeTab = ref<MttTabName>('all')
const mttListStore = useMttListStore()
const userInfoStore = useUserInfoStore()

// 分组展开状态：key=groupId，true=展开，false/undefined=收起。
const expandedGroupMap = ref<Record<string, boolean>>({})
const selectedClubId = computed(() => toSafeInt(userInfoStore.currentClub?.club_id))
const selectedTribeId = computed(() =>
  toSafeInt((userInfoStore.currentClub as Record<string, unknown> | null)?.tribe_id),
)

// 统一时间源：用于阶段判定和倒计时文案（与 Unity Update 思路一致）。
const nowMs = ref(Date.now())
let ticker: number | null = null

// MTT 页面专用 Tab：保留“全部/扑克/麻将”筛选，支持多语言文案回退。
const mttTabs = computed<FilterTabOption[]>(() => [
  { name: 'all', title: resolveLabel('UIMatch_GtO8YEdb', '全部') },
  { name: 'poker', title: resolveLabel('UIHomePokerArea', '扑克赛事') },
  {
    name: 'mahjong',
    title: resolveLabel('UIHomeMahjongArea', '麻将赛事'),
    disabled: true,
    disabledToast: '功能开发中',
  },
])

onMounted(() => {
  // 与首页共用同一个 MTT 数据源：先读缓存秒开，再静默刷新。
  mttListStore.bootstrapMttList()
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

// 原始数据：直接复用共享 store，去掉页面级 mock 数据源。
const sourceRecords = computed<RawMttRecord[]>(() => mttListStore.records as RawMttRecord[])

// 标准化后的卡片数据：融合 mtt/list 与 all/mtt/sng/ids 两个接口字段。
const normalizedItems = computed<MttViewItem[]>(() =>
  sourceRecords.value.map((record) => {
    // 依赖模板版本，映射更新后自动重算标题。
    void multiLanguageTemplateVersion.value
    const matchId = toSafeInt(record.match_id)
    const mttIdMeta = mttListStore.mttIdMetaMap[matchId]
    return normalizeRecordToViewItem(record, mttIdMeta, nowMs.value)
  }),
)

// 当前 tab 下的可见赛事：先按玩法筛选，再按 club/tribe 可见性筛选。
const filteredItems = computed<MttViewItem[]>(() => {
  return normalizedItems.value.filter((item) => {
    if (item.category === 'mahjong') {
      return false
    }
    if (activeTab.value !== 'all' && item.category !== activeTab.value) {
      return false
    }
    return checkMttVisibility(item, selectedClubId.value, selectedTribeId.value)
  })
})

// 分组结果：参考 Unity UpdateDataSource，按“赛事系列”组织，而不是按报名状态。
const mttGroups = computed<MttGroup[]>(() =>
  buildGroupsBySeries(filteredItems.value, mttListStore.mttSeriesMap),
)

// 渲染组：叠加展开/收起逻辑，不改你当前模板网格结构。
const renderGroups = computed<MttRenderGroup[]>(() =>
  mttGroups.value.map((group) => {
    const expanded = expandedGroupMap.value[group.groupId] === true
    // 非系列赛（no-series）不做展开/收起，始终全量展示。
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
  router.push({ name: 'mtt-detail', query: { id: String(item.id) } })
}

const router = useRouter()
function handleCardClick(item: MttItem): void {
  router.push({ name: 'mtt-detail', query: { id: String(item.id) } })
}

// 组头“查看全部/收起”。
function handleViewAll(group: MttRenderGroup): void {
  expandedGroupMap.value[group.groupId] = !(expandedGroupMap.value[group.groupId] === true)
}

// ======== 以下为纯逻辑函数：便于后续迁移到 service/store ========

function buildGroupsBySeries(
  items: MttViewItem[],
  seriesMap: Record<number, MttSeriesInfoRecord>,
): MttGroup[] {
  const groups: MttGroup[] = []
  // 先按开始时间排好基础顺序，后续各分组在此基础上再做局部排序。
  const sortedItems = [...items].sort((a, b) => a.startAtMs - b.startAtMs)

  // Step4 对齐 Unity：俱乐部来源（origin=CLUB）先展示。
  const clubItems = sortedItems.filter((item) => item.originType === ROOM_ORIGIN_TYPE.CLUB)
  if (clubItems.length) {
    groups.push(buildGroup('club', resolveLabel('UIGuildMain_ClubGame', '俱乐部赛事'), clubItems))
  }

  // 平台/联盟来源：有系列 -> 进系列组；无系列 -> 进无系列组。
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

  // Step7 对齐 Unity：系列组按系列创建时间倒序；组内按 pinned_time desc + start_time asc。
  const seriesIds = Object.keys(seriesBucketMap)
    .map((value) => Number(value))
    .filter((value) => value > 0)
    .sort((a, b) => compareSeriesOrder(a, b, seriesMap))

  seriesIds.forEach((seriesId) => {
    const seriesInfo = seriesMap[seriesId]
    const seriesName = resolveNameByUnityRule(toSafeString(seriesInfo?.name)) || `系列 #${seriesId}`
    const seriesItems = [...seriesBucketMap[seriesId]].sort(compareSeriesRoom)
    const seriesLayout = resolveSeriesLayoutByType(toSafeInt(seriesInfo?.type), seriesItems.length)
    groups.push(buildGroup(`series-${seriesId}`, seriesName, seriesItems, seriesLayout))
  })

  // Step8 对齐 Unity：无系列房间最后展示。按需求固定一行一张（lg），并隐藏标题。
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
): MttGroup {
  const layout = layoutOverride || (items.length <= 1 ? 'lg' : items.length <= 4 ? 'md' : 'sm')
  return {
    groupId,
    title,
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

function checkMttVisibility(item: MttViewItem, clubId: number, tribeId: number): boolean {
  const roomLike = {
    rid: 0,
    game_type: 0,
    poker_type: 0,
    sb: 0,
    origin_type: item.originType,
    relate_club_ids: item.relateClubIds,
    relate_tribe_club_list: item.relateTribeClubList,
  } as RoomRecord
  return checkIsShowForClubAndTribe(roomLike, clubId, tribeId)
}

function resolveCategory(record: RawMttRecord): MttCategory {
  const gameType = Number(record.game_type ?? 0)
  // 对齐 Unity CheckGameTypeMatch：扑克只认 0~3，麻将固定 6，其余归 unknown。
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
  // 开赛时间展示统一使用完整格式，便于和客户端对齐。
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

// 系列尺寸对齐 Unity：1=lg, 2=md, 3=sm。异常值再按数量兜底。
function resolveSeriesLayoutByType(seriesType: number, total: number): MttLayout {
  // 数量优先规则：
  // - 只有 1 个：无论原系列尺寸都按 lg 展示
  // - sm 系列只有 2 个：降级为 md
  // - md 系列保持 md（1 个已在上面处理成 lg）
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

// 对齐 Unity GameMatchItemView：先用“key -> 多语言文本”映射，没命中再回退原名。
function resolveNameByUnityRule(rawName: string): string {
  if (!rawName) {
    return ''
  }

  // 第 1 层：对齐 Unity GetRoomNameByKey（template_id -> 多语言名称）。
  const mappedName = resolveTemplateTextByKey(rawName, getLocale())
  if (mappedName) {
    return mappedName
  }

  // 第 2 层：尝试 txt 词条（兼容直接传语言 key 的场景）。
  const translated = t(rawName)
  if (translated && translated !== rawName) {
    return translated
  }
  return rawName
}

// 对齐 Unity GameMatchItemView：list 的 status 是赛事级别（CREATED/RUNNING/CLOSED），
// CREATED 内再比较 applyStartTimestamp 决定"等待开赛"还是"报名"。
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

function calcLateEndMs(record: RawMttRecord, startAtMs: number): number {
  const upblindIntervalSec = Number(record.upblind_interval ?? 0)
  const maxDelayApplyBl = Number(record.max_delay_apply_bl ?? 0)
  if (startAtMs <= 0 || upblindIntervalSec <= 0 || maxDelayApplyBl <= 1) return 0
  return startAtMs + upblindIntervalSec * 1000 * (maxDelayApplyBl - 1)
}

function getDefaultGameIcon(category: MttCategory): string {
  return category === 'mahjong' ? mahjongMiniIcon : pokerMiniIcon
}
function handleBack() {
  router.push('/home')
}
function handleOpenCustomerService() {
  const clubId = selectedClubId.value
  if (clubId <= 0) {
    showFailToast('当前俱乐部信息无效')
    return
  }

  openGlobalCustomerServiceChat({
    imServiceType: 1,
    clubId,
    tribeId: selectedTribeId.value,
  })
}
</script>

<template>
  <div class="mtt-list-page themeType2" @back="handleBack">
    <div class="bg-overlay"></div>

    <HeaderBack :title="t('UIHomeMttArea')">
      <template #right>
        <div class="action-wrap">
          <TopActionButton
            :name="t('UIGuildFund_RechargeText')"
            :icon="walletIcon"
            icon-alt="wallet"
            @click="router.push('/wallet')"
          />
          <TopActionButton
            v-if="userInfoStore.currentClub?.support_im_rid"
            :name="t('UIMineMain01')"
            :icon="serviceIcon"
            icon-alt="service"
            @click="handleOpenCustomerService"
          />
        </div>
      </template>
    </HeaderBack>
    <FilterTabbar v-model="activeTab" :tabs="mttTabs" />
    <section class="mtt-content">
      <template v-if="renderGroups.length">
        <div v-for="group in renderGroups" :key="group.groupId" class="mtt-group">
          <!-- 分组标题 -->
          <div v-if="group.title || group.showViewAll" class="mtt-group__header">
            <span v-if="group.title" class="mtt-group__title">{{ group.title }}</span>
            <span v-else class="mtt-group__title mtt-group__title--empty"></span>
            <span v-if="group.showViewAll" class="mtt-group__toggle" @click="handleViewAll(group)">
              {{ group.expanded ? t('UIMinePutAway') : t('UIHappyShop_ShowAll') }}
            </span>
          </div>

          <!-- SM: 一行3张 -->
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

          <!-- MD: 一行2张 -->
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

          <!-- LG: 一行1张 -->
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
  </div>
</template>

<style scoped lang="scss">
.mtt-list-page {
  position: relative;
  min-height: 100dvh;
  color: #fff;
  overflow: hidden;
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 15% 92%, rgba(255, 173, 212, 0.32), transparent 34%),
    radial-gradient(circle at 88% 84%, rgba(102, 227, 255, 0.28), transparent 34%),
    radial-gradient(circle at 50% 56%, rgba(255, 255, 255, 0.12), transparent 48%);
}

.action-wrap {
  display: flex;
  align-items: center;
  gap: 0.26rem;
}

.mtt-content {
  position: relative;
  z-index: 1;
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  padding: 0.4rem 0.38rem 2.5333rem;
  // background: rgba(255, 255, 255, 0.24);
  backdrop-filter: blur(0.3533rem) saturate(1.04);
}

/* ---- 分组 ---- */
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
  font-size: 0.4893rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.mtt-group__title--empty {
  min-height: 0.5866rem;
}

/* 收起热区与“查看全部”保持同宽，避免收起时点击区域变窄。 */
.mtt-group__toggle {
  display: inline-flex;
  justify-content: flex-end;
  width: 4em;
  font-size: 0.32rem;
  font-weight: 500;
  color: #ececec;
  cursor: pointer;
  text-align: right;
  line-height: 0.6rem;
}

/* ---- 网格布局 ---- */
.mtt-grid {
  width: 100%;
}

/* 3列 */
.mtt-grid--sm {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.16rem;
}

/* 2列 */
.mtt-grid--md {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.13rem;
}

/* 1列 */
.mtt-grid--lg {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

/* ---- 空状态 ---- */
.empty-wrap {
  margin-top: 1.4933rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2133rem;
  font-size: 0.3467rem;
  color: rgba(255, 255, 255, 0.82);
}
</style>
