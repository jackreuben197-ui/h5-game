<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import icSupportService from '@/assets/images/ic_support_service.png'
import icBankcard from '@/assets/images/ic_bankcard.png'
import walletPng from '@/assets/icons/walletpng.png'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import WithdrawConfirmModal from '@/views/wallet/components/WithdrawConfirmModal.vue'
import GameDialog from '@/components/Dialog/GameDialog.vue'
import { t, tColon } from '@/i18n'
import { postOnlineWithdrawTypeListApi } from '@/api/config'
import { postTiquGoldApi } from '@/api/order'
import { postPaymentInfoListApi, postPaymentInfoDeleteApi } from '@/api/pay'
import type { OnlineWithdrawTypeItem } from '@/api/models/config'
import type { PaymentInfo } from '@/api/models/pay'
import { useUserInfoStore } from '@/stores/userInfo'
import { useWalletStore } from '@/stores/wallet'

const props = defineProps<{
  availableUc?: number
  clubId?: number
  balance?: number
  preview?: boolean
}>()

const emit = defineEmits<{
  'open-cs-chat': [orderData: Record<string, unknown>]
  'require-auth': [action?: () => void | Promise<void>]
  withdrawn: []
}>()

const router = useRouter()
const route = useRoute()
const userInfoStore = useUserInfoStore()
const walletStore = useWalletStore()

// ─── i18n helper: returns fallback when key not translated ────────────────────
function tx(key: string, fallback: string): string {
  const val = t(key)
  return val !== key ? val : fallback
}

const availableUc = computed(() => props.availableUc ?? 0)

type ChannelId = 'bankcard' | 'wallet' | 'customercare'
const activeChannel = ref<ChannelId>('bankcard')
const isCustomerCare = computed(() => activeChannel.value === 'customercare')
const isWallet = computed(() => activeChannel.value === 'wallet')

const paymentChannels: { id: ChannelId; image: string; label: string; key: string }[] = [
  { id: 'bankcard', image: icBankcard, label: 'Bank Card', key: 'Wallet_BankCard' },
  { id: 'wallet', image: walletPng, label: 'Wallet', key: 'Wallet_Title' },
  { id: 'customercare', image: icSupportService, label: 'CS Withdraw', key: 'Wallet_CsWithdraw' },
]

const withdrawTypes = ref<OnlineWithdrawTypeItem[]>([])
const loadingWithdrawTypes = ref(false)
const selectedWithdrawType = ref<OnlineWithdrawTypeItem | null>(null)

const withdrawAmount = ref('')
const withdrawing = ref(false)

const paymentInfoList = ref<PaymentInfo[]>([])
const loadingPaymentInfo = ref(false)
const selectedPaymentAccount = ref<PaymentInfo | null>(null)

const showWithdrawConfirmModal = ref(false)
const withdrawConfirmAmount = ref(0)

// ─── Computed ────────────────────────────────────────────────────────────────
function isBankcardWithdrawType(wt: OnlineWithdrawTypeItem): boolean {
  return wt.account_type === 1 && wt.action_type === 1
}

const bankWithdrawTypes = computed<OnlineWithdrawTypeItem[]>(() =>
  withdrawTypes.value.filter((wt) => wt.status === 1 && isBankcardWithdrawType(wt)),
)

const walletWithdrawTypes = computed<OnlineWithdrawTypeItem[]>(() =>
  withdrawTypes.value.filter(
    (wt) => wt.status === 1 && (wt.account_type === 6 || wt.account_type === 0),
  ),
)

const csWithdrawTypes = computed<OnlineWithdrawTypeItem[]>(() =>
  withdrawTypes.value.filter((wt) => wt.status === 1 && wt.account_type === 0),
)

const filteredWithdrawTypes = computed<OnlineWithdrawTypeItem[]>(() => {
  if (activeChannel.value === 'bankcard') return bankWithdrawTypes.value
  if (activeChannel.value === 'wallet')
    return walletWithdrawTypes.value.length > 0
      ? walletWithdrawTypes.value
      : csWithdrawTypes.value
  return csWithdrawTypes.value
})

const availablePaymentChannels = computed(() =>
  paymentChannels.filter((ch) => {
    if (ch.id === 'bankcard') return bankWithdrawTypes.value.length > 0
    if (ch.id === 'wallet') return walletWithdrawTypes.value.length > 0
    if (ch.id === 'customercare') return csWithdrawTypes.value.length > 0
    return true
  }),
)

