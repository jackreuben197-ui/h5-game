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

  // 刚提交、服务端列表尚未返回的订单：本地乐观插入，保证立即进入“交易中”聊天；
  // refreshPendingCsOrder 一旦在服务端列表里找到同 order_no，就把它从这里剔除（真实数据接管）。
  const optimisticCsOrders = ref<{ order: ClubFundOrderListOrderInfo; orderType: 'recharge' | 'withdraw' }[]>([])

  function addOptimisticCsOrder(
    order: ClubFundOrderListOrderInfo,
    orderType: 'recharge' | 'withdraw',
  ): void {
    if (!order.order_no) return
    if (optimisticCsOrders.value.some((e) => e.order.order_no === order.order_no)) return
    optimisticCsOrders.value = [...optimisticCsOrders.value, { order, orderType }]
  }

  const pendingCsRechargeOrder = computed(() => pendingCsRechargeOrders.value[0] || null)
  const pendingCsRechargeCount = computed(() => pendingCsRechargeOrders.value.length)

  const pendingCsWithdrawOrder = computed(() => pendingCsWithdrawOrders.value[0] || null)
  const pendingCsWithdrawCount = computed(() => pendingCsWithdrawOrders.value.length)

  const pendingCsOrderCount = computed(() => csChatOrders.value.length)

  function buildCsOrderData(order: ClubFundOrderListOrderInfo, orderType: 'recharge' | 'withdraw') {
    const qrCode =
      (order as any).qrcode || (order as any).qr_code || (order as any).pay_type_qr_code || ''

    return {
      orderType,
      order_no: order.order_no,
      gold_num: order.gold_num,
      pay_price: order.pay_price,
      create_time: order.create_time,
      order: {
        order_no: order.order_no,
        amount: order.pay_price,
        gold_num: order.gold_num,
        create_time: order.create_time,
      },
      usdt_address: {
        address: order.pay_type_address || '',
        qr_code: qrCode,
        name: (order as any).pay_type_name || '客服撮合',
      },
    }
  }

  // 充值列表(order_type=1)与提现列表(order_type=2)合并：按 order_no 去重，
  // 类型优先用订单自身 order_type（1充值/2提现），缺失时用所在列表兜底。
  const csChatOrders = computed(() => {
    const byNo = new Map<string, ReturnType<typeof buildCsOrderData>>()
    const push = (o: ClubFundOrderListOrderInfo, fallback: 'recharge' | 'withdraw') => {
      const realType = Number((o as any).order_type)
      const type = realType === 1 ? 'recharge' : realType === 2 ? 'withdraw' : fallback
      const key = o.order_no || `${fallback}-${byNo.size}`
      if (byNo.has(key)) return
      byNo.set(key, buildCsOrderData(o, type))
    }
    pendingCsRechargeOrders.value.forEach((o) => push(o, 'recharge'))
    pendingCsWithdrawOrders.value.forEach((o) => push(o, 'withdraw'))
    // 乐观订单放最后：若服务端已返回同 order_no，真实订单已先入 map，这里自动跳过
    optimisticCsOrders.value.forEach((e) => push(e.order, e.orderType))
    return [...byNo.values()]
  })

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
          // 客服渠道提现进聊天（account_type 0：usdt提现 type1 / 撮合提现 type3）；
          // 银行卡渠道(account_type 1)走在线流程，不进聊天。
          const acct = Number((o as any).account_type)
          if (acct === 1) return false
          const ot = (o as any).pay_type ?? (o as any).api_type ?? (o as any).type
          return acct === 0 || ot === 1 || ot === 3 || o.pay_type_name?.includes('撮合')
        })
      } else {
        pendingCsWithdrawOrders.value = []
      }

      // 服务端已经接管的 order_no，从乐观列表剔除，避免重复/僵尸数据
      const knownNos = new Set(
        [...pendingCsRechargeOrders.value, ...pendingCsWithdrawOrders.value]
          .map((o) => o.order_no)
          .filter(Boolean),
      )
      if (knownNos.size) {
        optimisticCsOrders.value = optimisticCsOrders.value.filter(
          (e) => !knownNos.has(e.order.order_no),
        )
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
    optimisticCsOrders.value = []
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
    pendingCsOrderCount,
    csChatOrders,
    buildCsOrderData,
    addOptimisticCsOrder,
    refreshPendingCsOrder,
    updateCsOrders,
    clearCsOrders
  }
})
