<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import TableSwitch from '@/components/GameCreateForm/TableSwitch.vue'
import TableSelect from '@/components/GameCreateForm/TableSelect.vue'
import TableSlider from '@/components/GameCreateForm/TableSlider.vue'
import TableInput from '@/components/GameCreateForm/TableInput.vue'
import TableStepper from '@/components/GameCreateForm/TableStepper.vue'
import TableTab from '@/components/GameCreateForm/TableTab.vue'
import QuickCreateView from './components/CreateTableQuicklyMtt.vue'
import { mttSections } from './mttSections/index'
import { defaultMttFormState, type MttFormState } from './mttSections/formState'
import type { FieldValue, TableFormFieldConfig } from './template'
import { useAppConfigStore } from '@/stores/appConfig'
import type { DiamondConfigItem, DiamondSetting } from '@/api/models/config'
import { useUserInfoStore } from '@/stores/userInfo'
import { useGameStore } from '@/stores/game'
import { t } from '@/i18n'
import icDiamondBalance from '@/assets/icons/ic_diamond_balance.png'
import { showFailToast } from 'vant'
import { showGameToast } from '@/components/Toast'
import { buildRoomConfigPayload, parseRoomConfigToFormState } from './mttSections/payload'
import { postOrgRoomClubCreateApi, postOrgCreateTemplateApi } from '@/api/cmsext'

const formState = reactive<MttFormState>({ ...defaultMttFormState })
const route = useRoute()
const router = useRouter()
const appConfigStore = useAppConfigStore()
const userInfoStore = useUserInfoStore()
const gameStore = useGameStore()

// 俱乐部钻石余额
const clubDiamondBalance = computed(() => {
  return Math.max(0, toNumber(userInfoStore.currentClub?.diamonds))
})

