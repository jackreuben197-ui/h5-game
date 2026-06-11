<script setup lang="ts">
import homeHeaderFallback from '@/assets/images/home_header_1.png'
import { t } from '@/i18n'
import { useLoginModalStore } from '@/stores/loginModal'
import { useUserInfoStore } from '@/stores/userInfo'
import { useCachedImage } from '@/utils/imageCache'
import { computed, onMounted } from 'vue'

const loginModalStore = useLoginModalStore()
const userInfoStore = useUserInfoStore()

const clubBannerUrl = useCachedImage(
  () => userInfoStore.channelDefaultClub?.banner || homeHeaderFallback,
)
const clubNameText = computed<string>(() => userInfoStore.channelDefaultClub?.club_name || '俱乐部')
const noticeText = '欢迎来到德州扑克，登录后体验更多精彩内容'
const clubGoldText = '0.00'
const pokerTablesText = '0'
const pokerPlayersText = '0'
const miniGamePlayersText = '0'
const mahjongTablesText = '0'
const mahjongPlayersText = '0'
const mttTablesText = '0'
const mttPlayersText = '0'
const balanceVisible = true

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
          <img class="icon-sm" src="@/assets/icons/icon_chips.png" alt="余额" />
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
    <div class="section-header">
      <span class="section-title">游戏中心</span>
    </div>
    <div class="game-center-scroll">
      <div class="game-center-track">
        <!-- MTT赛事专区 -->
        <div class="game-scroll-card game-card-mtt" @click="notifyNotLogin">
          <img class="zone-lg-bg" src="@/assets/icons/game_zone_mtt_lg.png" alt="MTT" />

          <div class="zone-info">
            <div class="zone-header">
              <span class="zone-title"> {{ t('UIHomeMttArea') }} </span>
              <img class="zone-mini-icon" src="@/assets/icons/game_zone_mtt_mini.png" alt="" />
            </div>
            <div class="zone-desc">
              <span>{{ t('UIHomeMttPokerTip') }}</span>
            </div>
            <p class="zone-sub-desc">{{ t('UIHomeMttAreaTip') }}</p>
          </div>
          <div class="zone-online-bar">
            <span class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
            <img class="online-icon" src="@/assets/icons/game_zone_table_mini.png" alt="" />
            <span class="online-num"> {{ mttTablesText }} </span>
            <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
            <span class="online-num"> {{ mttPlayersText }} </span>
          </div>
        </div>

        <!-- 扑克专区 -->
        <div class="game-scroll-card poker-card" @click="notifyNotLogin">
          <img class="zone-lg-bg" src="@/assets/icons/game_zone_poker_lg.png" alt="MTT" />
          <div class="poker-overlay"></div>

          <div class="zone-info poker-info">
            <div class="zone-header">
              <span class="zone-title"> {{ t('UIHomePokerArea') }} </span>
              <img
                class="zone-mini-icon poker-mini"
                src="@/assets/icons/game_zone_poker_mini.png"
                alt=""
              />
            </div>
            <div class="poker-desc-area">
              <p class="zone-sub-desc">{{ t('UITexasRule_texas') }}</p>
              <p class="zone-sub-desc">{{ t('UITexasRule_omaha') }}</p>
              <p class="zone-sub-desc">{{ t('PokerType_2') }}</p>
            </div>
          </div>
          <div class="zone-online-bar">
            <span class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
            <img class="online-icon" src="@/assets/icons/game_zone_table_mini.png" alt="" />
            <span class="online-num"> {{ pokerTablesText }} </span>
            <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
            <span class="online-num"> {{ pokerPlayersText }} </span>
          </div>
        </div>

        <!-- 小游戏专区 -->
        <div class="game-scroll-card game-card-minigame" @click="notifyNotLogin">
          <img class="zone-lg-bg" src="@/assets/icons/game_zone_minigame_lg.png" alt="小游戏" />
          <div class="zone-info">
            <div class="zone-header">
              <span class="zone-title"> {{ t('UIHomeMinigameArea') }} </span>
              <img class="zone-mini-icon" src="@/assets/icons/game_zone_minigame_mini.png" alt="" />
            </div>
            <p class="zone-desc">{{ t('UIData_YGvXd5iXr_011') }}</p>
          </div>
          <div class="zone-online-bar">
            <span class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
            <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
            <span class="online-num"> {{ miniGamePlayersText }} </span>
          </div>
        </div>
        <!-- 麻将专区 -->
        <div class="game-scroll-card game-card-mahjong" @click="notifyNotLogin">
          <img class="zone-lg-bg" src="@/assets/icons/game_zone_mahjong_lg.png" alt="麻将" />
          <div class="zone-info">
            <div class="zone-header">
              <span class="zone-title"> {{ t('UIHomeMahjongArea') }} </span>
              <img class="zone-mini-icon" src="@/assets/icons/game_zone_mahjong_mini.png" alt="" />
            </div>
            <div class="zone-desc">
              <div class="mr-4">{{ t('Mahjong_BloodFight') }}</div>
              <div class="mr-4">{{ t('Mahjong_BloodRiver') }}</div>
              <div class="mr-4">{{ t('Mahjong_Standard') }}</div>
            </div>
          </div>
          <div class="zone-online-bar">
            <span class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
            <img class="online-icon" src="@/assets/icons/game_zone_table_mini.png" alt="" />
            <span class="online-num"> {{ mahjongTablesText }} </span>
            <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
            <span class="online-num"> {{ mahjongPlayersText }} </span>
          </div>
        </div>
        <!-- 即将开放 -->
        <div class="game-scroll-card coming-soon-card coming-soon-right" @click="notifyNotLogin">
          <img class="zone-lg-bg" src="@/assets/icons/game_zone_comming_lg.png" alt="MTT" />
          <div class="coming-soon-overlay"></div>
          <span class="coming-soon-text"> {{ t('UIHomeComingSoon') }}</span>
        </div>
      </div>
    </div>
    <!-- 5. 即将开放横向滚动 -->
    <div class="section-header">
      <span class="section-title">热门游戏</span>
    </div>
    <div class="coming-soon-scroll">
      <div class="coming-soon-track">
        <div v-for="i in 4" :key="i" class="coming-soon-scroll-card" @click="notifyNotLogin">
          <div class="coming-soon-scroll-card__overlay"></div>
          <span class="coming-soon-scroll-card__text">{{ t('UIHomeComingSoon') }}</span>
        </div>
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

