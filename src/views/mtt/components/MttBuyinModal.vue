<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import GameDialog from '@/components/Dialog/GameDialog.vue'
import iconChips from '@/assets/icons/icon_chips.png'
import iconTicket from '@/assets/icons/icon_ticket.png'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconRefresh2 from '@/assets/icons/icon_refresh2.png'
import iconAdd from '@/assets/icons/icon_add.png'
import type { RoomcenterMttDetails, MttWallet, MttWalletFreeLimit } from '@/api/models/roomcenter'
import { getMttUserWalletApi } from '@/api/roomcenter'
import { postGlobalConfigApi } from '@/api/config'
import { postPropUserPropInfoApi } from '@/api/prop'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'
import { useAppConfigStore } from '@/stores/appConfig'
import { t } from '@/i18n'
import { showToast } from 'vant'

/* ===== props / emits ===== */
export type MttJoinMode = 'apply' | 'rebuy' | 'addon'

const props = defineProps<{
  show: boolean
  mtt?: RoomcenterMttDetails
  mttId?: number
  joinMode?: MttJoinMode
  /** 重购倒计时用，来自服务端 rebuyData */
  rebuyData?: {
    upblindInterval: number // 升盲间隔（秒）
    rebuyBlind: number // 最大重购级别
    startTime: string // RFC3339 格式开赛时间
  }
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  confirm: [payload: { ticket: boolean; ratio: number; useFree: boolean; clubId: number }]
}>()

/* ===== 工具 ===== */
function isDiamondMtt() { return (props.mtt?.gold_type ?? 1) === 4 }

function fmtMoney(n: number | undefined | null): string {
  if (n == null) return '-'
  return n.toLocaleString()
}

function applyRound(val: number, decimalType: number): number {
  switch (decimalType) {
    case 1: return Math.floor(val)
    case 2: return Math.ceil(val)
    case 3: return Math.round(val)
    default: return Math.floor(val)
  }
}

/* ===== 远端数据 ===== */
const appConfigStore = useAppConfigStore()
const wallets = ref<MttWallet[]>([])
const freeLimit = ref<MttWalletFreeLimit | null>(null)
const loading = ref(false)

// 记录费配置直接从 Pinia 缓存读取（对齐 Unity GameCache，不重复请求）。
const recordFeeConfig = computed(() =>
  appConfigStore.getMttRecordFeeConfig(props.mtt?.gold_type ?? 1),
)

async function fetchWalletAndConfig() {
  if (!props.mttId) return
  loading.value = true
  try {
    // 如果 Pinia 缓存为空（如直接刷新详情页），同步拉取全局配置。
    const extra = appConfigStore.globalConfig
      ? Promise.resolve()
      : postGlobalConfigApi({}).then((res) => {
        if (res.code === 0 && res.data) appConfigStore.setGlobalConfig(res.data)
      })

    const [walletRes] = await Promise.all([getMttUserWalletApi(props.mttId), extra])

    if (walletRes.code === 0 && walletRes.data) {
      wallets.value = walletRes.data.wallet ?? []
      freeLimit.value = walletRes.data.free ?? null

      // 单钱包自动选中
      if (wallets.value.length === 1) {
        selectedWallet.value = wallets.value[0]
      }
    } else if (walletRes.code === 20009) {
      showToast(t('ServerErrorCode_20009'))
    }
  } finally {
    loading.value = false
  }
}

watch(() => props.show, (val) => {
  if (val) {
    selectedWallet.value = null
    ratio.value = 1
    ticketAmount.value = 0
    ticketName.value = ''
    fetchWalletAndConfig()
    void fetchTicketInfo(props.mtt?.buy_prop_id ?? 0)
  }
})

/* ===== 钱包选择 ===== */
const selectedWallet = ref<MttWallet | null>(null)

// prop_buy_type 优先取选中钱包的，回退到 mtt 字段
const propBuyType = computed(() => props.mtt?.prop_buy_type ?? 0,
)

