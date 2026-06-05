<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast, showSuccessToast, showToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import type {
  OrgClubJackpotTemplateCreateBlindsSetting,
  OrgClubJackpotTemplateCreateJackpotSetting,
} from '@/api/models/org'
import {
  postOrgClubJackpotTemplateCreateApi,
  postOrgClubJackpotTemplateUpdateApi,
  postOrgJackpotTemplateInfoApi,
} from '@/api/org'

import mainBgUrl from '@/assets/images/main_bg.webp'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

interface OptionItem {
  id: string
  label: string
  selected?: boolean
  sb: number
}

interface CardItem {
  rank: string
  suit: string
  red: boolean
}

interface PoolSettingItem {
  id: string
  title: string
  checked: boolean
  ratio: string
  cards: CardItem[]
}

interface BlindConfigForm {
  sb: number
  prizeRatio: string
  contributePotChecked: boolean
  contributePotLimit: string
  awardBetChecked: boolean
  awardBetLimit: string
  awardOtherChecked: boolean
  awardOtherRatio: string
  profitTriggerChecked: boolean
  profitTriggerLimit: string
  jackpotContribChecked: boolean
  jackpotContribValue: string
  profitPercentChecked: boolean
  profitPercentValue: string
}

interface StakeConfigForm {
  selectedSbs: number[]
  blindConfigs: Record<number, BlindConfigForm>
}

interface ModeConfigForm {
  gamePlayRatio: string
  stakes: Record<StakeLevel, StakeConfigForm>
  poolSettings: PoolSettingItem[]
}

const route = useRoute()
const router = useRouter()

const isEditMode = computed(() => !!route.query.id)
const editJackpotId = computed(() => Number(route.query.id) || 0)

const loading = ref(false)
const jackpotName = ref('Jackpot')
const jackpotGoldYuan = ref('0')

const gameModes = ['NLH', 'PLO', '6+', 'Bombpot', 'AOF'] as const
type GameMode = (typeof gameModes)[number]
type StakeLevel = 'Micro' | 'Small' | 'Medium' | 'Large'

const JACKPOT_BLIND_CLASSIFY_RULES = [
  { level: 'Micro', blindType: 1, sbValues: [10, 20, 30, 40, 50] },
  { level: 'Small', blindType: 2, sbValues: [100, 200, 300, 400, 500] },
  { level: 'Medium', blindType: 3, sbValues: [1000, 1500, 2000, 2500, 3000, 5000] },
  { level: 'Large', blindType: 4, sbValues: [10000, 20000, 30000, 50000, 100000] },
] as const

function getJackpotBlindTypeBySb(sb: number): number {
  const matched = JACKPOT_BLIND_CLASSIFY_RULES.find((rule) =>
    (rule.sbValues as readonly number[]).includes(sb),
  )
  return matched?.blindType ?? 1
}

const stakeLevels = JACKPOT_BLIND_CLASSIFY_RULES.map((item) => item.level) as StakeLevel[]
const stakeRuleByLevel = Object.fromEntries(
  JACKPOT_BLIND_CLASSIFY_RULES.map((item) => [item.level, item]),
) as Record<StakeLevel, (typeof JACKPOT_BLIND_CLASSIFY_RULES)[number]>
const stakeLevelByBlindType = Object.fromEntries(
  JACKPOT_BLIND_CLASSIFY_RULES.map((item) => [item.blindType, item.level]),
) as Record<number, StakeLevel>

const modeKeyMap: Record<GameMode, { switchKey: string; settingKey: string }> = {
  NLH: { switchKey: 'nlh_switch', settingKey: 'nlh_setting' },
  PLO: { switchKey: 'plo_switch', settingKey: 'plo_setting' },
  '6+': { switchKey: 'six_plus_switch', settingKey: 'six_plus_setting' },
  Bombpot: { switchKey: 'bombpot_switch', settingKey: 'bombpot_setting' },
  AOF: { switchKey: 'aof_switch', settingKey: 'aof_setting' },
}

const modeEnabled = ref<Record<GameMode, boolean>>({
  NLH: true,
  PLO: false,
  '6+': false,
  Bombpot: false,
  AOF: false,
})

const activeGameMode = ref<GameMode>('NLH')
const activeStakeLevel = ref<StakeLevel>('Micro')

function toSafeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function toSwitch(value: boolean): number {
  return value ? 1 : 2
}

function formatCentToYuanText(value: unknown): string {
  const cent = toSafeNumber(value)
  if (cent <= 0) {
    return '0'
  }
  return (cent / 100).toString()
}

