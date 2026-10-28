<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useChannelCFeed } from '@/composables/useChannelCFeed'
import { useChannelCDataReady } from '@/composables/useChannelCDataReady'
import { useChannelCNavigation } from '@/composables/useChannelCNavigation'
import { sortChannelCMtt } from '@/features/channelC/model'
import { t } from '@/i18n'

const router = useRouter()
const query = ref('')
const type = ref<'all' | 'poker' | 'mtt'>('all')
const ready = useChannelCDataReady()
const { visibleRooms, visibleMatches } = useChannelCFeed()
const { joinRoom, openMatch } = useChannelCNavigation()
const results = computed(() => {
  const word = query.value.trim().toLowerCase()
  if (!word) return []
  return [
    ...(type.value === 'mtt'
      ? []
      : visibleRooms.value.map((room) => ({
          id: String(room.rid),
          key: `poker-${room.rid}`,
          kind: 'poker',
          name: String(room.name || t('UITexasReport_Label_AllBarPZ')),
        }))),
    ...(type.value === 'poker'
      ? []
      : sortChannelCMtt(visibleMatches.value).map((match) => ({
          id: String(match.match_id),
          key: `mtt-${match.match_id}`,
          kind: 'mtt',
          name: String(match.name || 'MTT'),
        }))),
  ].filter((item) => item.name.toLowerCase().includes(word) || item.id.includes(word))
})
function back() {
  void router.push('/home')
}
function openResult(item: (typeof results.value)[number]) {
  if (item.kind === 'mtt') {
    const match = visibleMatches.value.find((match) => String(match.match_id) === item.id)
    if (match) openMatch(match)
  } else {
    const room = visibleRooms.value.find((room) => String(room.rid) === item.id)
    if (room) void joinRoom(room)
  }
}
</script>

<template>
  <section class="c-search-page">
    <header>
      <button type="button" :aria-label="t('UIChannelC_BackHome')" @click="back">
        <van-icon name="arrow-left" />
      </button>
      <van-search v-model="query" :placeholder="t('UIChannelC_SearchPlaceholder')" autofocus />
      <button type="button" @click="back">{{ t('adaptation10013') }}</button>
    </header>
    <div class="c-search-types">
      <button
        v-for="option in [
          { key: 'all', label: 'UIMatch_GtO8YEdb' },
          { key: 'poker', label: 'UITexasReport_Label_AllBarPZ' },
          { key: 'mtt', label: 'MTT' },
        ] as const"
        :key="option.key"
        type="button"
        :class="{ selected: type === option.key }"
        @click="type = option.key"
      >
        {{ t(option.label) }}
      </button>
    </div>
    <van-loading v-if="!ready" class="c-search-loading" />
    <ul v-else-if="results.length">
      <li v-for="item in results" :key="item.key">
        <button type="button" @click="openResult(item)">
          <span>
            {{ t(item.name)
            }}<small>
              {{ item.kind === 'poker' ? t('UITexasReport_Label_AllBarPZ') : 'MTT' }} ·
              {{ item.id }}
            </small>
          </span>
          <van-icon name="arrow" />
        </button>
      </li>
    </ul>
    <p v-else class="c-search-empty">
      {{ t(query.trim() ? 'UIChannelC_SearchNoResults' : 'UIChannelC_SearchHint') }}
    </p>
  </section>
</template>

<style scoped lang="scss">
.c-search-page {
  max-width: 10rem;
  margin: 0 auto;
  padding: 0.3rem;
  color: var(--c-text);
}

header {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

header :deep(.van-search) {
  flex: 1;
  min-width: 0;
  background: transparent;
  padding: 0.15rem 0;
}

button {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 0.35rem;
  cursor: pointer;
}

.c-search-types {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.3rem;
}

.c-search-types button {
  padding: 0.15rem 0.45rem;
  border-radius: 0.6rem;
  background: var(--c-surface);
}

.c-search-types .selected {
  color: #fff;
  background: #69beff;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  margin: 0.2rem 0;
  border-radius: 0.2rem;
  background: var(--c-surface);
}

li button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.3rem;
  text-align: left;
}

small {
  display: block;
  opacity: 0.6;
  font-size: 0.28rem;
  margin-top: 0.1rem;
}

.c-search-empty,
.c-search-loading {
  margin: 2rem 0;
  text-align: center;
  font-size: 0.35rem;
  color: var(--c-text-muted);
}
</style>
