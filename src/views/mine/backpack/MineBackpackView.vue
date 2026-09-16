<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { postPropUserPropListApi } from '@/api/prop'
import type { PropUserPropListRecord } from '@/api/models/prop'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'
import { formatDateTime } from '@/utils/time'
import { getLocale, t } from '@/i18n'

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--backpack-bg-dark': `url(${mainBgUrl})`,
  '--backpack-bg-light': `url(${mainBgLightUrl})`,
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
  const formatted = formatDateTime(raw, 'DD/MM/YYYY HH:mm')
  return formatted === '--:--' ? '--' : formatted
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
            <div class="time">
              <AppSvgIcon name="calendar" class="calendar-icon" />
              <span>{{ item.expire }}</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.mine-glass-page {
  position: relative;
  height: 100dvh;
  padding: 0 0 0.8rem;
  color: #f3f3f3;
  background-color: var(--c-page);
  background-image: var(--backpack-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: #000;
    background-image: var(--backpack-bg-light);
  }
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

  @include theme-light {
    border-color: transparent;
    background: #fff;
  }
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
  overflow: hidden;
  flex: none;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.name {
  font-size: 0.5rem;
  line-height: 1.1;
}

.time {
  margin-top: 0.06rem;
  display: flex;
  align-items: center;
  gap: 0.13rem;
  font-size: 0.31rem;

  span {
    opacity: 0.86;
  }
}

.calendar-icon {
  width: 0.3733rem;
  height: 0.3467rem;
  flex: none;
  color: #fff;

  @include theme-light {
    color: var(--c-brand);
  }
}
</style>
