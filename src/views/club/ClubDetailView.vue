<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import imgClubCover from '@/assets/images/club_cover_avatar.png'
import imgBalance from '@/assets/icons/icon_balance.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgPeople from '@/assets/icons/icon_people.png'
import imgQuickSafety from '@/assets/images/club_header_quick_safety.jpg'
import imgQuickRanking from '@/assets/images/club_header_quick_ranking.png'
import { showFailToast } from 'vant'

interface QuickActionItem {
	id: number
	title: string
	cover: string
}

type SettingItemKind = 'text' | 'arrow' | 'switch' | 'level' | 'founder' | 'copy'

interface SettingItem {
	id: number
	label: string
	kind: SettingItemKind
	value?: string
	switchKey?: 'allowSearch' | 'joinWithoutApproval'
}

const router = useRouter()

const imgQuickFund = 'https://www.figma.com/api/mcp/asset/9a7731a8-09f1-45c7-8292-70162e10dc50'

const quickActions: QuickActionItem[] = [
	{ id: 1, title: '活动管理', cover: imgQuickSafety },
	{ id: 2, title: '牌局记录', cover: imgQuickRanking },
	{ id: 3, title: '基金', cover: imgQuickFund },
]

const settings: SettingItem[] = [
	{ id: 1, label: '创始人', kind: 'founder', value: 'User Name' },
	{ id: 2, label: '邀请分享', kind: 'arrow' },
	{ id: 3, label: '联盟', kind: 'text', value: 'Guildxxxxx' },
	{ id: 4, label: '当前俱乐部等级', kind: 'level', value: 'LV. 9' },
	{ id: 5, label: '允许其他人搜索俱乐部', kind: 'switch', switchKey: 'allowSearch' },
	{ id: 6, label: '入会无需审批', kind: 'switch', switchKey: 'joinWithoutApproval' },
	{ id: 7, label: '创建时间', kind: 'text', value: '03/01/2024' },
	{ id: 8, label: '复制俱乐部', kind: 'copy' },
]

const allowSearch = ref(true)
const joinWithoutApproval = ref(false)

function formatCount(value: number): string {
	return value.toLocaleString('en-US')
}

function goBack(): void {
	void router.push('/club/index')
}

function goEditDescription(): void {
	void router.push('/club/edit-description')
}

function goEditName(): void {
	void router.push('/club/edit-name')
}

function onQuickAction(actionId: number): void {
	if (actionId === 2) {
		void router.push('/club/room/history')
		return
	}

	if (actionId === 1) {
  		showFailToast('创建牌桌功能开发中')
		return
	}

	void router.push('/club/members')
}

function onSettingClick(item: SettingItem): void {
	if (item.kind === 'switch' || item.kind === 'text' || item.kind === 'founder') {
		return
	}

	if (item.label === '邀请分享') {
		return
	}

	if (item.label === '复制俱乐部') {
		return
	}
}

function toggleSwitch(key: 'allowSearch' | 'joinWithoutApproval'): void {
	if (key === 'allowSearch') {
		allowSearch.value = !allowSearch.value
		return
	}

	joinWithoutApproval.value = !joinWithoutApproval.value
}
</script>

