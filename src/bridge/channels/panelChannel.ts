import { ref, readonly, type Ref } from 'vue'
import { subscribeCocosMessages, sendBridgeMessage } from '../core/cocosBridgeChannel'
import {
  BRIDGE_ACTION,
  BRIDGE_MSG_TYPE,
  type BridgeMessage,
  type ClosePanelPayload,
  type CocosPanelPayload,
  type PanelEventPayload,
} from '@bridge-protocol'
import { setH5Visible } from './uiChannel'
import { runBridgeAction } from '@/components/BridgePanel/actionRegistry'

export interface ActiveBridgePanel extends CocosPanelPayload {
  requestId: string
}

let stopBridgePanelListener: (() => void) | null = null
const activeBridgePanel = ref<ActiveBridgePanel | null>(null)

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === 'object' && !Array.isArray(raw)
}

function normalizePanelPayload(payload: unknown): CocosPanelPayload | null {
  if (!isRecord(payload)) {
    return null
  }

  const panelType = typeof payload.panelType === 'string' ? payload.panelType.trim() : ''
  if (!panelType) {
    return null
  }

  return {
    panelType,
    title: typeof payload.title === 'string' ? payload.title : undefined,
    props: isRecord(payload.props) ? payload.props : undefined,
    closeOnClickOverlay: payload.closeOnClickOverlay !== false,
    ensureVisible: payload.ensureVisible === true,
    showH5Bg: payload.showH5Bg === true,
  }
}

function shouldClosePanel(payload: unknown): boolean {
  const currentPanel = activeBridgePanel.value
  if (!currentPanel) {
    return false
  }

  if (!payload) {
    return true
  }

  if (typeof payload === 'string') {
    return payload === currentPanel.requestId || payload === currentPanel.panelType
  }

  if (!isRecord(payload)) {
    return true
  }

  const closePayload = payload as ClosePanelPayload
  if (typeof closePayload.requestId === 'string' && closePayload.requestId !== currentPanel.requestId) {
    return false
  }
  if (typeof closePayload.panelType === 'string' && closePayload.panelType !== currentPanel.panelType) {
    return false
  }

  return true
}

function showBridgePanel(payload: CocosPanelPayload, requestId: string): void {
  if (payload.ensureVisible === true) {
    setH5Visible(true)
  }

  activeBridgePanel.value = {
    ...payload,
    requestId,
  }
}

export function openBridgePanel(payload: CocosPanelPayload, requestId?: string): void {
  const normalizedRequestId =
    typeof requestId === 'string' && requestId.trim()
      ? requestId.trim()
      : `local_panel_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  showBridgePanel(payload, normalizedRequestId)
}

function onCocosMessage(message: BridgeMessage): void {
  if (message.action === BRIDGE_ACTION.SHOW_PANEL) {
    console.log('SHOW_PANEL', message.payload)
    const panelPayload = normalizePanelPayload(message.payload)
    if (!panelPayload) {
      return
    }

    // 先尝试走“bridge action”分流。
    // 这类类型不需要 GlobalBridgePanelHost + GameDialog 承载，
    // 更像是“触发一个全局行为”，例如直接打开全局客服单例。
    if (runBridgeAction(panelPayload)) {
      if (panelPayload.ensureVisible === true) {
        setH5Visible(true)
      }
      return
    }

    showBridgePanel(panelPayload, message.requestId)
    return
  }

  if (message.action === BRIDGE_ACTION.CLOSE_PANEL && shouldClosePanel(message.payload)) {
    activeBridgePanel.value = null
  }
}

export function setupGlobalBridgePanelChannel(): () => void {
  if (stopBridgePanelListener) {
    return stopBridgePanelListener
  }

  const unsubscribe = subscribeCocosMessages(onCocosMessage, {
    msgtype: BRIDGE_MSG_TYPE.H5,
  })
  stopBridgePanelListener = () => {
    unsubscribe()
    stopBridgePanelListener = null
  }

  return stopBridgePanelListener
}

export function useBridgePanelState(): Readonly<Ref<ActiveBridgePanel | null>> {
  return readonly(activeBridgePanel)
}

export function emitActiveBridgePanelEvent(event: string, payload?: unknown): void {
  const currentPanel = activeBridgePanel.value
  emitBridgePanelEvent(currentPanel?.requestId, event, payload)
}

function emitBridgePanelEvent(panelRequestId: string | undefined, event: string, payload?: unknown): void {
  const normalizedEvent = event.trim()
  if (!panelRequestId || !normalizedEvent) {
    return
  }

  const eventPayload: PanelEventPayload = {
    panelRequestId,
    event: normalizedEvent,
    payload,
  }

  sendBridgeMessage(BRIDGE_ACTION.PANEL_EVENT, eventPayload, {
    msgtype: BRIDGE_MSG_TYPE.H5,
  })
}

export function closeActiveBridgePanel(reason = 'close', payload?: unknown): void {
  const currentPanel = activeBridgePanel.value
  if (!currentPanel) {
    return
  }

  activeBridgePanel.value = null
  emitBridgePanelEvent(currentPanel.requestId, reason, payload)
}
