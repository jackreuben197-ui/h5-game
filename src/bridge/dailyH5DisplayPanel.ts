import { postMiscH5DisplayApi } from '@/api/misc'
import type {
  MiscH5DisplayDownloadApp,
  MiscH5DisplayFindUs,
  MiscH5DisplayPopupNotice,
} from '@/api/models/misc'
import { openBridgePanel } from '@/bridge/channels/panelChannel'
import { subscribeCocosMessages } from '@/bridge/core/cocosBridgeChannel'
import StorageKey from '@/constants/storageKey'
import { isTelegramClubContext } from '@/utils/channelPackage'
import { BRIDGE_ACTION, BRIDGE_MSG_TYPE, type BridgeMessage } from '@bridge-protocol'
import { t } from '@/i18n'
import { localStore } from '@/utils/localStore'
import { createLogger } from '@/utils/logger'
import { getLocalDateKey } from '@/utils/time'

// 后台未配置展示内容时的兜底品牌域名。TODO: 替换/确认为正式域名。
const FALLBACK_BRAND_DOMAIN = 'xyylc888.com'

// 后台三类数据全空时的内置多语言兜底（文案走 i18n，域名/链接为常量）。
function buildFallbackDisplay(): {
  download_app: MiscH5DisplayDownloadApp
  popup_notices: MiscH5DisplayPopupNotice[]
  find_us: MiscH5DisplayFindUs
} {
  const appBaseUrl = new URL(import.meta.env.BASE_URL, window.location.href).toString()
  return {
    download_app: {
      name: FALLBACK_BRAND_DOMAIN,
      icon_url: new URL('icon-192.png', appBaseUrl).toString(),
      title: `${t('H5Display_DownloadTitle')}<br>${t('H5Display_OfficialSite')}<span style="color:#2681FF">${FALLBACK_BRAND_DOMAIN}</span>`,
      download_url: `https://${FALLBACK_BRAND_DOMAIN}`,
    },
    popup_notices: [
      {
        id: -1,
        title: t('H5Display_RulesTab'),
        headerTitle: t('H5Display_RulesHeader'),
        content: t('H5Display_RulesContent'),
      },
    ],
    find_us: {
      title: t('H5Display_FindUsTitle'),
      content: t('H5Display_FindUsSub'),
      link_list: [FALLBACK_BRAND_DOMAIN],
    },
  }
}

const log = createLogger('[h5-display]')

// 群组/频道的俱乐部深链（startapp=home_<roomId>_<clubRandomId> 等）进来的会话不弹下载推广。
// 页内重载后 Telegram 不再把 tgWebAppStartParam 放回地址，start_param 随之消失，
// 所以首次判定成功就在 sessionStorage 打标记，后续触点凭标记继续屏蔽。
// 用 sessionStorage 而非 localStorage：origin 与普通站点相同，落到 localStorage 会连浏览器里也永久屏蔽。
const TG_CLUB_ENTRY_SESSION_KEY = 'H5_DISPLAY_TG_CLUB_ENTRY'

function isTelegramClubEntry(): boolean {
  try {
    if (window.sessionStorage.getItem(TG_CLUB_ENTRY_SESSION_KEY) === '1') {
      return true
    }
  } catch {
    // sessionStorage 不可用：退化为实时判定
  }

  if (!isTelegramClubContext()) {
    return false
  }

  try {
    window.sessionStorage.setItem(TG_CLUB_ENTRY_SESSION_KEY, '1')
  } catch {
    // 打标记失败不影响本次屏蔽
  }
  return true
}

// 每天首次进入 H5 自动弹出"H5 展示"通知面板：登录/未登录都触发，过 0 点后凭本地日期标记自动重置。
export async function tryShowDailyH5DisplayPanel(): Promise<void> {
  // 先于日期标记返回：否则俱乐部深链会吃掉当天的展示机会，同一天从主站进来就再也看不到。
  if (isTelegramClubEntry()) {
    return
  }

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
  // 空对象也视为无数据，面板侧会按需跳过对应步骤
  let downloadApp =
    data.download_app &&
    typeof data.download_app === 'object' &&
    Object.keys(data.download_app).length > 0
      ? data.download_app
      : null
  let popupNotices = Array.isArray(data.popup_notices) ? data.popup_notices : []
  let findUs =
    data.find_us && typeof data.find_us === 'object' && Object.keys(data.find_us).length > 0
      ? data.find_us
      : null

  // 三类数据全为空时，用内置多语言 fallback 兜底，保证仍有内容展示。
  if (!downloadApp && popupNotices.length === 0 && !findUs) {
    const fallback = buildFallbackDisplay()
    downloadApp = fallback.download_app
    popupNotices = fallback.popup_notices
    findUs = fallback.find_us
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
