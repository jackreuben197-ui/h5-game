import { createRouter, createWebHashHistory } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { pinia } from '@/stores/pinia'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/',

      component: () => import('@/views/main/MainLayoutView.vue'),
      meta: { requiresAuth: true },
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
          },
        },
      ],
    },
    // 子页面独立路由：按业务需要决定是否复用 MainLayoutView。
    {
      path: '/club/create',
      name: 'club-create',
      component: () => import('@/views/club/ClubCreateView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/index',
      name: 'club-index',
      component: () => import('@/views/club/ClubIndexView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/table/create',
      name: 'club-table-create',
      component: () => import('@/views/club/ClubTableCreateView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/jackpot/create',
      name: 'club-jackpot-create',
      component: () => import('@/views/club/ClubJackpotCreateView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/jackpot',
      name: 'club-jackpot',
      component: () => import('@/views/club/ClubJackpotListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/jackpot/pool-reward',
      name: 'club-jackpot-pool-reward',
      component: () => import('@/views/club/ClubPoolRewardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/jackpot/pool-reward/reward-records',
      name: 'club-jackpot-pool-reward-reward-records',
      component: () => import('@/views/club/ClubPoolRewardWinRecordsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/jackpot/pool-reward/contribution-records',
      name: 'club-jackpot-pool-reward-contribution-records',
      component: () => import('@/views/club/ClubPoolRewardContributionRecordsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/detail',
      name: 'club-detail',
      component: () => import('@/views/club/ClubDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/downline-members',
      name: 'club-downline-members',
      component: () => import('@/views/club/ClubDownlineMembersView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/level',
      name: 'club-level',
      component: () => import('@/views/club/ClubLevelView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/edit-description',
      name: 'club-edit-description',
      component: () => import('@/views/club/ClubEditDesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/edit-name',
      name: 'club-edit-name',
      component: () => import('@/views/club/ClubEditNameView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/members',
      name: 'club-members',
      component: () => import('@/views/club/ClubMembersView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/member/:memberId',
      name: 'club-member-detail',
      component: () => import('@/views/club/ClubMemberDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/member/:memberId/agent-profit',
      name: 'club-member-agent-profit',
      component: () => import('@/views/club/ClubAgentProfitSettingView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/member/:memberId/offline-players',
      name: 'club-member-offline-players',
      component: () => import('@/views/club/ClubAgentOfflinePlayersView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/member/:memberId/vip-statistics',
      name: 'club-member-vip-statistics',
      component: () => import('@/views/club/ClubAgentVipStatisticsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/member/:memberId/bind-agent',
      name: 'club-member-bind-agent',
      component: () => import('@/views/club/ClubMemberBindAgentView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/member/:memberId/unbind-agent',
      name: 'club-member-unbind-agent',
      component: () => import('@/views/club/ClubMemberUnbindAgentView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/wallet/logs',
      name: 'club-wallet-logs',
      component: () => import('@/views/club/ClubWalletLogsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/room/history',
      name: 'club-room-history-list',
      component: () => import('@/views/club/ClubRoomHistoryListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/room/history/detail',
      name: 'club-room-history-detail',
      component: () => import('@/views/club/ClubRoomHistoryDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/message/detail',
      name: 'message-detail',
      component: () => import('@/views/message/MessageDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/settings',
      name: 'mine-settings',
      component: () => import('@/views/mine/MineSettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/settings/language',
      name: 'mine-settings-language',
      component: () => import('@/views/mine/MineSettingsLanguageView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/settings/account',
      name: 'mine-settings-account',
      component: () => import('@/views/mine/MineSettingsAccountView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/settings/account/reset-password',
      name: 'mine-settings-account-reset-password',
      component: () => import('@/views/mine/MineSettingsResetPasswordView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/settings/account/security-password/setup',
      name: 'mine-settings-account-security-password-setup',
      component: () => import('@/views/mine/MineSecurityPasswordSetupView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/settings/account/reset-security-password',
      name: 'mine-settings-account-reset-security-password',
      component: () => import('@/views/mine/MineSecurityPasswordResetView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/settings/cancel-account',
      name: 'mine-settings-cancel-account',
      component: () => import('@/views/mine/MineSettingsCancelAccountView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/settings/doc/:type',
      name: 'mine-settings-doc',
      component: () => import('@/views/mine/MineSettingsDocView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/club-career',
      name: 'mine-club-career',
      component: () => import('@/views/mine/MineClubCareerView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/club-record',
      name: 'mine-club-record',
      component: () => import('@/views/mine/MineClubRecordView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/club-record/detail',
      name: 'mine-club-record-detail',
      component: () => import('@/views/mine/MineClubRecordDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/club-record/hand',
      name: 'mine-club-record-hand',
      component: () => import('@/views/mine/MineClubRecordHandView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/club-record/report',
      name: 'mine-club-record-report',
      component: () => import('@/views/mine/MineClubRecordReportView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/club-mtt',
      name: 'mine-club-mtt',
      component: () => import('@/views/mine/MineClubMttView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/club-mtt/detail',
      name: 'mine-club-mtt-detail',
      component: () => import('@/views/mine/MineClubMttDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/club-data',
      name: 'mine-club-data',
      component: () => import('@/views/mine/MineClubDataView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/club-cowboy',
      name: 'mine-club-cowboy',
      component: () => import('@/views/mine/MineClubCowboyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/club-cowboy/hand',
      name: 'mine-club-cowboy-hand',
      component: () => import('@/views/mine/MineClubCowboyHandView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/club-cowboy/detail',
      name: 'mine-club-cowboy-detail',
      component: () => import('@/views/mine/MineClubCowboyDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/club-mahjong',
      name: 'mine-club-mahjong',
      component: () => import('@/views/mine/MineClubMahjongView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/club-mahjong/detail',
      name: 'mine-club-mahjong-detail',
      component: () => import('@/views/mine/MineClubMahjongDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/club-mahjong/hand',
      name: 'mine-club-mahjong-hand',
      component: () => import('@/views/mine/MineClubMahjongHandView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/friends-career',
      name: 'mine-friends-career',
      component: () => import('@/views/mine/MineFriendsCareerView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/friends-my-data',
      name: 'mine-friends-my-data',
      component: () => import('@/views/mine/MineFriendsMyDataView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/friends-data',
      name: 'mine-friends-data',
      component: () => import('@/views/mine/MineFriendsDataView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/friends-record',
      name: 'mine-friends-record',
      component: () => import('@/views/mine/MineFriendsRecordView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/friends-record/hand',
      name: 'mine-friends-record-hand',
      component: () => import('@/views/mine/MineFriendsRecordHandView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/friends-record/detail',
      name: 'mine-friends-record-detail',
      component: () => import('@/views/mine/MineFriendsRecordDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/friends-record/report',
      name: 'mine-friends-record-report',
      component: () => import('@/views/mine/MineFriendsRecordReportView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/hand-collection',
      name: 'mine-hand-collection',
      component: () => import('@/views/mine/MineHandCollectionView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/hand-collection/detail',
      name: 'mine-hand-collection-detail',
      component: () => import('@/views/mine/MineHandCollectionDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/bill',
      name: 'mine-bill',
      component: () => import('@/views/mine/MineBillView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/backpack',
      name: 'mine-backpack',
      component: () => import('@/views/mine/MineBackpackView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/message-board',
      name: 'mine-message-board',
      component: () => import('@/views/mine/MineMessageBoardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/profile/edit',
      name: 'mine-profile-edit',
      component: () => import('@/views/mine/MineProfileEditView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/profile/nickname',
      name: 'mine-profile-nickname',
      component: () => import('@/views/mine/MineProfileNicknameView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/shop',
      name: 'mine-shop',
      component: () => import('@/views/mine/MineShopView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/shop/payment',
      name: 'mine-shop-payment',
      component: () => import('@/views/mine/MineShopPaymentView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/wallet',
      name: 'wallet',
      component: () => import('@/views/wallet/WalletIndexView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/wallet/orders',
      name: 'wallet-orders',
      component: () => import('@/views/friendsTable/RechargeOrdersView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/wallet/details',
      name: 'wallet-details',
      component: () => import('@/views/wallet/WalletDetailsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/gameList',
      name: 'game-list',
      component: () => import('@/views/home/gameList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mttList',
      name: 'mtt-list',
      component: () => import('@/views/mtt/mttList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mtt/detail',
      name: 'mtt-detail',
      component: () => import('@/views/mtt/MttDetailView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const gameStore = useGameStore(pinia)
  const token = gameStore.sessionToken

  if (to.meta.requiresAuth && !token) {
    // 未登录统一进入登录页；登录成功后固定回首页，不做业务页重定向。
    return { name: 'login' }
  }

  if (to.name === 'login' && token) {
    return { name: 'lobby' }
  }

  return true
})

export default router
