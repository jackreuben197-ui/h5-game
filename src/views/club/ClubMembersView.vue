<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import imgAvatar from '@/assets/images/default_avatar.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgBalance from '@/assets/icons/icon_balance.png'

type TabKey = 'account' | 'record'
type MemberRole = '管理员' | '代理人' | '成员'
type FundAssetTab = 'coin' | 'quota' | 'diamond'
type FundActionTab = 'grant' | 'recycle'
type QuotaEditField = 'disposable' | 'review'
type QuotaAdjustMode = 'increase' | 'decrease'

interface SummaryItem {
  label: string
  value: number
  icon: 'diamond' | 'chips' | 'balance'
}

interface MemberItem {
  id: number
  name: string
  uid: string
  role: MemberRole
  diamond: number
  uc: number
  freeLimit: string
  agentName: string
}

type RecordRangeKey = 'today' | 'seven' | 'thirty' | 'custom'

interface RecordRangeItem {
  key: RecordRangeKey
  label: string
}

interface RecordStatItem {
  id: number
  label: string
  value: string
}

interface FundRecordItem {
  id: number
  time: string
  date: string
  type: string
  quantity: string
  balance: string
  remark: string
  remarkId: string
  fromName?: string
  fromId?: string
}

const router = useRouter()
const activeTab = ref<TabKey>('account')
const searchKeyword = ref('')
const activeRange = ref<RecordRangeKey>('today')
const selectedRecordType = ref('所有')
const showTypeMenu = ref(true)
const showFundSheet = ref(false)
const activeMember = ref<MemberItem | null>(null)
const fundAssetTab = ref<FundAssetTab>('coin')
const fundActionTab = ref<FundActionTab>('grant')
const fundAmountInput = ref('')
const quotaEditField = ref<QuotaEditField | null>(null)
const quotaAdjustMode = ref<QuotaAdjustMode>('increase')
const quotaInput = ref('')
const disposableQuota = ref(0)
const reviewQuota = ref(0)

const keypadRows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', 'DEL'],
] as const

const currentFundBalanceText = computed(() => {
  if (!activeMember.value) {
    return '0'
  }

  if (fundAssetTab.value === 'diamond') {
    return formatCount(activeMember.value.diamond)
  }

  return formatCount(activeMember.value.uc)
})

const currentInputText = computed(() => {
  if (fundAssetTab.value === 'quota' && quotaEditField.value) {
    return quotaInput.value || '请输入整数'
  }

  return fundAmountInput.value || '请输入发放数量'
})

const fundSubmitLabel = computed(() => (fundActionTab.value === 'grant' ? '发放' : '回收'))

const summaryTop: SummaryItem[] = [
  { label: '俱乐部总余额', value: 20000, icon: 'chips' },
  { label: '成员在桌余额', value: 20000, icon: 'chips' },
  { label: '成员总余额', value: 20000, icon: 'chips' },
]

const summaryBottom: SummaryItem[] = [
  { label: '成员总免审额', value: 20000, icon: 'balance' },
  { label: '俱乐部钻石', value: 20000, icon: 'diamond' },
]

const members = ref<MemberItem[]>([
  { id: 1, name: '成员名字', uid: '8677650585', role: '管理员', diamond: 500, uc: 500, freeLimit: '1000/1000', agentName: 'Gregory' },
  { id: 2, name: '成员名字', uid: '8677650585', role: '管理员', diamond: 500, uc: 500, freeLimit: '1000/1000', agentName: 'Gregory' },
  { id: 3, name: '成员名字', uid: '8677650585', role: '代理人', diamond: 500, uc: 500, freeLimit: '1000/1000', agentName: 'Gregory' },
  { id: 4, name: '成员名字', uid: '8677650585', role: '成员', diamond: 500, uc: 500, freeLimit: '1000/1000', agentName: 'Gregory' },
  { id: 5, name: '成员名字', uid: '8677650585', role: '代理人', diamond: 500, uc: 500, freeLimit: '1000/1000', agentName: 'Gregory' },
])

const recordRanges: RecordRangeItem[] = [
  { key: 'today', label: '今天' },
  { key: 'seven', label: '7天' },
  { key: 'thirty', label: '30天' },
  { key: 'custom', label: '自定义' },
]

const recordStats: RecordStatItem[] = [
  { id: 1, label: 'Deposits', value: '20/20' },
  { id: 2, label: 'withdrawal', value: '1000' },
  { id: 3, label: 'Income', value: '200' },
  { id: 4, label: 'Percentage', value: '50' },
]

const recordTypeOptions = [
  '所有',
  '回收',
  '房间服务费',
  '存储',
  '提取',
  'MTT服务费',
  '保险收入',
  '押金明细',
  '玩家盈利扣除',
  '俱乐部平账支出',
  '联盟发放',
  '牛仔收入',
  '牛仔赔付',
]

