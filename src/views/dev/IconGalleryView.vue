<script setup lang="ts">
import { computed, ref } from 'vue'
import { showToast } from 'vant'
import AppSvgIcon, { APP_SVG_ICON_ENTRIES } from '@/components/Icon/AppSvgIcon.vue'
import { t } from '@/i18n'

const keyword = ref('')

const filteredEntries = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) {
    return APP_SVG_ICON_ENTRIES
  }
  return APP_SVG_ICON_ENTRIES.filter(
    (entry) => entry.name.toLowerCase().includes(kw) || entry.label.includes(kw),
  )
})

async function copyName(name: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(name)
    showToast(t('UIDev_DoneCopy') + ": " + (name))
  } catch {
    showToast(t('UIReplicationFailed') + ": " + (name))
  }
}
</script>

<template>
  <div class="icon-gallery">
    <header class="icon-gallery__header">
      <h1 class="icon-gallery__title">AppSvgIcon {{ t('UIDev_Text') }}</h1>
      <p class="icon-gallery__hint">
        {{ t('UIDev_Text2') }} {{ APP_SVG_ICON_ENTRIES.length }} {{ t('UIDev_Text3') }}，{{ t('UIDev_CanCopy') }} name {{ t('UIDev_Text4') }}
      </p>
      <input
        v-model="keyword"
        class="icon-gallery__search"
        type="text"
        :placeholder="t('UIDev_Text5') + ' name ' + t('UIDev_OrSearch')"
      />
    </header>

    <div class="icon-gallery__grid">
      <button
        v-for="entry in filteredEntries"
        :key="entry.name"
        type="button"
        class="icon-gallery__item"
        @click="copyName(entry.name)"
      >
        <AppSvgIcon class="icon-gallery__icon" :name="entry.name" />
        <span class="icon-gallery__name">{{ entry.name }}</span>
        <span v-if="entry.label" class="icon-gallery__label">{{ entry.label }}</span>
      </button>
    </div>

    <p v-if="filteredEntries.length === 0" class="icon-gallery__empty">{{ t('UIDev_Of') }}</p>
  </div>
</template>

<style scoped lang="scss">
.icon-gallery {
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 24px 16px 48px;
  background: var(--c-page);
  color: var(--c-text);
}

.icon-gallery__header {
  max-width: 960px;
  margin: 0 auto 20px;
}

.icon-gallery__title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
}

.icon-gallery__hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--c-text-muted);
}

.icon-gallery__search {
  width: 100%;
  max-width: 320px;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  color: var(--c-text);
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: var(--c-brand);
  }
}

.icon-gallery__grid {
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 12px;
}

.icon-gallery__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  background: var(--c-surface);
  color: var(--c-text);
  cursor: pointer;

  &:active {
    opacity: 0.7;
  }
}

.icon-gallery__icon {
  width: 28px;
  height: 28px;
}

.icon-gallery__name {
  font-size: 11px;
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  word-break: break-all;
  text-align: center;
}

.icon-gallery__label {
  font-size: 11px;
  color: var(--c-text-muted);
  text-align: center;
}

.icon-gallery__empty {
  max-width: 960px;
  margin: 24px auto 0;
  text-align: center;
  color: var(--c-text-muted);
}
</style>
