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
import iconSafetyGuard from '@/assets/icons/icon_safety_guard.png'
import safetyGuardSprite from '@/assets/icons/safety_guard_sprite.png'
import { formatDateTime } from '@/utils/time'
import { t } from '@/i18n'

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

const CORE_SYSTEM_ITEMS = [
  t('UIDialog_Text3'),
  t('UITableCheck6'),
  t('UIDialog_Data'),
  t('UIDialog_People'),
  "AI" + t('UIDialog_Text4'),
  t('UIDialog_Text5'),
  t('UINewSafeTip7'),
  t('UINewSafeTip8'),
  t('UIDialog_Round'),
  "AI" + t('UIDialog_Text6'),
  t('UIDialog_No'),
  t('UIDialog_Text7'),
  t('UIDialog_Text8'),
]
const SAFETY_GUARD_SPRITE_WIDTH = 1171
const SAFETY_GUARD_SPRITE_HEIGHT = 83
const SAFETY_GUARD_ICON_SOURCE_SIZE = 69.55
const SAFETY_GUARD_ICON_GAP = 20
const SAFETY_GUARD_ICON_START_X = 13.4
const SAFETY_GUARD_ICON_START_Y = 6.7
const SAFETY_GUARD_ICON_DISPLAY_SIZE = 0.56

interface CoreSystemItem {
  label: string
  iconIndex: number
}

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

const coreSystemItems = computed<CoreSystemItem[]>(() =>
  CORE_SYSTEM_ITEMS.map((label, iconIndex) => ({
    label,
    iconIndex,
  })),
)

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
      throw new Error(String(response.msg || t('UIDialog_DataLoadFail')))
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
      showFailToast(error instanceof Error ? error.message : t('UIDialog_DataLoadFail'))
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

function getCoreSystemIconStyle(iconIndex: number): StyleValue {
  const spriteScale = SAFETY_GUARD_ICON_DISPLAY_SIZE / SAFETY_GUARD_ICON_SOURCE_SIZE
  const backgroundWidth = SAFETY_GUARD_SPRITE_WIDTH * spriteScale
  const backgroundHeight = SAFETY_GUARD_SPRITE_HEIGHT * spriteScale
  const offsetX =
    (SAFETY_GUARD_ICON_START_X +
      (SAFETY_GUARD_ICON_SOURCE_SIZE + SAFETY_GUARD_ICON_GAP) * iconIndex) *
    spriteScale
  const offsetY = SAFETY_GUARD_ICON_START_Y * spriteScale

  return {
    backgroundImage: `url(${safetyGuardSprite})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${backgroundWidth}rem ${backgroundHeight}rem`,
    backgroundPosition: `-${offsetX}rem -${offsetY}rem`,
  }
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
        {{ t('UISafety') }}
      </button>
      <button
        class="safety-guard-tab"
        :class="{ 'safety-guard-tab--active': activeTab === 'blacklist' }"
        type="button"
        @click="handleTabClick('blacklist')"
      >
        {{ t('UINewSafeTip10') }}
      </button>
    </div>

    <div v-if="activeTab === 'overview'" class="safety-overview">
      <div class="safety-overview__icon-wrap">
        <img :src="iconSafetyGuard" alt="" />
      </div>

      <p class="safety-overview__sub-title">7*24{{ t('UIDialog_Text') }}AI{{ t('UIDialog_Done') }}</p>

      <div class="safety-overview__stat-card">
        <p class="safety-overview__stat-value">{{ blockedTotal }}</p>
        <p class="safety-overview__stat-label">{{ t('UINewSafeTip3') }}</p>
      </div>

      <p class="safety-overview__title">9{{ t('UIDialog_Text2') }}</p>

      <div class="safety-overview__system-grid">
        <div
          v-for="item in coreSystemItems"
          :key="`${item.iconIndex}-${item.label}`"
          class="safety-overview__system-cell"
        >
          <i class="safety-overview__icon" :style="getCoreSystemIconStyle(item.iconIndex)"></i>
          <span class="safety-overview__label">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <div v-else class="safety-blacklist">
      <div v-if="loading" class="safety-blacklist__status-wrap">
        <van-loading size="0.56rem" color="#55ffe2" />
        <p>{{ t('SuperView2') }}...</p>
      </div>

      <div v-else-if="!blockedUsers.length" class="safety-blacklist__status-wrap">
        <van-icon name="shield-o" size="0.62rem" />
        <p>{{ t('UIDialog_NoRecord') }}</p>
      </div>

      <ul v-else class="safety-blacklist__list">
        <li
          v-for="user in blockedUsers"
          :key="`${user.id}_${user.userName}_${user.createTime}`"
          class="safety-blacklist__item"
        >
          <div class="safety-blacklist__avatar-wrap">
            <img :src="user.avatar" alt="avatar" />
            <!-- <img :src="baned" class="icon-baned" alt="avatar" /> -->
            <span class="safety-blacklist__badge">
              <span>{{ t('UIDialog_Done2') }}</span>
            </span>
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
  color: #4099E0;
  border-bottom: 0.08rem solid #4099E0;
}

