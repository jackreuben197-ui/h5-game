import { ref } from 'vue'
import type { ChatSupportMessageListChatData } from '@/api/models/chat'

interface VoicePlaybackOptions {
  resolveUrl: (message: ChatSupportMessageListChatData) => string
  onMissingUrl: () => void
  onPlaybackError: () => void
}

/** 管理客服语音的单实例播放状态，避免主聊天组件同时承担 Audio 生命周期。 */
export function useVoicePlayback(options: VoicePlaybackOptions) {
  const playingVoiceToken = ref('')
  let playingAudio: HTMLAudioElement | null = null

  function resolveVoiceToken(message: ChatSupportMessageListChatData): string {
    const token = String(message.time_token || '').trim()
    return token || options.resolveUrl(message)
  }

  function stopVoicePlayback(): void {
    if (playingAudio) {
      playingAudio.pause()
      playingAudio = null
    }
    playingVoiceToken.value = ''
  }

  async function handleVoiceMessageClick(message: ChatSupportMessageListChatData): Promise<void> {
    const url = options.resolveUrl(message)
    if (!url) {
      options.onMissingUrl()
      return
    }

    const token = resolveVoiceToken(message) || url
    if (playingVoiceToken.value === token && playingAudio) {
      stopVoicePlayback()
      return
    }

    stopVoicePlayback()

    const audio = new Audio(url)
    playingAudio = audio
    playingVoiceToken.value = token
    audio.onended = stopVoicePlayback
    audio.onerror = () => {
      stopVoicePlayback()
      options.onPlaybackError()
    }

    try {
      await audio.play()
    } catch {
      stopVoicePlayback()
      options.onPlaybackError()
    }
  }

  return {
    playingVoiceToken,
    resolveVoiceToken,
    stopVoicePlayback,
    handleVoiceMessageClick,
  }
}
