<script setup lang="ts">
import hunterIcon from '@/assets/icons/icon_mtt_hunter.png'

/* ===== 赛况数据（mock，后续对接接口） ===== */
const matchStatus = {
  state: 'running',
  stateLabel: '运行',
  startTime: '12:34',
  buyIn: 12345,
  prizePool: 509,
  championPrize: 36570,
  unbrokenGuarantee: 8457,
  nextPrize: 650,
  level: 10,
  levelTimeLeft: '01:23',
  nextBreak: '36:17',
  blinds: '150 / 300 (35)',
  nextBlinds: '150 / 300 (35)',
  remainingPlayers: '46/509',
  rebuyCount: '5/100(15)',
  moneyBubble: '20,000',
  myRank: '6/120',
  highestChips: 23925,
  highestChipsBB: '3.7BB',
  avgChips: 23925,
  avgChipsBB: '3.7BB',
  lowestChips: 23925,
  lowestChipsBB: '3.7BB',
  initialChips: 23925,
  initialChipsBB: '3.7BB',
}

const activityDesc =
  'xxxxxxx这是MTT赛事活动详情简介 xxxxxxxxxxxxxxxx xxxxxxxxxxxxxxxxxxxx xxxxxxxx xxxxxxxxxx xx x x x x x            xxxxxxxxxxxxxxxxxxx'

/* ===== 赛事信息（mock，后续对接接口） ===== */
const matchInfo = [
  { label: '赛事名称', value: 'MTT福利赛 赢大奖 送手机' },
  { label: '比赛类型', value: '无限注德州扑克' },
  { label: '游戏类型', value: '猎人赛', icon: hunterIcon },
  { label: '开始时间', value: '十一月14,2025-19:30' },
  { label: '买入', value: '88+88+88' },
  { label: '买入上限', value: '12,345', tip: true },
  { label: '重购', value: '10' },
  { label: '保底奖池', value: '200,000' },
  { label: '起始筹码', value: '10,000 (33.3BB)' },
  { label: '延迟报名', value: '02月09日  19:37 (级别7)' },
  { label: '预计赛程时长', value: '7小时32分钟' },
  { label: '盲注间距', value: '10分钟' },
  { label: '牌桌类型', value: '9人桌' },
  { label: '最少/最多玩家', value: '2~10000' },
  { label: '开赛条件', value: '6,000(120 BB)' },
  { label: '休息时间', value: '每55分钟~6分钟' },
]
</script>

