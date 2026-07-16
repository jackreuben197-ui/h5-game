<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { GameDialog } from '@/components/Dialog'
import { getLocale, t } from '@/i18n'
import LoginSession from '@/session/loginSession'
import { useGameStore } from '@/stores/game'

const title = computed(() => t('UIMine_btn_setting'))

const router = useRouter()
const gameStore = useGameStore()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const soundEnabled = ref(true)
const showLogoutDialog = ref(false)

interface SettingItem {
  key: string
  label: string
  rightText?: string
  toggle?: boolean
  clickable?: boolean
}

const sectionTop: SettingItem[] = [
  { key: 'logout', label: t('UIMine_Setting114') },
  { key: 'language', label: t('tc_PpNL8LVJ'), rightText: languageLabel() },
  { key: 'account', label: t('UISettingPassword001') },
]

const sectionMiddle: SettingItem[] = [
  { key: 'sound', label: t('tc_TsALrril'), toggle: true },
  { key: 'line', label: t('tc_FKurKJYR'), rightText: t('UIClub_Text73') },
  { key: 'cancel', label: t('UIMine_DeleteUser') },
  { key: 'about', label: t('tc_YQAGnw3p') },
  { key: 'agreement', label: t('tc_5E0V3qlb') },
]

const sectionBottom: SettingItem[] = [
  { key: 'privacy', label: t('UIMine_Setting_UserSecret') },
  { key: 'version', label: t('tc_NO5NT6aa'), rightText: 'v1.0.0', clickable: false },
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

function onRowClick(item: SettingItem): void {
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
    showFailToast(t('UIClub_InDeve4'))
  }
}

function onLogoutConfirm(): void {
  showLogoutDialog.value = false
  gameStore.clearLogin()
  LoginSession.ClearWS()
  showSuccessToast(t('UIClub_DoneExit'))
  void router.replace('/guest/home')
}

function onLogoutCancel(): void {
  showLogoutDialog.value = false
}
</script>

<template>
  <div class="page-shell mine-glass-page" :style="backgroundStyle">
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
          <span>{{ item.label }}</span>
          <div class="right">
            <span v-if="item.rightText" class="light">{{ item.rightText }}</span>
            <span class="arrow">›</span>
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
          <span>{{ item.label }}</span>
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
              <span class="arrow">›</span>
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
          <span>{{ item.label }}</span>
          <div class="right">
            <span v-if="item.rightText" class="light">{{ item.rightText }}</span>
            <span v-if="item.clickable !== false" class="arrow">›</span>
          </div>
        </button>
      </section>
    </div>

    <GameDialog
      v-model:show="showLogoutDialog"
      title="退出登录"
      :show-cancel-button="true"
      :close-on-click-overlay="true"
      confirm-button-text="确认"
      cancel-button-text="取消"
      @confirm="onLogoutConfirm"
      @cancel="onLogoutCancel"
    >
      <div class="logout-confirm-text">确认退出当前账号吗？</div>
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
  border-radius: 0.42rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
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
  padding: 0.28rem 0;
  border-bottom: 0.02rem solid rgba(249, 249, 249, 0.2);

  &:last-child {
    border-bottom: 0;
  }
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
  font-size: 0.66rem;
  line-height: 1;
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
    background: var(--c-brand);

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
