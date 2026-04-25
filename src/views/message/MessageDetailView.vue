<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import avatarDefault from '@/assets/images/default_avatar.png'
import iconPeople from '@/assets/icons/icon_people.png'
import iconBalance from '@/assets/icons/icon_balance.png'

type MessagePageType = 'system' | 'credit' | 'uc' | 'other'
type CreditStatus = 'pending' | 'rejected' | 'approved-by-user' | 'approved'

interface SystemMessageItem {
  content: string
  time: string
}

interface CreditMessageItem {
  texasId?: string
  clubName: string
  time: string
  playerName: string
  playerId: string
  amount: string
  status: CreditStatus
  approverName?: string
  approverId?: string
}

interface UcMessageItem {
  clubName: string
  time: string
  playerName: string
  playerId: string
  amount: string
}

interface OtherMessageItem {
  text: string
  highlight?: string
  highlightTone?: 'red' | 'green'
  clubName: string
  time: string
  wrap?: boolean
}

const router = useRouter()
const route = useRoute()

const otherBannerBgFirst = 'https://www.figma.com/api/mcp/asset/694b9873-5869-4789-991f-f75c25a01cad'
const otherBannerBgDefault = 'https://www.figma.com/api/mcp/asset/45489388-e515-41a2-8eff-d3e4af9dfc89'
const otherSenderBtnBg = 'https://www.figma.com/api/mcp/asset/e9e9ef1e-fa31-4411-b2e1-7a28ec807433'

const pageType = computed<MessagePageType>(() => {
  const type = route.query.type
  if (type === 'system' || type === 'credit' || type === 'uc' || type === 'other') {
    return type
  }
  return 'other'
})

const pageTitle = computed(() => {
  const titleFromQuery = route.query.title
  if (typeof titleFromQuery === 'string' && titleFromQuery.trim()) return titleFromQuery

  if (pageType.value === 'system') return '系统消息'
  if (pageType.value === 'credit') return '买入申请'
  if (pageType.value === 'uc') return 'UC申请'
  return '消息'
})

const systemMessages: SystemMessageItem[] = [
  {
    content:
      '这是平台广播系统消息内容 这是平台广播系统消息内容 这是平台广播系统消息内容 这是平台广播系统消息内容 这是平台广播系统消息内容 这是平台广播系统消息内容',
    time: '3/1/2024 15:00',
  },
  {
    content: '这是平台广播系统消息内容',
    time: '3/1/2024 15:00',
  },
]

const creditMessages: CreditMessageItem[] = [
  {
    texasId: '德州 ID: 554dd4f5',
    clubName: '俱乐部名称',
    time: '2026/4/12 15:35:00',
    playerName: 'Player Name',
    playerId: '12345678',
    amount: '+2,000',
    status: 'pending',
  },
  {
    texasId: '德州 ID: 554dd4f5',
    clubName: '俱乐部名称',
    time: '2026/4/12 15:35:00',
    playerName: 'Player Name',
    playerId: '12345678',
    amount: '+2,000',
    status: 'rejected',
  },
  {
    texasId: '德州 ID: 554dd4f5',
    clubName: '俱乐部名称',
    time: '2026/4/12 15:35:00',
    playerName: 'Player Name',
    playerId: '12345678',
    amount: '+2,000',
    status: 'approved-by-user',
    approverName: 'User12',
    approverId: '1245454',
  },
  {
    texasId: '德州 ID: 554dd4f5',
    clubName: '俱乐部名称',
    time: '2026/4/12 15:35:00',
    playerName: 'Player Name',
    playerId: '12345678',
    amount: '+2,000',
    status: 'approved',
  },
]

const ucMessages: UcMessageItem[] = [
  {
    clubName: 'xx俱乐部',
    time: '2026/4/12 15:35:00',
    playerName: 'Player Name',
    playerId: '12345678',
    amount: '+2000',
  },
  {
    clubName: 'xx俱乐部',
    time: '2026/4/12 15:35:00',
    playerName: 'Player Name',
    playerId: '12345678',
    amount: '+2000',
  },
  {
    clubName: 'xx俱乐部',
    time: '2026/4/12 15:35:00',
    playerName: 'Player Name',
    playerId: '12345678',
    amount: '+2000',
  },
]

