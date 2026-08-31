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
  // 服务端最终约定 user_type=6；测试环境 2026-08-30 实际为 ut=6、user_type=0。
  return Number(user.user_type ?? dataRecord.user_type) === 6 || Number(user.ut) === 6
}