const recordRows = ref<FundRecordItem[]>([
  { id: 1, time: '15:00:50', date: '11/03/2024', type: '服务费', quantity: '+3,000,000', balance: '3500', remark: '备注', remarkId: '11440454', fromName: 'Charlie', fromId: '12345678' },
  { id: 2, time: '15:00:50', date: '11/03/2024', type: '服务费', quantity: '+3,000,000', balance: '3500', remark: '备注', remarkId: '11440454', fromName: 'Charlie', fromId: '12345678' },
  { id: 3, time: '15:00:50', date: '11/03/2024', type: '服务费', quantity: '+3,000,000', balance: '3500', remark: '备注', remarkId: '11440454', fromName: 'Charlie', fromId: '12345678' },
  { id: 4, time: '15:00:50', date: '11/03/2024', type: '服务费', quantity: '+3,000,000', balance: '3500', remark: '备注', remarkId: '11440454' },
  { id: 5, time: '15:00:50', date: '11/03/2024', type: '服务费', quantity: '+3,000,000', balance: '3500', remark: '备注', remarkId: '11440454' },
  { id: 6, time: '15:00:50', date: '11/03/2024', type: '服务费', quantity: '+3,000,000', balance: '3500', remark: '备注', remarkId: '11440454' },
])

const filteredRecordRows = computed(() => {
  if (selectedRecordType.value === '所有') {
    return recordRows.value
  }

  return recordRows.value.filter((row) => row.type === selectedRecordType.value)
})

function formatCount(value: number): string {
  return value.toLocaleString('en-US')
}

function iconByType(type: SummaryItem['icon']): string {
  if (type === 'diamond') {
    return imgDiamond
  }

  if (type === 'balance') {
    return imgBalance
  }

  return imgChips
}

function goBack(): void {
  void router.push('/club/detail')
}

function switchTab(tab: TabKey): void {
  activeTab.value = tab

  if (tab === 'account') {
    showTypeMenu.value = false
  }
}

function onIncomeQuery(): void {
  void router.push('/club/wallet/logs')
}

function openFundSheet(member: MemberItem): void {
  activeMember.value = member
  showFundSheet.value = true
  fundAssetTab.value = 'coin'
  fundActionTab.value = 'grant'
  fundAmountInput.value = ''
  quotaInput.value = ''
  quotaEditField.value = null
  quotaAdjustMode.value = 'increase'
  disposableQuota.value = 0
  reviewQuota.value = 0
}

function closeFundSheet(): void {
  showFundSheet.value = false
  quotaEditField.value = null
}

function switchFundAsset(tab: FundAssetTab): void {
  fundAssetTab.value = tab

  if (tab !== 'coin') {
    fundActionTab.value = 'grant'
  }

  if (tab !== 'quota') {
    quotaEditField.value = null
    quotaInput.value = ''
    quotaAdjustMode.value = 'increase'
  }
}

function switchFundAction(action: FundActionTab): void {
  fundActionTab.value = action
}

function editQuota(field: QuotaEditField): void {
  quotaEditField.value = field
  quotaInput.value = ''
  quotaAdjustMode.value = 'increase'
}

function resetQuota(field: QuotaEditField): void {
  if (field === 'disposable') {
    disposableQuota.value = 0
    return
  }

  reviewQuota.value = 0
}

function onKeypadPress(key: string): void {
  const isQuotaEditing = fundAssetTab.value === 'quota' && quotaEditField.value
  const target = isQuotaEditing ? quotaInput : fundAmountInput

  if (key === 'C') {
    target.value = ''
    return
  }

  if (key === 'DEL') {
    target.value = target.value.slice(0, -1)
    return
  }

  if (target.value.length >= 9) {
    return
  }

  target.value += key
}

function onFundConfirm(): void {
  if (fundAssetTab.value !== 'quota' || !quotaEditField.value || !quotaInput.value) {
    closeFundSheet()
    return
  }

  const amount = Number.parseInt(quotaInput.value, 10)

  if (Number.isNaN(amount)) {
    return
  }

  const factor = quotaAdjustMode.value === 'increase' ? 1 : -1

  if (quotaEditField.value === 'disposable') {
    disposableQuota.value = Math.max(0, disposableQuota.value + amount * factor)
  } else {
    reviewQuota.value = Math.max(0, reviewQuota.value + amount * factor)
  }

  quotaInput.value = ''
  quotaEditField.value = null
}

function onSearchSubmit(): void {
  if (!searchKeyword.value.trim()) {
    return
  }

  showFailToast('玩家查询功能开发中')
}

function switchRange(range: RecordRangeKey): void {
  activeRange.value = range
}

function toggleTypeMenu(): void {
  showTypeMenu.value = !showTypeMenu.value
}

function chooseType(type: string): void {
  selectedRecordType.value = type
  showTypeMenu.value = false
}

