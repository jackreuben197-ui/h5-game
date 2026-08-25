<script setup lang="ts">
import { computed } from 'vue'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconAddDark from '@/assets/icons/icon_add.svg'
import iconAddLight from '@/assets/icons/icon_add_light.svg'
import { theme } from '@/utils/theme'
import { useLoginModalStore } from '@/stores/loginModal'
import { t } from '@/i18n'

const loginModalStore = useLoginModalStore()

const iconAdd = computed(() => (theme.value === 'light' ? iconAddLight : iconAddDark))


const INVITE_CODE_LENGTH = 7
const inviteCode: string[] = Array(INVITE_CODE_LENGTH).fill('')

const activeFilter = 'all'
const filters = [
  { key: 'all', label: t('UIMatch_GtO8YEdb') },
  { key: 'nlh', label: t('adaptation10022') },
  { key: 'plo', label: t('adaptation10009') },
  { key: 'short', label: '6+' },
]

const displayUser = {
  diamond: 0,
}

function notifyNotLogin(): void {
  loginModalStore.open()
}
</script>

<template>
  <div class="friends-table-page">
    <div class="title-bar main-primary-header">
      <div v-fit-text="{ maxLines: 1 }" class="title">{{ t('UIMessage_Default') }}</div>
      <div class="currency-info main-primary-currency" @click="notifyNotLogin">
        <div class="icon-diamond">
          <img :src="iconDiamond" :alt="t('UIMine_VIP_diamond')" />
        </div>
        <div class="num">{{ displayUser.diamond }}</div>
        <div class="icon-recharge">
          <img :src="iconAdd" :alt="t('UIMine_WalletAdd_EjPOTlsz')" />
        </div>
      </div>
    </div>

    <div class="scroll-content">
      <div class="main-content">
        <div class="section join-section">
          <div v-fit-text="{ maxLines: 2 }" class="section-title">{{ t('UIGuest_JoinTableGame') }}</div>
          <div class="section-subtitle">{{ t('UIDialogInvitationCodeTitle') }}, {{ t('UIGuest_And') }}</div>
          <div class="invite-inputs" @click="notifyNotLogin">
            <div v-for="(digit, index) in inviteCode" :key="index" class="invite-input-wrap">
              <span class="invite-digit">{{ digit }}</span>
            </div>
          </div>

          <button class="action-btn" @click="notifyNotLogin">
            <span>{{ t('UIGuest_Join') }}</span>
          </button>
        </div>

        <div class="section create-section">
          <div class="section-title">{{ t('UIGuest_Round') }}</div>
          <button class="action-btn" @click="notifyNotLogin">{{ t('UIGuest_Text') }}</button>
        </div>
      </div>

      <div class="section table-section">
        <div class="table-header">
          <div class="table-header-line"></div>
          <div class="table-header-center">
            <div class="table-header-title">{{ t('UIGuest_CurrentTable') }}</div>
            <div class="table-header-sub">{{ t('UIGuest_OfTable') }}</div>
          </div>
          <div class="table-header-line"></div>
        </div>

        <div class="filter-tabs">
          <div
            v-for="filter in filters"
            :key="filter.key"
            class="filter-tab"
            :class="{ active: activeFilter === filter.key }"
            @click="notifyNotLogin"
          >
            {{ filter.label }}
          </div>
        </div>

        <div class="table-list">
          <div class="empty-state">
            <div class="empty-text">{{ t('UIGuest_Table') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.friends-table-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: min(100%, var(--app-max-width));
  margin: 0 auto;
  padding: 0 0;
  color: var(--c-text);
}

/* ===== 顶部标题栏 ===== */
.title-bar {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.78rem;
  .title {
    min-width: 0;
    white-space: nowrap;
    font-size: 0.65rem;
    font-weight: 510;
    line-height: 120%;
    color: #fff;
    text-shadow: 0 0.22rem 0.5rem rgba(0, 0, 0, 0.35);

    @include theme-light-own {
      text-shadow: none;
      color: #000 !important;
    }
  }
  .currency-info {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.2);
    min-height: 0.8rem;
    padding: 0 0.24rem;
    border-radius: 0.6rem;
    overflow: hidden;
    gap: 0.2rem;

    @include theme-light-own {
      color: #000;
      background: #fff;
      box-shadow: 0 0.04rem 0.14rem rgba(34, 34, 34, 0.08);
    }
    .icon-diamond {
      width: 0.59rem;
      height: 0.59rem;
      display: flex;
      justify-content: center;
      align-items: center;

      img {
        width: 100%;
      }
    }
    .num {
      line-height: 140%;
      font-size: 0.5rem;
      font-weight: 700;
    }
    .icon-recharge {
      width: 0.47rem;
      height: 0.47rem;
      display: flex;
      align-items: center;
      justify-content: center;

      color: #dadada;

      @include theme-light-own {
        color: var(--c-brand);
      }
    }

    .icon-recharge-svg {
      width: 100%;
      height: 100%;
    }
  }
}