// 买入类型：ticket=门票 / chips=筹码/货币
// prop_buy_type: 0→只显示货币, 1→只显示票, 2→两者都显示
const buyinType = ref<'ticket' | 'chips'>('chips')

watch(propBuyType, (val) => {
  if (val === 1) buyinType.value = 'ticket'
  else buyinType.value = 'chips'
}, { immediate: true })

function selectWallet(w: MttWallet) {
  selectedWallet.value = w
}

/* ===== 门票检查（对齐 Unity APIPropUserCheck） ===== */
const ticketAmount = ref(0)
const ticketName = ref('')

// buy_prop_id 取自 mtt 本身，与钱包无关（对齐 Unity MttInfo.mtt.buy_prop_id）。
const currentBuyPropId = computed(() => props.mtt?.buy_prop_id ?? 0)

async function fetchTicketInfo(propId: number) {
  if (propId <= 0) {
    ticketAmount.value = 0
    ticketName.value = ''
    return
  }
  const res = await postPropUserPropInfoApi({ prop_id: propId }).catch(() => null)
  if (res?.code === 0 && res.data) {
    const d = res.data
    ticketAmount.value = d.prop_amount ?? 0
    // 对齐 Unity GetRoomNameByKey：prop_name 是多语言模板键，不走 USER_*.txt。
    ticketName.value = ticketAmount.value > 0
      ? (resolveTemplateTextByKey(d.info?.prop_name ?? '') || d.info?.prop_name || t('UIMatchTicket'))
      : t('adaptation10077')
  }
}

// 选中门票行时，若门票数量不足当前倍率弹出提示（对齐 Unity _selectToggle 回调，H5 额外覆盖 ratio>amount 场景）。
function onSelectTicket() {
  buyinType.value = 'ticket'
  if (currentBuyPropId.value > 0 && ratio.value > ticketAmount.value) {
    showToast(t('UIMTTApplyNoTicketTips'))
  }
}

// 切换倍率时，若当前选的是门票且数量不足，同步提示。
function onSelectRatio(newRatio: number) {
  ratio.value = newRatio
  if (buyinType.value === 'ticket' && currentBuyPropId.value > 0 && newRatio > ticketAmount.value) {
    showToast(t('UIMTTApplyNoTicketTips'))
  }
}

const walletBalance = computed(() => {
  const w = selectedWallet.value
  if (!w) return 0
  return isDiamondMtt() ? w.gold : w.gold / 100
})

/* ===== 倍率 ===== */
const ratio = ref<number>(1)
const buyRatio = computed(() => props.mtt?.buy_ratio ?? 1)
const showRatioToggle = computed(() => buyRatio.value > 1)

/* ===== 免费判断（对齐 Unity UpateBuyInFee） ===== */
const isFreeJoin = computed(() => {
  const fl = freeLimit.value
  if (!fl) return false
  if (ratio.value > 1) return fl.multi > 0
  if (props.joinMode === 'rebuy') return fl.rebuy > 0
  if (props.joinMode === 'addon') return fl.addon > 0
  return fl.buyin > 0
})

const isFreeFee = computed(() => {
  if (!isFreeJoin.value) return false
  const mtt = props.mtt
  if (!mtt) return false
  if (ratio.value > 1) return (mtt.multi_ratio_free_incl_svr ?? 0) > 0
  if (props.joinMode === 'rebuy') return (mtt.rebuy_free_incl_svr ?? 0) > 0
  if (props.joinMode === 'addon') return (mtt.addon_free_incl_svr ?? 0) > 0
  return (mtt.buyin_free_incl_svr ?? 0) > 0
})

