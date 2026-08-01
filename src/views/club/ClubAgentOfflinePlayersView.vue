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
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import { useUserInfoStore } from '@/stores/userInfo'
import imgAvatar from '@/assets/images/default_avatar.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgBalance from '@/assets/icons/icon_credit_chip.png'
import imgSearch from '@/assets/icons/club_search.svg'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.webp'
import { formatUC } from '@/utils/roomVisibility'
import { t } from '@/i18n'

const backgroundStyle = computed(() => ({
  '--offline-players-bg-dark': `url(${mainBgUrl})`,
  '--offline-players-bg-light': `url(${mainBgLightUrl})`,
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
    name: String(item.remark_name || item.nick_name || t('UIClub_Info_Members') + (userId || '--')),
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
    name: String(item.remark_name || item.nick_name || t('UIClub_Info_Members') + (userId || '--')),
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
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_FetchDownliFail'))
    }

    const rows = Array.isArray(response.data.data) ? response.data.data.map(mapDownlineCard) : []
    downlineRows.value = rows.filter((row) => row.userId > 0)
    ensureDownlineChecked(downlineRows.value)
  } catch (error) {
    downlineRows.value = []
    const message = error instanceof Error ? error.message : t('UIClub_FetchDownliFail')
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

async function searchPlayers(): Promise<void> {
  if (listMode.value === 'members') {
    // Local filtering on downlineRows, no API call
    return
  }

  const search = keyword.value.trim()
  if (!search) {
    searchedRows.value = []
    return
  }

  if (!currentClubRandomId.value) {
    showFailToast(t('UIClub_Club'))
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
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_PlayerFail'))
    }

    const downlineSet = new Set(downlineRows.value.map((item) => item.userId))
    const rows = Array.isArray(response.data.data) ? response.data.data.map(mapMemberCard) : []
    searchedRows.value = rows.filter((item) => item.userId > 0 && !downlineSet.has(item.userId))
  } catch (error) {
    searchedRows.value = []
    const message = error instanceof Error ? error.message : t('UIClub_PlayerFail')
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
  const search = keyword.value.trim().toLowerCase()
  if (listMode.value === 'members') {
    if (search) {
      return downlineRows.value.filter(
        (item) => item.name.toLowerCase().includes(search) || item.uid.includes(search),
      )
    }
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
    showFailToast(t('UIClub_Save'))
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
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_SaveFail'))
    }

    showSuccessToast(t('UIClub_SaveSuccess'))
    void router.back()
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_SaveFail')
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
    <HeaderBack :title="t('UIGuild_MemberDetails_VipOffLine')" />

    <div class="member-detail-page">
      <section class="tabs">
        <button :class="{ active: listMode === 'members' }" @click="listMode = 'members'">
          {{ t('UIGuild_MemberList') }}
        </button>
        <button :class="{ active: listMode === 'edit' }" @click="listMode = 'edit'">
          {{ t('UIGuild_MemberDetails_OffLineEdit') }}
        </button>
      </section>

      <section class="search glass">
        <img class="search-icon" :src="imgSearch" alt="" aria-hidden="true" />
        <input
          v-model="keyword"
          class="search-input"
          type="text"
          :placeholder="t('UIClub_Player')"
          @keyup.enter="searchPlayers"
        />
      </section>

      <section class="toggle-row">
        <span>{{ t('UIClub_InviteLink') }}</span>
        <label v-if="listMode === 'edit'">
          <span class="hidden-text">{{ t('UIGuild_MemberEditHide') }}</span>
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
          class="member-card"
        >
          <button
            v-if="listMode === 'edit'"
            type="button"
            class="check-control"
            :aria-label="row.name"
            @click="toggleChecked(row.userId)"
          >
            <span
              :class="['radio-circle', { 'radio-circle--checked': isChecked(row.userId) }]"
              aria-hidden="true"
            ></span>
          </button>
          <div class="glass card" :class="{ 'card-check': listMode === 'edit' }">
            <div class="member-main">
              <div class="member-left">
                <img class="member-avatar" :src="row.avatar" :alt="(row.name) + t('UIMine_UserInfoSetting_btn_head')" />
                <div class="member-base">
                  <button type="button" class="member-name">
                    {{ row.name }}
                  </button>
                  <p class="member-id-row">
                    <span class="id-pill">ID</span>
                    <span>{{ row.uid }}</span>
                  </p>
                </div>
              </div>
            </div>
            <div class="member-data-strip">
              <div class="data-item">
                <p class="data-label">
                  <img :src="imgChips" alt="" aria-hidden="true" />
                  <span>联盟币</span>
                </p>
                <p class="data-value">{{ formatUC(row.uc) }}</p>
              </div>

              <div class="data-item">
                <p class="data-label">
                  <img :src="imgBalance" alt="" aria-hidden="true" />
                  <span>{{ t('UIClubTalbe_CreditTitle') }}</span>
                </p>
                <p class="data-value">{{ row.credit }}/{{ row.creditLimit }}</p>
              </div>
              <div class="data-item">
                <p class="data-label">
                  <img :src="imgDiamond" alt="" aria-hidden="true" />
                  <span>{{ t('UIMine_VIP_diamond') }}</span>
                </p>
                <p class="data-value">{{ row.diamonds }}</p>
              </div>
            </div>
          </div>
        </article>

        <p v-if="loading" class="status">{{ t('SuperView2') }}...</p>
        <p v-else-if="searching" class="status">{{ t('UIClub_Search') }}...</p>
        <p v-else-if="!displayedRows.length" class="status">{{ t('UIClub_NoMemberData') }}</p>
      </section>

      <PrimaryButton
        v-if="listMode === 'edit'"
        class="save"
        :text="t('Save')"
        :disabled="saving"
        :loading="saving"
        @click="onSave"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:math';
@use '@/styles/mixins' as *;

@function figma-rem($px) {
  @return math.div($px, 37.5) * 1rem;
}

.sub-bg {
  height: 100dvh;
  background-image: var(--offline-players-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    background-color: var(--c-page);
    background-image: var(--offline-players-bg-light);
  }
}

.member-detail-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: figma-rem(12.952);
}

.tabs {
  margin-top: figma-rem(2);
  min-height: figma-rem(25.562);
  display: flex;
  justify-content: center;
  gap: figma-rem(60.241);
}

.tabs button {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  font-size: figma-rem(13.886);
}

.tabs .active {
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.85);

  @include theme-light {
    color: var(--c-brand);
    border-bottom-color: var(--c-brand);
  }
}

.glass {
  border-radius: 1.1rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(figma-rem(6));

  @include theme-light {
    background: #fff;
  }
}

.search {
  min-height: figma-rem(40.06);
  display: flex;
  align-items: center;
  gap: figma-rem(8.64);
  padding: 0 figma-rem(16.786);
}

.search-icon {
  width: figma-rem(21.961);
  height: figma-rem(21.53);

  @include theme-light {
    filter: brightness(0);
  }
}

.search-input {
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  color: #fff;
  font-size: figma-rem(15.502);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  font-size: figma-rem(15.196);
}

.toggle-row > span {
  min-width: figma-rem(182);
}

.toggle-row label {
  display: inline-flex;
  align-items: center;
}

.hidden-text {
  padding-right: figma-rem(8);
  line-height: figma-rem(18.5);
  font-size: figma-rem(10.2);
}

.switch {
  width: figma-rem(44.948);
  height: figma-rem(21.178);
  border: 0;
  border-radius: figma-rem(20);
  background: rgba(255, 255, 255, 0.22);
  padding: figma-rem(1.2);
  display: flex;
  align-items: center;
}

.switch i {
  display: block;
  width: figma-rem(19);
  height: figma-rem(19);
  border-radius: 50%;
  background: #fff;
}

.switch.on {
  justify-content: flex-end;
  background: var(--c-brand);
}

.cards {
  display: flex;
  flex-direction: column;
  gap: figma-rem(8);
}

.card {
  min-height: figma-rem(92);
  padding: figma-rem(8) figma-rem(16);
  align-items: center;
  gap: figma-rem(8.64);
  width: 100%;
  min-width: 0;
}

.member-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: figma-rem(9);
}

