export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

import {
  pushLoggerDebugEntry,
  withDebugConsoleCaptureSuppressed,
} from './debugCapture'

const LEVEL_NUM: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 }

let _globalLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'warn'
const _registry = new Map<string, Logger>()

export class Logger {
  readonly tag: string
  private _level: LogLevel | null = null

  constructor(tag: string) {
    this.tag = tag
  }

  /** 覆盖此 logger 的 level；传 null 则恢复跟随全局 */
  setLevel(level: LogLevel | null): this {
    this._level = level
    return this
  }

  getLevel(): string {
    return this._level ?? `global(${_globalLevel})`
  }

  private get _n() {
    return LEVEL_NUM[this._level ?? _globalLevel]
  }

  debug(...args: unknown[]) {
    pushLoggerDebugEntry('debug', this.tag, args)
    if (this._n <= 0) {
      withDebugConsoleCaptureSuppressed(() => console.log(this.tag, ...args))
    }
  }

  info(...args: unknown[]) {
    pushLoggerDebugEntry('info', this.tag, args)
    if (this._n <= 1) {
      withDebugConsoleCaptureSuppressed(() => console.info(this.tag, ...args))
    }
  }

  warn(...args: unknown[]) {
    pushLoggerDebugEntry('warn', this.tag, args)
    if (this._n <= 2) {
      withDebugConsoleCaptureSuppressed(() => console.warn(this.tag, ...args))
    }
  }

  error(...args: unknown[]) {
    pushLoggerDebugEntry('error', this.tag, args)
    if (this._n <= 3) {
      withDebugConsoleCaptureSuppressed(() => console.error(this.tag, ...args))
    }
  }
}

export function createLogger(tag: string): Logger {
  let logger = _registry.get(tag)
  if (!logger) {
    logger = new Logger(tag)
    _registry.set(tag, logger)
  }
  return logger
}

/** 设置全局默认 level（影响所有未单独配置的 logger） */
export function setGlobalLogLevel(level: LogLevel): void {
  _globalLevel = level
}

/** 设置某个 tag 的 level；level=null 恢复跟随全局 */
export function setLoggerLevel(tag: string, level: LogLevel | null): void {
  _registry.get(tag)?.setLevel(level)
}

/** 列出所有已注册的 logger 及其当前 level */
export function listLoggers(): { tag: string; level: string }[] {
  return [..._registry.values()].map((l) => ({ tag: l.tag, level: l.getLevel() }))
}

// 在浏览器控制台可用 window.__log 动态控制日志
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__log = {
    setGlobalLevel: setGlobalLogLevel,
    setLevel: setLoggerLevel,
    list: listLoggers,
  }
}
