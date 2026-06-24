<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { showFailToast } from 'vant'
import { useRouter } from 'vue-router'
import { postStatsUserStatsAllApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import iconData from '@/assets/icons/icon_data.svg'
import iconRecord from '@/assets/icons/icon_record.svg'
import iconMtt from '@/assets/icons/icon_mtt.svg'
import iconCowboy from '@/assets/icons/icon_cowboy.svg'
import iconMahjong from '@/assets/icons/icon_mahjong.svg'
import iconFilter from '@/assets/icons/icon_filters.png'
import iconDropdown from '@/assets/icons/icon_dropdown.png'
import { useUserInfoStore } from '@/stores/userInfo'
import { useGameStore } from '@/stores/game'
import { formatUC } from '@/utils/roomVisibility'
import { showGameToast } from '@/components/Toast'
import { localStore } from '@/utils/localStore'
import { userCache } from '@/utils/userCache'
import { USER_STORE_CAREER } from '@/utils/indexedDB'
import { t } from '@/i18n'

const CAREER_CLUB_STORE_KEY = 'CAREER_SELECTED_CLUB_ID'
const CAREER_CLUB_ALL = 'all'

const router = useRouter()
const userInfoStore = useUserInfoStore()
const gameStore = useGameStore()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
interface TabItem {
  label: string
  key: string
}

const gameTabs: TabItem[] = [
  { label: 'NLH', key: 'nlh' },
  { label: 'PLO', key: 'plo' },
  { label: '6+', key: '6+' },
]
const dateTabs: TabItem[] = [
  { label: '今天', key: 'today' },
  { label: '7天', key: 'week' },
  { label: '30天', key: 'month' },
]
const selectedGameTab = ref(gameTabs[0].key)
const selectedDateTab = ref(dateTabs[0].key)
const showClubDropdown = ref(false)
const showCurrencyDropdown = ref(false)
const loading = ref(false)

// 缓存完整的接口响应数据
const responseCache = ref<Record<string, unknown> | null>(null)

// 玩家俱乐部列表（从 store 获取）
const clubs = computed(() => {
  const list = userInfoStore.clubList
  if (!list.length) {
    return ['全部']
  }
  return ['全部', ...list.map((club) => club.club_name || `Club ${club.club_id}`)]
})

// 当前选中的俱乐部索引（0 = 全部）
const selectedClubIndex = ref(0)

// 右上角按钮显示的俱乐部名称（默认"全部"）
const selectedClubLabel = computed(() => {
  if (selectedClubIndex.value === 0) {
    return '全部'
  }
  const club = userInfoStore.clubList[selectedClubIndex.value - 1]
  return club?.club_name || `Club ${club?.club_id ?? ''}`
})

// 持久化：从 localStorage 恢复 / 写入用户在生涯页上选择的俱乐部 id。
function restoreSelectedClub(): void {
  const stored = localStore.getItem<string>(CAREER_CLUB_STORE_KEY, null)
  if (!stored || stored === CAREER_CLUB_ALL) {
    selectedClubIndex.value = 0
    return
  }
  const idx = userInfoStore.clubList.findIndex((club) => String(club.club_id) === stored)
  selectedClubIndex.value = idx >= 0 ? idx + 1 : 0
}

function persistSelectedClub(): void {
  if (selectedClubIndex.value === 0) {
    localStore.setItem(CAREER_CLUB_STORE_KEY, CAREER_CLUB_ALL)
    return
  }
  const club = userInfoStore.clubList[selectedClubIndex.value - 1]
  if (club?.club_id != null) {
    localStore.setItem(CAREER_CLUB_STORE_KEY, String(club.club_id))
  }
}

// 货币类型定义：1-联盟币 2-USDT 3-记分牌 4-钻石
const currencyTypes = [
  { label: 'UC', value: 1 },
  // { label: 'USDT', value: 2 },
  { label: '记分牌', value: 3 },
  { label: '钻石', value: 4 },
] as const
const selectedCurrencyIndex = ref(0)

interface CareerMetric {
  label: string
  value: string
}

interface CareerMenuItem {
  key: string
  label: string
  icon: string
  route?: string
}

const metrics = ref<CareerMetric[]>([
  { label: '局数', value: '0' },
  { label: '手数', value: '0' },
  { label: '入池率', value: '0%' },
  { label: '盈亏', value: '0' },
])

const menuList: CareerMenuItem[] = [
  { key: 'record', label: '战绩', icon: iconRecord, route: '/mine/career/club/record' },
  { key: 'mtt', label: 'MTT', icon: iconMtt, route: '/mine/career/club/mtt' },
  { key: 'cowboy', label: '牛仔', icon: iconCowboy, route: '/mine/career/club/cowboy' },
  { key: 'mahjong', label: '麻将', icon: iconMahjong, route: '/mine/career/club/mahjong' },
  { key: 'mahjong-mtt', label: '麻将MTT战绩', icon: iconMahjong },
  { key: 'data', label: '数据', icon: iconData, route: '/mine/career/club/data' },
]

function selectGameTab(tab: string): void {
  selectedGameTab.value = tab
  void fetchClubCareerSummary()
}

// 切换日期 tab 更新选中状态并刷新指标显示
function selectDateTab(tab: string): void {
  selectedDateTab.value = tab
  metrics.value = extractMetricsFromCache()
}

function toggleClubDropdown(): void {
  showClubDropdown.value = !showClubDropdown.value
  showCurrencyDropdown.value = false
}

function toggleCurrencyDropdown(): void {
  showCurrencyDropdown.value = !showCurrencyDropdown.value
  showClubDropdown.value = false
}

function closePopup(): void {
  showClubDropdown.value = false
  showCurrencyDropdown.value = false
}

function selectClub(index: number): void {
  selectedClubIndex.value = index
  showClubDropdown.value = false
  persistSelectedClub()
  void fetchClubCareerSummary()
}

function selectCurrency(index: number): void {
  selectedCurrencyIndex.value = index
  showCurrencyDropdown.value = false
  void fetchClubCareerSummary()
}

function handleMenuClick(item: CareerMenuItem): void {
  if (!item.route) {
    return
  }
  if (item.key === 'cowboy' || item.key == 'mahjong') {
    showGameToast('功能开发中')
    return
  }
  // 将本页面上选中的俱乐部同步到全局 currentClubId，保证子页面以当前选择为准；
  // "全部" 时清空，子页面接口侧（withClubId / 可选链）会自然走"不限俱乐部"。
  if (selectedClubIndex.value === 0) {
    userInfoStore.currentClubId = ''
  } else {
    const club = userInfoStore.clubList[selectedClubIndex.value - 1]
    if (club?.club_id != null) {
      userInfoStore.setCurrentClubById(club.club_id)
    }
  }
  void router.push(item.route)
}

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

/**
 * 根据当前选中的 game/tab 解析请求参数
 */
function resolveRequestParams() {
  // game_types: 0-德州 1-OMAHA4 2-OMAHA5 3-OMAHA6 4-fantasy 5-牛仔 6-麻将 7-其他
  let gameTypes: number[]
  if (selectedGameTab.value === '奥马哈') {
    gameTypes = [1, 2, 3]
  } else {
    // 德州（默认）或短牌都传 [0]
    gameTypes = [0]
  }

  // 对齐 Unity CareerRecordPart：「全部」必须显式传 club_id=0，省略字段时服务端会回上一次的俱乐部数据。
  const clubId =
    selectedClubIndex.value === 0
      ? 0
      : userInfoStore.clubList[selectedClubIndex.value - 1]?.club_id ?? 0

  return {
    filter_type: currencyTypes[selectedCurrencyIndex.value].value,
    game_types: gameTypes,
    poker_types: selectedGameTab.value === '短牌' ? [2] : [0],
    club_id: clubId,
  }
}

/**
 * 从缓存的响应数据中提取当前选中 date tab 的指标
 */
function extractMetricsFromCache(): CareerMetric[] {
  const data = responseCache.value
  if (!data) {
    return [
      { label: '局数', value: '0' },
      { label: '手数', value: '0' },
      { label: '入池率', value: '0%' },
      { label: '盈亏', value: '0' },
    ]
  }

  const roomDataTotal = data.room_data_total as Record<string, unknown> | undefined

  // one_day=今天, week_day=7天, mon_day==30天, all_day=生涯
  let dayData: Record<string, unknown> | undefined
  switch (selectedDateTab.value) {
    case 'today':
      dayData = roomDataTotal?.one_day as Record<string, unknown> | undefined
      break
    case 'week':
      dayData = roomDataTotal?.week_day as Record<string, unknown> | undefined
      break
    case 'month':
      dayData = roomDataTotal?.mon_day as Record<string, unknown> | undefined
      break
  }

  const totalGameCnt = toSafeNumber(dayData?.total_game_cnt)
  const totalHand = toSafeNumber(dayData?.total_hand)
  const inPoolCnt = toSafeNumber(dayData?.in_pool_cnt)
  const totalEarn = toSafeNumber(dayData?.total_earn)

  return [
    { label: '局数', value: `${totalGameCnt}` },
    { label: '手数', value: totalHand.toLocaleString('en-US') },
    {
      label: '入池率',
      value: totalHand > 0 ? `${Math.min(100, Math.round((inPoolCnt / totalHand) * 100))}%` : '0%',
    },
    { label: '盈亏', value: `${formatUC(totalEarn)}` },
  ]
}

// ── 缓存（IndexedDB career）──────────────────────────────────────────────────
// store=USER_STORE_CAREER，key = `${clubId}_home_${currency}_${gameTab}`：
//   clubId = 0(全部) / 俱乐部 id；currency = 1(UC)/3(记分牌)/4(钻石)；gameTab = nlh|plo|6+。
// 接口返回 one_day/week_day/mon_day 全部时间窗的数据，所以 date tab 不进 key。
function homeCacheKey(): string {
  const clubId =
    selectedClubIndex.value === 0
      ? 0
      : userInfoStore.clubList[selectedClubIndex.value - 1]?.club_id ?? 0
  const currency = currencyTypes[selectedCurrencyIndex.value].value
  return `${clubId}_home_${currency}_${selectedGameTab.value}`
}

function homeCache() {
  return userCache(gameStore.loginUserId)
}

async function fetchClubCareerSummary(): Promise<void> {
  const key = homeCacheKey()
  const cached = await homeCache().get<Record<string, unknown>>(USER_STORE_CAREER, key)
  // 请求期间 tab 被切换：丢弃此次缓存。
  if (key !== homeCacheKey()) return

  if (cached) {
    loading.value = false
    responseCache.value = cached
    metrics.value = extractMetricsFromCache()
    // 后台静默刷新覆盖缓存
    void requestSummary(key, true)
    return
  }

  await requestSummary(key, false)
}

async function requestSummary(key: string, silent: boolean): Promise<void> {
  if (!silent) loading.value = true
  try {
    const params = resolveRequestParams()
    const response = await postStatsUserStatsAllApi(params)
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载俱乐部生涯数据失败')
    }
    if (key !== homeCacheKey()) return

    const data = response.data as Record<string, unknown>
    responseCache.value = data
    metrics.value = extractMetricsFromCache()
    void homeCache().put(USER_STORE_CAREER, key, data)
  } catch (error) {
    if (!silent) {
      const message = error instanceof Error ? error.message : '加载俱乐部生涯数据失败'
      showFailToast(message)
    }
  } finally {
    if (!silent) loading.value = false
  }
}

