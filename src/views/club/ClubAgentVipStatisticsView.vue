<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { showFailToast } from 'vant'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import { getMemberRouteContext } from './clubMemberRoute'
import { postGuildDataVipInfoApi, postStatsClubDataStatsVipUserApi } from '@/api/stats'
import { postOrgClubUserInfoApi } from '@/api/org'
import type { OrgClubUserInfoData } from '@/api/models/org'
import type { GuildDataVipInfoTotalData } from '@/api/models/stats'
import imgAvatar from '@/assets/images/default_avatar.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgBalance from '@/assets/icons/icon_credit_chip.png'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.webp'
import { useUserInfoStore } from '@/stores/userInfo'
import { formatUC } from '@/utils/roomVisibility'
import { t } from '@/i18n'

const userInfoStore = useUserInfoStore()
const route = useRoute()
const context = computed(() => getMemberRouteContext(route))

const backgroundStyle = computed(() => ({
  '--agent-stats-bg-dark': `url(${mainBgUrl})`,
  '--agent-stats-bg-light': `url(${mainBgLightUrl})`,
}))

// filter_type: 1=UC, 2=USDT, 3=Chips
const filterType = ref<number>(1)

// Game type: 0=all, 1=NLH, 2=PLO, 3=6+
const gameType = ref<number>(0)

const gameTypeTabs = computed(() => [
  { value: 0, label: t('UIMatch_GtO8YEdb') },
  { value: 1, label: t('adaptation10022') },
  { value: 2, label: t('adaptation10009') },
  { value: 3, label: t('PokerType_2') },
])

const filterTypeOptions = computed(() => [
  { value: 1, label: 'UC' },
  { value: 3, label: t('UIGuild_CoinType1') },
])
const filterSelectRef = ref<HTMLElement | null>(null)
const filterSelectOpen = ref(false)
const selectedFilterLabel = computed(
  () => filterTypeOptions.value.find((item) => item.value === filterType.value)?.label || 'UC',
)

// Player balance and profile from API (same as ClubMemberDetailView)
const memberProfile = ref<OrgClubUserInfoData | null>(null)
const loadingProfile = ref(false)

// Profile data
const displayName = computed(() => context.value.name || t('UIClub_Info_Members'))
const displayUid = computed(() => context.value.uid || '--')
const displayAvatar = computed(() => {
  const avatar = memberProfile.value?.user_info?.avatar
  return typeof avatar === 'string' && avatar.trim() ? avatar : imgAvatar
})
const badgeLabel = computed(() => t('UIClub_AgentItem'))

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
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_FetchPlayerFail'))
    }
    memberProfile.value = response.data
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_FetchPlayerFail')
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
      throw new Error(
        typeof response.msg === 'string'
          ? response.msg
          : t('UIClub_Fetch') + 'VIP' + t('UIClub_DataFail'),
      )
    }
    const info = response.data?.info
    if (info) {
      offlineUserCount.value = Number(info.user_count ?? 0)
      offlineGoldTotal.value = Number(info.user_gold_tribe_total ?? 0)
      offlineUsdtTotal.value = Number(info.user_gold_usdt_total ?? 0)
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t('UIClub_Fetch') + 'VIP' + t('UIClub_DataFail')
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
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_FetchDataFail'))
    }

    rawStatsList.value = response.data?.list ?? []
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_FetchDataFail')
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
    0: t('UIMatch_GtO8YEdb'),
    1: t('adaptation10022'),
    2: t('adaptation10009'),
    3: t('PokerType_2'),
    4: 'Fantasy',
    5: t('Mahjong_Name'),
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
        gameTypeName: gameTypeNames[item.game_type ?? 0] || t('ServerErrorCode_90002'),
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

function toggleFilterSelect(): void {
  filterSelectOpen.value = !filterSelectOpen.value
}

function selectFilterType(value: number): void {
  filterSelectOpen.value = false
  if (value === filterType.value) return
  filterType.value = value
  void fetchStatsData()
}

function closeFilterSelectOnOutside(event: PointerEvent): void {
  const target = event.target
  if (target instanceof Node && !filterSelectRef.value?.contains(target)) {
    filterSelectOpen.value = false
  }
}

function switchGameType(type: number): void {
  gameType.value = type
}

function onAvatarError(event: Event): void {
  const image = event.currentTarget as HTMLImageElement
  if (image.dataset.fallbackApplied === 'true') return
  image.dataset.fallbackApplied = 'true'
  image.src = imgAvatar
}

