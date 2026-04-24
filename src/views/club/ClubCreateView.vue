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

		<div class="club-create">
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
	color: #fbfbfb;
	background:
		radial-gradient(140% 84% at 50% -6%, rgba(216, 146, 131, 0.66), rgba(142, 82, 128, 0.62) 42%, rgba(29, 124, 153, 0.84) 100%),
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
	width: 2.9067rem;
	height: 2.9067rem;
	top: 3.8rem;
	left: -0.96rem;
	background: rgba(217, 32, 116, 0.56);
}

.bg-blur--cyan {
	width: 3.04rem;
	height: 3.04rem;
	right: -1.12rem;
	bottom: 1.5rem;
	background: rgba(36, 212, 255, 0.55);
}

.club-create {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	width: min(100%, var(--app-max-width));
	margin: 0 auto;
	min-height: 100dvh;
	padding-bottom: calc(0.3577rem + env(safe-area-inset-bottom));
}

.top-bar {
	min-height: 1.4459rem;
	display: flex;
	align-items: center;
	padding: calc(0.4598rem + env(safe-area-inset-top)) 0.7733rem 0;
}

.back-btn {
	border: 0;
	background: transparent;
	color: #fbfbfb;
	display: inline-flex;
	align-items: center;
	gap: 0.2rem;
	padding: 0;
}

.back-icon {
	width: 0.2133rem;
	height: 0.2133rem;
	border-left: 0.0533rem solid rgba(251, 251, 251, 0.96);
	border-bottom: 0.0533rem solid rgba(251, 251, 251, 0.96);
	transform: rotate(45deg);
	margin-left: 0.08rem;
}

.back-title {
	font-size: 0.6503rem;
	line-height: 1.2;
	font-weight: 500;
	letter-spacing: 0.002rem;
}

.avatar-card {
	margin: 0.2703rem 0.4561rem 0;
	padding: 0.1267rem 0.5828rem;
	min-height: 3.2433rem;
	border-radius: 1.0557rem;
	background: rgba(0, 0, 0, 0.2);
	backdrop-filter: blur(0.158rem);
	display: flex;
	align-items: center;
	flex-shrink: 0;
}

.avatar-trigger {
	position: relative;
	border: 0;
	padding: 0;
	background: transparent;
	width: 1.7834rem;
	height: 1.7941rem;
	border-radius: 50%;
	overflow: visible;
}

.avatar-image {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	object-fit: cover;
	border: 0.0107rem solid rgba(255, 255, 255, 0.38);
}

.add-badge {
	position: absolute;
	right: -0.047rem;
	bottom: -0.049rem;
	width: 0.7267rem;
	height: 0.7267rem;
	border-radius: 50%;
	background: linear-gradient(165deg, #05e7ae 10%, #027a5c 75%);
	color: #fff;
	font-size: 0.64rem;
	line-height: 0.7267rem;
	font-weight: 500;
	text-align: center;
	box-shadow: 0 0.0267rem 0.1067rem rgba(0, 0, 0, 0.2);
}

.form-card {
	display: flex;
	flex-direction: column;
	gap: 0.4307rem;
	flex: 1;
	min-height: 0;
	padding: 0.4307rem 0.4561rem 0;
}

.field-block {
	display: flex;
	flex-direction: column;
	gap: 0.4307rem;
}

.field-label {
	font-size: 0.48rem;
	line-height: 1.4;
	font-weight: 500;
	color: #fbfbfb;
}

.field-shell {
	border: 0.0083rem solid rgba(249, 249, 249, 0.6);
	background: rgba(255, 255, 255, 0.3);
	backdrop-filter: blur(0.8232rem);
	overflow: hidden;
}

.field-shell--single {
	height: 1.6638rem;
	display: flex;
	align-items: center;
	padding: 0 0.554rem;
	border-radius: 1.4759rem;
}

.field-shell--multi {
	min-height: 6.3176rem;
	border-radius: 0.72rem;
	padding: 0.5405rem;
	background:
		radial-gradient(95% 82% at 15% 30%, rgba(255, 193, 158, 0.42), rgba(255, 193, 158, 0)),
		radial-gradient(82% 78% at 60% 54%, rgba(185, 70, 151, 0.34), rgba(185, 70, 151, 0)),
		radial-gradient(66% 66% at 92% 56%, rgba(54, 208, 255, 0.34), rgba(54, 208, 255, 0)),
		rgba(255, 255, 255, 0.18);
}

input,
textarea {
	width: 100%;
	border: 0;
	outline: none;
	background: transparent;
	color: #fbfbfb;
	font-size: 0.3885rem;
	font-weight: 500;
	line-height: 1.4;
	font-family: inherit;
}

textarea {
	resize: none;
	min-height: 5.776rem;
}

input::placeholder,
textarea::placeholder {
	color: rgba(255, 255, 255, 0.71);
}

.footer-actions {
	margin-top: auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.2872rem;
	padding: 0.2872rem 0 0;
}

.create-btn {
	width: 8.9046rem;
	min-height: 1.4349rem;
	border: 0;
	border-radius: 1.0557rem;
	color: #fbfbfb;
	font-size: 0.5063rem;
	font-weight: 500;
	line-height: 1.2;
	background: linear-gradient(168.34deg, #05e7ae 7.55%, #027a5c 71.92%);
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
	gap: 0.1538rem;
	font-size: 0.359rem;
	line-height: 1.4;
	color: #fbfbfb;
}

.cost-line img {
	width: 0.4rem;
	height: 0.3209rem;
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
	.top-bar {
		padding-left: 0.56rem;
		padding-right: 0.56rem;
	}

	.avatar-card {
		margin-left: 0.32rem;
		margin-right: 0.32rem;
	}

	.form-card {
		padding-left: 0.32rem;
		padding-right: 0.32rem;
	}

	.form-card {
		padding-top: 0.32rem;
	}

	.back-title {
		font-size: 0.54rem;
	}

	.field-label {
		font-size: 0.4rem;
	}

	.create-btn {
		width: 100%;
		font-size: 0.44rem;
	}
}
</style>
