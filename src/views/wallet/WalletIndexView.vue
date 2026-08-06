<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ava1 from '@/assets/images/wallet/avatars/ava1.png'
import icCoins from '@/assets/icons/wallet/ic_coins.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import SegmentedToggle from '@/views/wallet/components/SegmentedToggle.vue'
import UserCard from '@/views/wallet/components/UserCard.vue'
import GlassButton from '@/components/Button/GlassButton.vue'
import BellButton from '@/components/Button/BellButton.vue'
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
import FixedDepositPanel from '@/views/wallet/components/FixedDepositPanel.vue'
import MainBottomTab from '@/components/Tabbar/MainBottomTab.vue'
import {
  openGlobalCustomerServiceChat,
  type MatchSupportOrderMessagePayload,
} from '@/components/GlobalCustomerServiceChat/channel'
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
const walletBalance = computed(() => {
  if (directedClubId.value) {
    return Number(walletClub.value?.user_gold ?? 0)
  }
  return Number(walletClub.value?.user_gold ?? userInfoStore.userInfo?.user?.gold ?? 0)
})
const isFixedDeposit = computed(() => walletClub.value?.deposit_switch === 2)
const isFromCocosTable = computed(() => {
  const raw = Array.isArray(route.query.from) ? route.query.from[0] : route.query.from
  return raw === 'cocos-table'
})
const isFromMttRegistration = computed(() => {
  const raw = Array.isArray(route.query.from) ? route.query.from[0] : route.query.from
  return raw === 'mtt-registration'
})

