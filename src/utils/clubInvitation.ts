const INVITATION_KEYS = [
  'invitation_link',
] as const

const INVITATION_CODE_KEYS = ['invitation_code'] as const
const TRACE_HASH_KEYS = ['trace_hash'] as const

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function extractInvitationLink(payload: unknown): string {
  return extractInvitationValue(payload, INVITATION_KEYS)
}

export function extractInvitationCode(payload: unknown): string {
  return extractInvitationValue(payload, INVITATION_CODE_KEYS)
}

export function extractTraceHash(payload: unknown): string {
  return extractInvitationValue(payload, TRACE_HASH_KEYS)
}

function extractInvitationValue(payload: unknown, keys: readonly string[]): string {
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

    for (const key of keys) {
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
