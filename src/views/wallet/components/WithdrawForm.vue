<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import icSupportService from '@/assets/images/ic_support_service.png'
import icBankcard from '@/assets/images/ic_bankcard.png'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import WithdrawConfirmModal from '@/views/wallet/components/WithdrawConfirmModal.vue'
import { t } from '@/i18n'
import { postOnlineWithdrawTypeListApi } from '@/api/config'
import { postTiquGoldApi } from '@/api/order'
import { postPaymentInfoListApi } from '@/api/pay'
import type { OnlineWithdrawTypeItem } from '@/api/models/config'
import type { PaymentInfo } from '@/api/models/pay'
import { useUserInfoStore } from '@/stores/userInfo'
import { useWalletStore } from '@/stores/wallet'

const emit = defineEmits<{
  'open-cs-chat': [orderData: Record<string, unknown>]
}>()

const router = useRouter()
const userInfoStore = useUserInfoStore()
const walletStore = useWalletStore()

// ─── i18n helper: returns fallback when key not translated ────────────────────
function tx(key: string, fallback: string): string {
  const val = t(key)
  return val !== key ? val : fallback
}

const availableUc = computed(() => userInfoStore.userInfo?.user?.gold ?? 0)

type ChannelId = 'bankcard' | 'customercare'
const activeChannel = ref<ChannelId>('bankcard')
const isCustomerCare = computed(() => activeChannel.value === 'customercare')

const withdrawTypes = ref<OnlineWithdrawTypeItem[]>([])
const selectedWithdrawType = ref<OnlineWithdrawTypeItem | null>(null)

const withdrawAmount = ref('')
const withdrawing = ref(false)

const paymentInfoList = ref<PaymentInfo[]>([])
const loadingPaymentInfo = ref(false)
const selectedPaymentAccount = ref<PaymentInfo | null>(null)

const showWithdrawConfirmModal = ref(false)
const withdrawConfirmAmount = ref(0)

// ─── Computed ────────────────────────────────────────────────────────────────
const filteredWithdrawTypes = computed<OnlineWithdrawTypeItem[]>(() => {
  const ch = activeChannel.value
  return withdrawTypes.value.filter((wt) => {
    if (ch === 'bankcard') {
      return wt.account_type === 1 && wt.status === 1 && wt.action_type === 1
    }
    if (ch === 'customercare') {
      const nameMatch =
        wt.name?.toLowerCase().includes('客服') ||
        wt.name?.toLowerCase().includes('customer') ||
        wt.name?.toLowerCase().includes('care') ||
        wt.name?.toLowerCase().includes('service')
      return nameMatch || wt.account_type === 0
    }
    return false
  })
})

const handlingFeeRate = 0.05
const parsedAmount = computed(() => {
  const v = parseFloat(withdrawAmount.value.replace(',', '.').trim())
  return Number.isFinite(v) && v > 0 ? v : 0
})

const calculatedWithdrawAmountAfterFee = computed(() => {
  if (!parsedAmount.value) return 0
  return parsedAmount.value * (1 - handlingFeeRate)
})

const withdrawRange = computed(() => {
  const wt = selectedWithdrawType.value
  return {
    min: wt?.user_withdraw_min ? wt.user_withdraw_min / 100 : 0,
    max: wt?.user_withdraw_max ? wt.user_withdraw_max / 100 : Infinity,
  }
})

