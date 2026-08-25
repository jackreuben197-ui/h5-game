<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { postOrgClubJackpotTemplateListApi } from '@/api/org'
import mainBgUrl from '@/assets/images/main_bg.webp'
import cardBgUrl from '@/assets/icons/ic_jackpot_card_bg.png'
import iconTag from '@/assets/icons/ic_card_jackpot.svg'
import type { OrgClubJackpotTemplateListDataItem } from '@/api/models/org'
import { formatUC } from '@/utils/roomVisibility'
import { t } from '@/i18n'

interface PoolRewardItem {
  id: string
  name: string
  jpAmount: string
  tags: string[]
}

type TabKey = 'reward' | 'contribution'

const activeTab = ref<TabKey>('reward')

const rewardItems = ref<PoolRewardItem[]>([])
const contributionItems = ref<PoolRewardItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const listOffset = ref(0)
const hasMore = ref(true)
const PAGE_SIZE = 10

const currentItems = computed(() =>
  activeTab.value === 'reward' ? rewardItems.value : contributionItems.value,
)

const hasItems = computed(() => currentItems.value.length > 0)

const router = useRouter()

function onOpenRecord(item: PoolRewardItem): void {
  if (activeTab.value === 'reward') {
    void router.push({
      path: '/club/jackpot/pool-reward/reward-records',
      query: { id: item.id },
    })
    return
  }

  void router.push({
    path: '/club/jackpot/pool-reward/contribution-records',
    query: { id: item.id },
  })
}

function goCreateJackpot(): void {
  void router.push('/club/jackpot/create')
}

async function fetchJackpotList(reset = false): Promise<void> {
  if (loading.value || loadingMore.value) {
    return
  }

  if (!reset && !hasMore.value) {
    return
  }

  if (reset) {
    loading.value = true
    listOffset.value = 0
    hasMore.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const currentOffset = reset ? 0 : listOffset.value
    const response = await postOrgClubJackpotTemplateListApi({
      limit: PAGE_SIZE,
      offset: currentOffset,
    })

    if (Number(response.code) !== 0) {
      const message =
        typeof response.msg === 'string' ? response.msg : t('UIClub_LoadJackpotRecordFail')
      throw new Error(message)
    }

    const rawItems = Array.isArray(response.data?.items) ? response.data.items : []
    const mappedItems = rawItems.map((item: OrgClubJackpotTemplateListDataItem, index: number) => {
      const tags: string[] = []
      if (item.nlh_switch === 1) tags.push('NLH')
      if (item.plo_switch === 1) tags.push('PLO')
      if (item.six_plus_switch === 1) tags.push('6+')
      const jpAmount = item.gold ? formatUC(item.gold) : '0'
      return {
        id: String(item.id ?? index),
        name: item.name ?? 'Game Name',
        jpAmount,
        tags,
      }
    })

    if (reset) {
      rewardItems.value = mappedItems
      contributionItems.value = mappedItems
    } else {
      rewardItems.value = [...rewardItems.value, ...mappedItems]
      contributionItems.value = [...contributionItems.value, ...mappedItems]
    }

    listOffset.value = currentOffset + rawItems.length
    hasMore.value = rawItems.length >= PAGE_SIZE
  } catch {
    if (reset) {
      rewardItems.value = []
      contributionItems.value = []
      hasMore.value = false
    }
  } finally {
    if (reset) {
      loading.value = false
    } else {
      loadingMore.value = false
    }
  }
}

function loadNextPage(): void {
  if (!loading.value && !loadingMore.value && hasMore.value) {
    void fetchJackpotList(false)
  }
}

function onPageScroll(event: Event): void {
  const target = event.target as HTMLElement | null
  if (!target) {
    return
  }

  const remain = target.scrollHeight - (target.scrollTop + target.clientHeight)
  if (remain <= 80) {
    loadNextPage()
  }
}

onMounted(() => {
  void fetchJackpotList(true)
})
</script>

