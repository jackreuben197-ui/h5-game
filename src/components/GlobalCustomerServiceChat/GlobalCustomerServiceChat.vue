<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { md5 } from 'js-md5'
import { showFailToast } from 'vant'
import {
  postChatSupportChannelListApi,
  postChatSupportMessageListApi,
  postChatSupportMessageReadApi,
  postChatSupportMessageSendApi,
} from '@/api/chat'
import { postImossGameClientUploadAudioApi, postImossGameClientUploadImageApi } from '@/api/imoss'
import type {
  ChatSupportChannelListServiceData,
  ChatSupportMessageListChatData,
} from '@/api/models/chat'
import { Code, subscribeH5WsCode } from '@/bridge/ws'
import { decodeSupportMessageNotify } from '@/bridge/ws/supportMessageNotify'
import { useAppConfigStore } from '@/stores/appConfig'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import mainBgUrl from '@/assets/images/main_bg.webp'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import customerServiceIcon from '@/assets/icons/customerserviceicon.png'
import avatarDefault from '@/assets/images/default_avatar.png'
import {
  subscribeGlobalCustomerServiceChat,
  type OpenGlobalCustomerServiceChatPayload,
} from './channel'

interface ImGameConfig {
  oss_key: string
}

const userInfoStore = useUserInfoStore()
const appConfigStore = useAppConfigStore()
const gameStore = useGameStore()

const visible = ref(false)
const loading = ref(false)
const sending = ref(false)
const messages = ref<ChatSupportMessageListChatData[]>([])
const inputText = ref('')
const messageContainer = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const audioFileInput = ref<HTMLInputElement | null>(null)
const channels = ref<ChatSupportChannelListServiceData[]>([])
const activeChannel = ref<ChatSupportChannelListServiceData | null>(null)
const hasUnread = ref(false)
const noServiceVisible = ref(false)
const imagePreviewVisible = ref(false)
const imagePreviewUrl = ref('')
const requestedClubMissing = ref(false)
const messagesReady = ref(false)

const voiceMode = ref(false)
const voicePressed = ref(false)
const voiceCancel = ref(false)
const voiceSeconds = ref(0)
const playingVoiceToken = ref<string>('')

const chatContext = ref<Required<OpenGlobalCustomerServiceChatPayload>>({
  imServiceType: 1,
  clubId: 0,
  tribeId: 0,
  supportUserId: 0,
})

let voiceTicker: number | null = null
let stopWsListener: (() => void) | null = null
let stopOpenListener: (() => void) | null = null
let mediaRecorder: MediaRecorder | null = null
let mediaStream: MediaStream | null = null
let recordingChunks: Blob[] = []
let recordStartMs = 0
let playingAudio: HTMLAudioElement | null = null
let startingRecord = false

const shouldShowFloat = computed(() => !visible.value && hasUnread.value)

const pageBackgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const panelBackgroundStyle = computed(() => ({
  backgroundImage: `url(${sharpBgUrl})`,
}))

const availableChannels = computed(() =>
  channels.value.filter((item) => {
    if (!item || typeof item !== 'object') return false
    const clubId = Number(item.club_id || 0)
    const supportUserId = Number(item.support_user_id || 0)
    const clubName = String(item.club_name || '').trim()
    return clubId > 0 && supportUserId > 0 && !!clubName
  }),
)

const targetClubId = computed(() => {
  if (chatContext.value.clubId > 0) return chatContext.value.clubId
  return Number(userInfoStore.currentClub?.club_id || 0)
})

const clubLogo = computed(() => {
  const channelLogo = String(activeChannel.value?.club_logo || '').trim()
  if (channelLogo) return channelLogo
  const currentLogo = String(userInfoStore.currentClub?.logo || '').trim()
  return currentLogo || customerServiceIcon
})

const supportHintText = computed(() => (voiceCancel.value ? '松开取消' : '松开发送'))
const supportHintClass = computed(() =>
  voiceCancel.value ? 'voice-tip--cancel' : 'voice-tip--send',
)

const imGameConfig = computed<ImGameConfig | null>(() => {
  const raw = appConfigStore.globalConfig?.im_game_config
  if (typeof raw !== 'string' || !raw.trim()) return null

  try {
    const parsed = JSON.parse(raw) as { oss_key?: unknown }
    const ossKey = typeof parsed.oss_key === 'string' ? parsed.oss_key.trim() : ''
    return { oss_key: ossKey }
  } catch {
    return null
  }
})

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.floor(num)
}

function applyContext(payload: OpenGlobalCustomerServiceChatPayload): void {
  chatContext.value = {
    imServiceType: toSafeInt(payload.imServiceType) || 1,
    clubId: toSafeInt(payload.clubId),
    tribeId: toSafeInt(payload.tribeId),
    supportUserId: toSafeInt(payload.supportUserId),
  }
}

function pickChannel(
  list: ChatSupportChannelListServiceData[],
): ChatSupportChannelListServiceData | null {
  if (!list.length) return null

  const supportUserId = chatContext.value.supportUserId
  if (supportUserId > 0) {
    const bySupportUser = list.find((item) => Number(item.support_user_id || 0) === supportUserId)
    if (bySupportUser) return bySupportUser
  }

  const clubId = targetClubId.value
  if (clubId > 0) {
    const byClub = list.find((item) => Number(item.club_id || 0) === clubId)
    if (byClub) return byClub
  }

  return list[0] || null
}

