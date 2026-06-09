<script setup lang="ts">
defineOptions({
  name: 'HomeStaticPreview',
})
</script>

<template>
  <div class="home-page">
    <div class="home-header">
      <img class="home-header-img" src="@/assets/images/home_header_1.png" alt="俱乐部介绍" />
    </div>

    <div class="notice-bar">
      <img class="notice-icon" src="@/assets/icons/icon_notice.png" alt="公告" />
      <div class="notice-marquee">
        <span class="notice-label mr-4">系统公告:</span>
        <div class="notice-scroll">
          <div class="notice-track">
            <span class="notice-item">
              周末冠军赛火热开启，俱乐部福利同步升级，欢迎进入专区体验全新玩法。
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="club-panel">
      <div class="club-left">
        <div class="club-service-row">
          <span class="service-label">星河俱乐部</span>
          <img class="icon-sm icon-eye" src="@/assets/icons/icon_eye_open.png" alt="显示" />
        </div>
        <div class="club-balance-row">
          <img class="icon-sm" src="@/assets/icons/icon_chips.png" alt="余额" />
          <span class="balance-amount">23840</span>
          <img class="icon-sm icon-refresh" src="@/assets/icons/icon_refresh.png" alt="刷新" />
          <button class="recharge-btn">充值</button>
        </div>
      </div>

      <div class="club-divider"></div>

      <div class="club-right">
        <div class="contact-item">
          <img class="contact-icon" src="@/assets/icons/icon_service_1.png" alt="Telegram" />
          <span class="contact-label">@game</span>
        </div>
        <div class="contact-item">
          <img class="contact-icon" src="@/assets/icons/icon_service_2.png" alt="邮箱" />
          <span class="contact-label">邮箱</span>
        </div>
        <div class="contact-item">
          <img class="contact-icon" src="@/assets/icons/icon_service_3.png" alt="客服" />
          <span class="contact-label">在线客服</span>
        </div>
      </div>
    </div>

    <div class="game-zones">
      <div class="game-zone-left">
        <div class="game-card game-card-mahjong">
          <img
            class="zone-lg-icon zone-lg-icon-mahjong"
            src="@/assets/icons/game_zone_mahjong_lg.png"
            alt="麻将"
          />
          <img class="zone-mini-icon" src="@/assets/icons/game_zone_mahjong_mini.png" alt="" />
          <div class="zone-info">
            <span class="zone-title">麻将专区</span>
            <p class="zone-desc">
              <span class="mr-4">血战到底</span>
              <span class="mr-4">血流成河</span>
              <span class="mr-4">经典玩法</span>
            </p>
            <p class="zone-sub-desc">好友切磋，轻松开局，热闹不停。</p>
          </div>
          <div class="zone-online-bar">
            <span class="online-text">在线</span>
            <img class="online-icon" src="@/assets/icons/game_zone_table_mini.png" alt="" />
            <span class="online-num">12</span>
            <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
            <span class="online-num">286</span>
          </div>
        </div>

        <div class="game-card game-card-mtt">
          <img
            class="zone-lg-icon zone-lg-icon-mtt"
            src="@/assets/icons/game_zone_mtt_lg.png"
            alt="MTT"
          />
          <img class="zone-mini-icon" src="@/assets/icons/game_zone_mtt_mini.png" alt="" />
          <div class="zone-info">
            <span class="zone-title">MTT赛事</span>
            <p class="zone-desc">
              <span>日常赛</span>
              <span>赏金赛</span>
            </p>
            <p class="zone-sub-desc">多档位赛事全天开放，随时加入争夺榜单。</p>
          </div>
          <div class="zone-online-bar">
            <span class="online-text">在线</span>
            <img class="online-icon" src="@/assets/icons/game_zone_table_mini.png" alt="" />
            <span class="online-num">8</span>
            <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
            <span class="online-num">164</span>
          </div>
        </div>

        <div class="game-card game-card-minigame">
          <img
            class="zone-lg-icon zone-lg-icon-minigame"
            src="@/assets/icons/game_zone_minigame_lg.png"
            alt="小游戏"
          />
          <img class="zone-mini-icon" src="@/assets/icons/game_zone_minigame_mini.png" alt="" />
          <div class="zone-info">
            <span class="zone-title">小游戏</span>
            <p class="zone-desc">轻量上手，快节奏开玩，随时来一局。</p>
          </div>
          <div class="zone-online-bar">
            <span class="online-text">在线</span>
            <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
            <span class="online-num">96</span>
          </div>
        </div>
      </div>

      <div class="game-zone-right">
        <div class="game-card poker-card">
          <img class="poker-bg" src="@/assets/images/game_zone_poker_ip2.png" alt="扑克背景" />
          <div class="poker-overlay"></div>
          <img
            class="zone-mini-icon poker-mini"
            src="@/assets/icons/game_zone_poker_mini.png"
            alt=""
          />
          <div class="zone-info poker-info">
            <span class="zone-title">扑克专区</span>
            <div class="poker-desc-area">
              <p class="zone-sub-desc text-left">德州经典局</p>
              <p class="zone-sub-desc text-right">奥马哈冲刺局</p>
              <p class="zone-sub-desc text-left">6+短牌对战</p>
              <p class="zone-sub-desc">高手同桌，随开随玩。</p>
            </div>
          </div>
          <div class="zone-online-bar">
            <span class="online-text">在线</span>
            <img class="online-icon" src="@/assets/icons/game_zone_table_mini.png" alt="" />
            <span class="online-num">32</span>
            <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
            <span class="online-num">508</span>
          </div>
        </div>

        <div class="game-card coming-soon-card coming-soon-right">
          <img
            class="coming-soon-bg"
            src="@/assets/images/home_comming_soon_1.png"
            alt="即将开放"
          />
          <div class="coming-soon-overlay">
            <span class="coming-soon-text">即将开放</span>
          </div>
        </div>
      </div>
    </div>

    <div class="coming-soon-row">
      <div class="coming-soon-small">
        <img
          class="coming-soon-small-bg"
          src="@/assets/images/home_comming_soon_2.png"
          alt="即将开放"
        />
        <div class="coming-soon-small-overlay"></div>
        <span class="coming-soon-small-text">即将开放</span>
      </div>
      <div class="coming-soon-small">
        <img
          class="coming-soon-small-bg"
          src="@/assets/images/home_comming_soon_2.png"
          alt="即将开放"
        />
        <div class="coming-soon-small-overlay"></div>
        <span class="coming-soon-small-text">即将开放</span>
      </div>
      <div class="coming-soon-small">
        <img
          class="coming-soon-small-bg"
          src="@/assets/images/home_comming_soon_2.png"
          alt="即将开放"
        />
        <div class="coming-soon-small-overlay"></div>
        <span class="coming-soon-small-text">即将开放</span>
      </div>
      <div class="coming-soon-small">
        <img
          class="coming-soon-small-bg"
          src="@/assets/images/home_comming_soon_2.png"
          alt="即将开放"
        />
        <div class="coming-soon-small-overlay"></div>
        <span class="coming-soon-small-text">即将开放</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  --page-pad-x: clamp(0.28rem, 2.7vw, 0.4rem);
  --page-pad-top: clamp(0rem, 0.35vh, 0.08rem);
  --page-pad-bottom: 0rem;
  --page-gap: clamp(0.12rem, 0.95vh, 0.22rem);
  --column-gap: clamp(0.14rem, 1.25vw, 0.26rem);
  --card-gap: clamp(0.1rem, 0.85vh, 0.15rem);
  --card-pad-x: clamp(0.16rem, 1.6vw, 0.24rem);
  --card-pad-y: clamp(0.11rem, 0.8vh, 0.14rem);
  --header-height: clamp(1.62rem, 16.2vh, 3.28rem);
  --notice-height: clamp(0.42rem, 4vh, 0.5rem);
  --panel-height: clamp(1.02rem, 9.8vh, 1.54rem);
  --bottom-row-height: clamp(1.24rem, 10vh, 1.8rem);
  --bottom-card-inset: clamp(0.01rem, 0.18vh, 0.03rem);
  --bottom-card-radius: clamp(0.2rem, 2vw, 0.5rem);
  --radius-xl: clamp(0.3rem, 3vw, 0.56rem);
  --radius-lg: clamp(0.24rem, 2.4vw, 0.42rem);
  --title-size: clamp(0.3rem, 1.75vh, 0.4rem);
  --body-size: clamp(0.19rem, 1.1vh, 0.22rem);
  --meta-size: clamp(0.17rem, 0.98vh, 0.2rem);
  --balance-size: clamp(0.3rem, 1.7vh, 0.38rem);
  --notice-size: clamp(0.21rem, 1.28vh, 0.28rem);
  display: grid;
  grid-template-rows:
    var(--header-height)
    var(--notice-height)
    var(--panel-height)
    minmax(0, 1fr)
    var(--bottom-row-height);
  row-gap: var(--page-gap);
  padding: var(--page-pad-top) var(--page-pad-x) var(--page-pad-bottom);
  height: 100%;
  min-height: 100%;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
  overflow: hidden;
}

