<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { postClubAgentDelApi, postOrgClubUserInfoApi, postOrgMemberListApi } from '@/api/org'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import { getMemberRouteContext } from '@/views/club/members/clubMemberRoute'
import imgAvatar from '@/assets/images/default_avatar.png'
import imgAgentBind from '@/assets/icons/icon_agent_bind.png'
import { useUserInfoStore } from '@/stores/userInfo'
import { t } from '@/i18n'

interface UserDisplay {
  name: string
  uid: string
  avatar: string
}

const route = useRoute()
const router = useRouter()
const userInfoStore = useUserInfoStore()

const context = computed(() => getMemberRouteContext(route))
const processing = ref(false)
const loading = ref(false)
const resolvedAgentId = ref(0)
const memberDisplay = ref<UserDisplay>({
  name: t('UIClub_Info_Members'),
  uid: '--',
  avatar: imgAvatar,
})
const agentDisplay = ref<UserDisplay>({
  name: t('UIClub_DoneAgent'),
  uid: '--',
  avatar: imgAvatar,
})

const currentClubId = computed(() => Number(userInfoStore.currentClub?.club_id ?? 0))
const currentClubRandomId = computed(() => Number(userInfoStore.currentClub?.random_id ?? 0))

function queryText(key: string): string {
  const value = route.query[key]
  if (Array.isArray(value)) {
    return String(value[0] || '')
  }
  return value ? String(value) : ''
}

function toSafeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const memberName = computed(
  () => queryText('name') || context.value.name || t('UIClub_Info_Members'),
)
const memberUid = computed(() => queryText('uid') || context.value.uid || '--')
const agentName = computed(() => queryText('aname') || t('UIClub_DoneAgent'))
const agentUid = computed(() => queryText('auid') || '--')
const agentId = computed(() => toSafeNumber(queryText('aid')))

function getMemberId(): number {
  return toSafeNumber(context.value.memberId)
}

async function loadDisplayData(): Promise<void> {
  const memberId = getMemberId()
  if (!currentClubId.value || !memberId) {
    return
  }

  loading.value = true
  try {
    const queryMemberUid = toSafeNumber(context.value.uid)
    const profileResponse = await postOrgClubUserInfoApi({
      club_id: currentClubId.value,
      user_id: memberId,
      user_random_id: queryMemberUid || undefined,
    })

    if (profileResponse.code === 0 && profileResponse.data) {
      const profile = profileResponse.data as Record<string, unknown>
      const userInfo = profile.user_info as Record<string, unknown> | undefined
      memberDisplay.value = {
        name: String(
          userInfo?.nickname ||
            userInfo?.nick_name ||
            profileResponse.data.remark_name ||
            memberName.value ||
            t('UIClub_Info_Members'),
        ),
        uid: String(userInfo?.random_id || memberUid.value || '--'),
        avatar:
          typeof userInfo?.avatar === 'string' && userInfo.avatar.trim()
            ? userInfo.avatar
            : imgAvatar,
      }

      const realAgentId = toSafeNumber(profileResponse.data.agent_user_id) || agentId.value
      resolvedAgentId.value = realAgentId
      if (realAgentId && currentClubRandomId.value) {
        const agentResponse = await postOrgMemberListApi({
          club_id: currentClubId.value,
          club_random_id: currentClubRandomId.value,
          user_type: 4,
          sort_type: 8,
          order_type: 2,
          limit: 200,
          offset: 0,
          gold_type: 0,
          simple: true,
          hide_slave: true,
        })

        if (
          agentResponse.code === 0 &&
          agentResponse.data &&
          Array.isArray(agentResponse.data.data)
        ) {
          const agent = agentResponse.data.data.find(
            (item) => toSafeNumber((item as Record<string, unknown>).user_id) === realAgentId,
          ) as Record<string, unknown> | undefined

          if (agent) {
            agentDisplay.value = {
              name: String(
                agent.remark_name || agent.nick_name || agentName.value || t('UIClub_DoneAgent'),
              ),
              uid: String(agent.random_num || agentUid.value || '--'),
              avatar:
                typeof agent.avatar === 'string' && agent.avatar.trim() ? agent.avatar : imgAvatar,
            }
          }
        }
      }
    }
  } catch {
    // 失败时保留 query 回传值兜底
  } finally {
    if (!resolvedAgentId.value) {
      resolvedAgentId.value = agentId.value
    }

    if (!memberDisplay.value.name || memberDisplay.value.name === t('UIClub_Info_Members')) {
      memberDisplay.value = {
        name: memberName.value,
        uid: memberUid.value,
        avatar: imgAvatar,
      }
    }

    if (!agentDisplay.value.name || agentDisplay.value.name === t('UIClub_DoneAgent')) {
      agentDisplay.value = {
        name: agentName.value,
        uid: agentUid.value,
        avatar: imgAvatar,
      }
    }

    loading.value = false
  }
}

