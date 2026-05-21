<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast, showSuccessToast } from 'vant'
import { postPropGoldPriceListApi } from '@/api/prop'
import { postUSDTApplyApi, postUSDTApplyListApi } from '@/api/user'
import { Code, subscribeH5WsCode } from '@/bridge/ws/messageCenter'
import { decodeUserTraderOrderNotify } from '@/bridge/ws/traderOrderNotify'
import mainBgUrl from '@/assets/images/main_bg.webp'
import imgCoin from '@/assets/icons/shop_usdt.png'
import diamondCoin from '@/assets/icons/icon_diamond.png'
import imgDiamonds from '@/assets/images/shop_diamonds.png'
import iconUsdt from '@/assets/icons/wallet/ic_usdt.svg'
import iconBtc from '@/assets/icons/wallet/ic_btc.svg'
import iconEth from '@/assets/icons/wallet/ic_eth.svg'
import iconCard from '@/assets/icons/wallet/ic_card.svg'
import defaultAvatar from '@/assets/images/default_avatar.png'
import icCheckbox from '@/assets/icons/ic_checkbox.png'
import icUncheckbox from '@/assets/icons/ic_uncheckbox.png'

import { useUserInfoStore } from '@/stores/userInfo'
import { useGameStore } from '@/stores/game'
import { useAppConfigStore } from '@/stores/appConfig'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const title = computed(() => '我的商城')

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()
const appConfigStore = useAppConfigStore()

interface ShopItem {
  id: number
  productId: string
  title: string
  goldCount: number
  diamondsText: string
  diamondsValue: number
  price: number
  image: string
  status: number
  wholesaleOnly?: boolean
  auditing?: boolean
}

interface ShopItemPrice {
  id: number
  payPrice: number
}

interface PayTypeOption {
  id: number
  name: string
  icon: string
  rate: number
  discount: number
  priceList: ShopItemPrice[]
}

const loading = ref(false)
const applyStatusLoading = ref(false)
const applySubmitting = ref(false)
const showApplyPopup = ref(false)
const hasPendingApply = ref(false)
const items = ref<ShopItem[]>([])
const payTypes = ref<PayTypeOption[]>([])
const selectedItemId = ref<number>(0)
const selectedPayTypeId = ref<number>(0)
let stopTraderOrderWsListener: (() => void) | null = null

const userDiamond = computed(() => Number(userInfoStore.userInfo?.user.diamonds ?? 0))
const userName = computed(() => {
  const nickname = userInfoStore.userInfo?.user.nickname
  return typeof nickname === 'string' && nickname.trim() ? nickname.trim() : '玩家'
})
const userIdText = computed(() => {
  const uid = userInfoStore.userInfo?.user.un_id || gameStore.loginUserId || '-'
  return String(uid ?? '--')
})
const userAvatar = computed(() => {
  const avatar = userInfoStore.userInfo?.user.avatar
  return typeof avatar === 'string' && avatar ? avatar : defaultAvatar
})

function toTimestampMs(value: unknown): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return 0
  return numeric < 1e12 ? numeric * 1000 : numeric
}

const isTrader = computed(() => {
  const expireTime = toTimestampMs(userInfoStore.userInfo?.user.trader_expire_time)
  return expireTime > Date.now()
})

interface TraderSwitchConfig {
  status: number
  apply_cost: number
  expire_day: number
}

function parseTraderSwitchConfig(raw: unknown): TraderSwitchConfig | null {
  if (!raw) return null

  const source =
    typeof raw === 'string'
      ? (() => {
          try {
            return JSON.parse(raw) as Record<string, unknown>
          } catch {
            return null
          }
        })()
      : typeof raw === 'object'
        ? (raw as Record<string, unknown>)
        : null

  if (!source) return null

  return {
    status: toSafeNumber(source.status),
    apply_cost: toSafeNumber(source.apply_cost),
    expire_day: toSafeNumber(source.expire_day),
  }
}