function roleClass(role: MemberRole): string {
  if (role === '成员') {
    return 'role-badge--member'
  }

  if (role === '代理人') {
    return 'role-badge--agent'
  }

  return 'role-badge--admin'
}
</script>

<template>
  <div class="club-members-bg">
    <div class="bg-blur bg-blur--pink" aria-hidden="true" />
    <div class="bg-blur bg-blur--cyan" aria-hidden="true" />

    <div class="page-shell club-members">
      <header class="top-bar">
        <button type="button" class="back-btn" @click="goBack">
          <span class="back-icon" aria-hidden="true" />
          <span class="back-title">基金管理</span>
        </button>

        <p class="member-total">会员总数 <span>40/200</span></p>
      </header>

      <nav class="member-tabs" aria-label="基金页签">
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'account' }"
          @click="switchTab('account')"
        >
          账户
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'record' }"
          @click="switchTab('record')"
        >
          记录
        </button>
      </nav>

      <template v-if="activeTab === 'account'">
      <section class="summary-card">
        <div class="summary-grid summary-grid--top">
          <div v-for="item in summaryTop" :key="item.label" class="summary-item">
            <p class="summary-label">{{ item.label }}</p>
            <p class="summary-value">
              <img :src="iconByType(item.icon)" alt="" aria-hidden="true" />
              <span>{{ formatCount(item.value) }}</span>
            </p>
          </div>
        </div>

        <div class="summary-grid summary-grid--bottom">
          <div v-for="item in summaryBottom" :key="item.label" class="summary-item">
            <p class="summary-label">{{ item.label }}</p>
            <p class="summary-value">
              <img :src="iconByType(item.icon)" alt="" aria-hidden="true" />
              <span>{{ formatCount(item.value) }}</span>
            </p>
          </div>

          <button type="button" class="income-btn" @click="onIncomeQuery">
            <span>收益查询</span>
            <span class="income-icon" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section class="search-card">
        <span class="search-icon" aria-hidden="true" />
        <input
          v-model.trim="searchKeyword"
          type="text"
          placeholder="玩家查询"
          @keydown.enter="onSearchSubmit"
        />
      </section>

      <section class="members-list" aria-label="成员列表">
        <article v-for="member in members" :key="member.id" class="member-card">
          <span class="role-badge" :class="roleClass(member.role)">{{ member.role }}</span>

          <div class="member-main">
            <div class="member-left">
              <img class="member-avatar" :src="imgAvatar" :alt="`${member.name}头像`" />
              <div class="member-base">
                <p class="member-name">{{ member.name }}</p>
                <p class="member-id-row">
                  <span class="id-pill">ID</span>
                  <span>{{ member.uid }}</span>
                </p>
              </div>
            </div>

            <p class="member-diamond">
              <img :src="imgDiamond" alt="" aria-hidden="true" />
              <span>{{ member.diamond }}</span>
            </p>
          </div>

          <div class="member-data-strip" @click="openFundSheet(member)">
            <div class="data-item">
              <p class="data-label">
                <img :src="imgChips" alt="" aria-hidden="true" />
                <span>UC</span>
              </p>
              <p class="data-value">{{ member.uc }}</p>
            </div>

            <div class="data-item">
              <p class="data-label">
                <img :src="imgBalance" alt="" aria-hidden="true" />
                <span>免审额</span>
              </p>
              <p class="data-value">{{ member.freeLimit }}</p>
            </div>

            <div class="data-item">
              <p class="data-label data-label--agent">
                <span>所属代理</span>
              </p>
              <p class="data-value">{{ member.agentName }}</p>
            </div>
          </div>
        </article>
      </section>
      </template>

      <template v-else>
      <section class="record-panel">
        <header class="record-head">
          <span>支持查询三个月数据</span>
          <span>时区 UTC+0</span>
        </header>

        <div class="range-tabs">
          <button
            v-for="item in recordRanges"
            :key="item.key"
            type="button"
            class="range-tab"
            :class="{ 'range-tab--active': activeRange === item.key }"
            @click="switchRange(item.key)"
          >
            {{ item.label }}
          </button>
        </div>

        <div class="record-stats">
          <article v-for="stat in recordStats" :key="stat.id" class="record-stat-item">
            <p class="record-stat-label">{{ stat.label }}</p>
            <p class="record-stat-value">{{ stat.value }}</p>
          </article>
        </div>

        <div class="record-table-wrap">
          <div class="record-table-head">
            <button type="button" class="head-cell head-cell--time">
              <span>time</span>
              <span class="tiny-arrow" aria-hidden="true" />
            </button>
            <button type="button" class="head-cell head-cell--type" @click="toggleTypeMenu">
              <span>type</span>
              <span class="tiny-arrow" aria-hidden="true" />
            </button>
            <span class="head-cell">Quantity</span>
            <span class="head-cell">Balance</span>
            <span class="head-cell">Remarks</span>
          </div>

          <div v-if="showTypeMenu" class="type-dropdown">
            <button
              v-for="option in recordTypeOptions"
              :key="option"
              type="button"
              class="type-option"
              :class="{ 'type-option--active': selectedRecordType === option }"
              @click="chooseType(option)"
            >
              {{ option }}
            </button>
          </div>

          <section class="record-list">
            <article v-for="row in filteredRecordRows" :key="row.id" class="record-row">
              <div v-if="row.fromName && row.fromId" class="from-chip">
                <span class="from-label">From</span>
                <span>{{ row.fromName }}</span>
                <span class="from-id-pill">ID</span>
                <span>{{ row.fromId }}</span>
              </div>

              <div class="record-main-grid">
                <p class="time-cell">
                  <span>{{ row.time }}</span>
                  <span class="sub-line">{{ row.date }}</span>
                </p>
                <p class="type-cell">{{ row.type }}</p>
                <p class="quantity-cell">{{ row.quantity }}</p>
                <p class="balance-cell">{{ row.balance }}</p>
                <p class="remark-cell">
                  <span>{{ row.remark }}</span>
                  <span class="sub-line">ID: {{ row.remarkId }}</span>
                </p>
              </div>
            </article>
          </section>
        </div>
      </section>
      </template>

      <div v-if="showFundSheet" class="fund-sheet-mask" @click="closeFundSheet" />

      <section v-if="showFundSheet && activeMember" class="fund-sheet" @click.stop>
        <div class="fund-tabs" role="tablist" aria-label="基金资产类型">
          <button
            type="button"
            class="fund-tab"
            :class="{ 'fund-tab--active': fundAssetTab === 'coin' }"
            @click="switchFundAsset('coin')"
          >
            联盟币
          </button>
          <button
            type="button"
            class="fund-tab"
            :class="{ 'fund-tab--active': fundAssetTab === 'quota' }"
            @click="switchFundAsset('quota')"
          >
            额度
          </button>
          <button
            type="button"
            class="fund-tab"
            :class="{ 'fund-tab--active': fundAssetTab === 'diamond' }"
            @click="switchFundAsset('diamond')"
          >
            钻石
          </button>
        </div>

        <div v-if="fundAssetTab !== 'quota'" class="fund-action-switch">
          <button
            type="button"
            class="action-tab"
            :class="{ 'action-tab--active': fundActionTab === 'grant' }"
            @click="switchFundAction('grant')"
          >
            发放
          </button>
          <button
            type="button"
            class="action-tab"
            :class="{ 'action-tab--active': fundActionTab === 'recycle' }"
            @click="switchFundAction('recycle')"
          >
            回收
          </button>
        </div>

        <div v-if="fundAssetTab === 'quota'" class="quota-body">
          <div class="sheet-row sheet-row--top">
            <p class="sheet-label">用户名</p>
            <p class="sheet-username">
              <span>{{ activeMember.name }}</span>
              <span class="sheet-id-tag">ID</span>
              <span>{{ activeMember.uid }}</span>
            </p>
          </div>

          <div class="sheet-row">
            <div class="quota-group-label">
              <p>可支配额度</p>
              <p>{{ disposableQuota }}</p>
            </div>
            <div class="quota-actions">
              <button type="button" class="quota-action quota-action--primary" @click="editQuota('disposable')">修改</button>
              <button type="button" class="quota-action" @click="resetQuota('disposable')">重置</button>
            </div>
          </div>

          <section v-if="quotaEditField === 'disposable'" class="quota-editor">
            <div class="quota-mode-row">
              <button
                type="button"
                class="quota-mode"
                :class="{ 'quota-mode--active': quotaAdjustMode === 'increase' }"
                @click="quotaAdjustMode = 'increase'"
              >
                增加额度
              </button>
              <button
                type="button"
                class="quota-mode"
                :class="{ 'quota-mode--active': quotaAdjustMode === 'decrease' }"
                @click="quotaAdjustMode = 'decrease'"
              >
                减少额度
              </button>
            </div>
            <div class="quota-input-pill">{{ currentInputText }}</div>
          </section>

          <div class="sheet-row">
            <div class="quota-group-label">
              <p>免审核额度</p>
              <p>{{ reviewQuota }}</p>
            </div>
            <div class="quota-actions">
              <button type="button" class="quota-action quota-action--primary" @click="editQuota('review')">修改</button>
              <button type="button" class="quota-action" @click="resetQuota('review')">重置</button>
            </div>
          </div>

          <section v-if="quotaEditField === 'review'" class="quota-editor">
            <div class="quota-mode-row">
              <button
                type="button"
                class="quota-mode"
                :class="{ 'quota-mode--active': quotaAdjustMode === 'increase' }"
                @click="quotaAdjustMode = 'increase'"
              >
                增加额度
              </button>
              <button
                type="button"
                class="quota-mode"
                :class="{ 'quota-mode--active': quotaAdjustMode === 'decrease' }"
                @click="quotaAdjustMode = 'decrease'"
              >
                减少额度
              </button>
            </div>
            <div class="quota-input-pill">{{ currentInputText }}</div>
          </section>
        </div>

        <div v-else class="sheet-meta">
          <div class="sheet-row sheet-row--top">
            <p class="sheet-label">用户名</p>
            <p class="sheet-username">
              <span>{{ activeMember.name }}</span>
              <span class="sheet-id-tag">ID</span>
              <span>{{ activeMember.uid }}</span>
            </p>
          </div>

          <div class="sheet-row">
            <p class="sheet-label">余额</p>
            <p class="sheet-balance">
              <img :src="fundAssetTab === 'diamond' ? imgDiamond : imgChips" alt="" aria-hidden="true" />
              <span>{{ currentFundBalanceText }}</span>
            </p>
          </div>

          <div class="sheet-row">
            <p class="sheet-label">发放数量</p>
            <p class="sheet-balance">
              <img :src="fundAssetTab === 'diamond' ? imgDiamond : imgChips" alt="" aria-hidden="true" />
              <span :class="{ 'sheet-placeholder': !fundAmountInput }">{{ currentInputText }}</span>
            </p>
          </div>
        </div>

        <div class="fund-keypad">
          <div v-for="(row, rowIndex) in keypadRows" :key="rowIndex" class="fund-keypad-row">
            <button
              v-for="key in row"
              :key="key"
              type="button"
              class="keypad-btn"
              :class="{
                'keypad-btn--accent': key === 'C' || key === 'DEL',
                'keypad-btn--del': key === 'DEL',
              }"
              @click="onKeypadPress(key)"
            >
              <span v-if="key !== 'DEL'">{{ key }}</span>
              <span v-else class="del-icon" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div class="sheet-footer-actions">
          <button type="button" class="sheet-footer-btn" @click="closeFundSheet">取消</button>
          <button type="button" class="sheet-footer-btn sheet-footer-btn--confirm" @click="onFundConfirm">{{ fundSubmitLabel }}</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-members-bg {
  position: relative;
  min-height: 100dvh;
  background:
    radial-gradient(145% 88% at 46% -8%, rgba(219, 155, 140, 0.66), rgba(154, 97, 145, 0.64) 45%, rgba(33, 136, 168, 0.84) 100%),
    linear-gradient(180deg, #ba8d82 0%, #35a6c6 100%);
  overflow: hidden;
}

.bg-blur {
  position: absolute;
  border-radius: 999px;
  filter: blur(1rem);
  opacity: 0.5;
  pointer-events: none;
}

.bg-blur--pink {
  width: 2.8rem;
  height: 2.8rem;
  top: 3.4rem;
  left: -0.9rem;
  background: rgba(221, 50, 131, 0.5);
}

.bg-blur--cyan {
  width: 3rem;
  height: 3rem;
  right: -1.1rem;
  bottom: 2.2rem;
  background: rgba(45, 214, 255, 0.55);
}

.club-members {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
  padding-bottom: calc(0.2rem + env(safe-area-inset-bottom));
  gap: 0.14rem;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 0.7rem;
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
  font-size: 0.4rem;
  line-height: 1;
  font-weight: 500;
}

.member-total {
  margin: 0;
  font-size: 0.29rem;
  line-height: 1;
  color: rgba(243, 243, 243, 0.9);
}

.member-total span {
  color: #f9f9f9;
  font-weight: 700;
}

.member-tabs {
  display: inline-flex;
  align-self: center;
  gap: 0.56rem;
  min-height: 0.42rem;
}

.tab-btn {
  position: relative;
  border: 0;
  background: transparent;
  padding: 0 0.02rem 0.06rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.31rem;
  line-height: 1;
  font-weight: 500;
}

.tab-btn--active {
  color: #f9f9f9;
  font-weight: 700;
}

.tab-btn--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 0.03rem;
  border-radius: 999px;
  background: rgba(234, 234, 234, 0.95);
}

