import {
  createRouter,
  createWebHashHistory,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useWalletStore } from '@/stores/wallet'
import { useLoginModalStore } from '@/stores/loginModal'
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

const legacyGuestRedirects: RouteRecordRaw[] = [
  {
    path: '/guest/home',
    redirect: (to) => ({ name: 'lobby', query: to.query, hash: to.hash }),
  },
]

function walletRouteClubId(to: RouteLocationNormalized): number | undefined {
  const raw = Array.isArray(to.query.clubId) ? to.query.clubId[0] : to.query.clubId
  const clubId = Number(raw)
  return Number.isFinite(clubId) && clubId > 0 ? clubId : undefined
}

function preloadWalletPriceList(to: RouteLocationNormalized): true {
  if (!useGameStore(pinia).isRealUser) {
    return true
  }
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
    ...legacyGuestRedirects,
    mainRoute,
    ...clubRoutes,
    ...messageRoutes,
    ...mineRoutes,
    {
      path: '/wallet',
      name: 'wallet',
      component: () => import('@/views/wallet/WalletIndexView.vue'),
      meta: {
        requiresAuth: true,
        guestPreview: true,
        tabKey: 'wallet',
        desktopLayout: 'content',
      },
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
      meta: {
        requiresAuth: true,
        guestPreview: true,
        tabKey: 'poker',
        desktopLayout: 'content',
      },
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
      meta: {
        requiresAuth: true,
        guestPreview: true,
        tabKey: 'mtt',
        desktopLayout: 'content',
      },
    },
    {
      path: '/mtt/detail',
      name: 'mtt-detail',
      component: () => import('@/views/mtt/MttDetailView.vue'),
      meta: { requiresAuth: true, guestPreview: true, desktopLayout: 'content' },
    },
    {
      path: '/createTable',
      name: 'createTable',
      component: () => import('@/views/table/CreateTableTemplate.vue'),
      meta: { requiresAuth: true, guestPreview: true, desktopLayout: 'content' },
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

router.beforeEach((to, from) => {
  const gameStore = useGameStore(pinia)
  const token = gameStore.sessionToken
  const isRealUser = gameStore.isRealUser
  const isChannelPackage = isPrivateDomainMode()
  log.info('beforeEach', {
    from: from.fullPath || '<init>',
    to: to.fullPath,
    requiresAuth: Boolean(to.meta.requiresAuth),
    hasToken: Boolean(token),
    isGuestAccount: gameStore.isGuestAccount,
  })

  // Telegram appends tgWebAppData to the hash path — redirect to lobby while auto-login runs.
  if (to.path.startsWith('/tgWebAppData=')) {
    return { name: 'lobby' }
  }

  if (isChannelPackage && to.name === 'club') {
    return { name: 'club-index' }
  }

  if (to.meta.requiresAuth && !isRealUser && !to.meta.guestPreview) {
    if (isChannelPackage && to.name === 'club-index') {
      return true
    }
    if (from.name) {
      // 应用内由用户发起的受限页面导航才弹登录；首次打开深链只回到可预览首页。
      useLoginModalStore(pinia).open(to.fullPath)
      log.warn('cancel nav: token missing', {
        from: from.fullPath || '<init>',
        to: to.fullPath,
      })
      return false
    }
    log.warn('initial nav fallback to home: real user required', {
      to: to.fullPath,
    })
    return { name: 'lobby' }
  }
  if (isChannelPackage && to.name === 'friendsTable') {
    return { name: 'wallet' }
  }
  if (to.name === 'login') {
    if (isRealUser) {
      log.warn('redirect to lobby: already logged in', {
        from: from.fullPath || '<init>',
      })
      return { name: 'lobby' }
    }
    if (from.name) {
      log.warn('cancel nav to /login', { from: from.fullPath })
      useLoginModalStore(pinia).open()
      return false
    }
    log.warn('initial nav to /login fallback to home')
    return { name: 'lobby' }
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
    if (gameStore.isRealUser) {
      syncPostAuthData()
    }
  }
})

router.onError((error) => {
  log.error('router error', error)
})

export default router
