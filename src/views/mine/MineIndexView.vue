<script setup lang="ts">
import { computed } from 'vue'
import { showSuccessToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import LoginSession from '@/session/loginSession'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

function goToSettings(): void {
  void router.push('/mine/settings')
}
const loginUserText = computed(() => {
  if (gameStore.loginAccount && gameStore.loginNickname) {
    return `${gameStore.loginAccount} (${gameStore.loginNickname})`
  }
  if (gameStore.loginNickname) {
    return gameStore.loginNickname
  }
  if (gameStore.loginAccount) {
    return gameStore.loginAccount
  }
  return '-'
})
// 模块标题由路由元信息提供，避免每个页面都重复写头部。
const moduleTitle = computed(() => {
  if (typeof route.meta.moduleTitle === 'string') {
    return route.meta.moduleTitle
  }
  return '牌桌外大厅'
})

async function onLogout(): Promise<void> {
  // 退出登录时同步清理 WS 连接与端口缓存，避免脏会话残留。
  LoginSession.ClearWS()
  gameStore.clearLogin()
  showSuccessToast('已退出登录')
  await router.replace('/login')
}
</script>

<template>
  <header class="main-header">
    <p class="main-sub-title">牌桌外大厅</p>
    <h1 class="main-title">{{ moduleTitle }}</h1>
    <p class="main-user">当前登录：{{ loginUserText }}</p>
    <VanButton plain round size="small" class="logout-btn" @click="onLogout">退出登录</VanButton>
  </header>
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
.main-header {
  position: relative;
  color: #eef6ff;
}

.main-sub-title {
  margin: 0;
  font-size: 0.32rem;
  letter-spacing: 0.08rem;
  opacity: 0.85;
}

.main-title {
  margin: 0.16rem 0 0;
  font-size: 0.72rem;
  font-weight: 700;
}

.main-user {
  margin: 0.16rem 0 0;
  font-size: 0.34rem;
  opacity: 0.9;
}

.logout-btn {
  position: absolute;
  top: 0.08rem;
  right: 0;
}
</style>
