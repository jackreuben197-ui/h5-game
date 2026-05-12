import type { ServerMessageTodoList } from './pb/protobuf/holdem/recv_g_todo_list_pb'
import { decodeHoldemPacket } from './holdemPacket'

export interface WsTodoListPayload {
  num: number
  type: number
}

let pbTodoListClass: typeof ServerMessageTodoList | null = null

void import('./pb/protobuf/holdem/recv_g_todo_list_pb').then((mod) => {
  pbTodoListClass = mod.ServerMessageTodoList
})

export function decodeTodoListNotify(rawPacket: ArrayBufferLike): WsTodoListPayload | null {
  if (!pbTodoListClass) return null
  const packet = decodeHoldemPacket(rawPacket)
  if (!packet) return null

  try {
    const msg = pbTodoListClass.deserializeBinary(packet.body)
    return {
      num: msg.getNum(),
      type: msg.getType(),
    }
  } catch {
    return null
  }
}
