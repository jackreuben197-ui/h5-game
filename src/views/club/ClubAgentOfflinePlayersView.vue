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
import imgBalance from '@/assets/icons/icon_credit_chip.png'
import imgSearch from '@/assets/icons/club_search.svg'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import { formatUC } from '@/utils/roomVisibility'
import { t } from '@/i18n'

const backgroundStyle = computed(() => ({
  '--offline-bg-dark': `url(${mainBgUrl})`,
  '--offline-bg-light': `url(${mainBgLightUrl})`,
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
            class="check"
            :class="{ on: isChecked(row.userId) }"
            @click="toggleChecked(row.userId)"
          ></button>
          <div class="glass card" :class="{ 'card-check': listMode === 'edit' }">
            <div class="member-main">
              <div class="member-left">
                <img class="member-avatar" :src="row.avatar" :alt="`${row.name}头像`" />
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
                  <span>UC</span>
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

      <button v-if="listMode === 'edit'" class="save" :disabled="saving" @click="onSave">
        {{ t('Save') }}
      </button>
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
  background-size: cover;
  background-image: var(--offline-bg-dark);

  @include theme-light {
    color: #111;
    background-image: var(--offline-bg-light);
  }
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

  @include theme-light {
    color: rgba(17, 17, 17, 0.64);
  }
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
  min-height: 1.06827rem;
  display: flex;
  align-items: center;
  gap: figma-rem(8.64);
  padding: 0 figma-rem(13.613);

  @include theme-light {
    background: #dadada;
  }
}

.search-icon {
  width: figma-rem(16.2);
  height: figma-rem(16.2);

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
  font-size: figma-rem(17.742);

  @include theme-light {
    color: #111;
  }
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);

  @include theme-light {
    color: rgba(17, 17, 17, 0.72);
  }
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  font-size: figma-rem(10.135);

  @include theme-light {
    color: #111;
  }
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

  @include theme-light {
    background: #dedede;
  }
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

  @include theme-light {
    background: var(--c-brand);
  }
}

.cards {
  display: flex;
  flex-direction: column;
  gap: figma-rem(7.282);
}

.card {
  min-height: figma-rem(77.882);
  padding: 0.2rem 0.36rem;
  align-items: center;
  gap: figma-rem(8.64);
  clear: right;
  float: right;
  min-width: 100%;
  &.card-check {
    min-width: 90%;
  }
}

.member-card {
  position: relative;
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

  @include theme-light {
    color: #111;
  }
}

.member-id-row {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.06552rem;
  font-size: 0.25661rem;
  line-height: 1;
  color: rgba(249, 249, 249, 0.92);

  @include theme-light {
    color: rgba(17, 17, 17, 0.76);
  }
}

.id-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0.50208rem;
  height: 0.30976rem;
  border-radius: 0.075rem;
  font-size: 0.21595rem;
  background: rgba(255, 255, 255, 0.3);
  color: #fff;

  @include theme-light {
    background: rgba(79, 79, 79, 0.4);
  }
}

.check {
  width: figma-rem(17);
  height: figma-rem(17);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  background: transparent;
  flex: 0 0 auto;
  float: left;
  margin-top: 1rem;

  @include theme-light {
    border-color: #c7c7c7;
    background: #c7c7c7;
  }
}

.check.on {
  background: #1bead0;

  @include theme-light {
    border-color: var(--c-brand);
    background: #fff;
    box-shadow: inset 0 0 0 figma-rem(4) var(--c-brand);
  }
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

  @include theme-light {
    color: #111;
  }
}

.meta span {
  color: rgba(255, 255, 255, 0.85);
  font-size: figma-rem(9.623);

  @include theme-light {
    color: rgba(17, 17, 17, 0.7);
  }
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

  @include theme-light {
    background: #dadada;
  }
}

.assets b {
  margin: 0;
  font-size: figma-rem(10.135);
  color: #f9f9f9;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: figma-rem(2);

  @include theme-light {
    color: #111;
  }
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

  @include theme-light {
    color: rgba(17, 17, 17, 0.58);
  }
}

.save {
  margin-top: auto;
  border: 1px solid rgba(242, 242, 242, 0.8);
  min-height: figma-rem(55.184);
  border-radius: figma-rem(40.576);
  color: #fff;
  background: linear-gradient(168deg, #05e7ae 8%, #027a5c 72%);
  font-size: figma-rem(18.985);

  @include theme-light {
    border-color: transparent;
    background: var(--c-brand);
  }
}

.save:disabled {
  opacity: 0.72;
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

  @include theme-light {
    background: #dadada;
  }
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

  @include theme-light {
    color: #111;
  }
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
</style>
