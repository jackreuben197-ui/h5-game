export const EXPERIENCE_USER_TYPE = 6

export function isExperienceUserInfo(data: unknown): boolean {
  if (!data || typeof data !== 'object') {
    return false
  }
  const dataRecord = data as Record<string, unknown>
  const rawUser = dataRecord.user
  if (!rawUser || typeof rawUser !== 'object') {
    return false
  }
  const user = rawUser as Record<string, unknown>
  return (
    Number(user.user_type ?? dataRecord.user_type) === EXPERIENCE_USER_TYPE ||
    Number(user.ut) === EXPERIENCE_USER_TYPE
  )
}
