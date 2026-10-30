/** 邀请人使用已有玩家随机 ID；只接受可精确序列化为 JSON 整数的正数。 */
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
  // 链接中的 random_id 在注册接口中必须映射为 inviter_random_id。
  return id && payload.invite_code?.trim() ? { ...payload, inviter_random_id: id } : payload
}

export function appendInvitationRandomId(baseUrl: string, inviter: unknown): string {
  const id = normalizeInviterRandomId(inviter)
  if (!baseUrl || !id) return baseUrl
  const url = new URL(baseUrl)
  const [path, query = ''] = url.hash.slice(1).split('?')
  const params = new URLSearchParams(query)
  url.searchParams.delete('inviter_random_id')
  url.searchParams.delete('random_id')
  params.delete('inviter_random_id')
  params.set('random_id', String(id))
  url.hash = `${path || '/'}?${params}`
  return url.toString()
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
  params.set('mode', 'register')
  url.hash = `${path || '/'}?${params}`
  return appendInvitationRandomId(url.toString(), id)
}