/* ===== 可滚动内容区 ===== */
.scroll-content {
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 0 0 1.5rem;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
.main-content {
  position: relative;
  height: 16.8rem;
}
.main-content::before {
  content: '  ';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('@/assets/images/friend_table_bg.svg') no-repeat center top;
  background-size: 100% auto;
  opacity: 0.1;
  pointer-events: none;

  @include theme-light-own {
    opacity: 1;
  }
}
.main-content::after {
  content: '  ';
  position: absolute;
  top: 1.1rem;
  left: 0;
  width: 100%;
  height: 90%;
  background: url('@/assets/images/friend_table_bg2.svg') no-repeat center top;
  background-size: 100% auto;
  opacity: 0.5;
  pointer-events: none;

  @include theme-light-own {
    opacity: 0;
  }
}

/* ===== 通用区块 ===== */
.section {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.6rem;
}

.section-title {
  font-size: 0.72rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 600;
  color: #fff;
  text-align: center;
  line-height: 1;
  margin-bottom: 0.35rem;

  @include theme-light-own {
    color: #000 !important;
  }
}

.section-subtitle {
  font-size: 0.4rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  line-height: 1;
  margin-bottom: 0.85rem;

  @include theme-light-own {
    color: rgba(0, 0, 0, 0.62) !important;
  }
}

.action-btn {
  width: 6.44rem;
  height: 1.42rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.4rem;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 1rem;
  color: rgba(249, 249, 249, 0.9);
  box-shadow: inset 0.4px 0.4px 0px 0px rgba(255, 255, 255, 1);
  font-size: 0.48rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  cursor: pointer;
  white-space: normal;
  text-align: center;
  line-height: 1.1;
  word-break: break-word;

  @include theme-light-own {
    color: rgba(249, 249, 249, 0.9);
    background: var(--c-brand);
    box-shadow: none;
  }
}

/* ===== 加入牌局 ===== */
.join-section {
  padding-top: 3.9rem;
  .invite-inputs {
    display: flex;
    justify-content: center;
    gap: 0.15rem;
    margin-bottom: 0.8rem;
  }

  .invite-input-wrap {
    width: 1.08rem;
    height: 1.08rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.19);
    border: 0.5px solid rgba(255, 255, 255, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;

    @include theme-light-own {
      background: rgba(0, 0, 0, 0.13);
      border-color: rgba(255, 40, 40, 0.08);
    }
  }

  .invite-input {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 0.6rem;
    font-family: 'HONOR Sans CN', sans-serif;
    font-weight: 500;
    color: #f9f9f9;
  }

  .invite-digit {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: transparent;
    font-size: 0.6rem;
    font-family: 'HONOR Sans CN', sans-serif;
    font-weight: 500;
    color: #f9f9f9;
    line-height: 1;

    @include theme-light-own {
      color: var(--c-text);
    }
  }
}

/* ===== 快速组局 ===== */
.create-section {
  margin-bottom: 0.6rem;
  .section-title {
    margin-bottom: 0.55rem;
  }
}

/* ===== 当前牌桌 ===== */
.table-section {
  margin-top: 0.6rem;
  align-items: stretch;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.3rem;

  .table-header-line {
    width: 1.45rem;
    height: 0.5px;
    margin-top: 0.2rem;
    background: rgba(249, 249, 249, 0.5);

    @include theme-light-own {
      background: rgba(0, 0, 0, 0.16);
    }
  }

  .table-header-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.08rem;
  }

  .table-header-title {
    font-size: 0.51rem;
    font-family: 'SF Pro', sans-serif;
    font-weight: 400;
    color: #f9f9f9;
    text-align: center;
    line-height: 1;

    @include theme-light-own {
      color: #000 !important;
    }
  }

  .table-header-sub {
    margin-top: 0.1rem;
    font-size: 0.27rem;
    font-family: 'SF Pro', sans-serif;
    font-weight: 400;
    color: #f9f9f9;
    text-align: center;
    line-height: 1;

    @include theme-light-own {
      color: rgba(0, 0, 0, 0.62) !important;
    }
  }
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  justify-content: space-between;
  gap: 0.22rem;
  margin: 0.2em 0.9rem 0.3rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.filter-tab {
  flex-shrink: 0;
  font-size: 0.35rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  padding: 0.1rem 0 0;
  margin: 0 0.15rem;
  cursor: pointer;
  border-bottom: 1.2px solid transparent;
  transition: all 0.2s;

  @include theme-light-own {
    color: rgba(0, 0, 0, 0.54);
  }

  &.active {
    color: #fff;
    font-weight: 700;
    border-bottom-color: #eaeaea;

    @include theme-light-own {
      color: var(--c-brand);
      border-bottom-color: var(--c-brand);
    }
  }
}

/* 牌桌列表 */
.table-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.1rem 0.6rem;
}

