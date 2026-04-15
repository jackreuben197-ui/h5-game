<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToDetail(): void {
  void router.push('/message/detail')
}
</script>

<template>
  <div class="module-card">
    <h2 class="module-title">消息模块</h2>
    <p class="module-desc">系统通知、俱乐部消息、活动消息聚合入口。</p>
    <VanButton type="primary" block @click="goToDetail">进入消息子页面</VanButton>
  </div>
</template>

<style scoped lang="scss">
.module-card {
  padding: 0.44rem;
  border-radius: 0.34rem;
  background: rgba(20, 34, 58, 0.6);
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
