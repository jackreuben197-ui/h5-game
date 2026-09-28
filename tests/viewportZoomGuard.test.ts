import assert from 'node:assert/strict'
import test from 'node:test'
import { setupViewportZoomGuard } from '../src/utils/viewportZoomGuard.ts'

test('viewport zoom guard blocks zoom gestures and unregisters every listener', () => {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const listeners = new Map<string, EventListener>()
  const removed = new Set<string>()

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      addEventListener(type: string, listener: EventListener) {
        listeners.set(type, listener)
      },
      removeEventListener(type: string, listener: EventListener) {
        if (listeners.get(type) === listener) removed.add(type)
      },
    },
  })

  try {
    const stop = setupViewportZoomGuard()

    assert.deepEqual(
      [...listeners.keys()].sort(),
      ['dblclick', 'gesturechange', 'gesturestart', 'touchmove'],
    )

    let singleTouchPrevented = false
    listeners.get('touchmove')?.({
      cancelable: true,
      touches: [{}],
      preventDefault() {
        singleTouchPrevented = true
      },
    } as unknown as Event)
    assert.equal(singleTouchPrevented, false)

    let pinchPrevented = false
    listeners.get('touchmove')?.({
      cancelable: true,
      touches: [{}, {}],
      preventDefault() {
        pinchPrevented = true
      },
    } as unknown as Event)
    assert.equal(pinchPrevented, true)

    let doubleClickPrevented = false
    listeners.get('dblclick')?.({
      cancelable: true,
      preventDefault() {
        doubleClickPrevented = true
      },
    } as Event)
    assert.equal(doubleClickPrevented, true)

    stop()
    assert.deepEqual(
      [...removed].sort(),
      ['dblclick', 'gesturechange', 'gesturestart', 'touchmove'],
    )
  } finally {
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument)
    else Reflect.deleteProperty(globalThis, 'document')
  }
})
