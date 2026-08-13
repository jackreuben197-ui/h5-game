import { createRouter, createWebHashHistory, type RouteLocationNormalized } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useWalletStore } from '@/stores/wallet'
import { pinia } from '@/stores/pinia'
import { createLogger } from '@/utils/logger'
import { isChannelPackageHost } from '@/utils/channelPackage'
import { preloadMainLayoutStyles, syncMainLayout } from '@/utils/mainLayout'
import { syncPostAuthData } from '@/session/postAuthSync'

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
    {
      path: '/',

      component: () => import('@/views/main/MainLayoutView.vue'),
      redirect: '/home',
      children: [
        {
          path: 'home',
          name: 'lobby',

          component: () => import('@/views/home/HomeIndexView.vue'),
          meta: {
            requiresAuth: true,
            tabKey: 'home',
            moduleTitle: '首页',
            desktopLayout: 'primary',
          },
        },
        {
          path: 'club',
          name: 'club',
          component: () => import('@/views/club/ClubListView.vue'),
          meta: {
            requiresAuth: true,
            tabKey: 'club',
            moduleTitle: '俱乐部',
            desktopLayout: 'primary',
          },
        },
        {
          path: 'friendsTable',
          name: 'friendsTable',
          component: () => import('@/views/friendsTable/FriendsTableIndexView.vue'),
          meta: {
            requiresAuth: true,
            tabKey: 'friendsTable',
            moduleTitle: '朋友桌',
            desktopLayout: 'primary',
          },
        },
        {
          path: 'message',
          name: 'message',
          component: () => import('@/views/message/MessageIndexView.vue'),
          meta: {
            requiresAuth: true,
            tabKey: 'message',
            moduleTitle: '消息',
            desktopLayout: 'primary',
          },
        },
        {
          path: 'mine',
          name: 'mine',
          component: () => import('@/views/mine/MineIndexView.vue'),
          meta: {
            requiresAuth: true,
            tabKey: 'mine',
            moduleTitle: '我的',
            desktopLayout: 'primary',
          },
        },
        // 访客（未登录）专用页面，与登录版共用 MainLayoutView 与底部 Tab。
        {
          path: 'guest/home',
          name: 'guest-home',
          component: () => import('@/views/guest/GuestHomeView.vue'),
          meta: { tabKey: 'home', moduleTitle: '首页', desktopLayout: 'primary' },
        },
        {
          path: 'guest/club',
          name: 'guest-club',
          component: () => import('@/views/guest/GuestClubView.vue'),
          meta: { tabKey: 'club', moduleTitle: '俱乐部', desktopLayout: 'primary' },
        },
        {
          path: 'guest/friendsTable',
          name: 'guest-friendsTable',
          component: () => import('@/views/guest/GuestFriendsTableView.vue'),
          meta: { tabKey: 'friendsTable', moduleTitle: '朋友桌', desktopLayout: 'primary' },
        },
        {
          path: 'guest/message',
          name: 'guest-message',
          component: () => import('@/views/guest/GuestMessageView.vue'),
          meta: { tabKey: 'message', moduleTitle: '消息', desktopLayout: 'primary' },
        },
        {
          path: 'guest/mine',
          name: 'guest-mine',
          component: () => import('@/views/guest/GuestMineView.vue'),
          meta: { tabKey: 'mine', moduleTitle: '我的', desktopLayout: 'primary' },
        },
      ],
    },
    // 子页面独立路由：按业务需要决定是否复用 MainLayoutView。
    {
      path: '/club/create',
      name: 'club-create',
      component: () => import('@/views/club/ClubCreateView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/index',
      name: 'club-index',
      component: () => import('@/views/club/ClubIndexView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/table/create',
      name: 'club-table-create',
      component: () => import('@/views/table/CreateTableSelect.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/jackpot/create',
      name: 'club-jackpot-create',
      component: () => import('@/views/club/ClubJackpotCreateView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/jackpot',
      name: 'club-jackpot',
      component: () => import('@/views/club/ClubJackpotListView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/jackpot/pool-reward',
      name: 'club-jackpot-pool-reward',
      component: () => import('@/views/club/ClubPoolRewardView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/jackpot/pool-reward/reward-records',
      name: 'club-jackpot-pool-reward-reward-records',
      component: () => import('@/views/club/ClubPoolRewardWinRecordsView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/jackpot/pool-reward/contribution-records',
      name: 'club-jackpot-pool-reward-contribution-records',
      component: () => import('@/views/club/ClubPoolRewardContributionRecordsView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/detail',
      name: 'club-detail',
      component: () => import('@/views/club/ClubDetailView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/downline-members',
      name: 'club-downline-members',
      component: () => import('@/views/club/ClubDownlineMembersView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/level',
      name: 'club-level',
      component: () => import('@/views/club/ClubLevelView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/edit-description',
      name: 'club-edit-description',
      component: () => import('@/views/club/ClubEditDesView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/edit-name',
      name: 'club-edit-name',
      component: () => import('@/views/club/ClubEditNameView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/members',
      name: 'club-members',
      component: () => import('@/views/club/ClubMembersView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/member/:memberId',
      name: 'club-member-detail',
      component: () => import('@/views/club/ClubMemberDetailView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/member/:memberId/agent-profit',
      name: 'club-member-agent-profit',
      component: () => import('@/views/club/ClubAgentProfitSettingView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/member/:memberId/offline-players',
      name: 'club-member-offline-players',
      component: () => import('@/views/club/ClubAgentOfflinePlayersView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/member/:memberId/vip-statistics',
      name: 'club-member-vip-statistics',
      component: () => import('@/views/club/ClubAgentVipStatisticsView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/member/:memberId/bind-agent',
      name: 'club-member-bind-agent',
      component: () => import('@/views/club/ClubMemberBindAgentView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/member/:memberId/unbind-agent',
      name: 'club-member-unbind-agent',
      component: () => import('@/views/club/ClubMemberUnbindAgentView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/wallet/logs',
      name: 'club-wallet-logs',
      component: () => import('@/views/club/ClubWalletLogsView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/room/history',
      name: 'club-room-history-list',
      component: () => import('@/views/club/ClubRoomHistoryListView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/club/room/history/detail',
      name: 'club-room-history-detail',
      component: () => import('@/views/club/ClubRoomHistoryDetailView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/message/detail',
      name: 'message-detail',
      component: () => import('@/views/message/MessageDetailView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/settings',
      name: 'mine-settings',
      component: () => import('@/views/mine/settings/MineSettingsView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/settings/language',
      name: 'mine-settings-language',
      component: () => import('@/views/mine/settings/MineSettingsLanguageView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/settings/account',
      name: 'mine-settings-account',
      component: () => import('@/views/mine/settings/MineSettingsAccountView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/settings/account/reset-password',
      name: 'mine-settings-account-reset-password',
      component: () => import('@/views/mine/settings/MineSettingsResetPasswordView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/settings/account/security-password/setup',
      name: 'mine-settings-account-security-password-setup',
      component: () => import('@/views/mine/settings/MineSecurityPasswordSetupView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/settings/account/reset-security-password',
      name: 'mine-settings-account-reset-security-password',
      component: () => import('@/views/mine/settings/MineSecurityPasswordResetView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/settings/cancel-account',
      name: 'mine-settings-cancel-account',
      component: () => import('@/views/mine/settings/MineSettingsCancelAccountView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/settings/doc/:type',
      name: 'mine-settings-doc',
      component: () => import('@/views/mine/settings/MineSettingsDocView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    // 生涯主入口 ─────────────────────────────────────────────────────────────
    {
      path: '/mine/career/club',
      name: 'mine-career-club',
      component: () => import('@/views/mine/career/club/MineClubCareerView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/career/friends',
      name: 'mine-career-friends',
      component: () => import('@/views/mine/career/friends/MineFriendsCareerView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    // 战绩 4 个子页 club / friends 共享：source 由路径段提供，组件内部读 route.params.source。
    {
      path: '/mine/career/:source(club|friends)/record',
      name: 'mine-career-record',
      component: () => import('@/views/mine/career/records/MineRecordView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/career/:source(club|friends)/record/detail',
      name: 'mine-career-record-detail',
      component: () => import('@/views/mine/career/records/MineRecordDetailView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/career/:source(club|friends)/record/hand',
      name: 'mine-career-record-hand',
      component: () => import('@/views/mine/career/records/MineRecordHandView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/career/:source(club|friends)/record/report',
      name: 'mine-career-record-report',
      component: () => import('@/views/mine/career/records/MineRecordReportView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    // club 专属子页
    {
      path: '/mine/career/club/mtt',
      name: 'mine-career-club-mtt',
      component: () => import('@/views/mine/career/club/MineClubMttView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/career/club/mtt/detail',
      name: 'mine-career-club-mtt-detail',
      component: () => import('@/views/mine/career/club/MineClubMttDetailView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/career/club/data',
      name: 'mine-career-club-data',
      component: () => import('@/views/mine/career/club/MineClubDataView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/career/club/cowboy',
      name: 'mine-career-club-cowboy',
      component: () => import('@/views/mine/career/club/MineClubCowboyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/career/club/cowboy/hand',
      name: 'mine-career-club-cowboy-hand',
      component: () => import('@/views/mine/career/club/MineClubCowboyHandView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/career/club/cowboy/detail',
      name: 'mine-career-club-cowboy-detail',
      component: () => import('@/views/mine/career/club/MineClubCowboyDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/career/club/mahjong',
      name: 'mine-career-club-mahjong',
      component: () => import('@/views/mine/career/club/MineClubMahjongView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/career/club/mahjong/detail',
      name: 'mine-career-club-mahjong-detail',
      component: () => import('@/views/mine/career/club/MineClubMahjongDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/career/club/mahjong/hand',
      name: 'mine-career-club-mahjong-hand',
      component: () => import('@/views/mine/career/club/MineClubMahjongHandView.vue'),
      meta: { requiresAuth: true },
    },
    // friends 专属子页
    {
      path: '/mine/career/friends/my-data',
      name: 'mine-career-friends-my-data',
      component: () => import('@/views/mine/career/friends/MineFriendsMyDataView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/career/friends/data',
      name: 'mine-career-friends-data',
      component: () => import('@/views/mine/career/friends/MineFriendsDataView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/career/friends/data/detail',
      name: 'mine-career-friends-data-detail',
      component: () => import('@/views/mine/career/friends/MineFriendsDataDetailView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/hand-collection',
      name: 'mine-hand-collection',
      component: () => import('@/views/mine/handCollection/MineHandCollectionView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/hand-collection/detail',
      name: 'mine-hand-collection-detail',
      component: () => import('@/views/mine/handCollection/MineHandCollectionDetailView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/bill',
      name: 'mine-bill',
      component: () => import('@/views/mine/MineBillView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/backpack',
      name: 'mine-backpack',
      component: () => import('@/views/mine/MineBackpackView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/message-board',
      name: 'mine-message-board',
      component: () => import('@/views/mine/MineMessageBoardView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/profile/edit',
      name: 'mine-profile-edit',
      component: () => import('@/views/mine/profile/MineProfileEditView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/profile/nickname',
      name: 'mine-profile-nickname',
      component: () => import('@/views/mine/profile/MineProfileNicknameView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mine/shop',
      name: 'mine-shop',
      component: () => import('@/views/mine/MineShopView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
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
      path: '/wallet/gift-uc',
      name: 'wallet-gift-uc',
      component: () => import('@/views/wallet/WalletGiftUcView.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/gameList',
      name: 'game-list',
      component: () => import('@/views/home/gameList.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
    },
    {
      path: '/mttList',
      name: 'mtt-list',
      component: () => import('@/views/mtt/mttList.vue'),
      meta: { requiresAuth: true, desktopLayout: 'content' },
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
  const isChannelPackage = isChannelPackageHost()
  log.info('beforeEach', {
    from: from.fullPath || '<init>',
    to: to.fullPath,
    requiresAuth: Boolean(to.meta.requiresAuth),
    hasToken: Boolean(token),
  })

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
      return { name: guestName }
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
    return { name: 'guest-home' }
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
    return { name: 'guest-home' }
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
