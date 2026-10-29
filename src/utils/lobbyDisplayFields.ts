/** 新字段可清空；undefined 仅表示旧协议未声明字段，不能覆盖已缓存数据。 */
export interface RoomDisplayFields {
  is_top?: number
  room_intro?: string
  room_features?: string
}
export interface MttDisplayFields {
  is_top?: number
  mtt_banner_url_c?: string
}
interface RoomDisplayGetters {
  getIsTop?: () => number
  getRoomIntro?: () => string
  getRoomFeatures?: () => string
}
interface MttDisplayGetters {
  getIsTop?: () => number
  getMttBannerUrlC?: () => string
}
export function roomDisplayPatch(record: RoomDisplayFields): RoomDisplayFields {
  return {
    ...(record.is_top !== undefined ? { is_top: record.is_top } : {}),
    ...(record.room_intro !== undefined ? { room_intro: record.room_intro } : {}),
    ...(record.room_features !== undefined ? { room_features: record.room_features } : {}),
  }
}
export function mttDisplayPatch(record: MttDisplayFields): MttDisplayFields {
  return {
    ...(record.is_top !== undefined ? { is_top: record.is_top } : {}),
    ...(record.mtt_banner_url_c !== undefined ? { mtt_banner_url_c: record.mtt_banner_url_c } : {}),
  }
}
export function readRoomDisplayFields(record: RoomDisplayGetters): RoomDisplayFields {
  return roomDisplayPatch({
    is_top: record.getIsTop?.(),
    room_intro: record.getRoomIntro?.(),
    room_features: record.getRoomFeatures?.(),
  })
}
export function readMttDisplayFields(record: MttDisplayGetters): MttDisplayFields {
  return mttDisplayPatch({
    is_top: record.getIsTop?.(),
    mtt_banner_url_c: record.getMttBannerUrlC?.(),
  })
}

/** 扩展服务的房间字段在 body 顶层，其他完整牌桌配置继续保留。 */
export function promoteRoomDisplayFields<
  T extends RoomDisplayFields & {
    room_config?: RoomDisplayFields & Record<string, unknown>
  },
>(payload: T): T {
  if (!payload.room_config) return payload
  const { is_top, room_intro, room_features, ...room_config } = payload.room_config
  const top = payload.is_top ?? is_top
  return {
    ...payload,
    room_config,
    ...roomDisplayPatch({
      is_top: top === undefined ? undefined : Number(top) === 1 ? 1 : 0,
      room_intro: payload.room_intro ?? room_intro,
      room_features: payload.room_features ?? room_features,
    }),
  }
}
