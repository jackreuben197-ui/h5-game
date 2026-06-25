type CsOrderChatListener = () => void

const listeners = new Set<CsOrderChatListener>()

// 创建充值/提现订单后，统一打开“交易中”浮动客服聊天（同一个聊天，展示全部 recharge+withdraw 订单）。
export function openCsOrderChat(): void {
  listeners.forEach((listener) => {
    listener()
  })
}

export function subscribeCsOrderChat(listener: CsOrderChatListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
