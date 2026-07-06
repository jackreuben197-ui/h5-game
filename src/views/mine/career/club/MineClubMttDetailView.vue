<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRoute } from 'vue-router'
import { postStatsMttRoomDetailApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import iconTicket from '@/assets/icons/icon_ticket.png'
import iconChips from '@/assets/icons/icon_chips.png'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import { formatUC } from '@/utils/roomVisibility'
import { formatDateTime, formatDurationWithUnits, toUnixSeconds } from '@/utils/time'
import { userCache } from '@/utils/userCache'
import { USER_STORE_CAREER } from '@/utils/indexedDB'
import { useGameStore } from '@/stores/game'
import {
  multiLanguageTemplateVersion,
  resolveTemplateTextByKey,
} from '@/utils/multiLanguageTemplate'
import { getLocale, t } from '@/i18n'

const route = useRoute()
const gameStore = useGameStore()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => 'MTT')

interface RankPlayer {
  id: string
  name: string
  uid: string
  avatar: string
  ticketText: string
  hasTicket: boolean
  rewardText: string
  hunterRewardText: string
  hasHunterReward: boolean
}

const loading = ref(false)
const rawTitle = ref('')
const detailSub = ref('ID: --')
const detailTime = ref('--')

// 赛事名称走多语言模板映射（对齐客户端 GetRoomNameByKey），模板异步加载后随版本号重算。
const detailTitle = computed(() => {
  void multiLanguageTemplateVersion.value
  const raw = rawTitle.value
  if (!raw) {
    return '--'
  }
  return resolveTemplateTextByKey(raw, getLocale()) || t(raw) || raw
})

// 币种来自列表记录 gold_type（详情接口不返回币种），钻石(4)用钻石图标，其余用筹码图标。
const goldType = computed(() => {
  const value = Number(route.query.gold_type)
  return Number.isFinite(value) ? value : 0
})
const coinIcon = computed(() => (goldType.value === 4 ? iconDiamond : iconChips))

// 对齐客户端 UIRecordDetailStatistics.UpdateMttInfo：类型 / 参赛人数 / 买入 / 耗时。
const headMetrics = ref([
  { label: t('UIMatchFilter_DPY5kR'), value: '--' },
  { label: t('UIMine_RecordDetailForMatchPariticipants'), value: '--' },
  { label: t('MTT_xq_buy'), value: '--' },
  { label: t('UIMineDetail_UsedTime'), value: '--' },
])

const rankPlayers = ref<RankPlayer[]>([])

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function resolveMatchId(): number {
  const value = Number(route.query.id)
  return Number.isFinite(value) ? value : 0
}

// 奖金显示对齐客户端：钻石(4)按原值，其余币种按 1/100。
function formatAward(value: number): string {
  return goldType.value === 4 ? value.toLocaleString('en-US') : formatUC(value)
}

function resolveGameTypeName(gameType: number): string {
  const text = t(`GameType_${gameType}`)
  return text || '--'
}

// ── 缓存（IndexedDB career）──────────────────────────────────────────────────
// 与战绩详情同一套 `detail-` 形式，战绩用 `detail-${room_id}`，MTT 这里加 mtt 段
// （`detail-mtt-${match_id}`）避免 match_id 与 room_id 数值撞车时互相读错缓存结构。
// 已结算的赛事数据固定不变，命中缓存则不再请求。
// rawTitle 存模板原始字符，多语言名称由 detailTitle 每次渲染时重算，不落缓存。
interface MttDetailCache {
  rawTitle: string
  detailSub: string
  detailTime: string
  headMetrics: { label: string; value: string }[]
  rankPlayers: RankPlayer[]
}

function detailCacheKey(matchId: number): string {
  return `detail-mtt-${matchId}`
}

function detailCache() {
  return userCache(gameStore.loginUserId)
}

function plainClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function applyDetailCache(payload: MttDetailCache): void {
  rawTitle.value = payload.rawTitle
  detailSub.value = payload.detailSub
  detailTime.value = payload.detailTime
  headMetrics.value = payload.headMetrics
  rankPlayers.value = payload.rankPlayers
}

