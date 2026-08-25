import { watch, type App, type Directive, type DirectiveBinding } from 'vue'
import { textI18n } from '@/i18n'

export interface FitTextOptions {
  minScale?: number
  maxLines?: number
}

interface FitState {
  minScale: number
  maxLines: number
  observer: ResizeObserver | null
  stopLocaleWatch: (() => void) | null
  lastWidth: number
  frame: number
  releaseFrame: number
  adjusting: boolean
}

const states = new WeakMap<HTMLElement, FitState>()

function readOptions(binding: DirectiveBinding<FitTextOptions | undefined>): FitTextOptions {
  return {
    minScale: binding.value?.minScale ?? 0.62,
    maxLines: binding.value?.maxLines ?? 2,
  }
}

function applyProbeStyles(el: HTMLElement): void {
  el.style.wordBreak = 'normal'
  el.style.overflowWrap = 'normal'
  el.style.hyphens = 'none'
}

function clearProbeStyles(el: HTMLElement): void {
  el.style.wordBreak = ''
  el.style.overflowWrap = ''
  el.style.hyphens = ''
}

function fitsAt(el: HTMLElement, size: number, ratio: number, maxLines: number): boolean {
  el.style.fontSize = `${size}px`
  const maxHeight = maxLines * ratio * size + 0.5
  return el.scrollWidth <= el.clientWidth + 0.5 && el.scrollHeight <= maxHeight
}

function releaseAfterPaint(el: HTMLElement, state: FitState): void {
  window.cancelAnimationFrame(state.releaseFrame)
  state.releaseFrame = window.requestAnimationFrame(() => {
    state.lastWidth = (el.parentElement ?? el).getBoundingClientRect().width
    state.adjusting = false
  })
}

function fit(el: HTMLElement): void {
  const state = states.get(el)
  if (!state || !el.isConnected) {
    return
  }

  state.adjusting = true
  el.style.fontSize = ''
  clearProbeStyles(el)

  const computed = window.getComputedStyle(el)
  const base = Number.parseFloat(computed.fontSize)
  const lineHeight = Number.parseFloat(computed.lineHeight)
  if (!Number.isFinite(base) || base <= 0 || el.clientWidth === 0) {
    releaseAfterPaint(el, state)
    return
  }

  const ratio = Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight / base : 1.2
  applyProbeStyles(el)

  if (fitsAt(el, base, ratio, state.maxLines)) {
    el.style.fontSize = ''
    clearProbeStyles(el)
    releaseAfterPaint(el, state)
    return
  }

  const min = base * state.minScale
  if (!fitsAt(el, min, ratio, state.maxLines)) {
    clearProbeStyles(el)
    el.style.fontSize = `${min}px`
    releaseAfterPaint(el, state)
    return
  }

  let low = min
  let high = base
  for (let i = 0; i < 7; i += 1) {
    const mid = (low + high) / 2
    if (fitsAt(el, mid, ratio, state.maxLines)) {
      low = mid
    } else {
      high = mid
    }
  }
  fitsAt(el, low, ratio, state.maxLines)
  releaseAfterPaint(el, state)
}

function scheduleFit(el: HTMLElement): void {
  const state = states.get(el)
  if (!state) {
    return
  }
  window.cancelAnimationFrame(state.frame)
  state.frame = window.requestAnimationFrame(() => fit(el))
}

export const vFitText: Directive<HTMLElement, FitTextOptions | undefined> = {
  mounted(el, binding) {
    const { minScale, maxLines } = readOptions(binding)
    const state: FitState = {
      minScale: minScale as number,
      maxLines: maxLines as number,
      observer: null,
      stopLocaleWatch: null,
      lastWidth: 0,
      frame: 0,
      releaseFrame: 0,
      adjusting: false,
    }
    states.set(el, state)

    const target = el.parentElement ?? el
    if (typeof ResizeObserver !== 'undefined') {
      state.observer = new ResizeObserver((entries) => {
        if (state.adjusting) {
          return
        }
        const width = entries[0]?.contentRect.width ?? 0
        if (Math.abs(width - state.lastWidth) < 0.5) {
          return
        }
        state.lastWidth = width
        scheduleFit(el)
      })
      state.observer.observe(target)
    }

    state.stopLocaleWatch = watch(textI18n.locale, () => scheduleFit(el))

    scheduleFit(el)
    if (typeof document !== 'undefined' && document.fonts) {
      void document.fonts.ready.then(() => scheduleFit(el))
    }
  },

  updated(el) {
    scheduleFit(el)
  },

  unmounted(el) {
    const state = states.get(el)
    if (!state) {
      return
    }
    window.cancelAnimationFrame(state.frame)
    window.cancelAnimationFrame(state.releaseFrame)
    state.observer?.disconnect()
    state.stopLocaleWatch?.()
    states.delete(el)
  },
}

export const fitTextPlugin = {
  install(app: App): void {
    app.directive('fit-text', vFitText)
  },
}
