<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { postStatsUserGameRecordListApi } from '@/api/stats'
import { postMiscGameRecordRoundApi } from '@/api/misc'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import PokerCard from '@/components/GameCard/PokerCard.vue'
import {
  decodeCard,
  getTexasWinDesc,
  parseHandRecordCards,
  parseReplayLike,
  type CardItem,
  type StatsReplayData,
} from '@/api/models/replayDisplay'
import type {
  StatsUserGameRecordListRecord,
  StatsUserGameRecordListRoom_record,
} from '@/api/models/stats'
import { setHandReplaySession } from '@/session/handReplaySession'
import { t } from '@/i18n'
import { formatUC } from '@/utils/roomVisibility'
import { useUserInfoStore } from '@/stores/userInfo'

const title = computed(() => t('UIMine_Paipu_title'))

const router = useRouter()
const route = useRoute()
const userInfoStore = useUserInfoStore()

// 当前登录用户的随机 id，传给 getTexasWinDesc 用于优先选取“自己作为赢家”的描述（对齐客户端 GameCache._userId）。
const currentUserRandomId = computed(() => {
  const value = userInfoStore.userInfo?.user?.un_id
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
})

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

interface HandRow {
  id: string
  title: string
  handId: string
  pot: string
  profit: string
  hands: string
  cards: CardItem[]
  // 保留原始记录，点击卡片后浮窗的“牌谱详情/收藏”操作需要完整字段。
  raw: StatsUserGameRecordListRecord
}

const CARD_PLACEHOLDER: CardItem = { rank: '--', suit: 's' }

// 对齐 MineHandCollectionView.buildDisplayCards：取 record.data 前两张作为玩家底牌。
function buildHandCards(value: unknown): CardItem[] {
  const parsed = parseHandRecordCards(value)
    .slice(0, 2)
    .map((item) => decodeCard(item))
  if (!parsed.length) return [CARD_PLACEHOLDER, CARD_PLACEHOLDER]
  if (parsed.length === 1) return [parsed[0], CARD_PLACEHOLDER]
  return parsed
}

const loading = ref(false)
const handRows = ref<HandRow[]>([])
const overviewTitle = ref('牌局名称')
const overviewId = ref('ID: --')
const overviewHands = ref(t('UIMine_Paipu_handNum2', 0))
const overviewBlind = ref('--')

// 浮窗：点击牌谱卡片后弹出 [牌谱详情/收藏/举报] 三选项。
const actionRow = ref<HandRow | null>(null)
// 浮窗以被点击卡片中心为锚点（对齐客户端 _content.transform.position = go.transform.position + ...）。
// 视口坐标 px：直接作为浮窗的 top/left，使浮窗左上角对齐卡片中心。
const actionAnchor = ref<{ top: number; left: number } | null>(null)
const collectPending = ref(false)
// 当前房间的 room_record，用于 setHandReplaySession 给详情页使用。
const currentRoomRecord = ref<StatsUserGameRecordListRoom_record>({})

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

// 对齐客户端 LanguageUtility.GetFormatLongNumberOmitDecimal：已除以 100，无逗号，可选符号。
function formatAmount(value: unknown, withSign = false): string {
  const amount = toSafeNumber(value)
  if (amount === 0) return '0'
  const text = formatUC(amount)
  if (!withSign) return text
  return amount > 0 ? `+${text}` : text
}

