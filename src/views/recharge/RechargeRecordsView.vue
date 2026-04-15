<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function backToRecharge(): void {
  void router.push('/recharge')
}
</script>

<template>
  <div class="module-card">
    <h2 class="module-title">充值子页面</h2>
    <p class="module-desc">示例：充值记录、订单状态、支付结果查询。</p>
    <VanButton plain block @click="backToRecharge">返回充值模块</VanButton>
  </div>
</template>

<style scoped lang="scss">
.module-card {
  padding: 0.44rem;
  border-radius: 0.34rem;
  background: rgba(9, 40, 71, 0.62);
  border: 0.02rem solid rgba(216, 232, 255, 0.32);
}
.module-title {
  margin: 0;
  font-size: 0.5rem;
  color: #fff;
}
.module-desc {
  margin: 0.2rem 0 0.34rem;
  font-size: 0.34rem;
  color: rgba(235, 245, 255, 0.9);
}
</style>
