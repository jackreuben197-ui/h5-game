<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { postClubAgentUserListApi, postOrgClubAgentInviTationApi } from '@/api/org'
import type { ClubAgentUserListRecord } from '@/api/models/org'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { useUserInfoStore } from '@/stores/userInfo'
import imgAvatar from '@/assets/images/default_avatar.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgBalance from '@/assets/icons/icon_balance.png'
import imgSearch from '@/assets/icons/club_search.svg'
import imgInfo from '@/assets/icons/tips.svg'
import { extractInvitationLink } from '@/utils/clubInvitation'
import { saveQrCodeImage } from '@/utils/qrcode'
import { showFailToast, showSuccessToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const userInfoStore = useUserInfoStore()

const loading = ref(false)
const keyword = ref('')
const members = ref<ClubAgentUserListRecord[]>([])
const total = ref(0)
const invitationLink = ref('')

const totalText = computed(() => {
  const current = members.value.length
  const max = total.value || current
  return `${current}/${max}`
})

const invitationPreview = computed(() => invitationLink.value || '未获取到邀请链接')

async function loadMembers() {
  loading.value = true
  try {
    const response = await postClubAgentUserListApi({
      club_random_id: userInfoStore.currentClub?.random_id,
      club_id: userInfoStore.currentClub?.club_id,
      sort_type: 4,
      order_type: 2,
      keyword: keyword.value.trim(),
      offset: 0,
      limit: 50,
    })

    if (response.code !== 0 || !response.data) {
      showFailToast(response.msg || '获取下线成员失败')
      members.value = []
      total.value = 0
      return
    }

    const records = Array.isArray(response.data.data) ? response.data.data : []
    members.value = records
    total.value = Number(response.data.total ?? records.length)
  } catch (error) {
    console.error('loadMembers error', error)
    showFailToast('获取下线成员失败')
    members.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadInvitationLink() {
  const currentClub = userInfoStore.currentClub
  if (!currentClub?.random_id) {
    invitationLink.value = ''
    return
  }

  const cached = userInfoStore.getClubAgentInvitation(currentClub.random_id)
  if (cached) {
    invitationLink.value = cached
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
      invitationLink.value = ''
      return
    }

    const link = extractInvitationLink(response.data)
    invitationLink.value = link
    if (link) {
      userInfoStore.setClubAgentInvitation(currentClub.random_id, link)
    }
  } catch (error) {
    console.error('loadInvitationLink error', error)
    invitationLink.value = ''
  }
}

function onSearch() {
  void loadMembers()
}

async function onSaveQrCode() {
  if (!invitationLink.value) {
    showFailToast('邀请链接为空')
    return
  }

  try {
    await saveQrCodeImage(invitationLink.value, {
      fileName: `club-invite-${userInfoStore.currentClub?.random_id || Date.now()}.png`,
    })
    showSuccessToast('二维码已保存')
  } catch (error) {
    console.error('onSaveQrCode error', error)
    showFailToast(error instanceof Error ? error.message : '保存二维码失败')
  }
}

onMounted(async () => {
  await Promise.all([loadMembers(), loadInvitationLink()])
})
</script>

<template>
  <div class="page-shell downline-page" :style="backgroundStyle">
    <HeaderBack title="下线成员" />

    <div v-loading="loading" class="content">
      <div class="invite-row">
        <div class="invite-title-wrap">
          <span>邀请链接</span>
          <img :src="imgInfo" alt="" aria-hidden="true" />
        </div>
        <button type="button" class="qr-btn" @click="onSaveQrCode">保存二维码</button>
      </div>

      <p class="invite-link" :title="invitationLink">{{ invitationPreview }}</p>

      <div class="search-box">
        <img class="search-icon" :src="imgSearch" alt="" aria-hidden="true" />
        <input
          v-model="keyword"
          type="text"
          class="search-input"
          placeholder="玩家查询"
          @keyup.enter="onSearch"
        />
      </div>

      <div class="total-row">
        <span class="total-title">Total Members</span>
        <span class="total-value">{{ totalText }}</span>
      </div>

      <div class="members-wrap">
        <div v-for="member in members" :key="member.user_id" class="member-card">
          <img class="member-avatar" :src="member.avatar || imgAvatar" alt="avatar" />

          <div class="member-main">
            <div class="member-top">
              <p class="member-name">
                {{ member.nick_name || member.remark_name || '未命名成员' }}
              </p>
            </div>

            <div class="member-id-row">
              <span class="member-id-tag">ID</span>
              <span class="member-id">{{ member.random_num || '--' }}</span>
            </div>

            <div class="member-assets">
              <p class="asset-item">
                <img :src="imgChips" alt="uc" />
                <span class="asset-label">UC</span>
                <strong class="asset-value">{{ member.gold || 0 }}</strong>
              </p>
              <p class="asset-item">
                <img :src="imgBalance" alt="credit" />
                <span class="asset-label">免审额</span>
                <strong class="asset-value">
                  {{ member.club_gold_credit }}/{{ member.club_gold_credit_limit }}
                </strong>
              </p>
              <p class="asset-item">
                <img :src="imgDiamond" alt="diamond" />
                <span class="asset-label">钻石</span>
                <strong class="asset-value">{{ member.diamonds || 0 }}</strong>
              </p>
            </div>
          </div>
        </div>

        <div v-if="!members.length && !loading" class="empty-box">暂无下线成员</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.downline-page {
  position: relative;
  height: 100dvh;
  background-size: cover;
  color: #fff;
}

.page-backdrop {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.content {
  position: relative;
  z-index: 1;
  padding: 0.1733rem 0.48rem calc(0.48rem + env(safe-area-inset-bottom));
}

.invite-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.04rem;
  font-size: 0.4052rem;
}

.invite-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
}

.invite-title-wrap img {
  width: 0.36rem;
  height: 0.36rem;
  object-fit: contain;
}

.qr-btn {
  border: 0;
  min-width: 2.1333rem;
  height: 0.6667rem;
  border-radius: 1rem;
  padding: 0 0.2933rem;
  border: 0.0133rem solid rgba(242, 242, 242, 0.8);
  color: #fff;
  font-size: 0.32rem;
  background: linear-gradient(159deg, #05e7ae 8%, #027a5c 72%);
}

.invite-link {
  margin: 0.1067rem 0 0.24rem;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.2667rem;
  line-height: 1.35;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.2297rem;
  height: 1.0683rem;
  padding: 0 0.2133rem 0 0.4533rem;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.16rem);
}

.search-icon {
  width: 0.5856rem;
  height: 0.5741rem;
  object-fit: contain;
}

.search-input {
  flex: 1;
  height: 100%;
  border: 0;
  outline: none;
  border-radius: 9999px;
  padding: 0;
  background: transparent;
  color: #fff;
  font-size: 0.4134rem;
  line-height: 1.4;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.88);
}

