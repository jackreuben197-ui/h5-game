<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import TopActionButton from '@/components/Button/TopActionButton.vue'
import GameTable from '@/components/Table/GameTable.vue'
import GameTableColumn from '@/components/Table/GameTableColumn.vue'
import { getUserRoomSettleDetailApi } from '@/api/user'
import {
  type UserRoomSettleDetailData,
  type UserRoomSettleSelf,
  type UserRoomSettleUserInfo,
} from '@/api/models/user'
import { t } from '@/i18n'
import { formatDateTime } from '@/utils/time'
import { formatUC } from '@/utils/roomVisibility'
import iconInsurance from '@/assets/icons/icon_insurance.svg'

const route = useRoute()
const router = useRouter()

const GAME_PLAY_SUB_TYPE = {
  NONE: 0,
  MUSH: 1,
  SQUID: 2,
} as const

interface PlayerRow extends UserRoomSettleUserInfo {
  _score: number
  _squidNet: number
}

const loading = ref(false)
const settleData = ref<UserRoomSettleDetailData | null>(null)

function readQueryString(value: unknown): string {
  if (Array.isArray(value)) {
    return String(value[0] ?? '').trim()
  }
  return String(value ?? '').trim()
}

function readQueryNumber(value: unknown): number {
  const numeric = Number(readQueryString(value))
  return Number.isFinite(numeric) ? numeric : 0
}

function formatChip(value: unknown): string {
  return formatUC(Number(value ?? 0))
}

function formatSignedChip(value: unknown): string {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric) || numeric === 0) {
    return '0'
  }
  const text = formatUC(Math.abs(numeric))
  return numeric > 0 ? `+${text}` : `-${text}`
}

function amountClass(value: unknown): string {
  const numeric = Number(value ?? 0)
  if (numeric > 0) return 'score--pos'
  if (numeric < 0) return 'score--neg'
  return 'score--zero'
}

const roomIdQuery = computed(() => readQueryString(route.query.roomId))
const roomId = computed(() => roomIdQuery.value || readQueryString(route.params.roomId))
const roomNameQuery = computed(() => readQueryString(route.query.roomName))
const gameTypeQuery = computed(() => readQueryString(route.query.gameType))
const pokerTypeQuery = computed(() => readQueryString(route.query.pokerType))
const betTypeQuery = computed(() => readQueryString(route.query.betType))

const gameType = computed(() => readQueryNumber(gameTypeQuery.value))
const pokerType = computed(() => readQueryNumber(pokerTypeQuery.value))
const betType = computed(() => readQueryNumber(betTypeQuery.value))
const gamePlaySubType = computed(() => readQueryNumber(route.query.gamePlaySubType))

const selfInfo = computed<UserRoomSettleSelf | null>(() => settleData.value?.self_settle ?? null)

const roomTypeText = computed(() => {
  if (gameTypeQuery.value || pokerTypeQuery.value || betTypeQuery.value) {
    return [
      t(`GameType_${gameType.value}`),
      t(`PokerType_${pokerType.value}`),
      t(`BetType_${betType.value}`),
    ]
      .filter((item) => Boolean(item))
      .join('-')
  }

  if (typeof settleData.value?.game_type === 'string' && settleData.value.game_type.trim()) {
    return settleData.value.game_type.trim()
  }

  return '--'
})
const handleBack = () => {
  void router.push('/gameList')
}

const displayTime = computed(() => {
  const endTime = settleData.value?.end_time
  const formatted = endTime ? formatDateTime(endTime, 'DD/MM/YYYY HH:mm') : ''
  if (formatted && formatted !== '--:--') {
    return formatted
  }
  return formatDateTime(Date.now(), 'DD/MM/YYYY HH:mm')
})

const roomInfo = computed(() => ({
  room_name: String(settleData.value?.room_name ?? roomNameQuery.value ?? '').trim(),
  room_id: String(settleData.value?.room_id ?? roomId.value ?? '').trim(),
  end_time: displayTime.value,
  game_type: roomTypeText.value,
}))

