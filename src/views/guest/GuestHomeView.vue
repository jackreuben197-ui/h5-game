<script setup lang="ts">
import homeHeaderFallback from '@/assets/images/home_header_large.png'
import { t, getLocale } from '@/i18n'
import { useLoginModalStore } from '@/stores/loginModal'
import { useUserInfoStore } from '@/stores/userInfo'
import { useLobbyBannerImages } from '@/composables/useLobbyBannerImages'
import HomeBannerSwiper from '@/components/HomeBannerSwiper.vue'
import { computed, nextTick, onMounted, ref } from 'vue'
import iconService1Dark from '@/assets/icons/icon_service_1.svg'
import iconService1Light from '@/assets/icons/icon_service_1_light.svg'
import iconService2Dark from '@/assets/icons/icon_service_2.svg'
import iconService2Light from '@/assets/icons/icon_service_2_light.svg'
import iconService3Dark from '@/assets/icons/icon_service_3.svg'
import iconService3Light from '@/assets/icons/icon_service_3_light.svg'
import { theme } from '@/utils/theme'

import imgPa from '@/assets/images/minigame-newui/pa.svg'
import imgMahjong from '@/assets/images/minigame-newui/ma.svg'
import imgFb from '@/assets/images/minigame-newui/fb.svg'

const isLightTheme = computed(() => theme.value === 'light')
const iconService1 = computed(() => (isLightTheme.value ? iconService1Light : iconService1Dark))
const iconService2 = computed(() => (isLightTheme.value ? iconService2Light : iconService2Dark))
const iconService3 = computed(() => (isLightTheme.value ? iconService3Light : iconService3Dark))
// 牛仔入口临时隐藏，恢复时连同下方数组一起取消注释。
// import imgCowboy from '@/assets/images/minigame-newui/sg.svg'

const loginModalStore = useLoginModalStore()
const userInfoStore = useUserInfoStore()

// 部分卡片文案为硬编码中文：en 用英文，其余语言回退中文（与 i18n 规则一致）。
const localized = (en: string, cn: string): string => (getLocale() === 'en' ? en : cn)

const { bannerImages, fetchLobbyBannerImages } = useLobbyBannerImages()
// 优先后台轮播图；没有配置时沿用渠道俱乐部自带 banner，最后才回落到内置单图 + hero 文案。
const displayBannerImages = computed<string[]>(() => {
  if (bannerImages.value.length) return bannerImages.value
  const clubBanner = userInfoStore.channelDefaultClub?.banner
  return [clubBanner || homeHeaderFallback]
})
const isFallbackBanner = computed<boolean>(
  () => !bannerImages.value.length && !userInfoStore.channelDefaultClub?.banner,
)
const clubNameText = computed<string>(
  () =>
    (userInfoStore.channelDefaultClub?.club_name || '')
      .replace(/[(（]\s*disband\s*[)）]?/gi, '')
      .trim() ||
    '俱乐部',
)
const noticeText = '欢迎来到德州扑克，登录后体验更多精彩内容'
const clubGoldText = '0.00'
const balanceVisible = true
const pokerTablesText = '0'
const pokerPlayersText = '0'
const miniGamePlayersText = 632
const mttTablesText = '0'
const mttPlayersText = '0'
const mahjongPlayersText = '788'

const activeBannerGames = [
  {
    name: 'PA真人',
    svg: imgPa,
    title: '真人荷官',
    titleEn: 'Live Dealer',
    subtitle: ['美女荷官发牌', '沉浸真人体验'],
    subtitleEn: ['Real live dealers', 'Immersive experience'],
  },
  {
    name: '麻将胡了',
    svg: imgMahjong,
    title: '麻将胡了',
    titleEn: 'Mahjong Ways',
    subtitle: ['电子麻将畅玩', '胡牌乐翻天'],
    subtitleEn: ['Play video mahjong', 'Big wins await'],
  },
  {
    name: 'FB体育',
    svg: imgFb,
    title: '体育竞猜',
    titleEn: 'Sports Betting',
    subtitle: ['全球赛事竞猜', '激情一触即发'],
    subtitleEn: ['Global sports betting', 'Feel the excitement'],
  },
  // 临时隐藏牛仔（德州牛仔）入口，需要时取消注释即可恢复。
  // { name: '德州牛仔', svg: imgCowboy, title: '德州牛仔', titleEn: 'Texas Cowboy', subtitle: [], subtitleEn: [] },
]

function notifyNotLogin(): void {
  loginModalStore.open({ mode: 'login' })
}
function notifyNotLoginRegister(): void {
  loginModalStore.open({ mode: 'register' })
}

