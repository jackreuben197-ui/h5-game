<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import { getUserInfoApi } from '@/api/auth'
import { useGameStore } from '@/stores/game'
import mainBgUrl from '@/assets/images/main_bg.webp'

type TabKey = 'home' | 'club' | 'recharge' | 'message' | 'mine'

interface LobbyTab {
  key: TabKey
  label: string
}

const router = useRouter()
const gameStore = useGameStore()

// 底部 5 个切换按钮配置（与设计稿文案一致）。
const tabs: LobbyTab[] = [
  { key: 'home', label: '首页' },
  { key: 'club', label: '俱乐部' },
  { key: 'recharge', label: '充值' },
  { key: 'message', label: '消息' },
  { key: 'mine', label: '我的' },
]

// 当前激活 tab，默认首页。
const activeTab = ref<TabKey>('home')

// 背景图样式：统一由页面控制，不依赖外层容器。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

// 顶部展示登录用户信息，便于确认当前账号。
const loginUserText = computed(() => {
  if (gameStore.loginAccount && gameStore.loginNickname) {
    return `${gameStore.loginAccount} (${gameStore.loginNickname})`
  }
  if (gameStore.loginNickname) {
    return gameStore.loginNickname
  }
  if (gameStore.loginAccount) {
    return gameStore.loginAccount
  }
  return '-'
})

const activeTabLabel = computed(() => {
  const found = tabs.find((item) => item.key === activeTab.value)
  return found?.label || '首页'
})

async function fetchUserInfoOnEnter(): Promise<void> {
  if (!gameStore.sessionToken) {
    return
  }

  try {
    const userInfo = await getUserInfoApi()
    const user = userInfo.user
    const userId = String(user.p_u_id)
    const userName = String(user.nickname)
    gameStore.setLoginUser({
      account: gameStore.loginAccount || userName,
      nickname: userName,
      userId,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取用户信息失败'
    showFailToast(message)
  }
}

// 切换底部按钮高亮态；后续可在这里扩展各 tab 业务逻辑。
function switchTab(key: TabKey): void {
  activeTab.value = key
}

async function onLogout(): Promise<void> {
  gameStore.clearLogin()
  showSuccessToast('已退出登录')
  await router.replace('/login')
}

onMounted(() => {
  void fetchUserInfoOnEnter()
})
</script>

<template>
  <div class="lobby-home" :style="backgroundStyle">
    <div class="lobby-mask">
      <header class="home-header">
        <p class="home-sub-title">牌桌外大厅</p>
        <h1 class="home-title">{{ activeTabLabel }}</h1>
        <p class="home-user">当前登录：{{ loginUserText }}</p>
      </header>

      <section class="home-actions">
        <VanButton plain round size="small" @click="onLogout">退出登录</VanButton>
      </section>
    </div>

    <nav class="bottom-tab" aria-label="底部切换栏">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="tab-button"
        :class="{ 'is-active': activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <span class="tab-icon" aria-hidden="true">
          <svg v-if="tab.key === 'home'" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-9Z" />
          </svg>
          <svg v-else-if="tab.key === 'club'" viewBox="0 0 24 24" fill="currentColor">
            <path d="m4 6 4.8 4.2L12 6l3.2 4.2L20 6l-1.7 12.2A2 2 0 0 1 16.3 20H7.7a2 2 0 0 1-2-1.8L4 6Z" />
            <circle cx="12" cy="13.3" r="1.9" fill="#1e5d74" />
          </svg>
          <svg v-else-if="tab.key === 'recharge'" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v7A2.5 2.5 0 0 1 18.5 18h-13A2.5 2.5 0 0 1 3 15.5v-7Z" />
            <circle cx="17.2" cy="12" r="2.4" fill="#1e5d74" />
          </svg>
          <svg v-else-if="tab.key === 'message'" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 8a5 5 0 0 1 5-5h8a5 5 0 0 1 0 10h-1.5l-3.6 2.6a1 1 0 0 1-1.58-.81V13H8a5 5 0 0 1-5-5Z" />
            <path d="M12 13h4a4 4 0 0 1 0 8h-1.2l-2.8 2a1 1 0 0 1-1.58-.81V21H9a4 4 0 0 1-4-4v-.4A6.9 6.9 0 0 0 8 17h4v-4Z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20a8 8 0 0 1 16 0v1H4v-1Z" />
          </svg>
        </span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.lobby-home {
  position: relative;
  min-height: 100dvh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.lobby-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(13, 17, 24, 0.24) 0%, rgba(5, 10, 16, 0.66) 100%);
}

.home-header {
  padding: calc(env(safe-area-inset-top) + 0.68rem) 0.64rem 0;
  color: #f3f8ff;
}

.home-sub-title {
  margin: 0;
  font-size: 0.34rem;
  letter-spacing: 0.08rem;
  opacity: 0.84;
}

.home-title {
  margin: 0.2rem 0 0;
  font-size: 0.76rem;
  font-weight: 700;
}

.home-user {
  margin: 0.2rem 0 0;
  font-size: 0.34rem;
  opacity: 0.9;
}

.home-actions {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 0.72rem);
  right: 0.64rem;
}

.bottom-tab {
  position: fixed;
  left: 0.3rem;
  right: 0.3rem;
  bottom: calc(env(safe-area-inset-bottom) + 0.28rem);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.08rem;
  height: 2.08rem;
  padding: 0.16rem 0.18rem;
  border: 0.03rem solid rgba(236, 244, 255, 0.45);
  border-radius: 99rem;
  background:
    linear-gradient(92deg, rgba(129, 70, 124, 0.55) 0%, rgba(42, 123, 164, 0.62) 55%, rgba(24, 111, 146, 0.7) 100%),
    rgba(12, 32, 56, 0.35);
  box-shadow:
    0 -0.06rem 0.4rem rgba(145, 205, 250, 0.16) inset,
    0 0.14rem 0.4rem rgba(0, 26, 40, 0.32);
  backdrop-filter: blur(0.14rem);
}

.tab-button {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.12rem;
  color: rgba(250, 252, 255, 0.84);
  padding: 0.08rem 0.06rem;
  border-radius: 0.44rem;
  -webkit-tap-highlight-color: transparent;
}

.tab-button.is-active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.16);
}

.tab-icon {
  width: 0.68rem;
  height: 0.68rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tab-icon svg {
  width: 100%;
  height: 100%;
}

.tab-label {
  font-size: 0.42rem;
  line-height: 1;
  font-weight: 500;
}
</style>
