<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast, showSuccessToast } from 'vant'
import {
  postClubAgentUserListApi,
  postClubAgentUserListCoverApi,
  postOrgMemberListApi,
} from '@/api/org'
import type { ClubAgentUserListRecord, OrgMemberListRecord } from '@/api/models/org'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { useUserInfoStore } from '@/stores/userInfo'
import imgAvatar from '@/assets/images/default_avatar.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgBalance from '@/assets/icons/icon_balance.png'
import imgSearch from '@/assets/icons/club_search.svg'
import mainBgUrl from '@/assets/images/main_bg.webp'

const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

type ListMode = 'members' | 'edit'

interface PlayerCard {
  userId: number
  uid: string
  name: string
  avatar: string
  uc: number
  credit: number
  creditLimit: number
  diamonds: number
  isDownline: boolean
}

const route = useRoute()
const router = useRouter()
const userInfoStore = useUserInfoStore()

const listMode = ref<ListMode>('members')
const hideCurrentPlayers = ref(false)
const loading = ref(false)
const searching = ref(false)
const saving = ref(false)
const keyword = ref('')

const downlineRows = ref<PlayerCard[]>([])
const searchedRows = ref<PlayerCard[]>([])
const selectedMap = ref<Record<number, boolean>>({})

const currentClubId = computed(() => Number(userInfoStore.currentClub?.club_id ?? 0))
const currentClubRandomId = computed(() => Number(userInfoStore.currentClub?.random_id ?? 0))
const currentAgentId = computed(() => toSafeNumber(route.params.memberId))

function toSafeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function mapDownlineCard(item: ClubAgentUserListRecord): PlayerCard {
  const userId = toSafeNumber(item.user_id)
  return {
    userId,
    uid: String(item.random_num ?? '--'),
    name: String(item.remark_name || item.nick_name || `成员${userId || '--'}`),
    avatar: typeof item.avatar === 'string' && item.avatar.trim() ? item.avatar : imgAvatar,
    uc: toSafeNumber(item.gold),
    credit: toSafeNumber(item.club_gold_credit),
    creditLimit: toSafeNumber(item.club_gold_credit_limit),
    diamonds: toSafeNumber(item.diamonds),
    isDownline: true,
  }
}

function mapMemberCard(item: OrgMemberListRecord): PlayerCard {
  const userId = toSafeNumber(item.user_id)
  return {
    userId,
    uid: String(item.random_num ?? '--'),
    name: String(item.remark_name || item.nick_name || `成员${userId || '--'}`),
    avatar: typeof item.avatar === 'string' && item.avatar.trim() ? item.avatar : imgAvatar,
    uc: toSafeNumber(item.gold),
    credit: toSafeNumber(item.club_gold_credit),
    creditLimit: toSafeNumber(item.club_gold_credit_limit),
    diamonds: toSafeNumber(item.diamonds),
    isDownline: false,
  }
}

function ensureDownlineChecked(rows: PlayerCard[]): void {
  const next = { ...selectedMap.value }
  for (const row of rows) {
    if (row.userId > 0) {
      next[row.userId] = true
    }
  }
  selectedMap.value = next
}