<template>
  <div class="page-shell pool-reward-page" @scroll="onPageScroll">
    <HeaderBack :title="t('UICreateClubJackpotTemplate_RecordTip')" />

    <section class="pool-body">
      <div class="tab-switch" role="tablist" :aria-label="t('UIClub_JackpotRecord')">
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'reward' }"
          @click="activeTab = 'reward'"
        >
          {{ t('UIClubJackpotRecordManager_AwardRecord') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'contribution' }"
          @click="activeTab = 'contribution'"
        >
          {{ t('UIClubJackpotRecordManager_ContributionRecord') }}
        </button>
      </div>

      <ul class="pool-list">
        <li
          v-for="item in currentItems"
          :key="item.id"
          class="pool-card"
          role="button"
          tabindex="0"
          @click="onOpenRecord(item)"
          @keydown.enter="onOpenRecord(item)"
          @keydown.space.prevent="onOpenRecord(item)"
        >
          <div class="card-bg" :style="{ backgroundImage: `url(${cardBgUrl})` }"></div>

          <div class="jackpot-badge">
            <span>JACKPOT</span>
          </div>

          <div class="pool-info">
            <p class="game-name">{{ item.name }}</p>
            <div class="pool-tags">
              <span v-for="tag in item.tags" :key="`${item.id}-${tag}`" class="tag-item">
                <img class="tag-icon" :src="iconTag" alt="" aria-hidden="true" />
                {{ tag }}
              </span>
            </div>
          </div>

          <span class="jp-badge">JP {{ item.jpAmount }}</span>
        </li>
      </ul>

      <div v-if="!hasItems && loading" class="pool-empty">
        <AppSvgIcon name="empty-data" class="empty-icon" />
        <p>{{ t('SuperView2') }}...</p>
      </div>
      <div v-else-if="!hasItems && !loading" class="pool-empty">
        <AppSvgIcon name="empty-data" class="empty-icon" />
        <p>{{ t('UIClub_FundDetail_xYlV8VBZ') }}</p>
      </div>

      <p v-if="hasItems && loadingMore" class="pool-loading-more">{{ t('UIClub_LoadMore') }}...</p>
      <p v-else-if="hasItems && !hasMore" class="pool-loading-more">{{ t('UIClub_NoMore') }}</p>
    </section>

    <div class="footer-action">
      <button type="button" class="create-btn" @click="goCreateJackpot">
        {{ t('UIClub_AddJackpotTemplate_Btn') }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.pool-reward-page {
  position: relative;
  height: 100dvh;
  background-color: var(--c-page);
  background-image: url('@/assets/images/main_bg.webp');
  background-size: cover;
  background-position: center;

  @include theme-light-own {
    // Семантические переменные глобально остаются тёмными, поэтому светлые значения
    // задаём локально — на них написаны все блоки theme-light-own ниже.
    --c-text: rgba(0, 0, 0, 1);
    --c-text-muted: rgba(0, 0, 0, 0.62);
    --c-surface: rgba(255, 255, 255, 1);
    --c-divider: rgba(0, 0, 0, 0.12);
    --c-border: rgba(0, 0, 0, 0.18);
    --c-brand: #05c297;
    --c-brand-rgb: 5, 194, 151;

    background-image: url('@/assets/images/main_bg_light.webp');

    // Шапка страницы (HeaderBack) на светлом фоне — тёмным.
    :deep(.back-trigger),
    :deep(.back-icon) {
      color: var(--c-text);
    }

    :deep(.title) {
      text-shadow: none;
    }
  }
}

.pool-body {
  position: relative;
  z-index: 2;
  margin-top: 0.8rem;
  width: 9.1216rem;
  max-width: calc(100vw - 0.8534rem);
  margin-left: auto;
  margin-right: auto;
}

.tab-switch {
  width: max-content;
  max-width: 100%;
  height: auto;
  min-height: 0.5152rem;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}

.tab-btn {
  border: 0;
  padding: 0 0.1rem;
  min-width: unset;
  height: auto;
  min-height: 0.5152rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.36rem;
  line-height: 1.1;
  border-bottom: 0.0363rem solid transparent;
  white-space: normal;
  text-align: center;

  @include theme-light-own {
    color: rgba(34, 34, 34, 0.72);
  }
}

.tab-btn--active {
  color: #ffffff;
  font-weight: 700;
  border-bottom-color: #ffffff;

  @include theme-light-own {
    color: var(--c-brand);
    border-bottom-color: var(--c-brand);
  }
}

.pool-list {
  margin: 0.5387rem 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4223rem;
}

.pool-card {
  position: relative;
  height: 2.2765rem;
  cursor: pointer;
}

.card-bg {
  position: absolute;
  left: 0.2534rem;
  top: 0.0253rem;
  width: 8.7753rem;
  height: 2.2551rem;
  border-radius: 2.0848rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.1);
  background-color: rgba(170, 170, 170, 0.1);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;

  // Карточка в светлой теме — тот же цветной градиент, что и в списке джекпотов.
  @include theme-light-own {
    background:
      radial-gradient(
        70% 110% at 44% 45%,
        rgba(123, 105, 255, 0.38) 0%,
        rgba(71, 64, 244, 0.12) 58%,
        rgba(5, 13, 231, 0) 100%
      ),
      rgba(5, 13, 231, 0.6);
    border-color: #fff;
    box-shadow:
      inset 0.04rem 0.04rem 0.14rem rgba(255, 255, 255, 0.32),
      inset -0.04rem -0.04rem 0.12rem rgba(51, 43, 190, 0.2);
  }
}

.card-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0.0149rem rgba(255, 255, 255, 0.5);
}