.home-header {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 100%;
  border-radius: clamp(0.22rem, 2vw, 0.42rem);
  overflow: hidden;
  flex-shrink: 0;
}

.home-header-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.notice-bar {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  padding: 0 clamp(0.12rem, 1.6vw, 0.18rem);
  background: rgba(0, 0, 0, 0.22);
  border-radius: 1rem;
  height: 100%;
  min-height: 0;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.notice-icon {
  width: clamp(0.3rem, 2.8vh, 0.43rem);
  height: clamp(0.3rem, 2.8vh, 0.43rem);
  flex-shrink: 0;
}

.notice-marquee {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.notice-label {
  font-size: var(--notice-size);
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
  font-size: var(--notice-size);
  color: #fff;
  font-weight: 400;
  white-space: nowrap;
}

.club-panel {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.17);
  border-radius: 1rem;
  padding: clamp(0.06rem, 0.5vh, 0.1rem) clamp(0.22rem, 2vw, 0.52rem);
  min-height: 0;
  height: 100%;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  gap: 0;
  box-shadow: inset 1px 1px 0px 0px rgba(255, 255, 255, 0.35),
    inset -1px -1px 0px 0px rgba(255, 255, 255, 0.35);
}

.club-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(0.05rem, 0.7vh, 0.12rem);
  flex: 1;
  min-width: 0;
}