const amountPlaceholder = computed(() => {
  const { min, max } = withdrawRange.value
  if (min > 0 && Number.isFinite(max)) {
    return `${tx('Wallet_WithdrawRange', '联盟币回收限')} ${min.toLocaleString()}-${max.toLocaleString()}`
  }
  if (min > 0) return `${tx('Wallet_MinWithdraw', '最低')} ${min.toLocaleString()}`
  return tx('Wallet_InputPlaceholder', '输入需要回收的UC数量')
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
  return accountNo.length > 4 ? `**** **** **** ${accountNo.slice(-4)}` : accountNo
}

function withdrawClubPayload(): Record<string, number> {
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
  const club = assertClub()
  if (!club) return
  try {
    const res = await postOnlineWithdrawTypeListApi({ club_id: club.club_id })
    if (res.code === 0 && res.data?.list) {
      withdrawTypes.value = res.data.list
        .filter((wt) => wt.status === 1)
        .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
    }
  } catch (e) {
    console.error('fetchWithdrawTypes failed', e)
  }
  applyChannel('bankcard')
}

async function fetchPaymentInfo(): Promise<void> {
  loadingPaymentInfo.value = true
  paymentInfoList.value = []
  selectedPaymentAccount.value = null
  try {
    const userId =
      userInfoStore.userInfo?.user?.p_u_id ??
      Number(localStorage.getItem('user_p_u_id') ?? '0')
    const res = await postPaymentInfoListApi({ user_id: userId, account_type: 1, limit: 50, offset: 0 })
    if (res.code === 0 && res.data?.list) {
      const seen = new Set<string>()
      const deduped: PaymentInfo[] = []
      for (const item of res.data.list) {
        const key = `${item.pix_name}|${item.account_no}|${item.bank_name}|${item.account_type}`
        if (!seen.has(key)) { seen.add(key); deduped.push(item) }
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

function selectWithdrawType(wt: OnlineWithdrawTypeItem): void {
  if (isCustomerCare.value) {
    activeChannel.value = 'bankcard'
    void fetchPaymentInfo()
  }
  selectedWithdrawType.value = wt
}

function applyChannel(ch: ChannelId): void {
  activeChannel.value = ch
  selectedWithdrawType.value = filteredWithdrawTypes.value[0] ?? null
  withdrawAmount.value = ''
  selectedPaymentAccount.value = null
  if (ch === 'bankcard') void fetchPaymentInfo()
}

function handleWithdraw(): void {
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
      if (isCustomerCare.value || res.data?.api_type === 3) {
        emit('open-cs-chat', {
          pay_type_name: wt.name ?? tx('Wallet_CustomerService', '客服'),
          pay_price: payPrice,
          order: { gold_num: amountCents, pay_price: payPrice, order_no: '' },
        })
      } else {
        showToast(tx('Wallet_SubmitWithdraw', '提款申请已提交'))
        await walletStore.refreshPendingCsOrder()
      }
    } else {
      showToast((res.message ?? tx('Wallet_SubmitWithdraw', '提款失败')) || '提款失败')
    }
  } catch (e) {
    console.error('confirmWithdraw failed', e)
    showToast(tx('Wallet_SubmitWithdraw', '提款失败，请重试'))
  } finally {
    withdrawing.value = false
  }
}

onMounted(() => {
  if (userInfoStore.clubList.length > 0 || userInfoStore.currentClub) {
    void fetchWithdrawTypes()
  } else {
    const stop = watch(
      () => userInfoStore.clubList.length,
      (len) => { if (len > 0) { stop(); void fetchWithdrawTypes() } },
    )
  }
})

watch(filteredWithdrawTypes, (list) => {
  if (!list.includes(selectedWithdrawType.value!)) {
    selectedWithdrawType.value = list[0] ?? null
  }
})
</script>

<template>
  <div class="wf">

    <div class="wf__card">

      <div class="wf__acct-header">
        <span class="wf__acct-title">{{ tx('Wallet_SelectAccount', '请选择收款账户') }}</span>
        <button v-if="!isCustomerCare" class="wf__add-card-btn" type="button" @click="router.push('/wallet/add-bank-card')">
          {{ tx('Wallet_AddCard', '添加银行卡') }}
        </button>
      </div>

      <div class="wf__type-scroll">
        <div
          v-for="wt in filteredWithdrawTypes"
          :key="wt.id"
          class="wf__type-card"
          :class="{ 'wf__type-card--active': !isCustomerCare && selectedWithdrawType?.id === wt.id }"
          @click="selectWithdrawType(wt)"
        >
          <img class="wf__type-card-icon" :src="icBankcard" alt="" />
          <div class="wf__type-card-label">
            <div class="wf__type-card-text">
              <span class="wf__type-card-name">{{ wt.name || tx('Wallet_BankCard', '银行卡') }}</span>
              <span class="wf__type-card-sub">{{ tx('Wallet_Payment', '支付') }}</span>
            </div>
          </div>
        </div>

        <div
          class="wf__type-card"
          :class="{ 'wf__type-card--active': isCustomerCare }"
          @click="applyChannel('customercare')"
        >
          <img :src="icSupportService" alt="" class="wf__type-card-icon" />
          <div class="wf__type-card-label">
            <div class="wf__type-card-text">
              <span class="wf__type-card-name">{{ tx('Wallet_CsWithdraw', '联系客服') }}</span>
            </div>
          </div>
        </div>
      </div>

      <template v-if="!isCustomerCare">
        <div v-if="loadingPaymentInfo" class="wf__acct-loading">
          {{ tx('Wallet_Loading', '加载中…') }}
        </div>
        <template v-else-if="paymentInfoList.length > 0">
          <div
            v-for="info in paymentInfoList"
            :key="info.id"
            class="wf__acct-row"
            :class="{ 'wf__acct-row--active': selectedPaymentAccount?.id === info.id }"
            @click="selectedPaymentAccount = info"
          >
            <img :src="icBankcard" alt="" class="wf__acct-icon" />
            <div class="wf__acct-details">
              <div class="wf__acct-top">
                <span class="wf__acct-name">{{ info.pix_name || info.bank_name || '—' }}</span>
                <span class="wf__acct-last4">{{ info.account_no?.slice(-4) || '—' }}</span>
              </div>
              <div class="wf__acct-no-pill">{{ formatAccountNumber(info.account_no) }}</div>
            </div>
          </div>
        </template>
        <div v-else class="wf__acct-empty">
          {{ tx('Wallet_NoCardBound', '暂无绑定银行卡') }}
        </div>
      </template>

    </div>

    <div class="wf__card wf__amount-card">
      <div class="wf__amount-input-wrap">
        <input
          v-model="withdrawAmount"
          type="text"
          inputmode="decimal"
          class="wf__amount-input"
          :placeholder="amountPlaceholder"
        />
      </div>

      <div class="wf__amount-display">
        <span class="wf__amount-value" :class="{ 'wf__amount-value--active': parsedAmount > 0 }">
          {{ parsedAmount > 0 ? calculatedWithdrawAmountAfterFee.toFixed(2) : '—' }}
        </span>
      </div>

      <div class="wf__amount-footer" :class="{ 'wf__amount-footer--visible': parsedAmount > 0 }">
        <span class="wf__amount-entered">{{ parsedAmount > 0 ? parsedAmount.toLocaleString() : '' }}</span>
        <span class="wf__amount-fee-tag">{{ tx('Wallet_ServiceFee', '手续费') }}：{{ (handlingFeeRate * 100).toFixed(0) }}%</span>
      </div>
    </div>

    <div class="wf__balance-hint">
      <span>{{ tx('Wallet_AvailableBalance', '可回收UC') }}：{{ (availableUc / 100).toLocaleString() }}</span>
    </div>

    <PrimaryButton
      :text="isCustomerCare ? tx('Wallet_ContactCs', '联系客服') : tx('Wallet_SubmitWithdraw', '立即提现')"
      :disabled="!canWithdraw || withdrawing"
      @click="handleWithdraw"
    />
  </div>

  <WithdrawConfirmModal
    :show="showWithdrawConfirmModal"
    :original-amount="withdrawConfirmAmount"
    :calculated-amount="withdrawConfirmAmount * (1 - handlingFeeRate)"
    @close="showWithdrawConfirmModal = false"
    @confirm="confirmWithdraw"
  />
</template>

<style scoped lang="scss">
.wf {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
  width: 100%;
}

// ── Glass card ────────────────────────────────────────────────────────────────
.wf__card:first-child {
  margin-top: -20px;
}

.wf__card {
  position: relative;
  padding: 0.55rem 0.42rem;
  border: 0.016rem solid rgba(242, 242, 242, 0.7);
  border-radius: 0.94rem;
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
  overflow: hidden;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    backdrop-filter: blur(16.6px);
    -webkit-backdrop-filter: blur(16.6px);
    background: linear-gradient(107.6deg, rgba(249,249,249,0.18) 12.3%, rgba(249,249,249,0.24) 33.3%, rgba(147,147,147,0.3) 85.1%);
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
      inset 0 0 8.6px rgba(0,0,0,1),
      inset 3.4px 2.6px 8.6px rgba(0,0,0,0.1),
      inset 0 0 36.1px rgba(242,242,242,0.3);
    z-index: 0;
  }

  & > * { position: relative; z-index: 1; }
}

// ── Account card ──────────────────────────────────────────────────────────────
.wf__acct-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.2rem;
}

.wf__acct-title {
  font-family: var(--wallet-font-cn);
  font-size: 0.28rem;
  font-weight: 500;
  color: #fff;
}

.wf__add-card-btn {
  flex-shrink: 0;
  height: 0.62rem;
  padding: 0 0.32rem;
  border: none;
  border-radius: 0.72rem;
  background: #fff;
  color: #262525;
  font-family: var(--wallet-font-cn);
  font-size: 0.3rem;
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.85; }
}

