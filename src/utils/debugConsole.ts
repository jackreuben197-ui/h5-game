import { resolvedThemeRef, setThemeMode, themeModeRef } from '@/utils/theme'
import { isTelegramMiniAppEnv } from '@/utils/environment'
import {
  isDebugCaptureSuppressed,
  setDebugCaptureSink,
  type DebugConsoleLevel,
  type DebugConsoleSource,
} from '@/utils/debugCapture'

export type { DebugConsoleLevel, DebugConsoleSource } from '@/utils/debugCapture'

export interface DebugConsoleEntry {
  id: number
  level: DebugConsoleLevel
  source: DebugConsoleSource
  timestamp: number
  text: string
}

const MAX_ENTRIES = 500
const MAX_RENDER_ENTRIES = 180
const state: {
  visible: boolean
  entries: DebugConsoleEntry[]
} = {
  visible: false,
  entries: [],
}

let nextEntryId = 1
let patched = false
let domReady = false
let originalConsole: {
  log: typeof console.log
  info: typeof console.info
  warn: typeof console.warn
  error: typeof console.error
} | null = null
let domRefs: {
  toggle: HTMLButtonElement | null
  telegramStatus: HTMLSpanElement | null
  panel: HTMLDivElement | null
  summary: HTMLDivElement | null
  themeCurrent: HTMLSpanElement | null
  themeButton: HTMLButtonElement | null
  body: HTMLDivElement | null
} = {
  toggle: null,
  telegramStatus: null,
  panel: null,
  summary: null,
  themeCurrent: null,
  themeButton: null,
  body: null,
}

function getOriginalConsole() {
  if (originalConsole) {
    return originalConsole
  }

  originalConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  }
  return originalConsole
}