.summary-card {
  padding: 0.16rem 0.18rem;
  border-radius: 0.42rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.16rem);
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.08rem;
}

.summary-grid--bottom {
  align-items: center;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.04rem;
}

.summary-label {
  margin: 0;
  font-size: 0.24rem;
  line-height: 1.2;
  color: #f3f3f3;
}

.summary-value {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.03rem;
  font-size: 0.38rem;
  line-height: 1;
  font-weight: 700;
  color: #f9f9f9;
}

.summary-value img {
  width: 0.28rem;
  height: 0.28rem;
  object-fit: contain;
}

.income-btn {
  min-height: 0.64rem;
  border: 0;
  border-radius: 0.34rem;
  background: rgba(180, 178, 178, 0.18);
  color: #f3f3f3;
  font-size: 0.23rem;
  line-height: 1;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.04rem;
}

.income-icon {
  position: relative;
  width: 0.16rem;
  height: 0.16rem;
  border: 0.02rem solid rgba(243, 243, 243, 0.9);
  border-radius: 0.03rem;
}

.income-icon::after {
  content: '';
  position: absolute;
  left: 0.02rem;
  top: -0.07rem;
  width: 0.07rem;
  height: 0.07rem;
  border: 0.02rem solid rgba(243, 243, 243, 0.9);
  border-bottom: 0;
  border-radius: 0.03rem 0.03rem 0 0;
}