async function fetchChannel(): Promise<void> {
  if (!gameStore.sessionToken.trim()) {
    channels.value = []
    activeChannel.value = null
    hasUnread.value = false
    requestedClubMissing.value = false
    return
  }

  const response = await postChatSupportChannelListApi({
    im_service_types: [chatContext.value.imServiceType],
    limit: 100,
    offset: 0,
  })

  if (response.code !== 0) {
    channels.value = []
    activeChannel.value = null
    hasUnread.value = false
    requestedClubMissing.value = false
    return
  }

  const list = Array.isArray(response.data?.list) ? response.data.list : []
  const validList = list.filter((item) => {
    if (!item || typeof item !== 'object') return false
    const clubId = Number(item.club_id || 0)
    const supportUserId = Number(item.support_user_id || 0)
    const clubName = String(item.club_name || '').trim()
    return clubId > 0 && supportUserId > 0 && !!clubName
  })

  channels.value = validList
  const requestedClubId = Number(chatContext.value.clubId || 0)
  const requestedClubMatched =
    requestedClubId > 0
      ? validList.find((item) => Number(item.club_id || 0) === requestedClubId) || null
      : null
  requestedClubMissing.value = requestedClubId > 0 && !requestedClubMatched

  const preferred =
    requestedClubId <= 0
      ? validList[0] || null
      : requestedClubMissing.value
        ? null
        : pickChannel(validList)
  const currentSupportId = Number(activeChannel.value?.support_user_id || 0)
  const byCurrent = validList.find((item) => Number(item.support_user_id || 0) === currentSupportId)
  const channel =
    preferred ||
    (requestedClubId > 0 ? byCurrent : null) ||
    (requestedClubMissing.value ? null : validList[0] || null)
  activeChannel.value = channel
  hasUnread.value = validList.some((item) => Number(item.unread_count || 0) > 0)
}

function isActiveChannel(channel: ChatSupportChannelListServiceData): boolean {
  const activeSupportId = Number(activeChannel.value?.support_user_id || 0)
  const activeClubId = Number(activeChannel.value?.club_id || 0)
  const nextSupportId = Number(channel.support_user_id || 0)
  const nextClubId = Number(channel.club_id || 0)

  if (activeSupportId > 0 && nextSupportId > 0 && activeClubId > 0 && nextClubId > 0) {
    return activeSupportId === nextSupportId && activeClubId === nextClubId
  }

  if (activeSupportId > 0 && nextSupportId > 0) {
    return activeSupportId === nextSupportId
  }

  return activeClubId > 0 && nextClubId > 0 && activeClubId === nextClubId
}

async function switchChannel(channel: ChatSupportChannelListServiceData): Promise<void> {
  if (isActiveChannel(channel)) return
  requestedClubMissing.value = false
  activeChannel.value = channel
  chatContext.value.clubId = Number(channel.club_id || 0)
  chatContext.value.tribeId = Number(channel.tribe_id || 0)
  chatContext.value.supportUserId = Number(channel.support_user_id || 0)
  await fetchMessages({ setRead: true })
}

function markActiveChannelRead(): void {
  const supportId = Number(activeChannel.value?.support_user_id || 0)
  if (supportId <= 0) return

  channels.value = channels.value.map((item) => {
    const currentSupportId = Number(item.support_user_id || 0)
    if (currentSupportId !== supportId) return item
    return {
      ...item,
      unread_count: 0,
    }
  })
  hasUnread.value = channels.value.some((item) => Number(item.unread_count || 0) > 0)
}

function buildMessageQuery(setRead: boolean) {
  const channel = activeChannel.value
  if (!channel) return null

  const clubId = Number(channel.club_id || targetClubId.value || 0)
  const tribeId = Number(channel.tribe_id || chatContext.value.tribeId || 0)
  const supportUserId = Number(channel.support_user_id || 0)

  if (supportUserId <= 0) return null

  return {
    limit: 50,
    tribe_id: tribeId,
    club_id: clubId > 0 ? clubId : undefined,
    // to_user_id: supportUserId,
    im_service_type: chatContext.value.imServiceType,
    set_read: setRead,
  }
}

async function fetchMessages(options: { setRead: boolean } = { setRead: false }): Promise<void> {
  const query = buildMessageQuery(options.setRead)
  if (!query) return

  loading.value = true
  const response = await postChatSupportMessageListApi(query)
  loading.value = false

  if (response.code !== 0) return

  const list = Array.isArray(response.data?.list) ? response.data.list : []
  messages.value = [...list].reverse()
  if (options.setRead) {
    markActiveChannelRead()
    await markAsRead()
  }
  scrollToBottom()
}

async function markAsRead(): Promise<void> {
  const channel = activeChannel.value
  if (!channel) return
  const last = messages.value[messages.value.length - 1]

  await postChatSupportMessageReadApi({
    club_id: Number(channel.club_id || targetClubId.value || 0) || undefined,
    // to_user_id: Number(channel.support_user_id || 0) || undefined,
    time_token: Number(last?.time_token || 0) || undefined,
    im_service_type: chatContext.value.imServiceType,
  })
}

function scrollToBottom(): Promise<void> {
  return nextTick().then(() => {
    if (!messageContainer.value) return
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  })
}

function formatTime(timestamp?: number): string {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  return `${hh}:${mm}`
}

function resolveMessageUnixTime(message: ChatSupportMessageListChatData): number {
  const token = String(message.time_token || '').trim()
  const unixFromToken = Number(token.slice(0, 10))
  if (Number.isFinite(unixFromToken) && unixFromToken > 0) {
    return unixFromToken
  }
  return Number(message.local_time || 0)
}

function formatMessageTime(message: ChatSupportMessageListChatData): string {
  return formatTime(resolveMessageUnixTime(message))
}

function formatVoiceDuration(seconds: unknown): string {
  const safe = Math.max(1, Number(seconds || 1))
  return `${Math.round(safe).toString().padStart(2, '0')}''`
}

function openPanelByFloat(): void {
  chatContext.value.clubId = 0
  chatContext.value.tribeId = 0
  chatContext.value.supportUserId = 0
  requestedClubMissing.value = false
  activeChannel.value = null
  void openPanel()
}

async function openPanel(): Promise<void> {
  noServiceVisible.value = false
  messagesReady.value = false

  if (!activeChannel.value) {
    await fetchChannel()
  }

  if (
    !activeChannel.value ||
    (requestedClubMissing.value && Number(chatContext.value.clubId || 0) > 0)
  ) {
    noServiceVisible.value = true
    return
  }

  visible.value = true
  await fetchMessages({ setRead: true })
  await scrollToBottom()
  messagesReady.value = true
}

function closePanel(): void {
  visible.value = false
  messagesReady.value = false
  voiceMode.value = false
  closeImagePreview()
  stopVoicePlayback()
}

