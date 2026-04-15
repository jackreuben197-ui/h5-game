<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToRecords(): void {
  void router.push('/recharge/records')
}
</script>

<template>
  <div class="module-card">
    <h2 class="module-title">充值模块</h2>
    <p class="module-desc">充值入口、支付方式、快捷金额与活动优惠。</p>
    <VanButton type="primary" block @click="goToRecords">进入充值子页面</VanButton>
  </div>
</template>

<style scoped lang="scss">
.module-card {
  padding: 0.44rem;
  border-radius: 0.34rem;
  background: rgba(7, 42, 75, 0.58);
  border: 0.02rem solid rgba(216, 232, 255, 0.32);
}
.module-title {
  margin: 0;
  font-size: 0.54rem;
  color: #fff;
}
.module-desc {
  margin: 0.24rem 0 0.36rem;
  font-size: 0.34rem;
  color: rgba(235, 245, 255, 0.9);
}
</style>
