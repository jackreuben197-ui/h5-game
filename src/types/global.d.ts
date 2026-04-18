export {}

declare global {
  interface Window {
    CocosBridge?: {
      postMessage?: (raw: string) => void
    }
    webkit?: {
      messageHandlers?: {
        cocosBridge?: {
          postMessage?: (raw: string) => void
        }
      }
    }
    __H5_GAME_ON_COCOS_MESSAGE__?: (raw: string) => void
    __H5_READY__?: boolean
    __CC_READY__?: boolean
    H5LobbyHost?: {
      mount?: (container?: string) => void
      unmount?: () => void
    }
  }
}
