<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChannelCFeed } from '@/composables/useChannelCFeed'
import { useChannelCDataReady } from '@/composables/useChannelCDataReady'
import { useChannelCNavigation } from '@/composables/useChannelCNavigation'
import { buildChannelCSearchFeed } from '@/features/channelC/search'
import searchIcon from '@/assets/channelC/search-accent.svg'
import { getLocale, t } from '@/i18n'
import {
  multiLanguageTemplateVersion,
  resolveTemplateTextByKey,
} from '@/utils/multiLanguageTemplate'
import ChannelCWaterfall from './ChannelCWaterfall.vue'

const router = useRouter()
const route = useRoute()
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const searchInput = ref<HTMLInputElement | null>(null)
const ready = useChannelCDataReady()
const { club, visibleRooms, visibleMatches, tournamentSeries } = useChannelCFeed()
const { joiningId, joinRoom, openMatch } = useChannelCNavigation(finishEditing)
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | undefined

const hasQuery = computed(() => Boolean(query.value.trim()))
const cards = computed(() => {
  void multiLanguageTemplateVersion.value
  const locale = getLocale()
  return buildChannelCSearchFeed(
    visibleRooms.value,
    visibleMatches.value,
    query.value,
    tournamentSeries.value,
    now.value,
    (name, kind) =>
      (kind === 'mtt' && resolveTemplateTextByKey(name, locale)) || t(name),
  )
})

function finishEditing() {
  searchInput.value?.blur()
}
function back() {
  finishEditing()
  void router.push('/home')
}

// 写入当前搜索路由，进入赛事详情再返回时恢复关键词；输入不增加浏览器历史条目。
watch(query, (value) => {
  if (route.name !== 'channel-c-search' || String(route.query.q || '') === value) return
  void router.replace({ query: { ...route.query, q: value || undefined } })
})

onMounted(() => {
  clock = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onBeforeUnmount(() => clearInterval(clock))
</script>

<template>
  <section class="c-search-page">
    <form class="c-search-toolbar" role="search" @submit.prevent="finishEditing">
      <label class="c-search-field">
        <img :src="searchIcon" alt="" />
        <input
          ref="searchInput"
          v-model="query"
          type="search"
          :aria-label="t('search')"
          :placeholder="t('UIChannelC_SearchPlaceholder')"
          enterkeyhint="search"
          autocomplete="off"
          autocapitalize="off"
          :spellcheck="false"
        />
      </label>
      <button class="c-search-cancel" type="button" @click="back">
        {{ t('adaptation10013') }}
      </button>
    </form>
    <div class="c-search-body" :aria-busy="hasQuery && !ready">
      <template v-if="hasQuery">
        <div v-if="!ready" class="c-search-loading" role="status">
          <van-loading size="24" />
          <span>{{ t('UIChannelC_Loading') }}</span>
        </div>
        <ChannelCWaterfall
          v-else-if="cards.length"
          :cards="cards"
          :now="now"
          :label="t('club_join_2')"
          :desktop-icon-url="club?.safari_icon_url"
          :joining-id="joiningId"
          @join="joinRoom"
          @open="openMatch"
        />
        <div v-else class="c-search-empty" role="status">
          <h1>{{ t('UIChannelC_SearchNoResults') }}</h1>
          <p>{{ t('UIChannelC_SearchPartialHint') }}</p>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.c-search-page {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 10rem;
  min-height: 100%;
  margin: 0 auto;
  padding: 0.077rem 0.256rem 0.35rem;
  color: #fff;

  @include theme-light-own {
    color: #000;
  }
}
.c-search-toolbar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.538rem;
  padding: 0 0.256rem 0 0.052rem;
}
.c-search-field {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  gap: 0.179rem;
  min-width: 0;
  height: 1.205rem;
  padding: 0 0.25rem 0 0.38rem;
  border-radius: 0.394rem;
  background: #ffffff1f;

  &::before {
    @include gradient-stroke(0.2px, linear-gradient(350.8deg, #c941ff -17.4%, #4ba1ff 64.3%));
    opacity: 0.4;

    @media (min-resolution: 3dppx) {
      opacity: 0.6;
    }
  }

  img {
    flex: none;
    width: 0.684rem;
    height: 0.684rem;
  }

  @include theme-light-own {
    background: #fff;
    box-shadow: 0 0 7px #9ff7ff36;
  }
}
.c-search-field input {
  display: block;
  min-width: 0;
  width: 100%;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.462rem;
  font-weight: 500;
  line-height: 1.5;
  appearance: none;

  &::placeholder {
    color: #ffffff3b;
    opacity: 1;
  }
  &::-webkit-search-cancel-button {
    display: none;
  }

  @include theme-light-own {
    &::placeholder {
      color: #0000003b;
    }
  }
}
.c-search-cancel {
  flex: none;
  padding: 0;
  border: 0;
  background: transparent;
  color: #05c297;
  font: inherit;
  font-size: 0.462rem;
  font-weight: 900;
  line-height: 1.5;
  cursor: pointer;
}
.c-search-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  margin-top: 0.256rem;

  :deep(.c-prize b) {
    @include theme-dark {
      color: #e78632;
    }
  }
}
.c-search-empty,
.c-search-loading {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  text-align: center;
}
.c-search-empty {
  gap: 0.07rem;
  padding-bottom: 1.4rem;
}
.c-search-empty h1 {
  margin: 0;
  font-size: 0.663rem;
  font-weight: 700;
  line-height: 1.4;
}
.c-search-empty p {
  margin: 0;
  color: #fff9;
  font-size: 0.407rem;
  line-height: 1.5;

  @include theme-light-own {
    color: #0009;
  }
}
.c-search-loading {
  color: var(--c-text-muted);
  font-size: 0.35rem;
}
</style>
