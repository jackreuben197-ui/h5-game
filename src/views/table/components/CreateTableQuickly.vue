<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TableTab from '@/components/GameCreateForm/TableTab.vue'
import TableSlider from '@/components/GameCreateForm/TableSlider.vue'
import QuickSwitchCard from '@/components/GameCreateForm/QuickSwitchCard.vue'
import { defaultNlhFormState, type NlhFormState } from '../tableSections/formState'
import { SB_OPTIONS, ANTE_OPTIONS, resolveBringinBbRange } from '../tableSections/topSlides'
import {
  SEAT_COUNT_NLH_OPTIONS,
  SEAT_COUNT_PLO5_OPTIONS,
  SEAT_COUNT_SIX_PLUS_OPTIONS,
} from '../tableSections/constants'
import { useUserInfoStore } from '@/stores/userInfo'
import { useAppConfigStore } from '@/stores/appConfig'
import type { DiamondConfigItem, DiamondSetting } from '@/api/models/config'
import {
  postOrggetTemplateApi,
  postOrgRoomCreateApi,
  postOrgRoomBatchCreateApi,
  postOrgTemplateDeleteApi,
  postCmsExtRoomUserTemplateListApi,
  postCmsExtRoomUserBatchCreateApi,
} from '@/api/cmsext'
import { GameDialog } from '@/components/Dialog'
import { showGameToast } from '@/components/Toast'
import FieldTip from '@/components/GameCreateForm/FieldTip.vue'
import icDiamondBalance from '@/assets/icons/ic_diamond_balance.png'
import iconPeople from '@/assets/icons/icon_people.png'
import iconAudio from '@/assets/icons/icon_audio.png'
import iconVideo from '@/assets/icons/icon_video.png'
import iconDelete from '@/assets/icons/icon_delete.svg'
import iconEdit from '@/assets/icons/icon_edit.svg'
import iconCards from '@/assets/icons/icon_cards.png'
import tableIconSquid from '@/assets/images/img_squid_game.png'
import tableIconMushroom from '@/assets/icons/table_icon_mushroom.png'
import tableIconCritical from '@/assets/icons/table_icon_critical.png'
import blueBlur from '@/assets/images/blue_blur.png'
import greenBlur from '@/assets/images/green_blur.png'
import purpleBlur from '@/assets/images/purple_blur.png'

const emit = defineEmits<{
  'edit-template': [roomConfig: Record<string, unknown>]
}>()

const router = useRouter()
const route = useRoute()
const userInfoStore = useUserInfoStore()
const appConfigStore = useAppConfigStore()

const formState = reactive<NlhFormState>({
  ...defaultNlhFormState,
  play_duration: 7200,
  anti_cheat_type: 3,
  fee_on: true,
  insurance: 1,
  squid: 1,
})

// 防作弊玩法 Tab 选项
const antiCheatOptions = [
  { text: '语音桌', value: 2 },
  { text: '视频桌', value: 3 },
]

// 俱乐部钻石余额
const clubDiamondBalance = computed(() => {
  return Number(userInfoStore.currentClub?.diamonds ?? 0)
})

interface FeePrice {
  originPrice: number
  discountPrice: number
  isDiscount: boolean
}

interface FeeDetailItem {
  label: string
  unitOrigin: number
  unitCurrent: number
  multiple: number
  totalOrigin: number
  totalCurrent: number
  isDiscount: boolean
}

const DIAMOND_CONFIG_TYPE = {
  CREATE_TABLE: 1,
  AUDIO_TABLE: 3,
  FACE_VERIFICATION: 4,
  VIDEO_FULL_TIME: 5,
  VIDEO_RANDOM: 6,
  VIDEO_SEQUENCE: 7,
  CHAT: 10,
  BLOCKCHAIN: 18,
  INSURANCE: 22,
  SQUID: 27,
} as const

const CLUB_INTERNAL_TABLE_TYPE_EXT = 310
const FRIENDS_TABLE_TYPE_EXT = 410
const DEFAULT_QUICK_PLAY_DURATION_SECONDS = 7200

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isInDiscountWindow(config: DiamondConfigItem, nowSec: number): boolean {
  if (!config.start_time || !config.end_time) return false
  return nowSec >= config.start_time && nowSec <= config.end_time
}

function resolveDiamondSettingBySb(config: DiamondConfigItem, sb: number): DiamondSetting | null {
  if (!config.setting.length) return null
  const exact = config.setting.find((item) => item.sb === sb)
  return exact || config.setting[0] || null
}

function getConfigPrice(config: DiamondConfigItem | null, sb: number): FeePrice {
  if (!config) return { originPrice: 0, discountPrice: 0, isDiscount: false }
  const setting = resolveDiamondSettingBySb(config, sb)
  if (!setting) return { originPrice: 0, discountPrice: 0, isDiscount: false }
  if (config.status === 2) {
    return { originPrice: setting.price, discountPrice: 0, isDiscount: true }
  }

  const nowSec = Math.floor(Date.now() / 1000)
  if (!isInDiscountWindow(config, nowSec)) {
    return { originPrice: setting.price, discountPrice: setting.price, isDiscount: false }
  }
  if (setting.discount_price === 0) {
    return { originPrice: setting.price, discountPrice: 0, isDiscount: true }
  }
  if (setting.discount_price < setting.price) {
    return {
      originPrice: setting.price,
      discountPrice: setting.discount_price,
      isDiscount: true,
    }
  }
  return { originPrice: setting.price, discountPrice: setting.price, isDiscount: false }
}

