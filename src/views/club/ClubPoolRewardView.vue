<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { postOrgClubJackpotTemplateListApi } from '@/api/org'
import type { OrgClubJackpotTemplateListDataItem } from '@/api/models/org'
import { formatUC } from '@/utils/roomVisibility'
import emptyStateIcon from '@/assets/icons/jackpot_empty_state.png'
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
      const message = typeof response.msg === 'string' ? response.msg : t('UIClub_LoadJackpotRecordFail')
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
    <HeaderBack :title="'奖池记录'" />

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
          <div class="card-bg"></div>

          <div class="jackpot-badge">
            <span>JACKPOT</span>
          </div>

          <div class="pool-info">
            <p class="game-name">{{ item.name }}</p>
            <div class="pool-tags">
              <span v-for="tag in item.tags" :key="`${item.id}-${tag}`" class="tag-item">
                <i class="tag-icon"></i>
                {{ tag }}
              </span>
            </div>
          </div>

          <span class="jp-badge">JP {{ item.jpAmount }}</span>
        </li>
      </ul>

      <div v-if="!hasItems && loading" class="pool-empty">
        <img class="empty-icon" :src="emptyStateIcon" alt="" />
        <p>{{ t('SuperView2') }}...</p>
      </div>
      <div v-else-if="!hasItems && !loading" class="pool-empty">
        <img class="empty-icon" :src="emptyStateIcon" alt="" />
        <p>{{ t('UIClub_FundDetail_xYlV8VBZ') }}</p>
      </div>

      <p v-if="hasItems && loadingMore" class="pool-loading-more">{{ t('UIClub_LoadMore') }}...</p>
      <p v-else-if="hasItems && !hasMore" class="pool-loading-more">{{ t('UIClub_NoMore') }}</p>
    </section>

    <div class="footer-action">
      <button type="button" class="create-btn">{{ t('UIClub_AddSomething') }}Jackpot{{ t('UIClub_Jackpot4') }}</button>
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

  @include theme-light {
    background-image: url('@/assets/images/main_bg_light.png');
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
  width: 4.5514rem;
  height: 0.5152rem;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tab-btn {
  border: 0;
  padding: 0;
  min-width: 1.6rem;
  height: 0.5152rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.3991rem;
  line-height: 0.95;
  border-bottom: 0.0363rem solid transparent;

  @include theme-light {
    color: rgba(34, 34, 34, 0.72);
  }
}

.tab-btn--active {
  color: #ffffff;
  font-weight: 700;
  border-bottom-color: #ffffff;

  @include theme-light {
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
  border: 0.0267rem solid rgba(255, 255, 255, 0.96);
  background:
    radial-gradient(74% 96% at 42% 42%, rgba(104, 75, 255, 0.3) 0%, rgba(104, 75, 255, 0) 62%),
    rgba(5, 13, 231, 0.6);
  backdrop-filter: blur(0.1098rem);
  overflow: hidden;
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
  background: #7a45d6;
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
  left: 1.4533rem;
  top: 50%;
  transform: translateY(-50%);
  width: 4.1rem;
  z-index: 1;
}

.game-name {
  margin: 0;
  font-size: 0.354rem;
  line-height: 0.83;
  color: #f9f9f9;
  font-weight: 700;
}

.pool-tags {
  margin-top: 0.1493rem;
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
  width: 0.24rem;
  height: 0.2667rem;
  display: inline-block;
  background: linear-gradient(180deg, rgba(190, 232, 255, 0.95), rgba(136, 188, 255, 0.85));
  clip-path: polygon(0 0, 100% 50%, 0 100%);
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
  background: linear-gradient(180deg, #69ffe6, #079a8b);
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

  @include theme-light {
    color: var(--c-text);
  }
}

.pool-loading-more {
  margin: 0.42rem 0 0;
  text-align: center;
  color: rgba(225, 234, 248, 0.88);
  font-size: 0.32rem;

  @include theme-light {
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
  border: 0.0358rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.082rem;
  font-size: 0.48rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(168.09deg, #05e7ae 7.55%, #027a5c 71.92%);
  box-shadow:
    inset 0 0.04rem 0.2rem rgba(255, 255, 255, 0.25),
    0 0.16rem 0.36rem rgba(0, 120, 100, 0.45);

  @include theme-light {
    border-color: transparent;
    background: var(--c-brand);
    box-shadow: none;
  }
}

@media (max-width: 360px) {
  .pool-body {
    max-width: calc(100vw - 0.64rem);
  }

  .pool-info {
    left: 1.38rem;
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
</style>
