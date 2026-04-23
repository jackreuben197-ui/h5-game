<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import imgClubCover from '@/assets/images/club_cover_avatar.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'

const router = useRouter()

const clubName = ref('')
const clubIntro = ref('')
const isSubmitting = ref(false)

const createCostOriginal = 500
const createCostCurrent = 100

const canCreate = computed(() => {
	return clubName.value.trim().length > 0 && !isSubmitting.value
})

function goBack(): void {
	void router.push('/club')
}

function chooseAvatar(): void {
	// 预留头像上传入口，当前版本先保留交互反馈。
}

async function onCreateClub(): Promise<void> {
	if (!canCreate.value) {
		return
	}

	isSubmitting.value = true

	try {
		await router.push('/club/detail')
	} finally {
		isSubmitting.value = false
	}
}
</script>

<template>
	<div class="club-create-bg">
		<div class="bg-blur bg-blur--pink" aria-hidden="true" />
		<div class="bg-blur bg-blur--cyan" aria-hidden="true" />

		<div class="page-shell club-create">
			<header class="top-bar">
				<button type="button" class="back-btn" @click="goBack">
					<span class="back-icon" aria-hidden="true" />
					<span class="back-title">创建俱乐部</span>
				</button>
			</header>

			<section class="avatar-card">
				<button type="button" class="avatar-trigger" aria-label="选择俱乐部头像" @click="chooseAvatar">
					<img class="avatar-image" :src="imgClubCover" alt="俱乐部头像" />
					<span class="add-badge" aria-hidden="true">+</span>
				</button>
			</section>

			<section class="form-card">
				<label class="field-block" for="club-name-input">
					<span class="field-label">俱乐部名称</span>
					<div class="field-shell field-shell--single">
						<input
							id="club-name-input"
							v-model.trim="clubName"
							type="text"
							maxlength="30"
							placeholder="请输入俱乐部名称"
							autocomplete="off"
						/>
					</div>
				</label>

				<label class="field-block" for="club-intro-input">
					<span class="field-label">俱乐部简介</span>
					<div class="field-shell field-shell--multi">
						<textarea
							id="club-intro-input"
							v-model.trim="clubIntro"
							maxlength="300"
							placeholder="请输入简介"
						/>
					</div>
				</label>
			</section>

			<section class="footer-actions">
				<button
					type="button"
					class="create-btn"
					:class="{ 'create-btn--disabled': !canCreate }"
					:disabled="!canCreate"
					@click="onCreateClub"
				>
					{{ isSubmitting ? '创建中...' : '创建' }}
				</button>

				<p class="cost-line" aria-label="创建费用说明">
					<span>共计</span>
					<img :src="imgDiamond" alt="钻石" />
					<span class="cost-original">{{ createCostOriginal }}</span>
					<span class="cost-current">{{ createCostCurrent }}</span>
				</p>
			</section>
		</div>
	</div>
</template>

<style scoped lang="scss">
.club-create-bg {
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
	opacity: 0.48;
	pointer-events: none;
}

.bg-blur--pink {
	width: 2.6rem;
	height: 2.6rem;
	top: 3.6rem;
	left: -0.8rem;
	background: rgba(217, 32, 116, 0.56);
}

.bg-blur--cyan {
	width: 2.4rem;
	height: 2.4rem;
	right: -0.9rem;
	bottom: 2.1rem;
	background: rgba(36, 212, 255, 0.55);
}

.club-create {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	min-height: 100dvh;
	padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
	padding-bottom: calc(0.2rem + env(safe-area-inset-bottom));
	gap: 0.2rem;
}