.safety-overview {
  margin-top: 0.26rem;
  height: calc(100% - 0.98rem);
  padding: 0 0.2rem;
  display: flex;
  flex-direction: column;
}

.safety-overview__icon-wrap {
  margin: 0.34rem auto 0;
  width: 2.4rem;
  height: 2.6rem;
  position: relative;
  img {
    width: 2.4rem;
    height: 2.6rem;
  }
}

.safety-overview__sub-title {
  margin: 0.14rem 0 0;
  text-align: center;
  font-size: 0.34rem;
  line-height: 1.4;
}

.safety-overview__stat-card {
  margin-top: 0.34rem;
  border-radius: 9.99rem;
  min-height: 1.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(165deg, rgb(104, 189, 254) 7.5%, rgb(63, 153, 224) 71.9%);
  backdrop-filter: blur(24px);
  border: 0.01rem solid rgba(242, 242, 242, 0.3);
  box-shadow:
    0.64rem 0.43rem 0.16rem rgba(110, 2, 2, 0.04),
    0.16rem 0.11rem 0.1rem rgba(110, 2, 2, 0.24);
}

.safety-overview__stat-value {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.1;
  font-weight: 600;
}

.safety-overview__stat-label {
  margin: 0.08rem 0 0;
  font-size: 0.28rem;
  line-height: 1.2;
}

.safety-overview__title {
  text-align: left;
  color: #fff;
  font-family: 'HONOR Sans CN';
  font-size: 0.34rem;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
}

.safety-overview__system-grid {
  margin-top: 0.24rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 0.22rem;
  row-gap: 0.14rem;
  overflow-y: auto;
  padding-bottom: 0.12rem;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.safety-overview__system-cell {
  min-height: 0.66rem;
  display: flex;
  align-items: center;
  gap: 0.14rem;
  font-size: 0.34rem;
  line-height: 1.28;
}

.safety-overview__icon {
  width: 0.56rem;
  height: 0.56rem;
  flex-shrink: 0;
}
.safety-overview__label {
  color: #fff;
  font-family: 'HONOR Sans CN';
  font-size: 0.3rem;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

.safety-blacklist {
  margin-top: 0.2rem;
  height: calc(100% - 0.96rem);
  padding: 0 0.2rem;
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
  gap: 0.32rem;
  margin: 0;
  list-style: none;
  scrollbar-width: none;
  padding: 0.4rem 0.2rem 0;
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
  // align-items: center;
  column-gap: 0.28rem;
}

.safety-blacklist__avatar-wrap {
  position: relative;
  width: 1.38rem;
  height: 1.38rem;
}

.safety-blacklist__avatar-wrap img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.safety-blacklist__badge {
  position: absolute;
  left: -0.5rem;
  top: -0.4rem;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  // background: rgba(0, 0, 0, 0.62);
  // border: 0.04rem solid rgba(175, 0, 0, 0.8);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: url('@/assets/images/table_baned.png') no-repeat center/cover;
  // box-shadow: 0 0.08rem 0.16rem rgba(0, 0, 0, 0.28);
  span {
    color: #ff3556;
    font-size: 0.22rem;
    transform: rotate(-28deg);
  }
}

.safety-blacklist__meta {
  min-width: 0;
  display: flex;
  justify-content: space-between;
  gap: 0.2rem;
}

.safety-blacklist__name {
  margin: 0;
  min-width: 0;
  font-size: 0.42rem;
  line-height: 2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: Afacad;
  font-style: normal;
  font-weight: 500;
}

.safety-blacklist__date {
  margin: 0;
  flex-shrink: 0;
  font-size: 0.33rem;
  line-height: 2;
  color: #fff;
  font-family: Afacad;
  font-style: normal;
  font-weight: 500;
}
</style>
