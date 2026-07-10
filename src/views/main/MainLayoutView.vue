<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBg2Url from '@/assets/images/main_bg2.jpg'
import { getUserClubApi, getUserInfoApi } from '@/api/user'
import { postDiamondConfigApi, postGlobalConfigApi } from '@/api/config'
import {
  forwardDiamondConfigToCocos,
  forwardGlobalConfigToCocos,
} from '@/bridge/sync/h5BusinessSync'
import { ensureMultiLanguageTemplateLoaded } from '@/utils/multiLanguageTemplate'
import LoginSession from '@/session/loginSession'
import { useMainTabsStore, type MainTabKey } from '@/stores/mainTabs'
import { useGameStore } from '@/stores/game'
import { useAppConfigStore } from '@/stores/appConfig'
import { useTextI18n } from '@/i18n/useTextI18n'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'
import LoginModal from '@/views/login/LoginModal.vue'

const route = useRoute()
const gameStore = useGameStore()
const tabsStore = useMainTabsStore()
const appConfigStore = useAppConfigStore()
const { setLocale } = useTextI18n()

// 主容器背景图：全页面共用一张底图，首页使用 main_bg2.png。
const backgroundStyle = computed(() => ({
  backgroundImage:
    route.meta.tabKey === 'home' ||
    route.meta.tabKey === 'club' ||
    route.meta.tabKey === 'message' ||
    route.meta.tabKey === 'mine' ||
    route.meta.tabKey === 'friendsTable'
      ? `url(${mainBg2Url})`
      : `url(${mainBgUrl})`,
}))

const isHome = computed(() => route.meta.tabKey === 'home')
const isGuestHome = computed(() => route.name === 'guest-home')
const isClub = computed(() => route.meta.tabKey === 'club')
const isMessage = computed(() => route.meta.tabKey === 'message')
const isMine = computed(() => route.meta.tabKey === 'mine')
const isFriendsTable = computed(() => route.meta.tabKey === 'friendsTable')
const isHomeRoute = computed(() => route.name === 'lobby' || route.name === 'guest-home')

async function fetchUserInfoOnEnter(): Promise<void> {
  const token = gameStore.sessionToken.trim()
  if (!token) {
    return
  }

  // 同一 token 在当前应用会话内只同步一次 userinfo / club。
  if (gameStore.shouldSyncProfile(token)) {
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

        // 读取后端语言字段；本地已有用户明确选择的语言时不覆盖，避免登录后重置为服务端值。
        const languageCode = resolveLanguageCode(user)
        const localSavedLanguage = localStore.getItem<string>(StorageKey.Language, '')
        if (!localSavedLanguage) {
          setLocale(languageCode || 'en')
        }
      })
      .catch((error) => {
        console.warn('[main-layout] sync user info failed:', error)
      })

    // 俱乐部信息静默同步，失败仅记日志。
    void getUserClubApi().catch((error) => {
      console.warn('[main-layout] sync user club failed:', error)
    })

    // 全局配置静默拉取并缓存到 Pinia + localStorage（对齐 Unity GameCache）。
    void postGlobalConfigApi({})
      .then((res) => {
        if (res.code === 0 && res.data) {
          appConfigStore.setGlobalConfig(res.data)
          forwardGlobalConfigToCocos(res.data)
        }
      })
      .catch((error) => {
        console.warn('[main-layout] sync global config failed:', error)
      })

    // 全局收费配置静默拉取并缓存，随后同步给 Cocos。
    void postDiamondConfigApi({})
      .then((res) => {
        if (res.code === 0 && res.data) {
          appConfigStore.setDiamondConfig(res.data)
          forwardDiamondConfigToCocos(appConfigStore.diamondConfig)
        }
      })
      .catch((error) => {
        console.warn('[main-layout] sync diamond config failed:', error)
      })

    // 多语言模板静默拉取并缓存到 localStorage（模块初始化时已从缓存恢复，此处更新）。
    void ensureMultiLanguageTemplateLoaded().catch((error) => {
      console.warn('[main-layout] sync multi-language template failed:', error)
    })
  }

  // websocket 就绪逻辑同样走后台，не阻塞首页进入。
  void LoginSession.EnsureWS().catch((error) => {
    console.warn('[main-layout] ensure ws failed:', error)
  })
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
</script>

<template>
  <div
    class="main-layout"
    :class="{
      'is-home': isHome,
      'is-guest-home': isGuestHome,
      'is-club': isClub,
      'is-message': isMessage,
      'is-mine': isMine,
      'is-friends-table': isFriendsTable,
      'main-layout--home': isHomeRoute,
    }"
    :style="backgroundStyle"
  >
    <div class="main-layout-content">
      <!-- 子模块页面内容区域：由路由子页面渲染。 -->
      <section class="module-slot">
        <RouterView />
      </section>
    </div>
    <!-- 公共底部导航：跨模块复用。 -->
    <MainBottomTab />
    <LoginModal />
  </div>
</template>

<style scoped lang="scss">
.main-layout {
  position: relative;
  min-height: var(--app-viewport-height, 100dvh);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  &.is-home,
  &.is-club,
  &.is-message,
  &.is-mine,
  &.is-friends-table {
    background-size: cover;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      mix-blend-mode: luminosity;
      pointer-events: none;
      z-index: 1;
    }
  }

  &.is-home::before {
    backdrop-filter: blur(1.5px);
  }

  &.is-club::before {
    backdrop-filter: blur(6px);
  }

  &.is-message::before {
    backdrop-filter: blur(1.5px);
  }

  &.is-mine::before {
    backdrop-filter: blur(1.5px);
  }

  &.is-friends-table::before {
    backdrop-filter: blur(6px);
  }
}

.main-layout--home {
  background-color: #222627;
  background-image: none !important;
}

.main-layout-content {
  position: relative;
  z-index: 2;
  // 统一作为“页面滚动容器”：在 html/body fixed 的场景下也可稳定滚动。
  // Telegram Mini App 下用 --app-viewport-height（真实可见高度）替代 100dvh，避免底部被裁。
  height: var(--app-viewport-height, 100dvh);
  min-height: var(--app-viewport-height, 100dvh);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior-y: none;
  padding: calc(env(safe-area-inset-top) + 0.2rem) 0rem calc(env(safe-area-inset-bottom) + 2.72rem);
}

.main-layout--home .main-layout-content {
  background: #222627;
  padding-top: env(safe-area-inset-top);
  padding-bottom: calc(env(safe-area-inset-bottom) + 2rem);
}

.main-layout.is-guest-home .main-layout-content {
  overflow-y: hidden;
}

.module-slot {
  // 子页面容器只负责承载内容，不再单独接管滚动。
  flex: 1;
  min-height: 0;
}
</style>
