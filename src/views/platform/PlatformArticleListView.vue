<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import { postMiscArtiClePushListApi } from '@/api/misc'
import type {
  MiscArtiClePushListContentData,
  MiscArtiClePushListRecord,
} from '@/api/models/misc'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { t, toServerLang } from '@/i18n'
import platformNewsCardBgUrl from '@/assets/images/platform_news_card_bg.png'
import { getPlatformInfoLabel } from './platformLabels'

const PAGE_SIZE = 10
const PULL_REFRESH_DISTANCE = 72

type LoadMode = 'initial' | 'refresh' | 'more'

const router = useRouter()
const pageRef = ref<HTMLElement | null>(null)
const loadMoreRef = ref<HTMLElement | null>(null)
const groups = ref<MiscArtiClePushListRecord[]>([])
const loading = ref(false)
const refreshing = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const offset = ref(0)
const total = ref<number | null>(null)
const lastPageLength = ref(0)

let loadMoreObserver: IntersectionObserver | null = null
let pullStartY: number | null = null

const hasMore = computed(() => {
  if (total.value !== null) return offset.value < total.value
  return lastPageLength.value >= PAGE_SIZE
})

const hasGroups = computed(() => groups.value.length > 0)

function getScrollRoot(): HTMLElement | null {
  return pageRef.value?.closest('.main-layout-content') as HTMLElement | null
}

function getArticleItems(group: MiscArtiClePushListRecord): MiscArtiClePushListContentData[] {
  return (group.article_list ?? []).filter((article) => article && article.id != null)
}

function getMainArticle(group: MiscArtiClePushListRecord): MiscArtiClePushListContentData | null {
  return getArticleItems(group)[0] ?? null
}

function getSubArticles(group: MiscArtiClePushListRecord): MiscArtiClePushListContentData[] {
  return getArticleItems(group).slice(1)
}

function formatPublishedAt(value: string | undefined): string {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (part: number): string => String(part).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function openArticle(article: MiscArtiClePushListContentData): void {
  if (article.id == null) return
  void router.push({ name: 'platform-article-detail', params: { id: String(article.id) } })
}

function getArticleKey(article: MiscArtiClePushListContentData, groupIndex: number): string {
  return `${groupIndex}-${article.id}`
}

async function loadArticles(mode: LoadMode): Promise<void> {
  if (mode === 'more') {
    if (loading.value || refreshing.value || loadingMore.value || !hasMore.value) return
    loadingMore.value = true
  } else if (mode === 'refresh') {
    if (loading.value || refreshing.value || loadingMore.value) return
    refreshing.value = true
  } else {
    if (loading.value || refreshing.value || loadingMore.value) return
    loading.value = true
  }

  const requestOffset = mode === 'more' ? offset.value : 0
  errorMessage.value = ''

  try {
    const response = await postMiscArtiClePushListApi({
      types: [1],
      limit: PAGE_SIZE,
      offset: requestOffset,
      lang: toServerLang(),
    })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_LoadFail12'))
    }

    const pageData = response.data
    const nextGroups = pageData?.list ?? []
    const responseOffset = pageData?.offset ?? requestOffset

    groups.value = mode === 'more' ? [...groups.value, ...nextGroups] : nextGroups
    offset.value = responseOffset + nextGroups.length
    total.value = typeof pageData?.total === 'number' ? pageData.total : null
    lastPageLength.value = nextGroups.length
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_LoadFail12')
    if (mode === 'initial' && !hasGroups.value) {
      errorMessage.value = message
    } else {
      showFailToast(message)
    }
  } finally {
    loading.value = false
    refreshing.value = false
    loadingMore.value = false
  }
}

function handleTouchStart(event: TouchEvent): void {
  const scrollRoot = getScrollRoot()
  if (scrollRoot && scrollRoot.scrollTop > 0) {
    pullStartY = null
    return
  }

  pullStartY = event.touches[0]?.clientY ?? null
}

function handleTouchEnd(event: TouchEvent): void {
  if (pullStartY == null) return

  const endY = event.changedTouches[0]?.clientY ?? pullStartY
  const distance = endY - pullStartY
  pullStartY = null

  if (distance >= PULL_REFRESH_DISTANCE) {
    void loadArticles('refresh')
  }
}

async function setupLoadMoreObserver(): Promise<void> {
  await nextTick()
  if (!loadMoreRef.value || typeof IntersectionObserver === 'undefined') return

  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void loadArticles('more')
      }
    },
    {
      root: getScrollRoot(),
      rootMargin: '180px 0px',
    },
  )
  loadMoreObserver.observe(loadMoreRef.value)
}

onMounted(async () => {
  await loadArticles('initial')
  await setupLoadMoreObserver()
})

onUnmounted(() => {
  loadMoreObserver?.disconnect()
  loadMoreObserver = null
  groups.value = []
})
</script>