const handlingFeeRate = computed(() => {
  return selectedWithdrawType.value?.fee_rate ?? 0
})
const parsedAmount = computed(() => {
  const v = parseFloat(withdrawAmount.value.replace(',', '.').trim())
  return Number.isFinite(v) && v > 0 ? v : 0
})

const calculatedWithdrawAmountAfterFee = computed(() => {
  if (!parsedAmount.value) return 0
  return parsedAmount.value * (1 - handlingFeeRate.value)
})

const withdrawRange = computed(() => {
  const wt = selectedWithdrawType.value
  return {
    min: wt?.user_withdraw_min ? wt.user_withdraw_min / 100 : 0,
    max: wt?.user_withdraw_max ? wt.user_withdraw_max / 100 : Infinity,
  }
})

const canWithdraw = computed(() => {
  if (!selectedWithdrawType.value) return false
  const amt = parsedAmount.value
  if (amt <= 0) return false
  if (amt > availableUc.value / 100) return false
  if (withdrawRange.value.min > 0 && amt < withdrawRange.value.min) return false
  if (Number.isFinite(withdrawRange.value.max) && amt > withdrawRange.value.max) return false
  if (!isCustomerCare.value && !selectedPaymentAccount.value) return false
  return true
})

function formatAccountNumber(accountNo: string | undefined): string {
  if (!accountNo) return '—'
  if (accountNo.length > 5) {
    return `*****${accountNo.slice(-5)}`
  }
  return accountNo
}

function withdrawClubPayload(): Record<string, number> {
  const directed = Number(props.clubId)
  if (Number.isFinite(directed) && directed > 0) {
    return { club_id: directed }
  }
  const club = userInfoStore.currentClub ?? userInfoStore.clubList[0]
  const clubId = club?.club_id !== undefined ? Number(club.club_id) : NaN
  return Number.isFinite(clubId) && clubId > 0 ? { club_id: clubId } : {}
}

function assertClub(): { club_id: number } | null {
  const p = withdrawClubPayload()
  if (!('club_id' in p)) {
    showToast(t('error2005'))
    return null
  }
  return { club_id: Number(p.club_id) }
}

// ─── API ─────────────────────────────────────────────────────────────────────
async function fetchWithdrawTypes(): Promise<void> {
  if (props.preview) {
    withdrawTypes.value = []
    return
  }
  const club = assertClub()
  if (!club) return
  loadingWithdrawTypes.value = true
  try {
    const res = await postOnlineWithdrawTypeListApi({ club_id: club.club_id })
    if (res.code === 0 && res.data?.list) {
      withdrawTypes.value = res.data.list
        .filter((wt) => wt.status === 1)
        .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
    } else {
      withdrawTypes.value = []
    }
  } catch (e) {
    console.error('fetchWithdrawTypes failed', e)
    withdrawTypes.value = []
  } finally {
    loadingWithdrawTypes.value = false
  }

  const requested = route.query.channel
  const requestedChannel: ChannelId | null =
    requested === 'wallet' || requested === 'bankcard' || requested === 'customercare'
      ? requested
      : null

  if (requestedChannel && availablePaymentChannels.value.some((c) => c.id === requestedChannel)) {
    applyChannel(requestedChannel)
  } else if (bankWithdrawTypes.value.length > 0) {
    applyChannel('bankcard')
  } else if (walletWithdrawTypes.value.length > 0) {
    applyChannel('wallet')
  } else if (csWithdrawTypes.value.length > 0) {
    applyChannel('customercare')
  } else if (availablePaymentChannels.value.length > 0) {
    applyChannel(availablePaymentChannels.value[0].id)
  } else {
    selectedWithdrawType.value = null
  }

  if (requestedChannel) {
    const query = { ...route.query }
    delete query.channel
    void router.replace({ query })
  }
}

