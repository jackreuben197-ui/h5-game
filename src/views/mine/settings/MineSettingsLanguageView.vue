<script setup lang="ts">
import { computed, ref } from 'vue'
import { showSuccessToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import icCheckbox from '@/assets/icons/ic_checkbox.png'
import icUncheckbox from '@/assets/icons/ic_uncheckbox.png'
import { getLocale, setLocale, t, type LocaleCode } from '@/i18n'

const title = computed(() => t('UISettings_Language'))

interface LanguageOption {
  key: string
  label: string
}

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const options: LanguageOption[] = [
  { key: 'cn', label: '简体中文' },
  { key: 'zh', label: '繁體中文' },
  { key: 'en', label: 'English' },
  { key: 'pt', label: 'Português' },
  { key: 'de', label: 'Deutsch' },
  { key: 'es', label: 'Español' },
  { key: 'fr', label: 'Français' },
  { key: 'hi', label: 'हिन्दी' },
  { key: 'it', label: 'Italiano' },
  { key: 'ja', label: '日本語' },
  { key: 'ko', label: '한국어' },
  { key: 'ru', label: 'Русский' },
  { key: 'th', label: 'ไทย' },
  { key: 'vi', label: 'Tiếng Việt' },
]

const SUPPORTED: string[] = [
  'cn',
  'zh',
  'en',
  'pt',
  'de',
  'es',
  'fr',
  'hi',
  'it',
  'ja',
  'ko',
  'ru',
  'th',
  'vi',
]
const activeLanguage = ref<string>(getLocale())

function selectLanguage(key: string): void {
  if (activeLanguage.value === key) {
    return
  }

  activeLanguage.value = key
  if (SUPPORTED.includes(key)) {
    setLocale(key as LocaleCode)
  }
  showSuccessToast(t('UIClub_Success5'))
}
</script>

<template>
  <div class="page-shell settings-page settings-page--language" :style="backgroundStyle">
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
          <span v-fit-text="{ maxLines: 1 }" class="label">{{ t(`UILang_${item.key}`) }}</span>
          <span class="row-right">
            <span v-fit-text="{ maxLines: 1 }" class="endonym">{{ item.label }}</span>
            <img
              class="checkbox-icon"
              :src="activeLanguage === item.key ? icCheckbox : icUncheckbox"
              alt=""
              aria-hidden="true"
            />
          </span>
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  // padding-top: calc(env(safe-area-inset-top) + 0.48rem);
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 0.4533rem 0.8rem;
}
.header-placeholder {
  width: 0.72rem;
  height: 0.72rem;
}

.language-card {
  margin-top: 0.62rem;
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  overflow: hidden;
}

.language-row {
  width: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.224rem 0.4rem;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0.4rem;
    right: 0.4rem;
    height: 0.0133rem;
    background: rgba(255, 255, 255, 0.1);
  }

  &:last-child::after {
    display: none;
  }
}

.label {
  flex: 1 1 auto;
  min-width: 0;
  text-align: left;
  font-family: var(--font-family-sans);
  font-size: 0.4357rem;
  font-weight: 400;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.94);
}

.row-right {
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.24rem;
  margin-left: 0.32rem;
}

.endonym {
  min-width: 0;
  text-align: right;
  font-family: var(--font-family-sans);
  font-size: 0.3733rem;
  font-weight: 400;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.58);
}

.checkbox-icon {
  width: 0.4rem;
  height: 0.4rem;
  object-fit: contain;
}
</style>
