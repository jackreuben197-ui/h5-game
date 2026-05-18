export {}

declare global {
  const __APP_INFO__: { pkg: { name: string; version: string }; lastBuildTime: string }
  const __I18N_VERSIONS__: Record<string, string>
  type BridgeReceiveFn = (
    type: string,
    payload?: unknown,
    msgtype?: number,
    requestId?: string,
    timestamp?: number,
    source?: string,
  ) => void

  interface Window {
    CocosBridge?: {
      sendMessage?: BridgeReceiveFn
      onMessgeRecv?: BridgeReceiveFn
      onMessageRecv?: BridgeReceiveFn
      postMessage?: (raw: unknown) => void
    }
    H5Bridge?: {
      onMessgeRecv?: BridgeReceiveFn
      onMessageRecv?: BridgeReceiveFn
    }
    webkit?: {
      messageHandlers?: {
        cocosBridge?: {
          postMessage?: (raw: unknown) => void
        }
      }
    }
    onMessgeRecv?: BridgeReceiveFn
    onMessageRecv?: BridgeReceiveFn
    __H5_GAME_ON_COCOS_MESSAGE__?: (incoming: unknown) => void
    __H5_READY__?: boolean
    __CC_READY__?: boolean
    __H5_VISIBLE__?: boolean
    H5LobbyHost?: {
      mount?: (container?: string) => void
      unmount?: () => void
    }
    __H5_DEBUG_CONSOLE__?: {
      open?: () => void
      close?: () => void
      clear?: () => void
      copy?: () => string
    }
  }
}