function findDiamondConfig(configType: number, typeExt: number): DiamondConfigItem | null {
  return appConfigStore.diamondConfig?.[configType]?.[typeExt] ?? null
}

const currentOriginType = computed(() => {
  const v = Math.floor(toNumber(route.query.origin_type, 5))
  return v > 0 ? v : 5
})

function getTableTypeExt(): number {
  const fromQuery = toNumber(route.query.table_type_ext, 0)
  if (fromQuery > 0) return fromQuery
  return currentOriginType.value === 4 ? FRIENDS_TABLE_TYPE_EXT : CLUB_INTERNAL_TABLE_TYPE_EXT
}

function normalizePlayDurationSeconds(raw: unknown): number {
  const value = Math.floor(toNumber(raw, DEFAULT_QUICK_PLAY_DURATION_SECONDS))
  if (value <= 0) return DEFAULT_QUICK_PLAY_DURATION_SECONDS
  // 服务端历史数据可能是“小时”单位，这里统一归一到秒。
  if (value <= 24) return value * 3600
  return value
}

function getAntiCheatType(): number {
  return Math.floor(toNumber(formState.anti_cheat_type, 1))
}

function getBanConfigType(antiCheatType: number, antiCheatVideoType: number): number | null {
  if (antiCheatType === 2) return DIAMOND_CONFIG_TYPE.AUDIO_TABLE
  if (antiCheatType === 4) return DIAMOND_CONFIG_TYPE.FACE_VERIFICATION
  if (antiCheatType !== 3) return null
  if (antiCheatVideoType === 2) return DIAMOND_CONFIG_TYPE.VIDEO_RANDOM
  if (antiCheatVideoType === 3) return DIAMOND_CONFIG_TYPE.VIDEO_SEQUENCE
  return DIAMOND_CONFIG_TYPE.VIDEO_FULL_TIME
}

function getBanMultiple(antiCheatType: number, playDurationSeconds: number): number {
  const commonMultiple = Math.max(1, Math.floor(playDurationSeconds / 1800))
  if (antiCheatType === 2 || antiCheatType === 3) return commonMultiple
  return 1
}

function formatFeeCount(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString()
}

function getRequestBringinRange(): { minRate: number; maxRate: number } {
  const range = resolveBringinBbRange(
    appConfigStore.globalConfig?.friend_club_bringin_min_max_bb_range,
  )
  const isSixPlusOrBombpot =
    Number(route.query.game_play_type) === 3 || Number(route.query.bombpot) === 1
  const multiple = isSixPlusOrBombpot ? 2 : 1
  return {
    minRate: Math.floor(range.minBb * multiple),
    maxRate: Math.floor(range.maxBb * multiple),
  }
}

function getRequestSmallBlind(): number {
  const currentSb = Math.floor(toNumber(formState.sb))
  const isSixPlusOrBombpot =
    Number(route.query.game_play_type) === 3 || Number(route.query.bombpot) === 1
  if (isSixPlusOrBombpot) {
    return Math.floor(currentSb / 2)
  }
  return currentSb
}

// ── 模板列表 ──────────────────────────────────────────────

interface TemplateItem {
  id: number
  name: string
  room_config: Record<string, unknown>
  game_play_type: number
  sb: number
  seat_count: number
  anti_cheat_type: number
  play_duration: number
  chat_type: number
  encrypt_cards: number
  origin_type: number
}

function parseRoomConfig(raw: unknown): Record<string, unknown> {
  if (isPlainObject(raw)) return raw
  if (typeof raw !== 'string') return {}
  try {
    const parsed = JSON.parse(raw)
    return isPlainObject(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function toTemplateItem(raw: Record<string, unknown>): TemplateItem {
  const roomConfig = parseRoomConfig(raw.room_config)
  const mergedConfig = Object.keys(roomConfig).length ? roomConfig : raw
  return {
    id: Math.floor(toNumber(raw.id, toNumber(raw.template_id, toNumber(mergedConfig.id)))),
    name: String(raw.name ?? mergedConfig.name ?? ''),
    room_config: mergedConfig,
    game_play_type: Math.floor(
      toNumber(
        raw.game_play_type,
        toNumber(mergedConfig.game_play_type, toNumber(raw.room_type, 1)),
      ),
    ),
    sb: Math.floor(toNumber(raw.sb, toNumber(mergedConfig.sb))),
    seat_count: Math.floor(toNumber(raw.seat_count, toNumber(mergedConfig.seat_count, 2))),
    anti_cheat_type: Math.floor(
      toNumber(raw.anti_cheat_type, toNumber(mergedConfig.anti_cheat_type, 1)),
    ),
    play_duration: normalizePlayDurationSeconds(raw.play_duration ?? mergedConfig.play_duration),
    chat_type: Math.floor(toNumber(raw.chat_type, toNumber(mergedConfig.chat_type, 1))),
    encrypt_cards: Math.floor(toNumber(raw.encrypt_cards, toNumber(mergedConfig.encrypt_cards, 1))),
    origin_type: Math.floor(toNumber(raw.origin_type, toNumber(mergedConfig.origin_type, 5))),
  }
}

function extractTemplateList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (!isPlainObject(raw)) return []
  const candidates: unknown[] = [
    raw.data,
    raw.list,
    raw.records,
    isPlainObject(raw.data) ? raw.data.data : undefined,
    isPlainObject(raw.data) ? raw.data.list : undefined,
    isPlainObject(raw.data) ? raw.data.records : undefined,
  ]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
    }
  }
  return []
}

