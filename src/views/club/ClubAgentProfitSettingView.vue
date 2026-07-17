<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import NumericKeypad from '@/components/KeyBoard/NumericKeypad.vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import { getMemberRouteContext } from './clubMemberRoute'
import imgAvatar from '@/assets/images/default_avatar.png'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import { postOrgClubAgentRatioInfoApi, postOrgClubAgentRatioUpdateApi } from '@/api/org'
import type { OrgClubAgentRatioInfoInfo } from '@/api/models/org'
import { t } from '@/i18n'

const route = useRoute()
const context = computed(() => getMemberRouteContext(route))
const focusedKey = ref('service')

const backgroundStyle = computed(() => ({
  '--profit-bg-dark': `url(${mainBgUrl})`,
  '--profit-bg-light': `url(${mainBgLightUrl})`,
}))

const form = ref([
  { key: 'service', label: t('UIGuildMemberProxyRevenueSettings_Text1'), value: '0' },
  { key: 'insurance', label: t('UIGuildMemberProxyRevenueSettings_Text2'), value: '0' },
  { key: 'mtt', label: 'MTT' + t('UIGuildClubManagerProportionTip'), value: '0' },
  { key: 'cowboy', label: t('UIClub_Text'), value: '0' },
])

const loading = ref(false)
const submitting = ref(false)
const keypadField = ref('')
const keypadOpen = ref(false)

const userId = computed(() => {
  const raw = context.value.memberId
  return Number(raw) || 0
})

function getRatioValue(ratio?: number): string {
  if (ratio === undefined || ratio === null) return '0'
  // ratio is stored as basis points: 150 means 150/1000 = 15% = 0.15
  // Display as percentage with 1 decimal: 15.0
  const percent = ratio / 10
  return String(Math.round(percent * 10) / 10)
}

function setRatioValue(key: string, raw: string): void {
  const item = form.value.find((i) => i.key === key)
  if (!item) return
  // Allow digits and one decimal point, max 1 decimal place
  const cleaned = raw
    .replace(/[^0-9.]/g, '')
    .split('.')
    .slice(0, 2)
    .join('.')
  const parts = cleaned.split('.')
  if (parts[1] && parts[1].length > 1) {
    item.value = parts[0] + '.' + parts[1].slice(0, 1)
  } else {
    item.value = cleaned || '0'
  }
  // Auto-convert to 100 if exceeds
  const num = Number(item.value)
  if (num > 100) {
    item.value = '100'
  }
}

async function fetchRatioInfo(): Promise<void> {
  const uid = userId.value
  if (!uid || uid <= 0) return
  loading.value = true
  try {
    const res = await postOrgClubAgentRatioInfoApi({ user_id: uid })
    const info = res.data.info as OrgClubAgentRatioInfoInfo | undefined
    if (info) {
      setRatioValue('service', getRatioValue(info.agent_service_ratio))
      setRatioValue('insurance', getRatioValue(info.agent_insur_ratio))
      setRatioValue('mtt', getRatioValue(info.agent_mtt_ratio))
      setRatioValue('cowboy', getRatioValue(info.agent_cowboy_ratio))
    }
  } catch (e) {
    console.error('Failed to fetch agent ratio info:', e)
  } finally {
    loading.value = false
  }
}

function openKeypad(key: string): void {
  focusedKey.value = key
  keypadField.value = key
  keypadOpen.value = true
}

function onKeypadClose(): void {
  keypadOpen.value = false
}

function onKeypadSubmit(value: number): void {
  keypadOpen.value = false
  const item = form.value.find((i) => i.key === keypadField.value)
  if (!item) return
  // Cap at 100
  const cappedValue = value > 100 ? 100 : value
  // Convert percentage to basis points: 15.0 -> 150
  item.value = String(cappedValue)
}

function onKeypadKeyPress(payload: {
  key: string
  action: 'digit' | 'clear' | 'backspace' | 'decimal'
  value: string
  accepted: boolean
}): void {
  const item = form.value.find((i) => i.key === keypadField.value)
  if (!item) return
  if (payload.action === 'clear') {
    item.value = '0'
  } else if (payload.action === 'backspace') {
    item.value = item.value.length > 1 ? item.value.slice(0, -1) : '0'
  } else if (payload.action === 'decimal') {
    // Decimal point input - NumericKeypad handles the logic
  }
}

