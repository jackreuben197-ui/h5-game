// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/imoss

// /api/imoss/game_client/upload/audio (ImossGameClientUploadAudio)
export interface ImossGameClientUploadAudioRequest {
  fileType: number; // 0 头像;  1 图片; 2 语音文件; 3-文件; 4-视频
  check_code?: string; // 文件校验码，md5值
  [key: string]: unknown
}

export interface ImossGameClientUploadAudioResponseData {
  [key: string]: unknown
}

export interface ImossGameClientUploadAudioData {

    fileUrl?: string; // 音频地址

  [key: string]: unknown
}

// /api/imoss/game_client/upload/image (ImossGameClientUploadImage)
export interface ImossGameClientUploadImageRequest {
  fileType: number; // 0 头像;  1 图片; 2 语音文件; 3-文件; 4-视频
  check_code?: string; // 文件校验码，md5值
  [key: string]: unknown
}

export interface ImossGameClientUploadImageResponseData {
  [key: string]: unknown
}

export interface ImossGameClientUploadImageData {

    fileUrl?: string; // 文件地址

  [key: string]: unknown
}
