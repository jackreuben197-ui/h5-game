import { createRouter, createWebHashHistory, type RouteLocationNormalized } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useWalletStore } from '@/stores/wallet'
import { pinia } from '@/stores/pinia'
import { createLogger } from '@/utils/logger'
import { isPrivateDomainMode } from '@/utils/channelPackage'
import { preloadMainLayoutStyles, syncMainLayout } from '@/utils/mainLayout'
import { syncPostAuthData } from '@/session/postAuthSync'
import { clubRoutes } from './routes/club'
import { mainRoute } from './routes/main'
import { messageRoutes } from './routes/message'
import { mineRoutes } from './routes/mine'

const log = createLogger('[router]')

function walletRouteClubId(to: RouteLocationNormalized): number | undefined {
  const raw = Array.isArray(to.query.clubId) ? to.query.clubId[0] : to.query.clubId
  const clubId = Number(raw)
  return Number.isFinite(clubId) && clubId > 0 ? clubId : undefined
}

function preloadWalletPriceList(to: RouteLocationNormalized): true {
  const walletStore = useWalletStore(pinia)
  void walletStore.loadPriceList(walletRouteClubId(to)).catch((error: unknown) => {
    log.warn('wallet price list preload failed', error)
  })
  return true
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/LoginViewNew.vue'),
    },
    // 下载落地页：公开访问，无需登录（内容对齐 BridgeNotificationPanel 步骤1）
    {
      path: '/download',
      name: 'download-landing',
      component: () => import('@/views/landing/DownloadLandingView.vue'),
      meta: { desktopLayout: 'content' },
    },
    // 开发工具：AppSvgIcon 图标一览，公开访问，无需登录
    {
      path: '/dev/icons',
      name: 'dev-icon-gallery',
      component: () => import('@/views/dev/IconGalleryView.vue'),
    },
    mainRoute,
    ...clubRoutes,
    ...messageRoutes,
    ...mineRoutes,
    {
      path: '/wallet',
      name: 'wallet',
      component: () => import('@/views/wallet/WalletIndexView.vue'),
      meta: { requiresAuth: true, tabKey: 'wallet', desktopLayout: 'content' },
      beforeEnter: preloadWalletPriceList,
    },
    {
      path: '/wallet/orders',
      name: 'wallet-orders',
      component: () => import('@/views/friendsTable/RechargeOrdersView.vue'),
      meta: { requiresAuth: true, tabKey: 'wallet', desktopLayout: 'content' },
      beforeEnter: preloadWalletPriceList,
    },
    {
      path: '/wallet/details',
      name: 'wallet-details',
      component: () => import('@/views/wallet/WalletDetailsView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/wallet/add-bank-card',
      name: 'wallet-add-bank-card',
      component: () => import('@/views/wallet/AddBankCardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/wallet/gift-uc',
      name: 'wallet-gift-uc',
      component: () => import('@/views/wallet/WalletGiftUcView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/gameList',
      name: 'game-list',
      component: () => import('@/views/home/gameList.vue'),
      meta: { requiresAuth: true, tabKey: 'home', desktopLayout: 'content' },
    },
    {
      path: '/casino',
      name: 'casino',
      component: () => import('@/views/home/CasinoView.vue'),
      // 游客可预览娱乐场目录，进入具体游戏时再要求登录。
      meta: { requiresAuth: false, tabKey: 'casino', desktopLayout: 'content' },
    },
    {
      path: '/minigame',
      name: 'minigame',
      component: () => import('@/views/home/MiniGameView.vue'),
      // 游客可预览小游戏专区目录，进入具体游戏时再要求登录。
      meta: { requiresAuth: false, desktopLayout: 'content' },
    },
    {
      path: '/mttList',
      name: 'mtt-list',
      component: () => import('@/views/mtt/mttList.vue'),
      meta: { requiresAuth: true, tabKey: 'mtt', desktopLayout: 'content' },
    },
    {
      path: '/mtt/detail',
      name: 'mtt-detail',
      component: () => import('@/views/mtt/MttDetailView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/createTable',
      name: 'createTable',
      component: () => import('@/views/table/CreateTableTemplate.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/createMtt',
      name: 'createMtt',
      component: () => import('@/views/table/CreateTableTemplateMtt.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tableGameEnd',
      name: 'tableGameEnd',
      component: () => import('@/views/table/TableGameEnd.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
  ],
})

// 未登录场景下，5 个底部 Tab 的真实页面会被重定向到对应访客页，而不是跳登录。
const GUEST_FALLBACK_BY_NAME: Record<string, string> = {
  lobby: 'guest-home',
  club: 'guest-club',
  friendsTable: 'guest-friendsTable',
  message: 'guest-message',
  mine: 'guest-mine',
}

router.beforeEach((to, from) => {
  const gameStore = useGameStore(pinia)
  const token = gameStore.sessionToken
  const isChannelPackage = isPrivateDomainMode()
  log.info('beforeEach', {
    from: from.fullPath || '<init>',
    to: to.fullPath,
    requiresAuth: Boolean(to.meta.requiresAuth),
    hasToken: Boolean(token),
  })

  // Telegram appends tgWebAppData to the hash path — redirect to lobby/guest while auto-login runs.
  if (to.path.startsWith('/tgWebAppData=')) {
    return token ? { name: 'lobby' } : { name: 'guest-home' }
  }

  if (isChannelPackage && (to.name === 'club' || to.name === 'guest-club')) {
    return { name: 'club-index' }
  }

  if (to.meta.requiresAuth && !token) {
    if (isChannelPackage && to.name === 'club-index') {
      return true
    }
    const guestName = typeof to.name === 'string' ? GUEST_FALLBACK_BY_NAME[to.name] : undefined
    if (guestName) {
      if (isChannelPackage && guestName === 'guest-club') {
        return { name: 'club-index' }
      }
      log.warn('redirect to guest page: token missing', {
        from: from.fullPath || '<init>',
        to: to.fullPath,
        guest: guestName,
      })
      return { name: guestName, query: to.query }
    }

    // 非 5tab 的鉴权页面拦截：仅取消导航/兜底 guest-home，不自动弹窗。
    // 弹窗只在 (a) 用户主动点登录 / (b) http 401 / (c) ws token 失效 三种情形触发。
    if (from.name) {
      log.warn('cancel nav: token missing', {
        from: from.fullPath || '<init>',
        to: to.fullPath,
      })
      return false
    }
    log.warn('initial nav fallback to guest-home: token missing', {
      to: to.fullPath,
    })
    return { name: 'guest-home', query: to.query }
  }
  if (isChannelPackage && to.name === 'friendsTable') {
    return { name: 'wallet' }
  }
  if (to.name === 'login') {
    if (token) {
      log.warn('redirect to lobby: already logged in', {
        from: from.fullPath || '<init>',
      })
      return { name: 'lobby' }
    }
    if (from.name) {
      log.warn('cancel nav to /login', { from: from.fullPath })
      return false
    }
    log.warn('initial nav to /login fallback to guest-home')
    return { name: 'guest-home', query: to.query }
  }

  return true
})

router.beforeResolve(async (to) => {
  await preloadMainLayoutStyles(to.meta.desktopLayout, to.path)
  return true
})

router.afterEach((to, from, failure) => {
  if (failure) {
    log.warn('afterEach failure', {
      from: from.fullPath || '<init>',
      to: to.fullPath,
      failure,
    })
    return
  }

  // 导航确认后再切换布局，避免被取消或重定向的导航污染当前页面状态。
  // 这也是桌面布局的唯一运行时入口，不再在 index.html 维护第二份路径白名单。
  syncMainLayout(to.meta.desktopLayout, to.path)

  log.info('afterEach', {
    from: from.fullPath || '<init>',
    to: to.fullPath,
  })

  if (to.meta.requiresAuth) {
    const gameStore = useGameStore(pinia)
    if (gameStore.sessionToken.trim()) {
      syncPostAuthData()
    }
  }
})

router.onError((error) => {
  log.error('router error', error)
})

export default router
