import { postMiscH5DisplayApi } from '@/api/misc'
import { openBridgePanel } from '@/bridge/channels/panelChannel'
import { subscribeCocosMessages } from '@/bridge/core/cocosBridgeChannel'
import StorageKey from '@/constants/storageKey'
import { BRIDGE_ACTION, BRIDGE_MSG_TYPE, type BridgeMessage } from '@bridge-protocol'
import { localStore } from '@/utils/localStore'
import { createLogger } from '@/utils/logger'
import { getLocalDateKey } from '@/utils/time'

const log = createLogger('[h5-display]')

// 每天首次进入 H5 自动弹出"H5 展示"通知面板：登录/未登录都触发，过 0 点后凭本地日期标记自动重置。
export async function tryShowDailyH5DisplayPanel(): Promise<void> {
  const today = getLocalDateKey()
  const lastShown = localStore.getItem<string | null>(
    StorageKey.H5_DISPLAY_LAST_SHOWN_DATE,
    null,
  )
  if (lastShown === today) {
    return
  }

  const response = await postMiscH5DisplayApi()
  if (Number(response.code) !== 0) {
    return
  }

  const data = response.data || {}
  const downloadApp =
    data.download_app && typeof data.download_app === 'object' ? data.download_app : null
  const popupNotices = Array.isArray(data.popup_notices) ? data.popup_notices : []
  const findUs = data.find_us && typeof data.find_us === 'object' ? data.find_us : null

  // 三类数据全为空时不弹窗，但仍标记当天避免重复请求。
  if (!downloadApp && popupNotices.length === 0 && !findUs) {
    localStore.setItem(StorageKey.H5_DISPLAY_LAST_SHOWN_DATE, today)
    return
  }

  openBridgePanel({
    panelType: 'notification',
    title: '',
    props: {
      download_app: downloadApp ?? undefined,
      popup_notices: popupNotices,
      find_us: findUs ?? undefined,
    },
  })

  localStore.setItem(StorageKey.H5_DISPLAY_LAST_SHOWN_DATE, today)
}

function runTrigger(reason: string): void {
  void tryShowDailyH5DisplayPanel().catch((error) => {
    log.warn(`trigger from ${reason} failed:`, error)
  })
}

// 启动每日触发链路：首次挂载、可见性变化、Cocos h5Show 都会重新检查一次本地日期。
// 任意触点发现"今天还没弹"就请求接口并弹窗。
export function setupDailyH5DisplayPanel(): () => void {
  // 1) 入口立即尝试一次。
  runTrigger('bootstrap')

  // 2) document.visibilitychange：覆盖系统级前后台切换（如浏览器/系统层面）。
  const onVisibilityChange = (): void => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      runTrigger('visibilitychange')
    }
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  // 3) Cocos h5Show 桥接：Cocos 调起 WebView 时不一定触发浏览器 visibilitychange，单独兜底。
  const unsubscribeBridge = subscribeCocosMessages(
    (message: BridgeMessage) => {
      if (message.action === BRIDGE_ACTION.H5_SHOW) {
        runTrigger('bridge:h5Show')
      }
    },
    { msgtype: BRIDGE_MSG_TYPE.H5 },
  )

  return () => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
    unsubscribeBridge()
  }
}
