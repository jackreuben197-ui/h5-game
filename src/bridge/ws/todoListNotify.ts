import { ServerMessageTodoList } from '@holdem-pb'
import { decodeHoldemPacket } from './holdemPacket'

export interface WsTodoListPayload {
  num: number
  type: number
}

export function decodeTodoListNotify(rawPacket: ArrayBufferLike): WsTodoListPayload | null {
  if (!ServerMessageTodoList) return null
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) return null

  try {
    const msg = ServerMessageTodoList.deserializeBinary(packet.body)
    return {
      num: msg.getNum(),
      type: msg.getType(),
    }
  } catch {
    return null
  }
}
