<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import ava1 from '@/assets/images/wallet/avatars/ava1.png'
import icCoins from '@/assets/icons/wallet/ic_coins.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import SegmentedToggle from '@/views/wallet/components/SegmentedToggle.vue'
import UserCard from '@/views/wallet/components/UserCard.vue'
import GlassButton from '@/components/Button/GlassButton.vue'
import PresetAmountGrid, { type Preset } from '@/views/wallet/components/PresetAmountGrid.vue'
import PaymentMethodStrip, {
  type PaymentMethod,
} from '@/views/wallet/components/PaymentMethodStrip.vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import NumericKeypad from '@/components/KeyBoard/NumericKeypad.vue'
import WithdrawForm from '@/views/wallet/components/WithdrawForm.vue'
import UsdtPaymentPopup from '@/views/wallet/components/UsdtPaymentPopup.vue'
import UnfinishedOrderPopup from '@/views/wallet/components/UnfinishedOrderPopup.vue'
import UsdtPaymentDetailsPopup from '@/views/wallet/components/UsdtPaymentDetailsPopup.vue'
import CustomerServicePaymentPopup from '@/views/wallet/components/CustomerServicePaymentPopup.vue'
import OnlinePaymentPopup from '@/views/wallet/components/OnlinePaymentPopup.vue'
import { openCsOrderChat } from '@/components/GlobalCsOrderFloat/channel'
import FixedDepositPanel from '@/views/wallet/components/FixedDepositPanel.vue'
import MainBottomTab from '@/components/Tabbar/MainBottomTab.vue'
import { t } from '@/i18n'
import { useWalletStore } from '@/stores/wallet'
import { useUserInfoStore } from '@/stores/userInfo'
import { useMainTabsStore } from '@/stores/mainTabs'
import { setH5Visible } from '@/bridge/channels/uiChannel'
import { isChannelPackageHost } from '@/utils/channelPackage'
import {
  postOrderUserRechargeNoApi,
  postRechargeGoldApi,
  postClubFundOrderListApi,
  postOrderUserClubOrderCancelApi,
} from '@/api/order'
import { postChatSupportChannelListApi } from '@/api/chat'
import { generateQrCodeUrl } from '@/utils/qrcode'
import { showToast } from 'vant'
import { postClubUserWalletApi } from '@/api/org'
import type { ClubFundOrderListOrderInfo } from '@/api/models/order'

const router = useRouter()
const route = useRoute()
const walletStore = useWalletStore()
const userInfoStore = useUserInfoStore()
const tabsStore = useMainTabsStore()
const isChannelPackage = isChannelPackageHost()

if (isChannelPackage) {
  tabsStore.setActiveTab('wallet')
}

const directedClubId = computed(() => {
  const raw = Array.isArray(route.query.clubId) ? route.query.clubId[0] : route.query.clubId
  const clubId = Number(raw)
  return Number.isFinite(clubId) && clubId > 0 ? clubId : undefined
})
const walletClub = computed(() => {
  if (directedClubId.value) {
    return (
      userInfoStore.clubList.find(
        (club) => Number(club.club_id) === directedClubId.value,
      ) ?? null
    )
  }
  return userInfoStore.currentClub ?? userInfoStore.clubList[0] ?? null
})
const walletClubId = computed(
  () => directedClubId.value ?? (Number(walletClub.value?.club_id) || undefined),
)
const isFixedDeposit = computed(() => walletClub.value?.deposit_switch === 2)
const isFromCocosTable = computed(() => {
  const raw = Array.isArray(route.query.from) ? route.query.from[0] : route.query.from
  return raw === 'cocos-table'
})
const isFromMttRegistration = computed(() => {
  const raw = Array.isArray(route.query.from) ? route.query.from[0] : route.query.from
  return raw === 'mtt-registration'
})

const activeTab = ref(route.query.tab === '1' ? 1 : 0)

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab === '1') {
      activeTab.value = 1
    } else if (newTab === '0') {
      activeTab.value = 0
    }
  },
)
const activePreset = ref(0)
const activeMethod = ref(0)
const keypadOpen = ref(false)
const customAmount = ref('')
const usdtPopupOpen = ref(false)
const usdtPopupProps = ref({
  goldCount: 0,
  rate: 0,
  feeRate: 0,
  feeType: 0,
  discount: 0,
})

const unfinishedOrder = ref<ClubFundOrderListOrderInfo | null>(null)
const showUnfinishedPopup = ref(false)

const usdtDetailsPopupOpen = ref(false)
const rechargeResult = ref<any>(null)