// 俱乐部列表异步加载时，按缓存的 club_id 重新定位选中项。
watch(
  () => userInfoStore.clubList,
  () => {
    restoreSelectedClub()
  },
)

onMounted(() => {
  restoreSelectedClub()
  void fetchClubCareerSummary()
})
</script>

<template>
  <div class="page-shell career-page" :style="backgroundStyle" @click="closePopup">
    <div class="page-top"></div>
    <HeaderBack :title="t('PageMineClubCareer')" extra-padding>
      <template #right>
        <div class="action-wrap">
          <TopActionButton
            :name="selectedClubLabel"
            :icon="iconFilter"
            icon-alt="wallet"
            class="club-action-btn"
            @click.stop="toggleClubDropdown"
          />
          <TopActionButton
            :name="currencyTypes[selectedCurrencyIndex].label"
            :icon="iconDropdown"
            icon-alt="service"
            @click.stop="toggleCurrencyDropdown"
          />
          <div v-if="showClubDropdown" class="club-dropdown">
            <button
              v-for="(club, index) in clubs"
              :key="club"
              type="button"
              class="club-option"
              :class="{ active: selectedClubIndex === index }"
              @click="selectClub(index)"
            >
              {{ club }}
            </button>
          </div>
          <div v-if="showCurrencyDropdown" class="currency-dropdown">
            <button
              v-for="(currency, index) in currencyTypes"
              :key="currency.value"
              type="button"
              class="currency-option"
              :class="{ active: selectedCurrencyIndex === index }"
              @click="selectCurrency(index)"
            >
              {{ currency.label }}
            </button>
          </div>
        </div>
      </template>
    </HeaderBack>

    <div class="content-wrap">
      <div class="game-tabs">
        <button
          v-for="tab in gameTabs"
          :key="tab.key"
          type="button"
          class="game-tab"
          :class="{ active: selectedGameTab === tab.key }"
          @click="selectGameTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <section class="stats-card">
        <div class="date-tabs">
          <button
            v-for="tab in dateTabs"
            :key="tab.key"
            type="button"
            class="date-tab"
            :class="{ active: selectedDateTab === tab.key }"
            @click="selectDateTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="metric-row">
          <!-- <p v-if="loading" class="metric-status">加载中...</p> -->
          <div v-for="item in metrics" :key="item.label" class="metric-item">
            <div class="value">{{ item.value }}</div>
            <div class="label">{{ item.label }}</div>
          </div>
        </div>
      </section>

      <section class="menu-card">
        <button
          v-for="item in menuList"
          :key="item.key"
          type="button"
          class="menu-item"
          @click="handleMenuClick(item)"
        >
          <div class="menu-left">
            <div class="icon-box">
              <img :src="item.icon" :alt="item.label" />
            </div>
            <span class="menu-label">{{ item.label }}</span>
          </div>
          <span class="menu-arrow">›</span>
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.career-page {
  position: relative;
  height: 100dvh;
  padding: 0 0 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

// .page-top {
//   position: relative;
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
// }

.title-wrap {
  display: flex;
  align-items: center;
  gap: 0.12rem;
  cursor: pointer;

  .back {
    font-size: 0.7rem;
    line-height: 1;
    opacity: 0.95;
  }

  .title {
    font-size: 0.8rem;
    line-height: 1.2;
    font-weight: 500;
  }
}

.filters {
  display: flex;
  gap: 0.2rem;
}

.chip {
  border: 0;
  border-radius: 0.45rem;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 0.24rem;
  line-height: 1.2;
  padding: 0.14rem 0.22rem;
  min-width: 1.32rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .arrow {
    font-size: 0.24rem;
    line-height: 1;
    margin-left: 0.1rem;
    opacity: 0.9;
  }
}

.action-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.26rem;
}

