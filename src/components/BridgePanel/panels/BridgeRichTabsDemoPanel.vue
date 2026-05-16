<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface DemoTab {
  key: string
  label: string
  description?: string
  imageUrl?: string
  bullets?: string[]
}

const props = defineProps<{
  panelProps?: Record<string, unknown>
  emitPanelEvent: (event: string, payload?: unknown) => void
  closePanel: (reason?: string, payload?: unknown) => void
}>()

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === 'object' && !Array.isArray(raw)
}

function normalizeTabs(raw: unknown): DemoTab[] {
  if (!Array.isArray(raw)) {
    return []
  }

  const mapped: (DemoTab | null)[] = raw.map((item, index) => {
    if (!isRecord(item)) {
      return null
    }

    const key = typeof item.key === 'string' && item.key.trim() ? item.key.trim() : `tab_${index}`
    const label = typeof item.label === 'string' && item.label.trim() ? item.label.trim() : `Tab ${index + 1}`
    const bullets = Array.isArray(item.bullets)
      ? item.bullets.filter((bullet): bullet is string => typeof bullet === 'string' && bullet.trim().length > 0)
      : []

    return {
      key,
      label,
      description: typeof item.description === 'string' ? item.description : undefined,
      imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
      bullets,
    } satisfies DemoTab
  })

  return mapped.filter((item): item is DemoTab => Boolean(item))
}

const heading = computed(() =>
  typeof props.panelProps?.heading === 'string' ? props.panelProps.heading : '活动说明',
)
const summary = computed(() =>
  typeof props.panelProps?.summary === 'string'
    ? props.panelProps.summary
    : '这个示例面板用于承载更复杂的 tab、图片和动态内容。',
)
const tabs = computed<DemoTab[]>(() => {
  const normalized = normalizeTabs(props.panelProps?.tabs)
  if (normalized.length > 0) {
    return normalized
  }

  return [
    {
      key: 'reward',
      label: '奖励说明',
      description: '支持显示一张活动图、说明文字和多条规则。',
      bullets: ['奖励按 tab 切换', '内容完全由 Cocos 传参驱动', '点击行为会回传给 Cocos'],
    },
    {
      key: 'task',
      label: '任务列表',
      description: '后续可以扩展成任务进度、领奖按钮、倒计时等复杂交互。',
      bullets: ['支持按钮事件上报', '支持图片资源展示', '支持异步组件按需加载'],
    },
  ]
})

const requestedDefaultTab = computed(() =>
  typeof props.panelProps?.defaultTab === 'string' ? props.panelProps.defaultTab : '',
)
const activeTabKey = ref('')

watch(
  tabs,
  (nextTabs) => {
    const candidate = nextTabs.find((tab) => tab.key === requestedDefaultTab.value)?.key ?? nextTabs[0]?.key ?? ''
    activeTabKey.value = candidate
  },
  { immediate: true },
)

const activeTab = computed(() => tabs.value.find((tab) => tab.key === activeTabKey.value) ?? null)

function selectTab(nextKey: string): void {
  if (!nextKey || nextKey === activeTabKey.value) {
    return
  }

  activeTabKey.value = nextKey
  props.emitPanelEvent('tabChange', { tab: nextKey })
}

function emitPrimaryAction(): void {
  props.emitPanelEvent('primaryAction', {
    tab: activeTabKey.value,
  })
}

function closeSelf(): void {
  props.closePanel('close', {
    from: 'panel-close-button',
  })
}
</script>

<template>
  <section class="bridge-rich-panel">
    <div class="bridge-rich-panel__header">
      <div class="bridge-rich-panel__header-main">
        <h3 class="bridge-rich-panel__heading">{{ heading }}</h3>
        <p class="bridge-rich-panel__summary">{{ summary }}</p>
      </div>
      <button class="bridge-rich-panel__close" type="button" @click="closeSelf">关闭</button>
    </div>

    <div class="bridge-rich-panel__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="bridge-rich-panel__tab"
        :class="{ 'bridge-rich-panel__tab--active': tab.key === activeTabKey }"
        @click="selectTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab" class="bridge-rich-panel__content">
      <img
        v-if="activeTab.imageUrl"
        :src="activeTab.imageUrl"
        :alt="activeTab.label"
        class="bridge-rich-panel__image"
      />

      <p v-if="activeTab.description" class="bridge-rich-panel__description">
        {{ activeTab.description }}
      </p>

      <ul v-if="activeTab.bullets?.length" class="bridge-rich-panel__bullet-list">
        <li v-for="bullet in activeTab.bullets" :key="bullet" class="bridge-rich-panel__bullet">
          {{ bullet }}
        </li>
      </ul>
    </div>

    <div class="bridge-rich-panel__actions">
      <button class="bridge-rich-panel__secondary" type="button" @click="closeSelf">稍后再看</button>
      <button class="bridge-rich-panel__primary" type="button" @click="emitPrimaryAction">通知 Cocos</button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.bridge-rich-panel {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
  text-align: left;
}

.bridge-rich-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.24rem;
}

.bridge-rich-panel__header-main {
  min-width: 0;
}

.bridge-rich-panel__heading {
  margin: 0;
  font-size: 0.52rem;
  font-weight: 600;
  color: #fff;
}

.bridge-rich-panel__summary {
  margin: 0.12rem 0 0;
  font-size: 0.34rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.78);
}

.bridge-rich-panel__close {
  flex-shrink: 0;
  border: none;
  border-radius: 999px;
  padding: 0.18rem 0.32rem;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 0.32rem;
}

.bridge-rich-panel__tabs {
  display: flex;
  gap: 0.18rem;
  overflow-x: auto;
}

.bridge-rich-panel__tab {
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  padding: 0.18rem 0.4rem;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.34rem;
}

.bridge-rich-panel__tab--active {
  border-color: rgba(117, 255, 174, 0.65);
  background: rgba(117, 255, 174, 0.16);
  color: #fff;
}

.bridge-rich-panel__content {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.bridge-rich-panel__image {
  display: block;
  width: 100%;
  max-height: 4rem;
  object-fit: cover;
  border-radius: 0.36rem;
}

.bridge-rich-panel__description {
  margin: 0;
  font-size: 0.38rem;
  line-height: 1.7;
  color: #fff;
}

.bridge-rich-panel__bullet-list {
  margin: 0;
  padding-left: 0.48rem;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.34rem;
  line-height: 1.7;
}

.bridge-rich-panel__actions {
  display: flex;
  gap: 0.2rem;
}

.bridge-rich-panel__secondary,
.bridge-rich-panel__primary {
  flex: 1;
  height: 1.08rem;
  border: none;
  border-radius: 999px;
  font-size: 0.36rem;
  color: #fff;
}

.bridge-rich-panel__secondary {
  background: rgba(255, 255, 255, 0.08);
}

.bridge-rich-panel__primary {
  background: linear-gradient(135deg, rgba(87, 236, 167, 0.92), rgba(38, 177, 118, 0.92));
}
</style>