const activeTab = ref(0)
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
  const goldCents = toFiniteNumber(firstPresent(orderData.gold_num, order.gold_num, orderData.amount))

  return {
    subType,
    userInfo: displayId ? `${nickname}/ID${String(displayId)}` : nickname,
    amount: goldCents / 100,
    payPrice: toFiniteNumber(
      firstPresent(orderData.pay_price, order.pay_price, order.amount, orderData.amount),
    ),
    typeName: String(
      firstPresent(addressInfo.name, orderData.pay_type_name, order.type_name) || t('UIWallet_Text3'),
    ),
    orderNo: String(firstPresent(orderData.order_no, order.order_no) || ''),
    timestamp: toOrderTimestamp(
      firstPresent(orderData.timestamp, order.timestamp, orderData.create_time, order.create_time),
    ),
    address: String(
      firstPresent(orderData.address, addressInfo.address, order.address, orderData.pay_type_address) ||
        '',
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

async function refreshPendingCsOrder() {
  await walletStore.refreshPendingCsOrder(walletClubId.value)
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

async function openCsChat() {
  if (activeTab.value === 0) hasSeenRechargeNotification.value = true
  else hasSeenWithdrawNotification.value = true

  if (!activeCsOrder.value) return

  const order = activeCsOrder.value
  const qrCode =
    (order as any).qrcode || (order as any).qr_code || (order as any).pay_type_qr_code || ''
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

  await openMatchOrderChat(result, activeTab.value === 0 ? 1 : 2)
}

async function checkUnfinishedOrders(showPopup = true) {
  const clubId = walletClubId.value

  try {
    const res = await postClubFundOrderListApi(
      {
        order_type: 1, // Recharge
        my_order: true,
        limit: 1,
        offset: 0,
        status: 1, // Pending
      },
      clubId,
    )

    if (res.code === 0 && res.data?.list?.length) {
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

  const qrCode =
    (order as any).qrcode || (order as any).qr_code || (order as any).pay_type_qr_code || ''
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

  // If it's a Customer Service order (Type 3 or api_type 3), open Chat Popup
  const orderType = (order as any).pay_type || (order as any).api_type || (order as any).type
  if (orderType === 3 || (order as any).pay_type_name?.includes(t('UIWallet_Text4'))) {
    const opened = await openMatchOrderChat(result, 1)
    if (!opened) {
      // Fallback to USDT details if no chat channel found
      usdtPopupProps.value.rate = (order as any).rate || (order as any).exchange_rate || 1
      usdtDetailsPopupOpen.value = true
    }
  } else {
    // Standard USDT flow
    usdtPopupProps.value.rate = (order as any).rate || (order as any).exchange_rate || 1
    usdtDetailsPopupOpen.value = true
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
  (walletStore.goldPriceData?.pay_types ?? []).filter((pt) => pt.type === 1 || pt.type === 3),
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

  const isUsdt = selected?.type === 1
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

  if (selected?.type === 1) {
    // USDT
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
  }
}

async function onWithdrawCsChat(orderData: Record<string, unknown>) {
  await openMatchOrderChat(orderData, 2)
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
    )

    if (res.code === 0 && res.data) {
      rechargeResult.value = res.data

      const opened = await openMatchOrderChat(
        {
          ...res.data,
          gold_num: goldCount,
          pay_price: apiPayPrice,
        },
        1,
      )
      if (opened) {
        await refreshPendingCsOrder()
      } else {
        rechargeResult.value = res.data
        usdtDetailsPopupOpen.value = true
      }

      activePreset.value = 0
      customAmount.value = ''
    } else if (res.code === 20066 || res.code === 90016) {
      void checkUnfinishedOrders()
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

  <div v-else class="wallet-screen" :class="{ 'wallet-screen--channel': isChannelPackage }">
    <HeaderBack :title="t('Wallet_Title')" extra-padding @back="handleWalletBack" />

    <div class="wallet-screen__content-top">
      <div class="tabs-row">
        <SegmentedToggle v-model="activeTab" :tabs="tabLabels" />
        <BellButton
          v-if="activeCsOrder"
          :count="1"
          :show-badge="!currentHasSeen"
          class="floating-bell"
          @click="openCsChat"
        />
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
            <GlassButton
              :label="$txt('Wallet_Records')"
              variant="brand"
              @click="openWalletChild('/wallet/orders')"
            />
            <GlassButton
              :label="$txt('Wallet_Details')"
              variant="brand"
              @click="openWalletChild('/wallet/details')"
            />
          </template>
          <template #extra>
            <div class="balance-row">
              <div class="balance-chip">
                <span class="balance-chip__value">
                  {{ walletBalance.toLocaleString() }}
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

          <PrimaryButton
            :text="t('UIMineMallUSDTShop_PromptlyRechargeTip') + ' ' + (displayPayAmount)"
            class="pay-cta"
            @click="onPayClick"
          />
        </template>

        <template v-else>
          <WithdrawForm
            :club-id="walletClubId"
            :balance="walletBalance"
            @open-cs-chat="onWithdrawCsChat"
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
  background-image: url('@/assets/images/main_bg.webp');

  @include theme-light {
    background-color: #f3f4f6;
    background-image: url('@/assets/images/main_bg_light.png');
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

.floating-bell {
  position: fixed;
  right: 0.03rem;
  top: 2.4rem;
  z-index: 1000;
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
  background: rgba(0, 0, 0, 0.01);
  backdrop-filter: blur(16.6px);
  -webkit-backdrop-filter: blur(16.6px);
  border: 0.18px solid rgba(255, 255, 255, 0.3);
  border-radius: 1rem;
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  margin-top: -20px;
  z-index: 1;
  margin-bottom: 10px;

  @include theme-light {
    background: #fff;
    border-color: rgba(242, 242, 242, 0.7);
    box-shadow:
      3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25),
      inset 3.4px 2.6px 8.6px rgba(0, 0, 0, 0.1),
      inset 0 0 36px 6px rgba(242, 242, 242, 0.3);
  }
}

.presets-card::before {
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
  display: inline-flex;
  align-items: center;
  gap: 0.14rem;
  background: rgba(0, 0, 0, 0.22);
  border: 0.4px solid rgba(242, 242, 242, 0.4);
  border-radius: 0.4rem;
  padding: 0.18rem 0.21rem 0.18rem 0.33rem;
  box-shadow: 0.8px 1px 1.6px rgba(0, 0, 0, 0.25);
  height: 0.85rem;

  @include theme-light {
    background: rgba(34, 34, 34, 0.34);
    border-color: rgba(242, 242, 242, 0.4);
  }
}

.balance-chip__value {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: 0.43rem;
  color: #f9f9f9;
  line-height: 1.4;
}

.balance-chip__icon {
  width: 0.7rem;
  height: 0.7rem;
}

.balance-label {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: 0.24rem;
  color: #f8f8f8;

  @include theme-light {
    color: #222;
  }
}

.pay-cta {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 0.6rem);
  left: 0.455rem;
  width: calc(100% - 0.91rem);
  z-index: 10;
}

.wallet-screen--channel .pay-cta {
  bottom: calc(env(safe-area-inset-bottom) + 2.82rem);
}
</style>