.notice-bar {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  padding: 0rem 0.18rem;
  // background: rgba(0, 0, 0, 0.22);
  background-color: #fff;
  border-radius: 1rem;
  height: 0.5rem;
  min-height: 0.5rem;
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

.club-panel {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 1rem;
  padding: 0.1rem 0.6rem;
  min-height: 1.54rem;
  gap: 0;
  box-shadow: inset 1px 1px 0px 0px rgba(255, 255, 255, 0.35),
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

.section-header {
  padding: 0.12rem 0 0;
  .section-title {
    font-size: 0.38rem;
    font-weight: 700;
    margin-bottom: 0rem;
    color: #000;
    font-family: 'HONOR Sans CN', sans-serif;
  }
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

.zone-lg-bg {
  position: absolute;
  // object-fit: contain;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.zone-mini-icon {
  margin-top: 0.08rem;
  width: 0.3rem;
  height: 0.3rem;
}

.zone-info {
  z-index: 1;
  .zone-header {
    display: flex;
    justify-content: space-between;
  }
}

.zone-title {
  font-size: 0.33rem;
  font-weight: 800;
  color: #fff;
  display: block;
  margin-bottom: 0.1rem;
}

.zone-desc {
  font-size: 0.22rem;
  font-weight: 400;
  color: #fff;
  margin: 0;
  line-height: 1.5;
}

.zone-sub-desc {
  font-size: 0.22rem;
  font-weight: 400;
  color: #fff;
  margin: 0.06rem 0 0;
}

.zone-online-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  background: rgba(56, 55, 55, 0.61);
  border-radius: 1rem;
  padding: 0.06rem 0.2rem;
  margin-top: 0.18rem;
  height: 0.4rem;
  width: 100%;
  z-index: 2;
}

.online-text {
  font-size: 0.22rem;
  color: #fff;
}

.online-icon {
  width: 0.22rem;
  height: 0.22rem;
  margin-left: 0.1rem;
  object-fit: contain;
}

.online-num {
  font-size: 0.22rem;
  color: #fff;
}

.poker-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poker-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.poker-mini {
  z-index: 1;
}

.poker-info {
  position: relative;
  z-index: 1;
  padding-left: 0;
  flex: 1;
}

.coming-soon-card {
  min-height: 2.7rem;
  padding: 0;
}

.coming-soon-right {
  position: relative;
  border-radius: 0.56rem;
  overflow: hidden;
}

.coming-soon-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.coming-soon-overlay {
  position: absolute;
  inset: 0;
}

.coming-soon-text {
  position: relative;
  z-index: 1;
  display: block;
  text-align: center;
  font-size: 0.36rem;
  font-weight: 700;
  color: #fff;
  margin: auto;
  padding: 1rem 0;
  width: 100%;
}

/* ========== 5. 即将开放横向滚动 ========== */
.coming-soon-scroll {
  width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.coming-soon-track {
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
  position: relative;
  cursor: pointer;
  border: 0.01rem solid rgba(249, 249, 249, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    opacity: 0.85;
  }
}

.coming-soon-scroll-card__overlay {
  position: absolute;
  inset: 0;
  background: url('@/assets/images/home_comming_soon_2.png') center / cover no-repeat;
  border-radius: inherit;
}

.coming-soon-scroll-card__text {
  position: relative;
  z-index: 1;
  font-size: 0.29rem;
  font-weight: 500;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
}
</style>
