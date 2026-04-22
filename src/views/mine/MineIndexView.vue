<script setup lang="ts">
import { computed, ref } from 'vue'
import { showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import LoginSession from '@/session/loginSession'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconAdd from '@/assets/icons/icon_add.svg'
import iconChip from '@/assets/icons/icon_chips.png'

import iconBoxClubT from '@/assets/icons/icon_box_club_t.png'
import iconBoxFriendT from '@/assets/icons/icon_box_friend_t.png'
import iconBoxDiamond from '@/assets/icons/icon_box_diamond.png'
import iconBoxSave from '@/assets/icons/icon_box_save.png'
import iconBoxBag from '@/assets/icons/icon_box_bag.png'
import iconBoxComment from '@/assets/icons/icon_box_comment.png'
import iconBoxSetting from '@/assets/icons/icon_box_setting.png'
import iconShop from '@/assets/icons/icon_shop.png'
import defaultAvatar from '@/assets/images/default_avatar.png'

const router = useRouter()
const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()

interface BoxItem {
  icon: string
  text: string
  route: string
}

const boxList = ref<BoxItem[]>([
  { icon: iconBoxClubT, text: '系统消息', route: '/mine/settings' },
  { icon: iconBoxFriendT, text: '钱包消息', route: '/mine/settings' },
  { icon: iconBoxDiamond, text: '钱包消息', route: '/mine/settings' },
  { icon: iconBoxSave, text: '钱包消息', route: '/mine/settings' },
  { icon: iconBoxBag, text: '背包消息', route: '/mine/settings' },
  { icon: iconBoxComment, text: '俱乐部信息', route: '/mine/settings' },
  { icon: iconBoxSetting, text: '联盟信息', route: '/mine/settings' },
])


function goToSettings(path: string): void {
  void router.push(path)
}

const displayUser = computed(() => {
  return {
    nickname: userInfoStore.userInfo?.user.nickname || gameStore.loginNickname || '-',
    userID: userInfoStore.userInfo?.user.un_id || gameStore.loginUserId || '-',
    avatar: userInfoStore.userInfo?.user.avatar || defaultAvatar,
    diamond: userInfoStore.userInfo?.user.diamonds ?? 0,
    gold: userInfoStore.userInfo?.user.gold ?? 0,
  }
})

async function onLogout(): Promise<void> {
  // 退出登录时同步清理 WS 连接与端口缓存，避免脏会话残留。
  LoginSession.ClearWS()
  gameStore.clearLogin()
  showSuccessToast('已退出登录')
  await router.replace('/login')
}
</script>

<template>
  <div class="mine-page">
    <div class="title-bar">
      <div class="title">钱包</div>
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
            <div class="left-avatar">
              <img :src="String(displayUser.avatar)" alt="头像" />
            </div>
            <div class="right-box">
              <div class="name">{{ displayUser.nickname }}</div>
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
                <div class="num">{{ displayUser.gold.toLocaleString() }}</div>
              </div>
              <div class="currency">
                <img class="icon-currency" :src="iconDiamond" alt="diamond" />
                <div class="num">{{ displayUser.diamond.toLocaleString() }}</div>
              </div>
            </div>
            <div class="button">
              <div class="text">我的商城</div>
              <div class="round-icon">
                <img :src="iconShop" alt="我的商城" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="box-gallery">
      <div
        v-for="box in boxList"
        :key="box.text"
        class="box-item"
        @click="goToSettings(box.route)"
      >
        <div class="img">
          <img :src="box.icon" alt="消息" />
        </div>
        <div class="text">{{ box.text }}</div>
      </div>
    </div>
    <VanButton
      plain
      round
      size="small"
      class="logout-btn"
      @click="onLogout"
    >
      退出登录
    </VanButton>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/messages_mine.scss';

.mine-page {
  .card-bg-highlight{
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
              margin-top:0.2rem;
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
                background-color: rgba(255,255,255,0.4);
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 0 0.25rem;
                border-radius: 0.5rem;
              }
              .id-value {
                font-size: 0.3rem;
                line-height: 120%;
                font-weight: 500  ;
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
