<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { showFailToast } from 'vant'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { getMemberRouteContext } from './clubMemberRoute'
import { postGuildDataVipInfoApi, postStatsClubDataStatsVipUserApi } from '@/api/stats'
import { postOrgClubUserInfoApi } from '@/api/org'
import type { OrgClubUserInfoData } from '@/api/models/org'
import type { GuildDataVipInfoTotalData } from '@/api/models/stats'
import imgAvatar from '@/assets/images/default_avatar.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgBalance from '@/assets/icons/icon_credit_chip.png'
import imgCards from '@/assets/icons/icon_cards.png'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { useUserInfoStore } from '@/stores/userInfo'
import { formatUC } from '@/utils/roomVisibility'

const userInfoStore = useUserInfoStore()
const route = useRoute()
const context = computed(() => getMemberRouteContext(route))

// filter_type: 1=UC, 2=USDT, 3=Chips
const filterType = ref<number>(1)

// Game type: 0=all, 1=NLH, 2=PLO, 3=6+
const gameType = ref<number>(0)

const gameTypeTabs = computed(() => [
  { value: 0, label: '全部' },
  { value: 1, label: '德州' },
  { value: 2, label: '奥马哈' },
  { value: 3, label: '短牌' },
])

const filterTypeOptions = computed(() => [
  { value: 1, label: 'UC' },
  { value: 3, label: '记分牌' },
])

// Profile data
const displayName = computed(() => context.value.name || '成员')
const displayUid = computed(() => context.value.uid || '--')
const displayAvatar = computed(() => imgAvatar)
const badgeLabel = computed(() => '代理')

// Player balance from API (same as ClubMemberDetailView)
const memberProfile = ref<OrgClubUserInfoData | null>(null)
const loadingProfile = ref(false)

const chips = computed(() => {
  const userInfo = memberProfile.value?.user_info as Record<string, unknown> | undefined
  return formatAmount(userInfo?.gold)
})

const balance = computed(() => {
  return formatAmount(memberProfile.value?.club_gold_credit)
})

const diamond = computed(() => {
  return formatCount(context.value.diamonds)
})

// Offline member data
const offlineUserCount = ref(0)
const offlineGoldTotal = ref(0)
const offlineUsdtTotal = ref(0)
const loadingVipUser = ref(false)

// Raw stats data from API (all game types × all time ranges)
const rawStatsList = ref<GuildDataVipInfoTotalData[]>([])
const loadingStats = ref(false)

function formatCount(value: unknown): string {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0'
  return Math.floor(num).toLocaleString('en-US')
}

function formatAmount(value: unknown): string {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0'
  return formatUC(num)
}

function getMemberId(): number {
  const raw = Number(context.value.memberId)
  return Number.isFinite(raw) ? raw : 0
}

// Fetch player profile (chips, balance, diamond)
async function fetchPlayerProfile(): Promise<void> {
  const memberId = getMemberId()
  const clubId = Number(userInfoStore.currentClub?.club_id ?? 0)
  if (!memberId || !clubId) return

  loadingProfile.value = true
  try {
    const queryUid = Number(context.value.uid) || 0
    const response = await postOrgClubUserInfoApi({
      club_id: clubId,
      user_id: memberId,
      user_random_id: queryUid || undefined,
    })
    if (response.code !== 0 || !response.data) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '获取玩家信息失败')
    }
    memberProfile.value = response.data
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取玩家信息失败'
    showFailToast(message)
  } finally {
    loadingProfile.value = false
  }
}

// Fetch offline member data (once)
async function fetchVipUserData(): Promise<void> {
  const memberId = getMemberId()
  if (!memberId) return

  loadingVipUser.value = true
  try {
    const response = await postStatsClubDataStatsVipUserApi({ vip_user_id: memberId })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '获取VIP用户数据失败')
    }
    const info = response.data?.info
    if (info) {
      offlineUserCount.value = Number(info.user_count ?? 0)
      offlineGoldTotal.value = Number(info.user_gold_tribe_total ?? 0)
      offlineUsdtTotal.value = Number(info.user_gold_usdt_total ?? 0)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取VIP用户数据失败'
    showFailToast(message)
  } finally {
    loadingVipUser.value = false
  }
}

// Fetch stats data (once, then filter locally by game_type)
async function fetchStatsData(): Promise<void> {
  const memberId = getMemberId()
  if (!memberId) {
    rawStatsList.value = []
    return
  }

  loadingStats.value = true
  try {
    const response = await postGuildDataVipInfoApi({
      user_id: memberId,
      filter_type: filterType.value,
      game_types: [0], // Always request all (0=all) to get all game types
      time_zone: Number(userInfoStore.currentClub?.time_zone ?? 0),
    })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '获取统计数据失败')
    }

    rawStatsList.value = response.data?.list ?? []
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取统计数据失败'
    showFailToast(message)
    rawStatsList.value = []
  } finally {
    loadingStats.value = false
  }
}

