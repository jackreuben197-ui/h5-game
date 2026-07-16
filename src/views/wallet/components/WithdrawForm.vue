<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { showToast } from 'vant'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import { t } from '@/i18n'
import { postOnlineWithdrawTypeListApi, postOnlineWithdrawDescriptionApi } from '@/api/config'
import { postTiquGoldApi } from '@/api/order'
import type { OnlineWithdrawTypeItem, OnlineWithdrawTypeListData } from '@/api/models/config'
import { useUserInfoStore } from '@/stores/userInfo'
import { useWalletStore } from '@/stores/wallet'

const emit = defineEmits<{
  'open-cs-chat': [orderData: Record<string, unknown>]
}>()

const userInfoStore = useUserInfoStore()
const walletStore = useWalletStore()
const availableUc = computed(() => userInfoStore.userInfo?.user?.gold ?? 0)

const savedAddresses = ref<OnlineWithdrawTypeItem[]>([])
const selectedAddress = ref<OnlineWithdrawTypeItem | null>(null)
/** Канал вывода (withdraw type id); не сбрасываем при правке текста адреса */
const activeChannelId = ref<number | null>(null)
const addressInput = ref('')
const amount = ref('')
const submitting = ref(false)

/** Карточка «备注»: только user_description выбранной строки из списка (без черновика шита). */
const mainWithdrawAccountShown = computed(() =>
  withdrawUserDescription(selectedAddress.value),
)

const sheetOpen = ref(false)
const walletListExpanded = ref(false)

const canSubmit = computed(() => addressInput.value.trim().length > 0 && !submitting.value)

/** Сохранённый адрес игрока: user_description / user_decription (см. API). */
function withdrawUserDescription(item: OnlineWithdrawTypeItem | null | undefined): string {
  if (!item) return ''
  const ex = item as Record<string, unknown>
  for (const key of ['user_description', 'user_decription'] as const) {
    const v = ex[key]
    if (typeof v === 'string' && v.trim() !== '') return v.trim()
  }
  return ''
}

/** После online_withdraw_description список иногда без user_description — подставляем только что сохранённый текст. */
function applyLocalUserDescription(item: OnlineWithdrawTypeItem, text: string): void {
  ;(item as Record<string, unknown>).user_description = text.trim()
}

/** В dropdown показываем только каналы, где уже есть user_description. */
const withdrawPickerList = computed(() =>
  savedAddresses.value.filter((a) => withdrawUserDescription(a).length > 0),
)

function addrLineLabel(addr: OnlineWithdrawTypeItem): string {
  const saved = withdrawUserDescription(addr)
  if (saved) return saved
  const name = (addr.name ?? '').trim()
  if (name) return name
  const desc = (addr.description ?? '').trim()
  if (desc) return desc
  return 'USDT'
}

/** Строка списка / триггер: при непустом user_description из API — показываем только его. */
function withdrawPickerRowLabel(addr: OnlineWithdrawTypeItem): string {
  const saved = withdrawUserDescription(addr)
  if (saved) return saved
  return addrLineLabel(addr)
}

/** Без выбора — USDT; с выбором и сохранённым адресом — только user_description из API. */
const sheetPaymentLabel = computed(() => {
  if (!selectedAddress.value) return 'USDT'
  const saved = withdrawUserDescription(selectedAddress.value)
  if (saved) return saved
  return addrLineLabel(selectedAddress.value)
})

function withdrawClubPayload(): Record<string, number> {
  const club = userInfoStore.currentClub ?? userInfoStore.clubList[0]
  const clubId = club?.club_id !== undefined ? Number(club.club_id) : NaN
  return Number.isFinite(clubId) && clubId > 0 ? { club_id: clubId } : {}
}

function assertClubPayload(): { club_id: number } | null {
  const p = withdrawClubPayload()
  if (!('club_id' in p) || !(Number(p.club_id) > 0)) {
    showToast(t('error2005'))
    return null
  }
  return { club_id: Number(p.club_id) }
}

/** Выбранный канал или первый из type_list как дефолт при «только ввод счёта без выбора строки». */
function resolveWithdrawTypeId(): number {
  const pick =
    activeChannelId.value ??
    selectedAddress.value?.id ??
    savedAddresses.value[0]?.id
  return pick !== undefined && pick >= 1 ? pick : 1
}

