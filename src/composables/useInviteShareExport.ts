import { nextTick, ref, type Ref } from 'vue'

interface InviteShareExportOptions {
  target: Ref<HTMLElement | null>
  onError?: (error: unknown) => void
}

function createCaptureTarget(source: HTMLElement): { host: HTMLDivElement; target: HTMLElement } {
  const sourceRect = source.getBoundingClientRect()
  const host = document.createElement('div')
  const target = source.cloneNode(true) as HTMLElement

  host.setAttribute('aria-hidden', 'true')
  host.classList.add('invite-game-dialog')
  Object.assign(host.style, {
    position: 'fixed',
    top: '0',
    left: '-10000px',
    width: `${Math.max(1, Math.ceil(sourceRect.width))}px`,
    background: '#242424',
    pointerEvents: 'none',
  })
  target.classList.add('invite-share-export')
  Object.assign(target.style, { width: '100%', maxWidth: 'none', height: 'auto', transform: 'none' })
  target.querySelectorAll('[data-invite-export-ignore]').forEach((element) => element.remove())
  host.appendChild(target)
  document.body.appendChild(host)
  return { host, target }
}

async function waitForAssets(target: HTMLElement): Promise<void> {
  const imageTasks = Array.from(target.querySelectorAll('img')).map(
    (image) =>
      new Promise<void>((resolve) => {
        if (image.complete && image.naturalWidth > 0) return resolve()
        const finish = () => {
          image.removeEventListener('load', finish)
          image.removeEventListener('error', finish)
          resolve()
        }
        image.addEventListener('load', finish, { once: true })
        image.addEventListener('error', finish, { once: true })
        window.setTimeout(finish, 5000)
      }),
  )
  await Promise.all(imageTasks)
  await document.fonts?.ready
}

export function useInviteShareExport(options: InviteShareExportOptions) {
  const exporting = ref(false)

  async function generateImage(): Promise<string | null> {
    if (exporting.value || !options.target.value) return null
    exporting.value = true
    let captureHost: HTMLDivElement | null = null

    try {
      const { default: html2canvas } = await import('html2canvas')
      await nextTick()
      const source =
        (options.target.value.closest('.game-dialog__card') as HTMLElement | null) ||
        options.target.value
      const capture = createCaptureTarget(source)
      captureHost = capture.host
      await waitForAssets(capture.target)
      const canvas = await html2canvas(capture.target, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#242424',
        logging: false,
        scale: Math.min(window.devicePixelRatio || 1, 3),
        foreignObjectRendering: false,
        removeContainer: true,
      })
      return canvas.toDataURL('image/jpeg', 0.96)
    } catch (error) {
      options.onError?.(error)
      return null
    } finally {
      captureHost?.remove()
      exporting.value = false
    }
  }

  return { exporting, generateImage }
}