// Group raw data by game_type, then organize by filter_time (0=总额, 1=今天, 7=7天)
const statsRows = computed(() => {
  const filtered = rawStatsList.value.filter((item) => item.game_type === gameType.value)
  const gameTypeNames: Record<number, string> = {
    0: '全部',
    1: '德州',
    2: '奥马哈',
    3: '短牌',
    4: 'Fantasy',
    5: '麻将',
  }

  const result: Array<{
    gameType: number
    gameTypeName: string
    total: { hand_num: number; profit: number; fee: number }
    today: { hand_num: number; profit: number; fee: number }
    sevenDays: { hand_num: number; profit: number; fee: number }
  }> = []

  for (const item of filtered) {
    const ft = Number(item.filter_time ?? 0)
    const entry = result.find((r) => r.gameType === (item.game_type ?? 0))
    const data = {
      hand_num: Number(item.hand_num ?? 0),
      profit: Number(item.profit ?? 0),
      fee: Number(item.fee ?? 0),
    }
    if (!entry) {
      result.push({
        gameType: item.game_type ?? 0,
        gameTypeName: gameTypeNames[item.game_type ?? 0] || '未知',
        total: data,
        today: { hand_num: 0, profit: 0, fee: 0 },
        sevenDays: { hand_num: 0, profit: 0, fee: 0 },
      })
    } else if (ft === 0) {
      entry.total = data
    } else if (ft === 1) {
      entry.today = data
    } else if (ft === 7) {
      entry.sevenDays = data
    }
  }

  return result
})

const displayBalance = computed(() => {
  if (filterType.value === 2) {
    return formatAmount(offlineUsdtTotal.value)
  }
  return formatAmount(offlineGoldTotal.value)
})

function onFilterTypeChange(event: Event): void {
  const value = Number((event.target as HTMLSelectElement).value)
  if (Number.isFinite(value)) {
    filterType.value = value
    void fetchStatsData()
  }
}

function switchGameType(type: number): void {
  gameType.value = type
}

onMounted(() => {
  void Promise.all([fetchPlayerProfile(), fetchVipUserData(), fetchStatsData()])
})
</script>

<template>
  <div class="page-shell sub-bg" :style="{ backgroundImage: `url(${mainBgUrl})` }">
    <HeaderBack title="代理数据" />

    <section class="glass profile-card">
      <img class="avatar" :src="displayAvatar" :alt="`${displayName}头像`" />
      <div class="name-wrap">
        <p class="name">{{ displayName }}</p>
        <span class="uid">ID {{ displayUid }}</span>
        <small class="badge">{{ badgeLabel }}</small>
      </div>
      <div class="coin">
        <div>{{ chips }} <img class="coin-icon" :src="imgChips" alt="" /></div>
        <div>{{ balance }} <img class="coin-icon" :src="imgBalance" alt="" /></div>
        <div>{{ diamond }} <img class="coin-icon" :src="imgDiamond" alt="" /></div>
      </div>
    </section>

    <section class="offline-head">
      <div>
        <p>下线成员数</p>
        <strong v-if="loadingVipUser">--</strong>
        <strong v-else>{{ offlineUserCount }}</strong>
      </div>
      <div>
        <p>下线UC</p>
        <strong style="float: right">
          {{ displayBalance }} <img class="coin-icon" :src="imgChips" alt="" />
        </strong>
      </div>
    </section>

    <section class="filter-bar">
      <div class="tabs-row glass">
        <button
          v-for="tab in gameTypeTabs"
          :key="tab.value"
          :class="{ active: gameType === tab.value }"
          @click="switchGameType(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="filter-select-wrap">
        <select :value="filterType" @change="onFilterTypeChange">
          <option v-for="opt in filterTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </section>

    <section class="cards">
      <p v-if="loadingStats" class="stats-loading">加载中...</p>
      <template v-else>
        <template v-for="row in statsRows" :key="row.gameType">
          <article class="glass stat-card">
            <div class="left">
              <img :src="imgCards" alt="" />
              手数
            </div>
            <div class="metric">
              <b>{{ formatCount(row.total.hand_num) }}</b>
              <span>总额</span>
            </div>
            <div class="metric">
              <b>{{ formatCount(row.today.hand_num) }}</b>
              <span>今天</span>
            </div>
            <div class="metric">
              <b>{{ formatCount(row.sevenDays.hand_num) }}</b>
              <span>7天</span>
            </div>
          </article>
          <article class="glass stat-card">
            <div class="left">
              <img :src="imgCards" alt="" />
              盈利
            </div>
            <div class="metric">
              <b>{{ formatAmount(row.total.profit) }}</b>
              <span>总额</span>
            </div>
            <div class="metric">
              <b>{{ formatAmount(row.today.profit) }}</b>
              <span>今天</span>
            </div>
            <div class="metric">
              <b>{{ formatAmount(row.sevenDays.profit) }}</b>
              <span>7天</span>
            </div>
          </article>
          <article class="glass stat-card">
            <div class="left">
              <img :src="imgCards" alt="" />
              服务费
            </div>
            <div class="metric">
              <b>{{ formatAmount(row.total.fee) }}</b>
              <span>总额</span>
            </div>
            <div class="metric">
              <b>{{ formatAmount(row.today.fee) }}</b>
              <span>今天</span>
            </div>
            <div class="metric">
              <b>{{ formatAmount(row.sevenDays.fee) }}</b>
              <span>7天</span>
            </div>
          </article>
        </template>
      </template>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:math';

