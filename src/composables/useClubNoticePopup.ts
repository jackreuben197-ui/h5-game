import { computed, nextTick, ref } from 'vue'
import { showFailToast } from 'vant'
import { postOrgClubNoticeApi, postOrgClubNoticeIgnoreApi } from '@/api/cmsext'
import type { ClubNoticeContent } from '@/components/Club/ClubNoticeDialog.vue'
import { t } from '@/i18n'
import { formatDateTime } from '@/utils/time'
import { useGameStore } from '@/stores/game'

export function useClubNoticePopup() {
  const game = useGameStore()
  const show = ref(false)
  const ignoring = ref(false)
  const notices = ref<ClubNoticeContent[]>([])
  const current = computed(() => notices.value[0] || null)
  let currentClubId = 0
  let requestRevision = 0

  async function open(clubId: number, fallback: string) {
    const revision = ++requestRevision
    currentClubId = clubId
    // 游客复用渠道公开公告，避免调用需要真实身份的 notice 接口。
    if (!game.isRealUser) {
      notices.value = [
        {
          title: t('Serverbulletin'),
          content: fallback || t('UIChannelC_NoAnnouncement'),
          dateText: '',
        },
      ]
      show.value = true
      return
    }
    try {
      const response = await postOrgClubNoticeApi({ club_id: clubId })
      if (revision !== requestRevision) return
      if (Number(response.code) !== 0) throw new Error(t('UIClub_ClubLoadFail'))
      const info = response.data?.info
      const dateText = info?.start_time ? formatDateTime(info.start_time, 'DD/MM/YYYY') : ''
      notices.value = [
        {
          title: info?.tribe_notice_title || t('UIClub_Union'),
          content: info?.tribe_notice || '',
          dateText,
        },
        { title: info?.title || t('UIClub_Club2'), content: info?.content || fallback, dateText },
      ]
        .filter((item) => item.content)
        .map((item) => ({ ...item, content: item.content.replace(/\[\/?link\]/g, '') }))
      if (!notices.value.length) {
        notices.value = [
          { title: t('Serverbulletin'), content: t('UIChannelC_NoAnnouncement'), dateText: '' },
        ]
      }
      show.value = true
    } catch (error) {
      if (revision === requestRevision)
        showFailToast(error instanceof Error ? error.message : t('UIClub_ClubLoadFail'))
    }
  }

  async function ignore() {
    if (ignoring.value) return
    if (!game.isRealUser) {
      show.value = false
      return
    }
    ignoring.value = true
    try {
      const response = await postOrgClubNoticeIgnoreApi({ club_id: currentClubId })
      if (Number(response.code) !== 0) throw new Error(t('UIClub_Fail4'))
      notices.value.shift()
      show.value = false
      await nextTick()
      show.value = notices.value.length > 0
    } catch (error) {
      showFailToast(error instanceof Error ? error.message : t('UIClub_Fail4'))
    } finally {
      ignoring.value = false
    }
  }

  return { show, ignoring, current, open, ignore }
}
