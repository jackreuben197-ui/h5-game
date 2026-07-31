<script setup lang="ts">
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconChip from '@/assets/icons/icon_chips.png'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import { t } from '@/i18n'
import iconBoxClubT from '@/assets/icons/icon_club_data.png'
import iconBoxClubTLight from '@/assets/icons/icon_club_data_light.png'
import iconBoxFriendT from '@/assets/icons/icon_box_friend_t.png'
import iconBoxFriendTLight from '@/assets/icons/icon_box_friend_t_light.png'
import iconBoxDiamond from '@/assets/icons/icon_box_diamond.png'
import iconBoxDiamondLight from '@/assets/icons/icon_box_diamond_light.png'
import iconBoxSave from '@/assets/icons/icon_box_save.png'
import iconBoxSaveLight from '@/assets/icons/icon_box_save_light.png'
import iconBoxBag from '@/assets/icons/icon_box_bag.png'
import iconBoxBagLight from '@/assets/icons/icon_box_bag_light.png'
import iconBoxComment from '@/assets/icons/icon_box_comment.png'
import iconBoxCommentLight from '@/assets/icons/icon_box_comment_light.png'
import iconBoxSetting from '@/assets/icons/icon_box_setting.png'
import iconBoxSettingLight from '@/assets/icons/icon_box_setting_light.png'
import iconShop from '@/assets/icons/icon_shop.png'
import defaultAvatar from '@/assets/images/default_avatar.png'
import { useLoginModalStore } from '@/stores/loginModal'

interface BoxItem {
  key: string
  icon: string
  iconLight: string
  text: string
}

const loginModalStore = useLoginModalStore()

const boxList: BoxItem[] = [
  {
    key: 'club-career',
    icon: iconBoxClubT,
    iconLight: iconBoxClubTLight,
    text: t('PageMineClubCareer'),
  },
  {
    key: 'friends-career',
    icon: iconBoxFriendT,
    iconLight: iconBoxFriendTLight,
    text: t('PageMineFriendTableCareer'),
  },
  { key: 'my-bill', icon: iconBoxDiamond, iconLight: iconBoxDiamondLight, text: t('UIMine_Bill') },
  {
    key: 'hand-history',
    icon: iconBoxSave,
    iconLight: iconBoxSaveLight,
    text: t('UIMine_btn_paipu'),
  },
  { key: 'bag', icon: iconBoxBag, iconLight: iconBoxBagLight, text: t('UIMine_btn_backpack') },
  {
    key: 'message-board',
    icon: iconBoxComment,
    iconLight: iconBoxCommentLight,
    text: t('PageMineMessageBoard'),
  },
  {
    key: 'settings',
    icon: iconBoxSetting,
    iconLight: iconBoxSettingLight,
    text: t('UIMine_btn_setting'),
  },
]

const displayUser = {
  nickname: t('UIGuest_Text8'),
  userID: '-',
  avatar: defaultAvatar,
  diamond: 0,
  gold: 0,
}

function notifyNotLogin(): void {
  loginModalStore.open()
}
</script>

<template>
  <div class="page-shell mine-page">
    <div class="title-bar">
      <div class="title">{{ t('UIMine_title') }}</div>
      <div class="currency-info" @click="notifyNotLogin">
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
            <button class="left-avatar" type="button" @click="notifyNotLogin">
              <img :src="displayUser.avatar" :alt="t('UIMine_UserInfoSetting_btn_head')" />
            </button>
            <div class="right-box" @click="notifyNotLogin">{{ t('UIGuild_MemberManagerSortByLastLoginTime') }}/{{ t('UILogin_TitleRegister') }}</div>
          </div>
          <div class="card-line2">
            <div class="left-board">
              <div class="currency">
                <img class="icon-currency" :src="iconChip" alt="gold" />
                <div class="num">-</div>
              </div>
              <div class="currency">
                <img class="icon-currency" :src="iconDiamond" alt="diamond" />
                <div class="num">-</div>
              </div>
            </div>
            <button class="button" type="button" @click="notifyNotLogin">
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
      <div v-for="box in boxList" :key="box.key" class="box-item" @click="notifyNotLogin">
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
            display: inline-block;
            padding: 0.37rem 0.62rem;
            margin-top: 0.5rem;
            font-size: 0.32rem;
            border-radius: 1.73493rem;
            background: rgba(255, 255, 255, 0.2);
            background-blend-mode: hard-light;
            box-shadow:
              /* 左上高光 */
              inset 0.2px 0.2px 0px 0px rgba(255, 255, 255, 0.85),
              /* 右下高光 */ inset -0.2px -0.2px 0px 0px rgba(255, 255, 255, 0.85);

            @include theme-light {
              color: #fff;
              background: var(--c-brand);
              box-shadow: none;
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

                @include theme-light {
                  color: #000;
                }
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
