/** 普通邀请人使用已有随机 ID；只接受可精确序列化为 JSON 整数的正数。 */
export function normalizeInviterRandomId(value: unknown): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined
  if (!/^\d+$/.test(String(value).trim())) return undefined
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : undefined
}

export function withPlayerInviter<T extends { invite_code?: string }>(
  payload: T,
  inviter: unknown,
): T & { inviter_random_id?: number } {
  const id = normalizeInviterRandomId(inviter)
  return id && payload.invite_code?.trim() ? { ...payload, inviter_random_id: id } : payload
}

export function buildPlayerInvitationUrl(
  baseUrl: string,
  inviteCode: string,
  inviter: unknown,
): string {
  const id = normalizeInviterRandomId(inviter)
  if (!id || !inviteCode.trim()) return baseUrl
  const url = new URL(baseUrl)
  const [path, query = ''] = url.hash.slice(1).split('?')
  const params = new URLSearchParams(query)
  params.set('invite_code', inviteCode.trim())
  params.set('inviter_random_id', String(id))
  params.set('mode', 'register')
  url.hash = `${path || '/'}?${params}`
  return url.toString()
}