async function sendMessage(): Promise<void> {
  if (sending.value) return
  const text = inputText.value.trim()
  if (!text) return

  const channel = activeChannel.value
  if (!channel) return

  sending.value = true
  inputText.value = ''

  const response = await postChatSupportMessageSendApi({
    tribe_id: Number(channel.tribe_id || chatContext.value.tribeId || 0) || undefined,
    club_id: Number(channel.club_id || targetClubId.value || 0) || undefined,
    // to_user_id: Number(channel.support_user_id || 0) || undefined,
    im_service_type: chatContext.value.imServiceType,
    msg_type: 1,
    text,
  })

  sending.value = false
  if (response.code === 0) {
    messages.value.push({
      msg_type: 1,
      text,
      user_send: true,
      local_time: Math.floor(Date.now() / 1000),
      time_token: Number(response.data?.time_token || Date.now()),
    })
    scrollToBottom()
    await fetchMessages({ setRead: true })
    return
  }

  showFailToast(response.message || '发送失败')
}

function useVoiceMode(): void {
  voiceMode.value = true
}

function useTextMode(): void {
  voiceMode.value = false
}

function triggerUpload(): void {
  fileInput.value?.click()
}

function triggerAudioUploadFallback(): void {
  audioFileInput.value?.click()
}

async function resolveUploadRuntime() {
  const config = imGameConfig.value
  return {
    ossKey: config?.oss_key || '',
  }
}

function getResponseCode(response: Record<string, unknown> | null | undefined): number {
  if (!response) return -1
  if (Number.isFinite(Number(response.code))) return Number(response.code)
  if (Number.isFinite(Number(response.status))) return Number(response.status)
  return -1
}

function pickFileUrl(rawData: unknown): string {
  if (!rawData || typeof rawData !== 'object') return ''
  const data = rawData as Record<string, unknown>
  const candidates = ['fileUrl', 'url', 'file_url']
  for (const key of candidates) {
    const value = data[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function parseMessageExtra(message: ChatSupportMessageListChatData): Record<string, unknown> {
  const extra = String(message.extra || '').trim()
  if (!extra) return {}
  try {
    return JSON.parse(extra) as Record<string, unknown>
  } catch {
    return {}
  }
}

function resolveImageThumbUrl(message: ChatSupportMessageListChatData): string {
  const directThumb = String(message.thumb_url || '').trim()
  if (directThumb) return directThumb

  const extra = parseMessageExtra(message)
  const extraThumb = String(extra.thumb_url || extra.thumbUrl || '').trim()
  if (extraThumb) return extraThumb

  return String(message.url || '').trim()
}

function resolveImageOriginalUrl(message: ChatSupportMessageListChatData): string {
  const direct = String(message.url || '').trim()
  if (direct) return direct

  const extra = parseMessageExtra(message)
  const candidates = [extra.fileUrl, extra.url, extra.original_url, extra.originalUrl]
  for (const item of candidates) {
    const value = String(item || '').trim()
    if (value) return value
  }
  return ''
}

function openImagePreview(message: ChatSupportMessageListChatData): void {
  const original = resolveImageOriginalUrl(message)
  if (!original) {
    showFailToast('图片地址无效')
    return
  }
  imagePreviewUrl.value = original
  imagePreviewVisible.value = true
}

function closeImagePreview(): void {
  imagePreviewVisible.value = false
  imagePreviewUrl.value = ''
}

async function onImageUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const channel = activeChannel.value
  if (!channel) return

  const runtime = await resolveUploadRuntime()
  if (!runtime) {
    input.value = ''
    return
  }
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileType', '1')
  formData.append('check_code', md5(await file.arrayBuffer()))

  const uploadResponse = await postImossGameClientUploadImageApi(
    formData as unknown as Parameters<typeof postImossGameClientUploadImageApi>[0],
    runtime,
  )
  if (
    getResponseCode(uploadResponse as unknown as Record<string, unknown>) !== 0 ||
    !uploadResponse.data
  ) {
    showFailToast(uploadResponse.message || '上传失败')
    input.value = ''
    return
  }

  const url = pickFileUrl(uploadResponse.data)
  if (!url) {
    input.value = ''
    return
  }

  const sendResponse = await postChatSupportMessageSendApi({
    tribe_id: Number(channel.tribe_id || chatContext.value.tribeId || 0) || undefined,
    club_id: Number(channel.club_id || targetClubId.value || 0) || undefined,
    // to_user_id: Number(channel.support_user_id || 0) || undefined,
    im_service_type: chatContext.value.imServiceType,
    msg_type: 2,
    url,
  })

  if (sendResponse.code === 0) {
    messages.value.push({
      msg_type: 2,
      url,
      user_send: true,
      local_time: Math.floor(Date.now() / 1000),
      time_token: Number(sendResponse.data?.time_token || Date.now()),
    })
    scrollToBottom()
    await fetchMessages({ setRead: true })
  }

  input.value = ''
}

function ensureMediaSupport(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  if (
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  ) {
    return true
  }
  triggerAudioUploadFallback()
  return true
}

async function startVoiceRecord(): Promise<void> {
  if (!ensureMediaSupport()) return
  if (voicePressed.value || startingRecord) return

  startingRecord = true
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    // iPhone/Safari 可能不弹授权或不支持 MediaRecorder，降级为系统语音文件上传。
    triggerAudioUploadFallback()
    showFailToast('当前设备请使用系统录音上传')
    startingRecord = false
    return
  }

  const recorder = new MediaRecorder(stream)
  mediaStream = stream
  mediaRecorder = recorder
  recordingChunks = []
  voicePressed.value = true
  voiceCancel.value = false
  voiceSeconds.value = 0
  recordStartMs = Date.now()

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordingChunks.push(event.data)
    }
  }

  recorder.start()
  if (voiceTicker !== null) {
    window.clearInterval(voiceTicker)
  }
  voiceTicker = window.setInterval(() => {
    voiceSeconds.value = Math.floor((Date.now() - recordStartMs) / 1000)
  }, 200)
  startingRecord = false
}

function stopVoiceTicker(): void {
  if (voiceTicker !== null) {
    window.clearInterval(voiceTicker)
    voiceTicker = null
  }
}