function writeDetailCache(matchId: number): void {
  const payload: MttDetailCache = {
    rawTitle: rawTitle.value,
    detailSub: detailSub.value,
    detailTime: detailTime.value,
    headMetrics: plainClone(headMetrics.value),
    rankPlayers: plainClone(rankPlayers.value),
  }
  void detailCache().put(USER_STORE_CAREER, detailCacheKey(matchId), payload)
}

async function fetchMttDetail(): Promise<void> {
  const matchId = resolveMatchId()
  if (matchId <= 0) {
    return
  }

  const cached = await detailCache().get<MttDetailCache>(
    USER_STORE_CAREER,
    detailCacheKey(matchId),
  )
  if (cached) {
    applyDetailCache(cached)
    return
  }

  loading.value = true
  try {
    const response = await postStatsMttRoomDetailApi(
      {
        limit: 50,
        offset: 0,
      },
      { id: matchId },
    )
    if (response.code !== 0) {
      throw new Error(
        typeof response.msg === 'string'
          ? response.msg
          : t('UIClub_Load') + ' MTT ' + t('UIClub_DetailFail'),
      )
    }

    const roomData = response.data?.room_data ?? response.data?.mtt_room_data
    const usersRaw = roomData?.user_list
    const users = Array.isArray(usersRaw) ? usersRaw : []

    rawTitle.value = String(roomData?.game_room_name ?? '')
    detailSub.value = `ID: ${String(roomData?.room_id ?? '--')}`

    const startSeconds = toUnixSeconds(roomData?.start_time)
    const endSeconds = toUnixSeconds(roomData?.end_time)
    detailTime.value = `${formatDateTime(roomData?.start_time, 'DD/MM HH:mm')} - ${formatDateTime(
      roomData?.end_time,
      'DD/MM HH:mm',
    )}`

    const durationSeconds = endSeconds > startSeconds ? endSeconds - startSeconds : 0
    const durationUnits = String(t('UIMatch_itemTime') ?? '').split('^')
    headMetrics.value = [
      {
        label: t('UIMatchFilter_DPY5kR'),
        value: resolveGameTypeName(toSafeNumber(roomData?.game_type)),
      },
      {
        label: t('UIMine_RecordDetailForMatchPariticipants'),
        value: toSafeNumber(roomData?.player_count).toLocaleString('en-US'),
      },
      {
        label: t('MTT_xq_buy'),
        value: toSafeNumber(roomData?.buy_in_count).toLocaleString('en-US'),
      },
      {
        label: t('UIMineDetail_UsedTime'),
        value: durationSeconds > 0 ? formatDurationWithUnits(durationSeconds, durationUnits) : '0',
      },
    ]

    rankPlayers.value = users.map((item, index) => {
      // 门票对齐客户端：goods_awrd 数量求和显示 xN。
      const goods = Array.isArray(item.goods_awrd) ? item.goods_awrd : []
      const ticketCount = goods.reduce((sum, goodsItem) => sum + toSafeNumber(goodsItem?.n), 0)
      const hunterAward = toSafeNumber(item.hunter_award)

      return {
        id: String(item.user_random_id ?? index + 1),
        name: String(item.nick_name ?? '--'),
        uid: String(item.user_random_id ?? '--'),
        avatar: typeof item.avatar === 'string' ? item.avatar : '',
        ticketText: `x${ticketCount}`,
        hasTicket: ticketCount > 0,
        rewardText: formatAward(toSafeNumber(item.award)),
        hunterRewardText: formatAward(hunterAward),
        hasHunterReward: hunterAward > 0,
      }
    })

    writeDetailCache(matchId)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t('UIClub_Load') + ' MTT ' + t('UIClub_DetailFail')
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchMttDetail()
})
</script>