function parseWithdrawGoldCents(raw: string): number | null {
  const s = raw.replace(/\s/g, '').replace(',', '.').trim()
  if (s === '') return null
  const uc = Number(s)
  if (!Number.isFinite(uc) || uc <= 0) return null
  const cents = Math.round(uc * 100)
  return cents >= 1 ? cents : null
}

onMounted(() => {
  // club_id может ещё не загрузиться — грузим когда он появится
  if (userInfoStore.clubList.length > 0 || userInfoStore.currentClub) {
    loadSavedAddresses()
  } else {
    const stop = watch(
      () => userInfoStore.clubList.length,
      (len) => { if (len > 0) { stop(); loadSavedAddresses() } },
      { immediate: false },
    )
  }
})

async function loadSavedAddresses(): Promise<void> {
  const base = withdrawClubPayload()
  if (!('club_id' in base)) {
    savedAddresses.value = []
    return
  }
  const res = await postOnlineWithdrawTypeListApi(base)
  if (res.code !== 0) return
  const raw = res.data as OnlineWithdrawTypeListData | null | undefined
  const list = raw?.list ?? []
  savedAddresses.value = list
  if (list.length === 0) {
    selectedAddress.value = null
    activeChannelId.value = null
    return
  }

  const keepId = activeChannelId.value ?? selectedAddress.value?.id ?? null
  if (keepId != null) {
    const match = list.find((a) => a.id === keepId)
    if (match) {
      selectedAddress.value = match
      activeChannelId.value = match.id ?? null
      const saved = withdrawUserDescription(match)
      const cur = addressInput.value.trim()
      if (cur === '' || cur === saved) {
        addressInput.value = saved
      }
      return
    }
  }

  selectedAddress.value = null
  activeChannelId.value = null
}

async function openSheet(): Promise<void> {
  walletListExpanded.value = false
  sheetOpen.value = true
  await loadSavedAddresses()
}

function selectAddress(addr: OnlineWithdrawTypeItem): void {
  selectedAddress.value = addr
  activeChannelId.value = addr.id ?? null
  addressInput.value = withdrawUserDescription(addr)
  walletListExpanded.value = false
}

async function onSheetSave(): Promise<void> {
  const club = assertClubPayload()
  if (!club) return
  const addrTrim = addressInput.value.trim()
  if (!addrTrim) {
    showToast(t('Wallet_AddressPlaceholder'))
    return
  }
  const typeId = resolveWithdrawTypeId()
  activeChannelId.value = typeId
  const saveRes = await postOnlineWithdrawDescriptionApi({
    ...club,
    withdraw_type_id: typeId,
    description: addrTrim,
  })
  if (saveRes.code !== 0) return
  await loadSavedAddresses()
  const row = savedAddresses.value.find((a) => a.id === typeId)
  if (!row) {
    showToast(t('Wallet_AddressVerifyFail'))
    return
  }
  if (withdrawUserDescription(row) !== addrTrim) {
    applyLocalUserDescription(row, addrTrim)
  }
  selectedAddress.value = row
  showToast(t('Wallet_AddressSaved'))
  walletListExpanded.value = false
  sheetOpen.value = false
}