function truncateText(text: string, maxLength = 1200): string {
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength)}...<trimmed>`
}

function safeJsonStringify(value: unknown): string {
  const seen = new WeakSet<object>()

  try {
    return JSON.stringify(
      value,
      (_key, currentValue) => {
        if (currentValue instanceof Error) {
          return {
            name: currentValue.name,
            message: currentValue.message,
            stack: currentValue.stack,
          }
        }

        if (currentValue instanceof ArrayBuffer) {
          return `<ArrayBuffer byteLength=${currentValue.byteLength}>`
        }

        if (ArrayBuffer.isView(currentValue)) {
          return `<${currentValue.constructor.name} byteLength=${currentValue.byteLength}>`
        }

        if (currentValue instanceof Blob) {
          return `<Blob size=${currentValue.size} type=${currentValue.type || 'unknown'}>`
        }

        if (typeof currentValue === 'object' && currentValue !== null) {
          if (seen.has(currentValue)) {
            return '[Circular]'
          }
          seen.add(currentValue)
        }

        return currentValue
      },
      2,
    )
  } catch (error) {
    return `[Unserializable: ${error instanceof Error ? error.message : String(error)}]`
  }
}

function stringifyArg(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  if (value instanceof Error) {
    return truncateText(value.stack || `${value.name}: ${value.message}`)
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value == null) {
    return String(value)
  }

  return truncateText(safeJsonStringify(value))
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const pad = (value: number, length = 2) => String(value).padStart(length, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getSummaryLines(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  return [
    `route: ${window.location.hash || window.location.pathname || '/'}`,
    `visible: ${window.__H5_VISIBLE__ !== false ? 'true' : 'false'}`,
    `h5Ready: ${window.__H5_READY__ === true ? 'true' : 'false'}`,
    `ccReady: ${window.__CC_READY__ === true ? 'true' : 'false'}`,
    `telegram: ${isTelegramMiniAppEnv() ? 'true' : 'false'}`,
    `theme: ${resolvedThemeRef.value} (${themeModeRef.value})`,
    `build: ${typeof __APP_INFO__ !== 'undefined' ? __APP_INFO__.lastBuildTime : 'unknown'}`,
    `logs: ${state.entries.length}`,
  ]
}

function renderDebugConsoleDom(): void {
  if (!domReady) {
    return
  }

  const { toggle, telegramStatus, panel, summary, themeCurrent, themeButton, body } = domRefs
  if (!toggle || !telegramStatus || !panel || !summary || !themeCurrent || !themeButton || !body) {
    return
  }

  toggle.style.display = state.visible ? 'none' : 'block'
  panel.style.display = state.visible ? 'flex' : 'none'
  summary.innerHTML = getSummaryLines()
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join('')
  themeCurrent.textContent = resolvedThemeRef.value === 'light' ? '浅色' : '深色'

  const prevScrollTop = body.scrollTop
  const prevScrollHeight = body.scrollHeight
  const shouldStickToLatest = prevScrollTop <= 8

  body.innerHTML = state.entries
    .slice(-MAX_RENDER_ENTRIES)
    .reverse()
    .map((entry) => {
      return `
        <div class="h5-debug-console__entry h5-debug-console__entry--${entry.level}">
          <span class="h5-debug-console__entry-time">${formatTime(entry.timestamp)}</span>
          <span class="h5-debug-console__entry-source">${escapeHtml(entry.source)}</span>
          <pre class="h5-debug-console__entry-text">${escapeHtml(entry.text)}</pre>
        </div>
      `
    })
    .join('')

  if (shouldStickToLatest) {
    body.scrollTop = 0
    return
  }

  const nextScrollHeight = body.scrollHeight
  const heightDelta = nextScrollHeight - prevScrollHeight
  body.scrollTop = prevScrollTop + Math.max(0, heightDelta)
}

function isDebugConsoleUiEnabled(): boolean {
  if (import.meta.env.DEV) return true
  if (import.meta.env.VITE_DEBUG_CONSOLE === 'open') return true
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('h5_debug') === '1'
  } catch {
    return false
  }
}

function attachDebugConsoleDom(): void {
  if (typeof document === 'undefined' || !document.body || domReady) {
    return
  }

  if (!isDebugConsoleUiEnabled()) {
    return
  }

  const style = document.createElement('style')
  style.id = 'h5-debug-console-style'
  style.textContent = `
    .h5-debug-console__toggle {
      position: fixed;
      top: 112px;
      left: 10px;
      z-index: 99999;
      min-width: 64px;
      min-height: 52px;
      padding: 8px 14px;
      border: 0;
      border-radius: 999px;
      background: rgba(12, 12, 12, 0.82);
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 1px;
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.28);
    }

    .h5-debug-console__toggle-telegram,
    .h5-debug-console__toggle-label {
      display: block;
      line-height: 1.2;
      white-space: nowrap;
    }

    .h5-debug-console__toggle-telegram {
      margin-bottom: 3px;
      color: #79e8b6;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0;
    }

    .h5-debug-console__panel {
      position: fixed;
      inset: 16px;
      z-index: 99999;
      display: none;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      padding: 20px;
      border-radius: 18px;
      background: rgba(8, 10, 16, 0.94);
      color: #f6f7fb;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.32);
      margin-top: 88px; /* 避开 Telegram 顶部安全区留白 */
    }

    .h5-debug-console__header,
    .h5-debug-console__meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .h5-debug-console__title {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .h5-debug-console__title strong {
      font-size: 22px;
      line-height: 1.25;
    }

    .h5-debug-console__title span,
    .h5-debug-console__summary {
      color: rgba(255, 255, 255, 0.66);
      font-size: 15px;
      line-height: 1.6;
    }

    .h5-debug-console__actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .h5-debug-console__actions button {
      min-width: 64px;
      height: 46px;
      padding: 0 16px;
      border: 0;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
      font-size: 16px;
      font-weight: 600;
    }

    .h5-debug-console__summary {
      margin-top: 16px;
    }

    .h5-debug-console__theme {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-top: 14px;
      padding: 12px 14px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.76);
      font-size: 16px;
    }

    .h5-debug-console__theme strong {
      color: #fff;
    }

    .h5-debug-console__theme button {
      min-width: 104px;
      height: 46px;
      padding: 0 18px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 999px;
      background: #252834;
      color: #fff;
      font-size: 16px;
      font-weight: 600;
    }

    .h5-debug-console__body {
      flex: 1;
      min-height: 0;
      margin-top: 16px;
      padding: 14px;
      overflow: auto;
      border-radius: 14px;
      background: rgba(0, 0, 0, 0.34);
    }

    .h5-debug-console__entry {
      display: grid;
      grid-template-columns: auto auto 1fr;
      gap: 12px;
      align-items: start;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 16px;
      line-height: 1.55;
    }

    .h5-debug-console__entry:last-child {
      border-bottom: 0;
    }

    .h5-debug-console__entry-time,
    .h5-debug-console__entry-source {
      color: rgba(255, 255, 255, 0.52);
      white-space: nowrap;
    }

    .h5-debug-console__entry-text {
      margin: 0;
      color: inherit;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
    }

    @media (max-width: 640px) {
      .h5-debug-console__toggle {
        top: 96px;
        left: 8px;
        min-width: 60px;
        min-height: 48px;
        padding: 7px 12px;
        font-size: 15px;
      }

      .h5-debug-console__panel {
        inset: 8px;
        margin-top: 72px;
        padding: 14px;
        border-radius: 16px;
      }

      .h5-debug-console__header {
        align-items: stretch;
        flex-direction: column;
        gap: 12px;
      }

      .h5-debug-console__title {
        flex-direction: row;
        align-items: baseline;
        justify-content: space-between;
      }

      .h5-debug-console__title strong {
        font-size: 20px;
      }

      .h5-debug-console__title span,
      .h5-debug-console__summary {
        font-size: 14px;
      }

      .h5-debug-console__actions {
        width: 100%;
        gap: 8px;
      }

      .h5-debug-console__actions button {
        flex: 1;
        min-width: 0;
        height: 44px;
        padding: 0 10px;
        font-size: 15px;
      }

      .h5-debug-console__summary {
        margin-top: 14px;
      }

      .h5-debug-console__theme {
        gap: 10px;
        margin-top: 12px;
        padding: 10px 12px;
        font-size: 15px;
      }

      .h5-debug-console__theme button {
        min-width: 96px;
        height: 44px;
        padding: 0 14px;
        font-size: 15px;
      }

      .h5-debug-console__body {
        margin-top: 12px;
        padding: 10px 12px;
      }

      .h5-debug-console__entry {
        grid-template-columns: auto 1fr;
        column-gap: 10px;
        row-gap: 5px;
        padding: 10px 0;
        font-size: 14px;
        line-height: 1.55;
      }

      .h5-debug-console__entry-source {
        text-align: right;
      }

      .h5-debug-console__entry-text {
        grid-column: 1 / -1;
      }
    }

    .h5-debug-console__entry--debug {
      color: rgba(255, 255, 255, 0.9);
    }

    .h5-debug-console__entry--info {
      color: #9ed8ff;
    }

    .h5-debug-console__entry--warn {
      color: #ffd08a;
    }

    .h5-debug-console__entry--error {
      color: #ff9b9b;
    }
  `

  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.className = 'h5-debug-console__toggle'
  toggle.innerHTML = `
    <span class="h5-debug-console__toggle-telegram"></span>
    <span class="h5-debug-console__toggle-label">LOG</span>
  `
  toggle.addEventListener('click', () => openDebugConsole())
  const telegramStatus = toggle.querySelector(
    '.h5-debug-console__toggle-telegram',
  ) as HTMLSpanElement | null

  const panel = document.createElement('div')
  panel.className = 'h5-debug-console__panel'
  panel.innerHTML = `
    <div class="h5-debug-console__header">
      <div class="h5-debug-console__title">
        <strong>H5 Debug</strong>
        <span>${escapeHtml(__APP_INFO__.pkg.version)}</span>
      </div>
      <div class="h5-debug-console__actions">
        <button type="button" data-action="copy">复制</button>
        <button type="button" data-action="clear">清空</button>
        <button type="button" data-action="close">关闭</button>
      </div>
    </div>
    <div class="h5-debug-console__summary"></div>
    <div class="h5-debug-console__theme">
      <span>当前主题：<strong data-theme-current></strong></span>
      <button type="button" data-action="theme">切换主题</button>
    </div>
    <div class="h5-debug-console__body"></div>
  `

  const summary = panel.querySelector('.h5-debug-console__summary') as HTMLDivElement | null
  const themeCurrent = panel.querySelector('[data-theme-current]') as HTMLSpanElement | null
  const themeButton = panel.querySelector('[data-action="theme"]') as HTMLButtonElement | null
  const body = panel.querySelector('.h5-debug-console__body') as HTMLDivElement | null
  const copyButton = panel.querySelector('[data-action="copy"]') as HTMLButtonElement | null
  const clearButton = panel.querySelector('[data-action="clear"]') as HTMLButtonElement | null
  const closeButton = panel.querySelector('[data-action="close"]') as HTMLButtonElement | null

  copyButton?.addEventListener('click', async () => {
    const text = getDebugConsoleText()
    if (!text) {
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      copyButton.textContent = '已复制'
      window.setTimeout(() => {
        copyButton.textContent = '复制'
      }, 1200)
    } catch {
      copyButton.textContent = '失败'
      window.setTimeout(() => {
        copyButton.textContent = '复制'
      }, 1200)
    }
  })
  clearButton?.addEventListener('click', () => clearDebugConsoleEntries())
  closeButton?.addEventListener('click', () => closeDebugConsole())
  themeButton?.addEventListener('click', () => {
    setThemeMode(resolvedThemeRef.value === 'light' ? 'dark' : 'light')
    renderDebugConsoleDom()
    closeDebugConsole()
  })

  document.head.appendChild(style)
  document.body.appendChild(toggle)
  document.body.appendChild(panel)

  domRefs = { toggle, telegramStatus, panel, summary, themeCurrent, themeButton, body }
  domReady = true
  new MutationObserver(() => renderDebugConsoleDom()).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  renderDebugConsoleDom()
}

function ensureDebugConsoleDom(): void {
  if (typeof document === 'undefined') {
    return
  }

  if (document.body) {
    attachDebugConsoleDom()
    return
  }

  document.addEventListener(
    'DOMContentLoaded',
    () => {
      attachDebugConsoleDom()
    },
    { once: true },
  )
}

function appendEntry(level: DebugConsoleLevel, source: DebugConsoleSource, args: unknown[]): void {
  const text = args.map((arg) => stringifyArg(arg)).join(' ')
  state.entries.push({
    id: nextEntryId,
    level,
    source,
    timestamp: Date.now(),
    text,
  })
  nextEntryId += 1

  if (state.entries.length > MAX_ENTRIES) {
    state.entries.splice(0, state.entries.length - MAX_ENTRIES)
  }

  renderDebugConsoleDom()
}

function installConsolePatch(): void {
  if (patched || typeof window === 'undefined') {
    return
  }

  const rawConsole = getOriginalConsole()
  console.log = (...args: unknown[]) => {
    if (!isDebugCaptureSuppressed()) {
      appendEntry('debug', 'console', args)
    }
    rawConsole.log(...args)
  }
  console.info = (...args: unknown[]) => {
    if (!isDebugCaptureSuppressed()) {
      appendEntry('info', 'console', args)
    }
    rawConsole.info(...args)
  }
  console.warn = (...args: unknown[]) => {
    if (!isDebugCaptureSuppressed()) {
      appendEntry('warn', 'console', args)
    }
    rawConsole.warn(...args)
  }
  console.error = (...args: unknown[]) => {
    if (!isDebugCaptureSuppressed()) {
      appendEntry('error', 'console', args)
    }
    rawConsole.error(...args)
  }

  window.addEventListener('error', (event) => {
    appendEntry('error', 'runtime', [
      '[runtime]',
      'window error',
      {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      },
    ])
  })

  window.addEventListener('unhandledrejection', (event) => {
    appendEntry('error', 'runtime', ['[runtime]', 'unhandled rejection', event.reason])
  })

  patched = true
}

export function initDebugConsole(): void {
  setDebugCaptureSink(appendEntry)
  installConsolePatch()
  ensureDebugConsoleDom()

  if (typeof window === 'undefined') {
    return
  }

  window.__H5_DEBUG_CONSOLE__ = {
    open: openDebugConsole,
    close: closeDebugConsole,
    clear: clearDebugConsoleEntries,
    copy: getDebugConsoleText,
  }
}

export function openDebugConsole(): void {
  state.visible = true
  renderDebugConsoleDom()
}

export function closeDebugConsole(): void {
  state.visible = false
  renderDebugConsoleDom()
}

export function clearDebugConsoleEntries(): void {
  state.entries.splice(0, state.entries.length)
  renderDebugConsoleDom()
}

export function getDebugConsoleText(): string {
  return state.entries
    .map(
      (entry) => `[${formatTime(entry.timestamp)}][${entry.level}][${entry.source}] ${entry.text}`,
    )
    .join('\n')
}
