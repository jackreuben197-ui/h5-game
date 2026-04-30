// package: holdem.pb
// file: protobuf/holdem/define.proto

import * as jspb from "google-protobuf";

export class Def extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Def.AsObject;
  static toObject(includeInstance: boolean, msg: Def): Def.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Def, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Def;
  static deserializeBinaryFromReader(message: Def, reader: jspb.BinaryReader): Def;
}

export namespace Def {
  export type AsObject = {
  }

  export interface ActionMap {
    NONE: 0;
    ANTE: 1;
    SB: 2;
    BB: 3;
    STRADDLE: 4;
    BET: 5;
    CALL: 6;
    FOLD: 7;
    CHECK: 8;
    RAISE: 9;
    ALLIN: 10;
    POST: 11;
    READY: 12;
    POSTANTE: 13;
  }

  export const Action: ActionMap;

  export interface CanPlayStatusMap {
    DISABLE: 0;
    NORMAL: 1;
    NEED_POST: 2;
    AGREE_POST: 3;
    KEEP_SEAT: 4;
  }

  export const CanPlayStatus: CanPlayStatusMap;

  export interface GameStatusMap {
    NOT_START: 0;
    WAIT_HAND_START: 1;
    HAND_STARTED: 2;
    HAND_PREFLOP: 3;
    HAND_FLOP: 4;
    HAND_TURN: 5;
    HAND_RIVER: 6;
    HAND_END: 7;
    CANCEL: 8;
    COMPLETE: 9;
    UNKNOWN: 10;
  }

  export const GameStatus: GameStatusMap;

  export interface RoundMap {
    UNDEFINED: 0;
    PREFLOP: 1;
    FLOP: 2;
    TURN: 3;
    RIVER: 4;
  }

  export const Round: RoundMap;

  export interface KeepSeatReasonMap {
    KSR_NONE: 0;
    KSR_TAKE_SEAT: 1;
    KSR_ACTIVE: 2;
    KSR_NOCHIP: 3;
    KSR_DELAY_LEAVE: 4;
  }

  export const KeepSeatReason: KeepSeatReasonMap;

  export interface StandUpReasonMap {
    SUR_NONE: 0;
    SUR_NOCHIP: 1;
    SUR_ACTIVE: 2;
    SUR_GAME_END: 3;
    SUR_FORCE: 4;
    SUR_EXCHANGE: 5;
    SUR_AUTO_EXCEED_MAX_TIMES: 6;
    SUR_KEEPSEAT_TIMEOUT: 7;
    SUR_ACTIVE_LEAVE: 8;
    SUR_AUTO_CHANGE_ROOM: 9;
    SUR_MANUAL_CHANGE_ROOM: 10;
  }

  export const StandUpReason: StandUpReasonMap;

  export interface LeaveReasonMap {
    LR_NONE: 0;
    LR_NOCHIP: 1;
    LR_ACTIVE: 2;
    LR_GAME_END: 3;
    LR_FORCE: 4;
    LR_EXCHANGE: 5;
    LR_AUTO_EXCEED_MAX_TIMES: 6;
    LR_OFFLINE: 7;
    LR_AUTO_CHANGE_ROOM: 8;
    LR_PLAYER_NOT_ENOUGH: 9;
  }

  export const LeaveReason: LeaveReasonMap;

  export interface ChipChangeReasonMap {
    CC_NONE: 0;
    CC_STORE_CHIP: 1;
    CC_AUTO_ON_TABLE: 2;
    CC_MTT_ADD_ON: 3;
    CC_MTT_STORE_RETURN: 4;
    CC_MTT_ADD_ON_PLUS_MODE1: 5;
    CC_MTT_ADD_ON_PLUS_MODE2: 6;
    CC_MUSHROOM_SPLIT: 7;
    CC_SQUID_SPLIT: 8;
  }

  export const ChipChangeReason: ChipChangeReasonMap;

  export interface ActionShortcutMap {
    SC_1_2: 0;
    SC_1_3: 1;
    SC_1_4: 2;
    SC_2_3: 3;
    SC_3_4: 4;
    SC_3_5: 5;
    SC_1_1: 6;
    SC_15_10: 7;
  }

  export const ActionShortcut: ActionShortcutMap;

  export interface MTTPropBuyTypeMap {
    MTTPBT_NOT_SUPPORT: 0;
    MTTPBT_ONLY: 1;
    MTTPBT_MIX: 2;
  }

  export const MTTPropBuyType: MTTPropBuyTypeMap;

  export interface ConsumeTypeMap {
    CT_NONE: 0;
    CT_MSG_1: 1;
    CT_MSG_2: 2;
    CT_MSG_3: 3;
    CT_MSG_4: 4;
    CT_EMOJI_1: 5;
    CT_EMOJI_2: 6;
    CT_EMOJI_3: 7;
    CT_EMOJI_4: 8;
    CT_DELAY_1: 9;
    CT_DELAY_2: 10;
    CT_DELAY_3: 11;
    CT_DELAY_4: 12;
    CT_VC_1: 13;
    CT_VC_2: 14;
    CT_DELAY_5: 15;
    CT_DELAY_6: 16;
  }

  export const ConsumeType: ConsumeTypeMap;

  export interface GameTypeMap {
    HOLDEM: 0;
    OMAHA4: 1;
    OMAHA5: 2;
    OMAHA6: 3;
  }

  export const GameType: GameTypeMap;

  export interface PokerTypeMap {
    STANDARD: 0;
    SIXPLUS_FIX: 2;
  }

  export const PokerType: PokerTypeMap;

  export interface LimitBetTypeMap {
    NO_LIMIT: 0;
    POT_LIMIT: 1;
    AOF: 2;
  }

  export const LimitBetType: LimitBetTypeMap;

  export interface AddOnModeMap {
    ADDON_NONE: 0;
    PLUS_MODE1: 1;
    PLUS_MODE2: 2;
    ADDON_NORMAL: 3;
  }

  export const AddOnMode: AddOnModeMap;

  export interface EHCTypeMap {
    EHC_NONE: 0;
    EHC_MUSHROOM: 1;
    EHC_LUCKYCARDS: 2;
    EHC_SQUID: 3;
  }

  export const EHCType: EHCTypeMap;

  export interface IIReasonMap {
    IIR_NONE: 0;
    IIR_ZERO_OUTS: 1;
    IIR_NO_ODDS_FOUND: 2;
    IIR_NO_ODDS_TABLE_FOUND: 3;
    IIR_LEADER_LIMIT: 4;
    IIR_EV_LIMIT: 5;
  }

  export const IIReason: IIReasonMap;

  export interface PropBuyTypeMap {
    NOT_SUPPORT: 0;
    ONLY_PROP: 1;
    MIX: 2;
  }

  export const PropBuyType: PropBuyTypeMap;

  export interface DealDelayTypeMap {
    UNKOWN: 0;
    GG: 1;
    HH: 2;
  }

  export const DealDelayType: DealDelayTypeMap;

  export interface BroadcastMsgTypeMap {
    BC_MSG_NONE: 0;
    BC_MSG_EMOJI: 1;
    BC_MSG_BULLET: 2;
    BC_MSG_AVATAR: 3;
    BC_MSG_THROW: 4;
  }

  export const BroadcastMsgType: BroadcastMsgTypeMap;

  export interface MatchingResultStatusMap {
    MR_STATUS_NONE: 0;
    MR_STATUS_SUCCESS: 1;
    MR_STATUS_TIME_OUT: 2;
    MR_STATUS_LESS_GOLD: 3;
  }

  export const MatchingResultStatus: MatchingResultStatusMap;

  export interface RoomModeMap {
    RM_NORMAL: 0;
    RM_MATCHING: 1;
    RM_MATCHING_WAITING: 2;
  }

  export const RoomMode: RoomModeMap;

  export interface IsuranceModeMap {
    IM_NORMAL: 0;
    IM_WPK: 1;
    IM_EV: 2;
    IM_NEW_NORMAL: 3;
  }

  export const IsuranceMode: IsuranceModeMap;

  export interface UserQuitClubReasonMap {
    UQCR_QUIT: 0;
    UQCR_KICKOUT: 1;
    UQCR_CLOSECLUB: 2;
  }

  export const UserQuitClubReason: UserQuitClubReasonMap;

  export interface WantSeatTypeMap {
    WST_BOTH: 0;
    WST_YES: 1;
    WST_NO: 2;
  }

  export const WantSeatType: WantSeatTypeMap;

  export interface SeriesListTypeMap {
    SLT_0: 0;
    SLT_1: 1;
    SLT_2: 2;
    SLT_3: 3;
  }

  export const SeriesListType: SeriesListTypeMap;
}

export class Room extends jspb.Message {
  getRoomId(): number;
  setRoomId(value: number): void;

  getMatchId(): number;
  setMatchId(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Room.AsObject;
  static toObject(includeInstance: boolean, msg: Room): Room.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Room, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Room;
  static deserializeBinaryFromReader(message: Room, reader: jspb.BinaryReader): Room;
}

export namespace Room {
  export type AsObject = {
    roomId: number,
    matchId: number,
  }
}

export class Operator extends jspb.Message {
  getSeatId(): number;
  setSeatId(value: number): void;

  clearActionsList(): void;
  getActionsList(): Array<ActionLimit>;
  setActionsList(value: Array<ActionLimit>): void;
  addActions(value?: ActionLimit, index?: number): ActionLimit;

  clearInsuranceLimitList(): void;
  getInsuranceLimitList(): Array<InsurancePotLimit>;
  setInsuranceLimitList(value: Array<InsurancePotLimit>): void;
  addInsuranceLimit(value?: InsurancePotLimit, index?: number): InsurancePotLimit;

  getLeftOpTime(): number;
  setLeftOpTime(value: number): void;

  getDelayTimes(): number;
  setDelayTimes(value: number): void;

  clearShortcutsList(): void;
  getShortcutsList(): Array<ActionShortcutLimit>;
  setShortcutsList(value: Array<ActionShortcutLimit>): void;
  addShortcuts(value?: ActionShortcutLimit, index?: number): ActionShortcutLimit;

  getIsInsurance(): boolean;
  setIsInsurance(value: boolean): void;

  getIsAgreeSecondPc(): boolean;
  setIsAgreeSecondPc(value: boolean): void;

  getOpDeadline(): number;
  setOpDeadline(value: number): void;

  clearInvalidInsurancePotsList(): void;
  getInvalidInsurancePotsList(): Array<InsurancePotInvalid>;
  setInvalidInsurancePotsList(value: Array<InsurancePotInvalid>): void;
  addInvalidInsurancePots(value?: InsurancePotInvalid, index?: number): InsurancePotInvalid;

  clearCardsList(): void;
  getCardsList(): Array<number>;
  setCardsList(value: Array<number>): void;
  addCards(value: number, index?: number): number;

  clearPlayerCardsList(): void;
  getPlayerCardsList(): Array<PlayerCards>;
  setPlayerCardsList(value: Array<PlayerCards>): void;
  addPlayerCards(value?: PlayerCards, index?: number): PlayerCards;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Operator.AsObject;
  static toObject(includeInstance: boolean, msg: Operator): Operator.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Operator, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Operator;
  static deserializeBinaryFromReader(message: Operator, reader: jspb.BinaryReader): Operator;
}

export namespace Operator {
  export type AsObject = {
    seatId: number,
    actionsList: Array<ActionLimit.AsObject>,
    insuranceLimitList: Array<InsurancePotLimit.AsObject>,
    leftOpTime: number,
    delayTimes: number,
    shortcutsList: Array<ActionShortcutLimit.AsObject>,
    isInsurance: boolean,
    isAgreeSecondPc: boolean,
    opDeadline: number,
    invalidInsurancePotsList: Array<InsurancePotInvalid.AsObject>,
    cardsList: Array<number>,
    playerCardsList: Array<PlayerCards.AsObject>,
  }
}

export class RoomInfo extends jspb.Message {
  getAnte(): number;
  setAnte(value: number): void;

  getSmallBlind(): number;
  setSmallBlind(value: number): void;

  getScheduleStartTime(): number;
  setScheduleStartTime(value: number): void;

  getSchedulePlayDuration(): number;
  setSchedulePlayDuration(value: number): void;

  getStartTime(): number;
  setStartTime(value: number): void;

  getCurrentMinRate(): number;
  setCurrentMinRate(value: number): void;

  getCurrentMaxRate(): number;
  setCurrentMaxRate(value: number): void;

  getLimitIp(): boolean;
  setLimitIp(value: boolean): void;

  getLimitGps(): boolean;
  setLimitGps(value: boolean): void;

  getInsurance(): boolean;
  setInsurance(value: boolean): void;

  getLimitPoolRateAllLv(): boolean;
  setLimitPoolRateAllLv(value: boolean): void;

  getLimitMinPoolRate(): number;
  setLimitMinPoolRate(value: number): void;

  getLimitRetainMinRate(): number;
  setLimitRetainMinRate(value: number): void;

  getLimitTotalHandNumAllLv(): boolean;
  setLimitTotalHandNumAllLv(value: boolean): void;

  getLimitTotalHandNum(): number;
  setLimitTotalHandNum(value: number): void;

  getDelaySeeCard(): boolean;
  setDelaySeeCard(value: boolean): void;

  getStraddle(): boolean;
  setStraddle(value: boolean): void;

  getOpDuration(): number;
  setOpDuration(value: number): void;

  getRetainType(): RoomInfo.RetainTypeMap[keyof RoomInfo.RetainTypeMap];
  setRetainType(value: RoomInfo.RetainTypeMap[keyof RoomInfo.RetainTypeMap]): void;

  getMuck(): boolean;
  setMuck(value: boolean): void;

  getUniqueId(): string;
  setUniqueId(value: string): void;

  getIsAgreeSecondPcs(): boolean;
  setIsAgreeSecondPcs(value: boolean): void;

  getIgnorePreflop(): boolean;
  setIgnorePreflop(value: boolean): void;

  getIsAlwaysSecondPcs(): boolean;
  setIsAlwaysSecondPcs(value: boolean): void;

  getMushroomBase(): number;
  setMushroomBase(value: number): void;

  getDeposit(): number;
  setDeposit(value: number): void;

  clearLuckycardsList(): void;
  getLuckycardsList(): Array<Luckycards>;
  setLuckycardsList(value: Array<Luckycards>): void;
  addLuckycards(value?: Luckycards, index?: number): Luckycards;

  getAnteMin(): number;
  setAnteMin(value: number): void;

  getAnteMax(): number;
  setAnteMax(value: number): void;

  getSeatedMessaging(): boolean;
  setSeatedMessaging(value: boolean): void;

  getRoomType(): number;
  setRoomType(value: number): void;

  getAntiCheatType(): number;
  setAntiCheatType(value: number): void;

  getAntiCheatVideoType(): number;
  setAntiCheatVideoType(value: number): void;

  getSquidBase(): number;
  setSquidBase(value: number): void;

  getPersonalType(): number;
  setPersonalType(value: number): void;

  getWinTotal(): number;
  setWinTotal(value: number): void;

  getCallTimeCount(): number;
  setCallTimeCount(value: number): void;

  getJackpot(): number;
  setJackpot(value: number): void;

  getJackpotGold(): number;
  setJackpotGold(value: number): void;

  getJackpotParentGold(): number;
  setJackpotParentGold(value: number): void;

  getMode(): Def.RoomModeMap[keyof Def.RoomModeMap];
  setMode(value: Def.RoomModeMap[keyof Def.RoomModeMap]): void;

  getRandomAnte(): string;
  setRandomAnte(value: string): void;

  getCriticalHit(): number;
  setCriticalHit(value: number): void;

  getAutoChangeRoomLimitHand(): number;
  setAutoChangeRoomLimitHand(value: number): void;

  getInsuranceMode(): Def.IsuranceModeMap[keyof Def.IsuranceModeMap];
  setInsuranceMode(value: Def.IsuranceModeMap[keyof Def.IsuranceModeMap]): void;

  getWheelTemplateId(): number;
  setWheelTemplateId(value: number): void;

  getSquidTotalLimit(): number;
  setSquidTotalLimit(value: number): void;

  getLimitRetainMaxRate(): number;
  setLimitRetainMaxRate(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoomInfo.AsObject;
  static toObject(includeInstance: boolean, msg: RoomInfo): RoomInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RoomInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RoomInfo;
  static deserializeBinaryFromReader(message: RoomInfo, reader: jspb.BinaryReader): RoomInfo;
}

export namespace RoomInfo {
  export type AsObject = {
    ante: number,
    smallBlind: number,
    scheduleStartTime: number,
    schedulePlayDuration: number,
    startTime: number,
    currentMinRate: number,
    currentMaxRate: number,
    limitIp: boolean,
    limitGps: boolean,
    insurance: boolean,
    limitPoolRateAllLv: boolean,
    limitMinPoolRate: number,
    limitRetainMinRate: number,
    limitTotalHandNumAllLv: boolean,
    limitTotalHandNum: number,
    delaySeeCard: boolean,
    straddle: boolean,
    opDuration: number,
    retainType: RoomInfo.RetainTypeMap[keyof RoomInfo.RetainTypeMap],
    muck: boolean,
    uniqueId: string,
    isAgreeSecondPcs: boolean,
    ignorePreflop: boolean,
    isAlwaysSecondPcs: boolean,
    mushroomBase: number,
    deposit: number,
    luckycardsList: Array<Luckycards.AsObject>,
    anteMin: number,
    anteMax: number,
    seatedMessaging: boolean,
    roomType: number,
    antiCheatType: number,
    antiCheatVideoType: number,
    squidBase: number,
    personalType: number,
    winTotal: number,
    callTimeCount: number,
    jackpot: number,
    jackpotGold: number,
    jackpotParentGold: number,
    mode: Def.RoomModeMap[keyof Def.RoomModeMap],
    randomAnte: string,
    criticalHit: number,
    autoChangeRoomLimitHand: number,
    insuranceMode: Def.IsuranceModeMap[keyof Def.IsuranceModeMap],
    wheelTemplateId: number,
    squidTotalLimit: number,
    limitRetainMaxRate: number,
  }

  export interface RetainTypeMap {
    RT_DISABLE: 0;
    RT_AUTO: 1;
    RT_MANUAL: 2;
  }

  export const RetainType: RetainTypeMap;
}

export class Luckycards extends jspb.Message {
  clearCardsList(): void;
  getCardsList(): Array<number>;
  setCardsList(value: Array<number>): void;
  addCards(value: number, index?: number): number;

  clearAwardsList(): void;
  getAwardsList(): Array<number>;
  setAwardsList(value: Array<number>): void;
  addAwards(value: number, index?: number): number;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Luckycards.AsObject;
  static toObject(includeInstance: boolean, msg: Luckycards): Luckycards.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Luckycards, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Luckycards;
  static deserializeBinaryFromReader(message: Luckycards, reader: jspb.BinaryReader): Luckycards;
}

export namespace Luckycards {
  export type AsObject = {
    cardsList: Array<number>,
    awardsList: Array<number>,
  }
}

export class HandInfo extends jspb.Message {
  getHandNum(): number;
  setHandNum(value: number): void;