async function stopVoiceRecord(shouldSend: boolean): Promise<void> {
  const recorder = mediaRecorder
  if (!recorder) return

  voicePressed.value = false
  stopVoiceTicker()

  const blob = await new Promise<Blob | null>((resolve) => {
    recorder.onstop = () => {
      const data = recordingChunks.length ? new Blob(recordingChunks, { type: 'audio/wav' }) : null
      resolve(data)
    }
    recorder.stop()
  })

  mediaStream?.getTracks().forEach((track) => track.stop())
  mediaStream = null
  mediaRecorder = null
  recordingChunks = []

  if (!shouldSend || voiceCancel.value) {
    voiceCancel.value = false
    return
  }

  if (!blob || blob.size <= 0) {
    showFailToast('语音录制失败')
    voiceCancel.value = false
    return
  }

  if (voiceSeconds.value <= 0) {
    showFailToast('语音太短')
    voiceCancel.value = false
    return
  }

  await uploadAndSendVoice(blob, voiceSeconds.value)
  voiceCancel.value = false
}

async function uploadAndSendVoice(blob: Blob, duration: number): Promise<void> {
  const channel = activeChannel.value
  if (!channel) return

  const runtime = await resolveUploadRuntime()
  if (!runtime) return

  const formData = new FormData()
  formData.append('file', blob, 'Audio.wav')
  formData.append('fileType', '2')
  formData.append('convert', 'mp3')
  formData.append('check_code', md5(await blob.arrayBuffer()))

  const uploadResponse = await postImossGameClientUploadAudioApi(
    formData as unknown as Parameters<typeof postImossGameClientUploadAudioApi>[0],
    runtime,
  )

  if (
    getResponseCode(uploadResponse as unknown as Record<string, unknown>) !== 0 ||
    !uploadResponse.data
  ) {
    showFailToast(uploadResponse.message || '语音上传失败')
    return
  }

  const url = pickFileUrl(uploadResponse.data)
  if (!url) {
    showFailToast('语音上传地址无效')
    return
  }

  const sendResponse = await postChatSupportMessageSendApi({
    tribe_id: Number(channel.tribe_id || chatContext.value.tribeId || 0) || undefined,
    club_id: Number(channel.club_id || targetClubId.value || 0) || undefined,
    // to_user_id: Number(channel.support_user_id || 0) || undefined,
    im_service_type: chatContext.value.imServiceType,
    msg_type: 3,
    url,
    duration,
  })

  if (sendResponse.code === 0) {
    messages.value.push({
      msg_type: 3,
      url,
      duration,
      user_send: true,
      local_time: Math.floor(Date.now() / 1000),
      time_token: Number(sendResponse.data?.time_token || Date.now()),
    })
    scrollToBottom()
    await fetchMessages({ setRead: true })
    return
  }

  showFailToast(sendResponse.message || '语音发送失败')
}

function onVoiceButtonDown(): void {
  void startVoiceRecord()
}

function onVoiceButtonMove(event: PointerEvent): void {
  if (!voicePressed.value) return

  const target = event.currentTarget as HTMLElement | null
  if (!target) return
  const rect = target.getBoundingClientRect()
  const inX = event.clientX >= rect.left && event.clientX <= rect.right
  const inY = event.clientY >= rect.top && event.clientY <= rect.bottom
  voiceCancel.value = !(inX && inY)
}

function onVoiceButtonUp(): void {
  if (!voicePressed.value) return
  void stopVoiceRecord(true)
}

function onVoiceButtonLeave(): void {
  if (!voicePressed.value) return
  voiceCancel.value = true
}

function resolveVoiceUrl(message: ChatSupportMessageListChatData): string {
  const direct = String(message.url || '').trim()
  if (direct) return direct

  const parsed = parseMessageExtra(message)
  return String(parsed.fileUrl || parsed.url || parsed.voiceUrl || '').trim()
}

function resolveVoiceToken(message: ChatSupportMessageListChatData): string {
  const token = String(message.time_token || '').trim()
  if (token) return token
  return resolveVoiceUrl(message)
}

function stopVoicePlayback(): void {
  if (playingAudio) {
    playingAudio.pause()
    playingAudio = null
  }
  playingVoiceToken.value = ''
}

