// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/chromedp

// /api/chromedp/qrcode/video_file (ChromedpQrCodeVideoFile)
export interface ChromedpQrCodeVideoFileRequest {

    room_id?: number;
    qr_code_content?: string;

  [key: string]: unknown
}

export interface ChromedpQrCodeVideoFileResponseData {

    data?: ChromedpQrCodeVideoFileData;

  [key: string]: unknown
}

export interface ChromedpQrCodeVideoFileData {

    video_url?: string;

  [key: string]: unknown
}
