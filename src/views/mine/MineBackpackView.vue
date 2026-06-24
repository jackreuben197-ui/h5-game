<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { postPropUserPropListApi } from '@/api/prop'
import type { PropUserPropListRecord } from '@/api/models/prop'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'
import { getLocale, t } from '@/i18n'

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => t('UIMine_Backpack'))

interface BackpackItem {
  id: string
  name: string
  expire: string
  icon: string
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

function mapBackpackItem(row: PropUserPropListRecord, index: number): BackpackItem {
  let name = toSafeString(row.game_prop?.prop_name)
  name = resolveTemplateTextByKey(name, getLocale()) || t(name) || name
  const count = toSafeNumber(row.prop_amount)
  const displayName = count > 0 ? `${name} *${count}` : name
  const expire = resolveTimeLabel(
    row.end_time_str ?? row.expired_time_str ?? row.end_time ?? row.expired_time,
  )

  return {
    id: String(row.id ?? row.prop_id ?? index + 1),
    name: displayName,
    expire,
    icon: row.game_prop?.prop_icon ?? '',
  }
}

async function fetchBackpackData(): Promise<void> {
  loading.value = true
  try {
    const response = await postPropUserPropListApi({})
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_LoadFail2'))
    }
    if (response.data?.total ?? 0 > 0) {
      const rows = response.data.list ?? []
      list.value = rows.map((item, index) => mapBackpackItem(item, index))
    }
  } catch (error) {
    list.value = []
    const message = error instanceof Error ? error.message : t('UIClub_LoadFail2')
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
  <div class="page-shell mine-glass-page" :style="backgroundStyle">
    <HeaderBack :title="title" extra-padding />

    <div class="content-wrap">
      <section class="item-list">
        <p v-if="loading" class="list-status">{{ t('SuperView2') }}...</p>
        <p v-else-if="!list.length" class="list-status">{{ t('UIClub_No2') }}</p>
        <article v-for="item in list" :key="item.id" class="glass-card item-card">
          <div class="icon-wrap">
            <img :src="item.icon" :alt="item.name" />
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
  height: 100dvh;
  padding: 0 0 0.8rem;
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
  border-radius: 4.22296rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.item-card {
  display: flex;
  align-items: center;
  gap: 0.22rem;
  padding: 0.36317rem 0.4392rem;
}

.icon-wrap {
  width: 1.66rem;
  height: 1.66rem;
  border-radius: 0.28rem;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 1.36rem;
    height: 1.36rem;
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
