export interface NlhFormState {
  name: string

  seat_count: number
  op_duration: number
  play_duration: number
  game_rhythm: number
  auto_close: boolean

  sb: number
  straddle: boolean
  fill_blind: number

  min_rate: number
  max_rate: number
  buyin_range: [number, number]
  control_buyin: boolean

  fee_on: boolean

  insurance: number
  squid_game: boolean
  squid_mode: number
  squid_rounds: number
  squid_open_num: number
  squid_limit: number
  squid_deposit_percent: number
  critical_hit: boolean
  critical_hit_rounds: number
  critical_hit_bb: string
  mushroom_mode: boolean
  mushroom_deposit_mode: number
  mushroom_chips: number

  jackpot: number
  jackpot_id: number

  min_vpip: number
  play_hands_limit: number
  limit_ip: boolean
  limit_gps: boolean

  anti_cheat_type: number
  anti_cheat_video_type: number
  encrypt_cards: number
}

export const defaultNlhFormState: NlhFormState = {
  name: '',

  seat_count: 2,
  op_duration: 15,
  play_duration: 1800,
  game_rhythm: 0,
  auto_close: false,

  sb: 10,
  straddle: false,
  fill_blind: 0,

  min_rate: 50,
  max_rate: 300,
  buyin_range: [50, 300],
  control_buyin: false,

  fee_on: false,

  insurance: 0,

  squid_game: false,
  squid_mode: 0,
  squid_rounds: 3,
  squid_open_num: 2,
  squid_limit: 3,
  squid_deposit_percent: 100,

  critical_hit: false,
  critical_hit_rounds: 1,
  critical_hit_bb: '',

  mushroom_mode: false,
  mushroom_deposit_mode: 0,
  mushroom_chips: 1,

  jackpot: 2,
  jackpot_id: 0,

  min_vpip: 0,
  play_hands_limit: 0,
  limit_ip: false,
  limit_gps: false,

  anti_cheat_type: 0,
  anti_cheat_video_type: 0,
  encrypt_cards: 0,
}