function getCurrentGamePlayType(): number {
  const fromQuery = Math.floor(toNumber(route.query.game_play_type, 0))
  if (fromQuery > 0) return fromQuery
  return templateContext.gamePlayType || 1
}

const templates = ref<TemplateItem[]>([])
const activeTemplateId = ref<number>(0)
const loadingTemplates = ref(false)
const hasInitializedTemplate = ref(false)
const templateContext = reactive({
  gamePlayType: 1,
})
const feeContext = reactive({
  tableTypeExt: getTableTypeExt(),
  antiCheatVideoType: 1,
  chatEnabled: true,
  blockchainEnabled: true,
})

// ── 快速开桌预设配置（顶部表单不可见字段：play_duration / chat_type / encrypt_cards）──
// standard: true + standard_ext: true，取第一条；与底部模板列表无关。

interface QuickPresetConfig {
  templateId: number
  play_duration: number
  chat_type: number
  encrypt_cards: number
}

const quickPresetConfig = ref<QuickPresetConfig | null>(null)

// 客户端用 game_type_arr + poker_type + bombpot 筛选，而不是 game_play_type
function buildGameTypeParams(gamePlayType: number): Record<string, unknown> {
  switch (gamePlayType) {
    case 3: // 6+短牌
      return { game_type_arr: [0, 1, 2, 3], poker_type: [2], bombpot: [0] }
    case 2: // 奥马哈
      return { game_type_arr: [1, 2, 3], poker_type: [0], bombpot: [0] }
    default: // NLH德州
      return { game_type_arr: [0], poker_type: [0], bombpot: [0] }
  }
}

async function fetchQuickPresetConfig(): Promise<void> {
  try {
    const gpt = Math.floor(toNumber(route.query.game_play_type, 0)) || 1
    const res = await postOrggetTemplateApi({
      standard: true,
      standard_ext: true,
      mode: 1,
      origin_type: currentOriginType.value,
      ...buildGameTypeParams(gpt),
    })
    if (res.code === 0) {
      const listCandidate = extractTemplateList(res.data)
      const raw = listCandidate[0]
      if (isPlainObject(raw)) {
        const cfg = parseRoomConfig(raw.room_config)
        const merged = Object.keys(cfg).length ? cfg : raw
        const preset: QuickPresetConfig = {
          templateId: Math.floor(toNumber(raw.id ?? merged.id)),
          play_duration: normalizePlayDurationSeconds(raw.play_duration ?? merged.play_duration),
          chat_type: Math.floor(toNumber(raw.chat_type ?? merged.chat_type, 1)),
          encrypt_cards: Math.floor(toNumber(raw.encrypt_cards ?? merged.encrypt_cards, 1)),
        }
        quickPresetConfig.value = preset
        formState.play_duration = preset.play_duration
        feeContext.chatEnabled = preset.chat_type > 0
        feeContext.blockchainEnabled = preset.encrypt_cards > 0
      }
    }
  } catch {
    // ignore
  }
}

function syncFeeContextFromTemplate(template: TemplateItem): void {
  feeContext.antiCheatVideoType = Math.floor(
    toNumber(template.room_config?.anti_cheat_video_type, 1),
  )
  // chatEnabled / blockchainEnabled 来自 fetchQuickPresetConfig，不跟随模板卡片变化。
}

function syncTemplateContextFromTemplate(template: TemplateItem): void {
  templateContext.gamePlayType = Math.floor(
    toNumber(template.game_play_type, toNumber(template.room_config?.game_play_type, 1)),
  )
}

function onSelectTemplate(template: TemplateItem): void {
  activeTemplateId.value = template.id
  syncTemplateContextFromTemplate(template)
  syncFeeContextFromTemplate(template)
  // 不覆盖 formState：顶部表单字段由 fetchQuickPresetConfig 和用户操作控制。
}

async function fetchTemplates() {
  loadingTemplates.value = true
  try {
    const isFriendsTable = currentOriginType.value === 4
    const gameTypeParams = buildGameTypeParams(currentGamePlayType.value)
    let res
    if (isFriendsTable) {
      res = await postCmsExtRoomUserTemplateListApi({
        mode: 1,
        limit: 20,
        offset: 0,
        ...gameTypeParams,
      })
    } else {
      res = await postOrggetTemplateApi({
        // standard_ext: true,
        limit: 20,
        offset: 0,
        mode: 1,
        // origin_type: currentOriginType.value,
        ...gameTypeParams,
      })
    }
    if (res.code === 0) {
      const listCandidate = extractTemplateList(res.data)
      const list = listCandidate
        .map((item) => (isPlainObject(item) ? toTemplateItem(item) : null))
        .filter((item): item is TemplateItem => Boolean(item) && (item?.id || 0) > 0)
      templates.value = list
      if (!list.length) {
        activeTemplateId.value = 0
        return
      }

      const fallbackTemplate = list[0]
      if (!hasInitializedTemplate.value) {
        // 首次加载时回填默认模板到表单。
        onSelectTemplate(fallbackTemplate)
        hasInitializedTemplate.value = true
      } else {
        // 已初始化后模板变化（比如删除当前模板）只切换选择，不覆盖用户已改配置。
        activeTemplateId.value = fallbackTemplate.id
        syncTemplateContextFromTemplate(fallbackTemplate)
        syncFeeContextFromTemplate(fallbackTemplate)
      }
    }
  } catch {
    // ignore
  } finally {
    loadingTemplates.value = false
  }
}

