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
    const clubId = currentClub?.club_id ? Number(currentClub.club_id) : undefined
    const res = await postPropGoldPriceListApi({
      club_id: clubId,
      source_type: 0,
      gold_types: [],
    }, clubId)
    goldPriceData.value = res.data ?? null
  }

  function calculateUsdtPrice(goldCount: number, rate: number, feeRate: number, feeType = 0, discount = 0) {
    // Base price in USDT (goldCount is in cents, e.g. 10000 for 100 gold)
    const base = (goldCount / 100) * rate

    // Apply discount
    let priceAfterDiscount = base * (1 - discount)
    priceAfterDiscount = Math.round(priceAfterDiscount * 10000) / 10000

    // totalUiPrice includes fee if player pays (feeType 2)
    let total = priceAfterDiscount
    if (feeType === 2 && feeRate > 0) {
      // Note: In this project's server logic, the 'pay_price' field often expects the 
      // discounted base price WITHOUT the fee, while 'legal_tender' includes the fee.
      const fee = base * feeRate
      total = priceAfterDiscount + fee
      total = Math.round(total * 10000) / 10000
    }

    const totalUiPrice = Number(total.toFixed(6))
    
    // apiPayPrice should be the final total price (including fee) as expected by the server
    // For many club-managed and identifier-based channels, this must match the total sent by the user.
    const apiPayPrice = totalUiPrice

    return { apiPayPrice, totalUiPrice }
  }

  function calculateCustomerServicePrice(goldCount: number, rate: number, feeRate: number) {
    const base = (goldCount / 100) * rate
    const final = feeRate > 0 ? base * (1 + feeRate) : base
    return Number((Math.round(final * 100) / 100).toFixed(2))
  }

  function formatUsdtPrice(price: number): string {
    return price.toFixed(4).replace(/\.?0+$/, '')
  }

  return { goldPriceData, loadPriceList, calculateUsdtPrice, formatUsdtPrice, calculateCustomerServicePrice }
})
