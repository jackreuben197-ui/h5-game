<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { postMiscArtiCleInfoApi } from '@/api/misc'
import type { MiscArtiCleInfoContentData } from '@/api/models/misc'
import { getLocale, t, type LocaleCode } from '@/i18n'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'

const AGREEMENT_TYPE = 3
const PRIVACY_TYPE = 4
const PROTOCOL_CACHE_VERSION = 1

const props = withDefaults(
  defineProps<{
    type?: number
    version?: string
  }>(),
  {
    type: AGREEMENT_TYPE,
    version: '',
  },
)

const emit = defineEmits<{
  back: [event: MouseEvent]
}>()

const loading = ref(false)
const errorMessage = ref('')
const articleContent = ref('')

interface ProtocolArticleCacheItem {
  content: string
  articleVersion: string
  updatedAt: number
}

interface ProtocolArticleCachePayload {
  version: number
  appVersion: string
  records: Record<string, ProtocolArticleCacheItem>
}

const articleType = computed<number>(() =>
  props.type === PRIVACY_TYPE ? PRIVACY_TYPE : AGREEMENT_TYPE,
)
const localeCode = computed(() => getLocale())
const articleVersionHint = computed(() => String(props.version || '').trim())
const cacheKey = computed(() => `${articleType.value}:${toServerLang(localeCode.value)}`)

const pageTitle = computed(() => {
  if (articleType.value === PRIVACY_TYPE) {
    return resolveI18nText('UIMine_Setting_UserSecret', '用户隐私协议')
  }
  return resolveI18nText('tc_5E0V3qlb', '用户协议')
})

const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const hasArticle = computed(() => Boolean(articleContent.value.trim()))

watch([cacheKey, articleVersionHint], () => {
  void loadArticle()
}, { immediate: true })

async function loadArticle(): Promise<void> {
  const cached = readProtocolCache(cacheKey.value, articleVersionHint.value)
  if (cached) {
    articleContent.value = cached.content
    errorMessage.value = ''
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await postMiscArtiCleInfoApi({
      lang: toServerLang(localeCode.value),
      type: articleType.value,
    })

    if (response.code !== 0) {
      errorMessage.value = response.message || 'Load article failed'
      articleContent.value = ''
      return
    }

    const contentEx = response.data?.article?.content_ex || []
    const formattedContent = formatArticleContent(contentEx)
    const articleVersion = resolveArticleVersion(response.data?.article)
    articleContent.value = formattedContent
    if (formattedContent) {
      writeProtocolCache(cacheKey.value, {
        content: formattedContent,
        articleVersion,
        updatedAt: Date.now(),
      })
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Load article failed'
    articleContent.value = ''
  } finally {
    loading.value = false
  }
}

function formatArticleContent(contentEx: MiscArtiCleInfoContentData[]): string {
  const merged = contentEx
    .map((item) => String(item?.value || ''))
    .join('')
    .trim()

  if (!merged) {
    return ''
  }

  return merged
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function toServerLang(locale: LocaleCode): string {
  if (locale === 'en') {
    return 'en_US'
  }
  if (locale === 'zh') {
    return 'zh_TW'
  }
  if (locale === 'pt') {
    return 'pt_BR'
  }
  return 'zh_CN'
}

function resolveI18nText(key: string, fallback: string): string {
  const result = t(key)
  return result === key ? fallback : result
}

function getAppVersion(): string {
  if (typeof __APP_INFO__ !== 'undefined') {
    return String(__APP_INFO__.pkg?.version || '').trim()
  }
  return ''
}

function readProtocolCache(key: string, expectedVersion: string): ProtocolArticleCacheItem | null {
  const cached = localStore.getItem<ProtocolArticleCachePayload | null>(
    StorageKey.PROTOCOL_ARTICLE_CACHE,
    null,
  )
  if (!cached || typeof cached !== 'object') {
    return null
  }

  if (cached.version !== PROTOCOL_CACHE_VERSION) {
    return null
  }

  if (cached.appVersion !== getAppVersion()) {
    return null
  }

  const record = cached.records?.[key]
  if (!record || typeof record.content !== 'string') {
    return null
  }

  if (expectedVersion && expectedVersion !== record.articleVersion) {
    return null
  }

  return record
}

function writeProtocolCache(key: string, record: ProtocolArticleCacheItem): void {
  const cached = localStore.getItem<ProtocolArticleCachePayload | null>(
    StorageKey.PROTOCOL_ARTICLE_CACHE,
    null,
  )
  const records =
    cached && typeof cached === 'object' && cached.records && typeof cached.records === 'object'
      ? { ...cached.records }
      : {}

  records[key] = record

  localStore.setItem(StorageKey.PROTOCOL_ARTICLE_CACHE, {
    version: PROTOCOL_CACHE_VERSION,
    appVersion: getAppVersion(),
    records,
  } as ProtocolArticleCachePayload)
}

function resolveArticleVersion(article: unknown): string {
  if (!article || typeof article !== 'object' || Array.isArray(article)) {
    return ''
  }

  const record = article as Record<string, unknown>
  const candidates = [
    record.version,
    record.update_time,
    record.updated_at,
    record.updateTime,
    record.id,
  ]

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null) {
      const normalized = String(candidate).trim()
      if (normalized) {
        return normalized
      }
    }
  }

  return ''
}
</script>

<template>
  <div class="protocol-page" :style="backgroundStyle">
    <HeaderBack :title="pageTitle" @back="emit('back', $event)" />

    <div class="content-wrap">
      <section class="content-card">
        <p v-if="loading" class="status-line">
          {{ resolveI18nText('SuperView2', '加载中...') }}
        </p>

        <template v-else-if="hasArticle">
          <p class="article-text">{{ articleContent }}</p>
        </template>

        <div v-else class="status-wrap">
          <p class="status-line">
            {{ errorMessage || resolveI18nText('MsgContentUnRead', '暂无内容') }}
          </p>
          <button class="retry-btn" type="button" @click="loadArticle">
            {{ resolveI18nText('MSG_LoadFail', '重新加载') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.protocol-page {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: calc(env(safe-area-inset-top) + 0.48rem);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #fff;
}

.content-wrap {
  flex: 1;
  min-height: 0;
  padding: 0.2rem 0.6rem 0;
  display: flex;
  flex-direction: column;
}

.content-card {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  backdrop-filter: blur(0.08rem);
  -webkit-overflow-scrolling: touch;
}

.article-text {
  margin: 0;
  font-size: 0.36rem;
  line-height: 1.72;
  color: rgba(255, 255, 255, 0.92);
  white-space: pre-wrap;
  word-break: break-word;
}

.status-wrap {
  min-height: 6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.3rem;
}

.status-line {
  margin: 0;
  text-align: center;
  font-size: 0.36rem;
  color: rgba(255, 255, 255, 0.86);
}

.retry-btn {
  border: 0;
  border-radius: 0.6rem;
  min-width: 2.6rem;
  height: 0.9rem;
  font-size: 0.32rem;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
}
</style>