<template>
	<div class="club-detail-bg">
		<div class="bg-blur bg-blur--pink" aria-hidden="true" />
		<div class="bg-blur bg-blur--cyan" aria-hidden="true" />

		<div class="page-shell club-detail">
			<header class="top-bar">
				<button type="button" class="back-btn" @click="goBack">
					<span class="back-icon" aria-hidden="true" />
					<span class="back-title">俱乐部管理</span>
				</button>
			</header>

			<section class="club-header-card">
				<div class="club-header-main">
					<img class="club-avatar" :src="imgClubCover" alt="俱乐部头像" />

					<div class="club-summary">
						<button type="button" class="club-name-edit" @click="goEditName">
							<h1 class="club-name">俱乐部名称</h1>
							<span class="name-edit-icon" aria-hidden="true" />
						</button>
						<p class="club-id-row">
							<span class="id-tag">ID</span>
							<span class="id-text">8677650585</span>
						</p>

						<p class="metric-line">
							<img :src="imgBalance" alt="" aria-hidden="true" />
							<span>{{ formatCount(1923) }}</span>
						</p>
						<p class="metric-line">
							<img :src="imgChips" alt="" aria-hidden="true" />
							<span>{{ formatCount(19231) }}</span>
						</p>
					</div>
				</div>

				<div class="club-size-pill" aria-label="俱乐部人数">
					<span class="size-text">500/1000</span>
					<img :src="imgPeople" alt="" aria-hidden="true" />
				</div>
			</section>

			<section class="quick-actions">
				<button
					v-for="item in quickActions"
					:key="item.id"
					type="button"
					class="quick-card"
					@click="onQuickAction(item.id)"
				>
					<span class="quick-image-wrap">
						<img :src="item.cover" :alt="item.title" />
					</span>
					<span class="quick-title">{{ item.title }}</span>
				</button>
			</section>

			<section class="intro-card">
				<span>俱乐部简介</span>
				<button type="button" class="intro-edit" aria-label="编辑俱乐部简介" @click="goEditDescription">
					<span class="edit-pen" />
				</button>
			</section>

			<section class="settings-card">
				<button
					v-for="item in settings"
					:key="item.id"
					type="button"
					class="settings-row"
					:class="[
						`settings-row--${item.kind}`,
						{
							'settings-row--clickable': item.kind === 'arrow' || item.kind === 'level' || item.kind === 'copy',
						},
					]"
					@click="onSettingClick(item)"
				>
					<div class="label-wrap">
						<span>{{ item.label }}</span>
						<span v-if="item.kind === 'copy'" class="info-dot">i</span>
					</div>

					<div class="right-wrap">
						<template v-if="item.kind === 'founder'">
							<span class="muted-text">{{ item.value }}</span>
							<img class="mini-avatar" :src="imgClubCover" alt="创始人头像" />
						</template>

						<template v-else-if="item.kind === 'text'">
							<span class="muted-text">{{ item.value }}</span>
						</template>

						<template v-else-if="item.kind === 'level'">
							<span class="level-pill">{{ item.value }}</span>
							<span class="chevron" aria-hidden="true" />
						</template>

						<template v-else-if="item.kind === 'switch' && item.switchKey">
							<button
								type="button"
								class="switch"
								:class="{
									'switch--on': item.switchKey === 'allowSearch' ? allowSearch : joinWithoutApproval,
								}"
								:aria-label="item.label"
								@click.stop="toggleSwitch(item.switchKey)"
							>
								<span class="switch-knob" />
							</button>
						</template>

						<template v-else>
							<span class="chevron" aria-hidden="true" />
						</template>
					</div>
				</button>
			</section>

			<section class="danger-zone">
				<button type="button" class="danger-btn">删除俱乐部</button>
			</section>
		</div>
	</div>
</template>

