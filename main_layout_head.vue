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
import LoginModal from '@/views/login/LoginModal.vue'

const route = useRoute()
const gameStore = useGameStore()
const tabsStore = useMainTabsStore()
const appConfigStore = useAppConfigStore()
const { setLocale } = useTextI18n()

// Σ╕╗σ«╣σÖ¿ΦâîµÖ»σ¢╛∩╝Üσà¿Θí╡Θ¥óσà▒τö¿Σ╕Çσ╝áσ║òσ¢╛∩╝îΘªûΘí╡Σ╜┐τö¿ main_bg2.pngπÇé
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
const isGuestHome = computed(() => route.name === 'guest-home')
const isClub = computed(() => route.meta.tabKey === 'club')
const isMessage = computed(() => route.meta.tabKey === 'message')
const isMine = computed(() => route.meta.tabKey === 'mine')
const isFriendsTable = computed(() => route.meta.tabKey === 'friendsTable')
const isHomeRoute = computed(() => route.name === 'lobby' || route.name === 'guest-home')
const isPrimaryLayout = computed(() => route.meta.desktopLayout === 'primary')
const isGuestRoute = computed(() => String(route.name ?? '').startsWith('guest-'))

async function fetchUserInfoOnEnter(): Promise<void> {
  const token = gameStore.sessionToken.trim()
  if (!token) {
    return
  }

  // σÉîΣ╕Ç token σ£¿σ╜ôσëìσ║öτö¿Σ╝ÜΦ»¥σåàσÅ¬σÉîµ¡ÑΣ╕Çµ¼í userinfo / clubπÇé
  if (gameStore.shouldSyncProfile(token)) {
    // σÉÄσÅ░Θ¥ÖΘ╗ÿσÉîµ¡Ñ∩╝ÜΣ╕ìΘÿ╗σí₧ΘªûΘí╡µ╕▓µƒô∩╝îΣ╕ìµëôµû¡τö¿µê╖µôìΣ╜£πÇé
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

        // Φ»╗σÅûσÉÄτ½»Φ»¡Φ¿Çσ¡ùµ«╡∩╝¢µ£¼σ£░σ╖▓µ£ëτö¿µê╖µÿÄτí«ΘÇëµï⌐τÜäΦ»¡Φ¿Çµù╢Σ╕ìΦªåτ¢û∩╝îΘü┐σàìτÖ╗σ╜òσÉÄΘçìτ╜«Σ╕║µ£ìσèíτ½»σÇ╝πÇé
        const languageCode = resolveLanguageCode(user)
        const localSavedLanguage = localStore.getItem<string>(StorageKey.Language, '')
        if (!localSavedLanguage) {
          setLocale(languageCode || 'en')
        }
      })
      .catch((error) => {
        console.warn('[main-layout] sync user info failed:', error)
      })

    // Σ┐▒Σ╣ÉΘâ¿Σ┐íµü»Θ¥ÖΘ╗ÿσÉîµ¡Ñ∩╝îσñ▒Φ┤ÑΣ╗àΦ«░µùÑσ┐ùπÇé
    void getUserClubApi().catch((error) => {
      console.warn('[main-layout] sync user club failed:', error)
    })

    // σà¿σ▒ÇΘàìτ╜«Θ¥ÖΘ╗ÿµïëσÅûσ╣╢τ╝ôσ¡ÿσê░ Pinia + localStorage∩╝êσ»╣Θ╜É Unity GameCache∩╝ëπÇé
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

    // σà¿σ▒Çµö╢Φ┤╣Θàìτ╜«Θ¥ÖΘ╗ÿµïëσÅûσ╣╢τ╝ôσ¡ÿ∩╝îΘÜÅσÉÄσÉîµ¡Ñτ╗Ö CocosπÇé
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

    // σñÜΦ»¡Φ¿Çµ¿íµ¥┐Θ¥ÖΘ╗ÿµïëσÅûσ╣╢τ╝ôσ¡ÿσê░ localStorage∩╝êµ¿íσ¥ùσê¥σºïσîûµù╢σ╖▓Σ╗Äτ╝ôσ¡ÿµüóσñì∩╝îµ¡ñσñäµ¢┤µû░∩╝ëπÇé
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
})

