<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { showFailToast } from 'vant'
import { postMiscArtiCleInfoApi } from '@/api/misc'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { t } from '@/i18n'

// 主容器背景图：全页面共用一张底图，深浅色各一张。
const backgroundStyle = computed(() => ({
  '--settings-doc-bg-dark': `url(${mainBgUrl})`,
  '--settings-doc-bg-light': `url(${mainBgLightUrl})`,
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

const loading = ref(false)
const content = ref<string[]>([])

function resolveArticleType(): number {
  if (docType.value === 'agreement') {
    return 3
  }
  if (docType.value === 'privacy') {
    return 4
  }
  return 5
}

function extractContentLines(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) {
    return []
  }
  const lines = raw
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  return lines
}

async function fetchDocContent(): Promise<void> {
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
      <section class="doc-card">
        <!-- <h2>{{ title }}</h2> -->
        <p v-if="loading">{{ t('SuperView2') }}...</p>
        <p v-for="(item, index) in content" :key="index">{{ item }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.settings-doc-page {
  height: 100dvh;
  color: #f9f9f9;
  background-image: var(--settings-doc-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: #000;
    background-image: var(--settings-doc-bg-light);
  }
}

.content-wrap {
  padding: 0 0.4533rem;
}

// .doc-card {
//   margin-top: 0.62rem;
//   border-radius: 0.4209rem;
//   border: 0.0133rem solid rgba(255, 255, 255, 0.22);
//   background: rgba(0, 0, 0, 0.22);
//   backdrop-filter: blur(0.08rem);
//   padding: 0.46rem;

//   h2 {
//     margin: 0;
//     font-size: 0.49rem;
//     font-weight: 600;
//     color: #fff;
//     line-height: 1.2;
//   }

//   p {
//     margin: 0.28rem 0 0;
//     font-size: 0.36rem;
//     color: rgba(255, 255, 255, 0.9);
//     line-height: 1.7;
//     text-align: justify;
//   }
// }
</style>
