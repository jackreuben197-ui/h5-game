<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MttItem, MttActionType } from '@/components/ListItem/MttCard.vue'
import type { TabOption } from '@/components/Tabbar/GameTypeTabbar.vue'
import serviceIcon from '@/assets/icons/icon_server.png'
import walletIcon from '@/assets/icons/icon_wallet.png'
import { t } from '@/i18n'

// MTT 页面专用 Tab
const MTT_TABS: TabOption[] = [
  { name: 'all', title: '全部' },
  { name: 'poker', title: '扑克赛事' },
  { name: 'mahjong', title: '麻将赛事' },
]

type MttTabName = 'all' | 'poker' | 'mahjong'

// 赛事分类标识
type MttCategory = 'poker' | 'mahjong'

interface MttItemEx extends MttItem {
  category: MttCategory
}

// 布局分组：决定该分组内用哪种卡片尺寸
interface MttGroup {
  groupId: string
  title: string
  layout: 'sm' | 'md' | 'lg'
  items: MttItemEx[]
  showViewAll?: boolean
}

const activeTab = ref<MttTabName>('all')

// ---- Mock 数据 ----
// 实际开发时替换为接口数据，每个 MttItem 作为一个整体
const allMttItems: MttItemEx[] = [
  // 扑克赛事 - sm（一行3张）
  {
    id: 1,
    category: 'poker',
    title: '血流成河12',
    registeredCount: 199,
    maxCount: 400,
    actionType: 'register' as MttActionType,
  },
  {
    id: 2,
    category: 'poker',
    title: '血流成河12',
    registeredCount: 199,
    maxCount: 400,
    actionType: 'register' as MttActionType,
  },
  {
    id: 3,
    category: 'poker',
    title: '血流成河12',
    registeredCount: 199,
    maxCount: 400,
    actionType: 'join' as MttActionType,
  },
  // 扑克赛事 - lg（一行1张）
  {
    id: 4,
    category: 'poker',
    title: 'Tournament_title, 008',
    registeredCount: 199,
    maxCount: 400,
    actionType: 'late' as MttActionType,
    actionLabel: '加入',
    statusLabel: '延迟报名 18:45',
    statusTheme: 'warning',
  },
  {
    id: 5,
    category: 'poker',
    title: 'Tournament_title, 008',
    registeredCount: 199,
    maxCount: 400,
    actionType: 'register' as MttActionType,
    actionLabel: '注册',
    statusLabel: '报名中',
    statusTheme: 'success',
  },
  // 扑克赛事 - md（一行2张）
  {
    id: 6,
    category: 'poker',
    title: 'SNG快速赛',
    registeredCount: 199,
    maxCount: 400,
    actionType: 'join' as MttActionType,
    statusLabel: '最晚报名 18:45',
    statusTheme: 'default',
  },
  {
    id: 7,
    category: 'poker',
    title: 'SNG快速赛',
    registeredCount: 199,
    maxCount: 400,
    actionType: 'register' as MttActionType,
    statusLabel: '最晚报名 18:45',
    statusTheme: 'default',
  },
  // 麻将赛事 - md（一行2张）
  {
    id: 8,
    category: 'mahjong',
    title: '血战到底99',
    registeredCount: 199,
    maxCount: 400,
    actionType: 'join' as MttActionType,
  },
  {
    id: 9,
    category: 'mahjong',
    title: '血流成河12',
    registeredCount: 199,
    maxCount: 400,
    actionType: 'register' as MttActionType,
  },
]

// 按 tab 筛选数据
const filteredItems = computed<MttItemEx[]>(() => {
  if (activeTab.value === 'all') return allMttItems
  return allMttItems.filter((item) => item.category === activeTab.value)
})

// 生成分组展示结构
const mttGroups = computed<MttGroup[]>(() => {
  const tab = activeTab.value
  const items = filteredItems.value

  if (tab === 'all') {
    // 全部：按固定分组展示三种布局
    const pokerItems = items.filter((i) => i.category === 'poker')
    const mahjongItems = items.filter((i) => i.category === 'mahjong')

    const groups: MttGroup[] = []

    // 扑克 - 小卡（取前3个或所有 sm 尺寸数据）
    const pokerSmItems = pokerItems.slice(0, 3)
    if (pokerSmItems.length) {
      groups.push({
        groupId: 'poker-sm',
        title: 'xx展示分组名',
        layout: 'sm',
        items: pokerSmItems,
        showViewAll: true,
      })
    }

    // 扑克 - 大卡（取 lg 尺寸数据）
    const pokerLgItems = pokerItems.slice(3, 5)
    if (pokerLgItems.length) {
      groups.push({
        groupId: 'poker-lg',
        title: 'xx展示分组名',
        layout: 'lg',
        items: pokerLgItems,
        showViewAll: true,
      })
    }

    // 扑克 - 中卡（取 md 尺寸数据）
    const pokerMdItems = pokerItems.slice(5, 7)
    if (pokerMdItems.length) {
      groups.push({
        groupId: 'poker-md',
        title: '扑克赛事',
        layout: 'md',
        items: pokerMdItems,
        showViewAll: true,
      })
    }

    // 麻将 - 中卡
    if (mahjongItems.length) {
      groups.push({
        groupId: 'mahjong-md',
        title: '麻将赛事',
        layout: 'md',
        items: mahjongItems,
        showViewAll: true,
      })
    }

    return groups
  }

  if (tab === 'poker') {
    const groups: MttGroup[] = []
    const smItems = items.slice(0, 3)
    const lgItems = items.slice(3, 5)
    const mdItems = items.slice(5)

    if (smItems.length) {
      groups.push({
        groupId: 'poker-sm',
        title: '热门赛事',
        layout: 'sm',
        items: smItems,
        showViewAll: true,
      })
    }
    if (lgItems.length) {
      groups.push({
        groupId: 'poker-lg',
        title: '精选赛事',
        layout: 'lg',
        items: lgItems,
        showViewAll: true,
      })
    }
    if (mdItems.length) {
      groups.push({
        groupId: 'poker-md',
        title: '全部赛事',
        layout: 'md',
        items: mdItems,
        showViewAll: true,
      })
    }
    return groups
  }

  // mahjong
  return items.length
    ? [{ groupId: 'mahjong-md', title: '麻将赛事', layout: 'md', items, showViewAll: true }]
    : []
})

