<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserInfoStore } from '@/stores/userInfo'
import { postMsgMessageTodoApi, postMsgMessageUnreadApi } from '@/api/msg'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconAdd from '@/assets/icons/icon_add.svg'
import iconMessages from '@/assets/icons/icon_messages.png'
import iconDing from '@/assets/icons/icon_ding.png'
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
}

const userInfoStore = useUserInfoStore()

const boxList = ref<BoxItem[]>([
  { icon: iconBoxSystem, text: t('Msg3'), type: 'system', msgType: 4 },
  { icon: iconBoxWallet, text: t('Msg4'), type: 'other', msgType: 3 },
  { icon: iconBoxBag, text: t('Msg6'), type: 'other', msgType: 1 },
  { icon: iconBoxClub, text: t('Msg1'), type: 'other', msgType: 2 },
  { icon: iconBoxTribe, text: t('Msg2'), type: 'other', msgType: 5 },
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

onMounted(() => {
  void fetchUnreadCounts()
  void fetchBellStatus()
})
</script>

<template>
  <div class="message-page">
    <div class="title-bar">
      <div class="title">{{ t('UIMine_MsgSystemContent') }}</div>
      <div class="currency-info">
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
              <img v-if="showBell" class="icon-ding" :src="iconDing" alt="铃铛" />
            </div>
          </div>
          <div class="card-line2">
            <button class="button" type="button" @click="goToMessagePage('credit', '买入申请')">
              <div class="text">{{ t('PageMessageApplyForCreditLimit') }}</div>
              <div class="round-icon num">{{ creditUnreadCount }}</div>
            </button>
            <button class="button" type="button" @click="goToMessagePage('uc', 'UC申请')">
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
          <img :src="box.icon" alt="消息" />
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
            width: 1.47rem;
            height: 1.47rem;
            img {
              width: 100%;
              height: 100%;
            }
            .icon-ding {
              width: 0.48rem;
              height: auto;
              transform: translateY(-300%) translateX(200%);
            }
          }
        }
        .card-line2 {
          padding: 0 0.4rem 0 0.45rem;
          .button {
            border: 0;
            cursor: pointer;
          }
        }
      }
    }
  }
}
</style>
