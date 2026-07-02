import type { MiscBannerLobbyData } from '@/api/models/misc'
import {
  PUBLIC_STORE_BANNER_LOBBY,
  readPublicCache,
  writePublicCache,
} from './indexedDB'

// 按服务端 lang 字符串分桶存储（zh_CN / zh_TW / en_US / pt_BR）。
export async function readLobbyBannerCache(lang: string): Promise<MiscBannerLobbyData | null> {
  if (!lang) return null
  try {
    return await readPublicCache<MiscBannerLobbyData>(PUBLIC_STORE_BANNER_LOBBY, lang)
  } catch (error) {
    console.warn('[lobby-banner-cache] read failed:', error)
    return null
  }
}

export async function writeLobbyBannerCache(
  lang: string,
  data: MiscBannerLobbyData,
): Promise<void> {
  if (!lang) return
  try {
    await writePublicCache(PUBLIC_STORE_BANNER_LOBBY, data, lang)
  } catch (error) {
    console.warn('[lobby-banner-cache] write failed:', error)
  }
}
