// 文案转换：opcode → 文案；房间盲注/底分/前注 → 文案。
// 对齐 cocos 客户端 UIClubProfitDetailStatistics.cs L99 起的判定逻辑。
import { getLocale, t } from '@/i18n'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'

const GAME_TYPE_HOLDEM = 0
const GAME_TYPE_OMAHA4 = 1
const GAME_TYPE_OMAHA5 = 2
const GAME_TYPE_OMAHA6 = 3
const GAME_TYPE_FANTASY = 4
const GAME_TYPE_MAHJONG = 6
const GAME_TYPE_EGG = 7

const POKER_TYPE_NORMAL = 0
const POKER_TYPE_SIX_PLUS = 2

export function resolveOpCodeText(opCodeRaw: unknown): string {
  const opCode = String(opCodeRaw ?? '').trim()
  if (!opCode) {
    return ''
  }

  const key = `OpCodeString_${opCode}`
  return resolveTemplateTextByKey(key, getLocale()) || t(key) || key
}

export interface BlindTextParams {
  gameType: number
  pokerType: number
  sb: number
  bombpot?: number
}

export interface BlindText {
  label: string
  value: string
}

// 判定优先级：bombpot/SixPlus → Fantasy → Mahjong/Egg → 默认（NLH/PLO 盲注 sb/sb*2）。
export function resolveBlindText(params: BlindTextParams): BlindText {
  const { gameType, pokerType, sb, bombpot = 0 } = params

  const isHoldemFamily =
    gameType === GAME_TYPE_HOLDEM ||
    gameType === GAME_TYPE_OMAHA4 ||
    gameType === GAME_TYPE_OMAHA5 ||
    gameType === GAME_TYPE_OMAHA6
  const isBombpot = bombpot === 1 && gameType !== GAME_TYPE_MAHJONG
  const isSixPlus = isHoldemFamily && pokerType === POKER_TYPE_SIX_PLUS

  if (isBombpot || isSixPlus) {
    return { label: t('UIClub_RoomCreat_gmo7laWj'), value: `${sb * 2}` }
  }
  if (gameType === GAME_TYPE_FANTASY && pokerType === POKER_TYPE_NORMAL) {
    return { label: t('UIFantasy_Dizhu2'), value: `${sb}` }
  }
  if (
    (gameType === GAME_TYPE_MAHJONG && pokerType >= 0 && pokerType <= 2) ||
    (gameType === GAME_TYPE_EGG && pokerType === POKER_TYPE_NORMAL)
  ) {
    return { label: t('Mahjong_LowScore'), value: `${sb}` }
  }
  return { label: t('UIMine_RecordDetailForNormal_mz'), value: `${sb}/${sb * 2}` }
}
