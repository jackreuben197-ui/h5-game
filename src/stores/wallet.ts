import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { postPropGoldPriceListApi } from '@/api/prop'
import type { PropGoldPriceListData } from '@/api/models/prop'
import { useUserInfoStore } from '@/stores/userInfo'
import { postClubFundOrderListApi } from '@/api/order'
import type { ClubFundOrderListOrderInfo } from '@/api/models/order'

export const useWalletStore = defineStore('wallet', () => {
  const goldPriceData = ref<PropGoldPriceListData | null>(null)
  let goldPriceClubId: number | undefined
  let priceListRequest: { clubId?: number; promise: Promise<void> } | null = null
  let priceListRequestVersion = 0

  function resolveClubId(clubIdOverride?: number): number | undefined {
    if (Number.isFinite(clubIdOverride) && Number(clubIdOverride) > 0) {
      return Number(clubIdOverride)
    }
    const userInfoStore = useUserInfoStore()
    const currentClub = userInfoStore.currentClub ?? userInfoStore.clubList[0]
    const clubId = Number(currentClub?.club_id)
    return Number.isFinite(clubId) && clubId > 0 ? clubId : undefined
  }

  function loadPriceList(clubIdOverride?: number): Promise<void> {
    const clubId = resolveClubId(clubIdOverride)
    const activeRequest = priceListRequest
    if (activeRequest !== null && activeRequest.clubId === clubId) {
      return activeRequest.promise
    }

    if (goldPriceClubId !== clubId) {
      goldPriceData.value = null
    }

    const requestVersion = ++priceListRequestVersion
    const promise = postPropGoldPriceListApi(
      {
        club_id: clubId,
        source_type: 0,
        gold_types: [],
      },
      clubId,
    ).then((res) => {
      if (requestVersion !== priceListRequestVersion) return

      if (res.data?.pay_types) {
        res.data.pay_types = res.data.pay_types.filter(
          (p) => p.type === 1 || p.type === 3
        )
      }

      goldPriceData.value = res.data ?? null
      goldPriceClubId = clubId
    })

    priceListRequest = { clubId, promise }
    void promise
      .finally(() => {
        if (priceListRequest?.promise === promise) {
          priceListRequest = null
        }
      })
      .catch(() => {})

    return promise
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

  /**
   * Recharge pay_types.rate is the amount of UC received for 1 USDT.
   * goldCount is stored in cents, so 300 UC at a rate of 30 costs 10 USDT.
   */
  function calculateRechargeUsdtPrice(
    goldCount: number,
    rate: number,
    feeRate: number,
    feeType = 0,
    discount = 0,
  ) {
    const normalizedRate = Number(rate)
    const base = normalizedRate > 0 ? goldCount / 100 / normalizedRate : 0
    let priceAfterDiscount = base * (1 - discount)
    priceAfterDiscount = Math.round(priceAfterDiscount * 10000) / 10000

    let total = priceAfterDiscount
    if (feeType === 2 && feeRate > 0) {
      total = priceAfterDiscount + base * feeRate
      total = Math.round(total * 10000) / 10000
    }

    const totalUiPrice = Number(total.toFixed(6))
    return { apiPayPrice: totalUiPrice, totalUiPrice }
  }

  function calculateCustomerServicePrice(goldCount: number, rate: number, feeRate: number, discount = 0) {
    const normalizedRate = Number(rate)
    const base = normalizedRate > 0 ? goldCount / 100 / normalizedRate : 0
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

  async function refreshPendingCsOrder(clubIdOverride?: number) {
    const clubId = resolveClubId(clubIdOverride)

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
    calculateRechargeUsdtPrice,
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
