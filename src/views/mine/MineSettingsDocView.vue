<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const route = useRoute()

const docType = computed<'about' | 'agreement' | 'privacy'>(() => {
  const value = String(route.params.type ?? 'about')
  if (value === 'agreement' || value === 'privacy') {
    return value
  }
  return 'about'
})

const title = computed(() => {
  if (docType.value === 'agreement') return '用户协议'
  if (docType.value === 'privacy') return '用户隐私协议'
  return '关于我们'
})

const content = computed(() => {
  if (docType.value === 'agreement') {
    return [
      '欢迎使用本游戏服务。使用本服务即表示您同意遵守本协议全部条款。',
      '您需对账号与密码安全负责，不得以任何形式转借、出租或出让账号。',
      '请勿利用本服务从事违法违规活动，平台有权根据规则采取限制措施。',
      '平台会持续优化产品功能，必要时可对服务条款进行更新并公示。',
    ]
  }

  if (docType.value === 'privacy') {
    return [
      '我们重视您的个人信息与隐私安全，并采取合理措施进行保护。',
      '为实现登录、账号安全与服务运营，可能会收集必要的设备及账号信息。',
      '未经您授权，我们不会将您的个人信息用于与本服务无关的用途。',
      '如需查询、更正或删除个人信息，可通过客服渠道发起申请。',
    ]
  }

  return [
    '本平台致力于为用户提供稳定、公平、安全的线上游戏体验。',
    '我们持续投入于产品性能优化、反作弊能力建设与客服服务体系。',
    '如您在使用过程中遇到问题或建议，欢迎通过官方渠道与我们联系。',
    '感谢您的支持与信任，祝您游戏愉快。',
  ]
})

function goBack(): void {
  router.back()
}
</script>

<template>
  <div class="settings-doc-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="doc-card">
        <h2>{{ title }}</h2>
        <p v-for="(item, index) in content" :key="index">{{ item }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-doc-page {
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

.doc-card {
  margin-top: 0.62rem;
  border-radius: 0.4209rem;
  border: 0.0133rem solid rgba(255, 255, 255, 0.22);
  background: rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(0.08rem);
  padding: 0.46rem;

  h2 {
    margin: 0;
    font-size: 0.49rem;
    font-weight: 600;
    color: #fff;
    line-height: 1.2;
  }

  p {
    margin: 0.28rem 0 0;
    font-size: 0.36rem;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.7;
    text-align: justify;
  }
}
</style>
