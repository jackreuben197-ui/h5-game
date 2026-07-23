<script setup lang="ts">
import { computed } from 'vue'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconAddDark from '@/assets/icons/icon_add.svg'
import iconAddLight from '@/assets/icons/icon_add_light.svg'
import iconMessagesDark from '@/assets/icons/icon_messages.png'
import iconMessagesLight from '@/assets/icons/icon_messages_light.png'
import { theme } from '@/utils/theme'
import { t } from '@/i18n'
import iconBoxSystem from '@/assets/icons/icon_box_system.png'
import iconBoxWallet from '@/assets/icons/icon_box_wallet.png'
import iconBoxBag from '@/assets/icons/icon_box_bag.png'
import iconBoxClub from '@/assets/icons/icon_club_shield.png'
import iconBoxTribe from '@/assets/icons/icon_box_tribe.png'
import { useLoginModalStore } from '@/stores/loginModal'

const loginModalStore = useLoginModalStore()

const isLightTheme = computed(() => theme.value === 'light')
const iconAdd = computed(() => (isLightTheme.value ? iconAddLight : iconAddDark))
const iconMessages = computed(() => (isLightTheme.value ? iconMessagesLight : iconMessagesDark))

interface BoxItem {
  icon: string
  text: string
}

const boxList: BoxItem[] = [
  { icon: iconBoxSystem, text: 'Msg3' },
  { icon: iconBoxWallet, text: 'Msg4' },
  { icon: iconBoxBag, text: 'Msg6' },
  { icon: iconBoxClub, text: 'Msg1' },
  { icon: iconBoxTribe, text: 'Msg2' },
]

const displayUser = {
  diamond: 0,
}

function notifyNotLogin(): void {
  loginModalStore.open()
}
</script>