async function fetchPaymentInfo(): Promise<void> {
  if (props.preview) {
    return
  }
  loadingPaymentInfo.value = true
  paymentInfoList.value = []
  selectedPaymentAccount.value = null
  try {
    const userId =
      userInfoStore.userInfo?.user?.p_u_id ?? Number(localStorage.getItem('user_p_u_id') ?? '0')
    const acctType = isWallet.value ? 6 : 1
    const res = await postPaymentInfoListApi({
      user_id: userId,
      account_type: acctType,
      limit: 50,
      offset: 0,
    })
    if (res.code === 0 && res.data?.list) {
      const seen = new Set<string>()
      const deduped: PaymentInfo[] = []
      for (const item of res.data.list) {
        if (item.status === 2) continue
        const key = `${item.pix_name}|${item.account_no}|${item.bank_name}|${item.account_type}`
        if (!seen.has(key)) {
          seen.add(key)
          deduped.push(item)
        }
      }
      paymentInfoList.value = deduped
      if (deduped.length > 0) selectedPaymentAccount.value = deduped[0]
    }
  } catch (e) {
    console.error('fetchPaymentInfo failed', e)
  } finally {
    loadingPaymentInfo.value = false
  }
}

const deleteCardTarget = ref<PaymentInfo | null>(null)
const showDeleteCardConfirm = ref(false)
const deletingCard = ref(false)

const deleteCardDetail = computed(() => {
  const info = deleteCardTarget.value
  if (!info) return ''
  const name = info.pix_name || info.real_name || info.bank_name || ''
  return `${name} ${formatAccountNumber(info.account_no)}`.trim()
})

function askDeleteCard(info: PaymentInfo): void {
  if (props.preview) {
    emit('require-auth')
    return
  }
  deleteCardTarget.value = info
  showDeleteCardConfirm.value = true
}

const FULL_SWIPE_RATIO = 0.6
let swipeStartX = 0
let swipeDeltaX = 0
let swipeRowWidth = 0

function onSwipeStart(e: TouchEvent): void {
  if (props.preview) return
  swipeStartX = e.touches[0]?.clientX ?? 0
  swipeDeltaX = 0
  swipeRowWidth = (e.currentTarget as HTMLElement | null)?.offsetWidth ?? 0
}

function onSwipeMove(e: TouchEvent): void {
  if (props.preview) return
  swipeDeltaX = (e.touches[0]?.clientX ?? 0) - swipeStartX
}

function onSwipeEnd(info: PaymentInfo): void {
  if (props.preview) return
  const passed = swipeDeltaX <= -(swipeRowWidth || 300) * FULL_SWIPE_RATIO
  swipeDeltaX = 0
  if (passed) askDeleteCard(info)
}

async function confirmDeleteCard(): Promise<void> {
  const info = deleteCardTarget.value
  if (!info?.id || deletingCard.value) return
  deletingCard.value = true
  try {
    const res = await postPaymentInfoDeleteApi(info.id)
    if (res.code === 0) {
      showDeleteCardConfirm.value = false
      deleteCardTarget.value = null
      showToast(tx('error0', '操作成功'))
      await fetchPaymentInfo()
    }
  } catch {
    showToast(tx('error999', '删除失败'))
  } finally {
    deletingCard.value = false
  }
}

function selectWithdrawType(wt: OnlineWithdrawTypeItem): void {
  selectedWithdrawType.value = wt
}

function applyChannel(ch: ChannelId): void {
  activeChannel.value = ch
  selectedWithdrawType.value = filteredWithdrawTypes.value[0] ?? null
  withdrawAmount.value = ''
  selectedPaymentAccount.value = null
  if (ch === 'bankcard' || ch === 'wallet') void fetchPaymentInfo()
}

function handleWithdraw(): void {
  if (props.preview) {
    emit('require-auth', handleWithdraw)
    return
  }
  if (!canWithdraw.value) return
  withdrawConfirmAmount.value = parsedAmount.value
  showWithdrawConfirmModal.value = true
}

