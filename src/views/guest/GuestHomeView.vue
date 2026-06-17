<script setup lang="ts">
import homeHeaderFallback from '@/assets/images/home_header_2.png'
import { t } from '@/i18n'
import { useLoginModalStore } from '@/stores/loginModal'
import { useUserInfoStore } from '@/stores/userInfo'
import { useCachedImage } from '@/utils/imageCache'
import { computed, onMounted } from 'vue'

import imgPa from '@/assets/images/minigame-newui/pa.svg'
import imgMahjong from '@/assets/images/minigame-newui/ma.svg'
import imgFb from '@/assets/images/minigame-newui/fb.svg'
import imgCowboy from '@/assets/images/minigame-newui/sg.svg'

const loginModalStore = useLoginModalStore()
const userInfoStore = useUserInfoStore()

const clubBannerUrl = useCachedImage(
  () => userInfoStore.channelDefaultClub?.banner || homeHeaderFallback,
)
const clubNameText = computed<string>(() => userInfoStore.channelDefaultClub?.club_name || '俱乐部')
const noticeText = '欢迎来到德州扑克，登录后体验更多精彩内容'
const clubGoldText = '0.00'
const balanceVisible = true
const pokerTablesText = '0'
const pokerPlayersText = '0'
const miniGamePlayersText = 0
const mttTablesText = '0'
const mttPlayersText = '0'

const activeBannerGames = [
  { name: 'PA真人', svg: imgPa },
  { name: '麻将胡了', svg: imgMahjong },
  { name: 'FB体育', svg: imgFb },
  { name: '德州牛仔', svg: imgCowboy },
]

function notifyNotLogin(): void {
  loginModalStore.open({ mode: 'login' })
}
function notifyNotLoginRegister(): void {
  loginModalStore.open({ mode: 'register' })
}

onMounted(() => {
  void userInfoStore.ensureChannelDefaultClub()
})
</script>

