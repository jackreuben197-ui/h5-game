<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { postRegisterAreaApi } from '@/api/config'
import type { RegisterAreaRecord } from '@/api/models/config'
import { t } from '@/i18n'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'

interface AreaOption {
  code: string
  countryCode: string
}

const LOGIN_PHONE_AREA_SELECTION_KEY = 'LOGIN_PHONE_AREA_SELECTED_V1'
const LOGIN_AREA_LIST_CACHE_VERSION = 1

interface LoginAreaListCachePayload {
  version: number
  updatedAt: number
  records: RegisterAreaRecord[]
}

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const keyword = ref('')
const areaList = ref<AreaOption[]>([])
const errorMessage = ref('')

const filteredList = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) {
    return areaList.value
  }
  return areaList.value.filter((item) => {
    const areaName = resolveAreaLabel(item.countryCode).toLowerCase()
    const searchText = `${item.code} ${item.countryCode} ${areaName}`.toLowerCase()
    return searchText.includes(query)
  })
})

const hasData = computed(() => filteredList.value.length > 0)

onMounted(() => {
  void loadAreaList()
})

async function loadAreaList(): Promise<void> {
  const cachedRows = readCachedAreaRows()
  if (cachedRows.length > 0) {
    areaList.value = cachedRows
      .map((row) => normalizeAreaOption(row))
      .filter((item): item is AreaOption => Boolean(item))
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const response = await postRegisterAreaApi()
    if (response.code !== 0) {
      areaList.value = []
      errorMessage.value = response.message || 'Load area list failed'
      return
    }

    const responseData = response.data as unknown
    const rows = Array.isArray((responseData as { data?: unknown })?.data)
      ? ((responseData as { data: RegisterAreaRecord[] }).data || [])
      : Array.isArray(responseData)
        ? (responseData as RegisterAreaRecord[])
        : []
    if (rows.length > 0) {
      persistAreaRows(rows)
    }
    areaList.value = rows
      .map((row) => normalizeAreaOption(row))
      .filter((item): item is AreaOption => Boolean(item))
  } catch (error) {
    areaList.value = []
    errorMessage.value = error instanceof Error ? error.message : 'Load area list failed'
  } finally {
    loading.value = false
  }
}

function onSelectArea(item: AreaOption): void {
  localStore.setItem(StorageKey.KEY_PHONE_FIRST, item.code)
  window.sessionStorage.setItem(LOGIN_PHONE_AREA_SELECTION_KEY, item.code)
  void router.back()
}

function normalizeAreaOption(row: RegisterAreaRecord): AreaOption | null {
  const codeRaw = String(row.area ?? row.code ?? '').trim().replace('+', '')
  if (!codeRaw) {
    return null
  }
  const countryCode = String(row.country || '').trim().toUpperCase()
  return {
    code: codeRaw,
    countryCode,
  }
}

function resolveI18nText(key: string, fallback: string): string {
  const value = t(key)
  return value === key ? fallback : value
}

function resolveAreaLabel(countryCode: string): string {
  if (!countryCode) return '--'
  const key = `Area_${countryCode}`
  const translated = t(key)
  return translated === key ? countryCode : translated
}

function readCachedAreaRows(): RegisterAreaRecord[] {
  const cached = localStore.getItem<LoginAreaListCachePayload | null>(
    StorageKey.LOGIN_AREA_LIST_CACHE,
    null,
  )
  if (!cached || typeof cached !== 'object') {
    return []
  }
  if (cached.version !== LOGIN_AREA_LIST_CACHE_VERSION) {
    return []
  }
  if (!Array.isArray(cached.records)) {
    return []
  }
  return cached.records
}

function persistAreaRows(rows: RegisterAreaRecord[]): void {
  localStore.setItem(StorageKey.LOGIN_AREA_LIST_CACHE, {
    version: LOGIN_AREA_LIST_CACHE_VERSION,
    updatedAt: Date.now(),
    records: rows,
  } as LoginAreaListCachePayload)
}
</script>

<template>
  <div class="phone-area-page">
    <HeaderBack :title="resolveI18nText('UILogin_AreaCode', '选择区号')" />

    <div class="search-wrap">
      <input
        v-model="keyword"
        class="search-input"
        type="text"
        :placeholder="resolveI18nText('UIMttSearchHint', '搜索国家或区号')"
      />
    </div>

    <section class="list-wrap">
      <p v-if="loading" class="status-line">{{ resolveI18nText('SuperView2', '加载中...') }}</p>

      <template v-else-if="hasData">
        <button
          v-for="item in filteredList"
          :key="`${item.code}_${item.countryCode}`"
          type="button"
          class="area-item"
          @click="onSelectArea(item)"
        >
          <span class="area-main">{{ resolveAreaLabel(item.countryCode) }}</span>
          <span class="area-side">+{{ item.code }}</span>
        </button>
      </template>

      <p v-else class="status-line">
        {{ errorMessage || resolveI18nText('MsgContentUnRead', '暂无内容') }}
      </p>
    </section>
  </div>
</template>

<style scoped lang="scss">
.phone-area-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  color: #fff;
  background: url(@/assets/images/main_bg.webp) no-repeat center/cover;
}

.search-wrap {
  padding: 0.2rem 0.5rem 0.24rem;
}

.search-input {
  width: 100%;
  height: 1.02rem;
  border-radius: 0.6rem;
  border: 0;
  outline: none;
  padding: 0 0.35rem;
  font-size: 0.34rem;
  color: #111;
  background: rgba(255, 255, 255, 0.9);
}

.list-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 0.5rem 0.5rem;
  -webkit-overflow-scrolling: touch;
}

.area-item {
  width: 100%;
  display: flex;
  align-items: center;
  height: 1.2rem;
  border: 0;
  margin-top: 0.2rem;
  padding: 0 0.34rem;
  border-radius: 0.2rem;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.area-main {
  flex: 1;
  text-align: left;
  font-size: 0.34rem;
}

.area-side {
  font-size: 0.34rem;
  opacity: 0.96;
}

.status-line {
  margin: 1rem 0 0;
  text-align: center;
  font-size: 0.34rem;
  color: rgba(255, 255, 255, 0.85);
}
</style>
