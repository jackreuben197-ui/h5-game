<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { RouterView, useRoute, useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { getUserInfoApi } from '@/api/auth'
import LoginSession from '@/session/loginSession'
import MainBottomTab from '@/components/MainBottomTab.vue'
import { useMainTabsStore, type MainTabKey } from '@/stores/mainTabs'
import { useGameStore } from '@/stores/game'
import { useTextI18n } from '@/i18n/useTextI18n'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const tabsStore = useMainTabsStore()
const { setLocale } = useTextI18n()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

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

async function fetchUserInfoOnEnter(): Promise<void> {
  if (!gameStore.sessionToken) {
    return
  }

  try {
    const userInfo = await getUserInfoApi()
    const user = userInfo.user as Record<string, unknown>
    const userId = String(user.p_u_id ?? user.pUid ?? user.userid ?? '')
    const userName = String(user.nickname ?? gameStore.loginAccount ?? '')

    gameStore.setLoginUser({
      account: gameStore.loginAccount || userName,
      nickname: userName,
      userId,
    })

    // 读取后端语言字段；如果没有定义，则按英文兜底。
    const languageCode = resolveLanguageCode(user)
    setLocale(languageCode || 'en')

    // 对齐 Cocos ProcedureEnterLobby：用户信息后同步 websocket 端口。
    await LoginSession.SyncWS()
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取用户信息失败'
    showFailToast(message)
  }
}

// 路由变化时同步底部 Tab 共享状态，确保子页面也能维持正确高亮。
watch(
  () => route.meta.tabKey,
  (tabKey) => {
    if (typeof tabKey === 'string') {
      tabsStore.setActiveTab(tabKey as MainTabKey)
    }
  },
  { immediate: true },
)

async function onLogout(): Promise<void> {
  gameStore.clearLogin()
  showSuccessToast('已退出登录')
  await router.replace('/login')
}

function resolveLanguageCode(user: Record<string, unknown>): string {
  const languageKeys = ['language', 'client_language', 'system_language', 'lt']
  for (const key of languageKeys) {
    const value = user[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

onMounted(() => {
  void fetchUserInfoOnEnter()
})
</script>

<template>
  <div class="main-layout" :style="backgroundStyle">
    <div class="main-layout-mask" />

    <div class="main-layout-content">
      <header class="main-header">
        <p class="main-sub-title">牌桌外大厅</p>
        <h1 class="main-title">{{ moduleTitle }}</h1>
        <p class="main-user">当前登录：{{ loginUserText }}</p>
        <VanButton plain round size="small" class="logout-btn" @click="onLogout">退出登录</VanButton>
      </header>

      <!-- 子模块页面内容区域：由路由子页面渲染。 -->
      <section class="module-slot">
        <RouterView />
      </section>
    </div>

    <!-- 公共底部导航：跨模块复用。 -->
    <MainBottomTab />
  </div>
</template>

<style scoped lang="scss">
.main-layout {
  position: relative;
  min-height: 100dvh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.main-layout-mask {
  position: absolute;
  inset: 0;
}

.main-layout-content {
  position: relative;
  z-index: 2;
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.62rem) 0.48rem calc(env(safe-area-inset-bottom) + 2.72rem);
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

.module-slot {
  margin-top: 0.42rem;
}
</style>
