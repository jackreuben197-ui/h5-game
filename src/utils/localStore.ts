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
// pinia-plugin-persistedstate 传入/期望的 value 已经是 JSON 字符串，
// 直接存取 localStorage，不再经过 localStore 的二次 JSON.stringify/parse。
export const dzpkPersistStorage: Storage = {
  get length() {
    return window.localStorage.length
  },
  clear(): void {
    window.localStorage.clear()
  },
  getItem(key: string): string | null {
    return window.localStorage.getItem(KEY_PREFIX + key)
  },
  key(index: number): string | null {
    return window.localStorage.key(index)
  },
  removeItem(key: string): void {
    window.localStorage.removeItem(KEY_PREFIX + key)
  },
  setItem(key: string, value: string): void {
    window.localStorage.setItem(KEY_PREFIX + key, value)
  },
}
