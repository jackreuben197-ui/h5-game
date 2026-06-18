<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { showToast } from 'vant'
import { t } from '@/i18n'
import { useWalletStore } from '@/stores/wallet'
import { useUserInfoStore } from '@/stores/userInfo'
import { postRechargeGoldApi, postOrderUserClubOrderCancelApi } from '@/api/order'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import icCoins from '@/assets/icons/wallet/ic_coins.png'

const props = defineProps<{
  goldCount: number
  rate: number
  feeRate: number
  feeType?: number
  discount?: number
  payId: number
  priceId: number
  initialStep?: number
  initialOrderNo?: string
  initialQrCode?: string
  initialPayAddress?: string
}>()

const emit = defineEmits<{
  close: []
  success: []
  unfinishedOrder: []
}>()

const walletStore = useWalletStore()
const userInfoStore = useUserInfoStore()

const step = ref(props.initialStep || 1) // 1: Input name, 2: Display order/QR code
const userName = ref('')
const loading = ref(false)

const orderNo = ref(props.initialOrderNo || '')
const qrCodeUrl = ref(props.initialQrCode || '')
const payAddress = ref(props.initialPayAddress || '')

const timeLeft = ref(900) // 15-minute countdown (900s)
let timer: number | null = null

const showFullQr = ref(false)

const priceData = computed(() => {
  return walletStore.calculateUsdtPrice(
    props.goldCount,
    props.rate,
    props.feeRate,
    props.feeType || 0,
    props.discount || 0
  )
})

const formattedPrice = computed(() => {
  return walletStore.formatUsdtPrice(priceData.value.totalUiPrice)
})

const formattedTime = computed(() => {
  const mins = Math.floor(timeLeft.value / 60)
  const secs = timeLeft.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

function startTimer() {
  if (timer) clearInterval(timer)
  timeLeft.value = 900
  timer = window.setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      if (timer) clearInterval(timer)
    }
  }, 1000)
}

function copyText(text: string) {
  if (!text) return
  navigator.clipboard.writeText(text)
  showToast({ message: t('adaptation10106') || '已复制', duration: 800, position: 'bottom' })
}

async function handleRegister() {
  if (!userName.value.trim()) return
  loading.value = true

  const currentClub = userInfoStore.currentClub ?? userInfoStore.clubList[0]
  const clubId = currentClub?.club_id ? Number(currentClub.club_id) : undefined

  try {
    const res = await postRechargeGoldApi(
      {
        amount: props.goldCount,
        legal_tender: Math.round(priceData.value.totalUiPrice * 100),
        gold_type: 1,
        pay_id: props.payId,
        price_id: props.priceId,
        pay_price: priceData.value.apiPayPrice,
        pay_address: '',
        pay_address_save: false,
        order_no: '',
        name: userName.value.trim(),
      },
      clubId
    )

    if (res.code === 0 && res.data) {
      orderNo.value = res.data.order_no || res.data.order?.order_no || ''
      qrCodeUrl.value = (res.data.usdt_address?.qr_code || res.data.qrcode || res.data.qr_code || '') as string
      payAddress.value = res.data.usdt_address?.address || ''
      step.value = 2
      startTimer()
      emit('success')
    } else if (res.code === 20066 || res.code === 90016) {
      emit('unfinishedOrder')
    } else {
      alert(res.message || '充值失败')
    }
  } catch (e) {
    console.error('Failed to submit recharge', e)
    alert('充值失败，请重试')
  } finally {
    loading.value = false
  }
}

async function handleCancel() {
  if (!orderNo.value) return
  loading.value = true
  try {
    const res = await postOrderUserClubOrderCancelApi({ order_no: orderNo.value })
    if (res.code === 0) {
      emit('close')
    } else {
      alert(res.message || '取消失败')
    }
  } catch (e) {
    console.error('Cancel order failed', e)
    alert('取消失败，请重试')
  } finally {
    loading.value = false
  }
}

function handleClose() {
  emit('close')
}