onMounted(() => {
  void fetchTemplates()
  void fetchQuickPresetConfig()
})

const currentGamePlayType = computed<number>(() => {
  return Math.floor(toNumber(route.query.game_play_type, 0)) || 1
})

const activeTemplate = computed<TemplateItem | null>(() => {
  if (!templates.value.length) return null
  return (
    templates.value.find((item) => item.id === activeTemplateId.value) || templates.value[0] || null
  )
})

const filteredTemplates = computed<TemplateItem[]>(() => {
  const gpt = currentGamePlayType.value
  return templates.value.filter((item) => item.game_play_type === gpt)
})

const seatCountOptions = computed(() => {
  const gamePlayType = getCurrentGamePlayType()
  if (gamePlayType === 3) return SEAT_COUNT_SIX_PLUS_OPTIONS
  if (gamePlayType === 2) return SEAT_COUNT_PLO5_OPTIONS
  return SEAT_COUNT_NLH_OPTIONS
})

watch(
  seatCountOptions,
  (options) => {
    if (!options.length) return
    const values = options.map((item) => Number(item.value))
    const min = Math.min(...values)
    const max = Math.max(...values)
    if (formState.seat_count < min) formState.seat_count = min
    if (formState.seat_count > max) formState.seat_count = max
  },
  { immediate: true },
)

const feeDetails = computed<FeeDetailItem[]>(() => {
  const tableTypeExt = feeContext.tableTypeExt
  const seatCount = Math.max(2, Math.floor(toNumber(formState.seat_count, 2)))
  const sb = Math.floor(toNumber(formState.sb, 10))
  const playDuration = normalizePlayDurationSeconds(formState.play_duration)
  const details: FeeDetailItem[] = []

  const createConfig = findDiamondConfig(DIAMOND_CONFIG_TYPE.CREATE_TABLE, tableTypeExt)
  const createPrice = getConfigPrice(createConfig, sb)
  const durationMultiple = Math.max(1, Math.floor(playDuration / 1800))
  details.push({
    label: '创建牌桌',
    unitOrigin: createPrice.originPrice,
    unitCurrent: createPrice.discountPrice,
    multiple: durationMultiple,
    totalOrigin: createPrice.originPrice * durationMultiple,
    totalCurrent: createPrice.discountPrice * durationMultiple,
    isDiscount: createPrice.isDiscount,
  })

  const antiCheatType = getAntiCheatType()
  const antiCheatVideoType = feeContext.antiCheatVideoType
  const banConfigType = getBanConfigType(antiCheatType, antiCheatVideoType)
  if (banConfigType) {
    const banConfig = findDiamondConfig(banConfigType, seatCount)
    const banPrice = getConfigPrice(banConfig, sb)
    const banMultiple = getBanMultiple(antiCheatType, playDuration)
    details.push({
      label: '防作弊',
      unitOrigin: banPrice.originPrice,
      unitCurrent: banPrice.discountPrice,
      multiple: banMultiple,
      totalOrigin: banPrice.originPrice * banMultiple,
      totalCurrent: banPrice.discountPrice * banMultiple,
      isDiscount: banPrice.isDiscount,
    })
  }

  // 快速开桌客户端口径：聊天默认开启（无开关，收费提示固定展示）。
  const isChatOn = feeContext.chatEnabled
  if (isChatOn) {
    const chatTypeExt = seatCount * 1000 + tableTypeExt
    const chatConfig = findDiamondConfig(DIAMOND_CONFIG_TYPE.CHAT, chatTypeExt)
    const chatPrice = getConfigPrice(chatConfig, sb)
    details.push({
      label: '聊天消耗',
      unitOrigin: chatPrice.originPrice,
      unitCurrent: chatPrice.discountPrice,
      multiple: 1,
      totalOrigin: chatPrice.originPrice,
      totalCurrent: chatPrice.discountPrice,
      isDiscount: chatPrice.isDiscount,
    })
  }

  // 快速开桌客户端口径：洗切牌默认开启（无开关，收费提示固定展示）。
  const isBlockchainOn = feeContext.blockchainEnabled
  if (isBlockchainOn) {
    const blockchainConfig = findDiamondConfig(DIAMOND_CONFIG_TYPE.BLOCKCHAIN, tableTypeExt)
    const blockchainPrice = getConfigPrice(blockchainConfig, sb)
    details.push({
      label: '洗切牌',
      unitOrigin: blockchainPrice.originPrice,
      unitCurrent: blockchainPrice.discountPrice,
      multiple: durationMultiple,
      totalOrigin: blockchainPrice.originPrice * durationMultiple,
      totalCurrent: blockchainPrice.discountPrice * durationMultiple,
      isDiscount: blockchainPrice.isDiscount,
    })
  }

  const isInsuranceOn = Number(formState.insurance) > 0
  if (isInsuranceOn) {
    const insuranceConfig = findDiamondConfig(DIAMOND_CONFIG_TYPE.INSURANCE, tableTypeExt)
    const insurancePrice = getConfigPrice(insuranceConfig, sb)
    details.push({
      label: '保险',
      unitOrigin: insurancePrice.originPrice,
      unitCurrent: insurancePrice.discountPrice,
      multiple: 1,
      totalOrigin: insurancePrice.originPrice,
      totalCurrent: insurancePrice.discountPrice,
      isDiscount: insurancePrice.isDiscount,
    })
  }

  const isSquidOn = Number(formState.squid) > 0
  if (isSquidOn) {
    const squidConfig = findDiamondConfig(DIAMOND_CONFIG_TYPE.SQUID, tableTypeExt)
    const squidPrice = getConfigPrice(squidConfig, sb)
    details.push({
      label: '鱿鱼玩法',
      unitOrigin: squidPrice.originPrice,
      unitCurrent: squidPrice.discountPrice,
      multiple: 1,
      totalOrigin: squidPrice.originPrice,
      totalCurrent: squidPrice.discountPrice,
      isDiscount: squidPrice.isDiscount,
    })
  }

  return details
})

