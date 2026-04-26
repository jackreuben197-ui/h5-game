<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const title = computed(() => 'Language')

interface LanguageOption {
  key: string
  label: string
}

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const options: LanguageOption[] = [
  { key: 'en', label: '英语' },
  { key: 'zh-CN', label: '简体中文' },
  { key: 'pt', label: '葡萄牙语' },
  { key: 'es', label: '西班牙语' },
  { key: 'ru', label: '俄语' },
  { key: 'de', label: '德语' },
  { key: 'hi', label: '印度语' },
  { key: 'vi', label: '越南语' },
  { key: 'ja', label: '日本' },
  { key: 'it', label: '意大利' },
  { key: 'fr', label: '法国' },
  { key: 'th', label: '泰国' },
  { key: 'ko', label: '韩国' },
]

const activeLanguage = ref('en')

function goBack(): void {
  router.back()
}

function selectLanguage(key: string): void {
  activeLanguage.value = key
}
</script>

<template>
  <div class="settings-page settings-page--language" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="language-card">
        <button
          v-for="item in options"
          :key="item.key"
          type="button"
          class="language-row"
          @click="selectLanguage(item.key)"
        >
          <span class="label">{{ item.label }}</span>
          <span class="radio" :class="{ selected: activeLanguage === item.key }">
            <span v-if="activeLanguage === item.key" class="inner"></span>
          </span>
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
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
.header-placeholder {
  width: 0.72rem;
  height: 0.72rem;
}

.language-card {
  margin-top: 0.62rem;
  border-radius: 0.4209rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.08rem);
  overflow: hidden;
}

.language-row {
  width: 100%;
  border: 0;
  border-bottom: 0.0133rem solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.224rem 0.4rem;

  &:last-child {
    border-bottom: 0;
  }
}

.label {
  font-family: var(--font-family-sans);
  font-size: 0.4357rem;
  font-weight: 400;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.94);
}

.radio {
  width: 0.48rem;
  height: 0.48rem;
  border-radius: 50%;
  border: 0.0133rem solid rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.15);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.radio.selected {
  border-color: #78ece6;
}

.inner {
  width: 0.2667rem;
  height: 0.2667rem;
  border-radius: 50%;
  background: #4ce2df;
  box-shadow: 0 0 0.08rem rgba(82, 243, 231, 0.6);
}
</style>