function resolveRoomId(): number {
  const raw = route.query.room_id
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

// 解析 random_ante 字符串 "[100,500]" → "1~5"（除 100 显示）。
function parseAnteRange(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  const text = raw.trim()
  if (text.length <= 2) return ''
  const inner = text.replace(/^\[/, '').replace(/\]$/, '')
  const parts = inner.split(',').map((s) => Number(s.trim()))
  if (parts.length !== 2 || !parts.every(Number.isFinite)) return ''
  return `${formatUC(parts[0])}~${formatUC(parts[1])}`
}

// 对齐客户端 UIReplayComponent.RefreshViewHead：根据 game_type/poker_type 决定盲注展示格式。
// 6+ 或 BombPot：只显示 BB；NLH/PLO：sb/bb；随机底注追加 (min~max)。
function formatBlindLevel(
  room: Record<string, unknown>,
  firstReplay: StatsReplayData | null,
): string {
  const smallBlind = toSafeNumber(room.small_blind)
  if (smallBlind <= 0) return '--'
  const gameType = toSafeNumber(room.game_type)
  const pokerType = toSafeNumber(room.poker_type)
  const isHoldem = gameType === 0
  const isOmaha = gameType === 1 || gameType === 2 || gameType === 3
  const isSixPlus = (isHoldem || isOmaha) && pokerType === 2
  const isBombPot = !!(
    firstReplay?.procedure?.flop?.scard?.length || firstReplay?.procedure?.river?.scard?.length
  )

  const anteStr = parseAnteRange(room.random_ante)
  const bb = smallBlind * 2
  const blindText =
    isSixPlus || isBombPot ? formatUC(bb) : `${formatUC(smallBlind)}/${formatUC(bb)}`
  return anteStr ? `${blindText}(${anteStr})` : blindText
}

// 文本节点 HTML 转义，避免 v-html 拼接时玩家昵称里的 < / > 被当作标签注入。
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// 对齐客户端 UIReplayComponent.SetUpItemWithData：text_desc 由 CheckTextDesc → GetTexasWinDesc(replay) 生成。
// replay 字段在接口里可能是 JSON 字符串或对象，统一通过 parseReplayLike 归一化。
// 客户端用 <color=#F8C255FF>…</color> 高亮牌型，这里把它换成 <b>…</b> 并对其余文本做 HTML 转义，保证牌型加粗 + 防注入。
function resolveHandTitle(row: Record<string, unknown>): string {
  const replay = parseReplayLike<StatsReplayData>(row.replay)
  if (!replay) return ''
  const raw = getTexasWinDesc(replay, currentUserRandomId.value)
  if (!raw) return ''

  // 按 <color>…</color> 切片：标签内的牌型用 <b> 包裹，其余文本统一 HTML 转义，
  // 保证 v-html 渲染时只有受控的 <b> 标签会被解析。
  const pattern = /<color=#[A-Fa-f0-9]{6,8}>([\s\S]*?)<\/color>/g
  let out = ''
  let cursor = 0
  for (let m = pattern.exec(raw); m !== null; m = pattern.exec(raw)) {
    out += escapeHtml(raw.slice(cursor, m.index))
    out += `<b>${escapeHtml(m[1])}</b>`
    cursor = pattern.lastIndex
  }
  out += escapeHtml(raw.slice(cursor))
  return out
}

function mapHandRows(rows: Record<string, unknown>[]): HandRow[] {
  return rows.map((row, index) => {
    // 对齐客户端 UIReplayComponent.SetUpItemWithData：text_ID 使用 match_id 非 0 时取 match_id，否则取 room_id。
    const matchId = toSafeNumber(row.match_id)
    const roomId = toSafeNumber(row.room_id)
    const handIdNum = matchId !== 0 ? matchId : roomId
    return {
      id: String(row.id ?? row.room_unique_id ?? index + 1),
      title: resolveHandTitle(row),
      handId: handIdNum > 0 ? String(handIdNum) : '--',
      pot: formatAmount(row.bet_pot),
      profit: formatAmount(row.change, true),
      hands: String(toSafeNumber(row.hand_num)),
      cards: buildHandCards(row.data),
      raw: row as unknown as StatsUserGameRecordListRecord,
    }
  })
}

async function fetchHandRows(): Promise<void> {
  const roomId = resolveRoomId()
  if (roomId <= 0) {
    handRows.value = []
    return
  }

  loading.value = true
  try {
    const response = await postStatsUserGameRecordListApi({
      room_type: 2,
      room_id: roomId,
      limit: 50,
      offset: 0,
    } as unknown as Record<string, unknown>)

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载手牌详情失败')
    }

    const records = Array.isArray(response.data?.records) ? response.data.records : []
    // 接口会返回多个 room（按 room_id 分组），需要精确匹配当前路由的 room_id，而不是盲用 records[0]。
    const targetRecord =
      records.find((item) => toSafeNumber(item?.room_record?.room_id) === roomId) ?? null
    const room = (targetRecord?.room_record as Record<string, unknown>) ?? {}
    const userRowsRaw = Array.isArray(targetRecord?.user_game_records)
      ? targetRecord?.user_game_records
      : []
    const userRows = userRowsRaw.filter(
      (item): item is Record<string, unknown> => !!item && typeof item === 'object',
    )

    currentRoomRecord.value = (room as StatsUserGameRecordListRoom_record) ?? {}
    overviewTitle.value = String(room.name ?? '牌局名称')
    overviewId.value = `ID: ${String(room.room_id ?? roomId)}`
    // 对齐客户端 UIReplayComponent.LoadHistoryHandData：总手数取 item.total（该房间总手数）。
    const totalHands = toSafeNumber(targetRecord?.total)
    overviewHands.value = t('UIMine_Paipu_handNum2', totalHands || userRows.length)
    // 客户端用首手 replay 判断 isBombPot，所以这里也取第一条。
    const firstReplay = parseReplayLike<StatsReplayData>(userRows[0]?.replay)
    overviewBlind.value = formatBlindLevel(room, firstReplay)
    handRows.value = mapHandRows(userRows)
  } catch (error) {
    handRows.value = []
    const message = error instanceof Error ? error.message : '加载手牌详情失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

// 点击牌谱卡片：弹出客户端 SetContentTrue 同款的三选项浮窗，锚点取被点击卡片中心。
function openHandActions(row: HandRow, event: MouseEvent): void {
  const target = event.currentTarget as HTMLElement | null
  if (target) {
    const rect = target.getBoundingClientRect()
    actionAnchor.value = {
      top: rect.top + rect.height / 2,
      left: rect.width / 2,
    }
  } else {
    actionAnchor.value = null
  }
  actionRow.value = row
}

function closeHandActions(): void {
  actionRow.value = null
  actionAnchor.value = null
}

// 浮窗定位样式：以卡片中心为锚点，translate(-50%, -50%) 使浮窗自己居中到该锚点。
const actionPopupStyle = computed(() => {
  const anchor = actionAnchor.value
  if (!anchor) return undefined
  return {
    top: `${anchor.top}px`,
    left: `${anchor.left}px`,
  }
})

// 牌谱详情：对齐客户端 _look.onClick → UI_REPLAY_DETAIL_TEXAS。
// 复用 MineHandCollectionView 同款的 setHandReplaySession + /mine/hand-collection/detail。
function goReplayDetail(row: HandRow): void {
  const handId = String(row.raw.id ?? row.id)
  setHandReplaySession({
    handId,
    roomRecord: currentRoomRecord.value,
    handRecord: row.raw,
  })
  closeHandActions()
  void router.push({
    path: '/mine/hand-collection/detail',
    query: { hand_id: handId },
  })
}

// 收藏：对齐客户端 ReplayMsgController.RequestCollectReplay 调用 /api/misc/game/record_round。
// 注意 change 字段在协议里是单条牌谱的金币变动（带符号原始值，不除 100）。
// 浮窗在发起请求时立即关闭，请求继续在后台完成（成功/失败用 Toast 反馈）。
async function collectReplay(row: HandRow): Promise<void> {
  if (collectPending.value) return
  collectPending.value = true
  const raw = row.raw
  closeHandActions()
  try {
    const response = await postMiscGameRecordRoundApi({
      id: toSafeNumber(raw.id),
      room_id: toSafeNumber(raw.room_id),
      match_id: toSafeNumber(raw.match_id),
      room_unique_id: String(raw.room_unique_id ?? ''),
      name: String(raw.name ?? ''),
      hand_num: toSafeNumber(raw.hand_num),
      change: toSafeNumber(raw.change),
      type: toSafeNumber(raw.type),
      open: toSafeNumber(raw.open),
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '收藏失败')
    }
    showSuccessToast(t('Collection_success'))
  } catch (error) {
    const message = error instanceof Error ? error.message : '收藏失败'
    showFailToast(message)
  } finally {
    collectPending.value = false
  }
}

// 举报：保留旧逻辑，跳转举报页。
function goReport(): void {
  closeHandActions()
  void router.push('/mine/club-record/report')
}

onMounted(() => {
  void fetchHandRows()
})
</script>

<template>
  <div class="page-shell record-hand-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="glass-card overview-card">
        <div class="left-blind">
          <div class="label">盲注/Ante</div>
          <div class="value">{{ overviewBlind }}</div>
          <div class="hands">{{ overviewHands }}</div>
        </div>
        <div class="right-info">
          <div class="title">{{ overviewTitle }}</div>
          <div class="sub">{{ overviewId }}</div>
        </div>
      </section>

      <section class="list-wrap">
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!handRows.length" class="list-status">暂无手牌记录</p>
        <article
          v-for="item in handRows"
          :key="item.id"
          class="glass-card hand-card"
          @click="openHandActions(item, $event)"
        >
          <div class="top-row">
            <div class="poker-pair">
              <PokerCard
                v-for="(card, cardIdx) in item.cards"
                :key="cardIdx"
                :rank="card.rank"
                :suit="card.suit"
                size="0.7rem"
              />
            </div>
            <!-- resolveHandTitle 已对所有动态文本做 HTML 转义，仅保留 <b> 牌型标签；可安全用 v-html。 -->
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="title" v-html="item.title"></div>
          </div>
          <div class="line"></div>
          <div class="bottom-row">
            <div class="meta">
              <div>{{ t('UIMine_WalletMyPaiId') }}: {{ item.handId }}</div>
              <div>{{ t('adaptation20005') }}: {{ item.pot }}</div>
            </div>
            <div
              class="profit"
              :class="{ positive: item.profit.startsWith('+'), zero: item.profit == '0' }"
            >
              <div class="money">{{ item.profit }}</div>
              <div class="hands-count">{{ t('UIMine_Paipu_handNum2', item.hands) }}</div>
            </div>
          </div>
        </article>
      </section>
    </div>

    <!-- 牌谱卡片点击后弹出：三选项浮窗，锚点取被点击卡片中心（对齐客户端 SetContentTrue）。 -->
    <div v-if="actionRow" class="action-mask" @click="closeHandActions">
      <div class="action-sheet" :style="actionPopupStyle" @click.stop>
        <button type="button" class="action-item" @click="goReplayDetail(actionRow)">
          牌谱详情
        </button>
        <button
          type="button"
          class="action-item"
          :disabled="collectPending"
          @click="collectReplay(actionRow)"
        >
          收藏
        </button>
        <button type="button" class="action-item" @click="goReport">举报</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.record-hand-page {
  height: 100dvh;
  // padding-top: calc(env(safe-area-inset-top) + 0.46rem);
  padding-bottom: 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  padding: 0 0.45rem;
}

.glass-card {
  border-radius: 0.42rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.overview-card {
  margin-top: 0.35rem;
  padding: 0.24rem 0.32rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.2rem;
}

.left-blind {
  display: flex;
  flex-direction: column;
  gap: 0.04rem;

  .label {
    font-size: 0.27rem;
    color: rgba(255, 255, 255, 0.74);
  }

  .value {
    font-size: 0.4rem;
    font-weight: 600;
  }

  .hands {
    margin-top: 0.05rem;
    font-size: 0.27rem;
    color: rgba(255, 255, 255, 0.74);
  }
}

.right-info {
  text-align: right;

  .title {
    font-size: 0.42rem;
  }

  .sub {
    margin-top: 0.08rem;
    font-size: 0.28rem;
    color: rgba(255, 255, 255, 0.78);
  }
}

.list-wrap {
  margin-top: 0.34rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.list-status {
  text-align: center;
  font-size: 0.3rem;
  opacity: 0.78;
  margin: 0.2rem 0;
}

.hand-card {
  padding: 0.28rem 0.3rem;
}

.top-row,
.bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.poker-pair {
  display: flex;
  gap: 0.08rem;
}

.title {
  flex: 1;
  text-align: right;
  font-size: 0.34rem;

  // resolveHandTitle 把客户端的 <color> 标签转成 <b>，这里给牌型加粗高亮。
  :deep(b) {
    font-weight: 900;
    text-shadow: 0.015em 0 currentColor, -0.015em 0 currentColor, 0 0.015em currentColor,
      0 -0.015em currentColor;
    // color: #f8c255;
  }
}

.line {
  height: 0.02rem;
  margin: 0.16rem 0;
  background: rgba(255, 255, 255, 0.15);
}

.meta {
  font-size: 0.3rem;
  line-height: 1.5;
}

.profit {
  text-align: right;

  .money {
    font-size: 0.52rem;
    color: #65e89f;

    font-weight: 700;
  }

  .hands-count {
    margin-top: 0.04rem;
    font-size: 0.29rem;
  }

  &.positive {
    .money {
      color: #ff8498;
    }
  }
  &.zero {
    .money {
      color: #999;
    }
  }
}

// 三选项浮窗：透明遮罩负责拦截外部点击；action-sheet 用 fixed + translate(-50%, -50%) 居中到被点击卡片。
.action-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
}

.action-sheet {
  position: fixed;
  transform: translate(0, -100%);
  display: flex;
  width: 3.5rem;
  padding: 0.1rem 0rem;
  flex-direction: column;
  align-items: stretch;
  border-radius: 0.42928rem;
  background: rgba(0, 0, 0, 0.37);
  backdrop-filter: blur(5px);
}

.action-item {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: center;
  color: #fff;
  font-feature-settings: 'liga' off, 'clig' off;
  font-family: 'SF Pro';
  font-size: 0.30304rem;
  font-style: normal;
  font-weight: 700;
  line-height: 132%;
  padding: 0.18rem 0;

  & + & {
    border-top: 0.947px solid rgba(170, 166, 158, 0.25);
  }

  &:disabled {
    opacity: 0.6;
  }
}
</style>
