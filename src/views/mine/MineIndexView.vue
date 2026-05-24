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
import ProfileCard from '@/components/ProfileCard/ProfileCard.vue'

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
  <div class="page-shell mine-page">
    <div class="title-bar">
      <div class="title">{{ t('UIMine_title') }}</div>
      <div class="currency-info">
        <div class="icon-diamond">
          <img :src="iconDiamond" alt="钻石" />
        </div>
        <div class="num">{{ displayUser.diamond }}</div>
        <div class="icon-recharge">
          <img :src="iconAdd" alt="充值" @click="goToMineShop" />
        </div>
      </div>
    </div>
    <ProfileCard
      :avatar="String(displayUser.avatar)"
      :nickname="displayUser.nickname"
      :user-id="String(displayUser.userID)"
      @avatar-click="goToProfileEdit"
    >
      <template #bottom>
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
        <button class="button" type="button" @click="goToMineShop">
          <div class="text">{{ t('UIHappyShop_ActivityShop') }}</div>
          <div class="round-icon">
            <img :src="iconShop" alt="我的商城" />
          </div>
        </button>
      </template>
    </ProfileCard>
    <div class="box-gallery">
      <div v-for="box in boxList" :key="box.key" class="box-item" @click="goToNextPage(box.route)">
        <div class="img">
          <img :src="box.icon" alt="消息" />
        </div>
        <div class="text">{{ box.text }}</div>
      </div>
    </div>
    <VanButton plain round size="small" class="logout-btn" @click="onLogout"> 退出登录 </VanButton>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/messages_mine.scss' as *;

.mine-page {
  :deep(.card-line2) {
    padding: 0 0.25rem 0 0.45rem;
  }

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
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 0.4rem;
    border: 0.5px solid rgba(255, 255, 255, 0.25);
    padding: 0.1rem 0.1rem 0.1rem 0.36rem;
    overflow: hidden;
    cursor: pointer;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(38, 38, 38, 0.2);
      mix-blend-mode: hard-light;
      border-radius: inherit;
      pointer-events: none;
    }

    .text {
      font-size: 0.33rem;
      line-height: 100%;
    }

    .round-icon {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      background-color: rgba(20, 20, 20, 0.48);
      display: flex;
      justify-content: center;
      align-items: center;
      margin-left: 0.2rem;

      img {
        width: 0.474rem;
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
