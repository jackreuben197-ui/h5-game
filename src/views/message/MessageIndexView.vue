<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserInfoStore } from '@/stores/userInfo'
import { postMsgMessageTodoApi, postMsgMessageUnreadApi } from '@/api/msg'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconAdd from '@/assets/icons/icon_add.svg'
import iconMessages from '@/assets/icons/icon_messages.png'
import { t } from '@/i18n'
import iconBoxSystem from '@/assets/icons/icon_box_system.png'
import iconBoxWallet from '@/assets/icons/icon_box_wallet.png'
import iconBoxBag from '@/assets/icons/icon_box_bag.png'
import iconBoxClub from '@/assets/icons/icon_box_club.png'
import iconBoxTribe from '@/assets/icons/icon_box_tribe.png'

interface BoxItem {
  icon: string
  text: string
  type: 'system' | 'other'
  msgType: number
  unreadCount: number
}

const userInfoStore = useUserInfoStore()

const boxList = ref<BoxItem[]>([
  { icon: iconBoxSystem, text: t('Msg3'), type: 'system', msgType: 4, unreadCount: 0 },
  { icon: iconBoxWallet, text: t('Msg4'), type: 'other', msgType: 3, unreadCount: 0 },
  { icon: iconBoxBag, text: t('Msg6'), type: 'other', msgType: 1, unreadCount: 0 },
  { icon: iconBoxClub, text: t('Msg1'), type: 'other', msgType: 2, unreadCount: 0 },
  { icon: iconBoxTribe, text: t('Msg2'), type: 'other', msgType: 5, unreadCount: 0 },
])

const creditUnreadCount = ref(0)
const ucUnreadCount = ref(0)
const showBell = ref(false)

const displayUser = computed(() => {
  return {
    nickname: userInfoStore.userInfo?.user.nickname || '-',
    userID: userInfoStore.userInfo?.user.un_id || '-',
    avatar: userInfoStore.userInfo?.user.avatar || '',
    diamond: userInfoStore.userInfo?.user.diamonds ?? 0,
    gold: userInfoStore.userInfo?.user.gold ?? 0,
  }
})

const router = useRouter()

async function fetchUnreadCounts(): Promise<void> {
  const response = await postMsgMessageTodoApi({})
  if (response.code !== 0 || !Array.isArray(response.data)) {
    return
  }

  const getCountByType = (todoType: number): number => {
    const item = response.data.find((entry) => Number(entry.type) === todoType)
    return Number(item?.num ?? 0)
  }

  // 6: 带入申请（买入申请入口）
  creditUnreadCount.value = getCountByType(6)
  // 2: 未处理充提豆（UC 申请入口）
  ucUnreadCount.value = getCountByType(2)
}

async function fetchBellStatus(): Promise<void> {
  const response = await postMsgMessageUnreadApi({})
  if (response.code !== 0) {
    showBell.value = false
    return
  }

  const payload = response.data as unknown
  const records = Array.isArray(payload)
    ? (payload as Array<Record<string, unknown>>)
    : payload && typeof payload === 'object'
      ? [payload as Record<string, unknown>]
      : []

  showBell.value = records.some((item) => Number(item.num ?? 0) > 0)

  // Map unread counts to each box item by msg_main_type
  for (const box of boxList.value) {
    const record = records.find((item) => Number(item.msg_main_type) === box.msgType)
    box.unreadCount = Number(record?.num ?? 0)
  }
}

function goToMessagePage(
  type: 'system' | 'credit' | 'uc' | 'other',
  title: string,
  msgType?: number,
): void {
  void router.push({
    path: '/message/detail',
    query: {
      type,
      title,
      ...(msgType != null ? { msgType: String(msgType) } : {}),
    },
  })
}

function goToMineShop(): void {
  void router.push('/mine/shop')
}

onMounted(() => {
  void fetchUnreadCounts()
  void fetchBellStatus()
})
</script>

