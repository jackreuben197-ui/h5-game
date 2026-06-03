<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import PokerCard from '@/components/GameCard/PokerCard.vue'
import { decodeCard } from '@/api/models/replayDisplay'
import { t } from '@/i18n'

const props = defineProps<{
  panelProps?: Record<string, unknown>
  emitPanelEvent: (event: string, payload?: unknown) => void
  closePanel: (reason?: string, payload?: unknown) => void
}>()

interface GameRulePanelGameInfo {
  ruleType?: number
  game_type?: number
  poker_type?: number
  room_critical_hit?: number
  insurance_mode?: number
}

interface HandSection {
  id: string
  labelKey: string
  cards: number[]
}

interface RuleBlock {
  type: 'title' | 'paragraph'
  text: string
}

interface RuleTab {
  key: 'rules' | 'hands' | 'insurance'
  label: string
}

const GAME_TYPE = {
  HOLDEM: 0,
  OMAHA4: 1,
  OMAHA5: 2,
  OMAHA6: 3,
} as const

const RULE_TYPE = {
  BASIC: 1,
  INSURANCE: 2,
} as const

const POKER_TYPE = {
  NORMAL: 0,
  SIX_PLUS: 2,
} as const

const INSURANCE_MODE = {
  NORMAL: 0,
  WPK: 1,
  EV: 2,
  NEW_NORMAL: 3,
} as const

const RAW_HAND_SECTIONS: HandSection[] = [
  { id: 'royal-flush', labelKey: 'adaptation10053', cards: [9, 10, 11, 12, 0] },
  { id: 'straight-flush', labelKey: 'adaptation10054', cards: [19, 20, 21, 22, 23] },
  { id: 'four-kind', labelKey: 'adaptation10055', cards: [0, 13, 26, 39, 37] },
  { id: 'full-house', labelKey: 'adaptation10056', cards: [38, 51, 12, 35, 48] },
  { id: 'flush', labelKey: 'adaptation10057', cards: [17, 18, 20, 21, 23] },
  { id: 'straight', labelKey: 'adaptation10058', cards: [18, 32, 33, 21, 22] },
  { id: 'three-kind', labelKey: 'adaptation10059', cards: [24, 37, 11, 35, 0] },
  { id: 'two-pairs', labelKey: 'adaptation10060', cards: [19, 24, 50, 0, 13] },
  { id: 'one-pair', labelKey: 'adaptation10061', cards: [6, 19, 33, 44, 48] },
  { id: 'high-card', labelKey: 'adaptation10062', cards: [7, 24, 0, 48, 29] },
]

const activeTabKey = ref<RuleTab['key']>('rules')

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === 'object' && !Array.isArray(raw)
}

function getI18nText(key: string): string {
  const translated = t(key)
  return translated === key ? '' : translated
}

function getFirstI18nText(keys: string[], fallback = ''): string {
  for (const key of keys) {
    const translated = getI18nText(key)
    if (translated) {
      return translated
    }
  }

  return fallback
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
    .trim()
}

function parseRuleBlocks(raw: string): RuleBlock[] {
  const normalized = normalizeUnityRichText(raw)
  if (!normalized) {
    return []
  }

  const blocks: RuleBlock[] = []
  const titlePattern = /<b>\s*<size=\d+>(.*?)<\/size>\s*<\/b>/gi
  let cursor = 0

  for (const match of normalized.matchAll(titlePattern)) {
    const matchText = match[0]
    const titleText = stripUnityTags(match[1] ?? '')
    const matchIndex = match.index ?? 0
    const beforeText = normalized.slice(cursor, matchIndex)
    pushParagraphBlocks(blocks, beforeText)

    if (titleText) {
      blocks.push({
        type: 'title',
        text: titleText,
      })
    }

    cursor = matchIndex + matchText.length
  }

  pushParagraphBlocks(blocks, normalized.slice(cursor))
  return blocks
}