const traderSwitchConfig = computed<TraderSwitchConfig>(() => {
  const raw = appConfigStore.globalConfig?.trader_usdt_diamond_switch
  const parsed = parseTraderSwitchConfig(raw)
  return {
    status: parsed?.status || 1,
    apply_cost: parsed?.apply_cost || 1000,
    expire_day: parsed?.expire_day || 60,
  }
})

const applyCostText = computed(() => String(Math.max(0, traderSwitchConfig.value.apply_cost)))
const traderExpireDayText = computed(() => String(Math.max(1, traderSwitchConfig.value.expire_day)))

const selectedItem = computed<ShopItem | null>(() => {
  if (!items.value.length) return null
  return items.value.find((item) => item.id === selectedItemId.value) ?? items.value[0]
})

const selectedNeedTrader = computed(() => Boolean(selectedItem.value?.wholesaleOnly))

const payNowText = computed(() => {
  if (!selectedItem.value) return '请选择商品'
  if (selectedNeedTrader.value && !isTrader.value) {
    if (hasPendingApply.value) {
      return '审核中'
    }
    return '申请批发商'
  }
  return `立即支付${formatMoney(selectedPrice.value)}`
})

const selectedPayType = computed<PayTypeOption | null>(() => {
  if (!payTypes.value.length) return null
  return payTypes.value.find((item) => item.id === selectedPayTypeId.value) ?? payTypes.value[0]
})

const exchangeText = computed(() => {
  const rate = selectedPayType.value?.rate ?? 0
  if (rate > 0) {
    return `汇率：1usdt=${Math.max(1, Math.round(1 / rate))}钻石`
  }
  return '汇率：1usdt=333钻石'
})

const selectedPrice = computed(() => {
  const item = selectedItem.value
  if (!item) return 0
  return getDisplayPrice(item)
})

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatMoney(value: number): string {
  return toSafeNumber(value).toFixed(4)
}

function formatBalance(value: number): string {
  return toSafeNumber(value).toLocaleString('en-US')
}

function trimNumberText(value: number): string {
  const text = value.toFixed(2)
  return text.replace(/\.00$/, '').replace(/(\.\d*[1-9])0+$/, '$1')
}

function resolvePayIcon(name: string, image: unknown): string {
  if (typeof image === 'string' && image) {
    return image
  }

  const normalized = name.toLowerCase()
  if (normalized.includes('btc')) return iconBtc
  if (normalized.includes('eth')) return iconEth
  if (normalized.includes('卡')) return iconCard
  return iconUsdt
}

function getPayTypePrice(itemId: number, payType?: PayTypeOption | null): number | null {
  if (!payType) return null
  const matched = payType.priceList.find((price) => price.id === itemId)
  return matched ? matched.payPrice : null
}

const PRICE_RATIO = 10 ** 4

function roundToPayPrice(value: number): number {
  return Math.round(toSafeNumber(value) * PRICE_RATIO) / PRICE_RATIO
}

function calculatePayPriceByServerRule(buyGold: number, payType?: PayTypeOption | null): number {
  if (!payType) return 0

  const fullPayPrice = roundToPayPrice(payType.rate * buyGold)
  const discountPrice = payType.discount > 0 ? roundToPayPrice(fullPayPrice * payType.discount) : 0
  return roundToPayPrice(fullPayPrice - discountPrice)
}

function getDisplayPrice(item: ShopItem): number {
  const formulaPrice = calculatePayPriceByServerRule(item.goldCount, selectedPayType.value)
  if (formulaPrice > 0) return formulaPrice

  const channelPrice = getPayTypePrice(item.id, selectedPayType.value)
  if (channelPrice !== null) return roundToPayPrice(channelPrice)

  return roundToPayPrice(item.price)
}

function isItemActive(itemId: number): boolean {
  return selectedItem.value?.id === itemId
}

function discountTag(discount: number): string {
  if (discount <= 0) return ''
  const percent = discount * 100
  return `可减${trimNumberText(percent)}%`
}