<template>
  <div class="home-page">
    <!-- 0. 顶部栏：POKER + 注册/登录 -->
    <div class="top-bar">
      <span class="top-bar__logo">POKER</span>
      <div class="top-bar__actions">
        <button class="top-bar__btn top-bar__btn--register" @click="notifyNotLoginRegister">
          注册
        </button>
        <button class="top-bar__btn top-bar__btn--login" @click="notifyNotLogin">登陆</button>
      </div>
    </div>
    <!-- 1. 顶部俱乐部介绍图 -->
    <div class="home-header">
      <img class="home-header-img" :src="clubBannerUrl" alt="俱乐部介绍" />
    </div>

    <!-- 2. 公告栏 -->
    <div class="notice-bar">
      <img class="notice-icon" src="@/assets/icons/icon_notice.svg" alt="公告" />
      <div class="notice-marquee">
        <span class="notice-label mr-4"> {{ $txt('Serverbulletin') }}: </span>
        <div class="notice-scroll">
          <div class="notice-track">
            <span class="notice-item">{{ noticeText }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 俱乐部控件 -->
    <div class="club-panel">
      <div class="club-left">
        <div class="club-service-row">
          <span class="service-label"> {{ clubNameText }} </span>
          <img
            class="icon-sm icon-eye"
            src="@/assets/icons/icon_eye_open.svg"
            alt="显示/隐藏"
            @click="notifyNotLogin"
          />
        </div>
        <div class="club-balance-row">
          <img class="icon-sm" src="@/assets/icons/diamondicon.svg" alt="余额" />
          <span class="balance-amount">
            {{ balanceVisible ? clubGoldText : '****' }}
          </span>
          <svg
            class="icon-sm icon-refresh"
            xmlns="http://www.w3.org/2000/svg"
            width="19"
            height="19"
            viewBox="0 0 19 19"
            fill="none"
            @click="notifyNotLogin"
          >
            <path
              d="M9.22333 18.4467C4.12929 18.4467 0 14.3174 0 9.22333C0 4.12929 4.12929 0 9.22333 0C14.3174 0 18.4467 4.12929 18.4467 9.22333C18.4467 14.3174 14.3174 18.4467 9.22333 18.4467ZM13.669 13.9051C14.7823 12.8498 15.4836 11.4326 15.6471 9.90734C15.8106 8.38207 15.4257 6.84842 14.5613 5.58114C13.6969 4.31385 12.4095 3.39575 10.9298 2.9913C9.45006 2.58685 7.87467 2.72248 6.48585 3.37389L7.38512 4.99259C8.08695 4.68756 8.85365 4.56198 9.61612 4.62715C10.3786 4.69233 11.1128 4.94622 11.7527 5.36594C12.3926 5.78566 12.918 6.35802 13.2815 7.03142C13.645 7.70481 13.8352 8.45808 13.835 9.22333H11.068L13.669 13.9051ZM11.9608 15.0728L11.0615 13.4541C10.3597 13.7591 9.59301 13.8847 8.83055 13.8195C8.06808 13.7543 7.33382 13.5004 6.69394 13.0807C6.05407 12.661 5.5287 12.0886 5.16519 11.4152C4.80168 10.7418 4.61145 9.98858 4.61167 9.22333H7.37866L4.77769 4.54157C3.66433 5.59684 2.96308 7.01406 2.79958 8.53933C2.63608 10.0646 3.021 11.5982 3.88539 12.8655C4.74978 14.1328 6.03715 15.0509 7.51688 15.4554C8.9966 15.8598 10.572 15.7242 11.9608 15.0728Z"
              fill="#ABABAB"
            />
          </svg>
          <button class="recharge-btn" @click="notifyNotLogin">
            {{ t('OpCodeString_RECHARGE') }}
          </button>
        </div>
      </div>

      <div class="club-right">
        <div class="contact-item" @click="notifyNotLogin">
          <img class="contact-icon" src="@/assets/icons/icon_service_1.svg" alt="Telegram" />
          <span class="contact-label"> @game </span>
        </div>
        <div class="contact-item" @click="notifyNotLogin">
          <img class="contact-icon" src="@/assets/icons/icon_service_2.svg" alt="邮箱" />
          <span class="contact-label"> {{ $txt('UISetting_SecurityBindEmailItem') }} </span>
        </div>
        <div class="contact-item" @click="notifyNotLogin">
          <img class="contact-icon" src="@/assets/icons/icon_service_3.svg" alt="IM客服" />
          <span class="contact-label"> {{ $txt('UIMineMain01') }} </span>
        </div>
      </div>
    </div>

    <!-- 4. 游戏模块 -->
    <div class="game-zones">
      <!-- 左侧：MTT赛事 + 小游戏 -->
      <div class="game-zone-left">
        <!-- MTT赛事专区 / 扑克比赛 -->
        <div
          class="game-card game-card-mtt"
          style="flex: 1; min-height: 5.54rem"
          @click="notifyNotLogin"
        >
          <div class="mtt-bg-wrap">
            <img class="mtt-bg-main" src="@/assets/images/game_zone_mtt_bg.png" alt="" />
            <div class="mtt-bg-inner">
              <img class="mtt-bg-tex" src="@/assets/images/game_zone_mtt_bg2.png" alt="" />
            </div>
          </div>
          <div class="mtt-layer-base"></div>
          <div class="mtt-layer-blur1"></div>
          <div class="mtt-layer-blur2"></div>
          <div class="mtt-title-wrap">
            <span class="mtt-title">{{ t('UIHomeMttArea') }}</span>
          </div>
          <img class="mtt-vector-icon" src="@/assets/icons/game_zone_mtt_vector.png" alt="" />
          <div class="mtt-online-bar">
            <span class="mtt-bar-label">{{ t('UIClub_Mlist_zaixian') }}</span>
            <div class="mtt-bar-group">
              <span class="mtt-table-rect"></span>
              <span class="mtt-bar-label">{{ mttTablesText }}桌</span>
            </div>
            <div class="mtt-bar-group">
              <img class="mtt-user-icon" src="@/assets/icons/icon_solar_user_bold.png" alt="" />
              <span class="mtt-bar-label">{{ mttPlayersText }}人</span>
            </div>
          </div>
        </div>

        <!-- 小游戏专区 -->
        <div
          class="game-card game-card-minigame"
          style="min-height: 2.7rem"
          @click="notifyNotLogin"
        >
          <div class="mg-title-wrap">
            <span class="mg-title">{{ t('UIHomeMinigameArea') }}</span>
          </div>
          <div class="mg-mask-group">
            <div class="mg-mask-inner">
              <img class="mg-mask-img" src="@/assets/images/game_zone_minigame_mask.png" alt="" />
            </div>
          </div>
          <div class="mg-online-bar">
            <div class="mg-online-bg" aria-hidden="true"></div>
            <div class="mg-online-content">
              <span class="mg-bar-label">{{ t('UIClub_Mlist_zaixian') }}</span>
              <div class="mg-bar-group">
                <img class="mg-user-icon" src="@/assets/icons/icon_solar_user_bold.png" alt="" />
                <span class="mg-bar-label">{{ miniGamePlayersText }}人</span>
              </div>
            </div>
          </div>
          <div class="mg-character-wrap">
            <div class="mg-character-inner">
              <img
                class="mg-character-img"
                src="@/assets/images/game_zone_minigame_object.png"
                alt=""
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：德州扑克 + 娱乐场 -->
      <div class="game-zone-right">
        <!-- 德州扑克 -->
        <div class="game-card poker-card" @click="notifyNotLogin">
          <div class="pk-ip2-wrap">
            <img class="pk-ip2-img" src="@/assets/images/game_zone_poker_ip2.png" alt="" />
          </div>
          <div class="pk-ip1-wrap">
            <img class="pk-ip1-img" src="@/assets/images/game_zone_poker_ip.png" alt="" />
          </div>
          <div class="pk-title-wrap">
            <span class="pk-title">{{ t('UIHomePokerArea') }}</span>
          </div>
          <img class="pk-vector-icon" src="@/assets/icons/game_zone_poker_vector.png" alt="" />
          <div class="pk-online-bar">
            <span class="pk-bar-label">{{ t('UIClub_Mlist_zaixian') }}</span>
            <div class="pk-bar-stats">
              <div class="pk-bar-group pk-bar-group--table">
                <span class="pk-table-rect"></span>
                <span class="pk-bar-label">{{ pokerTablesText }}桌</span>
              </div>
              <div class="pk-bar-group pk-bar-group--people">
                <img class="pk-user-icon" src="@/assets/icons/icon_solar_user_bold.png" alt="" />
                <span class="pk-bar-label">{{ pokerPlayersText }}人</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 娱乐场 -->
        <div class="game-card en-card" @click="notifyNotLogin">
          <div class="en-bg1-wrap">
            <img class="en-bg1-img" src="@/assets/images/game_zone_entertainment_bg1.png" alt="" />
          </div>
          <div class="en-bg2-wrap">
            <img class="en-bg2-img" src="@/assets/images/game_zone_entertainment_bg2.png" alt="" />
          </div>
          <div class="en-base-overlay"></div>
          <div class="en-blur1"></div>
          <div class="en-blur2"></div>
          <div class="en-title-wrap">
            <span class="en-title">娱乐场</span>
          </div>
          <img
            class="en-vector-icon"
            src="@/assets/icons/game_zone_entertainment_vector.png"
            alt=""
          />
          <div class="en-online-bar">
            <div class="en-online-bg" aria-hidden="true"></div>
            <div class="en-online-content">
              <span class="en-bar-label">{{ t('UIClub_Mlist_zaixian') }}</span>
              <div class="en-bar-group">
                <img class="en-user-icon" src="@/assets/icons/icon_solar_user_bold.png" alt="" />
                <span class="en-bar-label">{{ miniGamePlayersText }}人</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. 底部4个热门游戏 -->
    <div class="coming-soon-row">
      <div
        v-for="(game, index) in activeBannerGames"
        :key="index"
        class="coming-soon-small"
        @click="notifyNotLogin"
      >
        <img class="coming-soon-full-svg" :src="game.svg" alt="" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
  padding: 0 0.4rem 4rem;
  background: transparent;
  min-height: max-content;
  box-sizing: border-box;
  overscroll-behavior-y: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
/* ========== 0. 顶部栏 ========== */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.2rem 0 0;
  flex-shrink: 0;
}