.search-card {
  min-height: 0.78rem;
  padding: 0 0.2rem;
  border-radius: 0.39rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.15rem);
  display: flex;
  align-items: center;
  gap: 0.12rem;
}

.search-icon {
  width: 0.24rem;
  height: 0.24rem;
  border: 0.03rem solid rgba(248, 248, 248, 0.94);
  border-radius: 50%;
  position: relative;
  flex: 0 0 auto;
}

.search-icon::after {
  content: '';
  position: absolute;
  width: 0.12rem;
  height: 0.03rem;
  background: rgba(248, 248, 248, 0.94);
  transform: rotate(45deg);
  transform-origin: left center;
  right: -0.1rem;
  bottom: -0.02rem;
}

.search-card input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 0.34rem;
  line-height: 1;
  color: #fff;
  font-family: inherit;
}

.search-card input::placeholder {
  color: rgba(255, 255, 255, 0.95);
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  padding-bottom: 0.14rem;
}

.record-panel {
  position: relative;
  border-radius: 0.42rem;
  background: rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(0.15rem);
  padding: 0.14rem 0.14rem 0.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-height: 0;
}

.record-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.22rem;
  line-height: 1;
  color: rgba(249, 249, 249, 0.68);
  padding: 0 0.08rem;
}

.range-tabs {
  min-height: 0.78rem;
  border-radius: 0.42rem;
  padding: 0.06rem;
  background: rgba(164, 143, 161, 0.3);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.04rem;
}