.top-bar {
	min-height: 0.7rem;
	display: flex;
	align-items: center;
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

.avatar-card {
	padding: 0.08rem 0;
	min-height: 2rem;
	border-radius: 0.42rem;
	background: rgba(0, 0, 0, 0.2);
	backdrop-filter: blur(0.16rem);
	display: flex;
	align-items: center;
	padding-left: 0.22rem;
}

.avatar-trigger {
	position: relative;
	border: 0;
	padding: 0;
	background: transparent;
	width: 1.08rem;
	height: 1.08rem;
	border-radius: 50%;
	overflow: visible;
}

.avatar-image {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	object-fit: cover;
	border: 0.01rem solid rgba(255, 255, 255, 0.38);
}

.add-badge {
	position: absolute;
	right: -0.05rem;
	bottom: -0.05rem;
	width: 0.34rem;
	height: 0.34rem;
	border-radius: 50%;
	background: linear-gradient(165deg, #05e7ae 10%, #027a5c 75%);
	color: #fff;
	font-size: 0.28rem;
	line-height: 0.34rem;
	font-weight: 500;
	text-align: center;
	box-shadow: 0 0.02rem 0.08rem rgba(0, 0, 0, 0.2);
}

.form-card {
	display: flex;
	flex-direction: column;
	gap: 0.16rem;
	flex: 1;
	min-height: 0;
}

.field-block {
	display: flex;
	flex-direction: column;
	gap: 0.12rem;
}

.field-label {
	font-size: 0.36rem;
	line-height: 1.2;
	font-weight: 500;
	color: #fbfbfb;
}

.field-shell {
	border: 0.01rem solid rgba(249, 249, 249, 0.6);
	border-radius: 0.56rem;
	background: rgba(255, 255, 255, 0.18);
	backdrop-filter: blur(0.3rem);
	overflow: hidden;
}

.field-shell--single {
	height: 0.94rem;
	display: flex;
	align-items: center;
	padding: 0 0.22rem;
}

.field-shell--multi {
	min-height: 4.2rem;
	border-radius: 0.42rem;
	padding: 0.2rem 0.22rem;
	background:
		radial-gradient(95% 82% at 15% 30%, rgba(255, 193, 158, 0.44), rgba(255, 193, 158, 0)),
		radial-gradient(82% 78% at 60% 54%, rgba(185, 70, 151, 0.35), rgba(185, 70, 151, 0)),
		radial-gradient(66% 66% at 92% 56%, rgba(54, 208, 255, 0.35), rgba(54, 208, 255, 0)),
		rgba(255, 255, 255, 0.15);
}

input,
textarea {
	width: 100%;
	border: 0;
	outline: none;
	background: transparent;
	color: #f9f9f9;
	font-size: 0.3rem;
	font-weight: 500;
	line-height: 1.35;
	font-family: inherit;
}

textarea {
	resize: none;
	min-height: 3.6rem;
}

input::placeholder,
textarea::placeholder {
	color: rgba(255, 255, 255, 0.68);
}

.footer-actions {
	margin-top: auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.18rem;
	padding-top: 0.1rem;
}

.create-btn {
	width: 100%;
	min-height: 0.9rem;
	border: 0;
	border-radius: 0.5rem;
	color: #f9f9f9;
	font-size: 0.46rem;
	font-weight: 500;
	background: linear-gradient(168deg, #05e7ae 8%, #027a5c 72%);
	box-shadow: 0 0.08rem 0.2rem rgba(0, 0, 0, 0.18);
	transition: opacity 0.2s ease;
}

.create-btn--disabled {
	opacity: 0.56;
}

.cost-line {
	margin: 0;
	display: inline-flex;
	align-items: center;
	gap: 0.07rem;
	font-size: 0.27rem;
	line-height: 1;
	color: #f9f9f9;
}

.cost-line img {
	width: 0.26rem;
	height: 0.26rem;
	object-fit: contain;
}

.cost-original {
	position: relative;
	opacity: 0.86;
	text-decoration: line-through;
	text-decoration-color: rgba(255, 255, 255, 0.65);
}

.cost-current {
	color: #05e7ae;
	font-weight: 700;
}

@media (max-width: 340px) {
	.back-title {
		font-size: 0.34rem;
	}

	.field-label {
		font-size: 0.32rem;
	}

	.create-btn {
		font-size: 0.4rem;
	}
}
</style>
