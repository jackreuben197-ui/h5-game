<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { postChatSupportMessageListApi, postChatSupportMessageSendApi } from '@/api/chat'
import { postClubFundOrderListApi } from '@/api/order'
import { postOssUploadImageApi } from '@/api/oss'
import type { ChatSupportMessageListChatData } from '@/api/models/chat'
import { useUserInfoStore } from '@/stores/userInfo'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import avatarDefault from '@/assets/images/default_avatar.png'
import icCoins from '@/assets/icons/wallet/ic_coins.png'

const props = defineProps<{
  tribeId: number
  supportUserId: number
  orderData: any
}>()

const emit = defineEmits<{
  close: []
}>()

const userInfoStore = useUserInfoStore()
const messages = ref<ChatSupportMessageListChatData[]>([])
const inputText = ref('')
const orderStatus = ref<number>(1)
const messageContainer = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
let pollTimer: number | null = null
let statusTimer: number | null = null

const isApproved = computed(() => orderStatus.value === 2)

async function checkOrderStatus() {
  const currentClub = userInfoStore.currentClub ?? userInfoStore.clubList[0]
  const clubId = currentClub?.club_id ? Number(currentClub.club_id) : undefined
  const orderNo = props.orderData.order?.order_no || props.orderData.order_no

  try {
    const res = await postClubFundOrderListApi({
      order_no: orderNo,
      limit: 1
    }, clubId)

    if (res.code === 0 && res.data?.list?.length) {
      const order = res.data.list[0]
      orderStatus.value = order.status || 1
      if (orderStatus.value !== 1) {
        if (statusTimer) clearInterval(statusTimer)
      }
    }
  } catch (e) {
    console.error('Failed to check order status', e)
  }
}

async function loadMessages() {
  try {
    const res = await postChatSupportMessageListApi({
      tribe_id: props.tribeId,
      club_id: userInfoStore.currentClub?.club_id ? Number(userInfoStore.currentClub.club_id) : undefined,
      to_user_id: props.supportUserId,
      im_service_type: 4,
      limit: 50,
      set_read: true
    })
    if (res.code === 0 && res.data?.list) {
      const newList = res.data.list.reverse()
      if (newList.length !== messages.value.length ||
          (newList.length > 0 && newList[newList.length-1].time_token !== messages.value[messages.value.length-1]?.time_token)) {
        messages.value = newList
        scrollToBottom()
      }
    }
  } catch (e) {
    console.error('Failed to load messages', e)
  }
}

async function sendMessage() {
  if (!inputText.value.trim()) return

  const text = inputText.value
  inputText.value = ''

  try {
    const res = await postChatSupportMessageSendApi({
      tribe_id: props.tribeId,
      club_id: userInfoStore.currentClub?.club_id ? Number(userInfoStore.currentClub.club_id) : undefined,
      to_user_id: props.supportUserId,
      im_service_type: 4,
      msg_type: 1,
      text: text
    })
    if (res.code === 0) {
      await loadMessages()
    }
  } catch (e) {
    console.error('Failed to send message', e)
  }
}

async function onImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    const res = await postOssUploadImageApi({ file })
    if (res.code === 0 && res.data) {
      const url = (res.data as any).url as string
      await postChatSupportMessageSendApi({
        tribe_id: props.tribeId,
        club_id: userInfoStore.currentClub?.club_id ? Number(userInfoStore.currentClub.club_id) : undefined,
        to_user_id: props.supportUserId,
        im_service_type: 4,
        msg_type: 2,
        url: url
      })
      await loadMessages()
    }
  } catch (err) {
    console.error('Image upload failed', err)
  }
}

function openUrl(url?: string) {
  if (url) window.open(url, '_blank')
}

function triggerUpload() {
  fileInput.value?.click()
}

