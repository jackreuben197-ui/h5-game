<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, type StyleValue } from 'vue'
import { showFailToast } from 'vant'
import { postOrgTribeBlackUserListApi } from '@/api/org'
import type { OrgTribeBlackUserListInfo } from '@/api/models/org'
import { Code, subscribeH5WsCode } from '@/bridge/ws/messageCenter'
import { decodeTribeBlackUserNotify } from '@/bridge/ws/tribeBlackUserNotify'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'
import clubCoverAvatar from '@/assets/images/default_avatar.png'
import { formatDateTime } from '@/utils/time'

interface SafetyGuardBlacklistUser {
  id: number
  userName: string
  avatar: string
  createTime: string
  reason: string
}

interface SafetyGuardCacheEntry {
  updatedAt: number
  total: number
  users: SafetyGuardBlacklistUser[]
}

interface SafetyGuardCachePayload {
  version: number
  updatedAt: number
  tribeMap: Record<string, SafetyGuardCacheEntry>
}

const SAFETY_GUARD_CACHE_VERSION = 1
const DEFAULT_PAGE_LIMIT = 100

type SafetyTabName = 'overview' | 'blacklist'

const CORE_SYSTEM_LABELS_LEFT = [
  '作弊工具检测',
  '禁止数据采集',
  'AI行为建模引擎',
  '数据特征聚类分析',
  '实时对局风险预警',
  '账号关系识别',
  '对战行为录像与回放分析',
]

const CORE_SYSTEM_LABELS_RIGHT = [
  '伙牌检测',
  '机器人检测',
  '深度神经识别',
  '职业牌手双重审核',
  'AI代打检测',
  '行为画像分析',
]

const props = withDefaults(
  defineProps<{
    tribeId?: number
    height?: string
  }>(),
  {
    tribeId: 0,
    height: '',
  },
)

const emit = defineEmits<{
  tabChange: [payload: { tab: SafetyTabName; tribeId: number }]
}>()

const activeTab = ref<SafetyTabName>('overview')
const loading = ref(false)
const loadedTribeId = ref(0)
const blockedTotal = ref(0)
const blockedUsers = ref<SafetyGuardBlacklistUser[]>([])
let stopTribeBlackUserWsListener: (() => void) | null = null

const resolvedTribeId = computed(() => {
  const preferred = toSafeInt(props.tribeId)
  if (preferred > 0) {
    return preferred
  }
  return 0
})

const coreSystemRows = computed(() => {
  const totalRows = Math.max(CORE_SYSTEM_LABELS_LEFT.length, CORE_SYSTEM_LABELS_RIGHT.length)
  return Array.from({ length: totalRows }, (_, index) => ({
    left: CORE_SYSTEM_LABELS_LEFT[index] || '',
    right: CORE_SYSTEM_LABELS_RIGHT[index] || '',
  }))
})

const cardStyle = computed<StyleValue>(() =>
  props.height
    ? {
        '--safety-guard-height': props.height,
      }
    : undefined,
)

watch(
  () => resolvedTribeId.value,
  (tribeId) => {
    activeTab.value = 'overview'
    if (tribeId > 0) {
      void hydrateSafetyData(false)
      return
    }

    loadedTribeId.value = 0
    blockedTotal.value = 0
    blockedUsers.value = []
  },
  { immediate: true },
)

onMounted(() => {
  stopTribeBlackUserWsListener = subscribeH5WsCode(Code.MSG_S_TRIBE_BLACK_USER, (message) => {
    const payload = decodeTribeBlackUserNotify(message.rawBuffer)
    if (!payload) {
      return
    }

    const tribeId = toSafeInt(payload.tribeId)
    if (tribeId <= 0) {
      return
    }

    void fetchBlacklistByTribeId(tribeId, { silent: true, force: true, background: true })
  })
})

onUnmounted(() => {
  stopTribeBlackUserWsListener?.()
  stopTribeBlackUserWsListener = null
})