.range-tab {
  border: 0;
  border-radius: 0.34rem;
  background: transparent;
  color: #f9f9f9;
  font-size: 0.31rem;
  line-height: 1;
}

.range-tab--active {
  background: rgba(255, 255, 255, 0.24);
}

.record-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.08rem;
  padding: 0 0.02rem;
}

.record-stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.02rem;
}

.record-stat-label {
  margin: 0;
  font-size: 0.25rem;
  color: rgba(249, 249, 249, 0.82);
}

.record-stat-value {
  margin: 0;
  font-size: 0.5rem;
  line-height: 1;
  color: #f9f9f9;
}

.record-table-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
  min-height: 0;
}

.record-table-head {
  min-height: 0.5rem;
  border-radius: 0.25rem;
  background: linear-gradient(180deg, #23ddad 0%, #02b487 100%);
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr 1.2fr;
  align-items: center;
  padding: 0 0.14rem;
  color: #f9f9f9;
  font-size: 0.22rem;
  line-height: 1;
  font-weight: 500;
}

.head-cell {
  border: 0;
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: inherit;
  line-height: inherit;
  display: inline-flex;
  align-items: center;
  gap: 0.04rem;
}

.tiny-arrow {
  width: 0.09rem;
  height: 0.09rem;
  border-left: 0.02rem solid rgba(249, 249, 249, 0.85);
  border-bottom: 0.02rem solid rgba(249, 249, 249, 0.85);
  transform: rotate(-45deg);
}

.type-dropdown {
  position: absolute;
  top: 0.58rem;
  left: 0.08rem;
  width: 1.52rem;
  max-height: 6.8rem;
  overflow: auto;
  border-radius: 0.16rem;
  padding: 0.08rem 0.14rem;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(0.12rem);
  z-index: 5;
}

.type-option {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0.06rem 0;
  text-align: left;
  color: rgba(249, 249, 249, 0.92);
  font-size: 0.22rem;
  line-height: 1.3;
  border-bottom: 0.01rem solid rgba(255, 255, 255, 0.2);
}

.type-option:last-child {
  border-bottom: 0;
}

.type-option--active {
  color: #fff;
  font-weight: 700;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
  max-height: 8.1rem;
  overflow: auto;
  padding-right: 0.02rem;
}

.record-row {
  border-radius: 0.24rem;
  background: rgba(0, 0, 0, 0.22);
  padding: 0.06rem 0.12rem;
  display: flex;
  flex-direction: column;
  gap: 0.03rem;
}

.from-chip {
  align-self: flex-start;
  border-radius: 0.2rem;
  background: rgba(5, 231, 174, 0.2);
  padding: 0.04rem 0.1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.04rem;
  color: rgba(249, 249, 249, 0.75);
  font-size: 0.17rem;
}

.from-label {
  opacity: 0.7;
}

.from-id-pill {
  border-radius: 0.06rem;
  background: rgba(255, 255, 255, 0.3);
  padding: 0 0.05rem;
  color: #fff;
}

.record-main-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr 1.2fr;
  align-items: center;
  gap: 0.04rem;
  color: #fff;
}

