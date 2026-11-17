<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue'
import { H5_LOGIN_CONTEXT } from '@bridge-protocol'
import GlobalCsOrderFloat from '@/components/GlobalCsOrderFloat/GlobalCsOrderFloat.vue'
import TelegramClubJoinModal from '@/components/Dialog/TelegramClubJoinModal.vue'
import GameLaunchFallbackModal from '@/components/Dialog/GameLaunchFallbackModal.vue'
import ClubSplashLoading from '@/components/Splash/ClubSplashLoading.vue'
import { useGameStore } from '@/stores/game'
import { useLoginModalStore } from '@/stores/loginModal'
import { useUserInfoStore } from '@/stores/userInfo'
import { isClubLinkContext } from '@/utils/channelPackage'
import ExternalLinkFrame from '@/components/ExternalLinkFrame/ExternalLinkFrame.vue'
import LoginModal from '@/views/login/LoginModal.vue'

const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()
const loginModalStore = useLoginModalStore()
const hasRealUserSession = computed(() => gameStore.isRealUser)
const shouldMountRechargeRewardPopup = computed(
  () => import.meta.env.DEV || hasRealUserSession.value,
)
const hasChatSession = computed(() => Boolean(gameStore.sessionToken.trim()))
const isCocosTableAuthOverlay = computed(
  () => loginModalStore.context === H5_LOGIN_CONTEXT.TABLE_SITDOWN,
)

// 仅私域俱乐部专属链接在初始请求版本配置期间显示 Splash，避免版本 A 闪现后跳切版本 B/C
const isClubLink = isClubLinkContext()
const showClubSplash = ref(isClubLink && !userInfoStore.channelClubLoaded)

if (showClubSplash.value) {
  let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    dismissClubSplash()
  }, 4000)

  function dismissClubSplash() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    nextTick(() => {
      setTimeout(() => {
        showClubSplash.value = false
      }, 150)
    })
  }

  watch(
    () => userInfoStore.channelClubLoaded,
    (loaded) => {
      if (loaded) {
        dismissClubSplash()
      }
    },
    { immediate: true },
  )
}

// 消息审核仍仅对真实用户挂载；客服聊天支持持有体验 token 的游客。
const GlobalMessageTodoNotice = defineAsyncComponent(
  () => import('@/components/GlobalMessageTodoNotice/GlobalMessageTodoNotice.vue'),
)
const GlobalCustomerServiceChat = defineAsyncComponent(
  () => import('@/components/GlobalCustomerServiceChat/GlobalCustomerServiceChat.vue'),
)
const GlobalRechargeRewardPopup = defineAsyncComponent(
  () => import('@/components/RechargeReward/GlobalRechargeRewardPopup.vue'),
)
</script>

<template>
  <div
    class="h5-route-host"
    :class="{ 'h5-route-host--table-auth': isCocosTableAuthOverlay }"
  >
    <RouterView />
  </div>
  <LoginModal />
  <GlobalBridgeDialogHost />
  <GlobalBridgePanelHost />
  <TelegramClubJoinModal />
  <GameLaunchFallbackModal />
  <ExternalLinkFrame />
  <Teleport v-if="hasRealUserSession" to="body">
    <GlobalMessageTodoNotice />
  </Teleport>
  <Teleport v-if="shouldMountRechargeRewardPopup" to="body">
    <GlobalRechargeRewardPopup />
  </Teleport>
  <Teleport v-if="hasChatSession" to="body">
    <GlobalCustomerServiceChat />
  </Teleport>
  <GlobalCsOrderFloat />
  <ClubSplashLoading :visible="showClubSplash" />
</template>

<style>
/* 包裹层只做分组，不参与尺寸计算：保持页面根节点的百分比高度与 Telegram guard 生效。 */
.h5-route-host {
  height: 100%;
}

/* 牌桌内登录只显示弹窗；H5 大厅保持挂载但不绘制，底下继续显示 Cocos 牌桌。 */
#app[data-cocos-table-auth-overlay='1'] {
  background-color: transparent !important;
  background-image: none !important;
}

.h5-route-host--table-auth {
  visibility: hidden;
  pointer-events: none;
}
</style>
