<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  postOrgClubSearchByIdApi,
  postOrgChangeClubDataApi,
  postOrgClubAgentInviTationApi,
} from '@/api/org'
import type {
  OrgClubData,
  OrgClubSearchByIdResponseData
} from '@/api/models/org'
import imgClubCover from '@/assets/images/default_avatar.png'
import imgBalance from '@/assets/icons/icon_balance.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgPeople from '@/assets/icons/icon_people.png'
import imgQuickSafety from '@/assets/images/club_quick_activity.png'
import imgQuickRanking from '@/assets/images/club_quick_room_history.png'
import { useUserInfoStore } from '@/stores/userInfo'
import { extractInvitationLink } from '@/utils/clubInvitation'
import { showFailToast, showSuccessToast } from 'vant'

interface QuickActionItem {
	id: number
	title: string
	cover: string
}

type SettingItemKind = 'text' | 'arrow' | 'switch' | 'level' | 'founder' | 'copy'

interface SettingItem {
	id: number
	label: string
	kind: SettingItemKind
	value?: string
	switchKey?: 'allowSearch' | 'joinWithoutApproval'
}

const router = useRouter()
const userInfoStore = useUserInfoStore()

const imgQuickFund = 'https://www.figma.com/api/mcp/asset/9a7731a8-09f1-45c7-8292-70162e10dc50'
const imgInviteCover = 'https://www.figma.com/api/mcp/asset/788e1bce-ddc2-4682-a337-4421aefcbb64'
const imgInviteQr = 'https://www.figma.com/api/mcp/asset/f01dee7f-e8ef-4fe8-8e82-da2412a0040b'
const imgInviteHeart = 'https://www.figma.com/api/mcp/asset/65e10a58-a9e9-4b72-9616-e013be298979'
const imgModalClose = 'https://www.figma.com/api/mcp/asset/48528ead-0f8b-41cd-8ffc-359a64018378'

const loading = ref(false)
const clubDetail = ref<OrgClubSearchByIdResponseData | null>(null)

// 用户等级：0 普通，1 会长，2 副会长，3 管理员，4 代理。
const userLevel = computed(() => Number(clubDetail.value?.user_level ?? userInfoStore.currentClub?.user_level ?? 0))
const isFounder = computed(() => userLevel.value === 1)
const isVicePresident = computed(() => userLevel.value === 2)
const isAdmin = computed(() => userLevel.value === 3)
const isAgent = computed(() => userLevel.value === 4)
const canManageClub = computed(() => isFounder.value || isVicePresident.value || isAdmin.value)

const displayClub = computed(() => clubDetail.value ?? userInfoStore.currentClub)

const quickActions = computed<QuickActionItem[]>(() => {
  if (canManageClub.value) {
    return [
      { id: 1, title: '活动管理', cover: imgQuickSafety },
      { id: 2, title: '牌局记录', cover: imgQuickRanking },
      { id: 3, title: '基金', cover: imgQuickFund },
    ]
  }

  return []
})

const settings = computed<SettingItem[]>(() => {
  const list: SettingItem[] = [
    {
      id: 1,
      label: '创始人',
      kind: 'founder',
      value: displayClub.value?.club_creator_nickname || '--'
    },
    { id: 2, label: '邀请分享', kind: 'arrow' },
    { id: 3, label: '联盟', kind: 'text', value: displayClub.value?.tribe_name || '--' },
  ]

  if (isFounder.value) {
    list.push(
      { id: 4, label: '当前俱乐部等级', kind: 'level', value: `LV. ${displayClub.value?.level || 0}` },
      { id: 5, label: '允许其他人搜索俱乐部', kind: 'switch', switchKey: 'allowSearch' },
      { id: 6, label: '入会无需审批', kind: 'switch', switchKey: 'joinWithoutApproval' },
    )
  }

  list.push({ id: 7, label: '创建时间', kind: 'text', value: formatDate(displayClub.value?.create_time) })

  if (canManageClub.value) {
    list.push({ id: 8, label: '复制俱乐部', kind: 'copy' })
  }

  if (isAgent.value) {
    list.push({ id: 9, label: '下线成员', kind: 'arrow' })
  }

  return list
})

