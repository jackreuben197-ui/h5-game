// 文案转换：opcode → 文案；房间盲注/底分/前注 → 文案。
// 对齐 cocos 客户端：UIClubProfitDetailStatistics.cs L99 起的判定逻辑、
// UIMineBillComponent.SetItemDataInfo 和 UIMineBillComponentHelper 的 op_code 映射。
import { getLocale, t } from '@/i18n'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'

const GAME_TYPE_HOLDEM = 0
const GAME_TYPE_OMAHA4 = 1
const GAME_TYPE_OMAHA5 = 2
const GAME_TYPE_OMAHA6 = 3
const GAME_TYPE_FANTASY = 4
const GAME_TYPE_COWBOY = 5
const GAME_TYPE_MAHJONG = 6
const GAME_TYPE_EGG = 7

const POKER_TYPE_NORMAL = 0
const POKER_TYPE_SIX_PLUS = 2

// 对齐 UIMineBillComponentHelper.GetOpCode：牛仔记录里 CBBI/CBBO 复用 BRINGIN/BRINGOUT 文案。
const OP_CODE_ALIAS: Record<string, string> = {
  CBBI: 'BRINGIN',
  CBBO: 'BRINGOUT',
}

// Unity SetItemDataInfo 的 else-if 链：少数 op_code 不读 OpCodeString_*，直接走固定文案 key。
const OP_CODE_OVERRIDE_LABEL: Record<string, string> = {
  USERPAYWATCH: 'UIBill_payLookHandCardName2',
  USERBEWATCHEDGETPAY: 'UIBill_payLookHandCardName1',
  WHEELAWARD: 'UIPropExchangeDes',
  CLUBPFTROOM: 'UIGuildClubRoomFee',
  CLUBINSUROUT: 'UIGuildClubInsuranceIncome',
  CLUBINSURIN: 'UIGuildClubInsuranceIncome',
  CLUBPFTMTT: 'UIGuildClubMTTFee',
  CLUBPFTCBIN: 'UIGuildClubDetailsCowboyTip',
  CLUBPFTCBOUT: 'UIGuildClubDetailsCowboyTip',
  RECSELFPFT: 'UIGuild_MembeDetailRBTip',
  PFTJP: 'UIClubFun_JackpotTip',
  JACKPOTIN: 'Earning_JackPot',
  USERDEDUCTROOM: 'UIGuildClubPlayerProfitDeduction',
  MTTTICKETINSURPAY: 'UIMatch_BillInsuranceTips',
  // 重置可支配额度：客户端 UIMineBillComponent 没处理这个 op_code，但 H5 想统一显示，借俱乐部资金记录的文案。
  RESETCREDIT: 'UIClubCreditLimit6',
}

// 模板里 {0} 需要替换成"内部桌/外部桌/朋友桌"的 op_code 集合。
const OP_CODES_NEED_TABLE_LABEL = new Set<string>([
  'CREATEFRIENDTABLE',
  'CLOSEFRIENDTABLE',
  'CREATEINSIDETABLE',
  'CLOSEINSIDETABLE',
  'SCOREBOARDFEE',
  'SCOREBOARDFEERTN',
  'VIDEOTABLEFEE',
  'VIDEOTABLEFEERTN',
  'AUDIOTABLEFEE',
  'AUDIOTABLEFEERTN',
  'FACETABLEFEE',
  'FACETABLEFEERTN',
  'DELAYINSIDETABLE',
  'DELAYINSIDERTN',
  'DELAYFRIENDTABLE',
  'DELAYFRIENDRTN',
])

// src_type → 牌局类型前缀 key，对齐 Unity switch(itemData.src_type)。
const SRC_TYPE_LABEL_KEY: Record<number, string> = {
  1: 'UITexasInfo_Texas', // 德州
  2: 'UITexasInfo_mtt', // 锦标赛
  3: 'UIData_YGvXd5iXr_011', // 德州牛仔
}

