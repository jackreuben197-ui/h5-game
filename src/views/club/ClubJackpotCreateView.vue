<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast, showSuccessToast, showToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import {
  postOrgClubJackpotTemplateCreateApi,
  postOrgClubJackpotTemplateUpdateApi,
  postOrgJackpotTemplateInfoApi,
} from '@/api/org'

interface OptionItem {
  id: string
  label: string
  selected?: boolean
}

interface ConfigRow {
  id: string
  label: string
  value: string
  suffix?: string
  checked?: boolean
}

const route = useRoute()
const router = useRouter()

const isEditMode = computed(() => !!route.query.id)
const editJackpotId = computed(() => Number(route.query.id) || 0)

const loading = ref(false)
const jackpotName = ref('Jackpot')

const gameModes = ['NLH', 'PLO', '6+', 'Bombpot', 'AOF'] as const
type GameMode = (typeof gameModes)[number]
const stakeLevels = ['Micro', 'Small', 'Medium', 'Large'] as const

const activeGameMode = ref<GameMode>('NLH')
const activeStakeLevel = ref('Micro')

const jackpotRows = ref<ConfigRow[]>([
  { id: 'jackpot-rake', label: '德州扑克', value: 'Enter here', suffix: '%', checked: true },
])

const contributionRows = ref<ConfigRow[]>([
  { id: 'blind', label: '0.1/0.2', value: 'Enter here', suffix: '%', checked: true },
  { id: 'pot-trigger', label: '底池触发jackpot贡献', value: 'BB amount', checked: false },
  { id: 'put-in', label: '投入底池触发jackpot奖励', value: 'BB amount', checked: false },
  { id: 'all-table', label: '奖励全桌', value: 'BB amount', checked: false },
])

const profitRows = ref<ConfigRow[]>([
  { id: 'profit-trigger', label: '盈利触发', value: 'BB amount', checked: true },
  { id: 'jackpot-contrib', label: 'Jackpot 贡献', value: 'BB amount', checked: false },
  { id: 'profit-percent', label: '触发盈利 (%)', value: '', suffix: '%', checked: true },
])

const blindOptions = ref<OptionItem[]>([
  { id: 'b1', label: '0.2/0.4', selected: true },
  { id: 'b2', label: '0.2/0.4', selected: false },
  { id: 'b3', label: '0.2/0.4', selected: false },
  { id: 'b4', label: '0.3/0.6', selected: false },
  { id: 'b5', label: '0.3/0.6', selected: false },
])

const poolSettings = ref([
  { id: 'royal', title: 'Royal Flush', checked: false, ratio: '' },
  { id: 'straight', title: 'Straight flush', checked: false, ratio: '' },
  { id: 'four', title: 'Four of a kind', checked: false, ratio: '' },
])

function onCancel(): void {
  router.back()
}