function pushParagraphBlocks(blocks: RuleBlock[], raw: string): void {
  const plainText = stripUnityTags(raw)
  if (!plainText) {
    return
  }

  plainText
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      blocks.push({
        type: 'paragraph',
        text: part,
      })
    })
}

function getRuleBaseKey(gameType: number): string {
  if (gameType === GAME_TYPE.OMAHA4) {
    return 'UIPlO4Rule_Introduce'
  }
  if (gameType === GAME_TYPE.OMAHA5) {
    return 'UIPlO5Rule_Introduce'
  }
  if (gameType === GAME_TYPE.OMAHA6) {
    return 'UIPlO6Rule_Introduce'
  }
  return 'UITexasRule_Introduce'
}

const gameInfo = computed<GameRulePanelGameInfo>(() => {
  const raw = props.panelProps?.gameInfo
  const panelRuleType = toSafeNumber(props.panelProps?.ruleType)

  if (!isRecord(raw)) {
    return {
      ruleType: panelRuleType || RULE_TYPE.BASIC,
    }
  }

  return {
    ruleType: panelRuleType || RULE_TYPE.BASIC,
    game_type: toSafeNumber(raw.game_type),
    poker_type: toSafeNumber(raw.poker_type),
    room_critical_hit: toSafeNumber(raw.room_critical_hit),
    insurance_mode: toSafeNumber(raw.insurance_mode),
  }
})

const ruleType = computed(() => toSafeNumber(gameInfo.value.ruleType) || RULE_TYPE.BASIC)
const isInsuranceRuleType = computed(() => ruleType.value === RULE_TYPE.INSURANCE)

const ruleText = computed(() => {
  const baseText = getI18nText(getRuleBaseKey(toSafeNumber(gameInfo.value.game_type)))
  let merged = baseText

  if (toSafeNumber(gameInfo.value.poker_type) === POKER_TYPE.SIX_PLUS) {
    merged += getI18nText('UI6Plus_Introduce')
  }

  if (toSafeNumber(gameInfo.value.room_critical_hit) === 1) {
    merged += getI18nText('UICriticalHit_GameRuleTips')
  }

  return merged
})

const ruleBlocks = computed<RuleBlock[]>(() => parseRuleBlocks(ruleText.value))

const insuranceRuleText = computed(() => {
  const insuranceMode = toSafeNumber(gameInfo.value.insurance_mode)

  if (insuranceMode === INSURANCE_MODE.EV) {
    return getI18nText('UIEVInsuranceRuler')
  }

  if (insuranceMode === INSURANCE_MODE.WPK) {
    return getI18nText('UILowWaterInsuranceRuler')
  }

  const title = getI18nText('UIInsuranceRuleTitle')
  const detailKeys = [
    'UITexasRule_detail4',
    'UITexasRule_detail5',
    'UITexasRule_detail6',
    'UITexasRule_detail7',
    'UITexasRule_detail8',
    'UITexasRule_detail31',
    'UITexasRule_detail11',
    'UITexasRule_detail12',
    'UITexasRule_detail13',
  ]

  const details = detailKeys
    .map((key) => getI18nText(key))
    .filter(Boolean)

  const titleLine = title ? `<b><size=46>${title}</size></b>` : ''

  return [titleLine, details.join('\n')]
    .filter(Boolean)
    .join('\n\n')
})

const insuranceRuleBlocks = computed<RuleBlock[]>(() => parseRuleBlocks(insuranceRuleText.value))

const decodedHands = computed(() =>
  RAW_HAND_SECTIONS.map((section) => ({
    ...section,
    label: t(section.labelKey),
    boardCards: section.cards.map((card) => decodeCard(card)),
  })),
)

const tabs = computed<RuleTab[]>(() => {
  if (isInsuranceRuleType.value) {
    return [
      {
        key: 'insurance',
        label: getFirstI18nText(['UITexasRule_1QEuiq2M', 'adaptation10021'], 'Insurance'),
      },
    ]
  }

  return [
    { key: 'rules', label: t('UITexasRule_RlNZ1ysZ') },
    { key: 'hands', label: t('UITexasRule_Ug7QXzjK') },
  ]
})

