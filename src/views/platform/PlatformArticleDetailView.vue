<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { showFailToast } from 'vant'
import { postMiscArtiCleIdApi } from '@/api/misc'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { t } from '@/i18n'
import { getPlatformInfoLabel } from './platformLabels'

const route = useRoute()
const loading = ref(false)
const title = ref(getPlatformInfoLabel())
const publishedAt = ref('')
const content = ref<string[]>([])

function extractContentLines(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

async function loadArticle(): Promise<void> {
  const id = String(route.params.id ?? '')
  if (!id) return

  loading.value = true
  try {
    const response = await postMiscArtiCleIdApi({}, { id })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_LoadFail12'))
    }

    const article = response.data?.article
    const rawContent = article?.content_ex?.map((item) => item.value || '').join('\n') || ''
    content.value = extractContentLines(rawContent)
    title.value = String(article?.title ?? title.value)
    publishedAt.value = String(article?.publish_time ?? '')
  } catch (error) {
    content.value = [t('UIClub_No10')]
    showFailToast(error instanceof Error ? error.message : t('UIClub_LoadFail12'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadArticle()
})
</script>

<template>
  <div class="platform-article-detail">
    <HeaderBack :title="title" />
    <main class="platform-article-detail__content">
      <div v-if="loading" class="platform-article-detail__empty">{{ t('UIClub_No10') }}</div>
      <template v-else>
        <time v-if="publishedAt" class="platform-article-detail__time">{{ publishedAt }}</time>
        <p v-for="(line, index) in content" :key="index" class="platform-article-detail__paragraph">
          {{ line }}
        </p>
      </template>
    </main>
  </div>
</template>

<style scoped lang="scss">
.platform-article-detail {
  min-height: 100%;
  color: #f7f8fa;
}

.platform-article-detail__content {
  padding: 0 0.46rem calc(1.2rem + env(safe-area-inset-bottom));
}

.platform-article-detail__empty {
  padding: 1.2rem 0;
  color: rgba(255, 255, 255, 0.66);
  text-align: center;
}

.platform-article-detail__time {
  display: block;
  margin-bottom: 0.2rem;
  color: rgba(255, 255, 255, 0.52);
  font-size: 0.24rem;
}

.platform-article-detail__paragraph {
  margin: 0 0 0.2rem;
  font-size: 0.29rem;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

:root[data-theme='light'] .platform-article-detail {
  color: #1f2429;
}

:root[data-theme='light'] .platform-article-detail__empty,
:root[data-theme='light'] .platform-article-detail__time {
  color: rgba(31, 36, 41, 0.58);
}
</style>