async function handleSubmit(): Promise<void> {
  if (!canSubmit.value) return
  const club = assertClubPayload()
  if (!club) return
  const goldCents = parseWithdrawGoldCents(amount.value)
  if (goldCents === null) {
    showToast(t('Wallet_AddItem4'))
    return
  }
  submitting.value = true
  try {
    const typeId = resolveWithdrawTypeId()
    activeChannelId.value = typeId
    const addrTrim = addressInput.value.trim()
    if (!addrTrim) {
      showToast(t('Wallet_AddressPlaceholder'))
      return
    }

    let channel =
      savedAddresses.value.find((a) => a.id === typeId) ?? selectedAddress.value ?? null
    if (!channel && savedAddresses.value.length > 0) {
      channel = savedAddresses.value[0]
      activeChannelId.value = channel.id ?? null
    }
    if (!channel?.id) {
      showToast(t('Wallet_AddressPlaceholder'))
      return
    }

    const savedTxt = withdrawUserDescription(channel)
    if (addrTrim !== savedTxt) {
      const saveRes = await postOnlineWithdrawDescriptionApi({
        ...club,
        withdraw_type_id: typeId,
        description: addrTrim,
      })
      if (saveRes.code !== 0) return
      await loadSavedAddresses()
      channel = savedAddresses.value.find((a) => a.id === typeId) ?? null
      if (!channel) {
        showToast(t('Wallet_AddressVerifyFail'))
        return
      }
      if (withdrawUserDescription(channel) !== addrTrim) {
        applyLocalUserDescription(channel, addrTrim)
      }
    }

    const payId = channel.id

    const rate = Number(channel.rate)
    const feeRate = channel.fee_rate ?? 0
    const feeType = channel.fee_type ?? 0
    const chExtra = channel as Record<string, unknown>
    const discount = typeof chExtra.discount === 'number' ? chExtra.discount : 0

    if (!Number.isFinite(rate) || rate <= 0) {
      showToast(t('Wallet_Rate'))
      return
    }

    const priceData = walletStore.calculateUsdtPrice(goldCents, rate, feeRate, feeType, discount)

    const withdrawRes = await postTiquGoldApi({
      ...withdrawClubPayload(),
      amount: goldCents,
      gold_type: 1,
      pay_id: payId,
      pay_price: priceData.apiPayPrice,
      description: addrTrim,
    })

    if (withdrawRes.code !== 0) {
      showToast(withdrawRes.message ?? t('Wallet_SubmitWithdraw'))
      return
    }

    showToast(t('Wallet_SubmitWithdraw'))
    amount.value = ''
    
    // Refresh pending orders to show/update the bell icon for withdrawal
    await walletStore.refreshPendingCsOrder()

    // type 3 = 手动/撮合 — открываем чат с поддержкой
    // api_type из ответа не надёжен (может быть 0), поэтому смотрим на тип канала
    const needsChat = channel.type === 3 || withdrawRes.data?.api_type === 3
    if (needsChat) {
      const orderData: Record<string, unknown> = {
        pay_type_name: channel.name ?? 'USDT',
        pay_price: priceData.apiPayPrice,
        order: {
          gold_num: goldCents,
          pay_price: priceData.apiPayPrice,
          order_no: (withdrawRes.data as Record<string, unknown>).order_no ?? '',
        },
      }
      emit('open-cs-chat', orderData)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="wf">
    <!-- Address card -->
    <div class="wf__card">
      <div class="wf__field">
        <div class="wf__label">{{ $txt('Wallet_RecipientLabel') }}</div>
        <div class="wf__row">
          <div class="wf__input">
            <span class="wf__input-native wf__input-native--static">USDT</span>
          </div>
          <button type="button" class="wf__pill" @click="openSheet">
            <span>{{ $txt('Wallet_GoEdit') }}</span>
            <AppSvgIcon name="round-arrow-right" class="wf__pill-icon" />
          </button>
        </div>
      </div>

      <div class="wf__field">
        <div class="wf__label">{{ $txt('Wallet_RemarkLabel') }}</div>
        <div
          class="wf__input wf__remark-opener"
          role="button"
          tabindex="0"
          @click="openSheet"
          @keydown.enter.prevent="openSheet"
        >
          <input
            readonly
            tabindex="-1"
            type="text"
            class="wf__input-native"
            :value="mainWithdrawAccountShown"
            :placeholder="$txt('Wallet_RemarkPlaceholder')"
          />
        </div>
      </div>
    </div>

    <!-- Amount card -->
    <div class="wf__card">
      <div class="wf__balance">
        <span class="wf__balance-label">{{ t('Wallet_AvailableUc', String(availableUc)) }}</span>
      </div>
      <div class="wf__input">
        <input
          v-model="amount"
          type="text"
          inputmode="numeric"
          class="wf__input-native wf__input-native--center"
          :placeholder="$txt('Wallet_InputPlaceholder')"
        />
      </div>
      <div class="wf__rate">
        <template v-if="selectedAddress?.rate">
          {{ $txt('Wallet_RateWithValue', selectedAddress.rate) }}
        </template>
        <template v-else>
          {{ $txt('Wallet_Rate') }}
        </template>
      </div>
    </div>

    <PrimaryButton
      :text="$txt('Wallet_SubmitWithdraw')"
      :disabled="!canSubmit"
      @click="handleSubmit"
    />
  </div>

  <!-- Saved addresses sheet -->
  <Teleport to="body">
    <Transition name="wf-sheet">
      <div
        v-if="sheetOpen"
        class="wf__overlay"
        @click.self="sheetOpen = false"
      >
        <div
          class="wf__sheet wf__sheet--fig"
        >
          <div class="wf__sheet-fig-title">{{ $txt('Wallet_Records') }}</div>

          <!-- 收款名称 + dropdown -->
          <div class="wf__fig-stack">
            <p class="wf__fig-field-label">{{ $txt('Wallet_OrderRecvName') }}</p>
            <div
              class="wf__fig-picker-shell"
              :class="{ 'wf__fig-picker-shell--open': walletListExpanded }"
            >
              <button
                type="button"
                class="wf__fig-dropdown wf__fig-dropdown--in-shell"
                :class="{ 'wf__fig-dropdown--open': walletListExpanded }"
                @click="walletListExpanded = !walletListExpanded"
              >
                <span class="wf__fig-dropdown-value">{{ sheetPaymentLabel }}</span>
                <span class="wf__fig-dropdown-chevron" aria-hidden="true">
                  <AppSvgIcon name="round-chevron-down" class="wf__fig-chevron-svg" />
                </span>
              </button>

              <Transition name="wf-expand">
                <div v-show="walletListExpanded" class="wf__fig-picker-body">
                  <div class="wf__addr-panel">
                    <template v-if="withdrawPickerList.length > 0">
                      <button
                        v-for="addr in withdrawPickerList"
                        :key="addr.id"
                        type="button"
                        class="wf__addr-row"
                        :class="{ 'wf__addr-row--active': selectedAddress?.id === addr.id }"
                        @click="selectAddress(addr)"
                      >
                        <span class="wf__addr-row-text">{{ withdrawPickerRowLabel(addr) }}</span>
                        <span
                          v-if="selectedAddress?.id === addr.id"
                          class="wf__addr-row-check"
                          aria-hidden="true"
                        />
                      </button>
                    </template>
                    <div v-else class="wf__addr-panel-empty t-caption">
                      {{ $txt('Wallet_OrdersEmpty') }}
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- 备注信息 -->
          <div class="wf__fig-stack">
            <p class="wf__fig-field-label">{{ $txt('Wallet_RemarkLabel') }}</p>
            <div class="wf__fig-remark">
              <input
                v-model="addressInput"
                type="text"
                class="wf__fig-remark-input"
                :placeholder="$txt('Wallet_WithdrawAccountHint')"
              />
            </div>
          </div>

          <button
            type="button"
            class="wf__fig-save"
            @click="onSheetSave"
          >
            {{ $txt('Save') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.wf {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
  width: 100%;
}

.wf__card {
  position: relative;
  padding: 0.55rem 0.42rem;
  background: rgba(0, 0, 0, 0.01);
  backdrop-filter: blur(16.6px);
  -webkit-backdrop-filter: blur(16.6px);
  border: 0.18px solid rgba(255, 255, 255, 0.3);
  border-radius: 1rem;
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  overflow: hidden;
  z-index: 1;

  @include theme-light {
    background: #fff;
    border-color: rgba(242, 242, 242, 0.7);
    box-shadow:
      3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25),
      inset 3.4px 2.6px 8.6px rgba(0, 0, 0, 0.1),
      inset 0 0 36px 6px rgba(242, 242, 242, 0.3);
  }
}

.wf__card::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(16.6px);
  -webkit-backdrop-filter: blur(16.6px);
  background-image: linear-gradient(
    110.6deg,
    rgba(249, 249, 249, 0.18) 12%,
    rgba(249, 249, 249, 0.24) 33%,
    rgba(147, 147, 147, 0.3) 85%
  );
  mix-blend-mode: hard-light;
  pointer-events: none;
  border-radius: inherit;
  z-index: 0;

  @include theme-light {
    background: #fff;
    mix-blend-mode: hard-light;
  }
}

.wf__card > * {
  position: relative;
  z-index: 1;
}

.wf__card:first-child {
  margin-top: -20px;
}

.wf__field {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.wf__label {
  font-family: var(--wallet-font-cn);
  font-weight: 400;
  font-size: 0.285rem;
  color: #f9f9f9;
  padding-left: 0.1rem;

  @include theme-light {
    color: #222;
  }
}

.wf__row {
  display: flex;
  gap: 0.13rem;
  align-items: center;
}

.wf__input {
  flex: 1;
  min-width: 0;
  background: rgba(0, 0, 0, 0.26);
  border-radius: 0.6rem;
  padding: 0.36rem 0.28rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 1.2rem;

  @include theme-light {
    background: rgba(134, 134, 134, 0.12);
  }
}

.wf__input-native {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.4rem;
  color: #fff;
  text-align: center;

  @include theme-light {
    color: #222;
  }
}

.wf__input-native::placeholder {
  color: rgba(255, 255, 255, 0.65);

  @include theme-light {
    color: rgba(34, 34, 34, 0.45);
  }
}

.wf__input-native--static {
  display: flex;
  align-items: center;
  justify-content: center;
}

.wf__remark-opener {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.92;
  }
}

.wf__remark-opener .wf__input-native[readonly] {
  pointer-events: none;
  cursor: inherit;
}

.wf__pill {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.19rem 0.19rem 0.19rem 0.33rem;
  background: rgba(255, 255, 255, 0.2);
  border: 0.4px solid rgba(242, 242, 242, 0.4);
  border-radius: 1.37rem;
  box-shadow: 0.8px 1px 1.6px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;

  @include theme-light {
    background: rgba(134, 134, 134, 0.12);
    border-color: rgba(153, 153, 153, 0.25);
    box-shadow: none;
  }
}

.wf__pill span {
  font-family: var(--wallet-font-num);
  font-weight: 510;
  font-size: 0.32rem;
  color: #fff;
  line-height: 1.4;

  @include theme-light {
    color: #222;
  }
}

.wf__pill-icon {
  width: 0.38rem;
  height: 0.38rem;
  color: var(--c-brand);
}

.wf__balance {
  display: flex;
  justify-content: center;
  padding: 0.26rem 0.4rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.8rem;

  @include theme-light {
    background: rgba(134, 134, 134, 0.12);
  }
}

.wf__balance-label {
  font-family: var(--wallet-font-cn);
  font-weight: 600;
  font-size: 0.415rem;
  color: #fff;
  line-height: 1.4;

  @include theme-light {
    color: #222;
  }
}

.wf__input-native--center {
  text-align: center;
}

.wf__rate {
  text-align: center;
  font-family: var(--wallet-font-cn);
  font-weight: 300;
  font-size: 0.29rem;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.2;

  @include theme-light {
    color: rgba(34, 34, 34, 0.7);
  }
}

/* Sheet overlay */
.wf__overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-image: url('@/assets/images/wallet/bg_sharp.webp');

  @include theme-light {
    background-color: #f3f4f6;
    background-image: url('@/assets/images/main_bg_light.png');
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    backdrop-filter: blur(34px);
    -webkit-backdrop-filter: blur(34px);
    background: rgba(12, 12, 12, 0.60);

    @include theme-light {
      background: rgba(12, 12, 12, 0.4);
    }
  }
}

.wf__sheet {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 0.32rem 0.455rem calc(env(safe-area-inset-bottom) + 0.64rem);
  border-radius: 0.96rem 0.96rem 0 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
  overflow: hidden;
  background-image: url('@/assets/images/wallet/bg_sharp.webp');

  @include theme-light {
    background-color: #fff;
    background-image: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(0, 0, 0, 0.70);
    backdrop-filter: blur(7.6px);
    -webkit-backdrop-filter: blur(7.6px);
    pointer-events: none;
    z-index: 0;

    @include theme-light {
      background: #fff;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 0.027rem 0 0;
    background: linear-gradient(180deg, rgba(242, 242, 242, 0.40) 0%, rgba(255, 255, 255, 0) 40%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 2;
  }

  & > * {
    position: relative;
    z-index: 3;
  }
}

.wf__sheet--fig {
  padding: 0.413rem 0.532rem calc(env(safe-area-inset-bottom) + 0.92rem);
  gap: 0.499rem;
  border-radius: 0.844rem 0.844rem 0 0;
  border: 0.024rem solid rgba(242, 242, 242, 0.4);
  border-bottom: none;
  box-shadow:
    inset 0.030rem 0.030rem 0.06rem rgba(242, 242, 242, 0.2),
    0.086rem 0.107rem 0.172rem rgba(0, 0, 0, 0.25);

  @include theme-light {
    border-color: rgba(0, 0, 0, 0.12);
    box-shadow: 0 0.107rem 0.24rem rgba(0, 0, 0, 0.12);
  }
}

.wf__sheet-fig-title {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.515rem;
  color: #fff;
  text-align: center;
  line-height: 1.4;

  @include theme-light {
    color: #222;
  }
}

.wf__fig-stack {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.121rem;
  width: 100%;
}

.wf__fig-field-label {
  margin: 0;
  padding: 0 0.02rem;
  font-family: var(--wallet-font-cn);
  font-weight: 400;
  font-size: 0.274rem;
  line-height: 1.2;
  color: #f9f9f9;
  width: 100%;

  @include theme-light {
    color: #222;
  }
}

.wf__fig-picker-shell {
  width: 100%;
  background: rgba(255, 255, 255, 0.2);
  border: 0.026rem solid rgba(255, 255, 255, 0.14);
  border-radius: 0.589rem;
  overflow: hidden;

  @include theme-light {
    background: rgba(134, 134, 134, 0.12);
    border-color: rgba(153, 153, 153, 0.25);
  }
}

.wf__fig-dropdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.2rem;
  width: 100%;
  padding: 0.34rem 0.257rem;
  background: transparent;
  border: none;
  border-radius: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.wf__fig-dropdown--in-shell.wf__fig-dropdown--open {
  border-bottom: 0.026rem solid rgba(255, 255, 255, 0.14);

  @include theme-light {
    border-bottom-color: rgba(0, 0, 0, 0.12);
  }
}

.wf__fig-picker-body {
  width: 100%;
}

.wf__fig-dropdown-value {
  flex: 1;
  min-width: 0;
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.401rem;
  color: #fff;
  line-height: 1.4;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @include theme-light {
    color: #222;
  }
}

.wf__fig-dropdown-chevron {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.50rem;
  height: 0.50rem;
}

.wf__fig-chevron-svg {
  display: block;
  width: 0.50rem;
  height: 0.50rem;
  transition: transform 0.2s ease;
  color: var(--c-brand);
}

.wf__fig-dropdown--open .wf__fig-chevron-svg {
  transform: rotate(180deg);
}

.wf__addr-panel {
  width: 100%;
  max-height: 3.2rem;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
}

.wf__addr-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.2rem;
  width: 100%;
  margin: 0;
  padding: 0.2rem 0.28rem;
  background: transparent;
  border: none;
  border-bottom: 0.026rem solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  text-align: left;
  color: inherit;
  -webkit-tap-highlight-color: transparent;

  &:last-of-type {
    border-bottom: none;
  }

  @include theme-light {
    border-bottom-color: rgba(0, 0, 0, 0.1);
  }

  &:active {
    background: rgba(255, 255, 255, 0.06);

    @include theme-light {
      background: rgba(0, 0, 0, 0.06);
    }
  }

  &--active {
    background: rgba(var(--c-brand-rgb), 0.1);
  }
}

.wf__addr-row-text {
  flex: 1;
  min-width: 0;
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.32rem;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @include theme-light {
    color: rgba(34, 34, 34, 0.95);
  }
}

.wf__addr-row-check {
  flex-shrink: 0;
  width: 0.28rem;
  height: 0.28rem;
  border-radius: 50%;
  background: var(--c-brand);
}

.wf__addr-panel-empty {
  padding: 0.42rem 0.28rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.52);

  @include theme-light {
    color: rgba(34, 34, 34, 0.52);
  }
}

.wf__fig-remark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.34rem 0.257rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.589rem;

  @include theme-light {
    background: rgba(134, 134, 134, 0.12);
  }
}

.wf__fig-remark-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.401rem;
  color: #fff;
  line-height: 1.4;
  text-align: center;

  @include theme-light {
    color: #222;
  }
}

