<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
// Wallet avatar asset binding is intentionally disabled per the current
// design; keep this reference commented so the original implementation can
// be restored without deleting the asset path.
// import ava1 from '@/assets/images/wallet/avatars/ava1.png'
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
import OnlinePaymentPopup from '@/views/wallet/components/OnlinePaymentPopup.vue'
import CustomerServicePaymentPopup from '@/views/wallet/components/CustomerServicePaymentPopup.vue'
import { openCsOrderChat } from '@/components/GlobalCsOrderFloat/channel'
import FixedDepositPanel from '@/views/wallet/components/FixedDepositPanel.vue'
import MainBottomTab from '@/components/Tabbar/MainBottomTab.vue'
import {
  openGlobalCustomerServiceChat,
  type MatchSupportOrderMessagePayload,
} from '@/components/GlobalCustomerServiceChat/channel'
import { t, getLocale } from '@/i18n'
import { useWalletStore } from '@/stores/wallet'
import { useUserInfoStore } from '@/stores/userInfo'
import { useMainTabsStore } from '@/stores/mainTabs'
import { setH5Visible } from '@/bridge/channels/uiChannel'
import { isPrivateDomainMode } from '@/utils/channelPackage'
import {
  postOrderUserRechargeNoApi,
  postRechargeGoldApi,
  postClubFundOrderListApi,
  postOrderUserClubOrderCancelApi,
  postOrderClubOrderDetailApi,
} from '@/api/order'
import { postChatSupportChannelListApi } from '@/api/chat'
import { generateQrCodeUrl } from '@/utils/qrcode'
import { showToast } from 'vant'
import { postClubUserWalletApi } from '@/api/org'
import type { ClubFundOrderListOrderInfo } from '@/api/models/order'
import { useChannelBottomMenu } from '@/composables/useChannelBottomMenu'
import { useGameStore } from '@/stores/game'
import { requireRealUser, type PendingRealUserAction } from '@/session/realUserGate'

const router = useRouter()
const route = useRoute()
const walletStore = useWalletStore()
const userInfoStore = useUserInfoStore()
const tabsStore = useMainTabsStore()
const gameStore = useGameStore()
const isChannelPackage = isPrivateDomainMode()
const { isVersionB: isChannelMenuVersionB } = useChannelBottomMenu()

// Keep wallet fixed labels reactive when the language is changed in settings.
// Reading this computed inside the wrapper makes the dependency explicit even
// for template calls through Vue globalProperties.
const walletLocale = computed(() => getLocale())
function walletText(key: string): string {
  void walletLocale.value
  return t(key)
}

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
      userInfoStore.clubList.find((club) => Number(club.club_id) === directedClubId.value) ??
      (Number(userInfoStore.channelDefaultClub?.club_id) === directedClubId.value
        ? userInfoStore.channelDefaultClub
        : null)
    )
  }
  if (!gameStore.isRealUser) {
    return userInfoStore.channelDefaultClub
  }
  return (
    userInfoStore.currentClub ??
    userInfoStore.clubList[0] ??
    userInfoStore.channelDefaultClub ??
    null
  )
})
const walletClubId = computed(
  () => directedClubId.value ?? (Number(walletClub.value?.club_id) || undefined),
)
const walletBalance = computed(() => {
  if (!gameStore.isRealUser) return 0
  if (directedClubId.value) {
    return Number(walletClub.value?.user_gold ?? 0)
  }
  return Number(walletClub.value?.user_gold ?? userInfoStore.userInfo?.user?.gold ?? 0)
})
const hasConfiguredPayTypes = computed(
  () => (walletStore.goldPriceData?.pay_types?.length ?? 0) > 0,
)
const isFixedDeposit = computed(() => {
  if (!gameStore.isRealUser) {
    return false
  }
  if (walletClub.value?.deposit_switch === 2) {
    return !hasConfiguredPayTypes.value
  }
  return false
})
const walletUserName = computed(() => {
  if (!gameStore.isRealUser) return '--'
  const user = userInfoStore.userInfo?.user as Record<string, unknown> | undefined
  return String(user?.nickname || gameStore.loginNickname || gameStore.loginAccount || '--')
})
const walletUserId = computed(() => {
  if (!gameStore.isRealUser) return '--'
  const user = userInfoStore.userInfo?.user as Record<string, unknown> | undefined
  return String(user?.userid || user?.un_id || gameStore.loginUserId || '--')
})
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
const NO_PRESET = -2
const CUSTOM_PRESET = -1

// The wallet action buttons use the original Figma-exported filled arrow.
// Other GlassButton instances keep the shared stroked arrow implementation.
const walletActionArrowPath =
  'M0.25382 0.25382C0.0912997 0.416374 0 0.636825 0 0.866687C0 1.09655 0.0912997 1.317 0.25382 1.47955L4.54457 5.7703L0.25382 10.0611C0.100887 10.2253 0.0176379 10.4425 0.0215883 10.6669C0.0255387 10.8913 0.116381 11.1055 0.275001 11.2643C0.43362 11.4231 0.64765 11.5141 0.872057 11.5183C1.09646 11.5225 1.31375 11.4395 1.4782 11.2868L6.38249 6.38385C6.54501 6.22129 6.63631 6.00084 6.63631 5.77098C6.63631 5.54112 6.54501 5.32067 6.38249 5.15811L1.47955 0.25382C1.317 0.0912997 1.09655 0 0.866687 0C0.636824 0 0.416374 0.0912997 0.25382 0.25382Z'

const activePreset = ref(NO_PRESET)
const payCtaRef = ref<HTMLElement | null>(null)
const activeMethod = ref(0)
const keypadOpen = ref(false)
const customAmount = ref('')
const usdtPopupOpen = ref(false)
const usdtPopupProps = ref({
  goldCount: 0,
  usdtRate: 0,
  feeRate: 0,
  feeType: 0,
  discount: 0,
  uniqueAmountEnabled: false,
})
const usdtUniqueAmount = ref<{ amount: number; priceId: number } | null>(null)