async function loadDownlineMembers(): Promise<void> {
  if (!currentClubId.value || !currentClubRandomId.value || !currentAgentId.value) {
    downlineRows.value = []
    return
  }

  loading.value = true
  try {
    const response = await postClubAgentUserListApi({
      club_id: currentClubId.value,
      club_random_id: currentClubRandomId.value,
      user_id: currentAgentId.value,
      sort_type: 4,
      order_type: 2,
      limit: 500,
      offset: 0,
    })

    if (response.code !== 0 || !response.data) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '获取下线成员失败')
    }

    const rows = Array.isArray(response.data.data) ? response.data.data.map(mapDownlineCard) : []
    downlineRows.value = rows.filter((row) => row.userId > 0)
    ensureDownlineChecked(downlineRows.value)
  } catch (error) {
    downlineRows.value = []
    const message = error instanceof Error ? error.message : '获取下线成员失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

async function searchPlayers(): Promise<void> {
  const search = keyword.value.trim()
  if (!search) {
    searchedRows.value = []
    return
  }

  if (!currentClubRandomId.value) {
    showFailToast('缺少俱乐部信息')
    return
  }

  searching.value = true
  try {
    const response = await postOrgMemberListApi({
      club_id: currentClubId.value,
      club_random_id: currentClubRandomId.value,
      search,
      user_type: 0,
      sort_type: 8,
      order_type: 2,
      limit: 50,
      offset: 0,
      gold_type: 0,
      simple: true,
    })

    if (response.code !== 0 || !response.data) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '玩家查询失败')
    }

    const downlineSet = new Set(downlineRows.value.map((item) => item.userId))
    const rows = Array.isArray(response.data.data) ? response.data.data.map(mapMemberCard) : []
    searchedRows.value = rows.filter((item) => item.userId > 0 && !downlineSet.has(item.userId))
  } catch (error) {
    searchedRows.value = []
    const message = error instanceof Error ? error.message : '玩家查询失败'
    showFailToast(message)
  } finally {
    searching.value = false
  }
}

function toggleChecked(userId: number): void {
  if (listMode.value !== 'edit') {
    return
  }

  selectedMap.value = {
    ...selectedMap.value,
    [userId]: !selectedMap.value[userId],
  }
}

const displayedRows = computed<PlayerCard[]>(() => {
  if (listMode.value === 'members') {
    return downlineRows.value
  }

  const visibleDownline = hideCurrentPlayers.value ? [] : downlineRows.value
  return [...searchedRows.value, ...visibleDownline]
})

function isChecked(userId: number): boolean {
  return Boolean(selectedMap.value[userId])
}

async function onSave(): Promise<void> {
  if (listMode.value !== 'edit') {
    void router.back()
    return
  }

  if (!currentClubId.value || !currentAgentId.value || saving.value) {
    showFailToast('缺少保存参数')
    return
  }

  const userIds = Object.entries(selectedMap.value)
    .filter(([, checked]) => checked)
    .map(([userId]) => Number(userId))
    .filter((id) => Number.isFinite(id) && id > 0)

  saving.value = true
  try {
    const response = await postClubAgentUserListCoverApi({
      club_id: currentClubId.value,
      agent_id: currentAgentId.value,
      user_ids: userIds,
    })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '保存失败')
    }

    showSuccessToast('保存成功')
    void router.back()
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存失败'
    showFailToast(message)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadDownlineMembers()
})
</script>

<template>
  <div class="page-shell sub-bg" :style="backgroundStyle">
    <HeaderBack title="下线成员" />

    <div class="member-detail-page">
      <section class="tabs">
        <button :class="{ active: listMode === 'members' }" @click="listMode = 'members'">
          成员列表
        </button>
        <button :class="{ active: listMode === 'edit' }" @click="listMode = 'edit'">
          编辑下线
        </button>
      </section>

      <section class="search glass">
        <img class="search-icon" :src="imgSearch" alt="" aria-hidden="true" />
        <input
          v-model="keyword"
          class="search-input"
          type="text"
          placeholder="玩家查询"
          @keyup.enter="searchPlayers"
        />
      </section>

      <section class="toggle-row">
        <span>邀请链接</span>
        <label v-if="listMode === 'edit'">
          <span class="hidden-text">隐藏当前下线玩家</span>
          <button
            type="button"
            class="switch"
            :class="{ on: hideCurrentPlayers }"
            @click="hideCurrentPlayers = !hideCurrentPlayers"
          >
            <i></i>
          </button>
        </label>
      </section>

      <section class="cards">
        <article
          v-for="row in displayedRows"
          :key="`${row.isDownline ? 'd' : 's'}-${row.userId}`"
          class="glass card"
        >
          <button
            v-if="listMode === 'edit'"
            class="check"
            :class="{ on: isChecked(row.userId) }"
            @click="toggleChecked(row.userId)"
          ></button>
          <img :src="row.avatar" :alt="row.name" />
          <div class="meta">
            <p>{{ row.name }}</p>
            <span>ID {{ row.uid }}</span>
            <div class="assets">
              <b><img :src="imgChips" alt="" />联盟币 {{ row.uc }}</b>
              <b><img :src="imgBalance" alt="" />免审额 {{ row.credit }}/{{ row.creditLimit }}</b>
              <b><img :src="imgDiamond" alt="" />钻石 {{ row.diamonds }}</b>
            </div>
          </div>
        </article>

        <p v-if="loading" class="status">加载中...</p>
        <p v-else-if="searching" class="status">搜索中...</p>
        <p v-else-if="!displayedRows.length" class="status">暂无成员数据</p>
      </section>

      <button v-if="listMode === 'edit'" class="save" :disabled="saving" @click="onSave">
        保存
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:math';

