<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { showFailToast } from 'vant'
import { postMiscArtiCleInfoApi } from '@/api/misc'
import { getLocale } from '@/i18n'
import mainBgUrl from '@/assets/images/main_bg.webp'
import imgFishLogo from '@/assets/images/img_fish_logo.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { t } from '@/i18n'

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
  if (docType.value === 'agreement') return t('tc_5E0V3qlb')
  if (docType.value === 'privacy') return t('UIMine_Setting_UserSecret')
  return t('tc_YQAGnw3p')
})

const aboutLocale = computed(() => ({
  heading: t('Page_AboutUs_Heading'),
  body: t('Page_AboutUs_Body'),
}))

const loading = ref(false)
const content = ref<string[]>([])

function resolveArticleType(): number {
  if (docType.value === 'agreement') return 3
  if (docType.value === 'privacy') return 4
  return 5
}

function extractContentLines(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

async function fetchDocContent(): Promise<void> {
  if (docType.value === 'about') return
  loading.value = true
  try {
    const response = await postMiscArtiCleInfoApi({
      type: resolveArticleType(),
      lang: 'zh_TW',
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_LoadFail12'))
    }
    const article = response.data?.article
    const raw = article?.content_ex?.[0]?.value ?? article?.content ?? ''
    const lines = extractContentLines(raw)
    content.value = lines.length ? lines : [t('UIClub_No10')]
  } catch (error) {
    content.value = [t('UIClub_No10')]
    const message = error instanceof Error ? error.message : t('UIClub_LoadFail12')
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
</script>

<template>
  <div class="page-shell settings-doc-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <template v-if="docType === 'about'">
        <div class="about-logo">
          <img class="about-logo__fish" :src="imgFishLogo" alt="" />
          <div class="about-logo__text">
            <p class="about-logo__title">小鱼视频真人竞技</p>
            <p class="about-logo__subtitle">xypk.com</p>
          </div>
        </div>

        <h2 class="about-heading">{{ aboutLocale.heading }}</h2>
        <p class="doc-text">{{ aboutLocale.body }}</p>
      </template>

      <template v-else>
        <p v-if="loading" class="doc-text">加载中...</p>
        <p v-for="(item, index) in content" :key="index" class="doc-text">{{ item }}</p>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-doc-page {
  height: 100dvh;
  overflow-y: auto;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  padding: 0 0.4533rem 1.2rem;
  margin-top: 0.62rem;
}

.about-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  margin-bottom: 0.8rem;
}

.about-logo__fish {
  width: 5.2rem;
  object-fit: contain;
}

.about-logo__text {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
}

.about-logo__title {
  font-family: 'PingFang SC', sans-serif;
  font-weight: 600;
  font-size: 0.54rem;
  color: #fff;
  margin: 0;
}

.about-logo__subtitle {
  font-family: 'PingFang SC', sans-serif;
  font-weight: 700;
  font-size: 0.35rem;
  color: #fff;
  margin: 0;
}

.about-heading {
  margin: 0 0 0.32rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
}

.doc-text {
  margin: 0 0 0.28rem;
  font-size: 0.36rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.7;
  font-weight: 400;

}
</style>
