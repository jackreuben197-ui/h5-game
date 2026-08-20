import type { RouteRecordRaw } from 'vue-router'

const contentMeta = { desktopLayout: 'content' } as const

export const mineTabRoute: RouteRecordRaw = {
  path: 'mine',
  name: 'mine',
  component: () => import('@/views/mine/MineIndexView.vue'),
  meta: {
    requiresAuth: true,
    tabKey: 'mine',
    moduleTitle: '我的',
    desktopLayout: 'primary',
  },
}

/**
 * “我的”模块按页面入口与业务层级组织。
 * URL 和 route name 保持不变，HeaderBack 的 history.back 行为也因此不受影响。
 */
export const mineRoutes: RouteRecordRaw[] = [
  {
    path: '/mine',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'settings',
        children: [
          {
            path: '',
            name: 'mine-settings',
            component: () => import('@/views/mine/settings/MineSettingsView.vue'),
            meta: contentMeta,
          },
          {
            path: 'language',
            name: 'mine-settings-language',
            component: () => import('@/views/mine/settings/MineSettingsLanguageView.vue'),
            meta: contentMeta,
          },
          {
            path: 'account',
            children: [
              {
                path: '',
                name: 'mine-settings-account',
                component: () =>
                  import('@/views/mine/settings/account/MineSettingsAccountView.vue'),
                meta: contentMeta,
              },
              {
                path: 'reset-password',
                name: 'mine-settings-account-reset-password',
                component: () =>
                  import('@/views/mine/settings/account/MineSettingsResetPasswordView.vue'),
                meta: contentMeta,
              },
              {
                path: 'security-password/setup',
                name: 'mine-settings-account-security-password-setup',
                component: () =>
                  import('@/views/mine/settings/account/MineSecurityPasswordSetupView.vue'),
                meta: contentMeta,
              },
              {
                path: 'reset-security-password',
                name: 'mine-settings-account-reset-security-password',
                component: () =>
                  import('@/views/mine/settings/account/MineSecurityPasswordResetView.vue'),
                meta: contentMeta,
              },
            ],
          },
          {
            path: 'cancel-account',
            name: 'mine-settings-cancel-account',
            component: () =>
              import('@/views/mine/settings/account/MineSettingsCancelAccountView.vue'),
            meta: contentMeta,
          },
          {
            path: 'doc/:type',
            name: 'mine-settings-doc',
            component: () => import('@/views/mine/settings/MineSettingsDocView.vue'),
            meta: contentMeta,
          },
        ],
      },
      {
        path: 'career',
        children: [
          {
            path: ':source(club|friends)/record',
            children: [
              {
                path: '',
                name: 'mine-career-record',
                component: () => import('@/views/mine/career/records/MineRecordView.vue'),
                meta: contentMeta,
              },
              {
                path: 'detail',
                name: 'mine-career-record-detail',
                component: () =>
                  import('@/views/mine/career/records/MineRecordDetailView.vue'),
                meta: contentMeta,
              },
              {
                path: 'hand',
                name: 'mine-career-record-hand',
                component: () => import('@/views/mine/career/records/MineRecordHandView.vue'),
                meta: contentMeta,
              },
              {
                path: 'report',
                name: 'mine-career-record-report',
                component: () => import('@/views/mine/career/records/MineRecordReportView.vue'),
                meta: contentMeta,
              },
            ],
          },
          {
            path: 'club',
            children: [
              {
                path: '',
                name: 'mine-career-club',
                component: () => import('@/views/mine/career/club/MineClubCareerView.vue'),
                meta: contentMeta,
              },
              {
                path: 'data',
                name: 'mine-career-club-data',
                component: () => import('@/views/mine/career/club/MineClubDataView.vue'),
                meta: contentMeta,
              },
              {
                path: 'mtt',
                children: [
                  {
                    path: '',
                    name: 'mine-career-club-mtt',
                    component: () =>
                      import('@/views/mine/career/club/mtt/MineClubMttView.vue'),
                    meta: contentMeta,
                  },
                  {
                    path: 'detail',
                    name: 'mine-career-club-mtt-detail',
                    component: () =>
                      import('@/views/mine/career/club/mtt/MineClubMttDetailView.vue'),
                    meta: contentMeta,
                  },
                ],
              },
              {
                path: 'cowboy',
                children: [
                  {
                    path: '',
                    name: 'mine-career-club-cowboy',
                    component: () =>
                      import('@/views/mine/career/club/cowboy/MineClubCowboyView.vue'),
                  },
                  {
                    path: 'hand',
                    name: 'mine-career-club-cowboy-hand',
                    component: () =>
                      import('@/views/mine/career/club/cowboy/MineClubCowboyHandView.vue'),
                  },
                  {
                    path: 'detail',
                    name: 'mine-career-club-cowboy-detail',
                    component: () =>
                      import('@/views/mine/career/club/cowboy/MineClubCowboyDetailView.vue'),
                  },
                ],
              },
              {
                path: 'mahjong',
                children: [
                  {
                    path: '',
                    name: 'mine-career-club-mahjong',
                    component: () =>
                      import('@/views/mine/career/club/mahjong/MineClubMahjongView.vue'),
                  },
                  {
                    path: 'detail',
                    name: 'mine-career-club-mahjong-detail',
                    component: () =>
                      import('@/views/mine/career/club/mahjong/MineClubMahjongDetailView.vue'),
                  },
                  {
                    path: 'hand',
                    name: 'mine-career-club-mahjong-hand',
                    component: () =>
                      import('@/views/mine/career/club/mahjong/MineClubMahjongHandView.vue'),
                  },
                ],
              },
            ],
          },
          {
            path: 'friends',
            children: [
              {
                path: '',
                name: 'mine-career-friends',
                component: () =>
                  import('@/views/mine/career/friends/MineFriendsCareerView.vue'),
                meta: contentMeta,
              },
              {
                path: 'my-data',
                name: 'mine-career-friends-my-data',
                component: () =>
                  import('@/views/mine/career/friends/MineFriendsMyDataView.vue'),
                meta: contentMeta,
              },
              {
                path: 'data',
                children: [
                  {
                    path: '',
                    name: 'mine-career-friends-data',
                    component: () =>
                      import('@/views/mine/career/friends/data/MineFriendsDataView.vue'),
                    meta: contentMeta,
                  },
                  {
                    path: 'detail',
                    name: 'mine-career-friends-data-detail',
                    component: () =>
                      import('@/views/mine/career/friends/data/MineFriendsDataDetailView.vue'),
                    meta: contentMeta,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: 'hand-collection',
        children: [
          {
            path: '',
            name: 'mine-hand-collection',
            component: () =>
              import('@/views/mine/handCollection/MineHandCollectionView.vue'),
            meta: contentMeta,
          },
          {
            path: 'detail',
            name: 'mine-hand-collection-detail',
            component: () =>
              import('@/views/mine/handCollection/MineHandCollectionDetailView.vue'),
            meta: contentMeta,
          },
        ],
      },
      {
        path: 'bill',
        name: 'mine-bill',
        component: () => import('@/views/mine/bill/MineBillView.vue'),
        meta: contentMeta,
      },
      {
        path: 'backpack',
        name: 'mine-backpack',
        component: () => import('@/views/mine/backpack/MineBackpackView.vue'),
        meta: contentMeta,
      },
      {
        path: 'message-board',
        name: 'mine-message-board',
        component: () => import('@/views/mine/messageBoard/MineMessageBoardView.vue'),
        meta: contentMeta,
      },
      {
        path: 'profile',
        children: [
          {
            path: 'edit',
            name: 'mine-profile-edit',
            component: () => import('@/views/mine/profile/MineProfileEditView.vue'),
            meta: contentMeta,
          },
          {
            path: 'nickname',
            name: 'mine-profile-nickname',
            component: () => import('@/views/mine/profile/MineProfileNicknameView.vue'),
            meta: contentMeta,
          },
        ],
      },
      {
        path: 'shop',
        name: 'mine-shop',
        component: () => import('@/views/mine/shop/MineShopView.vue'),
        meta: contentMeta,
      },
    ],
  },
]