.member-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.24rem;
}

.member-left {
  display: inline-flex;
  align-items: center;
  gap: 0.32095rem;
  min-width: 0;
}

.member-avatar {
  width: 1.03614rem;
  height: 1.03614rem;
  border-radius: 999px;
  object-fit: cover;
}

.member-base {
  display: flex;
  flex-direction: column;
  gap: 0.25338rem;
  min-width: 0;
}

.member-name {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  font-size: 0.30522rem;
  line-height: 1;
  font-weight: 700;
  color: #fff;
}

.member-id-row {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.06552rem;
  font-size: 0.25661rem;
  line-height: 1;
  color: rgba(249, 249, 249, 0.92);
}

.id-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0.50208rem;
  height: 0.30976rem;
  border-radius: 0.075rem;
  font-size: 0.21595rem;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
}

.check-control {
  width: figma-rem(18);
  height: figma-rem(18);
  padding: 0;
  border: 0;
  background: transparent;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.card img {
  width: 1rem;
  height: 1rem;
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
}

.member-data-strip {
  margin-top: 0.16064rem;
  padding: 0.11824rem 0.58277rem;
  border-radius: 1.44001rem;
  background: rgba(34, 34, 34, 0.62);
  backdrop-filter: blur(1.60643rem);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.21rem;
  cursor: pointer;
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: 0.075rem;
  min-width: 0;
}

.data-label,
.data-value {
  margin: 0;
  font-size: 0.25703rem;
  line-height: 1.1;
  color: #fff;
}

.data-label {
  opacity: 0.7;
  display: inline-flex;
  align-items: center;
  gap: 0.045rem;
}

.data-label img {
  width: 0.24rem;
  height: 0.24rem;
  object-fit: contain;
}

.data-value {
  font-weight: 500;
  white-space: nowrap;
}

.sub-bg {
  @include theme-light {
    .tabs button {
      color: rgba(0, 0, 0, 0.7);
    }

    .tabs .active {
      color: var(--c-brand);
      border-color: var(--c-brand);
    }

    .search {
      background: #dadada;
      backdrop-filter: none;
    }

    .search-input,
    .toggle-row,
    .member-name,
    .member-id-row,
    .data-label,
    .data-value {
      color: #000;
    }

    .search-input::placeholder {
      color: rgba(0, 0, 0, 0.82);
    }

    .switch {
      background: rgba(46, 46, 46, 0.17);
    }

    .switch.on {
      background: var(--c-brand);
    }

    .card {
      background: #fff;
      backdrop-filter: none;
    }

    .id-pill {
      background: rgba(0, 0, 0, 0.4);
      color: #fff;
    }

    .member-data-strip {
      background: #dadada;
      backdrop-filter: none;
    }

    .check-control .radio-circle {
      border-color: rgba(34, 34, 34, 0.24);
      box-shadow: none;
    }

    .status {
      color: rgba(0, 0, 0, 0.62);
    }
  }
}
</style>
