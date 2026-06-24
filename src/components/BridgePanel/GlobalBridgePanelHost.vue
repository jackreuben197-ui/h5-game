<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  type ActiveBridgePanel,
  closeActiveBridgePanel,
  emitActiveBridgePanelEvent,
  useBridgePanelState,
} from '@/bridge/channels/panelChannel'
import { bridgePanelRegistry } from './panelRegistry'

const activePanel = useBridgePanelState()
const renderedPanel = ref<ActiveBridgePanel | null>(null)

const visible = computed(() => Boolean(activePanel.value))
const title = computed(() => renderedPanel.value?.title ?? '')
const showH5Bg = computed(() => renderedPanel.value?.showH5Bg === true)
const noNotificationDialog = computed(() => renderedPanel.value?.panelType !== 'notification')
const closeOnClickOverlay = computed(() => renderedPanel.value?.closeOnClickOverlay === true)
const isMttRecord = computed(() => renderedPanel.value?.panelType === 'mttRecord')
const currentPanelComponent = computed(() =>
  renderedPanel.value ? (bridgePanelRegistry[renderedPanel.value.panelType] ?? null) : null,
)
const panelProps = computed(() => renderedPanel.value?.props ?? {})
const shouldShowFallback = computed(() =>
  Boolean(renderedPanel.value && !currentPanelComponent.value),
)

watch(
  activePanel,
  (nextPanel) => {
    if (nextPanel) {
      renderedPanel.value = nextPanel
    }
  },
  { immediate: true },
)

function onShowChange(nextShow: boolean): void {
  if (!nextShow) {
    closeActiveBridgePanel('close', {
      from: 'overlay',
    })
  }
}

function onDialogClose(): void {
  if (!activePanel.value) {
    renderedPanel.value = null
  }
}
</script>

<template>
  <van-popup
    :show="visible && isMttRecord"
    position="left"
    teleport="body"
    :close-on-click-overlay="closeOnClickOverlay"
    class="bridge-panel-left-popup"
    :duration="0.2"
    @update:show="onShowChange"
    @closed="onDialogClose"
  >
    <component
      :is="currentPanelComponent"
      v-if="renderedPanel && currentPanelComponent && isMttRecord"
      :panel-props="panelProps"
      :emit-panel-event="emitActiveBridgePanelEvent"
      :close-panel="closeActiveBridgePanel"
    />
  </van-popup>

  <GameDialog
    :class="{ 'game-panel-dialog': !showH5Bg, 'notification-dialog': !noNotificationDialog }"
    :show="visible && !isMttRecord"
    :title="title"
    :show-footer="false"
    :show-confirm-button="false"
    :show-cancel-button="false"
    :show-box-shawdow="noNotificationDialog"
    :close-on-click-overlay="closeOnClickOverlay"
    teleport="body"
    @update:show="onShowChange"
    @close="onDialogClose"
  >
    <component
      :is="currentPanelComponent"
      v-if="renderedPanel && currentPanelComponent"
      :panel-props="panelProps"
      :emit-panel-event="emitActiveBridgePanelEvent"
      :close-panel="closeActiveBridgePanel"
    />

    <div v-else-if="shouldShowFallback" class="game-panel-dialog__fallback">
      <p class="game-panel-dialog__fallback-title">未注册的面板类型</p>
      <p class="game-panel-dialog__fallback-text">
        {{ renderedPanel?.panelType || 'unknown' }}
      </p>
      <button
        class="game-panel-dialog__fallback-btn"
        type="button"
        @click="closeActiveBridgePanel('close', { from: 'fallback' })"
      >
        关闭
      </button>
    </div>
  </GameDialog>
</template>

<style scoped lang="scss">
.game-panel-dialog__fallback {
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
  text-align: center;
}

.game-panel-dialog__fallback-title {
  margin: 0;
  font-size: 0.48rem;
  color: #fff;
  font-weight: 600;
}

.game-panel-dialog__fallback-text {
  margin: 0;
  font-size: 0.34rem;
  color: rgba(255, 255, 255, 0.72);
}

.game-panel-dialog__fallback-btn {
  border: none;
  border-radius: 999px;
  height: 1rem;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 0.36rem;
}
</style>

<style lang="scss">
.bridge-panel-left-popup {
  width: 90vw;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: transparent;
}
.notification-dialog {
  .game-dialog__card {
    padding: 0.5rem 0.3rem;
  }
}
</style>