onMounted(() => {
  document.addEventListener('pointerdown', closeFilterSelectOnOutside)
  void Promise.all([fetchPlayerProfile(), fetchVipUserData(), fetchStatsData()])
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeFilterSelectOnOutside)
})
</script>

<template>
  <div class="page-shell sub-bg agent-vip-statistics-page" :style="backgroundStyle">
    <HeaderBack :title="t('UIClub_AgentData')" />

    <section class="glass profile-card">
      <img class="avatar" :src="displayAvatar" :alt="(displayName) + t('UIMine_UserInfoSetting_btn_head')" @error="onAvatarError" />
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
        <p>{{ t('UIClub_Downli') }}</p>
        <strong v-if="loadingVipUser">--</strong>
        <strong v-else>{{ offlineUserCount }}</strong>
      </div>
      <div>
        <p>{{ t('UIClub_Text2') }}UC</p>
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
      <div ref="filterSelectRef" class="filter-select-wrap">
        <button
          type="button"
          class="filter-select-trigger"
          aria-label="Currency type"
          aria-haspopup="listbox"
          :aria-expanded="filterSelectOpen"
          @click="toggleFilterSelect"
        >
          <span>{{ selectedFilterLabel }}</span>
        </button>
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="m4 6 4 4 4-4"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <div v-if="filterSelectOpen" class="filter-select-options" role="listbox">
          <button
            v-for="opt in filterTypeOptions"
            :key="opt.value"
            type="button"
            role="option"
            :aria-selected="filterType === opt.value"
            :class="{ active: filterType === opt.value }"
            @click="selectFilterType(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </section>

    <section class="cards">
      <p v-if="loadingStats" class="stats-loading">{{ t('SuperView2') }}...</p>
      <template v-else>
        <template v-for="row in statsRows" :key="row.gameType">
          <article class="glass stat-card">
            <div class="left">
              <AppSvgIcon name="agent-stats" class="stat-type-icon" />
              <span>{{ t('UIMine_RecordItemsNormal_3RCUa3w8') }}</span>
            </div>
            <div class="metric">
              <b>{{ formatCount(row.total.hand_num) }}</b>
              <span>{{ t('UIClub_Text3') }}</span>
            </div>
            <div class="metric">
              <b>{{ formatCount(row.today.hand_num) }}</b>
              <span>{{ t('UIData_Today') }}</span>
            </div>
            <div class="metric">
              <b>{{ formatCount(row.sevenDays.hand_num) }}</b>
              <span>7{{ t('UIHappyShop_ActivityShopDay') }}</span>
            </div>
          </article>
          <article class="glass stat-card">
            <div class="left">
              <AppSvgIcon name="agent-stats" class="stat-type-icon" />
              <span>{{ t('UIClub_GainNum') }}</span>
            </div>
            <div class="metric">
              <b>{{ formatAmount(row.total.profit) }}</b>
              <span>{{ t('UIClub_Text3') }}</span>
            </div>
            <div class="metric">
              <b>{{ formatAmount(row.today.profit) }}</b>
              <span>{{ t('UIData_Today') }}</span>
            </div>
            <div class="metric">
              <b>{{ formatAmount(row.sevenDays.profit) }}</b>
              <span>7{{ t('UIHappyShop_ActivityShopDay') }}</span>
            </div>
          </article>
          <article class="glass stat-card">
            <div class="left">
              <AppSvgIcon name="agent-stats" class="stat-type-icon" />
              <span>{{ t('UIMine_WalletPlatform_fee_f') }}</span>
            </div>
            <div class="metric">
              <b>{{ formatAmount(row.total.fee) }}</b>
              <span>{{ t('UIClub_Text3') }}</span>
            </div>
            <div class="metric">
              <b>{{ formatAmount(row.today.fee) }}</b>
              <span>{{ t('UIData_Today') }}</span>
            </div>
            <div class="metric">
              <b>{{ formatAmount(row.sevenDays.fee) }}</b>
              <span>7{{ t('UIHappyShop_ActivityShopDay') }}</span>
            </div>
          </article>
        </template>
      </template>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:math';
@use '@/styles/mixins' as *;

@function figma-rem($px) {
  @return math.div($px, 37.5) * 1rem;
}

.sub-bg {
  height: 100dvh;
  background-image: var(--agent-stats-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    background-color: var(--c-page);
    background-image: var(--agent-stats-bg-light);
  }
}

.glass {
  border-radius: figma-rem(39.59);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(figma-rem(6));
}

.profile-card {
  min-height: figma-rem(131.07);
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
  font-size: figma-rem(22.445);
  font-weight: 700;
}