function formatSbLabelFromCent(sbCent: number): string {
  const sb = sbCent / 100
  const bb = (sbCent * 2) / 100
  return `${sb}/${bb}`
}

function createDefaultBlindConfig(sb: number): BlindConfigForm {
  return {
    sb,
    prizeRatio: '',
    contributePotChecked: false,
    contributePotLimit: '',
    awardBetChecked: false,
    awardBetLimit: '',
    awardOtherChecked: false,
    awardOtherRatio: '',
    profitTriggerChecked: true,
    profitTriggerLimit: '',
    jackpotContribChecked: false,
    jackpotContribValue: '',
    profitPercentChecked: true,
    profitPercentValue: '',
  }
}

const POOL_CARDS: CardItem[] = [
  { rank: '7', suit: '♣', red: false },
  { rank: '3', suit: '♦', red: true },
  { rank: '6', suit: '♣', red: false },
  { rank: '3', suit: '♦', red: true },
  { rank: '6', suit: '♣', red: false },
]

function createDefaultPoolSettings(): PoolSettingItem[] {
  return [
    { id: 'royal', title: 'Royal Flush', checked: false, ratio: '', cards: POOL_CARDS },
    { id: 'straight', title: 'Straight flush', checked: false, ratio: '', cards: POOL_CARDS },
    { id: 'four', title: 'Four of a kind', checked: false, ratio: '', cards: POOL_CARDS },
  ]
}

function createDefaultStakeConfig(level: StakeLevel): StakeConfigForm {
  const rule = stakeRuleByLevel[level]
  const blindConfigs: Record<number, BlindConfigForm> = {}
  rule.sbValues.forEach((sb) => {
    blindConfigs[sb] = createDefaultBlindConfig(sb)
  })

  return {
    selectedSbs: level === 'Micro' ? [rule.sbValues[0]] : [],
    blindConfigs,
  }
}

function createDefaultModeConfig(): ModeConfigForm {
  const stakes = {} as Record<StakeLevel, StakeConfigForm>
  stakeLevels.forEach((level) => {
    stakes[level] = createDefaultStakeConfig(level)
  })

  return {
    gamePlayRatio: '',
    stakes,
    poolSettings: createDefaultPoolSettings(),
  }
}

function createDefaultModeConfigs(): Record<GameMode, ModeConfigForm> {
  return {
    NLH: createDefaultModeConfig(),
    PLO: createDefaultModeConfig(),
    '6+': createDefaultModeConfig(),
    Bombpot: createDefaultModeConfig(),
    AOF: createDefaultModeConfig(),
  }
}

const modeConfigs = ref<Record<GameMode, ModeConfigForm>>(createDefaultModeConfigs())
const currentModeConfig = computed(() => modeConfigs.value[activeGameMode.value])
const currentStakeConfig = computed(() => currentModeConfig.value.stakes[activeStakeLevel.value])

const blindOptions = computed<OptionItem[]>(() => {
  const rule = stakeRuleByLevel[activeStakeLevel.value]
  return rule.sbValues.map((sb, index) => ({
    id: `${activeStakeLevel.value}-${index}`,
    label: formatSbLabelFromCent(sb),
    sb,
    selected: currentStakeConfig.value.selectedSbs.includes(sb),
  }))
})

const selectedBlindOptions = computed<OptionItem[]>(() =>
  blindOptions.value.filter((item) => item.selected),
)

function getBlindConfigBySb(sb: number): BlindConfigForm {
  const existing = currentStakeConfig.value.blindConfigs[sb]
  if (existing) {
    return existing
  }

  const created = createDefaultBlindConfig(sb)
  currentStakeConfig.value.blindConfigs[sb] = created
  return created
}

function onBlindOptionClick(option: OptionItem): void {
  const selectedSbs = currentStakeConfig.value.selectedSbs
  if (selectedSbs.includes(option.sb)) {
    currentStakeConfig.value.selectedSbs = selectedSbs.filter((sb) => sb !== option.sb)
    return
  }
  currentStakeConfig.value.selectedSbs = [...selectedSbs, option.sb]
}

function toggleModeEnabled(mode: GameMode): void {
  modeEnabled.value[mode] = !modeEnabled.value[mode]
}