// 游客点击「小游戏专区 / 娱乐场」卡片同样需要先登录，统一走登录弹窗，不再直接跳转预览页。

const homeRootRef = ref<HTMLElement | null>(null)

// 小屏内容超出视口时，把初始滚动位置放到底部：保证底部两块（游戏中心/热门游戏）
// 完整可见，顶部的 banner/公告 上滑查看。大屏内容不溢出则无副作用。
function anchorScrollToBottomOnSmall(): void {
  void nextTick(() => {
    requestAnimationFrame(() => {
      const scroller = homeRootRef.value?.closest('.main-layout-content') as HTMLElement | null
      if (scroller && scroller.scrollHeight - scroller.clientHeight > 4) {
        scroller.scrollTop = scroller.scrollHeight
      }
    })
  })
}

onMounted(() => {
  void userInfoStore.ensureChannelDefaultClub()
  void fetchLobbyBannerImages().catch((error) => {
    console.warn('[guest-home] fetch lobby banner failed:', error)
  })
  anchorScrollToBottomOnSmall()
})
</script>

<template>
  <div ref="homeRootRef" class="home-page">
    <!-- 0. 顶部栏：POKER + 注册/登录 -->
    <div class="top-bar">
      <div class="top-bar__logo">
        <img class="top-bar__logo-img" src="@/assets/images/img_fish_browser_logo.png" alt="logo" />
        <span class="top-bar__logo-text">小鱼</span>
      </div>
      <div class="top-bar__actions">
        <button class="top-bar__btn top-bar__btn--register" @click="notifyNotLoginRegister">
          {{ localized('Register', '注册') }}
        </button>
        <button class="top-bar__btn top-bar__btn--login" @click="notifyNotLogin">{{ localized('Login', '登录') }}</button>
      </div>
    </div>
    <!-- 1. 顶部俱乐部介绍图 -->
    <div class="home-header">
      <div class="home-header__inner">
        <HomeBannerSwiper :images="displayBannerImages" />
        <div v-if="isFallbackBanner" class="home-header__hero">
          <div class="home-header__text">
            <p class="home-header__title">全民代理</p>
            <p class="home-header__subtitle">一键创建你的线上俱乐部</p>
          </div>
          <span class="home-header__pill">xypk.com</span>
        </div>
      </div>
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

      <div class="club-divider"></div>

      <div class="club-right">
        <div class="contact-item" @click="notifyNotLogin">
          <img class="contact-icon" :src="iconService1" alt="Telegram" />
          <span class="contact-label"> @game </span>
        </div>
        <div class="contact-item" @click="notifyNotLogin">
          <img class="contact-icon" :src="iconService2" alt="邮箱" />
          <span class="contact-label"> {{ $txt('UISetting_SecurityBindEmailItem') }} </span>
        </div>
        <div class="contact-item" @click="notifyNotLogin">
          <img class="contact-icon" :src="iconService3" alt="IM客服" />
          <span class="contact-label"> {{ $txt('UIMineMain01') }} </span>
        </div>
      </div>
    </div>

    <!-- 4. 游戏模块 -->
    <div class="section-header">
      <span class="section-title">{{ localized('Game Center', '游戏中心') }}</span>
    </div>
    <div class="game-center-scroll">
      <div class="game-center-track">
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

        <div class="game-scroll-card poker-card" @click="notifyNotLogin">
          <img class="zone-lg-bg" src="@/assets/icons/game_zone_poker_lg.png" alt="扑克" />
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

        <div class="game-scroll-card game-card-mahjong" @click="notifyNotLogin">
          <img class="zone-lg-bg" src="@/assets/icons/game_zone_mahjong_lg.png" alt="麻将" />
          <div class="zone-info">
            <div class="zone-header">
              <span class="zone-title"> {{ localized('Casino', '娱乐场') }} </span>
              <img class="zone-mini-icon" src="@/assets/icons/game_zone_mahjong_mini.png" alt="" />
            </div>
            <div class="zone-desc casino-desc">
              <p>{{ localized('Live, Slots, Sports', '真人视讯 电子娱乐 体育竞猜') }}</p>
              <p>{{ localized('Top Providers', '全球一线厂商') }}</p>
            </div>
          </div>
          <div class="zone-online-bar">
            <span class="online-text"> {{ t('UIClub_Mlist_zaixian') }} </span>
            <img class="online-icon" src="@/assets/icons/game_zone_people_mini.png" alt="" />
            <span class="online-num"> {{ mahjongPlayersText }} </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. 热门游戏 -->
    <div class="section-header">
      <span class="section-title">{{ localized('Hot Games', '热门游戏') }}</span>
    </div>
    <div class="coming-soon-scroll">
      <div class="coming-soon-track">
        <div
          v-for="(game, index) in activeBannerGames"
          :key="index"
          class="coming-soon-scroll-card"
          @click="notifyNotLogin"
        >
          <img class="coming-soon-scroll-card__img" :src="game.svg" alt="" />
          <div class="coming-soon-scroll-card__label">
            <span class="coming-soon-scroll-card__title">{{
              localized(game.titleEn, game.title || game.name)
            }}</span>
            <span
              v-for="(line, i) in (getLocale() === 'en' ? game.subtitleEn : game.subtitle) || []"
              :key="i"
              class="coming-soon-scroll-card__subtitle"
              :class="{ 'coming-soon-scroll-card__subtitle--first': i === 0 }"
              >{{ line }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0 0.4rem 0;
  background: transparent;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
  overscroll-behavior-y: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.home-page > .notice-bar,
.home-page > .club-panel,
.home-page > .section-header {
  flex-shrink: 0;
}

.home-page > .game-center-scroll,
.home-page > .coming-soon-scroll {
  flex: 1 0 3.9rem;
  min-height: 0;
}
/* ========== 0. 顶部栏 ========== */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  margin-top: 0.12rem;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 20;
  background: #222627;
}