async function hydrateSafetyData(forceRefresh: boolean): Promise<void> {
  const tribeId = resolvedTribeId.value
  if (tribeId <= 0) {
    return
  }

  const cacheHit = restoreBlacklistCache(tribeId)
  if (!cacheHit || forceRefresh || loadedTribeId.value !== tribeId) {
    await fetchBlacklist({ silent: cacheHit })
  }
}

async function fetchBlacklist(options: { silent?: boolean; force?: boolean } = {}): Promise<void> {
  const tribeId = resolvedTribeId.value
  await fetchBlacklistByTribeId(tribeId, options)
}

async function fetchBlacklistByTribeId(
  tribeId: number,
  options: { silent?: boolean; force?: boolean; background?: boolean } = {},
): Promise<void> {
  if (tribeId <= 0) {
    return
  }
  if (loading.value && !options.force) {
    return
  }

  const isCurrentTribe = tribeId === resolvedTribeId.value
  const shouldUpdateViewState = isCurrentTribe
  const shouldShowLoading = shouldUpdateViewState && !options.background

  if (shouldShowLoading) {
    loading.value = true
  }

  try {
    const response = await postOrgTribeBlackUserListApi({
      offset: 0,
      limit: DEFAULT_PAGE_LIMIT,
      tribe_id: tribeId,
    })

    if (Number(response.code) !== 0) {
      throw new Error(String(response.msg || '安全卫士数据加载失败'))
    }

    const records = Array.isArray(response.data?.data) ? response.data?.data : []
    const normalizedUsers = records.map(normalizeBlacklistUser)
    const total = toSafeInt(response.data?.total) || normalizedUsers.length

    persistBlacklistCache(tribeId, total, normalizedUsers)

    if (shouldUpdateViewState) {
      blockedUsers.value = normalizedUsers
      blockedTotal.value = total
      loadedTribeId.value = tribeId
    }
  } catch (error) {
    if (!options.silent && shouldUpdateViewState) {
      showFailToast(error instanceof Error ? error.message : '安全卫士数据加载失败')
    }
  } finally {
    if (shouldShowLoading) {
      loading.value = false
    }
  }
}

function handleTabClick(tabName: SafetyTabName): void {
  activeTab.value = tabName
  emit('tabChange', { tab: tabName, tribeId: resolvedTribeId.value })

  if (tabName === 'blacklist' && resolvedTribeId.value > 0 && !blockedUsers.value.length) {
    void fetchBlacklist({ silent: true })
  }
}

function persistBlacklistCache(
  tribeId: number,
  total: number,
  users: SafetyGuardBlacklistUser[],
): void {
  if (tribeId <= 0) {
    return
  }

  const cached = getCachePayload()
  cached.tribeMap[String(tribeId)] = {
    updatedAt: Date.now(),
    total,
    users,
  }
  cached.updatedAt = Date.now()
  localStore.setItem(StorageKey.TRIBE_BLACK_USER_LIST_CACHE, cached)
}

function restoreBlacklistCache(tribeId: number): boolean {
  if (tribeId <= 0) {
    return false
  }

  const cached = getCachePayload()
  const entry = cached.tribeMap[String(tribeId)]
  if (!entry) {
    return false
  }

  blockedTotal.value = toSafeInt(entry.total)
  blockedUsers.value = Array.isArray(entry.users) ? entry.users : []
  loadedTribeId.value = tribeId
  return true
}

function getCachePayload(): SafetyGuardCachePayload {
  const fallback: SafetyGuardCachePayload = {
    version: SAFETY_GUARD_CACHE_VERSION,
    updatedAt: Date.now(),
    tribeMap: {},
  }

  const cached = localStore.getItem<SafetyGuardCachePayload | null>(
    StorageKey.TRIBE_BLACK_USER_LIST_CACHE,
    null,
  )

  if (
    !cached ||
    typeof cached !== 'object' ||
    cached.version !== SAFETY_GUARD_CACHE_VERSION ||
    !cached.tribeMap ||
    typeof cached.tribeMap !== 'object'
  ) {
    return fallback
  }

  return {
    version: SAFETY_GUARD_CACHE_VERSION,
    updatedAt: toSafeInt(cached.updatedAt) || Date.now(),
    tribeMap: { ...cached.tribeMap },
  }
}

