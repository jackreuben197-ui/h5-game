<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { showFailToast } from 'vant'
import type {
  StatsJackpotAwardLogsJackpotConfig,
  StatsJackpotAwardLogsRequest,
} from '@/api/models/stats'
import { postStatsJackpotAwardLogsApi } from '@/api/stats'
import GameTable from '@/components/Table/GameTable.vue'
import GameTableColumn from '@/components/Table/GameTableColumn.vue'
import PokerCard from '@/components/GameCard/PokerCard.vue'
import emptyStateIcon from '@/assets/icons/jackpot_empty_state.png'
import { t } from '@/i18n'
import { decodeCard, parseHandRecordCards } from '@/api/models/replayDisplay'
import type { CardItem } from '@/api/models/replayDisplay'

type JackpotTabKey = 'awardList' | 'rule' | 'awardRatio'
type JackpotModeKey = 'NLH' | 'PLO' | '6+' | 'Bombpot' | 'AOF'

interface JackpotBlindSetting {
  sb?: number
  status?: number
  blind_type?: number
  prize_ratio?: number
  contribute_type?: number
  contribute_fixed_limit?: number
  contribute_fixed_rate?: number
  contribute_ratio?: number
  contribute_pot_ratio?: number
  [key: string]: unknown
}

interface JackpotSetting {
  game_play_ratio?: number
  blind_setting?: JackpotBlindSetting[]
  royal_flush_switch?: number
  royal_flush_ratio?: number
  straight_flush_switch?: number
  straight_flush_ratio?: number
  four_ofa_kind_switch?: number
  four_ofa_kind_ratio?: number
  [key: string]: unknown
}

interface JackpotTemplate {
  gold?: number
  nlh_switch?: number
  nlh_setting?: JackpotSetting
  plo_switch?: number
  plo_setting?: JackpotSetting
  six_plus_switch?: number
  six_plus_setting?: JackpotSetting
  bombpot_switch?: number
  bombpot_setting?: JackpotSetting
  aof_switch?: number
  aof_setting?: JackpotSetting
  [key: string]: unknown
}

interface RuleBlock {
  type: 'title' | 'paragraph'
  text: string
}

interface RewardRow {
  id: string
  userRid: number
  userName: string
  blindText: string
  rewardText: string
  rewardValue: number
  typeText: string
  cards: CardItem[]
  createText: string
}

interface RewardTierRow {
  id: string
  handType: string
  awardText: string
}

interface JackpotModeMeta {
  key: JackpotModeKey
  label: string
  switchKey: keyof JackpotTemplate
  settingKey: keyof JackpotTemplate
}

const RECORD_PAGE_SIZE = 15
const SIX_PLUS_POKER_TYPE = 2
const AOF_LIMIT_BET_TYPE = 2

const MODE_META_LIST: JackpotModeMeta[] = [
  { key: 'NLH', label: 'NLH', switchKey: 'nlh_switch', settingKey: 'nlh_setting' },
  { key: 'PLO', label: 'PLO', switchKey: 'plo_switch', settingKey: 'plo_setting' },
  { key: '6+', label: '6+', switchKey: 'six_plus_switch', settingKey: 'six_plus_setting' },
  { key: 'Bombpot', label: 'Bombpot', switchKey: 'bombpot_switch', settingKey: 'bombpot_setting' },
  { key: 'AOF', label: 'AOF', switchKey: 'aof_switch', settingKey: 'aof_setting' },
]

const REWARD_TYPE_LABELS: Record<number, string> = {
  10: '皇家同花顺',
  9: '同花顺',
  8: '四条',
}

const props = defineProps<{
  panelProps?: Record<string, unknown>
  emitPanelEvent: (event: string, payload?: unknown) => void
  closePanel: (reason?: string, payload?: unknown) => void
}>()

const activeTab = ref<JackpotTabKey>('awardList')
const recordLoading = ref(false)
const recordFinished = ref(false)
const jackpotTemplate = ref<JackpotTemplate | null>(null)
const rewardRecords = ref<StatsJackpotAwardLogsJackpotConfig[]>([])
// 旧桥接字段不完整时，用一条样本记录推断玩法和盲注档位，但它不参与界面展示。
const recordSample = ref<StatsJackpotAwardLogsJackpotConfig | null>(null)
const recordOffset = ref(0)
let recordRequestPending = false

function toSafeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeUnityRichText(raw: string): string {
  return raw
    .replace(/\\\s*n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\u00A0/g, ' ')
    .trim()
}

function stripUnityTags(raw: string): string {
  return raw
    .replace(/<\/?b>/gi, '')
    .replace(/<size=\d+>/gi, '')
    .replace(/<\/size>/gi, '')
    .replace(/<color=[^>]+>/gi, '')
    .replace(/<\/color>/gi, '')
    .trim()
}

function pushParagraphBlocks(blocks: RuleBlock[], raw: string): void {
  const plainText = stripUnityTags(raw)
  if (!plainText) return
  plainText
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      blocks.push({ type: 'paragraph', text: part })
    })
}

function parseRuleBlocks(raw: string): RuleBlock[] {
  const normalized = normalizeUnityRichText(raw)
  if (!normalized) return []

  const blocks: RuleBlock[] = []
  const titlePattern = /<b>\s*<size=\d+>(.*?)<\/size>\s*<\/b>/gi
  let cursor = 0

  for (const match of normalized.matchAll(titlePattern)) {
    const matchText = match[0]
    const titleText = stripUnityTags(match[1] ?? '')
    const matchIndex = match.index ?? 0
    pushParagraphBlocks(blocks, normalized.slice(cursor, matchIndex))
    if (titleText) {
      blocks.push({ type: 'title', text: titleText })
    }
    cursor = matchIndex + matchText.length
  }

  pushParagraphBlocks(blocks, normalized.slice(cursor))
  return blocks
}

const resolvedPanelProps = computed<Record<string, unknown>>(() =>
  isRecord(props.panelProps) ? props.panelProps : {},
)

const jackpotId = computed(() => toSafeNumber(resolvedPanelProps.value.jackpot_id))
const panelGameType = computed(() => toSafeNumber(resolvedPanelProps.value.game_type))
const panelPokerType = computed(() => toSafeNumber(resolvedPanelProps.value.poker_type))
const panelLimitBetType = computed(() => toSafeNumber(resolvedPanelProps.value.limit_bet_type))
const panelBombpot = computed(() => toSafeNumber(resolvedPanelProps.value.bombpot))
const panelJackpotGold = computed(() => toSafeNumber(resolvedPanelProps.value.jackpot_gold))

// 优先使用 Cocos 直接传入的牌桌信息；
// 只有旧桥接消息字段不全时，才退回到奖励记录里推断玩法。
const inferredMode = computed<JackpotModeKey | null>(() => {
  if (panelLimitBetType.value === AOF_LIMIT_BET_TYPE) {
    return 'AOF'
  }
  if (panelPokerType.value === SIX_PLUS_POKER_TYPE) {
    return '6+'
  }
  if (panelBombpot.value === 1) {
    return 'Bombpot'
  }
  if ([1, 2, 3].includes(panelGameType.value)) {
    return 'PLO'
  }
  if (panelGameType.value === 0) {
    return 'NLH'
  }

  const sample = recordSample.value || rewardRecords.value[0]
  if (!sample) {
    return null
  }
  if (toSafeNumber(sample.poker_type) === SIX_PLUS_POKER_TYPE) {
    return '6+'
  }
  if (toSafeNumber(sample.bombpot) === 1) {
    return 'Bombpot'
  }
  if ([1, 2, 3].includes(toSafeNumber(sample.game_type))) {
    return 'PLO'
  }
  if (toSafeNumber(sample.game_type) === 0) {
    return 'NLH'
  }
  return null
})

const enabledModeKeys = computed<JackpotModeKey[]>(() => {
  const template = jackpotTemplate.value
  if (!template) {
    return []
  }
  return MODE_META_LIST.filter((meta) => toSafeNumber(template[meta.switchKey]) === 1).map(
    (meta) => meta.key,
  )
})

const resolvedMode = computed<JackpotModeKey | null>(() => {
  if (inferredMode.value && enabledModeKeys.value.includes(inferredMode.value)) {
    return inferredMode.value
  }
  if (enabledModeKeys.value.length > 0) {
    return enabledModeKeys.value[0]
  }
  return inferredMode.value
})