async function handleVoiceMessageClick(message: ChatSupportMessageListChatData): Promise<void> {
  const url = resolveVoiceUrl(message)
  if (!url) {
    showFailToast('语音地址无效')
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
  audio.onended = () => {
    stopVoicePlayback()
  }
  audio.onerror = () => {
    stopVoicePlayback()
    showFailToast('语音播放失败')
  }

  try {
    await audio.play()
  } catch {
    stopVoicePlayback()
    showFailToast('语音播放失败')
  }
}

async function onFallbackAudioUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const runtime = await resolveUploadRuntime()
  const channel = activeChannel.value
  if (!runtime || !channel) {
    input.value = ''
    return
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileType', '2')
  formData.append('convert', 'mp3')
  formData.append('check_code', md5(await file.arrayBuffer()))

  const uploadResponse = await postImossGameClientUploadAudioApi(
    formData as unknown as Parameters<typeof postImossGameClientUploadAudioApi>[0],
    runtime,
  )

  if (
    getResponseCode(uploadResponse as unknown as Record<string, unknown>) !== 0 ||
    !uploadResponse.data
  ) {
    showFailToast(uploadResponse.message || '语音上传失败')
    input.value = ''
    return
  }

  const url = pickFileUrl(uploadResponse.data)
  if (!url) {
    showFailToast('语音上传地址无效')
    input.value = ''
    return
  }

  const sendResponse = await postChatSupportMessageSendApi({
    tribe_id: Number(channel.tribe_id || chatContext.value.tribeId || 0) || undefined,
    club_id: Number(channel.club_id || targetClubId.value || 0) || undefined,
    // to_user_id: Number(channel.support_user_id || 0) || undefined,
    im_service_type: chatContext.value.imServiceType,
    msg_type: 3,
    url,
    duration: 1,
  })

  if (sendResponse.code === 0) {
    messages.value.push({
      msg_type: 3,
      url,
      duration: 1,
      user_send: true,
      local_time: Math.floor(Date.now() / 1000),
      time_token: Number(sendResponse.data?.time_token || Date.now()),
    })
    scrollToBottom()
    await fetchMessages({ setRead: true })
  }

  input.value = ''
}

function shouldHandleWsMessage(payload: {
  clubId: number
  supportUserId: number
  imServiceType: number
}): boolean {
  if (payload.imServiceType > 0 && payload.imServiceType !== chatContext.value.imServiceType) {
    return false
  }

  const clubId = targetClubId.value
  if (clubId > 0 && payload.clubId > 0 && payload.clubId !== clubId) {
    return false
  }

  const expectedSupportUserId = Number(
    activeChannel.value?.support_user_id || chatContext.value.supportUserId || 0,
  )
  if (
    expectedSupportUserId > 0 &&
    payload.supportUserId > 0 &&
    payload.supportUserId !== expectedSupportUserId
  ) {
    return false
  }

  return true
}

function isPayloadForActiveChannel(payload: {
  clubId: number
  supportUserId: number
  imServiceType: number
}): boolean {
  const channel = activeChannel.value
  if (!channel) return false

  if (
    payload.imServiceType > 0 &&
    Number(payload.imServiceType || 0) !== Number(chatContext.value.imServiceType || 0)
  ) {
    return false
  }

  const channelClubId = Number(channel.club_id || 0)
  const channelSupportId = Number(channel.support_user_id || 0)
  if (channelClubId > 0 && payload.clubId > 0 && payload.clubId !== channelClubId) {
    return false
  }
  if (
    channelSupportId > 0 &&
    payload.supportUserId > 0 &&
    payload.supportUserId !== channelSupportId
  ) {
    return false
  }

  return true
}

function canRenderWsMessage(payload: { msgType: number; text: string; url: string }): boolean {
  if (payload.msgType === 1) return !!String(payload.text || '').trim()
  if (payload.msgType === 2 || payload.msgType === 3) return !!String(payload.url || '').trim()
  return false
}

function appendWsMessageToBottom(payload: {
  msgType: number
  text: string
  url: string
  userSend: boolean
  localTime: number
  timeToken: number
}): void {
  messages.value.push({
    msg_type: Number(payload.msgType || 0),
    text: payload.msgType === 1 ? String(payload.text || '') : undefined,
    url: payload.msgType === 2 || payload.msgType === 3 ? String(payload.url || '') : undefined,
    user_send: payload.userSend,
    local_time: Number(payload.localTime || 0) || undefined,
    time_token: Number(payload.timeToken || Date.now()),
  })
  scrollToBottom()
}

function initWsListener(): void {
  if (stopWsListener) return

  stopWsListener = subscribeH5WsCode(Code.MSG_S_SUPPORT_MESSAGE, (message) => {
    const payload = decodeSupportMessageNotify(message.rawBuffer)
    if (!payload) return
    if (!shouldHandleWsMessage(payload)) return

    if (visible.value) {
      if (isPayloadForActiveChannel(payload)) {
        if (canRenderWsMessage(payload)) {
          appendWsMessageToBottom(payload)
          markActiveChannelRead()
          void markAsRead()
        } else {
          void fetchMessages({ setRead: true })
        }
      }
      return
    }

    if (!payload.userSend) {
      const nextChannels = channels.value.map((item) => {
        const supportId = Number(item.support_user_id || 0)
        const clubId = Number(item.club_id || 0)
        if (supportId > 0 && payload.supportUserId > 0 && supportId !== payload.supportUserId) {
          return item
        }
        if (clubId > 0 && payload.clubId > 0 && clubId !== payload.clubId) {
          return item
        }
        return {
          ...item,
          unread_count: Number(item.unread_count || 0) + 1,
        }
      })
      channels.value = nextChannels
      hasUnread.value = nextChannels.some((item) => Number(item.unread_count || 0) > 0)
    }
  })
}

function closeNoServicePopup(): void {
  noServiceVisible.value = false
}

onMounted(() => {
  stopOpenListener = subscribeGlobalCustomerServiceChat((payload) => {
    applyContext(payload)
    activeChannel.value = null
    void fetchChannel().then(() => openPanel())
  })

  initWsListener()
  void fetchChannel()
})

onBeforeUnmount(() => {
  stopVoiceTicker()
  if (voicePressed.value) {
    void stopVoiceRecord(false)
  }
  stopVoicePlayback()
  stopWsListener?.()
  stopWsListener = null
  stopOpenListener?.()
  stopOpenListener = null
})

watch(
  () => targetClubId.value,
  (next, prev) => {
    if (next === prev) return
    void fetchChannel()
  },
)
</script>

<template>
  <div v-if="shouldShowFloat" class="support-float-wrap">
    <button class="support-float-btn" type="button" @click="openPanelByFloat">
      <span class="support-float-text">客服消息</span>
      <span class="support-float-dot"></span>
    </button>
  </div>

  <Teleport to="body">
    <div v-if="visible" class="chat-overlay" :style="pageBackgroundStyle" @click="closePanel">
      <div class="chat-mask"></div>
      <div class="chat-sheet" :style="panelBackgroundStyle" @click.stop>
        <div class="chat-sheet-frost"></div>

        <div class="chat-sheet-inner">
          <div class="agent-floating-card" role="tablist" aria-label="客服会话列表">
            <button
              v-for="channel in availableChannels"
              :key="String(channel.support_user_id || channel.club_id || channel.user_id || 0)"
              class="agent-strip-item"
              :class="{ 'agent-strip-item--active': isActiveChannel(channel) }"
              type="button"
              role="tab"
              :aria-selected="isActiveChannel(channel)"
              @click="switchChannel(channel)"
            >
              <div class="agent-avatar-wrap">
                <img
                  :src="channel.club_logo || channel.user_avatar || clubLogo || avatarDefault"
                  alt="channel avatar"
                  class="agent-avatar"
                />
                <span v-if="Number(channel.unread_count || 0) > 0" class="agent-unread-badge">
                  {{
                    Number(channel.unread_count || 0) > 99
                      ? '99+'
                      : Number(channel.unread_count || 0)
                  }}
                </span>
                <span v-if="isActiveChannel(channel)" class="agent-avatar-ring"></span>
              </div>
              <span class="agent-name-tag">
                {{ channel.club_name }}
              </span>
            </button>
          </div>

          <div v-if="voicePressed" class="voice-tip" :class="supportHintClass">
            <div class="voice-wave">
              <span v-for="idx in 15" :key="idx" class="voice-wave-bar"></span>
            </div>
            <div class="voice-tip-bottom">
              <span class="voice-timer">{{ formatVoiceDuration(voiceSeconds) }}</span>
              <span>{{ supportHintText }}</span>
            </div>
          </div>

          <div
            ref="messageContainer"
            class="messages-wrap"
            :class="{ 'messages-wrap--hidden': !messagesReady }"
          >
            <div class="messages-inner">
              <div
                v-for="(msg, idx) in messages"
                :key="String(msg.time_token ?? idx)"
                class="message-row"
                :class="{ 'message-row--self': msg.user_send }"
              >
                <div class="bubble-wrapper" :class="{ 'bubble-wrapper--self': msg.user_send }">
                  <div
                    v-if="msg.msg_type === 1"
                    class="text-bubble"
                    :class="{ 'text-bubble--self': msg.user_send }"
                  >
                    {{ msg.text }}
                  </div>

                  <button
                    v-else-if="msg.msg_type === 2"
                    class="image-bubble"
                    :class="{ 'image-bubble--self': msg.user_send }"
                    type="button"
                    @click="openImagePreview(msg)"
                  >
                    <img :src="resolveImageThumbUrl(msg)" alt="message image" />
                  </button>

                  <button
                    v-else-if="msg.msg_type === 3"
                    type="button"
                    class="voice-message"
                    :class="{
                      'voice-message--self': msg.user_send,
                      'voice-message--playing': playingVoiceToken === resolveVoiceToken(msg),
                    }"
                    @click="handleVoiceMessageClick(msg)"
                  >
                    <span
                      class="voice-message-play"
                      :class="{
                        'voice-message-play--playing': playingVoiceToken === resolveVoiceToken(msg),
                      }"
                    >
                      <svg
                        v-if="playingVoiceToken !== resolveVoiceToken(msg)"
                        width="11"
                        height="13"
                        viewBox="0 0 11 13"
                        fill="none"
                      >
                        <path
                          d="M10.0938 6.32812L0.90625 12.2072V0.449084L10.0938 6.32812Z"
                          fill="#F3F3F3"
                        />
                      </svg>
                      <svg v-else width="10" height="13" viewBox="0 0 10 13" fill="none">
                        <rect x="0.5" y="0.5" width="3" height="12" rx="1" fill="#F3F3F3" />
                        <rect x="6.5" y="0.5" width="3" height="12" rx="1" fill="#F3F3F3" />
                      </svg>
                    </span>
                    <div class="voice-message-wave">
                      <span v-for="idy in 10" :key="idy" class="voice-message-bar"></span>
                    </div>
                    <span class="voice-message-time">{{ formatVoiceDuration(msg.duration) }}</span>
                  </button>

                  <div v-else class="text-bubble" :class="{ 'text-bubble--self': msg.user_send }">
                    暂不支持的消息类型
                  </div>

                  <div class="bubble-footer">
                    <span>{{ formatMessageTime(msg) }}</span>
                    <span class="sender-name">{{ msg.user_send ? '我' : '客服' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bottom-nav">
            <button
              class="nav-icon-btn mic-btn"
              type="button"
              @click="voiceMode ? useTextMode() : useVoiceMode()"
            >
              <svg v-if="!voiceMode" width="15" height="20" viewBox="0 0 17 22" fill="none">
                <path
                  d="M12 4.5C12 2.567 10.433 1 8.5 1C6.567 1 5 2.567 5 4.5V11C5 12.933 6.567 14.5 8.5 14.5C10.433 14.5 12 12.933 12 11V4.5Z"
                  fill="#05E7AE"
                  stroke="#05E7AE"
                  stroke-width="2"
                  stroke-linejoin="round"
                />
                <path
                  d="M1 10.5C1 14.642 4.358 18 8.5 18M8.5 18C12.642 18 16 14.642 16 10.5M8.5 18V21"
                  stroke="#05E7AE"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="#05E7AE" stroke-width="2" />
                <path d="M7 16H17" stroke="#05E7AE" stroke-width="2" stroke-linecap="round" />
                <path d="M7 12H11" stroke="#05E7AE" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>

            <template v-if="!voiceMode">
              <div class="input-bar-wrap">
                <input
                  v-model="inputText"
                  type="text"
                  placeholder="说点什么..."
                  @keyup.enter="sendMessage"
                />
              </div>
              <button
                class="send-action-btn"
                type="button"
                :disabled="sending || loading"
                @click="sendMessage"
              >
                <svg width="22" height="21" viewBox="0 0 24 23" fill="none">
                  <path
                    d="M4.31042 5.23619C3.89719 5.10688 3.89323 4.89806 4.31833 4.76503L19.4289 0.0378811C19.8476 -0.0929126 20.0875 0.127059 19.9703 0.512008L15.6528 14.6957C15.5341 15.0888 15.2926 15.1022 15.1153 14.7291L12.2694 8.71783L17.0191 2.77266L10.6862 7.23153L4.31042 5.23619Z"
                    fill="white"
                  />
                </svg>
              </button>
            </template>

            <template v-else>
              <button
                class="voice-hold-btn"
                type="button"
                @pointerdown.prevent="onVoiceButtonDown"
                @pointermove.prevent="onVoiceButtonMove"
                @pointerup.prevent="onVoiceButtonUp"
                @pointercancel.prevent="onVoiceButtonLeave"
                @pointerleave.prevent="onVoiceButtonLeave"
                @touchstart.prevent="onVoiceButtonDown"
                @touchend.prevent="onVoiceButtonUp"
                @touchcancel.prevent="onVoiceButtonLeave"
              >
                按住说话
              </button>
            </template>

            <button class="plus-btn" type="button" @click="triggerUpload">+</button>

            <button
              class="close-chat-btn close-chat-btn--icon"
              type="button"
              aria-label="close"
              @click="closePanel"
            >
              <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
                <path
                  d="M1.37148 1.37158L12.8923 12.8924"
                  stroke="#F3F3F3"
                  stroke-width="2.74306"
                  stroke-linecap="round"
                />
                <path
                  d="M12.8923 1.37158L1.37148 12.8924"
                  stroke="#F3F3F3"
                  stroke-width="2.74306"
                  stroke-linecap="round"
                />
              </svg>
            </button>

            <input ref="fileInput" type="file" hidden accept="image/*" @change="onImageUpload" />
            <input
              ref="audioFileInput"
              type="file"
              hidden
              accept="audio/*"
              capture
              @change="onFallbackAudioUpload"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div v-if="imagePreviewVisible" class="image-preview-mask" @click="closeImagePreview">
      <button
        class="image-preview-close"
        type="button"
        aria-label="close"
        @click.stop="closeImagePreview"
      >
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
          <path d="M1.5 1.5L13.5 13.5" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" />
          <path d="M13.5 1.5L1.5 13.5" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" />
        </svg>
      </button>
      <img class="image-preview-content" :src="imagePreviewUrl" alt="image preview" @click.stop />
    </div>
  </Teleport>

  <Teleport to="body">
    <div v-if="noServiceVisible" class="no-service-mask" @click="closeNoServicePopup">
      <div class="no-service-card" @click.stop>
        <p class="no-service-title">当前俱乐部暂未开通在线客服服务</p>
        <p class="no-service-desc">请联系管理员开通后再试</p>
        <button class="no-service-btn" type="button" @click="closeNoServicePopup">好的</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.support-float-wrap {
  position: fixed;
  right: -0.01rem;
  top: 52%;
  z-index: 119;
}

.support-float-btn {
  min-width: 2.2rem;
  height: 0.9rem;
  border: 0;
  border-radius: 0.45rem 0 0 0.45rem;
  padding: 0 0.35rem 0 0.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.12rem;
  background: linear-gradient(148deg, rgba(5, 231, 174, 0.59) 7.5%, rgba(2, 122, 92, 0.59) 71.9%);
  color: #fff;
  box-shadow: 0 0.08rem 0.24rem rgba(0, 0, 0, 0.28);
}

.support-float-text {
  font-size: 0.3rem;
  line-height: 1;
}

.support-float-dot {
  width: 0.16rem;
  height: 0.16rem;
  border-radius: 50%;
  background: #ff3048;
  box-shadow: 0 0 0 0.04rem rgba(255, 255, 255, 0.18);
}

.chat-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.chat-mask {
  position: absolute;
  inset: 0;
  background: rgba(12, 12, 12, 0.62);
}

.chat-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 15.2267rem;
  max-height: calc(100dvh - env(safe-area-inset-top));
  border-radius: 0.86rem 0.86rem 0 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
}

.chat-sheet-frost {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.84);
  backdrop-filter: blur(0.2rem);
}

