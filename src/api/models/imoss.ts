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
  fileSize?: number; // 文件大小，单位字节
  fileUrl?: string; // 图片地址
  fileUrlSize?: ImossGameClientUploadImageSizeData; // 图片尺寸，单位像素
  smallBigUrl?: string; // 小图地址，fileType为1时返回
  smallBigUrlSize?: ImossGameClientUploadImageSizeData; // 小图尺寸，单位像素，fileType为1时返回
  smfileUrl?: string; // 缩略图地址，fileType为1时返回
  smfileUrlSize?: ImossGameClientUploadImageSizeData; // 缩略图尺寸，单位像素，fileType为1时返回
  [key: string]: unknown
}

interface ImossGameClientUploadImageSizeData {
  width?: number; // 图片宽度，单位像素
  height?: number; // 图片高度，单位像素
}

export interface ImossGameClientUploadImageData {

    fileUrl?: string; // 文件地址

  [key: string]: unknown
}
