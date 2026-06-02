<script setup lang="ts">
import homeHeaderFallback from '@/assets/images/home_header_1.png'
import { t } from '@/i18n'
import { useLoginModalStore } from '@/stores/loginModal'

const loginModalStore = useLoginModalStore()

const clubBannerUrl = homeHeaderFallback
const noticeText = '欢迎来到德州扑克，登录后体验更多精彩内容'
const clubNameText = '俱乐部'
const clubGoldText = '0'
const pokerTablesText = '0'
const pokerPlayersText = '0'
const miniGamePlayersText = '0'
const mahjongTablesText = '0'
const mahjongPlayersText = '0'
const mttTablesText = '0'
const mttPlayersText = '0'
const balanceVisible = true

function notifyNotLogin(): void {
  loginModalStore.open()
}
</script>

<template>
  <div class="home-page">
    <!-- 1. 顶部俱乐部介绍图 -->
    <div class="home-header">
      <img class="home-header-img" :src="clubBannerUrl" alt="俱乐部介绍" />
    </div>

    <!-- 2. 公告栏 -->
    <div class="notice-bar">
      <img class="notice-icon" src="@/assets/icons/icon_notice.png" alt="公告" />
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
            src="@/assets/icons/icon_eye_open.png"
            alt="显示/隐藏"
            @click="notifyNotLogin"
          />
        </div>
        <div class="club-balance-row">
          <img class="icon-sm" src="@/assets/icons/icon_chips.png" alt="余额" />
          <span class="balance-amount">
            {{ balanceVisible ? clubGoldText : '****' }}
          </span>
          <img
            class="icon-sm icon-refresh"
            src="@/assets/icons/icon_refresh.png"
            alt="刷新"
            @click="notifyNotLogin"
          />
          <button class="recharge-btn" @click="notifyNotLogin">
            {{ t('OpCodeString_RECHARGE') }}
          </button>
        </div>
      </div>

      <div class="club-divider"></div>

      <div class="club-right">
        <div class="contact-item" @click="notifyNotLogin">
          <img class="contact-icon" src="@/assets/icons/icon_service_1.png" alt="Telegram" />
          <span class="contact-label"> @game </span>
        </div>
        <div class="contact-item" @click="notifyNotLogin">
          <img class="contact-icon" src="@/assets/icons/icon_service_2.png" alt="邮箱" />
          <span class="contact-label"> {{ $txt('UISetting_SecurityBindEmailItem') }} </span>
        </div>
        <div class="contact-item" @click="notifyNotLogin">
          <img class="contact-icon" src="@/assets/icons/icon_service_3.png" alt="IM客服" />
          <span class="contact-label"> {{ $txt('UIMineMain01') }} </span>
        </div>
      </div>
    </div>

    <!-- 4. 游戏模块 -->
    <div class="game-zones">
      <div class="game-zone-left">
        <!-- 麻将专区 -->
        <div class="game-card game-card-mahjong" @click="notifyNotLogin">
          <img
            class="zone-lg-icon zone-lg-icon-mahjong"
            src="@/assets/icons/game_zone_mahjong_lg.png"
            alt="麻将"
          />
          <img class="zone-mini-icon" src="@/assets/icons/game_zone_mahjong_mini.png" alt="" />
          <div class="zone-info">
            <span class="zone-title"> {{ t('UIHomeMahjongArea') }} </span>
            <p class="zone-desc">
              <span class="mr-4"> {{ t('Mahjong_BloodFight') }}</span>
              <span class="mr-4"> {{ t('Mahjong_BloodRiver') }}</span>
              <span class="mr-4"> {{ t('Mahjong_Standard') }}</span>
            </p>
            <p class="zone-sub-desc">{{ t('UIHomeMahjongAreaTip') }}</p>
          </div>
          <div class="zone-online-bar">
            <span class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
            <img class="online-icon" src="@/assets/icons/game_zone_table_mini.png" alt="" />
            <span class="online-num"> {{ mahjongTablesText }} </span>
            <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
            <span class="online-num"> {{ mahjongPlayersText }} </span>
          </div>
        </div>

        <!-- MTT赛事专区 -->
        <div class="game-card game-card-mtt" @click="notifyNotLogin">
          <img
            class="zone-lg-icon zone-lg-icon-mtt"
            src="@/assets/icons/game_zone_mtt_lg.png"
            alt="MTT"
          />
          <img class="zone-mini-icon" src="@/assets/icons/game_zone_mtt_mini.png" alt="" />
          <div class="zone-info">
            <span class="zone-title"> {{ t('UIHomeMttArea') }} </span>
            <p class="zone-desc">
              <span>{{ t('UIHomeMttPokerTip') }}</span>
              <span>{{ t('UIHomeMttMahjongTip') }}</span>
            </p>
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

        <!-- 小游戏专区 -->
        <div class="game-card game-card-minigame" @click="notifyNotLogin">
          <img
            class="zone-lg-icon zone-lg-icon-minigame"
            src="@/assets/icons/game_zone_minigame_lg.png"
            alt="小游戏"
          />
          <img class="zone-mini-icon" src="@/assets/icons/game_zone_minigame_mini.png" alt="" />
          <div class="zone-info">
            <span class="zone-title"> {{ t('UIHomeMinigameArea') }} </span>
            <p class="zone-desc">{{ t('UIData_YGvXd5iXr_011') }}</p>
          </div>
          <div class="zone-online-bar">
            <span class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
            <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
            <span class="online-num"> {{ miniGamePlayersText }} </span>
          </div>
        </div>
      </div>

      <div class="game-zone-right">
        <!-- 扑克专区 -->
        <div class="game-card poker-card" @click="notifyNotLogin">
          <img class="poker-bg" src="@/assets/images/home_game_zone_poker.png" alt="扑克背景" />
          <div class="poker-overlay"></div>
          <img
            class="zone-mini-icon poker-mini"
            src="@/assets/icons/game_zone_poker_mini.png"
            alt=""
          />
          <div class="zone-info poker-info">
            <span class="zone-title"> {{ t('UIHomePokerArea') }} </span>
            <div class="poker-desc-area">
              <p class="zone-sub-desc text-left">{{ t('UITexasRule_texas') }}</p>
              <p class="zone-sub-desc text-right">{{ t('UITexasRule_omaha') }}</p>
              <p class="zone-sub-desc text-left">{{ t('PokerType_2') }}</p>
              <p class="zone-sub-desc">{{ t('UIHomeMahjongAreaTip') }}</p>
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

        <!-- 即将开放 -->
        <div class="game-card coming-soon-card coming-soon-right" @click="notifyNotLogin">
          <img
            class="coming-soon-bg"
            src="@/assets/images/home_comming_soon_1.png"
            alt="即将开放"
          />
          <div class="coming-soon-overlay"></div>
          <span class="coming-soon-text"> {{ t('UIHomeComingSoon') }}</span>
        </div>
      </div>
    </div>

    <!-- 5. 底部4个即将开放 -->
    <div class="coming-soon-row">
      <div v-for="i in 4" :key="i" class="coming-soon-small" @click="notifyNotLogin">
        <img
          class="coming-soon-small-bg"
          src="@/assets/images/home_comming_soon_2.png"
          alt="即将开放"
        />
        <div class="coming-soon-small-overlay"></div>
        <span class="coming-soon-small-text"> {{ t('UIHomeComingSoon') }}</span>
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
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.home-header {
  width: 100%;
  border-radius: 0.42rem;
  overflow: hidden;
  flex-shrink: 0;
}

