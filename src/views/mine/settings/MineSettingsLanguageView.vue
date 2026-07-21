<script setup lang="ts">
import { computed, ref } from 'vue'
import { showSuccessToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { getLocale, setLocale, t, type LocaleCode } from '@/i18n'

const title = computed(() => t('tc_PpNL8LVJ'))

interface LanguageOption {
  key: LocaleCode
  label: string
}

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--settings-language-bg-dark': `url(${mainBgUrl})`,
  '--settings-language-bg-light': `url(${mainBgLightUrl})`,
}))

const options: LanguageOption[] = [
  { key: 'cn', label: t('A') },
  { key: 'zh', label: t('UIClub_Text72') },
  { key: 'en', label: 'English' },
  { key: 'pt', label: 'Português' },
]

const activeLanguage = ref<LocaleCode>(getLocale())

function selectLanguage(key: LocaleCode): void {
  if (activeLanguage.value === key) {
    return
  }

  activeLanguage.value = key
  setLocale(key)
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
          <span
            :class="['radio-circle', { 'radio-circle--checked': activeLanguage === item.key }]"
          ></span>
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.settings-page {
  height: 100dvh;
  padding-bottom: 0.8rem;
  color: #f9f9f9;
  background-color: var(--c-page);
  background-image: var(--settings-language-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: #000;
    background-image: var(--settings-language-bg-light);
  }
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

  @include theme-light {
    background: #fff;
  }
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

  @include theme-light {
    color: #000;
    border-bottom-color: rgba(0, 0, 0, 0.08);
  }
}

.label {
  font-family: var(--font-family-sans);
  font-size: 0.4357rem;
  font-weight: 400;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.94);

  @include theme-light {
    color: #000;
  }
}

.radio-circle {
  width: 0.35rem;
  height: 0.35rem;
  flex: none;

  &--checked::after {
    width: 0.22rem;
    height: 0.22rem;
    border-color: var(--c-brand);
  }

  @include theme-light {
    border-color: rgba(0, 0, 0, 0.3);
    box-shadow:
      inset 0.5px 0.5px 0 rgba(0, 0, 0, 0.3),
      inset -0.5px -0.5px 0 rgba(0, 0, 0, 0.3);
    &--checked {
      box-shadow: none;
      border-color: var(--c-brand);
    }
  }
}
</style>
