<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import { getUserInfoApi } from '@/api/auth'
import { useGameStore } from '@/stores/game'
import { useMainTabsStore, type MainTabKey } from '@/stores/mainTabs'
import mainBgUrl from '@/assets/images/main_bg.webp'

const router = useRouter()
const gameStore = useGameStore()
const tabsStore = useMainTabsStore()

// 背景图样式：统一由页面控制，不依赖外层容器。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

// 顶部展示登录用户信息，便于确认当前账号。
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

const activeTabLabel = computed(() => {
  const tabLabelMap: Record<MainTabKey, string> = {
    home: '首页',
    club: '俱乐部',
    recharge: '充值',
    message: '消息',
    mine: '我的',
  }
  return tabLabelMap[tabsStore.activeTab] || '首页'
})

async function fetchUserInfoOnEnter(): Promise<void> {
  if (!gameStore.sessionToken) {
    return
  }

  try {
    const userInfo = await getUserInfoApi()
    const user = userInfo.user
    const userId = String(user.p_u_id)
    const userName = String(user.nickname)
    gameStore.setLoginUser({
      account: gameStore.loginAccount || userName,
      nickname: userName,
      userId,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取用户信息失败'
    showFailToast(message)
  }
}

async function onLogout(): Promise<void> {
  gameStore.clearLogin()
  showSuccessToast('已退出登录')
  await router.replace('/login')
}

onMounted(() => {
  void fetchUserInfoOnEnter()
})
</script>

<template>
  <div
    class="lobby-home"
    :style="backgroundStyle"
  >
    <div class="lobby-mask">
      <header class="home-header">
        <p class="home-sub-title">
          牌桌外大厅
        </p>
        <h1 class="home-title">
          {{ activeTabLabel }}
        </h1>
        <p class="home-user">
          当前登录：{{ loginUserText }}
        </p>
      </header>

      <section class="home-actions">
        <VanButton
          plain
          round
          size="small"
          @click="onLogout"
        >
          退出登录
        </VanButton>
      </section>
    </div>
    <MainBottomTab />
  </div>
</template>

<style scoped lang="scss">
.lobby-home {
  position: relative;
  min-height: 100dvh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.lobby-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(13, 17, 24, 0.24) 0%, rgba(5, 10, 16, 0.66) 100%);
}

.home-header {
  padding: calc(env(safe-area-inset-top) + 0.68rem) 0.64rem 0;
  color: #f3f8ff;
}

.home-sub-title {
  margin: 0;
  font-size: 0.34rem;
  letter-spacing: 0.08rem;
  opacity: 0.84;
}

.home-title {
  margin: 0.2rem 0 0;
  font-size: 0.76rem;
  font-weight: 700;
}

.home-user {
  margin: 0.2rem 0 0;
  font-size: 0.34rem;
  opacity: 0.9;
}

.home-actions {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 0.72rem);
  right: 0.64rem;
}

</style>
