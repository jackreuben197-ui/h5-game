import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { postPropGoldPriceListApi } from '@/api/prop'
import type { PropGoldPriceListData } from '@/api/models/prop'
import { useUserInfoStore } from '@/stores/userInfo'
import { postClubFundOrderListApi } from '@/api/order'
import type { ClubFundOrderListOrderInfo } from '@/api/models/order'

export const useWalletStore = defineStore('wallet', () => {
  const goldPriceData = ref<PropGoldPriceListData | null>(null)

  async function loadPriceList(): Promise<void> {
    const userInfoStore = useUserInfoStore()
    const currentClub = userInfoStore.currentClub ?? userInfoStore.clubList[0]
    const clubId = currentClub?.club_id ? Number(currentClub.club_id) : undefined
    const res = await postPropGoldPriceListApi({
      club_id: clubId,
      source_type: 0,
      gold_types: [],
    }/*, clubId */)

    // All payment types (types 1 to 9) should be loaded and shown.

    goldPriceData.value = res.data ?? null
  }

  function calculateUsdtPrice(goldCount: number, rate: number, feeRate: number, feeType = 0, discount = 0) {
    const base = (goldCount / 100) * rate
    let priceAfterDiscount = base * (1 - discount)
    priceAfterDiscount = Math.round(priceAfterDiscount * 10000) / 10000

    let total = priceAfterDiscount
    if (feeType === 2 && feeRate > 0) {
      const fee = base * feeRate
      total = priceAfterDiscount + fee
      total = Math.round(total * 10000) / 10000
    }

    const totalUiPrice = Number(total.toFixed(6))
    const apiPayPrice = totalUiPrice

    return { apiPayPrice, totalUiPrice }
  }

  function calculateCustomerServicePrice(goldCount: number, rate: number, feeRate: number, discount = 0) {
    const base = (goldCount / 100) * rate
    let final: number
    if (discount > 0) {
      final = base * (1 - discount)
    } else if (feeRate > 0) {
      final = base * (1 + feeRate)
    } else {
      final = base
    }
    return Number((Math.round(final * 100) / 100).toFixed(2))
  }

  const pendingCsRechargeOrders = ref<ClubFundOrderListOrderInfo[]>([])
  const pendingCsWithdrawOrders = ref<ClubFundOrderListOrderInfo[]>([])

  const pendingCsRechargeOrder = computed(() => pendingCsRechargeOrders.value[0] || null)
  const pendingCsRechargeCount = computed(() => pendingCsRechargeOrders.value.length)
  
  const pendingCsWithdrawOrder = computed(() => pendingCsWithdrawOrders.value[0] || null)
  const pendingCsWithdrawCount = computed(() => pendingCsWithdrawOrders.value.length)

  async function refreshPendingCsOrder() {
    const userInfoStore = useUserInfoStore()
    const currentClub = userInfoStore.currentClub ?? userInfoStore.clubList[0]
    const clubId = currentClub?.club_id ? Number(currentClub.club_id) : undefined

    try {
      // Check Recharge orders
      const rechargeRes = await postClubFundOrderListApi({
        order_type: 1, // Recharge
        my_order: true,
        limit: 10,
        offset: 0,
        status: 1, // Pending
      }, clubId)

      if (rechargeRes.code === 0 && rechargeRes.data?.list) {
        pendingCsRechargeOrders.value = rechargeRes.data.list.filter(o => {
          const ot = (o as any).pay_type || (o as any).api_type || (o as any).type
          return ot === 3 || o.pay_type_name?.includes('撮合')
        })
      } else {
        pendingCsRechargeOrders.value = []
      }

      // Check Withdraw orders
      const withdrawRes = await postClubFundOrderListApi({
        order_type: 2, // Withdraw
        my_order: true,
        limit: 10,
        offset: 0,
        status: 1, // Pending
      }, clubId)

      if (withdrawRes.code === 0 && withdrawRes.data?.list) {
        pendingCsWithdrawOrders.value = withdrawRes.data.list.filter(o => {
          const ot = (o as any).pay_type || (o as any).api_type || (o as any).type
          return ot === 3 || o.pay_type_name?.includes('撮合')
        })
      } else {
        pendingCsWithdrawOrders.value = []
      }

    } catch (e) {
      console.error('Failed to fetch pending CS orders', e)
      pendingCsRechargeOrders.value = []
      pendingCsWithdrawOrders.value = []
    }
  }

  function formatUsdtPrice(price: number): string {
    return price.toLocaleString(undefined, { useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 4 })
  }

  /**
   * External hook to manually update the pending CS orders.
   * Use this after login or reconnect to sync the bell state.
   */
  function updateCsOrders(recharge: any[] = [], withdraw: any[] = []) {
    pendingCsRechargeOrders.value = recharge
    pendingCsWithdrawOrders.value = withdraw
  }

  /**
   * External hook to hide the bell.
   */
  function clearCsOrders() {
    pendingCsRechargeOrders.value = []
    pendingCsWithdrawOrders.value = []
  }

  return {
    goldPriceData,
    loadPriceList,
    calculateUsdtPrice,
    formatUsdtPrice,
    calculateCustomerServicePrice,
    pendingCsRechargeOrders,
    pendingCsWithdrawOrders,
    pendingCsRechargeOrder,
    pendingCsRechargeCount,
    pendingCsWithdrawOrder,
    pendingCsWithdrawCount,
    refreshPendingCsOrder,
    updateCsOrders,
    clearCsOrders
  }
})
