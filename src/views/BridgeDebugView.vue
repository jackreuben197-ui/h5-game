<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import { mockCocosAck, sendExitTable, subscribeCocosMessages } from '@/bridge/bridge'
import type { BridgeMessage } from '@/bridge/protocol'

const router = useRouter()
const logs = ref<string[]>([])

const logLines = computed(() => logs.value.join('\n'))

let unsubscribe: (() => void) | null = null

function appendLog(message: string): void {
  logs.value = [`${new Date().toLocaleTimeString()} ${message}`, ...logs.value].slice(0, 30)
}

function sendExitMessage(): void {
  const event = sendExitTable({ reason: 'manual-debug' })
  appendLog(`H5 -> Cocos: ${JSON.stringify(event)}`)
  showSuccessToast('exitTable 已发送')
}

function sendMockAck(): void {
  mockCocosAck({ ok: true, message: 'Cocos 已收到 enterTable，准备切入牌桌场景' })
}

function onBridgeMessage(message: BridgeMessage): void {
  appendLog(`Cocos -> H5: ${JSON.stringify(message)}`)
}

onMounted(() => {
  unsubscribe = subscribeCocosMessages(onBridgeMessage)
})

onUnmounted(() => {
  unsubscribe?.()
  unsubscribe = null
})

function backLobby(): void {
  router.push('/')
}
</script>

<template>
  <div class="page-shell">
    <van-nav-bar title="Bridge 调试" left-text="返回" left-arrow @click-left="backLobby" />

    <section class="section-card">
      <h2 class="section-title">调试操作</h2>
      <div class="actions">
        <van-button type="primary" block @click="sendExitMessage">发送 exitTable</van-button>
        <van-button type="success" block @click="sendMockAck">模拟 Cocos 回执</van-button>
      </div>
    </section>

    <section class="section-card" style="margin-top: 12px">
      <h2 class="section-title">最近消息日志</h2>
      <van-empty v-if="!logs.length" description="暂无消息" />
      <van-field
        v-else
        :model-value="logLines"
        type="textarea"
        autosize
        readonly
        input-align="left"
      />
    </section>
  </div>
</template>
