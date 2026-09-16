export function resolveScrollHost(element: HTMLElement | null): HTMLElement | null {
  let current: HTMLElement | null = element
  while (current) {
    const { overflowY } = window.getComputedStyle(current)
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return current
    }
    current = current.parentElement
  }
  return null
}