const otherMessages: OtherMessageItem[] = [
  {
    text: '恭喜成功充值',
    highlight: '2000 UC！',
    highlightTone: 'red',
    clubName: '俱乐部名称',
    time: '3/1/2024 15:00',
  },
  {
    text: '恭喜获得',
    highlight: '1000信用值！',
    highlightTone: 'green',
    clubName: '俱乐部名称',
    time: '3/1/2024 15:00',
  },
  {
    text: '恭喜获得俱乐部赛事奖励',
    highlight: '3000钻石',
    highlightTone: 'green',
    clubName: '俱乐部名称',
    time: '3/1/2024 15:00',
  },
  {
    text: '恭喜加入俱乐部名称',
    clubName: '俱乐部名称',
    time: '3/1/2024 15:00',
  },
  {
    text: '恭喜您在赏金猎人赛排名第2，获得决赛门票x4。',
    clubName: '俱乐部名称',
    time: '3/1/2024 15:00',
    wrap: true,
  },
  {
    text: '欢迎加入xx联盟',
    clubName: '联盟名称',
    time: '3/1/2024 15:00',
    wrap: true,
  },
]

function backToMessage(): void {
  void router.push('/message')
}
</script>

<template>
  <div class="message-detail-page">
    <header class="message-head">
      <button class="back-btn" type="button" @click="backToMessage">‹</button>
      <h1>{{ pageTitle }}</h1>
      <div class="placeholder" />
    </header>

    <section v-if="pageType === 'system'" class="system-list">
      <article v-for="item in systemMessages" :key="`${item.content}-${item.time}`" class="system-card">
        <p class="system-content">{{ item.content }}</p>
        <p class="system-time">{{ item.time }}</p>
      </article>
    </section>

    <section v-else-if="pageType === 'credit'" class="request-list">
      <article v-for="(item, index) in creditMessages" :key="`credit-${index}`" class="request-card">
        <div class="request-top request-top--credit">
          <p class="meta-left">{{ item.texasId }}</p>
          <p class="meta-time">{{ item.time }}</p>
          <div class="meta-club">
            <img :src="avatarDefault" alt="club" />
            <span>{{ item.clubName }}</span>
          </div>
        </div>

        <div class="request-body" :class="[`status-${item.status}`]">
          <div class="player-block">
            <img class="player-avatar" :src="avatarDefault" alt="avatar" />
            <div class="player-text">
              <p class="player-name">{{ item.playerName }}</p>
              <p class="player-id">ID: {{ item.playerId }}</p>
            </div>
          </div>

          <div v-if="item.status === 'pending'" class="pending-actions">
            <button class="action-btn action-btn--ok" type="button">✓</button>
            <button class="action-btn action-btn--deny" type="button">✕</button>
          </div>

          <p v-else-if="item.status === 'rejected'" class="state-text">已拒绝</p>

          <div v-else-if="item.status === 'approved-by-user'" class="approver-block">
            <p class="approver-line">{{ item.approverName }}</p>
            <p class="approver-line">ID: {{ item.approverId }}</p>
            <p class="state-text">已通过</p>
          </div>

          <p v-else class="state-text">已通过</p>
        </div>

        <div class="request-footer">
          <img :src="iconBalance" alt="balance" />
          <p>买入申请：{{ item.amount }}</p>
        </div>
      </article>
    </section>

    <section v-else-if="pageType === 'uc'" class="request-list">
      <article v-for="(item, index) in ucMessages" :key="`uc-${index}`" class="request-card">
        <div class="request-top">
          <div class="meta-club meta-club--lead">
            <img :src="avatarDefault" alt="club" />
            <span>{{ item.clubName }}</span>
          </div>
          <p class="meta-time">{{ item.time }}</p>
        </div>

        <div class="request-body status-pending">
          <div class="player-block">
            <img class="player-avatar" :src="avatarDefault" alt="avatar" />
            <div class="player-text">
              <p class="player-name">{{ item.playerName }}</p>
              <p class="player-id">ID: {{ item.playerId }}</p>
            </div>
          </div>

          <div class="pending-actions">
            <button class="action-btn action-btn--ok" type="button">✓</button>
            <button class="action-btn action-btn--deny" type="button">✕</button>
          </div>
        </div>

        <div class="request-footer request-footer--uc">
          <img :src="iconPeople" alt="uc" />
          <p>申请充值：{{ item.amount }}</p>
        </div>
      </article>
    </section>

    <section v-else class="other-list">
      <article v-for="(item, index) in otherMessages" :key="`other-${index}`" class="other-item" :class="{ 'other-item--first': index === 0 }">
        <div class="other-banner" :class="{ 'other-banner--wrap': item.wrap }">
          <img
            class="other-banner-bg"
            :src="index === 0 ? otherBannerBgFirst : otherBannerBgDefault"
            alt=""
            aria-hidden="true"
          />
          <p class="other-title" :class="{ 'other-title--wrap': item.wrap }">
            {{ item.text }}
            <span v-if="item.highlight" class="highlight" :class="`highlight--${item.highlightTone ?? 'green'}`">{{ item.highlight }}</span>
          </p>

        <button class="sender-btn" type="button" aria-label="sender">
          <img :src="otherSenderBtnBg" alt="sender" />
        </button>
        </div>

        <div class="other-meta-row">
          <div class="other-meta-club">
            <img :src="avatarDefault" alt="club" />
            <span>{{ item.clubName }}</span>
          </div>
          <p class="other-time">{{ item.time }}</p>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped lang="scss">