async function confirmWithdraw(): Promise<void> {
  showWithdrawConfirmModal.value = false
  const wt = selectedWithdrawType.value
  if (!wt) return
  const club = assertClub()
  if (!club) return

  const amount = parsedAmount.value
  const amountCents = Math.round(amount * 100)
  const rate = wt.rate ?? 1
  const feeRate = wt.fee_rate ?? 0
  const baseValue = amount * rate
  const fee = baseValue * feeRate
  const payPrice = baseValue - fee
  const legalTender = Math.round(payPrice * 100)
  const paymentTypeId = isCustomerCare.value ? 0 : (selectedPaymentAccount.value?.id ?? 0)

  withdrawing.value = true
  try {
    const res = await postTiquGoldApi({
      amount: amountCents,
      gold_type: 1,
      pay_id: wt.id,
      pay_price: payPrice,
      legal_tender: legalTender,
      payment_type_id: paymentTypeId,
      ...withdrawClubPayload(),
    })

    if (res.code === 0) {
      withdrawAmount.value = ''
      selectedPaymentAccount.value = paymentInfoList.value[0] ?? null
      emit('withdrawn')
      if (isCustomerCare.value || res.data?.api_type === 3) {
        emit('open-cs-chat', {
          orderType: 'withdraw',
          order_no: res.data?.order_no ?? '',
          gold_num: amountCents,
          pay_price: payPrice,
          pay_type_name: wt.name ?? tx('Wallet_CustomerService', '客服'),
          create_time: new Date().toISOString(),
          account_type: 0,
        })
      } else {
        showToast(tx('Wallet_SubmitWithdrawSuccess', '提款申请已提交'))
        await walletStore.refreshPendingCsOrder(props.clubId)
      }
    } else {
      const isSuccessMsg = res.message?.toLowerCase() === 'success'
      const msg = isSuccessMsg
        ? tx('Wallet_SubmitWithdrawSuccess', '提款申请已提交')
        : ((res.message ? t(res.message) || res.message : null) ?? tx('Wallet_SubmitWithdrawFailed', '提款失败'))
      showToast(msg)
    }
  } catch (e) {
    console.error('confirmWithdraw failed', e)
    showToast(tx('Wallet_SubmitWithdrawFailed', '提款失败，请重试'))
  } finally {
    withdrawing.value = false
  }
}

watch(
  [() => withdrawClubPayload().club_id, () => props.preview],
  ([clubId, preview]) => {
    if (preview) {
      withdrawTypes.value = []
      return
    }
    if (Number(clubId) > 0) void fetchWithdrawTypes()
  },
  { immediate: true },
)

watch(filteredWithdrawTypes, (list) => {
  if (!list.includes(selectedWithdrawType.value!)) {
    selectedWithdrawType.value = list[0] ?? null
  }
})
</script>

