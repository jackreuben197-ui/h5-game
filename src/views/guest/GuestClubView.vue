<script setup lang="ts">
import iconClubCreate from '@/assets/icons/icon_club_shield.png'
import iconClubCareer from '@/assets/icons/icon_club_data.png'
import iconClubCreateLight from '@/assets/icons/icon_club_shield_light.png'
import iconClubCareerLight from '@/assets/icons/icon_club_data_light.png'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import { t } from '@/i18n'
import { useLoginModalStore } from '@/stores/loginModal'

type QuickActionKind = 'create-club' | 'club-career'

interface QuickActionItem {
  id: number
  title: string
  kind: QuickActionKind
}

const loginModalStore = useLoginModalStore()

const quickActions: QuickActionItem[] = [
  { id: 1, title: t('UIClub_CreateClub'), kind: 'create-club' },
  { id: 2, title: t('PageMineClubCareer'), kind: 'club-career' },
]

function notifyNotLogin(): void {
  loginModalStore.open()
}
</script>

<template>
  <div class="page-shell club-index">
    <section class="search-row">
      <div class="search-shell" :aria-label="t('UIClub_ClubSearch')">
        <label class="search-trigger" for="guest-club-search-input">
          <AppSvgIcon class="search-icon" name="search" />
          <input
            id="guest-club-search-input"
            class="search-input"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            maxlength="6"
            readonly
            :placeholder="t('UIGuild_SearchBtn') + 'ID'"
            @focus="notifyNotLogin"
            @click="notifyNotLogin"
          />
        </label>
        <button type="button" class="search-btn" @click="notifyNotLogin">
          <span class="search-btn-label">{{ t('search') }}</span>
        </button>
      </div>
    </section>

    <section class="quick-actions">
      <button
        v-for="item in quickActions"
        :key="item.id"
        type="button"
        class="quick-item"
        :class="`quick-item--${item.kind}`"
        @click="notifyNotLogin"
      >
        <span class="action-icon">
          <template v-if="item.kind === 'create-club'">
            <img
              class="icon-create-shield only-dark"
              :src="iconClubCreate"
              width="61"
              height="61"
              alt=""
            />
            <img
              class="icon-create-shield only-light"
              :src="iconClubCreateLight"
              width="61"
              height="61"
              alt=""
            />
          </template>
          <template v-else>
            <img
              class="icon-board-chart only-dark"
              :src="iconClubCareer"
              width="61"
              height="61"
              alt=""
            />
            <img
              class="icon-board-chart only-light"
              :src="iconClubCareerLight"
              width="61"
              height="61"
              alt=""
            />
          </template>
        </span>
        <span class="action-text">{{ item.title }}</span>
      </button>
    </section>

    <section class="cards-divider">
      <span class="divider-line"></span>
      <div class="cards-icons" aria-hidden="true">
        <AppSvgIcon class="suit-icon suit-icon--spade" name="spade" />
        <AppSvgIcon class="suit-icon suit-icon--heart" name="heart" />
        <AppSvgIcon class="suit-icon suit-icon--club" name="club" />
        <AppSvgIcon class="suit-icon suit-icon--diamond" name="diamond" />
      </div>
      <span class="divider-line"></span>
    </section>

    <section class="club-list">
      <p class="club-empty-text">登录后查看俱乐部</p>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.club-index {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
  color: var(--c-text);
}

.search-row {
  padding: 0;
}

.search-shell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 1.34rem;
  padding: 0.127rem 0.203rem 0.127rem 0.447rem;
  overflow: hidden;
  border-radius: 1.055rem;
  background: linear-gradient(
    98deg,
    rgba(133, 73, 115, 0.96) 0%,
    rgba(177, 69, 87, 0.96) 44%,
    rgba(178, 76, 51, 0.96) 72%,
    rgba(141, 59, 84, 0.96) 100%
  );
  box-shadow:
    inset 0 0.01rem 0.045rem rgba(255, 255, 255, 0.31),
    inset 0 -0.04rem 0.08rem rgba(0, 0, 0, 0.25);

  @include theme-light {
    background: #fff;
    box-shadow: 0 0.04rem 0.14rem rgba(34, 34, 34, 0.08);
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.18) 0%,
      rgba(255, 255, 255, 0.03) 38%,
      rgba(0, 0, 0, 0.2) 100%
    );
    pointer-events: none;

    @include theme-light {
      display: none;
    }
  }
}

