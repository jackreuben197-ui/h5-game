<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
  type CSSProperties,
} from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import { postOrgClubNoticeApi, postOrgClubNoticeIgnoreApi } from '@/api/cmsext'
import { enterTable } from '@/bridge/core'
import MainBottomTab from '@/components/Tabbar/MainBottomTab.vue'
import LoginModal from '@/views/login/LoginModal.vue'
import type { MttItem, MttActionType } from '@/components/ListItem/MttCard.vue'
import type { EnterTablePayload } from '@bridge-protocol'
import StorageKey from '@/constants/storageKey'
import LoginSession from '@/session/loginSession'
import type {
  MttIdInfoRecord,
  MttListRecord,
  MttSeriesInfoRecord,
  RoomRecord,
} from '@/api/models/roomcenter'
import { useAppConfigStore } from '@/stores/appConfig'
import { useGameStore } from '@/stores/game'
import { useLoginModalStore } from '@/stores/loginModal'
import { useMttListStore } from '@/stores/mttList'
import { useMainTabsStore } from '@/stores/mainTabs'
import { useRoomListStore } from '@/stores/roomList'
import { useUserInfoStore } from '@/stores/userInfo'
import { isPrivateDomainMode } from '@/utils/channelPackage'
import { useCachedImage } from '@/utils/imageCache'
import { localStore } from '@/utils/localStore'
import {
  checkIsShowForClubAndTribe,
  checkIsShowForClubAndTribeAndPlatform,
  ROOM_ORIGIN_TYPE,
} from '@/utils/roomVisibility'
import { getLocale, t } from '@/i18n'
import serviceIcon from '@/assets/icons/icon_server.png'
import walletIcon from '@/assets/icons/icon_wallet.png'
import twoPersonIcon from '@/assets/icons/2person.png'
import clubDetailButtonIcon from '@/assets/icons/img_club_detail_button.png'
import clubCoverAvatar from '@/assets/images/default_avatar_for_club.png'
import quickSafetyBg from '@/assets/images/club_header_quick_safety.png'
import pokerMiniIcon from '@/assets/icons/game_zone_mtt_mini.png'
import mahjongMiniIcon from '@/assets/icons/game_zone_mahjong_mini.png'
import quickRankingBg from '@/assets/images/club_header_quick_ranking.png'
import gameType6Plus from '@/assets/icons/game_type_6+.svg'
import gameTypeNlh from '@/assets/icons/game_type_nlh.svg'
import gameTypePlo from '@/assets/icons/game_type_plo.svg'
import tabBg from '@/assets/icons/game_type_tab_bg.png'
import peopleBgUrl from '@/assets/icons/icon_people.png'
import SafetyGuardDialog from '@/components/Dialog/SafetyGuardDialog.vue'
import MiniGameView from '@/views/home/MiniGameView.vue'
import CasinoView from '@/views/home/CasinoView.vue'
import { useCasinoStore } from '@/stores/casino'
import { useMinigameStore } from '@/stores/minigame'
import { openGlobalCustomerServiceChat } from '@/components/GlobalCustomerServiceChat/channel'
import {
  multiLanguageTemplateVersion,
  resolveTemplateTextByKey,
} from '@/utils/multiLanguageTemplate'
import { formatDateTime, formatTodayAwareTimeLabel, toTimestampMs } from '@/utils/time'

import mainBgUrl from '@/assets/images/main_bg.webp'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

type GameTypeTabName = 'all' | 'texas' | 'omaha' | 'sixPlus'
type ClubHeaderTabName = 'poker' | 'mahjong' | 'event' | 'minigame' | 'casino'
type MttTabName = 'all' | 'poker' | 'mahjong'
type MttCategory = 'poker' | 'mahjong' | 'unknown'
type MttStage = 'upcoming' | 'registering' | 'late' | 'running' | 'finished'
type MttLayout = 'sm' | 'md' | 'lg'

type RawMttRecord = MttListRecord
const POKER_TYPE_LONG = 0
const POKER_TYPE_SHORT = 2
const MttMatchStatus = { CREATED: 0, RUNNING: 1, CLOSED: 2, CANCEL: 3 } as const

interface RoomGroupViewModel {
  groupKey: string
  gameType: number
  pokerType: number
  sb: number
  rooms: RoomRecord[]
  blindText: string
  gameName: string
  iconImage: string
  tableCount: number
  playerCount: number
}

interface RoomGroupExpandedCachePayload {
  version: number
  updatedAt: number
  expandedMap: Record<string, boolean>
}

interface ClubNoticeViewModel {
  source: 'tribe' | 'club'
  title: string
  content: string
  dateText: string
}

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

const ROOM_GROUP_EXPANDED_CACHE_VERSION = 1

const appConfigStore = useAppConfigStore()
const gameStore = useGameStore()
const loginModalStore = useLoginModalStore()
const mttListStore = useMttListStore()
const roomListStore = useRoomListStore()
const userInfoStore = useUserInfoStore()
const casinoStore = useCasinoStore()
const minigameStore = useMinigameStore()
const tabsStore = useMainTabsStore()
const router = useRouter()
const isChannelPackage = isPrivateDomainMode()

// 顶部右侧切换风格开关：和旧版保持一致。
const activeTab = ref<GameTypeTabName>('all')
const clubHeaderTab = ref<ClubHeaderTabName>('poker')
const mttActiveTab = ref<MttTabName>('all')
const sourceRecords = computed<RoomRecord[]>(() => roomListStore.records)
const expandedMap = reactive<Record<string, boolean>>({})
const expandedGroupMap = ref<Record<string, boolean>>({})
const announceExpanded = ref(false)
const showSafetyGuardPopup = ref(false)
const showClubNoticePopup = ref(false)
const ignoringClubNotice = ref(false)
const clubNoticeQueue = ref<ClubNoticeViewModel[]>([])
const clubNoticeQueueIndex = ref(0)
const nowMs = ref(Date.now())
const pageStyle = computed<CSSProperties>(() => ({
  '--tab-bg': `url(${tabBg})`,
}))
let mttTicker: number | null = null