<template>
  <div
    ref="pageRef"
    class="platform-article-page"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
    <HeaderBack :title="getPlatformInfoLabel()" />

    <main class="platform-article-list" aria-live="polite">
      <div v-if="loading && !hasGroups" class="platform-article-list__status">
        {{ t('SuperView2') }}...
      </div>

      <div v-else-if="errorMessage && !hasGroups" class="platform-article-list__status">
        {{ errorMessage }}
      </div>

      <div v-else-if="!hasGroups" class="platform-article-list__status">
        {{ t('UIMatchNoTournaments') }}
      </div>

      <section
        v-for="(group, groupIndex) in groups"
        :key="`${group.publish_time ?? 'group'}-${groupIndex}`"
        class="platform-news-group"
      >
        <time v-if="group.publish_time" class="platform-news-group__time">
          {{ formatPublishedAt(group.publish_time) }}
        </time>

        <button
          v-if="getMainArticle(group)"
          class="platform-news-card__main"
          type="button"
          @click="openArticle(getMainArticle(group)!)"
        >
          <span class="platform-news-card__main-media">
            <img
              v-if="getMainArticle(group)?.banner_url"
              :src="getMainArticle(group)?.banner_url"
              :alt="getMainArticle(group)?.title ?? ''"
              loading="lazy"
            />
          </span>
          <span class="platform-news-card__main-body">
            <span class="platform-news-card__main-title">{{ getMainArticle(group)?.title }}</span>
            <span class="platform-news-card__main-action">{{ getPlatformInfoLabel() }}</span>
          </span>
        </button>

        <div v-if="getSubArticles(group).length" class="platform-news-card__sub-list">
          <button
            v-for="article in getSubArticles(group)"
            :key="getArticleKey(article, groupIndex)"
            class="platform-news-card__sub-item"
            type="button"
            @click="openArticle(article)"
          >
            <span class="platform-news-card__sub-media">
              <img
                v-if="article.banner_url"
                :src="article.banner_url"
                :alt="article.title ?? ''"
                loading="lazy"
              />
            </span>
            <span class="platform-news-card__sub-title">{{ article.title }}</span>
          </button>
        </div>
      </section>

      <div ref="loadMoreRef" class="platform-article-list__load-more">
        <span v-if="refreshing">{{ t('SuperView2') }}...</span>
        <span v-else-if="loadingMore">{{ t('SuperView2') }}...</span>
        <span v-else-if="hasGroups && !hasMore">{{ t('UIClub_NoMore') }}</span>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.platform-article-page {
  min-height: 100%;
  color: #f7f8fa;
}

.platform-article-list {
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  padding: 0 0.36rem calc(1.2rem + env(safe-area-inset-bottom));
}

.platform-article-list__status,
.platform-article-list__load-more {
  padding: 0.46rem 0;
  color: rgba(255, 255, 255, 0.66);
  font-size: 0.24rem;
  text-align: center;
}

.platform-news-group {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  overflow: hidden;
  padding: 0.14rem;
  border: 0.02rem solid rgba(255, 255, 255, 0.14);
  border-radius: 0.22rem;
  background: rgba(24, 30, 39, 0.82);
  box-shadow: 0 0.08rem 0.2rem rgba(0, 0, 0, 0.12);
}

.platform-news-group__time {
  padding: 0.02rem 0.08rem;
  color: rgba(255, 255, 255, 0.52);
  font-size: 0.22rem;
}

.platform-news-card__main,
.platform-news-card__sub-item {
  width: 100%;
  border: 0;
  color: inherit;
  text-align: left;
  background: transparent;
}

.platform-news-card__main {
  display: flex;
  min-height: 2.08rem;
  overflow: hidden;
  padding: 0;
  border-radius: 0.18rem;
  background: rgba(6, 10, 18, 0.72);
}

.platform-news-card__main:active,
.platform-news-card__sub-item:active {
  opacity: 0.82;
}

.platform-news-card__main-media {
  display: block;
  width: 2.84rem;
  min-width: 2.84rem;
  min-height: 2.08rem;
  background: v-bind(platformNewsCardBgUrl) center / cover no-repeat;
}

.platform-news-card__main-media img,
.platform-news-card__sub-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.platform-news-card__main-body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.12rem;
  padding: 0.22rem 0.24rem;
}

.platform-news-card__main-title {
  display: -webkit-box;
  overflow: hidden;
  font-size: 0.31rem;
  font-weight: 700;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.platform-news-card__main-action {
  align-self: flex-start;
  padding: 0.08rem 0.18rem;
  border-radius: 0.16rem;
  color: #182229;
  font-size: 0.22rem;
  background: #42e8a0;
}

.platform-news-card__sub-list {
  display: flex;
  flex-direction: column;
}

.platform-news-card__sub-item {
  display: flex;
  align-items: center;
  gap: 0.16rem;
  min-height: 0.98rem;
  padding: 0.12rem 0.06rem;
  border-top: 0.01rem solid rgba(255, 255, 255, 0.12);
}

.platform-news-card__sub-media {
  display: block;
  width: 0.86rem;
  height: 0.72rem;
  flex: 0 0 0.86rem;
  overflow: hidden;
  border-radius: 0.12rem;
  background: v-bind(platformNewsCardBgUrl) center / cover no-repeat;
}

.platform-news-card__sub-title {
  display: -webkit-box;
  min-width: 0;
  overflow: hidden;
  font-size: 0.27rem;
  line-height: 1.4;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.platform-news-card__sub-media img {
  object-fit: contain;
}

:root[data-theme='light'] .platform-article-page {
  color: #1f2429;
}

:root[data-theme='light'] .platform-article-list__status,
:root[data-theme='light'] .platform-article-list__load-more,
:root[data-theme='light'] .platform-news-group__time {
  color: rgba(31, 36, 41, 0.58);
}

:root[data-theme='light'] .platform-news-group {
  border-color: rgba(31, 36, 41, 0.12);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 0.08rem 0.2rem rgba(31, 36, 41, 0.08);
}

:root[data-theme='light'] .platform-news-card__main {
  background: rgba(239, 244, 248, 0.9);
}

:root[data-theme='light'] .platform-news-card__sub-item {
  border-top-color: rgba(31, 36, 41, 0.12);
}
</style>