function buildModeSetting(modeConfig: ModeConfigForm): OrgClubJackpotTemplateCreateJackpotSetting {
  const blindSetting: OrgClubJackpotTemplateCreateBlindsSetting[] = []

  JACKPOT_BLIND_CLASSIFY_RULES.forEach((rule) => {
    const levelConfig = modeConfig.stakes[rule.level]

    rule.sbValues.forEach((sb) => {
      const blindConfig = levelConfig.blindConfigs[sb] ?? createDefaultBlindConfig(sb)
      blindSetting.push({
        sb,
        status: levelConfig.selectedSbs.includes(sb) ? 1 : 0,
        blind_type: rule.blindType,
        prize_ratio: toSafeNumber(blindConfig.prizeRatio),
        contribute_pot_switch: toSwitch(blindConfig.contributePotChecked),
        contribute_pot_limit: toSafeNumber(blindConfig.contributePotLimit),
        award_bet_switch: toSwitch(blindConfig.awardBetChecked),
        award_bet_limit: toSafeNumber(blindConfig.awardBetLimit),
        award_other_switch: toSwitch(blindConfig.awardOtherChecked),
        award_other_ratio: toSafeNumber(blindConfig.awardOtherRatio),
        contribute_fixed_limit: toSafeNumber(blindConfig.profitTriggerLimit),
        contribute_ratio: toSafeNumber(blindConfig.jackpotContribValue),
        contribute_fixed_rate: toSafeNumber(blindConfig.profitPercentValue),
      })
    })
  })

  const royal = modeConfig.poolSettings.find((item) => item.id === 'royal')
  const straight = modeConfig.poolSettings.find((item) => item.id === 'straight')
  const four = modeConfig.poolSettings.find((item) => item.id === 'four')

  return {
    game_play_ratio: toSafeNumber(modeConfig.gamePlayRatio),
    blind_setting: blindSetting,
    royal_flush_switch: royal?.checked ? 1 : 0,
    royal_flush_ratio: toSafeNumber(royal?.ratio),
    straight_flush_switch: straight?.checked ? 1 : 0,
    straight_flush_ratio: toSafeNumber(straight?.ratio),
    four_ofa_kind_switch: four?.checked ? 1 : 0,
    four_ofa_kind_ratio: toSafeNumber(four?.ratio),
  }
}

function normalizeSelectedSb(stakeConfig: StakeConfigForm, level: StakeLevel): void {
  const rule = stakeRuleByLevel[level]
  const validSbs = rule.sbValues as readonly number[]
  const uniqueSbs = Array.from(new Set(stakeConfig.selectedSbs))
  stakeConfig.selectedSbs = uniqueSbs.filter((sb) => validSbs.includes(sb))
}

function getLevelByBlindData(
  sbValue: unknown,
  blindTypeValue: unknown,
  multiplier: number,
): StakeLevel {
  const sbCent = Math.round(toSafeNumber(sbValue) * multiplier)
  const fromBlindType = stakeLevelByBlindType[toSafeNumber(blindTypeValue)]
  const fromSb = stakeLevelByBlindType[getJackpotBlindTypeBySb(sbCent)]
  return fromBlindType ?? fromSb ?? 'Micro'
}

function detectSbMultiplier(blindSetting: Record<string, unknown>[]): number {
  const scoreMultiplier = (multiplier: number): number => {
    let score = 0
    for (let i = 0; i < blindSetting.length; i += 1) {
      const item = blindSetting[i]
      const level = getLevelByBlindData(item.sb, item.blind_type, multiplier)
      const rule = stakeRuleByLevel[level]
      const sbCent = Math.round(toSafeNumber(item.sb) * multiplier)
      if ((rule.sbValues as readonly number[]).includes(sbCent)) {
        score += 1
      }
    }
    return score
  }

  const directScore = scoreMultiplier(1)
  const x100Score = scoreMultiplier(100)
  return x100Score > directScore ? 100 : 1
}

