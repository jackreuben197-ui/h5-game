;(function () {
  var win = typeof globalThis !== 'undefined' ? globalThis : {}
  var doc = win.document
  var TG_SDK_URL = 'https://telegram.org/js/telegram-web-app.js?62'

  function toInsetNumber(value) {
    var next = Number(value)
    if (!Number.isFinite(next) || next < 0) {
      return 0
    }
    return Math.floor(next)
  }

  function readTelegramInitDataFromLocation() {
    try {
      if (!win.location || typeof win.URLSearchParams !== 'function') {
        return ''
      }

      var search = win.location.search || ''
      var hash = win.location.hash || ''
      var hashQueryIndex = hash.indexOf('?')
      var hashQuery = hashQueryIndex >= 0 ? hash.slice(hashQueryIndex) : ''

      var fromSearch = new win.URLSearchParams(search).get('tgWebAppData')
      if (fromSearch) {
        return fromSearch
      }

      var fromHash = new win.URLSearchParams(hashQuery).get('tgWebAppData')
      if (fromHash) {
        return fromHash
      }
    } catch (error) {
      if (win.console && typeof win.console.warn === 'function') {
        win.console.warn('[telegram] parse tgWebAppData failed:', error)
      }
    }
    return ''
  }

  function getSafeFillColor(tg) {
    if (!doc || !doc.documentElement || typeof win.getComputedStyle !== 'function') {
      var fallbackThemeParams = (tg && tg.themeParams) || {}
      return fallbackThemeParams.bg_color || fallbackThemeParams.secondary_bg_color || '#c6a2b8'
    }

    var rootStyles = win.getComputedStyle(doc.documentElement)
    var cssFallback = String(rootStyles.getPropertyValue('--tg-safe-fill-bg') || '').trim()

    if (cssFallback) {
      return cssFallback
    }

    var themeParams = (tg && tg.themeParams) || {}
    return themeParams.bg_color || themeParams.secondary_bg_color || '#c6a2b8'
  }

  function getViewportChromeHeight(tg) {
    var viewportHeight = Number(tg && tg.viewportHeight)
    var stableViewportHeight = Number(tg && tg.viewportStableHeight)
    var winHeight = Number(win.innerHeight)

    var chromeFromViewport = Number.isFinite(viewportHeight) && viewportHeight > 0
      ? Math.max(0, Math.floor(winHeight - viewportHeight))
      : 0
    var chromeFromStable = Number.isFinite(stableViewportHeight) && stableViewportHeight > 0
      ? Math.max(0, Math.floor(winHeight - stableViewportHeight))
      : 0

    return Math.max(chromeFromViewport, chromeFromStable)
  }

  function getTopControlsCompensation(tg, safeTop, contentTop) {
    var platform = String((tg && tg.platform) || '').toLowerCase()
    var isIos = platform.indexOf('ios') >= 0
    var isFullscreen = !!(tg && tg.isFullscreen)
    if (!isFullscreen){
      return 0
    }

    // 关闭按钮与操作栏在 fullscreen 下依然可能存在，不能按 0 处理。
    var controlBarBase = contentTop > 0 ? contentTop : isIos ? (isFullscreen ? 32 : 36) : (isFullscreen ? 24 : 28)

    // 某些客户端 safeAreaInset 上报偏小，用 viewport 与 window 高度差做兜底推断。
    var viewportChromeHeight = getViewportChromeHeight(tg)
    var inferredTopExtra = Math.min(36, viewportChromeHeight)

    // 顶部补偿至少覆盖 Telegram 顶部控件栏，contentSafeAreaInset.top 仍作为最高优先输入。
    var topCompensation = Math.max(controlBarBase, inferredTopExtra)
    var minTopGuard = safeTop + topCompensation

    return Math.max(minTopGuard, contentTop)
  }

  function applySafeAreaToCss(tg) {
    var safe = tg.safeAreaInset || {}
    var contentSafe = tg.contentSafeAreaInset || {}

    var safeTop = toInsetNumber(safe.top)
    var safeBottom = toInsetNumber(safe.bottom)
    var safeLeft = toInsetNumber(safe.left)
    var safeRight = toInsetNumber(safe.right)

    var contentTop = toInsetNumber(contentSafe.top)
    var contentBottom = toInsetNumber(contentSafe.bottom)
    var contentLeft = toInsetNumber(contentSafe.left)
    var contentRight = toInsetNumber(contentSafe.right)

    var guardTop = getTopControlsCompensation(tg, safeTop, contentTop)
    var guardBottom = Math.max(safeBottom, contentBottom)

    if (doc && doc.documentElement) {
      var rootStyle = doc.documentElement.style
      rootStyle.setProperty('--tg-safe-area-inset-top', safeTop + 'px')
      rootStyle.setProperty('--tg-safe-area-inset-bottom', safeBottom + 'px')
      rootStyle.setProperty('--tg-safe-area-inset-left', safeLeft + 'px')
      rootStyle.setProperty('--tg-safe-area-inset-right', safeRight + 'px')

      rootStyle.setProperty('--tg-content-safe-area-inset-top', contentTop + 'px')
      rootStyle.setProperty('--tg-content-safe-area-inset-bottom', contentBottom + 'px')
      rootStyle.setProperty('--tg-content-safe-area-inset-left', contentLeft + 'px')
      rootStyle.setProperty('--tg-content-safe-area-inset-right', contentRight + 'px')

      rootStyle.setProperty('--tg-safe-area-guard-top', guardTop + 'px')
      rootStyle.setProperty('--tg-safe-area-guard-bottom', guardBottom + 'px')
      rootStyle.setProperty('--tg-header-guard-top', Math.max(0, guardTop - safeTop) + 'px')
    }

    // 安全区仅通过 CSS 变量生效，由 index.html 中 #app > * 规则接管，避免直接改写 #app 布局。
  }

  function hideTelegramChromeButtons(tg) {
    if (tg.BackButton && typeof tg.BackButton.hide === 'function') {
      tg.BackButton.hide()
    }
    if (tg.MainButton && typeof tg.MainButton.hide === 'function') {
      tg.MainButton.hide()
    }
    if (tg.SecondaryButton && typeof tg.SecondaryButton.hide === 'function') {
      tg.SecondaryButton.hide()
    }
    if (tg.SettingsButton && typeof tg.SettingsButton.hide === 'function') {
      tg.SettingsButton.hide()
    }
  }

  function bindSafeAreaEvents(tg) {
    if (win.__H5_TG_SAFE_AREA_BOUND__) {
      return
    }

    win.__H5_TG_SAFE_AREA_BOUND__ = true
    if (typeof tg.onEvent !== 'function') {
      return
    }

    var refresh = function () {
      applySafeAreaToCss(tg)
    }

    tg.onEvent('safeAreaChanged', refresh)
    tg.onEvent('contentSafeAreaChanged', refresh)
    tg.onEvent('viewportChanged', refresh)
    tg.onEvent('fullscreenChanged', refresh)
  }

  function syncTelegramHeaderAndBackground(tg) {
    var fill = getSafeFillColor(tg)
    if (doc && doc.documentElement) {
      var rootStyle = doc.documentElement.style
      rootStyle.setProperty('--tg-safe-fill-bg', fill)
    }

    if (typeof tg.setBackgroundColor === 'function') {
      tg.setBackgroundColor(fill)
    }
    if (typeof tg.setHeaderColor === 'function') {
      tg.setHeaderColor(fill)
    }
  }

  function initTelegramWebApp() {
    if (!win.Telegram || !win.Telegram.WebApp) {
      return
    }

    var tg = win.Telegram.WebApp
    win.__H5_TG_MINI_APP__ = true
    if (doc && doc.documentElement) {
      doc.documentElement.setAttribute('data-tg-mini-app', '1')
    }

    var initData = String(tg.initData || '').trim()
    if (initData) {
      win.__H5_TG_INIT_DATA__ = initData
    }

    hideTelegramChromeButtons(tg)
    tg.ready()

    applySafeAreaToCss(tg)
    bindSafeAreaEvents(tg)
    syncTelegramHeaderAndBackground(tg)

    if (typeof tg.requestFullscreen === 'function') {
      tg.requestFullscreen()
    } else if (typeof tg.expand === 'function') {
      tg.expand()
    }

    // 全屏/展开请求后再刷新一次，覆盖异步状态变化。
    win.setTimeout(function () {
      applySafeAreaToCss(tg)
    }, 80)
    win.setTimeout(function () {
      applySafeAreaToCss(tg)
    }, 260)

    if (typeof tg.disableVerticalSwipes === 'function') {
      tg.disableVerticalSwipes()
    }
    if (typeof tg.enableClosingConfirmation === 'function') {
      tg.enableClosingConfirmation()
    }
  }

  function ensureTelegramSdkLoaded(onLoaded) {
    if (win.Telegram && win.Telegram.WebApp) {
      onLoaded()
      return
    }

    if (win.__H5_TG_SDK_LOADING__) {
      return
    }

    if (!doc || !doc.head) {
      return
    }

    win.__H5_TG_SDK_LOADING__ = true
    var script = doc.createElement('script')
    script.src = TG_SDK_URL
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.referrerPolicy = 'no-referrer'
    script.onload = onLoaded
    script.onerror = function () {
      if (win.console && typeof win.console.warn === 'function') {
        win.console.warn('[telegram] sdk load failed, continue without telegram bridge')
      }
    }
    doc.head.appendChild(script)
  }

  function initH5TelegramEnvironment() {
    var initDataFromUrl = readTelegramInitDataFromLocation()
    if (initDataFromUrl) {
      win.__H5_TG_MINI_APP__ = true
      win.__H5_TG_INIT_DATA__ = initDataFromUrl
    }

    // URL 中没有 tgWebAppData 时，也允许在 Telegram 容器内通过 window.Telegram.WebApp 启动。
    if (win.Telegram && win.Telegram.WebApp) {
      win.__H5_TG_MINI_APP__ = true
      if (doc && doc.documentElement) {
        doc.documentElement.setAttribute('data-tg-mini-app', '1')
      }
    }

    initTelegramWebApp()
    ensureTelegramSdkLoaded(initTelegramWebApp)
  }

  win.initH5TelegramEnvironment = initH5TelegramEnvironment
})()
