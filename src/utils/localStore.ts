const KEY_PREFIX = 'dzpk_'

export const localStore = {
  // 与 Cocos LocalStoreManager 一致的统一前缀。
  keyPre: KEY_PREFIX,

  // 统一写入 JSON 字符串，避免字符串/对象混存导致解析不一致。
  setItem(key: string, value: unknown): void {
    const safeValue = value === undefined ? null : value
    window.localStorage.setItem(this.keyPre + key, JSON.stringify(safeValue))
  },

  
  getItem<T = unknown>(key: string, defaultValue: T | null = null): T | null {
    const prefixedKey = this.keyPre + key
    const raw = window.localStorage.getItem(prefixedKey)

    if (!raw) {
      return defaultValue
    }

    try {
      return JSON.parse(raw) as T
    } catch {
      return defaultValue
    }
  },

  removeItem(key: string): void {
    window.localStorage.removeItem(this.keyPre + key)
  },

  clear(): void {
    window.localStorage.clear()
  },
}

// 提供给 pinia-plugin-persistedstate 的 Storage 适配器。
export const dzpkPersistStorage: Storage = {
  get length() {
    return window.localStorage.length
  },
  clear(): void {
    localStore.clear()
  },
  getItem(key: string): string | null {
    const value = localStore.getItem<string | null>(key, null)
    return typeof value === 'string' ? value : null
  },
  key(index: number): string | null {
    return window.localStorage.key(index)
  },
  removeItem(key: string): void {
    localStore.removeItem(key)
  },
  setItem(key: string, value: string): void {
    localStore.setItem(key, value)
  },
}