const myProfit = computed<number>(() => {
  const self = selfInfo.value
  if (!self) return 0
  return Number(self.bring_out ?? 0) - Number(self.bring_in ?? 0)
})

const myHands = computed<number>(() => Number(selfInfo.value?.user_hand_num ?? 0))

const insuranceOn = computed(() => Number(settleData.value?.insurance_on ?? 0) === 1)
const insuranceText = computed(() => formatSignedChip(settleData.value?.insurance ?? 0))
const insuranceClass = computed(() => amountClass(settleData.value?.insurance ?? 0))

const isMushTable = computed(() => gamePlaySubType.value === GAME_PLAY_SUB_TYPE.MUSH)
const isSquidTable = computed(() => gamePlaySubType.value === GAME_PLAY_SUB_TYPE.SQUID)

const tableData = computed<PlayerRow[]>(() => {
  const list = Array.isArray(settleData.value?.list) ? settleData.value?.list : []
  return list.map((row) => {
    const score = Number(row.bring_out ?? 0) - Number(row.bring_in ?? 0)
    const squidNet =
      Number(row.squid_in ?? 0) - Number(row.squid_out ?? 0) - Number(row.punish_fee ?? 0)
    return {
      ...row,
      _score: score,
      _squidNet: squidNet,
    }
  })
})

function formatBuyIn(_val: unknown, row: Record<string, unknown>): string {
  return formatChip(row.bring_in)
}

async function fetchSettle(): Promise<void> {
  loading.value = true
  try {
    if (!roomId.value) {
      settleData.value = null
      return
    }

    const response = await getUserRoomSettleDetailApi(roomId.value)
    if (response.code === 0 && response.data) {
      settleData.value = response.data
      console.log('[TableGameEnd] settle detail:', response.data)
      return
    }

    settleData.value = null
  } catch (error) {
    console.warn('[TableGameEnd] fetch settle failed:', error)
    settleData.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  console.log('[TableGameEnd] bridge route payload:', {
    fullPath: route.fullPath,
    params: route.params,
    query: route.query,
    roomId: roomId.value,
    gamePlaySubType: gamePlaySubType.value,
  })
  void fetchSettle()
})
</script>