const createFee = computed(() => {
  const totalOrigin = feeDetails.value.reduce((sum, item) => sum + item.totalOrigin, 0)
  const totalDiscount = feeDetails.value.reduce((sum, item) => sum + item.totalCurrent, 0)
  const hasDiscount = feeDetails.value.some((item) => item.isDiscount)
  return {
    originalPrice: Math.max(0, Math.round(totalOrigin)),
    currentPrice: Math.max(0, Math.round(totalDiscount)),
    isDiscount: hasDiscount,
    discountExpired: !hasDiscount,
  }
})

const createFeeTip = computed(() =>
  feeDetails.value
    .map((item) => {
      const unitPart = `${formatFeeCount(item.unitCurrent)} x ${item.multiple}`
      if (item.totalCurrent <= 0) return `${item.label}: 免费`
      if (item.isDiscount && item.totalOrigin > item.totalCurrent) {
        return `${item.label}: ${unitPart} = ${formatFeeCount(
          item.totalCurrent,
        )} (原价${formatFeeCount(item.totalOrigin)})`
      }
      return `${item.label}: ${unitPart} = ${formatFeeCount(item.totalCurrent)}`
    })
    .join('\n'),
)

// 顶部面板「立即创建」：用 formState + quickPresetConfig.templateId
function buildTopPanelCreateRequest(): Record<string, unknown> {
  const bringinRange = getRequestBringinRange()
  return {
    anti_cheat_type: getAntiCheatType(),
    fee_on: Boolean(formState.fee_on),
    insurance_on: Number(formState.insurance) > 0,
    max_rate: bringinRange.maxRate,
    min_rate: bringinRange.minRate,
    sb: getRequestSmallBlind(),
    squid_on: Number(formState.squid) > 0,
    template_id: quickPresetConfig.value?.templateId ?? 0,
    seat_count: Math.floor(toNumber(formState.seat_count, 2)),
    joker: 0,
    play_hands_limit: 0,
  }
}

// ── 快捷创建 ──────────────────────────────────────────────

const isSubmitting = ref(false)

async function onQuickCreate() {
  if (!quickPresetConfig.value?.templateId) {
    showGameToast('暂无可用模板')
    return
  }
  if (isSubmitting.value) return
  isSubmitting.value = true
  const isFriendsTable = currentOriginType.value === 4
  try {
    const res = await postOrgRoomCreateApi(buildTopPanelCreateRequest())
    if (res.code === 0) {
      showGameToast('创建成功')
      await router.replace({ name: isFriendsTable ? 'friendsTable' : 'club-index' })
    } else {
      showGameToast((res as unknown as { message?: string }).message || '创建失败')
    }
  } catch {
    showGameToast('创建失败')
  } finally {
    isSubmitting.value = false
  }
}

// ── 模板卡片工具 ──────────────────────────────────────────

function hasSquid(tpl: TemplateItem): boolean {
  const cfg = tpl.room_config ?? {}
  if (Number(cfg.squid) > 0) return true
  const subConfigs = cfg.sub_configs
  if (Array.isArray(subConfigs)) {
    return subConfigs.some((sc: unknown) => {
      const s = sc as Record<string, unknown>
      return Number(s.squid_base) > 0
    })
  }
  return false
}

function hasMushroom(tpl: TemplateItem): boolean {
  const cfg = tpl.room_config ?? {}
  return Number(cfg.mushroom) > 0 || Number(cfg.mushroom_mode) > 0
}

function hasCriticalHit(tpl: TemplateItem): boolean {
  const cfg = tpl.room_config ?? {}
  if (Number(cfg.critical_hit) > 0) return true
  const subConfigs = cfg.sub_configs
  if (Array.isArray(subConfigs)) {
    return subConfigs.some((sc: unknown) => {
      const s = sc as Record<string, unknown>
      return s.critical_hit === true
    })
  }
  return false
}

function getGameTypeName(type: number): string {
  switch (type) {
    case 2:
      return '奥马哈'
    case 3:
      return '短牌'
    case 1:
    default:
      return '德州\n扑克'
  }
}

function getGameTypeBg(type: number): string {
  switch (type) {
    case 2:
      return greenBlur
    case 3:
      return purpleBlur
    case 1:
    default:
      return blueBlur
  }
}


function formatBlinds(sb: number, ante?: number): string {
  const sbFace = sb / 100
  const bbFace = sbFace * 2
  const anteFace = ante ? ante / 100 : 0
  if (anteFace > 0) {
    return `${sbFace}/${bbFace}(${anteFace})`
  }
  return `${sbFace}/${bbFace}`
}