<template>
  <div class="message-page">
    <div class="title-bar">
      <div class="title">{{ t('UIMine_MsgSystemContent') }}</div>
      <div class="currency-info" @click="goToMineShop">
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
            <button
              class="button btn-credit"
              type="button"
              @click="goToMessagePage('credit', '授信额度申请')"
            >
              <div class="text">授信额度申请</div>
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
                      stroke="url(#paint0_linear_1_13000)"
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
                      id="paint0_linear_1_13000"
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
            <button
              class="button btn-credit"
              type="button"
              @click="goToMessagePage('uc', '联盟币申请')"
            >
              <div class="text">联盟币申请</div>
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
                      stroke="url(#paint0_linear_1_13002)"
                      stroke-opacity="0.68"
                      stroke-width="0.30418"
                    />
                  </g>
                  <defs>
                    <linearGradient
                      id="paint0_linear_1_13002"
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
                <div class="uc-num" v-if="ucUnreadCount > 0">{{ ucUnreadCount }}</div>
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
        @click="goToMessagePage(box.type, box.text, box.msgType)"
      >
        <div class="img">
          <img :src="box.icon" alt="消息" />
          <span v-if="box.unreadCount > 0" class="unread-badge">{{ box.unreadCount }}</span>
        </div>
        <div class="text">{{ box.text }}</div>
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
            width: 68.639px;
            height: 76.682px;
            transform: rotate(-0.18deg);
            img {
              width: 100%;
              height: 100%;
            }
          }
        }
        .card-line2 {
          padding: 0 0.4rem 0 0.45rem;
          .button {
            border: 0;
            cursor: pointer;
            border-radius: 0.401rem;
            padding: 0.265rem 0.04rem 0.273rem 0.409rem;
            gap: 0.148rem;
            background: transparent;
            justify-content: flex-start;
            overflow: hidden;
            &::before {
              content: '';
              position: absolute;
              inset: 0;
              background: rgba(38, 38, 38, 0.2);
              mix-blend-mode: hard-light;
              pointer-events: none;
              border-radius: inherit;
            }
            .text {
              font-family: 'HONOR Sans CN', sans-serif;
              font-weight: 500;
              font-size: 0.321rem;
              line-height: 0.946;
              color: #fff;
              white-space: nowrap;
            }
            .round-icon {
              width: 0.755rem;
              height: 0.755rem;
              background: rgba(20, 20, 20, 0.48);
              backdrop-filter: blur(0.445rem);
              -webkit-backdrop-filter: blur(0.445rem);
              border: none;
              margin-left: 0;
              font-size: 0.345rem;
              color: #f9f9f9;
            }
          }
          .btn-credit {
            display: inline-flex;
            height: 31.909px;
            padding: 9.933px 1.505px 10.234px 12px;
            align-items: center;
            gap: 5.566px;
            border-radius: 15.05px;
            background: rgba(38, 38, 38, 0.2);
            background-blend-mode: hard-light;
            position: relative;
            /* 标签变长（授信额度申请 / 联盟币申请）后禁止压缩，避免 nowrap 文案被 overflow:hidden 裁掉。 */
            flex-shrink: 0;
            .text {
              white-space: nowrap;
            }
            &::before {
              content: '';
              position: absolute;
              inset: 0;
              border-radius: inherit;
              padding: 0.304px;
              background: linear-gradient(
                180deg,
                rgba(255, 255, 255, 1) 0%,
                rgba(255, 255, 255, 0) 37.97%,
                rgba(255, 255, 255, 0) 72.6%,
                rgba(255, 255, 255, 1) 100%
              );
              -webkit-mask:
                linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
              -webkit-mask-composite: xor;
              mask-composite: exclude;
              pointer-events: none;
              mix-blend-mode: normal;
            }
            .round-icon {
              width: 28.315px;
              height: 28.315px;
              aspect-ratio: 1/1;
              border-radius: 28.315px;
              background: transparent;
              backdrop-filter: blur(16.705px);
              -webkit-backdrop-filter: blur(16.705px);
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              position: relative;
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
                leading-trim: both;
                text-edge: cap;
                font-feature-settings:
                  'liga' off,
                  'clig' off;
                font-family: 'SF Pro', sans-serif;
                font-size: 12.943px;
                font-style: normal;
                font-weight: 700;
                line-height: 140%;
              }
            }
          }
        }
      }
    }
  }
  .box-gallery {
    margin-top: 0.913rem;
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    gap: 0.5rem;
    padding: 0 0.5rem;
    .box-item {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
      .img {
        width: 1.62rem;
        height: 1.62rem;
        margin-bottom: 0.24rem;
        position: relative;
        img {
          width: 100%;
          height: 100%;
        }
        .unread-badge {
          position: absolute;
          top: 0;
          right: 0;
          min-width: 0.5rem;
          height: 0.5rem;
          padding: 0 0.12rem;
          background-color: #ff3b30;
          color: #fff;
          font-size: 0.24rem;
          font-weight: 600;
          line-height: 0.5rem;
          text-align: center;
          border-radius: 0.25rem;
          transform: translate(50%, -50%);
        }
      }
    }
  }
}
</style>
