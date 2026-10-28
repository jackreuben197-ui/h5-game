<script setup lang="ts">
import { computed, ref } from 'vue'
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
  } else {
    active.value = action
  }
}

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
  <ChannelCGameRewards v-model:show="showGame" :tournament-name="tournamentName" />
  <ChannelCRechargeRewards v-model:show="showRecharge" :tournament-name="tournamentName" />
  <ChannelCInviteRewards v-model:show="showInvite" />
</template>