// 创建费用计算（根据当前配置动态计算）
interface CreateFeeConfig {
  originalPrice: number
  currentPrice: number
  isDiscount: boolean
  discountExpired: boolean
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

interface FeePrice {
  originPrice: number
  discountPrice: number
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
} as const

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function getSeatCount(): number {
  const seat = Math.floor(toNumber(formState.seat_count, 2))
  return seat > 0 ? seat : 2
}

function getHalfHourMultiple(): number {
  const duration = toNumber(formState.play_duration, 3600)
  if (duration <= 0) return 1
  return Math.max(1, Math.round(duration / 1800))
}

const currentOriginType = computed(() => {
  const v = Math.floor(toNumber(route.query.origin_type, 5))
  return v > 0 ? v : 5
})

function getBanConfigType(antiCheatType: number, antiCheatVideoType: number): number | null {
  if (antiCheatType === 2) return DIAMOND_CONFIG_TYPE.AUDIO_TABLE
  if (antiCheatType === 4) return DIAMOND_CONFIG_TYPE.FACE_VERIFICATION
  if (antiCheatType !== 3) return null
  if (antiCheatVideoType === 2) return DIAMOND_CONFIG_TYPE.VIDEO_RANDOM
  if (antiCheatVideoType === 3) return DIAMOND_CONFIG_TYPE.VIDEO_SEQUENCE
  return DIAMOND_CONFIG_TYPE.VIDEO_FULL_TIME
}

function getBanMultiple(antiCheatType: number): number {
  const commonMultiple = getHalfHourMultiple()
  if (antiCheatType === 2 || antiCheatType === 3) {
    return commonMultiple
  }
  return 1
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
  if (!config) {
    return { originPrice: 0, discountPrice: 0, isDiscount: false }
  }
  const setting = resolveDiamondSettingBySb(config, sb)
  if (!setting) {
    return { originPrice: 0, discountPrice: 0, isDiscount: false }
  }
  // status=2：配置关闭，按客户端逻辑视作“折扣到 0”（免费）。
  if (config.status === 2) {
    return { originPrice: setting.price, discountPrice: 0, isDiscount: true }
  }

  const nowSec = Math.floor(Date.now() / 1000)
  if (!isInDiscountWindow(config, nowSec)) {
    return {
      originPrice: setting.price,
      discountPrice: setting.price,
      isDiscount: false,
    }
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
  return {
    originPrice: setting.price,
    discountPrice: setting.price,
    isDiscount: false,
  }
}

function findDiamondConfig(configType: number, typeExt: number): DiamondConfigItem | null {
  return appConfigStore.diamondConfig?.[configType]?.[typeExt] ?? null
}

function formatFeeCount(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString()
}

const feeDetails = computed<FeeDetailItem[]>(() => {
  const tableTypeExt = 2
  const seatCount = getSeatCount()
  const sb = Math.floor(toNumber(formState.sb))
  const details: FeeDetailItem[] = []

  // 1) 开桌收费（config_type=1，按 tableTypeExt + sb）
  const createConfig = findDiamondConfig(DIAMOND_CONFIG_TYPE.CREATE_TABLE, tableTypeExt)
  const durationMultiple = getHalfHourMultiple()
  const createPrice = getConfigPrice(createConfig, sb)
  details.push({
    label: '创建牌桌',
    unitOrigin: createPrice.originPrice,
    unitCurrent: createPrice.discountPrice,
    multiple: durationMultiple,
    totalOrigin: createPrice.originPrice * durationMultiple,
    totalCurrent: createPrice.discountPrice * durationMultiple,
    isDiscount: createPrice.isDiscount,
  })

  // 2) 防作弊收费（语音/视频/人脸）
  const antiCheatType = Math.floor(toNumber(formState.anti_cheat_type))
  const antiCheatVideoType = Math.floor(toNumber(formState.anti_cheat_video_type, 1))
  const banConfigType = getBanConfigType(antiCheatType, antiCheatVideoType)
  if (banConfigType) {
    const banConfig = findDiamondConfig(banConfigType, seatCount)
    const banPrice = getConfigPrice(banConfig, sb)
    const banMultiple = getBanMultiple(antiCheatType)
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

  // 3) 聊天收费（config_type=10，type_ext=seat*1000 + tableTypeExt）
  const isChatOn = Math.floor(toNumber(formState.chat_type)) !== 0
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

  return details
})

const createFee = computed<CreateFeeConfig>(() => {
  const totalOrigin = feeDetails.value.reduce((sum, item) => sum + item.totalOrigin, 0)
  const totalDiscount = feeDetails.value.reduce((sum, item) => sum + item.totalCurrent, 0)
  const hasDiscount = feeDetails.value.some((item) => item.isDiscount)

  const originalPrice = Math.max(0, Math.round(totalOrigin))
  const currentPrice = Math.max(0, Math.round(totalDiscount))
  return {
    originalPrice,
    currentPrice,
    isDiscount: hasDiscount,
    discountExpired: !hasDiscount,
  }
})

const createFeeTip = computed<string>(() => {
  const lines = feeDetails.value.map((item) => {
    const unitPart = `${formatFeeCount(item.unitCurrent)} x ${item.multiple}`
    if (item.totalCurrent <= 0) {
      return `${item.label}: 免费`
    }
    if (item.isDiscount && item.totalOrigin > item.totalCurrent) {
      return `${item.label}: ${unitPart} = ${formatFeeCount(
        item.totalCurrent,
      )} (原价${formatFeeCount(item.totalOrigin)})`
    }
    return `${item.label}: ${unitPart} = ${formatFeeCount(item.totalCurrent)}`
  })
  return lines.join('\n')
})

// section 渲染时动态访问 formState，用此别名绕过 TS 索引限制
const formStateMap = formState as Record<string, FieldValue>

const activeTab = ref<'quick' | 'pro'>('quick')

const componentMap: Record<string, unknown> = {
  switch: TableSwitch,
  select: TableSelect,
  slider: TableSlider,
  input: TableInput,
  stepper: TableStepper,
  tab: TableTab,
}

function syncRouteParamsToFormState(): void {
  formState.game_play_type = Number(route.query.game_play_type)
  formState.bombpot = route.query.bombpot ? Number(route.query.bombpot) : 0
  formState.origin_type = currentOriginType.value
  if (!formState.name) {
    const nickname = gameStore.loginNickname || gameStore.loginAccount || ''
    if (nickname) {
      formState.name = `${nickname}的牌桌`
    }
  }
}

function hitCondition(conditionValue: FieldValue | FieldValue[], formValue: FieldValue): boolean {
  if (Array.isArray(conditionValue)) {
    return (conditionValue as FieldValue[]).some((candidate) =>
      isSameFieldValue(candidate, formValue),
    )
  }
  return isSameFieldValue(conditionValue, formValue)
}

function isSameFieldValue(left: FieldValue, right: FieldValue): boolean {
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false
    if (left.length !== right.length) return false
    return left.every((item, index) => item === right[index])
  }
  return left === right
}
//处理解析该配置是否隐藏禁用
function checkConditions(
  conditions: TableFormFieldConfig['visibleWhen'] | TableFormFieldConfig['disabledWhen'],
): boolean {
  return conditions!.every((cond) => {
    const value = formStateMap[cond.field]
    const matchEquals = cond.equals === undefined ? true : hitCondition(cond.equals, value)
    const matchNotEquals =
      cond.notEquals === undefined ? true : !hitCondition(cond.notEquals, value)
    return matchEquals && matchNotEquals
  })
}

function isVisible(field: TableFormFieldConfig): boolean {
  if (!field.visibleWhen || field.visibleWhen.length === 0) return true
  return checkConditions(field.visibleWhen)
}

function isDisabled(field: TableFormFieldConfig): boolean {
  if (!field.disabledWhen || field.disabledWhen.length === 0) return false
  return checkConditions(field.disabledWhen)
}

// 处理动态选项
function resolveFieldOptions(field: TableFormFieldConfig) {
  return field.options
}

const renderedSections = computed(() =>
  mttSections.map((section) =>
    section
      .filter((f) => isVisible(f))
      .map((f) => ({
        ...f,
        options: resolveFieldOptions(f),
        disabled: isDisabled(f),
      })),
  ),
)

function onFieldChange(field: TableFormFieldConfig, value: FieldValue): void {
  const curField = field.modelValue
  if (curField === 'buyin_range' && Array.isArray(value)) {
    //处理带入区间
    const start = Number(value[0])
    const end = Number(value[1])
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return
    }
    const minRate = Math.min(start, end)
    const maxRate = Math.max(start, end)
    formState.min_rate = minRate
    formState.max_rate = maxRate
    formState.buyin_range = [minRate, maxRate]
  } else if (curField === 'autostart_min_players' || curField === 'seat_count') {
    // 人满开局不能超过最大座位数
    if (formState.autostart_min_players > formState.seat_count) {
      formState.autostart_min_players = formState.seat_count
    }
  } else if (curField === 'sb' || curField == 'random_ante') {
    // SB 变化时重置前注（新 SB 的选项列表不同）
    formState.ante = 0
  } else if (curField === 'min_ante' || curField === 'max_ante') {
    // 保证最大前注 >= 最小前注
    formState.max_ante = String(Math.max(+formState.max_ante, +formState.min_ante))
  } else if (curField === 'retain_min_rate' || curField === 'retain_max_rate') {
    // 保证最大保留 >= 最小保留
    formState.retain_max_rate = Math.min(
      99999,
      Math.max(+formState.retain_max_rate, +formState.retain_min_rate),
    )
  } else if (curField === 'mushroom') {
    formState.mushroom_mode = 2
    formState.critical_hit = 0
    formState.squid = 0
  } else if (curField == 'squid') {
    formState.mushroom = 0
    formState.critical_hit = 0
  } else if (curField == 'critical_hit') {
    formState.squid = 0
    formState.mushroom = 0
  }
}

watch(
  () => route.query,
  () => {
    syncRouteParamsToFormState()
  },
  { immediate: true },
)

function onQuickEditTemplate(roomConfig: Record<string, unknown>): void {
  const parsed = parseRoomConfigToFormState(roomConfig)
  Object.assign(formState, parsed)
  syncRouteParamsToFormState()
  activeTab.value = 'pro'
}

// 从模板编辑跳转时，通过 history.state.room_config 携带服务端数据
onMounted(() => {
  const roomConfig = (window.history.state as Record<string, unknown> | null)?.room_config
  if (roomConfig && typeof roomConfig === 'object') {
    const parsed = parseRoomConfigToFormState(roomConfig as Record<string, unknown>)
    Object.assign(formState, parsed)
    // 路由 query 的 game_play_type / bombpot 优先级更高，重新同步一次
    syncRouteParamsToFormState()
  }
})

const isSubmitting = ref(false)

async function onSaveTemplate() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    const res = await postOrgCreateTemplateApi({
      name: formState.name || '自定义模板',
      room_config: buildRoomConfigPayload(formState),
    })
    if (res.code === 0) {
      showGameToast('保存成功')
    } else {
      showFailToast(res.message || '保存失败')
    }
  } catch {
    showFailToast('保存失败')
  } finally {
    isSubmitting.value = false
  }
}

