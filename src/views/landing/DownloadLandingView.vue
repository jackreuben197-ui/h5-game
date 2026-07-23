<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast, showSuccessToast, showToast } from 'vant'
import { postMiscH5DisplayApi } from '@/api/misc'
import type { MiscH5DisplayDownloadApp } from '@/api/models/misc'
import {
  canPromptInstall,
  isIosSafari,
  isStandaloneDisplay,
  showAddToHomeScreenPrompt,
} from '@/utils/environment'
import {
  installIosWebClip,
  isIos,
  isIosNativeSafari,
  isIosThirdPartyBrowser,
} from '@/utils/iosWebClip'
import { createLogger } from '@/utils/logger'

const log = createLogger('[download-landing]')

// ==================== 数据（对齐 /api/misc/h5/display 的 download_app） ====================
const downloadApp = ref<MiscH5DisplayDownloadApp>({})
const loading = ref(true)

const appName = computed(() => downloadApp.value.name || 'Newpkr')
const appTitle = computed(
  () => downloadApp.value.title || '全球正版德州扑克平台，安全公平，尽享博弈',
)
const appIcon = computed(() => downloadApp.value.icon_url || '')

onMounted(async () => {
  try {
    const response = await postMiscH5DisplayApi()
    if (Number(response.code) === 0 && response.data?.download_app) {
      downloadApp.value = response.data.download_app
    }
  } catch (error) {
    log.warn('load h5 display failed:', error)
  } finally {
    loading.value = false
  }
})

// ==================== 亮点：对齐产品参考页的分区文案 ====================
const highlights = [
  { title: '安全卫士', desc: '7×24 小时守护对局，重拳打击伙牌与作弊' },
  { title: '好友桌', desc: '自建房间 + 灵活规则，随时和朋友组局' },
  { title: 'MTT 锦标赛', desc: '超高奖池持续开放，公平竞技一较高下' },
  { title: '前沿玩法', desc: '全鱿鱼、Spingo、十三水等热门玩法首发' },
]

// ==================== 下载 / 添加桌面（逻辑对齐 BridgeNotificationPanel 步骤1） ====================
function onDownload(): void {
  const url = downloadApp.value.download_url
  if (url) {
    window.open(url, '_blank')
  } else {
    showToast('下载地址暂未配置')
  }
}

async function onAddToHomeScreen(): Promise<void> {
  if (isStandaloneDisplay()) {
    showSuccessToast('已添加到桌面')
    return
  }

  // Android Chrome / Edge / 三星浏览器：原生 PWA 安装框（最佳路径）
  if (canPromptInstall()) {
    const result = await showAddToHomeScreenPrompt()
    if (result === 'accepted') {
      showSuccessToast('已添加到桌面')
      return
    }
    if (result === 'dismissed') return
  }

  // iOS 原生 Safari：下发 mobileconfig 描述文件，一键添加到桌面（安装时需信任未签名描述文件）
  if (isIosNativeSafari()) {
    try {
      showToast({ message: '正在准备安装文件…', duration: 1500 })
      // 部署可能位于站点子路径，用 BASE_URL 解析成绝对地址，避免固定 '/' 打到站点根导致 404。
      const appBaseUrl = new URL(import.meta.env.BASE_URL, window.location.href).toString()
      await installIosWebClip({
        label: appName.value,
        url: appBaseUrl,
        iconUrl: new URL('icon-192.png', appBaseUrl).toString(),
      })
      setTimeout(() => {
        showToast({
          message: '已下载描述文件，请到 设置 → 通用 → VPN 与设备管理 完成安装',
          duration: 5000,
        })
      }, 1500)
    } catch (err) {
      log.error('[web-clip] install failed:', err)
      showFailToast('安装文件生成失败，请稍后重试')
    }
    return
  }

  // iOS Chrome / Firefox / Edge：无法触发 mobileconfig 流程，引导到 Safari
  if (isIosThirdPartyBrowser()) {
    showToast({
      message: 'iOS 上请用 Safari 打开本页面后再点击"添加桌面快捷方式"',
      duration: 4000,
    })
    return
  }

  // iOS 内嵌 WebView（微信/抖音/TG 等）
  if (isIos()) {
    showToast({
      message: '请点击右上角"在浏览器中打开"，使用 Safari 完成添加',
      duration: 4000,
    })
    return
  }

  // 兜底：Android 上 PWA 资产未就绪 / 已 dismiss / 用户参与度未达标
  showToast(
    isIosSafari() ? '请点击底部分享按钮，选择"添加到主屏幕"' : '请在浏览器菜单中选择"添加到主屏幕"',
  )
}
</script>

