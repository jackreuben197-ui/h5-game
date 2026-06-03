// 参考 Cocos PacketHead/ProtocolAgency 的最小实现：
// 1) 写入/解析 WS 二进制固定包头
// 2) 提供通用 WS 包头编解码能力（供 H5 自己发查询类包）

// const CHARS_FLAG = new Uint8Array([0x59, 0x4d]) // old: "YM"
const CHARS_FLAG = new Uint8Array([0x42, 0x51, 0x4d, 0x4e]) // "BQMN" - client → server
// const CHARS_FLAG_RECV = new Uint8Array([0x59, 0x4d]) // old: "YM" - server → client
const TOKEN_LENGTH = 32
const PROTOBUF_VERSION = 2
// const FIX_HEAD_LENGTH = 53 // old: 不含 dataLength 的固定头长度
const FIX_HEAD_LENGTH = 55 // 不含 dataLength 的固定头长度
// const HEAD_LENGTH = 57 // old: 含 dataLength 的固定头长度
const HEAD_LENGTH = 59 // 含 dataLength 的固定头长度

const textEncoder = new TextEncoder()

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

function decodeTokenDisplay(tokenBytes: Uint8Array): string {
  let end = tokenBytes.length
  while (end > 0 && tokenBytes[end - 1] === 0) {
    end -= 1
  }
  if (end <= 0) {
    return ''
  }

  const trimmed = tokenBytes.slice(0, end)
  const printableAscii = trimmed.every((byte) => byte >= 0x20 && byte <= 0x7e)
  if (printableAscii) {
    return String.fromCharCode(...trimmed)
  }

  const hex = Array.from(trimmed)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return `0x${hex}`
}

// 生成客户端发送包：含 dataLength + code + BQMN + token + room/match + protoVersion + body。
export function encodeHoldemPacket(input: HoldemPacketEncodeInput): ArrayBuffer {
  const body = input.body || new Uint8Array(0)
  const dataLength = FIX_HEAD_LENGTH + body.length
  const totalLength = HEAD_LENGTH + body.length
  const buffer = new ArrayBuffer(totalLength)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  view.setUint32(0, dataLength, false)
  view.setUint16(4, input.code, false)       // old: view.setUint16(6, input.code, false)
  bytes.set(CHARS_FLAG, 6)                   // old: bytes.set(CHARS_FLAG, 4)
  bytes.set(encodeToken(input.token), 10)    // old: bytes.set(encodeToken(input.token), 8)
  writeUint64BE(view, 42, input.roomId || 0) // old: writeUint64BE(view, 40, input.roomId || 0)
  writeUint64BE(view, 50, input.matchId || 0) // old: writeUint64BE(view, 48, input.matchId || 0)
  view.setUint8(58, PROTOBUF_VERSION)        // old: view.setUint8(56, PROTOBUF_VERSION)
  bytes.set(body, 59)                        // old: bytes.set(body, 57)
  return buffer
}

// 只解析协议号：用于高频路径快速分流（例如心跳过滤）。
export function decodeHoldemCode(raw: ArrayBufferLike): number | null {
  const bytes = new Uint8Array(raw)
  // old: if (bytes.length < 4)
  if (bytes.length < 6) {
    return null
  }
  // old: if (bytes[0] !== CHARS_FLAG_RECV[0] || bytes[1] !== CHARS_FLAG_RECV[1])
  if (bytes[2] !== CHARS_FLAG[0] || bytes[3] !== CHARS_FLAG[1] || bytes[4] !== CHARS_FLAG[2] || bytes[5] !== CHARS_FLAG[3]) {
    return null
  }
  // old: return new DataView(raw).getUint16(2, false)
  return new DataView(raw).getUint16(0, false)
}

// 解析服务端回包：对齐 Cocos ProtocolAgency.Receive 的头格式。
export function decodeHoldemPacket(raw: ArrayBufferLike): HoldemPacketDecodeResult | null {
  const bytes = new Uint8Array(raw)
  if (!bytes.length) {
    return null
  }

  const view = new DataView(raw)

  // Cocos 入站格式（ProtocolAgency.Receive）：
  // old: [0:2] YM / [2:4] code / [4:36] token / [36:44] roomId / [44:52] matchId / [52] proto / [53:] body
  // [0:2]   code(uint16)
  // [2:6]   BQMN
  // [6:38]  token(32)
  // [38:46] roomId(uint64)
  // [46:54] matchId(uint64)
  // [54]    protoVersion
  // [55:]   pb body
  // old: if (bytes.length < FIX_HEAD_LENGTH || bytes[0] !== CHARS_FLAG_RECV[0] || bytes[1] !== CHARS_FLAG_RECV[1])
  if (bytes.length < FIX_HEAD_LENGTH || bytes[2] !== CHARS_FLAG[0] || bytes[3] !== CHARS_FLAG[1] || bytes[4] !== CHARS_FLAG[2] || bytes[5] !== CHARS_FLAG[3]) {
    return null
  }

  // old: const code = view.getUint16(2, false)
  const code = view.getUint16(0, false)
  // old: const tokenBytes = bytes.slice(4, 4 + TOKEN_LENGTH)
  const tokenBytes = bytes.slice(6, 6 + TOKEN_LENGTH)
  const token = decodeTokenDisplay(tokenBytes)
  // old: const roomId = readUint64BE(view, 36)
  const roomId = readUint64BE(view, 38)
  // old: const matchId = readUint64BE(view, 44)
  const matchId = readUint64BE(view, 46)
  // old: const protoVersion = bytes[52] || 0
  const protoVersion = bytes[54] || 0
  // old: const body = bytes.slice(53)
  const body = bytes.slice(55)

  return {
    code,
    token,
    roomId,
    matchId,
    protoVersion,
    body,
  }
}