const resolvedSetting = computed<JackpotSetting | null>(() => {
  const template = jackpotTemplate.value
  const currentMode = resolvedMode.value
  if (!template || !currentMode) {
    return null
  }
  const meta = MODE_META_LIST.find((item) => item.key === currentMode)
  if (!meta) {
    return null
  }
  return (template[meta.settingKey] as JackpotSetting | undefined) ?? null
})

// 奖励表只保留牌型和实际奖励金额（根据当前总奖池 × 比例计算）。
const rewardTierRows = computed<RewardTierRow[]>(() => {
  const setting = resolvedSetting.value
  if (!setting) {
    return []
  }

  const rows = [
    {
      id: 'royal',
      handType: '皇家同花顺',
      enabled: toSafeNumber(setting.royal_flush_switch) === 1,
      ratio: toSafeNumber(setting.royal_flush_ratio),
    },
    {
      id: 'straight',
      handType: '同花顺',
      enabled: toSafeNumber(setting.straight_flush_switch) === 1,
      ratio: toSafeNumber(setting.straight_flush_ratio),
    },
    {
      id: 'four',
      handType: '四条',
      enabled: toSafeNumber(setting.four_ofa_kind_switch) === 1,
      ratio: toSafeNumber(setting.four_ofa_kind_ratio),
    },
  ]

  return rows
    .filter((item) => item.enabled)
    .map((item) => ({
      id: item.id,
      handType: item.handType,
      // ratio 单位为千分之十（formatPercent 除以 10 得百分比），奖励 = 奖池(分) × ratio/1000 / 100
      awardText: formatAmount((panelJackpotGold.value * item.ratio) / 100000),
    }))
})

const rewardRows = computed<RewardRow[]>(() =>
  rewardRecords.value.map((item, index) => ({
    id: `${toSafeNumber(item.user_id)}_${toSafeNumber(item.create_timestamp)}_${index}`,
    userRid: Number(item.user_rid),
    userName: String(item.user_name || '--').trim() || '--',
    blindText: formatBlindText(item),
    rewardText: formatAmount(toSafeNumber(item.gold_change) / 100),
    rewardValue: toSafeNumber(item.gold_change),
    typeText: getRewardTypeText(item.cards_type),
    cards: parseHandRecordCards(item.card_data).map(decodeCard),
    createText: formatDateText(item.create_time, item.create_timestamp),
  })),
)

const hasRewardTableData = computed(() => rewardTierRows.value.length > 0)

const jackpotRuleBlocks = computed<RuleBlock[]>(() => {
  const raw = t('UIJackpot_Introduce')
  if (!raw || raw === 'UIJackpot_Introduce') return []
  return parseRuleBlocks(raw)
})

const recordRequestKey = computed(() =>
  [panelGameType.value, panelPokerType.value, panelLimitBetType.value, panelBombpot.value].join(
    '_',
  ),
)

function toTemplateValue(value: unknown): JackpotTemplate | null {
  return isRecord(value) ? (value as JackpotTemplate) : null
}

function toRewardRecordArray(value: unknown): StatsJackpotAwardLogsJackpotConfig[] {
  return Array.isArray(value)
    ? value.filter((item): item is StatsJackpotAwardLogsJackpotConfig => isRecord(item))
    : []
}

function toRewardRecord(value: unknown): StatsJackpotAwardLogsJackpotConfig | null {
  return isRecord(value) ? (value as StatsJackpotAwardLogsJackpotConfig) : null
}

function applyInitialJackpotData(): void {
  jackpotTemplate.value = toTemplateValue(resolvedPanelProps.value.initial_template)

  const initialRequestKey = String(resolvedPanelProps.value.initial_record_request_key || '')
  if (initialRequestKey === recordRequestKey.value) {
    rewardRecords.value = toRewardRecordArray(resolvedPanelProps.value.initial_records)
    recordSample.value =
      rewardRecords.value[0] || toRewardRecord(resolvedPanelProps.value.initial_top_record)
    recordOffset.value = rewardRecords.value.length
    recordFinished.value = rewardRecords.value.length < RECORD_PAGE_SIZE
    return
  }

  rewardRecords.value = []
  recordSample.value = null
  recordOffset.value = 0
  recordFinished.value = false
}