<template>
  <div class="landing">
    <!-- 背景光晕 -->
    <div class="landing__glow landing__glow--top"></div>
    <div class="landing__glow landing__glow--bottom"></div>

    <div class="landing__scroll">
      <!-- ========== 顶部品牌 ========== -->
      <header class="landing__hero">
        <div class="landing__app">
          <div class="landing__icon-wrap">
            <img v-if="appIcon" class="landing__icon" :src="appIcon" alt="icon" />
            <div v-else class="landing__icon landing__icon--placeholder">
              {{ appName.slice(0, 1) }}
            </div>
            <span class="landing__badge">正版官方</span>
          </div>
          <h1 class="landing__name">{{ appName }}</h1>
          <p class="landing__slogan">{{ appTitle }}</p>
        </div>

        <div class="landing__stats">
          <div class="landing__stat">
            <span class="landing__stat-num">7×24h</span>
            <span class="landing__stat-label">安全守护</span>
          </div>
          <div class="landing__stat-divider"></div>
          <div class="landing__stat">
            <span class="landing__stat-num">全球</span>
            <span class="landing__stat-label">热门玩法</span>
          </div>
          <div class="landing__stat-divider"></div>
          <div class="landing__stat">
            <span class="landing__stat-num">公平</span>
            <span class="landing__stat-label">竞技对局</span>
          </div>
        </div>
      </header>

      <!-- ========== 亮点分区 ========== -->
      <section class="landing__features">
        <div v-for="item in highlights" :key="item.title" class="landing__feature">
          <span class="landing__feature-dot"></span>
          <div class="landing__feature-text">
            <p class="landing__feature-title">{{ item.title }}</p>
            <p class="landing__feature-desc">{{ item.desc }}</p>
          </div>
        </div>
      </section>

      <p class="landing__tip">请认准官方唯一正版下载渠道，谨防第三方盗版链接</p>
    </div>

    <!-- ========== 底部下载栏（sticky） ========== -->
    <footer class="landing__actions">
      <button class="landing__btn landing__btn--secondary" type="button" @click="onAddToHomeScreen">
        <img src="@/assets/icons/icon_layer.svg" alt="" />
        <span>添加桌面快捷方式</span>
      </button>
      <button class="landing__btn landing__btn--primary" type="button" @click="onDownload">
        <img src="@/assets/icons/icon_download.svg" alt="" />
        <span>下载 APP</span>
      </button>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.landing {
  position: relative;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(120% 60% at 50% 0%, rgba(5, 231, 174, 0.14) 0%, rgba(5, 231, 174, 0) 60%),
    linear-gradient(180deg, #0a1512 0%, #05100d 40%, #020807 100%);
  color: #f9f9f9;
  font-family: 'HONOR Sans CN', 'PingFang SC', sans-serif;
  overflow: hidden;
  box-sizing: border-box;
}

/* ---- 背景光晕 ---- */
.landing__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(1.6rem);
  pointer-events: none;
  z-index: 0;

  &--top {
    top: -1.6rem;
    right: -1.2rem;
    width: 4.8rem;
    height: 4.8rem;
    background: rgba(5, 231, 174, 0.28);
  }

  &--bottom {
    bottom: 1.6rem;
    left: -1.6rem;
    width: 5.2rem;
    height: 5.2rem;
    background: rgba(2, 122, 92, 0.35);
  }
}