.top-bar__logo {
  display: flex;
  align-items: center;
  gap: 0.16rem;
}

.top-bar__logo-img {
  width: 1.8rem;
  height: auto;
  margin-top: 0.1rem;
  display: block;
  object-fit: contain;
}

.top-bar__logo-text {
  font-size: 0.54rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.02rem;
  font-family: 'HONOR Sans CN', sans-serif;
}

.top-bar__actions {
  display: flex;
  gap: 0.14rem;
}

.top-bar__btn {
  border: none;
  border-radius: 0.56rem;
  font-size: 0.3rem;
  font-weight: 500;
  font-family: 'PingFang SC', sans-serif;
  cursor: pointer;
  padding: 0.12rem 0.65rem;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    opacity: 0.85;
  }
}

.top-bar__btn--register {
  background: rgba(128, 128, 128, 0.2);
  color: #f9f9f9;
  border: 0.02rem solid rgba(249, 249, 249, 0.15);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
}

.top-bar__btn--login {
  background: rgba(250, 43, 75, 0.8);
  color: #f9f9f9;
  border: 0.02rem solid rgba(249, 249, 249, 0.25);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
}

/* ===== 1. 顶部 Header ===== */
.home-header {
  width: 100%;
  border-radius: 0.8rem;
  overflow: hidden;
  flex: 1 1 3.68rem;
  min-height: 0;
  max-height: 5.5rem;
}

.home-header__inner {
  position: relative;
  width: 100%;
  height: 100%;
  container-type: size;
}

.home-header__hero {
  position: absolute;
  left: 0;
  right: 0;
  top: 0.56rem;
  top: min(15.2cqh, 0.56rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  pointer-events: none;
}

.home-header__title,
.home-header__subtitle {
  margin: 0;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  font-size: 0.62rem;
  font-size: min(16.9cqh, 0.62rem);
  line-height: 1.2;
  letter-spacing: 0.01rem;
  color: #fff;
  text-align: center;
  white-space: nowrap;
}

.home-header__pill {
  margin-top: 0.26rem;
  margin-top: min(7.1cqh, 0.26rem);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.12rem 0.5rem;
  padding: min(3.3cqh, 0.12rem) min(13.6cqh, 0.5rem);
  border-radius: 99px;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  font-size: 0.6rem;
  font-size: min(16.3cqh, 0.6rem);
  color: #fff;
  white-space: nowrap;
  background: rgba(37, 37, 37, 0.49);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.home-header__text {
  display: flex;
  flex-direction: column;
  align-items: center;
}

@container (max-height: 2.6rem) {
  .home-header__hero {
    top: 0;
    bottom: 0;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.5rem;
  }

  .home-header__text {
    align-items: flex-start;
  }

  .home-header__title,
  .home-header__subtitle {
    font-size: 0.46rem;
    text-align: left;
  }

  .home-header__pill {
    margin-top: 0;
    font-size: 0.4rem;
    padding: 0.1rem 0.4rem;
  }
}

@container (min-height: 4rem) {
  .home-header__hero {
    top: 0;
    bottom: 0;
    justify-content: center;
  }
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
  position: relative;
  background: rgba(170, 170, 170, 0.1);
  border: 0.02rem solid rgba(249, 249, 249, 0.1);
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);
}

.notice-icon {
  width: 0.43rem;
  height: 0.43rem;
  flex-shrink: 0;
  filter: brightness(0) invert(1);
}

.notice-marquee {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.notice-label {
  font-size: 0.28rem;
  color: #f9f9f9;
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
  color: #f9f9f9;
  font-weight: 400;
  white-space: nowrap;
}

/* ===== 3. 俱乐部控件 ===== */
.club-panel {
  display: flex;
  align-items: center;
  background: rgba(76, 76, 76, 0.2);
  border-radius: 1rem;
  padding: 0.1rem 0.6rem;
  min-height: 1.54rem;
  gap: 0;
  border: 0.02rem solid rgba(249, 249, 249, 0.1);
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);
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
  color: #f9f9f9;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 4rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  color: #f9f9f9;
  font-weight: 500;
  text-align: center;
  min-width: 0.5rem;
}

.recharge-btn {
  width: 1.3rem;
  padding: 0.06rem 0rem;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 1rem;
  color: #f9f9f9;
  font-size: 0.28rem;
  cursor: pointer;
  white-space: nowrap;
}

.club-divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  align-self: stretch;
  margin: 6px 0.28rem;
}

