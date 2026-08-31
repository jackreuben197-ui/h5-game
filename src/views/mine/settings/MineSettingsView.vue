<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { GameDialog } from '@/components/Dialog'
import { getLocale, SUPPORTED_LOCALES_OPTIONS, t } from '@/i18n'
import SettingSvgIcon from '@/views/mine/components/SettingSvgIcon.vue'
import { requireRealUser } from '@/session/realUserGate'
import { logoutCurrentSession } from '@/session/experienceSession'
import { useGameStore } from '@/stores/game'

const title = computed(() => t('UIMine_btn_setting'))

const router = useRouter()
const gameStore = useGameStore()
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--settings-bg-dark': `url(${mainBgUrl})`,
  '--settings-bg-light': `url(${mainBgLightUrl})`,
}))
const soundEnabled = ref(true)
const showLogoutDialog = ref(false)
const logoutSubmitting = ref(false)

interface SettingItem {
  key: string
  labelKey: string
  icon: SettingIconName
  rightText?: string
  rightTextKey?: string
  toggle?: boolean
  clickable?: boolean
}

type SettingIconName =
  | 'logout'
  | 'language'
  | 'account'
  | 'sound'
  | 'line'
  | 'cancel-account'
  | 'about'
  | 'agreement'
  | 'privacy'
  | 'version'

const sectionTop = computed<SettingItem[]>(() => [
  ...(gameStore.isRealUser
    ? [{ key: 'logout', labelKey: 'UIMine_Setting114', icon: 'logout' as const }]
    : []),
  {
    key: 'language',
    labelKey: 'tc_PpNL8LVJ',
    icon: 'language',
  },
  { key: 'account', labelKey: 'UISettingPassword001', icon: 'account' },
])

const sectionMiddle: SettingItem[] = [
  { key: 'sound', labelKey: 'tc_TsALrril', icon: 'sound', toggle: true },
  { key: 'line', labelKey: 'tc_FKurKJYR', icon: 'line', rightTextKey: 'UIClub_Text73' },
  { key: 'cancel', labelKey: 'UIMine_DeleteUser', icon: 'cancel-account' },
  { key: 'about', labelKey: 'tc_YQAGnw3p', icon: 'about' },
  { key: 'agreement', labelKey: 'tc_5E0V3qlb', icon: 'agreement' },
]

const sectionBottom: SettingItem[] = [
  { key: 'privacy', labelKey: 'UIMine_Setting_UserSecret', icon: 'privacy' },
  {
    key: 'version',
    labelKey: 'tc_NO5NT6aa',
    icon: 'version',
    rightText: 'v1.0.0',
    clickable: false,
  },
]

function languageLabel(): string {
  const locale = getLocale()
  return SUPPORTED_LOCALES_OPTIONS.find((item) => item.value === locale)?.label ?? 'English'
}

