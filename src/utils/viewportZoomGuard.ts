/**
 * Prevent browser page zoom while keeping normal one-finger scrolling available.
 *
 * The viewport meta tag is not sufficient on every iOS/WebView version. In
 * particular, H5 panels rendered over the Cocos canvas can still trigger the
 * native pinch or double-tap zoom gesture.
 */
export function setupViewportZoomGuard(): () => void {
  if (typeof document === 'undefined') {
    return () => {}
  }

  const preventZoom = (event: Event): void => {
    if (event.cancelable) {
      event.preventDefault()
    }
  }

  const preventMultiTouchZoom = (event: TouchEvent): void => {
    if (event.touches.length > 1) {
      preventZoom(event)
    }
  }

  // gesturestart / gesturechange are WebKit events and therefore intentionally
  // registered through the generic Event overload.
  document.addEventListener('gesturestart', preventZoom, { passive: false })
  document.addEventListener('gesturechange', preventZoom, { passive: false })
  document.addEventListener('touchmove', preventMultiTouchZoom, { passive: false })
  document.addEventListener('dblclick', preventZoom, { passive: false })

  return () => {
    document.removeEventListener('gesturestart', preventZoom)
    document.removeEventListener('gesturechange', preventZoom)
    document.removeEventListener('touchmove', preventMultiTouchZoom)
    document.removeEventListener('dblclick', preventZoom)
  }
}
