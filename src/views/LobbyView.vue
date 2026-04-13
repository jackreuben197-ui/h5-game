<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, onMounted, onUnmounted, reactive } from 'vue'
import { useDateFormat, useNow } from '@vueuse/core'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import {
  enterTable,
  getBridgeChannelName,
  subscribeCocosMessages,
} from '@/bridge/bridge'
import type { BridgeMessage, EnterTablePayload } from '@/bridge/protocol'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

const form = reactive({
  tableId: gameStore.lastEnterTable?.tableId ?? '',
  roomId: gameStore.lastEnterTable?.roomId ?? '',
  gameCode: gameStore.lastEnterTable?.gameCode ?? 'poker-texas',
  token: gameStore.sessionToken,
})

const now = useNow({ interval: 1000 })
const nowText = useDateFormat(now, 'YYYY-MM-DD HH:mm:ss')
const bridgeChannel = computed(() => getBridgeChannelName())

const lastEnterAtText = computed(() =>
  gameStore.lastEnterAt ? dayjs(gameStore.lastEnterAt).format('YYYY-MM-DD HH:mm:ss') : '-',
)
const lastAckAtText = computed(() =>
  gameStore.lastBridgeAckAt ? dayjs(gameStore.lastBridgeAckAt).format('YYYY-MM-DD HH:mm:ss') : '-',
)

let unsubscribe: (() => void) | null = null

function onEnterTable(): void {
  if (!form.tableId.trim() || !form.roomId.trim() || !form.token.trim()) {
    showFailToast('tableId / roomId / token 都是必填')
    return
  }

  const payload: EnterTablePayload = {
    tableId: form.tableId.trim(),
    roomId: form.roomId.trim(),
    gameCode: form.gameCode.trim() || 'poker-texas',
    token: form.token.trim(),
    from: 'h5-lobby',
  }

  gameStore.setSessionToken(payload.token)
  gameStore.setLastEnterTable(payload)
  enterTable(payload)

  showSuccessToast('进入牌桌请求已发送给 Cocos')
}

function onBridgeMessage(message: BridgeMessage): void {
  const content =
    typeof message.payload === 'string' ? message.payload : JSON.stringify(message.payload)
  gameStore.setBridgeAck(`[${message.action}] ${content}`)
}

onMounted(() => {
  unsubscribe = subscribeCocosMessages(onBridgeMessage)
})

onUnmounted(() => {
  unsubscribe?.()
  unsubscribe = null
})

function goBridgeDebug(): void {
  router.push('/bridge-debug')
}
</script>

<template>
  <div class="page-shell">
    <van-nav-bar title="牌桌外大厅（H5）" />

    <section class="section-card">
      <h2 class="section-title">运行状态</h2>
      <p class="info-line">当前时间：{{ nowText }}</p>
      <p class="info-line">Bridge 通道：{{ bridgeChannel }}</p>
      <p class="info-line">上次进入牌桌：{{ lastEnterAtText }}</p>
      <p class="info-line">上次 Cocos 回执：{{ lastAckAtText }}</p>
      <p class="info-line">{{ gameStore.lastBridgeAck || '-' }}</p>
    </section>

    <section class="section-card" style="margin-top: 12px">
      <h2 class="section-title">进入牌桌参数</h2>
      <van-cell-group inset>
        <van-field v-model="form.tableId" label="tableId" placeholder="例如：table_20001" />
        <van-field v-model="form.roomId" label="roomId" placeholder="例如：room_1" />
        <van-field v-model="form.gameCode" label="gameCode" placeholder="例如：poker-texas" />
        <van-field
          v-model="form.token"
          type="password"
          label="token"
          placeholder="登录 token"
        />
      </van-cell-group>

      <div class="actions">
        <van-button type="primary" block @click="onEnterTable">进入牌桌</van-button>
        <van-button plain block @click="goBridgeDebug">打开 Bridge 调试页</van-button>
      </div>
    </section>
  </div>
</template>
