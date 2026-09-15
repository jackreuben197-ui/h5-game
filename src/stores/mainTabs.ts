import { defineStore } from 'pinia'

export type MainTabKey =
  | 'home'
  | 'poker'
  | 'mtt'
  | 'miniGame'
  | 'club'
  | 'friendsTable'
  | 'wallet'
  | 'message'
  | 'mine'

// 底部 Tab 的共享状态仓库：用于跨页面保持当前激活模块。
export const useMainTabsStore = defineStore('main-tabs-store', {
  state: () => ({
    activeTab: 'home' as MainTabKey,
    // 渠道动态菜单的已提交快照：跨页面组件重建保留，避免切 Tab / 登录时先清空再闪变。
    committedChannelTabs: [] as MainTabKey[],
  }),
  actions: {
    // 切换当前激活的 Tab（公共底部栏与各模块页面共用）。
    setActiveTab(tab: MainTabKey): void {
      this.activeTab = tab
    },
    commitChannelTabs(tabs: MainTabKey[]): void {
      this.committedChannelTabs = [...tabs]
    },
  },
})
