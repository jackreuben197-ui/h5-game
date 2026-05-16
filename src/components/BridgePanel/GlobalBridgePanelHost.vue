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
const closeOnClickOverlay = computed(() => renderedPanel.value?.closeOnClickOverlay === true)
const currentPanelComponent = computed(() =>
  renderedPanel.value ? bridgePanelRegistry[renderedPanel.value.panelType] ?? null : null,
)
const panelProps = computed(() => renderedPanel.value?.props ?? {})
const shouldShowFallback = computed(() => Boolean(renderedPanel.value && !currentPanelComponent.value))

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
  <GameDialog
    class="game-panel-dialog"
    :show="visible"
    :title="title"
    :show-footer="false"
    :show-confirm-button="false"
    :show-cancel-button="false"
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
