<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import { postMiscArtiCleInfoApi } from '@/api/misc'
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

const loading = ref(false)
const content = ref<string[]>([])

function resolveArticleType(): number {
  if (docType.value === 'agreement') {
    return 2
  }
  if (docType.value === 'privacy') {
    return 3
  }
  return 1
}

function extractContentLines(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) {
    return []
  }
  const lines = raw
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
  return lines
}

async function fetchDocContent(): Promise<void> {
  loading.value = true
  try {
    const response = await postMiscArtiCleInfoApi({
      type: resolveArticleType(),
      lang: 'zh_CN',
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载文档失败')
    }

    const article = response.data?.article
    const raw = article?.content_ex?.[0]?.value ?? article?.content ?? ''
    const lines = extractContentLines(raw)
    content.value = lines.length ? lines : ['暂无内容']
  } catch (error) {
    content.value = ['暂无内容']
    const message = error instanceof Error ? error.message : '加载文档失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

watch(docType, () => {
  void fetchDocContent()
})

onMounted(() => {
  void fetchDocContent()
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
        <p v-if="loading">加载中...</p>
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
