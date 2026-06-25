// iOS Web Clip 描述文件（.mobileconfig）生成与下载
//
// 用途：iOS 上唯一"一键添加到桌面"的合法手段，绕开 Safari "分享→添加到主屏幕"的三步操作。
// 代价：用户首次安装会看到"未签名"红字警告，需进 设置→通用→VPN 与设备管理 手动信任。
//
// 限制：
//   1. 只能在原生 Safari 里使用（iOS Chrome/微信/抖音等内嵌 WebView 都不响应 mobileconfig）
//   2. 描述文件未用 Apple Developer 证书签名，iOS 会标"未签名"
//   3. 如需消除红字警告，需买 Apple Developer 账号 ($99/年) 用 `security cms -S` 签名后由后端下发

/**
 * 当前是否为 iOS 系统（含 iPad / iPhone / iPod，含 iPadOS 13+ 的 Mac UA 伪装）
 */
export function isIos(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true
  // iPadOS 13+ 默认 UA 跟 macOS Safari 一样，靠触控点数区分
  return ua.includes('Mac') && navigator.maxTouchPoints > 1
}

/**
 * 当前是否为 iOS 上的 Chrome / Firefox / Edge 等第三方浏览器（CriOS / FxiOS / EdgiOS）。
 * 这些浏览器无法触发 mobileconfig 安装流程，必须复制链接到 Safari 打开。
 */
export function isIosThirdPartyBrowser(): boolean {
  if (!isIos()) return false
  return /CriOS|FxiOS|EdgiOS|OPiOS/.test(window.navigator.userAgent)
}

/**
 * 当前是否为 iOS 原生 Safari（可以触发 mobileconfig 安装）。
 * 排除：iOS 第三方浏览器、所有内嵌 WebView（微信 / 抖音 / TG / SFSafariViewController）。
 */
export function isIosNativeSafari(): boolean {
  if (!isIos()) return false
  if (isIosThirdPartyBrowser()) return false
  const ua = window.navigator.userAgent
  // 微信 / 抖音 / TG 等内嵌 WebView 都不是原生 Safari
  if (/MicroMessenger|QQ\/|Weibo|Aweme|TelegramBot|Line/i.test(ua)) return false
  // 原生 Safari UA 含 "Safari/" 且无第三方浏览器标记
  return /Safari\//.test(ua)
}

interface WebClipOptions {
  /** 桌面图标下方显示的应用名 */
  label: string
  /** 点击图标后打开的 URL，必须是 https */
  url: string
  /** 图标 URL，建议 144x144 以上的 PNG；会被 fetch + base64 编码进描述文件 */
  iconUrl: string
  /** 反域名格式的 Bundle ID，相同 ID 重复安装会被视为"更新"而非新增 */
  identifier?: string
  /** 是否启动后全屏（standalone 模式，无 Safari 地址栏） */
  fullScreen?: boolean
  /** 组织名，显示在描述文件详情页 */
  organization?: string
  /** 描述文字 */
  description?: string
}

/**
 * 将远程图片 URL 读成 base64（不含 data: 前缀）。
 * 注意：图片必须支持 CORS 或与当前页同源，否则 fetch 会失败。
 */
async function fetchIconAsBase64(iconUrl: string): Promise<string> {
  const res = await fetch(iconUrl)
  if (!res.ok) throw new Error(`fetch icon failed: ${res.status}`)
  const blob = await res.blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('FileReader result is not string'))
        return
      }
      // result 形如 "data:image/png;base64,xxxx"，截掉前缀
      const commaIdx = result.indexOf(',')
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'))
    reader.readAsDataURL(blob)
  })
}

/**
 * 生成简单 UUID v4（mobileconfig 的 PayloadUUID 要求格式 8-4-4-4-12 十六进制）。
 * 优先用 crypto.randomUUID()，老 iOS 不支持时降级到 Math.random。
 */
function uuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().toUpperCase()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  }).toUpperCase()
}

/**
 * XML 字符转义（防止 label / url / description 含特殊字符破坏 plist 结构）
 */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * 拼装 .mobileconfig 的 plist XML 字符串。
 * 内层 payload 是 Web Clip，外层是 Configuration profile。
 */
function buildMobileConfigXml(opts: Required<WebClipOptions>, iconBase64: string): string {
  const innerUuid = uuidV4()
  const outerUuid = uuidV4()
  const label = escapeXml(opts.label)
  const url = escapeXml(opts.url)
  const identifier = escapeXml(opts.identifier)
  const organization = escapeXml(opts.organization)
  const description = escapeXml(opts.description)

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>FullScreen</key>
      <${opts.fullScreen ? 'true' : 'false'}/>
      <key>Icon</key>
      <data>${iconBase64}</data>
      <key>IgnoreManifestScope</key>
      <true/>
      <key>IsRemovable</key>
      <true/>
      <key>Label</key>
      <string>${label}</string>
      <key>PayloadDescription</key>
      <string>${description}</string>
      <key>PayloadDisplayName</key>
      <string>${label}</string>
      <key>PayloadIdentifier</key>
      <string>${identifier}.webclip</string>
      <key>PayloadOrganization</key>
      <string>${organization}</string>
      <key>PayloadType</key>
      <string>com.apple.webClip.managed</string>
      <key>PayloadUUID</key>
      <string>${innerUuid}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>Precomposed</key>
      <true/>
      <key>URL</key>
      <string>${url}</string>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>${description}</string>
  <key>PayloadDisplayName</key>
  <string>${label}</string>
  <key>PayloadIdentifier</key>
  <string>${identifier}</string>
  <key>PayloadOrganization</key>
  <string>${organization}</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${outerUuid}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>
`
}

/**
 * 把 UTF-8 字符串转 base64（btoa 不支持非 ASCII，必须先 UTF-8 编码）。
 */
function utf8ToBase64(s: string): string {
  if (typeof TextEncoder !== 'undefined') {
    const bytes = new TextEncoder().encode(s)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
  return btoa(unescape(encodeURIComponent(s)))
}

/**
 * 触发 iOS 安装 Web Clip 描述文件。
 *
 * 调用前应先用 `isIosNativeSafari()` 判断；其他环境调用本函数不会成功，
 * 应在 UI 层引导用户复制链接到 Safari 打开。
 *
 * 工作原理：构造完整的 .mobileconfig XML，base64 后包成 data URL 设置给 location.href。
 * iOS Safari 看到 `application/x-apple-aspen-config` MIME 会弹"是否允许下载描述文件"。
 *
 * @throws 如果 iconUrl 跨域且服务器没开 CORS，fetch 会失败
 */
export async function installIosWebClip(opts: WebClipOptions): Promise<void> {
  const filled: Required<WebClipOptions> = {
    identifier: 'com.newpkr.webclip',
    fullScreen: true,
    organization: opts.label,
    description: `Add ${opts.label} to home screen`,
    ...opts,
  }

  const iconBase64 = await fetchIconAsBase64(opts.iconUrl)
  const xml = buildMobileConfigXml(filled, iconBase64)
  const dataUrl = `data:application/x-apple-aspen-config;base64,${utf8ToBase64(xml)}`

  // 必须用 location.href 跳转，iOS Safari 才会识别 MIME 触发安装流程。
  // 用 <a download> 或 window.open 都不行（前者下载到"文件"App，后者新标签页打开会失败）。
  window.location.href = dataUrl
}
