<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { postChatSupportMessageListApi, postChatSupportMessageSendApi } from '@/api/chat'
import { postClubFundOrderListApi } from '@/api/order'
import { postOssUploadImageApi } from '@/api/oss'
import type { ChatSupportMessageListChatData } from '@/api/models/chat'
import { useUserInfoStore } from '@/stores/userInfo'
import customerServiceIcon from '@/assets/icons/customerserviceicon.png'
import micIcon from '@/assets/icons/wallet/ic_microphone_chat.png'
import sendIcon from '@/assets/icons/wallet/ic_send_chat.png'
import addIcon from '@/assets/icons/wallet/ic_add_chat.png'
import closeIcon from '@/assets/icons/wallet/ic_close_chat.png'

const props = withDefaults(
  defineProps<{
    tribeId: number
    supportUserId: number
    orderData: any
    /** 区分充值/提现，决定交易气泡的文案 */
    orderType?: 'recharge' | 'withdraw'
  }>(),
  {
    orderType: 'recharge',
  },
)

const emit = defineEmits<{
  close: []
}>()

const userInfoStore = useUserInfoStore()

// 充值用 充值/付款 文案；提现用 提现/收款 文案。
const txLabels = computed(() =>
  props.orderType === 'withdraw'
    ? { user: '提现用户', coin: '提现联盟币', amount: '提现金额', payType: '收款类型' }
    : { user: '充值用户', coin: '充值联盟币', amount: '充值金额', payType: '付款类型' },
)
const messages = ref<ChatSupportMessageListChatData[]>([])
const inputText = ref('')
const orderStatus = ref<number>(1)
const messageContainer = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
let pollTimer: number | null = null
let statusTimer: number | null = null

const isApproved = computed(() => orderStatus.value === 2)

const clubName = computed(
  () => (userInfoStore.currentClub ?? userInfoStore.clubList[0])?.club_name || '',
)

