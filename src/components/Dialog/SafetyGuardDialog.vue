<script setup lang="ts">
import { computed } from 'vue'
import GameDialog from './GameDialog.vue'
import SafetyGuardPanelContent from './panels/SafetyGuardPanelContent.vue'

const props = withDefaults(
  defineProps<{
    show?: boolean
    tribeId?: number
  }>(),
  {
    show: false,
    tribeId: 0,
  },
)

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value),
})
</script>

<template>
  <GameDialog
    :show="popupShow"
    :show-footer="false"
    :show-confirm-button="false"
    :show-cancel-button="false"
    :close-on-click-overlay="true"
    body-max-height="none"
    teleport="body"
    @update:show="popupShow = $event"
  >
    <SafetyGuardPanelContent
      :tribe-id="tribeId"
    />
  </GameDialog>
</template>
