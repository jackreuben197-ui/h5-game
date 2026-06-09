<script setup lang="ts">
import homeHeaderFallback from '@/assets/images/home_header_2.png'
import { t } from '@/i18n'
import { useLoginModalStore } from '@/stores/loginModal'

import imgPa from '@/assets/images/minigame-newui/pa.svg'
import imgMahjong from '@/assets/images/minigame-newui/ma.svg'
import imgFb from '@/assets/images/minigame-newui/fb.svg'
import imgCowboy from '@/assets/images/minigame-newui/sg.svg'

const loginModalStore = useLoginModalStore()

const clubBannerUrl = homeHeaderFallback
const noticeText = '欢迎来到德州扑克，登录后体验更多精彩内容'
const clubNameText = '俱乐部'
const clubGoldText = '0'
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
          <img class="icon-sm" src="@/assets/icons/diamondicon.svg" alt="余额" />
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
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

/* ===== 1. 顶部 Header ===== */
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

/* ===== 2. 公告栏 ===== */
.notice-bar {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  padding: 0rem 0.18rem;
  border-radius: 505.114px;
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

/* ===== 3. 俱乐部控件 ===== */
.club-panel {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.17);
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
  background: rgba(37, 37, 37, 0.49);
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

/* ===== 4. 游戏模块 ===== */
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