.message-detail-page {
  min-height: 100dvh;
  color: #f3f3f3;
  padding: calc(env(safe-area-inset-top) + 0.46rem) 0.456rem calc(env(safe-area-inset-bottom) + 0.7rem);
  background:
    radial-gradient(60% 42% at 20% 10%, rgba(226, 163, 133, 0.6) 0%, rgba(226, 163, 133, 0) 100%),
    radial-gradient(55% 45% at 25% 85%, rgba(206, 107, 160, 0.6) 0%, rgba(206, 107, 160, 0) 100%),
    radial-gradient(45% 38% at 88% 84%, rgba(0, 183, 212, 0.58) 0%, rgba(0, 183, 212, 0) 100%),
    linear-gradient(160deg, #b58eb1 0%, #8d668d 54%, #6f5988 100%);
  box-sizing: border-box;
}

.message-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 {
    margin: 0;
    font-size: 0.65rem;
    font-weight: 500;
    line-height: 1.2;
    color: #fff;
    text-shadow: 0 0.22rem 0.5rem rgba(0, 0, 0, 0.35);
  }
}

.back-btn {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.7rem;
  line-height: 1;
  padding: 0.04rem 0.1rem;
}

.placeholder {
  width: 0.72rem;
}

.system-list,
.request-list,
.other-list {
  margin-top: 0.56rem;
  display: flex;
  flex-direction: column;
}

.system-list {
  gap: 0.293rem;
}

.system-card {
  min-height: 4.578rem;
  border-radius: 0.74rem;
  border: 0.02rem solid rgba(255, 255, 255, 0.28);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.12rem);
  padding: 0.8rem 0.72rem 0.7rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.system-content {
  margin: 0;
  font-size: 0.384rem;
  line-height: 1.4;
  font-weight: 600;
  color: #fff;
}

.system-time {
  margin: 0.24rem 0 0;
  font-size: 0.333rem;
  color: #fff;
}

.request-list {
  gap: 0.24rem;
}

.request-card {
  border-radius: 0.738rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.16rem);
  padding: 0.32rem 0.304rem 0.304rem;
}

.request-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.2rem;
}

.request-top--credit {
  .meta-time {
    flex: 1;
    text-align: center;
  }
}

.meta-left,
.meta-time,
.meta-club span {
  margin: 0;
  font-size: 0.27rem;
  line-height: 1.4;
  color: #f3f3f3;
}

