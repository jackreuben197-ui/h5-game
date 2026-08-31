import { subscribeCocosMessages } from '../core/cocosBridgeChannel'
import { BRIDGE_ACTION, BRIDGE_MSG_TYPE, type BridgeMessage, type H5NavigatePayload } from '@bridge-protocol'
import router from '@/router'
import type { RouteLocationRaw } from 'vue-router'
import { useLoginModalStore } from '@/stores/loginModal'
import { pinia } from '@/stores/pinia'
import { createLogger } from '@/utils/logger'

const log = createLogger('[bridge]')

let stopH5VisibilityListener: (() => void) | null = null

const COCOS_ACTIVE_ATTRIBUTE = 'data-cocos-active'

function getH5Root(): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null
  }
  return document.getElementById('app')
}

export function setH5Visible(visible: boolean): void {
  const root = getH5Root()
  if (!root) {
    return
  }

  // 只控制 H5 根节点可见性，Cocos 画布层保持不变。
  root.style.display = visible ? '' : 'none'
  if (typeof window !== 'undefined') {
    window.__H5_VISIBLE__ = visible

    // 进入牌桌后，桌面浏览器需要让 Cocos 画布使用完整视口。
    // 移动端是否放宽由宿主页的断点控制，这里只维护牌桌显示状态。
    const documentRoot = document.documentElement
    const cocosWasActive = documentRoot.hasAttribute(COCOS_ACTIVE_ATTRIBUTE)
    const cocosIsActive = !visible
    if (cocosIsActive) {
      documentRoot.setAttribute(COCOS_ACTIVE_ATTRIBUTE, '1')
    } else {
      documentRoot.removeAttribute(COCOS_ACTIVE_ATTRIBUTE)
    }

    if (cocosWasActive !== cocosIsActive) {
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event('h5:cocos-layout-change'))
      })
    }
  }

  log.info('[h5-visibility]', {
    visible,
    action: visible ? BRIDGE_ACTION.H5_SHOW : BRIDGE_ACTION.H5_HIDE,
  })
}

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === 'object' && !Array.isArray(raw)
}

function normalizeNavigateTarget(payload: unknown): {
  route: RouteLocationRaw
  replace: boolean
  ensureVisible: boolean
  openLoginModal: boolean
} | null {
  if (typeof payload === 'string' && payload.trim()) {
    return {
      route: { path: payload.trim() },
      replace: false,
      ensureVisible: false,
      openLoginModal: false,
    }
  }

  if (!isRecord(payload)) {
    return null
  }

  const raw = payload as H5NavigatePayload
  const path = typeof raw.path === 'string' ? raw.path.trim() : ''
  const hasPath = Boolean(path)
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const hasName = name.length > 0
  if (!hasPath && !hasName) {
    return null
  }

  const shouldOpenLoginModal = raw.openLoginModal === true || name === 'login' || name === 'login1'
  const routeObject: Record<string, unknown> = hasPath
    ? { path }
    : {
        name: shouldOpenLoginModal ? 'lobby' : name,
      }
  if (isRecord(raw.params)) {
    routeObject.params = raw.params
  }
  if (isRecord(raw.query)) {
    routeObject.query = raw.query
  }
  if (typeof raw.hash === 'string' && raw.hash) {
    routeObject.hash = raw.hash
  }

  return {
    route: routeObject as RouteLocationRaw,
    replace: raw.replace === true,
    ensureVisible: raw.ensureVisible === true,
    openLoginModal: shouldOpenLoginModal,
  }
}

async function navigateH5(payload: unknown): Promise<void> {
  const normalized = normalizeNavigateTarget(payload)
  if (!normalized) {
    log.warn('[h5-navigate] invalid payload:', payload)
    return
  }

  if (normalized.ensureVisible) {
    setH5Visible(true)
  }

  try {
    await router.isReady()
    const failure = normalized.replace
      ? await router.replace(normalized.route)
      : await router.push(normalized.route)
    if (failure) {
      log.warn('[h5-navigate] navigation failed:', failure)
      return
    }
    if (normalized.openLoginModal) {
      useLoginModalStore(pinia).open()
    }

    log.info('[h5-navigate] done', {
      mode: normalized.replace ? 'replace' : 'push',
      target: normalized.route,
      openLoginModal: normalized.openLoginModal,
    })
  } catch (error) {
    log.warn('[h5-navigate] navigation error:', error)
  }
}

function onCocosMessage(message: BridgeMessage): void {
  if (message.action === BRIDGE_ACTION.H5_HIDE) {
    setH5Visible(false)
    return
  }

  if (message.action === BRIDGE_ACTION.H5_SHOW) {
    setH5Visible(true)
    return
  }

  if (message.action === BRIDGE_ACTION.H5_NAVIGATE) {
    void navigateH5(message.payload)
  }
}

export function setupH5VisibilityBridgeChannel(): () => void {
  if (stopH5VisibilityListener) {
    return stopH5VisibilityListener
  }

  const unsubscribe = subscribeCocosMessages(onCocosMessage, {
    msgtype: BRIDGE_MSG_TYPE.H5,
  })
  stopH5VisibilityListener = () => {
    unsubscribe()
    stopH5VisibilityListener = null
  }

  return stopH5VisibilityListener
}