function scrollToBottom() {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

function formatTime(timestamp?: number) {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

onMounted(() => {
  loadMessages()
  checkOrderStatus()
  pollTimer = window.setInterval(loadMessages, 3000)
  statusTimer = window.setInterval(checkOrderStatus, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (statusTimer) clearInterval(statusTimer)
})
</script>

<template>
  <Teleport to="body">
    <div class="chat-overlay">
      <div class="chat-container">
        <!-- Top Visual Header (Mocking the blurred top part) -->
        <div class="visual-header" :style="{ backgroundImage: `url(${sharpBgUrl})` }"></div>

        <!-- Floating Agent Card -->
        <div class="agent-floating-card">
          <div class="agent-info">
            <div class="agent-avatar-wrap">
              <img :src="avatarDefault" alt="agent" class="agent-avatar" />
              <div class="online-indicator"></div>
            </div>
            <span class="agent-name">俱乐部名称</span>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="messages-wrap" ref="messageContainer">
          <div class="messages-inner">
            <!-- Mock Transaction Card as a Bubble -->
            <div class="message-row message-row--self">
              <div class="transaction-bubble">
                <div class="bubble-content">
                  <p>充值用户：{{ userInfoStore.userInfo?.user.nickname }}/ID{{ userInfoStore.userInfo?.user.userid }}</p>
                  <p>充值联盟币：{{ (orderData.order?.gold_num || 0) / 100 }}</p>
                  <p>支付金额：{{ orderData.order?.pay_price || orderData.order?.amount || orderData.pay_price }}</p>
                  <p>支付类型：{{ orderData.pay_type_name || '客服撮合' }}</p>
                  <p>订单号：{{ orderData.order?.order_no || orderData.order_no }}</p>
                  <p>申请时间：{{ new Date().toLocaleString() }}</p>
                </div>
                <div class="bubble-footer">
                  <span>05:20</span>
                  <span class="sender-name">Leo</span>
                </div>
              </div>
            </div>

            <div v-for="(msg, idx) in messages" :key="idx" class="message-row" :class="{ 'message-row--self': msg.user_send }">
              <div v-if="msg.msg_type === 1" class="text-bubble" :class="{ 'text-bubble--self': msg.user_send }">
                {{ msg.text }}
                <div class="bubble-footer">
                   <span>{{ formatTime(msg.local_time) }}</span>
                </div>
              </div>
              <div v-else-if="msg.msg_type === 2" class="image-bubble" :class="{ 'image-bubble--self': msg.user_send }">
                <img :src="msg.url" alt="image" @click="openUrl(msg.url)" />
                <div class="bubble-footer">
                   <span>{{ formatTime(msg.local_time) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Navigation -->
        <div class="bottom-nav">
          <button class="nav-icon-btn mic-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C10.3431 2 9 3.34315 9 5V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V5C15 3.34315 13.6569 2 12 2Z" fill="#05e7ae"/>
              <path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10" stroke="#05e7ae" stroke-width="2" stroke-linecap="round"/>
              <path d="M12 19V22" stroke="#05e7ae" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>

          <div class="input-bar-wrap">
            <input
              v-model="inputText"
              type="text"
              placeholder="说点什么..."
              @keyup.enter="sendMessage"
            />
          </div>

          <button class="send-action-btn" @click="sendMessage">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <button class="plus-btn" @click="triggerUpload">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </button>

          <button class="close-chat-btn" @click="emit('close')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </button>

          <input type="file" ref="fileInput" hidden accept="image/*" @change="onImageUpload" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.chat-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.visual-header {
  height: 30vh;
  background-size: cover;
  background-position: center;
  position: relative;
}

.visual-header::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(26, 26, 26, 0) 0%, #1a1a1a 100%);
}

.agent-floating-card {
  position: absolute;
  top: 32vh;
  left: 20px;
  right: 20px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 40px;
  padding: 12px;
  backdrop-filter: blur(20px);
}

.agent-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-avatar-wrap {
  position: relative;
}

.agent-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #6c5ce7;
  padding: 2px;
}

.online-indicator {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 10px;
  height: 10px;
  background: #00d2d3;
  border: 2px solid #1a1a1a;
  border-radius: 50%;
}

.agent-name {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  opacity: 0.8;
}

.messages-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 80px 20px 20px; // Padding top to accommodate floating card
  display: flex;
  flex-direction: column;
}

.messages-inner {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-row {
  display: flex;
  width: 100%;
}

.message-row--self {
  justify-content: flex-end;
}

.transaction-bubble {
  background: #118e74;
  border-radius: 20px 20px 4px 20px;
  padding: 15px;
  max-width: 85%;
  color: #fff;
}

.bubble-content p {
  margin: 0 0 4px;
  font-size: 13px;
  line-height: 1.4;
  opacity: 0.95;
}

.bubble-footer {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  font-size: 10px;
  opacity: 0.6;
}

.sender-name {
  font-weight: 600;
}

.text-bubble {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px 20px 20px 4px;
  padding: 12px 16px;
  max-width: 75%;
  color: #fff;
  font-size: 14px;
}

.text-bubble--self {
  background: #118e74;
  border-radius: 20px 20px 4px 20px;
}

.image-bubble {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 4px;
  max-width: 200px;
}

.image-bubble img {
  width: 100%;
  border-radius: 8px;
}

.bottom-nav {
  height: 80px;
  padding: 0 15px;
  background: #111;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-icon-btn {
  background: transparent;
  border: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-btn {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
}

.input-bar-wrap {
  flex: 1;
  background: #000;
  border-radius: 25px;
  padding: 0 15px;
  height: 44px;
  display: flex;
  align-items: center;
}

.input-bar-wrap input {
  width: 100%;
  background: transparent;
  border: none;
  color: #fff;
  outline: none;
  font-size: 14px;
}

.send-action-btn {
  background: #00d1b2;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plus-btn, .close-chat-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-chat-btn {
  background: rgba(255, 255, 255, 0.15);
}
</style>
