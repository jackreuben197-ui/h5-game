<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

interface AccountActionItem {
  key: string
  label: string
  iconClass: string
  arrow?: boolean
}

const router = useRouter()

const title = computed(() => '账号管理')

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const route = useRoute()
const securityPasswordEnabled = ref(false)

if (route.query.security === 'on') {
  securityPasswordEnabled.value = true
}

const rows: AccountActionItem[] = [
  { key: 'reset-password', label: 'Reset password', iconClass: 'icon-reset', arrow: true },
  { key: 'security-password', label: 'Security password protection', iconClass: 'icon-sound' },
  { key: 'reset-security-password', label: 'Reset security password', iconClass: 'icon-reset', arrow: true },
]

function goBack(): void {
  router.back()
}

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
  <div class="settings-page settings-page--account" :style="backgroundStyle">
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
            <span class="row-icon" :class="item.iconClass"></span>
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
            <span v-else-if="item.arrow" class="arrow">›</span>
          </div>
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  min-height: 100dvh;
  padding-top: calc(env(safe-area-inset-top) + 0.48rem);
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
  border-radius: 0.4209rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.08rem);
  padding: 0.362rem 0.362rem 0.268rem;
}

.account-row {
  width: 100%;
  border: 0;
  border-bottom: 0.0133rem solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 1.06rem;

  &:last-child {
    border-bottom: 0;
  }
}

.left-wrap {
  display: flex;
  align-items: center;
  gap: 0.2525rem;
}

.label {
  font-family: var(--font-family-SF);
  font-size: 0.404rem;
  font-weight: 400;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.94);
}

.row-icon {
  width: 0.533rem;
  height: 0.533rem;
  border-radius: 0.133rem;
  position: relative;
}

.icon-reset::before,
.icon-reset::after {
  content: '';
  position: absolute;
}

.icon-reset::before {
  inset: 0.066rem;
  border: 0.053rem solid rgba(255, 255, 255, 0.95);
  border-right-color: transparent;
  border-top-color: transparent;
  border-radius: 0.106rem;
}

.icon-reset::after {
  right: 0.02rem;
  top: 0.02rem;
  width: 0.186rem;
  height: 0.186rem;
  border-top: 0.053rem solid rgba(255, 255, 255, 0.95);
  border-right: 0.053rem solid rgba(255, 255, 255, 0.95);
}

.icon-sound::before,
.icon-sound::after {
  content: '';
  position: absolute;
}

.icon-sound::before {
  left: 0.026rem;
  top: 0.133rem;
  width: 0.16rem;
  height: 0.266rem;
  border-radius: 0.053rem;
  background: rgba(255, 255, 255, 0.95);
  clip-path: polygon(0 30%, 60% 30%, 100% 0, 100% 100%, 60% 70%, 0 70%);
}

.icon-sound::after {
  right: 0.08rem;
  top: 0.106rem;
  width: 0.213rem;
  height: 0.32rem;
  border-right: 0.053rem solid rgba(255, 255, 255, 0.95);
  border-top: 0.053rem solid rgba(255, 255, 255, 0.95);
  border-bottom: 0.053rem solid rgba(255, 255, 255, 0.95);
  border-left: 0;
  border-radius: 0 0.266rem 0.266rem 0;
}

.right-wrap {
  display: inline-flex;
  align-items: center;
}

.arrow {
  font-size: 0.72rem;
  line-height: 1;
  color: rgba(255, 255, 255, 0.95);
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
}

.dot {
  width: 0.454rem;
  height: 0.454rem;
  border-radius: 50%;
  background: #f4f8f8;
  transition: transform 0.2s ease;
}

.switch.on .dot {
  transform: translateX(0.6rem);
}
</style>