function channelSuffix(name: string): string {
  const normalized = name.toLowerCase()
  if (normalized.includes('usdt') && !normalized.includes('trc20')) {
    return 'TRC20'
  }
  return ''
}

interface RefreshOptions {
  silent?: boolean
}

async function fetchShopList(options: RefreshOptions = {}): Promise<void> {
  loading.value = true
  try {
    const response = await postPropGoldPriceListApi(
      {
        gold_types: [4],
        pay_gold_types: [],
        source_type: 2,
        trader_type: 0,
        limit: 100,
        offset: 0,
      },
      0,
    )
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载商品失败')
    }

    const list = response.data?.list ?? []
    const responsePayTypes = response.data?.pay_types ?? []

    payTypes.value = responsePayTypes.map((payType) => {
      const name = String(payType.name ?? 'USDT')
      let priceList: { id: number; payPrice: number }[] = []
      if (Array.isArray(payType.price_list)) {
        priceList = payType.price_list.map((priceRow) => ({
          id: toSafeNumber(priceRow.id),
          payPrice: toSafeNumber(priceRow.pay_price),
        }))
      }

      return {
        id: toSafeNumber(payType.id),
        name,
        icon: resolvePayIcon(name, payType.image),
        rate: toSafeNumber(payType.rate),
        discount: toSafeNumber(payType.discount),
        priceList,
      }
    })

    items.value = list.map((row, _) => {
      const num = toSafeNumber(row.give_gold_count)
      const goldCount = toSafeNumber(row.gold_count)
      const price = calculatePayPriceByServerRule(goldCount, payTypes.value[0])
      const status = toSafeNumber(row.status)
      return {
        id: toSafeNumber(row.id),
        productId: String(row.product_id ?? ''),
        title: `${row.gold_count}`,
        goldCount,
        diamondsText: `赠${num}钻石`,
        diamondsValue: num,
        price,
        status,
        image: typeof row.picture === 'string' && row.picture ? row.picture : imgDiamonds,
        wholesaleOnly: row.trader_type == 2,
        auditing: status !== 1 && status !== 0,
      }
    })
    selectedItemId.value = items.value[0]?.id ?? 0
    selectedPayTypeId.value = payTypes.value[0]?.id ?? 0
  } catch (error) {
    items.value = []
    payTypes.value = []
    selectedItemId.value = 0
    selectedPayTypeId.value = 0
    if (!options.silent) {
      const message = error instanceof Error ? error.message : '加载商品失败'
      showFailToast(message)
    }
  } finally {
    loading.value = false
  }
}

async function fetchApplyStatus(options: RefreshOptions = {}): Promise<void> {
  if (isTrader.value) {
    hasPendingApply.value = false
    return
  }

  applyStatusLoading.value = true
  try {
    const response = await postUSDTApplyListApi({ status: 1 })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '查询申请状态失败')
    }
    const list = response.data?.list ?? []
    hasPendingApply.value = Array.isArray(list) && list.length > 0
  } catch (error) {
    hasPendingApply.value = false
    if (!options.silent) {
      const message = error instanceof Error ? error.message : '查询申请状态失败'
      showFailToast(message)
    }
  } finally {
    applyStatusLoading.value = false
  }
}

async function refreshTraderGoodsStateFromWs(): Promise<void> {
  await Promise.allSettled([fetchShopList({ silent: true }), fetchApplyStatus({ silent: true })])
}

function initTraderOrderWsListener(): void {
  if (stopTraderOrderWsListener) return

  stopTraderOrderWsListener = subscribeH5WsCode(Code.MSG_S_USER_TRADER_ORDER_NOTIFY, (message) => {
    const payload = decodeUserTraderOrderNotify(message.rawBuffer)
    if (!payload) {
      return
    }

    if (payload.status === 2 || payload.status === 3) {
      void refreshTraderGoodsStateFromWs()
    }
  })
}

function openApplyPopup(): void {
  showApplyPopup.value = true
}

function closeApplyPopup(): void {
  if (applySubmitting.value) return
  showApplyPopup.value = false
}

