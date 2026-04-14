const DESIGN_WIDTH = 375
const MAX_WIDTH = 375
const BASE_REM_AT_DESIGN = 37.5

function refreshRem(): void {
  const docEl = document.documentElement
  const width = Math.min(docEl.clientWidth || window.innerWidth, MAX_WIDTH)
  const rem = (width / DESIGN_WIDTH) * BASE_REM_AT_DESIGN
  docEl.style.fontSize = `${rem}px`
}

export function setupRem(): void {
  refreshRem()
  window.addEventListener('resize', refreshRem)
  window.addEventListener('orientationchange', refreshRem)
  window.addEventListener('pageshow', refreshRem)
}
