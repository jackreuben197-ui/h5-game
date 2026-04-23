<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const intro = ref('')
const isSubmitting = ref(false)

const canConfirm = computed(() => {
	return intro.value.trim().length > 0 && !isSubmitting.value
})

function goBack(): void {
	void router.push('/club/detail')
}

async function onConfirm(): Promise<void> {
	if (!canConfirm.value) {
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
	<div class="club-edit-des-bg">
		<div class="bg-blur bg-blur--pink" aria-hidden="true" />
		<div class="bg-blur bg-blur--cyan" aria-hidden="true" />

		<div class="page-shell club-edit-des">
			<header class="top-bar">
				<button type="button" class="back-btn" @click="goBack">
					<span class="back-icon" aria-hidden="true" />
					<span class="back-title">编辑简介</span>
				</button>
			</header>

			<section class="editor-block">
				<label class="field-label" for="club-intro-edit-input">俱乐部简介</label>
				<div class="field-shell">
					<textarea
						id="club-intro-edit-input"
						v-model.trim="intro"
						maxlength="300"
						placeholder="请输入简介"
					/>
				</div>
			</section>

			<section class="footer-actions">
				<button
					type="button"
					class="confirm-btn"
					:class="{ 'confirm-btn--disabled': !canConfirm }"
					:disabled="!canConfirm"
					@click="onConfirm"
				>
					{{ isSubmitting ? '提交中...' : '确定' }}
				</button>
			</section>
		</div>
	</div>
</template>

<style scoped lang="scss">
.club-edit-des-bg {
	position: relative;
	min-height: 100dvh;
	background:
		radial-gradient(145% 88% at 46% -8%, rgba(219, 155, 140, 0.68), rgba(154, 97, 145, 0.66) 45%, rgba(33, 136, 168, 0.86) 100%),
		linear-gradient(180deg, #ba8d82 0%, #35a6c6 100%);
	overflow: hidden;
}

.bg-blur {
	position: absolute;
	border-radius: 999px;
	filter: blur(1rem);
	opacity: 0.54;
	pointer-events: none;
}

.bg-blur--pink {
	width: 2.7rem;
	height: 2.7rem;
	left: -0.9rem;
	top: 4.1rem;
	background: rgba(224, 52, 127, 0.52);
}

.bg-blur--cyan {
	width: 3rem;
	height: 3rem;
	right: -1.1rem;
	bottom: 1.2rem;
	background: rgba(42, 222, 255, 0.55);
}

.club-edit-des {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	min-height: 100dvh;
	gap: 0.22rem;
	padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
	padding-bottom: calc(0.2rem + env(safe-area-inset-bottom));
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
	font-size: 0.48rem;
	line-height: 1;
	font-weight: 500;
}

.editor-block {
	display: flex;
	flex-direction: column;
	gap: 0.14rem;
	padding-top: 0.06rem;
}

.field-label {
	font-size: 0.36rem;
	line-height: 1.3;
	font-weight: 500;
	color: #f7f7f7;
}

.field-shell {
	min-height: 4.72rem;
	border: 0.01rem solid rgba(249, 249, 249, 0.58);
	border-radius: 0.42rem;
	padding: 0.2rem 0.22rem;
	background:
		radial-gradient(90% 70% at 14% 20%, rgba(255, 199, 160, 0.46), rgba(255, 199, 160, 0)),
		radial-gradient(82% 74% at 64% 49%, rgba(185, 76, 157, 0.4), rgba(185, 76, 157, 0)),
		radial-gradient(82% 78% at 86% 75%, rgba(121, 146, 206, 0.38), rgba(121, 146, 206, 0)),
		rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(0.3rem);
	overflow: hidden;
}

textarea {
	width: 100%;
	min-height: 4.18rem;
	resize: none;
	border: 0;
	outline: none;
	background: transparent;
	font-family: inherit;
	font-size: 0.3rem;
	line-height: 1.4;
	font-weight: 500;
	color: #f9f9f9;
}

textarea::placeholder {
	color: rgba(255, 255, 255, 0.7);
}

.footer-actions {
	margin-top: auto;
	padding: 0 0.06rem;
	padding-bottom: 0.1rem;
}

.confirm-btn {
	width: 100%;
	min-height: 0.9rem;
	border: 0;
	border-radius: 0.52rem;
	background: linear-gradient(168deg, #05e7ae 8%, #027a5c 72%);
	color: #f9f9f9;
	font-size: 0.46rem;
	font-weight: 500;
	box-shadow: 0 0.08rem 0.2rem rgba(0, 0, 0, 0.2);
	transition: opacity 0.2s ease;
}

.confirm-btn--disabled {
	opacity: 0.56;
}

@media (max-width: 340px) {
	.back-title {
		font-size: 0.4rem;
	}

	.field-label {
		font-size: 0.32rem;
	}

	.confirm-btn {
		font-size: 0.4rem;
	}
}
</style>
