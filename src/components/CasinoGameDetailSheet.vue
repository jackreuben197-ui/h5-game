<script setup lang="ts">
import { computed } from 'vue'
import winAvatarImg from '@/assets/images/win_avatar.png'
import goldCityImg from '@/assets/images/game_gold_city.png'
import bountyQueenImg from '@/assets/images/game_bounty_queen.png'
// @ts-ignore
import mahjong1Img from '@/assets/images/minigame-newui/麻将胡了.png'
// @ts-ignore
import mahjong2Img from '@/assets/images/minigame-newui/麻将胡了2.png'
// @ts-ignore
import cowboyImg from '@/assets/images/minigame-newui/德州牛仔.png'

export interface WinDetailInfo {
  title?: string
  gameTitle?: string
  img?: string
  gameIcon?: string
  platformTag?: string
  username?: string
  winTime?: string
  betAmount?: string
  multiplier?: string
  winAmount?: string
  rtp?: string
  maxMultiplier?: string
  volatility?: string
  paylines?: string
  description?: string
  recentWins?: Array<{
    username: string
    amount: string
    tag: string
    time: string
  }>
}

export type GameDetailInfo = WinDetailInfo

const props = defineProps<{
  show: boolean
  detail?: WinDetailInfo | null
  game?: WinDetailInfo | null
}>()

const emit = defineEmits<{
  'update:show': [val: boolean]
  play: [game: WinDetailInfo]
  demo: [game: WinDetailInfo]
  followGame: [detail: WinDetailInfo]
  selectGame: [gameTitle: string]
}>()

const currentData = computed<WinDetailInfo | null>(() => props.detail || props.game || null)

function close() {
  emit('update:show', false)
}

function handleFollowGame() {
  const data = currentData.value || {}
  emit('followGame', data)
  emit('play', data)
}

function handleSelectRelatedGame(title: string) {
  emit('selectGame', title)
}

// Display fields with fallback defaults matching the exact reference screenshot
const displayUsername = computed(() => currentData.value?.username || 'q***er')
const displayWinTime = computed(() => currentData.value?.winTime || '2026-10-29 06:47:09')
const displayBetAmount = computed(() => currentData.value?.betAmount || '250.00 元')
const displayMultiplier = computed(() => currentData.value?.multiplier || 'x116.4')
const displayWinAmount = computed(() => {
  if (currentData.value?.winAmount) return currentData.value.winAmount
  return '29,100.00 元'
})
const displayGameTitle = computed(
  () => currentData.value?.gameTitle || currentData.value?.title || '寻宝黄金城',
)
const displayPlatformTag = computed(() => currentData.value?.platformTag || 'PG电子')
const displayGameIcon = computed(
  () => currentData.value?.gameIcon || currentData.value?.img || goldCityImg,
)

