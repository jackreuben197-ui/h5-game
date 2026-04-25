<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const imgQr = 'https://www.figma.com/api/mcp/asset/1aabef25-95a5-4300-9235-709ff3c1d16a'

const price = computed(() => Number(route.query.price ?? 123.45))
const diamonds = computed(() => Number(route.query.diamonds ?? 5000))
const balance = computed(() => Number(route.query.balance ?? 0))

function closePage(): void {
  router.back()
}

function onCopyAddress(): void {
  void navigator.clipboard?.writeText('TKUksSTiyT80KSGdrTrf7ywTe')
}
</script>

<template>
  <div class="shop-pay-page">
    <div class="mask" />

    <section class="pay-card">
      <header class="pay-head">
        <p class="title">确认付款</p>
        <p class="unit">当前参考单价:1钻石=0.025USDT</p>
        <button class="close" type="button" @click="closePage">×</button>
      </header>

      <div class="amount-box">{{ price.toFixed(2) }}</div>
      <p class="amount-label">付款金额</p>

      <div class="pay-methods">
        <div class="method qr-method">
          <p>扫描二维码转账</p>
          <div class="qr-wrap">
            <img :src="imgQr" alt="qr" />
          </div>
        </div>

        <div class="method usdt-method">
          <p class="t1">复制钱包地址转账</p>
          <p class="t2">复制钱包地址转币</p>
          <p class="t3">TKUksSTiyT80KSGdrTrf7ywTe</p>
          <button type="button" class="copy-btn" @click="onCopyAddress">复制</button>
        </div>
      </div>

      <p class="tips">提示：复制上方钱包地址转币完，或使用钱包扫描二维码完成付款</p>
      <p class="sub-tips">购买钻石：{{ diamonds }}，账户钻石：{{ balance }}</p>

      <button type="button" class="paying-btn">
        <span>支付中</span>
        <small>12:34</small>
      </button>
    </section>
  </div>
</template>

<style scoped lang="scss">
.shop-pay-page {
  min-height: 100dvh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.48rem;
  background:
    radial-gradient(60% 44% at 20% 14%, rgba(231, 175, 141, 0.66) 0%, rgba(231, 175, 141, 0) 100%),
    radial-gradient(54% 46% at 36% 86%, rgba(207, 111, 160, 0.7) 0%, rgba(207, 111, 160, 0) 100%),
    radial-gradient(44% 38% at 92% 84%, rgba(0, 182, 212, 0.62) 0%, rgba(0, 182, 212, 0) 100%),
    linear-gradient(158deg, #b68d9f 0%, #92698f 54%, #6a5d87 100%);
}

.mask {
  position: absolute;
  inset: 0;
  background: rgba(12, 12, 12, 0.6);
}

.pay-card {
  position: relative;
  width: 8.4541rem;
  border: 0.0255rem solid rgba(242, 242, 242, 0.4);
  border-radius: 0.9703rem;
  padding: 0.4187rem 0.4106rem 0.4106rem;
  color: #f9f9f9;
  backdrop-filter: blur(0.2022rem);
  background:
    linear-gradient(103deg, rgba(142, 142, 142, 0.3) 2.93%, rgba(103, 103, 103, 0.4) 43.62%, rgba(73, 73, 73, 0.5) 89.79%),
    rgba(0, 0, 0, 0.25);
  box-shadow:
    inset 0 0 0.2298rem #000,
    inset 0.0566rem 0.1132rem 0.4596rem rgba(242, 242, 242, 0.9),
    0.0919rem 0.1149rem 0.0919rem rgba(0, 0, 0, 0.25);
}

.pay-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.15rem;
}

.title {
  margin: 0;
  font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
  font-size: 0.4267rem;
  line-height: 1;
}

.unit {
  margin: 0;
  font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
  font-size: 0.2933rem;
  line-height: 1;
  white-space: nowrap;
}

.close {
  width: 1.024rem;
  height: 1.024rem;
  border: 0;
  border-radius: 50%;
  color: #fff;
  font-size: 0.72rem;
  line-height: 1;
  background: rgba(255, 255, 255, 0.15);
}

.amount-box {
  margin-top: 0.2667rem;
  height: 1.2155rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Keania One', 'Afacad', var(--font-family-sans);
  font-size: 0.7829rem;
  color: #fff;
  text-shadow: 0 0.1066rem 0.1066rem rgba(0, 0, 0, 0.25);
  background: linear-gradient(130deg, rgba(255, 255, 255, 0.1) 21.1%, rgba(230, 230, 230, 0.1) 71.43%);
}

.amount-label {
  margin: 0.2133rem 0 0;
  text-align: center;
  font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
  font-size: 0.4267rem;
  line-height: 1;
}

.pay-methods {
  margin-top: 0.4533rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4533rem;
}

.method {
  height: 3.1733rem;
  border-radius: 0.6441rem;
  background: rgba(0, 0, 0, 0.29);
}

.qr-method {
  padding: 0.2133rem;

  p {
    margin: 0;
    text-align: center;
    font-family: 'PingFang SC', var(--font-family-sans);
    font-size: 0.2899rem;
    line-height: 1.4;
  }
}

.qr-wrap {
  margin: 0.1067rem auto 0;
  width: 2.2672rem;
  height: 2.2672rem;
  border-radius: 0.3869rem;
  border: 0.019rem solid #05e7ae;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 1.7787rem;
    height: 1.7787rem;
    object-fit: cover;
  }
}

.usdt-method {
  padding: 0.2667rem 0.32rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.t1,
.t2,
.t3 {
  margin: 0;
  width: 100%;
  text-align: left;
  color: #ffeaea;
}

.t1 {
  font-family: var(--font-family-SF);
  font-size: 0.2909rem;
  line-height: 1.32;
  text-align: center;
}

.t2,
.t3 {
  margin-top: 0.08rem;
  font-family: var(--font-family-SF);
  font-size: 0.1867rem;
  line-height: 1.32;
}

.copy-btn {
  margin-top: auto;
  width: 2.6933rem;
  height: 0.7396rem;
  border: 0.0172rem solid rgba(242, 242, 242, 0.8);
  border-radius: 0.8035rem;
  color: #fff;
  font-size: 0.2909rem;
  background: linear-gradient(161deg, #55f329 7.55%, #3ead06 71.92%);
}

.tips,
.sub-tips {
  margin: 0.24rem 0 0;
  text-align: center;
  font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
  font-size: 0.2667rem;
  line-height: 1.2;
}

.sub-tips {
  margin-top: 0.12rem;
  opacity: 0.9;
}

.paying-btn {
  margin-top: 0.24rem;
  width: 100%;
  height: 1.4358rem;
  border: 0.0133rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.0557rem;
  color: #f9f9f9;
  background: linear-gradient(166deg, #05e7ae 7.55%, #027a5c 71.92%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  span {
    font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
    font-size: 0.4rem;
    line-height: 1.2;
  }

  small {
    font-size: 0.2667rem;
    line-height: 1.2;
  }
}
</style>