  getBuSeatId(): number;
  setBuSeatId(value: number): void;

  getSbSeatId(): number;
  setSbSeatId(value: number): void;

  getBbSeatId(): number;
  setBbSeatId(value: number): void;

  clearPublicCardsList(): void;
  getPublicCardsList(): Array<number>;
  setPublicCardsList(value: Array<number>): void;
  addPublicCards(value: number, index?: number): number;

  getAllBet(): number;
  setAllBet(value: number): void;

  clearPotsList(): void;
  getPotsList(): Array<SidePot>;
  setPotsList(value: Array<SidePot>): void;
  addPots(value?: SidePot, index?: number): SidePot;

  getRoundBet(): number;
  setRoundBet(value: number): void;

  getInsurancePool(): number;
  setInsurancePool(value: number): void;

  clearExtPublicCardsList(): void;
  getExtPublicCardsList(): Array<number>;
  setExtPublicCardsList(value: Array<number>): void;
  addExtPublicCards(value: number, index?: number): number;

  clearSecondPublicCardsList(): void;
  getSecondPublicCardsList(): Array<number>;
  setSecondPublicCardsList(value: Array<number>): void;
  addSecondPublicCards(value: number, index?: number): number;

  hasPools(): boolean;
  clearPools(): void;
  getPools(): ExternalPools | undefined;
  setPools(value?: ExternalPools): void;

  getInSquid(): boolean;
  setInSquid(value: boolean): void;

  clearSecondPotsList(): void;
  getSecondPotsList(): Array<SidePot>;
  setSecondPotsList(value: Array<SidePot>): void;
  addSecondPots(value?: SidePot, index?: number): SidePot;

  getConRounds(): number;
  setConRounds(value: number): void;

  clearDealOrderList(): void;
  getDealOrderList(): Array<number>;
  setDealOrderList(value: Array<number>): void;
  addDealOrder(value: number, index?: number): number;

  getCriticalHitOpen(): boolean;
  setCriticalHitOpen(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HandInfo.AsObject;
  static toObject(includeInstance: boolean, msg: HandInfo): HandInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HandInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HandInfo;
  static deserializeBinaryFromReader(message: HandInfo, reader: jspb.BinaryReader): HandInfo;
}

export namespace HandInfo {
  export type AsObject = {
    handNum: number,
    buSeatId: number,
    sbSeatId: number,
    bbSeatId: number,
    publicCardsList: Array<number>,
    allBet: number,
    potsList: Array<SidePot.AsObject>,
    roundBet: number,
    insurancePool: number,
    extPublicCardsList: Array<number>,
    secondPublicCardsList: Array<number>,
    pools?: ExternalPools.AsObject,
    inSquid: boolean,
    secondPotsList: Array<SidePot.AsObject>,
    conRounds: number,
    dealOrderList: Array<number>,
    criticalHitOpen: boolean,
  }
}

export class MTTInfo extends jspb.Message {
  getUpBlindInterval(): number;
  setUpBlindInterval(value: number): void;

  getBlindType(): number;
  setBlindType(value: number): void;

  getRebuyTimes(): number;
  setRebuyTimes(value: number): void;

  getMaxRebuyBlindLevel(): number;
  setMaxRebuyBlindLevel(value: number): void;

  getRebuyScore(): number;
  setRebuyScore(value: number): void;

  getAddOn(): boolean;
  setAddOn(value: boolean): void;

  getStartAddOnBlindLevel(): number;
  setStartAddOnBlindLevel(value: number): void;

  getEndAddOnBlindLevel(): number;
  setEndAddOnBlindLevel(value: number): void;

  getAddOnScore(): number;
  setAddOnScore(value: number): void;

  getHuntMode(): boolean;
  setHuntMode(value: boolean): void;

  getHunterBonus(): number;
  setHunterBonus(value: number): void;

  getHunterFee(): number;
  setHunterFee(value: number): void;

  getPoolFee(): number;
  setPoolFee(value: number): void;

  getServiceFee(): number;
  setServiceFee(value: number): void;

  getPartialBringIn(): boolean;
  setPartialBringIn(value: boolean): void;

  getMoneySync(): boolean;
  setMoneySync(value: boolean): void;

  getPartialBringInReturnBlindLevel(): number;
  setPartialBringInReturnBlindLevel(value: number): void;

  getBuyPropId(): number;
  setBuyPropId(value: number): void;

  getPropBuyType(): Def.MTTPropBuyTypeMap[keyof Def.MTTPropBuyTypeMap];
  setPropBuyType(value: Def.MTTPropBuyTypeMap[keyof Def.MTTPropBuyTypeMap]): void;

  getAddOnPlusMode1(): boolean;
  setAddOnPlusMode1(value: boolean): void;

  getAddOnPlusMode1Limit(): number;
  setAddOnPlusMode1Limit(value: number): void;

  getAddOnPlusMode1MaxTimes(): number;
  setAddOnPlusMode1MaxTimes(value: number): void;

  getAddOnPlusMode2(): boolean;
  setAddOnPlusMode2(value: boolean): void;

  getAddOnPlusMode2EndBl(): number;
  setAddOnPlusMode2EndBl(value: number): void;

  getAddOnPlusMode2MaxTimes(): number;
  setAddOnPlusMode2MaxTimes(value: number): void;

  getBuyRatio(): number;
  setBuyRatio(value: number): void;

  getSngId(): number;
  setSngId(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MTTInfo.AsObject;
  static toObject(includeInstance: boolean, msg: MTTInfo): MTTInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MTTInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MTTInfo;
  static deserializeBinaryFromReader(message: MTTInfo, reader: jspb.BinaryReader): MTTInfo;
}

export namespace MTTInfo {
  export type AsObject = {
    upBlindInterval: number,
    blindType: number,
    rebuyTimes: number,
    maxRebuyBlindLevel: number,
    rebuyScore: number,
    addOn: boolean,
    startAddOnBlindLevel: number,
    endAddOnBlindLevel: number,
    addOnScore: number,
    huntMode: boolean,
    hunterBonus: number,
    hunterFee: number,
    poolFee: number,
    serviceFee: number,
    partialBringIn: boolean,
    moneySync: boolean,
    partialBringInReturnBlindLevel: number,
    buyPropId: number,
    propBuyType: Def.MTTPropBuyTypeMap[keyof Def.MTTPropBuyTypeMap],
    addOnPlusMode1: boolean,
    addOnPlusMode1Limit: number,
    addOnPlusMode1MaxTimes: number,
    addOnPlusMode2: boolean,
    addOnPlusMode2EndBl: number,
    addOnPlusMode2MaxTimes: number,
    buyRatio: number,
    sngId: number,
  }
}

export class MTTProgress extends jspb.Message {
  getUpBlindLeftTime(): number;
  setUpBlindLeftTime(value: number): void;

  getNextAnte(): number;
  setNextAnte(value: number): void;

  getNextSmallBlind(): number;
  setNextSmallBlind(value: number): void;

  getStartCountDown(): number;
  setStartCountDown(value: number): void;

  getBlindLevel(): number;
  setBlindLevel(value: number): void;

  getCanAddOn(): boolean;
  setCanAddOn(value: boolean): void;

  getAddonMode(): Def.AddOnModeMap[keyof Def.AddOnModeMap];
  setAddonMode(value: Def.AddOnModeMap[keyof Def.AddOnModeMap]): void;

  getIsBubbleWait(): boolean;
  setIsBubbleWait(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MTTProgress.AsObject;
  static toObject(includeInstance: boolean, msg: MTTProgress): MTTProgress.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MTTProgress, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MTTProgress;
  static deserializeBinaryFromReader(message: MTTProgress, reader: jspb.BinaryReader): MTTProgress;
}

export namespace MTTProgress {
  export type AsObject = {
    upBlindLeftTime: number,
    nextAnte: number,
    nextSmallBlind: number,
    startCountDown: number,
    blindLevel: number,
    canAddOn: boolean,
    addonMode: Def.AddOnModeMap[keyof Def.AddOnModeMap],
    isBubbleWait: boolean,
  }
}

export class MyGameInfo extends jspb.Message {
  getChip(): number;
  setChip(value: number): void;

  getSeatId(): number;
  setSeatId(value: number): void;

  getMttCurrentRank(): number;
  setMttCurrentRank(value: number): void;

  getRebuyTimes(): number;
  setRebuyTimes(value: number): void;

  getAddon(): boolean;
  setAddon(value: boolean): void;

  getHunterKill(): number;
  setHunterKill(value: number): void;

  getHunterKillAward(): number;
  setHunterKillAward(value: number): void;

  getHunterRank(): number;
  setHunterRank(value: number): void;

  getStoreChips(): number;
  setStoreChips(value: number): void;

  getIsAutoop(): boolean;
  setIsAutoop(value: boolean): void;

  getRoundActioned(): boolean;
  setRoundActioned(value: boolean): void;

  getAddonPlusMode1Times(): number;
  setAddonPlusMode1Times(value: number): void;

  getAddonPlusMode2Times(): number;
  setAddonPlusMode2Times(value: number): void;

  getHunterKillAwardOther(): number;
  setHunterKillAwardOther(value: number): void;

  getHunterHeadValue(): number;
  setHunterHeadValue(value: number): void;

  getName(): string;
  setName(value: string): void;

  getAvatar(): string;
  setAvatar(value: string): void;

  getSex(): number;
  setSex(value: number): void;

  getUserSubscriptionId(): number;
  setUserSubscriptionId(value: number): void;

  getWinTotal(): number;
  setWinTotal(value: number): void;

  getCallTimeCount(): number;
  setCallTimeCount(value: number): void;

  getCallTimeStay(): boolean;
  setCallTimeStay(value: boolean): void;

  getTotalChips(): number;
  setTotalChips(value: number): void;

  getAutoChangeRoomHand(): number;
  setAutoChangeRoomHand(value: number): void;

  getLastStoreHandNum(): number;
  setLastStoreHandNum(value: number): void;

  getWantSeat(): Def.WantSeatTypeMap[keyof Def.WantSeatTypeMap];
  setWantSeat(value: Def.WantSeatTypeMap[keyof Def.WantSeatTypeMap]): void;

  getAlreadySeated(): boolean;
  setAlreadySeated(value: boolean): void;

  getSquidRoundSeated(): boolean;
  setSquidRoundSeated(value: boolean): void;

  getWillStandup(): boolean;
  setWillStandup(value: boolean): void;

  getMttRemaindDelayTimes(): number;
  setMttRemaindDelayTimes(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MyGameInfo.AsObject;
  static toObject(includeInstance: boolean, msg: MyGameInfo): MyGameInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MyGameInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MyGameInfo;
  static deserializeBinaryFromReader(message: MyGameInfo, reader: jspb.BinaryReader): MyGameInfo;
}

export namespace MyGameInfo {
  export type AsObject = {
    chip: number,
    seatId: number,
    mttCurrentRank: number,
    rebuyTimes: number,
    addon: boolean,
    hunterKill: number,
    hunterKillAward: number,
    hunterRank: number,
    storeChips: number,
    isAutoop: boolean,
    roundActioned: boolean,
    addonPlusMode1Times: number,
    addonPlusMode2Times: number,
    hunterKillAwardOther: number,
    hunterHeadValue: number,
    name: string,
    avatar: string,
    sex: number,
    userSubscriptionId: number,
    winTotal: number,
    callTimeCount: number,
    callTimeStay: boolean,
    totalChips: number,
    autoChangeRoomHand: number,
    lastStoreHandNum: number,
    wantSeat: Def.WantSeatTypeMap[keyof Def.WantSeatTypeMap],
    alreadySeated: boolean,
    squidRoundSeated: boolean,
    willStandup: boolean,
    mttRemaindDelayTimes: number,
  }
}

export class ActionLimit extends jspb.Message {
  getAction(): Def.ActionMap[keyof Def.ActionMap];
  setAction(value: Def.ActionMap[keyof Def.ActionMap]): void;

  getMin(): number;
  setMin(value: number): void;

  getMax(): number;
  setMax(value: number): void;

  getStraddleLevel(): number;
  setStraddleLevel(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ActionLimit.AsObject;
  static toObject(includeInstance: boolean, msg: ActionLimit): ActionLimit.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ActionLimit, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ActionLimit;
  static deserializeBinaryFromReader(message: ActionLimit, reader: jspb.BinaryReader): ActionLimit;
}

export namespace ActionLimit {
  export type AsObject = {
    action: Def.ActionMap[keyof Def.ActionMap],
    min: number,
    max: number,
    straddleLevel: number,
  }
}

export class ActionShortcutLimit extends jspb.Message {
  getSc(): Def.ActionShortcutMap[keyof Def.ActionShortcutMap];
  setSc(value: Def.ActionShortcutMap[keyof Def.ActionShortcutMap]): void;

  getAmount(): number;
  setAmount(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ActionShortcutLimit.AsObject;
  static toObject(includeInstance: boolean, msg: ActionShortcutLimit): ActionShortcutLimit.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ActionShortcutLimit, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ActionShortcutLimit;
  static deserializeBinaryFromReader(message: ActionShortcutLimit, reader: jspb.BinaryReader): ActionShortcutLimit;
}

export namespace ActionShortcutLimit {
  export type AsObject = {
    sc: Def.ActionShortcutMap[keyof Def.ActionShortcutMap],
    amount: number,
  }
}

export class SidePot extends jspb.Message {
  getPotId(): number;
  setPotId(value: number): void;

  getAmount(): number;
  setAmount(value: number): void;

  clearSeatIdsList(): void;
  getSeatIdsList(): Array<number>;
  setSeatIdsList(value: Array<number>): void;
  addSeatIds(value: number, index?: number): number;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SidePot.AsObject;
  static toObject(includeInstance: boolean, msg: SidePot): SidePot.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SidePot, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SidePot;
  static deserializeBinaryFromReader(message: SidePot, reader: jspb.BinaryReader): SidePot;
}

export namespace SidePot {
  export type AsObject = {
    potId: number,
    amount: number,
    seatIdsList: Array<number>,
  }
}

export class InsurancePotLimit extends jspb.Message {
  getPotId(): number;
  setPotId(value: number): void;

  getPotAmount(): number;
  setPotAmount(value: number): void;

  getBet(): number;
  setBet(value: number): void;

  getMax(): number;
  setMax(value: number): void;

  getMin(): number;
  setMin(value: number): void;

  getInsuranced(): number;
  setInsuranced(value: number): void;

  getOuts(): number;
  setOuts(value: number): void;

  clearOutsDetailList(): void;
  getOutsDetailList(): Array<UserOuts>;
  setOutsDetailList(value: Array<UserOuts>): void;
  addOutsDetail(value?: UserOuts, index?: number): UserOuts;

  getPotUserCount(): number;
  setPotUserCount(value: number): void;

  getPotLeaderCount(): number;
  setPotLeaderCount(value: number): void;

  clearCantBuyOutsList(): void;
  getCantBuyOutsList(): Array<OutsCard>;
  setCantBuyOutsList(value: Array<OutsCard>): void;
  addCantBuyOuts(value?: OutsCard, index?: number): OutsCard;

  getOdds(): number;
  setOdds(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InsurancePotLimit.AsObject;
  static toObject(includeInstance: boolean, msg: InsurancePotLimit): InsurancePotLimit.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: InsurancePotLimit, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InsurancePotLimit;
  static deserializeBinaryFromReader(message: InsurancePotLimit, reader: jspb.BinaryReader): InsurancePotLimit;
}

export namespace InsurancePotLimit {
  export type AsObject = {
    potId: number,
    potAmount: number,
    bet: number,
    max: number,
    min: number,
    insuranced: number,
    outs: number,
    outsDetailList: Array<UserOuts.AsObject>,
    potUserCount: number,
    potLeaderCount: number,
    cantBuyOutsList: Array<OutsCard.AsObject>,
    odds: number,
  }
}

export class InsurancePotInvalid extends jspb.Message {
  getPotId(): number;
  setPotId(value: number): void;

  getPotAmount(): number;
  setPotAmount(value: number): void;

  getOuts(): number;
  setOuts(value: number): void;

  getPotUserCount(): number;
  setPotUserCount(value: number): void;