function formatTemplateBlinds(tpl: TemplateItem): string {
  if (tpl.game_play_type === 3) {
    // 6+短牌：仅显示 Ante 值
    return String(tpl.sb / 100)
  }
  return formatBlinds(tpl.sb ?? 10, Number(tpl.room_config?.ante ?? 0))
}

function getTemplateSeatCount(tpl: TemplateItem): number {
  return tpl.seat_count || Number(tpl.room_config?.seat_count ?? 0) || 2
}

async function onCreateFromTemplate(tpl: TemplateItem) {
  onSelectTemplate(tpl)
  if (isSubmitting.value) return
  isSubmitting.value = true
  const isFriendsTable = currentOriginType.value === 4
  try {
    let res
    if (isFriendsTable) {
      res = await postCmsExtRoomUserBatchCreateApi({
        data: [{ template_id: tpl.id, count: 1 }],
      })
    } else {
      res = await postOrgRoomBatchCreateApi({
        data: [
          {
            template_id: tpl.id,
            count: 1,
            sb: tpl.sb ?? 0,
            ante: Number(tpl.room_config?.ante ?? 0),
          },
        ],
      })
    }
    if (res.code === 0) {
      showGameToast('创建成功')
      await router.replace({ name: isFriendsTable ? 'friendsTable' : 'club-index' })
    } else {
      showGameToast((res as unknown as { message?: string }).message || '创建失败')
    }
  } catch {
    showGameToast('创建失败')
  } finally {
    isSubmitting.value = false
  }
}

function onEditTemplate(tpl: TemplateItem) {
  emit('edit-template', { ...tpl.room_config, name: tpl.name })
}

const deleteDialog = reactive<{ show: boolean; template: TemplateItem | null }>({
  show: false,
  template: null,
})

function onDeleteTemplate(tpl: TemplateItem) {
  deleteDialog.template = tpl
  deleteDialog.show = true
}

async function onDeleteConfirm() {
  const tpl = deleteDialog.template
  if (!tpl) return
  deleteDialog.show = false
  const res = await postOrgTemplateDeleteApi({ id: tpl.id })
  if (res.code === 0) {
    showGameToast('删除成功')
    templates.value = templates.value.filter((t) => t.id !== tpl.id)
  } else {
    showGameToast((res as unknown as { message?: string }).message || '删除失败')
  }
}
</script>

<template>
  <div class="quick-create-view">
    <!-- 主配置面板 -->
    <div class="quick-panel">
      <!-- 防作弊玩法 -->
      <TableTab
        v-model:model-value="formState.anti_cheat_type"
        class="quick-panel__tab"
        :options="antiCheatOptions"
      />

      <!-- 大小盲 / Ante (6+) -->
      <TableSlider
        v-model:model-value="formState.sb"
        class="quick-panel__slider"
        :label="currentGamePlayType === 3 ? 'Ante' : '小盲/大盲'"
        :options="currentGamePlayType === 3 ? ANTE_OPTIONS : SB_OPTIONS"
        mark-mode="none"
      />

      <!-- 最大人数 -->
      <TableSlider
        v-model:model-value="formState.seat_count"
        class="quick-panel__slider"
        label="最大人数"
        :options="seatCountOptions"
        mark-mode="all"
      />

      <!-- 开关小卡片 -->
      <div class="quick-switches">
        <QuickSwitchCard v-model:model-value="formState.fee_on" label="活跃度积分" />
        <QuickSwitchCard
          v-model:model-value="formState.insurance"
          label="保险"
          :active-value="1"
          :inactive-value="0"
        />
        <QuickSwitchCard
          v-model:model-value="formState.squid"
          label="鱿鱼玩法"
          :active-value="1"
          :inactive-value="0"
          :badge="tableIconSquid"
        />
      </div>

      <!-- 底部收费 + 创建 -->
      <div class="quick-bottom-bar">
        <div v-if="quickPresetConfig" class="quick-fee">
          <div class="quick-fee__row">
            <span class="quick-fee__label">消耗:</span>
            <div class="quick-fee__original-wrap">
              <img
                v-if="createFee.isDiscount"
                :src="icDiamondBalance"
                class="quick-fee__icon original-fee-icon"
                alt=""
              />
              <span v-if="createFee.isDiscount" class="quick-fee__original mr-4">
                {{ createFee.originalPrice.toLocaleString() }}
              </span>
              <img :src="icDiamondBalance" class="quick-fee__icon" alt="" />
              <span class="quick-fee__current">{{ createFee.currentPrice.toLocaleString() }}</span>
              <FieldTip :tip="createFeeTip" />
            </div>
          </div>
          <div class="quick-fee__row">
            <span class="quick-fee__label">余额:</span>
            <img :src="icDiamondBalance" class="quick-fee__icon" alt="" />
            <span class="quick-fee__value">{{ clubDiamondBalance.toLocaleString() }}</span>
          </div>
        </div>
        <button
          v-if="quickPresetConfig"
          class="quick-create-btn"
          :disabled="isSubmitting"
          @click="onQuickCreate"
        >
          立即创建
        </button>
      </div>
    </div>

    <!-- 模板列表 -->
    <div class="template-list">
      <div v-if="loadingTemplates" class="template-list__placeholder">模板加载中...</div>
      <div v-else-if="!filteredTemplates.length" class="template-list__placeholder">
        暂无可用模板
      </div>
      <div
        v-for="item in filteredTemplates"
        :key="item.id"
        :class="['template-card', { 'template-card--active': activeTemplateId === item.id }]"
        :style="{ backgroundImage: `url(${getGameTypeBg(item.game_play_type ?? 1)})` }"
        @click="onSelectTemplate(item)"
      >
        <div class="template-card__left">
          <div
            class="template-card__badge"
          >
            <span class="template-card__game-name">
              {{ getGameTypeName(item.game_play_type ?? 1) }}
            </span>
          </div>
        </div>
        <div class="template-card__info">
          <div class="template-card__blinds">
            {{ formatTemplateBlinds(item) }}
          </div>
          <div class="template-card__tags">{{ item.name }}</div>
          <div class="template-card__people">
            <img :src="iconPeople" class="template-card__people-icon" alt="" />
            <span>{{ getTemplateSeatCount(item) }}</span>
          </div>
          <div class="template-card__media">
            <img
              v-if="item.anti_cheat_type === 2"
              :src="iconAudio"
              class="template-card__media-icon"
              alt=""
            />
            <img
              v-if="item.anti_cheat_type === 3"
              :src="iconVideo"
              class="template-card__media-icon"
              alt=""
            />
          </div>
        </div>
        <div class="template-card__badges">
          <img
            v-if="hasSquid(item)"
            :src="tableIconSquid"
            class="template-card__badge-icon"
            alt=""
          />
          <img
            v-if="hasMushroom(item)"
            :src="tableIconMushroom"
            class="template-card__badge-icon"
            alt=""
          />
          <img
            v-if="hasCriticalHit(item)"
            :src="tableIconCritical"
            class="template-card__badge-icon"
            alt=""
          />
        </div>
        <div class="template-card__right">
          <img :src="iconCards" class="template-card__cards" alt="" />
          <div class="template-card__actions">
            <div class="template-card__action-btn" @click.stop="onEditTemplate(item)">
              <img :src="iconEdit" class="template-card__action-icon" alt="" />
              <span>编辑</span>
            </div>
            <div class="template-card__action-btn" @click.stop="onDeleteTemplate(item)">
              <img :src="iconDelete" class="template-card__action-icon" alt="" />
              <span>删除</span>
            </div>
          </div>
        </div>
        <div class="template-card__create-btn">
          <button class="template-card__create" @click.stop="onCreateFromTemplate(item)">
            立即创建
          </button>
        </div>
      </div>
    </div>
  </div>

  <GameDialog
    v-model:show="deleteDialog.show"
    title="确认删除"
    :message="`确定删除模板「${deleteDialog.template?.name ?? ''}」？`"
    :show-cancel-button="true"
    @confirm="onDeleteConfirm"
    @cancel="deleteDialog.show = false"
  />
