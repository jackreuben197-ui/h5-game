<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 首页模块的示例子页面入口。
function goToTaskPage(): void {
  void router.push('/home/task')
}
// 跳转到牌局列表
function goToGameList(): void {
  void router.push('/gameList')
}
</script>

<template>
  <div class="module-card">
    <h2 class="module-title">首页模块</h2>
    <p class="module-desc">这里可以放首页 Banner、活动卡片、公告入口等内容。</p>
    <VanButton type="primary" block @click="goToTaskPage">进入首页子页面</VanButton>
    <VanButton type="primary" class="button" block @click="goToGameList">扑克专区</VanButton>
  </div>
</template>

<style scoped lang="scss">
.module-card {
  padding: 0.44rem;
  border-radius: 0.34rem;
  background: rgba(5, 21, 38, 0.55);
  border: 0.02rem solid rgba(216, 232, 255, 0.32);
  backdrop-filter: blur(0.12rem);
}

.module-title {
  margin: 0;
  font-size: 0.54rem;
  color: #ffffff;
}

.module-desc {
  margin: 0.24rem 0 0.36rem;
  font-size: 0.34rem;
  line-height: 1.6;
  color: rgba(235, 245, 255, 0.9);
}
.button{
  margin-top: 5px;
}
</style>
