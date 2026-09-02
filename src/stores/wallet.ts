import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { postPropGoldPriceListApi } from '@/api/prop'
import type { PropGoldPriceListData } from '@/api/models/prop'
import { useUserInfoStore } from '@/stores/userInfo'
import { postClubFundOrderListApi } from '@/api/order'
import type { ClubFundOrderListOrderInfo } from '@/api/models/order'
import { isPrivateDomainMode } from '@/utils/channelPackage'

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
    const promise = postPropGoldPriceListApi({
      club_id: clubId,
      source_type: 2,
      gold_types: [1],
    }/*, clubId */).then((res) => {
      if (requestVersion !== priceListRequestVersion) return

      // All payment types (types 1 to 9) should be loaded and shown.
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

  function clearPriceList() {
    priceListRequestVersion += 1
    priceListRequest = null
    goldPriceClubId = undefined
    goldPriceData.value = null
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

  // 刚提交、服务端列表尚未返回的订单：本地乐观插入，保证立即进入“交易中”聊天；
  // refreshPendingCsOrder 一旦在服务端列表里找到同 order_no，就把它从这里剔除（真实数据接管）。
  const optimisticCsOrders = ref<{ order: ClubFundOrderListOrderInfo; orderType: 'recharge' | 'withdraw'; addedAt: number }[]>([])
  const OPTIMISTIC_TTL = 30_000

  // 记录已审核完成但处于配置延迟关闭时间（CMS配置）内的客服订单，保持浮窗可见
  const completedCsOrdersWithDelay = ref<{
    order: ClubFundOrderListOrderInfo
    orderType: 'recharge' | 'withdraw'
    expireAt: number
  }[]>([])

  // 每5秒清理一次过期的延迟订单
  if (typeof window !== 'undefined') {
    window.setInterval(() => {
      const now = Date.now()
      completedCsOrdersWithDelay.value = completedCsOrdersWithDelay.value.filter(
        (item) => item.expireAt > now,
      )
    }, 5000)
  }

  function addOptimisticCsOrder(
    order: ClubFundOrderListOrderInfo,
    orderType: 'recharge' | 'withdraw',
  ): void {
    if (!order.order_no) return
    if (optimisticCsOrders.value.some((e) => e.order.order_no === order.order_no)) return
    optimisticCsOrders.value = [...optimisticCsOrders.value, { order, orderType, addedAt: Date.now() }]
  }

  const pendingCsRechargeOrder = computed(() => {
    return pendingCsRechargeOrders.value[0] ||
           completedCsOrdersWithDelay.value.find((item) => item.orderType === 'recharge')?.order ||
           null
  })
  const pendingCsRechargeCount = computed(() => pendingCsRechargeOrders.value.length)

  const pendingCsWithdrawOrder = computed(() => {
    return pendingCsWithdrawOrders.value[0] ||
           completedCsOrdersWithDelay.value.find((item) => item.orderType === 'withdraw')?.order ||
           null
  })
  const pendingCsWithdrawCount = computed(() => pendingCsWithdrawOrders.value.length)

  // 红色气泡角标仅显示真实的待处理中及乐观处理中订单数
  const pendingCsOrderCount = computed(() => {
    return pendingCsRechargeOrders.value.length +
           pendingCsWithdrawOrders.value.length +
           optimisticCsOrders.value.length
  })

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
    completedCsOrdersWithDelay.value.forEach((item) => push(item.order, item.orderType))
    // 乐观订单放最后：若服务端已返回同 order_no，真实订单已先入 map，这里自动跳过
    optimisticCsOrders.value.forEach((e) => push(e.order, e.orderType))
    return [...byNo.values()]
  })

  async function refreshPendingCsOrder(clubIdOverride?: number) {
    const clubId = resolveClubId(clubIdOverride)

    try {
      // Check Recharge orders（后台轮询，业务码非 0 静默处理，不弹错误提示）
      const rechargeRes = await postClubFundOrderListApi({
        order_type: 1, // Recharge
        my_order: true,
        limit: 10,
        offset: 0,
        status: 1, // Pending
      }, clubId, { suppressBusinessToast: true })

      if (rechargeRes.code === 0 && rechargeRes.data?.list) {
        pendingCsRechargeOrders.value = rechargeRes.data.list.filter((o) => {
          if (Number(o.status) !== 1) return false
          const ot = Number(
            (o as any).pay_api_type ??
              (o as any).pay_type ??
              (o as any).api_type ??
              (o as any).type,
          )
          const payId = (o as any).pay_id
          const isCsPayId = goldPriceData.value?.pay_types?.some(
            (pt) => pt.id != null && pt.id === payId && pt.type === 3,
          )
          if ((!payId || payId === 0) && ot !== 3 && !o.pay_type_name?.includes('撮合')) {
            return false
          }
          return (
            ot === 3 ||
            isCsPayId ||
            o.pay_type_name?.includes('撮合') ||
            o.pay_type_name?.includes('客服') ||
            o.pay_type_name?.toLowerCase().includes('cs') ||
            o.pay_type_name?.toLowerCase().includes('service')
          )
        })
      } else {
        pendingCsRechargeOrders.value = []
      }

      // Check Withdraw orders（后台轮询，业务码非 0 静默处理，不弹错误提示）
      const withdrawRes = await postClubFundOrderListApi({
        order_type: 2, // Withdraw
        my_order: true,
        limit: 10,
        offset: 0,
        status: 1, // Pending
      }, clubId, { suppressBusinessToast: true })

      if (withdrawRes.code === 0 && withdrawRes.data?.list) {
        pendingCsWithdrawOrders.value = withdrawRes.data.list.filter((o) => {
          // 客服渠道提现进聊天（account_type 0：usdt提现 type1 / 撮合提现 type3）；
          // 银行卡渠道(account_type 1)走在线流程，不进聊天。
          if (Number(o.status) !== 1) return false
          const acct = Number((o as any).account_type)
          if (acct === 1) return false
          const ot = Number(
            (o as any).pay_api_type ??
              (o as any).pay_type ??
              (o as any).api_type ??
              (o as any).type,
          )
          return (
            acct === 0 ||
            ot === 1 ||
            ot === 3 ||
            o.pay_type_name?.includes('撮合') ||
            o.pay_type_name?.includes('客服') ||
            o.pay_type_name?.toLowerCase().includes('cs') ||
            o.pay_type_name?.toLowerCase().includes('service')
          )
        })
      } else {
        pendingCsWithdrawOrders.value = []
      }

      // 服务端已接管的 order_no 从乐观列表剔除；超过 TTL 仍未被服务端确认的也丢弃，避免僵尸累积
      const knownNos = new Set(
        [...pendingCsRechargeOrders.value, ...pendingCsWithdrawOrders.value]
          .map((o) => o.order_no)
          .filter(Boolean),
      )
      const now = Date.now()
      optimisticCsOrders.value = optimisticCsOrders.value.filter(
        (e) => !knownNos.has(e.order.order_no) && now - e.addedAt < OPTIMISTIC_TTL,
      )
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
   * 接收 TCP MSG_S_USER_ORDER_AUDIT 广播，如果已完成且配置了延迟关闭，将其移入延迟保留队列
   */
  function handleOrderAuditNotification(payload: {
    orderNo: string
    status: number
    delay: number // 分钟
  }) {
    const { orderNo, status, delay } = payload
    if (status === 1) return // 申请中不处理

    let foundOrder: ClubFundOrderListOrderInfo | undefined
    let orderType: 'recharge' | 'withdraw' = 'recharge'

    // 从充值挂起队列里移除
    const rechargeIdx = pendingCsRechargeOrders.value.findIndex((o) => o.order_no === orderNo)
    if (rechargeIdx > -1) {
      foundOrder = pendingCsRechargeOrders.value[rechargeIdx]
      orderType = 'recharge'
      pendingCsRechargeOrders.value.splice(rechargeIdx, 1)
    } else {
      // 从提现挂起队列里移除
      const withdrawIdx = pendingCsWithdrawOrders.value.findIndex((o) => o.order_no === orderNo)
      if (withdrawIdx > -1) {
        foundOrder = pendingCsWithdrawOrders.value[withdrawIdx]
        orderType = 'withdraw'
        pendingCsWithdrawOrders.value.splice(withdrawIdx, 1)
      }
    }

    if (delay > 0) {
      // 如果本地挂起队列已经没有了（例如刷新过），采用最小默认信息
      const order = foundOrder || { order_no: orderNo, status }
      const expireAt = Date.now() + delay * 60 * 1000

      const existingIdx = completedCsOrdersWithDelay.value.findIndex((item) => item.order.order_no === orderNo)
      if (existingIdx > -1) {
        completedCsOrdersWithDelay.value[existingIdx] = { order, orderType, expireAt }
      } else {
        completedCsOrdersWithDelay.value.push({ order, orderType, expireAt })
      }
    }
  }

  function clearCsOrders() {
    pendingCsRechargeOrders.value = []
    pendingCsWithdrawOrders.value = []
    optimisticCsOrders.value = []
    completedCsOrdersWithDelay.value = []
  }

  return {
    goldPriceData,
    loadPriceList,
    clearPriceList,
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
    pendingCsOrderCount,
    csChatOrders,
    buildCsOrderData,
    addOptimisticCsOrder,
    refreshPendingCsOrder,
    updateCsOrders,
    clearCsOrders,
    completedCsOrdersWithDelay,
    handleOrderAuditNotification
  }
})