async function onConfirm(): Promise<void> {
  const memberId = getMemberId()
  if (!currentClubId.value || !memberId || !resolvedAgentId.value || processing.value) {
    showFailToast(t('UIClub_Text26'))
    return
  }

  processing.value = true
  try {
    const response = await postClubAgentDelApi({
      club_id: currentClubId.value,
      user_id: memberId,
      agent_id: resolvedAgentId.value,
    })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_AgentFail2'))
    }

    showSuccessToast(t('UIClub_AgentSuccess2'))
    await router.replace({
      path: `/club/member/${context.value.memberId}`,
      query: {
        identity: context.value.identity,
        bound: '0',
        name: memberName.value,
        uid: memberUid.value,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_AgentFail2')
    showFailToast(message)
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  void loadDisplayData()
})
</script>

<template>
  <div class="page-shell sub-bg unbind-agent-desktop-page">
    <div class="sub-page">
      <HeaderBack :title="t('UIGuild_MemberDetails_UnBindVip')" />

      <section class="cards">
        <article class="glass card">
          <img class="avatar" :src="memberDisplay.avatar" alt="player" />
          <div class="card-info">
            <p>{{ memberDisplay.name }}</p>
            <span class="uid-line"><em>ID</em>{{ memberDisplay.uid }}</span>
          </div>
          <img class="agent-bind-icon" :src="imgAgentBind" alt="" aria-hidden="true" />
        </article>

        <div class="link" aria-hidden="true">
          <AppSvgIcon class="link-icon" name="link" />
        </div>

        <article class="glass card">
          <img class="avatar" :src="agentDisplay.avatar" alt="agent" />
          <div class="card-info">
            <p>{{ agentDisplay.name }}</p>
            <span class="uid-line"><em>ID</em>{{ agentDisplay.uid }}</span>
          </div>
          <img class="agent-bind-icon" :src="imgAgentBind" alt="" aria-hidden="true" />
        </article>
      </section>

      <p class="hint">{{ t('UIClub_ConfirmPlayerAgentOf') }}？</p>
      <PrimaryButton
        class="confirm"
        :text="t('UIGuild_MemberDetails_UnBindVip')"
        :disabled="processing || loading"
        :loading="processing"
        @click="onConfirm"
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
  background-color: #101018;
  background-image: url('@/assets/images/main_bg.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    background-color: #f3f4f6;
    background-image: url('@/assets/images/main_bg_light.png');
  }
}

.sub-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: figma-rem(12);
}

.cards {
  margin: figma-rem(12) figma-rem(12) 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.glass {
  border-radius: figma-rem(30);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(figma-rem(6));
}

.card {
  min-height: figma-rem(77.882);
  padding: figma-rem(14.69) figma-rem(15.54);
  display: flex;
  align-items: center;
  gap: figma-rem(8.231);
}

.avatar {
  width: figma-rem(44.72);
  height: figma-rem(44.988);
  border-radius: 50%;
  object-fit: cover;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: figma-rem(1.922);
}

.card p {
  margin: 0;
  color: #fff;
  font-size: figma-rem(14.415);
  font-weight: 600;
}

.uid-line {
  display: inline-flex;
  align-items: center;
  gap: figma-rem(2.337);
  color: rgba(255, 255, 255, 0.75);
  font-size: figma-rem(9.152);
}

.uid-line em {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: figma-rem(2.67) figma-rem(4.673);
  border-radius: figma-rem(4.006);
  background: rgba(255, 255, 255, 0.34);
  color: #fff;
  font-size: figma-rem(7.701);
  font-style: normal;
  line-height: 1;
}

.agent-bind-icon {
  margin-left: auto;
  width: figma-rem(30);
  height: figma-rem(30);
  object-fit: contain;
}

.link {
  position: relative;
  z-index: 1;
  height: figma-rem(12);
  margin: figma-rem(-6) figma-rem(25) figma-rem(-6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: figma-rem(53);
}

.link .link-icon {
  position: absolute;
  left: 50%;
  top: 50%;
  width: figma-rem(31);
  height: figma-rem(31);
  color: #fff;
  transform: translate(-50%, -50%);
}

.hint {
  margin: auto auto 0;
  color: rgba(249, 249, 249, 0.86);
  font-size: figma-rem(11.534);
}

.confirm {
  margin: 0 figma-rem(8) figma-rem(18);
}

.sub-bg {
  @include theme-light {
    .glass {
      background: #fff;
      backdrop-filter: none;
    }

    .card p,
    .uid-line,
    .hint {
      color: #000;
    }

    .uid-line em {
      color: #fff;
      background: rgba(79, 79, 79, 0.4);
    }

    .link::before,
    .link::after {
      background: rgba(218, 225, 235, 0.48);
    }

    .link .link-icon {
      color: var(--c-brand);
    }
  }
}
</style>