.landing__scroll {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  /* 关键：flex 子项默认 min-height:auto 不会收缩，导致内容撑高整页、底部被顶出可视区。 */
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0.72rem 0.64rem 0.4rem;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

/* ---- 顶部品牌 ---- */
.landing__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.landing__app {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.landing__icon-wrap {
  position: relative;
  margin-bottom: 0.32rem;
}

.landing__icon {
  width: 2.13rem;
  height: 2.13rem;
  border-radius: 0.53rem;
  object-fit: cover;
  display: block;
  background: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 0.16rem 0.6rem rgba(0, 0, 0, 0.45),
    0 0 0 0.02rem rgba(5, 231, 174, 0.3);

  &--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 700;
    color: #05e7ae;
    background: linear-gradient(157deg, rgba(5, 231, 174, 0.22) 0%, rgba(2, 122, 92, 0.28) 100%);
  }
}

.landing__badge {
  position: absolute;
  bottom: -0.16rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.06rem 0.24rem;
  border-radius: 0.4rem;
  font-size: 0.24rem;
  font-weight: 600;
  white-space: nowrap;
  color: #05100d;
  background: linear-gradient(157deg, #05e7ae 0%, #4bf0c4 100%);
  box-shadow: 0 0.06rem 0.2rem rgba(5, 231, 174, 0.4);
}

.landing__name {
  margin: 0.32rem 0 0.16rem;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.02rem;
  color: #fff;
}

.landing__slogan {
  margin: 0;
  max-width: 7rem;
  font-size: 0.34rem;
  line-height: 1.5;
  color: rgba(249, 249, 249, 0.7);
}

/* ---- 数据条 ---- */
.landing__stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  margin-top: 0.6rem;
  padding: 0.32rem 0.4rem;
  border-radius: 0.4rem;
  background: rgba(255, 255, 255, 0.05);
  border: 0.01rem solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(0.1rem);
}

.landing__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.06rem;
}

.landing__stat-num {
  font-size: 0.44rem;
  font-weight: 700;
  color: #05e7ae;
}

.landing__stat-label {
  font-size: 0.28rem;
  color: rgba(249, 249, 249, 0.6);
}

.landing__stat-divider {
  width: 0.01rem;
  height: 0.6rem;
  background: rgba(255, 255, 255, 0.12);
}

/* ---- 亮点分区 ---- */
.landing__features {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-top: 0.72rem;
}

.landing__feature {
  display: flex;
  align-items: flex-start;
  gap: 0.28rem;
  padding: 0.36rem 0.4rem;
  border-radius: 0.36rem;
  background: linear-gradient(100deg, rgba(5, 231, 174, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%);
  border: 0.01rem solid rgba(255, 255, 255, 0.06);
}

.landing__feature-dot {
  flex-shrink: 0;
  width: 0.18rem;
  height: 0.18rem;
  margin-top: 0.14rem;
  border-radius: 50%;
  background: #05e7ae;
  box-shadow: 0 0 0.16rem rgba(5, 231, 174, 0.8);
}

.landing__feature-title {
  margin: 0 0 0.08rem;
  font-size: 0.4rem;
  font-weight: 600;
  color: #fff;
}

.landing__feature-desc {
  margin: 0;
  font-size: 0.3rem;
  line-height: 1.4;
  color: rgba(249, 249, 249, 0.6);
}

.landing__tip {
  margin: 0.56rem 0 0;
  text-align: center;
  font-size: 0.28rem;
  line-height: 1.5;
  color: rgba(249, 249, 249, 0.4);
}

/* ---- 底部下载栏 ---- */
.landing__actions {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  display: flex;
  gap: 0.24rem;
  padding: 0.32rem 0.64rem calc(0.32rem + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(2, 8, 7, 0) 0%, rgba(2, 8, 7, 0.9) 40%);
  backdrop-filter: blur(0.1rem);
}

.landing__btn {
  flex: 1;
  height: 1.28rem;
  border: none;
  border-radius: 0.8rem;
  font-size: 0.36rem;
  font-weight: 600;
  color: #f9f9f9;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.16rem;

  img {
    width: 0.5rem;
    height: 0.5rem;
  }

  &--secondary {
    flex: 0 0 auto;
    padding: 0 0.44rem;
    background: rgba(255, 255, 255, 0.1);
    border: 0.01rem solid rgba(255, 255, 255, 0.14);
    backdrop-filter: blur(0.08rem);
  }

  &--primary {
    background: linear-gradient(157deg, #05e7ae 0%, #027a5c 100%);
    color: #05100d;
    box-shadow: 0 0.12rem 0.4rem rgba(5, 231, 174, 0.35);
  }

  &:active {
    opacity: 0.88;
    transform: scale(0.99);
  }
  span {
    color: #f9f9f9;
  }
}
</style>
