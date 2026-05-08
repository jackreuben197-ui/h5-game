<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { postChatSupportMessageListApi, postChatSupportMessageSendApi } from '@/api/chat'
import { postClubFundOrderListApi } from '@/api/order'
import { postOssUploadImageApi } from '@/api/oss'
import type { ChatSupportMessageListChatData } from '@/api/models/chat'
import { useUserInfoStore } from '@/stores/userInfo'
import mainBgUrl from '@/assets/images/main_bg.webp'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import customerServiceIcon from '@/assets/icons/customerserviceicon.png'
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
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (statusTimer) clearInterval(statusTimer)
})
</script>

<template>
  <Teleport to="body">
    <div class="chat-overlay" :style="{ backgroundImage: `url(${mainBgUrl})` }">
      <div class="chat-container">
        <!-- Top Visual Header -->
        <div class="visual-header"></div>

        <div class="chat-main-body" :style="{ backgroundImage: `url(${sharpBgUrl})` }">
          <!-- Floating Agent Card -->
          <div class="agent-floating-card">
            <div class="agent-info">
              <div class="agent-avatar-wrap">
                <!-- Figma SVG Ring -->
                <svg class="avatar-ring" width="61" height="61" viewBox="0 0 57 57" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <foreignObject x="-4.4941" y="-4.4941" width="65.381" height="65.3813">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(2.25px); clip-path:url(#bgblur_0_500_2086_clip_path); height:100%; width:100%"></div>
                  </foreignObject>
                  <path d="M28.196 0.150391C43.6857 0.150391 56.2427 12.7067 56.2429 28.1963C56.2429 43.686 43.6858 56.2432 28.196 56.2432C12.7065 56.243 0.150146 43.6859 0.150146 28.1963C0.150328 12.7068 12.7066 0.150572 28.196 0.150391ZM28.196 3.3291C14.4625 3.32928 3.32904 14.4627 3.32886 28.1963C3.32886 41.93 14.4623 53.0643 28.196 53.0645C41.9299 53.0645 53.0642 41.9301 53.0642 28.1963C53.064 14.4626 41.9298 3.3291 28.196 3.3291Z" fill="white" fill-opacity="0.83" stroke="url(#paint0_linear_500_2086)" stroke-width="0.299607"/>
                  <defs>
                    <clipPath id="bgblur_0_500_2086_clip_path">
                      <path d="M28.196 0.150391C43.6857 0.150391 56.2427 12.7067 56.2429 28.1963C56.2429 43.686 43.6858 56.2432 28.196 56.2432C12.7065 56.243 0.150146 43.6859 0.150146 28.1963C0.150328 12.7068 12.7066 0.150572 28.196 0.150391ZM28.196 3.3291C14.4625 3.32928 3.32904 14.4627 3.32886 28.1963C3.32886 41.93 14.4623 53.0643 28.196 53.0645C41.9299 53.0645 53.0642 41.9301 53.0642 28.1963C53.064 14.4626 41.9298 3.3291 28.196 3.3291Z"/>
                    </clipPath>
                    <linearGradient id="paint0_linear_500_2086" x1="10.5274" y1="3.34995" x2="40.6706" y2="54.2351" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#F2F2F2" stop-opacity="0.8"/>
                      <stop offset="0.445242" stop-color="white" stop-opacity="0"/>
                      <stop offset="1" stop-color="white" stop-opacity="0.5"/>
                    </linearGradient>
                  </defs>
                </svg>
                <img :src="customerServiceIcon" alt="agent" class="agent-avatar" />
              </div>
              <span class="agent-name">俱乐部名称</span>
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
                      <p>充值用户：{{ userInfoStore.userInfo?.user.nickname }}/ID{{ userInfoStore.userInfo?.user.userid }}</p>
                      <p>充值聯盟幣：{{ (orderData.gold_num || orderData.order?.gold_num || 0) / 100 }}</p>
                      <p>支付金額：{{ orderData.pay_price || orderData.order?.pay_price || orderData.order?.amount || orderData.amount || 0 }}</p>
                      <p>支付類型：{{ orderData.usdt_address?.name || orderData.pay_type_name || '客服撮合' }}</p>
                      <p>訂單號：{{ orderData.order_no || orderData.order?.order_no }}</p>
                      <p>申請時間：{{ new Date().toLocaleString() }}</p>
                    </div>
                  </div>
                  <div class="bubble-footer">
                    <span>{{ formatTime(Date.now() / 1000) }}</span>
                    <svg width="7.226" height="7.226" viewBox="0 0 8 8" fill="none">
                      <ellipse cx="2.93052" cy="2.91963" rx="2.38865" ry="2.42647" stroke="#05E7AE" stroke-width="0.955458"/>
                      <path d="M4.63672 4.65283L6.68413 6.73266" stroke="#05E7AE" stroke-width="0.955458" stroke-linecap="round"/>
                      <path d="M6.68408 4.99951L4.97791 6.7327" stroke="#05E7AE" stroke-width="0.955458" stroke-linecap="round"/>
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
                        <path d="M6.68408 4.99951L4.97791 6.7327" stroke="#05E7AE" stroke-width="0.955458" stroke-linecap="round"/>
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
              <svg width="15" height="20" viewBox="0 0 17 22" fill="none">
                <path d="M12 4.5C12 2.567 10.433 1 8.5 1C6.567 1 5 2.567 5 4.5V11C5 12.933 6.567 14.5 8.5 14.5C10.433 14.5 12 12.933 12 11V4.5Z" fill="#05E7AE" stroke="#05E7AE" stroke-width="2" stroke-linejoin="round"/>
                <path d="M1 10.5C1 14.642 4.358 18 8.5 18M8.5 18C12.642 18 16 14.642 16 10.5M8.5 18V21" stroke="#05E7AE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
              <svg width="22" height="21" viewBox="0 0 24 23" fill="none">
                <g filter="url(#filter0_d_500_2071)">
                  <path d="M4.31042 5.23619C3.89719 5.10688 3.89323 4.89806 4.31833 4.76503L19.4289 0.0378811C19.8476 -0.0929126 20.0875 0.127059 19.9703 0.512008L15.6528 14.6957C15.5341 15.0888 15.2926 15.1022 15.1153 14.7291L12.2694 8.71783L17.0191 2.77266L10.6862 7.23153L4.31042 5.23619Z" fill="white"/>
                </g>
                <defs>
                  <filter id="filter0_d_500_2071" x="0" y="0" width="24" height="23" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="4"/>
                    <feGaussianBlur stdDeviation="2"/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_500_2071"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_500_2071" result="shape"/>
                  </filter>
                </defs>
              </svg>
            </button>

            <button class="plus-btn" @click="triggerUpload">
              <svg width="15.407" height="15.255" viewBox="0 0 18 18" fill="none">
                <path d="M1.28424 8.91193H16.5397" stroke="#05E7AE" stroke-width="2.5684" stroke-linecap="round"/>
                <path d="M8.76025 1.28418V16.5397" stroke="#05E7AE" stroke-width="2.5684" stroke-linecap="round"/>
              </svg>
            </button>

            <button class="close-chat-btn" @click="emit('close')">
              <svg width="11.521" height="11.521" viewBox="0 0 15 15" fill="none">
                <path d="M1.37148 1.37158L12.8923 12.8924" stroke="#F3F3F3" stroke-width="2.74306" stroke-linecap="round"/>
                <path d="M12.8923 1.37158L1.37148 12.8924" stroke="#F3F3F3" stroke-width="2.74306" stroke-linecap="round"/>
              </svg>
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
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
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
  position: relative;
}

