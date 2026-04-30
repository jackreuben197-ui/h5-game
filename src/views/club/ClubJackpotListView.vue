<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast, showToast } from 'vant'
import { postOrgClubJackpotTemplateListApi } from '@/api/org'
import emptyStateIcon from '@/assets/icons/jackpot_empty_state.png'

interface JackpotTemplateItem {
  id: string
  name: string
  jpAmount: string
  gameTags: string[]
}

const router = useRouter()
const loading = ref(false)
const templates = ref<JackpotTemplateItem[]>([])

const hasItems = computed(() => templates.value.length > 0)

onMounted(() => {
  void fetchJackpotTemplates()
})

async function fetchJackpotTemplates(): Promise<void> {
  loading.value = true
  try {
    const response = await postOrgClubJackpotTemplateListApi({
      limit: 50,
      offset: 0,
    })

    if (Number(response.code) !== 0) {
      const message = typeof response.msg === 'string' ? response.msg : '加载 Jackpot 列表失败'
      throw new Error(message)
    }

    const rawItems = Array.isArray(response.data?.items) ? response.data.items : []
    templates.value = rawItems.map((raw, index) => toJackpotItem(raw, index))
  } catch (error) {
    templates.value = []
    const message = error instanceof Error ? error.message : '加载 Jackpot 列表失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

function toJackpotItem(raw: unknown, index: number): JackpotTemplateItem {
  const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const id = normalizeValue(source.jackpot_id ?? source.id ?? index + 1)
  const name = normalizeValue(source.name) || `Jackpot ${index + 1}`

  const amountRaw =
    source.jp_amount ??
    source.jackpot_amount ??
    source.current_amount ??
    source.amount ??
    source.gold ??
    0

  const gameTags: string[] = []
  if (toSafeNumber(source.nlh_switch) === 1) gameTags.push('NLH')
  if (toSafeNumber(source.plo_switch) === 1) gameTags.push('PLO')
  if (toSafeNumber(source.six_plus_switch) === 1) gameTags.push('6+')
  if (toSafeNumber(source.bombpot_switch) === 1) gameTags.push('BOMB')
  if (toSafeNumber(source.aof_switch) === 1) gameTags.push('AOF')

  return {
    id,
    name,
    jpAmount: formatAmount(amountRaw),
    gameTags: gameTags.length ? gameTags : ['NLH', 'PLO', '6+'],
  }
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}

function toSafeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function formatAmount(value: unknown): string {
  const amount = toSafeNumber(value)
  return amount > 0 ? amount.toLocaleString('en-US') : '0'
}

function onEdit(item: JackpotTemplateItem): void {
  showToast(`编辑 ${item.name} 功能开发中`)
}

function onDelete(item: JackpotTemplateItem): void {
  showToast(`删除 ${item.name} 功能开发中`)
}

function goCreateJackpot(): void {
  void router.push('/club/jackpot/create')
}

function goPoolReward(): void {
  void router.push('/club/jackpot/pool-reward')
}
</script>

<template>
  <div class="club-jackpot-page">
    <div class="page-overlay" aria-hidden="true"></div>

    <HeaderBack :title="'Jackpot'">
      <template #right>
        <button
          type="button"
          class="pool-trigger"
          aria-label="Pool Reward"
          @click="goPoolReward"
        >
          <span>Pool Reward</span>
          <span class="trigger-caret" aria-hidden="true"></span>
        </button>
      </template>
    </HeaderBack>

    <section class="jackpot-body">
      <ul v-if="hasItems" class="jackpot-list">
        <li v-for="item in templates" :key="item.id" class="jackpot-card">
          <div class="card-bg" aria-hidden="true"></div>
          <div class="jackpot-badge" aria-hidden="true"><span>JACKPOT</span></div>

          <div class="jackpot-info">
            <p class="game-name">{{ item.name }}</p>
            <div class="tag-rows">
              <div class="tag-row">
                <span v-for="tag in item.gameTags.slice(0, 2)" :key="tag" class="tag-item">
                  <i class="tag-icon" aria-hidden="true"></i>{{ tag }}
                </span>
              </div>
              <div v-if="item.gameTags.length > 2" class="tag-row">
                <span v-for="tag in item.gameTags.slice(2)" :key="`r2-${tag}`" class="tag-item">
                  <i class="tag-icon" aria-hidden="true"></i>{{ tag }}
                </span>
              </div>
            </div>
          </div>

          <div class="jackpot-right">
            <div class="jp-badge">JP {{ item.jpAmount }}</div>
            <div class="action-row">
              <button
                type="button"
                class="action-btn"
                aria-label="编辑"
                @click.stop="onEdit(item)"
              >
                <i class="action-icon" aria-hidden="true">✎</i>
                <span class="action-label">编辑</span>
              </button>
              <button
                type="button"
                class="action-btn"
                aria-label="删除"
                @click.stop="onDelete(item)"
              >
                <i class="action-icon" aria-hidden="true">✕</i>
                <span class="action-label">删除</span>
              </button>
            </div>
          </div>
        </li>
      </ul>

      <div v-else class="jackpot-empty" :class="{ 'jackpot-empty--loading': loading }">
        <img class="empty-icon" :src="emptyStateIcon" alt="" />
        <p>{{ loading ? '加载中...' : '暂无数据' }}</p>
      </div>
    </section>

    <div class="footer-action">
      <button type="button" class="create-btn" @click="goCreateJackpot">Create Jackpot Table</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-jackpot-page {
  position: relative;
  min-height: 100dvh;
  padding-bottom: calc(2.2rem + env(safe-area-inset-bottom));
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
  overflow-x: hidden;
  overflow-y: auto;
}

.page-overlay {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(36.5px);
  background: rgba(0, 0, 0, 0.2);
  mix-blend-mode: luminosity;
  pointer-events: none;
  z-index: 0;
}

:deep(.page-back-header) {
  position: relative;
  z-index: 2;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
  min-height: 1.46rem;
}

.pool-trigger {
  border: 0;
  min-height: 0.9733rem;
  border-radius: 0.5261rem;
  padding: 0.1739rem 0.24rem 0.1739rem 0.4267rem;
  font-size: 0.4483rem;
  color: #fff;
  background: rgba(255, 255, 255, 0.21);
  display: inline-flex;
  align-items: center;
  gap: 0.0475rem;
  cursor: pointer;
  line-height: 1.2;
}

.trigger-caret {
  width: 0.1867rem;
  height: 0.1867rem;
  border-right: 0.04rem solid rgba(255, 255, 255, 0.96);
  border-bottom: 0.04rem solid rgba(255, 255, 255, 0.96);
  transform: rotate(-45deg);
  margin-right: 0.0267rem;
}

.jackpot-body {
  position: relative;
  z-index: 2;
  margin: 0.4267rem auto 0;
  padding: 0 0.4267rem;
}

.jackpot-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4223rem;
}

.jackpot-card {
  position: relative;
  height: 2.2765rem;
  max-width: 9.1216rem;
}

/* Pill-shaped card background */
.card-bg {
  position: absolute;
  left: 0.2533rem;
  top: 0.0253rem;
  right: 0;
  height: 2.2551rem;
  border-radius: 2.0848rem;
  background:
    radial-gradient(74% 96% at 42% 42%, rgba(104, 75, 255, 0.3) 0%, rgba(104, 75, 255, 0) 62%),
    rgba(5, 13, 231, 0.6);
  backdrop-filter: blur(4.1px);
  border: 0.0267rem solid rgba(255, 255, 255, 0.96);
  overflow: hidden;
}

.card-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0.0149rem rgba(255, 255, 255, 0.5);
  pointer-events: none;
}

