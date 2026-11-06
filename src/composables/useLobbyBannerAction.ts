import { computed, onBeforeUnmount, onDeactivated, ref, shallowRef, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useLobbyBannerMatch } from '@/composables/useLobbyBannerMatch'
import { t } from '@/i18n'
import type { LobbyBanner, RefreshLobbyBanner } from '@/utils/lobbyBannerAssociation'
import { stageMttDetailForNavigation } from '@/utils/mttDetailHandoff'
import { useCachedImage } from '@/utils/imageCache'

/**
 * Banner 关联内容的打开逻辑：先刷新配置，再按关联类型展示海报或跳转比赛详情。
 * A/B 轮播的单张图片和版本 C 的促销轮播共用同一份状态。
 */
export function useLobbyBannerAction(refresh: () => RefreshLobbyBanner) {
  const router = useRouter()
  const resolveMatch = useLobbyBannerMatch()
  const busy = ref(false)
  const posterOpen = ref(false)
  const currentBanner = shallowRef<LobbyBanner | undefined>()
  const posterSrc = useCachedImage(() => {
    const association = currentBanner.value?.association
    return association?.type === 'poster' ? association.url : ''
  })
  const actionLabel = computed(() => {
    const association = currentBanner.value?.association
    if (!association) return undefined
    return (association.type === 'mtt' && association.templateName) || t('UIMine_RecordItemsNormal')
  })
  let revision = 0

  function closeBanner(): void {
    revision += 1
    busy.value = false
    posterOpen.value = false
  }

  function setBanner(banner: LobbyBanner | undefined): void {
    closeBanner()
    currentBanner.value = banner
  }

  async function openBanner(banner: LobbyBanner | undefined = currentBanner.value): Promise<void> {
    if (banner !== currentBanner.value) {
      closeBanner()
      currentBanner.value = banner
    }
    const selected = currentBanner.value
    if (!selected?.association || busy.value || posterOpen.value) return
    // 已知海报立即打开，刷新配置在后台进行，重复点击不等待列表请求。
    posterOpen.value = selected.association.type === 'poster'
    busy.value = !posterOpen.value
    const request = ++revision
    const currentRoute = router.currentRoute.value
    const isCurrent = () => request === revision && router.currentRoute.value === currentRoute
    try {
      const fresh = await refresh()(selected)
      if (!isCurrent() || fresh === undefined) return
      currentBanner.value = fresh ?? undefined
      if (fresh?.association?.type === 'poster') {
        posterOpen.value = true
        return
      }

      posterOpen.value = false
      if (fresh?.association?.type !== 'mtt') return
      busy.value = true
      const match = await resolveMatch(fresh.clubId, fresh.association.templateId)
      if (!match || !isCurrent()) return
      const discardDetail = stageMttDetailForNavigation(match)
      try {
        const failure = await router.push({ name: 'mtt-detail', query: { id: String(match.id) } })
        if (failure) discardDetail()
      } catch (error) {
        discardDetail()
        throw error
      }
    } catch (error) {
      console.warn('[lobby-banner] Unable to open associated content', error)
    } finally {
      if (request === revision) busy.value = false
    }
  }

  if (getCurrentInstance()) {
    onDeactivated(closeBanner)
    onBeforeUnmount(closeBanner)
  }

  return { busy, posterOpen, posterSrc, currentBanner, actionLabel, closeBanner, setBanner, openBanner }
}