function hasUsableInitialRecords(): boolean {
  return (
    String(resolvedPanelProps.value.initial_record_request_key || '') === recordRequestKey.value
  )
}

// jackpot_id 变化时，整块面板数据重新拉取。
watch(
  jackpotId,
  (nextId) => {
    activeTab.value = 'awardList'
    resetPanelState()
    if (nextId > 0) {
      applyInitialJackpotData()
      // 规则只吃 Cocos 初始透传数据，打开后只静默刷新奖励列表。
      if (hasUsableInitialRecords()) {
        // void loadRecords(true, { silent: true })
      } else {
        void loadRecords(true)
      }
    }
  },
  { immediate: true },
)

// 奖励列表需要和牌桌当前玩法参数保持一致；
// 同一 jackpot 模版下切玩法时，只重拉列表，不重复拉模板。
watch(recordRequestKey, (nextKey, prevKey) => {
  if (nextKey === prevKey) {
    return
  }
  if (jackpotId.value <= 0) {
    resetPanelState()
    return
  }

  rewardRecords.value = []
  recordSample.value = null
  recordOffset.value = 0
  recordFinished.value = false
  applyInitialJackpotData()
  if (!hasUsableInitialRecords()) {
    void loadRecords(true)
  }
})

function resetPanelState(): void {
  jackpotTemplate.value = null
  rewardRecords.value = []
  recordSample.value = null
  recordOffset.value = 0
  recordFinished.value = false
}

// 奖励列表沿用旧端的 15 条分页方式，和原接口完全对齐。
async function loadRecords(reset = false, options: { silent?: boolean } = {}): Promise<void> {
  const silent = options.silent === true
  if (jackpotId.value <= 0 || recordRequestPending) {
    return
  }
  if (!reset && recordFinished.value) {
    return
  }

  recordRequestPending = true
  if (!silent) {
    recordLoading.value = true
  }
  const nextOffset = reset ? 0 : recordOffset.value

  try {
    const payload: StatsJackpotAwardLogsRequest = {
      jackpot_id: jackpotId.value,
      game_type: [panelGameType.value],
      poker_type: [panelPokerType.value],
      limit_bet_type: [panelLimitBetType.value],
      bombpot: [panelBombpot.value],
      start_time: 0,
      end_time: 0,
      limit: RECORD_PAGE_SIZE,
      offset: nextOffset,
    }
    const response = await postStatsJackpotAwardLogsApi(payload)
    if (toSafeNumber(response.code) !== 0) {
      throw new Error(String(response.msg || 'Jackpot 奖励列表加载失败'))
    }

    const items = Array.isArray(response.data?.items)
      ? (response.data?.items as StatsJackpotAwardLogsJackpotConfig[])
      : []
    const topRecord = isRecord(response.data?.top_cards_type_data)
      ? (response.data?.top_cards_type_data as StatsJackpotAwardLogsJackpotConfig)
      : null

    rewardRecords.value = reset ? items : [...rewardRecords.value, ...items]
    recordSample.value = rewardRecords.value[0] || topRecord
    recordOffset.value = nextOffset + items.length
    recordFinished.value = items.length < RECORD_PAGE_SIZE
  } catch (error) {
    if (silent) {
      console.warn('[BridgeJackpotRecordPanel] refresh reward records failed', error)
    } else {
      showFailToast(error instanceof Error ? error.message : 'Jackpot 奖励列表加载失败')
    }
  } finally {
    recordRequestPending = false
    if (!silent) {
      recordLoading.value = false
    }
  }
}

function getRewardTypeText(cardsType: unknown): string {
  return REWARD_TYPE_LABELS[toSafeNumber(cardsType)] || '--'
}

function formatBlindText(row: Partial<StatsJackpotAwardLogsJackpotConfig>): string {
  if (toSafeNumber(row.bombpot) === 1 || toSafeNumber(row.poker_type) === SIX_PLUS_POKER_TYPE) {
    const ante = toSafeNumber(row.ante) / 100
    return ante > 0 ? `${trimTrailingZero(ante)} Ante` : '--'
  }

  const smallBlind = toSafeNumber(row.small_blind) / 100
  if (smallBlind <= 0) {
    return '--'
  }
  return `${trimTrailingZero(smallBlind)}/${trimTrailingZero(smallBlind * 2)}`
}

