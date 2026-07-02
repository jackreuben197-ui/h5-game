<script setup lang="ts">
import { computed, ref } from 'vue'
import { showSuccessToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import icCheckbox from '@/assets/icons/ic_checkbox.png'
import icUncheckbox from '@/assets/icons/ic_uncheckbox.png'
import { getLocale, setLocale, t, type LocaleCode } from '@/i18n'

const title = computed(() => 'Language')

interface LanguageOption {
  key: string
  label: string
}

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const options: LanguageOption[] = [
  { key: 'cn', label: t('A') },
  { key: 'zh', label: t('UIClub_Text72') },
  { key: 'en', label: 'English' },
  { key: 'pt', label: 'Português' },
]

const SUPPORTED: string[] = ['cn', 'zh', 'en', 'pt']
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
          <span class="label">{{ item.label }}</span>
          <img
            class="checkbox-icon"
            :src="activeLanguage === item.key ? icCheckbox : icUncheckbox"
            alt=""
            aria-hidden="true"
          />
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  height: 100dvh;
  // padding-top: calc(env(safe-area-inset-top) + 0.48rem);
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
  font-family: var(--font-family-sans);
  font-size: 0.4357rem;
  font-weight: 400;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.94);
}

.checkbox-icon {
  width: 0.4rem;
  height: 0.4rem;
  object-fit: contain;
}
</style>