<template>
  <div class="page-shell club-mtt-detail-page" :style="backgroundStyle">
    <HeaderBack :title="title" extra-padding />

    <div class="content-wrap">
      <section class="glass-card top-card">
        <div class="title-row">
          <div>
            <div class="title">{{ detailTitle }}</div>
            <div class="sub">{{ detailSub }}</div>
          </div>
          <div class="time">{{ detailTime }}</div>
        </div>
        <div class="metrics-row">
          <div
            v-for="(item, index) in headMetrics"
            :key="item.label"
            class="metric"
            :class="{ split: index > 0 }"
          >
            <div class="label">{{ item.label }}</div>
            <div class="value">{{ item.value }}</div>
          </div>
        </div>
      </section>

      <section class="list-wrap">
        <p v-if="loading" class="list-status">{{ t('SuperView2') }}...</p>
        <p v-else-if="!rankPlayers.length" class="list-status">
          {{ t('UIUCWalletAddress3') }} MTT {{ t('UICareerRecord') }}
        </p>
        <article v-for="item in rankPlayers" :key="item.id" class="glass-card rank-row">
          <div class="left">
            <img v-if="item.avatar" class="avatar" :src="item.avatar" alt="avatar" />
            <div v-else class="avatar avatar--empty"></div>
            <div>
              <div class="name">{{ item.name }}</div>
              <div class="sub">ID: {{ item.uid }}</div>
            </div>
          </div>
          <div class="right">
            <template v-if="item.hasTicket">
              <div class="right-item">
                <img :src="iconTicket" alt="ticket" />
                <span>{{ item.ticketText }}</span>
              </div>
              <span class="plus">+</span>
            </template>
            <div class="right-item">
              <img :src="coinIcon" alt="coin" />
              <span>{{ item.rewardText }}</span>
            </div>
            <template v-if="item.hasHunterReward">
              <span class="plus">+</span>
              <div class="right-item">
                <img :src="coinIcon" alt="hunter coin" />
                <span>{{ item.hunterRewardText }}</span>
              </div>
            </template>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-mtt-detail-page {
  position: relative;
  height: 100dvh;
  padding: 0 0 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  position: relative;
  height: calc(100% - 1.6rem);
  padding: 0 0.49rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.glass-card {
  border-radius: 0.7rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.top-card {
  margin-top: 0.34rem;
  padding: 0.26rem 0.24rem 0.22rem;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 0.18rem;
  padding: 0 0.16rem;

  .title {
    font-size: 0.454rem;
    line-height: 1.05;
    font-weight: 500;
    word-break: break-all;
  }

  .sub,
  .time {
    margin-top: 0.04rem;
    font-size: 0.387rem;
    line-height: 1.1;
    color: rgba(255, 255, 255, 0.76);
  }

  .time {
    flex-shrink: 0;
    text-align: right;
  }
}

.metrics-row {
  margin-top: 0.34rem;
  display: grid;
  border-radius: 0.76013rem;
  background: rgba(255, 255, 255, 0.2);
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  min-height: 1.32rem;
}

.metric {
  text-align: center;
  min-height: 1.12rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;

  &.split::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.16rem;
    width: 0.02rem;
    height: 0.8rem;
    background: rgba(255, 255, 255, 0.2);
  }

  .label {
    font-size: 0.28rem;
    line-height: 1;
    color: rgba(255, 255, 255, 0.72);
  }

  .value {
    margin-top: 0.11rem;
    font-size: 0.44rem;
    line-height: 1;
    font-weight: 700;
  }
}

.list-wrap {
  margin-top: 0.42rem;
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.list-status {
  text-align: center;
  font-size: 0.3rem;
  opacity: 0.78;
  padding: 0.2rem 0;
}

.rank-row {
  min-height: 2rem;
  padding: 0.36rem 0.44rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.2rem;
  border-radius: 4.22rem;
}

.left {
  display: flex;
  align-items: center;
  gap: 0.22rem;
  min-width: 0;

  .avatar {
    width: 1.27rem;
    height: 1.27rem;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .avatar--empty {
    background: rgba(255, 255, 255, 0.52);
  }

  .name {
    font-size: 0.3845rem;
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sub {
    margin-top: 0.09rem;
    font-size: 0.3332rem;
    line-height: 1;
  }
}

.right {
  display: flex;
  align-items: center;
  gap: 0.12rem;
  font-size: 0.34rem;
  font-weight: 500;
  flex-shrink: 0;

  .plus {
    font-size: 0.28rem;
    color: #05e7ae;
    transform: translateY(-0.02rem);
  }

  .right-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0.95rem;

    img {
      width: 0.58rem;
      height: 0.58rem;
      object-fit: contain;
    }

    span {
      margin-top: 0.06rem;
      font-size: 0.34rem;
      line-height: 1;
    }
  }
}
</style>
