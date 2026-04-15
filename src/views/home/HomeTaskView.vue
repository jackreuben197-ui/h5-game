<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function backToHome(): void {
  void router.push('/home')
}
</script>

<template>
  <div class="module-card">
    <h2 class="module-title">首页子页面</h2>
    <p class="module-desc">示例：任务中心 / 推荐活动 / 新手引导等。</p>
    <VanButton plain block @click="backToHome">返回首页模块</VanButton>
  </div>
</template>

<style scoped lang="scss">
.module-card {
  padding: 0.44rem;
  border-radius: 0.34rem;
  background: rgba(8, 30, 52, 0.6);
  border: 0.02rem solid rgba(216, 232, 255, 0.32);
}

.module-title {
  margin: 0;
  font-size: 0.5rem;
  color: #ffffff;
}

.module-desc {
  margin: 0.2rem 0 0.34rem;
  font-size: 0.34rem;
  color: rgba(235, 245, 255, 0.9);
}
</style>