// Type cards horizontal scroll
.wf__type-scroll {
  display: flex;
  gap: 0.3rem;
  overflow-x: auto;
  padding-bottom: 0.04rem;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.wf__type-card {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.wf__type-card-icon {
  width: 1.5rem;
  height: 1.5rem;
  position: relative;
  z-index: 2;
  pointer-events: none;
}

.wf__type-card-label {
  margin-top: -0.45rem;
  width: 1.64rem;
  height: 1.16rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.23rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 0.12rem;
  position: relative;
  z-index: 1;
  box-sizing: border-box;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 0.004rem;
    background: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(153,153,153,1) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .wf__type-card--active & {
    border-radius: 0.26rem;
    background: #EE3955;

    &::before { display: none; }
  }
}

.wf__type-card-text {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.05rem;
  width: 100%;
  padding: 0 0.1rem;
  overflow: hidden;
}

.wf__type-card-name {
  font-family: var(--wallet-font-cn);
  font-size: 0.22rem;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
}


.wf__type-card-sub {
  font-family: var(--wallet-font-cn);
  font-size: 0.19rem;
  color: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
  white-space: nowrap;
}

// Account rows
.wf__acct-loading {
  text-align: center;
  font-family: var(--wallet-font-cn);
  font-size: 0.3rem;
  color: rgba(255,255,255,0.5);
  padding: 0.24rem 0;
}

.wf__acct-row {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  padding: 0.12rem 0.08rem;
  border-radius: 0.4rem;
  transition: background 0.15s;
  &--active { background: transparent; }
}

.wf__acct-icon {
  flex-shrink: 0;
  width: 1.12rem;
  height: 1.12rem;
  object-fit: contain;
}

.wf__acct-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.wf__acct-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.wf__acct-name {
  font-family: var(--wallet-font-cn);
  font-size: 0.3rem;
  font-weight: 400;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wf__acct-last4 {
  font-family: var(--wallet-font-num);
  font-size: 0.3rem;
  color: rgba(255,255,255,0.8);
  white-space: nowrap;
}

.wf__acct-no-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 0.62rem;
  padding: 0 0.25rem;
  background: #2d2b2b;
  border-radius: 0.72rem;
  font-family: var(--wallet-font-num);
  font-size: 0.3rem;
  color: #fff;
  white-space: nowrap;
}

.wf__acct-empty {
  text-align: center;
  font-family: var(--wallet-font-cn);
  font-size: 0.3rem;
  color: rgba(255,255,255,0.45);
  padding: 0.16rem 0;
}



// ── Amount card ───────────────────────────────────────────────────────────────
.wf__amount-card {
  gap: 0;
  padding: 0;
  overflow: hidden;
}

.wf__amount-input-wrap {
  padding: 0 0.42rem;
  margin-top: 0.55rem;
}

.wf__amount-input {
  width: 100%;
  height: 1.2rem;
  padding: 0 0.5rem;
  background: rgba(232,232,232,0.15);
  border: none;
  border-radius: 0.75rem;
  outline: none;
  font-family: var(--wallet-font-cn);
  font-size: 0.38rem;
  color: #fff;
  text-align: center;
  box-sizing: border-box;

  &::placeholder {
    font-size: 0.28rem;
    color: rgba(249,249,249,0.45);
    font-weight: 400;
  }
}

.wf__amount-display {
  margin-top: 0.32rem;
  width: 100%;
  min-height: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(170.7deg, rgb(54,54,54) 7.9%, rgb(23,23,23) 80.2%);
}

.wf__amount-value {
  font-family: var(--wallet-font-num);
  font-size: 0.72rem;
  color: rgba(255,255,255,0.2);
  transition: color 0.2s;
  &--active { color: #e80000; }
}

.wf__amount-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 1.2rem;
  padding: 0 0.5rem;
  margin: 0.2rem 0.42rem 0.55rem;
  border-radius: 0.75rem;
  background: rgba(255,255,255,0.04);
  opacity: 0;
  transition: opacity 0.2s;
  &--visible { opacity: 1; background: rgba(255,255,255,0.9); }
}

.wf__amount-entered {
  font-family: var(--wallet-font-num);
  font-size: 0.36rem;
  color: #000;
}

.wf__amount-fee-tag {
  font-family: var(--wallet-font-cn);
  font-size: 0.28rem;
  color: #000;
}

// Balance hint
.wf__balance-hint {
  text-align: center;
  font-family: var(--wallet-font-cn);
  font-size: 0.26rem;
  color: rgba(255,255,255,0.5);
  span { line-height: 1.4; }
}
</style>