async function onCreateTable() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    const payload = {
      name: formState.name || '自定义牌桌',
      room_config: buildRoomConfigPayload(formState),
    }
    const res = await postOrgRoomClubCreateApi(payload)
    if (res.code === 0) {
      showGameToast('创建成功')
      await router.replace({ name: 'club-index' })
    } else {
      showFailToast(res.message || '创建失败')
    }
  } catch {
    showFailToast('创建失败')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="create-table-page">
    <!-- Header with tabs -->
    <HeaderBack>
      <div class="header-tabs">
        <button
          :class="['header-tab', { 'header-tab--active': activeTab === 'quick' }]"
          @click="activeTab = 'quick'"
        >
          一键开桌
        </button>
        <button
          :class="['header-tab', { 'header-tab--active': activeTab === 'pro' }]"
          @click="activeTab = 'pro'"
        >
          专业参数
        </button>
      </div>
    </HeaderBack>

    <!-- Quick create tab -->
    <div v-show="activeTab === 'quick'" class="quick-create-wrapper">
      <QuickCreateView @edit-template="onQuickEditTemplate" />
    </div>

    <!-- Pro params tab -->
    <div v-show="activeTab === 'pro'" class="create-table-form">
      <!-- Table name row -->
      <div class="table-name-row">
        <span class="table-name__label">牌局名称</span>
        <input
          v-model="formState.name"
          class="table-name__input"
          type="text"
          placeholder="德州/短牌/奥马哈"
          :maxlength="20"
        />
        <span class="table-name__count">{{ formState.name.length }}/20</span>
      </div>

      <!-- Form sections -->
      <div class="detail-form">
        <template v-for="(section, index) in renderedSections" :key="index">
          <div v-if="section.length" class="detail-form__section">
            <component
              :is="componentMap[field.type]"
              v-for="field in section"
              :key="field.modelValue"
              v-model:model-value="formStateMap[field.modelValue]"
              class="detail-form__item"
              :label="field.label"
              :tip="field.tip"
              :options="field.options"
              :active-value="field.activeValue"
              :inactive-value="field.inactiveValue"
              :min="field.min"
              :max="field.max"
              :step="field.step"
              :unit="field.unit"
              :range="field.range"
              :mark-mode="field.markMode"
              :disabled="field.disabled"
              :number-only="field.numberOnly"
              :decimal-digits="field.decimalDigits"
              :need-double="field.needDouble"
              :icon="field.icon"
              :tip2="
                field.modelValue == 'squid' && formState.squid
                  ? formState.squid_mode == 1
                    ? t('UICreateTableSquidClassicTips')
                    : t('UICreateTableSquidBattleTips')
                  : ''
              "
              @change="onFieldChange(field, $event)"
            />
          </div>
        </template>
      </div>

      <!-- Bottom action bar -->
      <div class="bottom-action-bar">
        <div class="fee-info">
          <div class="fee-row">
            <span class="fee-label">消耗:</span>
            <div v-if="createFee.isDiscount" class="fee-value-wrap">
              <img :src="icDiamondBalance" class="fee-diamond-icon" alt="" />
              <span class="fee-original">{{ createFee.originalPrice.toLocaleString() }}</span>
            </div>
          </div>
          <div class="fee-row fee-row--current">
            <img :src="icDiamondBalance" class="fee-diamond-icon" alt="" />
            <span class="fee-current mr-4">{{ createFee.currentPrice.toLocaleString() }}</span>
            <FieldTip :tip="createFeeTip" />
          </div>
          <div class="fee-row">
            <span class="fee-label">余额:</span>
            <img :src="icDiamondBalance" class="fee-diamond-icon" alt="" />
            <span class="fee-balance">{{ clubDiamondBalance.toLocaleString() }}</span>
          </div>
        </div>
        <div class="action-buttons">
          <button
            class="action-btn action-btn--save"
            :disabled="isSubmitting"
            @click="onSaveTemplate"
          >
            保存模板
          </button>
          <button
            class="action-btn action-btn--create"
            :disabled="isSubmitting"
            @click="onCreateTable"
          >
            立即创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins' as *;

.create-table-page {
  position: relative;
  min-height: 100dvh;
  padding: 0 0 calc(1.6rem + env(safe-area-inset-bottom));
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
  overflow-x: hidden;
  overflow-y: auto;

  @include theme-light {
    background-image: url('@/assets/images/main_bg_light.webp');
  }
}

/* Header tabs */
.header-tabs {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin: 0 auto;
  transform: translateX(-0.5rem);
}

.header-tab {
  background: transparent;
  border: none;
  font-size: 0.4rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.08rem 0 0;
  position: relative;

  @include theme-light {
    color: rgba(0, 0, 0, 0.55);
  }

  &--active {
    font-weight: 700;
    color: #fff;

    @include theme-light {
      color: #000;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: #fff;
      border-radius: 1px;

      @include theme-light {
        background: #000;
      }
    }
  }
}
.create-table-form {
  overflow-y: auto;
  padding-bottom: calc(3.4rem + env(safe-area-inset-bottom));
  height: calc(100dvh - 1.4rem - env(safe-area-inset-bottom));
}

.quick-create-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 1.4rem - env(safe-area-inset-bottom));
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.quick-create-wrapper::-webkit-scrollbar {
  display: none;
}

