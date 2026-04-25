<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
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
  <div class="settings-doc-page">
    <header class="page-header">
      <button class="back-btn" type="button" @click="goBack">‹</button>
      <h1>{{ title }}</h1>
      <div class="header-placeholder" />
    </header>

    <section class="doc-card">
      <h2>{{ title }}</h2>
      <p v-for="(item, index) in content" :key="index">{{ item }}</p>
    </section>
  </div>
</template>

<style scoped lang="scss">
.settings-doc-page {
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.48rem) 0.4533rem 0.8rem;
  color: #f9f9f9;
  background:
    radial-gradient(60% 42% at 20% 10%, rgba(226, 163, 133, 0.62) 0%, rgba(226, 163, 133, 0) 100%),
    radial-gradient(55% 45% at 26% 84%, rgba(206, 107, 160, 0.58) 0%, rgba(206, 107, 160, 0) 100%),
    radial-gradient(45% 38% at 88% 84%, rgba(0, 183, 212, 0.56) 0%, rgba(0, 183, 212, 0) 100%),
    linear-gradient(160deg, #b58eb1 0%, #8d668d 54%, #6f5988 100%);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 {
    margin: 0;
    font-family: var(--font-family-SF);
    font-size: 0.6424rem;
    font-weight: 400;
    line-height: 1.2;
    color: #fff;
  }
}

.back-btn,
.header-placeholder {
  width: 0.72rem;
  height: 0.72rem;
}

.back-btn {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.72rem;
  line-height: 1;
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