async function onConfirmApply(): Promise<void> {
  if (applySubmitting.value) return
  applySubmitting.value = true
  try {
    const response = await postUSDTApplyApi({})
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '申请提交失败')
    }
    showApplyPopup.value = false
    hasPendingApply.value = true
    showSuccessToast('申请已提交，请等待审核')
  } catch (error) {
    const message = error instanceof Error ? error.message : '申请提交失败'
    showFailToast(message)
  } finally {
    applySubmitting.value = false
  }
}

function onSelectItem(itemId: number): void {
  selectedItemId.value = itemId
}

function onSelectPayType(payTypeId: number): void {
  selectedPayTypeId.value = payTypeId
}

function goPay(item: ShopItem): void {
  if (item.auditing) {
    return
  }

  const payType = selectedPayType.value
  const payPrice = getDisplayPrice(item)

  void router.push({
    path: '/mine/shop/payment',
    query: {
      id: String(item.id),
      price_id: String(item.id),
      product_id: item.productId,
      title: item.title,
      gold_count: String(item.goldCount),
      diamonds: String(item.diamondsValue),
      price: String(payPrice),
      pay_price: String(payPrice),
      balance: String(userDiamond.value),
      pay_id: String(payType?.id ?? 0),
      pay_type_id: String(payType?.id ?? ''),
      pay_type_name: payType?.name ?? '',
    },
  })
}

function onPayNow(): void {
  const item = selectedItem.value
  if (!item) {
    showFailToast('请选择商品')
    return
  }

  if (item.wholesaleOnly && !isTrader.value) {
    if (applyStatusLoading.value) {
      showFailToast('申请状态加载中，请稍后')
      return
    }
    if (hasPendingApply.value) {
      showFailToast('审核中，请留意系统消息')
      return
    }
    openApplyPopup()
    return
  }

  goPay(item)
}

onMounted(() => {
  initTraderOrderWsListener()
  void fetchShopList()
  void fetchApplyStatus()
})

onBeforeUnmount(() => {
  stopTraderOrderWsListener?.()
  stopTraderOrderWsListener = null
})
</script>