/* ===== 报名费计算（对齐 Unity UpateBuyInFee） ===== */
const feeBreakdown = computed(() => {
  const mtt = props.mtt
  if (!mtt) return { display: '-', displayTotal: '-', total: 0 }

  const pool = mtt.apply_fee_pool ?? 0
  const svc = mtt.apply_fee_service ?? 0
  const hunter = mtt.apply_fee_hunter ?? 0
  const hasHunter = (mtt.hunter_on ?? 0) > 0
  const r = ratio.value
  // 钻石 MTT 不除以 100，其余货币需 ÷100 显示（对齐 Unity buyNumTrs = _buyinNum / 100.0）
  const div = isDiamondMtt() ? 1 : 100

  const joinRatio = isFreeJoin.value ? (r > 1 ? r - 1 : 0) : r
  const feeRatio = isFreeFee.value ? (r > 1 ? r - 1 : 0) : r

  const total = pool * joinRatio + svc * feeRatio + (hasHunter ? hunter * r : 0)

  let display: string
  if (hasHunter) {
    display = `${fmtMoney(pool * joinRatio / div)}+${fmtMoney(svc * feeRatio / div)}+${fmtMoney(hunter * r / div)}`
  } else {
    display = `${fmtMoney(pool * joinRatio / div)}+${fmtMoney(svc * feeRatio / div)}`
  }

  return { display, displayTotal: fmtMoney(total / div), total }
})

/* ===== 记录费计算（对齐 Unity UpateBuyInFee 后段） ===== */
interface RecordFeeResult {
  show: boolean
  original: number // 打折前（discount < 1 时显示）
  final: number
  hasDiscount: boolean
  showTip: boolean
}

const recordFee = computed<RecordFeeResult>(() => {
  const cfg = recordFeeConfig.value
  const HIDDEN: RecordFeeResult = { show: false, original: 0, final: 0, hasDiscount: false, showTip: false }
  if (!cfg || cfg.status !== 1) return HIDDEN

  const now = Math.floor(Date.now() / 1000)
  const totalRaw = feeBreakdown.value.total
  const buyNumTrs = isDiamondMtt() ? totalRaw : totalRaw / 100

  const baseFee = applyRound(Math.max(buyNumTrs * cfg.ratio, cfg.floor_price), cfg.decimal_type)
  const inTimeWindow = cfg.start_time <= now && now <= cfg.end_time

  if (inTimeWindow && cfg.discount < 1) {
    const finalFee = applyRound(baseFee * cfg.discount, cfg.decimal_type)
    return { show: true, original: baseFee, final: finalFee, hasDiscount: true, showTip: true }
  }

  return { show: true, original: baseFee, final: baseFee, hasDiscount: false, showTip: false }
})

/* ===== 确认按钮可用性 ===== */
const canConfirm = computed(() => {
  const goldType = props.mtt?.gold_type ?? 1
  if (goldType === 3) return true // 记分牌：始终可点
  if (goldType === 1) return true // UC：允许超额（走充值流程）
  if (!selectedWallet.value) return false
  return feeBreakdown.value.total <= selectedWallet.value.gold
})

/* ===== 重购倒计时 ===== */
const rebuySecondsLeft = ref(0)
let rebuyTimer: ReturnType<typeof setInterval> | null = null

function calcRebuyDeadline(): number {
  const rd = props.rebuyData
  if (!rd) return 0
  // 对齐 Unity：startTime(unix) + (rebuyBlind-1) * upblindInterval
  const startSec = Math.floor(new Date(rd.startTime).getTime() / 1000)
  return startSec + (rd.rebuyBlind - 1) * rd.upblindInterval
}

function startRebuyCountdown() {
  stopRebuyCountdown()
  if (!props.rebuyData) return
  const deadline = calcRebuyDeadline()
  const tick = () => {
    const left = deadline - Math.floor(Date.now() / 1000)
    rebuySecondsLeft.value = Math.max(0, Math.min(15, left)) // Unity 限制最大15
    if (rebuySecondsLeft.value <= 0) {
      stopRebuyCountdown()
      emit('update:show', false)
    }
  }
  tick()
  rebuyTimer = setInterval(tick, 1000)
}

function stopRebuyCountdown() {
  if (rebuyTimer) { clearInterval(rebuyTimer); rebuyTimer = null }
}

const showRebuyTimer = computed(() => !!props.rebuyData && props.joinMode === 'rebuy')

watch(() => props.show, (val) => {
  if (val && showRebuyTimer.value) startRebuyCountdown()
  else stopRebuyCountdown()
})