const csPopupOpen = ref(false)
const csPopupProps = ref({
  goldCount: 0,
  rate: 0,
  feeRate: 0,
  feeType: 0,
  discount: 0,
})

// 微信 / 支付宝 / 银行卡等在线支付（pay_type 非 1=USDT、非 3=客服撮合）
const onlinePopupOpen = ref(false)
const onlinePopupProps = ref({
  goldCount: 0,
  rate: 0,
  feeRate: 0,
  feeType: 0,
  discount: 0,
  payId: 0,
  priceId: 0,
})
const onlinePopupInitialData = ref({
  step: 1,
  orderNo: '',
  qrCode: '',
  payAddress: '',
})

function handleOnlineSuccess() {
  activePreset.value = 0
  customAmount.value = ''
}

function handleOnlineUnfinished() {
  onlinePopupOpen.value = false
  void checkUnfinishedOrders()
}

function handleWalletBack(): void {
  if (isFromCocosTable.value) {
    setH5Visible(false)
  }
  router.back()
}

function openWalletChild(path: string): void {
  void router.push({ path, query: route.query })
}

// 当前俱乐部成员余额（单位：分），用于钱包余额展示与回收可用额度
const clubGold = ref(0)

async function fetchClubBalance(): Promise<void> {
  const clubId = walletClubId.value
  if (!clubId) {
    clubGold.value = 0
    return
  }
  try {
    const res = await postClubUserWalletApi({ club_id: clubId })
    if (res.code === 0 && res.data) {
      const d = res.data as Record<string, unknown>
      const raw = d.user_gold ?? d.gold ?? d.golds ?? d.balance ?? 0
      clubGold.value = Number(raw) || 0
    } else {
      clubGold.value = 0
    }
  } catch (e) {
    console.error('Failed to fetch club balance', e)
    clubGold.value = 0
  }
}

watch(
  walletClubId,
  (id) => {
    if (id) void fetchClubBalance()
  },
  { immediate: true },
)

async function refreshPendingCsOrder() {
  // We keep this method for manual refreshes within this view (e.g. after cancel/submit)
  // but we will no longer run it on a 10s interval here as requested.
  await walletStore.refreshPendingCsOrder(walletClubId.value)
}

// 订单列表项没有可靠的 pay_type 数字字段，用 pay_id / pay_type_name 匹配
// goldPriceData.pay_types 取真实类型（1=数字钱包/USDT，2=API 在线支付，3=客服撮合）。
function resolveOrderPayType(order: ClubFundOrderListOrderInfo): number | undefined {
  const payTypes = walletStore.goldPriceData?.pay_types ?? []
  const orderPayId = (order as any).pay_id
  const matched =
    payTypes.find((pt) => pt.id != null && pt.id === orderPayId) ??
    payTypes.find((pt) => !!pt.name && pt.name === order.pay_type_name)
  return (
    matched?.type ??
    (order as any).pay_type ??
    (order as any).api_type ??
    (order as any).type
  )
}

async function checkUnfinishedOrders(showPopup = true) {
  const clubId = walletClubId.value

  try {
    const res = await postClubFundOrderListApi(
      {
        order_type: 1, // Recharge
        my_order: true,
        limit: 10,
        offset: 0,
        status: 1, // Pending
      },
      clubId,
    )

    if (res.code === 0 && res.data?.list?.length) {
      // 「有未完成的订单」弹窗只在用户发起 USDT / 银行卡 / 支付宝 / 微信 等支付时触发
      //（见 onUsdtSubmit / 在线支付流程），用于继续或取消未完成订单。
      // 用户发起客服撮合充值时不会走到这里——那条路径只弹「订单审核中」提示（见 onCsSubmit）。
      unfinishedOrder.value = res.data.list[0]
      if (showPopup) {
        showUnfinishedPopup.value = true
      }
    } else {
      unfinishedOrder.value = null
    }
  } catch (e) {
    console.error('Failed to fetch unfinished orders', e)
  }
}

async function handleCancelOrder(orderNo: string) {
  try {
    const res = await postOrderUserClubOrderCancelApi({
      order_no: orderNo,
      club_id: walletClubId.value,
    })
    if (res.code === 0) {
      showUnfinishedPopup.value = false
      usdtDetailsPopupOpen.value = false
      unfinishedOrder.value = null
      // Refresh the list but don't show popup
      await checkUnfinishedOrders(false)
      await refreshPendingCsOrder()
    } else {
      alert(`Cancel failed: ${res.message}`)
    }
  } catch (e) {
    console.error('Failed to cancel order', e)
    alert('Failed to cancel order')
  }
}