<template>
  <div class="mtt-status-tab">
    <!-- 状态卡片 -->
    <div class="status-card">
      <div class="status-badge">{{ matchStatus.stateLabel }}</div>
      <div class="status-meta">
        <div class="meta-row">
          <span class="meta-label">开赛时间:</span>
          <span class="meta-value">{{ matchStatus.startTime }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">买入:</span>
          <div class="meta-value-with-icon">
            <img :src="hunterIcon" class="meta-icon" alt="coin" />
            <span>{{ matchStatus.buyIn }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据统计面板 -->
    <div class="stats-panel">
      <div class="stats-grid">
        <!-- 左列 -->
        <div class="stats-col">
          <div class="stat-item">
            <div class="stat-label">总奖金</div>
            <div class="stat-value">{{ matchStatus.prizePool }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">冠军</div>
            <div class="stat-value">{{ matchStatus.championPrize }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">未破保金额</div>
            <div class="stat-value">{{ matchStatus.unbrokenGuarantee }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">下一级奖金</div>
            <div class="stat-value">{{ matchStatus.nextPrize }}</div>
          </div>
        </div>

        <!-- 中列 -->
        <div class="stats-col stats-col--center">
          <div class="level-card">
            <div class="level-label">级别 {{ matchStatus.level }}</div>
            <div class="level-timer">{{ matchStatus.levelTimeLeft }}</div>
            <div class="level-break">下一次休息 {{ matchStatus.nextBreak }}</div>
          </div>
          <div class="blind-info">
            <div class="blind-row">
              <div class="blind-label">盲注</div>
              <div class="blind-value">{{ matchStatus.blinds }}</div>
            </div>
            <div class="blind-row">
              <div class="blind-label">下-级</div>
              <div class="blind-value">{{ matchStatus.nextBlinds }}</div>
            </div>
          </div>
        </div>

        <!-- 右列 -->
        <div class="stats-col">
          <div class="stat-item">
            <div class="stat-label">剩余玩家</div>
            <div class="stat-value">{{ matchStatus.remainingPlayers }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">买入/重购</div>
            <div class="stat-value">{{ matchStatus.rebuyCount }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">钱圈名额</div>
            <div class="stat-value">{{ matchStatus.moneyBubble }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">我的排名</div>
            <div class="stat-value">{{ matchStatus.myRank }}</div>
          </div>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="stats-divider">
        <img :src="hunterIcon" class="divider-icon" alt="divider" />
      </div>

      <!-- 筹码统计 -->
      <div class="chips-row">
        <div class="chip-item">
          <div class="chip-label">最高筹码</div>
          <div class="chip-value">{{ matchStatus.highestChips.toLocaleString() }}</div>
          <div class="chip-bb">（{{ matchStatus.highestChipsBB }}）</div>
        </div>
        <div class="chip-item">
          <div class="chip-label">平均筹码</div>
          <div class="chip-value">{{ matchStatus.avgChips.toLocaleString() }}</div>
          <div class="chip-bb">（{{ matchStatus.avgChipsBB }}）</div>
        </div>
        <div class="chip-item">
          <div class="chip-label">最低筹码</div>
          <div class="chip-value">{{ matchStatus.lowestChips.toLocaleString() }}</div>
          <div class="chip-bb">（{{ matchStatus.lowestChipsBB }}）</div>
        </div>
        <div class="chip-item">
          <div class="chip-label">初始筹码</div>
          <div class="chip-value">{{ matchStatus.initialChips.toLocaleString() }}</div>
          <div class="chip-bb">（{{ matchStatus.initialChipsBB }}）</div>
        </div>
      </div>
    </div>

    <!-- 活动详情 -->
    <div class="activity-section">
      <div class="section-title">活动详情</div>
      <div class="activity-card">
        <p class="activity-text">{{ activityDesc }}</p>
      </div>
    </div>

    <!-- 赛事信息 -->
    <div class="info-section">
      <div v-for="(item, index) in matchInfo" :key="index" class="info-row">
        <div class="info-label">
          {{ item.label }}
          <VanIcon v-if="item.tip" name="question-o" class="info-tip" />
        </div>
        <div class="info-value">
          <img v-if="item.icon" :src="item.icon" class="info-icon" alt="icon" />
          <span>{{ item.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mtt-status-tab {
  display: flex;
  flex-direction: column;
}

/* ===== 状态卡片 ===== */
.status-card {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.22rem 0.27rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.66rem;
  box-shadow: 0 -0.21rem 0.54rem rgba(10, 184, 247, 0.54) inset;
  margin-bottom: 0.3rem;
}

.status-badge {
  width: 2.05rem;
  height: 1.68rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0ab8f7;
  border-radius: 0.43rem;
  font-size: 0.36rem;
  font-weight: 600;
  color: #fff;
  box-shadow: 0.03rem 0.04rem 0.07rem rgba(0, 0, 0, 0.18);
  flex-shrink: 0;
}

.status-meta {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.39rem;
  font-family: 'HONOR Sans CN', sans-serif;
}

.meta-label {
  color: #fff;
  font-weight: 400;
}

.meta-value {
  color: #fff;
  font-weight: 400;
}

.meta-value-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  color: #fff;
}

.meta-icon {
  width: 0.5rem;
  height: 0.5rem;
  object-fit: contain;
}

/* ===== 数据统计面板 ===== */
.stats-panel {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.77rem;
  padding: 0.37rem 0.45rem;
  margin-bottom: 0.3rem;
}

.stats-grid {
  display: flex;
  justify-content: space-between;
  gap: 0.3rem;
}

.stats-col {
  display: flex;
  flex-direction: column;
  gap: 0.48rem;
  flex: 1;
}

.stats-col--center {
  flex: 1.4;
  align-items: center;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.28rem;
  color: #fcfcfc;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  margin-bottom: 0.12rem;
}

.stat-value {
  font-size: 0.39rem;
  color: #fff;
  font-weight: 600;
  font-family: 'HONOR Sans CN', sans-serif;
}

/* 级别卡片 */
.level-card {
  width: 100%;
  background: linear-gradient(158deg, rgba(255, 255, 255, 0.1) 0%, rgba(230, 230, 230, 0.1) 100%);
  border-radius: 0.77rem;
  padding: 0.2rem 0.15rem 0.15rem;
  text-align: center;
  margin-bottom: 0.2rem;
}

.level-label {
  font-size: 0.28rem;
  color: #fcfcfc;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
}

.level-timer {
  font-size: 1.1rem;
  color: #fff;
  font-weight: 400;
  font-family: 'Keania One', 'HONOR Sans CN', sans-serif;
  line-height: 1.2;
  margin: 0.1rem 0;
}

.level-break {
  font-size: 0.25rem;
  color: #fcfcfc;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
}

/* 盲注信息 */
.blind-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.blind-row {
  text-align: center;
}

.blind-label {
  font-size: 0.28rem;
  color: #fcfcfc;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  margin-bottom: 0.12rem;
}

.blind-value {
  font-size: 0.39rem;
  color: #fff;
  font-weight: 600;
  font-family: 'HONOR Sans CN', sans-serif;
}

/* 分隔线 */
.stats-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.3rem 0;
  position: relative;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
  }
}

.divider-icon {
  width: 0.5rem;
  height: 0.5rem;
  margin: 0 0.2rem;
  object-fit: contain;
}

/* 筹码统计 */
.chips-row {
  display: flex;
  justify-content: space-between;
  gap: 0.2rem;
}

.chip-item {
  flex: 1;
  text-align: center;
}

.chip-label {
  font-size: 0.28rem;
  color: #fcfcfc;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  margin-bottom: 0.12rem;
}

.chip-value {
  font-size: 0.39rem;
  color: #fefefe;
  font-weight: 600;
  font-family: 'HONOR Sans CN', sans-serif;
}

.chip-bb {
  font-size: 0.24rem;
  color: #b6b6b6;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  margin-top: 0.08rem;
}

/* ===== 活动详情 ===== */
.activity-section {
  margin-bottom: 0.3rem;
}

.section-title {
  font-size: 0.38rem;
  font-weight: 600;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
  margin-bottom: 0.2rem;
  padding-left: 0.15rem;
}

.activity-card {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.52rem;
  padding: 0.25rem 0.4rem;
}

.activity-text {
  font-size: 0.33rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  line-height: 1.5;
  word-break: break-all;
}

/* ===== 赛事信息 ===== */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.18rem 0.45rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.77rem;
  min-height: 0.72rem;
}

.info-label {
  font-size: 0.33rem;
  color: #ebebeb;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
}

.info-tip {
  font-size: 0.3rem;
  color: #ebebeb;
  opacity: 0.7;
}

.info-value {
  font-size: 0.33rem;
  color: #fff;
  font-weight: 400;
  font-family: 'HONOR Sans CN', sans-serif;
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
}

.info-icon {
  width: 0.38rem;
  height: 0.38rem;
  object-fit: contain;
}
</style>