const currentJoinedClub = computed(() => {
  return userInfoStore.currentJoinedClub || null
})

const currentClub = computed(() => {
  return currentJoinedClub.value || (isChannelPackage ? userInfoStore.channelDefaultClub : null)
})

const showChannelTabbar = computed(() => isChannelPackage)

const selectedClubId = computed(() => toSafeInt(currentClub.value?.club_id))
const selectedTribeId = computed(() => toSafeInt(currentClub.value?.tribe_id))

const canCreateTable = computed(() => {
  if (!gameStore.sessionToken) {
    return false
  }
  const userLevel = toSafeInt(currentJoinedClub.value?.user_level)
  return userLevel >= 1 && userLevel <= 3
})

const canManageClub = computed(() => {
  return Boolean(gameStore.sessionToken && currentJoinedClub.value)
})

const showFloatingActionArea = computed(() => {
  return canCreateTable.value || canManageClub.value
})

const filteredRecords = computed(() => {
  const baseList = sourceRecords.value.filter((room) => {
    if (Number(room.game_type) >= 6) {
      return false
    }
    return checkIsShowForClubAndTribe(room, selectedClubId.value, selectedTribeId.value)
  })

  return baseList.filter((room) => matchTabRoom(room, activeTab.value))
})

const clubDisplayName = computed(() => {
  const name = String(currentClub.value?.club_name || '').trim()
  if (name) return name
  return 'xx' + t('UILobby_Menu_menu_btn_club')
})

const clubDisplayId = computed(() => {
  const randomId = String(currentClub.value?.random_id || '').trim()
  if (randomId) return randomId
  const clubId = String(currentClub.value?.club_id || '').trim()
  if (clubId) return clubId
  return '--'
})

const clubCoverUrl = useCachedImage(() => {
  const logo = String(currentClub.value?.logo || '').trim()
  return logo || clubCoverAvatar
})

const clubNoticeIntro = computed(() => {
  const text = String(currentClub.value?.desc || '').trim()
  if (text) {
    return text
  }
  return t('UIClub_NotClubDescri')
})

const clubNoticeText = computed(() => {
  return clubNoticeIntro.value
})

const activeClubNotice = computed<ClubNoticeViewModel | null>(() => {
  return clubNoticeQueue.value[clubNoticeQueueIndex.value] || null
})

const clubMemberCount = computed(() => {
  const countFromClub = toSafeInt(currentClub.value?.club_members)
  if (countFromClub > 0) {
    return String(countFromClub)
  }

  const count = sourceRecords.value.reduce((sum, room) => {
    const roomPlayers = Number(room.roomers) || (Array.isArray(room.users) ? room.users.length : 0)
    return sum + roomPlayers
  }, 0)
  return String(count || 0)
})

// 按 game_type + poker_type + 小盲分组，生成分组卡片展示模型。
const groupedRecords = computed<RoomGroupViewModel[]>(() => {
  const groupedMap: Record<string, RoomGroupViewModel> = {}

  filteredRecords.value.forEach((room) => {
    const gameType = Number(room.game_type) || 0
    const pokerType = Number(room.poker_type) || 0
    const sb = Number(room.sb) || 0
    const groupKey = `${gameType}_${pokerType}_${sb}`

    if (!groupedMap[groupKey]) {
      groupedMap[groupKey] = {
        groupKey,
        gameType,
        pokerType,
        sb,
        rooms: [],
        blindText: '',
        gameName: '',
        iconImage: '',
        tableCount: 0,
        playerCount: 0,
      }
    }

    groupedMap[groupKey].rooms.push(room)
  })

  return Object.values(groupedMap)
    .map((group) => {
      const playerCount = group.rooms.reduce((sum, room) => {
        const roomPlayers =
          Number(room.roomers) || (Array.isArray(room.users) ? room.users.length : 0)
        return sum + roomPlayers
      }, 0)

      return {
        ...group,
        blindText: formatBlind(group.sb),
        gameName: getGameName(group.gameType, group.pokerType),
        iconImage: getGameIconImage(group.gameType, group.pokerType),
        tableCount: group.rooms.length,
        playerCount,
      }
    })
    .sort((a, b) => {
      if (a.gameType !== b.gameType) return a.gameType - b.gameType
      if (a.pokerType !== b.pokerType) return a.pokerType - b.pokerType
      return a.sb - b.sb
    })
})

const mttSourceRecords = computed<RawMttRecord[]>(() => mttListStore.records as RawMttRecord[])

const normalizedItems = computed<MttViewItem[]>(() =>
  mttSourceRecords.value.map((record) => {
    void multiLanguageTemplateVersion.value
    const matchId = toSafeInt(record.match_id)
    const mttIdMeta = mttListStore.mttIdMetaMap[matchId]
    return normalizeRecordToViewItem(record, mttIdMeta, nowMs.value)
  }),
)

const filteredMttItems = computed<MttViewItem[]>(() => {
  return normalizedItems.value.filter((item) => {
    if (item.category === 'mahjong') {
      return false
    }
    if (mttActiveTab.value !== 'all' && item.category !== mttActiveTab.value) {
      return false
    }
    return checkMttVisibility(item, selectedClubId.value, selectedTribeId.value)
  })
})