<template>
  <div class="main-bg table-game-end">
    <HeaderBack title="牌局统计" :extra-padding="true" @back="handleBack">
      <template #right>
        <TopActionButton :name="t('OpCodeString_ROOMINSURFEE')" large />
      </template>
    </HeaderBack>

    <main class="settle-page settle-content">
      <div v-if="loading" class="settle-loading">
        <van-loading size="0.5rem" color="var(--c-text-muted)" />
        <span>加载结算数据...</span>
      </div>

      <template v-else>
        <section class="summary-card">
          <div class="summary-top">
            <div class="summary-side">
              <p class="room-name">{{ roomInfo.room_name }}</p>
              <p class="room-id">
                <span>{{ roomInfo.room_id }}</span>
                <span class="room-id__tag">ID</span>
              </p>
            </div>
            <div class="summary-side summary-side--right">
              <p class="room-meta">{{ roomInfo.end_time }}</p>
              <p class="room-meta">{{ roomInfo.game_type }}</p>
            </div>
          </div>

          <div class="summary-divider"></div>

          <p class="summary-title">{{ t('MySelfRecord') || '个人战绩' }}</p>

          <div class="summary-stats">
            <div class="summary-stat">
              <p class="summary-stat__value amount--positive">{{ myHands }}</p>
              <p class="summary-stat__label">{{ t('UITexasGameEnding_allhand') || '总手数' }}</p>
            </div>
            <div class="summary-stat">
              <p class="summary-stat__value" :class="amountClass(myProfit)">
                {{ formatSignedChip(myProfit) }}
              </p>
              <p class="summary-stat__label">{{ t('UICareerRecord') || '战绩' }}</p>
            </div>
          </div>
        </section>

        <section class="players-card">
          <GameTable :data="tableData" height="auto" :show-header="true">
            <template v-if="insuranceOn" #summary>
              <div class="insurance-summary">
                <img :src="iconInsurance" alt="insurance" class="icon-insurance" />
                <span :class="insuranceClass">{{ insuranceText }}</span>
              </div>
            </template>

            <GameTableColumn prop="nick_name" label="玩家" :flex="3" align="left">
              <template #default="{ row }">
                <img :src="row.avatar" class="user-avatar" alt="" />
                <span>{{ row.nick_name }}</span>
              </template>
            </GameTableColumn>

            <GameTableColumn
              prop="bring_in"
              label="买入"
              :flex="1.8"
              align="center"
              :formatter="formatBuyIn"
            />

            <GameTableColumn prop="user_hand_num" label="手数" :flex="1" align="center" />

            <GameTableColumn
              v-if="isMushTable"
              prop="mushroom_count"
              label="蘑菇"
              :flex="1.35"
              align="center"
            >
              <template #default="{ row }">
                <div class="extra-cell">
                  <span class="table-text">{{ Number(row.mushroom_count ?? 0) }}</span>
                  <span class="extra-sub">({{ formatChip(row.mushroom_amount) }})</span>
                </div>
              </template>
            </GameTableColumn>

            <GameTableColumn
              v-if="isSquidTable"
              prop="_squidNet"
              label="鱿鱼"
              :flex="1.2"
              align="center"
            >
              <template #default="{ row }">
                <span class="table-text" :class="amountClass(row._squidNet)">
                  {{ formatSignedChip(row._squidNet) }}
                </span>
              </template>
            </GameTableColumn>

            <GameTableColumn prop="_score" label="积分" :flex="1.3" align="right">
              <template #default="{ row }">
                <span class="table-text" :class="amountClass(row._score)">
                  {{ formatSignedChip(row._score) }}
                </span>
              </template>
            </GameTableColumn>
          </GameTable>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.table-game-end {
  min-height: 100dvh;
  background-color: var(--c-page);

  @include theme-light {
    background-image: url('@/assets/images/main_bg_light.png');
  }

  :deep(.action-btn) {
    @include theme-light {
      color: #fff;
      background: var(--c-brand);
      box-shadow: none;
    }
  }
}

.settle-page {
  min-height: calc(100dvh - 1.2rem);
  padding-bottom: env(safe-area-inset-bottom);
  color: #f9f9f9;

  @include theme-light {
    color: var(--c-text);
  }
}

.settle-content {
  padding: 0.08rem 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;

  @include theme-light {
    gap: 0.44rem;
  }
}

.settle-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.24rem;
  padding: 3rem 0;
  font-size: 0.34rem;
  color: rgba(255, 255, 255, 0.55);

  @include theme-light {
    color: var(--c-text-muted);
  }
}

.summary-card {
  background: rgba(0, 0, 0, 0.22);
  border-radius: 0.76rem;
  padding: 0.44rem 0.44rem;

  @include theme-light {
    background: #fff;
    box-shadow: 0 0.04rem 0.14rem rgba(0, 0, 0, 0.03);
  }
}

.summary-top {
  display: flex;
  justify-content: space-between;
  gap: 0.24rem;
}

.summary-side {
  min-width: 0;
}

.summary-side--right {
  text-align: right;
}

.room-name {
  margin: 0;
  font-size: 0.38rem;
  line-height: 1.25;
  word-break: break-word;
}

.room-id,
.room-meta {
  margin: 0;
  font-size: 0.31rem;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.7);

  @include theme-light {
    color: rgba(0, 0, 0, 0.7);
  }
}
.room-id {
  font-size: 0.26rem;
  line-height: 1.5;
  display: flex;
  align-items: center;
  gap: 0.08rem;
}