onMounted(() => {
  if (step.value === 2) {
    startTimer()
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="overlay"

      @click.self="handleClose"
    >
     <!-- :style="{ backgroundImage: `url(${sharpBgUrl})` }" -->
      <div class="card" >
        <!-- :style="{ backgroundImage: `url(${sharpBgUrl})` }" -->
        <div class="card__inner">
          <!-- Header -->
          <div class="header">
            <h2 class="header__title">确认付款</h2>
            <div class="header__info">
              <p>手续费：{{ props.feeRate > 0 ? (props.feeRate * 100).toFixed(2).replace(/\.00$/, '') + '%' : '0' }}</p>
              <p>当前参考单价: 1联盟币={{ props.rate || 1 }}</p>
            </div>
          </div>

          <!-- Divider -->
          <!-- <div class="divider"></div> -->

          <!-- Phase 1 Layout -->
          <template v-if="step === 1">
            <!-- Amount in Red -->
            <div class="amount-container amount-container--red">
              <span class="amount-val">{{ formattedPrice }}</span>
            </div>

            <h3 class="phase-title">确认付款</h3>

            <!-- Name Input Field -->
            <div class="input-section">
              <label class="input-label">姓名 (必填)</label>
              <div class="input-wrapper">
                <input
                  v-model="userName"
                  type="text"
                  placeholder="请输入真实名字"
                  class="name-input"
                />
              </div>
              <p class="input-tip">
                提示：请填写与付款账户一致的账户名。如信息有误会导致交易失败
              </p>
            </div>

            <!-- Submit Action Button -->
            <div class="submit-action">
              <button
                class="action-btn action-btn--submit"

                @click="handleRegister"
              >
                {{ loading ? '提交中...' : '支付' }}
              </button>
               <!-- :disabled="!userName.trim() || loading" -->
            </div>
          </template>

          <!-- Phase 2 Layout -->
          <template v-else>
            <!-- Amount in White -->
            <div class="amount-container amount-container--white">
              <span class="amount-val">{{ formattedPrice }}</span>
            </div>

            <h3 class="phase-title">付款金额</h3>

            <!-- Details list -->
            <div class="details-section">
              <!-- Order Number Row -->
              <div class="info-row">
                <div class="info-row__left">
                  <span class="info-row__label">订单号</span>
                  <span class="info-row__tag">订单号</span>
                </div>
                <div class="info-row__right" @click="copyText(orderNo)">
                  <span class="info-row__value">{{ orderNo }}</span>
                </div>
              </div>

              <!-- QR Code & Scanner Row -->
              <div class="info-row info-row--qr" @click="copyText(payAddress)">
                <div class="info-row__left">
                  <span class="info-row__label">收款账户（点击此处获取收款账号）</span>
                </div>
                <div class="info-row__right" @click.stop>
                  <img
                    v-if="qrCodeUrl"
                    :src="qrCodeUrl"
                    alt="QR Code"
                    class="info-row__qr-img"
                    @click="showFullQr = true"
                  />
                  <div v-else class="info-row__qr-placeholder"></div>
                </div>
              </div>

              <p class="input-tip">
                提示：请填写与付款账户一致的账户名。如信息有误会导致交易失败
              </p>
            </div>

            <!-- Actions Row -->
            <div class="actions-row">
              <button
                class="action-btn action-btn--cancel"
                :disabled="loading"
                @click="handleCancel"
              >
                取消订单
              </button>
              <div class="action-btn action-btn--paying">
                <span>支付中</span>
                <span class="paying-timer">{{ formattedTime }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Zoomed QR Overlay -->
    <div v-if="showFullQr && qrCodeUrl" class="qr-zoom-overlay" @click="showFullQr = false">
      <div class="qr-zoom-card">
        <img :src="qrCodeUrl" alt="QR Code Full" class="qr-zoom-img" />
        <p class="qr-zoom-tip">长按或扫码进行支付</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background: rgba(23, 23, 23, 0.70);
}

.overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  // backdrop-filter: blur(34px);
  // -webkit-backdrop-filter: blur(34px);
  // background: rgba(12, 12, 12, 0.60);
}

.card {
  position: relative;
  z-index: 1;
  display: flex;
  width: 317.029px;
  padding: 15.7px 15.399px 15.399px 15.399px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 18.116px;
  border: 0.96px solid rgba(242, 242, 242, 0.4);
  border-radius: 36.4px;
  box-shadow:
    3.4px 4.3px 6.9px rgba(0, 0, 0, 0.25),
    0 0 8.6px #000 inset,
    2.1px 4.25px 17.2px rgba(242, 242, 242, 0.9) inset;
  overflow: hidden;
  background-size: cover;
  background-position: center;
}

.card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  // background: rgba(0, 0, 0, 0.70);
  box-shadow:
    0.0919rem 0.1149rem 0.1838rem 0 rgba(0, 0, 0, 0.25),
    0 0 0.2298rem 0 #000 inset,
    0.0566rem 0.1132rem 0.4596rem 0 rgba(242, 242, 242, 0.90) inset;
  backdrop-filter: blur(7.580729961395264px);
  -webkit-backdrop-filter: blur(7.580729961395264px);
  pointer-events: none;
  z-index: 1;
}

.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 0.0255rem;
  background: linear-gradient(180deg, rgba(242, 242, 242, 0.40) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.50) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 2;
}

