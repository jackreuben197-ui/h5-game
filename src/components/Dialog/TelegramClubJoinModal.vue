<script setup lang="ts">
import { computed } from 'vue'
import GameDialog from '@/components/Dialog/GameDialog.vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import { useTelegramClubJoinStore } from '@/stores/telegramClubJoin'
import { useUserInfoStore } from '@/stores/userInfo'
import { postOrgClubJoinApi, postOrgClubSearchByIdApi } from '@/api/org'
import { getUserClubApi } from '@/api/user'
import { resumeTelegramDeepLink } from '@/session/telegramDeepLink'
import { showFailToast, showSuccessToast } from 'vant'

const store = useTelegramClubJoinStore()
const userInfoStore = useUserInfoStore()

const showModal = computed({
  get: () => store.show,
  set: (val: boolean) => {
    if (!val) {
      store.closeModal()
    }
  },
})

// Safely format club name (handles weird characters / empty fallback)
const formattedClubName = computed(() => {
  const name = (store.clubName || '').trim()
  if (!name) {
    return ''
  }
  // Remove control characters if any
  return name.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim()
})

async function handleQuickJoin(): Promise<void> {
  if ((!store.clubId && !store.clubRandomId) || store.loading) {
    return
  }

  store.setLoading(true)
  try {
    let targetClubId = store.clubId
    if (!targetClubId && store.clubRandomId) {
      const res = await postOrgClubSearchByIdApi(
        { club_random_id: store.clubRandomId },
        { suppressBusinessToast: true },
      )
      const data = res.data as Record<string, unknown> | undefined
      targetClubId = Number(data?.club_id) || 0
      if (targetClubId) {
        store.clubId = targetClubId
      }
    }

    const res = await postOrgClubJoinApi({ club_id: targetClubId }, { suppressBusinessToast: true })
    await getUserClubApi()

    const isMember = userInfoStore.clubList.some(
      (c) => Number(c.club_id) === store.clubId || Number(c.random_id) === store.clubRandomId,
    )

    if (isMember) {
      showSuccessToast(res.message || '加入成功')
      const intent = store.pendingIntent
      store.closeModal()
      if (intent) {
        await resumeTelegramDeepLink(intent)
      }
    } else {
      // If server returned a message (e.g. "申请成功，等待审核" or status message), show that; otherwise show general failure
      showFailToast(res.message || '申请已提交，等待审核')
    }
  } catch (error) {
    // Re-check membership in case auto-audit or async backend join succeeded despite network error
    try {
      await getUserClubApi()
      const isMember = userInfoStore.clubList.some(
        (c) => Number(c.club_id) === store.clubId || Number(c.random_id) === store.clubRandomId,
      )
      if (isMember) {
        showSuccessToast('加入成功')
        const intent = store.pendingIntent
        store.closeModal()
        if (intent) {
          await resumeTelegramDeepLink(intent)
        }
        return
      }
    } catch {
      /* ignore */
    }

    const message = error instanceof Error ? error.message : '加入失败，请重试'
    showFailToast(message)
  } finally {
    store.setLoading(false)
  }
}
</script>

<template>
  <GameDialog
    v-model:show="showModal"
    title="加入俱乐部"
    :show-confirm-button="false"
    :show-cancel-button="false"
    :close-on-click-overlay="true"
    dialog-width="8.8rem"
    card-min-height="4.5rem"
  >
    <div class="telegram-club-join">
      <div class="club-info-card">
        <div v-if="formattedClubName" class="club-name">
          {{ formattedClubName }}
        </div>
        <div class="club-id">
          <span class="label">俱乐部 ID:</span>
          <span class="value">{{ store.clubRandomId || store.clubId }}</span>
        </div>
      </div>

      <div class="join-prompt">
        您尚未加入该俱乐部，请点击下方按钮一键加入。
      </div>

      <div class="action-footer">
        <PrimaryButton
          class="quick-join-btn"
          :text="store.loading ? '加入中...' : '一键加入'"
          :disabled="store.loading"
          @click="handleQuickJoin"
        />
      </div>
    </div>
  </GameDialog>
</template>

<style scoped lang="scss">
.telegram-club-join {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.3rem 0.2rem 0.4rem;
  box-sizing: border-box;

  .club-info-card {
    width: 100%;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 0.2rem;
    padding: 0.3rem 0.25rem;
    box-sizing: border-box;
    text-align: center;
    margin-bottom: 0.3rem;

    .club-name {
      font-size: 0.34rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 0.12rem;
      word-break: break-word;
    }

    .club-id {
      font-size: 0.28rem;
      color: rgba(255, 255, 255, 0.7);

      .label {
        margin-right: 0.1rem;
      }

      .value {
        color: #e2c083;
        font-weight: 600;
      }
    }
  }

  .join-prompt {
    font-size: 0.26rem;
    color: rgba(255, 255, 255, 0.85);
    text-align: center;
    line-height: 1.4;
    margin-bottom: 0.4rem;
  }

  .action-footer {
    width: 100%;

    .quick-join-btn {
      width: 100%;
      height: 0.84rem;
      font-size: 0.3rem;
      font-weight: 600;
    }
  }
}
</style>