const unfinishedOrder = ref<ClubFundOrderListOrderInfo | null>(null)
const showUnfinishedPopup = ref(false)

const usdtDetailsPopupOpen = ref(false)
const rechargeResult = ref<any>(null)

const csPopupOpen = ref(false)
const csPopupProps = ref({
  goldCount: 0,
  usdtRate: 0,
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
  paymentUrl: '',
})

function handleOnlineSuccess() {
  activePreset.value = NO_PRESET
  customAmount.value = ''
}

function handleOnlineUnfinished() {
  onlinePopupOpen.value = false
  void checkUnfinishedOrders()
}

const activeCsOrder = computed(() => {
  return activeTab.value === 0
    ? walletStore.pendingCsRechargeOrder
    : walletStore.pendingCsWithdrawOrder
})

const hasSeenRechargeNotification = ref(false)
const hasSeenWithdrawNotification = ref(false)

const currentHasSeen = computed(() => {
  return activeTab.value === 0
    ? hasSeenRechargeNotification.value
    : hasSeenWithdrawNotification.value
})

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function toFiniteNumber(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function toOrderTimestamp(value: unknown): number {
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.floor(numeric > 1_000_000_000_000 ? numeric / 1000 : numeric)
  }
  const parsed = Date.parse(String(value || ''))
  return Number.isFinite(parsed) && parsed > 0
    ? Math.floor(parsed / 1000)
    : Math.floor(Date.now() / 1000)
}

function buildMatchOrderMessage(
  orderData: Record<string, unknown>,
  subType: number,
): MatchSupportOrderMessagePayload {
  const order = asRecord(orderData.order)
  const addressInfo = asRecord(orderData.usdt_address)
  const user = asRecord(userInfoStore.userInfo?.user)
  const nickname = String(user.nickname || '-').trim() || '-'
  const displayId = firstPresent(user.userid, user.un_id, user.unid, user.random_id)
  const goldCents = toFiniteNumber(
    firstPresent(orderData.gold_num, order.gold_num, orderData.amount),
  )

  return {
    subType,
    userInfo: displayId ? `${nickname}/ID${String(displayId)}` : nickname,
    amount: goldCents / 100,
    payPrice: toFiniteNumber(
      firstPresent(orderData.pay_price, order.pay_price, order.amount, orderData.amount),
    ),
    typeName: String(
      firstPresent(addressInfo.name, orderData.pay_type_name, order.type_name) ||
        t('UIWallet_Text3'),
    ),
    orderNo: String(firstPresent(orderData.order_no, order.order_no) || ''),
    timestamp: toOrderTimestamp(
      firstPresent(orderData.timestamp, order.timestamp, orderData.create_time, order.create_time),
    ),
    address: String(
      firstPresent(
        orderData.address,
        addressInfo.address,
        order.address,
        orderData.pay_type_address,
      ) || '',
    ),
  }
}

async function openMatchOrderChat(
  orderData: Record<string, unknown>,
  subType: number,
): Promise<boolean> {
  try {
    const channelRes = await postChatSupportChannelListApi({
      im_service_types: [4],
      limit: 1,
      offset: 0,
    })
    const channel = channelRes.code === 0 ? channelRes.data?.list?.[0] : undefined
    if (!channel) return false

    openGlobalCustomerServiceChat({
      imServiceType: 4,
      clubId: Number(channel.club_id || walletClubId.value || 0),
      tribeId: Number(channel.tribe_id || 0),
      supportUserId: Number(channel.support_user_id || 0),
      orderMessage: buildMatchOrderMessage(orderData, subType),
    })
    return true
  } catch (error) {
    console.error('Failed to open matching-order customer service chat', error)
    return false
  }
}


function handleWalletBack(): void {
  if (isFromCocosTable.value) {
    setH5Visible(false)
  }
  router.back()
}

