const INVITATION_KEYS = [
  'invitation_link',
  'invitationLink',
  'invitation_url',
  'invite_link',
  'inviteLink',
  'invite_url',
  'inviteUrl',
  'invitation',
  'url',
  'link',
] as const

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function extractInvitationLink(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return ''
  }

  const visited = new WeakSet<object>()

  const walk = (node: unknown): string => {
    if (!node || typeof node !== 'object') {
      return ''
    }

    const obj = node as Record<string, unknown>
    if (visited.has(obj)) {
      return ''
    }
    visited.add(obj)

    for (const key of INVITATION_KEYS) {
      const value = readString(obj[key])
      if (value) {
        return value
      }
    }

    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          const fromArray = walk(item)
          if (fromArray) {
            return fromArray
          }
        }
        continue
      }

      const fromObject = walk(value)
      if (fromObject) {
        return fromObject
      }
    }

    return ''
  }

  return walk(payload)
}
