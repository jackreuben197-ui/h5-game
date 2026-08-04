<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserInfoStore } from '@/stores/userInfo'
import { postMsgMessageTodoApi, postMsgMessageUnreadApi } from '@/api/msg'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconMessages from '@/assets/icons/icon_messages.png'
import iconMessagesLight from '@/assets/icons/icon_messages_light.png'
import iconDing from '@/assets/icons/icon_ding.png'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import { t } from '@/i18n'
import iconBoxSystem from '@/assets/icons/icon_box_system.png'
import iconBoxSystemLight from '@/assets/icons/icon_box_system_light.png'
import iconBoxWallet from '@/assets/icons/icon_box_wallet.png'
import iconBoxWalletLight from '@/assets/icons/icon_box_wallet_light.png'
import iconBoxBag from '@/assets/icons/icon_box_bag.png'
import iconBoxBagLight from '@/assets/icons/icon_box_message_bag_light.png'
import iconBoxClub from '@/assets/icons/icon_club_shield.png'
import iconBoxClubLight from '@/assets/icons/icon_club_shield_light.png'
import iconBoxTribe from '@/assets/icons/icon_box_tribe.png'
import iconBoxTribeLight from '@/assets/icons/icon_box_tribe_light.png'

interface BoxItem {
  icon: string
  iconLight: string
  text: string
  type: 'system' | 'other'
  msgType: number
  unreadCount: number
}

const userInfoStore = useUserInfoStore()

const boxList = ref<BoxItem[]>([
  {
    icon: iconBoxSystem,
    iconLight: iconBoxSystemLight,
    text: t('Msg3'),
    type: 'system',
    msgType: 4,
    unreadCount: 0,
  },
  {
    icon: iconBoxWallet,
    iconLight: iconBoxWalletLight,
    text: t('Msg4'),
    type: 'other',
    msgType: 3,
    unreadCount: 0,
  },
  {
    icon: iconBoxBag,
    iconLight: iconBoxBagLight,
    text: t('Msg6'),
    type: 'other',
    msgType: 1,
    unreadCount: 0,
  },
  {
    icon: iconBoxClub,
    iconLight: iconBoxClubLight,
    text: t('Msg1'),
    type: 'other',
    msgType: 2,
    unreadCount: 0,
  },
  {
    icon: iconBoxTribe,
    iconLight: iconBoxTribeLight,
    text: t('Msg2'),
    type: 'other',
    msgType: 5,
    unreadCount: 0,
  },
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
    <div class="title-bar main-primary-header">
      <div class="title">{{ t('UIMine_MsgSystemContent') }}</div>
      <div class="currency-info main-primary-currency" @click="goToMineShop">
        <div class="icon-diamond">
          <img :src="iconDiamond" :alt="t('UIMine_VIP_diamond')" />
        </div>
        <div class="num">{{ displayUser.diamond }}</div>
        <div class="icon-recharge">
          <AppSvgIcon class="icon-recharge-svg" name="plus-circle" :title="t('UIMine_WalletAdd_EjPOTlsz')" />
        </div>
      </div>
    </div>
    <div class="card-bg-highlight">
      <div class="card-bg-outter">
        <div class="card-bg-innner">
          <div class="card-line1">
            <div class="left-text">MESSAGES</div>
            <div class="right-icon">
              <img class="only-dark" :src="iconMessages" :alt="t('UIMine_MsgSystemContent')" />
              <img class="only-light" :src="iconMessagesLight" :alt="t('UIMine_MsgSystemContent')" />
              <img v-if="showBell" class="icon-ding" :src="iconDing" :alt="t('UIMessage_Text2')" />
            </div>
          </div>
          <div class="card-line2">
            <button class="button" type="button" @click="goToMessagePage('credit', t('UIMessage_BuyInApply'))">
              <div class="text">{{ t('PageMessageApplyForCreditLimit') }}</div>
              <div class="round-icon num">{{ creditUnreadCount }}</div>
            </button>
            <button class="button" type="button" @click="goToMessagePage('uc', 'UC' + t('UIGuild_Fund_Apply'))">
              <div class="text">{{ t('PageMessageApplyForUC') }}</div>
              <div class="round-icon num">{{ ucUnreadCount }}</div>
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
          <img class="only-dark" :src="box.icon" :alt="box.text" />
          <img class="only-light" :src="box.iconLight" :alt="box.text" />
          <span v-if="box.unreadCount > 0" class="unread-badge">{{ box.unreadCount }}</span>
        </div>
        <div class="text">{{ box.text }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/messages_mine.scss' as *;
@use '@/styles/mixins' as *;

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

            @include theme-light {
              color: rgba(15, 8, 8, 0.69);
            }
          }
          .right-icon {
            width: 1.47rem;
            height: 1.47rem;

            img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .icon-ding {
              width: 0.48rem;
              height: auto;
              transform: translateY(-300%) translateX(200%);
            }
          }
        }
        .card-line2 {
          padding: 0 0.4rem;

          .button {
            flex: 0 0 3.4rem;
            border: 0;
            cursor: pointer;
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