<template>
  <div class="page-shell mine-shop-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="profile-card">
        <div class="profile-main">
          <div class="avatar-wrap">
            <img :src="userAvatar" alt="avatar" />
          </div>
          <div class="profile-meta">
            <p class="name">{{ userName }}</p>
            <div class="id-row">
              <span class="id-tag">ID</span>
              <span>{{ userIdText }}</span>
            </div>
          </div>
        </div>

        <div class="balance-row">
          <span>余额:</span>
          <strong>{{ formatBalance(userDiamond) }}</strong>
          <img :src="diamondCoin" alt="coin" />
        </div>
      </section>

      <section class="shop-grid">
        <p v-if="loading" class="grid-status">加载中...</p>
        <p v-else-if="!items.length" class="grid-status">暂无商品</p>
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="shop-card"
          :class="{ auditing: item.auditing, active: isItemActive(item.id) }"
          @click="onSelectItem(item.id)"
        >
          <span v-if="item.wholesaleOnly" class="wholesale-tag">批发商专属</span>
          <img class="chest" :src="item.image" :alt="item.title" />
          <p class="title">{{ item.title }}</p>
          <p v-if="item.diamondsValue > 0" class="desc">{{ item.diamondsText }}</p>

          <div class="price-pill">
            <span>{{ item.auditing ? '审核中' : formatMoney(getDisplayPrice(item)) }}</span>
            <img :src="imgCoin" alt="coin" />
          </div>
        </button>
      </section>

      <section class="rate-bar">{{ exchangeText }}</section>

      <section class="pay-channel-list">
        <button
          v-for="(channel, index) in payTypes"
          :key="channel.id"
          type="button"
          class="pay-channel"
          :class="{ active: selectedPayType?.id === channel.id }"
          @click="onSelectPayType(channel.id)"
        >
          <div class="left">
            <img class="pay-icon" :src="channel.icon" :alt="channel.name" />
            <div class="pay-texts">
              <p class="line-1">
                <span class="name">{{ channel.name }}</span>
                <span class="plain">支付</span>
                <span v-if="channelSuffix(channel.name)" class="plain">
                  {{ channelSuffix(channel.name) }}
                </span>
              </p>
              <p class="line-2">
                <span v-if="index === 0" class="tag recommend">推荐</span>
                <span v-if="discountTag(channel.discount)" class="tag reduce">
                  {{ discountTag(channel.discount) }}
                </span>
              </p>
            </div>
          </div>

          <img class="radio" :src="selectedPayType?.id === channel.id ? icCheckbox : icUncheckbox" alt="" />
        </button>
      </section>

      <button
        type="button"
        class="pay-now"
        :class="{ pending: selectedNeedTrader && !isTrader && hasPendingApply }"
        :disabled="!selectedItem || applyStatusLoading || applySubmitting"
        @click="onPayNow"
      >
        {{ payNowText }}
      </button>
    </div>

    <van-popup
      v-model:show="showApplyPopup"
      class="trader-apply-popup"
      position="center"
      :close-on-click-overlay="!applySubmitting"
      :overlay-style="{ background: 'rgba(12, 12, 12, 0.6)' }"
      @click-overlay="closeApplyPopup"
    >
      <section class="trader-apply-card">
        <p class="apply-rules">
          1、钻石批发商申请费为
          <span style="color: #05e7ae">{{ applyCostText }}</span>
          钻石，审核被拒后退还；<br />
          2、申请通过后，需在
          <span style="color: #05e7ae">{{ traderExpireDayText }}</span>
          天内购买批发商专属钻石，否则资格将失效；<br />
          3、批发商资格失效或者审批被拒需重新付费
          <span style="color: #05e7ae">{{ applyCostText }}</span>
          钻石申请；<br />
          4、申请后，我们将通过系统消息联系您，请留意消息
        </p>

        <button
          type="button"
          class="apply-confirm-btn"
          :disabled="applySubmitting"
          @click="onConfirmApply"
        >
          {{ applySubmitting ? '提交中...' : `支付${applyCostText}钻石` }}
        </button>
      </section>
    </van-popup>
  </div>
</template>

<style scoped lang="scss">
.mine-shop-page {
  position: relative;
  height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.52rem) 0 calc(env(safe-area-inset-bottom) + 0.55rem);
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: repeat;
  overflow-y: auto;
}

.bg-mask {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      92.73% 55.38% at 22.4% 25.21%,
      rgba(177, 0, 0, 0.38) 0%,
      rgba(177, 0, 0, 0) 100%
    ),
    radial-gradient(
      117.87% 80.84% at 85.2% 66.68%,
      rgba(14, 153, 212, 0.46) 0%,
      rgba(14, 153, 212, 0) 100%
    ),
    rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(0.48rem);
}

.content-wrap {
  position: relative;
  width: 9.2267rem;
  max-width: calc(100% - 0.32rem);
  margin: 0.2rem auto 0;
}

.profile-card {
  height: 4.1333rem;
  border-radius: 1.0418rem;
  padding: 0.5rem 0.56rem 0.44rem;
  background:
    radial-gradient(
      94.22% 94.22% at 86.5% 19.3%,
      rgba(105, 9, 61, 0.73) 0%,
      rgba(105, 9, 61, 0) 100%
    ),
    rgba(0, 0, 0, 0.35);
  border: 0.027rem solid rgba(242, 242, 242, 0.65);
  box-shadow: 0 0.108rem 0.293rem rgba(0, 0, 0, 0.28);
}