.table-card {
  position: relative;
  display: flex;
  align-items: center;
  height: 2.05rem;
  border-radius: 4rem;
  background: rgba(255, 255, 255, 0.15);
  border: 0.5px solid transparent;
  padding: 0 0.3rem 0 0.15rem;
  // overflow: hidden;
  cursor: pointer;
  transition: opacity 0.2s;

  @include theme-light-own {
    background: #fff;
    border-color: #000;
  }

  &:active {
    opacity: 0.85;
  }
}

/* 左侧游戏图标 */
.table-card-left {
  position: relative;
  flex-shrink: 0;
  width: 1.54rem;
  height: 1.71rem;
  transform: translateX(-0.4rem);
  display: flex;
  align-items: center;
  justify-content: center;

  .type-card {
    width: 1.54rem;
    height: 1.71rem;
    border-radius: 0.44rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    backdrop-filter: blur(10px);
    background: rgba($color: #fff, $alpha: 0.3);
    border: 0.5px solid rgba(255, 255, 255, 1);

    @include theme-light-own {
      background: #fff;
      border-color: rgba(255, 255, 255, 0.78);
      box-shadow: 0 0.027rem 0.4rem rgba(0, 0, 0, 0.25);
    }
  }

  .type-card-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .type-card-title {
    position: absolute;
    bottom: 0.15rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.05rem 0.15rem;
    background: rgba(9, 9, 9, 0.19);
    border-radius: 3rem;
    font-size: 0.21rem;
    font-family: 'SF Pro', sans-serif;
    font-weight: 590;
    color: #fff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
    white-space: nowrap;
  }
}

/* 中间信息 */
.table-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.09rem;
  padding: 0 0.2rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.05rem;
}

.blinds {
  font-size: 0.31rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #f8f8f8;
  line-height: 1;

  @include theme-light-own {
    color: #000;
  }
}

.room-name {
  font-size: 0.4rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  color: #f8f8f8;
  letter-spacing: 0.15px;
  line-height: 1;

  @include theme-light-own {
    color: #000;
  }
}

.tag {
  font-size: 0.31rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #f9f9f9;
  letter-spacing: 0.47px;
  line-height: 1;

  @include theme-light-own {
    color: #000;
  }
}

.duration {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  font-size: 0.31rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #f9f9f9;
  letter-spacing: 0.47px;
  line-height: 1;

  @include theme-light-own {
    color: #000;
  }

  .icon-time {
    width: 0.382rem;
    height: 0.382rem;
    color: currentColor;
    opacity: 0.51;
  }
}

.media-icons {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  color: rgba(249, 249, 249, 0.65);

  @include theme-light-own {
    color: rgba(0, 0, 0, 0.31);
  }
}

.icon-media {
  width: 0.395rem;
  height: 0.395rem;
}

.icon-feature {
  width: 0.4rem;
  height: 0.4rem;
  object-fit: contain;
}
.participated {
  font-size: 0.23rem;
  border-radius: 0.5rem;
  padding: 0.053rem 0.16rem;
  background-color: rgba($color: #000000, $alpha: 0.24);

  @include theme-light-own {
    color: rgba(0, 0, 0, 0.62);
    background: rgba(0, 0, 0, 0.08);
  }
}
.media-label {
  font-size: 0.24rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  color: rgba(249, 249, 249, 0.85);
  line-height: 1;
}

/* 右侧人数 */
.table-card-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.seat-ratio {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  padding: 0.08rem 0.2rem;
  min-width: 1.263rem;
  height: 0.532rem;
  justify-content: center;
  border: 1px solid transparent;
  background: rgba(0, 0, 0, 0.05);
  box-shadow:
  /* 左上高光 */
    inset 0.4px 0.4px 0px 0px rgba(255, 255, 255, 0.5),
    /* 右下高光 */ inset -0.4px -0.4px 0px 0px rgba(255, 255, 255, 0.5);
  background-blend-mode: multiply;
  border-radius: 3.2rem;
  font-size: 0.31rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
  line-height: 1;

  @include theme-light-own {
    color: #000;
    background: rgba(97, 74, 246, 0.05);
    border-color: var(--c-brand);
    box-shadow: none;
  }

  .room-users-icon {
    width: 0.453rem;
    height: 0.317rem;
    color: currentColor;

    @include theme-light-own {
      color: var(--c-brand);
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 0;
}

.empty-text {
  font-size: 0.35rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;

  @include theme-light-own {
    color: rgba(0, 0, 0, 0.4) !important;
  }
}
</style>
