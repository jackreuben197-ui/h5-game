// 参考 Cocos PacketHead/ProtocolAgency 的最小实现：
// 1) 写入/解析 WS 二进制固定包头
// 2) 提供通用 WS 包头编解码能力（供 H5 自己发查询类包）
// 3) 提供 protobuf 字段调试摘要（仅用于日志观察）

export const HOLDEM_CODE = {
  REGISTER: 1,
  HEARTBEAT: 2,
  ENTER_ROOM: 1002,
  LEAVE: 1010,
} as const

const CHARS_FLAG = new Uint8Array([0x59, 0x4d]) // "YM"
const TOKEN_LENGTH = 32
const PROTOBUF_VERSION = 2
const FIX_HEAD_LENGTH = 53 // 不含 dataLength 的固定头长度
const HEAD_LENGTH = 57 // 含 dataLength 的固定头长度

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export interface HoldemPacketEncodeInput {
  code: number
  token: string
  roomId?: number
  matchId?: number
  body?: Uint8Array
}

export interface HoldemPacketDecodeResult {
  code: number
  token: string
  roomId: number
  matchId: number
  protoVersion: number
  body: Uint8Array
}

interface ProtoField {
  fieldNo: number
  wireType: number
  value?: bigint
  bytes?: Uint8Array
}

export interface ProtoDebugField {
  fieldNo: number
  wireType: number
  value?: number
  len?: number
  preview?: string
}

// 把 token 压到固定 32 字节，超长截断，不足补 0。
function encodeToken(token: string): Uint8Array {
  const bytes = textEncoder.encode(token || '')
  const output = new Uint8Array(TOKEN_LENGTH)
  output.set(bytes.subarray(0, TOKEN_LENGTH), 0)
  return output
}

function writeUint64BE(view: DataView, offset: number, value: number): void {
  const safe = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
  const high = Math.floor(safe / 0x1_0000_0000)
  const low = safe >>> 0
  view.setUint32(offset, high, false)
  view.setUint32(offset + 4, low, false)
}

function readUint64BE(view: DataView, offset: number): number {
  const high = view.getUint32(offset, false)
  const low = view.getUint32(offset + 4, false)
  const value = BigInt(high) * 0x1_0000_0000n + BigInt(low)
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : Number.MAX_SAFE_INTEGER
}

// 生成客户端发送包：含 dataLength + YM + code + token + room/match + protoVersion + body。
export function encodeHoldemPacket(input: HoldemPacketEncodeInput): ArrayBuffer {
  const body = input.body || new Uint8Array(0)
  const dataLength = FIX_HEAD_LENGTH + body.length
  const totalLength = HEAD_LENGTH + body.length
  const buffer = new ArrayBuffer(totalLength)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  view.setUint32(0, dataLength, false)
  bytes.set(CHARS_FLAG, 4)
  view.setUint16(6, input.code, false)
  bytes.set(encodeToken(input.token), 8)
  writeUint64BE(view, 40, input.roomId || 0)
  writeUint64BE(view, 48, input.matchId || 0)
  view.setUint8(56, PROTOBUF_VERSION)
  bytes.set(body, 57)
  return buffer
}

// 解析服务端回包：兼容“无 dataLength 前缀”和“有 dataLength 前缀”两种格式。
export function decodeHoldemPacket(raw: ArrayBufferLike): HoldemPacketDecodeResult | null {
  const bytes = new Uint8Array(raw)
  if (!bytes.length) {
    return null
  }

  let base = -1
  if (bytes.length >= FIX_HEAD_LENGTH && bytes[0] === CHARS_FLAG[0] && bytes[1] === CHARS_FLAG[1]) {
    base = 0
  } else if (
    bytes.length >= HEAD_LENGTH &&
    bytes[4] === CHARS_FLAG[0] &&
    bytes[5] === CHARS_FLAG[1]
  ) {
    base = 4
  }

  if (base < 0) {
    return null
  }

  const view = new DataView(raw)
  const code = view.getUint16(base + 2, false)
  const tokenBytes = bytes.slice(base + 4, base + 4 + TOKEN_LENGTH)
  const token = textDecoder.decode(tokenBytes).replace(/\u0000+$/g, '')
  const roomId = readUint64BE(view, base + 36)
  const matchId = readUint64BE(view, base + 44)
  const protoVersion = bytes[base + 52] || 0
  const body = bytes.slice(base + 53)

  return {
    code,
    token,
    roomId,
    matchId,
    protoVersion,
    body,
  }
}


function decodeVarint(bytes: Uint8Array, offset: number): { value: bigint; offset: number } | null {
  let result = 0n
  let shift = 0n
  let idx = offset
  while (idx < bytes.length) {
    const byte = BigInt(bytes[idx])
    result |= (byte & 0x7fn) << shift
    idx += 1
    if ((byte & 0x80n) === 0n) {
      return { value: result, offset: idx }
    }
    shift += 7n
    if (shift > 70n) {
      return null
    }
  }
  return null
}

function parseProtoFields(bytes: Uint8Array): ProtoField[] {
  const fields: ProtoField[] = []
  let offset = 0

  while (offset < bytes.length) {
    const key = decodeVarint(bytes, offset)
    if (!key) {
      break
    }
    offset = key.offset
    const fieldNo = Number(key.value >> 3n)
    const wireType = Number(key.value & 0x07n)

    if (wireType === 0) {
      const data = decodeVarint(bytes, offset)
      if (!data) break
      fields.push({ fieldNo, wireType, value: data.value })
      offset = data.offset
      continue
    }

    if (wireType === 2) {
      const lenData = decodeVarint(bytes, offset)
      if (!lenData) break
      const length = Number(lenData.value)
      offset = lenData.offset
      const end = offset + length
      if (end > bytes.length) break
      fields.push({ fieldNo, wireType, bytes: bytes.slice(offset, end) })
      offset = end
      continue
    }

    if (wireType === 1) {
      offset += 8
      continue
    }
    if (wireType === 5) {
      offset += 4
      continue
    }

    break
  }

  return fields
}

function utf8Preview(bytes: Uint8Array, max = 24): string {
  if (!bytes.length) {
    return ''
  }
  const text = textDecoder.decode(bytes)
  const cleaned = text.replace(/[^\u0020-\u007e\u4e00-\u9fa5]/g, '')
  return cleaned.slice(0, max)
}

// 通用 protobuf 调试摘要：用于开发日志，不参与业务逻辑。
export function decodeProtoDebugFields(body: Uint8Array, maxFields = 10): ProtoDebugField[] {
  const fields = parseProtoFields(body).slice(0, maxFields)
  return fields.map((field) => {
    if (field.wireType === 0) {
      const raw = field.value ?? 0n
      return {
        fieldNo: field.fieldNo,
        wireType: field.wireType,
        value: raw <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(raw) : Number.MAX_SAFE_INTEGER,
      }
    }

    if (field.wireType === 2) {
      const bytes = field.bytes || new Uint8Array(0)
      return {
        fieldNo: field.fieldNo,
        wireType: field.wireType,
        len: bytes.length,
        preview: utf8Preview(bytes),
      }
    }

    return {
      fieldNo: field.fieldNo,
      wireType: field.wireType,
    }
  })
}