function onRowClick(item: SettingItem): void {
  if (item.clickable === false) {
    return
  }

  if (item.key === 'logout') {
    if (!requireRealUser(() => onRowClick(item))) return
    showLogoutDialog.value = true
    return
  }

  if (item.key === 'language') {
    void router.push('/mine/settings/language')
    return
  }

  if (item.key === 'account') {
    if (!requireRealUser(() => onRowClick(item))) return
    void router.push('/mine/settings/account')
    return
  }

  if (item.key === 'cancel') {
    if (!requireRealUser(() => onRowClick(item))) return
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

async function onLogoutConfirm(): Promise<void> {
  if (logoutSubmitting.value) return
  showLogoutDialog.value = false
  logoutSubmitting.value = true
  try {
    // 服务端登出成功后再清本地，并立即恢复为可预览的体验账号。
    await logoutCurrentSession({ restoreExperience: true })
    showSuccessToast(t('UIClub_DoneExit'))
    await router.replace('/home')
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_Fail')
    showFailToast(message)
  } finally {
    logoutSubmitting.value = false
  }
}

function onLogoutCancel(): void {
  showLogoutDialog.value = false
}
</script>

<template>
  <div class="page-shell mine-glass-page" :style="backgroundStyle">
    <HeaderBack :title="title" extra-padding />

    <div class="content-wrap">
      <section class="glass-card section-card">
        <button
          v-for="item in sectionTop"
          :key="item.key"
          type="button"
          class="line-item"
          @click="onRowClick(item)"
        >
          <span class="left">
            <span class="icon-box">
              <SettingSvgIcon :name="item.icon" />
            </span>
            <span>{{ t(item.labelKey) }}</span>
          </span>
          <div class="right">
            <span v-if="item.key === 'language'" class="light">{{ languageLabel() }}</span>
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
          <span class="left">
            <span class="icon-box">
              <SettingSvgIcon :name="item.icon" />
            </span>
            <span>{{ t(item.labelKey) }}</span>
          </span>
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
              <span v-if="item.rightTextKey" class="light">{{ t(item.rightTextKey) }}</span>
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
          <span class="left">
            <span class="icon-box">
              <SettingSvgIcon :name="item.icon" />
            </span>
            <span>{{ t(item.labelKey) }}</span>
          </span>
          <div class="right">
            <span v-if="item.rightText" class="light">{{ item.rightText }}</span>
            <span v-if="item.clickable !== false" class="arrow">›</span>
          </div>
        </button>
      </section>
    </div>

    <GameDialog
      v-model:show="showLogoutDialog"
      :title="t('UIMine_Setting114')"
      :show-cancel-button="true"
      :close-on-click-overlay="true"
      :confirm-button-text="t('UI_Recharge_confirm')"
      :cancel-button-text="t('adaptation10013')"
      @confirm="onLogoutConfirm"
      @cancel="onLogoutCancel"
    >
      <div class="logout-confirm-text">{{ t('UIClub_ConfirmExitCurrentNo') }}？</div>
    </GameDialog>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.mine-glass-page {
  height: 100dvh;
  overflow-y: auto;
  padding: 0 0 0.8rem;
  color: #f9f9f9;
  background-color: var(--c-page);
  background-image: var(--settings-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: #000;
    background-image: var(--settings-bg-light);
  }
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

  @include theme-light {
    border-color: transparent;
    background: #fff;
  }
}

.section-card {
  margin-top: 0.44rem;
  padding: 0.3rem 0.36rem;
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
  min-height: 1.1rem;
  padding: 0;
  border-bottom: 0.02rem solid rgba(249, 249, 249, 0.2);

  &:last-child {
    border-bottom: 0;
  }

  @include theme-light {
    color: #000;
    border-bottom-color: rgba(0, 0, 0, 0.08);
  }
}

.left {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.icon-box {
  width: 0.88rem;
  height: 0.88rem;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  filter: drop-shadow(0 0 0.1267rem rgba(151, 71, 255, 0.2));

  :deep(.setting-svg-icon) {
    width: 0.533rem;
    height: 0.533rem;
  }

  @include theme-light {
    color: var(--c-brand);
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

  @include theme-light {
    color: rgba(0, 0, 0, 0.83);
  }
}

.arrow {
  --settings-chevron-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9.83788 17.9394'%3E%3Cpath d='M8.96901 17.9394C8.7468 17.9394 8.52456 17.855 8.35559 17.6848L0.254322 9.58355C-0.084774 9.24446 -0.084774 8.69469 0.254322 8.35559L8.35559 0.254322C8.69469 -0.084774 9.24446 -0.084774 9.58355 0.254322C9.92265 0.593418 9.92265 1.14319 9.58355 1.48228L2.0957 8.97014L9.58355 16.458C9.92265 16.7971 9.92265 17.3469 9.58355 17.686C9.41343 17.8549 9.19122 17.9394 8.96901 17.9394Z' fill='black'/%3E%3C/svg%3E");

  display: inline-block;
  width: 0.2623rem;
  height: 0.4784rem;
  flex: none;
  background: currentColor;
  -webkit-mask: var(--settings-chevron-mask) center / 100% 100% no-repeat;
  mask: var(--settings-chevron-mask) center / 100% 100% no-repeat;
  transform: rotate(180deg);
  font-size: 0;
  line-height: 0;
  color: rgba(255, 255, 255, 0.95);

  @include theme-light {
    color: #888;
  }
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

  @include theme-light {
    // color: #000;
  }
}
</style>
