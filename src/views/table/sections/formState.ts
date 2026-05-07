export interface NlhFormState {
  // ── 基础信息 ──────────────────────────────────────────────────

  /** 模板名称 → name */
  name: string

  // ── 基础设置 ──────────────────────────────────────────────────

  /**
   * 玩法类型 → game_play_type
   * 1=NLH  2=PLO  3=6+  4=Fantasy
   */
  game_play_type: number

  /**
   * PLO手牌数 → plo_game_type
   * 4 / 5 / 6；仅 game_play_type=2(PLO) 时有效
   */
  plo_game_type: number

  /** 最大座位数 → seat_count */
  seat_count: number

  /**
   * 人满开局最小人数 → autostart_min_players
   * < 2 表示不自动开桌；≥ 2 表示满足人数后自动开桌
   */
  autostart_min_players: number

  /** 操作思考时间（秒）→ op_duration */
  op_duration: number

  /** 牌局有效时长（秒）→ play_duration */
  play_duration: number

  /**
   * 游戏节奏 → deal_delay（提交时 +1：0→1=GG, 1→2=HH, 2→3=WPK）
   * 0=GG模式  1=HH模式  2=WPK模式
   */
  game_rhythm: number

  /** 空桌自动关闭 → auto_close_empty */
  auto_close: boolean

  // ── 盲注 ──────────────────────────────────────────────────────

  /**
   * 小盲注（单位：分，即面值 × 100）→ sb
   * 例：面值 1/2 → sb=100
   */
  sb: number

  /**
   * 前注（单位：分，即面值 × 100）→ ante
   * 0=不设前注；可选值由服务端按 SB 返回（/room/smallBlindAndAnte 接口）
   * 6+ 和 BombPot 玩法不使用前注
   */
  ante: number

  /**
   * 随机跳开关（UI 辅助）→ random_ante
   * 0=关闭，提交固定 ante，random_ante=""
   * 1=开启，提交 "[min×100,max×100,interval×100]"，ante 置 0
   */
  random_ante: number

  /**
   * 随机跳最小前注（面值，字符串输入）→ random_ante[0]
   * 提交：Math.floor(min_ante * 100)；校验：>= 0.1
   */
  min_ante: string

  /**
   * 随机跳最大前注（面值，字符串输入）→ random_ante[1]
   * 提交：Math.floor(max_ante * 100)；校验：> min_ante
   */
  max_ante: string

  /**
   * 随机跳间隔（面值，字符串输入）→ random_ante[2]
   * 提交：Math.floor(ante_interval * 100)；校验：0.1 ≤ ante_interval < max_ante
   */
  ante_interval: string

  /**
   * Straddle 开关 → straddle
   * true=开启 Straddle
   */
  straddle: boolean

  /**
   * Straddle 最大位置 → straddle_max
   * 0–13；straddle=true 时有效
   */
  straddle_max: number

  /**
   * 补盲模式 → post（bool 提交：1=true, 0=false）
   * 0=过盲  1=补盲
   */
  fill_blind: number

  // ── 带入 ──────────────────────────────────────────────────────

  /** 最小带入倍率（BB 倍数）→ min_rate */
  min_rate: number

  /** 最大带入倍率（BB 倍数）→ max_rate */
  max_rate: number

  /**
   * 带入滑杆范围（UI 辅助，同步写入 min_rate / max_rate）
   * [minBb, maxBb]
   */
  buyin_range: [number, number]

  /**
   * 带入审核 → limit_bring_in
   * true=开启（玩家带入须桌主审批）
   */
  control_buyin: boolean

  /**
   * 允许最低筹码（BB 倍数）→ min_player_chip_rate
   * 0=不限；5=5BB；10=10BB
   */
  min_player_chip_rate: number

  /**
   * 计分牌买入上限（BB 倍数）→ max_bringin_total_rate
   * 0=无限制；400/600/800/1000/1500
   */
  max_bringin_total_rate: number

  /**
   * 追平 Chipleader 百分比 → bringin_equal_leader
   * 0–100（%），表示可追平至 Chipleader 筹码的百分比
   */
  bringin_equal_leader: number

  /**
   * AOF 开关 → bettype_aof_on
   * 0=关闭  1=开启
   */
  bettype_aof_on: number

  /**
   * 补撤计分牌方式 → retain_type（客户端 ChipsOut）
   * 0=关闭  1=自动  2=手动
   */
  retain_type: number

  /**
   * 补撤最小保留筹码倍数（BB）→ retain_min_rate
   * retain_type ≠ 0 时有效；
   */
  retain_min_rate: number

  /**
   * 补撤最大筹码倍数（BB）→ retain_max_rate
   * retain_type = 1（自动）时有效；
   */
  retain_max_rate: number

  // ── 收费 ──────────────────────────────────────────────────────

  /**
   * 活跃度积分 → fee_on
   * true=开启（游戏行为计入俱乐部活跃度积分）
   */
  fee_on: boolean

  /**
   * 结算类型 → settlement_type
   * 0=局抽(per game)  1=把抽(per hand)
   */
  settlement_type: number

  /**
   * 服务费（千分比 0–500，对应 0%–5%）→ fee_permillage
   * 例：50‰ = 5%；步长 0.5%
   */
  fee_permillage: number

  /**
   * 收费方式 → settle_profit_type（把抽时有效）
   * 0=按比例  1=固定收费
   */
  settle_profit_type: number

  /**
   * 翻前免服务费 → preflop_free（按比例+把抽时有效）
   * 1=开启  2=关闭
   */
  preflop_free: number

  /**
   * 少于3人半价 → few_player_half_off（按比例+把抽时有效）
   * 1=开启  2=关闭
   */
  few_player_half_off: number

  /**
   * 底池小于X免服务费 → free_pots_value（按比例+把抽时有效）
   * 整数，0=不限
   */
  free_pots_value: string

  /**
   * 封顶方式 → server_capping（按比例+把抽时有效）
   * 0=BB封顶  1=按人数封顶
   */
  server_capping: number

  /**
   * 封顶大盲倍数 → max_per_hand（server_capping=0 时有效）
   * 面值 0–10，步长 0.5；提交时 ×10 得到千分比
   */
  cap_bigblind: number

  /**
   * 赢家阈值 → win_divide_value（固定收费+把抽时有效）
   * 整数输入；提交时 ×100
   */
  win_divide_value: string

  /**
   * ≥阈值时固定收费额 → above_divide_fee（固定收费+把抽时有效）
   * 整数输入；提交时 ×100
   */
  above_divide_fee: string

  /**
   * <阈值时比例收费 → below_divide_ratio（固定收费+把抽时有效）
   * 整数输入（‰×0.1）；提交时 ×10
   */
  below_divide_ratio: string

  // ── 玩法 ──────────────────────────────────────────────────────

  /**
   * 保险类型 → insurance(bool) + insurance_mode(int) 合并
   * 0=关闭  1=经典保险  2=低水位保险  3=EV保险  4=经典新版
   */
  insurance: number

  /** 鱿鱼游戏开关（UI 辅助，控制 sub_configs 是否携带鱿鱼配置） */
  squid: number

  /**
   * 鱿鱼模式 → squid_mode
   * 0=单鱿鱼（经典）  1=多鱿鱼（血战）
   */
  squid_mode: number

  /**
   * 鱿鱼价值 → squid_base
   */
  squid_base: number

  /**
   * 鱿鱼开启人数 → playing_player_count_limit
   * 达到该人数后才开始计算鱿鱼；范围 2–9
   */
  playing_player_count_limit: number

  /**
   * 鱿鱼/暴击游戏轮次 → rounds
   * 0=无限制；达到轮次后未淘汰玩家平分鱿鱼奖励
   */
  rounds: number

  /**
   * 鱿鱼个数 → squid_extra_count
   * squid_mode=1（多鱿鱼）时有效
   */
  squid_extra_count: number

  /**
   * 鱿鱼翻倍
   */
  squid_double_mode: number

  /**
   * 独揽鱿鱼奖励 → squid_most_get
   * 1=开启（获鱿鱼最多的玩家独揽所有奖励）  0=关闭
   */
  squid_most_get: number

  /**
   * 无动作获胜无鱿鱼 → squid_bet_get
   * 1=开启（大盲/强抓翻前未操作直接获胜不得鱿鱼）  0=关闭
   */
  squid_bet_get: number

  /**
   * 头鱿鱼双倍 → squid_head
   * 1=开启（第一个获鱿鱼的玩家奖励翻倍）  0=关闭
   */
  squid_head: number

  /**
   * 尾鱿鱼双倍 → squid_tail
   * 1=开启（最后一个获鱿鱼的玩家奖励翻倍）  0=关闭
   */
  squid_tail: number

  /**
   * 获鱿鱼亮牌 → squid_force_show_card
   * 1=开启（玩家获得鱿鱼标识后强制亮牌）  0=关闭
   */
  squid_force_show_card: number

  /**
   * 暴击玩法开关（UI 辅助）
   * 提交时外层 critical_hit 写死 0；实际由 sub_configs[].critical_hit=true 标记
   */
  critical_hit: number

  /**
   * 暴击额外奖励金额（BB，字符串输入）
   * 提交前转换为分存入 sub_configs[].squid_base
   */
  critical_ante: string

  /**
   * 临时UI占位字段 蘑菇开关
   */
  mushroom: number

  /**
   * 蘑菇桌开关 → mushroom_mode（0=蘑菇关闭,1=自由；2=基础）
   * 蘑菇玩法开关及带入模式
   */
  mushroom_mode: number
  /**
   * 蘑菇底注档位 → mushroom_base_type（1微/2小/3中/4大）
   * 使用 BLIND_OPTIONS 的 value（SB 面值），提交前映射为 blind_type
   */
  mushroom_base: number

  /**
   * Jackpot 开关 → jackpot
   * 1=开启  2=关闭
   */
  jackpot: number

  /** Jackpot 模板 ID → jackpot_id */
  jackpot_id: number

  // ── 限制条件 ──────────────────────────────────────────────────

  /**
   * 最低入池率（VPIP）→ limit_hc_pool_rate
   * 0=无限制；5–60 表示要求玩家 VPIP 不低于此值（%）
   */
  limit_hc_pool_rate: number

  /**
   * 总手数限制 → limit_hc_total_hands
   * 0=无限制；达到手数后玩家无法继续带入
   */
  limit_hc_total_hands: number

  /**
   * 聊天类型 → chat_type
   * 0=无  1=玩家  2=玩家+观众
   */
  chat_type: number

  /**
   * 限制观战 → limit_watch_hand
   * 1=开启  0=关闭
   */
  limit_watch_hand: number

  /**
   * 限制观战 → limit_hand_num
   * 观战手数
   */
  limit_hand_num: number

  /**
   * 带入审核 → limit_bring_in
   * 1=开启  0=关闭
   */
  limit_bring_in: number

  /**
   * 限制加时次数 → game_delay_times
   */
  game_delay_times: number

  /** IP 限制 → limit_ip：同一 IP 只允许一名玩家同时在桌 */
  limit_ip: boolean

  /** GPS 限制 → limit_gps：地理位置过近的玩家不能同时在桌 */
  limit_gps: boolean

  /**
   * 强制亮牌 → force_show_card
   * 1=开启（每手结束时所有手牌自动亮出）  0=关闭
   */
  force_show_card: number

  /**
   * 随机入座 → random_seat
   * 1=开启（空位≥2时玩家随机入座）  0=关闭
   */
  random_seat: number

  /**
   * 仅iOS设备（私人房） → only_ios
   * 1=开启  0=关闭
   */
  only_ios: number

  /**
   * 延迟看牌 → delay_view_card
   * true=开启（未轮到操作时手牌不可见）  false=关闭
   */
  delay_view_card: boolean

  /**
   * Allin禁言 → all_in_mute
   * 1=开启（allin思考期间屏蔽其他玩家聊天）  2=关闭
   */
  all_in_mute: number

  /**
   * 安全屋公共牌可见性 → safe_view_public_cards（提交时 +1）
   * 0=可看公共牌  1=不可看公共牌；0/1 对应服务端 1/2
   */
  safe_view_public_cards: number

  // ── 安全 / 防作弊 ────────────────────────────────────────────

  /**
   * 防作弊类型 → anti_cheat_type
   * 1=关(NONE)  2=语音(AUDIO)  3=视频(VIDEO)  4=人脸识别(FACE_VERIFY)
   */
  anti_cheat_type: number

  /**
   * 视频桌模式 → anti_cheat_video_type（anti_cheat_type=3 时有效）
   * 1=全时长(FULL_TIME)  2=随机(RANDOM)  3=麦序(SEQUENCE)
   */
  anti_cheat_video_type: number

  /**
   * 全程音频开关 → anti_cheat_order_type（麦序模式时有效）
   * 1=麦序音频  2=全程音频
   */
  anti_cheat_order_type: number

  /**
   * 麦克风可关闭性 → anti_cheat_order_mic_type（全程音频时有效）
   * 1=可关闭  2=不可关闭；提交值 = dropdown.value + 1
   */
  anti_cheat_order_mic_type: number

  /**
   * 验证模式 → video_verify_type（视频桌时有效）
   * 1=视频+麦克风  2=仅开启视频；提交值 = dropdown.value + 1
   */
  video_verify_type: number

  /**
   * 视频特效桌 → video_effect_type（视频桌时有效）
   * 1=开启  2=关闭
   */
  video_effect_type: number

  /**
   * 节能模式 → power_saving（视频桌时有效）
   * 1=开启  2=关闭
   */
  power_saving: number

  /**
   * 区块链加密洗牌 → encrypt_cards
   * 0=关闭  1=开启
   */
  encrypt_cards: number

  /**
   * 安全屋 → seated_messaging
   * 0=关闭  1=开启（坐下后方可查看牌局信息）
   */
  seated_messaging: number
}

