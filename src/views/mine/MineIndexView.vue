<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToSettings(): void {
  void router.push('/mine/settings')
}
</script>

<template>
  <div class="module-card">
    <h2 class="module-title">我的模块</h2>
    <p class="module-desc">个人资料、资产、战绩、设置入口。</p>
    <VanButton type="primary" block @click="goToSettings">进入我的子页面</VanButton>
  </div>
</template>

<style scoped lang="scss">
.module-card {
  padding: 0.44rem;
  border-radius: 0.34rem;
  background: rgba(26, 35, 76, 0.6);
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
