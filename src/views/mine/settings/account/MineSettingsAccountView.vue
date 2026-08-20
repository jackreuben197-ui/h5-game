<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { t } from '@/i18n'
import { useUserInfoStore } from '@/stores/userInfo'
import SettingSvgIcon from '@/views/mine/components/SettingSvgIcon.vue'

type AccountSettingIconName = 'password-reset' | 'security-password'

interface AccountActionItem {
  key: string
  label: string
  icon: AccountSettingIconName
  arrow?: boolean
}

const router = useRouter()
const userInfoStore = useUserInfoStore()

const title = computed(() => t('UISettingPassword001'))

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--account-bg-dark': `url(${mainBgUrl})`,
  '--account-bg-light': `url(${mainBgLightUrl})`,
}))
const securityPasswordEnabled = computed(
  () => Number(userInfoStore.userInfo?.user?.digital_switch) === 1,
)

const rows = computed<AccountActionItem[]>(() => [
  {
    key: 'reset-password',
    label: t('UIMine_SettingPassword'),
    icon: 'password-reset',
    arrow: true,
  },
  {
    key: 'security-password',
    label: t('UIMine_SettingSixPassword'),
    icon: 'security-password',
  },
  {
    key: 'reset-security-password',
    label: t('Change_6digit_password'),
    icon: 'password-reset',
    arrow: true,
  },
])

function onRowClick(item: AccountActionItem): void {
  if (item.key === 'reset-password') {
    void router.push('/mine/settings/account/reset-password')
    return
  }

  if (item.key === 'reset-security-password') {
    void router.push('/mine/settings/account/reset-security-password')
  }
}

function openSecurityPasswordFlow(): void {
  if (securityPasswordEnabled.value) {
    void router.push('/mine/settings/account/reset-security-password?mode=close')
    return
  }

  void router.push('/mine/settings/account/security-password/setup')
}
</script>

<template>
  <div class="page-shell settings-page settings-page--account" :style="backgroundStyle">
    <HeaderBack :title="title" extra-padding />

    <div class="content-wrap">
      <section class="account-card">
        <button
          v-for="item in rows"
          :key="item.key"
          type="button"
          class="account-row"
          @click="onRowClick(item)"
        >
          <div class="left-wrap">
            <span class="row-icon">
              <SettingSvgIcon :name="item.icon" />
            </span>
            <span class="label">{{ item.label }}</span>
          </div>

          <div class="right-wrap">
            <span
              v-if="item.key === 'security-password'"
              class="switch"
              :class="{ on: securityPasswordEnabled }"
              role="switch"
              :aria-checked="securityPasswordEnabled"
              @click.stop="openSecurityPasswordFlow"
            >
              <span class="dot"></span>
            </span>
            <SettingSvgIcon v-else-if="item.arrow" name="chevron-right" class="arrow" />
          </div>
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.settings-page {
  height: 100dvh;
  padding: 0 0 0.8rem;
  color: #f9f9f9;
  background-color: var(--c-page);
  background-image: var(--account-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: #000;
    background-image: var(--account-bg-light);
  }
}

.content-wrap {
  padding: 0 0.4533rem;
}

.account-card {
  margin-top: 0.62rem;
  border-radius: 0.4209rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.08rem);
  padding: 0.362rem 0.4377rem 0.362rem 0.362rem;
  display: flex;
  flex-direction: column;
  gap: 0.2333rem;

  @include theme-light {
    background: #fff;
    backdrop-filter: blur(0.0042rem);
  }
}

.account-row {
  width: 100%;
  min-height: 0.8875rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 1.14rem;
    right: 0;
    bottom: -0.1166rem;
    height: 0.0168rem;
    background: rgba(255, 255, 255, 0.2);
  }

  @include theme-light {
    color: #000;

    &:not(:last-child)::after {
      background: rgba(0, 0, 0, 0.12);
    }
  }
}

.left-wrap {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.2525rem;
}

.label {
  min-width: 0;
  font-family: var(--font-family-SF);
  font-size: 0.404rem;
  font-weight: 400;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.94);
  white-space: nowrap;

  @include theme-light {
    color: #000;
  }
}

.row-icon {
  width: 0.8875rem;
  height: 0.8875rem;
  flex: none;
  border-radius: 0.3039rem;
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

.right-wrap {
  flex: none;
  display: inline-flex;
  align-items: center;
}

.arrow {
  width: 0.2623rem;
  height: 0.4784rem;
  color: rgba(255, 255, 255, 0.95);
  transform: rotate(180deg);

  @include theme-light {
    color: #888;
  }
}

.switch {
  width: 1.1986rem;
  height: 0.5648rem;
  border: 0;
  border-radius: 0.8775rem;
  background: rgba(255, 255, 255, 0.17);
  padding: 0.053rem;
  display: inline-flex;
  align-items: center;

  @include theme-light {
    background: rgba(46, 46, 46, 0.17);
  }
}

.dot {
  width: 0.454rem;
  height: 0.454rem;
  border-radius: 50%;
  background: #f4f8f8;
  transition: transform 0.2s ease;
}

.switch.on {
  background: var(--c-brand);

  @include theme-light {
    background: var(--c-brand);
  }

  .dot {
    transform: translateX(0.6rem);
  }
}
</style>
