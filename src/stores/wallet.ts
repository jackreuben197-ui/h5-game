import { defineStore } from 'pinia'
import { ref } from 'vue'
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
    }, clubId)

    if (res.data?.pay_types) {
      res.data.pay_types = res.data.pay_types.filter(
        (p) => p.type === 1 || p.type === 3
      )
    }

    goldPriceData.value = res.data ?? null
  }

  function calculateUsdtPrice(goldCount: number, rate: number, feeRate: number, feeType = 0, discount = 0) {
    // Base price in USDT
    const base = (goldCount / 100) * rate

    // Apply discount
    let priceAfterDiscount = base * (1 - discount)
    priceAfterDiscount = Math.round(priceAfterDiscount * 10000) / 10000

    // totalUiPrice includes fee if player pays (feeType 2)
    let total = priceAfterDiscount
    if (feeType === 2 && feeRate > 0) {

      const fee = base * feeRate
      total = priceAfterDiscount + fee
      total = Math.round(total * 10000) / 10000
    }

    const totalUiPrice = Number(total.toFixed(6))

    // apiPayPrice should be the final total price including fee as expected by the server
    // For many club-managed and identifier-based channels, this must match the total sent by the user.
    const apiPayPrice = totalUiPrice

    return { apiPayPrice, totalUiPrice }
  }

  function calculateCustomerServicePrice(goldCount: number, rate: number, feeRate: number, discount = 0) {
    const base = (goldCount / 100) * rate
    // When discount > 0 it takes priority and fee is not added to pay_price.
    // When no discount and fee_type = 2, call passes the actual feeRate, fee is added.
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

  const pendingCsOrder = ref<ClubFundOrderListOrderInfo | null>(null)
  const pendingCsOrderCount = ref(0)

  async function refreshPendingCsOrder() {
    const userInfoStore = useUserInfoStore()
    const currentClub = userInfoStore.currentClub ?? userInfoStore.clubList[0]
    const clubId = currentClub?.club_id ? Number(currentClub.club_id) : undefined

    try {
      // Check Recharge orders
      const rechargeRes = await postClubFundOrderListApi({
        order_type: 1, // Recharge
        my_order: true,
        limit: 10, // Increased limit to count more
        offset: 0,
        status: 1, // Pending
      }, clubId)

      if (rechargeRes.code === 0 && rechargeRes.data?.list) {
        const csOrders = rechargeRes.data.list.filter(o => {
          const ot = (o as any).pay_type || (o as any).api_type || (o as any).type
          return ot === 3 || o.pay_type_name?.includes('撮合')
        })
        
        pendingCsOrderCount.value = csOrders.length
        
        if (csOrders.length > 0) {
          pendingCsOrder.value = csOrders[0]
          return
        }
      }

      pendingCsOrder.value = null
      pendingCsOrderCount.value = 0
    } catch (e) {
      console.error('Failed to fetch pending CS orders', e)
      pendingCsOrder.value = null
      pendingCsOrderCount.value = 0
    }
  }
  function formatUsdtPrice(price: number): string {
    return price.toFixed(4).replace(/\.?0+$/, '')
  }

  return {
    goldPriceData,
    loadPriceList,
    calculateUsdtPrice,
    formatUsdtPrice,
    calculateCustomerServicePrice,
    pendingCsOrder,
    pendingCsOrderCount,
    refreshPendingCsOrder
  }
})