.chat-sheet-inner {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.agent-floating-card {
  margin: 0.373rem;
  min-height: 2.4986rem;
  border-radius: 0.8533rem;
  background: rgba(0, 0, 0, 0.27);
  padding: 0.373rem 0.5867rem 0.373rem 0.5867rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.agent-floating-card::-webkit-scrollbar {
  display: none;
}

.agent-strip-item {
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.05rem;
  min-width: 1.488rem;
}

.agent-strip-item--active {
  opacity: 1;
}

.agent-strip-item:not(.agent-strip-item--active) {
  opacity: 0.45;
}

.agent-avatar-wrap {
  width: 1.488rem;
  height: 1.488rem;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}

.agent-unread-badge {
  position: absolute;
  top: 0.02rem;
  right: -0.08rem;
  min-width: 0.45rem;
  height: 0.45rem;
  border-radius: 0.42rem;
  padding: 0 0.14rem;
  background: #ff132b;
  color: #fff;
  font-family: 'HONOR Sans CN';
  font-size: 0.25rem;
  font-weight: 700;
  line-height: 0.45rem;
  text-align: center;
  box-sizing: border-box;
}

.agent-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.agent-avatar-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 0.048rem solid rgba(255, 255, 255, 0.83);
  pointer-events: none;
}

.agent-name-tag {
  width: 1.454rem;
  height: 0.4476rem;
  border-radius: 0.1958rem;
  padding: 0 0.112rem;
  background: rgba(255, 255, 255, 0.02);
  border: 0.01rem solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.96);
  font-family: 'SF Pro';
  font-size: 0.234rem;
  letter-spacing: 0.02em;
  line-height: 0.35rem;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow:
    inset 0.017rem 0.017rem 0 rgba(242, 242, 242, 0.2),
    0.05rem 0.06rem 0.1rem rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(0.245rem);
}

