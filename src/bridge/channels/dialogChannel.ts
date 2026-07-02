import { ref, readonly, type Ref } from 'vue'
import { subscribeCocosMessages, sendBridgeMessage } from '../core/cocosBridgeChannel'
import {
  BRIDGE_ACTION,
  BRIDGE_MSG_TYPE,
  type BridgeMessage,
  type CocosDialogPayload,
  type DialogResultPayload,
} from '@bridge-protocol'
import { setH5Visible } from './uiChannel'

interface ActiveBridgeDialog extends CocosDialogPayload {
  // 由 Cocos 发起时存在；H5 本地弹窗时为空。
  requestId?: string
  onConfirm?: () => void
  onCancel?: () => void
  onClose?: () => void
}

export interface LocalBridgeDialogOptions extends CocosDialogPayload {
  onConfirm?: () => void
  onCancel?: () => void
  onClose?: () => void
}

let stopBridgeDialogListener: (() => void) | null = null
const activeBridgeDialog = ref<ActiveBridgeDialog | null>(null)

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === 'object' && !Array.isArray(raw)
}

function normalizeDialogPayload(payload: unknown): CocosDialogPayload | null {
  if (typeof payload === 'string') {
    const message = payload.trim()
    if (!message) {
      return null
    }

    return {
      message,
      showConfirmButton: true,
      ensureVisible: false,
    }
  }

  if (!isRecord(payload)) {
    return null
  }

  const message = typeof payload.message === 'string' ? payload.message.trim() : ''
  if (!message) {
    return null
  }

  return {
    title: typeof payload.title === 'string' ? payload.title : undefined,
    message,
    showCancelButton: payload.showCancelButton === true,
    showConfirmButton: payload.showConfirmButton !== false,
    cancelButtonText:
      typeof payload.cancelButtonText === 'string' ? payload.cancelButtonText : undefined,
    confirmButtonText:
      typeof payload.confirmButtonText === 'string' ? payload.confirmButtonText : undefined,
    closeOnClickOverlay: payload.closeOnClickOverlay === true,
    ensureVisible: payload.ensureVisible === true,
  }
}

function showBridgeDialog(payload: CocosDialogPayload, requestId: string): void {
  if (payload.ensureVisible === true) {
    setH5Visible(true)
  }

  activeBridgeDialog.value = {
    ...payload,
    requestId,
  }
}

function onCocosMessage(message: BridgeMessage): void {
  if (message.action !== BRIDGE_ACTION.SHOW_DIALOG) {
    return
  }

  const dialogPayload = normalizeDialogPayload(message.payload)
  if (!dialogPayload) {
    return
  }

  showBridgeDialog(dialogPayload, message.requestId)
}

export function setupGlobalBridgeDialogChannel(): () => void {
  if (stopBridgeDialogListener) {
    return stopBridgeDialogListener
  }

  const unsubscribe = subscribeCocosMessages(onCocosMessage, {
    msgtype: BRIDGE_MSG_TYPE.H5,
  })
  stopBridgeDialogListener = () => {
    unsubscribe()
    stopBridgeDialogListener = null
  }

  return stopBridgeDialogListener
}

export function useBridgeDialogState(): Readonly<Ref<ActiveBridgeDialog | null>> {
  return readonly(activeBridgeDialog)
}

export function finishActiveBridgeDialog(action: DialogResultPayload['action']): void {
  const currentDialog = activeBridgeDialog.value
  if (!currentDialog) {
    return
  }

  activeBridgeDialog.value = null

  if (currentDialog.requestId) {
    const payload: DialogResultPayload = {
      dialogRequestId: currentDialog.requestId,
      action,
    }
    sendBridgeMessage(BRIDGE_ACTION.DIALOG_RESULT, payload, {
      msgtype: BRIDGE_MSG_TYPE.H5,
    })
    return
  }

  if (action === 'confirm') {
    currentDialog.onConfirm?.()
  } else if (action === 'cancel') {
    currentDialog.onCancel?.()
  } else {
    currentDialog.onClose?.()
  }
}

// H5 本地发起的弹窗（不与 Cocos 双向交互），通过 onConfirm/onCancel/onClose 回调反馈结果。
export function showLocalBridgeDialog(options: LocalBridgeDialogOptions): void {
  activeBridgeDialog.value = { ...options }
}
