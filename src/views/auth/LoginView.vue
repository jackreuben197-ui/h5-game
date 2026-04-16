<script setup lang="ts">
import { md5 } from 'js-md5'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
	showFailToast,
	showLoadingToast,
	showSuccessToast,
	closeToast,
} from 'vant'
import { loginApi } from '@/api/auth'
import {
	DEBUG_ACCOUNTS,
	DEFAULT_DEBUG_ACCOUNT,
	type DebugAccount,
} from '@/constants/debugAccounts'
import LoginSession from '@/session/loginSession'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

const form = reactive({
	account: gameStore.loginAccount || DEFAULT_DEBUG_ACCOUNT.account,
	password: DEFAULT_DEBUG_ACCOUNT.password,
	area: '55',
	nickname: gameStore.loginNickname || DEFAULT_DEBUG_ACCOUNT.nickname,
})

const quickAccounts = computed(() => DEBUG_ACCOUNTS.slice(0, 8))
const pickerVisible = ref(false)
const pickerColumns = DEBUG_ACCOUNTS.map((item) => ({
	text: `${item.account} - ${item.nickname}`,
	value: item.account,
}))

function applyAccount(account: DebugAccount): void {
	form.account = account.account
	form.password = account.password
	form.nickname = account.nickname
}

function openAccountPicker(): void {
	pickerVisible.value = true
}

function onPickerConfirm(event: {
	selectedValues?: Array<string | number>
	selectedOptions?: Array<{ value?: string | number }>
}): void {
	const byValues = event.selectedValues?.[0]
	const byOptions = event.selectedOptions?.[0]?.value
	const selectedAccount = String(byValues ?? byOptions ?? '')
	const picked = DEBUG_ACCOUNTS.find(
		(item) => item.account === selectedAccount,
	)
	if (picked) {
		applyAccount(picked)
	}
	pickerVisible.value = false
}

function onPickerCancel(): void {
	pickerVisible.value = false
}

async function handleLogin(): Promise<void> {
	if (!form.account.trim() || !form.password.trim()) {
		showFailToast('账号和密码不能为空')
		return
	}

	showLoadingToast({
		message: '登录中...',
		forbidClick: true,
		duration: 0,
	})

	try {
		let token = ''

		const res = await loginApi({
			phone: form.account.trim(),
			password: md5(form.password.trim()),
			area: form.area.trim() || '55',
		})
		token = res.token

		gameStore.setSessionToken(token)
		// 登录成功后主动同步 websocket 端口并发送 Register，避免首次登录时漏发。
		try {
			await LoginSession.SyncWS()
		} catch (wsError) {
			// 不阻塞登录流程：大厅初始化阶段还会再次尝试 SyncWS。
			console.warn('[login] sync ws failed:', wsError)
		}
		gameStore.setLoginUser({
			account: form.account.trim(),
			nickname: form.nickname.trim() || form.account.trim(),
			userId: '',
		})

		closeToast()
		showSuccessToast('登录成功')
		// 登录成功后固定进入首页，不做来源页重定向。
		await router.replace({ name: 'lobby' })
	} catch (error) {
		closeToast()
		const message = error instanceof Error ? error.message : '登录失败'
		showFailToast(message)
	}
}
</script>

<template>
	<div class="page-shell">
		<VanNavBar title="H5 登录" />

		<section class="section-card">
			<h2 class="section-title">账号信息</h2>
			<!-- 使用 form 包裹密码输入，避免浏览器 Password field 警告。 -->
			<form class="login-form" @submit.prevent="handleLogin">
				<VanCellGroup inset>
					<VanField
						v-model="form.account"
						readonly
						label="账号"
						placeholder="点击选择测试账号"
						@click="openAccountPicker"
					/>
					<VanField
						v-model="form.nickname"
						label="昵称"
						placeholder="可修改显示昵称"
					/>
					<VanField
						v-model="form.password"
						type="password"
						label="密码"
						placeholder="请输入登录密码"
					/>
					<VanField
						v-model="form.area"
						label="区号"
						placeholder="默认 55"
					/>
				</VanCellGroup>

				<div class="actions">
					<VanButton type="primary" native-type="submit" block>登录</VanButton>
				</div>
			</form>
		</section>

		<section class="section-card">
			<h2 class="section-title">常用测试账号</h2>
			<div class="quick-account-list">
				<VanButton
					v-for="item in quickAccounts"
					:key="item.account"
					plain
					size="small"
					type="primary"
					@click="applyAccount(item)"
				>
					{{ item.account }}
				</VanButton>
			</div>
			<p class="info-line">完整账号列表可点击上方“账号”字段选择。</p>
		</section>

		<VanPopup v-model:show="pickerVisible" round position="bottom">
			<VanPicker
				title="请选择测试账号"
				:columns="pickerColumns"
				@confirm="onPickerConfirm"
				@cancel="onPickerCancel"
			/>
		</VanPopup>
	</div>
</template>