.agent-meta {
  display: none;
}

.agent-title {
  margin: 0;
  color: #fff;
  font-size: 0.373rem;
  line-height: 1.2;
  font-family: 'HONOR Sans CN';
}

.agent-sub-title {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.2667rem;
}

.messages-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 0.28rem 0.36rem 0.2rem;
}

.messages-wrap--hidden {
  opacity: 0;
}

.messages-inner {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.message-row {
  display: flex;
  width: 100%;
}

.message-row--self {
  justify-content: flex-end;
}

.bubble-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 82%;
  gap: 0.08rem;
}

.bubble-wrapper--self {
  align-items: flex-end;
}

.text-bubble {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 0.24rem 0.24rem 0.24rem 0.06rem;
  padding: 0.18rem 0.24rem;
  color: #fff;
  font-size: 0.28rem;
  line-height: 1.4;
}

.text-bubble--self {
  background: rgba(5, 231, 174, 0.5);
  border-radius: 0.24rem 0.24rem 0.06rem 0.24rem;
}

.image-bubble {
  border: none;
  border-radius: 0.16rem;
  padding: 0.06rem;
  background: rgba(255, 255, 255, 0.08);
  max-width: 3.2rem;
}

.image-bubble:active {
  opacity: 0.9;
}

.image-bubble img {
  width: 100%;
  border-radius: 0.1rem;
  object-fit: cover;
}

.voice-message {
  border: none;
  border-radius: 0.4106rem;
  background: rgba(255, 255, 255, 0.16);
  min-width: 2.7325rem;
  height: 1.0667rem;
  padding: 0 0.21rem;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  color: #f3f3f3;
}

.voice-message--self {
  background: rgba(5, 231, 174, 0.5);
}

.voice-message--playing .voice-message-bar {
  animation: voice-wave-playing 0.9s ease-in-out infinite alternate;
}

.voice-message--playing .voice-message-bar:nth-child(2n) {
  animation-delay: 0.15s;
}

.voice-message-wave {
  display: inline-flex;
  align-items: center;
  gap: 0.048rem;
}

