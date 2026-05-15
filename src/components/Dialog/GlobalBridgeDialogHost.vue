<script setup lang="ts">
import { computed } from 'vue'
import {
  finishActiveBridgeDialog,
  useBridgeDialogState,
} from '@/bridge/channels/dialogChannel'

const activeDialog = useBridgeDialogState()

const visible = computed(() => Boolean(activeDialog.value))
const title = computed(() => activeDialog.value?.title ?? '')
const message = computed(() => activeDialog.value?.message ?? '')
const showCancelButton = computed(() => activeDialog.value?.showCancelButton === true)
const showConfirmButton = computed(() =>
  activeDialog.value ? activeDialog.value.showConfirmButton !== false : false,
)
const cancelButtonText = computed(() => activeDialog.value?.cancelButtonText)
const confirmButtonText = computed(() => activeDialog.value?.confirmButtonText)
const closeOnClickOverlay = computed(() => activeDialog.value?.closeOnClickOverlay === true)

function onShowChange(nextShow: boolean): void {
  if (!nextShow) {
    finishActiveBridgeDialog('close')
  }
}

function onConfirm(): void {
  finishActiveBridgeDialog('confirm')
}

function onCancel(): void {
  finishActiveBridgeDialog('cancel')
}
</script>

<template>
  <GameDialog
    class="game-dialog--table"
    :show="visible"
    :title="title"
    :message="message"
    :show-cancel-button="showCancelButton"
    :show-confirm-button="showConfirmButton"
    :cancel-button-text="cancelButtonText"
    :confirm-button-text="confirmButtonText"
    :close-on-click-overlay="closeOnClickOverlay"
    teleport="body"
    @update:show="onShowChange"
    @confirm="onConfirm"
    @cancel="onCancel"
  />
</template>