const mttGroups = computed<MttGroup[]>(() =>
  buildGroupsBySeries(filteredMttItems.value, mttListStore.mttSeriesMap),
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

onMounted(() => {
  casinoStore.preloadCasinoData(selectedClubId.value, false).catch(console.warn)
  minigameStore.preloadMinigameData(selectedClubId.value, false).catch(console.warn)

  if (isChannelPackage) {
    tabsStore.setActiveTab('club')
  }

  if (!isChannelPackage && !userInfoStore.currentClub && userInfoStore.clubList.length) {
    userInfoStore.setCurrentClub(userInfoStore.clubList[0] || null)
  }

  void initializeClubIndex()
})

async function initializeClubIndex(): Promise<void> {
  // 渠道游客无 token，postAuthSync 不会执行，这里补拉全局配置（平台 MTT 可见性等依赖它）。
  if (!gameStore.sessionToken) {
    void appConfigStore.ensureGuestGlobalConfig()
  }

  if (isChannelPackage && !currentJoinedClub.value) {
    await userInfoStore.ensureChannelDefaultClub()
  }

  if (!currentClub.value || !String(currentClub.value.club_id || '').trim()) {
    if (isChannelPackage) {
      return
    }
    void router.replace('/club')
    return
  }

  // if (currentJoinedClub.value) {
  bootstrapRoomList()
  // }
  if (gameStore.sessionToken && currentJoinedClub.value) {
    mttListStore.bootstrapMttList()
    void fetchClubNotice({ showPopup: true })
  }

  mttTicker = window.setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
}

onUnmounted(() => {
  if (mttTicker !== null) {
    window.clearInterval(mttTicker)
    mttTicker = null
  }
})

watch(
  () => selectedClubId.value,
  (clubId, prevClubId) => {
    if (clubId <= 0 || clubId === prevClubId || !currentJoinedClub.value) {
      return
    }
    announceExpanded.value = false
    void fetchClubNotice({ showPopup: true })
  },
)

watch(
  () => roomListStore.records,
  (records) => {
    syncExpandedMapWithRecords(records)
    persistRoomGroupExpandedCache()
  },
  {
    deep: false,
  },
)

watch(
  () => showClubNoticePopup.value,
  (visible, prevVisible) => {
    if (visible || !prevVisible) {
      return
    }

    if (clubNoticeQueueIndex.value < clubNoticeQueue.value.length - 1) {
      const nextNotice = clubNoticeQueue.value[clubNoticeQueueIndex.value + 1]
      if (!nextNotice) {
        return
      }

      // 只保留下一条通知，避免关闭第二条时再次被“队列切换”逻辑误拉起。
      clubNoticeQueue.value = [nextNotice]
      clubNoticeQueueIndex.value = 0
      void nextTick(() => {
        showClubNoticePopup.value = true
      })
    }
  },
)

// 进入页面先用缓存秒开，再静默刷新最新数据。
function bootstrapRoomList(): void {
  roomListStore.bootstrapRoomList()
  restoreRoomGroupExpandedCache()
  syncExpandedMapWithRecords(roomListStore.records)
}

function notifyNotLogin(): void {
  loginModalStore.open()
}

function handleGuestPageClick(event: MouseEvent): void {
  if (gameStore.sessionToken) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  notifyNotLogin()
}

// 缓存分组展开状态，避免静默刷新后折叠状态丢失。
function persistRoomGroupExpandedCache(): void {
  const payload: RoomGroupExpandedCachePayload = {
    version: ROOM_GROUP_EXPANDED_CACHE_VERSION,
    updatedAt: Date.now(),
    expandedMap: { ...expandedMap },
  }
  localStore.setItem(StorageKey.ROOM_GROUP_EXPANDED_CACHE, payload)
}

// 恢复上次分组展开状态（按 groupKey 记忆）。
function restoreRoomGroupExpandedCache(): void {
  const cached = localStore.getItem<RoomGroupExpandedCachePayload | null>(
    StorageKey.ROOM_GROUP_EXPANDED_CACHE,
    null,
  )
  if (!cached || typeof cached !== 'object') {
    return
  }
  if (
    cached.version !== ROOM_GROUP_EXPANDED_CACHE_VERSION ||
    !cached.expandedMap ||
    typeof cached.expandedMap !== 'object'
  ) {
    return
  }

  Object.keys(expandedMap).forEach((key) => {
    delete expandedMap[key]
  })
  Object.entries(cached.expandedMap).forEach(([key, value]) => {
    expandedMap[key] = value === true
  })
}

// 只保留当前列表存在的分组 key，避免缓存越积越多。
function syncExpandedMapWithRecords(records: RoomRecord[]): void {
  const validGroupKeySet = new Set<string>()
  records
    .filter((room) => Number(room.game_type) < 6)
    .forEach((room) => {
      validGroupKeySet.add(buildGroupKey(room))
    })

  Object.keys(expandedMap).forEach((groupKey) => {
    if (!validGroupKeySet.has(groupKey)) {
      delete expandedMap[groupKey]
    }
  })
}

function buildGroupKey(room: RoomRecord): string {
  const gameType = Number(room.game_type) || 0
  const pokerType = Number(room.poker_type) || 0
  const sb = Number(room.sb) || 0
  return `${gameType}_${pokerType}_${sb}`
}

async function handleTableClick(room: RoomRecord): Promise<void> {
  if (isChannelPackage && !gameStore.sessionToken) {
    notifyNotLogin()
    return
  }
  if (!gameStore.sessionToken) {
    loginModalStore.open()
    return
  }

  let wsPort = Number(gameStore.websocketPort) || 0
  if (!wsPort) {
    try {
      // 对齐 Cocos ProcedureEnterLobby：进入大厅阶段同步 websocket 端口。
      wsPort = await LoginSession.EnsureWS()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t('UIClub_Fetch') + ' websocket ' + t('UIClub_Fail3')
      showFailToast(message)
      return
    }
  }

  // 进入牌桌参数固定：名称 + 用户ID + token；附带房间信息用于切桌定位。
  const payload: EnterTablePayload = {
    userName: gameStore.loginNickname || gameStore.loginAccount || 'guest',
    userId: gameStore.loginUserId || gameStore.loginAccount || '',
    token: gameStore.sessionToken,
    websocketPort: wsPort,
    from: 'h5-club-table',
    roomId: String(room.rid ?? ''),
    roomName: String(room.name ?? ''),
    roomInfo: room,
  }

  enterTable(payload)
  gameStore.setLastEnterTable(payload)
  // showSuccessToast(`已请求进入牌桌：${room.name || room.rid}`)
}

function handleToggleGroup(groupKey: string): void {
  const expanded = expandedMap[groupKey] === true
  expandedMap[groupKey] = !expanded
  persistRoomGroupExpandedCache()
}

function handleClubHeaderTabClick(tab: ClubHeaderTabName): void {
  if (tab === 'mahjong') {
    showFailToast(t('UIClub_Text17'))
    return
  }
  if (
    (tab === 'event' && gameStore.sessionToken && currentJoinedClub.value && !isChannelPackage) ||
    isChannelPackage
  ) {
    mttListStore.bootstrapMttList()
  }
  clubHeaderTab.value = tab
}

function handleQuickActionClick(action: 'safety' | 'ranking'): void {
  if (action === 'safety') {
    if (selectedTribeId.value <= 0) {
      showFailToast(t('UIClub_CurrentClubOfNot'))
      return
    }

    showSafetyGuardPopup.value = true
    return
  }
  showFailToast(t('UIClub_InDeve2'))
}

function handleOpenCustomerService(): void {
  const clubId = selectedClubId.value
  if (clubId <= 0) {
    showFailToast(t('UIClub_CurrentClubNo'))
    return
  }

  openGlobalCustomerServiceChat({
    imServiceType: 1,
    clubId,
    tribeId: selectedTribeId.value,
  })
}

function handleCreateTableClick(): void {
  if (!canCreateTable.value) {
    showFailToast(t('UIClub_AdminOrFounderCanTable'))
    return
  }

  void router.push({ path: '/club/table/create', query: { origin_type: 5 } })
}

function handleFloatingMenuClick(): void {
  goToClubDetail()
}

function goToClubDetail(): void {
  void router.push('/club/detail')
}

function toggleAnnounceExpanded(): void {
  announceExpanded.value = !announceExpanded.value
}

async function fetchClubNotice(options: { showPopup?: boolean } = {}): Promise<void> {
  if (!currentJoinedClub.value) {
    return
  }

  const clubId = selectedClubId.value
  if (clubId <= 0) {
    clubNoticeQueue.value = []
    clubNoticeQueueIndex.value = 0
    showClubNoticePopup.value = false
    return
  }

  try {
    const response = await postOrgClubNoticeApi({ club_id: clubId })
    if (Number(response.code) !== 0) {
      throw new Error(String(response.msg || t('UIClub_ClubLoadFail')))
    }

    const info = response.data?.info
    const tribeTitle = String(info?.tribe_notice_title || '').trim()
    const tribeContent = String(info?.tribe_notice || '').trim()
    const clubTitle = String(info?.title || '').trim()
    const clubContent = String(info?.content || '').trim()
    const startTime = String(info?.start_time || '').trim()
    const endTime = String(info?.end_time || '').trim()
    const dateText = formatNoticeDate(startTime || endTime)
    const queue: ClubNoticeViewModel[] = []

    if (tribeTitle || tribeContent) {
      queue.push({
        source: 'tribe',
        title: tribeTitle || t('UIClub_Union'),
        content: (tribeContent || tribeTitle).replace(/\[link\]|\[\/link\]/g, ''),
        dateText,
      })
    }

    if (clubTitle || clubContent) {
      queue.push({
        source: 'club',
        title: clubTitle || t('UIClub_Club2'),
        content: (clubContent || clubTitle).replace(/\[link\]|\[\/link\]/g, ''),
        dateText,
      })
    }

    clubNoticeQueue.value = queue
    clubNoticeQueueIndex.value = 0

    if (!queue.length) {
      showClubNoticePopup.value = false
      return
    }

    if (options.showPopup) {
      showClubNoticePopup.value = true
    }
  } catch (error) {
    clubNoticeQueue.value = []
    clubNoticeQueueIndex.value = 0
    const message = error instanceof Error ? error.message : t('UIClub_ClubLoadFail')
    showFailToast(message)
  }
}

async function handleIgnoreNoticeToday(): Promise<void> {
  if (ignoringClubNotice.value) {
    return
  }

  const clubId = selectedClubId.value
  if (clubId <= 0) {
    showClubNoticePopup.value = false
    return
  }

  ignoringClubNotice.value = true
  try {
    const response = await postOrgClubNoticeIgnoreApi({ club_id: clubId })
    if (Number(response.code) !== 0) {
      throw new Error(String(response.msg || t('UIClub_Fail4')))
    }
    showClubNoticePopup.value = false
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_Fail4')
    showFailToast(message)
  } finally {
    ignoringClubNotice.value = false
  }
}

function formatNoticeDate(rawDate: string): string {
  if (!rawDate) {
    return ''
  }

  const plain = rawDate
    .trim()
    .replace(/[.]/g, '-')
    .replace(/[Tt].*$/, '')
  const match = plain.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (match) {
    const [, year, month, day] = match
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
  }

  return rawDate
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

function resolveNameByUnityRule(rawName: string): string {
  if (!rawName) {
    return ''
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

function handleMttCardAction(item: MttItem): void {
  if (isChannelPackage && !gameStore.sessionToken) {
    notifyNotLogin()
    return
  }
  router.push({ name: 'mtt-detail', query: { id: String(item.id) } })
}

function handleMttCardClick(item: MttItem): void {
  if (isChannelPackage && !gameStore.sessionToken) {
    notifyNotLogin()
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
    groups.push(
      buildGroup('club', resolveLabel('UIGuildMain_ClubGame', t('UIClub_Club3')), clubItems),
    )
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
    const seriesName =
      resolveNameByUnityRule(toSafeString(seriesInfo?.name)) || t('UIClub_Text18') + ' #' + seriesId
    const seriesItems = [...seriesBucketMap[seriesId]].sort(compareSeriesRoom)
    const seriesLayout = resolveSeriesLayoutByType(toSafeInt(seriesInfo?.type), seriesItems.length)
    groups.push(buildGroup(`series-${seriesId}`, seriesName, seriesItems, seriesLayout))
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
  // 对齐 Unity UIMatchItemListComponent：club_display_platform_mtt 开启时平台赛事直接可见。
  return appConfigStore.clubDisplayPlatformMtt
    ? checkIsShowForClubAndTribeAndPlatform(roomLike, clubId, tribeId)
    : checkIsShowForClubAndTribe(roomLike, clubId, tribeId)
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

function matchTabRoom(room: RoomRecord, tabName: GameTypeTabName): boolean {
  const gameType = Number(room.game_type) || 0
  const pokerType = Number(room.poker_type) || 0

  if (tabName === 'all') return true
  if (tabName === 'texas') return gameType === 0 && pokerType === POKER_TYPE_LONG
  if (tabName === 'omaha') return [1, 2, 3].includes(gameType) && pokerType === POKER_TYPE_LONG
  if (tabName === 'sixPlus') return pokerType === POKER_TYPE_SHORT
  return true
}

function getGameName(gameType: number, pokerType: number): string {
  if (gameType === 0 && pokerType === POKER_TYPE_SHORT) return '6+'
  if ([1, 2, 3].includes(gameType)) return t('adaptation10009')
  if (gameType === 0) return t('UIClub_Text19')
  return t('UIClub_Text15')
}

function getGameIconImage(gameType: number, pokerType: number): string {
  if (gameType === 0 && pokerType === POKER_TYPE_SHORT) return gameType6Plus
  if ([1, 2, 3].includes(gameType)) return gameTypePlo
  return gameTypeNlh
}

function formatBlind(sb: number): string {
  const smallBlind = Number(sb) || 0
  const bigBlind = smallBlind * 2
  return `${formatChip(smallBlind)} / ${formatChip(bigBlind)}`
}

function formatChip(rawValue: number): string {
  const safeRaw = Number(rawValue) || 0
  if (safeRaw >= 100000) {
    return `${formatChipBase(safeRaw / 1000)}k`
  }
  return formatChipBase(safeRaw)
}

function formatChipBase(rawValue: number): string {
  const display = rawValue / 100
  if (!Number.isFinite(display)) return '0'
  return display.toFixed(2).replace(/\.?0+$/, '')
}
const handleBack = () => {
  router.push('/club')
}
</script>

<template>
  <div
    class="page-shell room-list-page themeType2"
    :class="{ 'room-list-page--channel': showChannelTabbar }"
    :style="[backgroundStyle, pageStyle]"
  >
    <div class="club-auth-interaction-layer">
      <HeaderBack
        :show-back="!isChannelPackage"
        @back="handleBack"
        @click.capture="handleGuestPageClick"
      >
        <div class="club-identity">
          <div class="club-avatar">
            <img :src="clubCoverUrl" alt="club avatar" />
          </div>

          <div class="club-meta">
            <p class="club-name">
              {{ clubDisplayName }}
            </p>
            <div class="club-sub-meta">
              <div class="club-id-wrap">
                <span class="club-id-tag">ID</span>
                <span class="club-id-text">{{ clubDisplayId }}</span>
              </div>
              <div class="club-member-wrap">
                <img :src="twoPersonIcon" class="club-member-dot" alt="" />
                <span>{{ clubMemberCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="action-wrap">
          <TopActionButton
            :name="t('UIGuildFund_RechargeText')"
            :icon="walletIcon"
            icon-alt="wallet"
            @click="router.push('/wallet')"
          />
          <TopActionButton
            v-if="currentClub?.support_im_rid"
            :name="t('UIMineMain01')"
            :icon="serviceIcon"
            icon-alt="service"
            @click="handleOpenCustomerService"
          />
        </div>
      </HeaderBack>
      <header class="club-header">
        <button
          class="announce-bar"
          :class="{ 'announce-bar--expanded': announceExpanded }"
          type="button"
          @click="toggleAnnounceExpanded"
        >
          <span class="announce-text">{{ clubNoticeText }}</span>
          <span class="announce-arrow" :class="{ 'announce-arrow--expanded': announceExpanded }">
            ›
          </span>
        </button>

        <div class="club-header-tabs">
          <button
            class="club-header-tab"
            :class="{ 'club-header-tab--active': clubHeaderTab === 'poker' }"
            type="button"
            @click="handleClubHeaderTabClick('poker')"
          >
            {{ t('UIHomePokerArea') }}
          </button>
          <button
            v-if="false"
            class="club-header-tab"
            :class="{ 'club-header-tab--active': clubHeaderTab === 'mahjong' }"
            type="button"
            @click="handleClubHeaderTabClick('mahjong')"
          >
            {{ t('UIHomeMahjongArea') }}
          </button>
          <button
            class="club-header-tab"
            :class="{ 'club-header-tab--active': clubHeaderTab === 'event' }"
            type="button"
            @click="handleClubHeaderTabClick('event')"
          >
            {{ t('UIClub_Text14') }}
          </button>
          <button
            class="club-header-tab"
            :class="{ 'club-header-tab--active': clubHeaderTab === 'minigame' }"
            type="button"
            @click="handleClubHeaderTabClick('minigame')"
          >
            小游戏专区
          </button>
          <button
            class="club-header-tab"
            :class="{ 'club-header-tab--active': clubHeaderTab === 'casino' }"
            type="button"
            @click="handleClubHeaderTabClick('casino')"
          >
            娱乐场
          </button>
        </div>

        <div class="club-quick-actions" @click.capture="handleGuestPageClick">
          <button
            class="club-quick-card club-quick-card--safety"
            type="button"
            @click="handleQuickActionClick('safety')"
          >
            <img
              class="quick-card-photo quick-card-photo--safety"
              :src="quickSafetyBg"
              alt=""
              aria-hidden="true"
            />
            <span class="quick-card-title">{{ t('UISafety') }}</span>
          </button>

          <button
            class="club-quick-card club-quick-card--ranking"
            type="button"
            @click="handleQuickActionClick('ranking')"
          >
            <img
              class="quick-card-photo quick-card-photo--ranking"
              :src="quickRankingBg"
              alt=""
              aria-hidden="true"
            />
            <span class="quick-card-title">{{ t('UINiuZai_RankListTitle') }}</span>
          </button>
        </div>
      </header>

      <template v-if="clubHeaderTab === 'event'">
        <section class="group-list group-list--flush">
          <template v-if="renderGroups.length">
            <div v-for="group in renderGroups" :key="group.groupId" class="mtt-group">
              <div v-if="group.title || group.showViewAll" class="mtt-group__header">
                <span v-if="group.title" class="mtt-group__title">{{ group.title }}</span>
                <span v-else class="mtt-group__title mtt-group__title--empty"></span>
                <span
                  v-if="group.showViewAll"
                  class="mtt-group__toggle"
                  @click="handleViewAll(group)"
                >
                  {{ group.expanded ? t('UIMinePutAway') : t('UIHappyShop_ShowAll') }}
                </span>
              </div>

              <div v-if="group.layout === 'sm'" class="mtt-grid mtt-grid--sm">
                <MttCard
                  v-for="item in group.displayItems"
                  :key="item.id"
                  size="sm"
                  :item="item"
                  @action="handleMttCardAction"
                  @click="handleMttCardClick"
                />
              </div>

              <div v-else-if="group.layout === 'md'" class="mtt-grid mtt-grid--md">
                <MttCard
                  v-for="item in group.displayItems"
                  :key="item.id"
                  size="md"
                  :item="item"
                  @action="handleMttCardAction"
                  @click="handleMttCardClick"
                />
              </div>

              <div v-else class="mtt-grid mtt-grid--lg">
                <MttCard
                  v-for="item in group.displayItems"
                  :key="item.id"
                  size="lg"
                  :item="item"
                  @action="handleMttCardAction"
                  @click="handleMttCardClick"
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

      <template v-else-if="clubHeaderTab === 'poker'">
        <GameTypeTabbar
          v-model="activeTab"
          class="club-game-tabs"
          :tabs="[
            { name: 'all', title: t('UIMatch_GtO8YEdb') },
            { name: 'texas', title: t('UITexasInfo_Texas') },
            { name: 'omaha', title: t('UITexasInfo_Omaha') },
            { name: 'sixPlus', title: t('6+') },
          ]"
        />

        <section class="group-list">
          <PokerTableGroupCard
            v-for="group in groupedRecords"
            :key="group.groupKey"
            :group="group"
            :expanded="expandedMap[group.groupKey] === true"
            @toggle="handleToggleGroup"
            @table-click="handleTableClick"
          />

          <div v-if="!groupedRecords.length" class="empty-wrap">
            <VanIcon name="search" />
            <span>
              {{ t('UINoGameTip') }}
            </span>
          </div>
        </section>
      </template>

      <div v-if="clubHeaderTab === 'minigame'" class="club-embedded-container">
        <MiniGameView :hideHeader="true" :clubId="selectedClubId" />
      </div>

      <div v-if="clubHeaderTab === 'casino'" class="club-embedded-container">
        <CasinoView :hideHeader="true" :clubId="selectedClubId" />
      </div>

      <div v-if="showFloatingActionArea" class="floating-action-area" v-show="clubHeaderTab === 'poker'">
        <button
          v-if="clubHeaderTab !== 'event' && canCreateTable"
          class="create-table-btn"
          type="button"
          @click="handleCreateTableClick"
        >
          创建牌桌
        </button>
        <button
          v-if="canManageClub"
          :class="{ 'floating-menu-btn--solo': clubHeaderTab === 'event' || !canCreateTable }"
          class="floating-menu-btn"
          type="button"
          aria-label="更多操作"
          @click="handleFloatingMenuClick"
        >
          <img :src="clubDetailButtonIcon" alt="" />
        </button>
      </div>

      <van-popup
        v-model:show="showClubNoticePopup"
        class="club-notice-popup"
        round
        :close-on-click-overlay="true"
        :lock-scroll="true"
        :overlay-style="{ background: 'rgba(8, 8, 8, 0.6)' }"
      >
        <div class="club-notice-card">
          <div class="club-notice-club-pill">{{ clubDisplayName }}</div>
          <p class="club-notice-title">{{ activeClubNotice?.title }}</p>
          <p class="club-notice-date">{{ activeClubNotice?.dateText }}</p>
          <p class="club-notice-content">{{ activeClubNotice?.content }}</p>
          <button
            class="club-notice-ignore-btn"
            type="button"
            :disabled="ignoringClubNotice"
            @click="handleIgnoreNoticeToday"
          >
            今天不再显示提示
          </button>
        </div>
      </van-popup>

      <SafetyGuardDialog v-model:show="showSafetyGuardPopup" :tribe-id="selectedTribeId" />
    </div>
    <MainBottomTab v-if="showChannelTabbar" />
    <LoginModal />
  </div>
</template>

<style scoped lang="scss">
.room-list-page {
  position: relative;
  width: min(100%, var(--app-max-width));
  margin: 0 auto;
  height: 100dvh;
  color: #fff;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding-top: 0;
}

.club-header {
  position: relative;
  z-index: 2;
  padding: 0.22rem 0.4562rem 0;
}

// 用 flex 撑满视口：顶部/头部固定高度，内容区（列表/内嵌页）占满剩余空间并贴到底部，
// 避免写死的 max-height: calc(100dvh - Nrem) 猜错头部高度导致底部被裁或留白。
.club-auth-interaction-layer {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  // 不加 overflow: hidden：否则会裁掉 .group-list 用负 margin 铺满左右的“出血边”。
  // 竖向溢出由 page-shell(overflow:hidden) 与列表自身 overflow-y:auto 兜住。

  // HeaderBack（顶部栏）为第一个子元素，固定高度不压缩。
  > :first-child {
    flex-shrink: 0;
  }

  .club-header {
    flex-shrink: 0;
  }

  // 玩法子标签（全部/德州/奥马哈…）固定高度，不随内容压缩。
  .club-game-tabs {
    flex-shrink: 0;
  }
}

.club-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.16rem;
}

.club-identity {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.096rem;
}

.header-back-btn {
  width: 0.765rem;
  height: 0.765rem;
  border: 0;
  padding: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.header-back-btn svg {
  width: 0.189rem;
  height: 0.322rem;
}

.club-avatar {
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 50%;
  overflow: hidden;
  border: 0.0133rem solid rgba(255, 255, 255, 0.24);
}

.club-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-meta {
  min-width: 0;
}

.club-name {
  margin: 0;
  max-width: min(2.9rem, 42vw);
  font-size: 0.345rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.club-sub-meta {
  margin-top: 0.08rem;
  display: flex;
  align-items: center;
  gap: 0.1446rem;
  font-size: 0.257rem;
  opacity: 0.94;
}

.club-id-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.0655rem;
}

.club-id-tag {
  height: 0.306rem;
  min-width: 0.36rem;
  border-radius: 0.112rem;
  padding: 0 0.089rem;
  background: rgba(255, 255, 255, 0.4);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.216rem;
}

.club-id-text {
  opacity: 0.95;
}

.club-member-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
}

.club-member-dot {
  width: 0.249rem;
  height: 0.211rem;
  object-fit: contain;
}

.action-wrap {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  flex-shrink: 0;
}

.head-action-btn {
  width: 1.564rem;
  height: 0.586rem;
  padding: 0 0.14rem;
  border: 0.008rem solid rgba(255, 255, 255, 0.28);
  border-radius: 0.401rem;
  background: rgba(255, 255, 255, 0.21);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(0.08rem);
  box-shadow: 0 0.05rem 0.15rem rgba(0, 0, 0, 0.24);
}

.head-action-label {
  font-size: 0.2246rem;
  line-height: 1.2;
  text-shadow: 0 0.03rem 0.12rem rgba(0, 0, 0, 0.32);
}

.head-action-icon {
  width: 0.399rem;
  height: 0.399rem;
  object-fit: contain;
}

.announce-bar {
  // margin-top: 0.217rem;
  width: 100%;
  // min-height: 1.0577rem;
  border: 0;
  border-radius: 0.5279rem;
  padding: 0.1325rem 0.1446rem;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.0832rem;
  background: linear-gradient(
    97deg,
    rgba(255, 255, 255, 0.1) 21.11%,
    rgba(230, 230, 230, 0.1) 71.43%
  );
  box-shadow: inset 0 0 0 0.0133rem rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(0.0021rem);
  transition: min-height 0.2s ease;
}

.announce-bar--expanded {
  min-height: 3.25rem;
}

.announce-text {
  min-width: 0;
  font-size: 0.3454rem;
  line-height: 1.4;
  text-align: left;
  flex: 1;
  line-clamp: 1;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.announce-bar--expanded .announce-text {
  line-clamp: 6;
  -webkit-line-clamp: 6;
}

.announce-arrow {
  margin-left: 0.08rem;
  font-size: 0.42rem;
  line-height: 1;
  opacity: 0.88;
  transform: rotate(90deg);
  transition: transform 0.2s ease;
}

.announce-arrow--expanded {
  transform: rotate(-90deg);
}

.club-notice-popup {
  width: min(6.86rem, calc(100vw - 1.2rem));
  border-radius: 0.97rem;
  background: transparent;
}

.club-notice-card {
  position: relative;
  border: 0.0255rem solid rgba(242, 242, 242, 0.4);
  border-radius: 0.97rem;
  padding: 0.42rem 0.41rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.16rem;
  background: linear-gradient(
    102.737deg,
    rgba(142, 142, 142, 0.04) 2.93%,
    rgba(103, 103, 103, 0.1) 33.62%,
    rgba(73, 73, 73, 0.2) 69.79%
  );
  backdrop-filter: blur(0.2rem);
  box-shadow:
    0.092rem 0.115rem 0.184rem rgba(0, 0, 0, 0.25),
    inset 0 0 0.23rem rgba(0, 0, 0, 1),
    inset 0.057rem 0.113rem 0.46rem rgba(242, 242, 242, 0.9);
}

.club-notice-club-pill {
  padding: 0.187rem 0.293rem;
  border-radius: 0.67rem;
  background: rgba(44, 45, 45, 0.31);
  color: #f9f9f9;
  font-size: 0.427rem;
  line-height: 1.2;
}

.club-notice-title {
  margin: 0.1rem 0 0;
  color: #fff;
  font-size: 0.427rem;
  line-height: 1.4;
  text-align: center;
  letter-spacing: 0.009rem;
}

.club-notice-date {
  margin: 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.427rem;
  line-height: 1.4;
}

.club-notice-content {
  margin: 0.06rem 0 0;
  width: 100%;
  min-height: 2.1rem;
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.4rem;
  line-height: 1.4;
  word-break: break-word;
  white-space: pre-wrap;
}

.club-notice-ignore-btn {
  margin-top: 0.3rem;
  width: 100%;
  height: 1.4358rem;
  border: 0.0133rem solid rgba(242, 242, 242, 0.1);
  border-radius: 1.0557rem;
  background: rgba(44, 45, 45, 0.31);
  color: #f9f9f9;
  font-size: 0.4rem;
  font-weight: 500;
  line-height: 1.2;

  &:disabled {
    opacity: 0.5;
  }
}

.club-quick-actions {
  margin-top: 0.4177rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.3293rem;
}

.club-header-tabs {
  margin-top: 0.4177rem;
  display: flex;
  height: 0.6483rem;
  padding: 0;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
}

.club-header-tab {
  position: relative;
  border: 0;
  background: transparent;
  color: #fff;
  text-align: center;
  font-feature-settings:
    'liga' off,
    'clig' off;
  font-family: 'HONOR Sans CN', sans-serif;
  font-size: 0.3521rem;
  font-style: normal;
  font-weight: 500;
  line-height: 95%;
  opacity: 0.7;
  padding: 0 0 0.03rem;
}

.club-header-tab--active {
  color: #fff;
  text-align: center;
  font-feature-settings:
    'liga' off,
    'clig' off;
  font-family: 'HONOR Sans CN', sans-serif;
  font-size: 0.3521rem;
  font-style: normal;
  font-weight: 700;
  line-height: 95%;
  opacity: 1;
}

.club-header-tab--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 0.032rem;
  border-radius: 999px;
  background: rgba(234, 234, 234, 0.92);
  box-shadow: 0 0 0.06rem rgba(255, 255, 255, 0.45);
}

.club-quick-card {
  position: relative;
  height: 1.9357rem;
  border: 0.0107rem solid rgba(255, 255, 255, 0.36);
  border-radius: 0.6105rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: linear-gradient(140deg, rgba(90, 167, 230, 0.24), rgba(10, 40, 65, 0.56));
  box-shadow: 0 0.08rem 0.2rem rgba(0, 0, 0, 0.26);
}

.club-quick-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(97deg, rgba(16, 25, 38, 0.08) 8%, rgba(10, 18, 34, 0.55) 72%);
  z-index: 1;
  pointer-events: none;
}

.club-quick-card::after {
  content: '';
  position: absolute;
  inset: -0.0107rem;
  border-radius: inherit;
  border: 0.0107rem solid rgba(255, 255, 255, 0.58);
  box-shadow:
    inset 0 0 0.08rem rgba(255, 255, 255, 0.34),
    inset 0 0 0.2rem rgba(255, 255, 255, 0.14),
    0 0 0.08rem rgba(255, 255, 255, 0.18);
  filter: blur(0.002rem);
  pointer-events: none;
  z-index: 4;
}

.club-quick-card--safety {
  background: linear-gradient(145deg, rgba(83, 187, 245, 0.3), rgba(41, 71, 108, 0.68));
}

.club-quick-card--ranking {
  background: linear-gradient(145deg, rgba(245, 172, 90, 0.26), rgba(74, 36, 24, 0.7));
}

.quick-card-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.quick-card-photo--safety,
.quick-card-photo--ranking {
  transform: scale(1.04);
}

.quick-card-photo--safety {
  object-position: 42% 55%;
}

.quick-card-photo--ranking {
  object-position: center 58%;
}

.quick-card-layer {
  position: absolute;
  pointer-events: none;
  object-fit: contain;
  z-index: 2;
}

.quick-card-layer--safety-bg {
  width: 1.52rem;
  height: 1.2rem;
  left: -0.26rem;
  top: -0.04rem;
  opacity: 0.5;
}

.quick-card-layer--ranking-bg {
  width: 1.46rem;
  height: 1.42rem;
  left: -0.24rem;
  top: -0.04rem;
  opacity: 0.52;
}

.quick-card-title {
  position: relative;
  z-index: 3;
  margin-left: 1.45rem;
  color: #fff;
  font-feature-settings:
    'liga' off,
    'clig' off;
  font-family: 'HONOR Sans CN', sans-serif;
  font-size: 0.4177rem;
  font-style: normal;
  font-weight: 700;
  line-height: 140%;
  text-shadow: 0 0.0321rem 0.1767rem rgba(0, 0, 0, 0.25);
}

@media (max-width: 360px) {
  .club-name {
    max-width: min(2.2rem, 36vw);
  }

  .head-action-btn {
    width: min(1.38rem, 21vw);
  }

  .quick-card-title {
    font-size: 0.36rem;
  }
}

.group-list {
  position: relative;
  z-index: 1;
  margin-top: -0.03rem;
  margin-left: calc(-1 * var(--app-side-padding));
  margin-right: calc(-1 * var(--app-side-padding));
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  align-self: stretch;
  border-radius: 0.533rem 0.533rem 0 0;
  padding: 0.2rem 0 0.8rem;
  background: rgba(34, 34, 34, 0.5);
  backdrop-filter: blur(0.2213rem);
}

.group-list--flush {
  background: transparent;
  backdrop-filter: none;
}

.club-embedded-container {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  padding: 0.34rem 0.96rem 2.2rem 0.38rem;
  background: transparent;
  width: 10.56rem;
  margin-left: -0.28rem;
}

.mtt-content {
  position: relative;
  z-index: 1;
  margin-top: 0;
  max-height: calc(100dvh - 6.9rem);
  overflow-y: auto;
  padding: 0.34rem 0.38rem 2.2rem;
  backdrop-filter: blur(0.3533rem) saturate(1.04);
}

.room-list-page--channel {
  .group-list,
  .mtt-content {
    padding-bottom: 3.55rem;
  }

  .floating-action-area {
    bottom: calc(2.64rem + env(safe-area-inset-bottom));
  }
}

.mtt-group {
  margin-bottom: 0.48rem;
  padding: 0 0.4rem;
}

.mtt-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 0.32rem;
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

.mtt-grid {
  width: 100%;
}

.mtt-grid--sm {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.26rem;
}

.mtt-grid--md {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.26rem;
}

.mtt-grid--lg {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.floating-action-area {
  position: fixed;
  left: 0.44rem;
  right: 0.36rem;
  bottom: calc(0.3rem + env(safe-area-inset-bottom));
  z-index: 10;
  display: flex;
  align-items: center;
}

.create-table-btn {
  flex: 1;
  height: 1.25rem;
  border: 0.0133rem solid rgba(242, 242, 242, 0.8);
  border-radius: 0.958rem;
  background-image: linear-gradient(168deg, rgba(85, 243, 41, 1) 7.55%, rgba(62, 173, 6, 1) 71.92%);
  color: #fbfbfb;
  font-size: 0.46rem;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  backdrop-filter: blur(0.08rem);
  box-shadow: 0 0.16rem 0.32rem rgba(0, 0, 0, 0.22);
  margin-bottom: 0.8rem;
}

.floating-menu-btn {
  margin-left: -0.58rem;
  margin-bottom: 0.8rem;
  margin-right: 0.3rem;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}

.floating-menu-btn--solo {
  margin-left: auto;
}

.floating-menu-btn img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

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