.voice-message-play {
  width: 0.42rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.voice-message-play--playing {
  opacity: 0.9;
}

.voice-message-bar {
  width: 0.0587rem;
  border-radius: 0.0587rem;
  background: #f3f3f3;
}

.voice-message-bar:nth-child(1),
.voice-message-bar:nth-child(10) {
  height: 0.16rem;
}

.voice-message-bar:nth-child(2),
.voice-message-bar:nth-child(9) {
  height: 0.2rem;
}

.voice-message-bar:nth-child(3),
.voice-message-bar:nth-child(8) {
  height: 0.26rem;
}

.voice-message-bar:nth-child(4),
.voice-message-bar:nth-child(7) {
  height: 0.34rem;
}

.voice-message-bar:nth-child(5),
.voice-message-bar:nth-child(6) {
  height: 0.42rem;
}

.voice-message-time {
  font-size: 0.309rem;
  line-height: 1;
}

.bubble-footer {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  color: rgba(255, 255, 255, 0.74);
  font-size: 0.2rem;
}

.sender-name {
  font-weight: 600;
}

.voice-tip {
  position: absolute;
  left: 50%;
  bottom: 2.68rem;
  transform: translateX(-50%);
  width: 4.0066rem;
  min-height: 1.953rem;
  border-radius: 0.4106rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  padding: 0.22rem 0.76rem;
  z-index: 5;
}

.voice-tip--send {
  background: rgba(5, 231, 174, 0.18);
}

.voice-tip--cancel {
  background: rgba(255, 19, 43, 0.18);
}

.voice-wave {
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
}

.voice-wave-bar {
  width: 0.0738rem;
  border-radius: 0.12rem;
  background: #f3f3f3;
}

.voice-wave-bar:nth-child(odd) {
  height: 0.26rem;
}

.voice-wave-bar:nth-child(even) {
  height: 0.54rem;
}

.voice-tip-bottom {
  height: 0.5083rem;
  border-radius: 0.6255rem;
  padding: 0.08rem 0.28rem;
  background: rgba(0, 0, 0, 0.42);
  color: #f9f9f9;
  font-size: 0.3087rem;
  display: inline-flex;
  align-items: center;
  gap: 0.18rem;
}

.voice-timer {
  font-variant-numeric: tabular-nums;
}

.bottom-nav {
  height: 1.35rem;
  padding: 0 0.2rem calc(env(safe-area-inset-bottom) + 0.12rem);
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.nav-icon-btn {
  background: transparent;
  border: none;
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-btn {
  background: #0f0f0f;
  border-radius: 5.6004rem;
  width: 1.0009rem;
  height: 1.0009rem;
  padding: 0.0896rem;
}

.input-bar-wrap {
  flex: 1;
  height: 1.0009rem;
  background: #0f0f0f;
  border-radius: 5.6004rem;
  padding: 0.0896rem 0.1144rem 0.0896rem 0.3024rem;
  display: flex;
  align-items: center;
}

.input-bar-wrap input {
  width: 100%;
  background: transparent;
  border: none;
  color: #f9f9f9;
  font-family: 'PingFang SC';
  font-size: 0.3527rem;
  letter-spacing: 0.007rem;
  outline: none;
}

.input-bar-wrap input::placeholder {
  color: rgba(249, 249, 249, 0.42);
}

.voice-hold-btn {
  flex: 1;
  height: 1.0009rem;
  border: none;
  border-radius: 5.6004rem;
  background: rgba(255, 255, 255, 0.2);
  color: #f9f9f9;
  font-size: 0.34rem;
}

.send-action-btn,
.plus-btn,
.close-chat-btn {
  border: none;
  height: 0.9955rem;
  border-radius: 0.586rem;
  padding: 0 0.22rem;
  color: #fff;
  font-size: 0.3rem;
}

.send-action-btn {
  background: #01ceab;
  width: 0.9955rem;
  min-width: 0.9955rem;
  padding-top: 0.2rem;
  line-height: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.send-action-btn svg {
  display: block;
}

.plus-btn {
  width: 0.9955rem;
  min-width: 0.9955rem;
  padding: 0;
  background: #0f0f0f;
  font-size: 0.54rem;
  line-height: 1;
}

.close-chat-btn {
  background: rgba(255, 255, 255, 0.1);
}

.close-chat-btn--icon {
  width: 1.0241rem;
  min-width: 1.0241rem;
  border-radius: 50%;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 0.01rem solid rgba(255, 255, 255, 0.35);
}

.image-preview-mask {
  position: fixed;
  inset: 0;
  z-index: 260;
  background: rgba(0, 0, 0, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
}

.image-preview-close {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 0.24rem);
  right: 0.24rem;
  width: 0.88rem;
  height: 0.88rem;
  border: none;
  border-radius: 50%;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.image-preview-content {
  max-width: calc(100vw - 0.8rem);
  max-height: calc(100dvh - 0.8rem);
  object-fit: contain;
  border-radius: 0.16rem;
}

.no-service-mask {
  position: fixed;
  inset: 0;
  z-index: 210;
  background: rgba(12, 12, 12, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-service-card {
  width: 8.2528rem;
  min-height: 4.06rem;
  border-radius: 0.97rem;
  padding: 0.7rem 0.52rem;
  background:
    linear-gradient(
      124deg,
      rgba(142, 142, 142, 0.6) 0%,
      rgba(103, 103, 103, 0.8) 46.8%,
      #484848 100%
    ),
    rgba(0, 0, 0, 0.34);
  box-shadow: 0 0.2rem 0.54rem rgba(0, 0, 0, 0.28);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.22rem;
}

.no-service-title {
  margin: 0;
  color: #fff;
  font-size: 0.44rem;
}

.no-service-desc {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.3rem;
}

.no-service-btn {
  margin-top: 0.24rem;
  width: 8.9358rem;
  max-width: 100%;
  height: 1.4716rem;
  border: none;
  border-radius: 1.082rem;
  background: linear-gradient(180deg, #05e7ae 0%, #027a5c 100%);
  color: #fff;
  font-size: 0.5rem;
}

@keyframes voice-wave-playing {
  0% {
    transform: scaleY(0.45);
    opacity: 0.75;
  }
  100% {
    transform: scaleY(1);
    opacity: 1;
  }
}
</style>
