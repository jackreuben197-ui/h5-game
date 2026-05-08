import { defineStore } from 'pinia'
import { ref } from 'vue'
import { postPropGoldPriceListApi } from '@/api/prop'
import type { PropGoldPriceListData } from '@/api/models/prop'
import { useUserInfoStore } from '@/stores/userInfo'

export const useWalletStore = defineStore('wallet', () => {
  const goldPriceData = ref<PropGoldPriceListData | null>(null)

  async function loadPriceList(): Promise<void> {
    const userInfoStore = useUserInfoStore()
    const currentClub = userInfoStore.currentClub ?? userInfoStore.clubList[0]
    const clubIdRaw = currentClub?.club_id
    const clubId = clubIdRaw != null ? Number(clubIdRaw) : NaN
    if (!Number.isFinite(clubId) || clubId <= 0) {
      goldPriceData.value = null
      return
    }
    const res = await postPropGoldPriceListApi(
      {
        club_id: clubId,
        ids: [],
        gold_types: [],
        pay_gold_types: [],
        source_type: 2,
        trader_type: 0,
        limit: 100,
        offset: 0,
      },
      clubId
    )
    goldPriceData.value = res.code === 0 ? (res.data ?? null) : null
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

  function formatUsdtPrice(price: number): string {
    return price.toFixed(4).replace(/\.?0+$/, '')
  }

  return { goldPriceData, loadPriceList, calculateUsdtPrice, formatUsdtPrice, calculateCustomerServicePrice }
})