/* Table name row */
.table-name-row {
  display: flex;
  align-items: center;
  height: 1.23rem;
  margin: 0.35rem 0.35rem 0;
  padding: 0 0.51rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.43rem;
  backdrop-filter: blur(0.16px);

  @include theme-light {
    background: #fff;
    backdrop-filter: none;
  }
}
.detail-form__section {
  margin: 0.38rem 0.35rem 0;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.43rem;
  backdrop-filter: blur(0.16px);
  padding: 0.13rem 0.5rem;

  @include theme-light {
    background: #fff;
    backdrop-filter: none;
  }
}

.table-name__label {
  font-size: 0.37rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;
  white-space: nowrap;

  @include theme-light {
    color: var(--c-text);
  }
}

.table-name__input {
  flex: 1;
  min-width: 0;
  margin-left: 0.53rem;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.4rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;

  @include theme-light {
    color: var(--c-text);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);

    @include theme-light {
      color: var(--c-text-muted);
    }
  }
}

.table-name__count {
  margin-left: 0.27rem;
  font-size: 0.37rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #b4b4b4;
  white-space: nowrap;
}

/* Detail form */
.detail-form {
  border-radius: 0.35rem;
  padding: 0.08rem 0 0.25rem;
}

.detail-form__item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);

  @include theme-light {
    border-bottom-color: var(--c-divider);
  }

  &:last-of-type {
    border-bottom: none;
  }
}

