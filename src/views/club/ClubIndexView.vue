<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToMembers(): void {
  void router.push('/club/members')
}
</script>

<template>
  <div class="module-card">
    <h2 class="module-title">俱乐部模块</h2>
    <p class="module-desc">俱乐部列表、创建俱乐部、邀请成员、审核入口等。</p>
    <VanButton type="primary" block @click="goToMembers">进入俱乐部子页面</VanButton>
  </div>
</template>

<style scoped lang="scss">
.module-card {
  padding: 0.44rem;
  border-radius: 0.34rem;
  background: rgba(17, 28, 65, 0.58);
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