.jackpot-badge {
  position: absolute;
  left: -0.028rem;
  top: 0.4053rem;
  width: 1.4888rem;
  height: 1.4888rem;
  border-radius: 1.7372rem;
  border: 0.0253rem solid rgba(242, 242, 242, 0.4);
  box-shadow: 0.0913rem 0.1141rem 0.0913rem rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(0.2811rem);
  background: #3a95dc;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.jackpot-badge span {
  font-size: 0.2824rem;
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
}

.pool-info {
  position: absolute;
  left: 1.7533rem;
  top: 50%;
  transform: translateY(-50%);
  width: 4.1rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1496rem;
}

.game-name {
  margin: 0;
  font-size: 0.354rem;
  line-height: 0.83;
  color: #f9f9f9;
  font-weight: 700;
  white-space: nowrap;
}

.pool-tags {
  display: flex;
  align-items: center;
  gap: 0.3467rem;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.1333rem;
  font-size: 0.2933rem;
  line-height: normal;
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 0.0117rem;
}

.tag-icon {
  display: inline-block;
  width: 0.24rem;
  height: 0.2667rem;
  object-fit: contain;
  flex-shrink: 0;
}

.jp-badge {
  position: absolute;
  left: 6.4267rem;
  top: 0.853rem;
  width: 1.84rem;
  height: 0.4755rem;
  border-radius: 0.2232rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #69beff 0%, #3a95dc 100%);
  font-size: 0.2951rem;
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  z-index: 1;
}

.pool-card:active {
  opacity: 0.92;
}

/* Empty state */
.pool-empty {
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon {
  width: 1.248rem;
  height: 1.56rem;
  object-fit: contain;
}

.pool-empty p {
  margin: 0.24rem 0 0;
  font-size: 0.3734rem;
  color: rgba(225, 234, 248, 0.88);
  text-align: center;

  @include theme-light-own {
    color: var(--c-text);
  }
}

.pool-loading-more {
  margin: 0.42rem 0 0;
  text-align: center;
  color: rgba(225, 234, 248, 0.88);
  font-size: 0.32rem;

  @include theme-light-own {
    color: var(--c-text-muted);
  }
}

.footer-action {
  position: fixed;
  left: 50%;
  bottom: calc(0.6933rem + env(safe-area-inset-bottom));
  width: 8.9358rem;
  max-width: calc(100vw - 1.0667rem);
  transform: translateX(-50%);
  z-index: 6;
}

.create-btn {
  width: 100%;
  height: 1.4716rem;
  border: 0;
  border-radius: 3.3333rem;
  font-size: 0.4175rem;
  font-weight: 500;
  color: #78e490;
  background: linear-gradient(
    125.59deg,
    rgba(255, 255, 255, 0.1) 21.1%,
    rgba(230, 230, 230, 0.1) 71.4%
  );
  backdrop-filter: blur(0.0133rem);

  @include theme-light-own {
    background: var(--c-brand);
    backdrop-filter: none;
    color: rgba(249, 249, 249, 0.95);
  }
}

@media (max-width: 360px) {
  .pool-body {
    max-width: calc(100vw - 0.64rem);
  }

  .pool-info {
    left: 1.64rem;
    width: 3.8rem;
  }

  .jp-badge {
    left: auto;
    right: 0.72rem;
  }

  .footer-action {
    max-width: calc(100vw - 0.8533rem);
  }
}

:deep(.page-back-header .title) {
  font-size: 0.48rem !important;
}
</style>
