<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function backToMessage(): void {
  void router.push('/message')
}
</script>

<template>
  <div class="module-card">
    <h2 class="module-title">消息子页面</h2>
    <p class="module-desc">示例：公告详情、私信详情、已读/未读管理。</p>
    <VanButton plain block @click="backToMessage">返回消息模块</VanButton>
  </div>
</template>

<style scoped lang="scss">
.module-card {
  padding: 0.44rem;
  border-radius: 0.34rem;
  background: rgba(24, 40, 60, 0.62);
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