// 不向标题追加 src_type 前缀的 op_code（与 Unity FORFEIT*/DEPOSIT* 分支一致）。
const OP_CODES_SKIP_SRC_TYPE = new Set<string>([
  'FORFEITIN',
  'FORFEITOUT',
  'DEPOSITADV',
  'DEPOSITRTN',
])

export interface BillRoomInfoContext {
  originType?: number
  shareTable?: number
  gameType?: number
  pokerType?: number
}

export interface BillTitleContext {
  opCode?: string
  goldType?: number
  srcType?: number
  roomName?: string
  roomInfo?: BillRoomInfoContext
}

// 把 CBBI/CBBO 这种"概念别名" op_code 归一化到底层 key，未命中的原样返回。
export function normalizeBillOpCode(code: unknown): string {
  const raw = String(code ?? '').trim()
  return OP_CODE_ALIAS[raw] ?? raw
}

// 取 i18n 文案：命中返回值；未命中（i18n 兜底回填 key 自身）返回空串。
function lookupI18n(key: string): string {
  if (!key) return ''
  const text = t(key)
  return text && text !== key ? text : ''
}

function resolveTableLabel(roomInfo: BillRoomInfoContext | undefined): string {
  if (!roomInfo) return ''
  const originType = Number(roomInfo.originType ?? 0)
  if (originType === 3) {
    if (roomInfo.shareTable === 1) return lookupI18n('UIGuild_InsideTable')
    if (roomInfo.shareTable === 2) return lookupI18n('UIGuild_ExternalTable')
    return ''
  }
  if (originType === 4) {
    return lookupI18n('UIMessage_Default')
  }
  return ''
}

// 决定 {0} 占位符要填什么。CLUBTOUSER 在 UC tab 填 "UC"，记分牌 tab 填 "GC"，钻石 tab 填牌桌标签。
function resolvePlaceholderArg(
  opCode: string,
  ctx: BillTitleContext,
  activeTab: number,
): string {
  if (opCode === 'CLUBTOUSER') {
    if (activeTab === 4) return resolveTableLabel(ctx.roomInfo)
    return activeTab === 1 ? 'UC' : 'GC'
  }
  if (OP_CODES_NEED_TABLE_LABEL.has(opCode)) {
    return resolveTableLabel(ctx.roomInfo)
  }
  return ''
}

// 最小化版本：仅做 OpCodeString_<code> 模板查表，不替换 {0}、不归一化 op_code。
// 给已经知道 key 完整的旧调用点保留兼容。
export function resolveOpCodeText(opCodeRaw: unknown): string {
  const opCode = String(opCodeRaw ?? '').trim()
  if (!opCode) {
    return ''
  }

  const key = `OpCodeString_${opCode}`
  return resolveTemplateTextByKey(key, getLocale()) || t(key) || key
}

// 解析 op_code 的本地化文案：归一化 CBBI/CBBO；override key 优先；{0} 按 ctx + activeTab 替换。
// 未找到模板时返回空串（调用方决定 fallback），避免页面出现裸的 "OpCodeString_XXX"。
export function resolveBillOpCodeText(ctx: BillTitleContext, activeTab: number): string {
  const opCode = normalizeBillOpCode(ctx.opCode)
  if (!opCode) return ''

  const overrideKey = OP_CODE_OVERRIDE_LABEL[opCode]
  if (overrideKey) {
    const overrideText = lookupI18n(overrideKey)
    if (overrideText) return overrideText
  }

  const template = lookupI18n(`OpCodeString_${opCode}`)
  if (!template) return ''

  if (!template.includes('{0}')) {
    return template
  }
  const arg0 = resolvePlaceholderArg(opCode, ctx, activeTab)
  return template.replace(/\{0\}/g, arg0)
}

