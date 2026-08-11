export type DebugConsoleLevel = 'debug' | 'info' | 'warn' | 'error'
export type DebugConsoleSource = 'logger' | 'console' | 'runtime'

type DebugCaptureSink = (
  level: DebugConsoleLevel,
  source: DebugConsoleSource,
  args: unknown[],
) => void

let captureSink: DebugCaptureSink | null = null
let suppressCaptureDepth = 0

export function setDebugCaptureSink(sink: DebugCaptureSink | null): void {
  captureSink = sink
}

export function isDebugCaptureSuppressed(): boolean {
  return suppressCaptureDepth > 0
}

export function withDebugConsoleCaptureSuppressed<T>(fn: () => T): T {
  suppressCaptureDepth += 1
  try {
    return fn()
  } finally {
    suppressCaptureDepth = Math.max(0, suppressCaptureDepth - 1)
  }
}

export function pushLoggerDebugEntry(
  level: DebugConsoleLevel,
  tag: string,
  args: unknown[],
): void {
  captureSink?.(level, 'logger', [tag, ...args])
}

export function recordDebugEvent(tag: string, message: string, detail?: unknown): void {
  captureSink?.(
    'info',
    'runtime',
    typeof detail === 'undefined' ? [tag, message] : [tag, message, detail],
  )
}