<template>
  <div class="wf">
    <!-- Card 1: Channel Tabs, Sub-type Grid & Bound Accounts -->
    <div class="wf__card">
      <div v-if="loadingWithdrawTypes" class="wf__acct-loading">
        {{ tx('Wallet_Loading', 'Loading…') }}
      </div>

      <template v-else-if="withdrawTypes.length > 0">
        <!-- Header with Tabs and Add Account Button -->
        <div class="wf__top-bar">
          <div class="wf__tabs" :class="{ 'wf__tabs--single': availablePaymentChannels.length === 1 }">
            <button
              v-for="ch in availablePaymentChannels"
              :key="ch.id"
              type="button"
              class="wf__tab"
              :class="{ 'wf__tab--active': activeChannel === ch.id }"
              @click="applyChannel(ch.id)"
            >
              {{ tx(ch.key, ch.label) }}
            </button>
          </div>
          <button
            v-if="!isCustomerCare"
            class="wf__add-btn"
            type="button"
            @click="
              router.push(isWallet ? '/wallet/add-wallet-address' : '/wallet/add-bank-card')
            "
          >
            {{ tx('Wallet_AddAccount', 'Add Account') }}
          </button>
        </div>

        <!-- 4-Column Sub-type Grid -->
        <div v-if="filteredWithdrawTypes.length > 0" class="wf__grid">
          <div
            v-for="wt in filteredWithdrawTypes"
            :key="wt.id"
            class="wf__grid-item"
            :class="{ 'wf__grid-item--active': selectedWithdrawType?.id === wt.id }"
            @click="selectWithdrawType(wt)"
          >
            <img
              :src="
                wt.image ||
                (isWallet || wt.account_type === 6
                  ? walletPng
                  : isCustomerCare
                    ? icSupportService
                    : icBankcard)
              "
              alt=""
              class="wf__grid-icon"
            />
            <span v-fit-text="{ maxLines: 1, minScale: 0.75 }" class="wf__grid-name">{{
              wt.name || (isWallet ? 'USDT' : tx('Wallet_BankCard', 'Bank Card'))
            }}</span>
            <div v-if="selectedWithdrawType?.id === wt.id" class="wf__grid-check">
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 3L3 5L7 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Bound Accounts List -->
        <template v-if="!isCustomerCare">
          <div v-if="loadingPaymentInfo" class="wf__acct-loading">
            {{ tx('Wallet_Loading', 'Loading…') }}
          </div>
          <template v-else-if="paymentInfoList.length > 0">
            <div class="wf__acct-list">
              <van-swipe-cell
                v-for="info in paymentInfoList"
                :key="info.id"
                class="wf__acct-swipe"
                :disabled="preview"
                @touchstart.passive="onSwipeStart"
                @touchmove.passive="onSwipeMove"
                @touchend="onSwipeEnd(info)"
              >
                <div
                  class="wf__acct-card"
                  :class="{ 'wf__acct-card--active': selectedPaymentAccount?.id === info.id }"
                  @click="selectedPaymentAccount = info"
                >
                  <img
                    :src="info.account_type === 6 || isWallet ? walletPng : icBankcard"
                    alt=""
                    class="wf__acct-card-icon"
                  />
                  <div class="wf__acct-card-info">
                    <div class="wf__acct-card-header">
                      <span
                        v-if="info.pix_name || info.real_name || info.name || info.account_name"
                        class="wf__acct-card-name"
                      >{{
                        info.pix_name || info.real_name || info.name || info.account_name
                      }}</span>
                      <span v-if="info.bank_name" class="wf__acct-card-badge">{{ info.bank_name }}</span>
                    </div>
                    <div class="wf__acct-card-sub">
                      {{ tColon(tx('Wallet_ReceivingAccount', 'Receiving Account')) }}{{ formatAccountNumber(info.account_no) }}
                    </div>
                  </div>
                </div>
                <template #right>
                  <button type="button" class="wf__acct-delete-btn" @click="askDeleteCard(info)">
                    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 3.5H13M5 3.5V2C5 1.44772 5.44772 1 6 1H8C8.55228 1 9 1.44772 9 2V3.5M11.5 3.5V13.5C11.5 14.0523 11.0523 14.5 10.5 14.5H3.5C2.94772 14.5 2.5 14.0523 2.5 13.5V3.5H11.5Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>{{ tx('UIClub_DeleteSomeone', 'Delete') }}</span>
                  </button>
                </template>
              </van-swipe-cell>
            </div>
          </template>
          <div v-else class="wf__acct-empty">
            {{ tx('Wallet_NoAccountBound', '暂无账户') }}
          </div>
        </template>
      </template>

      <div v-else class="wf__acct-empty">
        {{ tx('Wallet_NoWithdrawMethod', 'No withdrawal method available') }}
      </div>
    </div>

    <!-- Card 2: Withdrawal Amount -->
    <div v-if="withdrawTypes.length > 0" class="wf__card wf__amount-card">
      <div class="wf__amount-title">
        {{ tx('Wallet_WithdrawalAmount', 'Withdrawal Amount') }}
      </div>

      <div class="wf__amount-input-box">
        <input
          v-model="withdrawAmount"
          type="text"
          inputmode="decimal"
          class="wf__amount-input"
          :placeholder="tx('Wallet_EnterWithdrawalAmount', 'Enter withdrawal amount')"
        />
      </div>

      <div class="wf__amount-info">
        <span class="wf__amount-fee">
          {{ tColon(tx('Wallet_Fee', 'Fee')) }}{{ (handlingFeeRate * 100).toFixed(0) }}%
        </span>
        <span class="wf__amount-received">
          {{ tColon(tx('Wallet_EstimatedAmountReceived', 'Estimated Amount Received')) }}{{ parsedAmount > 0 ? calculatedWithdrawAmountAfterFee.toFixed(2) : '-' }}
        </span>
      </div>
    </div>

    <!-- Submit Action Button -->
    <div class="wf__cta-wrapper">
      <PrimaryButton
        :text="
          isCustomerCare
            ? tx('Wallet_ContactCs', 'Contact CS')
            : tx('Wallet_Submit', 'Submit')
        "
        :disabled="!canWithdraw || withdrawing"
        class="wf__cta"
        @click="handleWithdraw"
      />
    </div>
  </div>

  <WithdrawConfirmModal
    :show="showWithdrawConfirmModal"
    :original-amount="withdrawConfirmAmount"
    :calculated-amount="withdrawConfirmAmount * (1 - handlingFeeRate)"
    @close="showWithdrawConfirmModal = false"
    @confirm="confirmWithdraw"
  />

  <GameDialog
    v-model:show="showDeleteCardConfirm"
    :title="tx('UIClub_ConfirmDelete', 'Confirm Delete')"
    :show-cancel-button="true"
    :cancel-button-text="tx('Wallet_Cancel', 'Cancel')"
    :confirm-button-text="tx('Wallet_Confirm', 'Confirm')"
    :confirm-button-disabled="deletingCard"
    @confirm="confirmDeleteCard"
    @cancel="showDeleteCardConfirm = false"
  >
    <div class="wf__delete-card-detail">{{ deleteCardDetail }}</div>
  </GameDialog>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.wf {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  width: 100%;
  padding-bottom: 1.2rem;
}

