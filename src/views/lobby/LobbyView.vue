<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useDateFormat, useNow } from '@vueuse/core'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import {
  enterTable,
  getBridgeChannelName,
  subscribeCocosMessages,
} from '@/bridge/bridge'
import { getUserInfoApi } from '@/api/auth'
import type { BridgeMessage, EnterTablePayload } from '@/bridge/protocol'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

const now = useNow({ interval: 1000 })
const nowText = useDateFormat(now, 'YYYY-MM-DD HH:mm:ss')
const bridgeChannel = computed(() => getBridgeChannelName())
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
const userInfoStatusText = computed(() => {
  if (loadingUserInfo.value) {
    return '加载中...'
  }
  if (gameStore.loginUserId) {
    return '已加载'
  }
  return '未加载'
})

const enterPayload = computed<EnterTablePayload>(() => ({
  userName: gameStore.loginNickname || gameStore.loginAccount,
  userId: gameStore.loginUserId,
  token: gameStore.sessionToken,
  from: 'h5-lobby',
}))
const loadingUserInfo = ref(false)

const lastEnterAtText = computed(() =>
  gameStore.lastEnterAt ? dayjs(gameStore.lastEnterAt).format('YYYY-MM-DD HH:mm:ss') : '-',
)
const lastAckAtText = computed(() =>
  gameStore.lastBridgeAckAt ? dayjs(gameStore.lastBridgeAckAt).format('YYYY-MM-DD HH:mm:ss') : '-',
)

let unsubscribe: (() => void) | null = null


async function fetchUserInfoOnEnter(): Promise<void> {
  if (!gameStore.sessionToken) {
    return
  }

  loadingUserInfo.value = true
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
  } finally {
    loadingUserInfo.value = false
  }
}

function onEnterTable(): void {
  if (!enterPayload.value.userName.trim() || !enterPayload.value.userId.trim() || !enterPayload.value.token.trim()) {
    showFailToast('名称 / ID / token 缺失，无法进入牌桌')
    return
  }

  gameStore.setLastEnterTable(enterPayload.value)
  enterTable(enterPayload.value)

  showSuccessToast('进入牌桌请求已发送给 Cocos')
}

function onBridgeMessage(message: BridgeMessage): void {
  const content =
    typeof message.payload === 'string' ? message.payload : JSON.stringify(message.payload)
  gameStore.setBridgeAck(`[${message.action}] ${content}`)
}

onMounted(() => {
  unsubscribe = subscribeCocosMessages(onBridgeMessage)
  void fetchUserInfoOnEnter()
})

onUnmounted(() => {
  unsubscribe?.()
  unsubscribe = null
})

function goBridgeDebug(): void {
  router.push('/bridge-debug')
}

async function onLogout(): Promise<void> {
  gameStore.clearLogin()
  showSuccessToast('已退出登录')
  await router.replace('/login')
}
</script>

<template>
  <div class="page-shell">
    <VanNavBar title="牌桌外大厅（H5）" />

    <section class="section-card">
      <h2 class="section-title">运行状态</h2>
      <p>{{ $txt('Wallet_AddItem7') }}</p>
      <p class="info-line">当前时间：{{ nowText }}</p>
      <p class="info-line">当前登录：{{ loginUserText }}</p>
      <p class="info-line">当前用户ID：{{ gameStore.loginUserId || '-' }}</p>
      <p class="info-line">用户信息状态：{{ userInfoStatusText }}</p>
      <p class="info-line">Bridge 通道：{{ bridgeChannel }}</p>
      <p class="info-line">上次进入牌桌：{{ lastEnterAtText }}</p>
      <p class="info-line">上次 Cocos 回执：{{ lastAckAtText }}</p>
      <p class="info-line">{{ gameStore.lastBridgeAck || '-' }}</p>
    </section>

    <section class="section-card">
      <h2 class="section-title">进入牌桌参数</h2>
      <p class="info-line">userName：{{ enterPayload.userName || '-' }}</p>
      <p class="info-line">userId：{{ enterPayload.userId || '-' }}</p>
      <p class="info-line">token：{{ enterPayload.token || '-' }}</p>

      <div class="actions">
        <VanButton type="primary" block @click="onEnterTable">进入牌桌</VanButton>
        <VanButton plain block @click="goBridgeDebug">打开 Bridge 调试页</VanButton>
        <VanButton plain block @click="onLogout">退出登录</VanButton>
      </div>
    </section>
  </div>
</template>