const clubAvatar = computed(
  () => (userInfoStore.currentClub ?? userInfoStore.clubList[0])?.logo || customerServiceIcon,
)

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
  pollTimer = window.setInterval(loadMessages, 5000)
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
        <!-- Top Visual Header -->
        <div class="visual-header" @click="emit('close')"></div>

        <div class="chat-main-body">
          <!-- Floating Agent Card -->
          <div class="agent-floating-card">
            <div class="agent-info">
              <div class="agent-avatar-wrap">
                <!-- Figma SVG Ring -->
                <svg class="avatar-ring" width="61" height="61" viewBox="0 0 57 57" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <foreignObject x="-4.4941" y="-4.4941" width="65.381" height="65.3813">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(2.25px); height:100%; width:100%"></div>
                  </foreignObject>
                  <path d="M28.196 0.150391C43.6857 0.150391 56.2427 12.7067 56.2429 28.1963C56.2429 43.686 43.6858 56.2432 28.196 56.2432C12.7065 56.243 0.150146 43.6859 0.150146 28.1963C0.150328 12.7068 12.7066 0.150572 28.196 0.150391ZM28.196 3.3291C14.4625 3.32928 3.32904 14.4627 3.32886 28.1963C3.32886 41.93 14.4623 53.0643 28.196 53.0645C41.9299 53.0645 53.0642 41.9301 53.0642 28.1963C53.064 14.4626 41.9298 3.3291 28.196 3.3291Z" fill="white" fill-opacity="0.83" />
                </svg>
                <img :src="clubAvatar" alt="agent" class="agent-avatar" />
              </div>
              <span class="agent-name">{{ clubName }}</span>
            </div>
          </div>

          <!-- Messages Area -->
          <div class="messages-wrap" ref="messageContainer">
            <div class="messages-inner">
              <!-- Transaction Bubble -->
              <div class="message-row message-row--self">
                <div class="bubble-wrapper">
                  <div class="transaction-bubble">
                    <div class="bubble-content">
                      <p>{{ txLabels.user }}：{{ userInfoStore.userInfo?.user.nickname }}/ID{{ userInfoStore.userInfo?.user.userid }}</p>
                      <p>{{ txLabels.coin }}：{{ (orderData.gold_num || orderData.order?.gold_num || 0) / 100 }}</p>
                      <p>{{ txLabels.amount }}：{{ orderData.pay_price || orderData.order?.pay_price || orderData.order?.amount || orderData.amount || 0 }}</p>
                      <p>{{ txLabels.payType }}：{{ orderData.usdt_address?.name || orderData.pay_type_name || '客服撮合' }}</p>
                      <p>訂單號：{{ orderData.order_no || orderData.order?.order_no }}</p>
                      <p>申請時間：{{ new Date().toLocaleString() }}</p>
                    </div>
                  </div>
                  <div class="bubble-footer">
                    <span>{{ formatTime(Date.now() / 1000) }}</span>
                    <svg width="7.226" height="7.226" viewBox="0 0 8 8" fill="none">
                      <ellipse cx="2.93052" cy="2.91963" rx="2.38865" ry="2.42647" stroke="#05E7AE" stroke-width="0.955458"/>
                      <path d="M4.63672 4.65283L6.68413 6.73266" stroke="#05E7AE" stroke-width="0.955458" stroke-linecap="round"/>
                    </svg>
                    <span class="sender-name">{{ userInfoStore.userInfo?.user.nickname }}</span>
                  </div>
                </div>
              </div>

              <div v-for="(msg, idx) in messages" :key="idx" class="message-row" :class="{ 'message-row--self': msg.user_send }">
                <div class="bubble-wrapper" :class="{ 'bubble-wrapper--self': msg.user_send }">
                  <div v-if="msg.msg_type === 1" class="text-bubble" :class="{ 'text-bubble--self': msg.user_send }">
                    {{ msg.text }}
                  </div>
                  <div v-else-if="msg.msg_type === 2" class="image-bubble" :class="{ 'image-bubble--self': msg.user_send }">
                    <img :src="msg.url" alt="image" @click="openUrl(msg.url)" />
                  </div>

                  <div class="bubble-footer">
                    <span>{{ formatTime(msg.local_time) }}</span>
                    <template v-if="msg.user_send">
                      <svg width="7.226" height="7.226" viewBox="0 0 8 8" fill="none">
                        <ellipse cx="2.93052" cy="2.91963" rx="2.38865" ry="2.42647" stroke="#05E7AE" stroke-width="0.955458"/>
                        <path d="M4.63672 4.65283L6.68413 6.73266" stroke="#05E7AE" stroke-width="0.955458" stroke-linecap="round"/>
                      </svg>
                      <span class="sender-name">{{ userInfoStore.userInfo?.user.nickname }}</span>
                    </template>
                    <template v-else>
                      <span class="sender-name">客服</span>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Navigation -->
          <div class="bottom-nav">
            <button class="nav-icon-btn mic-btn">
              <img :src="micIcon" alt="mic" />
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
              <img :src="sendIcon" alt="send" />
            </button>

            <button class="plus-btn" @click="triggerUpload">
              <img :src="addIcon" alt="add" />
            </button>

            <button class="close-chat-btn" @click="emit('close')">
              <img :src="closeIcon" alt="close" />
            </button>

            <input type="file" ref="fileInput" hidden accept="image/*" @change="onImageUpload" />
          </div>
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
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.visual-header {
  height: 30vh;
  position: relative;
}

.chat-main-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  border-top-left-radius: 0.8rem;
  border-top-right-radius: 0.8rem;
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.chat-main-body::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(23, 23, 23, 0.5);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  pointer-events: none;
  z-index: 1;
}

.chat-main-body::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 0.0255rem;
  background: linear-gradient(180deg, rgba(242, 242, 242, 0.40) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.50) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 4;
}

.agent-floating-card,
.messages-wrap,
.bottom-nav {
  position: relative;
  z-index: 3;
}

.agent-floating-card {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  height: auto;
  z-index: 10;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  border-radius: 32px;
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
  padding: 8.4px 22px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
  overflow: hidden;
}