async function onConfirm(): Promise<void> {
  if (!jackpotName.value.trim()) {
    showToast('请输入牌局名称')
    return
  }

  loading.value = true
  try {
    const modeSwitches: Record<GameMode, number> = {
      NLH: 1,
      PLO: 1,
      '6+': 1,
      Bombpot: 1,
      AOF: 1,
    }
    void modeSwitches // 预留切换逻辑

    // 构建当前模式的 setting
    const setting = {
      game_play_ratio: Number(jackpotRows.value[0]?.value) || 0,
      blind_setting: blindOptions.value.map((b) => {
        const [sb] = b.label.split('/').map(Number)
        return {
          sb: sb || 0,
          status: b.selected ? 1 : 0,
          blind_type: blindOptions.value.indexOf(b) + 1,
          prize_ratio: 0,
          contribute_pot_switch: contributionRows.value.find((r) => r.id === 'pot-trigger')?.checked ? 1 : 2,
          contribute_pot_limit: 0,
          award_bet_switch: contributionRows.value.find((r) => r.id === 'put-in')?.checked ? 1 : 2,
          award_bet_limit: 0,
          award_other_switch: contributionRows.value.find((r) => r.id === 'all-table')?.checked ? 1 : 2,
          award_other_ratio: 0,
        }
      }),
      royal_flush_switch: poolSettings.value.find((p) => p.id === 'royal')?.checked ? 1 : 0,
      royal_flush_ratio: Number(poolSettings.value.find((p) => p.id === 'royal')?.ratio) || 0,
      straight_flush_switch: poolSettings.value.find((p) => p.id === 'straight')?.checked ? 1 : 0,
      straight_flush_ratio: Number(poolSettings.value.find((p) => p.id === 'straight')?.ratio) || 0,
      four_ofa_kind_switch: poolSettings.value.find((p) => p.id === 'four')?.checked ? 1 : 0,
      four_ofa_kind_ratio: Number(poolSettings.value.find((p) => p.id === 'four')?.ratio) || 0,
    }

    const basePayload = {
      name: jackpotName.value.trim(),
      [`${activeGameMode.value.toLowerCase()}_switch` as string]: 1,
      [`${activeGameMode.value.toLowerCase()}_setting` as string]: setting,
    }

    let response
    if (isEditMode.value) {
      response = await postOrgClubJackpotTemplateUpdateApi({
        jackpot_id: editJackpotId.value,
        ...basePayload,
      } as Parameters<typeof postOrgClubJackpotTemplateUpdateApi>[0])
    } else {
      response = await postOrgClubJackpotTemplateCreateApi(
        basePayload as Parameters<typeof postOrgClubJackpotTemplateCreateApi>[0],
      )
    }

    if (Number(response.code) !== 0) {
      const message = typeof response.msg === 'string' ? response.msg : '操作失败'
      throw new Error(message)
    }

    showSuccessToast(isEditMode.value ? '编辑成功' : '创建成功')
    router.back()
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

async function fetchTemplateInfo(): Promise<void> {
  if (!isEditMode.value) return

  loading.value = true
  try {
    const response = await postOrgJackpotTemplateInfoApi({
      jackpot_id: editJackpotId.value,
    })

    if (Number(response.code) !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '获取模板信息失败')
    }

    const data = response.data?.item as Record<string, unknown> | undefined
    if (!data) return

    // 填充名称
    if (typeof data.name === 'string') {
      jackpotName.value = data.name
    }

    // 填充游戏模式开关
    if (data.nlh_switch === 1) activeGameMode.value = 'NLH'
    else if (data.plo_switch === 1) activeGameMode.value = 'PLO'
    else if (data.six_plus_switch === 1) activeGameMode.value = '6+'
    else if (data.bombpot_switch === 1) activeGameMode.value = 'Bombpot'
    else if (data.aof_switch === 1) activeGameMode.value = 'AOF'

    // 获取当前模式的 setting
    const modeKey = activeGameMode.value.toLowerCase()
    const modeSetting = data[`${modeKey}_setting`] as Record<string, unknown> | undefined

    if (modeSetting) {
      if (typeof modeSetting.game_play_ratio === 'number') {
        jackpotRows.value[0].value = String(modeSetting.game_play_ratio)
      }

      // 盲注设置
      const blindSettings = modeSetting.blind_setting as
        | Record<string, unknown>[]
        | undefined
      if (Array.isArray(blindSettings) && blindSettings.length > 0) {
        blindOptions.value = blindSettings.map((bs, i) => ({
          id: `b${i + 1}`,
          label: `${bs.sb ?? 0}/${(Number(bs.sb) || 0) * 2}`,
          selected: bs.status === 1,
        }))
      }

      // Pool settings
      if (typeof modeSetting.royal_flush_switch === 'number') {
        const royal = poolSettings.value.find((p) => p.id === 'royal')
        if (royal) {
          royal.checked = modeSetting.royal_flush_switch === 1
          royal.ratio = String(modeSetting.royal_flush_ratio ?? '')
        }
      }
      if (typeof modeSetting.straight_flush_switch === 'number') {
        const straight = poolSettings.value.find((p) => p.id === 'straight')
        if (straight) {
          straight.checked = modeSetting.straight_flush_switch === 1
          straight.ratio = String(modeSetting.straight_flush_ratio ?? '')
        }
      }
      if (typeof modeSetting.four_ofa_kind_switch === 'number') {
        const four = poolSettings.value.find((p) => p.id === 'four')
        if (four) {
          four.checked = modeSetting.four_ofa_kind_switch === 1
          four.ratio = String(modeSetting.four_ofa_kind_ratio ?? '')
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取模板信息失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchTemplateInfo()
})
</script>

<template>
  <div class="jackpot-create-page">
    <div class="page-overlay" aria-hidden="true"></div>

    <HeaderBack :title="isEditMode ? 'Edit Jackpot' : 'Jackpot'" />

    <section class="create-content">
      <div class="name-input-pill">
        <span class="pill-label">牌局名称</span>
        <input
          v-model="jackpotName"
          class="pill-input"
          maxlength="20"
          placeholder="Jackpot"
        />
        <span class="pill-count">{{ jackpotName.length }}/20</span>
      </div>

      <div class="glass-card summary-card">
        <div class="summary-left">
          <div class="summary-title-row">
            <span>Jackpot 奖池</span>
            <i class="icon-info" aria-hidden="true">i</i>
          </div>
          <p class="summary-amount">0.2/0.4</p>
        </div>
      </div>

      <div class="glass-card section-card">
        <div class="segment-row segment-row--five">
          <button
            v-for="mode in gameModes"
            :key="mode"
            type="button"
            class="segment-btn"
            :class="{ 'segment-btn--active': activeGameMode === mode }"
            @click="activeGameMode = mode"
          >
            {{ mode }}
          </button>
        </div>

        <div class="divider"></div>

        <div class="rows-wrap">
          <div v-for="row in jackpotRows" :key="row.id" class="config-row config-row--stack">
            <div class="row-label">
              <i class="dot" :class="{ 'dot--active': row.checked }"></i>
              <span>{{ row.label }}</span>
              <i class="icon-info" aria-hidden="true">i</i>
            </div>

            <div class="value-input">
              <span>{{ row.value }}</span>
              <span v-if="row.suffix">{{ row.suffix }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="glass-card section-card section-card--dense">
        <div class="segment-row segment-row--four">
          <button
            v-for="size in stakeLevels"
            :key="size"
            type="button"
            class="segment-btn"
            :class="{ 'segment-btn--active': activeStakeLevel === size }"
            @click="activeStakeLevel = size"
          >
            {{ size }}
          </button>
        </div>

        <div class="divider"></div>

        <div class="rows-wrap rows-wrap--gap-sm">
          <div class="config-row config-row--stack">
            <div class="row-label">
              <i class="dot dot--active"></i>
              <span>0.1/0.2</span>
              <i class="icon-info" aria-hidden="true">i</i>
            </div>
            <div class="value-input">
              <span>Enter here</span>
              <span>%</span>
            </div>
          </div>

          <div v-for="row in contributionRows.slice(1)" :key="row.id" class="config-row">
            <div class="row-label row-label--small">
              <i class="dot" :class="{ 'dot--active': row.checked }"></i>
              <span>{{ row.label }}</span>
            </div>
            <div class="value-input value-input--narrow">
              <span>{{ row.value }}</span>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="title-line">
          <span>jackpot 贡献</span>
          <i class="icon-info" aria-hidden="true">i</i>
        </div>

        <div class="rows-wrap rows-wrap--gap-sm">
          <div v-for="row in profitRows" :key="row.id" class="config-row">
            <div class="row-label">
              <i class="dot" :class="{ 'dot--active': row.checked }"></i>
              <span>{{ row.label }}</span>
            </div>
            <div class="value-input value-input--narrow">
              <span>{{ row.value }}</span>
              <span v-if="row.suffix">{{ row.suffix }}</span>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="blind-list">
          <button
            v-for="option in blindOptions"
            :key="option.id"
            type="button"
            class="blind-item"
            @click="blindOptions = blindOptions.map((item) => ({ ...item, selected: item.id === option.id }))"
          >
            <i class="dot" :class="{ 'dot--active': option.selected }"></i>
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

      <div class="glass-card pool-card">
        <h3>Pool Settings</h3>

        <div v-for="item in poolSettings" :key="item.id" class="pool-row">
          <div class="pool-left">
            <div class="row-label">
              <i
                class="dot"
                :class="{ 'dot--active': item.checked }"
                @click="item.checked = !item.checked"
              ></i>
              <span>{{ item.title }}</span>
            </div>

            <div class="hand-cards">
              <span class="card black">2♣</span>
              <span class="card red">2♥</span>
              <span class="card black">2♠</span>
              <span class="card red">2♦</span>
              <span class="card red">2♥</span>
            </div>
          </div>

          <div class="pool-right">
            <span>Award ratio (%)</span>
            <div class="value-input value-input--narrow">
              <input
                v-model="item.ratio"
                class="inline-input"
                placeholder="BB amount"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="bottom-actions">
      <button
        type="button"
        class="action-btn action-btn--cancel"
        @click="onCancel"
      >
        取消
      </button>
      <button
        type="button"
        class="action-btn action-btn--confirm"
        :disabled="loading"
        @click="onConfirm"
      >
        {{ loading ? '提交中...' : '确定' }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.jackpot-create-page {
  position: relative;
  height: 100dvh;
  padding: 0 0.3733rem calc(2.0267rem + env(safe-area-inset-bottom));
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
  overflow-x: hidden;
  overflow-y: auto;
}

.page-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.9733rem);
  mix-blend-mode: luminosity;
  pointer-events: none;
  z-index: 0;
}

:deep(.page-back-header) {
  position: relative;
  z-index: 3;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
}

.create-content {
  position: relative;
  z-index: 2;
  margin: 0.4267rem auto 0;
  width: 9.2533rem;
  max-width: calc(100vw - 0.7467rem);
  display: flex;
  flex-direction: column;
  gap: 0.2534rem;
}

.name-input-pill {
  height: 1.308rem;
  border-radius: 4.223rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0 0.5067rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
}

.pill-label,
.pill-count {
  font-size: 0.3733rem;
  line-height: 1.4;
  flex-shrink: 0;
}

.pill-input {
  flex: 1;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.4054rem;
  line-height: 1.2;
  text-align: center;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}

.pill-count {
  color: #b4b4b4;
}

.glass-card {
  border-radius: 0.4328rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.0043rem);
}

.summary-card {
  padding: 0.3722rem 0.5067rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-title-row {
  display: flex;
  align-items: center;
  gap: 0.1333rem;
  color: #fff;
  font-size: 0.32rem;
  line-height: 1.4;
}

.icon-info {
  width: 0.2667rem;
  height: 0.2667rem;
  border-radius: 50%;
  border: 0.0187rem solid rgba(255, 255, 255, 0.72);
  font-size: 0.2133rem;
  line-height: 0.24rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-style: normal;
}

.summary-amount {
  margin: 0.0667rem 0 0;
  color: #fff;
  font-size: 0.5333rem;
  line-height: 1.4;
  font-weight: 700;
}

.section-card {
  width: 100%;
  padding: 0.5067rem;
  display: flex;
  flex-direction: column;
  gap: 0.3733rem;
}

.section-card--dense {
  gap: 0.32rem;
}

.segment-row {
  height: 1.04rem;
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.2);
  display: grid;
  align-items: center;
  padding: 0.0267rem;
}

.segment-row--five {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.segment-row--four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.segment-btn {
  height: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.362rem;
  border-radius: 1.3844rem;
}

.segment-btn--active {
  border: 0.0133rem solid #fff;
  background: rgba(255, 255, 255, 0.17);
  backdrop-filter: blur(0.4533rem);
}

.divider {
  height: 0.0181rem;
  background: rgba(255, 255, 255, 0.25);
}

.rows-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.2027rem;
}

.rows-wrap--gap-sm {
  gap: 0.16rem;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.1867rem;
}

.config-row--stack {
  flex-direction: column;
  align-items: stretch;
}

.row-label {
  display: inline-flex;
  align-items: center;
  gap: 0.1014rem;
  color: #fff;
  font-size: 0.4054rem;
  line-height: 1.4;
}

.row-label--small {
  font-size: 0.352rem;
}

.dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  border: 0.0267rem solid rgba(255, 255, 255, 0.7);
  position: relative;
  flex-shrink: 0;
}

.dot--active::after {
  content: '';
  position: absolute;
  inset: 0.0667rem;
  border-radius: 50%;
  background: linear-gradient(145deg, #33c6ff, #1b9fdb 80%);
}

.value-input {
  height: 0.9291rem;
  border-radius: 1.5519rem;
  background: rgba(255, 255, 255, 0.38);
  mix-blend-mode: soft-light;
  padding: 0 0.304rem;
  color: #fff;
  font-size: 0.3716rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.1333rem;
}

.value-input--narrow {
  width: 3.657rem;
  justify-content: center;
}

.title-line {
  display: flex;
  align-items: center;
  gap: 0.1333rem;
  font-size: 0.3716rem;
  color: #fff;
}

.blind-list {
  display: flex;
  flex-direction: column;
  gap: 0.1351rem;
}

.blind-item {
  border: 0;
  padding: 0;
  background: transparent;
  color: #fff;
  font-size: 0.397rem;
  display: flex;
  align-items: center;
  gap: 0.0792rem;
  width: fit-content;
}

.pool-card {
  padding: 0.3722rem 0.5067rem;
  display: flex;
  flex-direction: column;
  gap: 0.2134rem;
}

.pool-card h3 {
  margin: 0;
  font-size: 0.4392rem;
  line-height: 1;
  color: #fff;
  font-weight: 500;
}

.pool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.2667rem;
}

.pool-left {
  width: 3.1207rem;
  display: flex;
  flex-direction: column;
  gap: 0.2134rem;
}

.hand-cards {
  display: flex;
  align-items: center;
  gap: 0.0865rem;
}

.card {
  width: 0.5549rem;
  height: 0.8323rem;
  border-radius: 0.1867rem;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.208rem;
  font-weight: 700;
}

.card.black {
  color: #111;
}

.card.red {
  color: #fa2b4b;
}

.pool-right {
  width: 3.657rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.08rem;
}

.pool-right > span {
  color: #fff;
  font-size: 0.2987rem;
  line-height: 1.4;
}

.bottom-actions {
  position: fixed;
  left: 50%;
  bottom: calc(0.3733rem + env(safe-area-inset-bottom));
  width: 9.2533rem;
  max-width: calc(100vw - 0.7467rem);
  transform: translateX(-50%);
  z-index: 8;
  display: flex;
  gap: 0.2534rem;
}

.action-btn {
  flex: 1;
  height: 1.4358rem;
  border-radius: 1.0557rem;
  border: 0;
  color: #fff;
  font-size: 0.4rem;
  font-weight: 500;
}

.action-btn--cancel {
  background: rgba(0, 0, 0, 0.3);
}

.action-btn--confirm {
  border: 0.0133rem solid rgba(242, 242, 242, 0.8);
  background: linear-gradient(157.77deg, #05e7ae 7.55%, #027a5c 71.92%);

  &:disabled {
    opacity: 0.5;
  }
}

.inline-input {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: inherit;
  line-height: inherit;
  width: 100%;
  text-align: center;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}
</style>