@function figma-rem($px) {
  @return math.div($px, 37.5) * 1rem;
}

.sub-bg {
  height: 100dvh;
  background-size: cover;
}

.member-detail-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: figma-rem(7.282);
}

.tabs {
  margin-top: figma-rem(2);
  display: flex;
  justify-content: center;
  gap: figma-rem(24.051);
}

.tabs button {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  font-size: figma-rem(17.742);
}

.tabs .active {
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.85);
}

.glass {
  border-radius: figma-rem(170.596);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(figma-rem(6));
}

.search {
  min-height: 1.06827rem;
  display: flex;
  align-items: center;
  gap: figma-rem(8.64);
  padding: 0 figma-rem(13.613);
}

.search-icon {
  width: figma-rem(16.2);
  height: figma-rem(16.2);
}

.search-input {
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  color: #fff;
  font-size: figma-rem(17.742);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  font-size: figma-rem(10.135);
}

.hidden-text {
  float: left;
  padding-right: 0.1rem;
  line-height: figma-rem(18.5);
}

.switch {
  width: figma-rem(33);
  height: figma-rem(18.5);
  border: 0;
  border-radius: figma-rem(20);
  background: rgba(255, 255, 255, 0.22);
  padding: figma-rem(1.2);
  display: flex;
  align-items: center;
}

.switch i {
  display: block;
  width: figma-rem(16);
  height: figma-rem(16);
  border-radius: 50%;
  background: #fff;
}

.switch.on {
  justify-content: flex-end;
  background: #25dbc4;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: figma-rem(7.282);
}

.card {
  min-height: figma-rem(77.882);
  padding: figma-rem(14.671) figma-rem(13.613);
  display: flex;
  align-items: center;
  gap: figma-rem(8.64);
}

.check {
  width: figma-rem(17);
  height: figma-rem(17);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  background: transparent;
  flex: 0 0 auto;
}

.check.on {
  background: #1bead0;
}

.card img {
  width: figma-rem(55.882);
  height: figma-rem(56.218);
  border-radius: 50%;
  object-fit: cover;
}

.meta {
  flex: 1;
}

.meta p {
  margin: 0;
  color: #fff;
  font-size: figma-rem(17.742);
  font-weight: 700;
}

.meta span {
  color: rgba(255, 255, 255, 0.85);
  font-size: figma-rem(9.623);
}

.assets {
  margin-top: figma-rem(3);
  border-radius: figma-rem(30);
  background: rgba(17, 70, 110, 0.64);
  min-height: figma-rem(42.124);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: center;
  padding: 0 figma-rem(9.568);
  gap: figma-rem(5);
}

.assets b {
  margin: 0;
  font-size: figma-rem(10.135);
  color: #f9f9f9;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: figma-rem(2);
}

.assets img {
  width: figma-rem(11.402);
  height: figma-rem(11.402);
  border-radius: 0;
}

.status {
  margin: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.82);
  font-size: figma-rem(11.5);
}

.save {
  margin-top: auto;
  border: 1px solid rgba(242, 242, 242, 0.8);
  min-height: figma-rem(55.184);
  border-radius: figma-rem(40.576);
  color: #fff;
  background: linear-gradient(168deg, rgba(85, 243, 41, 1) 8%, rgba(62, 173, 6, 1) 72%);
  font-size: figma-rem(18.985);
}

.save:disabled {
  opacity: 0.72;
}
</style>