.home-header-img {
  width: 100%;
  height: 3.7rem;
  object-fit: cover;
  display: block;
}

.notice-bar {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  padding: 0rem 0.18rem;
  background: rgba(0, 0, 0, 0.22);
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
  color: #fff;
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
  display: inline-flex;
  align-items: center;
  min-width: max-content;
  white-space: nowrap;
}

.notice-item {
  font-size: 0.28rem;
  color: rgba(255, 255, 255, 1);
  font-weight: 400;
  white-space: nowrap;
}

.club-panel {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.17);
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
  color: #fff;
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
  color: #fff;
  font-weight: 500;
  text-align: center;
  min-width: 0.5rem;
}

.recharge-btn {
  width: 1.3rem;
  padding: 0.06rem 0rem;
  background: rgba(93, 4, 40, 0.25);
  border: none;
  border-radius: 1rem;
  color: #fff;
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
  color: #fff;
  text-align: center;
  max-width: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-zones {
  display: flex;
  gap: 0.3rem;
}

.game-zone-left {
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
  flex: 1;
}

.game-zone-right {
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
  flex: 1;
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

.zone-lg-icon {
  position: absolute;
  object-fit: contain;
  pointer-events: none;
  z-index: 3;
}
.game-card-mahjong {
  background: url('@/assets/images/home_left_card_bg_1.png') center/cover no-repeat;
}
.game-card-mtt {
  background: url('@/assets/images/home_left_card_bg_2.png') center/cover no-repeat;
}
.game-card-minigame {
  overflow: hidden;
  background: url('@/assets/images/home_left_card_bg_3.png') center/cover no-repeat;
}
.zone-lg-icon-mahjong {
  width: 1.8rem;
  height: 1.7rem;
  left: -0.45rem;
  top: -0.55rem;
}
.zone-lg-icon-mtt {
  width: 0.96rem;
  height: 0.96rem;
  left: -0.05rem;
  top: -0.2rem;
  bottom: 0.26rem;
}
.zone-lg-icon-minigame {
  width: 1.4rem;
  height: 1.6rem;
  left: -0.05rem;
  bottom: -0.1rem;
}

.zone-mini-icon {
  position: absolute;
  top: 0.26rem;
  right: 0.24rem;
  width: 0.35rem;
  height: 0.27rem;
  object-fit: contain;
}

.zone-info {
  text-align: center;
}

.zone-title {
  font-size: 0.4rem;
  font-weight: 800;
  color: #fff;
  display: block;
  margin-bottom: 0.4rem;
}
.poker-desc-area {
  height: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
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
  background: rgba(200, 200, 200, 0.25);
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

.poker-card {
  flex: 1;
  min-height: 5.54rem;
  overflow: hidden;
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

.coming-soon-row {
  display: flex;
  gap: 0.12rem;
}

.coming-soon-small {
  position: relative;
  flex: 1;
  width: 2.165rem;
  height: 2.293rem;
  border-radius: 0.5rem;
  overflow: hidden;
  aspect-ratio: 81 / 86;
}

.coming-soon-small-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.coming-soon-small-overlay {
  position: absolute;
  inset: 0;
}

.coming-soon-small-text {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 0.293rem;
  font-weight: 400;
  color: #fff;
}
</style>
