// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/chromedp

// /api/chromedp/qrcode/video_file (ChromedpQrCodeVideoFile)
export interface ChromedpQrCodeVideoFileRequest {

    room_id?: number; // 房间Id
    qr_code_content?: string; // 生成二维码的URL

  [key: string]: unknown
}

export interface ChromedpQrCodeVideoFileResponseData extends ChromedpQrCodeVideoFileData {
  [key: string]: unknown
}

export interface ChromedpQrCodeVideoFileData {

    video_url?: string; // 视频下载链接

  [key: string]: unknown
}