</template>

<style scoped lang="scss">
.quick-create-view {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  flex: 1 1 auto;
  width: 100%;
  min-height: 100%;
  min-height: 0;
  padding: 0 0.45rem 0.4rem;
  box-sizing: border-box;
  margin-top: 0.5rem;
}

/* 主配置面板 */
.quick-panel {
  flex-shrink: 0;
  position: relative;
    background: rgba(0, 0, 0, 0.1);
  // background: linear-gradient(96.018deg, rgba(255, 255, 255, 0.1) 21.1%, rgba(230, 230, 230, 0.1) 71.4%);
  border: 0.016rem solid rgba(242, 242, 242, 0.24);
  border-radius: 0.86rem;
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  padding: 0.25rem 0.51rem 0.4rem;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    backdrop-filter: blur(16.6px);
    -webkit-backdrop-filter: blur(16.6px);
    background: linear-gradient(
      107.6deg,
      rgba(249, 249, 249, 0.08) 12.3%,
      rgba(249, 249, 249, 0.14) 33.3%,
      rgba(147, 147, 147, 0.03) 85.1%
    );
    mix-blend-mode: hard-light;
    pointer-events: none;
    border-radius: inherit;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    box-shadow:
      inset 0 0 8.6px rgba(0, 0, 0, 1),
      inset 3.4px 2.6px 8.6px rgba(0, 0, 0, 0.1),
      inset 0 0 36.1px rgba(242, 242, 242, 0.3);
    z-index: 0;
  }

  & > * { position: relative; z-index: 1; }
}
.quick-panel :deep(.filter-tabbar) {
  background: rgba(27, 27, 30, 0.4);
}

.table-slider-row {
  padding: 0.2rem 0;
}
:deep(.table-slider__marks) {
  margin: 0.55rem 0 0;
}

/* 开关卡片 */
.quick-switches {
  display: flex;
  gap: 0.1rem;
  margin: 0.1rem 0 0.3rem;
}

