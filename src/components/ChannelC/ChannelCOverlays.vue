<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { requireRealUser } from '@/session/realUserGate'
import { useGameStore } from '@/stores/game'
import { useTribeRewardStore } from '@/stores/tribeReward'
import { openGlobalCustomerServiceChat } from '@/components/GlobalCustomerServiceChat/channel'
import ClubNoticeDialog from '@/components/Club/ClubNoticeDialog.vue'
import { useClubNoticePopup } from '@/composables/useClubNoticePopup'
import type { ChannelCAction, RewardKind } from '@/features/channelC/rewards'
import ChannelCGameRewards from './ChannelCGameRewards.vue'
import ChannelCRechargeRewards from './ChannelCRechargeRewards.vue'
import ChannelCInviteRewards from './ChannelCInviteRewards.vue'

const props = defineProps<{
  clubId: number
  tribeId: number
  clubName: string
  announcement: string
  tournamentName: string
}>()
const active = ref<RewardKind | null>(null)
const rewards = useTribeRewardStore()
const game = useGameStore()
const showGame = computed({
  get: () => active.value === 'game',
  set: (value) => {
    if (!value) active.value = null
  },
})
const showRecharge = computed({
  get: () => active.value === 'recharge',
  set: (value) => {
    if (!value) active.value = null
  },
})
const showInvite = computed({
  get: () => active.value === 'invite',
  set: (value) => {
    if (!value) active.value = null
  },
})
const { show: showNotice, ignoring, current, open: openNotice, ignore } = useClubNoticePopup()

function open(action: ChannelCAction) {
  if (action === 'notice') {
    void openNotice(props.clubId, props.announcement)
  } else if (action === 'support') {
    openGlobalCustomerServiceChat({
      imServiceType: 1,
      clubId: props.clubId,
      tribeId: props.tribeId,
    })
  } else if (requireRealUser(() => open(action))) {
    active.value = action
  }
}

function loadRewards(force = false) {
  if (active.value && game.isRealUser) void rewards.load(props.clubId, force)
}
watch([active, () => props.clubId, () => game.sessionToken, () => game.loginUserId], () =>
  loadRewards(),
)
watch(
  () => game.isRealUser,
  (real) => {
    if (!real) active.value = null
  },
)
watch(
  () => rewards.revision,
  () => loadRewards(true),
)

defineExpose({ open })
</script>

<template>
  <ClubNoticeDialog
    v-model:show="showNotice"
    :club-name="clubName"
    :notice="current"
    :ignoring="ignoring"
    @ignore="ignore"
  />
  <ChannelCGameRewards
    v-model:show="showGame"
    :tournament-name="tournamentName"
    :groups="rewards.presentation.groups"
    :loading="rewards.loading"
    :failed="rewards.failed"
    @retry="loadRewards()"
  />
  <ChannelCRechargeRewards
    v-model:show="showRecharge"
    :tournament-name="tournamentName"
    :data="rewards.presentation.recharge"
    :loading="rewards.loading"
    :failed="rewards.failed"
    @retry="loadRewards()"
  />
  <ChannelCInviteRewards
    v-model:show="showInvite"
    :data="rewards.presentation.invite"
    :loading="rewards.loading"
    :failed="rewards.failed"
    @retry="loadRewards()"
  />
</template>
