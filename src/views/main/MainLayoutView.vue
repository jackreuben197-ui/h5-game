<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { getUserClubApi, getUserInfoApi } from '@/api/auth'
import LoginSession from '@/session/loginSession'
import { useMainTabsStore, type MainTabKey } from '@/stores/mainTabs'
import { useGameStore } from '@/stores/game'
import { useTextI18n } from '@/i18n/useTextI18n'

const route = useRoute()
const gameStore = useGameStore()
const tabsStore = useMainTabsStore()
const { setLocale } = useTextI18n()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

async function fetchUserInfoOnEnter(): Promise<void> {
  if (!gameStore.sessionToken) {
    return
  }

  // 后台静默同步：不阻塞首页渲染，不打断用户操作。
  void getUserInfoApi()
    .then((userInfo) => {
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
    })
    .catch((error) => {
      console.warn('[main-layout] sync user info failed:', error)
    })

  // 俱乐部信息静默同步，失败仅记日志。
  void getUserClubApi().catch((error) => {
    console.warn('[main-layout] sync user club failed:', error)
  })

  // websocket 就绪逻辑同样走后台，不阻塞首页进入。
  void LoginSession.EnsureWS().catch((error) => {
    console.warn('[main-layout] ensure ws failed:', error)
  })
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
    <div class="main-layout-content">
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

.main-layout-content {
  position: relative;
  z-index: 2;
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.62rem) 0.0rem
    calc(env(safe-area-inset-bottom) + 2.72rem);
}
</style>