/* 底部收费栏 */
.quick-bottom-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quick-fee {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.quick-fee__row {
  display: flex;
  align-items: center;
  gap: 0.08rem;
}

.quick-fee__label {
  font-size: 0.31rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;
  line-height: 1;
}

.quick-fee__icon {
  width: 0.32rem;
  height: 0.32rem;
}

.quick-fee__row--current {
  display: flex;
  align-items: center;
  gap: 0.08rem;
}

.quick-fee__value {
  font-size: 0.34rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.quick-fee__original-wrap {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  position: relative;
}
.original-fee-icon {
  opacity: 0.6;
}
.quick-fee__original {
  font-size: 0.34rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  text-decoration: line-through;
  line-height: 1;
}

.quick-fee__current {
  font-size: 0.34rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.quick-create-btn {
  width: 2.42rem;
  height: 1.07rem;
  border: 0.016rem solid rgba(242, 242, 242, 0.29);
  border-radius: 1.11rem;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(16.6px);
  -webkit-backdrop-filter: blur(16.6px);
  box-shadow:
    inset 0 0 8.6px rgba(0, 0, 0, 0.155),
    inset 3.4px 2.6px 8.6px rgba(0, 0, 0, 0.1),
    inset 0 0 59.1px rgba(242, 242, 242, 0.3);
  color: #78e490;
  font-size: 0.32rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 模板列表 */
.template-list {
  min-height: 0;
  width: 100%;
  padding-bottom: 0.08rem;
  // overflow-y: auto;
  display: block;
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin-top: 0.5rem;
}

.template-list::-webkit-scrollbar {
  display: none;
}

.template-list__placeholder {
  min-height: 2.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.3rem;
  color: rgba(255, 255, 255, 0.7);
}

.template-card {
  position: relative;
  display: flex;
  align-items: center;
  height: 2.26rem;
  min-height: 2.26rem;
  margin-bottom: 0.3rem;
  margin-left: 0.3rem;
  border-radius: 2.08rem;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: rgba(64, 129, 232, 0.28);
  padding: 0 0.4rem 0 0.25rem;
  // overflow: hidden;
  border: 0.02rem solid transparent;
}

.template-card--active {
  border-color: rgba(255, 255, 255, 0.55);
}

.template-card__left {
  flex-shrink: 0;
  margin-right: 0.2rem;
  transform: translateX(-0.5rem);
}

.template-card__badge {
  width: 1.49rem;
  height: 1.49rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.25);
  background-blend-mode: hard-light;
  backdrop-filter: blur(1.9px);
  border: 0.016rem solid rgba(242, 242, 242, 0.2);
  box-shadow:
    0 0 0.1rem 0.05rem rgba(255, 255, 255, 0.6) inset,
    inset 0.5px 0.5px 0px 0px rgba(255, 255, 255, 0.3),
    inset -0.5px -0.5px 0px 0px rgba(255, 255, 255, 0.3);
}

.template-card__game-name {
  font-size: 0.36rem;
  font-family: 'SF Pro', sans-serif;
  font-weight: 700;
  color: #fff;
  text-align: center;
  line-height: 1.2;
  white-space: pre-line;
}

.template-card__info {
  min-width: 0;
  display: flex;
  width: 2.2rem;
  flex-direction: column;
  transform: translateX(-0.4rem);
}

.template-card__blinds {
  font-size: 0.36rem;
  font-family: 'SF Pro', sans-serif;
  font-weight: 700;
  color: #f9f9f9;
  line-height: 1;
}

.template-card__tags {
  font-size: 0.24rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 300;
  color: #fff;
  line-height: 1;
}

.template-card__people {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  margin-top: 0.1rem;
}

.template-card__people-icon {
  width: 0.4rem;
  height: 0.4rem;
}

.template-card__people span {
  font-size: 0.37rem;
  font-family: 'Afacad', sans-serif;
  font-weight: 600;
  letter-spacing: 0.56px;
  color: #f9f9f9;
  line-height: 1;
}

.template-card__media {
  display: flex;
  align-items: center;
  gap: 0.12rem;
  margin-top: 0.04rem;
}

.template-card__media-icon {
  width: 0.4rem;
  height: 0.4rem;
}

.template-card__badges {
  position: absolute;
  top: -0.4rem;
  right: 2.15rem;
  display: flex;
  gap: 0.08rem;
  z-index: 2;
}

.template-card__badge-icon {
  width: 1rem;
  height: 1rem;
  object-fit: contain;
}

.template-card__right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  justify-content: space-between;
}

.template-card__cards {
  width: 1.26rem;
  height: 1.15rem;
  object-fit: contain;
}

.template-card__actions {
  display: flex;
  gap: 0.2rem;
  margin-bottom: 0.2rem;
}

.template-card__action-btn {
  width: 0.62rem;
  height: 0.62rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  background-blend-mode: hard-light;
  // box-shadow: 0px 0px 2.2px 1.47px rgba(242, 241, 241, 0.9) inset, 0.29px 0.29px 2.1px #000 inset,
  //   0px 0px 2.1px #000 inset, 0.84px 1.05px 1.68px rgba(0, 0, 0, 0.25);
  box-shadow:
  /* 左上高光 */ inset 0.5px 0.5px 0px 0px rgba(255, 255, 255, 0.3),
    /* 右下高光 */ inset -0.5px -0.5px 0px 0px rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.template-card__action-icon {
  width: 0.2rem;
  height: 0.2rem;
}

.template-card__action-btn span {
  font-size: 0.18rem;
  font-family: 'Afacad', sans-serif;
  font-weight: 600;
  color: #fff;
  line-height: 1;
  margin-top: 0.02rem;
}
.template-card__create-btn {
  margin-left: 0.6rem;
}

.template-card__create {
  width: 1.88rem;
  height: 0.85rem;
  border: none;
  border-radius: 0.42rem;
  background: rgba(255, 255, 255, 0.2);
  background-blend-mode: hard-light;
  box-shadow:
  /* */ 0 0 0.1rem 0.05rem rgba(255, 255, 255, 0.2) inset,
    /* 左上高光 */ inset 0.5px 0.5px 0px 0px rgba(255, 255, 255, 0.3),
    /* 右下高光 */ inset -0.5px -0.5px 0px 0px rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 0.22rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(1.9px);
}
</style>