export const defaultNlhFormState: NlhFormState = {
  name: '',

  game_play_type: 0,
  plo_game_type: 4,
  seat_count: 2,
  autostart_min_players: 2,
  op_duration: 15,
  play_duration: 3600,
  game_rhythm: 0,
  auto_close: false,

  sb: 10,
  ante: 0,
  random_ante: 0,
  min_ante: '',
  max_ante: '',
  ante_interval: '',
  straddle: false,
  straddle_max: 0,
  fill_blind: 0,

  min_rate: 50,
  max_rate: 300,
  buyin_range: [50, 300],
  control_buyin: false,

  min_player_chip_rate: 0,
  max_bringin_total_rate: 0,
  bringin_equal_leader: 0,
  bettype_aof_on: 0,
  retain_type: 0,
  retain_min_rate: 0,
  retain_max_rate: 0,

  fee_on: false,
  settlement_type: 0,
  fee_permillage: 0,
  settle_profit_type: 0,
  preflop_free: 2,
  few_player_half_off: 2,
  free_pots_value: '',
  server_capping: 0,
  cap_bigblind: 0,
  win_divide_value: '',
  above_divide_fee: '',
  below_divide_ratio: '',

  insurance: 0,

  squid: 0,
  squid_mode: 0,
  squid_base: 1000,
  playing_player_count_limit: 2,
  rounds: 0,
  squid_extra_count: 0,
  squid_double_mode: 0,
  squid_most_get: 0,
  squid_bet_get: 0,
  squid_head: 0,
  squid_tail: 0,
  squid_force_show_card: 0,

  critical_hit: 0,
  critical_ante: '',

  mushroom: 0,
  mushroom_mode: 1,
  mushroom_base: 1000,

  jackpot: 2,
  jackpot_id: 0,

  limit_hc_pool_rate: 0,
  limit_hc_total_hands: 0,
  chat_type: 0,
  limit_watch_hand: 0,
  limit_hand_num: 0,
  limit_bring_in: 0,
  game_delay_times: 2,

  limit_ip: false,
  limit_gps: false,
  force_show_card: 0,
  random_seat: 0,
  only_ios: 0,
  delay_view_card: false,
  all_in_mute: 2,
  safe_view_public_cards: 0,

  anti_cheat_type: 1,
  anti_cheat_video_type: 1,
  anti_cheat_order_type: 1,
  anti_cheat_order_mic_type: 1,
  video_verify_type: 1,
  video_effect_type: 2,
  power_saving: 2,
  encrypt_cards: 0,
  seated_messaging: 0,
}
