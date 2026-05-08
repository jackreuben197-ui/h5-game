<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { postPropUserPropListApi } from '@/api/prop'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import iconTicket from '@/assets/icons/icon_ticket.png'

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => 'My Items')

interface BackpackItem {
  id: string
  name: string
  expire: string
}

const loading = ref(false)
const list = ref<BackpackItem[]>([])

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function resolveTimeLabel(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) {
    return raw
  }

  const timestamp = toSafeNumber(raw)
  if (timestamp <= 0) {
    return '--'
  }

  const date = new Date(timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleString('zh-CN', { hour12: false })
}

function extractList(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 4 || value === null || value === undefined) {
    return []
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
  }

  if (typeof value !== 'object') {
    return []
  }

  const obj = value as Record<string, unknown>
  for (const key of ['list', 'records', 'items', 'data']) {
    const nested = extractList(obj[key], depth + 1)
    if (nested.length) {
      return nested
    }
  }

  for (const nestedValue of Object.values(obj)) {
    const nested = extractList(nestedValue, depth + 1)
    if (nested.length) {
      return nested
    }
  }

  return []
}

function mapBackpackItem(row: Record<string, unknown>, index: number): BackpackItem {
  const name = toSafeString(row.prop_name ?? row.name ?? row.subscription_name).trim() || '道具'
  const count = toSafeNumber(row.prop_amount ?? row.num ?? row.count)
  const displayName = count > 0 ? `${name} x${count}` : name
  const expire = resolveTimeLabel(row.end_time_str ?? row.expired_time_str ?? row.end_time ?? row.expired_time)

  return {
    id: String(row.id ?? row.prop_id ?? index + 1),
    name: displayName,
    expire,
  }
}

async function fetchBackpackData(): Promise<void> {
  loading.value = true
  try {
    const response = await postPropUserPropListApi({})
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载背包失败')
    }

    const rows = extractList(response.data?.list)
    list.value = rows.map((item, index) => mapBackpackItem(item, index))
  } catch (error) {
    list.value = []
    const message = error instanceof Error ? error.message : '加载背包失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchBackpackData()
})
</script>

<template>
  <div class="mine-glass-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="item-list">
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!list.length" class="list-status">暂无道具</p>
        <article v-for="item in list" :key="item.id" class="glass-card item-card">
          <div class="icon-wrap">
            <img :src="iconTicket" :alt="item.name" />
          </div>
          <div>
            <div class="name">{{ item.name }}</div>
            <div class="time">{{ item.expire }}</div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mine-glass-page {
  position: relative;
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.52rem) 0 0.8rem;
  color: #f3f3f3;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  position: relative;
  padding: 0 0.49rem;
}

.item-list {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.list-status {
  text-align: center;
  font-size: 0.3rem;
  opacity: 0.76;
  padding: 0.24rem 0;
}

.glass-card {
  border-radius: 0.82rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.item-card {
  display: flex;
  align-items: center;
  gap: 0.22rem;
  padding: 0.22rem;
}

.icon-wrap {
  width: 1.06rem;
  height: 1.06rem;
  border-radius: 0.28rem;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 0.76rem;
    height: 0.76rem;
  }
}

.name {
  font-size: 0.5rem;
  line-height: 1.1;
}

.time {
  margin-top: 0.06rem;
  font-size: 0.31rem;
  opacity: 0.86;
}
</style>
