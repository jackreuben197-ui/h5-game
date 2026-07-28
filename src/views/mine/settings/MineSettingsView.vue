<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import icArrowRight from '@/assets/icons/ic_arrow_right.svg'
import icLogout from '@/assets/icons/ic_logout.svg'
import icChangeLanguage from '@/assets/icons/ic_change_language.svg'
import icAccountCenter from '@/assets/icons/ic_account_center.svg'
import icGameSound from '@/assets/icons/ic_game_sound.svg'
import icCurrentLine from '@/assets/icons/ic_current_line.svg'
import icDeleteAccount from '@/assets/icons/ic_delete_account.svg'
import icAboutUs from '@/assets/icons/ic_about_us.svg'
import icPolicePrivacy from '@/assets/icons/ic_police_privacy.svg'
import icUserAgreement from '@/assets/icons/ic_user_agreement.svg'
import icAppVersion from '@/assets/icons/ic_app_version.svg'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import GameDialog from '@/components/Dialog/GameDialog.vue'
import { getLocale, t } from '@/i18n'
import LoginSession from '@/session/loginSession'
import { useGameStore } from '@/stores/game'

const localized = (en: string, cn: string): string => (getLocale() === 'en' ? en : cn)

const title = computed(() => t('UIMine_btn_setting'))

const router = useRouter()
const gameStore = useGameStore()
const showLogoutDialog = ref(false)

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const soundEnabled = ref(true)

interface SettingItem {
  key: string
  label: string
  icon?: string
  rightText?: string
  toggle?: boolean
  clickable?: boolean
}

const sectionTop: SettingItem[] = [
  { key: 'logout', label: t('UIMine_Setting114'), icon: icLogout },
  {
    key: 'language',
    label: t('tc_PpNL8LVJ'),
    icon: icChangeLanguage,
    rightText: languageLabel(),
  },
  { key: 'account', label: t('UISettingPassword001'), icon: icAccountCenter },
]

const sectionMiddle: SettingItem[] = [
  { key: 'sound', label: t('tc_TsALrril'), icon: icGameSound, toggle: true },
  {
    key: 'line',
    label: t('tc_FKurKJYR'),
    icon: icCurrentLine,
    rightText: t('UIClub_Text73'),
  },
  { key: 'cancel', label: t('UIMine_DeleteUser'), icon: icDeleteAccount },
  { key: 'about', label: t('tc_YQAGnw3p'), icon: icAboutUs },
  // { key: 'agreement', label: t('tc_5E0V3qlb'), icon: icPolicePrivacy },
]

const sectionBottom: SettingItem[] = [
  // { key: 'privacy', label: t('UIMine_Setting_UserSecret'), icon: icUserAgreement },
  {
    key: 'version',
    label: t('tc_NO5NT6aa'),
    icon: icAppVersion,
    rightText: 'v1.0.0',
    clickable: false,
  },
]

function languageLabel(): string {
  const locale = getLocale()
  if (locale === 'cn') {
    return t('A')
  }
  if (locale === 'zh') {
    return t('UIClub_Text72')
  }
  if (locale === 'pt') {
    return 'Português'
  }
  return 'English'
}

async function onRowClick(item: SettingItem): Promise<void> {
  if (item.clickable === false) {
    return
  }

  if (item.key === 'logout') {
    showLogoutDialog.value = true
    return
  }

  if (item.key === 'language') {
    void router.push('/mine/settings/language')
    return
  }

  if (item.key === 'account') {
    void router.push('/mine/settings/account')
    return
  }

  if (item.key === 'cancel') {
    void router.push('/mine/settings/cancel-account')
    return
  }

  if (item.key === 'about') {
    void router.push('/mine/settings/doc/about')
    return
  }

  if (item.key === 'agreement') {
    void router.push('/mine/settings/doc/agreement')
    return
  }

  if (item.key === 'privacy') {
    void router.push('/mine/settings/doc/privacy')
    return
  }

  if (item.key === 'line') {
    showFailToast(localized('Line switching is under development', '线路切换功能开发中'))
  }
}

function onLogoutConfirm(): void {
  showLogoutDialog.value = false
  gameStore.clearLogin()
  LoginSession.ClearWS()
  showSuccessToast(localized('Logged out', '已退出登录'))
  void router.replace('/guest/home')
}