function normalizeBlacklistUser(record: OrgTribeBlackUserListInfo): SafetyGuardBlacklistUser {
  return {
    id: toSafeInt(record.id),
    userName: String(record.user_name || '--').trim() || '--',
    avatar: String(record.user_avatar || '').trim() || clubCoverAvatar,
    createTime: formatBlockedDate(record.create_time),
    reason: String(record.public_reason || '').trim(),
  }
}

function formatBlockedDate(rawTime: unknown): string {
  return formatDateTime(rawTime, 'DD/MM/YYYY')
}

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return 0
  }

  return Math.floor(num)
}
</script>

<template>
  <section class="safety-guard-card" :style="cardStyle">
    <div class="safety-guard-tabs">
      <button
        class="safety-guard-tab"
        :class="{ 'safety-guard-tab--active': activeTab === 'overview' }"
        type="button"
        @click="handleTabClick('overview')"
      >
        安全卫士
      </button>
      <button
        class="safety-guard-tab"
        :class="{ 'safety-guard-tab--active': activeTab === 'blacklist' }"
        type="button"
        @click="handleTabClick('blacklist')"
      >
        封禁名单
      </button>
    </div>

    <div v-if="activeTab === 'overview'" class="safety-overview">
      <div class="safety-overview__icon-wrap">
        <div class="safety-overview__lock"></div>
        <van-icon class="safety-overview__star" name="star-o" />
      </div>

      <p class="safety-overview__sub-title">7*24小时智能AI风控巡航已启动</p>

      <div class="safety-overview__stat-card">
        <p class="safety-overview__stat-value">{{ blockedTotal }}</p>
        <p class="safety-overview__stat-label">累计封禁人数</p>
      </div>

      <p class="safety-overview__title">9大核心安全系统</p>

      <div class="safety-overview__system-grid">
        <div
          v-for="(row, index) in coreSystemRows"
          :key="index"
          class="safety-overview__system-row"
        >
          <div class="safety-overview__system-cell">
            <i v-if="row.left" class="safety-overview__dot"></i>
            <span>{{ row.left }}</span>
          </div>
          <div class="safety-overview__system-cell">
            <i v-if="row.right" class="safety-overview__dot"></i>
            <span>{{ row.right }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="safety-blacklist">
      <div v-if="loading" class="safety-blacklist__status-wrap">
        <van-loading size="0.56rem" color="#55ffe2" />
        <p>加载中...</p>
      </div>

      <div v-else-if="!blockedUsers.length" class="safety-blacklist__status-wrap">
        <van-icon name="shield-o" size="0.62rem" />
        <p>暂无封禁记录</p>
      </div>

      <ul v-else class="safety-blacklist__list">
        <li
          v-for="user in blockedUsers"
          :key="`${user.id}_${user.userName}_${user.createTime}`"
          class="safety-blacklist__item"
        >
          <div class="safety-blacklist__avatar-wrap">
            <img :src="user.avatar" alt="avatar" />
            <span class="safety-blacklist__badge">已封禁</span>
          </div>
          <div class="safety-blacklist__meta">
            <p class="safety-blacklist__name">{{ user.userName }}</p>
            <p class="safety-blacklist__date">{{ user.createTime }}</p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped lang="scss">
.safety-guard-card {
  position: relative;
  width: 100%;
  height: var(--safety-guard-height, min(14.4rem, calc(100dvh - 3.2rem)));
  box-sizing: border-box;
  border-radius: 0.96rem;
  color: #f9f9f9;
}

.safety-guard-tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.32rem;
}

.safety-guard-tab {
  border: 0;
  background: transparent;
  color: rgba(249, 249, 249, 0.76);
  font-size: 0.44rem;
  font-weight: 700;
  line-height: 1.3;
  padding: 0.08rem 0;
}

.safety-guard-tab--active {
  color: #55ffe2;
  border-bottom: 0.08rem solid #55ffe2;
}

.safety-overview {
  margin-top: 0.26rem;
  height: calc(100% - 0.98rem);
  display: flex;
  flex-direction: column;
}