.wf__fig-remark-input::placeholder {
  color: rgba(255, 255, 255, 0.65);

  @include theme-light {
    color: rgba(34, 34, 34, 0.45);
  }
}

.wf__fig-save {
  width: 100%;
  margin-top: 0.053rem;
  min-height: 1.436rem;
  padding: 0.127rem 0.32rem;
  border: 0.013rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.056rem;
  cursor: pointer;
  font-family: var(--wallet-font-num);
  font-weight: 500;
  font-size: 0.4rem;
  line-height: 1.2;
  color: #fff;
  text-align: center;
  background-image: linear-gradient(168.37deg, #05e7ae 7.55%, #02795c 71.92%);
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  @include theme-light {
    background: var(--c-brand);
    border-color: transparent;
  }
}

/* Transitions */
.wf-sheet-enter-active,
.wf-sheet-leave-active {
  transition: opacity 0.25s ease;

  .wf__sheet {
    transition: transform 0.25s ease;
  }
}

.wf-sheet-enter-from,
.wf-sheet-leave-to {
  opacity: 0;

  .wf__sheet {
    transform: translateY(100%);
  }
}

.wf-expand-enter-active,
.wf-expand-leave-active {
  transition: opacity 0.2s ease, max-height 0.25s ease;
  overflow: hidden;
  max-height: 10rem;
}

.wf-expand-enter-from,
.wf-expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