/* Bottom action bar */
.bottom-action-bar {
  position: fixed;
  left: 0.35rem;
  right: 0.35rem;
  bottom: calc(0.24rem + env(safe-area-inset-bottom));
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
  padding: 0.16rem 0.24rem;
  border-radius: 0.32rem;
  background: rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(0.18rem);
  -webkit-backdrop-filter: blur(0.18rem);

  @include theme-light {
    background: #f3f4f6;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

.fee-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.fee-row {
  display: flex;
  align-items: center;
  gap: 0.08rem;

  &--current {
    margin-left: 0.15rem;
  }
}

.fee-label {
  font-size: 0.31rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;

  @include theme-light {
    color: var(--c-text);
  }
}

.fee-value-wrap {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  position: relative;
  opacity: 0.4;
}

.fee-diamond-icon {
  width: 0.32rem;
  height: 0.32rem;
}

.fee-original {
  font-size: 0.34rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: rgba(255, 255, 255, 1);
  text-decoration: line-through;

  @include theme-light {
    color: var(--c-text);
  }
}

.fee-current {
  font-size: 0.34rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;

  @include theme-light {
    color: var(--c-text);
  }
}

.fee-strike {
  width: 0.28rem;
  height: 0.28rem;
}

.fee-balance {
  font-size: 0.34rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;

  @include theme-light {
    color: var(--c-text);
  }
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.21rem;
}

.action-btn {
  width: 2.4rem;
  height: 1.04rem;
  border: none;
  border-radius: 1.11rem;
  font-size: 0.37rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &--save {
    background: rgba(0, 0, 0, 0.3);
    color: #fff;
    backdrop-filter: blur(0.17px);

    @include theme-light {
      background: rgba(134, 134, 134, 0.22);
      color: var(--c-text);
      backdrop-filter: none;
    }
  }

  &--create {
    background: linear-gradient(157deg, rgba(85, 243, 41, 1) 0%, rgba(62, 173, 6, 1) 100%);
    color: #fff;
    box-shadow:
      inset 1px 1px 0px 0px rgba(242, 242, 242, 0.8),
      inset -1px -1px 0px 0px rgba(255, 255, 255, 0.5);

    @include theme-light {
      background: var(--c-brand);
      box-shadow: none;
    }
  }
}
</style>