<template>
  <div class="message-page">
    <div class="title-bar">
      <div class="title">{{ t('UIMine_MsgSystemContent') }}</div>
      <div class="currency-info" @click="notifyNotLogin">
        <div class="icon-diamond">
          <img :src="iconDiamond" alt="钻石" />
        </div>
        <div class="num">{{ displayUser.diamond }}</div>
        <div class="icon-recharge">
          <img :src="iconAdd" alt="充值" />
        </div>
      </div>
    </div>
    <div class="card-bg-highlight">
      <div class="card-bg-outter">
        <div class="card-bg-innner">
          <div class="card-line1">
            <div class="left-text">MESSAGES</div>
            <div class="right-icon">
              <img :src="iconMessages" alt="消息" />
            </div>
          </div>
          <div class="card-line2">
            <button class="button" type="button" @click="notifyNotLogin">
              <div class="text">{{ t('PageMessageApplyForCreditLimit') }}</div>
              <div class="round-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="100%"
                  height="100%"
                  viewBox="0 0 29 29"
                  fill="none"
                >
                  <g>
                    <circle
                      cx="14.4614"
                      cy="14.4619"
                      r="14.1577"
                      fill="#141414"
                      fill-opacity="0.48"
                      style="mix-blend-mode: hard-light"
                    />
                    <circle
                      cx="14.4614"
                      cy="14.4619"
                      r="14.3098"
                      stroke="url(#paint0_linear_guest_credit)"
                      stroke-opacity="0.68"
                      stroke-width="0.30418"
                    />
                  </g>
                  <path
                    d="M22.4237 9.02975L21.2843 8.5864V15.7354L23.3505 11.0961C23.6991 10.2886 23.2995 9.36227 22.4237 9.02975ZM5.84294 11.959L10.0604 21.4198C10.1846 21.7077 10.3964 21.9555 10.6699 22.1327C10.9433 22.3099 11.2664 22.4089 11.5994 22.4174C11.8205 22.4174 12.0501 22.3778 12.2712 22.2907L18.5378 19.876C19.1756 19.6306 19.5667 19.0447 19.5837 18.4589C19.5922 18.253 19.5497 18.0234 19.4732 17.8176L15.2217 8.35681C15.1019 8.06682 14.8909 7.81722 14.6164 7.64066C14.3418 7.4641 14.0164 7.36879 13.6827 7.36719C13.4616 7.36719 13.2405 7.41469 13.0279 7.48594L6.76976 9.90062C6.35376 10.0592 6.02245 10.3652 5.84865 10.7512C5.67485 11.1372 5.67279 11.5716 5.84294 11.959ZM19.5752 8.95058C19.5752 8.53064 19.396 8.1279 19.0771 7.83095C18.7582 7.53401 18.3256 7.36719 17.8746 7.36719H16.6417L19.5752 13.97"
                    fill="#F9F9F9"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_guest_credit"
                      x1="11.165"
                      y1="-32.5521"
                      x2="41.8734"
                      y2="-19.6043"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stop-color="white" />
                      <stop offset="0.379687" stop-color="white" stop-opacity="0" />
                      <stop offset="0.725962" stop-color="white" stop-opacity="0" />
                      <stop offset="1" stop-color="white" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </button>
            <button class="button" type="button" @click="notifyNotLogin">
              <div class="text">{{ t('PageMessageApplyForUC') }}</div>
              <div class="round-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="100%"
                  height="100%"
                  viewBox="0 0 29 29"
                  fill="none"
                >
                  <g>
                    <circle
                      cx="14.4614"
                      cy="14.4619"
                      r="14.1577"
                      fill="#141414"
                      fill-opacity="0.48"
                      style="mix-blend-mode: hard-light"
                    />
                    <circle
                      cx="14.4614"
                      cy="14.4619"
                      r="14.3098"
                      stroke="url(#paint0_linear_guest_uc)"
                      stroke-opacity="0.68"
                      stroke-width="0.30418"
                    />
                  </g>
                  <defs>
                    <linearGradient
                      id="paint0_linear_guest_uc"
                      x1="11.165"
                      y1="-32.5521"
                      x2="41.8734"
                      y2="-19.6043"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stop-color="white" />
                      <stop offset="0.379687" stop-color="white" stop-opacity="0" />
                      <stop offset="0.725962" stop-color="white" stop-opacity="0" />
                      <stop offset="1" stop-color="white" />
                    </linearGradient>
                  </defs>
                </svg>
                <div class="uc-num">0</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="box-gallery">
      <div
        v-for="box in boxList"
        :key="box.text"
        class="box-item"
        @click="notifyNotLogin"
      >
        <div class="img">
          <img :src="box.icon" alt="消息" />
        </div>
        <div class="text">{{ t(box.text) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/messages_mine.scss' as *;
.message-page {
  .card-bg-highlight {
    .card-bg-outter {
      .card-bg-innner {
        .card-line1 {
          padding: 0 0.75rem 0.3rem 0.45rem;
          .left-text {
            font-size: 0.88rem;
            line-height: 0.8rem;
            color: rgba(252, 246, 246, 0.51);
            font-family: 'Afacad';
            font-weight: bold;
          }
          .right-icon {
            width: 1.47rem;
            height: 1.47rem;
            img {
              width: 100%;
              height: 100%;
            }
          }
        }
        .card-line2 {
          padding: 0 0.4rem 0 0.45rem;
          gap: 0.3rem;
          .button {
            border: 0;
            cursor: pointer;
            min-width: 0;
            .text {
              white-space: normal;
              word-break: break-word;
            }
            .round-icon {
              background: transparent;
              backdrop-filter: blur(16.705px);
              -webkit-backdrop-filter: blur(16.705px);
              position: relative;
              overflow: hidden;
              svg {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                display: block;
              }
              .uc-num {
                position: relative;
                z-index: 1;
                color: var(--White, #f9f9f9);
                font-family: 'SF Pro', sans-serif;
                font-size: 0.345rem;
                font-weight: 700;
                line-height: 140%;
              }
            }
          }
        }
      }
    }
  }
}
</style>