.club-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.28rem;
  flex: 1;
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
  color: #f9f9f9;
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
    color: #f9f9f9;
    font-family: 'HONOR Sans CN', sans-serif;
  }
}

.game-center-scroll {
  width: calc(100% + 0.8rem);
  margin-left: -0.4rem;
  margin-right: -0.4rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
.game-center-track {
  display: flex;
  height: 100%;
  gap: 0.15rem;
  width: max-content;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
}
.game-scroll-card {
  flex-shrink: 0;
  width: 2.95rem;
  height: 100%;
  border-radius: 0.37rem;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background: linear-gradient(135deg, #956eff 0%, #7447ef 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.26rem 0.2rem 0.2rem;
  box-sizing: border-box;

  &:active {
    opacity: 0.85;
  }
}

.poker-card {
  background: linear-gradient(135deg, #65a879 0%, #329147 100%);
}

.game-card-minigame {
  background: linear-gradient(135deg, #21b4fa 0%, #1b67f0 100%);

  .zone-lg-bg {
    object-fit: contain;
    object-position: bottom right;
  }
}

.game-card-mahjong {
  background: linear-gradient(135deg, #ff9cab 0%, #df2340 100%);

  .zone-info {
    position: relative;
  }

  .casino-desc {
    text-shadow: 0 0.02rem 0.06rem rgba(0, 0, 0, 0.3);

    p {
      margin: 0;
      white-space: nowrap;
      font-size: 0.2rem;
      line-height: 1.5;
    }
  }
}

.zone-lg-bg {
  position: absolute;
  inset: 0;
  object-fit: cover;
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

.poker-desc-area {
  display: flex;
  flex-direction: column;
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
  padding: 0;
}

.coming-soon-right {
  position: relative;
  border-radius: 0.56rem;
  overflow: hidden;
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

.coming-soon-scroll {
  width: calc(100% + 0.8rem);
  margin-left: -0.4rem;
  margin-right: -0.4rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.coming-soon-track {
  display: flex;
  height: 100%;
  gap: 0.15rem;
  padding-bottom: 0.1rem;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
  width: max-content;
}

.coming-soon-scroll-card {
  flex-shrink: 0;
  width: 2.95rem;
  // 固定高度：小屏不再压缩卡片，改由页面向下滚动兜底（与登录后首页一致）。
  height: 100%;
  border-radius: 0.51rem;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 0.01rem solid rgba(249, 249, 249, 0.4);

  &:active {
    opacity: 0.85;
  }
}

.coming-soon-scroll-card__img {
  width: 100%;
  height: 100%;
  // 图片无内置文字：靠上对齐、底部裁掉，给代码 label 让位。
  object-fit: cover;
  object-position: top center;
  display: block;
}

// 名称/描述改为代码渲染，缩放时不会像图片内文字那样被裁切/糊。
.coming-soon-scroll-card__label {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  padding: 0.36rem 0.24rem 0.16rem;
  color: #fff;
  text-align: left;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0) 100%);
  pointer-events: none;
}

.coming-soon-scroll-card__title {
  font-size: 0.34rem;
  font-weight: 700;
  line-height: 1.15;
}

.coming-soon-scroll-card__subtitle {
  font-size: 0.22rem;
  font-weight: 400;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.82);
}

// 只在标题与副标题之间留 0.12rem，副标题各行仍靠 line-height 紧凑排列。
.coming-soon-scroll-card__subtitle--first {
  margin-top: 0.12rem;
}
</style>