async function handleUnfinishedContinue(order: ClubFundOrderListOrderInfo) {
  showUnfinishedPopup.value = false

  let qrCode =
    (order as any).qrcode || (order as any).qr_code || (order as any).pay_type_qr_code || ''
  const payAddress = order.pay_type_address || ''
  // 订单列表不返回二维码图片，只有收款地址：用地址即时生成二维码，
  // 避免「继续支付」后 USDT/在线支付弹窗里二维码空白。
  if (!qrCode && payAddress) {
    try {
      qrCode = await generateQrCodeUrl(payAddress, { size: 720, margin: 2 })
    } catch (e) {
      console.error('Failed to generate QR for unfinished order', e)
    }
  }
  const result = {
    order_no: order.order_no,
    gold_num: order.gold_num,
    pay_price: order.pay_price,
    order: {
      order_no: order.order_no,
      amount: order.pay_price,
      gold_num: order.gold_num,
    },
    usdt_address: {
      address: order.pay_type_address || '',
      qr_code: qrCode,
      name: (order as any).pay_type_name || t('UIWallet_Text3'),
    },
  }

  rechargeResult.value = result

  // 用 pay_id / pay_type_name 匹配真实支付类型：未完成 USDT 订单「继续支付」回到 USDT 弹窗，而非在线支付弹窗。
  const orderType = resolveOrderPayType(order)
  if (orderType === 3 || (order as any).pay_type_name?.includes('撮合')) {
    try {
      const channelRes = await postChatSupportChannelListApi({
        im_service_types: [4],
        limit: 1,
        offset: 0,
      })

      if (channelRes.code === 0 && channelRes.data?.list?.length) {
        await refreshPendingCsOrder()
        openCsOrderChat()
      } else {
        // Fallback to USDT details if no chat channel found
        usdtPopupProps.value.rate = (order as any).rate || (order as any).exchange_rate || 1
        usdtDetailsPopupOpen.value = true
      }
    } catch (e) {
      console.error('Failed to fetch chat channel for unfinished order', e)
      usdtPopupProps.value.rate = (order as any).rate || (order as any).exchange_rate || 1
      usdtDetailsPopupOpen.value = true
    }
  } else if (orderType === 1) {
    // Standard USDT flow
    usdtPopupProps.value.rate = (order as any).rate || (order as any).exchange_rate || 1
    usdtDetailsPopupOpen.value = true
  } else {
    // 微信 / 支付宝 / 银行卡等在线支付（type 2、4-9）继续未完成订单
    onlinePopupProps.value = {
      goldCount: Number(order.gold_num) || 0,
      rate: (order as any).rate || (order as any).exchange_rate || 1,
      feeRate: (order as any).fee_rate || 0,
      feeType: (order as any).fee_type || 0,
      discount: (order as any).discount || 0,
      payId: (order as any).pay_id || (order as any).pay_type || 0,
      priceId: (order as any).price_id || 0,
    }
    onlinePopupInitialData.value = {
      step: 2,
      orderNo: order.order_no || '',
      qrCode: qrCode,
      payAddress: order.pay_type_address || '',
    }
    onlinePopupOpen.value = true
  }
}

watch(
  walletClubId,
  (clubId) => {
    walletStore.clearCsOrders()
    void walletStore.loadPriceList(clubId)
    void refreshPendingCsOrder()
  },
  { immediate: true },
)

watch(
  () => route.fullPath,
  () => {
    if (isFromCocosTable.value || isFromMttRegistration.value) {
      activeTab.value = 0
    }
  },
  { immediate: true },
)

const filteredPayTypes = computed(() =>
  (walletStore.goldPriceData?.pay_types ?? []),
)

const methods = computed<PaymentMethod[]>(() =>
  filteredPayTypes.value.map((pt) => ({
    icon: pt.image ?? '',
    primary: pt.name ?? '',
    secondary: '',
  })),
)

// Watch for method changes to handle methods without price lists
watch(
  activeMethod,
  (newIdx) => {
    const selected = filteredPayTypes.value[newIdx] as any
    const hasPriceIds = (selected?.price_ids?.length ?? 0) > 0
    const hasPriceList = (selected?.price_list?.length ?? 0) > 0

    if (selected && !hasPriceIds && !hasPriceList) {
      activePreset.value = -1 // Default to custom amount
    } else {
      activePreset.value = 0 // Default to first preset
    }
  },
  { immediate: true },
)

// if pay_type have no price_ids or price_list then empty tile will show and default is custom amount tile will show.

// feeType: 0=none, 1=club pays, 2=player pays — only apply surcharge when player pays
// Removed local calculation and formatting functions, using walletStore instead.