<style scoped lang="scss">
.club-detail-bg {
	position: relative;
	min-height: 100dvh;
	background:
		radial-gradient(140% 84% at 50% -6%, rgba(216, 146, 131, 0.64), rgba(142, 82, 128, 0.6) 42%, rgba(29, 124, 153, 0.82) 100%),
		linear-gradient(180deg, #ba8d82 0%, #35a6c6 100%);
	overflow: hidden;
}

.bg-blur {
	position: absolute;
	border-radius: 999px;
	filter: blur(0.9rem);
	opacity: 0.5;
	pointer-events: none;
}

.bg-blur--pink {
	width: 2.6rem;
	height: 2.6rem;
	top: 3.8rem;
	left: -0.8rem;
	background: rgba(217, 32, 116, 0.56);
}

.bg-blur--cyan {
	width: 2.3rem;
	height: 2.3rem;
	right: -0.7rem;
	bottom: 2.6rem;
	background: rgba(36, 212, 255, 0.52);
}

.club-detail {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	gap: 0.40524rem;
	padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
}

.top-bar {
	min-height: 0.72215rem;
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
	font-size: 0.49799rem;
	line-height: 1;
	font-weight: 500;
}

.club-header-card {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 0;
	min-height: 3.08434rem;
	padding: 0.12048rem 0.55422rem;
	border-radius: 1.00402rem;
	background: rgba(0, 0, 0, 0.22);
	backdrop-filter: blur(0.2rem);
}

.club-header-main {
	display: inline-flex;
	align-items: center;
	gap: 0.28112rem;
}

.club-avatar {
	width: 1.96787rem;
	height: 1.97968rem;
	border-radius: 999px;
	object-fit: cover;
	border: 0;
}

.club-summary {
	display: flex;
	flex-direction: column;
	min-height: 1.99325rem;
}

.club-name-edit {
	display: inline-flex;
	align-items: center;
	gap: 0.08rem;
	padding: 0;
	border: 0;
	background: transparent;
	color: inherit;
	max-width: 100%;
}

.club-name {
	margin: 0;
	color: #f9f9f9;
	font-size: 0.5692rem;
	line-height: 1;
	font-weight: 700;
}

.name-edit-icon {
	position: relative;
	width: 0.2rem;
	height: 0.2rem;
	flex: 0 0 auto;
}

.name-edit-icon::before {
	content: '';
	position: absolute;
	left: 0.03rem;
	top: 0.06rem;
	width: 0.14rem;
	height: 0.06rem;
	border: 0.02rem solid rgba(249, 249, 249, 0.92);
	border-radius: 0.03rem;
	transform: rotate(-38deg);
}

.club-id-row {
	margin: 0;
	display: inline-flex;
	align-items: center;
	gap: 0.06231rem;
}

.id-tag {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 0.48924rem;
	height: 0.27575rem;
	border-radius: 0.10682rem;
	font-size: 0.20537rem;
	color: #fff;
	background: rgba(255, 255, 255, 0.28);
}

.id-text {
	font-size: 0.24404rem;
	color: rgba(249, 249, 249, 0.95);
}

.metric-line {
	margin: 0;
	display: inline-flex;
	align-items: center;
	gap: 0.11365rem;
	color: #f9f9f9;
	font-size: 0.3553rem;
	line-height: 1.2;
	font-weight: 600;
}

.metric-line img {
	width: 0.4rem;
	height: 0.4rem;
	object-fit: contain;
}

.club-size-pill {
	flex: 0 0 auto;
	min-height: 0.82731rem;
	padding: 0 0.28112rem;
	border-radius: 0.72289rem;
	display: inline-flex;
	align-items: center;
	gap: 0.05622rem;
	background: rgba(255, 255, 255, 0.2);
}

.size-text {
	color: #f9f9f9;
	font-size: 0.4739rem;
	line-height: 1;
	font-weight: 500;
}

.club-size-pill img {
	width: 0.48rem;
	height: 0.48rem;
	object-fit: contain;
	opacity: 0.94;
}

.quick-actions {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 0.29333rem;
}

.quick-card {
	border: 0;
	padding: 0;
	background: transparent;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.16027rem;
	color: #f9f9f9;
}

.quick-image-wrap {
	width: 100%;
	aspect-ratio: 1 / 1;
	border-radius: 0.75252rem;
	border: 0.02667rem solid rgba(255, 255, 255, 0.6);
	overflow: hidden;
	background: rgba(255, 255, 255, 0.26);
}

.quick-image-wrap img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.quick-title {
	font-size: 0.304rem;
	line-height: 1;
	text-align: center;
}

.intro-card {
	min-height: 1.51964rem;
	padding: 0.34538rem 0.41767rem 0.34538rem 0.55422rem;
	border-radius: 0.72289rem;
	background: rgba(0, 0, 0, 0.24);
	backdrop-filter: blur(0.12rem);
	display: flex;
	align-items: center;
	justify-content: space-between;
	color: rgba(249, 249, 249, 0.96);
	font-size: 0.40524rem;
}

.intro-edit {
	border: 0;
	width: 0.67539rem;
	height: 0.67539rem;
	border-radius: 50%;
	background: linear-gradient(145deg, #15ddb2, #00ca98);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0;
}

.edit-pen {
	position: relative;
	width: 0.21rem;
	height: 0.21rem;
}

.edit-pen::before {
	content: '';
	position: absolute;
	left: 0.03rem;
	top: 0.06rem;
	width: 0.14rem;
	height: 0.06rem;
	border: 0.02rem solid #fff;
	border-radius: 0.03rem;
	transform: rotate(-38deg);
}

.settings-card {
	display: flex;
	flex-direction: column;
	gap: 0.28916rem;
	padding: 0.34538rem 0.41767rem;
	border-radius: 0.72289rem;
	background:
		radial-gradient(80% 100% at 100% 100%, rgba(51, 169, 206, 0.26), rgba(51, 169, 206, 0)),
		rgba(0, 0, 0, 0.24);
	backdrop-filter: blur(0.15rem);
}

.settings-row {
	width: 100%;
	border: 0;
	background: transparent;
	padding: 0;
	min-height: 0.53333rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0;
	color: #f1f1f1;
	font-size: 0.40524rem;
}

.label-wrap {
	display: inline-flex;
	align-items: center;
	gap: 0.06rem;
	min-width: 0;
	text-align: left;
}

.right-wrap {
	display: inline-flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.08rem;
}

.muted-text {
	color: rgba(228, 228, 228, 0.7);
	font-size: 0.40524rem;
}

.mini-avatar {
	width: 0.71rem;
	height: 0.71rem;
	border-radius: 999px;
	object-fit: cover;
}

.chevron {
	width: 0.26656rem;
	height: 0.4798rem;
	border-top: 0.02rem solid rgba(237, 237, 237, 0.85);
	border-right: 0.02rem solid rgba(237, 237, 237, 0.85);
	transform: rotate(45deg);
}

.level-pill {
	display: inline-flex;
	align-items: center;
	min-height: 0.48614rem;
	padding: 0 0.1246rem;
	border-radius: 999px;
	font-size: 0.27857rem;
	font-weight: 700;
	color: #f9f9f9;
	background: linear-gradient(152deg, #05e7ae 8%, #027a5c 72%);
}

.switch {
	width: 1.756rem;
	height: 0.82747rem;
	border: 0;
	padding: 0.04rem;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.22);
	display: inline-flex;
	align-items: center;
}

.switch--on {
	justify-content: flex-end;
	background: #05e7ae;
}

.switch:not(.switch--on) {
	justify-content: flex-start;
}

.switch-knob {
	width: 0.667rem;
	height: 0.667rem;
	border-radius: 50%;
	background: #fff;
	box-shadow: 0 0.02rem 0.04rem rgba(0, 0, 0, 0.22);
}

.info-dot {
	width: 0.3592rem;
	height: 0.3592rem;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.24);
	color: #fff;
	font-size: 0.22613rem;
	line-height: 0.3592rem;
	text-align: center;
}

.danger-zone {
	margin-top: 0.40524rem;
	padding: 0 0.64108rem 0.24rem;
}

.danger-btn {
	width: 100%;
	min-height: 1.43581rem;
	border: 0;
	border-radius: 1.05574rem;
	color: #f9f9f9;
	font-size: 0.5066rem;
	font-weight: 500;
	background: linear-gradient(90deg, rgba(73, 29, 86, 0.8), rgba(19, 95, 125, 0.84));
}

@media (max-width: 340px) {
	.club-name {
		font-size: 0.38rem;
	}

	.size-text {
		font-size: 0.31rem;
	}

	.settings-row {
		font-size: 0.3rem;
	}

	.muted-text {
		font-size: 0.3rem;
	}

	.danger-btn {
		font-size: 0.4rem;
	}
}
</style>