/* Card 1 & Card 2 Base Glass Styling */
.wf__card:first-child {
  margin-top: -20px;
}

.wf__card {
  position: relative;
  padding: 0.36rem 0.32rem;
  border: 0.016rem solid rgba(242, 242, 242, 0.25);
  border-radius: 0.72rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    background: linear-gradient(
      110deg,
      rgba(255, 255, 255, 0.12) 0%,
      rgba(255, 255, 255, 0.06) 100%
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
      inset 0 0 12px rgba(0, 0, 0, 0.8),
      inset 0 0 24px rgba(255, 255, 255, 0.15);
    z-index: 0;
  }

  & > * {
    position: relative;
    z-index: 1;
  }

  @include theme-light-own {
    border-color: var(--wallet-l-border);
    background: var(--wallet-l-surface);
    box-shadow: 0 0.08rem 0.2rem rgba(70, 79, 88, 0.1);

    &::before {
      background: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      mix-blend-mode: normal;
    }

    &::after {
      box-shadow: none;
    }
  }
}

/* Header Bar: Tabs & Add Button */
.wf__top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.2rem;
  margin-bottom: 0.32rem;
}

.wf__tabs {
  display: inline-flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  padding: 0.05rem;
  border-radius: 999px;
  gap: 0.04rem;

  &--single {
    background: transparent;
    padding: 0;
  }

  @include theme-light-own {
    background: var(--wallet-l-surface-soft);

    &--single {
      background: transparent;
    }
  }
}

.wf__tab {
  height: 0.64rem;
  padding: 0 0.36rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  font-family: var(--wallet-font-cn);
  font-size: 0.29rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;

  &--active {
    background: #ff3b5c;
    color: #ffffff;
    font-weight: 600;
  }

  @include theme-light-own {
    color: var(--wallet-l-text-muted);

    &--active {
      background: #ff3b5c;
      color: #ffffff;
    }
  }
}

.wf__add-btn {
  height: 0.64rem;
  padding: 0 0.36rem;
  border: none;
  border-radius: 999px;
  background: #ffffff;
  color: #111111;
  font-family: var(--wallet-font-cn);
  font-size: 0.28rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.85;
  }

  @include theme-light-own {
    background: var(--wallet-l-accent);
    color: var(--wallet-l-on-accent);
  }
}

/* 4-Column Sub-type Grid */
.wf__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.16rem;
  margin-bottom: 0.28rem;
}

.wf__grid-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.18rem 0.06rem;
  min-height: 1.36rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 0.24rem;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;

  &--active {
    border-color: #ff3b5c;
    background: rgba(255, 59, 92, 0.12);

    .wf__grid-name {
      color: #ffd259;
      font-weight: 600;
    }
  }

  @include theme-light-own {
    background: var(--wallet-l-surface-soft);

    &--active {
      border-color: #ff3b5c;
      background: rgba(255, 59, 92, 0.1);

      .wf__grid-name {
        color: #e69500;
        font-weight: 600;
      }
    }
  }
}

.wf__grid-icon {
  width: 0.72rem;
  height: 0.72rem;
  object-fit: contain;
  margin-bottom: 0.08rem;
  pointer-events: none;
}

.wf__grid-name {
  font-family: var(--wallet-font-cn);
  font-size: 0.38rem;
  font-weight: 500;
  color: #ffffff;
  text-align: center;
  line-height: 1.1;
  white-space: normal;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  width: 100%;
  padding: 0 0.02rem;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }
}