.record-main-grid p {
  margin: 0;
  font-size: 0.2rem;
  line-height: 1.15;
}

.time-cell,
.remark-cell {
  display: flex;
  flex-direction: column;
  gap: 0.01rem;
}

.sub-line {
  font-size: 0.17rem;
  color: rgba(249, 249, 249, 0.55);
}

.quantity-cell {
  border-radius: 0.2rem;
  background: rgba(255, 255, 255, 0.15);
  min-height: 0.34rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.06rem;
}

.member-card {
  position: relative;
  padding: 0.12rem 0.16rem 0.12rem;
  border-radius: 0.4rem;
  background:
    radial-gradient(78% 88% at 12% 34%, rgba(188, 117, 151, 0.5), rgba(188, 117, 151, 0)),
    radial-gradient(94% 88% at 92% 74%, rgba(47, 161, 212, 0.46), rgba(47, 161, 212, 0)),
    rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(0.14rem);
}

.role-badge {
  position: absolute;
  top: -0.1rem;
  left: 0.02rem;
  padding: 0 0.1rem;
  min-height: 0.3rem;
  border-radius: 0.15rem;
  display: inline-flex;
  align-items: center;
  font-size: 0.2rem;
  font-weight: 600;
  color: #fff;
  box-shadow: 0 0.02rem 0.06rem rgba(0, 0, 0, 0.25);
}

.role-badge--admin {
  background: linear-gradient(152deg, #05e7ae 8%, #027a5c 72%);
}

.role-badge--agent {
  background: linear-gradient(152deg, #05e7ae 8%, #027a5c 72%);
}

.role-badge--member {
  background: linear-gradient(152deg, #15d39f 8%, #017157 72%);
}

.member-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.16rem;
}

.member-left {
  display: inline-flex;
  align-items: center;
  gap: 0.12rem;
  min-width: 0;
}

.member-avatar {
  width: 0.78rem;
  height: 0.78rem;
  border-radius: 999px;
  object-fit: cover;
}

.member-base {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
  min-width: 0;
}

.member-name {
  margin: 0;
  font-size: 0.3rem;
  line-height: 1;
  font-weight: 700;
  color: #fff;
}

.member-id-row {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.05rem;
  font-size: 0.22rem;
  line-height: 1;
  color: rgba(249, 249, 249, 0.92);
}

.id-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0.26rem;
  height: 0.18rem;
  border-radius: 0.05rem;
  font-size: 0.14rem;
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.member-diamond {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.07rem;
  font-size: 0.3rem;
  line-height: 1;
  font-weight: 700;
  color: #fff;
}

.member-diamond img {
  width: 0.3rem;
  height: 0.24rem;
  object-fit: contain;
}

.member-data-strip {
  margin-top: 0.08rem;
  padding: 0.08rem 0.2rem;
  border-radius: 0.5rem;
  background: rgba(34, 34, 34, 0.62);
  backdrop-filter: blur(0.3rem);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.14rem;
  cursor: pointer;
}

.fund-sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(12, 12, 12, 0.6);
  z-index: 40;
}

.fund-sheet {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(100%, 10rem);
  border-radius: 0.844rem 0.844rem 0 0;
  padding: 0.643rem 0.532rem calc(0.547rem + env(safe-area-inset-bottom));
  background: linear-gradient(90deg, rgba(0, 8, 20, 0.95) 0%, rgba(5, 5, 5, 0.95) 52%, rgba(0, 8, 20, 0.95) 100%);
  box-shadow: 0 -0.16rem 0.53rem rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 0.434rem;
  z-index: 41;
}

.fund-tabs {
  display: flex;
  justify-content: center;
  gap: 1.285rem;
}

.fund-tab {
  border: 0;
  background: transparent;
  color: rgba(249, 249, 249, 0.7);
  font-size: 0.379rem;
  padding: 0;
  line-height: 0.95;
}

.fund-tab--active {
  color: #f9f9f9;
  border-bottom: 0.034rem solid #f9f9f9;
}

.fund-action-switch {
  align-self: center;
  width: 8.088rem;
  min-height: 1.357rem;
  border-radius: 4.223rem;
  background: rgba(255, 255, 255, 0.2);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 0.095rem;
}

.action-tab {
  border: 0;
  border-radius: 4.223rem;
  background: transparent;
  color: #f9f9f9;
  font-size: 0.405rem;
}

.action-tab--active {
  border: 0.005rem solid rgba(249, 249, 249, 0.85);
  background: rgba(255, 255, 255, 0.2);
}

.sheet-meta,
.quota-body {
  display: flex;
  flex-direction: column;
  gap: 0.337rem;
}

.sheet-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.24rem;
}

.sheet-row--top {
  margin-top: 0.05rem;
}

.sheet-label {
  margin: 0;
  color: rgba(249, 249, 249, 0.7);
  font-size: 0.432rem;
}

