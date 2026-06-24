<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconAdd from '@/assets/icons/icon_add.svg'
import iconChip from '@/assets/icons/icon_chips.png'
import { t } from '@/i18n'
import iconBoxClubT from '@/assets/icons/icon_box_club_t.png'
import iconBoxFriendT from '@/assets/icons/icon_box_friend_t.png'
import iconBoxDiamond from '@/assets/icons/icon_box_diamond.png'
import iconBoxSave from '@/assets/icons/icon_box_save.png'
import iconBoxBag from '@/assets/icons/icon_box_bag.png'
import iconBoxComment from '@/assets/icons/icon_box_comment.png'
import iconBoxSetting from '@/assets/icons/icon_box_setting.png'
import iconShop from '@/assets/icons/icon_shop.png'
import defaultAvatar from '@/assets/images/default_avatar.png'
import { formatUC } from '@/utils/roomVisibility'

const router = useRouter()
const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()

interface BoxItem {
  key: string
  icon: string
  text: string
  route: string
}

const boxList = ref<BoxItem[]>([
  {
    key: 'club-career',
    icon: iconBoxClubT,
    text: t('PageMineClubCareer'),
    route: '/mine/club-career',
  },
  {
    key: 'friends-career',
    icon: iconBoxFriendT,
    text: t('PageMineFriendTableCareer'),
    route: '/mine/friends-career',
  },
  { key: 'my-bill', icon: iconBoxDiamond, text: t('UIMine_Bill'), route: '/mine/bill' },
  {
    key: 'hand-history',
    icon: iconBoxSave,
    text: t('UIMine_btn_paipu'),
    route: '/mine/hand-collection',
  },
  { key: 'bag', icon: iconBoxBag, text: t('UIMine_btn_backpack'), route: '/mine/backpack' },
  {
    key: 'message-board',
    icon: iconBoxComment,
    text: t('PageMineMessageBoard'),
    route: '/mine/message-board',
  },
  { key: 'settings', icon: iconBoxSetting, text: t('UIMine_btn_setting'), route: '/mine/settings' },
])

function goToNextPage(path: string): void {
  void router.push(path)
}

function goToProfileEdit(): void {
  void router.push('/mine/profile/edit')
}

function goToMineShop(): void {
  void router.push('/mine/shop')
}

const displayUser = computed(() => {
  let totalGold = 0
  for (const club of userInfoStore.clubList || []) {
    totalGold += club.user_gold ?? 0
  }
  return {
    nickname: userInfoStore.userInfo?.user.nickname || gameStore.loginNickname || '-',
    userID: userInfoStore.userInfo?.user.un_id || gameStore.loginUserId || '-',
    avatar: userInfoStore.userInfo?.user.avatar || defaultAvatar,
    diamond: userInfoStore.userInfo?.user.diamonds ?? 0,
    gold: totalGold,
  }
})
</script>

<template>
  <div class="page-shell mine-page">
    <div class="title-bar">
      <div class="title">{{ t('UIMine_title') }}</div>
      <div class="currency-info" @click="goToMineShop">
        <div class="icon-diamond">
          <img :src="iconDiamond" :alt="t('UIMine_VIP_diamond')" />
        </div>
        <div class="num">{{ displayUser.diamond }}</div>
        <div class="icon-recharge">
          <img :src="iconAdd" :alt="t('UIMine_WalletAdd_EjPOTlsz')" />
        </div>
      </div>
    </div>
    <div class="card-bg-highlight">
      <div class="card-bg-outter">
        <div class="card-bg-innner">
          <div class="card-line1">
            <button class="left-avatar" type="button" @click="goToProfileEdit">
              <img :src="String(displayUser.avatar)" :alt="t('UIMine_UserInfoSetting_btn_head')" />
            </button>
            <div class="right-box">
              <button class="name" type="button" @click="goToProfileEdit">
                {{ displayUser.nickname }}
              </button>
              <div class="idbox">
                <div class="id-label">ID</div>
                <div class="id-value">{{ displayUser.userID }}</div>
              </div>
            </div>
          </div>
          <div class="card-line2">
            <div class="left-board">
              <div class="currency">
                <img class="icon-currency" :src="iconChip" alt="gold" />
                <div class="num">{{ formatUC(displayUser.gold) }}</div>
              </div>
              <div class="currency">
                <img class="icon-currency" :src="iconDiamond" alt="diamond" />
                <div class="num">{{ displayUser.diamond.toLocaleString() }}</div>
              </div>
            </div>
            <button class="button" type="button" @click="goToMineShop">
              <div class="text">{{ t('UIHappyShop_ActivityShop') }}</div>
              <div class="round-icon">
                <img :src="iconShop" :alt="t('UIHappyShop_ActivityShop')" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="box-gallery">
      <div v-for="box in boxList" :key="box.key" class="box-item" @click="goToNextPage(box.route)">
        <div class="img">
          <img :src="box.icon" :alt="t('UIMine_MsgSystemContent')" />
        </div>
        <div class="text">{{ box.text }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/messages_mine.scss' as *;

.mine-page {
  .card-bg-highlight {
    .card-bg-outter {
      .card-bg-innner {
        .card-line1 {
          justify-content: flex-start;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0 0.8rem 0.3rem 0.45rem;
          .left-avatar {
            width: 2.32rem;
            height: 2.32rem;
            border-radius: 50%;
            overflow: hidden;
            border: 0;
            background: transparent;
            padding: 0;
            img {
              width: 100%;
              height: 100%;
            }
          }
          .right-box {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0.3rem;
            .name {
              border: 0;
              background: transparent;
              padding: 0;
              text-align: left;
              color: #fff;
              margin-top: 0.2rem;
              font-size: 0.6rem;
              line-height: 100%;
              font-weight: bold;
              font-family: var(--font-family-SF);
            }
            .idbox {
              display: flex;
              align-items: center;
              gap: 0.15rem;
              .id-label {
                font-size: 0.28rem;
                line-height: 150%;
                background-color: rgba(255, 255, 255, 0.4);
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 0 0.25rem;
                border-radius: 0.5rem;
              }
              .id-value {
                font-size: 0.3rem;
                line-height: 120%;
                font-weight: 500;
                font-family: var(--font-family-SF);
              }
            }
          }
        }
        .card-line2 {
          padding: 0 0.25rem 0 0.45rem;
          .left-board {
            display: flex;
            align-items: flex-start;
            flex-direction: column;
            gap: 0.1rem;
            .currency {
              display: flex;
              align-items: center;
              gap: 0.2rem;
              .icon-currency {
                width: 0.32rem;
              }
              .num {
                font-size: 0.34rem;
                line-height: 120%;
                font-weight: 500;
                font-family: var(--font-family-SF);
              }
            }
          }
          .button {
            border: 0;
            cursor: pointer;
            .round-icon {
              img {
                width: 0.32rem;
              }
            }
          }
        }
      }
    }
  }
}

.logout-btn {
  position: absolute;
  bottom: 3rem;
  right: 0;
}
</style>
