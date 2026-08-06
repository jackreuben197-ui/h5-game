export type ReservedGameWindow = Window | null

const LOADING_DOC = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>正在进入游戏…</title><style>html,body{height:100%;margin:0;background:#0f0808;color:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'HONOR Sans CN',sans-serif}body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}.spinner{width:32px;height:32px;border-radius:50%;border:3px solid rgba(249,249,249,.2);border-top-color:#55f329;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}p{margin:0;font-size:14px;opacity:.7}</style></head><body><div class="spinner"></div><p>正在进入游戏…</p></body></html>`

export function reserveGameWindow(features?: string): ReservedGameWindow {
  try {
    const win = features
      ? window.open('', '_blank', features)
      : window.open('', '_blank')
    if (!win) {
      return null
    }
    try {
      win.document.open()
      win.document.write(LOADING_DOC)
      win.document.close()
    } catch {
      void 0
    }
    return win
  } catch {
    return null
  }
}

function buildRedirectDoc(url: string): string {
  const target = JSON.stringify(url)
  return LOADING_DOC.replace(
    '</body>',
    `<script>window.opener=null;window.location.replace(${target})<\/script></body>`,
  )
}

export function navigateGameWindow(
  win: ReservedGameWindow,
  url: string,
  keepOpener = false,
): boolean {
  if (!win || win.closed) {
    return false
  }
  if (!keepOpener) {
    try {
      win.document.open()
      win.document.write(buildRedirectDoc(url))
      win.document.close()
      return true
    } catch {
      void 0
    }
  }
  try {
    win.location.replace(url)
    return true
  } catch {
    try {
      win.location.href = url
      return true
    } catch {
      return false
    }
  }
}

export function releaseGameWindow(win: ReservedGameWindow): void {
  if (!win || win.closed) {
    return
  }
  try {
    win.close()
  } catch {
    void 0
  }
}