onMounted(() => { if (props.show && showRebuyTimer.value) startRebuyCountdown() })
onUnmounted(() => stopRebuyCountdown())

/* ===== 提交 ===== */
function handleConfirm() {
  // 门票模式且数量不足当前倍率时阻止提交（ratio > amount 同时覆盖 amount===0 的情况）。
  if (buyinType.value === 'ticket' && currentBuyPropId.value > 0 && ratio.value > ticketAmount.value) {
    showToast(t('UIMTTApplyNoTicketTips'))
    return
  }

  if (!canConfirm.value) {
    // UC 余额不足时提示，但不阻止（游戏服务端再验证）
    if ((props.mtt?.gold_type ?? 1) === 1 && feeBreakdown.value.total > (selectedWallet.value?.gold ?? 0)) {
      showToast(t('UItexasUCyuebuzutips'))
    }
    return
  }
  emit('confirm', {
    ticket: buyinType.value === 'ticket',
    ratio: ratio.value,
    useFree: isFreeJoin.value,
    clubId: selectedWallet.value?.club_id ?? 0,
  })
  emit('update:show', false)
}
</script>

<template>
  <GameDialog
    :show="show"
    :title="t('UIMTTSignDialogBuyTitle')"
    :confirm-button-text="t('UICowboy_JoinGame')"
    :confirm-button-disabled="!canConfirm && (mtt?.gold_type ?? 1) !== 1"
    :close-on-click-overlay="true"
    @confirm="handleConfirm"
    @update:show="emit('update:show', $event)"
  >
    <div class="buyin-modal">
      <!-- 重购倒计时 -->
      <div v-if="showRebuyTimer" class="rebuy-timer">
        ({{ rebuySecondsLeft }}s)
      </div>

      <!-- 买入方式 -->
      <div class="buyin-options">
        <!-- 货币/筹码选项（prop_buy_type == 0 or 2） -->
        <div
          v-if="propBuyType !== 1"
          :class="['buyin-option-row', { 'buyin-option-row--active': buyinType === 'chips' }]"
          @click="buyinType = 'chips'"
        >
          <div class="buyin-option-label">
            <img class="buyin-option-icon" :src="iconChips" alt="" />
            <span class="buyin-option-text">{{ feeBreakdown.display }}</span>
            <span v-if="isFreeJoin && buyinType === 'chips'" class="free-badge">
              {{ t('UIMTT_free') || 'FREE' }}
            </span>
          </div>
          <div class="buyin-option-actions">
            <!-- 倍率切换，仅 buy_ratio > 1 时展示 -->
            <div v-if="showRatioToggle" class="ratio-toggle">
              <button
                :class="['ratio-btn', { 'ratio-btn--active': ratio === buyRatio }]"
                @click.stop="onSelectRatio(buyRatio)"
              >
                {{ buyRatio }}X
              </button>
              <button
                :class="['ratio-btn', { 'ratio-btn--active': ratio === 1 }]"
                @click.stop="onSelectRatio(1)"
              >
                1X
              </button>
            </div>
            <span :class="['radio-circle', { 'radio-circle--checked': buyinType === 'chips' }]"></span>
          </div>
        </div>

        <!-- 门票选项（prop_buy_type == 1 or 2） -->
        <div
          v-if="propBuyType > 0"
          :class="['buyin-option-row', { 'buyin-option-row--active': buyinType === 'ticket' }]"
          @click="onSelectTicket"
        >
          <div class="buyin-option-label">
            <img class="buyin-option-icon" :src="iconTicket" alt="" />
            <!-- 有门票显示门票名称，无门票显示"无"（对齐 Unity APIPropUserCheck 逻辑） -->
            <span :class="['buyin-option-text', { 'buyin-option-text--none': currentBuyPropId > 0 && ratio > ticketAmount }]">
              {{ currentBuyPropId > 0 ? ticketName || t('UIBackDiolg_title01') : t('UIBackDiolg_title01') }}
            </span>
          </div>
          <div class="buyin-option-actions">
            <div v-if="showRatioToggle" class="ratio-toggle">
              <button
                :class="['ratio-btn', { 'ratio-btn--active': ratio === buyRatio }]"
                @click.stop="onSelectRatio(buyRatio)"
              >
                {{ buyRatio }}X
              </button>
              <button
                :class="['ratio-btn', { 'ratio-btn--active': ratio === 1 }]"
                @click.stop="onSelectRatio(1)"
              >
                1X
              </button>
            </div>
            <span :class="['radio-circle', { 'radio-circle--checked': buyinType === 'ticket' }]"></span>
          </div>
        </div>
      </div>
      <div v-if="loading" class="buyin-loading">
        <van-loading color="#05e7ae" size="0.6rem" />
      </div>
      <!-- 钱包选择（默认展开，超出 5rem 滚动） -->
      <div v-else-if="wallets.length > 0" class="wallet-section">
        <div class="wallet-title">{{ t('UIMatchSelectClubBuyin') }}</div>
        <div class="wallet-list">
          <div
            v-for="w in wallets"
            :key="w.club_id"
            :class="['wallet-item', { 'wallet-item--selected': selectedWallet?.club_id === w.club_id }]"
            @click="selectWallet(w)"
          >
            <span class="wallet-item-name">{{ w.club_name }}</span>
            <div class="wallet-item-right">
              <img class="wallet-item-icon" :src="iconChips" alt="" />
              <span class="wallet-item-gold">{{ fmtMoney(w.gold / 100) }}</span>
              <span :class="['radio-circle', { 'radio-circle--checked': selectedWallet?.club_id === w.club_id }]"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 余额 + 费用 -->
      <div class="cost-section">
        <div class="cost-balance-row">
          <img
            class="cost-refresh"
            :src="iconRefresh2"
            alt=""
            @click="fetchWalletAndConfig"
          />
          <img class="cost-icon" :src="iconChips" alt="" />
          <span class="cost-balance-num">{{ fmtMoney(walletBalance) }}</span>
          <img class="cost-add" :src="iconAdd" alt="" />
        </div>
        <div class="cost-detail">
          <span class="cost-label">{{ t('UITexasJLF') }}</span>
          <div class="cost-item">
            <img class="cost-item-icon" :src="iconDiamond" alt="" />
            <!-- 报名费暂不显示 -->
            <!-- <span v-if="isFreeJoin" class="cost-item-free">FREE</span> -->
            <!-- <span v-else class="cost-item-value">{{ feeBreakdown.displayTotal }}</span> -->
            <!-- 记录费 -->
            <span v-if="recordFee.hasDiscount" class="record-original">{{ recordFee.original }}</span>
            <span class="record-final">{{ recordFee.final }}</span>
          </div>
        </div>
      </div>
    </div>
  </GameDialog>