.card__inner {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18.116px;
  width: 100%;
}

.header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header__title {
  color: #FFF;
  text-align: center;
  font-family: "HONOR Sans CN";
  font-size: 16px;
  font-weight: 400;
  line-height: 78%;
  letter-spacing: 0.32px;
  font-feature-settings: 'liga' off, 'clig' off;
  margin: 0;
}

.header__info {
  text-align: right;
  color: #FFF;
  font-family: "HONOR Sans CN";
  font-size: 11px;
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: 0.22px;
  font-feature-settings: 'liga' off, 'clig' off;
}

.header__info p {
  margin: 0;
}

.divider {
  width: 100%;
  height: 1px;
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.3) 50%, transparent 50%);
  background-size: 10px 1px;
  margin: 0;
}

.amount-container {
  position: relative;
  width: calc(100% + 30.798px);
  margin-left: -15.399px;
  margin-right: -15.399px;
  height: 45.58px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(97deg, rgba(255, 255, 255, 0.10) 21.11%, rgba(230, 230, 230, 0.10) 71.43%);
}

.amount-val {
  text-align: center;
  text-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  font-family: "Keania One", cursive;
  font-size: 29.361px;
  font-weight: 400;
  line-height: 100%;
  font-feature-settings: 'liga' off, 'clig' off;
}

.amount-container--red .amount-val {
  color: #FF4A4A;
}

.amount-container--white .amount-val {
  color: #FFF;
}

.phase-title {
  color: rgba(255, 255, 255, 0.9);
  font-family: "HONOR Sans CN";
  font-size: 16px;
  font-weight: 400;
  margin: 0;
  text-align: center;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.input-label {
  color: #FFF;
  font-family: "HONOR Sans CN";
  font-size: 14px;
  font-weight: 590;
  opacity: 0.9;
}

.input-wrapper {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-sizing: border-box;
}

.name-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #FFF;
  font-family: "HONOR Sans CN";
  font-size: 14px;
}

.name-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.input-tip {
  color: rgba(255, 255, 255, 0.5);
  font-family: "HONOR Sans CN";
  font-size: 10px;
  line-height: 1.4;
  margin: 4px 0 0 0;
}

.submit-action {
  width: 100%;

}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  border-radius: 24px;
  font-family: "HONOR Sans CN";
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;

}

.action-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.action-btn--submit {
  border: 0.648px solid rgba(242, 242, 242, 0.80);
  background: linear-gradient(97deg, rgba(255, 255, 255, 0.1) 21.11%, rgba(230, 230, 230, 0.1) 71.43%) !important;
  color: rgba(120, 228, 144, 1);
}

.action-btn--submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.details-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 46px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 23px;
  padding: 0 16px;
  box-sizing: border-box;
  cursor: pointer;
}

.info-row__left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.info-row__label {
  color: rgba(255, 255, 255, 0.9);
  font-family: "HONOR Sans CN";
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-row__tag {
  background: #007AFF;
  color: #FFF;
  font-family: "HONOR Sans CN";
  font-size: 9px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
  margin-left: 6px;
  line-height: 1;
}

.info-row__right {
  display: flex;
  align-items: center;
}

.info-row__value {
  color: rgba(255, 255, 255, 0.7);
  font-family: monospace;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
}

.info-row--qr {
  height: 54px;
}

.info-row__qr-img {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  cursor: pointer;
  background: #FFF;
  padding: 2px;
  box-sizing: border-box;
}

.info-row__qr-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
}

.actions-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.action-btn--cancel {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #FFF;
}

.action-btn--paying {
  flex: 1.2;
  border: 0.5px solid rgba(242, 242, 242, 0.80);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(120, 228, 144, 1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2px;
}

.paying-timer {
  font-size: 10px;
  font-weight: 400;
  opacity: 0.9;
}

.qr-zoom-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-zoom-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.qr-zoom-img {
  width: 220px;
  height: 220px;
  background: #FFF;
  padding: 10px;
  border-radius: 12px;
}

.qr-zoom-tip {
  color: #FFF;
  font-size: 14px;
  font-family: "HONOR Sans CN";
}
</style>