.safety-overview__icon-wrap {
  margin: 0.34rem auto 0;
  width: 2.1rem;
  height: 2.1rem;
  position: relative;
}

.safety-overview__lock {
  position: absolute;
  left: 0.42rem;
  top: 0.46rem;
  width: 1.08rem;
  height: 0.9rem;
  border: 0.14rem solid #46e2ce;
  border-radius: 0.28rem;
  border-top-width: 0.24rem;
}

.safety-overview__lock::before {
  content: '';
  position: absolute;
  left: 0.18rem;
  top: -0.74rem;
  width: 0.48rem;
  height: 0.62rem;
  border: 0.14rem solid #46e2ce;
  border-bottom: 0;
  border-radius: 0.4rem 0.4rem 0 0;
}

.safety-overview__star {
  position: absolute;
  right: 0.16rem;
  bottom: 0.36rem;
  font-size: 0.82rem;
  color: #36d8c9;
}

.safety-overview__sub-title {
  margin: 0.14rem 0 0;
  text-align: center;
  font-size: 0.34rem;
  line-height: 1.4;
}

.safety-overview__stat-card {
  margin-top: 0.34rem;
  border-radius: 0.78rem;
  min-height: 2.71rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(185deg, rgba(104, 254, 221, 0.8) 49%, rgba(6, 126, 132, 0.8) 90%);
}

.safety-overview__stat-value {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.1;
  font-weight: 700;
}

.safety-overview__stat-label {
  margin: 0.08rem 0 0;
  font-size: 0.38rem;
  line-height: 1.2;
}

.safety-overview__title {
  margin: 0.54rem 0 0;
  font-size: 0.5rem;
  line-height: 1.25;
  font-weight: 800;
}

.safety-overview__system-grid {
  margin-top: 0.24rem;
  display: flex;
  flex-direction: column;
  gap: 0.14rem;
  overflow-y: auto;
  padding-bottom: 0.12rem;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.safety-overview__system-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 0.22rem;
}

.safety-overview__system-cell {
  min-height: 0.66rem;
  display: flex;
  align-items: center;
  gap: 0.14rem;
  font-size: 0.34rem;
  line-height: 1.28;
}

.safety-overview__dot {
  width: 0.34rem;
  height: 0.34rem;
  border-radius: 50%;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.75), rgba(181, 181, 181, 0.4));
  box-shadow: 0 0.03rem 0.08rem rgba(0, 0, 0, 0.3);
}

.safety-blacklist {
  margin-top: 0.3rem;
  height: calc(100% - 0.96rem);
}

.safety-blacklist__status-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.24rem;
  color: rgba(249, 249, 249, 0.8);
  font-size: 0.34rem;
}

.safety-blacklist__list {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  margin: 0;
  padding: 0;
  list-style: none;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.safety-blacklist__item {
  position: relative;
  min-height: 1.82rem;
  border-radius: 0.5rem;
  padding: 0.24rem 0.36rem 0.24rem 0.38rem;
  background: rgba(255, 255, 255, 0.09);
  display: grid;
  grid-template-columns: 1.36rem minmax(0, 1fr);
  align-items: center;
  column-gap: 0.28rem;
}

.safety-blacklist__avatar-wrap {
  position: relative;
  width: 1.28rem;
  height: 1.28rem;
}

.safety-blacklist__avatar-wrap img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.safety-blacklist__badge {
  position: absolute;
  left: -0.34rem;
  top: -0.2rem;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.62);
  color: #ff3556;
  border: 0.04rem solid rgba(175, 0, 0, 0.8);
  font-size: 0.26rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-28deg);
  box-shadow: 0 0.08rem 0.16rem rgba(0, 0, 0, 0.28);
}

.safety-blacklist__meta {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.2rem;
}

.safety-blacklist__name {
  margin: 0;
  min-width: 0;
  font-size: 0.5rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.safety-blacklist__date {
  margin: 0;
  flex-shrink: 0;
  font-size: 0.42rem;
  line-height: 1.2;
  color: rgba(249, 249, 249, 0.92);
}
</style>