// Bottom 5 recommended games matching the exact screenshot (media_1793281832966_d309c50d.jpg)
const relatedGames = [
  { id: 1, title: '麻将胡了', img: mahjong1Img, badgeColor: '#ea580c' },
  { id: 2, title: '赏金女王', img: bountyQueenImg, badgeColor: '#dc2626' },
  { id: 3, title: '麻将胡了2', img: mahjong2Img, badgeColor: '#059669' },
  { id: 4, title: '赏金大对决', img: cowboyImg, badgeColor: '#b45309' },
  { id: 5, title: '寻宝黄金城', img: goldCityImg, badgeColor: '#92400e' },
]
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet-slide-up">
      <div v-if="show" class="win-detail-overlay" @click.self="close">
        <div class="win-detail-modal-card">
          <!-- Top Header -->
          <div class="detail-header-row">
            <h3 class="detail-modal-title">爆奖详情</h3>
            <button class="detail-close-btn" type="button" @click="close" aria-label="Close">
              ✕
            </button>
          </div>

          <!-- User Avatar with Purple Glow & Flying Coins Burst -->
          <div class="avatar-center-section">
            <div class="avatar-halo-wrap">
              <!-- Left Flying Coins -->
              <span class="flying-coin coin-left-1">🪙</span>
              <span class="flying-coin coin-left-2">🪙</span>
              <span class="flying-coin coin-left-3">🪙</span>
              <span class="flying-coin coin-left-4">🪙</span>

              <!-- Avatar Ring -->
              <div class="avatar-glow-ring">
                <img :src="winAvatarImg" alt="avatar" class="user-avatar-img" />
              </div>

              <!-- Right Flying Coins -->
              <span class="flying-coin coin-right-1">🪙</span>
              <span class="flying-coin coin-right-2">🪙</span>
              <span class="flying-coin coin-right-3">🪙</span>
              <span class="flying-coin coin-right-4">🪙</span>
            </div>
            <div class="avatar-username">{{ displayUsername }}</div>
            <div class="avatar-timestamp">{{ displayWinTime }}</div>
          </div>

          <!-- 3-Column Stats Box (下注金额, 赔率倍数, 派彩金额) -->
          <div class="stats-three-cols-box">
            <div class="stat-col">
              <div class="col-label">下注金额</div>
              <div class="col-value">{{ displayBetAmount }}</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-col">
              <div class="col-label">赔率倍数</div>
              <div class="col-value multiplier-val">{{ displayMultiplier }}</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-col">
              <div class="col-label">派彩金额</div>
              <div class="col-value win-amount-val">{{ displayWinAmount }}</div>
            </div>
          </div>

          <!-- Middle Winning Game Row ("爆奖游戏:") -->
          <div class="winning-game-row">
            <span class="row-label">爆奖游戏:</span>
            <div class="game-showcase-card">
              <div class="game-cover-box">
                <img :src="displayGameIcon" :alt="displayGameTitle" class="cover-img" />
                <span class="top-pg-tag">PG</span>
                <span class="top-multiplier-ribbon">实测最高10万倍</span>
                <div class="cover-name-bar">{{ displayGameTitle }}</div>
              </div>
              <div class="game-text-col">
                <div class="game-name">{{ displayGameTitle }}</div>
                <div class="game-platform">{{ displayPlatformTag }}</div>
              </div>
            </div>
          </div>

          <!-- Big Action Button (跟投游戏 >) -->
          <button class="follow-game-btn" type="button" @click="handleFollowGame">
            <span class="btn-shine-light"></span>
            跟投游戏 &gt;
          </button>

          <!-- Bottom 5 Related Games Row -->
          <div class="related-games-row">
            <div
              v-for="game in relatedGames"
              :key="game.id"
              class="related-game-thumb"
              @click="handleSelectRelatedGame(game.title)"
            >
              <div class="thumb-img-wrapper">
                <img :src="game.img" :alt="game.title" class="thumb-img" />
                <span class="thumb-pg-badge">PG</span>
                <div class="thumb-title-bar" :style="{ background: game.badgeColor }">
                  {{ game.title }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
// ── Overlay Backdrop ──
.win-detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}

// ── Modal Card (Slide up from below animation) ──
.win-detail-modal-card {
  width: min(94vw, 360px);
  background: linear-gradient(180deg, #2a2444 0%, #1a162b 100%);
  border: 1px solid rgba(168, 85, 247, 0.25);
  border-radius: 18px;
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.85),
    0 0 30px rgba(124, 58, 237, 0.22);
  padding: 16px 14px 14px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-sizing: border-box;
}

// ── Header ──
.detail-header-row {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 6px;

  .detail-modal-title {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    letter-spacing: 0.5px;
  }

  .detail-close-btn {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #cbd5e1;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.22);
      color: #fff;
    }
  }
}

// ── User Avatar Section ──
.avatar-center-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;

  .avatar-halo-wrap {
    position: relative;
    width: 90px;
    height: 68px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-glow-ring {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    padding: 2.5px;
    background: linear-gradient(135deg, #a855f7, #6366f1);
    box-shadow: 0 0 16px rgba(168, 85, 247, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    z-index: 2;

    .user-avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }
  }

  // Radiating golden coins
  .flying-coin {
    position: absolute;
    font-size: 12px;
    pointer-events: none;
    z-index: 1;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    animation: coinFloat 2.4s ease-in-out infinite alternate;

    &.coin-left-1 {
      top: 6px;
      left: 6px;
      transform: rotate(-25deg) scale(0.9);
      animation-delay: 0s;
    }
    &.coin-left-2 {
      top: 26px;
      left: -2px;
      transform: rotate(-10deg) scale(1.1);
      animation-delay: 0.3s;
    }
    &.coin-left-3 {
      bottom: 8px;
      left: 4px;
      transform: rotate(15deg) scale(0.85);
      animation-delay: 0.6s;
    }
    &.coin-left-4 {
      top: -2px;
      left: 18px;
      transform: rotate(-35deg) scale(0.75);
      animation-delay: 0.9s;
    }
    &.coin-right-1 {
      top: 6px;
      right: 6px;
      transform: rotate(25deg) scale(0.9);
      animation-delay: 0.15s;
    }
    &.coin-right-2 {
      top: 26px;
      right: -2px;
      transform: rotate(10deg) scale(1.1);
      animation-delay: 0.45s;
    }
    &.coin-right-3 {
      bottom: 8px;
      right: 4px;
      transform: rotate(-15deg) scale(0.85);
      animation-delay: 0.75s;
    }
    &.coin-right-4 {
      top: -2px;
      right: 18px;
      transform: rotate(35deg) scale(0.75);
      animation-delay: 1.05s;
    }
  }

  .avatar-username {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
    margin-top: 4px;
    letter-spacing: 0.3px;
  }

  .avatar-timestamp {
    font-size: 11px;
    color: #8e95a5;
    margin-top: 2px;
  }
}

@keyframes coinFloat {
  0% {
    transform: translateY(0) scale(1);
  }
  100% {
    transform: translateY(-4px) scale(1.08);
  }
}

// ── 3-Column Stats Box ──
.stats-three-cols-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(22, 18, 38, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px 8px;
  margin-bottom: 14px;

  .stat-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    text-align: center;

    .col-label {
      font-size: 11px;
      color: #8e95a5;
    }

    .col-value {
      font-size: 13px;
      font-weight: 700;
      color: #ffffff;
      font-variant-numeric: tabular-nums;
    }

    .multiplier-val {
      color: #ffffff;
      font-weight: 700;
    }

    .win-amount-val {
      color: #f68b36;
      font-weight: 800;
    }
  }

  .stat-divider {
    width: 1px;
    height: 24px;
    background: rgba(255, 255, 255, 0.08);
  }
}