.room-id__tag {
  min-width: 0.42rem;
  padding: 0.015rem 0.08rem;
  border-radius: 0.1067rem;
  color: #fff;
  background: rgba(255, 255, 255, 0.4);
  font-size: 0.19rem;
  line-height: 1.25;
  text-align: center;

  @include theme-light {
    background: rgba(79, 79, 79, 0.4);
  }
}

.summary-divider {
  height: 1px;
  margin: 0.38rem 0 0.4rem;
  background: rgba(255, 255, 255, 0.1);

  @include theme-light {
    background: rgba(0, 0, 0, 0.1);
  }
}

.summary-title {
  margin: 0;
  text-align: center;
  font-size: 0.38rem;
  font-weight: 600;

  @include theme-light {
    font-weight: 400;
  }
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 0.28rem;
}
.summary-stat {
  text-align: center;
}

.summary-stat__value {
  margin: 0;
  font-size: 0.58rem;
  font-weight: 700;
  line-height: 1;

  @include theme-light {
    font-size: 0.647rem;
  }
}

.summary-stat__label {
  margin: 0.15rem 0 0;
  font-size: 0.22rem;
  color: rgba(255, 255, 255, 0.56);

  @include theme-light {
    color: rgba(0, 0, 0, 0.5);
  }
}

.amount--positive {
  color: var(--c-profit);
}

.players-card {
  min-width: 0;

  @include theme-light {
    padding: 0.49rem 0.58rem 0.2rem;
    border-radius: 0.667rem;
    background: #fff;
    overflow: hidden;

    :deep(.game-table__header) {
      margin: 0 0 0.1rem;
      padding: 0;
      border-radius: 0.76rem;
      background: rgba(143, 143, 143, 0.2);
      box-shadow: none;
    }

    :deep(.game-table__header-inner) {
      border-radius: 0.76rem;
      background: transparent;
      box-shadow: none;
    }

    :deep(.game-table__header-cell) {
      min-height: 1.1rem;
      padding: 0 0.08rem;
    }

    :deep(.game-table__header-label) {
      color: #000;
      font-size: 0.295rem;
      font-weight: 500;
    }

    :deep(.game-table__body) {
      gap: 0;
      padding: 0;
    }

    :deep(.game-table__summary) {
      min-height: 1rem;
      border-radius: 0;
      border-bottom: 0.02rem solid rgba(0, 0, 0, 0.1);
      color: rgba(0, 0, 0, 0.7);
      background: transparent;
    }

    :deep(.game-table__row) {
      min-height: 1.35rem;
      border-radius: 0;
      border-bottom: 0.02rem solid rgba(0, 0, 0, 0.1);
      background: transparent;
    }

    :deep(.game-table__cell) {
      min-height: 1.35rem;
      padding: 0.13rem 0.08rem;
    }

    :deep(.game-table__cell-text) {
      color: #000;
      font-size: 0.3rem;
    }

    :deep(.game-table__status) {
      min-height: 0;
      padding: 0;
    }
  }
}

.insurance-summary {
  width: 100%;
  margin: 0 0.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.insurance-summary img {
  width: 0.61rem;
  height: 0.61rem;
}
.user-avatar {
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 50%;
  margin-right: 0.1rem;
}

.table-text {
  font-size: 0.36rem;
  line-height: 1.4;
  word-break: break-all;
  color: rgba(255, 255, 255, 0.9);

  @include theme-light {
    color: #000;
  }
}

.extra-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.15;
}

.extra-sub {
  margin-top: 0.04rem;
  font-size: 0.22rem;
  color: rgba(255, 255, 255, 0.6);

  @include theme-light {
    color: rgba(0, 0, 0, 0.6);
  }
}

.score--pos {
  color: var(--c-profit);
}

.score--neg {
  color: var(--c-loss);
}

.score--zero {
  color: rgba(255, 255, 255, 0.9);

  @include theme-light {
    color: #000;
  }
}
</style>