.club-service-row {
  display: flex;
  align-items: center;
  gap: 0.12rem;
  min-width: 0;
}

.service-label {
  font-size: clamp(0.23rem, 1.38vh, 0.3rem);
  color: #fff;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.club-balance-row {
  display: flex;
  align-items: center;
  gap: clamp(0.05rem, 0.6vh, 0.1rem);
  flex-wrap: nowrap;
  min-width: 0;
}

.icon-sm {
  width: clamp(0.26rem, 1.8vh, 0.4rem);
  height: clamp(0.26rem, 1.8vh, 0.4rem);
  flex-shrink: 0;
}

.icon-eye {
  width: clamp(0.3rem, 2vh, 0.453rem);
  height: clamp(0.23rem, 1.55vh, 0.347rem);
}

.icon-eye,
.icon-refresh {
  margin-right: 0.1rem;
}

.balance-amount {
  font-size: var(--balance-size);
  color: #fff;
  font-weight: 500;
  text-align: center;
  min-width: clamp(1.08rem, 17vw, 1.5rem);
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recharge-btn {
  width: clamp(0.94rem, 13vw, 1.3rem);
  padding: clamp(0.03rem, 0.38vh, 0.06rem) 0;
  background: rgba(93, 4, 40, 0.25);
  border: none;
  border-radius: 1rem;
  color: #fff;
  font-size: clamp(0.21rem, 1.18vh, 0.28rem);
  white-space: nowrap;
}

.club-divider {
  width: 0.02rem;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 clamp(0.14rem, 1.3vw, 0.24rem);
  flex-shrink: 0;
}

.club-right {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: center;
  gap: clamp(0.08rem, 0.9vw, 0.2rem);
  min-width: 0;
  flex: 0 1 auto;
}

.contact-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(0.04rem, 0.5vh, 0.1rem);
  min-width: 0;
}

.contact-icon {
  width: clamp(0.46rem, 3.6vh, 0.8rem);
  height: clamp(0.46rem, 3.6vh, 0.8rem);
  object-fit: contain;
}

.contact-label {
  font-size: var(--meta-size);
  color: #fff;
  text-align: center;
  max-width: clamp(0.74rem, 11vw, 1rem);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-zones {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--column-gap);
  min-height: 0;
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.game-zone-left {
  display: grid;
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: var(--card-gap);
  min-height: 0;
  min-width: 0;
}

.game-zone-right {
  display: grid;
  grid-template-rows: minmax(0, 2fr) minmax(0, 1fr);
  gap: var(--card-gap);
  min-height: 0;
  min-width: 0;
}

.game-card {
  position: relative;
  border-radius: var(--radius-xl);
  border: 0.02rem solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(6px);
  padding: var(--card-pad-y) var(--card-pad-x);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 0;
  height: 100%;
  max-width: none;
  min-width: 0;
  width: 100%;
  overflow: hidden;
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
  width: clamp(1.12rem, 9.8vh, 1.8rem);
  height: clamp(1.06rem, 9.3vh, 1.7rem);
  left: clamp(-0.16rem, -1vw, -0.26rem);
  top: clamp(-0.18rem, -1.1vh, -0.32rem);
}

.zone-lg-icon-mtt {
  width: clamp(0.62rem, 5.1vh, 0.96rem);
  height: clamp(0.62rem, 5.1vh, 0.96rem);
  left: 0;
  top: clamp(-0.04rem, -0.4vh, -0.08rem);
  bottom: 0.26rem;
}

.zone-lg-icon-minigame {
  width: clamp(1rem, 8.2vh, 1.4rem);
  height: clamp(1.14rem, 8.8vh, 1.6rem);
  left: 0;
  bottom: clamp(-0.02rem, -0.2vh, -0.04rem);
}

.zone-mini-icon {
  position: absolute;
  top: clamp(0.14rem, 1.1vh, 0.26rem);
  right: clamp(0.14rem, 1.6vw, 0.24rem);
  width: clamp(0.2rem, 1.6vh, 0.35rem);
  height: clamp(0.16rem, 1.2vh, 0.27rem);
  object-fit: contain;
}

.zone-info {
  text-align: center;
  min-width: 0;
}

.zone-title {
  font-size: var(--title-size);
  font-weight: 800;
  color: #fff;
  display: block;
  margin-bottom: clamp(0.16rem, 1.3vh, 0.34rem);
}

.poker-desc-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
}

