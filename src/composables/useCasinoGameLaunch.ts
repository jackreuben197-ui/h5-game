import { getDeviceType, joinCasinoGame, type ExtendGameRecord } from '@/api/casino'
import { showGameToast } from '@/components/Toast'
import { t } from '@/i18n'
import { requireRealUser } from '@/session/realUserGate'
import { useGameLaunchStore } from '@/stores/gameLaunch'
import {
  beginGameLaunch,
  launchGameUrl,
  releaseGameWindow,
  reserveGameWindow,
  usesTelegramGameLauncher,
  type ReservedGameWindow,
} from '@/utils/externalGameWindow'

export interface CasinoLaunchTarget {
  gameApiType: string
  gameType: string | number
  gameRoomId?: number
  gameName?: string
}

function isDbRealNameGame(target: CasinoLaunchTarget): boolean {
  return (
    target.gameApiType === 'real_name' ||
    target.gameName === 'DB真人' ||
    !!target.gameName?.includes('DB视讯')
  )
}

export function toCasinoLaunchTarget(game: ExtendGameRecord): CasinoLaunchTarget {
  return {
    gameApiType: game.game_api_type || '',
    gameType: game.game_type || '',
    gameRoomId: game.id ?? game.game_room_id ?? game.room_id ?? 0,
    gameName: game.game_name,
  }
}

export function useCasinoGameLaunch() {
  const gameLaunchStore = useGameLaunchStore()

  function reserveWindow(target: CasinoLaunchTarget): ReservedGameWindow {
    if (isDbRealNameGame(target) && getDeviceType() === 1) {
      return reserveGameWindow(
        `width=${screen.width},height=${screen.height},scrollbars=yes,resizable=yes,location=yes`,
      )
    }
    return reserveGameWindow()
  }

  async function launch(
    target: CasinoLaunchTarget,
    clubId?: number,
    reserved: ReservedGameWindow = null,
  ): Promise<void> {
    const finishLaunch = beginGameLaunch()
    try {
      const isDbRealName = isDbRealNameGame(target)
      const deviceType = getDeviceType()
      const res = await joinCasinoGame(
        {
          game_api_type: target.gameApiType,
          game_room_id: target.gameRoomId || 0,
          game_type: isDbRealName ? '0' : String(target.gameType),
          amount: 0,
          device_type: isDbRealName ? 2 : deviceType,
          currency_type: 1,
        },
        clubId,
      )
      finishLaunch()
      if (res.code === 0 && res.data) {
        const gameUrl = res.data.url || res.data.game_url
        if (gameUrl) {
          if (!launchGameUrl(reserved, gameUrl, isDbRealName && deviceType === 1)) {
            releaseGameWindow(reserved)
            if (usesTelegramGameLauncher()) {
              showGameToast(t('UICasino_LaunchFail'))
            } else {
              gameLaunchStore.openFallback(gameUrl)
            }
          }
        } else {
          releaseGameWindow(reserved)
          showGameToast(t('UICasino_LaunchFail'))
        }
      } else {
        releaseGameWindow(reserved)
        showGameToast((res.msg as string) || t('UICasino_LaunchFail'))
      }
    } catch (error: any) {
      finishLaunch()
      releaseGameWindow(reserved)
      showGameToast(error?.response?.data?.msg || t('UICasino_LaunchFail'))
    }
  }

  function play(game: ExtendGameRecord, clubId?: number): void {
    if (!requireRealUser(() => play(game, clubId))) return
    if (game.game_type === 'cow_boy' || game.game_api_type === 'cow_boy') {
      showGameToast(t('UICasino_DownloadAppTip'))
      return
    }
    const target = toCasinoLaunchTarget(game)
    void launch(target, clubId, reserveWindow(target))
  }

  return { reserveWindow, launch, play }
}