// 组装账单卡片标题：op_code 本地化文案 + 可选的 src_type 前缀 + 房间名，对齐 Unity 的 _titleSB 串联。
export function resolveBillTitle(ctx: BillTitleContext, activeTab: number): string {
  const opCodeText = resolveBillOpCodeText(ctx, activeTab)
  const opCode = normalizeBillOpCode(ctx.opCode)
  const roomName = (ctx.roomName ?? '').trim()
  const skipSrcType = OP_CODES_SKIP_SRC_TYPE.has(opCode)

  let suffix = ''
  if (!skipSrcType) {
    const srcTypeKey = SRC_TYPE_LABEL_KEY[Number(ctx.srcType ?? 0)]
    const srcTypeLabel = srcTypeKey ? lookupI18n(srcTypeKey) : ''
    if (srcTypeLabel || roomName) {
      const dot = roomName ? ' · ' : ''
      suffix = srcTypeLabel ? ` ${srcTypeLabel}${dot}${roomName}` : roomName ? ` · ${roomName}` : ''
    }
  } else if (roomName) {
    suffix = ` · ${roomName}`
  }

  const composed = `${opCodeText}${suffix}`.trim()
  return composed
}

export interface BlindTextParams {
  gameType: number
  pokerType: number
  sb: number
  ante?: number
  bombpot?: number
  isMatch?: boolean
  matchPlayerNum?: number
}

export interface BlindText {
  label: string
  value: string
}

// 统一牌局玩法名称，页面只负责追加 MTT/SNG 等业务前缀。
export function resolveGameTypeText(gameType: number, pokerType: number): string {
  const isHoldemFamily =
    gameType === GAME_TYPE_HOLDEM ||
    gameType === GAME_TYPE_OMAHA4 ||
    gameType === GAME_TYPE_OMAHA5 ||
    gameType === GAME_TYPE_OMAHA6

  if (isHoldemFamily && pokerType === POKER_TYPE_SIX_PLUS) return '6+'
  if (gameType === GAME_TYPE_HOLDEM) return 'NLH'
  if (
    gameType === GAME_TYPE_OMAHA4 ||
    gameType === GAME_TYPE_OMAHA5 ||
    gameType === GAME_TYPE_OMAHA6
  ) {
    return 'PLO'
  }
  if (gameType === GAME_TYPE_FANTASY) return 'ToroFlops'
  if (gameType === GAME_TYPE_COWBOY) return 'Cowboy'
  if (gameType === GAME_TYPE_MAHJONG) return t('Mahjong_Name')
  if (gameType === GAME_TYPE_EGG) return t('UIEgg')
  return t('UIGameplayRule_GamblingParty')
}

// 对齐客户端牌局记录：MTT 人数 → 牛仔 → bombpot/SixPlus 前注 → 特殊底分 → 默认盲注。
export function resolveBlindText(params: BlindTextParams): BlindText {
  const {
    gameType,
    pokerType,
    sb,
    ante = sb * 2,
    bombpot = 0,
    isMatch = false,
    matchPlayerNum = 0,
  } = params

  if (isMatch) {
    return {
      label: t('UIMine_RecordDetailForMatchPariticipants'),
      value: `${matchPlayerNum}`,
    }
  }
  if (gameType === GAME_TYPE_COWBOY) {
    return { label: t('UICareerRecordDetailForNiuZai'), value: '' }
  }

  const isHoldemFamily =
    gameType === GAME_TYPE_HOLDEM ||
    gameType === GAME_TYPE_OMAHA4 ||
    gameType === GAME_TYPE_OMAHA5 ||
    gameType === GAME_TYPE_OMAHA6
  const isBombpot = bombpot === 1 && gameType !== GAME_TYPE_MAHJONG
  const isSixPlus = isHoldemFamily && pokerType === POKER_TYPE_SIX_PLUS

  if (isBombpot || isSixPlus) {
    return { label: t('UIClub_RoomCreat_gmo7laWj'), value: `${ante}` }
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