.profile-main {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.avatar-wrap {
  width: 1.8933rem;
  height: 1.8933rem;
  border-radius: 50%;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.profile-meta {
  display: flex;
  flex-direction: column;
  gap: 0.22rem;

  .name {
    margin: 0;
    font-family: var(--font-family-SF);
    font-size: 0.6rem;
    line-height: 1;
    font-weight: 700;
    color: #fff;
  }
}

.id-row {
  display: flex;
  align-items: center;
  gap: 0.12rem;
  font-family: var(--font-family-SF);
  font-size: 0.26rem;
  color: #fff;

  .id-tag {
    border-radius: 0.1067rem;
    background: rgba(255, 255, 255, 0.4);
    padding: 0.032rem 0.12rem;
    font-size: 0.215rem;
    line-height: 1.2;
  }
}

.balance-row {
  margin-top: 0.58rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.11rem;
  font-family: var(--font-family-SF);

  span {
    font-size: 0.302rem;
    opacity: 0.95;
  }

  strong {
    font-size: 0.4355rem;
    font-weight: 600;
    line-height: 1;
  }

  img {
    width: 0.72rem;
    height: 0.5867rem;
    object-fit: contain;
  }
}

.shop-grid {
  margin-top: 0.3067rem;
  display: grid;
  grid-template-columns: repeat(3, 2.7607rem);
  gap: 0.3278rem;
  justify-content: space-between;
}

.grid-status {
  grid-column: 1 / -1;
  margin: 0.4rem 0;
  text-align: center;
  font-size: 0.34rem;
  color: rgba(255, 255, 255, 0.86);
}

.shop-card {
  position: relative;
  height: 3.5768rem;
  border: 0;
  border-radius: 0.5241rem;
  background: rgba(255, 255, 255, 0.14);
  color: #f9f9f9;
  padding: 0.1439rem 0.2364rem 0.185rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.shop-card.active {
  background: rgba(178, 0, 0, 0.29);
  box-shadow: 0 0.1067rem 0.2933rem rgba(0, 0, 0, 0.28);
}

.shop-card.auditing {
  background: linear-gradient(164deg, rgba(165, 188, 221, 0.25) 0%, rgba(67, 116, 171, 0.42) 100%);
}

.shop-card:active {
  transform: scale(0.98);
}

.wholesale-tag {
  position: absolute;
  right: 0.08rem;
  top: -0.09rem;
  border-radius: 1rem;
  background: #00644b;
  font-size: 0.2666rem;
  line-height: 0.4677rem;
  padding: 0 0.24rem;

  &::after {
    content: '';
    display: inline-block;
    margin-left: 0.08rem;
    width: 0.16rem;
    height: 0.16rem;
    border-radius: 50%;
    background: rgba(249, 249, 249, 0.7);
    vertical-align: middle;
  }
}

.chest {
  width: 1.5025rem;
  height: 1.4378rem;
  object-fit: contain;
  margin-top: 0.02rem;
}

.title {
  margin: 0.095rem 0 0;
  font-family: var(--font-family-SF);
  font-size: 0.4241rem;
  line-height: 1;
  font-weight: 700;
}

.desc {
  margin: 0.0541rem 0 0;
  font-family: var(--font-family-SF);
  font-size: 0.3375rem;
  line-height: 1;
}

.price-pill {
  margin-top: auto;
  width: 1.9919rem;
  height: 0.5976rem;
  border-radius: 1.0045rem;
  border: 0.0137rem solid rgba(242, 242, 242, 0.8);
  background: linear-gradient(159deg, #05e7ae 7.55%, #00644b 71.92%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.0866rem 0 0.1912rem;

  span {
    font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
    font-size: 0.3186rem;
    line-height: 1;
    color: #f9f9f9;
  }

  img {
    width: 0.4764rem;
    height: 0.4764rem;
    object-fit: cover;
    border-radius: 50%;
  }
}

.rate-bar {
  margin-top: 0.3133rem;
  width: 100%;
  min-height: 0.5867rem;
  border-radius: 0.5867rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.08rem 0.2rem;
  font-size: 0.3405rem;
  font-family: var(--font-family-SF);
  background: rgba(0, 0, 0, 0.22);
}

.pay-channel-list {
  margin-top: 0.2667rem;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.pay-channel {
  border: 0;
  background: transparent;
  color: #fff;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.1rem 0;
}

.pay-channel .left {
  display: flex;
  align-items: center;
  gap: 0.1867rem;
}

.pay-icon {
  width: 1.1467rem;
  height: 1.1467rem;
  border-radius: 50%;
  object-fit: cover;
}

.pay-texts {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.08rem;
}

.line-1 {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 0.077rem;

  .name {
    font-family: var(--font-family-SF);
    font-size: 0.4376rem;
    line-height: 1.2;
    font-weight: 500;
  }

  .plain {
    font-family: var(--font-family-SF);
    font-size: 0.35rem;
    line-height: 1.2;
  }
}

.line-2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.08rem;
}

.tag {
  height: 0.4267rem;
  border-radius: 0.853rem;
  padding: 0 0.14rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.2536rem;
  line-height: 1;
  font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
  background: linear-gradient(157deg, #05e7ae 7.55%, #027a5c 71.92%);
}

.radio {
  width: 0.4rem;
  height: 0.4rem;
  flex-shrink: 0;
}

.pay-now {
  margin-top: 0.2rem;
  width: 100%;
  height: 1.4358rem;
  border: 0.0133rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.0557rem;
  background: linear-gradient(169deg, #05e7ae 7.55%, #027a5c 71.92%);
  color: #fff;
  font-family: 'Afacad', var(--font-family-sans);
  font-size: 0.4rem;
  font-weight: 500;
}

.pay-now.pending {
  background: linear-gradient(169deg, #7f8ca1 7.55%, #4a5568 71.92%);
}

.pay-now:disabled {
  opacity: 0.65;
}

:deep(.trader-apply-popup.van-popup) {
  overflow: visible;
  background: transparent;
}

.trader-apply-card {
  width: 8.7584rem;
  max-width: calc(100vw - 1.28rem);
  min-height: 7.3618rem;
  border-radius: 1.018rem;
  border: 0.0267rem solid transparent;
  padding: 0.8925rem 0.4307rem 0.6379rem;
  box-sizing: border-box;
  color: #fff;
  background:
    linear-gradient(
      113deg,
      rgba(142, 142, 142, 0.6) 0%,
      rgba(103, 103, 103, 0.8) 46.85%,
      #494949 100%
    ),
    rgba(0, 0, 0, 0.35);
  border-image: linear-gradient(
      117deg,
      rgba(242, 242, 242, 0.4) 0%,
      rgba(255, 255, 255, 0) 44.52%,
      rgba(255, 255, 255, 0.5) 100%
    )
    1;
  box-shadow:
    inset 0.0594rem 0.1188rem 0.4821rem rgba(242, 242, 242, 0.9),
    inset 0 0 0.624rem rgba(203, 110, 125, 0.7),
    inset 0 0 0.241rem rgba(0, 0, 0, 0.95),
    0.0964rem 0.1205rem 0.1928rem rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(0.4241rem);
}

.apply-rules {
  margin: 0;
  text-align: center;
  font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
  font-size: 0.36rem;
  line-height: 1.5;
  white-space: normal;
}

.apply-confirm-btn {
  margin-top: 0.3605rem;
  width: 100%;
  height: 1.4358rem;
  border-radius: 1.0557rem;
  border: 0.0133rem solid transparent;
  border-image: linear-gradient(
      117deg,
      rgba(242, 242, 242, 0.8) 0%,
      rgba(255, 255, 255, 0) 44.52%,
      rgba(255, 255, 255, 0.5) 100%
    )
    1;
  background: linear-gradient(157deg, #05e7ae 0%, #027a5c 100%);
  color: #fff;
  font-family: 'Afacad', var(--font-family-sans);
  font-size: 0.4rem;
  font-weight: 500;
}

.apply-confirm-btn:disabled {
  opacity: 0.7;
}

@media (max-width: 360px) {
  .content-wrap {
    max-width: calc(100% - 0.2rem);
  }

  .shop-grid {
    gap: 0.22rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .shop-card {
    padding-left: 0.12rem;
    padding-right: 0.12rem;
  }

  .trader-apply-card {
    max-width: calc(100vw - 0.4rem);
  }
}
</style>
