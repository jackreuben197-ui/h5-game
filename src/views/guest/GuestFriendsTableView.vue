<script setup lang="ts">
import { computed } from 'vue'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconAddDark from '@/assets/icons/icon_add.svg'
import iconAddLight from '@/assets/icons/icon_add_light.svg'
import { theme } from '@/utils/theme'
import { useLoginModalStore } from '@/stores/loginModal'
import { getLocale } from '@/i18n'

const loginModalStore = useLoginModalStore()

const iconAdd = computed(() => (theme.value === 'light' ? iconAddLight : iconAddDark))

const localized = (en: string, cn: string): string => (getLocale() === 'en' ? en : cn)

const INVITE_CODE_LENGTH = 7
const inviteCode: string[] = Array(INVITE_CODE_LENGTH).fill('')

const activeFilter = 'all'
const filters = [
  { key: 'all', labelEn: 'All', labelCn: '全部' },
  { key: 'nlh', labelEn: "Hold'em", labelCn: '德州' },
  { key: 'plo', labelEn: 'Omaha', labelCn: '奥马哈' },
  { key: 'short', labelEn: '6+', labelCn: '6+' },
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
    <div class="title-bar">
      <div class="title">{{ localized('Friend Tables', '朋友桌') }}</div>
      <div class="currency-info" @click="notifyNotLogin">
        <div class="icon-diamond">
          <img :src="iconDiamond" alt="钻石" />
        </div>
        <div class="num">{{ displayUser.diamond }}</div>
        <div class="icon-recharge">
          <img :src="iconAdd" alt="充值" />
        </div>
      </div>
    </div>

    <div class="scroll-content">
      <div class="main-content">
        <div class="section join-section">
          <div class="section-title">{{ localized('Join Table', '加入牌局') }}</div>
          <div class="section-subtitle">
            {{ localized('Enter an invite code to play with friends', '输入邀请码，和朋友一起切磋') }}
          </div>
          <div class="invite-inputs" @click="notifyNotLogin">
            <div v-for="(digit, index) in inviteCode" :key="index" class="invite-input-wrap">
              <span class="invite-digit">{{ digit }}</span>
            </div>
          </div>

          <button class="action-btn" @click="notifyNotLogin">
            <span>{{ localized('Join Now', '立即加入') }}</span>
          </button>
        </div>

        <div class="section create-section">
          <div class="section-title">{{ localized('Quick Game', '快速组局') }}</div>
          <button class="action-btn" @click="notifyNotLogin">{{ localized('Create Now', '开始创建') }}</button>
        </div>
      </div>

      <div class="section table-section">
        <div class="table-header">
          <div class="table-header-line"></div>
          <div class="table-header-center">
            <div class="table-header-title">{{ localized('Active Tables', '当前牌桌') }}</div>
            <div class="table-header-sub">
              {{ localized('Currently available tables', '显示目前有效的牌桌') }}
            </div>
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
            {{ localized(filter.labelEn, filter.labelCn) }}
          </div>
        </div>

        <div class="table-list">
          <div class="empty-state">
            <div class="empty-text">{{ localized('Log in to view tables', '登录后查看牌桌') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.friends-table-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 0;
  color: var(--color-text-main2);
}

.title-bar {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.78rem;
  .title {
    font-size: 0.65rem;
    font-weight: 510;
    line-height: 120%;
    text-shadow: 0 0.22rem 0.5rem rgba(0, 0, 0, 0.35);
  }
  .currency-info {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--color-bg-shadow);
    padding: 0 0.24rem;
    border-radius: 0.6rem;
    overflow: hidden;
    gap: 0.2rem;
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
      img {
        width: 100%;
      }
    }
  }
}

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
}

.section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0.9rem;
}

.section-title {
  font-size: 0.72rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 600;
  color: #fff;
  text-align: center;
  line-height: 1;
  margin-bottom: 0.35rem;
}

.section-subtitle {
  font-size: 0.4rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  line-height: 1;
  margin-bottom: 0.85rem;
}

.action-btn {
  width: 6.44rem;
  height: 1.42rem;
  line-height: 1.42rem;
  padding: 0 1.8rem;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 1rem;
  color: rgba(249, 249, 249, 0.9);
  box-shadow: inset 0.4px 0.4px 0px 0px rgba(255, 255, 255, 1);
  font-size: 0.48rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

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
  }
}

.create-section {
  margin-bottom: 0.6rem;
  .section-title {
    margin-bottom: 0.55rem;
  }
}

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
  }

  .table-header-sub {
    margin-top: 0.1rem;
    font-size: 0.27rem;
    font-family: 'SF Pro', sans-serif;
    font-weight: 400;
    color: #f9f9f9;
    text-align: center;
    line-height: 1;
  }
}

.filter-tabs {
  display: flex;
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

  &.active {
    color: #fff;
    font-weight: 700;
    border-bottom-color: #eaeaea;
  }
}

.table-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.1rem 0.6rem;
}

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
}
</style>