.total-row {
  margin-top: 0.24rem;
  display: flex;
  align-items: baseline;
  gap: 0.1869rem;
}

.total-title {
  color: #fff;
  font-size: 0.3799rem;
  line-height: 1.2;
  font-weight: 700;
}

.total-value {
  color: #fff;
  font-size: 0.4267rem;
  line-height: 1.2;
  font-weight: 500;
}

.members-wrap {
  margin-top: 0.2667rem;
  display: flex;
  flex-direction: column;
  gap: 0.2667rem;
}

.member-card {
  border-radius: 1.0557rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.16rem);
  padding: 0.1606rem 0.4392rem 0.2811rem 0.4459rem;
  display: flex;
  gap: 0.3209rem;
}

.member-avatar {
  width: 1.0375rem;
  height: 1.0424rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.member-main {
  flex: 1;
  min-width: 0;
}

.member-top {
  display: block;
}

.member-name {
  margin: 0;
  font-size: 0.3052rem;
  line-height: 1;
  font-weight: 600;
}

.member-id-row {
  margin-top: 0.205rem;
  display: inline-flex;
  align-items: center;
  gap: 0.0655rem;
}

.member-id-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0.4637rem;
  height: 0.2676rem;
  padding: 0 0.0535rem;
  border-radius: 0.1123rem;
  background: rgba(255, 255, 255, 0.4);
  color: #fff;
  font-size: 0.216rem;
  line-height: 1;
}

.member-id {
  font-size: 0.2566rem;
  color: rgba(255, 255, 255, 0.94);
  line-height: 1;
}

.member-assets {
  margin-top: 0.164rem;
  border-radius: 1.44rem;
  background:
    linear-gradient(
      112deg,
      rgba(160, 40, 76, 0.58) 1%,
      rgba(86, 87, 128, 0.28) 42%,
      rgba(10, 96, 139, 0.62) 100%
    ),
    rgba(34, 34, 34, 0.66);
  backdrop-filter: blur(0.8rem);
  padding: 0.1182rem 0.5828rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.1333rem;
  min-height: 0.8353rem;
}

.asset-item {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.08rem;
  min-width: 0;
  color: #f3f6ff;
  font-size: 0.2566rem;
}

.asset-item img {
  width: 0.2933rem;
  height: 0.2933rem;
  object-fit: contain;
  flex-shrink: 0;
}

.asset-label {
  display: inline-flex;
  align-items: center;
  gap: 0.0533rem;
  opacity: 0.72;
  font-size: 0.2566rem;
  line-height: 1;
}

.asset-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #fff;
  font-size: 0.2566rem;
  line-height: 1;
  font-weight: 500;
}

.empty-box {
  border-radius: 0.7229rem;
  background: rgba(0, 0, 0, 0.26);
  padding: 0.5333rem 0.32rem;
  text-align: center;
  font-size: 0.3467rem;
  color: rgba(255, 255, 255, 0.72);
}

@media (max-width: 360px) {
  .content {
    padding-left: 0.32rem;
    padding-right: 0.32rem;
  }

  .member-assets {
    grid-template-columns: 1fr;
    border-radius: 0.4267rem;
  }
}
</style>
