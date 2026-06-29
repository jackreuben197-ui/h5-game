<script setup lang="ts">
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconAdd from '@/assets/icons/icon_add.svg'
import iconMessages from '@/assets/icons/icon_messages.png'
import { t } from '@/i18n'
import iconBoxSystem from '@/assets/icons/icon_box_system.png'
import iconBoxWallet from '@/assets/icons/icon_box_wallet.png'
import iconBoxBag from '@/assets/icons/icon_box_bag.png'
import iconBoxClub from '@/assets/icons/icon_box_club.png'
import iconBoxTribe from '@/assets/icons/icon_box_tribe.png'
import { useLoginModalStore } from '@/stores/loginModal'

const loginModalStore = useLoginModalStore()

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
              <div class="round-icon num">0</div>
            </button>
            <button class="button" type="button" @click="notifyNotLogin">
              <div class="text">{{ t('PageMessageApplyForUC') }}</div>
              <div class="round-icon num">0</div>
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
          }
        }
      }
    }
  }
}
</style>