.chat-main-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
  overflow: hidden;
}

.chat-main-body::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(7.580729961395264px);
  -webkit-backdrop-filter: blur(7.580729961395264px);
  pointer-events: none;
  z-index: 1;
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
  width: 349px;
  height: auto;
  z-index: 10;
  background: rgba(0, 0, 0, 0.27);
  border-radius: 32px;
  padding: 14px 22px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.agent-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.agent-avatar-wrap {
  position: relative;
  width: 61px;
  height: 61px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 61px;
  height: 61px;
  pointer-events: none;
}

.agent-avatar {
  width: 55px;
  height: 55px;
  border-radius: 50%;
  object-fit: cover;
  z-index: 1;
}

.agent-name {
  display: flex;
  padding: 5.393px 4.194px;
  flex-direction: column;
  align-items: center;
  gap: 2.696px;
  border-radius: 7.343px;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(5.750523090362549px);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  margin-top: -0.4rem;
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
  background: #0F0F0F;
  border-radius: 210.014px;
  width: 37.534px;
  height: 37.534px;
  padding: 3.36px;
  display: flex;
  justify-content: center;
  align-items: center;
  // border: 1px solid rgba(5, 231, 174, 1);
}

.input-bar-wrap {
  width: 176.591px;
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
  background: #01CEAB;
  border: none;
  width: 37.331px;
  height: 37.331px;
  padding: 3.342px;
  border-radius: 22.014px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;

  svg {
    margin-top: 5px;
  }

  &:active {
    opacity: 0.8;
  }
}

.plus-btn {
  background: #0F0F0F;
 border: none;
  width: 37.331px;
  height: 37.331px;
  padding: 3.342px;
  border-radius: 22.014px;
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
  background: rgba(255, 255, 255, 0.10);
  border: none;
  width: 38.403px;
  height: 38.403px;
  border-radius: 38.403px;
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