function applyModeSetting(
  modeConfig: ModeConfigForm,
  setting: Record<string, unknown> | undefined,
): void {
  if (!setting) {
    return
  }

  stakeLevels.forEach((level) => {
    modeConfig.stakes[level] = createDefaultStakeConfig(level)
  })

  modeConfig.gamePlayRatio = String(setting.game_play_ratio ?? '')

  const royal = modeConfig.poolSettings.find((item) => item.id === 'royal')
  if (royal) {
    royal.checked = toSafeNumber(setting.royal_flush_switch) === 1
    royal.ratio = String(setting.royal_flush_ratio ?? '')
  }

  const straight = modeConfig.poolSettings.find((item) => item.id === 'straight')
  if (straight) {
    straight.checked = toSafeNumber(setting.straight_flush_switch) === 1
    straight.ratio = String(setting.straight_flush_ratio ?? '')
  }

  const four = modeConfig.poolSettings.find((item) => item.id === 'four')
  if (four) {
    four.checked = toSafeNumber(setting.four_ofa_kind_switch) === 1
    four.ratio = String(setting.four_ofa_kind_ratio ?? '')
  }

  const blindSetting = Array.isArray(setting.blind_setting)
    ? (setting.blind_setting as Record<string, unknown>[])
    : []

  const sbMultiplier = detectSbMultiplier(blindSetting)

  blindSetting.forEach((item) => {
    const sbCent = Math.round(toSafeNumber(item.sb) * sbMultiplier)
    const level = getLevelByBlindData(item.sb, item.blind_type, sbMultiplier)
    const levelConfig = modeConfig.stakes[level]
    if (!levelConfig) {
      return
    }

    const target = levelConfig.blindConfigs[sbCent]
    if (!target) {
      return
    }

    if (toSafeNumber(item.status) === 1) {
      levelConfig.selectedSbs = [...levelConfig.selectedSbs, sbCent]
    }

    target.prizeRatio = String(item.prize_ratio ?? target.prizeRatio ?? '')
    target.contributePotChecked = toSafeNumber(item.contribute_pot_switch) === 1
    target.contributePotLimit = String(item.contribute_pot_limit ?? target.contributePotLimit ?? '')
    target.awardBetChecked = toSafeNumber(item.award_bet_switch) === 1
    target.awardBetLimit = String(item.award_bet_limit ?? target.awardBetLimit ?? '')
    target.awardOtherChecked = toSafeNumber(item.award_other_switch) === 1
    target.awardOtherRatio = String(item.award_other_ratio ?? target.awardOtherRatio ?? '')

    const profitLimit = String(item.contribute_fixed_limit ?? '')
    const jackpotContrib = String(item.contribute_ratio ?? '')
    const profitPercent = String(item.contribute_fixed_rate ?? '')
    target.profitTriggerLimit = profitLimit
    target.jackpotContribValue = jackpotContrib
    target.profitPercentValue = profitPercent
    target.profitTriggerChecked =
      profitLimit !== '' && toSafeNumber(item.contribute_fixed_limit) > 0
    target.jackpotContribChecked = jackpotContrib !== '' && toSafeNumber(item.contribute_ratio) > 0
    target.profitPercentChecked =
      profitPercent !== '' && toSafeNumber(item.contribute_fixed_rate) > 0
  })

  stakeLevels.forEach((level) => {
    normalizeSelectedSb(modeConfig.stakes[level], level)
  })
}

function onCancel(): void {
  router.back()
}

