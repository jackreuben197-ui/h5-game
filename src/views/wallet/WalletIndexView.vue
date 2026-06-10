<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import ava1 from '@/assets/images/wallet/avatars/ava1.png'
import icCoins from '@/assets/icons/wallet/ic_coins.png'
import AppBar from '@/components/wallet/AppBar.vue'
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
import CustomerServiceChatPopup from '@/views/wallet/components/CustomerServiceChatPopup.vue'
import FixedDepositPanel from '@/views/wallet/components/FixedDepositPanel.vue'
import { t } from '@/i18n'
import { useWalletStore } from '@/stores/wallet'
import { useUserInfoStore } from '@/stores/userInfo'
import {
  postOrderUserRechargeNoApi,
  postRechargeGoldApi,
  postClubFundOrderListApi,
  postOrderUserClubOrderCancelApi,
} from '@/api/order'
import { postChatSupportChannelListApi } from '@/api/chat'
import type { ClubFundOrderListOrderInfo } from '@/api/models/order'

const router = useRouter()
const walletStore = useWalletStore()
const userInfoStore = useUserInfoStore()

// deposit_switch: 1 = deposit-free (normal wallet UI); 2 = fixed-deposit (simplified apply-recharge UI)
const isFixedDeposit = computed(
  () => (userInfoStore.currentClub ?? userInfoStore.clubList[0])?.deposit_switch === 2,
)

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

const csChatPopupOpen = ref(false)
const csChatProps = ref({
  tribeId: 0,
  supportUserId: 0,
  orderData: null as any,
})

const activeCsOrder = computed(() => {
  return activeTab.value === 0
    ? walletStore.pendingCsRechargeOrder
    : walletStore.pendingCsWithdrawOrder
})

const activeCsCount = computed(() => {
  return activeTab.value === 0
    ? walletStore.pendingCsRechargeCount
    : walletStore.pendingCsWithdrawCount
})

const hasSeenRechargeNotification = ref(false)
const hasSeenWithdrawNotification = ref(false)

const currentHasSeen = computed(() => {
  return activeTab.value === 0
    ? hasSeenRechargeNotification.value
    : hasSeenWithdrawNotification.value
})

let refreshInterval: any = null

async function refreshPendingCsOrder() {
  // We keep this method for manual refreshes within this view (e.g. after cancel/submit)
  // but we will no longer run it on a 10s interval here as requested.
  await walletStore.refreshPendingCsOrder()
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
      name: (order as any).pay_type_name || '客服撮合',
    },
  }

  try {
    const channelRes = await postChatSupportChannelListApi({
      im_service_types: [4],
      limit: 1,
      offset: 0,
    })

    if (channelRes.code === 0 && channelRes.data?.list?.length) {
      const channel = channelRes.data.list[0]
      const orders =
        activeTab.value === 0
          ? walletStore.pendingCsRechargeOrders
          : walletStore.pendingCsWithdrawOrders

      csChatProps.value = {
        tribeId: channel.tribe_id || 0,
        supportUserId: channel.support_user_id || 0,
        orderData: result,
      }
      csChatPopupOpen.value = true
    }
  } catch (e) {
    console.error('Failed to open CS chat from bell', e)
  }
}

async function checkUnfinishedOrders(showPopup = true) {
  const currentClub = userInfoStore.currentClub ?? userInfoStore.clubList[0]
  const clubId = currentClub?.club_id ? Number(currentClub.club_id) : undefined

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
    const res = await postOrderUserClubOrderCancelApi({ order_no: orderNo })
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
      name: (order as any).pay_type_name || '客服撮合',
    },
  }

  rechargeResult.value = result

  // If it's a Customer Service order (Type 3 or api_type 3), open Chat Popup
  const orderType = (order as any).pay_type || (order as any).api_type || (order as any).type
  if (orderType === 3 || (order as any).pay_type_name?.includes('撮合')) {
    try {
      const channelRes = await postChatSupportChannelListApi({
        im_service_types: [4],
        limit: 1,
        offset: 0,
      })

      if (channelRes.code === 0 && channelRes.data?.list?.length) {
        const channel = channelRes.data.list[0]
        csChatProps.value = {
          tribeId: channel.tribe_id || 0,
          supportUserId: channel.support_user_id || 0,
          orderData: result,
        }
        csChatPopupOpen.value = true
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
  } else {
    // Standard USDT flow
    usdtPopupProps.value.rate = (order as any).rate || (order as any).exchange_rate || 1
    usdtDetailsPopupOpen.value = true
  }
}

onMounted(() => {
  // We no longer check for unfinished orders on mount.
  // It will be checked only when a recharge attempt fails with code 20066.
  refreshPendingCsOrder()
  // 10s Interval removed as requested. Visibility will be handled by external calls.
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})

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
  try {
    const channelRes = await postChatSupportChannelListApi({
      im_service_types: [4],
      limit: 1,
      offset: 0,
    })
    if (channelRes.code === 0 && channelRes.data?.list?.length) {
      const channel = channelRes.data.list[0]
      csChatProps.value = {
        tribeId: channel.tribe_id || 0,
        supportUserId: channel.support_user_id || 0,
        orderData,
      }
      csChatPopupOpen.value = true
    }
  } catch (e) {
    console.error('Failed to fetch chat channel for withdraw', e)
  }
}

