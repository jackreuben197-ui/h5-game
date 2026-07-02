import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { t } from '@/i18n'

export type MemberIdentity = 'founder' | 'admin' | 'agent' | 'player'

export interface MemberRouteContext {
	memberId: string
	identity: MemberIdentity
	isBoundAgent: boolean
	name: string
	uid: string
  diamonds: number
}

function normalizeIdentity(value: unknown): MemberIdentity {
  if (value === 'founder' || value === 'admin' || value === 'agent' || value === 'player') {
    return value
  }

  return 'player'
}

function toQueryValue(value: string | string[] | undefined): string {
  if (!value) {
    return ''
  }

  if (Array.isArray(value)) {
    return value[0] || ''
  }

  return value
}

export function getMemberRouteContext(route: RouteLocationNormalizedLoaded): MemberRouteContext {
  const memberId = toQueryValue(route.params.memberId as string | string[] | undefined) || '0'
  const identity = normalizeIdentity(toQueryValue(route.query.identity as string | string[] | undefined))
  const isBoundAgent = toQueryValue(route.query.bound as string | string[] | undefined) === '1'
  const name = toQueryValue(route.query.name as string | string[] | undefined) || t('UIClub_Info_Members')
  const uid = toQueryValue(route.query.uid as string | string[] | undefined) || '--'

  return {
    memberId,
    identity,
    isBoundAgent,
    name,
    uid,
    diamonds: Number(toQueryValue(route.query.diamonds as string | string[] | undefined) || 0),
  }
}

export function identityText(identity: MemberIdentity): string {
  if (identity === 'founder') return t('UIGuid_Founder')
  if (identity === 'admin') return t('UIGuild_FilterButtonManager')
  if (identity === 'agent') return t('UIClub_AgentItem')
  return t('UIClub_Player2')
}
