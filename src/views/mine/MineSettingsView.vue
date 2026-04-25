<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const soundEnabled = ref(true)

interface SettingItem {
  key: string
  label: string
  rightText?: string
  toggle?: boolean
}

const sectionTop: SettingItem[] = [
  { key: 'logout', label: '退出登录' },
  { key: 'language', label: '切换语言', rightText: '切换语言' },
  { key: 'account', label: '账号管理' },
]

const sectionMiddle: SettingItem[] = [
  { key: 'sound', label: '游戏声音', toggle: true },
  { key: 'line', label: '当前线路', rightText: '切换语言' },
  { key: 'cancel', label: '注销账号' },
  { key: 'about', label: '关于我们' },
  { key: 'agreement', label: '用户协议' },
]

const sectionBottom: SettingItem[] = [
  { key: 'privacy', label: '用户隐私协议' },
  { key: 'version', label: '版本号' },
]

function goBack(): void {
  void router.push('/mine')
}

function onRowClick(item: SettingItem): void {
  if (item.key === 'language') {
    void router.push('/mine/settings/language')
    return
  }

  if (item.key === 'account') {
    void router.push('/mine/settings/account')
    return
  }

  if (item.key === 'cancel') {
    void router.push('/mine/settings/cancel-account?tab=phone')
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
  }
}
</script>

<template>
  <div class="mine-glass-page">
    <header class="page-head">
      <button class="back-btn" type="button" @click="goBack">‹</button>
      <h1>设置</h1>
      <div class="placeholder" />
    </header>

    <section class="glass-card section-card">
      <button v-for="item in sectionTop" :key="item.key" type="button" class="line-item" @click="onRowClick(item)">
        <span>{{ item.label }}</span>
        <div class="right">
          <span v-if="item.rightText" class="light">{{ item.rightText }}</span>
          <span class="arrow">›</span>
        </div>
      </button>
    </section>

    <section class="glass-card section-card">
      <button v-for="item in sectionMiddle" :key="item.key" type="button" class="line-item" @click="onRowClick(item)">
        <span>{{ item.label }}</span>
        <div class="right">
          <template v-if="item.toggle">
            <button type="button" class="switch" :class="{ on: soundEnabled }" @click.stop="soundEnabled = !soundEnabled">
              <span class="dot" />
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
      <button v-for="item in sectionBottom" :key="item.key" type="button" class="line-item" @click="onRowClick(item)">
        <span>{{ item.label }}</span>
        <span class="arrow">›</span>
      </button>
    </section>
  </div>
</template>

<style scoped lang="scss">
.mine-glass-page {
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.46rem) 0.45rem 0.8rem;
  color: #f9f9f9;
  background:
    radial-gradient(60% 42% at 20% 10%, rgba(226, 163, 133, 0.6) 0%, rgba(226, 163, 133, 0) 100%),
    radial-gradient(55% 45% at 25% 85%, rgba(206, 107, 160, 0.6) 0%, rgba(206, 107, 160, 0) 100%),
    radial-gradient(45% 38% at 88% 84%, rgba(0, 183, 212, 0.58) 0%, rgba(0, 183, 212, 0) 100%),
    linear-gradient(160deg, #b58eb1 0%, #8d668d 54%, #6f5988 100%);
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 {
    margin: 0;
    font-size: 0.66rem;
    font-weight: 500;
  }
}

.back-btn {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.72rem;
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