// Φ╖»τö▒σÅÿσîûµù╢σÉîµ¡Ñσ║òΘâ¿ Tab σà▒Σ║½τè╢µÇü∩╝îτí«Σ┐¥σ¡ÉΘí╡Θ¥óΣ╣ƒΦâ╜τ╗┤µîüµ¡úτí«Θ½ÿΣ║«πÇé
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
      'main-layout--primary': isPrimaryLayout,
      'main-layout--guest': isGuestRoute,
      'main-layout--authenticated': isPrimaryLayout && !isGuestRoute,
    }"
    :style="backgroundStyle"
  >
    <div class="main-layout-content">
      <!-- σ¡Éµ¿íσ¥ùΘí╡Θ¥óσåàσ«╣σî║σƒƒ∩╝Üτö▒Φ╖»τö▒σ¡ÉΘí╡Θ¥óµ╕▓µƒôπÇé -->
      <section class="module-slot">
        <RouterView />
      </section>
    </div>
    <!-- σà¼σà▒σ║òΘâ¿σ»╝Φê¬∩╝ÜΦ╖¿µ¿íσ¥ùσñìτö¿πÇé -->
    <MainBottomTab />
    <LoginModal />
  </div>
</template>

<style scoped lang="scss">
.main-layout {
  position: relative;
  // σ¢║σ«ÜΘ½ÿσ║ª∩╝êborder-box∩╝ë∩╝ÜTelegram guard padding-top σÉâΦ┐¢Φç¬Φ║½Θ½ÿσ║ª∩╝î
  // σ¡Éσ▒éτö¿ height:100% Φç¬σè¿σ╛ùσê░πÇîσÅ»ΦºåΘ½ÿσ║ª ΓêÆ guardπÇì∩╝îσ║òΘâ¿Σ╕ìσåìΦó½Φúüσê░σ»╝Φê¬µáÅΣ╕ïπÇé
  height: var(--app-full-height, var(--app-viewport-height, 100dvh));
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

:root[data-theme='light'] .main-layout--home {
  background-color: transparent;
  background-image: url('@/assets/images/main_bg_light.webp') !important;

  .main-layout-content {
    background: transparent;
  }
}

.main-layout--home {
  background-color: #222627;
  background-image: none !important;
}

.main-layout-content {
  position: relative;
  z-index: 2;
  // τ╗ƒΣ╕ÇΣ╜£Σ╕║ΓÇ£Θí╡Θ¥óµ╗Üσè¿σ«╣σÖ¿ΓÇ¥∩╝Üσ£¿ html/body fixed τÜäσ£║µÖ»Σ╕ïΣ╣ƒσÅ»τ¿│σ«Üµ╗Üσè¿πÇé
  // τê╢σ▒é .main-layout σ╖▓µîë --app-full-height σ«ÜΘ½ÿ∩╝îΦ┐ÖΘçîσ¢₧σê░ dev_light τÜä 100% τ╗ºµë┐∩╝î
  // Telegram guard padding Φç¬σè¿Σ╗ÄσÅ»τö¿Θ½ÿσ║ªΣ╕¡µëúΘÖñπÇé
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior-y: none;
  padding: calc(var(--app-content-safe-area-top, env(safe-area-inset-top)) + 0.2rem) 0rem calc(env(safe-area-inset-bottom) + 2.72rem);
}

.main-layout--home .main-layout-content {
  background: #222627;
  padding-top: var(--app-content-safe-area-top, env(safe-area-inset-top));
  padding-bottom: calc(env(safe-area-inset-bottom) + 2rem);
}

.main-layout.is-guest-home .main-layout-content {
  overflow-y: hidden;
}

.module-slot {
  // σ¡ÉΘí╡Θ¥óσ«╣σÖ¿σÅ¬Φ┤ƒΦ┤úµë┐Φ╜╜σåàσ«╣∩╝îΣ╕ìσåìσìòτï¼µÄÑτ«íµ╗Üσè¿πÇé
  flex: 1;
  min-height: 0;
}
</style>
