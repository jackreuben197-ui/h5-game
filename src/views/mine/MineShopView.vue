<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import { postMallShopListApi } from '@/api/prop'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { useUserInfoStore } from '@/stores/userInfo'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const title = computed(() => '我的商城')

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const userInfoStore = useUserInfoStore()

const imgChestA = 'https://www.figma.com/api/mcp/asset/0d034649-1d4c-4fdc-86c8-27dc3f19c760'
const imgChestB = 'https://www.figma.com/api/mcp/asset/2da57908-1ad2-45d5-bf15-873e3ff66617'
const imgChestC = 'https://www.figma.com/api/mcp/asset/571f18d9-22fc-4bff-a810-046d4e2aa541'
const imgCoin = 'https://www.figma.com/api/mcp/asset/f2c2c3d0-4480-477f-bf5e-9ee46cb1e70f'

interface ShopItem {
  id: number
  productId: string
  title: string
  diamondsText: string
  diamondsValue: number
  price: number
  image: string
  wholesaleOnly?: boolean
  auditing?: boolean
}

const loading = ref(false)
const items = ref<ShopItem[]>([])

const userDiamond = computed(() => Number(userInfoStore.userInfo?.user.diamonds ?? 0))

function goBack(): void {
  router.back()
}

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function pickImage(index: number): string {
  const presets = [imgChestA, imgChestB, imgChestC]
  return presets[index % presets.length]
}

async function fetchShopList(): Promise<void> {
  loading.value = true
  try {
    const response = await postMallShopListApi({
      limit: 50,
      offset: 0,
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载商品失败')
    }

    const list = response.data?.list ?? []
    items.value = list.map((row, index) => {
      const num = toSafeNumber(row.num)
      const price = toSafeNumber(row.price)
      const discount = toSafeNumber(row.discount)
      return {
        id: toSafeNumber(row.id),
        productId: String(row.product_id ?? ''),
        title: `商品${index + 1}`,
        diamondsText: `增${num}钻石`,
        diamondsValue: num,
        price,
        image: typeof row.picture === 'string' && row.picture ? row.picture : pickImage(index),
        wholesaleOnly: discount > 0,
      }
    })
  } catch (error) {
    items.value = []
    const message = error instanceof Error ? error.message : '加载商品失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

function goPay(item: ShopItem): void {
  if (item.auditing) {
    return
  }

  void router.push({
    path: '/mine/shop/payment',
    query: {
      id: String(item.id),
      product_id: item.productId,
      title: item.title,
      diamonds: String(item.diamondsValue),
      price: String(item.price),
      balance: String(userDiamond.value),
    },
  })
}

onMounted(() => {
  void fetchShopList()
})
</script>

<template>
  <div class="mine-shop-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="shop-grid">
        <p v-if="loading" class="grid-status">加载中...</p>
        <p v-else-if="!items.length" class="grid-status">暂无商品</p>
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="shop-card"
          :class="{ auditing: item.auditing }"
          @click="goPay(item)"
        >
          <span v-if="item.wholesaleOnly" class="wholesale-tag">批发商专属</span>
          <img class="chest" :src="item.image" :alt="item.title" />
          <p class="title">{{ item.title }}</p>
          <p class="desc">{{ item.diamondsText }}</p>

          <div class="price-pill">
            <span>{{ item.auditing ? '审核中' : item.price.toFixed(2) }}</span>
            <img :src="imgCoin" alt="coin" />
          </div>
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mine-shop-page {
  position: relative;
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.52rem) 0 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  position: relative;
  padding: 0 0.49rem;
}

.shop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 {
    margin: 0;
    font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
    font-size: 0.6503rem;
    line-height: 1.2;
    font-weight: 500;
    color: #fff;
  }
}

.back-btn,
.header-placeholder {
  width: 0.7685rem;
  height: 0.7685rem;
}

.back-btn {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.7685rem;
  line-height: 1;
  padding: 0;
}

.shop-grid {
  margin-top: 0.64rem;
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
  background: rgba(17, 17, 17, 0.28);
  color: #f9f9f9;
  padding: 0.1439rem 0.2364rem 0.185rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.shop-card.auditing {
  background: linear-gradient(164deg, rgba(165, 188, 221, 0.25) 0%, rgba(67, 116, 171, 0.42) 100%);
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
</style>