// ── Middle Winning Game Row ──
.winning-game-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;

  .row-label {
    font-size: 12px;
    color: #a0a6b8;
    white-space: nowrap;
    width: 60px;
  }

  .game-showcase-card {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .game-cover-box {
    position: relative;
    width: 66px;
    height: 66px;
    border-radius: 9px;
    overflow: hidden;
    background: #1c1830;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

    .cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .top-pg-tag {
      position: absolute;
      top: 2px;
      left: 2px;
      font-size: 8px;
      font-weight: 800;
      color: #cbd5e1;
      background: rgba(0, 0, 0, 0.65);
      padding: 0 3px;
      border-radius: 3px;
      line-height: 1.1;
    }

    .top-multiplier-ribbon {
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 7px;
      font-weight: 700;
      color: #fff;
      background: #dc2626;
      padding: 0 3px;
      border-radius: 2px;
      line-height: 1.1;
      transform: scale(0.9);
      transform-origin: top right;
    }

    .cover-name-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(146, 64, 14, 0.92);
      color: #ffffff;
      font-size: 9px;
      text-align: center;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 1px 2px;
    }
  }

  .game-text-col {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;

    .game-name {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
    }

    .game-platform {
      font-size: 11px;
      color: #8e95a5;
    }
  }
}

// ── Follow Game Button (跟投游戏 >) ──
.follow-game-btn {
  width: 100%;
  height: 42px;
  background: linear-gradient(90deg, #7c3aed 0%, #6366f1 100%);
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  position: relative;
  overflow: hidden;
  margin-bottom: 14px;
  box-shadow: 0 6px 18px rgba(124, 58, 237, 0.45);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2px 10px rgba(124, 58, 237, 0.3);
  }

  .btn-shine-light {
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.28) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: skewX(-25deg);
    animation: btnShine 2.8s infinite ease-in-out;
  }
}

@keyframes btnShine {
  0% {
    left: -80%;
  }
  40%,
  100% {
    left: 140%;
  }
}

// ── Bottom 5 Related Games ──
.related-games-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;

  .related-game-thumb {
    flex: 1;
    cursor: pointer;
    transition: transform 0.15s ease;

    &:active {
      transform: scale(0.94);
    }
  }

  .thumb-img-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    background: #1c1830;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);

    .thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .thumb-pg-badge {
      position: absolute;
      top: 1px;
      left: 1px;
      font-size: 7px;
      font-weight: 800;
      color: #e2e8f0;
      background: rgba(0, 0, 0, 0.65);
      padding: 0 2px;
      border-radius: 2px;
      line-height: 1.1;
    }

    .thumb-title-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      color: #ffffff;
      font-size: 8px;
      text-align: center;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 1px 1px;
      font-weight: 600;
    }
  }
}

// ── Slide Up from Below Animation ──
.sheet-slide-up-enter-active,
.sheet-slide-up-leave-active {
  transition: opacity 0.32s ease;

  .win-detail-modal-card {
    transition:
      transform 0.36s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.36s ease;
  }
}

.sheet-slide-up-enter-from,
.sheet-slide-up-leave-to {
  opacity: 0;

  .win-detail-modal-card {
    transform: translateY(100%) scale(0.9);
    opacity: 0;
  }
}

.sheet-slide-up-enter-to,
.sheet-slide-up-leave-from {
  opacity: 1;

  .win-detail-modal-card {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
</style>