.meta-time {
  opacity: 0.95;
  white-space: nowrap;
}

.meta-club {
  display: inline-flex;
  align-items: center;
  gap: 0.11rem;

  img {
    width: 0.48rem;
    height: 0.48rem;
    border-radius: 50%;
    object-fit: cover;
  }
}

.meta-club--lead {
  span {
    font-size: 0.27rem;
  }
}

.request-body {
  margin-top: 0.32rem;
  border-radius: 4.223rem;
  min-height: 1.499rem;
  padding: 0 0.28rem 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.14);
}

.status-rejected {
  background: rgba(255, 19, 43, 0.4);
}

.status-approved-by-user,
.status-approved {
  background: rgba(5, 231, 174, 0.3);
}

.player-block {
  display: inline-flex;
  align-items: center;
  gap: 0.213rem;
}

.player-avatar {
  width: 1.49rem;
  height: 1.5rem;
  border-radius: 50%;
  object-fit: cover;
}

.player-text {
  display: flex;
  flex-direction: column;
}

.player-name {
  margin: 0;
  font-size: 0.44rem;
  line-height: 1.1;
  color: #f3f3f3;
}

.player-id {
  margin: 0.08rem 0 0;
  font-size: 0.304rem;
  line-height: 1;
  color: rgba(243, 243, 243, 0.5);
}

.pending-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.action-btn {
  width: 0.97rem;
  height: 0.97rem;
  border-radius: 50%;
  border: 0.013rem solid #fff;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 0.52rem;
  line-height: 1;
  padding: 0;
}

.action-btn--ok {
  color: #f3f3f3;
}

.action-btn--deny {
  color: #ff3048;
}

.state-text {
  margin: 0;
  font-size: 0.312rem;
  font-weight: 500;
  color: #fff;
}

.approver-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.08rem;
}

.approver-line {
  margin: 0;
  font-size: 0.26rem;
  line-height: 1;
  color: #fff;
}

.request-footer {
  margin-top: 0.31rem;
  padding-left: 0.345rem;
  display: inline-flex;
  align-items: center;
  gap: 0.27rem;

  img {
    width: 0.33rem;
    height: 0.33rem;
  }

  p {
    margin: 0;
    font-size: 0.355rem;
    line-height: 1.2;
    color: #f9f9f9;
  }
}

.request-footer--uc img {
  width: 0.72rem;
  height: 0.72rem;
}

.other-list {
  gap: 0.262rem;
}

.other-item {
  position: relative;
  width: 100%;
  height: 2.272rem;
}

.other-banner {
  position: absolute;
  left: 1.301rem;
  top: 0;
  width: 7.458rem;
  height: 1.385rem;
  overflow: hidden;
}

.other-banner--wrap {
  height: 1.439rem;
}

.other-banner-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
}

.other-title {
  margin: 0;
  position: absolute;
  left: 0.467rem;
  top: 0.448rem;
  font-size: 0.355rem;
  line-height: 1.4;
  color: #fbfbfb;
  white-space: nowrap;
}

.other-title--wrap {
  top: 0.211rem;
  width: 4.907rem;
  white-space: normal;
}

.highlight {
  font-weight: 500;
}

.highlight--red {
  color: #ff132b;
}

.highlight--green {
  color: #05e7ae;
}

.sender-btn {
  position: absolute;
  right: 0.264rem;
  top: 0.24rem;
  width: 0.88rem;
  height: 0.88rem;
  border: 0;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.other-meta-row {
  position: absolute;
  left: 0;
  top: 1.224rem;
  width: 8.657rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.other-meta-club {
  display: inline-flex;
  align-items: center;
  gap: 0.253rem;

  img {
    width: 1.267rem;
    height: 1.258rem;
    border-radius: 50%;
    object-fit: cover;
  }

  span {
    font-size: 0.355rem;
    line-height: 1.4;
    color: #fbfbfb;
  }
}

.other-time {
  margin: 0;
  font-size: 0.321rem;
  line-height: 1;
  color: rgba(251, 251, 251, 0.59);
  white-space: nowrap;
}
</style>