.agent-floating-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  pointer-events: none;
  z-index: 0;
}

.agent-floating-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 0.0255rem;
  background: linear-gradient(180deg, rgba(242, 242, 242, 0.40) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.50) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 2;
}

.agent-floating-card > * {
  position: relative;
  z-index: 1;
}

.agent-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4.8px;
}

.agent-avatar-wrap {
  position: relative;
  width: 36.6px;
  height: 36.6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 36.6px;
  height: 36.6px;
  pointer-events: none;
}

.agent-avatar {
  width: 33px;
  height: 33px;
  border-radius: 50%;
  object-fit: cover;
  z-index: 1;
}

.agent-name {
  position: relative;
  display: flex;
  padding: 3.236px 2.516px;
  flex-direction: column;
  align-items: center;
  gap: 1.618px;
  border: 0.02rem solid rgba(249, 249, 249, 0.1);
  border-radius: 4.406px;
  background: rgba(170, 170, 170, 0.1);
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);
  color: #fff;
  font-size: 6.6px;
  font-weight: 500;
  margin-top: -0.24rem;
  white-space: nowrap;
}

.messages-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 100px 20px 20px;
  display: flex;
  flex-direction: column;
}

.messages-inner {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 100%;
  gap: 20px;
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
  max-width: 85%;
  width: fit-content;
  gap: 4px;
}

.bubble-wrapper--self {
  align-items: flex-end;
}

.transaction-bubble {
  display: flex;
  flex-direction: column;
  padding: 8.53px 14.622px;
  justify-content: center;
  align-items: flex-start;
  gap: 6.093px;
  border-radius: 23.457px;
  background: rgba(5, 231, 174, 0.50);
  color: #F9F9F9;
}

.bubble-content p {
  margin: 0;
  color: #F9F9F9;
  font-feature-settings: 'liga' off, 'clig' off;
  font-family: "HONOR Sans CN";
  font-size: 11.576px;
  font-style: normal;
  font-weight: 400;
  line-height: 140%;
  letter-spacing: 0.232px;
}

.bubble-footer {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  color: #F9F9F9;
  font-family: "HONOR Sans CN";
  font-size: 9.748px;
  font-weight: 400;
  line-height: 100%;
  letter-spacing: 0.195px;
}

.sender-name {
  font-weight: 600;
}

.text-bubble {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20px 20px 20px 4px;
  padding: 12px 16px;
  max-width: 75%;
  color: #fff;
  font-size: 14px;
}

.text-bubble--self {
  background: #1F9816;
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
  background: transparent;
  display: flex;
  align-items: center;
  gap: 5px;
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
  width: 37.534px;
  height: 37.534px;
  padding: 0;
}

.bottom-nav button img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

.input-bar-wrap {
  flex: 1;
  min-width: 0;
  height: 37.534px;
  background: #0F0F0F;
  border-radius: 210.014px;
  padding: 3.36px 4.29px 3.36px 11.341px;
  display: flex;
  align-items: center;
  gap: 4.2px;
}

.input-bar-wrap input {
  flex: 1;
  background: transparent;
  border: none;
  color: #F9F9F9;
  font-family: "PingFang SC";
  font-size: 13.226px;
  font-weight: 400;
  line-height: 78%;
  letter-spacing: 0.265px;
  outline: none;

  &::placeholder {
    color: rgba(249, 249, 249, 0.4);
  }
}

.send-action-btn {
  background: transparent;
  border: none;
  padding: 0;
  width: 37.331px;
  height: 37.331px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;

  &:active {
    opacity: 0.8;
  }
}

.plus-btn {
  background: transparent;
  border: none;
  padding: 0;
  width: 37.331px;
  height: 37.331px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;

  &:active {
    opacity: 0.8;
  }
}

.close-chat-btn {
  background: transparent;
  border: none;
  padding: 0;
  width: 38.403px;
  height: 38.403px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;

  &:active {
    opacity: 0.8;
  }
}
</style>
