<script setup lang="ts">
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconMessages from '@/assets/icons/icon_messages.png'
import iconMessagesLight from '@/assets/icons/icon_messages_light.png'
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
import { useLoginModalStore } from '@/stores/loginModal'

const loginModalStore = useLoginModalStore()

interface BoxItem {
  icon: string
  iconLight: string
  text: string
}

const boxList: BoxItem[] = [
  { icon: iconBoxSystem, iconLight: iconBoxSystemLight, text: t('Msg3') },
  { icon: iconBoxWallet, iconLight: iconBoxWalletLight, text: t('Msg4') },
  { icon: iconBoxBag, iconLight: iconBoxBagLight, text: t('Msg6') },
  { icon: iconBoxClub, iconLight: iconBoxClubLight, text: t('Msg1') },
  { icon: iconBoxTribe, iconLight: iconBoxTribeLight, text: t('Msg2') },
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
          <AppSvgIcon class="icon-recharge-svg" name="plus-circle" title="充值" />
        </div>
      </div>
    </div>
    <div class="card-bg-highlight">
      <div class="card-bg-outter">
        <div class="card-bg-innner">
          <div class="card-line1">
            <div class="left-text">MESSAGES</div>
            <div class="right-icon">
              <img class="only-dark" :src="iconMessages" alt="消息" />
              <img class="only-light" :src="iconMessagesLight" alt="消息" />
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
      <div v-for="box in boxList" :key="box.text" class="box-item" @click="notifyNotLogin">
        <div class="img">
          <img class="only-dark" :src="box.icon" :alt="box.text" />
          <img class="only-light" :src="box.iconLight" :alt="box.text" />
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
}
</style>
