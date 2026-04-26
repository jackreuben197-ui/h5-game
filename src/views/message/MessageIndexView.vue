<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserInfoStore } from '@/stores/userInfo'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconAdd from '@/assets/icons/icon_add.svg'
import iconMessages from '@/assets/icons/icon_messages.png'
import iconDing from '@/assets/icons/icon_ding.png'
import iconPoker from '@/assets/icons/game_zone_poker_mini.png'
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
}

const userInfoStore = useUserInfoStore()

const boxList = ref<BoxItem[]>([
  { icon: iconBoxSystem, text: t('Msg3'), type: 'system' },
  { icon: iconBoxWallet, text: t('Msg4'), type: 'other' },
  { icon: iconBoxBag, text: t('Msg6'), type: 'other' },
  { icon: iconBoxClub, text: t('Msg1'), type: 'other' },
  { icon: iconBoxTribe, text: t('Msg2'), type: 'other' },
])

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

function goToMessagePage(type: 'system' | 'credit' | 'uc' | 'other', title: string): void {
  void router.push({
    path: '/message/detail',
    query: {
      type,
      title,
    },
  })
}
</script>

<template>
  <div class="message-page">
    <div class="title-bar">
      <div class="title">{{ t('UIMine_MsgSystemContent') }}</div>
      <div class="currency-info">
        <div class="icon-diamond">
          <img :src="iconDiamond" alt="钻石" />
        </div>
        <div class="num"> {{ displayUser.diamond }}</div>
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
              <img class="icon-ding" :src="iconDing" alt="铃铛" />
            </div>
          </div>
          <div class="card-line2">
            <button class="button" type="button" @click="goToMessagePage('credit', '买入申请')">
              <div class="text">{{ t('PageMessageApplyForCreditLimit') }}</div>
              <div class="round-icon">
                <img :src="iconPoker" alt="申请" />
              </div>
            </button>
            <button class="button" type="button" @click="goToMessagePage('uc', 'UC申请')">
              <div class="text">{{ t('PageMessageApplyForUC') }}</div>
              <div class="round-icon num">16</div>
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
        @click="goToMessagePage(box.type, box.text)"
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
  .card-bg-highlight{
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