function formatDateText(rawDate: unknown, rawTimestamp: unknown): string {
  let target = String(rawDate || '').trim()
  let date = target ? new Date(target) : null
  if (!date || Number.isNaN(date.getTime())) {
    const timestamp = toSafeNumber(rawTimestamp)
    date = timestamp > 0 ? new Date(timestamp * 1000) : null
  }
  if (!date || Number.isNaN(date.getTime())) {
    return '--'
  }

  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${hh}:${min}:${ss}`
}

function formatAmount(value: unknown): string {
  const amount = toSafeNumber(value)
  const fixed = amount.toFixed(2)
  return fixed.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

function trimTrailingZero(value: number): string {
  if (!Number.isFinite(value)) {
    return '0'
  }
  const fixed = value.toFixed(2)
  return fixed.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}
</script>

<template>
  <section class="jackpot-panel">
    <div class="jackpot-tabs">
      <button
        class="jackpot-tab"
        :class="{ 'jackpot-tab--active': activeTab === 'awardList' }"
        type="button"
        @click="activeTab = 'awardList'"
      >
        获奖记录
      </button>
      <button
        class="jackpot-tab"
        :class="{ 'jackpot-tab--active': activeTab === 'rule' }"
        type="button"
        @click="activeTab = 'rule'"
      >
        奖励说明
      </button>
      <button
        class="jackpot-tab"
        :class="{ 'jackpot-tab--active': activeTab === 'awardRatio' }"
        type="button"
        @click="activeTab = 'awardRatio'"
      >
        奖励表
      </button>
    </div>

    <section
      v-if="activeTab === 'awardList'"
      class="jackpot-panel__content jackpot-panel__content--records"
    >
      <div v-if="rewardRows.length" class="jackpot-panel__table-wrap">
        <div class="table-text table-desc">{{ t('adaptation20042') }}</div>
        <GameTable
          v-model:loading="recordLoading"
          :data="rewardRows"
          :finished="recordFinished"
          height="8rem"
          @load="loadRecords(false)"
        >
          <GameTableColumn prop="userName" label="玩家" :flex="2" align="left">
            <template #default="{ row }">
              <div class="jackpot-panel__player-cell">
                <div class="jackpot-panel__player-copy">
                  <span class="jackpot-panel__player-name">{{ row.userName }}</span>
                </div>
                <div>ID:{{ row.userRid }}</div>
              </div>
            </template>
          </GameTableColumn>
          <GameTableColumn prop="blindText" label="盲注" :flex="1.35" align="center">
            <template #default="{ row }">
              <span class="table-text">
                {{ row.blindText }}
              </span>
            </template>
          </GameTableColumn>
          <GameTableColumn prop="rewardValue" label="金额" :flex="1.45" align="center">
            <template #default="{ row }">
              <span class="jackpot-panel__amount"> +{{ row.rewardText }} </span>
            </template>
          </GameTableColumn>
          <!-- 暂不显示牌型 -->
          <!-- <GameTableColumn prop="typeText" label="牌型" :flex="3" align="center">
            <template #default="{ row }">
              <div v-if="row.cards.length" class="jackpot-panel__cards">
                <PokerCard
                  v-for="(card, idx) in row.cards"
                  :key="idx"
                  :rank="card.rank"
                  :suit="card.suit"
                  size="0.32rem"
                />
              </div>
            </template>
          </GameTableColumn> -->
          <GameTableColumn prop="createText" label="时间" :flex="1.6" align="right">
            <template #default="{ row }">
              <span class="table-text">
                {{ row.createText }}
              </span>
            </template>
          </GameTableColumn>
        </GameTable>
      </div>

      <div v-else-if="!recordLoading" class="jackpot-panel__empty">
        <p class="jackpot-panel__empty-title">暂无奖励记录</p>
        <p class="jackpot-panel__empty-text">当前 Jackpot 还没有可展示的奖励列表。</p>
      </div>
    </section>

    <section
      v-else-if="activeTab === 'rule'"
      class="jackpot-panel__content jackpot-panel__content--reward"
    >
      <div class="jackpot-panel__rules">
        <template v-if="jackpotRuleBlocks.length">
          <template
            v-for="(block, index) in jackpotRuleBlocks"
            :key="`${block.type}-${index}-${block.text}`"
          >
            <h4 v-if="block.type === 'title'" class="jackpot-panel__rich-title">
              {{ block.text }}
            </h4>
            <p v-else class="jackpot-panel__paragraph">{{ block.text }}</p>
          </template>
        </template>
        <div v-else class="jackpot-panel__empty jackpot-panel__empty--reward">
          <p class="jackpot-panel__empty-title">暂无奖励说明</p>
          <p class="jackpot-panel__empty-text">未找到当前玩法对应的 Jackpot 规则配置。</p>
        </div>
      </div>
    </section>

    <section v-else class="jackpot-panel__content jackpot-panel__content--reward">
      <div v-if="hasRewardTableData" class="jackpot-panel__table-wrap">
        <div class="table-text table-desc">{{ t('UIJackpotRewardDescription_Tip') }}</div>
        <GameTable :data="rewardTierRows" height="7rem">
          <GameTableColumn prop="handType" label="牌型" :flex="2.4" align="center">
            <template #default="{ row }">
              <span class="table-text">{{ row.handType }}</span>
            </template>
          </GameTableColumn>
          <GameTableColumn prop="awardText" label="奖励金额" :flex="1.8" align="center">
            <template #default="{ row }">
              <span class="table-text jackpot-panel__amount">{{ row.awardText }}</span>
            </template>
          </GameTableColumn>
        </GameTable>
      </div>

      <div v-else class="jackpot-panel__empty jackpot-panel__empty--reward">
        <p class="jackpot-panel__empty-title">暂无奖励表</p>
        <p class="jackpot-panel__empty-text">未找到当前玩法对应的 Jackpot 奖励配置。</p>
      </div>
    </section>
  </section>
</template>

<style scoped lang="scss">
.jackpot-panel {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  color: #fff;
}

.jackpot-tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.68rem;
}

.jackpot-tab {
  border: 0;
  background: transparent;
  color: rgba(249, 249, 249, 0.76);
  font-size: 0.34rem;
  font-weight: 700;
  line-height: 1.3;
  padding: 0.08rem 0;
}

.jackpot-tab--active {
  color: #dc3232;
  border-bottom: 0.08rem solid #dc3232;
}

.jackpot-panel__content {
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
}

.jackpot-panel__table-wrap {
  width: 100%;
}
:deep(.game-table__cell) {
  padding: 0.16rem 0.2rem;
}

.jackpot-panel__player-copy {
  min-width: 0;
}

.jackpot-panel__player-cell {
  font-size: 0.2rem;
}

.table-desc {
  text-align: left;
  margin-left: 0.3rem;
}

.table-text {
  font-size: 0.24rem;
}

.jackpot-panel__player-name {
  display: block;
  font-size: 0.26rem;
  color: rgba(255, 255, 255, 0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.jackpot-panel__amount {
  font-size: 0.24rem;
  color: var(--color-danger);
}

.jackpot-panel__cards {
  display: flex;
  gap: 1px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 0.06rem;
}

.jackpot-panel__rules {
  display: flex;
  flex-direction: column;
  height: 10.8rem;
  overflow-y: auto;
  gap: 0.04rem;
  padding-right: 0.08rem;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.jackpot-panel__rich-title {
  margin: 0rem 0 0;
  font-size: 0.35rem;
  font-weight: 700;
  line-height: 1.35;
  text-align: left;
  color: #dc3232;
}

.jackpot-panel__paragraph {
  margin: 0;
  font-size: 0.34rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.84);
  white-space: pre-wrap;
  text-align: left;
}

.jackpot-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 0.36rem 0.54rem;
  text-align: center;
  border-radius: 0.34rem;
  background: rgba(0, 0, 0, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.jackpot-panel__empty-title {
  font-size: 0.34rem;
  font-weight: 600;
}

.jackpot-panel__empty-text {
  margin-top: 0.08rem;
  max-width: 5.8rem;
  font-size: 0.26rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.6);
}
</style>
