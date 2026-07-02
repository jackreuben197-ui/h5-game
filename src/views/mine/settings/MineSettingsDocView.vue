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

const aboutContent: Record<string, { heading: string; body: string }> = {
  en: {
    heading: 'About the platform',
    body: 'We have always strived to cultivate a community of poker lovers, to enable poker lovers to play in their desired casual pace on W poker. As the pioneer of friend hosted poker games and quick games, we have been approved by many poker players. W poker is proud to be a fair and trustworthy poker platform. Our shuffling algorithms and random number generators have been certified by Gaming Laboratories International (GLI), the leading independent certification agency in the industry, and is verified to be fair for poker and related games of chance. For a poker platform, fairness is key. Our random number generators decides our shuffling and dealing sequences, and our GLI certification proves that our fairness will in no scenario be compromised.',
  },
  cn: {
    heading: '关于平台',
    body: '我们一直致力于培育一个扑克爱好者社区，让玩家能够在W poker上以自己喜欢的节奏休闲娱乐。作为好友局和快速游戏的先驱，我们已获得众多扑克玩家的认可。W poker致力于成为一个公平、值得信赖的扑克平台。我们的洗牌算法和随机数生成器已通过业内领先的独立认证机构——国际游戏实验室（GLI）的认证，被验证为对扑克及相关博彩游戏公平公正。对于一个扑克平台而言，公平是核心。我们的随机数生成器决定洗牌和发牌顺序，GLI认证证明我们的公平性在任何情况下都不会妥协。',
  },
  zh: {
    heading: '關於平台',
    body: '我們一直致力於培育一個撲克愛好者社群，讓玩家能夠在W poker上以自己喜歡的節奏休閒娛樂。作為好友局和快速遊戲的先驅，我們已獲得眾多撲克玩家的認可。W poker致力於成為一個公平、值得信賴的撲克平台。我們的洗牌演算法和隨機數生成器已通過業內領先的獨立認證機構——國際遊戲實驗室（GLI）的認證，被驗證為對撲克及相關博彩遊戲公平公正。對於一個撲克平台而言，公平是核心。我們的隨機數生成器決定洗牌和發牌順序，GLI認證證明我們的公平性在任何情況下都不會妥協。',
  },
  pt: {
    heading: 'Sobre a plataforma',
    body: 'Sempre nos esforçamos para cultivar uma comunidade de amantes de poker, permitindo que os jogadores joguem no ritmo casual que desejam no W poker. Como pioneiro nos jogos entre amigos e partidas rápidas, fomos aprovados por muitos jogadores de poker. O W poker tem orgulho de ser uma plataforma de poker justa e confiável. Nossos algoritmos de embaralhamento e geradores de números aleatórios foram certificados pelo Gaming Laboratories International (GLI), a principal agência de certificação independente do setor, e verificados como justos para poker e jogos de azar relacionados. Para uma plataforma de poker, a justiça é fundamental. Nossos geradores de números aleatórios determinam nossas sequências de embaralhamento e distribuição, e nossa certificação GLI prova que nossa justiça não será comprometida em nenhum cenário.',
  },
}

const aboutLocale = computed(() => {
  const locale = getLocale()
  return aboutContent[locale] ?? aboutContent['en']
})

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