const presets = computed<Preset[]>(() => {
  const payTypes = filteredPayTypes.value
  const selected = payTypes[activeMethod.value] as any
  const hasPriceIds = (selected?.price_ids?.length ?? 0) > 0
  const hasPriceList = (selected?.price_list?.length ?? 0) > 0
  if (selected && !hasPriceIds && !hasPriceList) {
    return []
  }
  const list = hasPriceList ? selected!.price_list! : walletStore.goldPriceData?.list ?? []

  const isUsdt = selected?.type !== 3
  const rate = selected?.rate ?? 1
  const feeRate = selected?.fee_rate ?? 0
  const feeType = selected?.fee_type ?? 0
  const discount = selected?.discount ?? 0

  return list.map((item: any) => {
    const goldCount = item.gold_count ?? 0
    const amountStr = String(goldCount / 100)
    let chipStr = (goldCount / 100).toLocaleString(undefined, { useGrouping: false })
    if (isUsdt) {
      chipStr = walletStore.formatUsdtPrice(
        walletStore.calculateUsdtPrice(goldCount, rate, feeRate, feeType, discount).totalUiPrice,
      )
    } else if (selected?.type === 3) {
      // Customer Service: show decimals
      const csPrice = walletStore.calculateCustomerServicePrice(goldCount, rate, feeRate, discount)
      chipStr = csPrice.toLocaleString(undefined, {
        useGrouping: false,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }

    return {
      amount: amountStr,
      chip: chipStr,
      id: item.id,
      payPrice: item.pay_price as number | undefined,
    }
  })
})

function onCustom(): void {
  keypadOpen.value = true
}

function onKeypadSubmit(v: number): void {
  customAmount.value = String(v)
  keypadOpen.value = false
  activePreset.value = -1
}

const selectedAmount = computed(() => {
  if (activePreset.value === -1) {
    return customAmount.value || '0'
  }
  return presets.value[activePreset.value]?.amount || '0'
})

const displayPayAmount = computed(() => {
  const payTypes = filteredPayTypes.value
  const selected = payTypes[activeMethod.value]
  const amount = Number(selectedAmount.value)

  if (selected?.type !== 3 && selected) {
    // USDT / 微信 / 支付宝 / 银行卡等在线支付
    const goldCount = amount * 100
    const rate = selected.rate ?? 1
    const feeRate = selected.fee_rate ?? 0
    const feeType = selected.fee_type ?? 0
    const discount = selected.discount ?? 0
    return walletStore.formatUsdtPrice(
      walletStore.calculateUsdtPrice(goldCount, rate, feeRate, feeType, discount).totalUiPrice,
    )
  }

  if (selected?.type === 3) {
    // Customer Service: show decimals
    const goldCount = amount * 100
    const rate = selected.rate ?? 1
    const feeRate = selected.fee_rate ?? 0
    const discount = selected.discount ?? 0
    const csPrice = walletStore.calculateCustomerServicePrice(goldCount, rate, feeRate, discount)
    return csPrice.toLocaleString(undefined, {
      useGrouping: false,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return selectedAmount.value
})

const tabLabels = [t('Wallet_Deposit'), t('Wallet_Withdraw')]

function onPayClick() {
  const payTypes = filteredPayTypes.value
  const selectedPayType = payTypes[activeMethod.value]

  if (selectedPayType?.type === 1) {
    usdtPopupProps.value = {
      goldCount: Number(selectedAmount.value) * 100,
      rate: selectedPayType.rate ?? 1,
      feeRate: selectedPayType.fee_rate ?? 0,
      feeType: selectedPayType.fee_type ?? 0,
      discount: selectedPayType.discount ?? 0,
    }
    usdtPopupOpen.value = true
  } else if (selectedPayType?.type === 3) {
    csPopupProps.value = {
      goldCount: Number(selectedAmount.value) * 100,
      rate: selectedPayType.rate ?? 1,
      feeRate: selectedPayType.fee_rate ?? 0,
      feeType: selectedPayType.fee_type ?? 0,
      discount: selectedPayType.discount ?? 0,
    }
    csPopupOpen.value = true
  } else if (selectedPayType) {
    // 微信 / 支付宝 / 银行卡等在线支付
    onlinePopupProps.value = {
      goldCount: Number(selectedAmount.value) * 100,
      rate: selectedPayType.rate ?? 1,
      feeRate: selectedPayType.fee_rate ?? 0,
      feeType: selectedPayType.fee_type ?? 0,
      discount: selectedPayType.discount ?? 0,
      payId: selectedPayType.id ?? 0,
      priceId: activePreset.value === -1 ? 0 : presets.value[activePreset.value]?.id ?? 0,
    }
    onlinePopupInitialData.value = {
      step: 1,
      orderNo: '',
      qrCode: '',
      payAddress: '',
    }
    onlinePopupOpen.value = true
  }
}

async function onWithdrawCsChat(orderData: Record<string, unknown>) {
  try {
    const channelRes = await postChatSupportChannelListApi({
      im_service_types: [4],
      limit: 1,
      offset: 0,
    })
    if (channelRes.code === 0 && channelRes.data?.list?.length) {
      // 乐观插入刚创建的提现订单，保证立即出现在“交易中”聊天里，
      // 不必等服务端 pending 列表把它返回
      if (orderData?.order_no) {
        walletStore.addOptimisticCsOrder(
          {
            order_no: String(orderData.order_no),
            gold_num: Number(orderData.gold_num) || 0,
            pay_price: Number(orderData.pay_price) || 0,
            pay_type_name: String(orderData.pay_type_name ?? ''),
            create_time: String(orderData.create_time ?? ''),
            account_type: 0,
          } as ClubFundOrderListOrderInfo,
          'withdraw',
        )
      }
      await refreshPendingCsOrder()
      openCsOrderChat()
    }
  } catch (e) {
    console.error('Failed to fetch chat channel for withdraw', e)
  }
}

async function onCsSubmit() {
  csPopupOpen.value = false

  const payTypes = filteredPayTypes.value
  const selectedPayType = payTypes[activeMethod.value]
  if (!selectedPayType) return

  const clubId = walletClubId.value

  let goldCount = csPopupProps.value.goldCount
  const rate = selectedPayType.rate ?? 1
  const feeRate = selectedPayType.fee_rate ?? 0
  const feeType = selectedPayType.fee_type ?? 0
  const discount = selectedPayType.discount ?? 0
  let priceId = activePreset.value === -1 ? 0 : presets.value[activePreset.value]?.id ?? 0

  // 1. Unique-amount channel: server adjusts amount with a tail for payment matching
  if ((selectedPayType.increase_interval ?? 0) > 0) {
    try {
      const res = await postOrderUserRechargeNoApi(
        {
          amount: goldCount,
          pay_id: selectedPayType.id,
        },
        clubId,
        // 审核中提示统一由 checkUnfinishedOrders 处理，避免拦截器再弹一次 toast。
        { suppressBusinessCodes: [20066, 90016] },
      )
      if (res.code === 0 && res.data) {
        goldCount = res.data.amount ?? goldCount
        priceId = res.data.price_id ?? 0
      }
    } catch (e) {
      console.error('Failed to get unique recharge amount', e)
    }
  }

  // pay_price rule: discount > 0 takes priority (discount removes fee from pay_price);
  // only when discount = 0 and fee_type = 2 is the fee added to pay_price.
  const basePrice = (goldCount / 100) * rate
  const apiPayPrice =
    discount > 0
      ? Number((basePrice * (1 - discount)).toFixed(4))
      : feeType === 2 && feeRate > 0
      ? Number((basePrice * (1 + feeRate)).toFixed(4))
      : Number(basePrice.toFixed(4))

  try {
    const res = await postRechargeGoldApi(
      {
        amount: goldCount,
        legal_tender: 0,
        // legalTender
        // name:"",
        gold_type: 1,
        pay_id: selectedPayType.id,
        price_id: priceId,
        pay_price: apiPayPrice,
        pay_address: '',
        pay_address_save: false,
        // order_no: "",
      },
      clubId,
      // 审核中提示统一由 checkUnfinishedOrders 处理，避免拦截器再弹一次 toast。
      { suppressBusinessCodes: [20066, 90016] },
    )

    if (res.code === 0 && res.data) {
      rechargeResult.value = res.data

      try {
        const channelRes = await postChatSupportChannelListApi({
          im_service_types: [4],
          limit: 1,
          offset: 0,
        })

        if (channelRes.code === 0 && channelRes.data?.list?.length) {
          await refreshPendingCsOrder()
          openCsOrderChat()
        } else {
          rechargeResult.value = res.data
          usdtDetailsPopupOpen.value = true
        }
      } catch (chatError) {
        console.error('Failed to fetch chat channel', chatError)
        rechargeResult.value = res.data
        usdtDetailsPopupOpen.value = true
      }

      activePreset.value = 0
      customAmount.value = ''
    } else if (res.code === 20066 || res.code === 90016) {
      // 仅客服支付方式：有订单审核中时提示「订单审核中」（其它支付方式不弹此提示）。
      showToast(t('ServerErrorCode_20066') || '订单审核中，请稍后再试')
    } else {
      alert(`Recharge failed: ${res.message}`)
    }
  } catch (e) {
    console.error('Failed to submit CS recharge', e)
    alert('Failed to submit recharge')
  }
}

async function onUsdtSubmit(type: number) {
  usdtPopupOpen.value = false

  const payTypes = filteredPayTypes.value
  const selectedPayType = payTypes[activeMethod.value]
  if (!selectedPayType) return

  const clubId = walletClubId.value

  // type 0: exact, 1: rounded
  let goldCount =
    type === 0
      ? usdtPopupProps.value.goldCount
      : Math.floor(usdtPopupProps.value.goldCount / 100) * 100

  let priceId = activePreset.value === -1 ? 0 : presets.value[activePreset.value]?.id ?? 0

  // 1. Unique-amount channel: server adjusts amount with a tail for payment matching
  if ((selectedPayType.increase_interval ?? 0) > 0) {
    try {
      const res = await postOrderUserRechargeNoApi(
        {
          amount: goldCount,
          pay_id: selectedPayType.id,
        },
        clubId,
        // 「订单审核中」提示只在客服撮合充值时弹出，其它充值方式静默处理。
        { suppressBusinessCodes: [20066, 90016] },
      )
      if (res.code === 0 && res.data) {
        goldCount = res.data.amount ?? goldCount
        priceId = res.data.price_id ?? 0
      }
    } catch (e) {
      console.error('Failed to get unique recharge amount', e)
    }
  }

  // 2. Calculate pay_price — fee only applied when fee_type === 2 (player pays)
  const priceData = walletStore.calculateUsdtPrice(
    goldCount,
    selectedPayType.rate ?? 1,
    selectedPayType.fee_rate ?? 0,
    usdtPopupProps.value.feeType,
    selectedPayType.discount ?? 0,
  )

  // 3. Submit recharge
  try {
    const res = await postRechargeGoldApi(
      {
        amount: goldCount,
        legal_tender: Math.round(priceData.totalUiPrice * 100),
        gold_type: 1,
        pay_id: selectedPayType.id,
        price_id: priceId,
        pay_price: priceData.apiPayPrice,
        pay_address: '',
        pay_address_save: false,
        order_no: '',
        name: 'USDT User',
      },
      clubId,
      // 「订单审核中」提示只在客服撮合充值时弹出，其它充值方式静默处理。
      { suppressBusinessCodes: [20066, 90016] },
    )

    if (res.code === 0 && res.data) {
      console.log('Recharge successful:', res.data)
      rechargeResult.value = res.data
      usdtDetailsPopupOpen.value = true

      // Reset selection state after success
      activePreset.value = 0
      customAmount.value = ''
    } else if (res.code === 20066) {
      // User has unfinished orders
      void checkUnfinishedOrders()
    } else {
      alert(`Recharge failed: ${res.message}`)
    }
  } catch (e) {
    console.error('Failed to submit recharge', e)
    alert('Failed to submit recharge')
  }
}
</script>

<template>
  <div
    v-if="isFixedDeposit"
    class="wallet-fixed-deposit-shell"
    :class="{ 'wallet-fixed-deposit-shell--channel': isChannelPackage }"
  >
    <FixedDepositPanel :club="walletClub" @back="handleWalletBack" />
  </div>

  <div
    v-else
    class="wallet-screen"
    :class="{ 'wallet-screen--channel': isChannelPackage }"
    :style="{ backgroundImage: `url(${mainBgUrl})` }"
  >
    <HeaderBack :title="t('Wallet_Title')" extra-padding @back="handleWalletBack" />

    <div class="wallet-screen__content-top">
      <div class="tabs-row">
        <SegmentedToggle v-model="activeTab" :tabs="tabLabels" />
      </div>
    </div>

    <div class="wallet-scrollable">
      <div class="wallet-screen__content">
        <UserCard
          class="wallet-banner"
          :avatar="ava1"
          name="Cooper&#10;Korsgaard"
          user-id="8677650585"
        >
          <template #actions>
            <GlassButton :label="$txt('Wallet_Records')" @click="openWalletChild('/wallet/orders')" />
            <GlassButton :label="$txt('Wallet_Details')" @click="openWalletChild('/wallet/details')" />
          </template>
          <template #extra>
            <div class="balance-row">
              <div class="balance-chip">
                <span class="balance-chip__value">
                  {{ (clubGold / 100).toFixed(2) }}
                </span>
                <img :src="icCoins" alt="" class="balance-chip__icon" />
              </div>
              <span class="balance-label">{{ $txt('Wallet_Balance') }}</span>
            </div>
          </template>
        </UserCard>

        <template v-if="activeTab === 0">
          <div class="recharge-content">
            <div class="presets-card">
              <PresetAmountGrid
                :presets="presets"
                :active-index="activePreset"
                @select="activePreset = $event"
                @custom="onCustom"
              />
            </div>

            <PaymentMethodStrip
              :methods="methods"
              :active-index="activeMethod"
              @select="activeMethod = $event"
            />
          </div>

          <div class="pay-cta-wrapper">
            <PrimaryButton
              :text="`${t('UIMineMallUSDTShop_PromptlyRechargeTip')} ${displayPayAmount}`"
              class="pay-cta"
              @click="onPayClick"
            />
          </div>
        </template>

        <template v-else>
          <WithdrawForm
            :club-id="walletClubId"
            :available-uc="clubGold"
            @open-cs-chat="onWithdrawCsChat"
            @withdrawn="fetchClubBalance"
          />
        </template>
      </div>
    </div>

    <NumericKeypad
      :open="keypadOpen"
      :show-input-area="true"
      @close="keypadOpen = false"
      @submit="onKeypadSubmit"
    />

    <CustomerServicePaymentPopup
      v-if="csPopupOpen"
      :gold-count="csPopupProps.goldCount"
      :rate="csPopupProps.rate"
      :fee-rate="csPopupProps.feeRate"
      :fee-type="csPopupProps.feeType"
      :discount="csPopupProps.discount"
      @close="csPopupOpen = false"
      @submit="onCsSubmit"
    />

    <UsdtPaymentPopup
      v-if="usdtPopupOpen"
      :gold-count="usdtPopupProps.goldCount"
      :rate="usdtPopupProps.rate"
      :fee-rate="usdtPopupProps.feeRate"
      :fee-type="usdtPopupProps.feeType"
      :discount="usdtPopupProps.discount"
      @close="usdtPopupOpen = false"
      @submit="onUsdtSubmit"
    />

    <OnlinePaymentPopup
      v-if="onlinePopupOpen"
      :gold-count="onlinePopupProps.goldCount"
      :rate="onlinePopupProps.rate"
      :fee-rate="onlinePopupProps.feeRate"
      :fee-type="onlinePopupProps.feeType"
      :discount="onlinePopupProps.discount"
      :pay-id="onlinePopupProps.payId"
      :price-id="onlinePopupProps.priceId"
      :initial-step="onlinePopupInitialData.step"
      :initial-order-no="onlinePopupInitialData.orderNo"
      :initial-qr-code="onlinePopupInitialData.qrCode"
      :initial-pay-address="onlinePopupInitialData.payAddress"
      @close="onlinePopupOpen = false"
      @success="handleOnlineSuccess"
      @unfinished-order="handleOnlineUnfinished"
    />

    <UnfinishedOrderPopup
      v-if="showUnfinishedPopup && unfinishedOrder"
      :order="unfinishedOrder"
      @close="showUnfinishedPopup = false"
      @cancel="handleCancelOrder(unfinishedOrder.order_no!)"
      @continue="handleUnfinishedContinue"
    />

    <UsdtPaymentDetailsPopup
      v-if="usdtDetailsPopupOpen && rechargeResult"
      :order-data="rechargeResult"
      :rate="usdtPopupProps.rate"
      :price="
        walletStore.formatUsdtPrice(
          Number(rechargeResult.order?.amount) ||
            Number(rechargeResult.pay_price) ||
            Number(rechargeResult.amount) ||
            walletStore.calculateUsdtPrice(
              usdtPopupProps.goldCount,
              usdtPopupProps.rate,
              usdtPopupProps.feeRate,
              usdtPopupProps.feeType,
              usdtPopupProps.discount,
            ).totalUiPrice,
        )
      "
      @close="usdtDetailsPopupOpen = false"
      @cancel="handleCancelOrder"
    />
  </div>

  <MainBottomTab v-if="isChannelPackage" />
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.wallet-screen {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  // Фон задаётся инлайном (:style), поэтому светлый перебиваем через !important.
  @include theme-light-own {
    background-image: url('@/assets/images/main_bg_light.webp') !important;

    // Шапка страницы (HeaderBack) на светлом фоне — тёмным.
    :deep(.back-trigger),
    :deep(.back-icon) {
      color: var(--wallet-l-text);
    }

    :deep(.title) {
      text-shadow: none;
    }
  }
}

.wallet-fixed-deposit-shell {
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.wallet-scrollable {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding-bottom: calc(env(safe-area-inset-bottom) + 0.64rem);
}

.wallet-screen--channel .wallet-scrollable,
.wallet-fixed-deposit-shell--channel :deep(.deposit-scrollable) {
  padding-bottom: calc(env(safe-area-inset-bottom) + 3.2rem);
}

.wallet-screen__content-top {
  padding: 0 0.455rem;
  margin-top: 0.2rem;
}

.wallet-screen__content {
  display: flex;
  flex-direction: column;
  gap: 0.26rem;
  padding: 0 0.455rem;
  margin-top: 0.2rem;
}

.tabs-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wallet-banner {
  margin: 0 22px;
  position: sticky;
  top: 0.2rem;
  z-index: 0;
}

.recharge-content {
  position: relative;
  z-index: 1;
  padding-bottom: 2.5rem;
}

.presets-card {
  position: relative;
  padding: 0.7rem 0.48rem 0.55rem;
  border: 0.016rem solid rgba(242, 242, 242, 0.3);
  border-radius: 0.94rem;
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  margin-top: -20px;
  z-index: 1;
  margin-bottom: 10px;

  @include theme-light-own {
    border-color: var(--wallet-l-border);
    background: var(--wallet-l-surface);
    box-shadow: 0 0.08rem 0.24rem rgba(70, 79, 88, 0.1);
  }
}

.presets-card::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(16.6px);
  -webkit-backdrop-filter: blur(16.6px);
  background: linear-gradient(
    107.6deg,
    rgba(249, 249, 249, 0.18) 12.3%,
    rgba(249, 249, 249, 0.24) 33.3%,
    rgba(147, 147, 147, 0.3) 85.1%
  );
  mix-blend-mode: hard-light;
  pointer-events: none;
  border-radius: inherit;
  z-index: 0;

  @include theme-light-own {
    background: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    mix-blend-mode: normal;
  }
}

.presets-card::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  box-shadow:
    inset 0 0 8.6px rgba(0, 0, 0, 1),
    inset 3.4px 2.6px 8.6px rgba(0, 0, 0, 0.1),
    inset 0 0 36.1px rgba(242, 242, 242, 0.3);
  z-index: 0;

  @include theme-light-own {
    box-shadow: none;
  }
}

.presets-card > * {
  position: relative;
  z-index: 1;
}

.balance-row {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.095rem;
  margin-top: 0.21rem;
  margin-bottom: 0.54rem;
  margin-left: 54px;
}

.balance-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.14rem;
  border-radius: 0.6rem;
  border: none;
  background: transparent;
  padding: 0.12rem 0.21rem 0.12rem 0.33rem;
  box-shadow: 0.014rem 0.017rem 0.027rem 0 rgba(0, 0, 0, 0.25);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    backdrop-filter: blur(3.7px);
    -webkit-backdrop-filter: blur(3.7px);
    background: linear-gradient(152.51deg, rgba(248, 253, 255, 0.8) 3.37%, rgba(199, 199, 199, 0.8) 37.46%);
    mix-blend-mode: hard-light;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    box-shadow: inset 0 0 0.069rem 0 rgba(242, 242, 242, 0.9);

    @include theme-light-own {
      box-shadow: inset 0 0 0 0.02rem var(--wallet-l-border);
    }
  }

  @include theme-light-own {
    box-shadow: none;

    &::before {
      background: var(--wallet-l-surface);
      mix-blend-mode: normal;
    }
  }
}

.balance-chip__value {
  position: relative;
  z-index: 1;
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: 0.43rem;
  color: #f9f9f9;
  line-height: 1.4;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }
}

.balance-chip__icon {
  position: relative;
  z-index: 1;
  width: 0.7rem;
  height: 0.7rem;
}

.balance-label {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: 0.24rem;
  color: #f8f8f8;

  @include theme-light-own {
    color: var(--wallet-l-text-muted);
  }
}

.pay-cta-wrapper {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 0.6rem);
  left: 0.455rem;
  width: calc(100% - 0.91rem);
  height: 1.47rem;
  z-index: 10;
}

.pay-cta {
  position: relative;
  width: 100% !important;
  height: 100% !important;
  border: 0.02rem solid rgba(249, 249, 249, 0.04) !important;
  border-radius: 1.08rem !important;
  background: rgba(170, 170, 170, 0.1) !important;
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0.0149rem rgba(255, 255, 255, 0.5);
    pointer-events: none;
  }

  :deep(.primary-btn__text) {
    color: #78e490;
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
      color: var(--wallet-l-on-accent);
    }
  }
}

.wallet-screen--channel .pay-cta {
  bottom: calc(env(safe-area-inset-bottom) + 2.82rem);
}
</style>