</template>

<style scoped lang="scss">
.buyin-loading {
  text-align: center;
  color: #fff;
  font-size: 0.35rem;
  padding: 0.5rem 0;
}

.buyin-modal {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

/* ===== 倒计时 ===== */
.rebuy-timer {
  text-align: right;
  font-size: 0.32rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: -0.1rem;
}

/* ===== 买入选项 ===== */
.buyin-options {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.62rem;
  padding: 0.32rem 0.38rem;
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.buyin-option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 0.67rem;
  cursor: pointer;
}

.buyin-option-label {
  display: flex;
  align-items: center;
  gap: 0.13rem;
  flex: 1;
  min-width: 0;
}

.buyin-option-icon {
  width: 0.48rem;
  height: 0.48rem;
  flex-shrink: 0;
}

.buyin-option-text {
  font-size: 0.33rem;
  font-weight: 700;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
  word-break: break-all;

  &--none {
    color: rgba(255, 255, 255, 0.4);
    font-weight: 400;
  }
}

.free-badge {
  background: linear-gradient(135deg, #05e7ae, #027a5c);
  color: #fff;
  font-size: 0.22rem;
  font-weight: 700;
  padding: 0.04rem 0.12rem;
  border-radius: 0.2rem;
  flex-shrink: 0;
}

.buyin-option-actions {
  display: flex;
  align-items: center;
  gap: 0.24rem;
  flex-shrink: 0;
  margin-left: 0.16rem;
}

.ratio-toggle {
  display: flex;
  gap: 0.1rem;
}

.ratio-btn {
  width: 1.0rem;
  height: 0.6rem;
  border-radius: 1rem;
  border: none;
  font-size: 0.3rem;
  font-weight: 500;
  font-family: 'Afacad', sans-serif;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  cursor: pointer;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 0.013rem;
    background: linear-gradient(
      135deg,
      rgba(242, 242, 242, 0.8) 0%,
      rgba(255, 255, 255, 0) 44.5%,
      rgba(255, 255, 255, 0.5) 100%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  &--active {
    background: linear-gradient(157deg, #05e7ae 0%, #027a5c 100%);
  }
}


/* ===== 钱包 ===== */
.wallet-section {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.wallet-title {
  font-size: 0.32rem;
  font-weight: 500;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
}

.wallet-list {
  background: rgba(0, 0, 0, 0.37);
  backdrop-filter: blur(0.16rem);
  border-radius: 0.52rem;
  max-height: 5rem;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }
}

.wallet-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.2rem 0.38rem;
  cursor: pointer;

  &--selected {
    background: rgba(5, 231, 174, 0.12);
  }
}

.wallet-item-name {
  font-size: 0.33rem;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
}

.wallet-item-right {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.wallet-item-icon {
  width: 0.32rem;
  height: 0.32rem;
}

.wallet-item-gold {
  font-size: 0.30rem;
  color: rgba(255, 255, 255, 0.8);
  font-family: 'HONOR Sans CN', sans-serif;
}

.wallet-item-check {
  font-size: 0.3rem;
  color: #05e7ae;
  margin-left: 0.08rem;
}

/* ===== 余额/费用 ===== */
.cost-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
}

.cost-balance-row {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.cost-icon {
  width: 0.38rem;
  height: 0.38rem;
}

.cost-balance-num {
  font-size: 0.38rem;
  font-weight: 800;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
}

.cost-refresh {
  width: 0.52rem;
  height: 0.52rem;
  cursor: pointer;
}

.cost-add {
  width: 0.52rem;
  height: 0.52rem;
  cursor: pointer;
}

.cost-detail {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.cost-label {
  font-size: 0.32rem;
  color: rgba(255, 255, 255, 0.8);
  font-family: 'HONOR Sans CN', sans-serif;
}

.cost-item {
  display: flex;
  align-items: center;
  gap: 0.06rem;
}

.cost-item-icon {
  width: 0.32rem;
  height: 0.32rem;
}

.cost-item-value {
  font-size: 0.33rem;
  font-weight: 800;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
}

.cost-item-free {
  font-size: 0.33rem;
  font-weight: 800;
  color: #05e7ae;
  font-family: 'HONOR Sans CN', sans-serif;
}

/* ===== 记录费 ===== */
.record-fee-section {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 0.52rem;
  padding: 0.2rem 0.38rem;
}

.record-fee-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.record-fee-label-wrap {
  display: flex;
  align-items: center;
  gap: 0.08rem;
}

.record-fee-label {
  font-size: 0.32rem;
  color: rgba(255, 255, 255, 0.8);
  font-family: 'HONOR Sans CN', sans-serif;
}

.record-tip-icon {
  font-size: 0.28rem;
  color: rgba(255, 255, 255, 0.5);
}

.record-fee-amount {
  display: flex;
  align-items: center;
  gap: 0.06rem;
}

.record-fee-icon {
  width: 0.32rem;
  height: 0.32rem;
}

.record-original {
  font-size: 0.3rem;
  color: rgba(255, 255, 255, 0.4);
  text-decoration: line-through;
  font-family: 'HONOR Sans CN', sans-serif;
}

.record-final {
  font-size: 0.33rem;
  font-weight: 700;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
}
</style>