.top-bar__logo {
  font-size: 0.54rem;
  font-weight: 900;
  color: #000;
  text-shadow: 0.5px 0 0 currentColor, -0.5px 0 0 currentColor, 0 0.5px 0 currentColor,
    0 -0.5px 0 currentColor;
  letter-spacing: 0.05rem;
  font-family: 'HONOR Sans CN', sans-serif;
}

.top-bar__actions {
  display: flex;
  gap: 0.1rem;
}

.top-bar__btn {
  border: none;
  border-radius: 0.56rem;
  font-size: 0.34rem;
  font-weight: 500;
  font-family: 'PingFang SC', sans-serif;
  cursor: pointer;
  padding: 0.18rem 0.75rem;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    opacity: 0.85;
  }
}

.top-bar__btn--register {
  background: rgba(174, 174, 174, 0.52);
  color: rgba(0, 0, 0, 0.82);
  box-shadow: 0.01rem 0.01rem 0.03rem rgba(0, 0, 0, 0.25);
  // outline: 0.01rem solid rgba(255, 255, 255, 0.5);
  outline-offset: -0.01rem;
  backdrop-filter: blur(0.14rem);
}

.top-bar__btn--login {
  background: linear-gradient(157deg, #05e7ae 0%, #027a5c 100%);
  color: #fff;
  // outline: 0.01rem solid rgba(255, 255, 255, 0.5);
  outline-offset: -0.01rem;
  backdrop-filter: blur(0.55rem);
}

/* ===== 1. 顶部 Header ===== */
.home-header {
  width: 100%;
  border-radius: 0.8rem;
  overflow: hidden;
  flex-shrink: 0;
}

.home-header-img {
  width: 100%;
  height: 3.68rem;
  object-fit: cover;
  display: block;
}

/* ===== 2. 公告栏 ===== */
.notice-bar {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  padding: 0rem 0.18rem;
  border-radius: 1rem;
  height: 0.5rem;
  min-height: 0.5rem;
  background: rgba(76, 76, 76, 0.3);
  position: relative;
  box-shadow:
    inset 1px 1px 0px 0px rgba(255, 255, 255, 0.35),
    inset -1px -1px 0px 0px rgba(255, 255, 255, 0.35);
}

.notice-icon {
  width: 0.43rem;
  height: 0.43rem;
  flex-shrink: 0;
}

.notice-marquee {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.notice-label {
  font-size: 0.28rem;
  color: #000;
  white-space: nowrap;
  flex-shrink: 0;
}

.notice-scroll {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.notice-track {
  align-items: center;
  min-width: max-content;
  white-space: nowrap;
}

.notice-item {
  font-size: 0.28rem;
  line-height: 0.6rem;
  color: #000;
  font-weight: 400;
  white-space: nowrap;
}

/* ===== 3. 俱乐部控件 ===== */
.club-panel {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 1rem;
  padding: 0.1rem 0.6rem;
  min-height: 1.54rem;
  gap: 0;
  box-shadow:
    inset 1px 1px 0px 0px rgba(255, 255, 255, 0.35),
    inset -1px -1px 0px 0px rgba(255, 255, 255, 0.35);
}

.club-left {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  flex: 1;
}

.club-service-row {
  display: flex;
  align-items: center;
  gap: 0.12rem;
}

.service-label {
  font-size: 0.3rem;
  color: #000;
}

.club-balance-row {
  display: flex;
  align-items: center;
  gap: 0.12rem;
}

.icon-sm {
  width: 0.4rem;
  height: 0.4rem;
  flex-shrink: 0;
}

.icon-eye {
  width: 0.453rem;
  height: 0.347rem;
}
.icon-eye,
.icon-refresh {
  cursor: pointer;
  margin-right: 0.1rem;
}

.balance-amount {
  font-size: 0.38rem;
  color: #000;
  font-weight: 500;
  text-align: center;
  min-width: 0.5rem;
}

.recharge-btn {
  width: 1.3rem;
  padding: 0.06rem 0rem;
  background: #e7e7e7;
  border: none;
  border-radius: 1rem;
  color: #000;
  font-size: 0.28rem;
  cursor: pointer;
  white-space: nowrap;
}

.club-divider {
  width: 0.02rem;
  height: 1.2rem;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 0.28rem;
  flex-shrink: 0;
}

.club-right {
  display: flex;
  align-items: center;
  gap: 0.28rem;
}

.contact-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.contact-icon {
  width: 0.8rem;
  height: 0.8rem;
  object-fit: contain;
}

.contact-label {
  font-size: 0.2rem;
  color: #000;
  text-align: center;
  max-width: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 4. 游戏模块 ===== */
.game-zones {
  display: flex;
  gap: 0.3rem;
}
.game-center-scroll {
  width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
.game-center-track {
  display: flex;
  gap: 0.15rem;
  // padding-bottom: 0.1rem;
  width: max-content;
}
.game-scroll-card {
  flex-shrink: 0;
  width: 2.95rem;
  height: 3.91rem;
  border-radius: 0.37rem;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background: #54b78d;
  // backdrop-filter: blur(0.11rem);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.26rem 0.2rem 0.2rem;
  box-sizing: border-box;

  &:active {
    opacity: 0.85;
  }
}

.game-card {
  position: relative;
  border-radius: 0.56rem;
  border: 0.02rem solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(6px);
  padding: 0.14rem 0.24rem 0.14rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  min-height: 2.69rem;
  max-width: 4.45rem;

  &:active {
    opacity: 0.85;
  }
}

/* ===== MTT Card ===== */
.game-card-mtt {
  overflow: hidden;
  background: none;
}

.mtt-bg-wrap {
  position: absolute;
  left: -3.808rem;
  top: -0.234rem;
  width: 9.847rem;
  height: 5.781rem;
  pointer-events: none;
}

.mtt-bg-main {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: none;
  display: block;
}

.mtt-bg-inner {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.mtt-bg-tex {
  position: absolute;
  left: 0;
  top: -8.19%;
  width: 116.04%;
  height: 116.38%;
  object-fit: cover;
  max-width: none;
  display: block;
}

.mtt-layer-base {
  position: absolute;
  inset: 0;
  background: rgba(71, 35, 25, 0.3);
  border-radius: 0.56rem;
  pointer-events: none;
  z-index: 1;
}

.mtt-layer-blur1 {
  position: absolute;
  backdrop-filter: blur(0.925rem);
  background: rgba(49, 35, 29, 0.81);
  border-radius: 1.057rem;
  pointer-events: none;
  z-index: 1;
  mask-image: radial-gradient(ellipse 35% 37% at 50% 50%, transparent 0%, black 100%);
  -webkit-mask-image: radial-gradient(ellipse 35% 37% at 50% 50%, transparent 0%, black 100%);
}

.mtt-layer-blur2 {
  position: absolute;
  inset: -0.894rem -0.723rem -0.687rem -0.818rem;
  backdrop-filter: blur(1.057rem);
  background: rgba(37, 25, 21, 0.93);
  border-radius: 1.057rem;
  border: 0.027rem solid #000;
  pointer-events: none;
  z-index: 1;
  mask-image: radial-gradient(ellipse 38% 40% at 50% 50%, transparent 0%, black 100%);
  -webkit-mask-image: radial-gradient(ellipse 38% 40% at 50% 50%, transparent 0%, black 100%);
}

.mtt-title-wrap {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 1.313rem;
  padding: 0.16rem 0.197rem;
  border-radius: 1.333rem;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  z-index: 2;
}

.mtt-title {
  font-size: 0.4rem;
  font-weight: 800;
  color: #fff;
  white-space: nowrap;
  line-height: 1;
}

.mtt-vector-icon {
  position: absolute;
  left: 4.028rem;
  top: 0.267rem;
  width: 0.24rem;
  height: 0.24rem;
  object-fit: contain;
  pointer-events: none;
  z-index: 2;
}

.mtt-online-bar {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 4.854rem;
  backdrop-filter: blur(0.037rem);
  background: rgba(56, 55, 55, 0.61);
  padding: 0.08rem 0.133rem;
  border-radius: 0.133rem;
  display: flex;
  gap: 0.133rem;
  align-items: center;
  white-space: nowrap;
  z-index: 2;
}

.mtt-bar-label {
  font-size: 0.213rem;
  color: #fff;
  line-height: 0.24rem;
  font-weight: 500;
}

.mtt-bar-group {
  display: flex;
  gap: 0.053rem;
  align-items: center;
  width: 0.853rem;
}

.mtt-table-rect {
  display: inline-block;
  width: 0.187rem;
  height: 0.107rem;
  background: #fff;
  border-radius: 50px;
  flex-shrink: 0;
}

.mtt-user-icon {
  width: 0.16rem;
  height: 0.187rem;
  flex-shrink: 0;
  object-fit: contain;
  display: block;
}

/* ===== Mini Game Card ===== */
.game-card-minigame {
  overflow: visible;
  background: rgba(148, 148, 148, 0.1);
}

.mg-title-wrap {
  position: absolute;
  left: 1.014rem;
  top: 1.094rem;
  padding: 0.16rem 0.197rem;
  border-radius: 1.333rem;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  z-index: 2;
}

.mg-title {
  font-size: 0.4rem;
  font-weight: 800;
  color: #fff;
  white-space: nowrap;
  line-height: 1;
}

.mg-mask-group {
  position: absolute;
  top: 8.94%;
  right: 6.7%;
  bottom: 81.16%;
  left: 86.25%;
  z-index: 2;
}

.mg-mask-inner {
  position: absolute;
  top: -7.14%;
  right: -6.07%;
  bottom: -7.14%;
  left: -6.07%;
}

.mg-mask-img {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: contain;
}

.mg-online-bar {
  position: absolute;
  left: 1.414rem;
  top: 2.134rem;
  padding: 0.08rem 0.133rem;
  border-radius: 0.133rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 2;
}

.mg-online-bg {
  position: absolute;
  inset: 0;
  background: rgba(199, 199, 199, 0.15);
  mix-blend-mode: plus-lighter;
  border-radius: 0.133rem;
  pointer-events: none;
}

.mg-online-content {
  position: relative;
  display: flex;
  gap: 0.133rem;
  align-items: flex-start;
  width: 100%;
}

.mg-bar-label {
  font-size: 0.213rem;
  color: #fff;
  line-height: 0.24rem;
  font-weight: 500;
  white-space: nowrap;
}

.mg-bar-group {
  display: flex;
  gap: 0.08rem;
  align-items: center;
  width: 0.853rem;
}

.mg-user-icon {
  width: 0.16rem;
  height: 0.187rem;
  flex-shrink: 0;
  object-fit: contain;
  display: block;
}

.mg-character-wrap {
  position: absolute;
  top: -12.06%;
  right: 76.76%;
  bottom: 45.39%;
  left: -3.52%;
  pointer-events: none;
  z-index: 1;
}

.mg-character-inner {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.mg-character-img {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
}

/* ===== Poker Card ===== */
.poker-card {
  flex: 1;
  min-height: 5.54rem;
  overflow: hidden;
  background: rgba(148, 148, 148, 0.1);
}

.pk-ip1-wrap {
  position: absolute;
  left: 0;
  top: 0.095rem;
  width: 4.479rem;
  height: 5.974rem;
  pointer-events: none;
}

.pk-ip1-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: none;
  pointer-events: none;
}

.pk-ip2-wrap {
  position: absolute;
  left: 0.008rem;
  top: 0.095rem;
  width: 4.479rem;
  height: 5.974rem;
  pointer-events: none;
  mask-image: url('@/assets/images/game_zone_poker_mask.png');
  -webkit-mask-image: url('@/assets/images/game_zone_poker_mask.png');
  mask-position: -0.225rem 4.572rem;
  -webkit-mask-position: -0.225rem 4.572rem;
  mask-size: 4.991rem 1.661rem;
  -webkit-mask-size: 4.991rem 1.661rem;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  mask-mode: alpha;
}

.pk-ip2-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: none;
  pointer-events: none;
}

.pk-title-wrap {
  position: absolute;
  left: 1.201rem;
  top: 0.241rem;
  padding: 0.16rem 0.197rem;
  border-radius: 1.333rem;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  z-index: 2;
}

.pk-title {
  font-size: 0.4rem;
  font-weight: 800;
  color: #fff;
  white-space: nowrap;
  line-height: 1;
}

.pk-vector-icon {
  position: absolute;
  left: 3.841rem;
  top: 0.241rem;
  width: 0.32rem;
  height: 0.267rem;
  object-fit: contain;
  pointer-events: none;
  z-index: 2;
}

.pk-online-bar {
  position: absolute;
  left: 0.854rem;
  top: 5.014rem;
  backdrop-filter: blur(0.037rem);
  background: rgba(56, 55, 55, 0.61);
  padding: 0.08rem 0.133rem;
  border-radius: 0.133rem;
  display: flex;
  gap: 0.133rem;
  align-items: center;
  white-space: nowrap;
  z-index: 2;
}

.pk-bar-label {
  font-size: 0.213rem;
  color: #fff;
  line-height: 0.24rem;
  font-weight: 500;
}

.pk-bar-stats {
  display: flex;
  gap: 0.133rem;
  align-items: center;
}

.pk-bar-group {
  display: flex;
  align-items: center;
  width: 0.853rem;
}

.pk-bar-group--table {
  gap: 0.053rem;
}
.pk-bar-group--people {
  gap: 0.08rem;
}

.pk-table-rect {
  display: inline-block;
  width: 0.187rem;
  height: 0.107rem;
  background: #fff;
  border-radius: 50px;
  flex-shrink: 0;
}

.pk-user-icon {
  width: 0.16rem;
  height: 0.187rem;
  flex-shrink: 0;
  object-fit: contain;
  display: block;
}

/* ===== Entertainment Card ===== */
.en-card {
  min-height: 2.7rem;
  overflow: hidden;
  background: none;
}

.en-bg1-wrap {
  position: absolute;
  left: -1.36rem;
  top: -2.08rem;
  width: 12.762rem;
  height: 7.493rem;
  pointer-events: none;
}

.en-bg1-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: none;
}

.en-bg2-wrap {
  position: absolute;
  left: 0;
  top: -2.826rem;
  width: 4.453rem;
  height: 6.667rem;
  pointer-events: none;
}

.en-bg2-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: none;
}

.en-base-overlay {
  position: absolute;
  inset: 0;
  border-radius: 0.56rem;
  z-index: 1;
}

.en-blur1 {
  position: absolute;
  border-radius: 1.057rem;
  pointer-events: none;
  z-index: 1;
  mask-image: radial-gradient(ellipse 35% 37% at 50% 50%, transparent 0%, black 100%);
  -webkit-mask-image: radial-gradient(ellipse 35% 37% at 50% 50%, transparent 0%, black 100%);
}

.en-blur2 {
  position: absolute;
  inset: -0.75rem -0.607rem -0.555rem -0.698rem;
  backdrop-filter: blur(1.057rem);
  -webkit-backdrop-filter: blur(1.057rem);
  background: rgba(37, 25, 21, 0.93);
  border-radius: 1.057rem;
  border: 0.027rem solid #000;
  pointer-events: none;
  z-index: 1;
  mask-image: radial-gradient(ellipse 38% 40% at 50% 50%, transparent 0%, black 100%);
  -webkit-mask-image: radial-gradient(ellipse 38% 40% at 50% 50%, transparent 0%, black 100%);
}

.en-title-wrap {
  position: absolute;
  left: 1.521rem;
  top: 1.094rem;
  padding: 0.16rem 0.197rem;
  border-radius: 1.333rem;
  z-index: 2;
  white-space: nowrap;
}

.en-title {
  font-size: 0.4rem;
  font-weight: 800;
  color: #fff;
}

.en-vector-icon {
  position: absolute;
  left: 4.028rem;
  top: 0.267rem;
  width: 0.24rem;
  height: 0.24rem;
  z-index: 2;
}

.en-online-bar {
  position: absolute;
  left: 1.361rem;
  top: 2.107rem;
  padding: 0.08rem 0.133rem;
  border-radius: 0.133rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 2;
}

.en-online-bg {
  position: absolute;
  inset: 0;
  background: rgba(199, 199, 199, 0.15);
  mix-blend-mode: plus-lighter;
  border-radius: 0.133rem;
  pointer-events: none;
}

.en-online-content {
  position: relative;
  display: flex;
  gap: 0.133rem;
  align-items: flex-start;
}

.en-bar-label {
  font-size: 0.213rem;
  color: #fff;
  line-height: 0.24rem;
  font-weight: 500;
}

.en-bar-group {
  display: flex;
  gap: 0.08rem;
  align-items: center;
  width: 0.853rem;
}

.en-user-icon {
  width: 0.16rem;
  height: 0.187rem;
  flex-shrink: 0;
  object-fit: contain;
}

/* ===== 5. 底部4个热门游戏 ===== */
.coming-soon-row {
  display: flex;
  gap: 0.15rem;
  padding-bottom: 0.1rem;
  width: max-content;
}

.coming-soon-scroll-card {
  flex-shrink: 0;
  width: 2.95rem;
  height: 3.91rem;
  border-radius: 0.51rem;
  overflow: hidden;
  aspect-ratio: 81 / 86;
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.coming-soon-full-svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
