<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRouter } from 'vue-router'
import { postStatsUserStatsAllApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import iconBoxClubT from '@/assets/icons/icon_box_club_t.png'
import iconBoxFriendT from '@/assets/icons/icon_box_friend_t.png'
import iconBoxDiamond from '@/assets/icons/icon_box_diamond.png'
import iconBoxBag from '@/assets/icons/icon_box_bag.png'
import iconBoxSetting from '@/assets/icons/icon_box_setting.png'
import iconFilter from '@/assets/icons/icon_filters.png'
import iconDropdown from '@/assets/icons/icon_dropdown.png'
import { useUserInfoStore } from '@/stores/userInfo'
import { formatUC } from '@/utils/roomVisibility'

const router = useRouter()
const userInfoStore = useUserInfoStore()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const gameTabs = ['德州', '奥马哈', '短牌']
const dateTabs = ['今天', '7天', '30天']
const selectedGameTab = ref(gameTabs[0])
const selectedDateTab = ref(dateTabs[0])
const showClubDropdown = ref(false)
const showCurrencyDropdown = ref(false)
const loading = ref(false)

// 缓存完整的接口响应数据
const responseCache = ref<Record<string, unknown> | null>(null)

// 玩家俱乐部列表（从 store 获取）
const clubs = computed(() => {
  const list = userInfoStore.clubList
  if (!list.length) {
    return ['All']
  }
  return ['All', ...list.map((club) => club.club_name || `Club ${club.club_id}`)]
})

// 当前选中的俱乐部索引（0 = All）
const selectedClubIndex = ref(0)

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
  { key: 'record', label: '战绩', icon: iconBoxClubT, route: '/mine/club-record' },
  { key: 'mtt', label: 'MTT', icon: iconBoxDiamond, route: '/mine/club-mtt' },
  { key: 'cowboy', label: 'Cowboy', icon: iconBoxFriendT, route: '/mine/club-cowboy' },
  { key: 'mahjong', label: 'Mahjong', icon: iconBoxBag, route: '/mine/club-mahjong' },
  // { key: 'mahjong-mtt', label: '麻将MTT战绩', icon: iconBoxSave },
  { key: 'data', label: '数据', icon: iconBoxSetting, route: '/mine/club-data' },
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

  return {
    filter_type: currencyTypes[selectedCurrencyIndex.value].value,
    game_types: gameTypes,
    poker_types: selectedGameTab.value === '短牌' ? [2] : [0],
    ...(selectedClubIndex.value !== 0 ? { club_id: userInfoStore.clubList[selectedClubIndex.value - 1]?.club_id } : {}),
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

  // one_day=今天, week_day=7天, all_day=30天
  let dayData: Record<string, unknown> | undefined
  switch (selectedDateTab.value) {
    case '今天':
      dayData = roomDataTotal?.one_day as Record<string, unknown> | undefined
      break
    case '7天':
      dayData = roomDataTotal?.week_day as Record<string, unknown> | undefined
      break
    case '30天':
      dayData = roomDataTotal?.all_day as Record<string, unknown> | undefined
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

async function fetchClubCareerSummary(): Promise<void> {
  loading.value = true
  try {
    const params = resolveRequestParams()
    const response = await postStatsUserStatsAllApi(params)
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载俱乐部生涯数据失败')
    }

    // 缓存完整响应数据
    responseCache.value = response.data as Record<string, unknown>
    // 从缓存中提取指标
    metrics.value = extractMetricsFromCache()
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载俱乐部生涯数据失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchClubCareerSummary()
})
</script>

<template>
  <div class="page-shell career-page" :style="backgroundStyle" @click="closePopup">
    <div class="page-top"></div>
    <HeaderBack title="生涯">
      <template #right>
        <div class="action-wrap">
          <TopActionButton
            name="全部"
            :icon="iconFilter"
            icon-alt="wallet"
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
          :key="tab"
          type="button"
          class="game-tab"
          :class="{ active: selectedGameTab === tab }"
          @click="selectGameTab(tab)"
        >
          {{ tab }}
        </button>
      </div>

      <section class="stats-card">
        <div class="date-tabs">
          <button
            v-for="tab in dateTabs"
            :key="tab"
            type="button"
            class="date-tab"
            :class="{ active: selectedDateTab === tab }"
            @click="selectDateTab(tab)"
          >
            {{ tab }}
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
  padding: calc(env(safe-area-inset-top) + 0.52rem) 0 0.8rem;
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
  margin-top: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.72rem;
  padding: 0 0.16rem;
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
  margin-top: 0.4rem;
  border-radius: 0.56rem;
  padding: 0.34rem 0.44rem 0.28rem;
  background: rgba(42, 26, 43, 0.34);
  backdrop-filter: blur(0.03rem);
}

.date-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.1rem;
  padding: 0.06rem;
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
  padding: 0.2rem 0;

  &.active {
    background: rgba(255, 255, 255, 0.16);
    font-weight: 700;
    opacity: 1;
  }
}

.metric-row {
  margin-top: 0.36rem;
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
    font-size: 0.57rem;
    line-height: 1.05;
    color: #fff;
  }

  .label {
    margin-top: 0.05rem;
    font-size: 0.24rem;
    color: rgba(255, 255, 255, 0.58);
  }
}

.menu-card {
  margin-top: 0.5rem;
  border-radius: 0.42rem;
  background: rgba(31, 24, 46, 0.34);
  backdrop-filter: blur(0.03rem);
  padding: 0 0.36rem;
}

.menu-item {
  width: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.28rem 0;
  border-bottom: 0.02rem solid rgba(255, 255, 255, 0.16);

  &:last-child {
    border-bottom: 0;
  }
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 0.24rem;
}

.icon-box {
  width: 0.62rem;
  height: 0.62rem;
  border-radius: 0.22rem;
  background: rgba(255, 255, 255, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 0.42rem;
    height: 0.42rem;
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