async function onConfirm(): Promise<void> {
  if (!jackpotName.value.trim()) {
    showToast('请输入牌局名称')
    return
  }

  const goldYuan = toSafeNumber(jackpotGoldYuan.value)
  if (goldYuan < 0) {
    showToast('奖池金额不能小于0')
    return
  }

  const enabledModes = gameModes.filter((mode) => modeEnabled.value[mode])
  if (!enabledModes.length) {
    showToast('请至少启用一个玩法')
    return
  }

  loading.value = true
  try {
    const modeSwitches: Record<GameMode, number> = {
      NLH: modeEnabled.value.NLH ? 1 : 2,
      PLO: modeEnabled.value.PLO ? 1 : 2,
      '6+': modeEnabled.value['6+'] ? 1 : 2,
      Bombpot: modeEnabled.value.Bombpot ? 1 : 2,
      AOF: modeEnabled.value.AOF ? 1 : 2,
    }

    const payload = {
      name: jackpotName.value.trim(),
      gold: Math.round(goldYuan * 100),
      nlh_switch: modeSwitches.NLH,
      nlh_setting: buildModeSetting(modeConfigs.value.NLH),
      plo_switch: modeSwitches.PLO,
      plo_setting: buildModeSetting(modeConfigs.value.PLO),
      six_plus_switch: modeSwitches['6+'],
      six_plus_setting: buildModeSetting(modeConfigs.value['6+']),
      bombpot_switch: modeSwitches.Bombpot,
      bombpot_setting: buildModeSetting(modeConfigs.value.Bombpot),
      aof_switch: modeSwitches.AOF,
      aof_setting: buildModeSetting(modeConfigs.value.AOF),
    }

    let response
    if (isEditMode.value) {
      response = await postOrgClubJackpotTemplateUpdateApi({
        jackpot_id: editJackpotId.value,
        ...payload,
      } as Parameters<typeof postOrgClubJackpotTemplateUpdateApi>[0])
    } else {
      response = await postOrgClubJackpotTemplateCreateApi(
        payload as Parameters<typeof postOrgClubJackpotTemplateCreateApi>[0],
      )
    }

    if (Number(response.code) !== 0) {
      const message = typeof response.msg === 'string' ? response.msg : '操作失败'
      throw new Error(message)
    }

    showSuccessToast(isEditMode.value ? '编辑成功' : '创建成功')
    router.back()
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

async function fetchTemplateInfo(): Promise<void> {
  if (!isEditMode.value) return

  loading.value = true
  try {
    const response = await postOrgJackpotTemplateInfoApi({
      jackpot_id: editJackpotId.value,
    })

    if (Number(response.code) !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '获取模板信息失败')
    }

    const data = response.data?.item as Record<string, unknown> | undefined
    if (!data) return

    if (typeof data.name === 'string') {
      jackpotName.value = data.name
    }

    jackpotGoldYuan.value = formatCentToYuanText(data.gold)
    modeConfigs.value = createDefaultModeConfigs()

    gameModes.forEach((mode) => {
      const modeMeta = modeKeyMap[mode]
      const setting = data[modeMeta.settingKey] as Record<string, unknown> | undefined
      applyModeSetting(modeConfigs.value[mode], setting)
      modeEnabled.value[mode] = toSafeNumber(data[modeMeta.switchKey]) === 1
      if (modeEnabled.value[mode]) {
        activeGameMode.value = mode
      }
    })

    if (!gameModes.some((mode) => modeEnabled.value[mode])) {
      modeEnabled.value.NLH = true
      activeGameMode.value = 'NLH'
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取模板信息失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchTemplateInfo()
})
</script>

<template>
  <div class="page-shell jackpot-create-page" :style="backgroundStyle">
    <HeaderBack :title="isEditMode ? 'Edit Jackpot' : 'Jackpot'" />

    <section class="create-content">
      <div class="name-input-pill">
        <span class="pill-label">牌局名称</span>
        <input v-model="jackpotName" class="pill-input" maxlength="20" placeholder="Jackpot" />
        <span class="pill-count">{{ jackpotName.length }}/20</span>
      </div>

      <div class="glass-card summary-card">
        <div class="summary-left">
          <div class="summary-title-row">
            <span>Jackpot 奖池</span>
            <i class="icon-info" aria-hidden="true">i</i>
          </div>
          <div class="summary-amount-input">
            <span>¥</span>
            <input
              v-model="jackpotGoldYuan"
              class="inline-input"
              inputmode="decimal"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div class="glass-card section-card">
        <div class="segment-row segment-row--five">
          <button
            v-for="mode in gameModes"
            :key="mode"
            type="button"
            class="segment-btn"
            :class="{ 'segment-btn--active': activeGameMode === mode }"
            @click="activeGameMode = mode"
          >
            {{ mode }}
          </button>
        </div>

        <div class="mode-switch-wrap">
          <label class="mode-switch-item">
            <input
              class="mode-switch-checkbox"
              type="checkbox"
              :checked="modeEnabled[activeGameMode]"
              @change="toggleModeEnabled(activeGameMode)"
            />
            <span>{{ activeGameMode }} 开关</span>
          </label>
        </div>

        <div class="divider"></div>

        <div class="rows-wrap">
          <div class="config-row config-row--stack">
            <div class="row-label">
              <i class="dot dot--active"></i>
              <span>玩法奖池比例</span>
              <i class="icon-info" aria-hidden="true">i</i>
            </div>

            <div class="value-input">
              <input
                v-model="currentModeConfig.gamePlayRatio"
                class="inline-input"
                inputmode="decimal"
                placeholder="Enter here"
              />
              <span>%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="glass-card section-card section-card--dense">
        <div class="segment-row segment-row--four">
          <button
            v-for="size in stakeLevels"
            :key="size"
            type="button"
            class="segment-btn"
            :class="{ 'segment-btn--active': activeStakeLevel === size }"
            @click="activeStakeLevel = size"
          >
            {{ size }}
          </button>
        </div>

        <div class="divider"></div>

        <div
          v-for="option in selectedBlindOptions"
          :key="`config-${activeStakeLevel}-${option.sb}`"
          class="blind-config-panel"
        >
          <div class="divider"></div>

          <div class="rows-wrap rows-wrap--gap-sm">
            <div class="config-row config-row--stack">
              <div class="row-label">
                <i class="dot dot--active"></i>
                <span>{{ option.label }}</span>
                <i class="icon-info" aria-hidden="true">i</i>
              </div>
              <div class="value-input">
                <input
                  v-model="getBlindConfigBySb(option.sb).prizeRatio"
                  class="inline-input"
                  inputmode="decimal"
                  placeholder="Enter here"
                />
                <span>%</span>
              </div>
            </div>

            <div class="config-row">
              <div class="row-label row-label--small">
                <i
                  class="dot"
                  :class="{ 'dot--active': getBlindConfigBySb(option.sb).contributePotChecked }"
                  @click="
                    getBlindConfigBySb(option.sb).contributePotChecked = !getBlindConfigBySb(
                      option.sb,
                    ).contributePotChecked
                  "
                ></i>
                <span>底池触发jackpot贡献</span>
              </div>
              <div class="value-input value-input--narrow">
                <input
                  v-model="getBlindConfigBySb(option.sb).contributePotLimit"
                  class="inline-input"
                  inputmode="decimal"
                  placeholder="BB amount"
                />
              </div>
            </div>

            <div class="config-row">
              <div class="row-label row-label--small">
                <i
                  class="dot"
                  :class="{ 'dot--active': getBlindConfigBySb(option.sb).awardBetChecked }"
                  @click="
                    getBlindConfigBySb(option.sb).awardBetChecked = !getBlindConfigBySb(option.sb)
                      .awardBetChecked
                  "
                ></i>
                <span>投入底池触发jackpot奖励</span>
              </div>
              <div class="value-input value-input--narrow">
                <input
                  v-model="getBlindConfigBySb(option.sb).awardBetLimit"
                  class="inline-input"
                  inputmode="decimal"
                  placeholder="BB amount"
                />
              </div>
            </div>

            <div class="config-row">
              <div class="row-label row-label--small">
                <i
                  class="dot"
                  :class="{ 'dot--active': getBlindConfigBySb(option.sb).awardOtherChecked }"
                  @click="
                    getBlindConfigBySb(option.sb).awardOtherChecked = !getBlindConfigBySb(option.sb)
                      .awardOtherChecked
                  "
                ></i>
                <span>奖励全桌</span>
              </div>
              <div class="value-input value-input--narrow">
                <input
                  v-model="getBlindConfigBySb(option.sb).awardOtherRatio"
                  class="inline-input"
                  inputmode="decimal"
                  placeholder="BB amount"
                />
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="title-line">
            <span>jackpot 贡献</span>
            <i class="icon-info" aria-hidden="true">i</i>
          </div>

          <div class="rows-wrap rows-wrap--gap-sm">
            <div class="config-row">
              <div class="row-label">
                <i
                  class="dot"
                  :class="{ 'dot--active': getBlindConfigBySb(option.sb).profitTriggerChecked }"
                  @click="
                    getBlindConfigBySb(option.sb).profitTriggerChecked = !getBlindConfigBySb(
                      option.sb,
                    ).profitTriggerChecked
                  "
                ></i>
                <span>盈利触发</span>
              </div>
              <div class="value-input value-input--narrow">
                <input
                  v-model="getBlindConfigBySb(option.sb).profitTriggerLimit"
                  class="inline-input"
                  inputmode="decimal"
                  placeholder="BB amount"
                />
              </div>
            </div>

            <div class="config-row">
              <div class="row-label">
                <i
                  class="dot"
                  :class="{ 'dot--active': getBlindConfigBySb(option.sb).jackpotContribChecked }"
                  @click="
                    getBlindConfigBySb(option.sb).jackpotContribChecked = !getBlindConfigBySb(
                      option.sb,
                    ).jackpotContribChecked
                  "
                ></i>
                <span>Jackpot 贡献</span>
              </div>
              <div class="value-input value-input--narrow">
                <input
                  v-model="getBlindConfigBySb(option.sb).jackpotContribValue"
                  class="inline-input"
                  inputmode="decimal"
                  placeholder="BB amount"
                />
              </div>
            </div>

            <div class="config-row">
              <div class="row-label">
                <i
                  class="dot"
                  :class="{ 'dot--active': getBlindConfigBySb(option.sb).profitPercentChecked }"
                  @click="
                    getBlindConfigBySb(option.sb).profitPercentChecked = !getBlindConfigBySb(
                      option.sb,
                    ).profitPercentChecked
                  "
                ></i>
                <span>触发盈利 (%)</span>
              </div>
              <div class="value-input value-input--narrow">
                <input
                  v-model="getBlindConfigBySb(option.sb).profitPercentValue"
                  class="inline-input"
                  inputmode="decimal"
                  placeholder="0"
                />
                <span>%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="blind-list">
          <label
            v-for="option in blindOptions"
            :key="option.id"
            class="blind-item blind-item--checkbox"
          >
            <input
              class="blind-checkbox"
              type="checkbox"
              :checked="option.selected"
              @change="onBlindOptionClick(option)"
            />
            <span>{{ option.label }}</span>
          </label>
        </div>
      </div>

      <div class="glass-card pool-card">
        <p class="pool-settings-title">Pool Settings</p>

        <template v-for="(item, index) in currentModeConfig.poolSettings" :key="item.id">
          <div v-if="index > 0" class="divider"></div>
          <div class="pool-row">
            <div class="pool-left">
              <div class="row-label">
                <i
                  class="dot"
                  :class="{ 'dot--active': item.checked }"
                  @click="item.checked = !item.checked"
                ></i>
                <span>{{ item.title }}</span>
              </div>

              <div class="hand-cards">
                <div
                  v-for="(card, ci) in item.cards"
                  :key="ci"
                  class="play-card"
                  :class="card.red ? 'play-card--red' : 'play-card--black'"
                >
                  <span class="play-card__rank">{{ card.rank }}</span>
                  <span class="play-card__suit">{{ card.suit }}</span>
                </div>
              </div>
            </div>

            <div class="pool-right">
              <span>Award ratio (%)</span>
              <div class="value-input value-input--narrow">
                <input v-model="item.ratio" class="inline-input" placeholder="BB amount" />
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>

    <div class="bottom-actions">
      <button type="button" class="action-btn action-btn--cancel" @click="onCancel">取消</button>
      <button
        type="button"
        class="action-btn action-btn--confirm"
        :disabled="loading"
        @click="onConfirm"
      >
        {{ loading ? '提交中...' : '确定' }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.jackpot-create-page {
  position: relative;
  height: 100dvh;
  padding: 0 0.3733rem calc(2.0267rem + env(safe-area-inset-bottom));
  overflow-x: hidden;
  overflow-y: auto;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.page-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.9733rem);
  mix-blend-mode: luminosity;
  pointer-events: none;
  z-index: 0;
}

:deep(.page-back-header) {
  position: relative;
  z-index: 3;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
}

.create-content {
  position: relative;
  z-index: 2;
  margin: 0.4267rem auto 0;
  width: 9.2533rem;
  max-width: calc(100vw - 0.7467rem);
  display: flex;
  flex-direction: column;
  gap: 0.2534rem;
}

.name-input-pill {
  height: 1.308rem;
  border-radius: 4.223rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0 0.5067rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
}

.pill-label,
.pill-count {
  font-size: 0.3733rem;
  line-height: 1.4;
  flex-shrink: 0;
}

.pill-input {
  flex: 1;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.4054rem;
  line-height: 1.2;
  text-align: center;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}

.pill-count {
  color: #b4b4b4;
}

.glass-card {
  border-radius: 0.4328rem;
  background: linear-gradient(103.95deg, rgba(255, 255, 255, 0.1) 21.1%, rgba(230, 230, 230, 0.1) 71.4%);
  backdrop-filter: blur(0.004rem);
}

.summary-card {
  padding: 0.3722rem 0.5067rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-title-row {
  display: flex;
  align-items: center;
  gap: 0.1333rem;
  color: #fff;
  font-size: 0.32rem;
  line-height: 1.4;
}

.icon-info {
  width: 0.2667rem;
  height: 0.2667rem;
  border-radius: 50%;
  border: 0.0187rem solid rgba(255, 255, 255, 0.72);
  font-size: 0.2133rem;
  line-height: 0.24rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-style: normal;
}

.summary-amount-input {
  margin: 0.0667rem 0 0;
  color: #fff;
  font-size: 0.5333rem;
  line-height: 1.4;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.1067rem;
  min-width: 3.2rem;
}

.summary-amount-input .inline-input {
  text-align: left;
  font-size: inherit;
  font-weight: inherit;
}

.section-card {
  width: 100%;
  padding: 0.5067rem;
  display: flex;
  flex-direction: column;
  gap: 0.3733rem;
}

.section-card--dense {
  gap: 0.3733rem;
}

.segment-row {
  height: 1.04rem;
  border-radius: 0.8rem;
  background: rgba(27, 27, 30, 0.4);
  display: grid;
  align-items: center;
  padding: 0.0267rem;
}

.segment-row--five {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.segment-row--four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.segment-btn {
  height: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.362rem;
  border-radius: 1.3844rem;
}

.segment-btn--active {
  border: 0;
  background: rgba(249, 249, 249, 0.5);
}

.mode-switch-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.16rem 0.28rem;
}

.mode-switch-item {
  display: inline-flex;
  align-items: center;
  gap: 0.1067rem;
  color: #fff;
  font-size: 0.32rem;
}

.mode-switch-checkbox {
  width: 0.4rem;
  height: 0.4rem;
}

.divider {
  height: 0.0181rem;
  background: rgba(255, 255, 255, 0.25);
}

.rows-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.2027rem;
}

.rows-wrap--gap-sm {
  gap: 0.24rem;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.1867rem;
}

.config-row--stack {
  flex-direction: column;
  align-items: stretch;
}

.row-label {
  display: inline-flex;
  align-items: center;
  gap: 0.1014rem;
  color: #fff;
  font-size: 0.4054rem;
  line-height: 1.4;
}

.row-label--small {
  font-size: 0.352rem;
}

.dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  border: 0.0267rem solid rgba(255, 255, 255, 0.7);
  position: relative;
  flex-shrink: 0;
}

.dot--active::after {
  content: '';
  position: absolute;
  inset: 0.0667rem;
  border-radius: 50%;
  background: linear-gradient(145deg, #33c6ff, #1b9fdb 80%);
}

.value-input {
  height: 0.9291rem;
  border-radius: 1.5519rem;
  background: rgba(27, 27, 30, 0.6);
  padding: 0 0.304rem;
  color: #fff;
  font-size: 0.3716rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.1943rem;
}

.value-input--narrow {
  width: 3.657rem;
  justify-content: center;
}

.title-line {
  display: flex;
  align-items: center;
  gap: 0.1333rem;
  font-size: 0.3716rem;
  color: #fff;
}

.blind-list {
  display: flex;
  flex-direction: column;
  gap: 0.1351rem;
}

.blind-list--inline {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.16rem 0.24rem;
}

.blind-item {
  border: 0;
  padding: 0;
  background: transparent;
  color: #fff;
  font-size: 0.397rem;
  display: flex;
  align-items: center;
  gap: 0.0792rem;
  width: fit-content;
}

.blind-item--checkbox {
  align-items: center;
}

.blind-checkbox {
  width: 0.4rem;
  height: 0.4rem;
}

.blind-config-panel {
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
}

.pool-card {
  padding: 0.3722rem 0.5067rem;
  display: flex;
  flex-direction: column;
  gap: 0.2134rem;
}

.pool-settings-title {
  margin: 0;
  font-size: 0.4392rem;
  line-height: normal;
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
}

.pool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.2667rem;
}

.pool-left {
  width: 3.1207rem;
  display: flex;
  flex-direction: column;
  gap: 0.2134rem;
}

.hand-cards {
  display: flex;
  align-items: center;
  gap: 0.0865rem;
}

.play-card {
  width: 0.5549rem;
  height: 0.8324rem;
  border-radius: 0.876rem;
  border: 0.0068rem solid rgba(255, 255, 255, 0.8);
  background: linear-gradient(165.16deg, rgb(251, 251, 251) 2.45%, rgb(230, 227, 227) 92.49%);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.04rem;
  flex-shrink: 0;
  overflow: hidden;
}

.play-card__rank {
  font-size: 0.2933rem;
  font-weight: 700;
  line-height: 1;
}

.play-card__suit {
  font-size: 0.2667rem;
  line-height: 1;
  align-self: flex-end;
}

.play-card--black .play-card__rank,
.play-card--black .play-card__suit {
  color: #171717;
}

.play-card--red .play-card__rank,
.play-card--red .play-card__suit {
  color: #fa2b4b;
}

.pool-right {
  width: 3.657rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.08rem;
}

.pool-right > span {
  color: #fff;
  font-size: 0.2987rem;
  line-height: 1.4;
}

.bottom-actions {
  position: fixed;
  left: 50%;
  bottom: calc(0.3733rem + env(safe-area-inset-bottom));
  width: 9.2533rem;
  max-width: calc(100vw - 0.7467rem);
  transform: translateX(-50%);
  z-index: 8;
  display: flex;
  gap: 0.2534rem;
}

.action-btn {
  flex: 1;
  height: 1.4358rem;
  border-radius: 1.0557rem;
  border: 0;
  color: #fff;
  font-size: 0.4rem;
  font-weight: 500;
}

.action-btn--cancel {
  background: rgba(0, 0, 0, 0.3);
}

.action-btn--confirm {
  border: 0;
  border-radius: 3.3333rem;
  background: linear-gradient(109.57deg, rgba(255, 255, 255, 0.1) 21.1%, rgba(230, 230, 230, 0.1) 71.4%);
  backdrop-filter: blur(0.0133rem);
  color: #78e490;
  font-size: 0.4175rem;

  &:disabled {
    opacity: 0.5;
  }
}

.inline-input {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: inherit;
  line-height: inherit;
  width: 100%;
  text-align: center;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}
</style>
