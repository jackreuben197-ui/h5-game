<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBg2Url from '@/assets/images/main_bg2.jpg'
import mainBgLightUrl from '@/assets/images/main_bg_light.webp'
import { theme } from '@/utils/theme'
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
import { useUserInfoStore } from '@/stores/userInfo'
import { isPrivateDomainMode } from '@/utils/channelPackage'
import { useChannelBottomMenu } from '@/composables/useChannelBottomMenu'

const route = useRoute()
const gameStore = useGameStore()
const tabsStore = useMainTabsStore()
const appConfigStore = useAppConfigStore()
const userInfoStore = useUserInfoStore()
const { setLocale } = useTextI18n()
const { isVersionB } = useChannelBottomMenu()

// 主容器背景图：全页面共用一张底图，首页使用 main_bg2.png。
const LIGHT_THEME_TABS: ReadonlyArray<MainTabKey> = [
  'message',
  'mine',
  'friendsTable',
  'club',
  'home',
]

const backgroundStyle = computed(() => {
  const tabKey = route.meta.tabKey as MainTabKey | undefined
  if (theme.value === 'light' && tabKey && LIGHT_THEME_TABS.includes(tabKey)) {
    return { backgroundImage: `url(${mainBgLightUrl})` }
  }

  return {
    backgroundImage: route.meta.tabKey === 'home' ? `url(${mainBg2Url})` : `url(${mainBgUrl})`,
  }
})

const isHome = computed(() => route.meta.tabKey === 'home')
const isClub = computed(() => route.meta.tabKey === 'club')
const isMessage = computed(() => route.meta.tabKey === 'message')
const isMine = computed(() => route.meta.tabKey === 'mine')
const isFriendsTable = computed(() => route.meta.tabKey === 'friendsTable')
const isHomeRoute = computed(() => route.name === 'lobby')
const isHomeMenu = computed(() => route.name === 'lobby')
const isPrimaryLayout = computed(() => route.meta.desktopLayout === 'primary')
const isGuestPreview = computed(() => !gameStore.isRealUser)

async function fetchUserInfoOnEnter(): Promise<void> {
  const token = gameStore.sessionToken.trim()
  // 体验账号只做预览，真实账号资料由会话层统一同步。
  if (!token || !gameStore.isRealUser) {
    return
  }

  // 同一 token 在当前应用会话内只同步一次 userinfo / club。
  if (gameStore.shouldSyncIdentity(token)) {
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
  if (isPrivateDomainMode() && !gameStore.isRealUser) {
    void userInfoStore.ensureChannelDefaultClub()
  }
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
      'is-club': isClub,
      'is-message': isMessage,
      'is-mine': isMine,
      'is-friends-table': isFriendsTable,
      'main-layout--home': isHomeRoute,
      'main-layout--pure-black': isHomeMenu,
      'main-layout--primary': isPrimaryLayout,
      'main-layout--guest': isGuestPreview,
      'main-layout--authenticated': isPrimaryLayout && !isGuestPreview,
      'is-version-b': isVersionB,
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
  </div>
</template>

<style scoped lang="scss">
.main-layout {
  position: relative;
  // 固定高度（border-box）：Telegram guard padding-top 吃进自身高度，
  min-height: var(--app-full-height, var(--app-viewport-height, 100dvh));
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
      display: none;
    }
  }
}

:root[data-theme='light'] .main-layout.is-message::before,
:root[data-theme='light'] .main-layout.is-mine::before,
:root[data-theme='light'] .main-layout.is-friends-table::before,
:root[data-theme='light'] .main-layout.is-club::before,
:root[data-theme='light'] .main-layout.is-home::before {
  background-color: transparent;
  backdrop-filter: none;
}

.main-layout--pure-black {
  background-color: #222627;
  background-image: none !important;

  .main-layout-content {
    background: #222627;
  }
}

:root[data-theme='light'] .main-layout--pure-black {
  background-color: transparent;
  background-image: url('@/assets/images/main_bg_light.webp') !important;

  .main-layout-content {
    background: transparent;
  }
}

:root[data-theme='light'] .main-layout--home {
  background-color: transparent;
  background-image: url('@/assets/images/main_bg_light.webp') !important;

  .main-layout-content {
    background: transparent;
  }
}

.main-layout-content {
  position: relative;
  z-index: 2;
  // 统一作为“页面滚动容器”：在 html/body fixed 的背景下也可稳定滚动。
  height: var(--app-full-height, var(--app-viewport-height, 100dvh));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior-y: none;
  padding: calc(var(--app-content-safe-area-top, env(safe-area-inset-top)) + 0.2rem) 0rem
    calc(env(safe-area-inset-bottom) + 2.72rem);
}

.main-layout--home .main-layout-content {
  background: #222627;
  padding-top: var(--app-content-safe-area-top, env(safe-area-inset-top));
  padding-bottom: calc(env(safe-area-inset-bottom) + 2rem);
}

.main-layout.is-version-b .main-layout-content {
  padding-bottom: calc(env(safe-area-inset-bottom) + 3.0rem);
}

.module-slot {
  // 子页面容器只负责承载内容，不再单独接管滚动。
  flex: 1;
  min-height: 0;
}
</style>