const activeRuleBlocks = computed<RuleBlock[]>(() => {
  if (activeTabKey.value === 'insurance') {
    return insuranceRuleBlocks.value
  }

  return ruleBlocks.value
})

watchEffect(() => {
  const nextTab = tabs.value[0]?.key
  const hasActiveTab = tabs.value.some((tab) => tab.key === activeTabKey.value)

  if (!hasActiveTab && nextTab) {
    activeTabKey.value = nextTab
  }
})

function selectTab(key: RuleTab['key']): void {
  if (key === activeTabKey.value) {
    return
  }

  activeTabKey.value = key
  props.emitPanelEvent('tabChange', { tab: key })
}
</script>

<template>
  <section class="game-rule-panel">
    <div class="game-rule-panel__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="game-rule-panel__tab"
        :class="{ 'game-rule-panel__tab--active': tab.key === activeTabKey }"
        @click="selectTab(tab.key)"
      >
        {{ tab.label }}
        <span v-if="tab.key === activeTabKey" class="game-rule-panel__tab-underline"></span>
      </button>
    </div>

    <div v-if="activeTabKey !== 'hands'" class="game-rule-panel__rules">
      <template v-if="activeRuleBlocks.length">
        <template v-for="(block, index) in activeRuleBlocks" :key="`${block.type}-${index}-${block.text}`">
          <h4 v-if="block.type === 'title'" class="game-rule-panel__rich-title">
            {{ block.text }}
          </h4>
          <p v-else class="game-rule-panel__paragraph">
            {{ block.text }}
          </p>
        </template>
      </template>
      <p v-else class="game-rule-panel__empty">
        {{ t('MsgContentUnRead') }}
      </p>
    </div>

    <div v-if="activeTabKey === 'hands'" class="game-rule-panel__list">
      <div
        v-for="hand in decodedHands"
        :key="hand.id"
        class="game-rule-panel__row"
      >
        <div class="game-rule-panel__cards">
          <PokerCard
            v-for="(card, idx) in hand.boardCards"
            :key="`${hand.id}-${idx}`"
            :rank="card.rank"
            :suit="card.suit"
            size="0.55rem"
          />
        </div>
        <span class="game-rule-panel__label">{{ hand.label }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.game-rule-panel {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.game-rule-panel__tabs {
  display: flex;
  justify-content: center;
  gap: 1.2rem;
}

.game-rule-panel__tab {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: none;
  background: transparent;
  font-size: 0.41rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;

  &:hover {
    color: rgba(255, 255, 255, 0.88);
  }
}

.game-rule-panel__tab--active {
  color: #fff;
}

.game-rule-panel__tab-underline {
  margin-top: 0.04rem;
  width: 1.5rem;
  height: 0.07rem;
  background: var(--primary, #05e7ae);
  border-radius: 999px;
}

.game-rule-panel__rules,
.game-rule-panel__list {
  display: flex;
  flex-direction: column;
  height: 10.8rem;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.game-rule-panel__rules {
  gap: 0.24rem;
  padding-right: 0.08rem;
}

.game-rule-panel__rich-title {
  margin: 0.12rem 0 0;
  font-size: 0.35rem;
  font-weight: 700;
  line-height: 1.35;
  text-align: left;
  color: var(--color-primary);
}

.game-rule-panel__paragraph {
  margin: 0;
  font-size: 0.34rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.84);
  white-space: pre-wrap;
  text-align: left;
}

.game-rule-panel__empty {
  margin: auto 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.34rem;
}

.game-rule-panel__list {
  gap: 0.22rem;
}

.game-rule-panel__row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.12rem 0.36rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.51px);
  border-radius: 999px;
}

.game-rule-panel__cards {
  display: flex;
  gap: 0.12rem;
  flex-shrink: 0;
}

.game-rule-panel__label {
  font-size: 0.325rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 300;
  color: #fff;
  white-space: nowrap;
}
</style>