async function submitRatios(): Promise<void> {
  const uid = userId.value
  if (!uid || uid <= 0) return
  submitting.value = true
  try {
    const payload = {
      user_id: uid,
      agent_service_ratio: Number(form.value.find((i) => i.key === 'service')?.value || 0) * 10,
      agent_insur_ratio: Number(form.value.find((i) => i.key === 'insurance')?.value || 0) * 10,
      agent_mtt_ratio: Number(form.value.find((i) => i.key === 'mtt')?.value || 0) * 10,
      agent_cowboy_ratio: Number(form.value.find((i) => i.key === 'cowboy')?.value || 0) * 10,
    }
    await postOrgClubAgentRatioUpdateApi(payload)
    // Optionally show success toast or navigate back
  } catch (e) {
    console.error('Failed to update agent ratio:', e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchRatioInfo()
})
</script>

<template>
  <div class="page-shell profit-bg" :style="backgroundStyle">
    <HeaderBack :title="loading ? '加载中...' : '代理收益设置'" />

    <section class="glass profile-card">
      <img :src="imgAvatar" :alt="context.name" />
      <div>
        <p class="name">{{ context.name || 'Donny' }}</p>
        <p class="uid"><span>ID</span>{{ context.uid }}</p>
      </div>
    </section>

    <section class="form-list">
      <article v-for="item in form" :key="item.key" class="form-item">
        <p>{{ item.label }}:</p>
        <button
          type="button"
          class="glass value"
          :class="{ 'value--focused': focusedKey === item.key }"
          @click="openKeypad(item.key)"
        >
          <span class="value__number">{{ item.value }}</span>
          <span class="value__unit">%</span>
        </button>
      </article>
    </section>

    <div class="form-actions">
      <PrimaryButton
        :text="loading ? '加载中...' : '保存'"
        :disabled="loading || submitting"
        class="save-btn"
        @click="submitRatios"
      />
    </div>

    <NumericKeypad
      :open="keypadOpen"
      :show-input-area="false"
      :show-cancel="false"
      :allow-decimal="true"
      :max="100"
      :min="0"
      :max-length="4"
      :initial-value="form.find((i) => i.key === keypadField)?.value || '0'"
      :title="form.find((i) => i.key === keypadField)?.label || t('UIMineUSDTSheet_CustomTip')"
      confirm-text="加入"
      @close="onKeypadClose"
      @submit="onKeypadSubmit"
      @key-press="onKeypadKeyPress"
    />
  </div>
</template>

<style scoped lang="scss">
@use 'sass:math';
@use '@/styles/mixins' as *;

@function figma-rem($px) {
  @return math.div($px, 37.5) * 1rem;
}

.profit-bg {
  height: 100dvh;
  background-size: cover;
  background-image: var(--profit-bg-dark);

  @include theme-light {
    color: #111;
    background-image: var(--profit-bg-light);
  }
}

.glass {
  border-radius: figma-rem(39.59);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.16rem);

  @include theme-light {
    background: #fff;
  }
}

.profile-card {
  min-height: figma-rem(105);
  padding: figma-rem(4.751) figma-rem(21.854);
  display: flex;
  align-items: center;
  gap: figma-rem(14.253);
  flex-shrink: 0;
}

.profile-card img {
  width: figma-rem(65.92);
  height: figma-rem(66.316);
  border-radius: 50%;
  object-fit: cover;
}

.name {
  margin: 0;
  color: #f9f9f9;
  font-size: figma-rem(18.44);
  font-weight: 700;

  @include theme-light {
    color: #111;
  }
}

.uid {
  margin: figma-rem(7.601) 0 0;
  display: flex;
  gap: figma-rem(2.457);
  color: #fff;
  font-size: figma-rem(9.623);

  @include theme-light {
    color: rgba(17, 17, 17, 0.72);
  }
}

.uid span {
  border-radius: figma-rem(4.212);
  padding: figma-rem(2.808) figma-rem(4.914);
  background: rgba(255, 255, 255, 0.34);

  @include theme-light {
    color: #fff;
    background: rgba(79, 79, 79, 0.4);
  }
}

.form-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: figma-rem(24);
  padding: figma-rem(20) figma-rem(16);
  overflow-y: auto;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: figma-rem(8);
}

.form-item p {
  margin: 0;
  color: #fff;
  font-size: figma-rem(15);

  @include theme-light {
    color: #111;
  }
}

.value {
  border: 1px solid rgba(249, 249, 249, 0.5);
  min-height: figma-rem(62.394);
  padding: 0 figma-rem(20.775);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: figma-rem(14.569);
  cursor: pointer;
  transition: border-color 0.2s;

  @include theme-light {
    border-color: transparent;
    color: rgba(17, 17, 17, 0.76);
    background: #dadada;
  }

  &--focused {
    border-color: #04d19d;
    box-shadow: 0 0 0 2px rgba(4, 209, 157, 0.3);

    @include theme-light {
      border-color: var(--c-brand);
      box-shadow: 0 0 0 2px rgba(var(--c-brand-rgb), 0.18);
    }
  }

  &__number {
    font-weight: 600;
    color: #fff;
    font-size: figma-rem(18);

    @include theme-light {
      color: #111;
    }
  }

  &__unit {
    color: rgba(255, 255, 255, 0.6);
    font-size: figma-rem(14);

    @include theme-light {
      color: rgba(17, 17, 17, 0.7);
    }
  }
}

.form-actions {
  flex-shrink: 0;
  padding: figma-rem(16) figma-rem(16) figma-rem(24);
  display: flex;
  gap: figma-rem(12);
}

.save-btn {
  flex: 1;
}
</style>
