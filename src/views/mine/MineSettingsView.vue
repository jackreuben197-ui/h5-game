<script setup lang="ts">
import { computed, ref } from 'vue'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { getLocale } from '@/i18n'
import LoginSession from '@/session/loginSession'
import { useGameStore } from '@/stores/game'

const title = computed(() => '设置')

const router = useRouter()
const gameStore = useGameStore()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const soundEnabled = ref(true)

interface SettingItem {
  key: string
  label: string
  rightText?: string
  toggle?: boolean
  clickable?: boolean
}

const sectionTop: SettingItem[] = [
  { key: 'logout', label: '退出登录' },
  { key: 'language', label: '切换语言', rightText: languageLabel() },
  { key: 'account', label: '账号管理' },
]

const sectionMiddle: SettingItem[] = [
  { key: 'sound', label: '游戏声音', toggle: true },
  { key: 'line', label: '当前线路', rightText: '默认线路' },
  { key: 'cancel', label: '注销账号' },
  { key: 'about', label: '关于我们' },
  { key: 'agreement', label: '用户协议' },
]

const sectionBottom: SettingItem[] = [
  { key: 'privacy', label: '用户隐私协议' },
  { key: 'version', label: '版本号', rightText: 'v1.0.0', clickable: false },
]

function languageLabel(): string {
  const locale = getLocale()
  if (locale === 'cn') {
    return '简体中文'
  }
  if (locale === 'zh') {
    return '繁體中文'
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
    try {
      await showConfirmDialog({
        title: '退出登录',
        message: '确认退出当前账号吗？',
        confirmButtonText: '确认',
        cancelButtonText: '取消',
      })
      gameStore.clearLogin()
      LoginSession.ClearWS()
      showSuccessToast('已退出登录')
      void router.replace('/login')
    } catch {
      // 用户取消不提示
    }
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
    showFailToast('线路切换功能开发中')
  }
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
    background: #05e7ae;

    .dot {
      transform: translateX(0.44rem);
    }
  }
}
</style>