.zone-desc {
  font-size: var(--body-size);
  font-weight: 400;
  color: #fff;
  margin: 0;
  line-height: 1.5;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0 clamp(0.08rem, 0.8vw, 0.12rem);
  min-width: 0;
}

.zone-sub-desc {
  font-size: var(--body-size);
  font-weight: 400;
  color: #fff;
  margin: clamp(0.01rem, 0.28vh, 0.04rem) 0 0;
  min-width: 0;
  overflow-wrap: break-word;
}

.zone-online-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(0.04rem, 0.6vw, 0.1rem);
  background: rgba(200, 200, 200, 0.25);
  border-radius: 1rem;
  padding: clamp(0.03rem, 0.4vh, 0.06rem) clamp(0.12rem, 1.4vw, 0.2rem);
  margin-top: clamp(0.06rem, 0.65vh, 0.14rem);
  min-height: clamp(0.3rem, 2.5vh, 0.4rem);
  width: 100%;
  z-index: 2;
  flex-wrap: nowrap;
}

.online-text {
  font-size: var(--body-size);
  color: #fff;
  white-space: nowrap;
}

.online-icon {
  width: clamp(0.14rem, 1.15vh, 0.22rem);
  height: clamp(0.14rem, 1.15vh, 0.22rem);
  margin-left: clamp(0.04rem, 0.6vw, 0.1rem);
  object-fit: contain;
}

.online-num {
  font-size: var(--body-size);
  color: #fff;
  white-space: nowrap;
}

.poker-card {
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
  min-width: 0;
}

.coming-soon-card {
  padding: 0;
  display: grid;
  place-items: center;
}

.coming-soon-right {
  position: relative;
  border-radius: var(--radius-xl);
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
  margin-top: clamp(1.08rem, 2vh, 2.16rem);
  font-size: clamp(0.24rem, 1.7vh, 0.36rem);
  font-weight: 700;
  color: #fff;
  padding: 0;
  width: 100%;
}

.coming-soon-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(0.08rem, 0.7vw, 0.12rem);
  height: 100%;
  align-items: end;
  min-height: 0;
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.coming-soon-small {
  position: relative;
  min-width: 0;
  width: 100%;
  height: calc(100% - var(--bottom-card-inset));
  border-radius: var(--bottom-card-radius);
  overflow: hidden;
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
  font-size: clamp(0.18rem, 1.3vh, 0.293rem);
  font-weight: 400;
  color: #fff;
}

@media (max-height: 700px) {
  .home-page {
    --page-gap: clamp(0.1rem, 0.75vh, 0.16rem);
    --column-gap: clamp(0.12rem, 1vw, 0.2rem);
    --card-gap: clamp(0.08rem, 0.65vh, 0.12rem);
  }

  .club-right {
    gap: clamp(0.08rem, 0.9vw, 0.16rem);
  }

  .zone-title {
    margin-bottom: clamp(0.12rem, 0.95vh, 0.2rem);
  }

  .poker-desc-area {
    justify-content: space-evenly;
  }
}

@media (max-width: 374px) {
  .home-page {
    --page-pad-x: clamp(0.2rem, 2.2vw, 0.28rem);
    --column-gap: clamp(0.1rem, 0.8vw, 0.16rem);
  }

  .club-panel {
    padding-inline: clamp(0.18rem, 1.8vw, 0.26rem);
  }

  .club-right {
    gap: clamp(0.06rem, 0.6vw, 0.12rem);
  }
}
</style>