async function onCsSubmit(displayPayPrice?: number) {
  csPopupOpen.value = false

  const payTypes = filteredPayTypes.value
  const selectedPayType = payTypes[activeMethod.value]
  if (!selectedPayType) return

  const currentClub = userInfoStore.currentClub ?? userInfoStore.clubList[0]
  const clubId = currentClub?.club_id ? Number(currentClub.club_id) : undefined

  let goldCount = csPopupProps.value.goldCount
  const rate = selectedPayType.rate ?? 1
  const feeRate = selectedPayType.fee_rate ?? 0
  const feeType = selectedPayType.fee_type ?? 0
  const discount = selectedPayType.discount ?? 0
  let priceId = activePreset.value === -1 ? 0 : presets.value[activePreset.value]?.id ?? 0

  // 1. Unique-amount channel: server adjusts amount with a tail for payment matching
  let isUniqueAmount = false
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
        isUniqueAmount = true
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

  // legal_tender = what the player actually pays, in cents (same logic as pay_price)
  const playerPrice = isUniqueAmount
    ? walletStore.calculateCustomerServicePrice(goldCount, rate, feeRate, discount)
    : displayPayPrice ??
      walletStore.calculateCustomerServicePrice(goldCount, rate, feeRate, discount)
  const legalTender = Math.round(playerPrice * 100)

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

      try {
        const channelRes = await postChatSupportChannelListApi({
          im_service_types: [4],
          limit: 1,
          offset: 0,
        })

        if (channelRes.code === 0 && channelRes.data?.list?.length) {
          const channel = channelRes.data.list[0]
          csChatProps.value = {
            tribeId: channel.tribe_id || 0,
            supportUserId: channel.support_user_id || 0,
            orderData: {
              ...res.data,
              gold_num: goldCount,
              pay_price: apiPayPrice,
            },
          }
          csChatPopupOpen.value = true
          await refreshPendingCsOrder()
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

  const currentClub = userInfoStore.currentClub ?? userInfoStore.clubList[0]
  const clubId = currentClub?.club_id ? Number(currentClub.club_id) : undefined

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
  <FixedDepositPanel v-if="isFixedDeposit" />

  <div v-else class="wallet-screen" :style="{ backgroundImage: `url(${mainBgUrl})` }">
    <AppBar :title="t('Wallet_Title')" :show-actions="false" />

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
            <GlassButton :label="$txt('Wallet_Records')" @click="router.push('/wallet/orders')" />
            <GlassButton :label="$txt('Wallet_Details')" @click="router.push('/wallet/details')" />
          </template>
          <template #extra>
            <div class="balance-row">
              <div class="balance-chip">
                <span class="balance-chip__value">
                  {{ (userInfoStore.userInfo?.user?.gold ?? 0).toLocaleString() }}
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
            :text="`立即支付 ${displayPayAmount}`"
            class="pay-cta"
            @click="onPayClick"
          />
        </template>

        <template v-else>
          <WithdrawForm @open-cs-chat="onWithdrawCsChat" />
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

    <CustomerServiceChatPopup
      v-if="csChatPopupOpen"
      :tribe-id="csChatProps.tribeId"
      :support-user-id="csChatProps.supportUserId"
      :order-data="csChatProps.orderData"
      @close="csChatPopupOpen = false"
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
</template>

<style scoped lang="scss">
.wallet-screen {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.wallet-scrollable {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding-bottom: calc(env(safe-area-inset-bottom) + 0.64rem);
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
}

.pay-cta {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 0.6rem);
  left: 0.455rem;
  width: calc(100% - 0.91rem);
  z-index: 10;
}
</style>