function openWalletChild(path: string): void {
  if (!requireRealUser(() => openWalletChild(path))) return
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
  if (!gameStore.isRealUser) return
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
  if (!requireRealUser(() => checkUnfinishedOrders(showPopup))) return
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
  if (!requireRealUser(() => handleCancelOrder(orderNo))) return
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
  if (!requireRealUser(() => handleUnfinishedContinue(order))) return
  showUnfinishedPopup.value = false

  let fullOrder = order
  if (order.order_no) {
    try {
      const res = await postOrderClubOrderDetailApi(
        { order_no: order.order_no },
        { suppressBusinessToast: true },
      )
      if (res.code === 0 && res.data?.order_detail) {
        fullOrder = { ...order, ...res.data.order_detail }
      }
    } catch (e) {
      console.error('Failed to fetch order detail for unfinished order', e)
    }
  }

  const paymentUrl = String(fullOrder.payment_url ?? fullOrder.pay_url ?? (fullOrder as any).payUrl ?? '')
  const payAddress = String(fullOrder.pay_type_address ?? fullOrder.pay_address ?? '')
  let qrCode = String((fullOrder as any).qrcode || fullOrder.qr_code || (fullOrder as any).pay_type_qr_code || '')

  const link = qrCode || paymentUrl || payAddress
  if (link) {
    try {
      qrCode = await generateQrCodeUrl(link, { size: 720, margin: 2 })
    } catch (e) {
      console.error('Failed to generate QR for unfinished order', e)
    }
  }

  const result = {
    order_no: fullOrder.order_no,
    gold_num: fullOrder.gold_num,
    pay_price: fullOrder.pay_price,
    order: {
      order_no: fullOrder.order_no,
      amount: fullOrder.pay_price,
      gold_num: fullOrder.gold_num,
    },
    usdt_address: {
      address: payAddress,
      qr_code: qrCode,
      name: (fullOrder as any).pay_type_name || t('UIWallet_Text3'),
    },
  }

  rechargeResult.value = result

  // 用 pay_id / pay_type_name 匹配真实支付类型：未完成 USDT 订单「继续支付」回到 USDT 弹窗，而非在线支付弹窗。
  const orderType = resolveOrderPayType(fullOrder)
  if (
    orderType === 3 ||
    (fullOrder as any).pay_type_name?.includes('撮合') ||
    (fullOrder as any).pay_type_name?.includes('客服') ||
    (fullOrder as any).pay_type_name?.toLowerCase().includes('cs') ||
    (fullOrder as any).pay_type_name?.toLowerCase().includes('service')
  ) {
    const opened = await openMatchOrderChat(result, 1)
    if (!opened) {
      walletStore.addOptimisticCsOrder(
        {
          order_no: String(fullOrder.order_no),
          gold_num: Number(fullOrder.gold_num) || 0,
          pay_price: Number(fullOrder.pay_price) || 0,
          pay_type_name: String((fullOrder as any).pay_type_name ?? '客服撮合'),
          create_time: String(fullOrder.create_time ?? ''),
          account_type: 0,
        } as ClubFundOrderListOrderInfo,
        Number((fullOrder as any).order_type) === 2 ? 'withdraw' : 'recharge',
      )
      await refreshPendingCsOrder()
      openCsOrderChat()
    }
  } else if (orderType === 1) {
    // Standard USDT flow
    usdtPopupProps.value.usdtRate =
      (fullOrder as any).usdt_rate || (fullOrder as any).exchange_rate || 1
    usdtDetailsPopupOpen.value = true
  } else {
    // 微信 / 支付宝 / 银行卡等在线支付（type 2、4-9）继续未完成订单
    onlinePopupProps.value = {
      goldCount: Number(fullOrder.gold_num) || 0,
      rate: (fullOrder as any).rate || (fullOrder as any).exchange_rate || 1,
      feeRate: (fullOrder as any).fee_rate || 0,
      feeType: (fullOrder as any).fee_type || 0,
      discount: (fullOrder as any).discount || 0,
      payId: (fullOrder as any).pay_id || (fullOrder as any).pay_type || 0,
      priceId: (fullOrder as any).price_id || 0,
    }
    onlinePopupInitialData.value = {
      step: 2,
      orderNo: fullOrder.order_no || '',
      qrCode: qrCode,
      payAddress: payAddress,
      paymentUrl: paymentUrl,
    }
    onlinePopupOpen.value = true
  }
}

