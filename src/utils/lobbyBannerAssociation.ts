import type { MiscBannerListBannerInfo } from '@/api/models/misc'

export type LobbyBannerAssociation =
  | { type: 'mtt'; templateId: string; templateName?: string }
  | { type: 'poster'; url: string }

export interface LobbyBanner {
  id: number
  clubId: number
  imageUrl: string
  association?: LobbyBannerAssociation
}

export function parseLobbyBannerAssociation(
  banner: Pick<MiscBannerListBannerInfo, 'association_type' | 'template_id' | 'template_name' | 'poster_url'>,
): LobbyBannerAssociation | undefined {
  const type = Number(banner.association_type)
  if (type === 1) {
    const templateId = String(banner.template_id ?? '')
    if (!/^[1-9]\d*$/.test(templateId)) return undefined
    const templateName = banner.template_name?.trim()
    return { type: 'mtt', templateId, ...(templateName ? { templateName } : {}) }
  }

  if (type !== 2 || !banner.poster_url) return undefined
  try {
    const url = new URL(banner.poster_url)
    if ((url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password) {
      return { type: 'poster', url: url.href }
    }
  } catch {
    return undefined
  }
  return undefined
}
