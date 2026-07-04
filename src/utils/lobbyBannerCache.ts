import {
  PUBLIC_STORE_BANNER_LOBBY,
  readPublicCache,
  writePublicCache,
} from './indexedDB'

// 按服务端 lang 字符串分桶存储（zh_CN / zh_TW / en_US / pt_BR）大厅轮播图 URL 列表。
export async function readLobbyBannerListCache(lang: string): Promise<string[] | null> {
  if (!lang) return null
  try {
    const cached = await readPublicCache<string[]>(PUBLIC_STORE_BANNER_LOBBY, lang)
    // 旧版本缓存是 { lobby: { image_url } } 单图结构，非数组时直接废弃。
    if (!Array.isArray(cached)) {
      return null
    }
    return cached.filter((url) => typeof url === 'string' && url)
  } catch (error) {
    console.warn('[lobby-banner-cache] read failed:', error)
    return null
  }
}

export async function writeLobbyBannerListCache(lang: string, urls: string[]): Promise<void> {
  if (!lang) return
  try {
    await writePublicCache(PUBLIC_STORE_BANNER_LOBBY, urls, lang)
  } catch (error) {
    console.warn('[lobby-banner-cache] write failed:', error)
  }
}
