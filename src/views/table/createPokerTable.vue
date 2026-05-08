<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import TableSwitch from '@/components/GameCreateForm/TableSwitch.vue'
import TableSelect from '@/components/GameCreateForm/TableSelect.vue'
import TableSlider from '@/components/GameCreateForm/TableSlider.vue'
import TableInput from '@/components/GameCreateForm/TableInput.vue'
import TableTab from '@/components/GameCreateForm/TableTab.vue'
import QuickCreateView from './QuickCreateView.vue'
import { nlhSections } from './sections/index'
import { defaultNlhFormState, type NlhFormState } from './sections/formState'
import type { FieldValue, TableFormFieldConfig } from './template'
import { useAppConfigStore } from '@/stores/appConfig'
import { useUserInfoStore } from '@/stores/userInfo'
import { buildBuyinOptions, resolveBringinBbRange } from './sections/topSlides'
import { getAnteOptions } from './sections/constants'
import { t } from '@/i18n'
import icDiamondBalance from '@/assets/icons/ic_diamond_balance.svg'
import icTip from '@/assets/icons/ic_tip.svg'
import { showFailToast } from 'vant'
import { showGameToast } from '@/components/Toast'
import { buildRoomConfigPayload, parseRoomConfigToFormState } from './sections/payload'
import { postOrgRoomClubCreateApi, postOrgCreateTemplateApi } from '@/api/cmsext'

const formState = reactive<NlhFormState>({ ...defaultNlhFormState })
const route = useRoute()
const router = useRouter()
const appConfigStore = useAppConfigStore()
const userInfoStore = useUserInfoStore()

// 俱乐部钻石余额
const clubDiamondBalance = computed(() => {
  const club = userInfoStore.currentClub
  return club?.diamonds ?? 0
})

// 创建费用计算（根据当前配置动态计算）
interface CreateFeeConfig {
  originalPrice: number
  currentPrice: number
  isDiscount: boolean
  discountExpired: boolean
}

const createFee = computed<CreateFeeConfig>(() => {
  // 从全局配置读取创建房间费用配置（如果有）
  // 默认原价 100 钻石，假设有折扣配置
  const originalPrice = 100
  let currentPrice = originalPrice
  let isDiscount = false
  let discountExpired = true

  // 如果有折扣配置，解析判断是否在有效期内
  // 这里用示例逻辑：实际应从 globalConfig 或接口获取
  const now = Date.now() / 1000
  // 假设折扣配置在 globalConfig 中（后续对接真实配置）
  const discountStart = 0
  const discountEnd = 0
  if (discountStart && discountEnd && now >= discountStart && now <= discountEnd) {
    currentPrice = Math.floor(originalPrice * 0.8)
    isDiscount = true
    discountExpired = false
  }

  return { originalPrice, currentPrice, isDiscount, discountExpired }
})

// section 渲染时动态访问 formState，用此别名绕过 TS 索引限制
const formStateMap = formState as Record<string, FieldValue>

const activeTab = ref<'quick' | 'pro'>('pro')

const componentMap: Record<string, unknown> = {
  switch: TableSwitch,
  select: TableSelect,
  slider: TableSlider,
  input: TableInput,
  tab: TableTab,
}
//全局配置中获取俱乐部带入区间范围
const buyinBbRange = (() => {
  const raw = appConfigStore.globalConfig?.friend_club_bringin_min_max_bb_range
  return resolveBringinBbRange(raw)
})()

const buyinOptions = computed(() => buildBuyinOptions(buyinBbRange, formState.sb))
const anteOptions = computed(() => getAnteOptions(formState.sb))

function syncRouteParamsToFormState(): void {
  formState.game_play_type = Number(route.query.game_play_type)
  formState.bombpot = route.query.bombpot ? Number(route.query.bombpot) : 0
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
  if (field.modelValue === 'buyin_range') {
    return buyinOptions.value
  }
  if (field.modelValue === 'ante') {
    return anteOptions.value
  }
  return field.options
}

const renderedSections = computed(() =>
  nlhSections.map((section) =>
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

const clampBuyinRangeOnce = (): void => {
  const clamp = (value: number) =>
    Math.min(buyinBbRange.maxBb, Math.max(buyinBbRange.minBb, Math.floor(value)))
  const nextMin = clamp(formState.buyin_range[0])
  const nextMax = clamp(formState.buyin_range[1])
  const minRate = Math.min(nextMin, nextMax)
  const maxRate = Math.max(nextMin, nextMax)
  formState.buyin_range = [minRate, maxRate]
  formState.min_rate = minRate
  formState.max_rate = maxRate
}

clampBuyinRangeOnce()

watch(
  () => route.query,
  () => {
    syncRouteParamsToFormState()
  },
  { immediate: true },
)

// 从模板编辑跳转时，通过 history.state.room_config 携带服务端数据
onMounted(() => {
  const roomConfig = (window.history.state as Record<string, unknown> | null)?.room_config
  if (roomConfig && typeof roomConfig === 'object') {
    const parsed = parseRoomConfigToFormState(roomConfig as Record<string, unknown>)
    Object.assign(formState, parsed)
    // 路由 query 的 game_play_type / bombpot 优先级更高，重新同步一次
    syncRouteParamsToFormState()
    clampBuyinRangeOnce()
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
    const res = await postOrgRoomClubCreateApi({
      name: formState.name || '自定义牌桌',
      room_config: buildRoomConfigPayload(formState),
    })
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
    <template v-if="activeTab === 'quick'">
      <QuickCreateView />
    </template>

    <!-- Pro params tab -->
    <div v-if="activeTab === 'pro'" class="create-table-form">
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
            <div class="fee-value-wrap">
              <img :src="icDiamondBalance" class="fee-diamond-icon" alt="" />
              <span class="fee-original">{{ createFee.originalPrice.toLocaleString() }}</span>
            </div>
          </div>
          <div class="fee-row fee-row--current">
            <img :src="icDiamondBalance" class="fee-diamond-icon" alt="" />
            <span class="fee-current mr-4">{{ createFee.currentPrice.toLocaleString() }}</span>
            <FieldTip :tip="`123\n456\n789`" />
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
.create-table-page {
  position: relative;
  min-height: 100dvh;
  padding: 0 0 calc(1.6rem + env(safe-area-inset-bottom));
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
  overflow-x: hidden;
  overflow-y: auto;
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

  &--active {
    font-weight: 700;
    color: #fff;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: #fff;
      border-radius: 1px;
    }
  }
}
.create-table-form {
  overflow-y: auto;
  padding-bottom: 0.5rem;
  height: calc(100dvh - 1.4rem - env(safe-area-inset-bottom));
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
}
.detail-form__section {
  margin: 0.38rem 0.35rem 0;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.43rem;
  backdrop-filter: blur(0.16px);
  padding: 0.13rem 0.5rem;
}

.table-name__label {
  font-size: 0.37rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;
  white-space: nowrap;
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

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
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

  &:last-of-type {
    border-bottom: none;
  }
}

/* Bottom action bar */
.bottom-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0.27rem 0.35rem 0;
  padding-bottom: calc(0.4rem + env(safe-area-inset-bottom));
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
}

.fee-current {
  font-size: 0.34rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
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
  }

  &--create {
    background: linear-gradient(157deg, #05e7ae 0%, #027a5c 100%);
    color: #fff;
    box-shadow: inset 1px 1px 0px 0px rgba(242, 242, 242, 0.8),
      inset -1px -1px 0px 0px rgba(255, 255, 255, 0.5);
  }
}
</style>
