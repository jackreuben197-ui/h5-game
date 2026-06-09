<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { postClubAgentDelApi, postOrgClubUserInfoApi, postOrgMemberListApi } from '@/api/org'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { getMemberRouteContext } from './clubMemberRoute'
import imgAvatar from '@/assets/images/default_avatar.png'
import { useUserInfoStore } from '@/stores/userInfo'
import mainBgUrl from '@/assets/images/main_bg.webp'

interface UserDisplay {
  name: string
  uid: string
  avatar: string
}

const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const route = useRoute()
const router = useRouter()
const userInfoStore = useUserInfoStore()

const context = computed(() => getMemberRouteContext(route))
const processing = ref(false)
const loading = ref(false)
const resolvedAgentId = ref(0)
const memberDisplay = ref<UserDisplay>({
  name: '成员',
  uid: '--',
  avatar: imgAvatar,
})
const agentDisplay = ref<UserDisplay>({
  name: '已绑定代理',
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

const memberName = computed(() => queryText('name') || context.value.name || '成员')
const memberUid = computed(() => queryText('uid') || context.value.uid || '--')
const agentName = computed(() => queryText('aname') || '已绑定代理')
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
            '成员',
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
              name: String(agent.remark_name || agent.nick_name || agentName.value || '已绑定代理'),
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

    if (!memberDisplay.value.name || memberDisplay.value.name === '成员') {
      memberDisplay.value = {
        name: memberName.value,
        uid: memberUid.value,
        avatar: imgAvatar,
      }
    }

    if (!agentDisplay.value.name || agentDisplay.value.name === '已绑定代理') {
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
    showFailToast('缺少解绑参数')
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
      throw new Error(typeof response.msg === 'string' ? response.msg : '解绑代理失败')
    }

    showSuccessToast('解绑代理成功')
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
    const message = error instanceof Error ? error.message : '解绑代理失败'
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
  <div class="page-shell sub-bg" :style="backgroundStyle">
    <div class="sub-page">
      <HeaderBack title="解绑代理" />

      <section class="cards">
        <article class="glass card">
          <img :src="memberDisplay.avatar" alt="player" />
          <div>
            <p>{{ memberDisplay.name }}</p>
            <span>ID {{ memberDisplay.uid }}</span>
          </div>
          <i class="badge"></i>
        </article>

        <div class="link">🔗</div>

        <article class="glass card">
          <img :src="agentDisplay.avatar" alt="agent" />
          <div>
            <p>{{ agentDisplay.name }}</p>
            <span>ID {{ agentDisplay.uid }}</span>
          </div>
          <i class="badge"></i>
        </article>
      </section>

      <p class="hint">确定要解除该玩家与代理的绑定关系吗？</p>
      <button type="button" class="confirm" :disabled="processing || loading" @click="onConfirm">
        解绑代理
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

.sub-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: figma-rem(7.282);
}

.cards {
  margin-top: figma-rem(2);
  display: flex;
  flex-direction: column;
  gap: figma-rem(3);
}

.glass {
  border-radius: figma-rem(30);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(figma-rem(6));
}

.card {
  min-height: figma-rem(77.882);
  padding: figma-rem(14.671) figma-rem(13.613);
  display: flex;
  align-items: center;
  gap: figma-rem(8.64);
}

.card img {
  width: figma-rem(55.882);
  height: figma-rem(56.218);
  border-radius: 50%;
}

.card p {
  margin: 0;
  color: #fff;
  font-size: figma-rem(14.415);
  font-weight: 600;
}

.card span {
  color: rgba(255, 255, 255, 0.75);
  font-size: figma-rem(9.623);
}

.badge {
  margin-left: auto;
  width: figma-rem(30);
  height: figma-rem(30);
  border-radius: 50%;
  background: linear-gradient(168deg, #ffd77a 8%, #e8a22f 72%);
}

.link {
  align-self: center;
  color: #fff;
  font-size: figma-rem(32.51);
}

.hint {
  margin: auto auto 0;
  color: rgba(249, 249, 249, 0.86);
  font-size: figma-rem(11.534);
}

.confirm {
  border: 1px solid rgba(242, 242, 242, 0.8);
  border-radius: figma-rem(40.576);
  min-height: figma-rem(55.184);
  color: #fff;
  font-size: figma-rem(18.985);
  background: linear-gradient(168deg, rgba(85, 243, 41, 1) 8%, rgba(62, 173, 6, 1) 72%);
}

.confirm:disabled {
  opacity: 0.72;
}
</style>