  getReason(): Def.IIReasonMap[keyof Def.IIReasonMap];
  setReason(value: Def.IIReasonMap[keyof Def.IIReasonMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InsurancePotInvalid.AsObject;
  static toObject(includeInstance: boolean, msg: InsurancePotInvalid): InsurancePotInvalid.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: InsurancePotInvalid, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InsurancePotInvalid;
  static deserializeBinaryFromReader(message: InsurancePotInvalid, reader: jspb.BinaryReader): InsurancePotInvalid;
}

export namespace InsurancePotInvalid {
  export type AsObject = {
    potId: number,
    potAmount: number,
    outs: number,
    potUserCount: number,
    reason: Def.IIReasonMap[keyof Def.IIReasonMap],
  }
}

export class OutsCard extends jspb.Message {
  getCard(): number;
  setCard(value: number): void;

  getIsEqual(): boolean;
  setIsEqual(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OutsCard.AsObject;
  static toObject(includeInstance: boolean, msg: OutsCard): OutsCard.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: OutsCard, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OutsCard;
  static deserializeBinaryFromReader(message: OutsCard, reader: jspb.BinaryReader): OutsCard;
}

export namespace OutsCard {
  export type AsObject = {
    card: number,
    isEqual: boolean,
  }
}

export class UserOuts extends jspb.Message {
  getSeatId(): number;
  setSeatId(value: number): void;

  clearOutsCardsList(): void;
  getOutsCardsList(): Array<OutsCard>;
  setOutsCardsList(value: Array<OutsCard>): void;
  addOutsCards(value?: OutsCard, index?: number): OutsCard;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserOuts.AsObject;
  static toObject(includeInstance: boolean, msg: UserOuts): UserOuts.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UserOuts, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserOuts;
  static deserializeBinaryFromReader(message: UserOuts, reader: jspb.BinaryReader): UserOuts;
}

export namespace UserOuts {
  export type AsObject = {
    seatId: number,
    outsCardsList: Array<OutsCard.AsObject>,
  }
}

export class PotInsuranceBuy extends jspb.Message {
  getRound(): Def.RoundMap[keyof Def.RoundMap];
  setRound(value: Def.RoundMap[keyof Def.RoundMap]): void;

  getPotId(): number;
  setPotId(value: number): void;

  getActiveAmount(): number;
  setActiveAmount(value: number): void;

  clearActiveOutsList(): void;
  getActiveOutsList(): Array<number>;
  setActiveOutsList(value: Array<number>): void;
  addActiveOuts(value: number, index?: number): number;

  getPassiveAmount(): number;
  setPassiveAmount(value: number): void;

  clearPassiveOutsList(): void;
  getPassiveOutsList(): Array<number>;
  setPassiveOutsList(value: Array<number>): void;
  addPassiveOuts(value: number, index?: number): number;

  getInsurEv(): number;
  setInsurEv(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PotInsuranceBuy.AsObject;
  static toObject(includeInstance: boolean, msg: PotInsuranceBuy): PotInsuranceBuy.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PotInsuranceBuy, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PotInsuranceBuy;
  static deserializeBinaryFromReader(message: PotInsuranceBuy, reader: jspb.BinaryReader): PotInsuranceBuy;
}

export namespace PotInsuranceBuy {
  export type AsObject = {
    round: Def.RoundMap[keyof Def.RoundMap],
    potId: number,
    activeAmount: number,
    activeOutsList: Array<number>,
    passiveAmount: number,
    passiveOutsList: Array<number>,
    insurEv: number,
  }
}

export class PlayerCards extends jspb.Message {
  getSeatId(): number;
  setSeatId(value: number): void;

  clearCardsList(): void;
  getCardsList(): Array<number>;
  setCardsList(value: Array<number>): void;
  addCards(value: number, index?: number): number;

  getUserRid(): number;
  setUserRid(value: number): void;

  getName(): string;
  setName(value: string): void;

  getAvatar(): string;
  setAvatar(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PlayerCards.AsObject;
  static toObject(includeInstance: boolean, msg: PlayerCards): PlayerCards.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PlayerCards, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PlayerCards;
  static deserializeBinaryFromReader(message: PlayerCards, reader: jspb.BinaryReader): PlayerCards;
}

export namespace PlayerCards {
  export type AsObject = {
    seatId: number,
    cardsList: Array<number>,
    userRid: number,
    name: string,
    avatar: string,
  }
}

export class PlayerStartInfo extends jspb.Message {
  getSeatId(): number;
  setSeatId(value: number): void;

  clearCardsList(): void;
  getCardsList(): Array<number>;
  setCardsList(value: Array<number>): void;
  addCards(value: number, index?: number): number;

  getAnte(): number;
  setAnte(value: number): void;

  getAction(): Def.ActionMap[keyof Def.ActionMap];
  setAction(value: Def.ActionMap[keyof Def.ActionMap]): void;

  getRoundBet(): number;
  setRoundBet(value: number): void;

  getChip(): number;
  setChip(value: number): void;

  getStoreChips(): number;
  setStoreChips(value: number): void;

  getDeposit(): number;
  setDeposit(value: number): void;

  getCostMushroom(): number;
  setCostMushroom(value: number): void;

  getInMushroom(): boolean;
  setInMushroom(value: boolean): void;

  getSquidEscaped(): boolean;
  setSquidEscaped(value: boolean): void;

  getSquidCount(): number;
  setSquidCount(value: number): void;

  getInSquid(): boolean;
  setInSquid(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PlayerStartInfo.AsObject;
  static toObject(includeInstance: boolean, msg: PlayerStartInfo): PlayerStartInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PlayerStartInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PlayerStartInfo;
  static deserializeBinaryFromReader(message: PlayerStartInfo, reader: jspb.BinaryReader): PlayerStartInfo;
}

export namespace PlayerStartInfo {
  export type AsObject = {
    seatId: number,
    cardsList: Array<number>,
    ante: number,
    action: Def.ActionMap[keyof Def.ActionMap],
    roundBet: number,
    chip: number,
    storeChips: number,
    deposit: number,
    costMushroom: number,
    inMushroom: boolean,
    squidEscaped: boolean,
    squidCount: number,
    inSquid: boolean,
  }
}

export class GPS extends jspb.Message {
  getLongitude(): string;
  setLongitude(value: string): void;

  getLatitude(): string;
  setLatitude(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GPS.AsObject;
  static toObject(includeInstance: boolean, msg: GPS): GPS.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GPS, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GPS;
  static deserializeBinaryFromReader(message: GPS, reader: jspb.BinaryReader): GPS;
}

export namespace GPS {
  export type AsObject = {
    longitude: string,
    latitude: string,
  }
}

export class Player extends jspb.Message {
  getSeatId(): number;
  setSeatId(value: number): void;

  getUserRid(): number;
  setUserRid(value: number): void;

  getAction(): Def.ActionMap[keyof Def.ActionMap];
  setAction(value: Def.ActionMap[keyof Def.ActionMap]): void;

  clearCardsList(): void;
  getCardsList(): Array<number>;
  setCardsList(value: Array<number>): void;
  addCards(value: number, index?: number): number;

  getName(): string;
  setName(value: string): void;

  getAvatar(): string;
  setAvatar(value: string): void;

  getSex(): number;
  setSex(value: number): void;

  getChip(): number;
  setChip(value: number): void;

  getHandBet(): number;
  setHandBet(value: number): void;

  getRoundBet(): number;
  setRoundBet(value: number): void;

  getStatus(): Def.CanPlayStatusMap[keyof Def.CanPlayStatusMap];
  setStatus(value: Def.CanPlayStatusMap[keyof Def.CanPlayStatusMap]): void;

  getKeepSeatLeftTime(): number;
  setKeepSeatLeftTime(value: number): void;

  getBuyInsuranceStep(): number;
  setBuyInsuranceStep(value: number): void;

  clearBuyInsuranceList(): void;
  getBuyInsuranceList(): Array<PotInsuranceBuy>;
  setBuyInsuranceList(value: Array<PotInsuranceBuy>): void;
  addBuyInsurance(value?: PotInsuranceBuy, index?: number): PotInsuranceBuy;

  getIsAutoop(): boolean;
  setIsAutoop(value: boolean): void;

  getRoundActioned(): boolean;
  setRoundActioned(value: boolean): void;

  getHunterKill(): number;
  setHunterKill(value: number): void;

  getHunterKillAward(): number;
  setHunterKillAward(value: number): void;

  getHunterKillAwardOther(): number;
  setHunterKillAwardOther(value: number): void;

  getHunterHeadValue(): number;
  setHunterHeadValue(value: number): void;

  getVip(): number;
  setVip(value: number): void;

  getKeepSeatDeadline(): number;
  setKeepSeatDeadline(value: number): void;

  getKeepSeatReason(): Def.KeepSeatReasonMap[keyof Def.KeepSeatReasonMap];
  setKeepSeatReason(value: Def.KeepSeatReasonMap[keyof Def.KeepSeatReasonMap]): void;

  getDeposit(): number;
  setDeposit(value: number): void;

  getInMushroom(): boolean;
  setInMushroom(value: boolean): void;

  getCostMushroom(): number;
  setCostMushroom(value: number): void;

  hasWinCardsInfo(): boolean;
  clearWinCardsInfo(): void;
  getWinCardsInfo(): AllInWinCardsInfo | undefined;
  setWinCardsInfo(value?: AllInWinCardsInfo): void;

  getSquidEscaped(): boolean;
  setSquidEscaped(value: boolean): void;

  getUserSubscriptionId(): number;
  setUserSubscriptionId(value: number): void;

  getSquidCount(): number;
  setSquidCount(value: number): void;

  getInSquid(): boolean;
  setInSquid(value: boolean): void;

  getIpAddr(): string;
  setIpAddr(value: string): void;

  getVideoMaskId(): number;
  setVideoMaskId(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Player.AsObject;
  static toObject(includeInstance: boolean, msg: Player): Player.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Player, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Player;
  static deserializeBinaryFromReader(message: Player, reader: jspb.BinaryReader): Player;
}

export namespace Player {
  export type AsObject = {
    seatId: number,
    userRid: number,
    action: Def.ActionMap[keyof Def.ActionMap],
    cardsList: Array<number>,
    name: string,
    avatar: string,
    sex: number,
    chip: number,
    handBet: number,
    roundBet: number,
    status: Def.CanPlayStatusMap[keyof Def.CanPlayStatusMap],
    keepSeatLeftTime: number,
    buyInsuranceStep: number,
    buyInsuranceList: Array<PotInsuranceBuy.AsObject>,
    isAutoop: boolean,
    roundActioned: boolean,
    hunterKill: number,
    hunterKillAward: number,
    hunterKillAwardOther: number,
    hunterHeadValue: number,
    vip: number,
    keepSeatDeadline: number,
    keepSeatReason: Def.KeepSeatReasonMap[keyof Def.KeepSeatReasonMap],
    deposit: number,
    inMushroom: boolean,
    costMushroom: number,
    winCardsInfo?: AllInWinCardsInfo.AsObject,
    squidEscaped: boolean,
    userSubscriptionId: number,
    squidCount: number,
    inSquid: boolean,
    ipAddr: string,
    videoMaskId: number,
  }
}

export class Result extends jspb.Message {
  getSeatId(): number;
  setSeatId(value: number): void;

  getWin(): number;
  setWin(value: number): void;

  getHandValueType(): number;
  setHandValueType(value: number): void;

  clearWinCardsList(): void;
  getWinCardsList(): Array<WinCard>;
  setWinCardsList(value: Array<WinCard>): void;
  addWinCards(value?: WinCard, index?: number): WinCard;

  clearMyCardsList(): void;
  getMyCardsList(): Array<number>;
  setMyCardsList(value: Array<number>): void;
  addMyCards(value: number, index?: number): number;

  getChip(): number;
  setChip(value: number): void;

  getInsurance(): number;
  setInsurance(value: number): void;

  getInsuranceWin(): number;
  setInsuranceWin(value: number): void;

  getFee(): number;
  setFee(value: number): void;

  getMttHunterKillPlus(): number;
  setMttHunterKillPlus(value: number): void;

  getMttHunterKill(): number;
  setMttHunterKill(value: number): void;

  getMttHunterKillAward(): number;
  setMttHunterKillAward(value: number): void;

  getHandBet(): number;
  setHandBet(value: number): void;

  getStoreChips(): number;
  setStoreChips(value: number): void;

  getMttHunterKillAwardPlus(): number;
  setMttHunterKillAwardPlus(value: number): void;

  getMuck(): boolean;
  setMuck(value: boolean): void;

  getHandValueType2(): number;
  setHandValueType2(value: number): void;

  clearWinCards2List(): void;
  getWinCards2List(): Array<WinCard>;
  setWinCards2List(value: Array<WinCard>): void;
  addWinCards2(value?: WinCard, index?: number): WinCard;

  clearSplitResultsList(): void;
  getSplitResultsList(): Array<SplitedResult>;
  setSplitResultsList(value: Array<SplitedResult>): void;
  addSplitResults(value?: SplitedResult, index?: number): SplitedResult;

  getMttHunterKillAwardOther(): number;
  setMttHunterKillAwardOther(value: number): void;

  getMttHunterKillAwardOtherPlus(): number;
  setMttHunterKillAwardOtherPlus(value: number): void;

  getStandUp(): boolean;
  setStandUp(value: boolean): void;

  clearEhcsList(): void;
  getEhcsList(): Array<ExternalHandChange>;
  setEhcsList(value: Array<ExternalHandChange>): void;
  addEhcs(value?: ExternalHandChange, index?: number): ExternalHandChange;

  getDeposit(): number;
  setDeposit(value: number): void;

  getSquidEscaped(): boolean;
  setSquidEscaped(value: boolean): void;

  getWinTotal(): number;
  setWinTotal(value: number): void;

  getCallTimeCount(): number;
  setCallTimeCount(value: number): void;

  getCallTimeStay(): boolean;
  setCallTimeStay(value: boolean): void;

  getSquidCount(): number;
  setSquidCount(value: number): void;

  getAutoChangeRoomHand(): number;
  setAutoChangeRoomHand(value: number): void;

  getTotalChips(): number;
  setTotalChips(value: number): void;

  getInPool(): boolean;
  setInPool(value: boolean): void;

  getJawd(): number;
  setJawd(value: number): void;

  getJackpotFee(): number;
  setJackpotFee(value: number): void;

  clearUserInsuranceResultList(): void;
  getUserInsuranceResultList(): Array<UserInsuranceResult>;
  setUserInsuranceResultList(value: Array<UserInsuranceResult>): void;
  addUserInsuranceResult(value?: UserInsuranceResult, index?: number): UserInsuranceResult;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Result.AsObject;
  static toObject(includeInstance: boolean, msg: Result): Result.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Result, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Result;
  static deserializeBinaryFromReader(message: Result, reader: jspb.BinaryReader): Result;
}

export namespace Result {
  export type AsObject = {
    seatId: number,
    win: number,
    handValueType: number,
    winCardsList: Array<WinCard.AsObject>,
    myCardsList: Array<number>,
    chip: number,
    insurance: number,
    insuranceWin: number,
    fee: number,
    mttHunterKillPlus: number,
    mttHunterKill: number,
    mttHunterKillAward: number,
    handBet: number,
    storeChips: number,
    mttHunterKillAwardPlus: number,
    muck: boolean,
    handValueType2: number,
    winCards2List: Array<WinCard.AsObject>,
    splitResultsList: Array<SplitedResult.AsObject>,
    mttHunterKillAwardOther: number,
    mttHunterKillAwardOtherPlus: number,
    standUp: boolean,
    ehcsList: Array<ExternalHandChange.AsObject>,
    deposit: number,
    squidEscaped: boolean,
    winTotal: number,
    callTimeCount: number,
    callTimeStay: boolean,
    squidCount: number,
    autoChangeRoomHand: number,
    totalChips: number,
    inPool: boolean,
    jawd: number,
    jackpotFee: number,
    userInsuranceResultList: Array<UserInsuranceResult.AsObject>,
  }
}

export class ExternalHandChange extends jspb.Message {
  getEhcType(): Def.EHCTypeMap[keyof Def.EHCTypeMap];
  setEhcType(value: Def.EHCTypeMap[keyof Def.EHCTypeMap]): void;

  getIn(): number;
  setIn(value: number): void;

  getOut(): number;
  setOut(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ExternalHandChange.AsObject;
  static toObject(includeInstance: boolean, msg: ExternalHandChange): ExternalHandChange.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ExternalHandChange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ExternalHandChange;
  static deserializeBinaryFromReader(message: ExternalHandChange, reader: jspb.BinaryReader): ExternalHandChange;
}

export namespace ExternalHandChange {
  export type AsObject = {
    ehcType: Def.EHCTypeMap[keyof Def.EHCTypeMap],
    pb_in: number,
    out: number,
  }
}

export class SquidDetail extends jspb.Message {
  getUserRid(): number;
  setUserRid(value: number): void;

  getName(): string;
  setName(value: string): void;

  getAvatar(): string;
  setAvatar(value: string): void;

  getPunishFee(): number;
  setPunishFee(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SquidDetail.AsObject;
  static toObject(includeInstance: boolean, msg: SquidDetail): SquidDetail.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SquidDetail, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SquidDetail;
  static deserializeBinaryFromReader(message: SquidDetail, reader: jspb.BinaryReader): SquidDetail;
}

export namespace SquidDetail {
  export type AsObject = {
    userRid: number,
    name: string,
    avatar: string,
    punishFee: number,
  }
}

export class ExternalPools extends jspb.Message {
  getMushroomPool(): number;
  setMushroomPool(value: number): void;

  getSquidPool(): number;
  setSquidPool(value: number): void;

  clearSquidDetailsList(): void;
  getSquidDetailsList(): Array<SquidDetail>;
  setSquidDetailsList(value: Array<SquidDetail>): void;
  addSquidDetails(value?: SquidDetail, index?: number): SquidDetail;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ExternalPools.AsObject;
  static toObject(includeInstance: boolean, msg: ExternalPools): ExternalPools.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ExternalPools, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ExternalPools;
  static deserializeBinaryFromReader(message: ExternalPools, reader: jspb.BinaryReader): ExternalPools;
}

export namespace ExternalPools {
  export type AsObject = {
    mushroomPool: number,
    squidPool: number,
    squidDetailsList: Array<SquidDetail.AsObject>,
  }
}

export class SplitedResult extends jspb.Message {
  getWin(): number;
  setWin(value: number): void;

  getIsWinner(): boolean;
  setIsWinner(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SplitedResult.AsObject;
  static toObject(includeInstance: boolean, msg: SplitedResult): SplitedResult.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SplitedResult, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SplitedResult;
  static deserializeBinaryFromReader(message: SplitedResult, reader: jspb.BinaryReader): SplitedResult;
}

export namespace SplitedResult {
  export type AsObject = {
    win: number,
    isWinner: boolean,
  }
}

export class WinCard extends jspb.Message {
  getCard(): number;
  setCard(value: number): void;

  getIsPublic(): boolean;
  setIsPublic(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WinCard.AsObject;
  static toObject(includeInstance: boolean, msg: WinCard): WinCard.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WinCard, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WinCard;
  static deserializeBinaryFromReader(message: WinCard, reader: jspb.BinaryReader): WinCard;
}

export namespace WinCard {
  export type AsObject = {
    card: number,
    isPublic: boolean,
  }
}

export class PostStatusChange extends jspb.Message {
  getSeatId(): number;
  setSeatId(value: number): void;

  getOldPostStatus(): Def.CanPlayStatusMap[keyof Def.CanPlayStatusMap];
  setOldPostStatus(value: Def.CanPlayStatusMap[keyof Def.CanPlayStatusMap]): void;

  getCurrentPostStatus(): Def.CanPlayStatusMap[keyof Def.CanPlayStatusMap];
  setCurrentPostStatus(value: Def.CanPlayStatusMap[keyof Def.CanPlayStatusMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PostStatusChange.AsObject;
  static toObject(includeInstance: boolean, msg: PostStatusChange): PostStatusChange.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PostStatusChange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PostStatusChange;
  static deserializeBinaryFromReader(message: PostStatusChange, reader: jspb.BinaryReader): PostStatusChange;
}

export namespace PostStatusChange {
  export type AsObject = {
    seatId: number,
    oldPostStatus: Def.CanPlayStatusMap[keyof Def.CanPlayStatusMap],
    currentPostStatus: Def.CanPlayStatusMap[keyof Def.CanPlayStatusMap],
  }
}

export class PlayerChipChange extends jspb.Message {
  getSeatId(): number;
  setSeatId(value: number): void;

  getChange(): number;
  setChange(value: number): void;

  getChips(): number;
  setChips(value: number): void;

  getStoreChips(): number;
  setStoreChips(value: number): void;

  getAuto(): boolean;
  setAuto(value: boolean): void;

  getReason(): Def.ChipChangeReasonMap[keyof Def.ChipChangeReasonMap];
  setReason(value: Def.ChipChangeReasonMap[keyof Def.ChipChangeReasonMap]): void;

  getMttHunterHeadPlus(): number;
  setMttHunterHeadPlus(value: number): void;

  getDepositChange(): number;
  setDepositChange(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PlayerChipChange.AsObject;
  static toObject(includeInstance: boolean, msg: PlayerChipChange): PlayerChipChange.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PlayerChipChange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PlayerChipChange;
  static deserializeBinaryFromReader(message: PlayerChipChange, reader: jspb.BinaryReader): PlayerChipChange;
}

export namespace PlayerChipChange {
  export type AsObject = {
    seatId: number,
    change: number,
    chips: number,
    storeChips: number,
    auto: boolean,
    reason: Def.ChipChangeReasonMap[keyof Def.ChipChangeReasonMap],
    mttHunterHeadPlus: number,
    depositChange: number,
  }
}

export class Roomer extends jspb.Message {
  getUserRid(): number;
  setUserRid(value: number): void;

  getName(): string;
  setName(value: string): void;

  getAvatar(): string;
  setAvatar(value: string): void;

  getSex(): number;
  setSex(value: number): void;

  getVip(): number;
  setVip(value: number): void;

  getIsOnline(): boolean;
  setIsOnline(value: boolean): void;

  getIpAddr(): string;
  setIpAddr(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Roomer.AsObject;
  static toObject(includeInstance: boolean, msg: Roomer): Roomer.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Roomer, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Roomer;
  static deserializeBinaryFromReader(message: Roomer, reader: jspb.BinaryReader): Roomer;
}

export namespace Roomer {
  export type AsObject = {
    userRid: number,
    name: string,
    avatar: string,
    sex: number,
    vip: number,
    isOnline: boolean,
    ipAddr: string,
  }
}

export class PlayerSummary extends jspb.Message {
  getUserRid(): number;
  setUserRid(value: number): void;

  getName(): string;
  setName(value: string): void;

  getAvatar(): string;
  setAvatar(value: string): void;

  getSex(): number;
  setSex(value: number): void;

  getHandNum(): number;
  setHandNum(value: number): void;

  getBringInTotal(): number;
  setBringInTotal(value: number): void;

  getBringOutTotal(): number;
  setBringOutTotal(value: number): void;

  getChip(): number;
  setChip(value: number): void;

  getWin(): number;
  setWin(value: number): void;

  getStatus(): Def.CanPlayStatusMap[keyof Def.CanPlayStatusMap];
  setStatus(value: Def.CanPlayStatusMap[keyof Def.CanPlayStatusMap]): void;

  getVip(): number;
  setVip(value: number): void;

  getIsOnline(): boolean;
  setIsOnline(value: boolean): void;

  getStoreChips(): number;
  setStoreChips(value: number): void;

  getMushroomCount(): number;
  setMushroomCount(value: number): void;

  getMushroomAmount(): number;
  setMushroomAmount(value: number): void;

  getPoolRate(): number;
  setPoolRate(value: number): void;

  getSquidInTotal(): number;
  setSquidInTotal(value: number): void;

  getSquidOutTotal(): number;
  setSquidOutTotal(value: number): void;

  getSquidCount(): number;
  setSquidCount(value: number): void;

  getSquidPunishTotal(): number;
  setSquidPunishTotal(value: number): void;

  getDeposit(): number;
  setDeposit(value: number): void;

  getIpAddr(): string;
  setIpAddr(value: string): void;

  getPoolCount(): number;
  setPoolCount(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PlayerSummary.AsObject;
  static toObject(includeInstance: boolean, msg: PlayerSummary): PlayerSummary.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PlayerSummary, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PlayerSummary;
  static deserializeBinaryFromReader(message: PlayerSummary, reader: jspb.BinaryReader): PlayerSummary;
}

export namespace PlayerSummary {
  export type AsObject = {
    userRid: number,
    name: string,
    avatar: string,
    sex: number,
    handNum: number,
    bringInTotal: number,
    bringOutTotal: number,
    chip: number,
    win: number,
    status: Def.CanPlayStatusMap[keyof Def.CanPlayStatusMap],
    vip: number,
    isOnline: boolean,
    storeChips: number,
    mushroomCount: number,
    mushroomAmount: number,
    poolRate: number,
    squidInTotal: number,
    squidOutTotal: number,
    squidCount: number,
    squidPunishTotal: number,
    deposit: number,
    ipAddr: string,
    poolCount: number,
  }
}

export class PlayerAllInShowCardWinCardsLength extends jspb.Message {
  getSeatId(): number;
  setSeatId(value: number): void;

  getWinCardsCount(): number;
  setWinCardsCount(value: number): void;

  getLeftCardsCount(): number;
  setLeftCardsCount(value: number): void;

  clearWinCardsList(): void;
  getWinCardsList(): Array<number>;
  setWinCardsList(value: Array<number>): void;
  addWinCards(value: number, index?: number): number;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PlayerAllInShowCardWinCardsLength.AsObject;
  static toObject(includeInstance: boolean, msg: PlayerAllInShowCardWinCardsLength): PlayerAllInShowCardWinCardsLength.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PlayerAllInShowCardWinCardsLength, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PlayerAllInShowCardWinCardsLength;
  static deserializeBinaryFromReader(message: PlayerAllInShowCardWinCardsLength, reader: jspb.BinaryReader): PlayerAllInShowCardWinCardsLength;
}

export namespace PlayerAllInShowCardWinCardsLength {
  export type AsObject = {
    seatId: number,
    winCardsCount: number,
    leftCardsCount: number,
    winCardsList: Array<number>,
  }
}

export class SecondPublicCardsPlayerAllInShowCardSummary extends jspb.Message {
  getRnd(): Def.RoundMap[keyof Def.RoundMap];
  setRnd(value: Def.RoundMap[keyof Def.RoundMap]): void;

  clearAllinUsersList(): void;
  getAllinUsersList(): Array<PlayerAllInShowCardWinCardsLength>;
  setAllinUsersList(value: Array<PlayerAllInShowCardWinCardsLength>): void;
  addAllinUsers(value?: PlayerAllInShowCardWinCardsLength, index?: number): PlayerAllInShowCardWinCardsLength;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SecondPublicCardsPlayerAllInShowCardSummary.AsObject;
  static toObject(includeInstance: boolean, msg: SecondPublicCardsPlayerAllInShowCardSummary): SecondPublicCardsPlayerAllInShowCardSummary.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SecondPublicCardsPlayerAllInShowCardSummary, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SecondPublicCardsPlayerAllInShowCardSummary;
  static deserializeBinaryFromReader(message: SecondPublicCardsPlayerAllInShowCardSummary, reader: jspb.BinaryReader): SecondPublicCardsPlayerAllInShowCardSummary;
}

export namespace SecondPublicCardsPlayerAllInShowCardSummary {
  export type AsObject = {
    rnd: Def.RoundMap[keyof Def.RoundMap],
    allinUsersList: Array<PlayerAllInShowCardWinCardsLength.AsObject>,
  }
}

export class AllInWinCardsInfo extends jspb.Message {
  getWcCount(): number;
  setWcCount(value: number): void;

  getLcCount(): number;
  setLcCount(value: number): void;

  getWcCount2(): number;
  setWcCount2(value: number): void;

  getLcCount2(): number;
  setLcCount2(value: number): void;

  getFlopWcCount(): number;
  setFlopWcCount(value: number): void;

  getFlopLcCount(): number;
  setFlopLcCount(value: number): void;

  getTurnWcCount(): number;
  setTurnWcCount(value: number): void;

  getTurnLcCount(): number;
  setTurnLcCount(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AllInWinCardsInfo.AsObject;
  static toObject(includeInstance: boolean, msg: AllInWinCardsInfo): AllInWinCardsInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AllInWinCardsInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AllInWinCardsInfo;
  static deserializeBinaryFromReader(message: AllInWinCardsInfo, reader: jspb.BinaryReader): AllInWinCardsInfo;
}

export namespace AllInWinCardsInfo {
  export type AsObject = {
    wcCount: number,
    lcCount: number,
    wcCount2: number,
    lcCount2: number,
    flopWcCount: number,
    flopLcCount: number,
    turnWcCount: number,
    turnLcCount: number,
  }
}

export class UserPlayStatus extends jspb.Message {
  getMuted(): boolean;
  setMuted(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserPlayStatus.AsObject;
  static toObject(includeInstance: boolean, msg: UserPlayStatus): UserPlayStatus.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UserPlayStatus, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserPlayStatus;
  static deserializeBinaryFromReader(message: UserPlayStatus, reader: jspb.BinaryReader): UserPlayStatus;
}

export namespace UserPlayStatus {
  export type AsObject = {
    muted: boolean,
  }
}

export class RoomWithType extends jspb.Message {
  getRoomId(): number;
  setRoomId(value: number): void;

  getMatchId(): number;
  setMatchId(value: number): void;

  getRoomType(): number;
  setRoomType(value: number): void;

  getAntiCheatType(): number;
  setAntiCheatType(value: number): void;

  getAntiCheatVideoType(): number;
  setAntiCheatVideoType(value: number): void;

  hasUserPlayStatus(): boolean;
  clearUserPlayStatus(): void;
  getUserPlayStatus(): UserPlayStatus | undefined;
  setUserPlayStatus(value?: UserPlayStatus): void;

  getBombpot(): number;
  setBombpot(value: number): void;

  getMode(): Def.RoomModeMap[keyof Def.RoomModeMap];
  setMode(value: Def.RoomModeMap[keyof Def.RoomModeMap]): void;

  getMatchingBeginTime(): number;
  setMatchingBeginTime(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoomWithType.AsObject;
  static toObject(includeInstance: boolean, msg: RoomWithType): RoomWithType.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RoomWithType, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RoomWithType;
  static deserializeBinaryFromReader(message: RoomWithType, reader: jspb.BinaryReader): RoomWithType;
}

export namespace RoomWithType {
  export type AsObject = {
    roomId: number,
    matchId: number,
    roomType: number,
    antiCheatType: number,
    antiCheatVideoType: number,
    userPlayStatus?: UserPlayStatus.AsObject,
    bombpot: number,
    mode: Def.RoomModeMap[keyof Def.RoomModeMap],
    matchingBeginTime: number,
  }
}

export class RoomRecord extends jspb.Message {
  getRid(): number;
  setRid(value: number): void;

  getName(): string;
  setName(value: string): void;

  getRoomType(): number;
  setRoomType(value: number): void;

  getGameType(): number;
  setGameType(value: number): void;

  getPokerType(): number;
  setPokerType(value: number): void;

  getLimitBetType(): number;
  setLimitBetType(value: number): void;

  getStatus(): number;
  setStatus(value: number): void;

  getAnte(): number;
  setAnte(value: number): void;

  getSb(): number;
  setSb(value: number): void;

  getOpDuration(): number;
  setOpDuration(value: number): void;

  getNoUserWaitDuration(): number;
  setNoUserWaitDuration(value: number): void;

  getKeepSeatDuration(): number;
  setKeepSeatDuration(value: number): void;

  getTotalBringIn(): number;
  setTotalBringIn(value: number): void;

  getTotalBringOut(): number;
  setTotalBringOut(value: number): void;

  getTotalChip(): number;
  setTotalChip(value: number): void;

  getMinRate(): number;
  setMinRate(value: number): void;

  getMaxRate(): number;
  setMaxRate(value: number): void;

  getMinPlayers(): number;
  setMinPlayers(value: number): void;

  getAutostartMinPlayers(): number;
  setAutostartMinPlayers(value: number): void;

  getStraddleOn(): number;
  setStraddleOn(value: number): void;

  getStraddleMax(): number;
  setStraddleMax(value: number): void;

  getInsuranceOn(): number;
  setInsuranceOn(value: number): void;

  getInsuranceOpDuration(): number;
  setInsuranceOpDuration(value: number): void;

  getSecondPcsOn(): number;
  setSecondPcsOn(value: number): void;

  getSecondPcsOpDuration(): number;
  setSecondPcsOpDuration(value: number): void;

  getSecondPcsUserLimit(): number;
  setSecondPcsUserLimit(value: number): void;

  getDelayViewCardOn(): number;
  setDelayViewCardOn(value: number): void;

  getPostOn(): number;
  setPostOn(value: number): void;

  getMuckOn(): number;
  setMuckOn(value: number): void;

  getLimitIpOn(): number;
  setLimitIpOn(value: number): void;

  getLimitGpsOn(): number;
  setLimitGpsOn(value: number): void;

  getLimitGpsDistance(): number;
  setLimitGpsDistance(value: number): void;

  getLimitDelayTimes(): number;
  setLimitDelayTimes(value: number): void;

  getLimitAutoCheckTimes(): number;
  setLimitAutoCheckTimes(value: number): void;

  getLimitAutoFoldTimes(): number;
  setLimitAutoFoldTimes(value: number): void;

  getSeatCount(): number;
  setSeatCount(value: number): void;

  getEmptySeat(): number;
  setEmptySeat(value: number): void;

  getRoomers(): number;
  setRoomers(value: number): void;

  getEnterTime(): number;
  setEnterTime(value: number): void;

  getPlayDuration(): number;
  setPlayDuration(value: number): void;

  getNoUserCloseDuration(): number;
  setNoUserCloseDuration(value: number): void;

  getRetainMinRate(): number;
  setRetainMinRate(value: number): void;

  getScheduleStartTime(): number;
  setScheduleStartTime(value: number): void;

  getStartTime(): number;
  setStartTime(value: number): void;

  getEndTime(): number;
  setEndTime(value: number): void;

  getSettlementType(): number;
  setSettlementType(value: number): void;

  getHandNum(): number;
  setHandNum(value: number): void;

  getTribeId(): number;
  setTribeId(value: number): void;

  getEndReason(): string;
  setEndReason(value: string): void;

  getHcTotalHandLv(): number;
  setHcTotalHandLv(value: number): void;

  getHcTotalHand(): number;
  setHcTotalHand(value: number): void;

  getHcPoolRateLv(): number;
  setHcPoolRateLv(value: number): void;

  getHcPoolRate(): number;
  setHcPoolRate(value: number): void;

  getServiceId(): string;
  setServiceId(value: string): void;

  getCreateTime(): number;
  setCreateTime(value: number): void;

  getUpdateTime(): number;
  setUpdateTime(value: number): void;

  clearInsuranceOddsList(): void;
  getInsuranceOddsList(): Array<InsuranceOddsForPotsUserCount>;
  setInsuranceOddsList(value: Array<InsuranceOddsForPotsUserCount>): void;
  addInsuranceOdds(value?: InsuranceOddsForPotsUserCount, index?: number): InsuranceOddsForPotsUserCount;

  getVoiceprintVerifyOn(): number;
  setVoiceprintVerifyOn(value: number): void;

  getVoiceprintVerifyLimitTimes(): number;
  setVoiceprintVerifyLimitTimes(value: number): void;

  getVoiceprintVerifyDuration(): number;
  setVoiceprintVerifyDuration(value: number): void;

  getVoiceprintVerifyIntervalDuration(): number;
  setVoiceprintVerifyIntervalDuration(value: number): void;

  getParticipationStatus(): number;
  setParticipationStatus(value: number): void;

  getTableclothTag(): string;
  setTableclothTag(value: string): void;

  getClubId(): number;
  setClubId(value: number): void;

  getOriginType(): number;
  setOriginType(value: number): void;

  getLimitBringIn(): number;
  setLimitBringIn(value: number): void;

  getInvitationCode(): string;
  setInvitationCode(value: string): void;

  getShareTable(): number;
  setShareTable(value: number): void;

  getTemplateId(): number;
  setTemplateId(value: number): void;

  getPrivateRoom(): number;
  setPrivateRoom(value: number): void;

  getRoomPassword(): string;
  setRoomPassword(value: string): void;

  getGoldType(): number;
  setGoldType(value: number): void;

  getRealTimeVoiceOn(): number;
  setRealTimeVoiceOn(value: number): void;

  getAntiCheatType(): number;
  setAntiCheatType(value: number): void;

  getAntiCheatTimelimit(): number;
  setAntiCheatTimelimit(value: number): void;

  getDealDelay(): number;
  setDealDelay(value: number): void;

  getAntiCheatVideoType(): number;
  setAntiCheatVideoType(value: number): void;

  getVideoVerifyCount(): number;
  setVideoVerifyCount(value: number): void;

  getCreatorRandomId(): number;
  setCreatorRandomId(value: number): void;

  clearMultiLangNamesList(): void;
  getMultiLangNamesList(): Array<MultiLangName>;
  setMultiLangNamesList(value: Array<MultiLangName>): void;
  addMultiLangNames(value?: MultiLangName, index?: number): MultiLangName;

  getAntiCheatFeeType(): number;
  setAntiCheatFeeType(value: number): void;

  getAntiCheatOrderType(): number;
  setAntiCheatOrderType(value: number): void;

  getAntiCheatOrderMicType(): number;
  setAntiCheatOrderMicType(value: number): void;

  getSelectOuts(): number;
  setSelectOuts(value: number): void;

  getBringinLimitType(): number;
  setBringinLimitType(value: number): void;

  getBombpot(): number;
  setBombpot(value: number): void;

  getMushroomMode(): number;
  setMushroomMode(value: number): void;

  getMushroomBase(): number;
  setMushroomBase(value: number): void;

  getMushroomStatic(): number;
  setMushroomStatic(value: number): void;

  getRandomAnte(): string;
  setRandomAnte(value: string): void;

  clearLuckycardsNumList(): void;
  getLuckycardsNumList(): Array<Luckycards>;
  setLuckycardsNumList(value: Array<Luckycards>): void;
  addLuckycardsNum(value?: Luckycards, index?: number): Luckycards;

  getVideoEffectType(): number;
  setVideoEffectType(value: number): void;

  getVideoVerifyType(): number;
  setVideoVerifyType(value: number): void;

  getVideoQualityType(): number;
  setVideoQualityType(value: number): void;

  getSeatedMessaging(): number;
  setSeatedMessaging(value: number): void;

  getChatType(): number;
  setChatType(value: number): void;

  getAutoOnTableSwitch(): number;
  setAutoOnTableSwitch(value: number): void;

  getRetainType(): number;
  setRetainType(value: number): void;

  hasRoomAdmin(): boolean;
  clearRoomAdmin(): void;
  getRoomAdmin(): RoomAdmin | undefined;
  setRoomAdmin(value?: RoomAdmin): void;

  getPersonalType(): number;
  setPersonalType(value: number): void;

  getRandomSeat(): number;
  setRandomSeat(value: number): void;

  getSquidBase(): number;
  setSquidBase(value: number): void;

  getForceShowCard(): number;
  setForceShowCard(value: number): void;

  getOnlyIos(): number;
  setOnlyIos(value: number): void;

  getViewPlayerCards(): number;
  setViewPlayerCards(value: number): void;

  getCut(): number;
  setCut(value: number): void;

  getEncryptCards(): number;
  setEncryptCards(value: number): void;

  getMinPlayerChipRate(): number;
  setMinPlayerChipRate(value: number): void;

  getMaxBringinTotalRate(): number;
  setMaxBringinTotalRate(value: number): void;

  getBringinEqualLeader(): number;
  setBringinEqualLeader(value: number): void;

  getCalltimeLimit(): number;
  setCalltimeLimit(value: number): void;

  getCalltimeWinLine(): number;
  setCalltimeWinLine(value: number): void;

  getJackpot(): number;
  setJackpot(value: number): void;

  getJackpotId(): number;
  setJackpotId(value: number): void;

  getJackpotGold(): number;
  setJackpotGold(value: number): void;

  hasJackpotConfig(): boolean;
  clearJackpotConfig(): void;
  getJackpotConfig(): RoomJackpotConfig | undefined;
  setJackpotConfig(value?: RoomJackpotConfig): void;

  clearSubConfigsList(): void;
  getSubConfigsList(): Array<SubRoomConfig>;
  setSubConfigsList(value: Array<SubRoomConfig>): void;
  addSubConfigs(value?: SubRoomConfig, index?: number): SubRoomConfig;

  getSquidMax(): number;
  setSquidMax(value: number): void;

  getSquidMostGet(): number;
  setSquidMostGet(value: number): void;

  getSquidBetGet(): number;
  setSquidBetGet(value: number): void;

  getSquidHead(): number;
  setSquidHead(value: number): void;

  getSquidTail(): number;
  setSquidTail(value: number): void;

  getRounds(): number;
  setRounds(value: number): void;

  getMode(): Def.RoomModeMap[keyof Def.RoomModeMap];
  setMode(value: Def.RoomModeMap[keyof Def.RoomModeMap]): void;

  hasModeSetting(): boolean;
  clearModeSetting(): void;
  getModeSetting(): ModeSetting | undefined;
  setModeSetting(value?: ModeSetting): void;

  getEnterRoomType(): number;
  setEnterRoomType(value: number): void;

  getJackpotParentGold(): number;
  setJackpotParentGold(value: number): void;

  getIsWhitelist(): boolean;
  setIsWhitelist(value: boolean): void;

  getCriticalHit(): number;
  setCriticalHit(value: number): void;

  getKongTransfer(): number;
  setKongTransfer(value: number): void;

  getKongWinOfDiscard(): number;
  setKongWinOfDiscard(value: number): void;

  getSelfDrawnType(): number;
  setSelfDrawnType(value: number): void;

  hasWinTypeRule(): boolean;
  clearWinTypeRule(): void;
  getWinTypeRule(): WinTypeRule | undefined;
  setWinTypeRule(value?: WinTypeRule): void;

  getKongWinOfDiscardType(): number;
  setKongWinOfDiscardType(value: number): void;

  getJoker(): number;
  setJoker(value: number): void;

  getWinWay(): number;
  setWinWay(value: number): void;

  getSingleHolder(): number;
  setSingleHolder(value: number): void;

  getRobKongHolder(): number;
  setRobKongHolder(value: number): void;

  getRobKong(): number;
  setRobKong(value: number): void;

  getWallType(): number;
  setWallType(value: number): void;

  getFollowDealer(): number;
  setFollowDealer(value: number): void;

  getRaise(): number;
  setRaise(value: number): void;

  getRaiseOpDuration(): number;
  setRaiseOpDuration(value: number): void;

  getJokerCount(): number;
  setJokerCount(value: number): void;

  getOneMatchMoreWin(): number;
  setOneMatchMoreWin(value: number): void;

  getAutoChangeRoomLimitHand(): number;
  setAutoChangeRoomLimitHand(value: number): void;

  getCalltime(): number;
  setCalltime(value: number): void;

  clearRuleUnitList(): void;
  getRuleUnitList(): Array<RuleUnit>;
  setRuleUnitList(value: Array<RuleUnit>): void;
  addRuleUnit(value?: RuleUnit, index?: number): RuleUnit;

  getSimpleHorseMode(): number;
  setSimpleHorseMode(value: number): void;

  getSimpleHorseCount(): number;
  setSimpleHorseCount(value: number): void;

  getSquidForceShowCard(): number;
  setSquidForceShowCard(value: number): void;

  hasSettleSetting(): boolean;
  clearSettleSetting(): void;
  getSettleSetting(): SettleSetting | undefined;
  setSettleSetting(value?: SettleSetting): void;

  getSquidMode(): number;
  setSquidMode(value: number): void;

  getSquidExtraCount(): number;
  setSquidExtraCount(value: number): void;

  getQuickChangeRoom(): number;
  setQuickChangeRoom(value: number): void;

  getNotEnoughCloseDuration(): number;
  setNotEnoughCloseDuration(value: number): void;

  getPlayDurationType(): number;
  setPlayDurationType(value: number): void;

  getPlayHandsLimit(): number;
  setPlayHandsLimit(value: number): void;

  getInsuranceMode(): Def.IsuranceModeMap[keyof Def.IsuranceModeMap];
  setInsuranceMode(value: Def.IsuranceModeMap[keyof Def.IsuranceModeMap]): void;

  getRetainMaxRate(): number;
  setRetainMaxRate(value: number): void;

  getWheelTemplateId(): number;
  setWheelTemplateId(value: number): void;

  getAllInMute(): number;
  setAllInMute(value: number): void;

  clearSquidCountRateList(): void;
  getSquidCountRateList(): Array<SquidCountRateConfig>;
  setSquidCountRateList(value: Array<SquidCountRateConfig>): void;
  addSquidCountRate(value?: SquidCountRateConfig, index?: number): SquidCountRateConfig;

  getDepositPercent(): number;
  setDepositPercent(value: number): void;

  getInsuranceForceBuyRatio(): number;
  setInsuranceForceBuyRatio(value: number): void;

  getBombDoubleType(): number;
  setBombDoubleType(value: number): void;

  getBombSixBeginReward(): number;
  setBombSixBeginReward(value: number): void;

  getPassAceThreeTime(): number;
  setPassAceThreeTime(value: number): void;

  getDoubleLowLevelUpType(): number;
  setDoubleLowLevelUpType(value: number): void;

  getSquidLeaveMode(): number;
  setSquidLeaveMode(value: number): void;

  getPowerSaving(): number;
  setPowerSaving(value: number): void;

  getSquidPlayerCount(): number;
  setSquidPlayerCount(value: number): void;

  clearUsersList(): void;
  getUsersList(): Array<RoomUserInfo>;
  setUsersList(value: Array<RoomUserInfo>): void;
  addUsers(value?: RoomUserInfo, index?: number): RoomUserInfo;

  clearRelateClubIdsList(): void;
  getRelateClubIdsList(): Array<number>;
  setRelateClubIdsList(value: Array<number>): void;
  addRelateClubIds(value: number, index?: number): number;

  clearRelateTribeClubListList(): void;
  getRelateTribeClubListList(): Array<RoomTribeClubRelate>;
  setRelateTribeClubListList(value: Array<RoomTribeClubRelate>): void;
  addRelateTribeClubList(value?: RoomTribeClubRelate, index?: number): RoomTribeClubRelate;

  getCurrency(): string;
  setCurrency(value: string): void;

  hasCowboyConfig(): boolean;
  clearCowboyConfig(): void;
  getCowboyConfig(): CowboyConfig | undefined;
  setCowboyConfig(value?: CowboyConfig): void;

  getMicSeatSwitch(): number;
  setMicSeatSwitch(value: number): void;

  getMicMiddleSwitch(): number;
  setMicMiddleSwitch(value: number): void;

  getVideoSeatSwitch(): number;
  setVideoSeatSwitch(value: number): void;

  getVideoMiddleSwitch(): number;
  setVideoMiddleSwitch(value: number): void;

  getPowerSavingSeatSwitch(): number;
  setPowerSavingSeatSwitch(value: number): void;

  getPowerSavingMiddleSwitch(): number;
  setPowerSavingMiddleSwitch(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoomRecord.AsObject;
  static toObject(includeInstance: boolean, msg: RoomRecord): RoomRecord.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RoomRecord, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RoomRecord;
  static deserializeBinaryFromReader(message: RoomRecord, reader: jspb.BinaryReader): RoomRecord;
}

export namespace RoomRecord {
  export type AsObject = {
    rid: number,
    name: string,
    roomType: number,
    gameType: number,
    pokerType: number,
    limitBetType: number,
    status: number,
    ante: number,
    sb: number,
    opDuration: number,
    noUserWaitDuration: number,
    keepSeatDuration: number,
    totalBringIn: number,
    totalBringOut: number,
    totalChip: number,
    minRate: number,
    maxRate: number,
    minPlayers: number,
    autostartMinPlayers: number,
    straddleOn: number,
    straddleMax: number,
    insuranceOn: number,
    insuranceOpDuration: number,
    secondPcsOn: number,
    secondPcsOpDuration: number,
    secondPcsUserLimit: number,
    delayViewCardOn: number,
    postOn: number,
    muckOn: number,
    limitIpOn: number,
    limitGpsOn: number,
    limitGpsDistance: number,
    limitDelayTimes: number,
    limitAutoCheckTimes: number,
    limitAutoFoldTimes: number,
    seatCount: number,
    emptySeat: number,
    roomers: number,
    enterTime: number,
    playDuration: number,
    noUserCloseDuration: number,
    retainMinRate: number,
    scheduleStartTime: number,
    startTime: number,
    endTime: number,
    settlementType: number,
    handNum: number,
    tribeId: number,
    endReason: string,
    hcTotalHandLv: number,
    hcTotalHand: number,
    hcPoolRateLv: number,
    hcPoolRate: number,
    serviceId: string,
    createTime: number,
    updateTime: number,
    insuranceOddsList: Array<InsuranceOddsForPotsUserCount.AsObject>,
    voiceprintVerifyOn: number,
    voiceprintVerifyLimitTimes: number,
    voiceprintVerifyDuration: number,
    voiceprintVerifyIntervalDuration: number,
    participationStatus: number,
    tableclothTag: string,
    clubId: number,
    originType: number,
    limitBringIn: number,
    invitationCode: string,
    shareTable: number,
    templateId: number,
    privateRoom: number,
    roomPassword: string,
    goldType: number,
    realTimeVoiceOn: number,
    antiCheatType: number,
    antiCheatTimelimit: number,
    dealDelay: number,
    antiCheatVideoType: number,
    videoVerifyCount: number,
    creatorRandomId: number,
    multiLangNamesList: Array<MultiLangName.AsObject>,
    antiCheatFeeType: number,
    antiCheatOrderType: number,
    antiCheatOrderMicType: number,
    selectOuts: number,
    bringinLimitType: number,
    bombpot: number,
    mushroomMode: number,
    mushroomBase: number,
    mushroomStatic: number,
    randomAnte: string,
    luckycardsNumList: Array<Luckycards.AsObject>,
    videoEffectType: number,
    videoVerifyType: number,
    videoQualityType: number,
    seatedMessaging: number,
    chatType: number,
    autoOnTableSwitch: number,
    retainType: number,
    roomAdmin?: RoomAdmin.AsObject,
    personalType: number,
    randomSeat: number,
    squidBase: number,
    forceShowCard: number,
    onlyIos: number,
    viewPlayerCards: number,
    cut: number,
    encryptCards: number,
    minPlayerChipRate: number,
    maxBringinTotalRate: number,
    bringinEqualLeader: number,
    calltimeLimit: number,
    calltimeWinLine: number,
    jackpot: number,
    jackpotId: number,
    jackpotGold: number,
    jackpotConfig?: RoomJackpotConfig.AsObject,
    subConfigsList: Array<SubRoomConfig.AsObject>,
    squidMax: number,
    squidMostGet: number,
    squidBetGet: number,
    squidHead: number,
    squidTail: number,
    rounds: number,
    mode: Def.RoomModeMap[keyof Def.RoomModeMap],
    modeSetting?: ModeSetting.AsObject,
    enterRoomType: number,
    jackpotParentGold: number,
    isWhitelist: boolean,
    criticalHit: number,
    kongTransfer: number,
    kongWinOfDiscard: number,
    selfDrawnType: number,
    winTypeRule?: WinTypeRule.AsObject,
    kongWinOfDiscardType: number,
    joker: number,
    winWay: number,
    singleHolder: number,
    robKongHolder: number,
    robKong: number,
    wallType: number,
    followDealer: number,
    raise: number,
    raiseOpDuration: number,
    jokerCount: number,
    oneMatchMoreWin: number,
    autoChangeRoomLimitHand: number,
    calltime: number,
    ruleUnitList: Array<RuleUnit.AsObject>,
    simpleHorseMode: number,
    simpleHorseCount: number,
    squidForceShowCard: number,
    settleSetting?: SettleSetting.AsObject,
    squidMode: number,
    squidExtraCount: number,
    quickChangeRoom: number,
    notEnoughCloseDuration: number,
    playDurationType: number,
    playHandsLimit: number,
    insuranceMode: Def.IsuranceModeMap[keyof Def.IsuranceModeMap],
    retainMaxRate: number,
    wheelTemplateId: number,
    allInMute: number,
    squidCountRateList: Array<SquidCountRateConfig.AsObject>,
    depositPercent: number,
    insuranceForceBuyRatio: number,
    bombDoubleType: number,
    bombSixBeginReward: number,
    passAceThreeTime: number,
    doubleLowLevelUpType: number,
    squidLeaveMode: number,
    powerSaving: number,
    squidPlayerCount: number,
    usersList: Array<RoomUserInfo.AsObject>,
    relateClubIdsList: Array<number>,
    relateTribeClubListList: Array<RoomTribeClubRelate.AsObject>,
    currency: string,
    cowboyConfig?: CowboyConfig.AsObject,
    micSeatSwitch: number,
    micMiddleSwitch: number,
    videoSeatSwitch: number,
    videoMiddleSwitch: number,
    powerSavingSeatSwitch: number,
    powerSavingMiddleSwitch: number,
  }
}

export class SquidCountRateConfig extends jspb.Message {
  getCount(): number;
  setCount(value: number): void;

  getRate(): number;
  setRate(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SquidCountRateConfig.AsObject;
  static toObject(includeInstance: boolean, msg: SquidCountRateConfig): SquidCountRateConfig.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SquidCountRateConfig, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SquidCountRateConfig;
  static deserializeBinaryFromReader(message: SquidCountRateConfig, reader: jspb.BinaryReader): SquidCountRateConfig;
}

export namespace SquidCountRateConfig {
  export type AsObject = {
    count: number,
    rate: number,
  }
}

export class SettleSetting extends jspb.Message {
  getType(): number;
  setType(value: number): void;

  getFeePermillage(): number;
  setFeePermillage(value: number): void;

  getMaxPerHand(): number;
  setMaxPerHand(value: number): void;

  getWinProfitPercent(): number;
  setWinProfitPercent(value: number): void;

  getCapType(): number;
  setCapType(value: number): void;

  getSecCaps(): string;
  setSecCaps(value: string): void;

  getHandFeeType(): number;
  setHandFeeType(value: number): void;

  getPreflopFree(): number;
  setPreflopFree(value: number): void;

  getFewPlayerHalfOff(): number;
  setFewPlayerHalfOff(value: number): void;

  getFreePotsValue(): number;
  setFreePotsValue(value: number): void;

  getWinDivideValue(): number;
  setWinDivideValue(value: number): void;

  getAboveDivideFee(): number;
  setAboveDivideFee(value: number): void;

  getBelowDivideRatio(): number;
  setBelowDivideRatio(value: number): void;

  getJackpotRatio(): number;
  setJackpotRatio(value: number): void;

  getJackpotRatioHand(): number;
  setJackpotRatioHand(value: number): void;

  getSettleProfitType(): number;
  setSettleProfitType(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SettleSetting.AsObject;
  static toObject(includeInstance: boolean, msg: SettleSetting): SettleSetting.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SettleSetting, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SettleSetting;
  static deserializeBinaryFromReader(message: SettleSetting, reader: jspb.BinaryReader): SettleSetting;
}

export namespace SettleSetting {
  export type AsObject = {
    type: number,
    feePermillage: number,
    maxPerHand: number,
    winProfitPercent: number,
    capType: number,
    secCaps: string,
    handFeeType: number,
    preflopFree: number,
    fewPlayerHalfOff: number,
    freePotsValue: number,
    winDivideValue: number,
    aboveDivideFee: number,
    belowDivideRatio: number,
    jackpotRatio: number,
    jackpotRatioHand: number,
    settleProfitType: number,
  }
}

export class ModeSetting extends jspb.Message {
  getDeposit(): number;
  setDeposit(value: number): void;

  getMinUsers(): number;
  setMinUsers(value: number): void;

  getTime(): number;
  setTime(value: number): void;

  getTimeOutType(): number;
  setTimeOutType(value: number): void;

  getDepositTo(): number;
  setDepositTo(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ModeSetting.AsObject;
  static toObject(includeInstance: boolean, msg: ModeSetting): ModeSetting.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ModeSetting, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ModeSetting;
  static deserializeBinaryFromReader(message: ModeSetting, reader: jspb.BinaryReader): ModeSetting;
}

export namespace ModeSetting {
  export type AsObject = {
    deposit: number,
    minUsers: number,
    time: number,
    timeOutType: number,
    depositTo: number,
  }
}

export class InsuranceOdds extends jspb.Message {
  getOuts(): number;
  setOuts(value: number): void;

  getOdds(): number;
  setOdds(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InsuranceOdds.AsObject;
  static toObject(includeInstance: boolean, msg: InsuranceOdds): InsuranceOdds.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: InsuranceOdds, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InsuranceOdds;
  static deserializeBinaryFromReader(message: InsuranceOdds, reader: jspb.BinaryReader): InsuranceOdds;
}

export namespace InsuranceOdds {
  export type AsObject = {
    outs: number,
    odds: number,
  }
}

export class InsuranceOddsForPotsUserCount extends jspb.Message {
  getPotUserCount(): number;
  setPotUserCount(value: number): void;

  clearOddsList(): void;
  getOddsList(): Array<InsuranceOdds>;
  setOddsList(value: Array<InsuranceOdds>): void;
  addOdds(value?: InsuranceOdds, index?: number): InsuranceOdds;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InsuranceOddsForPotsUserCount.AsObject;
  static toObject(includeInstance: boolean, msg: InsuranceOddsForPotsUserCount): InsuranceOddsForPotsUserCount.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: InsuranceOddsForPotsUserCount, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InsuranceOddsForPotsUserCount;
  static deserializeBinaryFromReader(message: InsuranceOddsForPotsUserCount, reader: jspb.BinaryReader): InsuranceOddsForPotsUserCount;
}

export namespace InsuranceOddsForPotsUserCount {
  export type AsObject = {
    potUserCount: number,
    oddsList: Array<InsuranceOdds.AsObject>,
  }
}

export class MultiLangName extends jspb.Message {
  getLang(): string;
  setLang(value: string): void;

  getName(): string;
  setName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MultiLangName.AsObject;
  static toObject(includeInstance: boolean, msg: MultiLangName): MultiLangName.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MultiLangName, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MultiLangName;
  static deserializeBinaryFromReader(message: MultiLangName, reader: jspb.BinaryReader): MultiLangName;
}

export namespace MultiLangName {
  export type AsObject = {
    lang: string,
    name: string,
  }
}

export class RoomAdmin extends jspb.Message {
  getDisbandRoom(): number;
  setDisbandRoom(value: number): void;

  getUserStandUp(): number;
  setUserStandUp(value: number): void;

  getUserLeave(): number;
  setUserLeave(value: number): void;

  getViewVideo(): number;
  setViewVideo(value: number): void;

  getVideoVerify(): number;
  setVideoVerify(value: number): void;

  getIsAdmin(): boolean;
  setIsAdmin(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoomAdmin.AsObject;
  static toObject(includeInstance: boolean, msg: RoomAdmin): RoomAdmin.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RoomAdmin, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RoomAdmin;
  static deserializeBinaryFromReader(message: RoomAdmin, reader: jspb.BinaryReader): RoomAdmin;
}

export namespace RoomAdmin {
  export type AsObject = {
    disbandRoom: number,
    userStandUp: number,
    userLeave: number,
    viewVideo: number,
    videoVerify: number,
    isAdmin: boolean,
  }
}

export class MTTRecord extends jspb.Message {
  getMatchId(): number;
  setMatchId(value: number): void;

  getName(): string;
  setName(value: string): void;

  getType(): number;
  setType(value: number): void;

  getGameType(): Def.GameTypeMap[keyof Def.GameTypeMap];
  setGameType(value: Def.GameTypeMap[keyof Def.GameTypeMap]): void;

  getPokerType(): Def.PokerTypeMap[keyof Def.PokerTypeMap];
  setPokerType(value: Def.PokerTypeMap[keyof Def.PokerTypeMap]): void;

  getLimitBetType(): Def.LimitBetTypeMap[keyof Def.LimitBetTypeMap];
  setLimitBetType(value: Def.LimitBetTypeMap[keyof Def.LimitBetTypeMap]): void;

  getRankType(): number;
  setRankType(value: number): void;

  getEnterTime(): string;
  setEnterTime(value: string): void;

  getStartTime(): string;
  setStartTime(value: string): void;

  getEndTime(): string;
  setEndTime(value: string): void;

  getHunterOn(): number;
  setHunterOn(value: number): void;

  getHunterBonus(): number;
  setHunterBonus(value: number): void;

  getPartialOn(): number;
  setPartialOn(value: number): void;

  getParitalReturnBl(): number;
  setParitalReturnBl(value: number): void;

  getStraddleOn(): number;
  setStraddleOn(value: number): void;

  getStraddleMax(): number;
  setStraddleMax(value: number): void;

  getMuckOn(): number;
  setMuckOn(value: number): void;

  getRooms(): number;
  setRooms(value: number): void;

  getMaxRoomId(): number;
  setMaxRoomId(value: number): void;

  getDelayViewCardOn(): number;
  setDelayViewCardOn(value: number): void;

  getLimitMin(): number;
  setLimitMin(value: number): void;

  getLimitDelayTimes(): number;
  setLimitDelayTimes(value: number): void;

  getLimitAutoCheckTimes(): number;
  setLimitAutoCheckTimes(value: number): void;

  getLimitAutoFoldTimes(): number;
  setLimitAutoFoldTimes(value: number): void;

  getParticipants(): number;
  setParticipants(value: number): void;

  getAlive(): number;
  setAlive(value: number): void;

  getAwardNum(): number;
  setAwardNum(value: number): void;

  getMoneySync(): number;
  setMoneySync(value: number): void;

  getStatus(): number;
  setStatus(value: number): void;

  getSeatCount(): number;
  setSeatCount(value: number): void;

  getFinalSeatCount(): number;
  setFinalSeatCount(value: number): void;

  getNoUserWaitDuration(): number;
  setNoUserWaitDuration(value: number): void;

  getInitialScore(): number;
  setInitialScore(value: number): void;

  getBlindtableType(): number;
  setBlindtableType(value: number): void;

  getUpblindInterval(): number;
  setUpblindInterval(value: number): void;

  getApplyStartTime(): string;
  setApplyStartTime(value: string): void;

  getOpDuration(): number;
  setOpDuration(value: number): void;

  getMaxDelayApplyBl(): number;
  setMaxDelayApplyBl(value: number): void;

  getRebuyTimes(): number;
  setRebuyTimes(value: number): void;

  getMaxRebuyBl(): number;
  setMaxRebuyBl(value: number): void;

  getLimitTotalBuyTimes(): number;
  setLimitTotalBuyTimes(value: number): void;

  getTotalBuyTimes(): number;
  setTotalBuyTimes(value: number): void;

  getTotalBuyinTimes(): number;
  setTotalBuyinTimes(value: number): void;

  getTotalRebuyTimes(): number;
  setTotalRebuyTimes(value: number): void;

  getAddonBeginBl(): number;
  setAddonBeginBl(value: number): void;

  getAddonEndBl(): number;
  setAddonEndBl(value: number): void;

  getAddonScore(): number;
  setAddonScore(value: number): void;

  getTotalAddonTimes(): number;
  setTotalAddonTimes(value: number): void;

  getApplyFeePool(): number;
  setApplyFeePool(value: number): void;

  getApplyFeeService(): number;
  setApplyFeeService(value: number): void;

  getApplyFeeHunter(): number;
  setApplyFeeHunter(value: number): void;

  getPrizeType(): number;
  setPrizeType(value: number): void;

  getPrizeBasePool(): number;
  setPrizeBasePool(value: number): void;

  getTribeId(): number;
  setTribeId(value: number): void;

  getCreateTime(): string;
  setCreateTime(value: string): void;

  getUpdateTime(): string;
  setUpdateTime(value: string): void;

  getBuyPropId(): number;
  setBuyPropId(value: number): void;

  getPropBuyType(): Def.PropBuyTypeMap[keyof Def.PropBuyTypeMap];
  setPropBuyType(value: Def.PropBuyTypeMap[keyof Def.PropBuyTypeMap]): void;

  getGameIcon(): string;
  setGameIcon(value: string): void;

  getVoiceprintVerifyOn(): number;
  setVoiceprintVerifyOn(value: number): void;

  getVoiceprintVerifyDuration(): number;
  setVoiceprintVerifyDuration(value: number): void;

  getAddonplusM1On(): number;
  setAddonplusM1On(value: number): void;

  getAddonplusM1MaxTimes(): number;
  setAddonplusM1MaxTimes(value: number): void;

  getAddonplusM1Limit(): number;
  setAddonplusM1Limit(value: number): void;

  getTotalAddonplusM1Times(): number;
  setTotalAddonplusM1Times(value: number): void;

  getAddonplusM2On(): number;
  setAddonplusM2On(value: number): void;

  getAddonplusM2MaxTimes(): number;
  setAddonplusM2MaxTimes(value: number): void;

  getAddonplusM2MaxBl(): number;
  setAddonplusM2MaxBl(value: number): void;

  getTotalAddonplusM2Times(): number;
  setTotalAddonplusM2Times(value: number): void;

  getBuyRatio(): number;
  setBuyRatio(value: number): void;

  getPreBuyinBonus(): number;
  setPreBuyinBonus(value: number): void;

  getTableclothTag(): string;
  setTableclothTag(value: string): void;

  getLimitTag(): string;
  setLimitTag(value: string): void;

  getBonustableType(): number;
  setBonustableType(value: number): void;

  getBuyinFreeTimes(): number;
  setBuyinFreeTimes(value: number): void;

  getRebuyFreeTimes(): number;
  setRebuyFreeTimes(value: number): void;

  getMultiRatioFreeTimes(): number;
  setMultiRatioFreeTimes(value: number): void;

  getAddonFreeTimes(): number;
  setAddonFreeTimes(value: number): void;

  getBuyinFreeInclSvr(): number;
  setBuyinFreeInclSvr(value: number): void;

  getRebuyFreeInclSvr(): number;
  setRebuyFreeInclSvr(value: number): void;

  getMultiRatioFreeInclSvr(): number;
  setMultiRatioFreeInclSvr(value: number): void;

  getAddonFreeInclSvr(): number;
  setAddonFreeInclSvr(value: number): void;

  getAwardReplacePropId(): number;
  setAwardReplacePropId(value: number): void;

  getAwardReplacePropValue(): number;
  setAwardReplacePropValue(value: number): void;

  getAwardExtraBuyTimes(): number;
  setAwardExtraBuyTimes(value: number): void;

  getAwardExtraAddCount(): number;
  setAwardExtraAddCount(value: number): void;

  getAwardExtraPropId(): number;
  setAwardExtraPropId(value: number): void;

  getAwardExtraGoldValue(): number;
  setAwardExtraGoldValue(value: number): void;

  getAwardExtraGoldBuy(): number;
  setAwardExtraGoldBuy(value: number): void;

  getAwardExtraTicketBuy(): number;
  setAwardExtraTicketBuy(value: number): void;

  getAwardExtraFreeBuy(): number;
  setAwardExtraFreeBuy(value: number): void;

  getBreakBasePool(): number;
  setBreakBasePool(value: number): void;

  getTotalExtraBuyTimes(): number;
  setTotalExtraBuyTimes(value: number): void;

  getAwardExtraPropValue(): number;
  setAwardExtraPropValue(value: number): void;

  getRebuyTicketLimitTimes(): number;
  setRebuyTicketLimitTimes(value: number): void;

  getAddonTicketLimitTimes(): number;
  setAddonTicketLimitTimes(value: number): void;

  getCreatorId(): number;
  setCreatorId(value: number): void;

  getShareMtt(): number;
  setShareMtt(value: number): void;

  getTemplateId(): number;
  setTemplateId(value: number): void;

  getGoldType(): number;
  setGoldType(value: number): void;

  getDealDelay(): number;
  setDealDelay(value: number): void;

  getBombpot(): number;
  setBombpot(value: number): void;

  getAntiCheatType(): number;
  setAntiCheatType(value: number): void;

  getAntiCheatTimelimit(): number;
  setAntiCheatTimelimit(value: number): void;

  getAntiCheatVideoType(): number;
  setAntiCheatVideoType(value: number): void;

  getPopupMessage(): string;
  setPopupMessage(value: string): void;

  getVideoVerifyType(): number;
  setVideoVerifyType(value: number): void;

  getAntiCheatOrderType(): number;
  setAntiCheatOrderType(value: number): void;

  getAntiCheatOrderMicType(): number;
  setAntiCheatOrderMicType(value: number): void;

  getSngId(): number;
  setSngId(value: number): void;

  getSngInvitationCode(): string;
  setSngInvitationCode(value: string): void;

  getForceVideoTimingAward(): number;
  setForceVideoTimingAward(value: number): void;

  getForceVideoTimingFinals(): number;
  setForceVideoTimingFinals(value: number): void;

  getForceVideoClose(): number;
  setForceVideoClose(value: number): void;

  getForceVideoCloseTime(): number;
  setForceVideoCloseTime(value: number): void;

  getForceVideoStartTime(): number;
  setForceVideoStartTime(value: number): void;

  getForceCloseTime(): number;
  setForceCloseTime(value: number): void;

  getChatType(): number;
  setChatType(value: number): void;

  getForceVideoTimingReorg(): number;
  setForceVideoTimingReorg(value: number): void;

  getForceVideoTimingUpBlind(): number;
  setForceVideoTimingUpBlind(value: number): void;

  getForceVideoTimingUpBlindTimes(): number;
  setForceVideoTimingUpBlindTimes(value: number): void;

  getDelayTimeType(): number;
  setDelayTimeType(value: number): void;

  clearBlindLevelDelayTimeTableList(): void;
  getBlindLevelDelayTimeTableList(): Array<MTTBlindLevelDelayTime>;
  setBlindLevelDelayTimeTableList(value: Array<MTTBlindLevelDelayTime>): void;
  addBlindLevelDelayTimeTable(value?: MTTBlindLevelDelayTime, index?: number): MTTBlindLevelDelayTime;

  getMaxDelayTimes(): number;
  setMaxDelayTimes(value: number): void;

  getAutoDelayTime(): number;
  setAutoDelayTime(value: number): void;

  getMjTotalHands(): number;
  setMjTotalHands(value: number): void;

  getMjShuffleHands(): number;
  setMjShuffleHands(value: number): void;

  getMjBlindUpHands(): number;
  setMjBlindUpHands(value: number): void;

  getInvitationCode(): string;
  setInvitationCode(value: string): void;

  getClubId(): number;
  setClubId(value: number): void;

  getOriginType(): number;
  setOriginType(value: number): void;

  getStageFatherId(): number;
  setStageFatherId(value: number): void;

  getStageName(): string;
  setStageName(value: string): void;

  getStageBlindLevel(): number;
  setStageBlindLevel(value: number): void;

  getStageRemainRate(): number;
  setStageRemainRate(value: number): void;

  getStageFinalScoreType(): number;
  setStageFinalScoreType(value: number): void;

  getInsuranceAmount(): number;
  setInsuranceAmount(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MTTRecord.AsObject;
  static toObject(includeInstance: boolean, msg: MTTRecord): MTTRecord.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MTTRecord, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MTTRecord;
  static deserializeBinaryFromReader(message: MTTRecord, reader: jspb.BinaryReader): MTTRecord;
}

export namespace MTTRecord {
  export type AsObject = {
    matchId: number,
    name: string,
    type: number,
    gameType: Def.GameTypeMap[keyof Def.GameTypeMap],
    pokerType: Def.PokerTypeMap[keyof Def.PokerTypeMap],
    limitBetType: Def.LimitBetTypeMap[keyof Def.LimitBetTypeMap],
    rankType: number,
    enterTime: string,
    startTime: string,
    endTime: string,
    hunterOn: number,
    hunterBonus: number,
    partialOn: number,
    paritalReturnBl: number,
    straddleOn: number,
    straddleMax: number,
    muckOn: number,
    rooms: number,
    maxRoomId: number,
    delayViewCardOn: number,
    limitMin: number,
    limitDelayTimes: number,
    limitAutoCheckTimes: number,
    limitAutoFoldTimes: number,
    participants: number,
    alive: number,
    awardNum: number,
    moneySync: number,
    status: number,
    seatCount: number,
    finalSeatCount: number,
    noUserWaitDuration: number,
    initialScore: number,
    blindtableType: number,
    upblindInterval: number,
    applyStartTime: string,
    opDuration: number,
    maxDelayApplyBl: number,
    rebuyTimes: number,
    maxRebuyBl: number,
    limitTotalBuyTimes: number,
    totalBuyTimes: number,
    totalBuyinTimes: number,
    totalRebuyTimes: number,
    addonBeginBl: number,
    addonEndBl: number,
    addonScore: number,
    totalAddonTimes: number,
    applyFeePool: number,
    applyFeeService: number,
    applyFeeHunter: number,
    prizeType: number,
    prizeBasePool: number,
    tribeId: number,
    createTime: string,
    updateTime: string,
    buyPropId: number,
    propBuyType: Def.PropBuyTypeMap[keyof Def.PropBuyTypeMap],
    gameIcon: string,
    voiceprintVerifyOn: number,
    voiceprintVerifyDuration: number,
    addonplusM1On: number,
    addonplusM1MaxTimes: number,
    addonplusM1Limit: number,
    totalAddonplusM1Times: number,
    addonplusM2On: number,
    addonplusM2MaxTimes: number,
    addonplusM2MaxBl: number,
    totalAddonplusM2Times: number,
    buyRatio: number,
    preBuyinBonus: number,
    tableclothTag: string,
    limitTag: string,
    bonustableType: number,
    buyinFreeTimes: number,
    rebuyFreeTimes: number,
    multiRatioFreeTimes: number,
    addonFreeTimes: number,
    buyinFreeInclSvr: number,
    rebuyFreeInclSvr: number,
    multiRatioFreeInclSvr: number,
    addonFreeInclSvr: number,
    awardReplacePropId: number,
    awardReplacePropValue: number,
    awardExtraBuyTimes: number,
    awardExtraAddCount: number,
    awardExtraPropId: number,
    awardExtraGoldValue: number,
    awardExtraGoldBuy: number,
    awardExtraTicketBuy: number,
    awardExtraFreeBuy: number,
    breakBasePool: number,
    totalExtraBuyTimes: number,
    awardExtraPropValue: number,
    rebuyTicketLimitTimes: number,
    addonTicketLimitTimes: number,
    creatorId: number,
    shareMtt: number,
    templateId: number,
    goldType: number,
    dealDelay: number,
    bombpot: number,
    antiCheatType: number,
    antiCheatTimelimit: number,
    antiCheatVideoType: number,
    popupMessage: string,
    videoVerifyType: number,
    antiCheatOrderType: number,
    antiCheatOrderMicType: number,
    sngId: number,
    sngInvitationCode: string,
    forceVideoTimingAward: number,
    forceVideoTimingFinals: number,
    forceVideoClose: number,
    forceVideoCloseTime: number,
    forceVideoStartTime: number,
    forceCloseTime: number,
    chatType: number,
    forceVideoTimingReorg: number,
    forceVideoTimingUpBlind: number,
    forceVideoTimingUpBlindTimes: number,
    delayTimeType: number,
    blindLevelDelayTimeTableList: Array<MTTBlindLevelDelayTime.AsObject>,
    maxDelayTimes: number,
    autoDelayTime: number,
    mjTotalHands: number,
    mjShuffleHands: number,
    mjBlindUpHands: number,
    invitationCode: string,
    clubId: number,
    originType: number,
    stageFatherId: number,
    stageName: string,
    stageBlindLevel: number,
    stageRemainRate: number,
    stageFinalScoreType: number,
    insuranceAmount: number,
  }
}

export class MTTMore extends jspb.Message {
  getBl(): number;
  setBl(value: number): void;

  getSb(): number;
  setSb(value: number): void;

  getAnte(): number;
  setAnte(value: number): void;

  getNsb(): number;
  setNsb(value: number): void;

  getNante(): number;
  setNante(value: number): void;

  getNbl(): number;
  setNbl(value: number): void;

  getPrizePool(): number;
  setPrizePool(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MTTMore.AsObject;
  static toObject(includeInstance: boolean, msg: MTTMore): MTTMore.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MTTMore, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MTTMore;
  static deserializeBinaryFromReader(message: MTTMore, reader: jspb.BinaryReader): MTTMore;
}

export namespace MTTMore {
  export type AsObject = {
    bl: number,
    sb: number,
    ante: number,
    nsb: number,
    nante: number,
    nbl: number,
    prizePool: number,
  }
}

export class MTTUserStatus extends jspb.Message {
  getLeftRebuyTimes(): number;
  setLeftRebuyTimes(value: number): void;

  getChip(): number;
  setChip(value: number): void;

  getStore(): number;
  setStore(value: number): void;

  getInitScore(): number;
  setInitScore(value: number): void;

  getPartialEnable(): boolean;
  setPartialEnable(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MTTUserStatus.AsObject;
  static toObject(includeInstance: boolean, msg: MTTUserStatus): MTTUserStatus.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MTTUserStatus, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MTTUserStatus;
  static deserializeBinaryFromReader(message: MTTUserStatus, reader: jspb.BinaryReader): MTTUserStatus;
}

export namespace MTTUserStatus {
  export type AsObject = {
    leftRebuyTimes: number,
    chip: number,
    store: number,
    initScore: number,
    partialEnable: boolean,
  }
}

export class PlayerJackpotSummary extends jspb.Message {
  getUserRid(): number;
  setUserRid(value: number): void;

  getName(): string;
  setName(value: string): void;

  getAvatar(): string;
  setAvatar(value: string): void;

  getSex(): number;
  setSex(value: number): void;

  getContributeTotal(): number;
  setContributeTotal(value: number): void;

  getAwardTotal(): number;
  setAwardTotal(value: number): void;

  getRoyalFlushCount(): number;
  setRoyalFlushCount(value: number): void;

  getStraightFlushCount(): number;
  setStraightFlushCount(value: number): void;

  getFourOfaKindCount(): number;
  setFourOfaKindCount(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PlayerJackpotSummary.AsObject;
  static toObject(includeInstance: boolean, msg: PlayerJackpotSummary): PlayerJackpotSummary.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PlayerJackpotSummary, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PlayerJackpotSummary;
  static deserializeBinaryFromReader(message: PlayerJackpotSummary, reader: jspb.BinaryReader): PlayerJackpotSummary;
}

export namespace PlayerJackpotSummary {
  export type AsObject = {
    userRid: number,
    name: string,
    avatar: string,
    sex: number,
    contributeTotal: number,
    awardTotal: number,
    royalFlushCount: number,
    straightFlushCount: number,
    fourOfaKindCount: number,
  }
}

export class RoomJackpotConfig extends jspb.Message {
  getContributePotSwitch(): number;
  setContributePotSwitch(value: number): void;

  getContributePotLimit(): number;
  setContributePotLimit(value: number): void;

  getAwardBetSwitch(): number;
  setAwardBetSwitch(value: number): void;

  getAwardBetLimit(): number;
  setAwardBetLimit(value: number): void;

  getAwardOtherSwitch(): number;
  setAwardOtherSwitch(value: number): void;

  getAwardOtherRatio(): number;
  setAwardOtherRatio(value: number): void;

  getContributeType(): number;
  setContributeType(value: number): void;

  getContributeFixedLimit(): number;
  setContributeFixedLimit(value: number): void;

  getContributeFixedRate(): number;
  setContributeFixedRate(value: number): void;

  getContributeRatio(): number;
  setContributeRatio(value: number): void;

  getContributePotRatio(): number;
  setContributePotRatio(value: number): void;

  getGamePlayRatio(): number;
  setGamePlayRatio(value: number): void;

  getBlindRatio(): number;
  setBlindRatio(value: number): void;

  getRoyalFlushSwitch(): number;
  setRoyalFlushSwitch(value: number): void;

  getRoyalFlushRatio(): number;
  setRoyalFlushRatio(value: number): void;

  getStraightFlushSwitch(): number;
  setStraightFlushSwitch(value: number): void;

  getStraightFlushRatio(): number;
  setStraightFlushRatio(value: number): void;

  getFourOfaKindSwitch(): number;
  setFourOfaKindSwitch(value: number): void;

  getFourOfaKindRatio(): number;
  setFourOfaKindRatio(value: number): void;

  getAwardRoundType(): number;
  setAwardRoundType(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoomJackpotConfig.AsObject;
  static toObject(includeInstance: boolean, msg: RoomJackpotConfig): RoomJackpotConfig.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RoomJackpotConfig, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RoomJackpotConfig;
  static deserializeBinaryFromReader(message: RoomJackpotConfig, reader: jspb.BinaryReader): RoomJackpotConfig;
}

export namespace RoomJackpotConfig {
  export type AsObject = {
    contributePotSwitch: number,
    contributePotLimit: number,
    awardBetSwitch: number,
    awardBetLimit: number,
    awardOtherSwitch: number,
    awardOtherRatio: number,
    contributeType: number,
    contributeFixedLimit: number,
    contributeFixedRate: number,
    contributeRatio: number,
    contributePotRatio: number,
    gamePlayRatio: number,
    blindRatio: number,
    royalFlushSwitch: number,
    royalFlushRatio: number,
    straightFlushSwitch: number,
    straightFlushRatio: number,
    fourOfaKindSwitch: number,
    fourOfaKindRatio: number,
    awardRoundType: number,
  }
}

export class SubRoomConfig extends jspb.Message {
  getAnte(): number;
  setAnte(value: number): void;

  getSb(): number;
  setSb(value: number): void;

  getGameType(): number;
  setGameType(value: number): void;

  getPokerType(): number;
  setPokerType(value: number): void;

  getLimitBetType(): number;
  setLimitBetType(value: number): void;

  getBombpot(): number;
  setBombpot(value: number): void;

  getSquidBase(): number;
  setSquidBase(value: number): void;

  getRounds(): number;
  setRounds(value: number): void;

  getCriticalHit(): number;
  setCriticalHit(value: number): void;

  getPlayingPlayerCountLimit(): number;
  setPlayingPlayerCountLimit(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SubRoomConfig.AsObject;
  static toObject(includeInstance: boolean, msg: SubRoomConfig): SubRoomConfig.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SubRoomConfig, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SubRoomConfig;
  static deserializeBinaryFromReader(message: SubRoomConfig, reader: jspb.BinaryReader): SubRoomConfig;
}

export namespace SubRoomConfig {
  export type AsObject = {
    ante: number,
    sb: number,
    gameType: number,
    pokerType: number,
    limitBetType: number,
    bombpot: number,
    squidBase: number,
    rounds: number,
    criticalHit: number,
    playingPlayerCountLimit: number,
  }
}

export class JackpotAward extends jspb.Message {
  getUserRid(): number;
  setUserRid(value: number): void;

  getNickname(): string;
  setNickname(value: string): void;

  getAvatar(): string;
  setAvatar(value: string): void;

  getAward(): number;
  setAward(value: number): void;

  getCardsType(): number;
  setCardsType(value: number): void;

  getHandValue(): number;
  setHandValue(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): JackpotAward.AsObject;
  static toObject(includeInstance: boolean, msg: JackpotAward): JackpotAward.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: JackpotAward, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): JackpotAward;
  static deserializeBinaryFromReader(message: JackpotAward, reader: jspb.BinaryReader): JackpotAward;
}

export namespace JackpotAward {
  export type AsObject = {
    userRid: number,
    nickname: string,
    avatar: string,
    award: number,
    cardsType: number,
    handValue: number,
  }
}

export class WinTypeRule extends jspb.Message {
  getOutsideHand(): number;
  setOutsideHand(value: number): void;

  getAllSimple(): number;
  setAllSimple(value: number): void;

  getEyesPair(): number;
  setEyesPair(value: number): void;

  getConcealed(): number;
  setConcealed(value: number): void;

  getBlessingOfHeavenAndEarth(): number;
  setBlessingOfHeavenAndEarth(value: number): void;

  getTdNoJokerMultiplyTwo(): number;
  setTdNoJokerMultiplyTwo(value: number): void;

  getEyesSevenPairs(): number;
  setEyesSevenPairs(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WinTypeRule.AsObject;
  static toObject(includeInstance: boolean, msg: WinTypeRule): WinTypeRule.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WinTypeRule, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WinTypeRule;
  static deserializeBinaryFromReader(message: WinTypeRule, reader: jspb.BinaryReader): WinTypeRule;
}

export namespace WinTypeRule {
  export type AsObject = {
    outsideHand: number,
    allSimple: number,
    eyesPair: number,
    concealed: number,
    blessingOfHeavenAndEarth: number,
    tdNoJokerMultiplyTwo: number,
    eyesSevenPairs: number,
  }
}

export class RuleUnit extends jspb.Message {
  getW(): number;
  setW(value: number): void;

  getD(): number;
  setD(value: number): void;

  getP(): boolean;
  setP(value: boolean): void;

  clearFesList(): void;
  getFesList(): Array<number>;
  setFesList(value: Array<number>): void;
  addFes(value: number, index?: number): number;

  clearFisList(): void;
  getFisList(): Array<number>;
  setFisList(value: Array<number>): void;
  addFis(value: number, index?: number): number;

  getIg(): boolean;
  setIg(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RuleUnit.AsObject;
  static toObject(includeInstance: boolean, msg: RuleUnit): RuleUnit.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RuleUnit, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RuleUnit;
  static deserializeBinaryFromReader(message: RuleUnit, reader: jspb.BinaryReader): RuleUnit;
}

export namespace RuleUnit {
  export type AsObject = {
    w: number,
    d: number,
    p: boolean,
    fesList: Array<number>,
    fisList: Array<number>,
    ig: boolean,
  }
}

export class PlayerInsuranceOutsCards extends jspb.Message {
  getSeatId(): number;
  setSeatId(value: number): void;

  clearWinCardsList(): void;
  getWinCardsList(): Array<number>;
  setWinCardsList(value: Array<number>): void;
  addWinCards(value: number, index?: number): number;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PlayerInsuranceOutsCards.AsObject;
  static toObject(includeInstance: boolean, msg: PlayerInsuranceOutsCards): PlayerInsuranceOutsCards.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PlayerInsuranceOutsCards, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PlayerInsuranceOutsCards;
  static deserializeBinaryFromReader(message: PlayerInsuranceOutsCards, reader: jspb.BinaryReader): PlayerInsuranceOutsCards;
}

export namespace PlayerInsuranceOutsCards {
  export type AsObject = {
    seatId: number,
    winCardsList: Array<number>,
  }
}

export class PlayerInsurance extends jspb.Message {
  getUserRid(): number;
  setUserRid(value: number): void;

  getName(): string;
  setName(value: string): void;

  getAvatar(): string;
  setAvatar(value: string): void;

  getInsurance(): number;
  setInsurance(value: number): void;

  getInsuranceBet(): number;
  setInsuranceBet(value: number): void;

  getInsuranceEv(): number;
  setInsuranceEv(value: number): void;

  getCreateTime(): number;
  setCreateTime(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PlayerInsurance.AsObject;
  static toObject(includeInstance: boolean, msg: PlayerInsurance): PlayerInsurance.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PlayerInsurance, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PlayerInsurance;
  static deserializeBinaryFromReader(message: PlayerInsurance, reader: jspb.BinaryReader): PlayerInsurance;
}

export namespace PlayerInsurance {
  export type AsObject = {
    userRid: number,
    name: string,
    avatar: string,
    insurance: number,
    insuranceBet: number,
    insuranceEv: number,
    createTime: number,
  }
}

export class ChangeRoomInfo extends jspb.Message {
  getRoomId(): number;
  setRoomId(value: number): void;

  getRoomType(): number;
  setRoomType(value: number): void;

  getAntiCheatType(): number;
  setAntiCheatType(value: number): void;

  getAntiCheatVideoType(): number;
  setAntiCheatVideoType(value: number): void;

  getBombpot(): number;
  setBombpot(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChangeRoomInfo.AsObject;
  static toObject(includeInstance: boolean, msg: ChangeRoomInfo): ChangeRoomInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChangeRoomInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChangeRoomInfo;
  static deserializeBinaryFromReader(message: ChangeRoomInfo, reader: jspb.BinaryReader): ChangeRoomInfo;
}

export namespace ChangeRoomInfo {
  export type AsObject = {
    roomId: number,
    roomType: number,
    antiCheatType: number,
    antiCheatVideoType: number,
    bombpot: number,
  }
}

export class RoomTemplateUpdateInfo extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getUpdateType(): number;
  setUpdateType(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoomTemplateUpdateInfo.AsObject;
  static toObject(includeInstance: boolean, msg: RoomTemplateUpdateInfo): RoomTemplateUpdateInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RoomTemplateUpdateInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RoomTemplateUpdateInfo;
  static deserializeBinaryFromReader(message: RoomTemplateUpdateInfo, reader: jspb.BinaryReader): RoomTemplateUpdateInfo;
}

export namespace RoomTemplateUpdateInfo {
  export type AsObject = {
    id: number,
    updateType: number,
  }
}

export class JackpotTemplateUpdateInfo extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getClubId(): number;
  setClubId(value: number): void;

  getUpdateType(): number;
  setUpdateType(value: number): void;

  getTribeId(): number;
  setTribeId(value: number): void;

  getGold(): number;
  setGold(value: number): void;

  clearAwardListList(): void;
  getAwardListList(): Array<JackpotAwardLog>;
  setAwardListList(value: Array<JackpotAwardLog>): void;
  addAwardList(value?: JackpotAwardLog, index?: number): JackpotAwardLog;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): JackpotTemplateUpdateInfo.AsObject;
  static toObject(includeInstance: boolean, msg: JackpotTemplateUpdateInfo): JackpotTemplateUpdateInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: JackpotTemplateUpdateInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): JackpotTemplateUpdateInfo;
  static deserializeBinaryFromReader(message: JackpotTemplateUpdateInfo, reader: jspb.BinaryReader): JackpotTemplateUpdateInfo;
}

export namespace JackpotTemplateUpdateInfo {
  export type AsObject = {
    id: number,
    clubId: number,
    updateType: number,
    tribeId: number,
    gold: number,
    awardListList: Array<JackpotAwardLog.AsObject>,
  }
}

export class RoomRecordSimple extends jspb.Message {
  getRoomId(): number;
  setRoomId(value: number): void;

  getStatus(): number;
  setStatus(value: number): void;

  getEmptySeat(): number;
  setEmptySeat(value: number): void;

  getPlayDuration(): number;
  setPlayDuration(value: number): void;

  getStartTime(): number;
  setStartTime(value: number): void;

  getHandNum(): number;
  setHandNum(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoomRecordSimple.AsObject;
  static toObject(includeInstance: boolean, msg: RoomRecordSimple): RoomRecordSimple.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RoomRecordSimple, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RoomRecordSimple;
  static deserializeBinaryFromReader(message: RoomRecordSimple, reader: jspb.BinaryReader): RoomRecordSimple;
}

export namespace RoomRecordSimple {
  export type AsObject = {
    roomId: number,
    status: number,
    emptySeat: number,
    playDuration: number,
    startTime: number,
    handNum: number,
  }
}

export class MyWheelInfo extends jspb.Message {
  getWheelTemplateId(): number;
  setWheelTemplateId(value: number): void;

  getLotteryHandNum(): number;
  setLotteryHandNum(value: number): void;

  getUserHandNum(): number;
  setUserHandNum(value: number): void;

  getUserParticipateState(): number;
  setUserParticipateState(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MyWheelInfo.AsObject;
  static toObject(includeInstance: boolean, msg: MyWheelInfo): MyWheelInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MyWheelInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MyWheelInfo;
  static deserializeBinaryFromReader(message: MyWheelInfo, reader: jspb.BinaryReader): MyWheelInfo;
}

export namespace MyWheelInfo {
  export type AsObject = {
    wheelTemplateId: number,
    lotteryHandNum: number,
    userHandNum: number,
    userParticipateState: number,
  }
}

export class BlackInfo extends jspb.Message {
  getTribeId(): number;
  setTribeId(value: number): void;

  getTribeRid(): number;
  setTribeRid(value: number): void;

  getTribeName(): string;
  setTribeName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BlackInfo.AsObject;
  static toObject(includeInstance: boolean, msg: BlackInfo): BlackInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: BlackInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BlackInfo;
  static deserializeBinaryFromReader(message: BlackInfo, reader: jspb.BinaryReader): BlackInfo;
}

export namespace BlackInfo {
  export type AsObject = {
    tribeId: number,
    tribeRid: number,
    tribeName: string,
  }
}

export class MTTBlindLevelDelayTime extends jspb.Message {
  getLevel(): number;
  setLevel(value: number): void;

  getSmallBlind(): number;
  setSmallBlind(value: number): void;

  getAnte(): number;
  setAnte(value: number): void;

  getDelayTimes(): number;
  setDelayTimes(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MTTBlindLevelDelayTime.AsObject;
  static toObject(includeInstance: boolean, msg: MTTBlindLevelDelayTime): MTTBlindLevelDelayTime.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MTTBlindLevelDelayTime, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MTTBlindLevelDelayTime;
  static deserializeBinaryFromReader(message: MTTBlindLevelDelayTime, reader: jspb.BinaryReader): MTTBlindLevelDelayTime;
}

export namespace MTTBlindLevelDelayTime {
  export type AsObject = {
    level: number,
    smallBlind: number,
    ante: number,
    delayTimes: number,
  }
}

export class RoomUserInfo extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getUn(): number;
  setUn(value: number): void;

  getName(): string;
  setName(value: string): void;

  getAvatar(): string;
  setAvatar(value: string): void;

  getSeat(): number;
  setSeat(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoomUserInfo.AsObject;
  static toObject(includeInstance: boolean, msg: RoomUserInfo): RoomUserInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RoomUserInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RoomUserInfo;
  static deserializeBinaryFromReader(message: RoomUserInfo, reader: jspb.BinaryReader): RoomUserInfo;
}

export namespace RoomUserInfo {
  export type AsObject = {
    id: number,
    un: number,
    name: string,
    avatar: string,
    seat: number,
  }
}

export class RoomTribeClubRelate extends jspb.Message {
  getTribeId(): number;
  setTribeId(value: number): void;

  clearClubIdsList(): void;
  getClubIdsList(): Array<number>;
  setClubIdsList(value: Array<number>): void;
  addClubIds(value: number, index?: number): number;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoomTribeClubRelate.AsObject;
  static toObject(includeInstance: boolean, msg: RoomTribeClubRelate): RoomTribeClubRelate.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RoomTribeClubRelate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RoomTribeClubRelate;
  static deserializeBinaryFromReader(message: RoomTribeClubRelate, reader: jspb.BinaryReader): RoomTribeClubRelate;
}

export namespace RoomTribeClubRelate {
  export type AsObject = {
    tribeId: number,
    clubIdsList: Array<number>,
  }
}

export class RoomChange extends jspb.Message {
  getRid(): number;
  setRid(value: number): void;

  getStatus(): number;
  setStatus(value: number): void;

  getEmptySeat(): number;
  setEmptySeat(value: number): void;

  getHandNum(): number;
  setHandNum(value: number): void;

  clearUsersList(): void;
  getUsersList(): Array<RoomUserInfo>;
  setUsersList(value: Array<RoomUserInfo>): void;
  addUsers(value?: RoomUserInfo, index?: number): RoomUserInfo;

  clearRelateClubIdsList(): void;
  getRelateClubIdsList(): Array<number>;
  setRelateClubIdsList(value: Array<number>): void;
  addRelateClubIds(value: number, index?: number): number;

  clearRelateTribeClubListList(): void;
  getRelateTribeClubListList(): Array<RoomTribeClubRelate>;
  setRelateTribeClubListList(value: Array<RoomTribeClubRelate>): void;
  addRelateTribeClubList(value?: RoomTribeClubRelate, index?: number): RoomTribeClubRelate;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoomChange.AsObject;
  static toObject(includeInstance: boolean, msg: RoomChange): RoomChange.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RoomChange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RoomChange;
  static deserializeBinaryFromReader(message: RoomChange, reader: jspb.BinaryReader): RoomChange;
}

export namespace RoomChange {
  export type AsObject = {
    rid: number,
    status: number,
    emptySeat: number,
    handNum: number,
    usersList: Array<RoomUserInfo.AsObject>,
    relateClubIdsList: Array<number>,
    relateTribeClubListList: Array<RoomTribeClubRelate.AsObject>,
  }
}

export class CowboyConfig extends jspb.Message {
  getMaxAmountMin(): number;
  setMaxAmountMin(value: number): void;

  getMaxAmountMax(): number;
  setMaxAmountMax(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CowboyConfig.AsObject;
  static toObject(includeInstance: boolean, msg: CowboyConfig): CowboyConfig.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CowboyConfig, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CowboyConfig;
  static deserializeBinaryFromReader(message: CowboyConfig, reader: jspb.BinaryReader): CowboyConfig;
}

export namespace CowboyConfig {
  export type AsObject = {
    maxAmountMin: number,
    maxAmountMax: number,
  }
}

export class UserInsuranceResult extends jspb.Message {
  getRnd(): Def.RoundMap[keyof Def.RoundMap];
  setRnd(value: Def.RoundMap[keyof Def.RoundMap]): void;

  getInsurance(): number;
  setInsurance(value: number): void;

  getInsuranceWin(): number;
  setInsuranceWin(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserInsuranceResult.AsObject;
  static toObject(includeInstance: boolean, msg: UserInsuranceResult): UserInsuranceResult.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UserInsuranceResult, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserInsuranceResult;
  static deserializeBinaryFromReader(message: UserInsuranceResult, reader: jspb.BinaryReader): UserInsuranceResult;
}

export namespace UserInsuranceResult {
  export type AsObject = {
    rnd: Def.RoundMap[keyof Def.RoundMap],
    insurance: number,
    insuranceWin: number,
  }
}

export class WheelTemplateUpdateInfo extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getUpdateType(): number;
  setUpdateType(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WheelTemplateUpdateInfo.AsObject;
  static toObject(includeInstance: boolean, msg: WheelTemplateUpdateInfo): WheelTemplateUpdateInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WheelTemplateUpdateInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WheelTemplateUpdateInfo;
  static deserializeBinaryFromReader(message: WheelTemplateUpdateInfo, reader: jspb.BinaryReader): WheelTemplateUpdateInfo;
}

export namespace WheelTemplateUpdateInfo {
  export type AsObject = {
    id: number,
    updateType: number,
  }
}

export class JackpotAwardLog extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): void;

  getUserRid(): number;
  setUserRid(value: number): void;

  getUserName(): string;
  setUserName(value: string): void;

  getRoomId(): number;
  setRoomId(value: number): void;

  getRoomName(): string;
  setRoomName(value: string): void;

  getRoomMultiLangNames(): string;
  setRoomMultiLangNames(value: string): void;

  getGameType(): number;
  setGameType(value: number): void;

  getPokerType(): number;
  setPokerType(value: number): void;

  getLimitBetType(): number;
  setLimitBetType(value: number): void;

  getBombpot(): number;
  setBombpot(value: number): void;

  getCardsType(): number;
  setCardsType(value: number): void;

  getGoldChange(): number;
  setGoldChange(value: number): void;

  getCardData(): string;
  setCardData(value: string): void;

  getCreateTime(): number;
  setCreateTime(value: number): void;

  getJackpotId(): number;
  setJackpotId(value: number): void;

  getSmallBlind(): number;
  setSmallBlind(value: number): void;

  getAnte(): number;
  setAnte(value: number): void;

  getUserAvatar(): string;
  setUserAvatar(value: string): void;

  getMarsEarth(): number;
  setMarsEarth(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): JackpotAwardLog.AsObject;
  static toObject(includeInstance: boolean, msg: JackpotAwardLog): JackpotAwardLog.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: JackpotAwardLog, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): JackpotAwardLog;
  static deserializeBinaryFromReader(message: JackpotAwardLog, reader: jspb.BinaryReader): JackpotAwardLog;
}

export namespace JackpotAwardLog {
  export type AsObject = {
    userId: number,
    userRid: number,
    userName: string,
    roomId: number,
    roomName: string,
    roomMultiLangNames: string,
    gameType: number,
    pokerType: number,
    limitBetType: number,
    bombpot: number,
    cardsType: number,
    goldChange: number,
    cardData: string,
    createTime: number,
    jackpotId: number,
    smallBlind: number,
    ante: number,
    userAvatar: string,
    marsEarth: number,
  }
}

export class UserMttRecord extends jspb.Message {
  getMatchId(): number;
  setMatchId(value: number): void;

  getStartTime(): number;
  setStartTime(value: number): void;

  getStatus(): number;
  setStatus(value: number): void;

  getUpblindInterval(): number;
  setUpblindInterval(value: number): void;

  getTotalRebuyTimes(): number;
  setTotalRebuyTimes(value: number): void;

  getApplyFeePool(): number;
  setApplyFeePool(value: number): void;

  getApplyFeeService(): number;
  setApplyFeeService(value: number): void;

  getApplyFeeHunter(): number;
  setApplyFeeHunter(value: number): void;

  getPrizeBasePool(): number;
  setPrizeBasePool(value: number): void;

  getGoldType(): number;
  setGoldType(value: number): void;

  getAntiCheatType(): number;
  setAntiCheatType(value: number): void;

  getAntiCheatVideoType(): number;
  setAntiCheatVideoType(value: number): void;

  getType(): number;
  setType(value: number): void;

  getLimitMin(): number;
  setLimitMin(value: number): void;

  getInitialScore(): number;
  setInitialScore(value: number): void;

  getTotalBuyinTimes(): number;
  setTotalBuyinTimes(value: number): void;

  getJoker(): number;
  setJoker(value: number): void;

  getJokerCount(): number;
  setJokerCount(value: number): void;

  getMjTotalHands(): number;
  setMjTotalHands(value: number): void;

  getMjBlindUpHands(): number;
  setMjBlindUpHands(value: number): void;

  getGameIcon(): string;
  setGameIcon(value: string): void;

  clearPrizesList(): void;
  getPrizesList(): Array<MTTPrize>;
  setPrizesList(value: Array<MTTPrize>): void;
  addPrizes(value?: MTTPrize, index?: number): MTTPrize;

  getIsAdmin(): boolean;
  setIsAdmin(value: boolean): void;

  getIsTop(): number;
  setIsTop(value: number): void;

  getName(): string;
  setName(value: string): void;

  getGameType(): number;
  setGameType(value: number): void;

  getPokerType(): number;
  setPokerType(value: number): void;

  getHunterOn(): number;
  setHunterOn(value: number): void;

  getParticipants(): number;
  setParticipants(value: number): void;

  getAlive(): number;
  setAlive(value: number): void;

  getApplyStartTime(): number;
  setApplyStartTime(value: number): void;

  getMaxDelayApplyBl(): number;
  setMaxDelayApplyBl(value: number): void;

  getRebuyTimes(): number;
  setRebuyTimes(value: number): void;

  getAddonBeginBl(): number;
  setAddonBeginBl(value: number): void;

  getAddonEndBl(): number;
  setAddonEndBl(value: number): void;

  getPrizeType(): number;
  setPrizeType(value: number): void;

  getPropBuyType(): number;
  setPropBuyType(value: number): void;

  getBuyinFreeTimes(): number;
  setBuyinFreeTimes(value: number): void;

  getRebuyFreeTimes(): number;
  setRebuyFreeTimes(value: number): void;

  getMultiRatioFreeTimes(): number;
  setMultiRatioFreeTimes(value: number): void;

  getAddonFreeTimes(): number;
  setAddonFreeTimes(value: number): void;

  getBuyinFreeInclSvr(): number;
  setBuyinFreeInclSvr(value: number): void;

  getRebuyFreeInclSvr(): number;
  setRebuyFreeInclSvr(value: number): void;

  getMultiRatioFreeInclSvr(): number;
  setMultiRatioFreeInclSvr(value: number): void;

  getAddonFreeInclSvr(): number;
  setAddonFreeInclSvr(value: number): void;

  getAntiCheatTimelimit(): number;
  setAntiCheatTimelimit(value: number): void;

  getVideoVerifyType(): number;
  setVideoVerifyType(value: number): void;

  getAntiCheatOrderType(): number;
  setAntiCheatOrderType(value: number): void;

  getAntiCheatOrderMicType(): number;
  setAntiCheatOrderMicType(value: number): void;

  getMttBannerUrl(): string;
  setMttBannerUrl(value: string): void;

  getForceCloseTime(): number;
  setForceCloseTime(value: number): void;

  clearRelateClubIdsList(): void;
  getRelateClubIdsList(): Array<number>;
  setRelateClubIdsList(value: Array<number>): void;
  addRelateClubIds(value: number, index?: number): number;

  clearRelateTribeClubListList(): void;
  getRelateTribeClubListList(): Array<RoomTribeClubRelate>;
  setRelateTribeClubListList(value: Array<RoomTribeClubRelate>): void;
  addRelateTribeClubList(value?: RoomTribeClubRelate, index?: number): RoomTribeClubRelate;

  getOriginType(): number;
  setOriginType(value: number): void;

  getSeriesId(): number;
  setSeriesId(value: number): void;

  getPinnedTime(): number;
  setPinnedTime(value: number): void;

  getCreateTime(): number;
  setCreateTime(value: number): void;

  getStageFatherId(): number;
  setStageFatherId(value: number): void;

  getStageName(): string;
  setStageName(value: string): void;

  getStageBlindLevel(): number;
  setStageBlindLevel(value: number): void;

  getStageRemainRate(): number;
  setStageRemainRate(value: number): void;

  getStageFinalScoreType(): number;
  setStageFinalScoreType(value: number): void;

  getInsuranceAmount(): number;
  setInsuranceAmount(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserMttRecord.AsObject;
  static toObject(includeInstance: boolean, msg: UserMttRecord): UserMttRecord.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UserMttRecord, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserMttRecord;
  static deserializeBinaryFromReader(message: UserMttRecord, reader: jspb.BinaryReader): UserMttRecord;
}

export namespace UserMttRecord {
  export type AsObject = {
    matchId: number,
    startTime: number,
    status: number,
    upblindInterval: number,
    totalRebuyTimes: number,
    applyFeePool: number,
    applyFeeService: number,
    applyFeeHunter: number,
    prizeBasePool: number,
    goldType: number,
    antiCheatType: number,
    antiCheatVideoType: number,
    type: number,
    limitMin: number,
    initialScore: number,
    totalBuyinTimes: number,
    joker: number,
    jokerCount: number,
    mjTotalHands: number,
    mjBlindUpHands: number,
    gameIcon: string,
    prizesList: Array<MTTPrize.AsObject>,
    isAdmin: boolean,
    isTop: number,
    name: string,
    gameType: number,
    pokerType: number,
    hunterOn: number,
    participants: number,
    alive: number,
    applyStartTime: number,
    maxDelayApplyBl: number,
    rebuyTimes: number,
    addonBeginBl: number,
    addonEndBl: number,
    prizeType: number,
    propBuyType: number,
    buyinFreeTimes: number,
    rebuyFreeTimes: number,
    multiRatioFreeTimes: number,
    addonFreeTimes: number,
    buyinFreeInclSvr: number,
    rebuyFreeInclSvr: number,
    multiRatioFreeInclSvr: number,
    addonFreeInclSvr: number,
    antiCheatTimelimit: number,
    videoVerifyType: number,
    antiCheatOrderType: number,
    antiCheatOrderMicType: number,
    mttBannerUrl: string,
    forceCloseTime: number,
    relateClubIdsList: Array<number>,
    relateTribeClubListList: Array<RoomTribeClubRelate.AsObject>,
    originType: number,
    seriesId: number,
    pinnedTime: number,
    createTime: number,
    stageFatherId: number,
    stageName: string,
    stageBlindLevel: number,
    stageRemainRate: number,
    stageFinalScoreType: number,
    insuranceAmount: number,
  }
}

export class MTTPrize extends jspb.Message {
  getRankMin(): number;
  setRankMin(value: number): void;

  getRankMax(): number;
  setRankMax(value: number): void;

  getAward(): number;
  setAward(value: number): void;

  clearGoodsList(): void;
  getGoodsList(): Array<PrizeGoods>;
  setGoodsList(value: Array<PrizeGoods>): void;
  addGoods(value?: PrizeGoods, index?: number): PrizeGoods;

  getAwardRatio(): number;
  setAwardRatio(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MTTPrize.AsObject;
  static toObject(includeInstance: boolean, msg: MTTPrize): MTTPrize.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MTTPrize, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MTTPrize;
  static deserializeBinaryFromReader(message: MTTPrize, reader: jspb.BinaryReader): MTTPrize;
}

export namespace MTTPrize {
  export type AsObject = {
    rankMin: number,
    rankMax: number,
    award: number,
    goodsList: Array<PrizeGoods.AsObject>,
    awardRatio: number,
  }
}

export class PrizeGoods extends jspb.Message {
  getI(): number;
  setI(value: number): void;

  getNa(): string;
  setNa(value: string): void;

  getV(): number;
  setV(value: number): void;

  getN(): number;
  setN(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PrizeGoods.AsObject;
  static toObject(includeInstance: boolean, msg: PrizeGoods): PrizeGoods.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PrizeGoods, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PrizeGoods;
  static deserializeBinaryFromReader(message: PrizeGoods, reader: jspb.BinaryReader): PrizeGoods;
}

export namespace PrizeGoods {
  export type AsObject = {
    i: number,
    na: string,
    v: number,
    n: number,
  }
}

export class UserMttRecordChange extends jspb.Message {
  getMatchId(): number;
  setMatchId(value: number): void;

  getStatus(): number;
  setStatus(value: number): void;

  getParticipants(): number;
  setParticipants(value: number): void;

  getSeriesId(): number;
  setSeriesId(value: number): void;

  getPinnedTime(): number;
  setPinnedTime(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserMttRecordChange.AsObject;
  static toObject(includeInstance: boolean, msg: UserMttRecordChange): UserMttRecordChange.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UserMttRecordChange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserMttRecordChange;
  static deserializeBinaryFromReader(message: UserMttRecordChange, reader: jspb.BinaryReader): UserMttRecordChange;
}

export namespace UserMttRecordChange {
  export type AsObject = {
    matchId: number,
    status: number,
    participants: number,
    seriesId: number,
    pinnedTime: number,
  }
}

export class UserSNGRecord extends jspb.Message {
  getSngId(): number;
  setSngId(value: number): void;

  getAntiCheatType(): number;
  setAntiCheatType(value: number): void;

  getAntiCheatVideoType(): number;
  setAntiCheatVideoType(value: number): void;

  getApplyFeePool(): number;
  setApplyFeePool(value: number): void;

  getApplyFeeService(): number;
  setApplyFeeService(value: number): void;

  getBuyStatus(): number;
  setBuyStatus(value: number): void;

  getLimitParticipants(): number;
  setLimitParticipants(value: number): void;

  getName(): string;
  setName(value: string): void;

  getBombpot(): number;
  setBombpot(value: number): void;

  getGameType(): number;
  setGameType(value: number): void;

  getLimitBetType(): number;
  setLimitBetType(value: number): void;

  getOriginType(): number;
  setOriginType(value: number): void;

  getPokerType(): number;
  setPokerType(value: number): void;

  getCurrency(): string;
  setCurrency(value: string): void;

  getBlindtableType(): number;
  setBlindtableType(value: number): void;

  getClubId(): number;
  setClubId(value: number): void;

  getGameIcon(): string;
  setGameIcon(value: string): void;

  getGoldType(): number;
  setGoldType(value: number): void;

  getInitialScore(): number;
  setInitialScore(value: number): void;

  getInvitationCode(): string;
  setInvitationCode(value: string): void;

  getPrizeType(): number;
  setPrizeType(value: number): void;

  getTribeId(): number;
  setTribeId(value: number): void;

  getType(): number;
  setType(value: number): void;

  getUpblindInterval(): number;
  setUpblindInterval(value: number): void;

  clearPrizesList(): void;
  getPrizesList(): Array<MTTPrize>;
  setPrizesList(value: Array<MTTPrize>): void;
  addPrizes(value?: MTTPrize, index?: number): MTTPrize;

  getIsAdmin(): boolean;
  setIsAdmin(value: boolean): void;

  getStatus(): number;
  setStatus(value: number): void;

  clearRelateClubIdsList(): void;
  getRelateClubIdsList(): Array<number>;
  setRelateClubIdsList(value: Array<number>): void;
  addRelateClubIds(value: number, index?: number): number;

  clearRelateTribeClubListList(): void;
  getRelateTribeClubListList(): Array<RoomTribeClubRelate>;
  setRelateTribeClubListList(value: Array<RoomTribeClubRelate>): void;
  addRelateTribeClubList(value?: RoomTribeClubRelate, index?: number): RoomTribeClubRelate;

  getSeriesId(): number;
  setSeriesId(value: number): void;

  getPinnedTime(): number;
  setPinnedTime(value: number): void;

  getCreateTime(): number;
  setCreateTime(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserSNGRecord.AsObject;
  static toObject(includeInstance: boolean, msg: UserSNGRecord): UserSNGRecord.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UserSNGRecord, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserSNGRecord;
  static deserializeBinaryFromReader(message: UserSNGRecord, reader: jspb.BinaryReader): UserSNGRecord;
}

export namespace UserSNGRecord {
  export type AsObject = {
    sngId: number,
    antiCheatType: number,
    antiCheatVideoType: number,
    applyFeePool: number,
    applyFeeService: number,
    buyStatus: number,
    limitParticipants: number,
    name: string,
    bombpot: number,
    gameType: number,
    limitBetType: number,
    originType: number,
    pokerType: number,
    currency: string,
    blindtableType: number,
    clubId: number,
    gameIcon: string,
    goldType: number,
    initialScore: number,
    invitationCode: string,
    prizeType: number,
    tribeId: number,
    type: number,
    upblindInterval: number,
    prizesList: Array<MTTPrize.AsObject>,
    isAdmin: boolean,
    status: number,
    relateClubIdsList: Array<number>,
    relateTribeClubListList: Array<RoomTribeClubRelate.AsObject>,
    seriesId: number,
    pinnedTime: number,
    createTime: number,
  }
}

export class UserSNGRecordChange extends jspb.Message {
  getSngId(): number;
  setSngId(value: number): void;

  getStatus(): number;
  setStatus(value: number): void;

  getSeriesId(): number;
  setSeriesId(value: number): void;

  getPinnedTime(): number;
  setPinnedTime(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserSNGRecordChange.AsObject;
  static toObject(includeInstance: boolean, msg: UserSNGRecordChange): UserSNGRecordChange.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UserSNGRecordChange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserSNGRecordChange;
  static deserializeBinaryFromReader(message: UserSNGRecordChange, reader: jspb.BinaryReader): UserSNGRecordChange;
}

export namespace UserSNGRecordChange {
  export type AsObject = {
    sngId: number,
    status: number,
    seriesId: number,
    pinnedTime: number,
  }
}