/* JACKPOT circle badge */
.jackpot-badge {
  position: absolute;
  left: -0.028rem;
  top: 0.4053rem;
  width: 1.4888rem;
  height: 1.4888rem;
  border-radius: 1.7372rem;
  border: 0.0253rem solid rgba(242, 242, 242, 0.4);
  background: #7a45d6;
  backdrop-filter: blur(10.5px);
  box-shadow: 0.0913rem 0.1141rem 0.0913rem rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;

  span {
    font-size: 0.229rem;
    font-weight: 700;
    color: #fff;
    text-align: center;
    line-height: 1.1;
    letter-spacing: 0.01em;
  }
}

/* Game name + tags */
.jackpot-info {
  position: absolute;
  left: 1.64rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  max-width: 3.89rem;
}

.game-name {
  margin: 0;
  font-size: 0.354rem;
  font-weight: 700;
  color: #f9f9f9;
  line-height: 0.83;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-rows {
  margin-top: 0.1493rem;
  display: flex;
  flex-direction: column;
  gap: 0.0267rem;
}

.tag-row {
  display: flex;
  align-items: center;
  gap: 0.2933rem;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.1333rem;
  font-size: 0.2933rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.0117rem;
  line-height: normal;
}

.tag-icon {
  font-style: normal;
  display: inline-block;
  flex-shrink: 0;
  width: 0.24rem;
  height: 0.2667rem;
  background: linear-gradient(180deg, rgba(190, 232, 255, 0.95), rgba(136, 188, 255, 0.85));
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

/* Right section: JP badge + action buttons */
.jackpot-right {
  position: absolute;
  left: 6.5067rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.874rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.0394rem;
  z-index: 2;
}

.jp-badge {
  width: 1.84rem;
  height: 0.4755rem;
  border-radius: 0.2232rem;
  background: linear-gradient(180deg, #69ffe6, #079a8b);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.2951rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.0059rem;
  white-space: nowrap;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 0.2025rem;
}

.action-btn {
  width: 0.6218rem;
  height: 0.6218rem;
  border-radius: 0.4223rem;
  border: 0.0112rem solid rgba(242, 242, 242, 0.4);
  background: rgba(165, 165, 165, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.05rem 0 0.02rem;
  gap: 0.01rem;
  cursor: pointer;
  box-shadow:
    0 0.028rem 0.028rem rgba(0, 0, 0, 0.25),
    inset 0 0 0.0559rem rgba(0, 0, 0, 0.8),
    inset 0 0 0.1117rem rgba(242, 242, 242, 0.9);
}

.action-icon {
  font-style: normal;
  font-size: 0.1867rem;
  color: #fff;
  line-height: 1;
}

.action-label {
  font-size: 0.1706rem;
  color: #fff;
  line-height: 1.2;
  font-weight: 600;
}

/* Empty state */
.jackpot-empty {
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.jackpot-empty--loading {
  opacity: 0.8;
}

.empty-icon {
  width: 1.248rem;
  height: 1.56rem;
  object-fit: contain;
}

.jackpot-empty p {
  margin: 0.24rem 0 0;
  font-size: 0.3734rem;
  color: rgba(225, 234, 248, 0.88);
  text-align: center;
}

/* Fixed footer */
.footer-action {
  position: fixed;
  bottom: calc(0.6933rem + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 1.0667rem);
  max-width: 9.1216rem;
  z-index: 6;
}

.create-btn {
  width: 100%;
  height: 1.4716rem;
  border: 0.0358rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.082rem;
  font-size: 0.48rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(168.09deg, #05e7ae 7.55%, #027a5c 71.92%);
  box-shadow:
    inset 0 0.04rem 0.2rem rgba(255, 255, 255, 0.25),
    0 0.16rem 0.36rem rgba(0, 120, 100, 0.45);
  cursor: pointer;
}
</style>
