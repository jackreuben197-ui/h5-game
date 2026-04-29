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
    const res = await postPropGoldPriceListApi({
      club_id: currentClub?.club_id,
      source_type: 0,
      gold_types: [],
    })
    goldPriceData.value = res.data ?? null
  }

  return { goldPriceData, loadPriceList }
})
