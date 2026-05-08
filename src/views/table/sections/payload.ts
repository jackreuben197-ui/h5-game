import type { NlhFormState } from './formState'
import { defaultNlhFormState } from './formState'

// sb 单位：分（面值 × 100）→ blind_type 1=微 2=小 3=中 4=大
function sbToBlindType(sb: number): number {
  if (sb <= 50) return 1 // 微：0.1–0.5
  if (sb <= 500) return 2 // 小：1–5
  if (sb <= 5000) return 3 // 中：10–50
  return 4 // 大：100–1000
}

interface SubConfig {
  ante?: number
  squid_base?: number
  squid_base_type?: number
  rounds: number
  critical_hit?: boolean
  playing_player_count_limit?: number
}

/**
 * 将表单状态转换为服务端 room_config 请求体。
 * 字段变换规则与 Unity UICreateTexasRoomOptionComponent.SetRoomConfigRequest 对齐。
 */
export function buildRoomConfigPayload(formState: NlhFormState): Record<string, unknown> {
  // ── 随机前注 ────────────────────────────────────────────────────
  let randomAnteStr: string | null = null
  let anteValue = formState.ante
  if (formState.random_ante === 1) {
    const min = Math.floor(parseFloat(formState.min_ante || '0') * 100)
    const max = Math.floor(parseFloat(formState.max_ante || '0') * 100)
    const interval = Math.floor(parseFloat(formState.ante_interval || '0') * 100)
    randomAnteStr = `[${min},${max},${interval}]`
    anteValue = 0
  }

  // ── 保险 ────────────────────────────────────────────────────────
  const insuranceOn = formState.insurance !== 0
  const insuranceMode = insuranceOn ? formState.insurance - 1 : -1
  // 经典(0)或经典新版(3)保险默认全选outs
  const selectOuts = insuranceOn && (insuranceMode === 0 || insuranceMode === 3) ? 2 : 0

  // ── 鱿鱼 / 暴击 sub_configs ────────────────────────────────────
  let subConfigs: SubConfig[] | null = null
  let outerSquidBase = 0
  let rounds = 0
  let squidMax = 0
  let squidExtraCount = 0
  let squidPlayerCount = 0

  if (formState.critical_hit) {
    const critAnte = (parseInt(formState.critical_ante || '0') || 0) * formState.sb * 2
    subConfigs = [{ ante: critAnte, rounds: 1, critical_hit: true }]
    rounds = formState.rounds
  } else if (formState.squid) {
    rounds = formState.rounds
    squidMax = 1
    squidExtraCount = formState.squid_extra_count
    if (rounds > 0) {
      subConfigs = [
        {
          squid_base: formState.squid_base,
          rounds: 1,
          playing_player_count_limit: formState.playing_player_count_limit,
        },
      ]
    } else {
      // 无限轮：sub_configs 为空，改为外层 squid_base + squid_player_count
      outerSquidBase = formState.squid_base
      squidPlayerCount = formState.playing_player_count_limit
    }
  }

  // ── 蘑菇 ────────────────────────────────────────────────────────
  const mushroomMode = formState.mushroom ? formState.mushroom_mode : 0
  const mushroomBase = formState.mushroom ? formState.mushroom_base : 0

  // ── 把抽封顶 ────────────────────────────────────────────────────
  // server_capping: 0=BB封顶→cap_type=1, 1=按人数封顶→cap_type=2
  const capType = formState.server_capping === 1 ? 2 : 1

  return {
    // ── 必填固定值 ────────────────────────────────────────────────
    tribe_id: 1,
    origin_type: 5, // 俱乐部（内）
    mode: 1,
    simple: 2,
    private_room: 0,
    blind_type: sbToBlindType(formState.sb),
    min_players: 2,
    no_user_wait_duration: 0,
    no_chip_keep_duration: 120,
    limit_auto_check_times: 2,
    limit_auto_fold_times: 2,
    second_pcs_op_duration: 10,
    second_public_limit_user: 6,
    muck: false,
    insurance_op_duration: 0,
    multiple_outs: false,
    schedule_start_time: 0,
    play_duration_type: 0,
    enter_time: Math.floor(Date.now() / 1000),
    limit_gps_distance: 50,
    squid_base_type: 0,
    critical_hit: 0, // 外层固定 0，实际值在 sub_configs
    call_time: 2,
    call_time_winline: 0,
    call_time_count: 0,
    auto_on_table_switch: 0,
    bringin_limit_type: 2,
    personal_type: 2,
    mushroom_base_type: 0,

    // ── 游戏玩法 ──────────────────────────────────────────────────
    game_play_type: formState.game_play_type,
    game_type: formState.game_play_type,
    plo_game_type: formState.plo_game_type,
    bombpot: formState.bombpot ? 1 : 0,
    limit_bet_type: formState.game_play_type === 2 ? 1 : 0, // PLO 强制底池限注

    // ── 基础设置 ──────────────────────────────────────────────────
    seat_count: formState.seat_count,
    autostart_min_players: formState.autostart_min_players,
    op_duration: formState.op_duration,
    play_duration: formState.play_duration,
    deal_delay: formState.game_rhythm + 1, // 0→1=GG, 1→2=HH, 2→3=WPK
    auto_close_empty: formState.auto_close,
    post: true, // 补盲强制开启

    // ── 盲注 ──────────────────────────────────────────────────────
    sb: formState.sb,
    ante: anteValue,
    random_ante: randomAnteStr,
    straddle: !!formState.straddle,
    straddle_max: formState.straddle_max,

    // ── 带入 ──────────────────────────────────────────────────────
    min_rate: formState.min_rate,
    max_rate: formState.max_rate,
    min_player_chip_rate: formState.min_player_chip_rate,
    max_bringin_total_rate: formState.max_bringin_total_rate,
    bringin_equal_leader: formState.bringin_equal_leader,
    bettype_aof_on: formState.bettype_aof_on,
    retain_type: formState.retain_type,
    retain_min_rate: formState.retain_min_rate,
    retain_max_rate: formState.retain_max_rate,

    // ── 收费 ──────────────────────────────────────────────────────
    settlement_type: formState.settlement_type,
    fee_permillage: formState.fee_on ? formState.fee_permillage : 0,
    settle_profit_type: formState.settle_profit_type,
    preflop_free: formState.preflop_free,
    few_player_half_off: formState.few_player_half_off,
    free_pots_value: parseInt(formState.free_pots_value || '0') || 0,
    max_per_hand: Math.floor(formState.cap_bigblind * 10),
    cap_type: capType,
    win_divide_value: Math.floor((parseFloat(formState.win_divide_value || '0') || 0) * 100),
    above_divide_fee: Math.floor((parseFloat(formState.above_divide_fee || '0') || 0) * 100),
    below_divide_ratio: Math.floor((parseFloat(formState.below_divide_ratio || '0') || 0) * 10),

    // ── 保险 ──────────────────────────────────────────────────────
    insurance: insuranceOn,
    insurance_mode: insuranceMode,
    select_outs: selectOuts,

    // ── 鱿鱼 ──────────────────────────────────────────────────────
    squid_base: outerSquidBase,
    rounds,
    sub_configs: subConfigs,
    squid_max: squidMax,
    squid_extra_count: squidExtraCount,
    squid_player_count: squidPlayerCount,
    squid_mode: formState.squid_mode,
    squid_most_get: formState.squid_most_get,
    squid_bet_get: formState.squid_bet_get,
    squid_head: formState.squid_head,
    squid_tail: formState.squid_tail,
    squid_force_show_card: formState.squid_force_show_card,

    // ── 蘑菇 ──────────────────────────────────────────────────────
    mushroom_mode: mushroomMode,
    mushroom_base: mushroomBase,

    // ── Jackpot ───────────────────────────────────────────────────
    jackpot: formState.jackpot,
    jackpot_id: formState.jackpot_id,

    // ── 限制 ──────────────────────────────────────────────────────
    limit_hc_pool_rate: formState.limit_hc_pool_rate,
    hc_pool_rate_lv: formState.limit_hc_pool_rate > 0,
    limit_hc_total_hands: formState.limit_hc_total_hands,
    hc_total_hands_lv: formState.limit_hc_total_hands > 0,
    chat_type: formState.chat_type,
    limit_hand_num: formState.limit_watch_hand ? formState.limit_hand_num : 0,
    limit_bring_in: formState.limit_bring_in,
    limit_delay_times: formState.game_delay_times,
    limit_ip: formState.limit_ip,
    limit_gps: formState.limit_gps,
    force_show_card: formState.force_show_card,
    random_seat: formState.random_seat,
    only_ios: formState.only_ios,
    delay_view_card: formState.delay_view_card,

    // ── 安全 ──────────────────────────────────────────────────────
    anti_cheat_type: formState.anti_cheat_type,
    anti_cheat_video_type: formState.anti_cheat_video_type,
    anti_cheat_order_type: formState.anti_cheat_order_type,
    anti_cheat_order_mic_type: formState.anti_cheat_order_mic_type,
    video_verify_type: formState.video_verify_type,
    video_effect_type: formState.video_effect_type,
    power_saving: formState.power_saving,
    encrypt_cards: formState.encrypt_cards,
    all_in_mute: formState.all_in_mute,
    seated_messaging: formState.seated_messaging,
    safe_view_public_cards: formState.safe_view_public_cards,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 反向转换：服务端 room_config → NlhFormState
// 对齐 Unity FillAllUIByRoomConfig / FillCriticalHitByRoomConfig / FillSquidByRoomConfig
// ─────────────────────────────────────────────────────────────────────────────

function num(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function bool(v: unknown): boolean {
  return !!v
}

function str(v: unknown): string {
  return v == null ? '' : String(v)
}

/**
 * 将服务端 room_config 数据还原为 NlhFormState。
 * 规则与 buildRoomConfigPayload 完全对称，参考 Unity FillAllUIByRoomConfig 系列方法。
 */
export function parseRoomConfigToFormState(c: Record<string, unknown>): NlhFormState {
  const base = { ...defaultNlhFormState }

  // ── 游戏玩法 ────────────────────────────────────────────────────
  const gamePlayType = num(c.game_play_type, 1)
  base.game_play_type = gamePlayType
  base.plo_game_type = num(c.plo_game_type, 4)
  base.bombpot = num(c.bombpot)

  // ── 基础设置 ────────────────────────────────────────────────────
  base.name = str(c.name)
  base.seat_count = num(c.seat_count, 2)
  base.autostart_min_players = num(c.autostart_min_players, 2)
  base.op_duration = num(c.op_duration, 15)
  base.play_duration = num(c.play_duration, 3600)
  // deal_delay 1/2/3 → game_rhythm 0/1/2（≤0 fallback 到 0）
  base.game_rhythm = Math.max(0, num(c.deal_delay, 1) - 1)
  base.auto_close = bool(c.auto_close_empty)

  // ── 盲注 ────────────────────────────────────────────────────────
  base.sb = num(c.sb, 100)
  base.straddle = bool(c.straddle)
  base.straddle_max = num(c.straddle_max)
  base.fill_blind = bool(c.post) ? 1 : 0

  // ── 随机前注 ────────────────────────────────────────────────────
  const rawRandomAnte = str(c.random_ante)
  if (rawRandomAnte) {
    // 格式 "[min,max,interval]" → 各除以 100 恢复面值
    const inner = rawRandomAnte.replace(/^\[|\]$/g, '')
    const parts = inner.split(',').map((s) => Number(s.trim()))
    base.random_ante = 1
    base.min_ante = parts[0] ? String(parts[0] / 100) : ''
    base.max_ante = parts[1] ? String(parts[1] / 100) : ''
    base.ante_interval = parts[2] ? String(parts[2] / 100) : ''
    base.ante = 0
  } else {
    base.random_ante = 0
    base.ante = num(c.ante)
  }

  // ── 带入 ────────────────────────────────────────────────────────
  base.min_rate = num(c.min_rate, 50)
  base.max_rate = num(c.max_rate, 300)
  base.buyin_range = [base.min_rate, base.max_rate]
  base.min_player_chip_rate = num(c.min_player_chip_rate)
  base.max_bringin_total_rate = num(c.max_bringin_total_rate)
  base.bringin_equal_leader = num(c.bringin_equal_leader)
  base.bettype_aof_on = num(c.bettype_aof_on)
  base.retain_type = num(c.retain_type)
  base.retain_min_rate = num(c.retain_min_rate)
  base.retain_max_rate = num(c.retain_max_rate)

  // ── 收费 ────────────────────────────────────────────────────────
  base.settlement_type = num(c.settlement_type)
  base.fee_permillage = num(c.fee_permillage)
  base.fee_on = base.fee_permillage > 0
  base.settle_profit_type = num(c.settle_profit_type)
  base.preflop_free = num(c.preflop_free, 2)
  base.few_player_half_off = num(c.few_player_half_off, 2)
  base.free_pots_value = str(c.free_pots_value === 0 ? '' : c.free_pots_value)
  base.cap_bigblind = num(c.max_per_hand) / 10
  base.server_capping = num(c.cap_type) === 2 ? 1 : 0
  // 服务端 ×100 存储 → 除以 100 恢复面值
  const wdv = num(c.win_divide_value)
  base.win_divide_value = wdv > 0 ? String(wdv / 100) : ''
  const adf = num(c.above_divide_fee)
  base.above_divide_fee = adf > 0 ? String(adf / 100) : ''
  const bdr = num(c.below_divide_ratio)
  base.below_divide_ratio = bdr > 0 ? String(bdr / 10) : ''

  // ── 保险 ────────────────────────────────────────────────────────
  // insurance(bool) + insurance_mode(int) → formState.insurance = 0 | (mode+1)
  const insuranceOn = bool(c.insurance)
  base.insurance = insuranceOn ? num(c.insurance_mode) + 1 : 0

  // ── 鱿鱼 / 暴击 sub_configs ────────────────────────────────────
  const subConfigs = Array.isArray(c.sub_configs)
    ? (c.sub_configs as Array<Record<string, unknown>>)
    : []
  const firstSub = subConfigs[0] ?? {}

  if (bool(firstSub.critical_hit)) {
    // 暴击：sub_config.ante = hitNum * sb * 2 → hitNum = ante / sb / 2
    base.critical_hit = 1
    base.critical_ante = String(num(firstSub.ante) / base.sb / 2)
    base.rounds = num(c.rounds)
    base.squid = 0
  } else {
    // 鱿鱼：squid_base > 0（sub_config 内 或 外层）
    const subSquidBase = num(firstSub.squid_base)
    const outerSquidBase = num(c.squid_base)
    const isSquidOn = subSquidBase > 0 || outerSquidBase > 0
    base.squid = isSquidOn ? 1 : 0
    base.critical_hit = 0

    if (isSquidOn) {
      base.rounds = num(c.rounds)
      if (subConfigs.length > 0) {
        // 有限轮：squid_base 在 sub_config
        base.squid_base = subSquidBase
        base.playing_player_count_limit = num(firstSub.playing_player_count_limit, 2)
      } else {
        // 无限轮：squid_base 在外层，player_count 在 squid_player_count
        base.squid_base = outerSquidBase
        base.playing_player_count_limit = num(c.squid_player_count, 2)
      }
      base.squid_mode = num(c.squid_mode)
      base.squid_extra_count = num(c.squid_extra_count)
      base.squid_most_get = num(c.squid_most_get)
      base.squid_bet_get = num(c.squid_bet_get)
      base.squid_head = num(c.squid_head)
      base.squid_tail = num(c.squid_tail)
      base.squid_force_show_card = num(c.squid_force_show_card)
    }
  }

  // ── 蘑菇 ────────────────────────────────────────────────────────
  const mushroomMode = num(c.mushroom_mode)
  base.mushroom = mushroomMode !== 0 ? 1 : 0
  base.mushroom_mode = mushroomMode !== 0 ? mushroomMode : 2 // 默认 2=基础
  base.mushroom_base = num(c.mushroom_base, 1000)

  // ── Jackpot ──────────────────────────────────────────────────────
  base.jackpot = num(c.jackpot, 2)
  base.jackpot_id = num(c.jackpot_id)

  // ── 限制 ────────────────────────────────────────────────────────
  base.limit_hc_pool_rate = num(c.limit_hc_pool_rate)
  base.limit_hc_total_hands = num(c.limit_hc_total_hands)
  base.chat_type = num(c.chat_type)
  const limitHandNum = num(c.limit_hand_num)
  base.limit_watch_hand = limitHandNum > 0 ? 1 : 0
  base.limit_hand_num = limitHandNum
  base.limit_bring_in = num(c.limit_bring_in)
  base.game_delay_times = num(c.limit_delay_times, 2)
  base.limit_ip = bool(c.limit_ip)
  base.limit_gps = bool(c.limit_gps)
  base.force_show_card = num(c.force_show_card)
  base.random_seat = num(c.random_seat)
  base.only_ios = num(c.only_ios)
  base.delay_view_card = bool(c.delay_view_card)

  // ── 安全 ────────────────────────────────────────────────────────
  base.anti_cheat_type = num(c.anti_cheat_type, 1)
  base.anti_cheat_video_type = num(c.anti_cheat_video_type, 1)
  base.anti_cheat_order_type = num(c.anti_cheat_order_type, 1)
  base.anti_cheat_order_mic_type = num(c.anti_cheat_order_mic_type, 1)
  base.video_verify_type = num(c.video_verify_type, 1)
  base.video_effect_type = num(c.video_effect_type, 2)
  base.power_saving = num(c.power_saving, 2)
  base.encrypt_cards = num(c.encrypt_cards)
  base.all_in_mute = num(c.all_in_mute, 2)
  base.seated_messaging = num(c.seated_messaging)
  base.safe_view_public_cards = num(c.safe_view_public_cards)

  return base
}
