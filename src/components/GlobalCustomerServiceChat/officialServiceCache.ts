import { postCmsExtImServiceListApi } from '@/api/cmsext'
import { t } from '@/i18n'

export interface OfficialServiceProfile {
  avatar: string
  name: string
}

const OFFICIAL_IM_SERVICE_TYPE = 2
const OFFICIAL_SERVICE_NAME = t('UIMatch_ServerHead')

let cachedOfficialProfile: OfficialServiceProfile | null = null
let loadingPromise: Promise<OfficialServiceProfile> | null = null

function resolveAvatarFromList(data: unknown): string {
  if (!Array.isArray(data) || !data.length) return ''

  for (const item of data) {
    if (!item || typeof item !== 'object') continue
    const avatar = String((item as Record<string, unknown>).avatar || '').trim()
    if (avatar) return avatar
  }

  return ''
}

function toProfile(avatar: string): OfficialServiceProfile {
  return {
    avatar: String(avatar || '').trim(),
    name: OFFICIAL_SERVICE_NAME,
  }
}

export function getOfficialServiceProfileCache(): OfficialServiceProfile | null {
  if (!cachedOfficialProfile) return null
  return {
    ...cachedOfficialProfile,
  }
}

export async function ensureOfficialServiceProfileCache(): Promise<OfficialServiceProfile> {
  if (cachedOfficialProfile) {
    return {
      ...cachedOfficialProfile,
    }
  }

  if (!loadingPromise) {
    loadingPromise = (async () => {
      try {
        const response = await postCmsExtImServiceListApi({
          im_service_type: OFFICIAL_IM_SERVICE_TYPE,
        })
        const avatar = response.code === 0 ? resolveAvatarFromList(response.data) : ''
        cachedOfficialProfile = toProfile(avatar)
      } catch {
        cachedOfficialProfile = toProfile('')
      }

      return {
        ...(cachedOfficialProfile || toProfile('')),
      }
    })().finally(() => {
      loadingPromise = null
    })
  }

  const result = await loadingPromise
  return {
    ...result,
  }
}