.uid {
  color: rgba(255, 255, 255, 0.86);
  font-size: figma-rem(9.623);
}

.badge {
  display: block;
  margin-top: figma-rem(7.601);
  color: #fff;
  font-size: figma-rem(10.5);
}

.coin {
  display: flex;
  flex-direction: column;
  color: #f9f9f9;
  align-items: flex-end;
  gap: figma-rem(1.584);
  font-size: figma-rem(14.886);
  font-weight: 700;
}

.coin div {
  display: flex;
  align-items: center;
  gap: figma-rem(5.07);
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
  margin-top: figma-rem(11.719);
  font-size: figma-rem(14.247);

  p,
  strong {
    margin: 0;
  }

  div {
    p {
      font-size: figma-rem(14.247);
    }
    strong {
      font-size: figma-rem(16.034);
    }
  }
}

.filter-bar {
  min-height: figma-rem(54.16);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: figma-rem(8.865);
  margin-top: figma-rem(11.719);
}

.tabs-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
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
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: #fff;

  svg {
    position: absolute;
    right: 0;
    width: figma-rem(15.196);
    height: figma-rem(15.196);
    pointer-events: none;
  }
}

.filter-select-trigger {
  border: 0;
  background: transparent;
  color: inherit;
  text-align: center;
  font-size: figma-rem(13.297);
  padding: 0 figma-rem(18) 0 0;
  width: figma-rem(64);
  min-height: figma-rem(36);
  outline: none;
  cursor: pointer;
}

.filter-select-options {
  position: absolute;
  top: calc(100% + #{figma-rem(4)});
  right: 0;
  z-index: 30;
  width: figma-rem(84);
  padding: figma-rem(5);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: figma-rem(12);
  background: rgba(26, 26, 46, 0.94);
  box-shadow: 0 figma-rem(8) figma-rem(20) rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(figma-rem(12));
  -webkit-backdrop-filter: blur(figma-rem(12));
}

.filter-select-options button {
  width: 100%;
  min-height: figma-rem(34);
  padding: 0 figma-rem(8);
  border: 0;
  border-radius: figma-rem(8);
  background: transparent;
  color: #fff;
  font-size: figma-rem(13.297);
  text-align: center;
}

.filter-select-options button.active {
  background: rgba(105, 190, 255, 0.2);
  color: var(--c-brand);
}

.cards {
  display: flex;
  flex-direction: column;
  gap: figma-rem(5.699);
  margin-top: figma-rem(11.719);
}

.stats-loading {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: figma-rem(10.5);
  text-align: center;
}

.stat-card {
  min-height: figma-rem(72.816);
  padding: figma-rem(8) figma-rem(16.873) figma-rem(8) figma-rem(19.144);
  display: grid;
  grid-template-columns: 20% 30% 25% 25%;
  align-items: center;
  gap: 0;
  margin-top: 0;
}

.left {
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: figma-rem(4);
  font-size: figma-rem(10.131);
  opacity: 0.92;

  span {
    opacity: 0.62;
  }
}

.left .stat-type-icon {
  width: figma-rem(37);
  height: figma-rem(29);
  color: var(--c-brand);
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;

  b {
    font-size: figma-rem(15);
    line-height: 1.02;
    font-weight: 400;
  }

  span {
    font-size: figma-rem(10.131);
    opacity: 0.5;
  }
}

.sub-bg {
  @include theme-light {
    .glass {
      background: #fff;
      backdrop-filter: none;
    }

    .name,
    .uid,
    .badge,
    .coin,
    .offline-head,
    .tabs-row button,
    .filter-select-wrap,
    .filter-select-trigger,
    .left,
    .metric {
      color: #000;
    }

    .uid {
      color: rgba(0, 0, 0, 0.8);
    }

    .badge {
      color: #000;
    }

    .tabs-row {
      background: #e3e3e3;
    }

    .tabs-row button.active {
      border-color: #fff;
      background: #fff;
    }

    .filter-select-options {
      background: #fff;
      color: #000;
      border-color: rgba(0, 0, 0, 0.08);
      box-shadow: 0 figma-rem(8) figma-rem(20) rgba(0, 0, 0, 0.12);
      backdrop-filter: blur(figma-rem(12));
      -webkit-backdrop-filter: blur(figma-rem(12));
    }

    .filter-select-options button {
      color: #000;
    }

    .filter-select-options button.active {
      color: var(--c-brand);
    }

    .stats-loading {
      color: rgba(0, 0, 0, 0.62);
    }
  }
}
</style>