function handleTabUpdate(val: string): void {
  activeTab.value = val as MttTabName
}

function handleCardAction(item: MttItem): void {
  console.log('[MTT] action:', item)
}

function handleCardClick(item: MttItem): void {
  console.log('[MTT] click:', item)
}

function handleViewAll(group: MttGroup): void {
  console.log('[MTT] view all:', group.groupId)
}
</script>

<template>
  <div class="mtt-list-page themeType2">
    <div class="bg-overlay"></div>

    <HeaderBack :title="t('UIHomeMttArea')">
      <template #right>
        <div class="action-wrap">
          <TopActionButton name="充值" :icon="walletIcon" icon-alt="wallet" />
          <TopActionButton name="客服" :icon="serviceIcon" icon-alt="service" />
        </div>
      </template>
    </HeaderBack>
    <GameTypeTabbar
      :model-value="activeTab"
      :tabs="MTT_TABS"
      size="lg"
      @update:model-value="handleTabUpdate"
    />
    <section class="mtt-content">
      <template v-if="mttGroups.length">
        <div v-for="group in mttGroups" :key="group.groupId" class="mtt-group">
          <!-- 分组标题 -->
          <div class="mtt-group__header">
            <span class="mtt-group__title">{{ group.title }}</span>
            <span
              v-if="group.showViewAll"
              class="mtt-group__view-all"
              @click="handleViewAll(group)"
            >
              查看全部
            </span>
          </div>

          <!-- SM: 一行3张 -->
          <div v-if="group.layout === 'sm'" class="mtt-grid mtt-grid--sm">
            <MttCard
              v-for="item in group.items"
              :key="item.id"
              size="sm"
              :item="item"
              @action="handleCardAction"
              @click="handleCardClick"
            />
          </div>

          <!-- MD: 一行2张 -->
          <div v-else-if="group.layout === 'md'" class="mtt-grid mtt-grid--md">
            <MttCard
              v-for="item in group.items"
              :key="item.id"
              size="md"
              :item="item"
              @action="handleCardAction"
              @click="handleCardClick"
            />
          </div>

          <!-- LG: 一行1张 -->
          <div v-else class="mtt-grid mtt-grid--lg">
            <MttCard
              v-for="item in group.items"
              :key="item.id"
              size="lg"
              :item="item"
              @action="handleCardAction"
              @click="handleCardClick"
            />
          </div>
        </div>
      </template>

      <div v-else class="empty-wrap">
        <VanIcon name="search" />
        <span>暂无赛事</span>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.mtt-list-page {
  position: relative;
  min-height: 100dvh;
  color: #fff;
  overflow: hidden;
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 15% 92%, rgba(255, 173, 212, 0.32), transparent 34%),
    radial-gradient(circle at 88% 84%, rgba(102, 227, 255, 0.28), transparent 34%),
    radial-gradient(circle at 50% 56%, rgba(255, 255, 255, 0.12), transparent 48%);
}

.action-wrap {
  display: flex;
  align-items: center;
  gap: 0.26rem;
}

.mtt-content {
  position: relative;
  z-index: 1;
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  padding: 0 0.38rem 0.5333rem;
  background: rgba(255, 255, 255, 0.24);
  backdrop-filter: blur(0.3533rem) saturate(1.04);
}

/* ---- 分组 ---- */
.mtt-group {
  margin-bottom: 0.48rem;
}

.mtt-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.24rem;
}

.mtt-group__title {
  font-size: 0.4893rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.mtt-group__view-all {
  font-size: 0.32rem;
  font-weight: 500;
  color: #ececec;
  cursor: pointer;
}

/* ---- 网格布局 ---- */
.mtt-grid {
  width: 100%;
}

/* 3列 */
.mtt-grid--sm {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.16rem;
}

/* 2列 */
.mtt-grid--md {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.16rem;
}

/* 1列 */
.mtt-grid--lg {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

/* ---- 空状态 ---- */
.empty-wrap {
  margin-top: 1.4933rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2133rem;
  font-size: 0.3467rem;
  color: rgba(255, 255, 255, 0.82);
}
</style>