@function figma-rem($px) {
  @return math.div($px, 37.5) * 1rem;
}

.sub-bg {
  height: 100dvh;
  background-size: cover;
}

.glass {
  border-radius: figma-rem(39.59);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(figma-rem(6));
}

.profile-card {
  min-height: figma-rem(105);
  padding: figma-rem(4.751) figma-rem(21.854);
  display: flex;
  align-items: center;
  gap: figma-rem(14.253);
}

.avatar {
  width: figma-rem(65.92);
  height: figma-rem(66.316);
  border-radius: 50%;
  object-fit: cover;
}

.name-wrap {
  flex: 1;
}

.name {
  margin: 0;
  color: #fff;
  font-size: figma-rem(18.44);
  font-weight: 700;
}

.uid {
  color: rgba(255, 255, 255, 0.86);
  font-size: figma-rem(9.623);
}

.badge {
  display: block;
  margin-top: figma-rem(7.601);
  color: #7ed0ff;
  font-size: figma-rem(10.5);
}

.coin {
  color: #f9f9f9;
  align-items: center;
  gap: figma-rem(5.07);
  font-size: figma-rem(14.886);
  font-weight: 700;
}

.coin div {
  display: block;
  clear: both;
  float: right;
}

.coin-icon {
  width: figma-rem(14);
  height: figma-rem(11);
}

.coin img:not(.coin-icon) {
  width: figma-rem(18);
  height: figma-rem(14.44);
  border-radius: 0;
}

.offline-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  color: #fff;
  font-size: figma-rem(15.203);

  p,
  strong {
    margin: 0;
  }

  div {
    p {
      font-size: figma-rem(18);
    }
    strong {
      font-size: figma-rem(16);
    }
  }
}

.filter-bar {
  min-height: figma-rem(54.16);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: figma-rem(8);
}

.tabs-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: figma-rem(2);
  flex: 1;
  min-height: figma-rem(54.16);
  background: rgba(255, 255, 255, 0.16);
  border-radius: figma-rem(30);
  padding: figma-rem(1.5);
}

.tabs-row button {
  border: 0;
  background: transparent;
  color: #fff;
  border-radius: figma-rem(51.915);
  font-size: figma-rem(13.574);
  min-height: figma-rem(54.16);

  &.active {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.8);
  }
}

.filter-select-wrap {
  flex-shrink: 0;
}

.filter-select-wrap select {
  border: 1px solid rgba(255, 255, 255, 0.65);
  background: rgba(255, 255, 255, 0.2);
  border-radius: figma-rem(51.915);
  color: #fff;
  font-size: figma-rem(12);
  padding: figma-rem(4) figma-rem(10);
  min-width: figma-rem(70);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L4 4L7 1' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right figma-rem(8) center;
  padding-right: figma-rem(24);
}

.filter-select-wrap select option {
  background: #1a1a2e;
  color: #fff;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: figma-rem(2.534);
}

.stats-loading {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: figma-rem(10.5);
  text-align: center;
}

.stat-card {
  min-height: figma-rem(23.121);
  padding: figma-rem(10) figma-rem(16.47);
  display: grid;
  grid-template-columns: 1fr repeat(3, 1fr);
  align-items: center;
  gap: figma-rem(8);
  margin-top: figma-rem(11.72);
}

.left {
  color: #fff;
  display: flex;
  align-items: center;
  gap: figma-rem(5.07);
  font-size: figma-rem(11.402);

  img {
    width: figma-rem(18);
    height: figma-rem(18);
  }
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;

  b {
    font-size: figma-rem(14);
  }

  span {
    font-size: figma-rem(10);
    opacity: 0.88;
  }
}
</style>
