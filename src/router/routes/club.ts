import type { RouteRecordRaw } from 'vue-router'

export const clubTabRoute: RouteRecordRaw = {
  path: 'club',
  name: 'club',
  component: () => import('@/views/club/ClubListView.vue'),
  meta: {
    requiresAuth: true,
    guestPreview: true,
    tabKey: 'club',
    moduleTitle: '俱乐部',
    desktopLayout: 'primary',
  },
}

/**
 * 俱乐部内容页。
 *
 * 这里的无组件父路由只负责表达业务和 URL 层级，不会额外渲染 RouterView，
 * 因此页面仍与整理前一样作为独立内容页展示。
 */
export const clubRoutes: RouteRecordRaw[] = [
  {
    path: '/club',
    meta: { requiresAuth: true, desktopLayout: 'content' },
    children: [
      {
        path: 'create',
        name: 'club-create',
        component: () => import('@/views/club/create/ClubCreateView.vue'),
      },
      {
        path: 'index',
        name: 'club-index',
        component: () => import('@/views/club/home/ClubIndexView.vue'),
      },
      {
        path: 'table/create',
        name: 'club-table-create',
        component: () => import('@/views/table/CreateTableSelect.vue'),
        meta: { guestPreview: true },
      },
      {
        path: 'jackpot',
        children: [
          {
            path: '',
            name: 'club-jackpot',
            component: () => import('@/views/club/jackpot/ClubJackpotListView.vue'),
          },
          {
            path: 'create',
            name: 'club-jackpot-create',
            component: () => import('@/views/club/jackpot/ClubJackpotCreateView.vue'),
          },
          {
            path: 'pool-reward',
            children: [
              {
                path: '',
                name: 'club-jackpot-pool-reward',
                component: () => import('@/views/club/jackpot/ClubPoolRewardView.vue'),
              },
              {
                path: 'reward-records',
                name: 'club-jackpot-pool-reward-reward-records',
                component: () =>
                  import('@/views/club/jackpot/ClubPoolRewardWinRecordsView.vue'),
              },
              {
                path: 'contribution-records',
                name: 'club-jackpot-pool-reward-contribution-records',
                component: () =>
                  import('@/views/club/jackpot/ClubPoolRewardContributionRecordsView.vue'),
              },
            ],
          },
        ],
      },
      {
        path: 'detail',
        name: 'club-detail',
        component: () => import('@/views/club/management/ClubDetailView.vue'),
      },
      {
        path: 'edit-description',
        name: 'club-edit-description',
        component: () => import('@/views/club/management/ClubEditDesView.vue'),
      },
      {
        path: 'edit-name',
        name: 'club-edit-name',
        component: () => import('@/views/club/management/ClubEditNameView.vue'),
      },
      {
        path: 'level',
        name: 'club-level',
        component: () => import('@/views/club/management/ClubLevelView.vue'),
      },
      {
        path: 'members',
        name: 'club-members',
        component: () => import('@/views/club/members/ClubMembersView.vue'),
      },
      {
        path: 'downline-members',
        name: 'club-downline-members',
        component: () => import('@/views/club/members/ClubDownlineMembersView.vue'),
      },
      {
        path: 'member/:memberId',
        children: [
          {
            path: '',
            name: 'club-member-detail',
            component: () => import('@/views/club/members/ClubMemberDetailView.vue'),
          },
          {
            path: 'agent-profit',
            name: 'club-member-agent-profit',
            component: () =>
              import('@/views/club/members/agent/ClubAgentProfitSettingView.vue'),
          },
          {
            path: 'offline-players',
            name: 'club-member-offline-players',
            component: () =>
              import('@/views/club/members/agent/ClubAgentOfflinePlayersView.vue'),
          },
          {
            path: 'vip-statistics',
            name: 'club-member-vip-statistics',
            component: () =>
              import('@/views/club/members/agent/ClubAgentVipStatisticsView.vue'),
          },
          {
            path: 'bind-agent',
            name: 'club-member-bind-agent',
            component: () => import('@/views/club/members/agent/ClubMemberBindAgentView.vue'),
          },
          {
            path: 'unbind-agent',
            name: 'club-member-unbind-agent',
            component: () => import('@/views/club/members/agent/ClubMemberUnbindAgentView.vue'),
          },
        ],
      },
      {
        path: 'wallet/logs',
        name: 'club-wallet-logs',
        component: () => import('@/views/club/wallet/ClubWalletLogsView.vue'),
      },
      {
        path: 'room/history',
        children: [
          {
            path: '',
            name: 'club-room-history-list',
            component: () => import('@/views/club/roomHistory/ClubRoomHistoryListView.vue'),
          },
          {
            path: 'detail',
            name: 'club-room-history-detail',
            component: () =>
              import('@/views/club/roomHistory/ClubRoomHistoryDetailView.vue'),
          },
        ],
      },
    ],
  },
]