const allowSearch = ref(true)
const joinWithoutApproval = ref(false)
const showInvitePopup = ref(false)
const showCopyPopup = ref(false)

const clubName = computed(() => displayClub.value?.club_name || '俱乐部名称')
const clubAlias = computed(() => displayClub.value?.tribe_name || 'XXXX')
const clubId = computed(() => String(displayClub.value?.random_id || '--'))

function formatCount(value?: number): string {
  return Number(value || 0).toLocaleString('en-US')
}

function formatDate(value?: string): string {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

function updateSwitchesByClubData(data: OrgClubData | null): void {
  allowSearch.value = Number(data?.search_switch ?? 0) === 1
  joinWithoutApproval.value = Number(data?.auto_audit_switch ?? 0) === 1
}

async function refreshClubDetail(): Promise<void> {
  const currentClub = userInfoStore.currentClub
  if (!currentClub?.random_id) {
    showFailToast('未找到俱乐部信息')
    void router.replace('/club/list')
    return
  }

  loading.value = true
  try {
    const response = await postOrgClubSearchByIdApi({
      club_random_id: currentClub.random_id,
    })

    if (response.code !== 0 || !response.data) {
      showFailToast(response.msg || '获取俱乐部详情失败')
      clubDetail.value = currentClub
      updateSwitchesByClubData(currentClub)
      return
    }

    clubDetail.value = response.data
    userInfoStore.setCurrentClub(response.data)
    updateSwitchesByClubData(response.data)
  } catch (error) {
    console.error('refreshClubDetail error', error)
    showFailToast('获取俱乐部详情失败')
    clubDetail.value = currentClub
    updateSwitchesByClubData(currentClub)
  } finally {
    loading.value = false
  }
}

function goEditDescription(): void {
  if (!isFounder.value) {
    showFailToast('仅创始人可修改')
    return
  }

  void router.push('/club/edit-description')
}

function goEditName(): void {
  if (!isFounder.value) {
    showFailToast('仅创始人可修改')
    return
  }

  void router.push('/club/edit-name')
}

function onQuickAction(actionId: number): void {
  if (actionId === 1) {
    void router.push('/club/activity/list')
    return
  }

  if (actionId === 2) {
    void router.push('/club/room/history')
    return
  }

  if (actionId === 3) {
    void router.push('/club/fund')
    return
  }

  if (actionId === 4) {
    void router.push('/club/downline-members')
  }
}

function onSettingClick(item: SettingItem): void {
  if (item.kind === 'switch' || item.kind === 'text' || item.kind === 'founder') {
    return
  }

  if (item.label === '邀请分享') {
    showInvitePopup.value = true
    return
  }

  if (item.label === '复制俱乐部') {
    if (!canManageClub.value) {
      showFailToast('暂无权限')
      return
    }

    showCopyPopup.value = true
    return
  }

  if (item.label === '下线成员') {
    void router.push('/club/downline-members')
    return
  }

  if (item.kind === 'level') {
    void router.push('/club/level')
    return
  }
}

function toggleSwitch(key: 'allowSearch' | 'joinWithoutApproval'): void {
  void updateClubSwitch(key)
}

async function updateClubSwitch(key: 'allowSearch' | 'joinWithoutApproval'): Promise<void> {
  if (!isFounder.value) {
    showFailToast('仅创始人可修改')
    return
  }

  const clubId = Number(displayClub.value?.club_id)
  if (!clubId) {
    showFailToast('俱乐部信息异常')
    return
  }

  const nextAllowSearch = key === 'allowSearch' ? !allowSearch.value : allowSearch.value
  const nextAutoAudit = key === 'joinWithoutApproval' ? !joinWithoutApproval.value : joinWithoutApproval.value

  if (key === 'allowSearch') {
    allowSearch.value = nextAllowSearch
  } else {
    joinWithoutApproval.value = nextAutoAudit
  }

  try {
    const response = await postOrgChangeClubDataApi({
      club_id: clubId,
      search_switch: nextAllowSearch ? 1 : 2,
      auto_audit_switch: nextAutoAudit ? 1 : 2,
    })

    if (response.code !== 0) {
      const fallback = (response.msg ?? response.message) as unknown
      throw new Error(typeof fallback === 'string' ? fallback : '更新失败')
    }

    if (displayClub.value) {
      const merged = {
        ...displayClub.value,
        search_switch: nextAllowSearch ? 1 : 2,
        auto_audit_switch: nextAutoAudit ? 1 : 2,
      }
      clubDetail.value = merged
      userInfoStore.setCurrentClub(merged)
    }
  } catch (error) {
    if (key === 'allowSearch') {
      allowSearch.value = !nextAllowSearch
    } else {
      joinWithoutApproval.value = !nextAutoAudit
    }
    const message = error instanceof Error ? error.message : '更新失败'
    showFailToast(message)
  }
}

function closeInvitePopup(): void {
  showInvitePopup.value = false
}

function closeCopyPopup(): void {
  showCopyPopup.value = false
}

function saveInviteShare(): void {
  showSuccessToast('已保存分享图')
  closeInvitePopup()
}

function submitCopyRequest(): void {
  showSuccessToast('已提交复制申请')
  closeCopyPopup()
}

function onDeleteClub(): void {
  if (!isFounder.value) {
    showFailToast('仅创始人可操作')
    return
  }

  showFailToast('删除俱乐部接口待接入')
}

async function prefetchAgentInvitationLink(): Promise<void> {
  if (!isAgent.value) {
    return
  }

  const currentClub = displayClub.value
  if (!currentClub?.random_id) {
    return
  }

  const cached = userInfoStore.getClubAgentInvitation(currentClub.random_id)
  if (cached) {
    return
  }

  try {
    const rawUserId = currentClub.user_id ?? userInfoStore.userInfo?.user?.id
    const userId = Number(rawUserId)

    const response = await postOrgClubAgentInviTationApi({
      club_id: currentClub.club_id,
      user_id: Number.isFinite(userId) ? userId : undefined,
    })

    if (response.code !== 0) {
      return
    }

    const invitationLink = extractInvitationLink(response.data)
    if (!invitationLink) {
      return
    }

    userInfoStore.setClubAgentInvitation(currentClub.random_id, invitationLink)
  } catch (error) {
    console.error('prefetchAgentInvitationLink error', error)
  }
}

onMounted(async () => {
  await refreshClubDetail()
  await prefetchAgentInvitationLink()
})
</script>

<template>
  <div class="club-detail-bg ">
    <div class="bg-blur bg-blur--pink" aria-hidden="true"></div>
    <div class="bg-blur bg-blur--cyan" aria-hidden="true"></div>
    <HeaderBack :title="'俱乐部信息'" />

    <div v-loading="loading" class="page-shell club-detail app-scroll-standalone">
      <section class="club-header-card">
        <div class="club-header-main">
          <img class="club-avatar" :src="displayClub?.logo || imgClubCover" alt="俱乐部头像" />

          <div class="club-summary">
            <button type="button" class="club-name-edit">
              <h1 class="club-name">{{ displayClub?.club_name || '俱乐部名称' }}</h1>
              <span
                v-if="isFounder"
                class="name-edit-icon"
                aria-hidden="true"
                @click="goEditName"
              ></span>
            </button>
            <p class="club-id-row">
              <span class="id-tag">ID</span>
              <span class="id-text">{{ displayClub?.random_id || '--' }}</span>
            </p>

            <p class="metric-line">
              <img :src="imgBalance" alt="" aria-hidden="true" />
              <span>{{ formatCount(displayClub?.user_gold) }}</span>
            </p>
            <p class="metric-line">
              <img :src="imgChips" alt="" aria-hidden="true" />
              <span>{{ formatCount(displayClub?.user_credit) }}</span>
            </p>
          </div>
        </div>

        <div class="club-size-pill" aria-label="俱乐部人数">
          <span class="size-text">{{ displayClub?.club_members || 0 }}/{{ displayClub?.upper_limit || 0 }}</span>
          <img :src="imgPeople" alt="" aria-hidden="true" />
        </div>
      </section>

      <section v-if="quickActions.length > 0" class="quick-actions">
        <button
          v-for="item in quickActions"
          :key="item.id"
          type="button"
          class="quick-card"
          @click="onQuickAction(item.id)"
        >
          <span class="quick-image-wrap">
            <img :src="item.cover" :alt="item.title" />
          </span>
          <span class="quick-title">{{ item.title }}</span>
        </button>
      </section>

      <section class="intro-card">
        <span>俱乐部简介</span>
        <button
          v-if="isFounder"
          type="button"
          class="intro-edit"
          aria-label="编辑俱乐部简介"
          @click="goEditDescription"
        >
          <span class="edit-pen"></span>
        </button>
      </section>

      <section class="settings-card">
        <button
          v-for="item in settings"
          :key="item.id"
          type="button"
          class="settings-row"
          :class="[
            `settings-row--${item.kind}`,
            {
              'settings-row--clickable': item.kind === 'arrow' || item.kind === 'level' || item.kind === 'copy',
            },
          ]"
          @click="onSettingClick(item)"
        >
          <div class="label-wrap">
            <span>{{ item.label }}</span>
            <span v-if="item.kind === 'copy'" class="info-dot">i</span>
          </div>

          <div class="right-wrap">
            <template v-if="item.kind === 'founder'">
              <span class="muted-text">{{ item.value }}</span>
              <img class="mini-avatar" :src="displayClub?.club_creator_avatar || imgClubCover" alt="创始人头像" />
            </template>

            <template v-else-if="item.kind === 'text'">
              <span class="muted-text">{{ item.value }}</span>
            </template>

            <template v-else-if="item.kind === 'level'">
              <span class="level-pill">{{ item.value }}</span>
              <span class="chevron" aria-hidden="true"></span>
            </template>

            <template v-else-if="item.kind === 'switch' && item.switchKey">
              <button
                type="button"
                class="switch"
                :class="{
                  'switch--on': item.switchKey === 'allowSearch' ? allowSearch : joinWithoutApproval,
                }"
                :aria-label="item.label"
                @click.stop="toggleSwitch(item.switchKey)"
              >
                <span class="switch-knob"></span>
              </button>
            </template>

            <template v-else>
              <span class="chevron" aria-hidden="true"></span>
            </template>
          </div>
        </button>
      </section>

      <section v-if="isFounder" class="danger-zone">
        <button type="button" class="danger-btn" @click="onDeleteClub">删除俱乐部</button>
      </section>
    </div>

    <div v-if="showInvitePopup" class="club-modal-mask" @click="closeInvitePopup">
      <section class="invite-modal" @click.stop>
        <header class="invite-modal__head">
          <h3>邀请链接</h3>
          <button
            type="button"
            class="invite-modal__close"
            aria-label="关闭"
            @click="closeInvitePopup"
          >
            <img :src="imgModalClose" alt="" aria-hidden="true" />
          </button>
        </header>

        <div class="invite-modal__body">
          <p class="invite-modal__subtitle">开启你的竞技之旅</p>
          <div class="invite-modal__cover-wrap">
            <img class="invite-modal__cover" :src="imgInviteCover" alt="邀请海报" />
          </div>
          <p class="invite-modal__club-name">{{ clubName }}</p>
          <p class="invite-modal__club-alias">{{ clubAlias }}</p>
          <p class="invite-modal__id-row">
            <span class="invite-modal__id-tag">ID</span>
            <span>{{ clubId }}</span>
          </p>
        </div>

        <div class="invite-modal__qr-wrap">
          <img class="invite-modal__qr" :src="imgInviteQr" alt="扫码加入俱乐部" />
          <span class="invite-modal__qr-heart">
            <img :src="imgInviteHeart" alt="" aria-hidden="true" />
          </span>
        </div>
        <p class="invite-modal__qr-tip">扫码加入，一键开启</p>

        <button type="button" class="modal-primary-btn" @click="saveInviteShare">保存分享</button>
      </section>
    </div>

    <div v-if="showCopyPopup" class="club-modal-mask" @click="closeCopyPopup">
      <section class="copy-modal" @click.stop>
        <p>暂无，申请复制俱乐部需要等待审核，是否现在提交申请</p>
        <div class="copy-modal__actions">
          <button type="button" class="modal-secondary-btn" @click="closeCopyPopup">取消</button>
          <button type="button" class="modal-primary-btn" @click="submitCopyRequest">确定</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-detail-bg {
	position: relative;
	min-height: 100dvh;
	background:
		radial-gradient(140% 84% at 50% -6%, rgba(216, 146, 131, 0.64), rgba(142, 82, 128, 0.6) 42%, rgba(29, 124, 153, 0.82) 100%),
		linear-gradient(180deg, #ba8d82 0%, #35a6c6 100%);
	overflow: hidden;
}

.bg-blur {
	position: absolute;
	border-radius: 999px;
	filter: blur(0.9rem);
	opacity: 0.5;
	pointer-events: none;
}

.bg-blur--pink {
	width: 2.6rem;
	height: 2.6rem;
	top: 3.8rem;
	left: -0.8rem;
	background: rgba(217, 32, 116, 0.56);
}

.bg-blur--cyan {
	width: 2.3rem;
	height: 2.3rem;
	right: -0.7rem;
	bottom: 2.6rem;
	background: rgba(36, 212, 255, 0.52);
}

.club-detail {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	gap: 0.40524rem;
	padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
}

.top-bar {
	min-height: 0.72215rem;
	padding-left: 0.32rem;
}

.back-btn {
	border: 0;
	background: transparent;
	color: #f9f9f9;
	display: inline-flex;
	align-items: center;
	gap: 0.16rem;
	padding: 0;
}

.back-icon {
	width: 0.18rem;
	height: 0.18rem;
	border-left: 0.03rem solid rgba(249, 249, 249, 0.95);
	border-bottom: 0.03rem solid rgba(249, 249, 249, 0.95);
	transform: rotate(45deg);
}

.back-title {
	font-size: 0.49799rem;
	line-height: 1;
	font-weight: 500;
}

.club-header-card {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 0;
	min-height: 3.08434rem;
	padding: 0.12048rem 0.55422rem;
	border-radius: 1.00402rem;
	background: rgba(0, 0, 0, 0.22);
	backdrop-filter: blur(0.2rem);
}

.club-header-main {
	display: inline-flex;
	align-items: center;
	gap: 0.28112rem;
    bottom: 0.5rem;
    position: relative;
}

.club-avatar {
	width: 1.96787rem;
	height: 1.97968rem;
	border-radius: 999px;
	object-fit: cover;
	border: 0;
}

.club-summary {
	display: flex;
	flex-direction: column;
	min-height: 1.99325rem;
}

.club-name-edit {
	display: inline-flex;
	align-items: center;
	gap: 0.08rem;
	padding: 0;
	border: 0;
	background: transparent;
	color: inherit;
	max-width: 100%;
}

.club-name {
	margin: 0;
	color: #f9f9f9;
	font-size: 0.5692rem;
	line-height: 1;
	font-weight: 700;
}

.name-edit-icon {
	position: relative;
	width: 0.2rem;
	height: 0.2rem;
	flex: 0 0 auto;
}

.name-edit-icon::before {
	content: '';
	position: absolute;
	left: 0.03rem;
	top: 0.06rem;
	width: 0.14rem;
	height: 0.06rem;
	border: 0.02rem solid rgba(249, 249, 249, 0.92);
	border-radius: 0.03rem;
	transform: rotate(-38deg);
}

.club-id-row {
	margin: 0;
	display: inline-flex;
	align-items: center;
	gap: 0.06231rem;
}

.id-tag {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 0.48924rem;
	height: 0.27575rem;
	border-radius: 0.10682rem;
	font-size: 0.20537rem;
	color: #fff;
	background: rgba(255, 255, 255, 0.28);
}

.id-text {
	font-size: 0.24404rem;
	color: rgba(249, 249, 249, 0.95);
}

.metric-line {
	margin: 0;
	display: inline-flex;
	align-items: center;
	gap: 0.11365rem;
	color: #f9f9f9;
	font-size: 0.3553rem;
	line-height: 1.2;
	font-weight: 600;
}

.metric-line img {
	width: 0.4rem;
	height: 0.4rem;
	object-fit: contain;
}

.club-size-pill {
	flex: 0 0 auto;
	min-height: 0.82731rem;
	padding: 0 0.28112rem;
	border-radius: 0.72289rem;
	display: inline-flex;
	align-items: center;
	gap: 0.05622rem;
	background: rgba(255, 255, 255, 0.2);
	right: 0.5rem;
	bottom: 0.3rem;
    position: absolute;
}

.size-text {
	color: #f9f9f9;
	font-size: 0.4739rem;
	line-height: 1;
	font-weight: 500;
}

.club-size-pill img {
	width: 0.48rem;
	height: 0.48rem;
	object-fit: contain;
	opacity: 0.94;
}

.quick-actions {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 0.29333rem;
}

.quick-card {
	border: 0;
	padding: 0;
	background: transparent;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.16027rem;
	color: #f9f9f9;
}

.quick-image-wrap {
	width: 100%;
	aspect-ratio: 1 / 1;
	border-radius: 0.75252rem;
	border: 0.02667rem solid rgba(255, 255, 255, 0.6);
	overflow: hidden;
	background: rgba(255, 255, 255, 0.26);
}

.quick-image-wrap img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.quick-title {
	font-size: 0.304rem;
	line-height: 1;
	text-align: center;
}

.intro-card {
	min-height: 1.51964rem;
	padding: 0.34538rem 0.41767rem 0.34538rem 0.55422rem;
	border-radius: 0.72289rem;
	background: rgba(0, 0, 0, 0.24);
	backdrop-filter: blur(0.12rem);
	display: flex;
	align-items: center;
	justify-content: space-between;
	color: rgba(249, 249, 249, 0.96);
	font-size: 0.40524rem;
}

.intro-edit {
	border: 0;
	width: 0.67539rem;
	height: 0.67539rem;
	border-radius: 50%;
	background: linear-gradient(145deg, #15ddb2, #00ca98);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0;
}

.edit-pen {
	position: relative;
	width: 0.21rem;
	height: 0.21rem;
}

.edit-pen::before {
	content: '';
	position: absolute;
	left: 0.03rem;
	top: 0.06rem;
	width: 0.14rem;
	height: 0.06rem;
	border: 0.02rem solid #fff;
	border-radius: 0.03rem;
	transform: rotate(-38deg);
}

.settings-card {
	display: flex;
	flex-direction: column;
	gap: 0.28916rem;
	padding: 0.34538rem 0.41767rem;
	border-radius: 0.72289rem;
	background:
		radial-gradient(80% 100% at 100% 100%, rgba(51, 169, 206, 0.26), rgba(51, 169, 206, 0)),
		rgba(0, 0, 0, 0.24);
	backdrop-filter: blur(0.15rem);
}

.settings-row {
	width: 100%;
	border: 0;
	background: transparent;
	padding: 0;
	min-height: 0.53333rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0;
	color: #f1f1f1;
	font-size: 0.40524rem;
}

.label-wrap {
	display: inline-flex;
	align-items: center;
	gap: 0.06rem;
	min-width: 0;
	text-align: left;
}

.right-wrap {
	display: inline-flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.08rem;
}

.muted-text {
	color: rgba(228, 228, 228, 0.7);
	font-size: 0.40524rem;
}

.mini-avatar {
	width: 0.71rem;
	height: 0.71rem;
	border-radius: 999px;
	object-fit: cover;
}

.chevron {
	width: 0.26656rem;
	height: 0.26656rem;
	border-top: 0.02rem solid rgba(237, 237, 237, 0.85);
	border-right: 0.02rem solid rgba(237, 237, 237, 0.85);
	transform: rotate(45deg);
}

.level-pill {
	display: inline-flex;
	align-items: center;
	min-height: 0.48614rem;
	padding: 0 0.1246rem;
	border-radius: 999px;
	font-size: 0.27857rem;
	font-weight: 700;
	color: #f9f9f9;
	background: linear-gradient(152deg, #05e7ae 8%, #027a5c 72%);
}

.switch {
	width: 1.756rem;
	height: 0.82747rem;
	border: 0;
	padding: 0.04rem;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.22);
	display: inline-flex;
	align-items: center;
}

.switch--on {
	justify-content: flex-end;
	background: #05e7ae;
}

.switch:not(.switch--on) {
	justify-content: flex-start;
}

.switch-knob {
	width: 0.667rem;
	height: 0.667rem;
	border-radius: 50%;
	background: #fff;
	box-shadow: 0 0.02rem 0.04rem rgba(0, 0, 0, 0.22);
}

.info-dot {
	width: 0.3592rem;
	height: 0.3592rem;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.24);
	color: #fff;
	font-size: 0.22613rem;
	line-height: 0.3592rem;
	text-align: center;
}

.danger-zone {
	margin-top: 0.40524rem;
	padding: 0 0.64108rem 0.24rem;
}

.danger-btn {
	width: 100%;
	min-height: 1.43581rem;
	border: 0;
	border-radius: 1.05574rem;
	color: #f9f9f9;
	font-size: 0.5066rem;
	font-weight: 500;
	background: linear-gradient(90deg, rgba(73, 29, 86, 0.8), rgba(19, 95, 125, 0.84));
}

.club-modal-mask {
	position: fixed;
	inset: 0;
	padding: 0.4rem;
	background: rgba(12, 12, 12, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 80;
}

.invite-modal,
.copy-modal {
	width: min(9.1rem, 100%);
	border-radius: 0.97035rem;
	border: 0.0255rem solid rgba(242, 242, 242, 0.4);
	background: linear-gradient(121deg, rgba(142, 142, 142, 0.2) 3%, rgba(73, 73, 73, 0.38) 89%);
	backdrop-filter: blur(0.20216rem);
	box-shadow:
		0 0 0.22981rem rgba(0, 0, 0, 0.85) inset,
		0.05672rem 0.11344rem 0.45908rem rgba(242, 242, 242, 0.5) inset,
		0.09192rem 0.11491rem 0.18384rem rgba(0, 0, 0, 0.28);
	color: #f9f9f9;
}

.invite-modal {
	padding: 0.42rem 0.42rem 0.62rem;
	display: flex;
	flex-direction: column;
	gap: 0.22rem;
}

.invite-modal__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.invite-modal__head h3 {
	margin: 0;
	flex: 1;
	text-align: center;
	font-size: 0.41866rem;
	font-weight: 500;
	line-height: 1.4;
	padding-left: 0.48rem;
}

.invite-modal__close {
	width: 0.96rem;
	height: 0.96rem;
	border: 0;
	background: transparent;
	padding: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}

.invite-modal__close img {
	width: 0.66rem;
	height: 0.66rem;
	object-fit: contain;
}

.invite-modal__body {
	padding: 0.35rem 0.42rem 0.24rem;
	border-radius: 0.72464rem;
	background: linear-gradient(100deg, rgba(255, 255, 255, 0.08), rgba(230, 230, 230, 0.12));
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.08rem;
}

.invite-modal__subtitle {
	margin: 0;
	font-size: 0.35565rem;
	line-height: 1.35;
}

.invite-modal__cover-wrap {
	width: 100%;
	height: 2.3752rem;
	border-radius: 0.58rem;
	overflow: hidden;
	border: 0.01778rem solid rgba(255, 255, 255, 0.14);
	margin-top: 0.06rem;
}

.invite-modal__cover {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.invite-modal__club-name {
	margin: 0.16rem 0 0;
	font-size: 0.35565rem;
	line-height: 1.35;
}

.invite-modal__club-alias {
	margin: 0;
	font-size: 0.48309rem;
	line-height: 1.2;
	font-weight: 700;
}

.invite-modal__id-row {
	margin: 0;
	display: inline-flex;
	align-items: center;
	gap: 0.09333rem;
	font-size: 0.32293rem;
	line-height: 1;
	font-weight: 600;
}

.invite-modal__id-tag {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 0.46rem;
	height: 0.3rem;
	padding: 0 0.12rem;
	border-radius: 0.13rem;
	background: rgba(255, 255, 255, 0.3);
	font-size: 0.23111rem;
	color: #444;
	font-weight: 600;
}

.invite-modal__qr-wrap {
	position: relative;
	width: 3.33333rem;
	height: 3.33333rem;
	margin: 0.04rem auto 0;
	border-radius: 0.30747rem;
	background: #fff;
	padding: 0.10667rem;
	border: 0.10067rem solid #00b184;
	overflow: hidden;
}

.invite-modal__qr {
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.invite-modal__qr-heart {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	width: 0.9888rem;
	height: 0.9888rem;
	border-radius: 50%;
	background: #fff;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}

.invite-modal__qr-heart img {
	width: 0.64rem;
	height: 0.64rem;
	object-fit: contain;
}

.invite-modal__qr-tip {
	margin: 0;
	text-align: center;
	font-size: 0.314rem;
	font-weight: 500;
	line-height: 1.3;
}

.modal-primary-btn,
.modal-secondary-btn {
	width: 100%;
	min-height: 1.43581rem;
	border: 0;
	border-radius: 1.05574rem;
	font-size: 0.4rem;
	font-weight: 500;
	color: #fff;
	line-height: 1.2;
	padding: 0.2rem 0.4rem;
}

.modal-primary-btn {
	border: 0.01333rem solid rgba(242, 242, 242, 0.8);
	background: linear-gradient(153deg, #05e7ae 8%, #027a5c 72%);
	box-shadow: inset 0 -0.16rem 0.3rem rgba(0, 0, 0, 0.14);
}

.copy-modal {
	width: min(8.25283rem, 100%);
	padding: 0.82rem 0.42rem 0.55rem;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.copy-modal p {
	margin: 0;
	text-align: center;
	font-size: 0.36232rem;
	line-height: 1.3;
}

.copy-modal__actions {
	display: flex;
	gap: 0.25339rem;
}

.copy-modal__actions > button {
	flex: 1;
	min-width: 0;
}

.modal-secondary-btn {
	background: rgba(0, 0, 0, 0.34);
	box-shadow: inset 0 -0.2rem 0.24rem rgba(0, 0, 0, 0.24);
}

@media (max-width: 340px) {
	.invite-modal,
	.copy-modal {
		padding-left: 0.3rem;
		padding-right: 0.3rem;
	}

	.invite-modal__head h3 {
		font-size: 0.36rem;
	}

	.copy-modal p {
		font-size: 0.32rem;
	}

	.modal-primary-btn,
	.modal-secondary-btn {
		font-size: 0.35rem;
	}

	.club-name {
		font-size: 0.38rem;
	}

	.size-text {
		font-size: 0.31rem;
	}

	.settings-row {
		font-size: 0.3rem;
	}

	.muted-text {
		font-size: 0.3rem;
	}

	.danger-btn {
		font-size: 0.4rem;
	}
}
</style>