.search-trigger {
  position: relative;
  z-index: 1;
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: flex-start;
  min-height: 1.089rem;
  padding: 0;
  gap: 0.218rem;
  border: 0;
  border-radius: 999px;
  color: var(--c-text);
  background: transparent;
}

.search-icon {
  flex: 0 0 auto;
  width: 0.557rem;
  height: 0.546rem;
  color: #f9f9f9;

  @include theme-light {
    color: rgba(0, 0, 0, 0.28);
  }
}

.search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  color: var(--c-text);
  background: transparent;
  font-family: 'HONOR Sans CN', 'PingFang SC', sans-serif;
  font-size: 0.393rem;
  line-height: 1.4;
}

.search-input::placeholder {
  color: var(--c-text-muted);
}

.search-btn {
  position: relative;
  z-index: 1;
  display: inline-flex;
  flex: 0 0 auto;
  width: 2.12rem;
  min-height: 1.089rem;
  align-items: center;
  justify-content: center;
  padding: 0.209rem 0.58rem;
  overflow: hidden;
  border: 0.012rem solid rgba(244, 241, 248, 0.68);
  border-radius: 0.54rem;
  color: var(--c-text);
  background: rgba(165, 165, 165, 0.1);
  box-shadow:
    0.018rem 0.022rem 0.036rem rgba(0, 0, 0, 0.25),
    inset 0 0 0.045rem #000,
    inset 0.006rem 0.006rem 0.045rem #000,
    inset 0 0 0.09rem rgba(242, 242, 242, 0.9);

  @include theme-light {
    border-color: var(--c-brand);
    background: rgba(105, 190, 255, 0.05);
    box-shadow: none;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    backdrop-filter: blur(0.143rem);
    mix-blend-mode: hard-light;
    pointer-events: none;
  }
}

.search-btn-label {
  position: relative;
  z-index: 1;
  font-family: 'SF Pro', 'PingFang SC', sans-serif;
  font-size: 0.38rem;
  font-weight: 500;
  line-height: 0.946;
  letter-spacing: 0;
  text-shadow: 0 0.01rem 0.02rem rgba(0, 0, 0, 0.25);

  @include theme-light {
    text-shadow: none;
  }
}

.quick-actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: 0.03rem;
  padding-left: 0;
  gap: 0.475rem;
}

.quick-item {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  padding: 0;
  gap: 0.088rem;
  border: 0;
  color: var(--c-text);
  background: transparent;
}

.action-icon {
  position: relative;
  display: inline-flex;
  width: 1.62rem;
  height: 1.62rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.action-icon img {
  position: absolute;
  max-width: none;
  object-fit: contain;
}

.action-text {
  width: 100%;
  color: var(--c-text);
  font-size: 0.228rem;
  font-weight: 500;
  line-height: 1;
  text-align: center;
  text-shadow: 0 0.025rem 0.317rem rgba(0, 0, 0, 0.6);
  white-space: nowrap;

  @include theme-light {
    text-shadow: none;
  }
}

.cards-divider {
  display: flex;
  align-items: center;
  margin-top: 0.02rem;
  gap: 0.14rem;
}

.divider-line {
  flex: 1;
  height: 0.02rem;
  background: var(--c-divider);
}

.cards-icons {
  display: inline-flex;
  align-items: center;
  gap: 0.06rem;

  @include theme-light {
    .suit-icon--spade,
    .suit-icon--club {
      color: #222;
    }

    .suit-icon--heart,
    .suit-icon--diamond {
      color: var(--c-brand);
    }
  }
}

.suit-icon {
  width: 0.32rem;
  height: 0.32rem;
  color: #f9f9f9;
}

.suit-icon--heart {
  color: #ff5f82;
}

.suit-icon--diamond {
  color: #65dcff;
}

.club-list {
  display: flex;
  flex-direction: column;
  padding-bottom: 0.44rem;
  gap: 0.3rem;
}

.club-empty-text {
  margin: 0;
  padding: 0.24rem 0;
  color: var(--c-text-muted);
  font-size: 0.28rem;
  text-align: center;
}

@media (max-width: 340px) {
  .quick-actions {
    gap: 0.32rem;
  }

  .action-icon {
    width: 1.08rem;
    height: 1.08rem;
  }

  .quick-item {
    width: 1.08rem;
  }

  .action-text {
    font-size: 0.22rem;
  }

  .search-btn {
    width: 1.36rem;
    min-width: 1.36rem;
  }
}
</style>