function onLogoutCancel(): void {
  showLogoutDialog.value = false
}
</script>

<template>
  <div class="page-shell mine-glass-page settings-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="glass-card section-card">
        <button
          v-for="item in sectionTop"
          :key="item.key"
          type="button"
          class="line-item"
          @click="onRowClick(item)"
        >
          <div class="left">
            <img v-if="item.icon" class="item-icon" :src="item.icon" alt="" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </div>
          <div class="right">
            <span v-if="item.rightText" class="light">{{ item.rightText }}</span>
            <img class="arrow" :src="icArrowRight" alt="" aria-hidden="true" />
          </div>
        </button>
      </section>

      <section class="glass-card section-card">
        <button
          v-for="item in sectionMiddle"
          :key="item.key"
          type="button"
          class="line-item"
          @click="onRowClick(item)"
        >
          <div class="left">
            <img v-if="item.icon" class="item-icon" :src="item.icon" alt="" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </div>
          <div class="right">
            <template v-if="item.toggle">
              <button
                type="button"
                class="switch"
                :class="{ on: soundEnabled }"
                @click.stop="soundEnabled = !soundEnabled"
              >
                <span class="dot"></span>
              </button>
            </template>
            <template v-else>
              <span v-if="item.rightText" class="light">{{ item.rightText }}</span>
              <img class="arrow" :src="icArrowRight" alt="" aria-hidden="true" />
            </template>
          </div>
        </button>
      </section>

      <section class="glass-card section-card">
        <button
          v-for="item in sectionBottom"
          :key="item.key"
          type="button"
          class="line-item"
          @click="onRowClick(item)"
        >
          <div class="left">
            <img v-if="item.icon" class="item-icon" :src="item.icon" alt="" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </div>
          <div class="right">
            <span v-if="item.rightText" class="light">{{ item.rightText }}</span>
            <img
              v-if="item.clickable !== false"
              class="arrow"
              :src="icArrowRight"
              alt=""
              aria-hidden="true"
            />
          </div>
        </button>
      </section>
    </div>

    <GameDialog
      v-model:show="showLogoutDialog"
      class="logout-dialog"
      :title="localized('Log out', '退出登录')"
      :show-cancel-button="true"
      :close-on-click-overlay="true"
      :confirm-button-text="localized('Confirm', '确认')"
      :cancel-button-text="localized('Cancel', '取消')"
      @confirm="onLogoutConfirm"
      @cancel="onLogoutCancel"
    >
      <div class="logout-confirm-text">
        {{ localized('Are you sure you want to log out?', '确认退出当前账号吗？') }}
      </div>
    </GameDialog>
  </div>
</template>

<style scoped lang="scss">
.mine-glass-page {
  height: 100dvh;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  padding: 0 0.45rem;
}
.placeholder {
  width: 0.72rem;
}

.glass-card {
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
}

.section-card {
  margin-top: 0.34rem;
  padding: 0 0.36rem;
}

.line-item {
  width: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.42rem;
  font-weight: 400;
  padding: 0.28rem 0;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0.8rem;
    right: 0;
    height: 0.02rem;
    background: rgba(249, 249, 249, 0.2);
  }

  &:last-child::after {
    display: none;
  }
}

.left {
  display: flex;
  align-items: center;
  gap: 0.24rem;
}

.item-icon {
  width: 0.56rem;
  height: 0.56rem;
  object-fit: contain;
}

.right {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.light {
  font-size: 0.28rem;
  color: rgba(255, 255, 255, 0.84);
}

.arrow {
  width: 0.44rem;
  height: 0.44rem;
}

.switch {
  width: 0.9rem;
  height: 0.46rem;
  border: 0;
  border-radius: 0.24rem;
  background: rgba(255, 255, 255, 0.3);
  padding: 0.04rem;
  display: flex;
  align-items: center;

  .dot {
    width: 0.38rem;
    height: 0.38rem;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s ease;
  }

  &.on {
    background: #78e490;

    .dot {
      transform: translateX(0.44rem);
    }
  }
}

.logout-confirm-text {
  text-align: center;
  font-size: 0.38rem;
  color: #fff;
  padding: 0.2rem 0;
}
</style>