watch(
  [walletClubId, () => gameStore.sessionToken, () => gameStore.isRealUser],
  ([clubId, sessionToken, isRealUser]) => {
    walletStore.clearCsOrders()
    if (!sessionToken) {
      walletStore.clearPriceList()
      unfinishedOrder.value = null
      return
    }
    void walletStore.loadPriceList(clubId)
    if (isRealUser) {
      void refreshPendingCsOrder()
    } else {
      unfinishedOrder.value = null
    }
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

type RechargeCategoryId = 'customer' | 'wallet' | 'alipay' | 'wechat' | 'usdt' | 'bankcard'

interface RechargeCategoryDefinition {
  id: RechargeCategoryId
  key: string
  fallback: string
}

const rechargeCategoryDefinitions: RechargeCategoryDefinition[] = [
  { id: 'usdt', key: 'Wallet_USDT', fallback: 'USDT' },
  { id: 'customer', key: 'Wallet_CsWithdraw', fallback: '客服' },
  { id: 'wallet', key: 'Wallet_Wallet', fallback: '钱包' },
  { id: 'alipay', key: 'Wallet_Alipay', fallback: '支付宝' },
  { id: 'wechat', key: 'Wallet_WeChat', fallback: '微信' },
  { id: 'bankcard', key: 'Wallet_BankCard', fallback: '银行卡' },
]

function classifyRechargeCategory(payType: any): RechargeCategoryId {
  const name = String(payType?.name ?? '').toLowerCase()
  if (Number(payType?.type) === 3 || /客服|customer|service|manual/.test(name)) {
    return 'customer'
  }
  if (/支付宝|alipay/.test(name)) return 'alipay'
  if (/微信|wechat|weixin/.test(name)) return 'wechat'
  if (/银行卡|bank[ -]?card|bankcard/.test(name)) return 'bankcard'
  if (Number(payType?.type) === 1 || /usdt|数字货币|crypto|trc|erc/.test(name)) {
    return 'usdt'
  }
  return 'wallet'
}

const rechargeCategories = computed(() => {
  const grouped = new Map<RechargeCategoryId, number[]>()
  filteredPayTypes.value.forEach((payType: any, index: number) => {
    const id = classifyRechargeCategory(payType)
    const indexes = grouped.get(id) ?? []
    indexes.push(index)
    grouped.set(id, indexes)
  })

  return rechargeCategoryDefinitions
    .map((definition) => ({
      ...definition,
      indexes: grouped.get(definition.id) ?? [],
      label: t(definition.key) === definition.key ? definition.fallback : t(definition.key),
    }))
    .filter((category) => category.indexes.length > 0)
})

const activeRechargeCategory = ref<RechargeCategoryId>('usdt')

const rechargeFilterScrollRef = ref<HTMLElement | null>(null)
const rechargeFilterTabRefs = ref<Record<string, HTMLElement | null>>({})
const canScrollRechargeLeft = ref(false)
const canScrollRechargeRight = ref(false)
const hasRechargeFilterOverflow = ref(false)

function setRechargeFilterTabRef(id: RechargeCategoryId, el: unknown): void {
  if (el) {
    rechargeFilterTabRefs.value[id] = el as HTMLElement
  } else {
    delete rechargeFilterTabRefs.value[id]
  }
}

function updateRechargeFilterScrollState(): void {
  const el = rechargeFilterScrollRef.value
  if (!el) return
  hasRechargeFilterOverflow.value = el.scrollWidth > el.clientWidth + 4
  canScrollRechargeLeft.value = el.scrollLeft > 4
  canScrollRechargeRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

function scrollRechargeFilterBy(delta: number): void {
  const el = rechargeFilterScrollRef.value
  if (!el) return
  el.scrollBy({ left: delta, behavior: 'smooth' })
}

function scrollRechargeFilterToActive(id: RechargeCategoryId): void {
  void nextTick(() => {
    const scrollEl = rechargeFilterScrollRef.value
    const tabEl = rechargeFilterTabRefs.value[id]
    if (scrollEl && tabEl) {
      const targetLeft = tabEl.offsetLeft - (scrollEl.clientWidth - tabEl.offsetWidth) / 2
      scrollEl.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
    }
    updateRechargeFilterScrollState()
  })
}

const visibleRechargeEntries = computed(() => {
  const all = filteredPayTypes.value.map((payType: any, index: number) => ({ payType, index }))
  const category = rechargeCategories.value.find(({ id }) => id === activeRechargeCategory.value)
  if (!category) return all
  return all.filter(({ index }) => category.indexes.includes(index))
})

const visibleRechargeMethods = computed<PaymentMethod[]>(() =>
  visibleRechargeEntries.value.map(({ payType }) => ({
    icon: payType.image ?? '',
    primary: payType.name ?? '',
    secondary: '',
  })),
)

const visibleRechargeActiveIndex = computed(() =>
  visibleRechargeEntries.value.findIndex(({ index }) => index === activeMethod.value),
)

function selectRechargeCategory(id: RechargeCategoryId): void {
  activeRechargeCategory.value = id
  const category = rechargeCategories.value.find((item) => item.id === id)
  const firstIndex = category?.indexes[0]
  if (firstIndex !== undefined) activeMethod.value = firstIndex
  scrollRechargeFilterToActive(id)
}

function selectRechargeMethod(index: number): void {
  const entry = visibleRechargeEntries.value[index]
  if (entry) activeMethod.value = entry.index
}

function ensureRechargeSelection(): void {
  const categories = rechargeCategories.value
  if (categories.length === 0) {
    // Keep the payment area in an explicitly unselected state while data is
    // empty; an async response will initialize the first available channel.
    activeMethod.value = -1
    return
  }

  // USDT is the product default when it is available. Otherwise use the
  // first category returned by the server.
  const category = categories.find(({ id }) => id === activeRechargeCategory.value)
    ?? categories.find(({ id }) => id === 'usdt')
    ?? categories[0]
  if (category.id !== activeRechargeCategory.value) {
    activeRechargeCategory.value = category.id
  }

  // Keep an existing valid user selection across duplicate/refresh responses.
  // If it is missing or belongs to another category, select that category's
  // first real payment channel so the card state matches the active category.
  if (!category.indexes.includes(activeMethod.value)) {
    activeMethod.value = category.indexes[0] ?? -1
  }
  void nextTick(updateRechargeFilterScrollState)
}

watch([rechargeCategories, filteredPayTypes], ensureRechargeSelection, { immediate: true })

onMounted(() => {
  void nextTick(updateRechargeFilterScrollState)
  window.addEventListener('resize', updateRechargeFilterScrollState)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateRechargeFilterScrollState)
})

watch(
  activeMethod,
  () => {
    activePreset.value = NO_PRESET
  },
  { immediate: true },
)

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
  const list = hasPriceList ? selected!.price_list! : (walletStore.goldPriceData?.list ?? [])

  const isUsdt = selected?.type === 1
  const usdtRate = selected?.usdt_rate ?? 1
  const feeRate = selected?.fee_rate ?? 0
  const feeType = selected?.fee_type ?? 0
  const discount = selected?.discount ?? 0

  return list.map((item: any) => {
    const goldCount = item.gold_count ?? 0
    const amountStr = String(goldCount / 100)
    let chipStr = (goldCount / 100).toLocaleString(undefined, { useGrouping: false })
    if (isUsdt) {
      chipStr = walletStore.formatUsdtPrice(
        walletStore.calculateRechargeUsdtPrice(goldCount, usdtRate, feeRate, feeType, discount)
          .totalUiPrice,
      )
    } else if (selected?.type === 3) {
      // Customer Service: show decimals
      const csPrice = walletStore.calculateCustomerServicePrice(
        goldCount,
        usdtRate,
        feeRate,
        discount,
      )
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

const activePayType = computed(() => filteredPayTypes.value[activeMethod.value])

const depositRange = computed(() => {
  const min = Number(activePayType.value?.user_recharge_min ?? 0) / 100
  const max = Number(activePayType.value?.user_recharge_max ?? 0) / 100
  return { min: min > 0 ? min : 0, max: max > 0 ? max : Infinity }
})

function formatLimit(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const keypadPlaceholder = computed(() => {
  const { min, max } = depositRange.value
  return Number.isFinite(max) ? `${formatLimit(min)} - ${formatLimit(max)}` : ''
})

function isDepositAmountInRange(amount: number): boolean {
  const { min, max } = depositRange.value
  if (!Number.isFinite(max)) return true
  return amount >= min && amount <= max
}

function showDepositRangeError(): void {
  const { min, max } = depositRange.value
  showToast(t('Wallet_AmountRangeError', formatLimit(min), formatLimit(max)))
}

function onKeypadSubmit(v: number): void {
  if (!isDepositAmountInRange(v)) {
    showDepositRangeError()
    return
  }
  customAmount.value = String(v)
  keypadOpen.value = false
  activePreset.value = CUSTOM_PRESET
  scrollPayCtaIntoView()
}

const hasSelection = computed(() => activePreset.value !== NO_PRESET)

const selectedAmount = computed(() => {
  if (activePreset.value === NO_PRESET) {
    return '0'
  }
  if (activePreset.value === CUSTOM_PRESET) {
    return customAmount.value || '0'
  }
  return presets.value[activePreset.value]?.amount || '0'
})

function scrollPayCtaIntoView(): void {
  void nextTick(() => {
    const el = payCtaRef.value
    const scroller = el?.closest('.wallet-scrollable') as HTMLElement | null
    if (!el || !scroller) return
    const clearance = parseFloat(getComputedStyle(scroller).paddingBottom) || 0
    const overflow =
      el.getBoundingClientRect().bottom + clearance - scroller.getBoundingClientRect().bottom
    if (overflow > 1) {
      scroller.scrollBy({ top: overflow, behavior: 'smooth' })
    }
  })
}

function onPresetSelect(index: number): void {
  activePreset.value = index
  scrollPayCtaIntoView()
}

const displayPayAmount = computed(() => {
  const payTypes = filteredPayTypes.value
  const selected = payTypes[activeMethod.value]
  const amount = Number(selectedAmount.value)

  if (selected?.type !== 3 && selected) {
    // USDT / 微信 / 支付宝 / 银行卡等在线支付
    const goldCount = amount * 100
    const usdtRate = selected.usdt_rate ?? 1
    const feeRate = selected.fee_rate ?? 0
    const feeType = selected.fee_type ?? 0
    const discount = selected.discount ?? 0
    return walletStore.formatUsdtPrice(
      walletStore.calculateRechargeUsdtPrice(goldCount, usdtRate, feeRate, feeType, discount)
        .totalUiPrice,
    )
  }

  if (selected?.type === 3) {
    // Customer Service: show decimals
    const goldCount = amount * 100
    const usdtRate = selected.usdt_rate ?? 1
    const feeRate = selected.fee_rate ?? 0
    const discount = selected.discount ?? 0
    const csPrice = walletStore.calculateCustomerServicePrice(
      goldCount,
      usdtRate,
      feeRate,
      discount,
    )
    return csPrice.toLocaleString(undefined, {
      useGrouping: false,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return selectedAmount.value
})

const payButtonText = computed(() =>
  hasSelection.value
    ? `${t('UIMineMallUSDTShop_PromptlyRechargeTip')} ${displayPayAmount.value}`
    : t('UIMineMallUSDTShop_PromptlyRechargeTip'),
)

const tabLabels = computed(() => [walletText('Wallet_Deposit'), walletText('Wallet_Withdraw')])

async function onPayClick() {
  if (!hasSelection.value) return
  if (!requireRealUser(resumeWalletPayAfterLogin)) return
  if (
    activePreset.value === CUSTOM_PRESET &&
    !isDepositAmountInRange(Number(selectedAmount.value))
  ) {
    showDepositRangeError()
    return
  }
  const payTypes = filteredPayTypes.value
  const selectedPayType = payTypes[activeMethod.value]

  if (selectedPayType?.type === 1) {
    let goldCount = Number(selectedAmount.value) * 100
    usdtUniqueAmount.value = null

    // Match the native client: obtain the server-generated tail before opening
    // the confirmation dialog, so +0.01 and similar unique amounts are visible.
    if ((selectedPayType.increase_interval ?? 0) > 0) {
      try {
        const res = await postOrderUserRechargeNoApi(
          {
            amount: goldCount,
            pay_id: selectedPayType.id,
          },
          walletClubId.value,
        )
        if (res.code === 0 && res.data?.amount != null) {
          goldCount = Number(res.data.amount)
          usdtUniqueAmount.value = {
            amount: goldCount,
            priceId: Number(res.data.price_id ?? 0),
          }
        } else {
          alert(res.message || 'Failed to get unique recharge amount')
          return
        }
      } catch (e) {
        console.error('Failed to get unique recharge amount', e)
        alert('Failed to get unique recharge amount')
        return
      }
    }

    usdtPopupProps.value = {
      goldCount,
      usdtRate: selectedPayType.usdt_rate ?? 1,
      feeRate: selectedPayType.fee_rate ?? 0,
      feeType: selectedPayType.fee_type ?? 0,
      discount: selectedPayType.discount ?? 0,
      uniqueAmountEnabled: (selectedPayType.increase_interval ?? 0) > 0,
    }
    usdtPopupOpen.value = true
  } else if (selectedPayType?.type === 3) {
    csPopupProps.value = {
      goldCount: Number(selectedAmount.value) * 100,
      usdtRate: selectedPayType.usdt_rate ?? 1,
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
      priceId:
        activePreset.value === CUSTOM_PRESET ? 0 : (presets.value[activePreset.value]?.id ?? 0),
    }
    onlinePopupInitialData.value = {
      step: 1,
      orderNo: '',
      qrCode: '',
      payAddress: '',
      paymentUrl: '',
    }
    onlinePopupOpen.value = true
  }
}

async function resumeWalletPayAfterLogin(): Promise<void> {
  await walletStore.loadPriceList(walletClubId.value)
  await onPayClick()
}

async function onWithdrawCsChat(orderData: Record<string, unknown>) {
  if (!requireRealUser(() => onWithdrawCsChat(orderData))) return
  const opened = await openMatchOrderChat(orderData, 2)
  if (!opened) {
    try {
      const channelRes = await postChatSupportChannelListApi({
        im_service_types: [4],
        limit: 1,
        offset: 0,
      })
      if (channelRes.code === 0 && channelRes.data?.list?.length) {
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
}

async function onCsSubmit() {
  if (!requireRealUser(onCsSubmit)) return
  csPopupOpen.value = false

  const payTypes = filteredPayTypes.value
  const selectedPayType = payTypes[activeMethod.value]
  if (!selectedPayType) return

  const clubId = walletClubId.value

  let goldCount = csPopupProps.value.goldCount
  const usdtRate = selectedPayType.usdt_rate ?? 1
  const feeRate = selectedPayType.fee_rate ?? 0
  const feeType = selectedPayType.fee_type ?? 0
  const discount = selectedPayType.discount ?? 0
  let priceId =
    activePreset.value === CUSTOM_PRESET ? 0 : (presets.value[activePreset.value]?.id ?? 0)

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
  const basePrice = usdtRate > 0 ? goldCount / 100 / usdtRate : 0
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
        use_usdt_rate: true,
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

      walletStore.addOptimisticCsOrder(
        {
          order_no: String(res.data.order_no || res.data.order?.order_no || ''),
          gold_num: Number(res.data.gold_num || res.data.amount || goldCount) || 0,
          pay_price: Number(res.data.pay_price || apiPayPrice) || 0,
          pay_type_name: String(res.data.usdt_address?.name || selectedPayType.name || '客服撮合'),
          create_time: String(res.data.create_time || ''),
          account_type: 0,
        } as ClubFundOrderListOrderInfo,
        'recharge',
      )

      openCsOrderChat()
      void refreshPendingCsOrder()

      activePreset.value = NO_PRESET
      customAmount.value = ''
    } else if (res.code === 20066 || res.code === 90016) {
      showToast(t('Wallet_OrderUnderReview'))
      await refreshPendingCsOrder()
      openCsOrderChat()
    } else {
      alert(`Recharge failed: ${res.message}`)
    }
  } catch (e) {
    console.error('Failed to submit CS recharge', e)
    alert('Failed to submit recharge')
  }
}

async function onUsdtSubmit(type: number) {
  if (!requireRealUser(() => onUsdtSubmit(type))) return
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

  let priceId =
    activePreset.value === CUSTOM_PRESET ? 0 : (presets.value[activePreset.value]?.id ?? 0)

  // The unique amount is fetched before the popup so the user can see its tail.
  if (type === 0 && usdtUniqueAmount.value) {
    goldCount = usdtUniqueAmount.value.amount
    priceId = usdtUniqueAmount.value.priceId
  }
  usdtPopupProps.value.goldCount = goldCount

  // 2. Calculate pay_price — fee only applied when fee_type === 2 (player pays)
  const priceData = walletStore.calculateRechargeUsdtPrice(
    goldCount,
    selectedPayType.usdt_rate ?? 1,
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
        use_usdt_rate: true,
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
      activePreset.value = NO_PRESET
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

function requestWalletAuth(action?: PendingRealUserAction): void {
  requireRealUser(action)
}
</script>

<template>
  <div
    v-if="isFixedDeposit"
    class="wallet-fixed-deposit-shell"
    :class="{ 'wallet-fixed-deposit-shell--channel': isChannelPackage }"
  >
    <FixedDepositPanel
      :club="walletClub"
      :show-back="!isChannelMenuVersionB"
      @back="handleWalletBack"
    />
  </div>

  <div
    v-else
    class="wallet-screen"
    :class="{ 'wallet-screen--channel': isChannelPackage }"
    :style="{ backgroundImage: `url(${mainBgUrl})` }"
  >
    <HeaderBack
      v-if="!isChannelPackage"
      :title="walletText('Wallet_Title')"
      :show-back="!isChannelMenuVersionB"
      extra-padding
      @back="handleWalletBack"
    />

    <div class="wallet-screen__content-top">
      <div class="tabs-row">
        <SegmentedToggle v-model="activeTab" :tabs="tabLabels" />
      </div>
    </div>

    <div class="wallet-scrollable">
      <div class="wallet-screen__content">
        <!-- Wallet avatar binding (:avatar="ava1") is intentionally disabled;
             UserCard keeps the shared avatar implementation for other pages. -->
        <UserCard
          class="wallet-banner"
          :class="`wallet-banner--locale-${walletLocale}`"
          :name="walletUserName"
          :user-id="walletUserId"
          :show-avatar="false"
        >
          <template #actions>
            <GlassButton
              :label="walletText('Wallet_Details')"
              variant="brand"
              :arrow-path="walletActionArrowPath"
              arrow-fill="#ffffff"
              @click="openWalletChild('/wallet/details')"
            />
            <GlassButton
              :label="walletText('Wallet_Records')"
              variant="brand"
              :arrow-path="walletActionArrowPath"
              arrow-fill="#ffffff"
              @click="openWalletChild('/wallet/orders')"
            />
          </template>
          <template #extra>
            <div class="balance-row">
              <div class="balance-chip">
                <span class="balance-chip__value">
                  {{ (clubGold / 100).toFixed(2) }}
                </span>
                <img :src="icCoins" alt="" class="balance-chip__icon" />
              </div>
              <span class="balance-label">{{ walletText('Wallet_Balance') }}</span>
            </div>
          </template>
        </UserCard>

        <template v-if="activeTab === 0">
          <div class="recharge-content">
            <div class="recharge-method-card">
              <div
                class="recharge-filter-bar"
                role="tablist"
                :aria-label="walletText('Wallet_Payment')"
              >
                <button
                  v-if="hasRechargeFilterOverflow && canScrollRechargeLeft"
                  type="button"
                  class="recharge-filter-arrow recharge-filter-arrow--left"
                  aria-label="Scroll left"
                  @click="scrollRechargeFilterBy(-120)"
                >
                  <svg width="10" height="10" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 1L2 6L7 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>

                <div
                  ref="rechargeFilterScrollRef"
                  class="recharge-filter-scroll"
                  @scroll.passive="updateRechargeFilterScrollState"
                >
                  <div class="recharge-filter-track">
                    <button
                      v-for="category in rechargeCategories"
                      :key="category.id"
                      :ref="(el) => setRechargeFilterTabRef(category.id, el)"
                      type="button"
                      class="recharge-filter"
                      :class="{ 'recharge-filter--active': category.id === activeRechargeCategory }"
                      role="tab"
                      :aria-selected="category.id === activeRechargeCategory"
                      @click="selectRechargeCategory(category.id)"
                    >
                      {{ category.label }}
                    </button>
                  </div>
                </div>

                <button
                  v-if="hasRechargeFilterOverflow && canScrollRechargeRight"
                  type="button"
                  class="recharge-filter-arrow recharge-filter-arrow--right"
                  aria-label="Scroll right"
                  @click="scrollRechargeFilterBy(120)"
                >
                  <svg width="10" height="10" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>

              <PaymentMethodStrip
                :methods="visibleRechargeMethods"
                :active-index="visibleRechargeActiveIndex"
                @select="selectRechargeMethod"
              />
            </div>

            <div class="presets-card">
              <h2 class="presets-card__title">{{ walletText('Wallet_DepositAmount') }}</h2>
              <PresetAmountGrid
                :presets="presets"
                :active-index="activePreset"
                @select="onPresetSelect"
                @custom="onCustom"
              />
            </div>

            <div ref="payCtaRef" class="pay-cta-wrapper">
              <PrimaryButton
                :text="payButtonText"
                :disabled="!hasSelection"
                class="pay-cta"
                @click="onPayClick"
              />
            </div>
          </div>
        </template>

        <template v-else>
          <WithdrawForm
            :club-id="walletClubId"
            :available-uc="clubGold"
            :balance="walletBalance"
            :preview="!gameStore.isRealUser"
            @open-cs-chat="onWithdrawCsChat"
            @require-auth="requestWalletAuth"
            @withdrawn="fetchClubBalance"
          />
        </template>
      </div>
    </div>

    <NumericKeypad
      :open="keypadOpen"
      :show-input-area="true"
      :placeholder="keypadPlaceholder"
      @close="keypadOpen = false"
      @submit="onKeypadSubmit"
    />

    <CustomerServicePaymentPopup
      v-if="csPopupOpen"
      :gold-count="csPopupProps.goldCount"
      :rate="csPopupProps.usdtRate"
      :fee-rate="csPopupProps.feeRate"
      :fee-type="csPopupProps.feeType"
      :discount="csPopupProps.discount"
      @close="csPopupOpen = false"
      @submit="onCsSubmit"
    />

    <UsdtPaymentPopup
      v-if="usdtPopupOpen"
      :gold-count="usdtPopupProps.goldCount"
      :rate="usdtPopupProps.usdtRate"
      :fee-rate="usdtPopupProps.feeRate"
      :fee-type="usdtPopupProps.feeType"
      :discount="usdtPopupProps.discount"
      :unique-amount-enabled="usdtPopupProps.uniqueAmountEnabled"
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
      :initial-payment-url="onlinePopupInitialData.paymentUrl"
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
      :rate="usdtPopupProps.usdtRate"
      :fee-rate="usdtPopupProps.feeRate"
      :fee-type="usdtPopupProps.feeType"
      :price="
        walletStore.formatUsdtPrice(
          Number(rechargeResult.order?.amount) ||
            Number(rechargeResult.pay_price) ||
            Number(rechargeResult.amount) ||
            walletStore.calculateRechargeUsdtPrice(
              usdtPopupProps.goldCount,
              usdtPopupProps.usdtRate,
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
  touch-action: pan-y;
  overscroll-behavior: contain;
  padding-bottom: calc(env(safe-area-inset-bottom) + 0.4rem);
}

.wallet-screen--channel .wallet-scrollable,
.wallet-fixed-deposit-shell--channel :deep(.deposit-scrollable) {
  padding-bottom: calc(env(safe-area-inset-bottom) + 3.2rem);
}

.wallet-screen--channel .wallet-screen__content-top {
  margin-top: calc(env(safe-area-inset-top, 0px) + 0.35rem);
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
  margin: 0;
  position: sticky;
  top: 0.2rem;
  z-index: 0;
}

/* The compact wallet card follows the mobile reference's three-column layout:
   profile details | live balance | actions. The shared avatar rendering is
   intentionally hidden on wallet pages; UserCard keeps it for other variants. */
.wallet-banner.usercard--compact {
  display: grid;
  // Figma action group: 131.70px at the 440px reference viewport (3rem here).
  // The extra right padding keeps the group inside the card instead of clipping
  // the right arrow when the two 62.92px buttons are rendered side by side.
  grid-template-columns: minmax(1.6rem, 1fr) auto max-content;
  align-items: center;
  column-gap: 0.16rem;
  padding-right: 0.39rem;
}

.wallet-banner.usercard--compact :deep(.usercard__head) {
  display: contents;
}

.wallet-banner.usercard--compact :deep(.usercard__info) {
  grid-column: 1;
  grid-row: 1;
  min-width: 0;
  align-items: flex-start;
  justify-content: center;
  text-align: left;
  overflow: hidden;
}

.wallet-banner.usercard--compact :deep(.usercard__name) {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.wallet-banner.usercard--compact :deep(.usercard__id) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  justify-content: flex-start;
  text-align: left;
}

.wallet-banner.usercard--compact :deep(.usercard__id-value) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallet-banner.usercard--compact .balance-row {
  position: static;
  grid-column: 2;
  grid-row: 1;
  justify-self: center;
  width: max-content;
  min-width: 2rem;
  margin: 0;
  padding: 0 0.18rem;
  transform: none;
  border-left: 1px solid rgba(255, 255, 255, 0.16);
  border-right: 1px solid rgba(255, 255, 255, 0.16);

  @include theme-light-own {
    border-color: rgba(0, 0, 0, 0.08);
  }
}

.wallet-banner.usercard--compact :deep(.usercard__actions) {
  grid-column: 3;
  grid-row: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: stretch;
  gap: 0.14rem;
  width: max-content;
  max-width: 100%;
  margin: 0;
  align-self: center;
}

.wallet-banner.usercard--compact :deep(.usercard__actions .gb) {
  width: max-content;
  min-width: 0;
  flex: 0 0 auto;
  min-width: 1.43rem;
  gap: 0.18rem;
  padding: 0.198rem 0.142rem 0.198rem 0.197rem;
  border-radius: 0.475rem;
}

.wallet-banner.usercard--compact :deep(.usercard__actions .gb__arrow) {
  // Figma export canvas is 7x12; retain its viewBox whitespace and scale the
  // canvas, rather than shrinking the already-tight filled path itself.
  width: 0.159rem;
  height: 0.273rem;
}

.wallet-banner.usercard--compact :deep(.usercard__actions .gb__label) {
  // Figma: 16.73px/500/95% at the 440px reference width.
  font-size: 0.38rem !important;
  font-weight: 500 !important;
  line-height: 0.95 !important;
}

// Long fixed translations must not squeeze the user identity column or hide
// the arrow. A small, language-specific reduction keeps the same visual scale
// while leaving the original business text intact.
.wallet-banner.usercard--compact:is(
  .wallet-banner--locale-en,
  .wallet-banner--locale-de,
  .wallet-banner--locale-es,
  .wallet-banner--locale-fr,
  .wallet-banner--locale-hi,
  .wallet-banner--locale-it,
  .wallet-banner--locale-ja,
  .wallet-banner--locale-ko,
  .wallet-banner--locale-pt,
  .wallet-banner--locale-ru,
  .wallet-banner--locale-th,
  .wallet-banner--locale-vi
) :deep(.usercard__actions .gb__label) {
  font-size: 0.34rem !important;
}

// Russian “Подробности” is the longest action label in the supplied bundle;
// this small additional reduction restores the same right-side card breathing
// room without clipping the label or its arrow.
.wallet-banner.usercard--compact.wallet-banner--locale-ru
  :deep(.usercard__actions .gb__label) {
  font-size: 0.3rem !important;
}

// 钱包页操作按钮遵循主题色：深色红底、浅色绿底，文字始终白色。
.wallet-banner.usercard--compact :deep(.usercard__actions .gb--brand),
.wallet-banner.usercard--compact :deep(.usercard__actions .gb--brand .gb__blur) {
  background: var(--wallet-grad-primary) !important;
  mix-blend-mode: normal;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.wallet-banner.usercard--compact :deep(.usercard__actions .gb--brand .gb__label) {
  color: #ffffff !important;
}

@include theme-light-own {
  .wallet-banner.usercard--compact :deep(.usercard__actions .gb--brand),
  .wallet-banner.usercard--compact :deep(.usercard__actions .gb--brand .gb__blur) {
    background: var(--wallet-l-accent) !important;
  }
}

.recharge-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.recharge-method-card {
  position: relative;
  padding: 0.2rem 0.22rem 0.24rem;
  border: 0.016rem solid rgba(242, 242, 242, 0.3);
  border-radius: 0.72rem;
  box-shadow: 0.06rem 0.08rem 0.2rem rgba(0, 0, 0, 0.24);
  overflow: hidden;

  @include theme-light-own {
    border-color: var(--wallet-l-border);
    background: var(--wallet-l-surface);
    box-shadow: 0 0.06rem 0.16rem rgba(70, 79, 88, 0.1);
  }
}

.recharge-filter-bar {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 0.9rem;
  padding: 0;
  margin-bottom: 0.14rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.32);
  overflow: hidden;

  @include theme-light-own {
    background: var(--wallet-l-surface-soft);
  }
}

.recharge-filter-scroll {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.11rem 0.04rem;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    display: none;
  }

}

.recharge-filter-track {
  display: inline-flex;
  align-items: center;
  gap: 0.04rem;
  min-width: max-content;
}

.recharge-filter-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.52rem;
  height: 0.52rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  transition: opacity 0.2s;

  &:active {
    opacity: 0.8;
  }

  &--left {
    left: 0.08rem;
  }

  &--right {
    right: 0.08rem;
  }

  @include theme-light-own {
    background: rgba(255, 255, 255, 0.9);
    color: #333333;
  }
}

.recharge-filter {
  flex: 0 0 auto;
  height: 0.68rem;
  padding: 0 0.26rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.86);
  font-family: var(--wallet-font-cn);
  // Figma: 14.08px at the 440px reference width; 430px scales to
  // approximately 13.76px.
  font-size: 0.32rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;

  @include theme-light-own {
    color: var(--wallet-l-text);

    // 选中项在亮色主题中仍使用白色文字，确保与红色选中背景保持对比度。
    &.recharge-filter--active {
      color: #ffffff;
    }
  }
}

.recharge-filter--active {
  background: #ef3955;
  color: #ffffff;
  font-weight: 600;
}

.presets-card {
  position: relative;
  padding: 0.24rem 0.22rem 0.28rem;
  border: 0.016rem solid rgba(242, 242, 242, 0.3);
  border-radius: 0.72rem;
  box-shadow: 0.06rem 0.08rem 0.2rem rgba(0, 0, 0, 0.24);
  overflow: hidden;
  margin-top: 0;
  z-index: 1;

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

.presets-card__title {
  margin: 0 0 0.14rem;
  font-family: var(--wallet-font-cn);
  // Figma Deposit Amount: 17.51px/700 at the 440px reference width.
  font-size: 0.4rem;
  font-weight: 700;
  line-height: 1.2;
  color: #ffffff;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }
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
  gap: 0.08rem;
  border-radius: 0.45rem;
  border: none;
  background: transparent;
  padding: 0.08rem 0.12rem 0.08rem 0.16rem;
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
      // Figma uses a soft grey balance capsule, not a second white card.
      background: rgba(241, 243, 245, 0.96);
      mix-blend-mode: normal;
    }

    &::after {
      box-shadow: none;
    }
  }
}

.balance-chip__value {
  position: relative;
  z-index: 1;
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: 0.35rem;
  color: #f9f9f9;
  line-height: 1.4;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }
}

.balance-chip__icon {
  position: relative;
  z-index: 1;
  width: 0.46rem;
  height: 0.46rem;
}

.balance-label {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: 0.2rem;
  color: #f8f8f8;

  @include theme-light-own {
    color: var(--wallet-l-text-muted);
  }
}

.pay-cta-wrapper {
  position: relative;
  width: 100%;
  height: 1.28rem;
  margin-top: 0.02rem;
  z-index: 1;
}

.pay-cta {
  position: relative;
  width: 100% !important;
  height: 100% !important;
  border: 0.02rem solid rgba(249, 249, 249, 0.04) !important;
  border-radius: 1.08rem !important;
  background: var(--wallet-grad-primary) !important;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0.0149rem rgba(255, 255, 255, 0.5);
    pointer-events: none;
  }

  :deep(.primary-btn__text) {
    color: #ffffff !important;
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
      color: #ffffff !important;
    }
  }
}
</style>