.sheet-username,
.sheet-balance {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.12rem;
  color: #f9f9f9;
  font-size: 0.434rem;
  font-weight: 500;
}

.sheet-id-tag {
  min-width: 0.72rem;
  height: 0.56rem;
  border-radius: 0.204rem;
  padding: 0 0.238rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.4);
  font-size: 0.393rem;
}

.sheet-balance img {
  width: 0.533rem;
  height: 0.533rem;
  object-fit: contain;
}

.sheet-placeholder {
  color: rgba(249, 249, 249, 0.85);
}

.quota-group-label {
  margin: 0;
  color: rgba(249, 249, 249, 0.7);
  font-size: 0.432rem;
  line-height: 1.35;
}

.quota-group-label p {
  margin: 0;
}

.quota-actions {
  display: inline-flex;
  gap: 0.225rem;
}

.quota-action {
  min-width: 1.895rem;
  height: 0.851rem;
  border: 0;
  border-radius: 4.016rem;
  padding: 0 0.422rem;
  background: rgba(6, 6, 6, 0.45);
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.322rem;
}

.quota-action--primary {
  background: rgba(5, 231, 174, 0.4);
  color: #fff;
}

.quota-editor {
  border-radius: 0.44rem;
  padding: 0.28rem;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.quota-mode-row {
  display: flex;
  align-items: center;
  gap: 0.28rem;
}

.quota-mode {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.317rem;
  display: inline-flex;
  align-items: center;
  gap: 0.079rem;
}

.quota-mode::before {
  content: '';
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  border: 0.03rem solid rgba(255, 255, 255, 0.5);
  box-sizing: border-box;
}

.quota-mode--active {
  color: #fff;
}

.quota-mode--active::before {
  border-color: rgba(95, 247, 209, 0.92);
  box-shadow: inset 0 0 0 0.1rem rgba(95, 247, 209, 0.85);
}

.quota-input-pill {
  min-height: 1.027rem;
  border-radius: 0.685rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0 0.347rem;
  display: flex;
  align-items: center;
  color: rgba(249, 249, 249, 0.95);
  font-size: 0.325rem;
}

.fund-keypad {
  display: flex;
  flex-direction: column;
  gap: 0.206rem;
}

.fund-keypad-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.153rem;
}

.keypad-btn {
  min-height: 1.354rem;
  border: 0.019rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.377rem;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 0.61rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.keypad-btn--accent {
  background: rgba(4, 209, 157, 0.26);
  border-color: transparent;
}

.keypad-btn--del {
  font-size: 0.533rem;
}

.del-icon {
  width: 0.86rem;
  height: 0.562rem;
  border: 0.049rem solid rgba(255, 255, 255, 0.92);
  border-left: 0;
  border-radius: 0.113rem;
  position: relative;
}

.del-icon::before {
  content: '';
  position: absolute;
  left: -0.3rem;
  top: 50%;
  width: 0.3rem;
  height: 0.3rem;
  transform: translateY(-50%) rotate(45deg);
  border-top: 0.049rem solid rgba(255, 255, 255, 0.92);
  border-left: 0.049rem solid rgba(255, 255, 255, 0.92);
}

.del-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 0.22rem;
  height: 0.22rem;
  border-top: 0.045rem solid rgba(255, 255, 255, 0.92);
  border-right: 0.045rem solid rgba(255, 255, 255, 0.92);
  transform: rotate(135deg);
}

.sheet-footer-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.253rem;
}

.sheet-footer-btn {
  min-height: 1.436rem;
  border: 0;
  border-radius: 1.056rem;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 0.4rem;
}

.sheet-footer-btn--confirm {
  border: 0.013rem solid rgba(242, 242, 242, 0.8);
  background: linear-gradient(156deg, #05e7ae 8%, #027a5c 72%);
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
}

.data-label,
.data-value {
  margin: 0;
  font-size: 0.2rem;
  line-height: 1.1;
  color: #fff;
}

.data-label {
  opacity: 0.7;
  display: inline-flex;
  align-items: center;
  gap: 0.03rem;
}

.data-label img {
  width: 0.16rem;
  height: 0.16rem;
  object-fit: contain;
}

.data-value {
  font-weight: 500;
  white-space: nowrap;
}

.data-label--agent::before {
  content: '';
  width: 0.13rem;
  height: 0.13rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  flex: 0 0 auto;
}

@media (max-width: 340px) {
  .back-title {
    font-size: 0.34rem;
  }

  .member-total {
    font-size: 0.24rem;
  }

  .tab-btn {
    font-size: 0.27rem;
  }

  .summary-value {
    font-size: 0.3rem;
  }

  .member-name {
    font-size: 0.28rem;
  }

  .record-stat-value {
    font-size: 0.42rem;
  }

  .record-main-grid p {
    font-size: 0.18rem;
  }
}
</style>
