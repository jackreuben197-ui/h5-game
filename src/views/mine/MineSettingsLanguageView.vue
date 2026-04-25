<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

interface LanguageOption {
  key: string
  label: string
}

const router = useRouter()

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
  <div class="settings-page settings-page--language">
    <header class="settings-header">
      <button class="back-button" type="button" @click="goBack">
        <span class="back-icon">‹</span>
      </button>
      <h1>Language</h1>
      <div class="header-placeholder" />
    </header>

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
          <span v-if="activeLanguage === item.key" class="inner" />
        </span>
      </button>
    </section>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.48rem) 0.4533rem 0.8rem;
  color: #f9f9f9;
  background:
    radial-gradient(60% 42% at 20% 10%, rgba(226, 163, 133, 0.62) 0%, rgba(226, 163, 133, 0) 100%),
    radial-gradient(55% 45% at 26% 84%, rgba(206, 107, 160, 0.58) 0%, rgba(206, 107, 160, 0) 100%),
    radial-gradient(45% 38% at 88% 84%, rgba(0, 183, 212, 0.56) 0%, rgba(0, 183, 212, 0) 100%),
    linear-gradient(160deg, #b58eb1 0%, #8d668d 54%, #6f5988 100%);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 {
    margin: 0;
    font-family: var(--font-family-SF);
    font-size: 0.64rem;
    font-weight: 400;
    line-height: 1.2;
    color: #fff;
  }
}

.back-button {
  width: 0.72rem;
  height: 0.72rem;
  border: 0;
  background: transparent;
  color: #fff;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 0.72rem;
  line-height: 1;
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