.wf__grid-check {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0.34rem;
  height: 0.34rem;
  background: #ff3b5c;
  border-top-left-radius: 0.16rem;
  border-bottom-right-radius: 0.22rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Bound Accounts List */
.wf__acct-list {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.wf__acct-swipe {
  border-radius: 0.28rem;
  overflow: hidden;
}

.wf__acct-card {
  display: flex;
  align-items: center;
  gap: 0.22rem;
  padding: 0.22rem 0.26rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 0.28rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;

  &--active {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.35);
  }

  @include theme-light-own {
    background: var(--wallet-l-surface-soft);

    &--active {
      background: rgba(5, 194, 151, 0.08);
      border-color: var(--wallet-l-accent);
    }
  }
}

.wf__acct-card-icon {
  width: 0.82rem;
  height: 0.82rem;
  flex-shrink: 0;
  object-fit: contain;
}

.wf__acct-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.wf__acct-card-header {
  display: flex;
  align-items: center;
  gap: 0.16rem;
}

.wf__acct-card-name {
  font-family: var(--wallet-font-cn);
  font-size: 0.32rem;
  font-weight: 600;
  color: #ffffff;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }
}

.wf__acct-card-badge {
  font-family: var(--wallet-font-cn);
  margin-left: auto;
  flex-shrink: 0;
  font-size: 0.26rem;
  font-weight: 600;
  color: #ffd259;
  border: 1px solid rgba(255, 210, 89, 0.6);
  background: rgba(255, 210, 89, 0.16);
  border-radius: 999px;
  padding: 0.04rem 0.2rem;
  white-space: nowrap;

  @include theme-light-own {
    color: #d97706;
    border-color: rgba(217, 119, 6, 0.5);
    background: rgba(217, 119, 6, 0.1);
  }
}

.wf__acct-card-sub {
  font-family: var(--wallet-font-num);
  font-size: 0.29rem;
  font-weight: 500;
  color: #ffffff;
  opacity: 0.95;

  @include theme-light-own {
    color: var(--wallet-l-text-muted);
    opacity: 1;
  }
}

.wf__acct-delete-btn {
  height: 100%;
  margin-left: 0.16rem;
  padding: 0 0.4rem;
  border: none;
  border-radius: 0.28rem;
  background: #ff3b5c;
  color: #ffffff;
  font-family: var(--wallet-font-cn);
  font-size: 0.28rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  white-space: nowrap;
  cursor: pointer;
}

/* Card 2: Withdrawal Amount */
.wf__amount-card {
  padding: 0.36rem 0.32rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.wf__amount-title {
  font-family: var(--wallet-font-cn);
  font-size: 0.32rem;
  font-weight: 600;
  color: #ffffff;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }
}

.wf__amount-input-box {
  width: 100%;
  height: 1.02rem;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 0.24rem;
  padding: 0 0.28rem;
  display: flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);

  @include theme-light-own {
    background: var(--wallet-l-surface-soft);
    border-color: var(--wallet-l-border);
  }
}

.wf__amount-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.32rem;
  color: #ffffff;
  font-family: var(--wallet-font-num);

  &::placeholder {
    color: rgba(255, 255, 255, 0.45);
    font-size: 0.28rem;
    font-family: var(--wallet-font-cn);
  }

  @include theme-light-own {
    color: var(--wallet-l-text);

    &::placeholder {
      color: var(--wallet-l-text-muted);
    }
  }
}

.wf__amount-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--wallet-font-cn);
  font-size: 0.28rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);

  @include theme-light-own {
    color: var(--wallet-l-text-muted);
  }
}

/* Submit Action Button */
.wf__cta-wrapper {
  position: relative;
  width: 100%;
  height: 1.47rem;
  margin-top: 0.36rem;
  z-index: 1;
}

.wf__cta {
  position: relative;
  width: 100% !important;
  height: 100% !important;
  border: 0.02rem solid rgba(249, 249, 249, 0.04) !important;
  border-radius: 1.08rem !important;
  background: rgba(170, 170, 170, 0.1) !important;
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0.0149rem rgba(255, 255, 255, 0.5);
    pointer-events: none;
  }

  :deep(.primary-btn__text) {
    font-size: 0.493rem !important;
    font-weight: 600 !important;
    color: #78e490 !important;
  }

  @include theme-light-own {
    border-color: rgba(242, 242, 242, 0.8) !important;
    background: var(--wallet-l-accent) !important;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;

    &::after {
      box-shadow: none;
    }

    :deep(.primary-btn__text) {
      color: var(--wallet-l-on-accent) !important;
    }
  }
}

.wf__acct-loading,
.wf__acct-empty {
  text-align: center;
  font-family: var(--wallet-font-cn);
  font-size: 0.26rem;
  color: #999999;
  padding: 0.2rem 0;

  @include theme-light-own {
    color: var(--wallet-l-text-muted);
  }
}

.wf__delete-card-detail {
  text-align: center;
  font-family: var(--wallet-font-cn);
  font-size: 0.3rem;
  color: #ffffff;
  word-break: break-all;
}
</style>
