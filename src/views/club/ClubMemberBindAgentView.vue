<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { postClubAgentAddApi, postOrgMemberListApi } from '@/api/org'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { getMemberRouteContext } from './clubMemberRoute'
import imgAvatar from '@/assets/images/default_avatar.png'
import { useUserInfoStore } from '@/stores/userInfo'
import mainBgUrl from '@/assets/images/main_bg.webp'

interface AgentRow {
  userId: number
  uid: string
  name: string
  avatar: string
}

const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const router = useRouter()
const route = useRoute()
const userInfoStore = useUserInfoStore()

const context = computed(() => getMemberRouteContext(route))
const rows = ref<AgentRow[]>([])
const selectedAgentId = ref(0)
const loadingAgents = ref(false)
const submitting = ref(false)

const currentClubId = computed(() => Number(userInfoStore.currentClub?.club_id ?? 0))
const currentClubRandomId = computed(() => Number(userInfoStore.currentClub?.random_id ?? 0))

function toSafeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function getMemberId(): number {
  return toSafeNumber(context.value.memberId)
}

function mapAgentRow(item: Record<string, unknown>): AgentRow {
  const userId = toSafeNumber(item.user_id)
  const randomNum = item.random_num
  const uid = randomNum !== undefined && randomNum !== null ? String(randomNum) : '--'
  const name = String(item.remark_name || item.nick_name || `代理${userId || '--'}`)
  const avatar = typeof item.avatar === 'string' && item.avatar.trim() ? item.avatar : imgAvatar

  return {
    userId,
    uid,
    name,
    avatar,
  }
}

async function fetchAgents(): Promise<void> {
  if (!currentClubRandomId.value) {
    rows.value = []
    return
  }

  loadingAgents.value = true
  try {
    const response = await postOrgMemberListApi({
      club_id: currentClubId.value,
      club_random_id: currentClubRandomId.value,
      user_type: 4,
      sort_type: 8,
      order_type: 2,
      limit: 200,
      offset: 0,
      gold_type: 0,
    })

    if (response.code !== 0 || !response.data) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '获取代理列表失败')
    }

    const rawRows = Array.isArray(response.data.data)
      ? (response.data.data as Record<string, unknown>[])
      : []
    rows.value = rawRows.map(mapAgentRow).filter((item) => item.userId > 0)

    if (rows.value.length) {
      selectedAgentId.value = rows.value[0].userId
    }
  } catch (error) {
    rows.value = []
    const message = error instanceof Error ? error.message : '获取代理列表失败'
    showFailToast(message)
  } finally {
    loadingAgents.value = false
  }
}

async function onConfirm(): Promise<void> {
  const memberId = getMemberId()
  if (!currentClubId.value || !memberId || !selectedAgentId.value || submitting.value) {
    return
  }

  submitting.value = true
  try {
    const response = await postClubAgentAddApi({
      club_id: currentClubId.value,
      user_id: memberId,
      agent_id: selectedAgentId.value,
    })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '绑定代理失败')
    }

    const selected = rows.value.find((item) => item.userId === selectedAgentId.value)
    showSuccessToast('绑定代理成功')
    await router.replace({
      path: `/club/member/${context.value.memberId}`,
      query: {
        identity: context.value.identity,
        bound: '1',
        name: context.value.name,
        uid: context.value.uid,
        aid: String(selected?.userId || ''),
        aname: selected?.name || '',
        auid: selected?.uid || '',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '绑定代理失败'
    showFailToast(message)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  void fetchAgents()
})
</script>

<template>
  <div class="page-shell sub-bg" :style="backgroundStyle">
    <HeaderBack title="绑定代理" />
    <div class="sub-page">
      <section class="cards">
        <article
          v-for="row in rows"
          :key="row.userId"
          class="glass card"
          @click="selectedAgentId = row.userId"
        >
          <img :src="row.avatar" :alt="row.name" />
          <div class="meta">
            <p>{{ row.name }}</p>
            <small>ID {{ row.uid }}</small>
          </div>
          <button class="dot" :class="{ on: selectedAgentId === row.userId }"></button>
        </article>
        <p v-if="loadingAgents" class="status">加载中...</p>
        <p v-else-if="!rows.length" class="status">暂无可绑定代理</p>
      </section>

      <button
        type="button"
        class="confirm"
        :disabled="submitting || !rows.length"
        @click="onConfirm"
      >
        绑定代理
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
  display: flex;
  flex-direction: column;
  gap: figma-rem(7.282);
}

.glass {
  border-radius: figma-rem(170.596);
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

.meta {
  flex: 1;
}

.meta p {
  margin: 0;
  color: #f3f3f3;
  font-size: figma-rem(17.742);
  font-weight: 600;
}

.meta small {
  color: rgba(255, 255, 255, 0.75);
  font-size: figma-rem(9.623);
}

.dot {
  width: figma-rem(17);
  height: figma-rem(17);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.66);
  background: rgba(255, 255, 255, 0.1);
}

.dot.on {
  background: #2ce3d3;
}

.status {
  margin: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.82);
  font-size: figma-rem(11.5);
}

.confirm {
  margin-top: auto;
  border: 1px solid rgba(242, 242, 242, 0.8);
  border-radius: figma-rem(40.576);
  min-height: figma-rem(55.184);
  color: #fff;
  font-size: figma-rem(18.985);
  background: linear-gradient(168deg, #05e7ae 8%, #027a5c 72%);
}

.confirm:disabled {
  opacity: 0.72;
}
</style>
