<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import icArrowRight from '@/assets/icons/ic_arrow_right.svg'
import icReset from '@/assets/icons/ic_reset.svg'
import icSecurity from '@/assets/icons/ic_security.svg'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { t } from '@/i18n'

interface AccountActionItem {
  key: string
  label: string
  icon: string
  arrow?: boolean
}

const router = useRouter()

const title = computed(() => t('UISettingPassword001'))

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const route = useRoute()
const securityPasswordEnabled = ref(false)

if (route.query.security === 'on') {
  securityPasswordEnabled.value = true
}

const rows = computed<AccountActionItem[]>(() => [
  { key: 'reset-password', label: t('UIClub_Code7'), icon: icReset, arrow: true },
  { key: 'security-password', label: '6' + t('UIClub_Code8'), icon: icSecurity },
  { key: 'reset-security-password', label: t('UICommon_Edit') + '6' + t('UIClub_Code8'), icon: icReset, arrow: true },
])

function onRowClick(item: AccountActionItem): void {
  if (item.key === 'reset-password') {
    void router.push('/mine/settings/account/reset-password?tab=phone')
    return
  }

  if (item.key === 'reset-security-password') {
    void router.push('/mine/settings/account/reset-security-password')
  }
}

function openSecurityPasswordFlow(): void {
  if (securityPasswordEnabled.value) {
    void router.push('/mine/settings/account/reset-security-password')
    return
  }

  void router.push('/mine/settings/account/security-password/setup')
}
</script>

<template>
  <div class="page-shell settings-page settings-page--account" :style="backgroundStyle">
    <HeaderBack :title="title" />

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
            <img class="row-icon" :src="item.icon" alt="" aria-hidden="true" />
            <span class="label">{{ item.label }}</span>
          </div>

          <div class="right-wrap">
            <button
              v-if="item.key === 'security-password'"
              type="button"
              class="switch"
              :class="{ on: securityPasswordEnabled }"
              @click.stop="openSecurityPasswordFlow"
            >
              <span class="dot"></span>
            </button>
            <img v-else-if="item.arrow" class="arrow-icon" :src="icArrowRight" alt="" aria-hidden="true" />
          </div>
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  height: 100dvh;
  // padding-top: calc(env(safe-area-inset-top) + 0.48rem);
  padding-bottom: 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  padding: 0 0.4533rem;
}

.account-card {
  margin-top: 0.62rem;
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  overflow: hidden;
  padding: 0 0.36rem;
}

.account-row {
  width: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.left-wrap {
  display: flex;
  align-items: center;
  gap: 0.24rem;
}

.label {
  font-size: 0.42rem;
  font-weight: 400;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.94);
}

.row-icon {
  width: 0.56rem;
  height: 0.56rem;
  object-fit: contain;
}

.right-wrap {
  display: inline-flex;
  align-items: center;
}

.arrow-icon {
  width: 0.2444rem;
  height: 0.44rem;
  flex: none;
  object-fit: contain;
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
</style>