// 让俱乐部按钮中的长俱乐部名以省略号显示，避免溢出。
.club-action-btn :deep(.action-label) {
  max-width: 0.96rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.club-dropdown {
  position: absolute;
  left: 0;
  top: 0.86rem;
  width: 2.56rem;
  border-radius: 0.34rem;
  background: rgba(46, 35, 51, 0.85);
  backdrop-filter: blur(0.22rem);
  border: 0.02rem solid rgba(255, 255, 255, 0.16);
  overflow: hidden;
  z-index: 5;
}

.club-option {
  width: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  text-align: left;
  padding: 0.2rem 0.26rem;
  font-size: 0.3rem;
  border-bottom: 0.02rem solid rgba(255, 255, 255, 0.16);

  &.active {
    background: rgba(255, 255, 255, 0.16);
    font-weight: 700;
  }

  &:last-child {
    border-bottom: 0;
  }
}

.currency-option {
  width: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  text-align: left;
  padding: 0.2rem 0.26rem;
  font-size: 0.3rem;
  border-bottom: 0.02rem solid rgba(255, 255, 255, 0.16);

  &.active {
    background: rgba(255, 255, 255, 0.16);
    font-weight: 700;
  }

  &:last-child {
    border-bottom: 0;
  }
}

.currency-dropdown {
  position: absolute;
  right: 0;
  top: 0.86rem;
  width: 2.56rem;
  border-radius: 0.34rem;
  background: rgba(46, 35, 51, 0.85);
  backdrop-filter: blur(0.22rem);
  border: 0.02rem solid rgba(255, 255, 255, 0.16);
  overflow: hidden;
  z-index: 5;
}

.content-wrap {
  padding: 0 0.44rem;
}

.game-tabs {
  margin-top: 0.48rem;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.game-tab {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.42rem;
  line-height: 1.1;
  padding: 0.06rem 0;

  &.active {
    color: #fff;
    border-bottom: 0.03rem solid rgba(255, 255, 255, 0.92);
  }
}

.stats-card {
  margin-top: 0.45rem;
  border-radius: 0.7rem;
  padding: 0.34rem 0.6rem 0.32rem;
  background: rgba(42, 26, 43, 0.34);
  backdrop-filter: blur(0.03rem);
}

.date-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.1rem;
  padding: 0;
  border-radius: 0.68rem;
  background: rgba(255, 255, 255, 0.2);
}

.date-tab {
  border: 0;
  border-radius: 0.62rem;
  background: transparent;
  color: #f9f9f9;
  opacity: 0.86;
  font-size: 0.42rem;
  padding: 0.36rem 0;

  &.active {
    background: rgba(255, 255, 255, 0.16);
    font-weight: 700;
    opacity: 1;
  }
}

.metric-row {
  margin-top: 0.3rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.1rem;
}

.metric-status {
  grid-column: 1 / -1;
  text-align: center;
  font-size: 0.3rem;
  opacity: 0.78;
  margin: 0;
}

.metric-item {
  text-align: center;

  .value {
    font-size: 0.54rem;
    line-height: 1.05;
    font-weight: 400;
    color: #fff;
  }

  .label {
    font-size: 0.221rem;
    color: rgba(255, 255, 255, 0.58);
  }
}

.menu-card {
  margin-top: 0.5rem;
  border-radius: 0.42rem;
  background: rgba(31, 24, 46, 0.34);
  backdrop-filter: blur(0.03rem);
  padding: 0.2rem 0.4rem;
}

.menu-item {
  width: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.18rem 0.1rem;
  margin: 0.05rem 0;
  border-bottom: 0.02rem solid rgba(255, 255, 255, 0.16);

  &:last-child {
    border-bottom: 0;
  }
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.icon-box {
  width: 0.62rem;
  height: 0.62rem;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 1rem;
    height: 1rem;
  }
}

.menu-label {
  font-size: 0.42rem;
  line-height: 1.2;
}

.menu-arrow {
  font-size: 0.7rem;
  line-height: 1;
  color: rgba(255, 255, 255, 0.88);
}
</style>
